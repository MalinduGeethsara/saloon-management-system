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

    // 4. Create Notifications (owners + managers get alerted on every booking, not just owners)
    const staffToAlert = await tx.user.findMany({ where: { role: { in: ['OWNER', 'MANAGER'] } } });
    const notificationData = [];

    if (data.barberId && booking.barber) {
      notificationData.push({
        title: 'New Appointment',
        desc: `New booking with ${booking.customer.name} assigned to you.`,
        userId: data.barberId
      });
    }

    for (const staffMember of staffToAlert) {
      if (staffMember.id !== data.barberId) {
        const barberName = booking.barber ? booking.barber.name : 'a specialist';
        notificationData.push({
          title: 'New Appointment',
          desc: `Booking created for ${booking.customer.name} with ${barberName}.`,
          userId: staffMember.id
        });
      }
    }

    if (notificationData.length > 0) {
      await tx.notification.createMany({ data: notificationData });
    }

    return { booking, payment, staffToAlert };
  });

  // Post-transaction Integrations (Outside ACID tx so failure here doesn't rollback booking)
  if (data.paymentMethod) {
    await processPayment(data.amount, data.paymentMethod, 'dummy_token');
  }

  const bookingTimeStr = result.booking.date.toLocaleString();

  if (result.booking.customer.phone) {
    await sendSms(result.booking.customer.phone, `Your booking for ${bookingTimeStr} is confirmed.`);
  }

  // Alert owners/managers and the assigned barber by SMS too — the in-app notification bell
  // above only reaches someone with the dashboard open.
  const smsRecipients = [...result.staffToAlert];
  if (result.booking.barber && !smsRecipients.some(s => s.id === result.booking.barber!.id)) {
    smsRecipients.push(result.booking.barber);
  }

  for (const staffMember of smsRecipients) {
    if (staffMember.phone) {
      await sendSms(staffMember.phone, `New booking: ${result.booking.customer.name} at ${bookingTimeStr}.`);
    }
  }

  return result.booking;
}

export async function getBookingsForUser(userId: string, role: string) {
  if (role === 'CUSTOMER') {
    return await db.booking.findMany({
      where: { customerId: userId },
      include: { services: { include: { service: true } }, products: { include: { product: true } }, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  } else if (role === 'BARBER') {
    return await db.booking.findMany({
      where: { barberId: userId },
      include: { services: { include: { service: true } }, products: { include: { product: true } }, customer: true, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  } else {
    // Admin, Manager, Owner see all
    return await db.booking.findMany({
      include: { services: { include: { service: true } }, products: { include: { product: true } }, customer: true, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  }
}

export async function getBookingById(id: string) {
  return await db.booking.findUnique({
    where: { id },
    include: { services: { include: { service: true } }, products: { include: { product: true } }, customer: true, barber: true, shop: true, payment: true }
  });
}

// Shared by completePayment() and updateBookingStatus(..., 'COMPLETED') so neither path can
// skip commission creation. Idempotent — re-completing an already-COMPLETED booking is a no-op.
async function finalizeBookingCompletion(tx: any, bookingId: string, paymentMethod: string) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: { barber: true, payment: true }
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

export async function updateBookingStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') {
  if (status === 'COMPLETED') {
    return await withTransaction((tx) => finalizeBookingCompletion(tx, id, 'CASH'));
  }
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
  return await withTransaction((tx) => finalizeBookingCompletion(tx, bookingId, paymentMethod));
}
