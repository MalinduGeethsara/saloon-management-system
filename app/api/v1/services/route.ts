import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { deleteCloudinaryImage } from '@/lib/cloudinary';

export async function GET() {
  try {
    const services = await db.service.findMany({ 
      orderBy: { name: 'asc' },
      include: {
        shop: { select: { name: true } }
      }
    });
    return NextResponse.json({ services }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching services', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session || !['ADMIN', 'OWNER', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name || !body.price) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const service = await db.service.create({ 
      data: {
        name: body.name,
        price: Number(body.price),
        duration: Number(body.duration || 30),
        description: body.description,
        status: body.status || 'Active',
        imageUrl: body.imageUrl || null,
        shopId: body.shopId || null
      } 
    });
    return NextResponse.json({ service, message: 'Service created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error creating service', error: error.message }, { status: 500 });
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
    if (body.name) updateData.name = body.name;
    if (body.price) updateData.price = Number(body.price);
    if (body.duration) updateData.duration = Number(body.duration);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status) updateData.status = body.status;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    
    updateData.shopId = body.shopId || null;

    const service = await db.service.update({
      where: { id: body.id },
      data: updateData
    });
    
    return NextResponse.json({ service, message: 'Service updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error updating service', error: error.message }, { status: 500 });
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

    // Fetch the service first to get the image URL
    const service = await db.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    // If service has an image, delete it from Cloudinary
    if (service.imageUrl) {
      await deleteCloudinaryImage(service.imageUrl);
    }

    // Delete from database
    await db.service.delete({ where: { id } });
    
    return NextResponse.json({ message: 'Service deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error deleting service', error: error.message }, { status: 500 });
  }
}
