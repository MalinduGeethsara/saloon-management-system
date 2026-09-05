import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const deviceKey = request.headers.get('X-Device-Key');
    if (!deviceKey || deviceKey !== process.env.FINGERPRINT_DEVICE_KEY) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, fingerprintId, type, timestamp } = body;

    if (!deviceId || !fingerprintId || !type) {
      return NextResponse.json({ message: 'Missing required fields: deviceId, fingerprintId, type' }, { status: 400 });
    }

    if (!['CHECK_IN', 'CHECK_OUT'].includes(type)) {
      return NextResponse.json({ message: 'type must be CHECK_IN or CHECK_OUT' }, { status: 400 });
    }

    // Lookup employee by fingerprint template + device
    const device = await db.employeeDevice.findUnique({
      where: { fingerprintId_deviceId: { fingerprintId, deviceId } },
      include: { user: { select: { id: true, name: true } } }
    });

    if (!device || device.status !== 'ACTIVE') {
      return NextResponse.json({ message: 'Fingerprint not registered or device revoked' }, { status: 404 });
    }

    const userId = device.userId;
    const eventTime = timestamp ? new Date(timestamp) : new Date();

    const startOfDay = new Date(eventTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(eventTime);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await db.attendance.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } }
    });

    let record;

    if (type === 'CHECK_IN') {
      if (existing) {
        return NextResponse.json({
          message: 'Already checked in today',
          employeeName: device.user.name,
          timestamp: existing.checkIn
        }, { status: 409 });
      }

      record = await db.attendance.create({
        data: {
          userId,
          date: eventTime,
          checkIn: eventTime,
          method: 'FINGERPRINT',
          deviceId,
        }
      });
    } else {
      // CHECK_OUT
      if (!existing) {
        return NextResponse.json({ message: 'No check-in found for today' }, { status: 404 });
      }

      record = await db.attendance.update({
        where: { id: existing.id },
        data: { checkOut: eventTime }
      });
    }

    return NextResponse.json({
      success: true,
      employeeName: device.user.name,
      status: type === 'CHECK_IN' ? 'checked_in' : 'checked_out',
      timestamp: eventTime,
      attendanceId: record.id
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fingerprint attendance error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
