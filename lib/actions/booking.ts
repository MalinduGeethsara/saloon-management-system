'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { sendBookingConfirmation } from '@/lib/services/email.service';
import { sendSms } from '@/lib/services/sms.service';

interface BookingPayload {
  serviceIds: string[];
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  paymentMethod: string;
  shopId?: string;
}

export async function createBooking(payload: BookingPayload) {
  try {
    const session = await verifySession();
    
    if (!session || !session.id) {
      return { success: false, message: 'You must be logged in to book an appointment.' };
    }

    const { serviceIds, barberId, date, time, paymentMethod, shopId } = payload;

    if (!serviceIds || serviceIds.length === 0) {
      return { success: false, message: 'No services selected.' };
    }

    // Fetch the services to get the correct prices
    const services = await db.service.findMany({
      where: { id: { in: serviceIds } }
    });

    if (services.length !== serviceIds.length) {
      return { success: false, message: 'One or more services not found.' };
    }

    // Parse the date and time to a real DateTime object
    const dateObj = new Date(date + ' ' + time);

    // Create the booking and payment using Prisma transaction
    const bookingResult = await db.$transaction(async (tx) => {
      
      const totalAmount = services.reduce((sum, s) => sum + s.price, 0);

      const newBooking = await tx.booking.create({
        data: {
          date: dateObj,
          status: 'CONFIRMED',
          source: 'WEBSITE',
          totalAmount: totalAmount,
          customerId: session.id,
          barberId: barberId,
          shopId: shopId || null,
          services: {
            create: services.map(s => ({
              service: { connect: { id: s.id } }
            }))
          }
        }
      });

      await tx.payment.create({
        data: {
          amount: totalAmount,
          status: 'COMPLETED',
          method: paymentMethod || 'CARD',
          bookingId: newBooking.id,
          customerId: session.id,
        }
      });

      // Find staff members to notify
      const staffToNotify = await tx.user.findMany({
        where: {
          OR: [
            { role: { in: ['OWNER', 'MANAGER'] } },
            { id: barberId }
          ]
        },
        select: { id: true, phone: true }
      });

      const serviceNames = services.map(s => s.name).join(', ');

      // Create notifications for all these staff members
      const notifications = staffToNotify.map(staff => ({
        userId: staff.id,
        title: 'New Booking Confirmed',
        desc: `A new booking for ${serviceNames} has been made by ${session.name || 'a customer'} on ${date} at ${time}.`,
        read: false,
      }));

      if (notifications.length > 0) {
        await tx.notification.createMany({
          data: notifications
        });
      }

      return { newBooking, staffToNotify };
    });

    const { newBooking: createdBooking, staffToNotify } = bookingResult;
    const barber = await db.user.findUnique({ where: { id: barberId }, select: { name: true } });

    // Send booking confirmation email (fire-and-forget — don't block the response)
    if (session.email) {
      const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      sendBookingConfirmation({
        customerName: session.name || 'Valued Customer',
        customerEmail: session.email,
        bookingId: createdBooking.id,
        date: formattedDate,
        time,
        services: services.map(s => s.name).join(', '),
        barberName: barber?.name || 'Our Artisan',
        totalAmount: createdBooking.totalAmount,
      }).catch(err => console.error('[Email] Booking confirmation failed silently:', err));
    }

    // SMS confirmation to the customer (fire-and-forget — don't block the response)
    if (session.phone) {
      sendSms(session.phone, `Your booking on ${date} at ${time} is confirmed. See you soon!`)
        .catch(err => console.error('[SMS] Booking confirmation failed silently:', err));
    }

    // Alert owners/managers and the assigned barber by SMS — the in-app notification bell
    // above only reaches someone with the dashboard open.
    for (const staffMember of staffToNotify) {
      if (staffMember.phone) {
        sendSms(staffMember.phone, `New booking: ${session.name || 'a customer'} on ${date} at ${time}.`)
          .catch(err => console.error('[SMS] Staff booking alert failed silently:', err));
      }
    }

    return {
      success: true,
      bookingId: createdBooking.id,
      message: 'Booking completed successfully.'
    };

  } catch (error: any) {
    console.error("Booking Error:", error);
    return { success: false, message: 'Server error processing your booking. Please try again.' };
  }
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
        status: { not: 'CANCELLED' },
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
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
        serviceName: b.services?.map((bs: any) => bs.service?.name).filter(Boolean).join(', ') || 'Service'
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

    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
      
      const payment = await tx.payment.findUnique({
        where: { bookingId }
      });
      
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' }
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Cancel booking error:", error);
    return { success: false, message: 'Failed to cancel booking' };
  }
}

