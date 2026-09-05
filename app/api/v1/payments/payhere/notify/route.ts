import { NextRequest, NextResponse } from 'next/server';
import { db, withTransaction } from '@/lib/db';
import { verifyNotifySignature } from '@/lib/services/payhere.service';
import { sendBookingConfirmation } from '@/lib/services/email.service';
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

    // Idempotency: a legitimate replay of an old notify (or PayHere's own retry) is a safe no-op
    // once the booking has already moved out of PENDING.
    if (booking.status !== 'PENDING') {
      console.log('[PayHere Notify] No-op — booking already resolved', { orderId, currentStatus: booking.status, statusCode });
      return ok();
    }

    if (statusCode === '2') {
      const { oversoldItems } = await withTransaction(async (tx) => {
        const oversoldItems: string[] = [];
        const availableOrderItems: { productId: string; name: string; price: number }[] = [];

        for (const bp of booking.products) {
          const stockResult = await tx.product.updateMany({
            where: { id: bp.productId, stock: { gte: 1 } },
            data: { stock: { decrement: 1 } }
          });
          if (stockResult.count === 0) {
            // Payment is already captured — never fail the confirmation over a stock race.
            // Flag it for manual resolution instead of leaving a paying customer unconfirmed.
            oversoldItems.push(bp.product?.name || bp.productId);
          } else {
            availableOrderItems.push({ productId: bp.productId, name: bp.product?.name || '', price: bp.product?.price || 0 });
          }
        }

        if (availableOrderItems.length > 0) {
          await tx.order.create({
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
        }

        await tx.payment.update({
          where: { bookingId: booking.id },
          data: { status: 'COMPLETED', method: 'PAYHERE', gatewayPaymentId: paymentId || null }
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CONFIRMED' }
        });

        const staffToNotify = await tx.user.findMany({
          where: { OR: [{ role: { in: ['OWNER', 'MANAGER'] } }, { id: booking.barberId || undefined }] },
          select: { id: true, phone: true }
        });

        const serviceNames = booking.services.map(bs => bs.service?.name).filter(Boolean).join(', ');
        const customerName = booking.customer?.name || 'a customer';

        const notifications = staffToNotify.map(staff => ({
          userId: staff.id,
          title: 'New Booking Confirmed',
          desc: `A new booking for ${serviceNames} has been made by ${customerName}.`,
          read: false,
        }));
        if (oversoldItems.length > 0) {
          for (const staff of staffToNotify) {
            notifications.push({
              userId: staff.id,
              title: 'Oversold Product — Action Needed',
              desc: `Booking ${booking.id.slice(0, 8).toUpperCase()} was paid but ${oversoldItems.join(', ')} sold out before confirmation. Manual resolution (refund/store credit) needed.`,
              read: false,
            });
          }
        }
        if (notifications.length > 0) {
          await tx.notification.createMany({ data: notifications });
        }

        return { staffToNotify, oversoldItems };
      });

      // Fire-and-forget confirmation email/SMS — outside the transaction, never blocks the response.
      const hours = booking.date.getHours();
      const minutes = booking.date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHour = (hours % 12) || 12;
      const timeStr = `${formattedHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      const formattedDate = booking.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      if (booking.customer?.email) {
        sendBookingConfirmation({
          customerName: booking.customer.name || 'Valued Customer',
          customerEmail: booking.customer.email,
          bookingId: booking.id,
          date: formattedDate,
          time: timeStr,
          services: booking.services.map(bs => bs.service?.name).filter(Boolean).join(', '),
          products: booking.products.length > 0 ? booking.products.map(bp => bp.product?.name).filter(Boolean).join(', ') : undefined,
          barberName: booking.barber?.name || 'Our Artisan',
          totalAmount: booking.totalAmount,
        }).catch(err => console.error('[Email] Booking confirmation failed silently:', err));
      }

      if (booking.customer?.phone) {
        sendSms(booking.customer.phone, `Your booking on ${formattedDate} at ${timeStr} is confirmed. See you soon!`)
          .catch(err => console.error('[SMS] Booking confirmation failed silently:', err));
      }

      console.log('[PayHere Notify] Confirmed', { orderId, paymentId, oversold: oversoldItems.length > 0 ? oversoldItems : undefined });
      return ok();
    }

    if (statusCode === '-1' || statusCode === '-2' || statusCode === '-3') {
      await withTransaction(async (tx) => {
        await tx.payment.update({ where: { bookingId: booking.id }, data: { status: 'FAILED' } });
        await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
      });
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
