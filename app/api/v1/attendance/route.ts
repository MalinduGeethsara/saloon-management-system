import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    let dateQuery = {};
    if (dateStr) {
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);
      dateQuery = { date: { gte: startOfDay, lte: endOfDay } };
    }

    const attendance = await db.attendance.findMany({
      where: dateQuery,
      select: {
        id: true,
        userId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error: any) {
    console.error('[Attendance GET]', error);
    return NextResponse.json({ message: 'Error fetching attendance', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.userId || !body.date) {
      return NextResponse.json({ message: 'userId and date are required' }, { status: 400 });
    }

    const targetDate = new Date(body.date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await db.attendance.findFirst({
      where: {
        userId: body.userId,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (existing) {
      if (existing.checkOut !== null) {
        return NextResponse.json({ message: 'Already fully checked in and out for this day' }, { status: 409 });
      }
      // Existing check-in without checkout: update checkout (only update checkIn if explicitly provided)
      const updateData: any = {};
      if (body.checkIn) updateData.checkIn = new Date(body.checkIn);
      if (body.checkOut) updateData.checkOut = new Date(body.checkOut);
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
      }
      const updated = await db.attendance.update({ where: { id: existing.id }, data: updateData });
      return NextResponse.json({ record: updated, message: 'Attendance updated' }, { status: 200 });
    }

    // New record — checkIn is required when no existing record
    if (!body.checkIn) {
      return NextResponse.json({ message: 'Clock-in time is required for a new attendance record' }, { status: 400 });
    }

    const record = await db.attendance.create({
      data: {
        userId: body.userId,
        date: new Date(body.date),
        checkIn: new Date(body.checkIn),
        checkOut: body.checkOut ? new Date(body.checkOut) : null,
      }
    });
    return NextResponse.json({ record, message: 'Attendance created' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error creating attendance', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    const updateData: any = {};
    if (body.checkIn) updateData.checkIn = new Date(body.checkIn);
    if (body.checkOut) updateData.checkOut = new Date(body.checkOut);

    const record = await db.attendance.update({ where: { id: body.id }, data: updateData });
    return NextResponse.json({ record, message: 'Attendance updated' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error updating attendance', error: error.message }, { status: 500 });
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

    await db.attendance.delete({ where: { id } });
    return NextResponse.json({ message: 'Attendance deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error deleting attendance', error: error.message }, { status: 500 });
  }
}
