import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/services/email.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json({ success: false, message: 'Missing identifier' }, { status: 400 });
    }

    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'sms';
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Attempt real email delivery — failure is non-fatal (code still shown in UI bubble)
    if (isEmail) {
      sendOtpEmail(identifier, code).catch(() => {});
    }
    // SMS: mocked — code returned so frontend simulation bubble shows it

    return NextResponse.json({ success: true, code, type, identifier }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
