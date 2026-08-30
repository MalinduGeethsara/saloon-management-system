import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export async function GET() {
  const session = await verifySession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const staff = await db.user.findMany({
      where: {
        role: {
          notIn: ['CUSTOMER', 'OWNER', 'ADMIN']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        imageUrl: true,
        shopId: true,
        salaryType: true,
        baseSalary: true,
        commissionRate: true,
        shop: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ staff });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const data = await request.json();
    const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);

    const user = await db.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        role: data.role, // 'MANAGER' or 'BARBER'
        password: hashedPassword,
        imageUrl: data.imageUrl || null,
        shopId: data.shopId || null,
        salaryType: data.salaryType || 'Commission',
        baseSalary: parseFloat(data.baseSalary) || 0,
        commissionRate: parseFloat(data.commissionRate) || 0,
      }
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await verifySession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const data = await request.json();
    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role
    };

    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
    }

    if (data.salaryType !== undefined) updateData.salaryType = data.salaryType;
    if (data.baseSalary !== undefined) updateData.baseSalary = parseFloat(data.baseSalary) || 0;
    if (data.commissionRate !== undefined) updateData.commissionRate = parseFloat(data.commissionRate) || 0;
    if (data.allowances !== undefined) updateData.allowances = parseFloat(data.allowances) || 0;

    updateData.shopId = data.shopId || null;

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await db.user.update({
      where: { id: data.id },
      data: updateData
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await verifySession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.imageUrl) {
      await deleteCloudinaryImage(user.imageUrl);
    }

    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
