import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/profile';
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=google_cancelled', request.url));
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
      return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
    }

    const { access_token } = await tokenRes.json();

    // Fetch user profile from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
    }

    const { email, name, picture, sub: googleId } = await userInfoRes.json();

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
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

    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone ?? undefined,
    });

    // Redirect to the original callbackUrl (passed via state param)
    const redirectTo = state.startsWith('/') ? state : '/profile';
    return NextResponse.redirect(new URL(redirectTo, request.url));

  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
