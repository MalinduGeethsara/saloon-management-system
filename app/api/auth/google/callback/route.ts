import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { randomUUID, timingSafeEqual } from 'crypto';
import { getPublicOrigin, safeRedirectPath } from '@/lib/utils/origin';
import { GOOGLE_OAUTH_NONCE_COOKIE } from '@/lib/google-oauth';

function noncesMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = getPublicOrigin(request);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // state = "<nonce>.<url-encoded path>" (see ../route.ts). The nonce must match the httpOnly cookie
  // set when the flow started, otherwise this callback wasn't initiated by this browser (login CSRF).
  const rawState = searchParams.get('state') || '';
  const separator = rawState.indexOf('.');
  const stateNonce = separator === -1 ? undefined : rawState.slice(0, separator);
  let statePath: string | null = null;
  if (separator !== -1) {
    try {
      statePath = decodeURIComponent(rawState.slice(separator + 1));
    } catch {
      statePath = null;
    }
  }
  const cookieNonce = request.cookies.get(GOOGLE_OAUTH_NONCE_COOKIE)?.value;

  const withClearedNonce = (response: NextResponse) => {
    response.cookies.delete({ name: GOOGLE_OAUTH_NONCE_COOKIE, path: '/api/auth/google' });
    return response;
  };

  if (error || !code) {
    return withClearedNonce(NextResponse.redirect(new URL('/login?error=google_cancelled', origin)));
  }

  if (!noncesMatch(stateNonce, cookieNonce)) {
    return withClearedNonce(NextResponse.redirect(new URL('/login?error=google_auth_failed', origin)));
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return withClearedNonce(NextResponse.redirect(new URL('/login?error=google_auth_failed', origin)));
    }

    const { access_token } = await tokenRes.json();

    // Fetch user profile from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoRes.ok) {
      return withClearedNonce(NextResponse.redirect(new URL('/login?error=google_auth_failed', origin)));
    }

    const { email, email_verified: emailVerified, name, picture, sub: googleId } = await userInfoRes.json();

    // An unverified Google email must never be used to sign in to / link with an existing account
    // (it could otherwise be used to take over a staff or owner account with the same email).
    if (!email || !googleId || emailVerified !== true) {
      return withClearedNonce(NextResponse.redirect(new URL('/login?error=google_auth_failed', origin)));
    }

    // Find existing user by googleId first, then by email (for account linking)
    let user = await db.user.findFirst({
      where: { OR: [{ googleId }, { email: email.toLowerCase() }] },
    });

    if (!user) {
      // New user — create a CUSTOMER account
      const hashedPassword = await bcrypt.hash(randomUUID(), 10);
      user = await db.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          password: hashedPassword,
          role: 'CUSTOMER',
          imageUrl: picture || null,
          googleId,
        },
      });
    } else if (user.googleId && user.googleId !== googleId) {
      // Email matches an account already bound to a different Google identity
      return withClearedNonce(NextResponse.redirect(new URL('/login?error=google_auth_failed', origin)));
    } else if (!user.googleId) {
      // Existing email-based account — link Google to it
      user = await db.user.update({
        where: { id: user.id },
        data: {
          googleId,
          imageUrl: user.imageUrl || picture || null,
        },
      });
    }

    // Staff who sign in with Google get the same per-page permissions as a password login,
    // otherwise the middleware would treat them as having no access at all.
    const isStaff = user.role !== 'CUSTOMER';
    const permissions = isStaff
      ? (await db.staffPermission.findMany({ where: { userId: user.id } })).map(p => ({
          pageKey: p.pageKey,
          canView: p.canView,
          canAdd: p.canAdd,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        }))
      : undefined;

    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone ?? undefined,
      ...(permissions ? { permissions } : {}),
      mustChangePassword: user.mustChangePassword,
    });

    // Redirect to the original callbackUrl (carried in the state param); only same-site paths allowed.
    // Staff who came in without a specific destination land on their own dashboard (same targets
    // the middleware uses after /staff-login) instead of the customer profile page.
    let redirectTo = safeRedirectPath(statePath);
    if (user.mustChangePassword) redirectTo = '/change-password';
    if (isStaff && redirectTo === '/profile' && !user.mustChangePassword) {
      redirectTo =
        user.role === 'ADMIN' ? '/admin'
        : user.role === 'MANAGER' ? '/owner/bookings/manage'
        : user.role === 'BARBER' ? '/barber'
        : '/owner';
    }
    return withClearedNonce(NextResponse.redirect(new URL(redirectTo, origin)));

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return withClearedNonce(NextResponse.redirect(new URL('/login?error=server_error', origin)));
  }
}
