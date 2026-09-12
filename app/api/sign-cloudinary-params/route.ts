import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

// Only signed-in staff/owners upload images (profile photos, product/service images) through
// this app — signing for an unauthenticated caller would hand out free write access to our
// Cloudinary account (storage/bandwidth abuse, arbitrary uploads under our brand).
const ALLOWED_FOLDERS = ['salon', 'salon/staff', 'salon/products', 'salon/services', 'salon/shops'];

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { paramsToSign } = body;

  if (!paramsToSign || typeof paramsToSign !== 'object') {
    return NextResponse.json({ error: 'paramsToSign is required' }, { status: 400 });
  }

  if (paramsToSign.folder && !ALLOWED_FOLDERS.includes(paramsToSign.folder)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return NextResponse.json({ signature });
}
