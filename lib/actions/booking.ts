'use server';

import { db, withTransaction } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { normalizePhone, isValidSriLankanMobile } from '@/lib/utils/phone';
import { generateCheckoutHash, formatAmount, getMerchantId, isSandbox } from '@/lib/services/payhere.service';
import { notifyBooking, notifyBookingInTx, notifyCustomerCancelled } from '@/lib/services/booking-notifications';
import { sendChannels } from '@/lib/services/notify';
import { getAccess } from '@/lib/access.server';
import {
  MAX_BOOKING_HORIZON_DAYS,
  PENDING_HOLD_MS,
  hasSlotConflict,
  lockBarber,
  parseBookingDateTime,
  shopClosedReason,
  totalDurationMinutes,
  unavailableGridSlots,
} from '@/lib/services/booking-slots';
import { rateLimit } from '@/lib/rate-limit';

// Unpaid checkouts one customer may have open at once (each one alerts the salon by SMS)
const MAX_OPEN_CHECKOUTS = 3;

interface BookingPayload {
  serviceIds: string[];
  productIds?: string[];
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  shopId?: string;
  // Only needed when the order includes products (delivery); services-only bookings don't ask for it
  address?: string;
  city?: string;
  // Mobile number for SMS updates; only needed when the account has none saved yet
  phone?: string;
}

// Creates a booking as PENDING and returns PayHere checkout parameters — nothing is confirmed,
// no stock is touched, and no notifications go out until the PayHere notify webhook verifies the
// payment actually succeeded. The client's report of payment completion is never trusted for
// anything that grants value; only the signed server-to-server webhook can confirm a booking.
export async function createBooking(payload: BookingPayload) {
  try {
    const session = await verifySession();

    if (!session || !session.id) {
      return { success: false, message: 'You must be logged in to book an appointment.' };
    }

    const { serviceIds, productIds, barberId, date, time, shopId } = payload;
    const hasProducts = new Set(productIds || []).size > 0;

    // Every attempt creates a booking row and alerts the salon, so cap how fast one account can go
    const attempts = rateLimit(`book:${session.id}`, 10, 10 * 60 * 1000);
    if (!attempts.allowed) {
      return { success: false, message: 'Too many booking attempts. Please wait a few minutes and try again.' };
    }

    if (!Array.isArray(serviceIds) || serviceIds.length === 0 || serviceIds.length > 10) {
      return { success: false, message: 'No services selected.' };
    }
    if (typeof barberId !== 'string' || !barberId) {
      return { success: false, message: 'Please choose a specialist.' };
    }

    // The date/time must be a real, future moment inside the booking window
    const dateObj = parseBookingDateTime(date, time);
    if (!dateObj) {
      return { success: false, message: 'Please choose a valid date and time.' };
    }
    if (dateObj.getTime() < Date.now()) {
      return { success: false, message: 'That time has already passed. Please choose a later time.' };
    }
    if (dateObj.getTime() > Date.now() + MAX_BOOKING_HORIZON_DAYS * 24 * 60 * 60 * 1000) {
      return { success: false, message: `Bookings can be made up to ${MAX_BOOKING_HORIZON_DAYS} days ahead.` };
    }

    // Only staff who take clients can be booked (not customers, admins, or made-up ids)
    const specialist = await db.user.findFirst({
      where: { id: barberId, role: { in: ['BARBER', 'MANAGER', 'OWNER'] } },
      select: { id: true },
    });
    if (!specialist) {
      return { success: false, message: 'That specialist is not available. Please choose someone else.' };
    }

    // Fetch the services to get the correct prices (and how long the visit takes)
    const services = await db.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (services.length !== serviceIds.length) {
      return { success: false, message: 'One or more services not found.' };
    }

    // The branch must be open for the whole visit (the booking page greys these out up front)
    if (shopId) {
      const shop = await db.shop.findUnique({ where: { id: shopId }, select: { name: true, status: true, operatingHours: true } });
      const closed = shopClosedReason(shop, dateObj, totalDurationMinutes(services));
      if (closed) return { success: false, message: closed };
    }

    // Unpaid checkouts already open for this customer
    const openCheckouts = await db.booking.count({
      where: { customerId: session.id, status: 'PENDING', createdAt: { gte: new Date(Date.now() - PENDING_HOLD_MS) } },
    });
    if (openCheckouts >= MAX_OPEN_CHECKOUTS) {
      return { success: false, message: 'You already have bookings waiting for payment. Please complete or cancel them from your profile before starting another.' };
    }

    // An address is only collected when the order includes products
    if (hasProducts && (!payload.address?.trim() || !payload.city?.trim())) {
      return { success: false, message: 'Address and city are required when your order includes products.' };
    }

    // Booking SMS need a mobile number. The number on the customer's account is used and nothing is
    // asked. Only when the account has none is one requested: it is used for this booking's SMS and
    // saved on the account when it is free. A number that another account already holds is NOT an
    // error (a family member's phone, a shared salon phone, ...): it simply is not saved on the account.
    const account = await db.user.findUnique({ where: { id: session.id }, select: { phone: true } });
    let customerPhone = account?.phone || '';
    let phoneSaved = false;
    if (!customerPhone) {
      if (!payload.phone || !isValidSriLankanMobile(payload.phone)) {
        return { success: false, message: 'Please enter a valid mobile number (e.g. 077 123 4567) so we can send your booking updates.' };
      }
      const normalizedPhone = normalizePhone(payload.phone);
      customerPhone = normalizedPhone;
      try {
        await db.user.update({ where: { id: session.id }, data: { phone: normalizedPhone } });
        phoneSaved = true;
        const cookieStore = await cookies();
        cookieStore.set('user_phone', normalizedPhone, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60,
          sameSite: 'lax',
          path: '/',
        });
      } catch (err: any) {
        if (err?.code !== 'P2002') throw err; // taken by another account: fine, use it for this booking only
      }
    }

    // PayHere return/notify URLs are built from this. Fail before any booking row is created rather
    // than silently sending PayHere to localhost when the env var is missing in production.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '')
      || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
    if (!appUrl) {
      console.error('NEXT_PUBLIC_APP_URL is not set; refusing to create a PayHere checkout.');
      return { success: false, message: 'Online payment is temporarily unavailable. Please contact the salon.' };
    }

    // Products are optional — customers can add retail items to the same booking checkout
    const uniqueProductIds = Array.from(new Set(productIds || []));
    const products = uniqueProductIds.length > 0
      ? await db.product.findMany({ where: { id: { in: uniqueProductIds } } })
      : [];

    if (products.length !== uniqueProductIds.length) {
      return { success: false, message: 'One or more products not found.' };
    }

    // Fast, friendly rejection before touching the transaction — the real, race-safe stock
    // decrement happens later, only once PayHere actually confirms payment.
    const outOfStock = products.find(p => p.stock < 1);
    if (outOfStock) {
      return { success: false, message: `${outOfStock.name} is out of stock.` };
    }

    const serviceAmount = services.reduce((sum, s) => sum + s.price, 0);
    const productAmount = products.reduce((sum, p) => sum + p.price, 0);
    const totalAmount = serviceAmount + productAmount;
    const durationMinutes = totalDurationMinutes(services);

    const newBooking = await withTransaction(async (tx) => {
      // One customer at a time per barber: the lock makes "is it free?" + "book it" a single step
      await lockBarber(tx, barberId);
      if (await hasSlotConflict(tx, { barberId, start: dateObj, durationMinutes })) {
        throw new Error('SLOT_TAKEN');
      }

      const booking = await tx.booking.create({
        data: {
          date: dateObj,
          status: 'PENDING',
          source: 'WEBSITE',
          totalAmount: totalAmount,
          serviceAmount: serviceAmount,
          customerId: session.id,
          contactPhone: normalizePhone(customerPhone),
          barberId: barberId,
          shopId: shopId || null,
          services: {
            create: services.map(s => ({
              service: { connect: { id: s.id } }
            }))
          },
          products: products.length > 0 ? {
            create: products.map(p => ({
              product: { connect: { id: p.id } }
            }))
          } : undefined
        }
      });

      await tx.payment.create({
        data: {
          amount: totalAmount,
          status: 'PENDING',
          method: 'PAYHERE',
          bookingId: booking.id,
          customerId: session.id,
        }
      });

      return booking;
    });

    // The team hears about the request immediately (bell, SMS, owner email), even though payment is still pending
    void notifyBooking(newBooking.id, 'REQUESTED');

    // Build the PayHere checkout payload — the hash is computed here, server-side, only. The
    // merchant secret never reaches the client; only this final hash does.
    const nameParts = (session.name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
    const itemsDescription = [...services.map(s => s.name), ...products.map(p => p.name)].join(', ');

    let billingAddress = payload.address?.trim() || '';
    let billingCity = payload.city?.trim() || '';
    if (!hasProducts) {
      const branch = shopId ? await db.shop.findUnique({ where: { id: shopId }, select: { name: true, address: true } }) : null;
      billingAddress = branch?.address || branch?.name || 'MR POLAA Salon';
      billingCity = (branch?.address?.split(',').pop() || '').trim() || 'Sri Lanka';
    }

    const payhere = {
      sandbox: isSandbox(),
      merchant_id: getMerchantId(),
      return_url: `${appUrl}/booking?step=7&bookingId=${newBooking.id}`,
      cancel_url: `${appUrl}/booking?step=6&cancelled=1`,
      notify_url: `${appUrl}/api/v1/payments/payhere/notify`,
      order_id: newBooking.id,
      items: itemsDescription.slice(0, 250),
      amount: formatAmount(totalAmount),
      currency: 'LKR',
      hash: generateCheckoutHash(newBooking.id, totalAmount, 'LKR'),
      first_name: firstName,
      last_name: lastName,
      email: session.email || '',
      phone: `0${normalizePhone(customerPhone)}`,
      address: billingAddress,
      city: billingCity,
      country: 'Sri Lanka',
    };

    return {
      success: true,
      bookingId: newBooking.id,
      payhere,
      phoneSaved,
      message: 'Booking created — complete payment to confirm.'
    };

  } catch (error: any) {
    if (error?.message === 'SLOT_TAKEN') {
      return { success: false, message: 'Sorry, that time was just taken. Please choose another time or specialist.' };
    }
    console.error("Booking Error:", error);
    if (typeof error?.message === 'string' && error.message.startsWith('STOCK_UNAVAILABLE:')) {
      return { success: false, message: error.message.replace('STOCK_UNAVAILABLE: ', '') };
    }
    return { success: false, message: 'Server error processing your booking. Please try again.' };
  }
}

// Does the signed-in customer already have a mobile number on file? The booking page only asks for
// one when they do not; the database is the source of truth, not a browser cookie.
export async function getBookingContact() {
  const session = await verifySession();
  if (!session?.id) return { hasPhone: false, maskedPhone: '' };
  const account = await db.user.findUnique({ where: { id: session.id }, select: { phone: true } });
  const phone = account?.phone || '';
  return { hasPhone: !!phone, maskedPhone: phone ? `0${phone.slice(0, 2)} *** ${phone.slice(-4)}` : '' };
}

// Polled by the booking wizard after the PayHere popup closes, waiting for the notify webhook to
// land server-side. Session-scoped so a customer can only ever poll their own booking.
export async function getBookingPaymentStatus(bookingId: string) {
  const session = await verifySession();
  if (!session || !session.id) return { success: false, message: 'Unauthorized' };

  const booking = await db.booking.findFirst({
    where: { id: bookingId, customerId: session.id },
    include: { payment: true }
  });

  if (!booking) return { success: false, message: 'Booking not found' };

  return {
    success: true,
    bookingStatus: booking.status,
    paymentStatus: booking.payment?.status || 'PENDING',
  };
}

// The wizard's time slots this specialist cannot take on `dateStr`, for a visit of `durationMinutes`
// (the total of the chosen services). A confirmed/completed booking always blocks; an unpaid
// checkout only holds its slot for a short while so an abandoned one cannot squat forever.
// createBooking re-checks the same rule under a lock, so this list is a hint, not the guarantee.
export async function getBookedSlots(barberId: string, dateStr: string, durationMinutes?: number) {
  try {
    if (!dateStr || !barberId) return [];
    const minutes = Number.isFinite(durationMinutes) && (durationMinutes as number) > 0 && (durationMinutes as number) <= 600 ? (durationMinutes as number) : undefined;
    return await unavailableGridSlots(db, barberId, dateStr, minutes);
  } catch (error) {
    console.error("Failed to fetch booked slots", error);
    return [];
  }
}

export async function getCustomerBookings() {
  try {
    const session = await verifySession();
    if (!session || !session.id) return [];

    const bookings = await db.booking.findMany({
      where: { customerId: session.id },
      include: {
        barber: true,
        payment: true,
        services: { include: { service: true } },
        products: { include: { product: true } },
      },
      orderBy: { date: 'desc' }
    });

    return bookings.map(b => {
      // Format date
      const dateObj = new Date(b.date);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      // Format time
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      let formattedHour = hours % 12;
      formattedHour = formattedHour ? formattedHour : 12; // 0 becomes 12
      const strHour = formattedHour.toString().padStart(2, '0');
      const strMin = minutes.toString().padStart(2, '0');
      const timeStr = `${strHour}:${strMin} ${ampm}`;

      // Generate a short code from the ID
      const shortCode = `APP-${b.id.slice(0, 6).toUpperCase()}`;

      return {
        id: b.id,
        code: shortCode,
        date: dateStr,
        time: timeStr,
        status: b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase(),
        amount: `LKR ${b.totalAmount.toLocaleString()}`,
        paymentMethod: b.payment?.method || 'CARD',
        paymentStatus: b.payment?.status === 'COMPLETED' ? 'Paid' : (b.payment?.status || 'Pending'),
        barberName: b.barber?.name || 'Unknown',
        barberRole: b.barber?.role === 'OWNER' ? 'Master Stylist' : 'Senior Barber',
        serviceName: b.services?.map((bs: any) => bs.service?.name).filter(Boolean).join(', ') || 'Service',
        productNames: b.products?.map((bp: any) => bp.product?.name).filter(Boolean).join(', ') || ''
      };
    });
  } catch (error) {
    console.error("Failed to fetch customer bookings:", error);
    return [];
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const session = await verifySession();
    if (!session || !session.id) return { success: false, message: 'Unauthorized' };

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        payment: true,
        services: { include: { service: true } },
      },
    });
    if (!booking) return { success: false, message: 'Booking not found' };

    // A customer may only cancel their own booking; staff who may cancel bookings (owner, or a manager with
    // "Delete / Cancel" on Bookings) can cancel any. (Without this check any signed-in user who knew a
    // booking id could cancel someone else's.)
    const staffAccess = session.role === 'CUSTOMER' ? null : await getAccess(['/owner/bookings/manage', '/owner/calendar']);
    const canManageAll = !!staffAccess && staffAccess.access.delete;
    if (!canManageAll && booking.customerId !== session.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Completed / already-cancelled bookings are history, not cancellable
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return { success: false, message: 'This booking can no longer be cancelled.' };
    }

    const wasPaidOnline = booking.payment?.status === 'COMPLETED';

    const plan = await withTransaction(async (tx) => {
      // Guarded update: if the status changed between the check above and now, do nothing
      const updated = await tx.booking.updateMany({
        where: { id: bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'CANCELLED' }
      });
      if (updated.count === 0) throw new Error('BOOKING_NOT_CANCELLABLE');

      const payment = await tx.payment.findUnique({
        where: { bookingId }
      });

      if (payment) {
        // A COMPLETED payment was actually captured by PayHere — cancelling flags it as
        // REFUNDED here (no real gateway refund is triggered by this, it's a status label only).
        // A PENDING payment was never captured at all, so cancelling it is a FAILED/abandoned
        // attempt, not a refund — claiming REFUNDED here would be factually wrong.
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: payment.status === 'COMPLETED' ? 'REFUNDED' : 'FAILED' }
        });
      }

      // Tell the team (in-app bell rows now, inside this transaction; SMS/email after it commits)
      return notifyBookingInTx(bookingId, 'CANCELLED', tx, { actorId: session.id });
    });

    // Customer: email + SMS (never blocks or fails the cancellation; walk-in placeholder emails are skipped).
    void notifyCustomerCancelled(booking.id, { wasPaidOnline });
    if (plan) sendChannels(plan);

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'BOOKING_NOT_CANCELLABLE') {
      return { success: false, message: 'This booking can no longer be cancelled.' };
    }
    console.error("Cancel booking error:", error);
    return { success: false, message: 'Failed to cancel booking' };
  }
}

