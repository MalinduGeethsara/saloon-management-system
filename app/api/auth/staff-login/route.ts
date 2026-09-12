import { NextResponse } from 'next/server';
import { loginStaff } from '@/lib/controllers/auth.controller';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const limitKey = `staff-login:${getClientIp(request)}:${(email || '').toLowerCase()}`;
    const { allowed, retryAfterSeconds } = rateLimit(limitKey, 5, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const user = await loginStaff(email, password);

    if (user) {
      return NextResponse.json({ success: true, role: user.role, name: user.name }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Staff Login Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}