import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { issueSessionFor } from '@/lib/access.server';
import { isBlocked, rateLimit, recordFailure } from '@/lib/rate-limit';
import { notify } from '@/lib/services/notify';

const WINDOW_MS = 15 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 10;

// GET: is this person being made to choose a new password (first login with a handed-over password)?
export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.id }, select: { name: true, role: true, mustChangePassword: true } });
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ forced: user.mustChangePassword, name: user.name, role: user.role });
}

// POST { currentPassword, newPassword }: anyone signed in can change their own password at any time.
// It also ends the "must change" lock that a first-run or handed-over password carries.
export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ success: false, message: 'Please sign in first.' }, { status: 401 });

    // A stolen session must not be able to guess the current password: a few tries, then a wait
    const attempt = rateLimit(`change-password:${session.id}`, 10, WINDOW_MS);
    const wrong = isBlocked(`change-password-fail:${session.id}`, 5);
    if (!attempt.allowed || wrong.blocked) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(attempt.retryAfterSeconds, wrong.retryAfterSeconds)) } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { currentPassword, newPassword } = body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Enter your current password and a new one.' }, { status: 400 });
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > 128) {
      return NextResponse.json({ success: false, message: `The new password must be ${MIN_PASSWORD_LENGTH} to 128 characters long.` }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ success: false, message: 'Please sign in first.' }, { status: 401 });

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      recordFailure(`change-password-fail:${session.id}`, WINDOW_MS);
      return NextResponse.json({ success: false, message: 'Your current password is not correct.' }, { status: 400 });
    }
    if (await bcrypt.compare(newPassword, user.password)) {
      return NextResponse.json({ success: false, message: 'Choose a password different from the current one.' }, { status: 400 });
    }
    const lower = newPassword.toLowerCase();
    if (lower === user.email.toLowerCase() || lower === user.email.split('@')[0].toLowerCase()) {
      return NextResponse.json({ success: false, message: 'The password must not be your email address.' }, { status: 400 });
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 10), mustChangePassword: false },
    });

    // A new sign-in token without the lock; the old one (and any other device) stays valid only until it expires
    const landing = await issueSessionFor(user.id);

    if (user.role !== 'CUSTOMER') {
      const when = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      void notify({
        event: 'PASSWORD_CHANGED',
        title: 'Password Changed',
        desc: 'Your password was changed just now. If this was not you, ask the owner to reset it.',
        employeeIds: [user.id],
        email: {
          subject: 'Your MR POLAA password was changed',
          heading: 'Your password was changed',
          intro: 'If you did this, no action is needed. If you did not, tell the owner straight away so your account can be secured.',
          rows: [['Account', user.email], ['When', when]],
        },
      });
    }

    return NextResponse.json({ success: true, landing });
  } catch (error) {
    console.error('[change-password] error', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
