import { NextResponse } from 'next/server';
import { createProduct, getAllProducts, updateProduct, deleteProduct, getProductById } from '@/lib/controllers/product.controller';
import { authorize, forbidden } from '@/lib/access.server';
import { deleteCloudinaryImage } from '@/lib/cloudinary';
import { serverError } from '@/lib/api-error';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error: any) {
    return serverError('Error fetching products', error);
  }
}

export async function POST(request: Request) {
  try {
    if (!(await authorize(['/owner/products', '/owner/services'], 'add'))) return forbidden();

    const body = await request.json();
    if (!body.name || body.price === undefined || body.stock === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const product = await createProduct({
      name: body.name,
      description: body.description,
      price: Number(body.price),
      stock: Number(body.stock),
      brand: body.brand,
      category: body.category,
      sku: body.sku,
      imageUrl: body.imageUrl
    });
    
    return NextResponse.json({ product, message: 'Product created successfully' }, { status: 201 });
  } catch (error: any) {
    return serverError('Error creating product', error);
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await authorize(['/owner/products', '/owner/services'], 'edit'))) return forbidden();

    const body = await request.json();
    if (!body.id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.stock !== undefined) updateData.stock = Number(body.stock);
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.status !== undefined) updateData.status = body.status;

    const product = await updateProduct(body.id, updateData);
    
    return NextResponse.json({ product, message: 'Product updated successfully' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error updating product', error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await authorize(['/owner/products', '/owner/services'], 'delete'))) return forbidden();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

    // Fetch the product first to get the image URL
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // If product has an image, delete it from Cloudinary
    if (product.imageUrl) {
      await deleteCloudinaryImage(product.imageUrl);
    }

    // Delete from database
    await deleteProduct(id);
    
    return NextResponse.json({ message: 'Product and image deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error deleting product', error);
  }
}
