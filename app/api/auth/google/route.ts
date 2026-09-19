import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getCanonicalOrigin, getPublicOrigin, isNonCanonicalHost, safeRedirectPath } from '@/lib/utils/origin';
import { GOOGLE_OAUTH_NONCE_COOKIE, GOOGLE_OAUTH_NONCE_TTL_SECONDS } from '@/lib/google-oauth';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const callbackUrl = safeRedirectPath(searchParams.get('callbackUrl'));

  // Started from e.g. www.<domain> while Google only knows the canonical callback URL: the nonce
  // cookie (host-only) and the session cookie must live on the same host the callback arrives at,
  // so restart the flow there. (Register both hosts in Google Cloud to skip this hop.)
  const canonical = getCanonicalOrigin();
  if (canonical && isNonCanonicalHost(request)) {
    return NextResponse.redirect(`${canonical}/api/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const origin = getPublicOrigin(request);
  // state = "<nonce>.<url-encoded path>". The nonce is also stored in an httpOnly cookie and
  // compared in the callback, so a forged callback link (login CSRF) is rejected.
  const nonce = randomUUID();

  const redirectUri = `${origin}/api/auth/google/callback`;

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', `${nonce}.${encodeURIComponent(callbackUrl)}`);
  googleUrl.searchParams.set('access_type', 'online');
  googleUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(googleUrl.toString());
  response.cookies.set(GOOGLE_OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    // Follows the scheme the browser is really using (a production build tried on http://localhost
    // must still be able to store it); https everywhere it is deployed
    secure: origin.startsWith('https://'),
    // lax (not strict) so the cookie is still sent on the top-level GET redirect back from Google
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: GOOGLE_OAUTH_NONCE_TTL_SECONDS,
  });
  return response;
}
