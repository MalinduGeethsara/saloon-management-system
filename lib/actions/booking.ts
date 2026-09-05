'use server';

import { db, withTransaction } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { generateCheckoutHash, formatAmount, getMerchantId, isSandbox } from '@/lib/services/payhere.service';

interface BookingPayload {
  serviceIds: string[];
  productIds?: string[];
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  shopId?: string;
  address: string;
  city: string;
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

    const { serviceIds, productIds, barberId, date, time, shopId, address, city } = payload;

    if (!serviceIds || serviceIds.length === 0) {
      return { success: false, message: 'No services selected.' };
    }

    if (!address?.trim() || !city?.trim()) {
      return { success: false, message: 'Address and city are required to proceed to payment.' };
    }

    // Fetch the services to get the correct prices
    const services = await db.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (services.length !== serviceIds.length) {
      return { success: false, message: 'One or more services not found.' };
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

    // Parse the date and time to a real DateTime object
    const dateObj = new Date(date + ' ' + time);

    const serviceAmount = services.reduce((sum, s) => sum + s.price, 0);
    const productAmount = products.reduce((sum, p) => sum + p.price, 0);
    const totalAmount = serviceAmount + productAmount;

    const newBooking = await withTransaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          date: dateObj,
          status: 'PENDING',
          source: 'WEBSITE',
          totalAmount: totalAmount,
          serviceAmount: serviceAmount,
          customerId: session.id,
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

    // Build the PayHere checkout payload — the hash is computed here, server-side, only. The
    // merchant secret never reaches the client; only this final hash does.
    const nameParts = (session.name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const itemsDescription = [...services.map(s => s.name), ...products.map(p => p.name)].join(', ');

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
      phone: session.phone || '',
      address,
      city,
      country: 'Sri Lanka',
    };

    return {
      success: true,
      bookingId: newBooking.id,
      payhere,
      message: 'Booking created — complete payment to confirm.'
    };

  } catch (error: any) {
    console.error("Booking Error:", error);
    if (typeof error?.message === 'string' && error.message.startsWith('STOCK_UNAVAILABLE:')) {
      return { success: false, message: error.message.replace('STOCK_UNAVAILABLE: ', '') };
    }
    return { success: false, message: 'Server error processing your booking. Please try again.' };
  }
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

export async function getBookedSlots(barberId: string, dateStr: string) {
  try {
    if (!dateStr || !barberId) return [];
    
    // Create boundaries for the entire day (local time)
    const startOfDay = new Date(dateStr + ' 00:00:00');
    const endOfDay = new Date(dateStr + ' 23:59:59');

    const bookings = await db.booking.findMany({
      where: {
        barberId: barberId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        // A confirmed/completed booking always blocks the slot. A PENDING booking (payment not
        // yet confirmed by PayHere) only blocks it briefly — otherwise an abandoned checkout
        // would squat on the slot forever with no cron job to release it.
        OR: [
          { status: { in: ['CONFIRMED', 'COMPLETED'] } },
          { status: 'PENDING', createdAt: { gte: new Date(Date.now() - 25 * 60 * 1000) } }
        ]
      },
      select: {
        date: true
      }
    });

    // Extract times like "09:00 AM" from the returned dates
    const bookedTimes = bookings.map(b => {
      const hours = b.date.getHours();
      const minutes = b.date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      let formattedHour = hours % 12;
      formattedHour = formattedHour ? formattedHour : 12; // 0 becomes 12
      
      const strHour = formattedHour.toString().padStart(2, '0');
      const strMin = minutes.toString().padStart(2, '0');
      
      return `${strHour}:${strMin} ${ampm}`;
    });

    return bookedTimes;
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

    await withTransaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });

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
    });

    return { success: true };
  } catch (error) {
    console.error("Cancel booking error:", error);
    return { success: false, message: 'Failed to cancel booking' };
  }
}

