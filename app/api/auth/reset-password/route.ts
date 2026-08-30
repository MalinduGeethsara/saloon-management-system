import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { wasRecentlyVerified } from '@/lib/services/otp.service';
import { normalizePhone } from '@/lib/utils/phone';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, newPassword } = body;

    if (!identifier || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing identifier or new password' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const isEmail = identifier.includes('@');
    const normalizedIdentifier = isEmail ? identifier.toLowerCase().trim() : normalizePhone(identifier);

    // The client cannot be trusted to say "I verified the OTP" — re-check server-side that a code
    // for this exact identifier+purpose was actually consumed recently.
    const verified = await wasRecentlyVerified(normalizedIdentifier, 'PASSWORD_RESET');
    if (!verified) {
      return NextResponse.json({ success: false, message: 'Please verify your identity with a valid code first' }, { status: 403 });
    }

    const user = await db.user.findFirst({
      where: isEmail ? { email: normalizedIdentifier } : { phone: normalizedIdentifier },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'No account found for this identifier' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[reset-password] error', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
