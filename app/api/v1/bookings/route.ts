import { NextResponse } from 'next/server';
import { createBooking, getBookingsForUser } from '@/lib/controllers/booking.controller';
import { verifySession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const bookings = await getBookingsForUser(session.id, session.role);
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching bookings', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    // Validate body
    if (!body.serviceId || !body.date) {
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

    // Fetch service to get the proper amount if amount is 0 or missing
    let finalAmount = body.amount;
    if (!finalAmount) {
      const { db } = await import('@/lib/db');
      const service = await db.service.findUnique({ where: { id: body.serviceId } });
      finalAmount = service?.price || 0;
    }

    const booking = await createBooking({
      customerId: session.role === 'CUSTOMER' ? session.id : customerId, 
      serviceId: body.serviceId,
      shopId: body.shopId,
      barberId: body.barberId,
      date: body.date,
      amount: finalAmount,
    });

    return NextResponse.json({ booking, message: 'Booking created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error creating booking', error: error.message }, { status: 500 });
  }
}

import { updateBookingStatus, deleteBooking } from '@/lib/controllers/booking.controller';

export async function PUT(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ message: 'ID and status are required' }, { status: 400 });
    }

    const booking = await updateBookingStatus(body.id, body.status);
    return NextResponse.json({ booking, message: 'Booking updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error updating booking', error: error.message }, { status: 500 });
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
    return NextResponse.json({ message: 'Error deleting booking', error: error.message }, { status: 500 });
  }
}
