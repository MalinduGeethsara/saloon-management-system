import { NextResponse } from 'next/server';
import { createBooking, getBookingsForUser, getBookingsPage, getBookingById } from '@/lib/controllers/booking.controller';
import { parsePageParams, wantsPagination } from '@/lib/pagination';
import { verifySession } from '@/lib/session';
import { serverError } from '@/lib/api-error';
import { authorize, forbidden, getAccess } from '@/lib/access.server';
import { shopClosedReason, totalDurationMinutes } from '@/lib/services/booking-slots';

// The calendar and the bookings page both work on bookings: the owner's tick-boxes for either count
const BOOKING_PAGES = ['/owner/bookings/manage', '/owner/calendar'];

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Whose bookings? Customers: their own. Barbers: their own, unless the owner gave them the Bookings/Calendar
    // page. Owner and managers with that page: everyone's. (Read fresh from the database, not from the token.)
    let scopeRole = session.role;
    if (session.role !== 'CUSTOMER') {
      const found = await getAccess(BOOKING_PAGES);
      if (!found) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      if (found.session.role === 'BARBER') scopeRole = found.access.view && found.access.source === 'row' ? 'OWNER' : 'BARBER';
      else if (!found.access.view) return forbidden();
      else scopeRole = found.session.role;
    }

    const { searchParams } = new URL(request.url);

    // Paginated mode (owner/manager booking table). Without ?page the legacy full list is
    // returned, which the barber dashboard and the calendar still rely on.
    if (wantsPagination({ page: searchParams.get('page') })) {
      const params = parsePageParams({ page: searchParams.get('page'), pageSize: searchParams.get('pageSize') });
      const { items, total, page, pageSize, stats } = await getBookingsPage(session.id, scopeRole, params, {
        q: searchParams.get('q') ?? undefined,
        status: searchParams.get('status') ?? undefined,
        source: searchParams.get('source') ?? undefined,
      });
      return NextResponse.json({ bookings: items, total, page, pageSize, stats }, { status: 200 });
    }

    // Optional ?from=&to= (ISO dates) to look further back/ahead than the default window around today
    const parseDate = (v: string | null) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
    const bookings = await getBookingsForUser(session.id, scopeRole, { from: parseDate(searchParams.get('from')), to: parseDate(searchParams.get('to')) });
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: any) {
    return serverError('Error fetching bookings', error);
  }
}

export async function POST(request: Request) {
  try {
    // Staff-only: this creates a CONFIRMED booking immediately and trusts a caller-supplied
    // `amount` (for manual/walk-in bookings). Opening it to any logged-in user would let a
    // customer hit the API directly to create a confirmed booking at a price of their choosing,
    // bypassing the real PayHere checkout flow entirely (see lib/actions/booking.ts for that path).
    // Needs the "Add" tick-box on Bookings (or Calendar).
    const allowed = await authorize(BOOKING_PAGES, 'add');
    if (!allowed) return forbidden();
    const session = allowed.session;

    const body = await request.json();

    // Validate body
    if ((!body.serviceIds && !body.serviceId) || !body.date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (Number.isNaN(new Date(body.date).getTime())) {
      return NextResponse.json({ message: 'Please enter a valid booking date and time.' }, { status: 400 });
    }

    const serviceIds: string[] = body.serviceIds || (body.serviceId ? [body.serviceId] : []);
    if (!Array.isArray(serviceIds) || serviceIds.length === 0 || serviceIds.some((id) => typeof id !== 'string')) {
      return NextResponse.json({ message: 'Please choose at least one service.' }, { status: 400 });
    }
    const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
    if (!body.customerId && clientName.length > 100) {
      return NextResponse.json({ message: 'The client name is too long (100 characters at most).' }, { status: 400 });
    }

    const { db } = await import('@/lib/db');
    const services = await db.service.findMany({ where: { id: { in: serviceIds } } });
    if (services.length === 0) {
      return NextResponse.json({ message: 'That service was not found. Please choose a service again.' }, { status: 400 });
    }

    // The price comes from the services unless the caller sent one
    const finalAmount = body.amount || services.reduce((sum: number, s: any) => sum + s.price, 0);

    // The branch must be open for the WHOLE visit (same rule and same wording as the website booking)
    if (body.shopId) {
      const shop = await db.shop.findUnique({ where: { id: body.shopId } });
      const reason = shopClosedReason(shop, new Date(body.date), totalDurationMinutes(services));
      if (reason) return NextResponse.json({ message: reason }, { status: 400 });
    }

    // No customer chosen: a walk-in named on the form (created together with the booking) or, failing that, the staff member
    let customerId: string | undefined = body.customerId;
    if (!customerId && !clientName) customerId = session.id;

    const booking = await createBooking({
      customerId: session.role === 'CUSTOMER' ? session.id : customerId,
      clientName: customerId ? undefined : clientName,
      serviceIds,
      shopId: body.shopId,
      barberId: body.barberId,
      date: body.date,
      amount: finalAmount,
      actorRole: session.role,
      actorId: session.id,
    });

    return NextResponse.json({ booking, message: 'Booking created successfully' }, { status: 201 });
  } catch (error: any) {
    // The specialist is already booked at that time: a normal outcome, tell the user why
    if (typeof error?.message === 'string' && error.message.startsWith('DOUBLE_BOOKING')) {
      return NextResponse.json({ message: 'That specialist is already booked at that time. Please pick another time or specialist.' }, { status: 409 });
    }
    return serverError('Error creating booking', error);
  }
}

import { updateBookingStatus, deleteBooking, completePayment } from '@/lib/controllers/booking.controller';

export async function PUT(request: Request) {
  try {
    const found = await getAccess(BOOKING_PAGES);
    if (!found) return forbidden();
    const session = found.session;

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    // Changing a booking needs the "Edit" tick-box, and CANCELLING one needs "Delete / Cancel".
    // A barber always may look after the bookings assigned to THEM (accept, decline, complete), whatever they were given.
    const cancelling = body.status === 'CANCELLED';
    const mayAny = cancelling ? found.access.delete : found.access.edit;
    if (session.role === 'BARBER' && !mayAny) {
      const existing = await getBookingById(body.id);
      if (!existing) {
        return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
      }
      if (existing.barberId !== session.id) {
        return NextResponse.json({ message: 'You can only manage your own bookings' }, { status: 403 });
      }
    } else if (!mayAny) {
      return forbidden();
    }

    let booking;
    let receipt: { sms: string; email: string } | null = null;
    if (body.action === 'PAYMENT_COMPLETE') {
      const done = await completePayment(body.id, body.paymentMethod?.toUpperCase() || 'CASH', {
        phone: typeof body.contactPhone === 'string' ? body.contactPhone : null,
        email: typeof body.contactEmail === 'string' ? body.contactEmail : null,
      });
      booking = done.booking;
      receipt = done.receipt;
    } else if (body.status) {
      booking = await updateBookingStatus(body.id, body.status, { id: session.id, role: session.role });
    } else {
      return NextResponse.json({ message: 'Status or action is required' }, { status: 400 });
    }

    return NextResponse.json({ booking, receiptSms: receipt?.sms ?? null, receiptEmail: receipt?.email ?? null, message: 'Booking updated successfully' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error updating booking', error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await authorize(BOOKING_PAGES, 'delete'))) return forbidden();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    await deleteBooking(id);
    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error deleting booking', error);
  }
}
