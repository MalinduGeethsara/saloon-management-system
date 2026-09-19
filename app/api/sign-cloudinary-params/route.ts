import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

// Only signed-in staff/owners upload images (profile photos, product/service images) through
// this app — signing for a customer or an unauthenticated caller would hand out free write access
// to our Cloudinary account (storage/bandwidth abuse, arbitrary uploads under our brand).
const ALLOWED_FOLDERS = ['salon', 'salon/staff', 'salon/products', 'salon/services', 'salon/shops'];
const STAFF_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'BARBER'];

// Upload parameters that change what the signature authorises (presets, server-side transformations,
// webhooks, overwriting existing assets, private delivery types ...). The plain image upload from the
// staff dashboard never needs them, so a request to sign any of them is refused.
const FORBIDDEN_PARAMS = [
  'upload_preset', 'eager', 'eager_async', 'eager_notification_url', 'notification_url', 'callback',
  'transformation', 'type', 'overwrite', 'invalidate', 'access_control', 'auto_tagging', 'moderation',
  'categorization', 'raw_convert', 'async', 'backup',
];

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!STAFF_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const paramsToSign = body?.paramsToSign;

  if (!paramsToSign || typeof paramsToSign !== 'object' || Array.isArray(paramsToSign)) {
    return NextResponse.json({ error: 'paramsToSign is required' }, { status: 400 });
  }

  if (paramsToSign.folder && !ALLOWED_FOLDERS.includes(paramsToSign.folder)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
  }

  if (Object.keys(paramsToSign).some(key => FORBIDDEN_PARAMS.includes(key))) {
    return NextResponse.json({ error: 'Invalid upload parameters' }, { status: 400 });
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET as string
  );

  return NextResponse.json({ signature });
}
