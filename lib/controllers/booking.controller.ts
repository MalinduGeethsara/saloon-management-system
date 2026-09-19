import type { Prisma, BookingStatus, BookingSource } from '@prisma/client';
import { db, withTransaction } from '../db';
import { notifyBooking, notifyBookingInTx, notifyCustomerCancelled, notifyCustomerConfirmed, notifyCustomerPaymentReceived } from '../services/booking-notifications';
import { sendChannels } from '../services/notify';
import { processPayment } from '../services/payment.service';
import { hasSlotConflict, lockBarber, totalDurationMinutes } from '../services/booking-slots';
import { toPaginated, type PageParams } from '../pagination';

// The people attached to a booking, as the dashboards need them. NEVER `customer: true` / `barber: true`:
// that returns the whole User row (password hash, Google id, salary settings) straight into the JSON response.
const PERSON = { select: { id: true, name: true, email: true, phone: true, imageUrl: true, role: true, shopId: true } } as const;
// What a customer may see of the specialist who serves them
const STAFF_PUBLIC = { select: { id: true, name: true, imageUrl: true, role: true, shopId: true } } as const;

export async function createBooking(data: { customerId: string; serviceIds: string[]; shopId: string; barberId: string; date: string; amount: number; paymentMethod?: string; actorRole?: string; actorId?: string }) {
  // Use ACID transaction to ensure booking creation and related logic are atomic
  const result = await withTransaction(async (tx) => {
    // 1. Verify services exist
    const services = await tx.service.findMany({ where: { id: { in: data.serviceIds } } });
    if (services.length === 0) throw new Error('Services not found');
    
    // 1.5. ACID Rule: Prevent Double Booking Overlaps for the same barber. The barber row is locked
    // first, so two people booking the same specialist at the same moment are handled one after the
    // other (the second one then sees the first one's booking). Same rule as the customer checkout.
    if (data.barberId) {
      await lockBarber(tx, data.barberId);
      const clash = await hasSlotConflict(tx, {
        barberId: data.barberId,
        start: new Date(data.date),
        durationMinutes: totalDurationMinutes(services),
      });
      if (clash) {
        throw new Error('DOUBLE_BOOKING: This time slot overlaps with an existing booking for the selected specialist.');
      }
    }

    // 2. Create the booking
    const booking = await tx.booking.create({
      data: {
        date: new Date(data.date),
        status: 'CONFIRMED',
        totalAmount: data.amount,
        customerId: data.customerId,
        services: {
          create: data.serviceIds.map(id => ({
            service: { connect: { id } }
          }))
        },
        shopId: data.shopId,
        barberId: data.barberId,
      },
      include: { customer: PERSON, barber: PERSON, services: { include: { service: true } } }
    });

    // 3. Create initial pending payment record
    const payment = await tx.payment.create({
      data: {
        amount: data.amount,
        status: data.paymentMethod ? 'COMPLETED' : 'PENDING',
        method: data.paymentMethod || 'CASH',
        bookingId: booking.id,
        customerId: data.customerId,
      }
    });

    // 4. Tell the team (owner, managers who may see bookings, the assigned barber). The bell rows are written
    //    inside this transaction so they can never be lost; SMS/email go out after it commits.
    const plan = await notifyBookingInTx(booking.id, 'CONFIRMED', tx, { actorId: data.actorId });

    return { booking, payment, plan };
  });

  // Post-transaction Integrations (Outside ACID tx so failure here doesn't rollback booking)
  if (data.paymentMethod) {
    await processPayment(data.amount, data.paymentMethod, 'dummy_token');
  }

  // Customer: confirmation email (real addresses only, never walk-in placeholders) + SMS.
  void notifyCustomerConfirmed(result.booking.id, { paid: !!data.paymentMethod });
  // Team: SMS/email (the in-app bell rows were created inside the transaction above)
  if (result.plan) sendChannels(result.plan);

  return result.booking;
}

// The unpaginated list feeds the calendar and the barber dashboard, which want "everything around
// now", not every booking since opening day: an unbounded query grows with the business and, at
// a few thousand rows, ties up the server for seconds. Callers may narrow it with from/to.
const DEFAULT_WINDOW_DAYS = 120;
const MAX_UNPAGED_ROWS = 2000;

export async function getBookingsForUser(userId: string, role: string, range: { from?: Date | null; to?: Date | null } = {}) {
  const day = 24 * 60 * 60 * 1000;
  const from = range.from ?? new Date(Date.now() - DEFAULT_WINDOW_DAYS * day);
  const to = range.to ?? new Date(Date.now() + DEFAULT_WINDOW_DAYS * day);
  const dateWindow = { date: { gte: from, lte: to } };
  const services = { include: { service: true } };
  const products = { include: { product: true } };

  if (role === 'CUSTOMER') {
    return await db.booking.findMany({
      where: { customerId: userId, ...dateWindow },
      include: { services, products, barber: STAFF_PUBLIC, shop: true, payment: true },
      orderBy: { date: 'desc' },
      take: MAX_UNPAGED_ROWS,
    });
  } else if (role === 'BARBER') {
    return await db.booking.findMany({
      where: { barberId: userId, ...dateWindow },
      include: { services, products, customer: PERSON, barber: PERSON, shop: true, payment: true },
      orderBy: { date: 'desc' },
      take: MAX_UNPAGED_ROWS,
    });
  } else {
    // Admin, Manager, Owner see all
    return await db.booking.findMany({
      where: dateWindow,
      include: { services, products, customer: PERSON, barber: PERSON, shop: true, payment: true },
      orderBy: { date: 'desc' },
      take: MAX_UNPAGED_ROWS,
    });
  }
}

export interface BookingListFilters {
  q?: string;
  status?: string; // PENDING | CONFIRMED | COMPLETED | CANCELLED
  source?: string; // WEBSITE | ADMIN
}

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const BOOKING_SOURCES = ['WEBSITE', 'ADMIN'];

// Paginated variant of getBookingsForUser for the owner/manager booking table. The KPI `stats`
// are counted over the caller's whole scope (not the current filters/page) so the cards stay
// meaningful while the table is being searched or paged.
export async function getBookingsPage(userId: string, role: string, params: PageParams, filters: BookingListFilters = {}) {
  const scope: Prisma.BookingWhereInput =
    role === 'CUSTOMER' ? { customerId: userId } : role === 'BARBER' ? { barberId: userId } : {};

  const where: Prisma.BookingWhereInput = { ...scope };
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { id: { contains: q } },
      { customer: { name: { contains: q } } },
      { barber: { name: { contains: q } } },
    ];
  }
  if (filters.status && BOOKING_STATUSES.includes(filters.status)) where.status = filters.status as BookingStatus;
  if (filters.source && BOOKING_SOURCES.includes(filters.source)) where.source = filters.source as BookingSource;

  const include = {
    services: { include: { service: true } },
    products: { include: { product: true } },
    customer: PERSON,
    barber: PERSON,
    shop: true,
    payment: true,
  };

  const [items, total, all, pending, confirmed] = await db.$transaction([
    db.booking.findMany({ where, include, orderBy: { date: 'desc' }, skip: params.skip, take: params.take }),
    db.booking.count({ where }),
    db.booking.count({ where: scope }),
    db.booking.count({ where: { ...scope, status: 'PENDING' } }),
    db.booking.count({ where: { ...scope, status: { in: ['CONFIRMED', 'COMPLETED'] } } }),
  ]);

  return { ...toPaginated(items, total, params), stats: { total: all, pending, confirmed } };
}

export async function getBookingById(id: string) {
  return await db.booking.findUnique({
    where: { id },
    include: { services: { include: { service: true } }, products: { include: { product: true } }, customer: PERSON, barber: PERSON, shop: true, payment: true }
  });
}

// Shared by completePayment() and updateBookingStatus(..., 'COMPLETED') so neither path can
// skip commission creation. Idempotent — re-completing an already-COMPLETED booking is a no-op.
async function finalizeBookingCompletion(tx: any, bookingId: string, paymentMethod: string) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    // commissionRate is needed for the calculation below; it stays out of the returned object's exposure
    // because only explicitly selected columns are loaded (never the password hash)
    include: { barber: { select: { id: true, name: true, commissionRate: true } }, payment: true }
  });
  if (!booking) throw new Error('Booking not found');
  if (booking.status === 'COMPLETED') return booking;

  const updated = await tx.booking.update({
    where: { id: bookingId },
    data: { status: 'COMPLETED' }
  });

  // A booking made online is already paid via the gateway at booking time (Payment.status
  // already COMPLETED with its real method, e.g. CARD) — don't let this step, which only means
  // "the appointment/service is done", stomp that with whatever the owner's UI happened to send.
  if (booking.payment?.status === 'COMPLETED') {
    // nothing to do — already paid, method already correct
  } else {
    await tx.payment.updateMany({
      where: { bookingId },
      data: { status: 'COMPLETED', method: paymentMethod as any }
    });
  }

  if (booking.barberId && booking.barber) {
    const rateApplied = booking.barber.commissionRate || 0;
    // Commission is earned on services performed, not on retail products sold in the same
    // checkout — mirrors the identical fix in lib/actions/payment.ts's createManualBill.
    // serviceAmount is null on bookings created before products existed (100% services then),
    // so falling back to totalAmount is exactly correct for those.
    const commissionBase = booking.serviceAmount ?? booking.totalAmount;
    // Bucket by when the commission was actually earned (completion time), not the booking's
    // originally scheduled appointment date — a booking made today for a future appointment
    // shouldn't make its commission disappear from this month's payroll view.
    const completedAt = new Date();
    await tx.commission.create({
      data: {
        bookingId: booking.id,
        barberId: booking.barberId,
        amount: (commissionBase * rateApplied) / 100,
        rateApplied,
        billedAmount: commissionBase,
        month: completedAt.getMonth(),
        year: completedAt.getFullYear(),
      }
    });
  }

  return updated;
}

export async function updateBookingStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED', actor: { id?: string; role?: string } = {}) {
  const before = await db.booking.findUnique({ where: { id }, include: { payment: true } });
  if (!before) throw new Error('Booking not found');

  if (status === 'COMPLETED') {
    const completed = await withTransaction((tx) => finalizeBookingCompletion(tx, id, 'CASH'));
    // Receipt only when the money was taken now; online payments already got theirs at confirmation
    if (before.status !== 'COMPLETED' && before.payment?.status !== 'COMPLETED') {
      void notifyCustomerPaymentReceived(id, 'CASH');
    }
    return completed;
  }

  if (status === 'CANCELLED' && (before.status === 'PENDING' || before.status === 'CONFIRMED')) {
    const wasPaid = before.payment?.status === 'COMPLETED';
    const cancelled = await withTransaction(async (tx) => {
      const updated = await tx.booking.update({ where: { id }, data: { status } });
      // Same bookkeeping as a customer-initiated cancel: captured money is flagged REFUNDED
      // (a label only, the salon refunds manually), an unpaid attempt is simply FAILED
      if (before.payment) {
        await tx.payment.update({ where: { id: before.payment.id }, data: { status: wasPaid ? 'REFUNDED' : 'FAILED' } });
      }
      return updated;
    });
    void notifyCustomerCancelled(id, { wasPaidOnline: wasPaid });
    void notifyBooking(id, 'CANCELLED', { actorId: actor.id });
    return cancelled;
  }

  const updated = await db.booking.update({ where: { id }, data: { status } });
  if (status === 'CONFIRMED' && before.status !== 'CONFIRMED') {
    // Accepted from the dashboard -> tell the customer (paid = they already paid online)
    void notifyCustomerConfirmed(id, { paid: before.payment?.status === 'COMPLETED' });
    void notifyBooking(id, 'CONFIRMED', { actorId: actor.id });
  }
  return updated;
}

export async function deleteBooking(id: string) {
  // Use transaction to delete related payment first (ACID)
  return await withTransaction(async (tx) => {
    await tx.payment.deleteMany({ where: { bookingId: id } });
    return await tx.booking.delete({ where: { id } });
  });
}

export async function completePayment(bookingId: string, paymentMethod: string = 'CARD') {
  const before = await db.booking.findUnique({ where: { id: bookingId }, include: { payment: true } });
  const completed = await withTransaction((tx) => finalizeBookingCompletion(tx, bookingId, paymentMethod));
  if (before && before.status !== 'COMPLETED' && before.payment?.status !== 'COMPLETED') {
    void notifyCustomerPaymentReceived(bookingId, paymentMethod);
  }
  return completed;
}
