import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorize, forbidden } from '@/lib/access.server';
import { deleteCloudinaryImage } from '@/lib/cloudinary';
import { serverError } from '@/lib/api-error';

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
    return serverError('Error fetching services', error);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await authorize(['/owner/services', '/owner/products'], 'add'))) return forbidden();

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
    return serverError('Error creating service', error);
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await authorize(['/owner/services', '/owner/products'], 'edit'))) return forbidden();

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
    return serverError('Error updating service', error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await authorize(['/owner/services', '/owner/products'], 'delete'))) return forbidden();

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
    return serverError('Error deleting service', error);
  }
}
