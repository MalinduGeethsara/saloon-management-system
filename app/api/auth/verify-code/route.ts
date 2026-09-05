import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/services/otp.service';
import { normalizePhone } from '@/lib/utils/phone';
import type { OtpPurpose } from '@prisma/client';

const ALLOWED_PURPOSES: OtpPurpose[] = ['REGISTER', 'LOGIN', 'PASSWORD_RESET', 'ADD_PHONE'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, purpose, code } = body;

    if (!identifier || !purpose || !code) {
      return NextResponse.json({ success: false, message: 'Missing identifier, purpose, or code' }, { status: 400 });
    }

    if (!ALLOWED_PURPOSES.includes(purpose)) {
      return NextResponse.json({ success: false, message: 'Invalid purpose' }, { status: 400 });
    }

    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail ? identifier.toLowerCase().trim() : normalizePhone(identifier);

    const result = await verifyOtp(normalizedIdentifier, purpose, String(code).trim());

    if (!result.success) {
      const messages: Record<string, string> = {
        not_found: 'No active verification code found. Please request a new one.',
        expired: 'This code has expired. Please request a new one.',
        too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
        mismatch: 'Incorrect code. Please try again.',
      };
      return NextResponse.json({ success: false, message: messages[result.reason] || 'Verification failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[verify-code] error', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
