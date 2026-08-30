import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/services/email.service';
import { sendSms } from '@/lib/services/sms.service';
import { issueOtp } from '@/lib/services/otp.service';
import { normalizePhone } from '@/lib/utils/phone';
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
