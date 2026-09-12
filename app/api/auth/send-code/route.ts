import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/services/email.service';
import { sendSms } from '@/lib/services/sms.service';
import { issueOtp } from '@/lib/services/otp.service';
import { normalizePhone } from '@/lib/utils/phone';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import type { OtpPurpose } from '@prisma/client';

const ALLOWED_PURPOSES: OtpPurpose[] = ['REGISTER', 'LOGIN', 'PASSWORD_RESET', 'ADD_PHONE'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, purpose } = body;

    if (!identifier) {
      return NextResponse.json({ success: false, message: 'Missing identifier' }, { status: 400 });
    }

    if (!purpose || !ALLOWED_PURPOSES.includes(purpose)) {
      return NextResponse.json({ success: false, message: 'Missing or invalid purpose' }, { status: 400 });
    }

    // Limit both per-identifier (stop SMS/email bombing one target) and per-IP (stop one
    // client from spamming many identifiers).
    const ip = getClientIp(request);
    const byIdentifier = rateLimit(`send-code:id:${identifier.toLowerCase()}`, 3, 5 * 60 * 1000);
    const byIp = rateLimit(`send-code:ip:${ip}`, 10, 5 * 60 * 1000);
    if (!byIdentifier.allowed || !byIp.allowed) {
      const retryAfterSeconds = Math.max(byIdentifier.retryAfterSeconds, byIp.retryAfterSeconds);
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'sms';
    const normalizedIdentifier = isEmail ? identifier.toLowerCase().trim() : normalizePhone(identifier);

    const code = await issueOtp(normalizedIdentifier, purpose);

    if (isEmail) {
      sendOtpEmail(normalizedIdentifier, code).catch((err) => console.error('[OTP] email send failed', err));
    } else {
      sendSms(normalizedIdentifier, `Your MR POLAA verification code is ${code}. Valid for 5 minutes. Do not share this code.`)
        .catch((err) => console.error('[OTP] sms send failed', err));
    }

    return NextResponse.json({ success: true, type, identifier }, { status: 200 });

  } catch (error) {
    console.error('[send-code] error', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
