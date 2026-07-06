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
      dateQuery = {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    }

    const attendance = await db.attendance.findMany({
      where: dateQuery,
      include: {
        user: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error: any) {
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
    if (!body.userId || !body.date || !body.checkIn) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
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

    const record = await db.attendance.update({
      where: { id: body.id },
      data: updateData
    });
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
