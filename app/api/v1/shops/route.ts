import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const shops = await db.shop.findMany({
      include: {
        _count: {
          select: { bookings: true, services: true }
        },
        staff: {
          select: { id: true, name: true, imageUrl: true, role: true }
        },
        bookings: {
          where: {
            status: 'COMPLETED',
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            totalAmount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const shopsWithRevenue = shops.map(shop => {
      const monthlyRevenue = shop.bookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const { bookings, ...rest } = shop;
      return { ...rest, revenue: monthlyRevenue };
    });

    return NextResponse.json({ shops: shopsWithRevenue }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching shops', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ message: 'Shop name is required' }, { status: 400 });
    }

    const shop = await db.shop.create({ 
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        status: body.status || 'Open',
        imageUrl: body.imageUrl || null,
        operatingHours: body.operatingHours || {
          "Monday": { open: "09:00", close: "18:00", isClosed: false },
          "Tuesday": { open: "09:00", close: "18:00", isClosed: false },
          "Wednesday": { open: "09:00", close: "18:00", isClosed: false },
          "Thursday": { open: "09:00", close: "18:00", isClosed: false },
          "Friday": { open: "09:00", close: "18:00", isClosed: false },
          "Saturday": { open: "09:00", close: "18:00", isClosed: false },
          "Sunday": { open: "09:00", close: "18:00", isClosed: true }
        }
      }
    });
    return NextResponse.json({ shop, message: 'Shop created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error creating shop', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.operatingHours !== undefined) updateData.operatingHours = body.operatingHours;

    const shop = await db.shop.update({
      where: { id: body.id },
      data: updateData
    });
    
    return NextResponse.json({ shop, message: 'Shop updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error updating shop', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    const shop = await db.shop.findUnique({ where: { id } });
    if (!shop) {
      return NextResponse.json({ message: 'Shop not found' }, { status: 404 });
    }

    if (shop.imageUrl) {
      await deleteCloudinaryImage(shop.imageUrl);
    }

    await db.shop.delete({ where: { id } });
    
    return NextResponse.json({ message: 'Shop deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error deleting shop', error: error.message }, { status: 500 });
  }
}
