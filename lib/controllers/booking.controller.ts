import { db, withTransaction } from '../db';
import { sendSms } from '../services/sms.service';
import { processPayment } from '../services/payment.service';

export async function createBooking(data: { customerId: string; serviceIds: string[]; shopId: string; barberId: string; date: string; amount: number; paymentMethod?: string }) {
  // Use ACID transaction to ensure booking creation and related logic are atomic
  const result = await withTransaction(async (tx) => {
    // 1. Verify services exist
    const services = await tx.service.findMany({ where: { id: { in: data.serviceIds } } });
    if (services.length === 0) throw new Error('Services not found');
    
    // 1.5. ACID Rule: Prevent Double Booking Overlaps for the same barber
    if (data.barberId) {
      const newBookingStart = new Date(data.date);
      // Sum up duration for all services, default to 30 mins if none found
      const durationMinutes = services.reduce((sum: number, s: any) => sum + (s.duration || 30), 0) || 30;
      const newBookingEnd = new Date(newBookingStart.getTime() + (durationMinutes * 60000));

      // Fetch bookings for that day to check for overlapping times
      const startOfDay = new Date(newBookingStart);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(newBookingStart);
      endOfDay.setHours(23, 59, 59, 999);

      const existingBookings = await tx.booking.findMany({
        where: {
          barberId: data.barberId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { services: { include: { service: true } } }
      });

      for (const existing of existingBookings) {
        const existingStart = new Date(existing.date);
        const existingDuration = existing.services?.reduce((sum: number, bs: any) => sum + (bs.service?.duration || 30), 0) || 30;
        const existingEnd = new Date(existingStart.getTime() + (existingDuration * 60000));

        // Overlap Condition: A starts before B ends AND A ends after B starts
        if (newBookingStart < existingEnd && newBookingEnd > existingStart) {
          throw new Error('DOUBLE_BOOKING: This time slot overlaps with an existing booking for the selected specialist.');
        }
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
      include: { customer: true, barber: true, services: { include: { service: true } } }
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

    // 4. Create Notifications
    const owners = await tx.user.findMany({ where: { role: 'OWNER' } });
    const notificationData = [];
    
    if (data.barberId && booking.barber) {
      notificationData.push({
        title: 'New Appointment',
        desc: `New booking with ${booking.customer.name} assigned to you.`,
        userId: data.barberId
      });
    }

    for (const owner of owners) {
      if (owner.id !== data.barberId) {
        const barberName = booking.barber ? booking.barber.name : 'a specialist';
        notificationData.push({
          title: 'New Appointment',
          desc: `Booking created for ${booking.customer.name} with ${barberName}.`,
          userId: owner.id
        });
      }
    }

    if (notificationData.length > 0) {
      await tx.notification.createMany({ data: notificationData });
    }

    return { booking, payment };
  });

  // Post-transaction Integrations (Outside ACID tx so failure here doesn't rollback booking)
  if (data.paymentMethod) {
    await processPayment(data.amount, data.paymentMethod, 'dummy_token');
  }

  if (result.booking.customer.phone) {
    await sendSms(result.booking.customer.phone, `Your booking for ${result.booking.date.toLocaleString()} is confirmed.`);
  }

  return result.booking;
}

export async function getBookingsForUser(userId: string, role: string) {
  if (role === 'CUSTOMER') {
    return await db.booking.findMany({
      where: { customerId: userId },
      include: { services: { include: { service: true } }, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  } else if (role === 'BARBER') {
    return await db.booking.findMany({
      where: { barberId: userId },
      include: { services: { include: { service: true } }, customer: true, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  } else {
    // Admin, Manager, Owner see all
    return await db.booking.findMany({
      include: { services: { include: { service: true } }, customer: true, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  }
}

export async function getBookingById(id: string) {
  return await db.booking.findUnique({
    where: { id },
    include: { services: { include: { service: true } }, customer: true, barber: true, shop: true, payment: true }
  });
}

export async function updateBookingStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') {
  return await db.booking.update({
    where: { id },
    data: { status }
  });
}

export async function deleteBooking(id: string) {
  // Use transaction to delete related payment first (ACID)
  return await withTransaction(async (tx) => {
    await tx.payment.deleteMany({ where: { bookingId: id } });
    return await tx.booking.delete({ where: { id } });
  });
}

export async function completePayment(bookingId: string, paymentMethod: string = 'CARD') {
  return await withTransaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' }
    });

    await tx.payment.updateMany({
      where: { bookingId },
      data: { status: 'COMPLETED', method: paymentMethod as any }
    });

    return booking;
  });
}
