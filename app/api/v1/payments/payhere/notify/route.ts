import { NextRequest, NextResponse } from 'next/server';
import { db, withTransaction } from '@/lib/db';
import { verifyNotifySignature } from '@/lib/services/payhere.service';
import { formatBookingWhen, notifyBooking, notifyBookingInTx, notifyCustomerCancelled, notifyCustomerConfirmed } from '@/lib/services/booking-notifications';
import { notify, notifyInTx, sendChannels, type NotifyPlan } from '@/lib/services/notify';
import { notifyIfLowStock } from '@/lib/services/stock-notifications';
import { sendSms } from '@/lib/services/sms.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ok() {
  // PayHere retries on anything but a 200 — every handled outcome (verified-and-processed,
  // rejected-signature, already-handled, malformed) responds 200 so it never retry-storms us.
  return NextResponse.json({}, { status: 200 });
}

// Server-to-server payment confirmation from PayHere. This is the ONLY place a booking is ever
// allowed to move from PENDING to CONFIRMED/CANCELLED — the client's own report of payment
// completion is never trusted for anything that grants value.
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const get = (key: string) => {
      const v = form.get(key);
      return typeof v === 'string' ? v : '';
    };

    const merchantId = get('merchant_id');
    const orderId = get('order_id');
    const paymentId = get('payment_id');
    const payhereAmount = get('payhere_amount');
    const payhereCurrency = get('payhere_currency');
    const statusCode = get('status_code');
    const md5sig = get('md5sig');

    if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig || !UUID_RE.test(orderId)) {
      console.warn('[PayHere Notify] Rejected — malformed payload', { orderId, statusCode });
      return ok();
    }

    const verified = verifyNotifySignature({ merchantId, orderId, payhereAmount, payhereCurrency, statusCode, md5sig });
    if (!verified) {
      console.warn('[PayHere Notify] Rejected — signature verification failed', { orderId, statusCode });
      return ok();
    }

    const booking = await db.booking.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        customer: true,
        barber: true,
        services: { include: { service: true } },
        products: { include: { product: true } },
      }
    });

    if (!booking) {
      console.warn('[PayHere Notify] Verified payload for unknown booking', { orderId });
      return ok();
    }

    const when = formatBookingWhen(booking.date);
    const customerName = booking.customer?.name || 'a customer';

    // Cheap early exit for plain replays. The real guarantee that two notifications arriving at the
    // same instant are only processed once is the atomic payment claim inside each transaction below.
    const alreadyPaid = booking.payment?.status === 'COMPLETED' || booking.payment?.status === 'REFUNDED';

    if (statusCode === '2') {
      if (alreadyPaid) {
        console.log('[PayHere Notify] No-op — payment already recorded', { orderId, paymentStatus: booking.payment?.status });
        return ok();
      }

      // What PayHere says it collected must be what we asked it to collect
      const expectedAmount = booking.payment?.amount ?? booking.totalAmount;
      if (payhereCurrency !== 'LKR' || !Number.isFinite(Number(payhereAmount)) || Math.abs(Number(payhereAmount) - expectedAmount) > 0.009) {
        console.error('[PayHere Notify] Amount/currency mismatch — NOT confirming', { orderId, payhereAmount, payhereCurrency, expectedAmount });
        const shortRef = booking.id.slice(0, 8).toUpperCase();
        void notify({
          event: 'PAYMENT_ALERT',
          title: 'Payment Amount Mismatch',
          desc: `PayHere reported ${payhereCurrency} ${payhereAmount} for ${customerName}'s booking on ${when.shortDate}, but ${expectedAmount} was expected. The booking was NOT confirmed. Check the PayHere dashboard.`,
          sms: `MR POLAA: ACTION NEEDED - PayHere amount mismatch for booking ${shortRef}. Not confirmed. Check PayHere.`,
          ref: { type: 'BOOKING', id: booking.id },
          shopId: booking.shopId,
          email: {
            subject: `ACTION NEEDED - payment amount mismatch (booking ${shortRef})`,
            heading: 'PayHere reported a different amount',
            intro: 'The booking was NOT confirmed. Check the payment in the PayHere dashboard.',
            urgent: true,
            rows: [['Customer', customerName], ['Booking', `${when.shortDate} at ${when.timeStr}`], ['Expected', `LKR ${expectedAmount}`], ['PayHere reported', `${payhereCurrency} ${payhereAmount}`], ['Reference', shortRef]],
          },
        });
        return ok();
      }

      const outcome = await withTransaction(async (tx) => {
        // 1. Claim the payment. Only the first notification to get here wins: a concurrent duplicate
        //    waits for this transaction, then finds nothing left to claim. FAILED is claimable too, so
        //    money that arrives after a booking was already released is recorded, not lost.
        const claimed = await tx.payment.updateMany({
          where: { bookingId: booking.id, status: { in: ['PENDING', 'FAILED'] } },
          data: { status: 'COMPLETED', method: 'PAYHERE', gatewayPaymentId: paymentId || null }
        });
        if (claimed.count === 0) return { kind: 'duplicate' as const };

        // 2. Confirm the booking, unless it moved on while the customer was paying
        const confirmed = await tx.booking.updateMany({
          where: { id: booking.id, status: { in: ['PENDING', 'CONFIRMED'] } },
          data: { status: 'CONFIRMED' }
        });

        if (confirmed.count === 0) {
          const current = await tx.booking.findUnique({ where: { id: booking.id }, select: { status: true } });
          if (current?.status !== 'CANCELLED') return { kind: 'duplicate' as const }; // e.g. already completed at the salon

          // The customer cancelled (or the slot was released) while the payment was going through:
          // the money DID arrive, so flag it for a manual refund.
          await tx.payment.updateMany({ where: { bookingId: booking.id }, data: { status: 'REFUNDED' } });
          const plan = await notifyBookingInTx(booking.id, 'CANCELLED', tx, {
            title: 'Paid Booking Was Cancelled — Refund Needed',
            desc: `${customerName} paid ${expectedAmount} for the ${when.shortDate} booking, but it had already been cancelled. Please refund via PayHere.`,
            sms: `MR POLAA: ACTION NEEDED - payment received for a CANCELLED booking (${booking.id.slice(0, 8).toUpperCase()}, ${when.shortDate}). Refund via PayHere.`,
            note: 'The payment arrived after it was cancelled.',
          });
          return { kind: 'paid-but-cancelled' as const, plans: plan ? [plan] : [] };
        }

        // 3. Products: decrement stock one unit at a time; never fail a confirmation over a stock race
        const oversoldItems: string[] = [];
        const availableOrderItems: { productId: string; name: string; price: number }[] = [];

        for (const bp of booking.products) {
          const stockResult = await tx.product.updateMany({
            where: { id: bp.productId, stock: { gte: 1 } },
            data: { stock: { decrement: 1 } }
          });
          if (stockResult.count === 0) {
            // Payment is already captured — flag it for manual resolution instead of leaving a paying customer unconfirmed.
            oversoldItems.push(bp.product?.name || bp.productId);
          } else {
            availableOrderItems.push({ productId: bp.productId, name: bp.product?.name || '', price: bp.product?.price || 0 });
          }
        }

        // The team hears about it in the same transaction as the payment claim, so it can't be lost
        const plans: NotifyPlan[] = [];
        let createdOrderId: string | null = null;
        if (availableOrderItems.length > 0) {
          const order = await tx.order.create({
            data: {
              source: 'WEBSITE',
              totalAmount: availableOrderItems.reduce((sum, i) => sum + i.price, 0),
              customerId: booking.customerId,
              bookingId: booking.id,
              items: {
                create: availableOrderItems.map(i => ({
                  productId: i.productId,
                  name: i.name,
                  price: i.price,
                  quantity: 1,
                }))
              }
            }
          });
          createdOrderId = order.id;
        }

        const confirmedPlan = await notifyBookingInTx(booking.id, 'CONFIRMED', tx);
        if (confirmedPlan) plans.push(confirmedPlan);
        if (createdOrderId) {
          plans.push(await notifyInTx({
            event: 'ORDER_PLACED',
            title: 'New Product Order',
            desc: `${customerName} ordered ${availableOrderItems.map(i => i.name).join(', ')} with a booking (paid online, pickup at the salon).`,
            ref: { type: 'ORDER', id: createdOrderId },
            shopId: booking.shopId,
          }, tx));
        }
        if (oversoldItems.length > 0) {
          const shortRef = booking.id.slice(0, 8).toUpperCase();
          plans.push(await notifyInTx({
            event: 'PAYMENT_ALERT',
            title: 'Oversold Product — Action Needed',
            desc: `Booking ${shortRef} was paid but ${oversoldItems.join(', ')} sold out before confirmation. Manual resolution (refund/store credit) needed.`,
            sms: `MR POLAA: ACTION NEEDED - booking ${shortRef} was paid but ${oversoldItems.join(', ')} sold out. Refund or replace manually.`,
            ref: { type: 'BOOKING', id: booking.id },
            shopId: booking.shopId,
            email: {
              subject: `ACTION NEEDED - paid order for a sold-out product (${oversoldItems.join(', ')})`,
              heading: 'A paid product sold out before it was confirmed',
              intro: 'The booking itself is confirmed, but the product could not be reserved. Refund or replace it manually.',
              urgent: true,
              rows: [['Customer', customerName], ['Sold out', oversoldItems.join(', ')], ['Booking', `${when.shortDate} at ${when.timeStr}`], ['Reference', shortRef]],
            },
          }, tx));
        }

        return { kind: 'confirmed' as const, oversoldItems, plans, soldProductIds: availableOrderItems.map(i => i.productId) };
      });

      if (outcome.kind === 'duplicate') {
        console.log('[PayHere Notify] No-op — already processed', { orderId });
        return ok();
      }

      if (outcome.kind === 'paid-but-cancelled') {
        outcome.plans.forEach(sendChannels);
        void notifyCustomerCancelled(booking.id, { wasPaidOnline: true });
        console.warn('[PayHere Notify] Payment arrived for a cancelled booking — flagged REFUNDED', { orderId });
        return ok();
      }

      // Fire-and-forget notices, outside the transaction, never block the response:
      // customer -> confirmation + payment receipt email and SMS; team -> SMS/email (bell rows were created above)
      const { oversoldItems, plans, soldProductIds } = outcome;
      void notifyCustomerConfirmed(booking.id, { paid: true });
      plans.forEach(sendChannels);
      for (const productId of soldProductIds) void notifyIfLowStock(productId);

      console.log('[PayHere Notify] Confirmed', { orderId, paymentId, oversold: oversoldItems.length > 0 ? oversoldItems : undefined });
      return ok();
    }

    if (statusCode === '-1' || statusCode === '-2' || statusCode === '-3') {
      // A chargeback arrives AFTER a successful payment: nothing to release, but the owner must know
      if (alreadyPaid) {
        if (statusCode === '-3') {
          const shortRef = booking.id.slice(0, 8).toUpperCase();
          void notify({
            event: 'PAYMENT_ALERT',
            title: 'Chargeback Reported',
            desc: `PayHere reported a chargeback on ${customerName}'s booking for ${when.shortDate}. Check the PayHere dashboard.`,
            sms: `MR POLAA: ACTION NEEDED - PayHere reported a chargeback on booking ${shortRef}. Check PayHere.`,
            ref: { type: 'BOOKING', id: booking.id },
            shopId: booking.shopId,
            email: {
              subject: `ACTION NEEDED - chargeback on booking ${shortRef}`,
              heading: 'PayHere reported a chargeback',
              intro: 'The customer disputed a card payment. Check the PayHere dashboard.',
              urgent: true,
              rows: [['Customer', customerName], ['Booking', `${when.shortDate} at ${when.timeStr}`], ['Reference', shortRef]],
            },
          });
        }
        console.log('[PayHere Notify] Failure code for an already-paid booking — no release', { orderId, statusCode });
        return ok();
      }

      // Release the slot only if this checkout is still waiting for payment. A booking staff already
      // accepted stays (the customer may settle at the salon); a paid one is never touched.
      const released = await withTransaction(async (tx) => {
        const failed = await tx.payment.updateMany({ where: { bookingId: booking.id, status: 'PENDING' }, data: { status: 'FAILED' } });
        if (failed.count === 0) return false;
        const cancelled = await tx.booking.updateMany({ where: { id: booking.id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
        return cancelled.count > 0;
      });

      if (!released) {
        console.log('[PayHere Notify] Failure code — nothing to release', { orderId, statusCode });
        return ok();
      }

      void notifyBooking(booking.id, 'PAYMENT_FAILED');
      const failedSmsTo = booking.contactPhone || booking.customer?.phone;
      if (failedSmsTo) {
        sendSms(failedSmsTo, `MR POLAA: Your payment for the booking on ${when.shortDate} at ${when.timeStr} was not completed and the slot was released. You can book again any time.`)
          .catch(err => console.error('[SMS] Payment-failed notice failed silently:', err));
      }
      console.log('[PayHere Notify] Payment failed/cancelled — booking released', { orderId, statusCode });
      return ok();
    }

    // status_code '0' (pending) or anything unrecognized — leave as PENDING, no-op.
    console.log('[PayHere Notify] No action taken', { orderId, statusCode });
    return ok();

  } catch (error) {
    console.error('[PayHere Notify] Unexpected error', error);
    // A genuine unexpected failure should 500 so PayHere retries a truly failed attempt.
    return NextResponse.json({}, { status: 500 });
  }
}
