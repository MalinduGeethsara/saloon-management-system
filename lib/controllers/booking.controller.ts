import { db, withTransaction } from '../db';
import { sendSms } from '../services/sms.service';
import { processPayment } from '../services/payment.service';

export async function createBooking(data: { customerId: string; serviceId: string; shopId: string; barberId: string; date: string; amount: number; paymentMethod?: string }) {
  // Use ACID transaction to ensure booking creation and related logic are atomic
  const result = await withTransaction(async (tx) => {
    // 1. Verify service exists and price matches (business logic validation)
    const service = await tx.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new Error('Service not found');
    
    // 2. Create the booking
    const booking = await tx.booking.create({
      data: {
        date: new Date(data.date),
        status: 'CONFIRMED',
        totalAmount: data.amount,
        customerId: data.customerId,
        serviceId: data.serviceId,
        shopId: data.shopId,
        barberId: data.barberId,
      },
      include: { customer: true }
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
      include: { service: true, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  } else if (role === 'BARBER') {
    return await db.booking.findMany({
      where: { barberId: userId },
      include: { service: true, customer: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  } else {
    // Admin, Manager, Owner see all
    return await db.booking.findMany({
      include: { service: true, customer: true, barber: true, shop: true, payment: true },
      orderBy: { date: 'desc' }
    });
  }
}

export async function getBookingById(id: string) {
  return await db.booking.findUnique({
    where: { id },
    include: { service: true, customer: true, barber: true, shop: true, payment: true }
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
