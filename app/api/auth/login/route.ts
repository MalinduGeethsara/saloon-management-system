import { NextResponse } from 'next/server';
import { loginCustomer, registerCustomer } from '@/lib/controllers/auth.controller';
import { wasRecentlyVerified } from '@/lib/services/otp.service';
import { normalizePhone } from '@/lib/utils/phone';
import { rateLimit, isBlocked, recordFailure, getClientIp } from '@/lib/rate-limit';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// Wrong passwords from one address, across ALL accounts (credential stuffing tries many accounts, so
// the per-account limit alone never trips for it)
const MAX_FAILED_LOGINS_PER_IP = 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, isRegister, name, phone } = body;

    // Credentials must be plain strings (an object/array body would otherwise reach the query layer)
    for (const v of [email, password, name, phone]) {
      if (v !== undefined && v !== null && typeof v !== 'string') {
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
      }
    }

    const ip = getClientIp(request);
    const limitKey = `login:${ip}:${(email || phone || '').toLowerCase()}`;
    const { allowed, retryAfterSeconds } = rateLimit(limitKey, 5, LOGIN_WINDOW_MS);
    const ipBlock = isBlocked(`login-fail-ip:${ip}`, MAX_FAILED_LOGINS_PER_IP);
    if (!allowed || ipBlock.blocked) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(retryAfterSeconds, ipBlock.retryAfterSeconds)) } }
      );
    }

    if (isRegister) {
      if ((!email && !phone) || !password || !name) {
        return NextResponse.json({ success: false, message: 'Missing required fields for signup' }, { status: 400 });
      }
      if (email && !EMAIL_RE.test(email.trim())) {
        return NextResponse.json({ success: false, message: 'Please enter a valid email address' }, { status: 400 });
      }
      if (password.length < 6 || password.length > 128) {
        return NextResponse.json({ success: false, message: 'Password must be between 6 and 128 characters' }, { status: 400 });
      }
      if (name.trim().length === 0 || name.length > 100) {
        return NextResponse.json({ success: false, message: 'Please enter your name (max 100 characters)' }, { status: 400 });
      }

      // The client's "code verified" state cannot be trusted — confirm server-side that this
      // exact email/phone actually consumed a valid OTP recently, not just that some code was typed in.
      const identifier = email ? email.toLowerCase().trim() : normalizePhone(phone);
      const verified = await wasRecentlyVerified(identifier, 'REGISTER');
      if (!verified) {
        return NextResponse.json({ success: false, message: 'Please verify your email/phone with the code sent to you first' }, { status: 403 });
      }

      const user = await registerCustomer({ email, phone, passwordRaw: password, name: name.trim() });
      return NextResponse.json({ success: true, role: user.role, name: user.name, phone: user.phone }, { status: 200 });
    }

    // Standard Login
    if (!(email || phone) || !password) {
      return NextResponse.json({ success: false, message: 'Email or phone and password are required' }, { status: 400 });
    }
    const user = await loginCustomer(email || phone, password);

    if (user) {
      return NextResponse.json({ success: true, role: user.role, name: user.name, phone: user.phone, mustChangePassword: user.mustChangePassword }, { status: 200 });
    }

    recordFailure(`login-fail-ip:${ip}`, LOGIN_WINDOW_MS);
    return NextResponse.json({ success: false, message: 'Invalid customer credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login Error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'An account with this email or phone number already exists.' }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
