import { NextResponse } from 'next/server';
import { loginStaff } from '@/lib/controllers/auth.controller';
import { rateLimit, isBlocked, recordFailure, getClientIp } from '@/lib/rate-limit';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS_PER_IP = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    const ip = getClientIp(request);
    const limitKey = `staff-login:${ip}:${email.toLowerCase()}`;
    const { allowed, retryAfterSeconds } = rateLimit(limitKey, 5, LOGIN_WINDOW_MS);
    const ipBlock = isBlocked(`staff-login-fail-ip:${ip}`, MAX_FAILED_LOGINS_PER_IP);
    if (!allowed || ipBlock.blocked) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(retryAfterSeconds, ipBlock.retryAfterSeconds)) } }
      );
    }

    const user = await loginStaff(email, password);

    if (user) {
      return NextResponse.json({ success: true, role: user.role, name: user.name, mustChangePassword: user.mustChangePassword }, { status: 200 });
    }

    recordFailure(`staff-login-fail-ip:${ip}`, LOGIN_WINDOW_MS);
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Staff Login Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
