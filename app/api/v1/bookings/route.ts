import { NextResponse } from 'next/server';
import { createBooking, getBookingsForUser, getBookingById } from '@/lib/controllers/booking.controller';
import { verifySession } from '@/lib/session';
import { serverError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const bookings = await getBookingsForUser(session.id, session.role);
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: any) {
    return serverError('Error fetching bookings', error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    // Staff-only: this creates a CONFIRMED booking immediately and trusts a caller-supplied
    // `amount` (for manual/walk-in bookings). Opening it to any logged-in user would let a
    // customer hit the API directly to create a confirmed booking at a price of their choosing,
    // bypassing the real PayHere checkout flow entirely (see lib/actions/booking.ts for that path).
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Validate body
    if ((!body.serviceIds && !body.serviceId) || !body.date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    let customerId = body.customerId;

    // For manual bookings where a client name is entered but no existing customer is selected
    if (!customerId && body.clientName) {
      const { db } = await import('@/lib/db');
      const bcrypt = await import('bcryptjs');
      const dummyEmail = `walkin_${Date.now()}@salon.com`;
      const dummyPassword = await bcrypt.hash('walkin123', 10);
      
      const newCustomer = await db.user.create({
        data: {
          name: body.clientName,
          email: dummyEmail,
          password: dummyPassword,
          role: 'CUSTOMER'
        }
      });
      customerId = newCustomer.id;
    } else if (!customerId) {
      customerId = session.id;
    }

    // Handle backward compatibility: if serviceId is passed instead of array
    const serviceIds = body.serviceIds || (body.serviceId ? [body.serviceId] : []);

    // Fetch service to get the proper amount if amount is 0 or missing
    let finalAmount = body.amount;
    if (!finalAmount && serviceIds.length > 0) {
      const { db } = await import('@/lib/db');
      const services = await db.service.findMany({ where: { id: { in: serviceIds } } });
      finalAmount = services.reduce((sum: number, s: any) => sum + s.price, 0);
    }

    // Validation against Shop Operating Hours
    if (body.shopId && body.date) {
      const { db } = await import('@/lib/db');
      const shop = await db.shop.findUnique({ where: { id: body.shopId } });
      if (shop) {
        if (shop.status === 'Closed' || shop.status === 'Renovating') {
          return NextResponse.json({ message: `This location is currently ${shop.status}` }, { status: 400 });
        }
        
        const bookingDate = new Date(body.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[bookingDate.getDay()];
        
        if (shop.operatingHours) {
          const schedule = (shop.operatingHours as any)[dayName];
          if (schedule) {
            if (schedule.isClosed) {
              return NextResponse.json({ message: `This location is closed on ${dayName}s` }, { status: 400 });
            }

            const bTimeStr = bookingDate.toTimeString().substring(0, 5); // "HH:mm"
            if (bTimeStr < schedule.open || bTimeStr > schedule.close) {
              return NextResponse.json({ message: `Booking time on ${dayName} must be between ${schedule.open} and ${schedule.close}` }, { status: 400 });
            }
          }
        }
      }
    }

    const booking = await createBooking({
      customerId: session.role === 'CUSTOMER' ? session.id : customerId, 
      serviceIds: serviceIds,
      shopId: body.shopId,
      barberId: body.barberId,
      date: body.date,
      amount: finalAmount,
    });

    return NextResponse.json({ booking, message: 'Booking created successfully' }, { status: 201 });
  } catch (error: any) {
    return serverError('Error creating booking', error);
  }
}

import { updateBookingStatus, deleteBooking, completePayment } from '@/lib/controllers/booking.controller';

export async function PUT(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER', 'BARBER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    // A barber may only manage bookings assigned to them; managers/admins/owners can manage any.
    if (session.role === 'BARBER') {
      const existing = await getBookingById(body.id);
      if (!existing) {
        return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
      }
      if (existing.barberId !== session.id) {
        return NextResponse.json({ message: 'You can only manage your own bookings' }, { status: 403 });
      }
    }

    let booking;
    if (body.action === 'PAYMENT_COMPLETE') {
      booking = await completePayment(body.id, body.paymentMethod?.toUpperCase() || 'CASH');
    } else if (body.status) {
      booking = await updateBookingStatus(body.id, body.status);
    } else {
      return NextResponse.json({ message: 'Status or action is required' }, { status: 400 });
    }

    return NextResponse.json({ booking, message: 'Booking updated successfully' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error updating booking', error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    await deleteBooking(id);
    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error deleting booking', error);
  }
}
