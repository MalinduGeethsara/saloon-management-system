// Booking notices.
//
//  - Customers: email for the important moments (booking confirmed, cancelled, payment receipt)
//    plus an SMS for each of them (functions below).
//  - The team (owner, managers who may see bookings, the assigned barber): decided in ONE place, the
//    notification policy in ./notify.ts. buildBookingNotice() turns a booking into the notice it sends.
//
// Everything here is fire-and-forget from the caller's point of view: a failing SMS/email is logged
// and never breaks the booking action that triggered it.
import type { PrismaClient } from '@prisma/client';
import { db } from '../db';
import { sendSms } from './sms.service';
import { sendBookingConfirmation, sendBookingCancellation, sendPaymentReceipt } from './email.service';
import { notify, notifyInTx, type NotifyInput, type NotifyPlan } from './notify';
import { realEmail } from '../utils/real-email';
import { isValidSriLankanMobile, normalizePhone } from '../utils/phone';

export { realEmail };

export function formatBookingWhen(date: Date) {
  return {
    dateStr: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    shortDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    timeStr: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

function safe<T>(label: string, promise: Promise<T>) {
  promise.catch(err => console.error(`[Notify] ${label} failed silently:`, err));
}

type BookingClient = Pick<PrismaClient, 'booking'>;

async function loadBooking(bookingId: string, client: BookingClient = db) {
  return client.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      barber: true,
      shop: { select: { name: true } },
      payment: true,
      services: { include: { service: true } },
      products: { include: { product: true } },
    },
  });
}

const names = (rows: { name?: string | null }[]) => rows.map(r => r.name).filter(Boolean).join(', ');

// ─── Customer ─────────────────────────────────────────────────────────────────

// The salon accepted / confirmed the booking (from the dashboard, or a booking staff created).
// `paid` = the customer already paid online, so the email doubles as the payment receipt.
export async function notifyCustomerConfirmed(bookingId: string, opts: { paid: boolean }) {
  try {
    const booking = await loadBooking(bookingId);
    if (!booking?.customer) return;
    const { dateStr, timeStr } = formatBookingWhen(booking.date);
    const services = names(booking.services.map(bs => ({ name: bs.service?.name })));
    const products = names(booking.products.map(bp => ({ name: bp.product?.name })));

    const email = realEmail(booking.customer.email);
    if (email) {
      safe('confirmation email', sendBookingConfirmation({
        customerName: booking.customer.name || 'Valued Customer',
        customerEmail: email,
        bookingId: booking.id,
        date: dateStr,
        time: timeStr,
        services,
        products: products || undefined,
        barberName: booking.barber?.name || 'Our Stylist',
        totalAmount: booking.totalAmount,
        paid: opts.paid,
        ...(opts.paid && booking.payment
          ? { receiptNo: `INV-${booking.payment.id.slice(0, 6).toUpperCase()}`, paymentMethod: 'Paid online via PayHere' }
          : {}),
      }));
    }
    const smsTo = booking.contactPhone || booking.customer.phone;
    if (smsTo) {
      safe('confirmation SMS', sendSms(smsTo, `MR POLAA: Your booking on ${dateStr} at ${timeStr} is confirmed. See you soon!`));
    }
  } catch (err) {
    console.error('[Notify] customer confirmation failed silently:', err);
  }
}

// Booking cancelled or declined. `wasPaidOnline` changes the wording about the refund.
export async function notifyCustomerCancelled(bookingId: string, opts: { wasPaidOnline: boolean }) {
  try {
    const booking = await loadBooking(bookingId);
    if (!booking?.customer) return;
    const { dateStr, timeStr } = formatBookingWhen(booking.date);

    const email = realEmail(booking.customer.email);
    if (email) {
      safe('cancellation email', sendBookingCancellation({
        customerName: booking.customer.name || 'Valued Customer',
        customerEmail: email,
        bookingId: booking.id,
        date: dateStr,
        time: timeStr,
        services: names(booking.services.map(bs => ({ name: bs.service?.name }))),
        wasPaidOnline: opts.wasPaidOnline,
      }));
    }
    const smsTo = booking.contactPhone || booking.customer.phone;
    if (smsTo) {
      safe('cancellation SMS', sendSms(
        smsTo,
        `MR POLAA: Your booking on ${dateStr} at ${timeStr} was cancelled.${opts.wasPaidOnline ? ' We will contact you about your refund.' : ''}`,
      ));
    }
  } catch (err) {
    console.error('[Notify] customer cancellation failed silently:', err);
  }
}

// Payment recorded by staff at the salon (cash/card) -> receipt email + SMS.
// The cashier may type a number and/or email on the bill (a manual booking has none on file): those win over what is
// saved on the customer. Returns what happened so the screen can say it: sms sent / no number / invalid number,
// email sent / no email / invalid email.
export async function notifyCustomerPaymentReceived(
  bookingId: string,
  method: string,
  opts: { phone?: string | null; email?: string | null } = {},
): Promise<{ sms: ReceiptSmsResult; email: ReceiptEmailResult }> {
  const result: { sms: ReceiptSmsResult; email: ReceiptEmailResult } = { sms: 'no-number', email: 'no-email' };
  try {
    const booking = await loadBooking(bookingId);
    if (!booking?.customer || !booking.payment) return result;
    const { dateStr } = formatBookingWhen(booking.date);
    const receiptNo = `INV-${booking.payment.id.slice(0, 6).toUpperCase()}`;
    const methodLabel = method === 'CARD' ? 'Card' : method === 'CASH' ? 'Cash' : method;
    const typedPhone = (opts.phone || '').trim();
    const typedEmail = (opts.email || '').trim();

    // email
    let emailTo: string | null = null;
    if (typedEmail) {
      if (EMAIL_RE.test(typedEmail) && realEmail(typedEmail)) emailTo = typedEmail;
      else result.email = 'invalid-email';
    } else {
      emailTo = realEmail(booking.customer.email);
    }
    if (emailTo) {
      result.email = 'sent';
      const products = names(booking.products.map(bp => ({ name: bp.product?.name })));
      safe('receipt email', sendPaymentReceipt({
        customerName: booking.customer.name || 'Valued Customer',
        customerEmail: emailTo,
        bookingId: booking.id,
        receiptNo,
        date: dateStr,
        services: names(booking.services.map(bs => ({ name: bs.service?.name }))),
        products: products || undefined,
        amount: booking.payment.amount,
        method: methodLabel,
      }));
    }

    // SMS
    let smsTo: string | null = null;
    if (typedPhone) {
      if (isValidSriLankanMobile(typedPhone)) {
        smsTo = typedPhone;
        // remember it on the booking, so its later messages reach the same person
        if (!booking.contactPhone) {
          await db.booking.update({ where: { id: booking.id }, data: { contactPhone: normalizePhone(typedPhone) } }).catch(() => {});
        }
      } else {
        result.sms = 'invalid-number';
      }
    } else {
      smsTo = booking.contactPhone || booking.customer.phone || null;
    }
    if (smsTo) {
      result.sms = 'sent';
      const firstName = (booking.customer.name || '').trim().split(/\s+/)[0];
      safe('receipt SMS', sendSms(
        smsTo,
        `MR POLAA: Thank you${firstName ? `, ${firstName}` : ''}! Payment of LKR ${booking.payment.amount.toLocaleString()} received (${methodLabel}). Receipt ${receiptNo}. See you again!`,
      ));
    }
  } catch (err) {
    console.error('[Notify] payment receipt failed silently:', err);
  }
  return result;
}

// A manual (walk-in) bill: the number typed on the bill gets a thank-you SMS with the receipt.
// Returns what happened so the screen can tell the cashier: 'sent' | 'no-number' | 'invalid-number'.
export type ReceiptSmsResult = 'sent' | 'no-number' | 'invalid-number';
export type ReceiptEmailResult = 'sent' | 'no-email' | 'invalid-email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The same bill by email, when an address was typed on it (nothing is stored: the address is used once)
export function emailWalkInReceipt(bill: { email?: string | null; name?: string | null; amount: number; method: string; paymentId: string; items: { name: string; type?: string }[] }): ReceiptEmailResult {
  const address = (bill.email || '').trim();
  if (!address) return 'no-email';
  if (!EMAIL_RE.test(address) || !realEmail(address)) return 'invalid-email';

  const method = bill.method === 'CARD' ? 'Card' : bill.method === 'CASH' ? 'Cash' : bill.method;
  const names = (type: string) => bill.items.filter(i => (i.type || 'Service') === type).map(i => i.name).filter(Boolean).join(', ');
  safe('walk-in receipt email', sendPaymentReceipt({
    customerName: (bill.name || '').trim() || 'Valued Customer',
    customerEmail: address,
    bookingId: bill.paymentId,
    referenceLabel: 'Bill reference',
    receiptNo: `INV-${bill.paymentId.slice(0, 6).toUpperCase()}`,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    services: names('Service'),
    products: names('Product') || undefined,
    amount: bill.amount,
    method,
  }));
  return 'sent';
}

export function notifyWalkInReceipt(bill: { phone?: string | null; name?: string | null; amount: number; method: string; paymentId: string; items: { name: string }[] }): ReceiptSmsResult {
  const phone = (bill.phone || '').trim();
  if (!phone) return 'no-number';
  if (!isValidSriLankanMobile(phone)) return 'invalid-number';

  const receiptNo = `INV-${bill.paymentId.slice(0, 6).toUpperCase()}`; // the same number the Payments page shows
  const firstName = (bill.name || '').trim().split(/\s+/)[0];
  const method = bill.method === 'CARD' ? 'Card' : bill.method === 'CASH' ? 'Cash' : bill.method;
  let what = bill.items.map(i => i.name).filter(Boolean).join(', ');
  if (what.length > 40) what = `${what.slice(0, 37)}...`;

  safe('walk-in receipt SMS', sendSms(
    phone,
    `MR POLAA: Thank you${firstName ? `, ${firstName}` : ''}! LKR ${Math.round(bill.amount).toLocaleString()} received (${method}). Receipt ${receiptNo}.${what ? ` ${what}.` : ''} See you again!`,
  ));
  return 'sent';
}

// ─── The team ─────────────────────────────────────────────────────────────────

export type BookingNoticeKind = 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'PAYMENT_FAILED';
type LoadedBooking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

interface NoticeOptions {
  actorId?: string | null; // who did it: no SMS/email to them about their own action
  note?: string; // extra sentence for the email
  title?: string;
  desc?: string;
  sms?: string;
}

// The bell text, SMS and email for a booking event (who receives them is the policy's job)
export function buildBookingNotice(booking: LoadedBooking, kind: BookingNoticeKind, opts: NoticeOptions = {}): NotifyInput {
  const { dateStr, shortDate, timeStr } = formatBookingWhen(booking.date);
  const customer = booking.customer?.name || 'A customer';
  const services = names(booking.services.map(bs => ({ name: bs.service?.name })));
  const products = names(booking.products.map(bp => ({ name: bp.product?.name })));
  const phone = booking.contactPhone || booking.customer?.phone;
  const paidOnline = booking.payment?.status === 'COMPLETED' && booking.payment?.method === 'PAYHERE';
  const wasPaidOnline = booking.payment?.status === 'REFUNDED' || paidOnline;
  const paymentText = paidOnline ? 'Paid online (PayHere)' : booking.payment?.status === 'REFUNDED' ? 'Paid online - REFUND NEEDED' : booking.payment?.status === 'COMPLETED' ? 'Paid at the salon' : booking.payment?.status === 'FAILED' ? 'Not paid' : 'Awaiting payment';
  const reference = booking.id.slice(0, 8).toUpperCase();
  const barberName = booking.barber?.name || '';
  const fromWebsite = booking.source === 'WEBSITE';

  const base = {
    ref: { type: 'BOOKING' as const, id: booking.id },
    shopId: booking.shopId,
    barberId: booking.barberId,
    actorId: opts.actorId ?? null,
  };
  const rows: NonNullable<NotifyInput['email']>['rows'] = [
    ['Customer', customer],
    ['Phone', phone ? `0${phone}` : ''],
    ['Email', realEmail(booking.customer?.email) || '', 'noBarber'],
    ['Services', services],
    ['Products', products ? `${products} (pickup)` : ''],
    ['When', `${dateStr} at ${timeStr}`],
    ['Specialist', barberName],
    ['Branch', booking.shop?.name || ''],
    ['Amount', `LKR ${booking.totalAmount.toLocaleString()}`, 'noBarber'],
    ['Payment', paymentText, 'noBarber'],
    ['Reference', reference],
  ];
  const withNote = (text: string) => (opts.note ? `${text} ${opts.note}` : text);

  if (kind === 'REQUESTED') {
    return {
      ...base,
      event: 'BOOKING_REQUESTED',
      title: opts.title ?? 'New Booking Request',
      desc: opts.desc ?? `${customer} requested ${services || 'a booking'} on ${shortDate} at ${timeStr}. Awaiting payment.`,
      descFor: { barber: `${customer} requested ${services || 'a booking'} with you on ${shortDate} at ${timeStr}. Awaiting payment.` },
      sms: opts.sms ?? `MR POLAA: New booking request - ${customer}, ${services}, ${shortDate} ${timeStr} (awaiting payment).`,
      email: {
        subject: `New booking request - ${customer}, ${shortDate} ${timeStr} (awaiting payment)`,
        heading: 'A customer started a booking',
        intro: withNote('Payment has not been completed yet. You will get another email if it is paid; if not, the slot is released automatically.'),
        rows,
      },
    };
  }

  if (kind === 'CONFIRMED') {
    return {
      ...base,
      event: 'BOOKING_CONFIRMED',
      title: opts.title ?? (fromWebsite ? 'New Booking Confirmed' : 'New Appointment'),
      desc: opts.desc ?? (paidOnline || fromWebsite
        ? `A new booking for ${services || 'a service'} has been made by ${customer}.${products ? ` Includes a product order: ${products}.` : ''}`
        : `Booking created for ${customer} with ${barberName || 'a specialist'}.`),
      descFor: { barber: `New booking with ${customer} assigned to you: ${services || 'a service'}, ${shortDate} at ${timeStr}.` },
      sms: opts.sms ?? (paidOnline
        ? `MR POLAA: New booking confirmed - ${customer}, ${services}, ${shortDate} ${timeStr} (paid online).`
        : `MR POLAA: New booking - ${customer}, ${shortDate} at ${timeStr}${barberName ? ` with ${barberName}` : ''}.`),
      email: {
        subject: `${products ? 'New booking & product order' : 'New booking'}${paidOnline ? ' (paid)' : ''} - ${customer}, ${shortDate} ${timeStr}`,
        heading: products ? 'New booking with a product order' : 'New booking',
        intro: withNote(fromWebsite ? 'Booked on the website.' : 'Created by the salon team.'),
        rows,
      },
    };
  }

  if (kind === 'CANCELLED') {
    return {
      ...base,
      event: 'BOOKING_CANCELLED',
      title: opts.title ?? (wasPaidOnline ? 'Booking Cancelled — Refund Needed' : 'Booking Cancelled'),
      desc: opts.desc ?? `${customer} cancelled ${services || 'a booking'} on ${shortDate}.${wasPaidOnline ? ' It was paid online, so a refund must be arranged manually.' : ''}`,
      descFor: { barber: `${customer} cancelled ${services || 'a booking'} on ${shortDate} at ${timeStr}. It is no longer on your schedule.` },
      sms: opts.sms ?? `MR POLAA: ${customer} cancelled a booking for ${shortDate} at ${timeStr}.${wasPaidOnline ? ' Paid online - refund needed.' : ''}`,
      email: {
        subject: `Booking cancelled${wasPaidOnline ? ' - refund needed' : ''} - ${customer}, ${shortDate} ${timeStr}`,
        heading: 'A booking was cancelled',
        intro: withNote(wasPaidOnline ? 'It had been paid online, so a refund must be arranged manually in PayHere.' : 'It had not been paid online.'),
        urgent: wasPaidOnline,
        rows,
      },
    };
  }

  // PAYMENT_FAILED: the customer's payment failed or was abandoned and the slot was released
  return {
    ...base,
    event: 'PAYMENT_FAILED',
    title: opts.title ?? 'Payment Not Completed',
    desc: opts.desc ?? `${customer}'s payment for ${shortDate} at ${timeStr} failed or was cancelled. The time slot was released.`,
    sms: opts.sms ?? `MR POLAA: Payment not completed - ${customer}, booking ${shortDate} ${timeStr}. Slot released.`,
  };
}

// Load the booking and tell the team (bell rows written now)
export async function notifyBooking(bookingId: string, kind: BookingNoticeKind, opts: NoticeOptions = {}) {
  try {
    const booking = await loadBooking(bookingId);
    if (booking) await notify(buildBookingNotice(booking, kind, opts));
  } catch (err) {
    console.error('[Notify] booking notice failed silently:', err);
  }
}

// Same, with the bell rows written inside the caller's transaction. Returns the plan: call sendChannels(plan)
// once the transaction has committed.
export async function notifyBookingInTx(bookingId: string, kind: BookingNoticeKind, tx: BookingClient & Parameters<typeof notifyInTx>[1], opts: NoticeOptions = {}): Promise<NotifyPlan | null> {
  const booking = await loadBooking(bookingId, tx);
  if (!booking) return null;
  return notifyInTx(buildBookingNotice(booking, kind, opts), tx);
}

// A product sold over the counter (walk-in bill) is an order the team should know about
export function notifyCounterSale(sale: { orderId?: string | null; clientName: string; items: { name: string }[]; amount: number; method: string; invoiceNo?: string; servedBy?: string; actorId?: string | null }) {
  const products = sale.items.map(i => i.name).filter(Boolean).join(', ');
  void notify({
    event: 'ORDER_PLACED',
    title: 'New Product Sale',
    desc: `${sale.clientName || 'A walk-in customer'} bought ${products || 'products'} (LKR ${sale.amount.toLocaleString()}).`,
    ref: sale.orderId ? { type: 'ORDER', id: sale.orderId } : undefined,
    actorId: sale.actorId ?? null,
    email: {
      subject: `New product sale - ${products || 'walk-in bill'} (LKR ${sale.amount.toLocaleString()})`,
      heading: 'A product was sold at the salon',
      rows: [
        ['Customer', sale.clientName || 'Walk-in'],
        ['Items', products],
        ['Amount', `LKR ${sale.amount.toLocaleString()}`],
        ['Payment', sale.method],
        ['Served by', sale.servedBy || ''],
        ['Invoice', sale.invoiceNo || ''],
      ],
    },
  });
}
