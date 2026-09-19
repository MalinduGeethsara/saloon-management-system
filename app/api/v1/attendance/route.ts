import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorize, forbidden } from '@/lib/access.server';
import { serverError } from '@/lib/api-error';
import { parsePageParams, wantsPagination } from '@/lib/pagination';
import { notify } from '@/lib/services/notify';

const PAGE = '/owner/hr/attendance';

const parseInstant = (value: unknown): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

const dayBounds = (d: Date) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const clock = (d: Date | null | undefined) => (d ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '');
const dayLabel = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const cleanNote = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 255) : null);

// Tell the employee their attendance was touched (unless they did it themselves)
function tellEmployee(userId: string, actor: { id: string; name: string }, text: (by: string) => string) {
  if (userId === actor.id) return;
  void notify({
    event: 'ATTENDANCE_RECORDED',
    title: 'Attendance Updated',
    desc: text(actor.name || 'The salon'),
    employeeIds: [userId],
    actorId: actor.id,
    ref: { type: 'ATTENDANCE', id: userId },
  });
}

export async function GET(request: Request) {
  try {
    if (!(await authorize(PAGE, 'view'))) return forbidden();

    const { searchParams } = new URL(request.url);

    // The people a manual entry can be made for (names only, so it works for anyone who may use this page)
    if (searchParams.get('staff') === '1') {
      const staff = await db.user.findMany({
        where: { role: { in: ['BARBER', 'MANAGER'] } },
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ staff }, { status: 200 });
    }

    const dateStr = searchParams.get('date');
    let dateQuery = {};
    if (dateStr) {
      const { start, end } = dayBounds(new Date(dateStr));
      dateQuery = { date: { gte: start, lte: end } };
    }

    const select = {
      id: true,
      userId: true,
      date: true,
      checkIn: true,
      checkOut: true,
      method: true,
      note: true,
      user: {
        select: {
          name: true,
          role: true,
        }
      }
    } as const;

    // Paginated mode (?page=): optional ?q= matches the employee name. Without ?page the legacy
    // full list is returned for any other consumers.
    if (wantsPagination({ page: searchParams.get('page') })) {
      const params = parsePageParams({ page: searchParams.get('page'), pageSize: searchParams.get('pageSize') });
      const q = searchParams.get('q')?.trim();
      const where = { ...dateQuery, ...(q ? { user: { name: { contains: q } } } : {}) };

      const [attendance, total] = await db.$transaction([
        db.attendance.findMany({ where, select, orderBy: [{ date: 'desc' }, { checkIn: 'desc' }], skip: params.skip, take: params.take }),
        db.attendance.count({ where }),
      ]);
      return NextResponse.json({ attendance, total, page: params.page, pageSize: params.pageSize }, { status: 200 });
    }

    const attendance = await db.attendance.findMany({
      where: dateQuery,
      select,
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ attendance }, { status: 200 });
  } catch (error: any) {
    return serverError('Error fetching attendance', error);
  }
}

export async function POST(request: Request) {
  try {
    const allowed = await authorize(PAGE, 'add');
    if (!allowed) return forbidden();
    const session = allowed.session;

    const body = await request.json();
    if (!body.userId || !body.date) {
      return NextResponse.json({ message: 'userId and date are required' }, { status: 400 });
    }

    const targetDate = parseInstant(body.date);
    if (!targetDate) return NextResponse.json({ message: 'Please pick a valid date' }, { status: 400 });
    const checkIn = parseInstant(body.checkIn);
    const checkOut = parseInstant(body.checkOut);
    if (body.checkIn && !checkIn) return NextResponse.json({ message: 'The clock-in time is not valid' }, { status: 400 });
    if (body.checkOut && !checkOut) return NextResponse.json({ message: 'The clock-out time is not valid' }, { status: 400 });
    if (checkIn && checkOut && checkOut <= checkIn) {
      return NextResponse.json({ message: 'Clock-out must be after clock-in' }, { status: 400 });
    }
    if ((checkIn || checkOut || targetDate).getTime() > Date.now() + 60_000) {
      return NextResponse.json({ message: 'You cannot record attendance in the future' }, { status: 400 });
    }

    const employee = await db.user.findUnique({ where: { id: String(body.userId) }, select: { id: true, role: true } });
    if (!employee || employee.role === 'CUSTOMER') {
      return NextResponse.json({ message: 'That staff member was not found' }, { status: 404 });
    }
    const note = cleanNote(body.note);

    const { start: startOfDay, end: endOfDay } = dayBounds(targetDate);
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
      if (checkIn) updateData.checkIn = checkIn;
      if (checkOut) {
        if (checkOut <= (checkIn || existing.checkIn)) {
          return NextResponse.json({ message: 'Clock-out must be after clock-in' }, { status: 400 });
        }
        updateData.checkOut = checkOut;
      }
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nothing to update' }, { status: 400 });
      }
      if (note) updateData.note = note;
      updateData.recordedBy = session.id;
      const updated = await db.attendance.update({ where: { id: existing.id }, data: updateData });
      tellEmployee(updated.userId, session, (by) => `${by} updated your attendance for ${dayLabel(updated.date)}: in ${clock(updated.checkIn)}${updated.checkOut ? `, out ${clock(updated.checkOut)}` : ''}.`);
      return NextResponse.json({ record: updated, message: 'Attendance updated' }, { status: 200 });
    }

    // New record — checkIn is required when no existing record
    if (!checkIn) {
      return NextResponse.json({ message: 'Clock-in time is required for a new attendance record' }, { status: 400 });
    }

    const record = await db.attendance.create({
      data: {
        userId: body.userId,
        date: targetDate,
        checkIn,
        checkOut,
        method: 'MANUAL',
        recordedBy: session.id,
        note,
      }
    });
    tellEmployee(record.userId, session, (by) => `${by} recorded your attendance for ${dayLabel(record.date)}: in ${clock(record.checkIn)}${record.checkOut ? `, out ${clock(record.checkOut)}` : ''}.`);
    return NextResponse.json({ record, message: 'Attendance created' }, { status: 201 });
  } catch (error: any) {
    return serverError('Error creating attendance', error);
  }
}

export async function PUT(request: Request) {
  try {
    const allowed = await authorize(PAGE, 'edit');
    if (!allowed) return forbidden();
    const session = allowed.session;

    const body = await request.json();
    if (!body.id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    const current = await db.attendance.findUnique({ where: { id: String(body.id) } });
    if (!current) return NextResponse.json({ message: 'Record not found' }, { status: 404 });

    const checkIn = parseInstant(body.checkIn);
    const checkOut = parseInstant(body.checkOut);
    if (body.checkIn && !checkIn) return NextResponse.json({ message: 'The clock-in time is not valid' }, { status: 400 });
    if (body.checkOut && !checkOut) return NextResponse.json({ message: 'The clock-out time is not valid' }, { status: 400 });

    const finalIn = checkIn || current.checkIn;
    const finalOut = checkOut || current.checkOut;
    if (finalOut && finalOut <= finalIn) {
      return NextResponse.json({ message: 'Clock-out must be after clock-in' }, { status: 400 });
    }
    if ((checkOut || checkIn || current.date).getTime() > Date.now() + 60_000) {
      return NextResponse.json({ message: 'You cannot record attendance in the future' }, { status: 400 });
    }

    const updateData: any = { recordedBy: session.id };
    if (checkIn) updateData.checkIn = checkIn;
    if (checkOut) updateData.checkOut = checkOut;
    const note = cleanNote(body.note);
    if (note) updateData.note = note;

    const record = await db.attendance.update({ where: { id: current.id }, data: updateData });
    tellEmployee(record.userId, session, (by) => `${by} corrected your attendance for ${dayLabel(record.date)}: in ${clock(record.checkIn)}${record.checkOut ? `, out ${clock(record.checkOut)}` : ''}.`);
    return NextResponse.json({ record, message: 'Attendance updated' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error updating attendance', error);
  }
}

export async function DELETE(request: Request) {
  try {
    const allowed = await authorize(PAGE, 'delete');
    if (!allowed) return forbidden();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    const current = await db.attendance.findUnique({ where: { id }, select: { userId: true, date: true } });
    if (!current) return NextResponse.json({ message: 'Record not found' }, { status: 404 });
    await db.attendance.delete({ where: { id } });
    tellEmployee(current.userId, allowed.session, (by) => `${by} removed your attendance record for ${dayLabel(current.date)}.`);
    return NextResponse.json({ message: 'Attendance deleted' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error deleting attendance', error);
  }
}
