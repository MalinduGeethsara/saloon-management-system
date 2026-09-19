import type { NextRequest } from 'next/server';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

// The origin the browser actually used, rebuilt from the proxy headers. Behind a reverse
// proxy/tunnel (Cloudflare Tunnel, nginx) Next.js reports request.nextUrl.origin as the internal
// listener (localhost:3000), so the forwarded headers are the only way to see the public host.
function originFromRequest(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? request.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
}

function hostnameOf(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return '';
  }
}

// The canonical public origin (NEXT_PUBLIC_APP_URL), or null when it isn't configured.
export function getCanonicalOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '');
  return configured || null;
}

// The origin to use for OAuth redirect_uri and post-login redirects.
//  - Development (or no NEXT_PUBLIC_APP_URL): whatever the browser used.
//  - Production: pinned to NEXT_PUBLIC_APP_URL so a forged Host / X-Forwarded-* header can never
//    steer redirects. Direct localhost access is still honoured so a production build can be tried
//    on the same machine (localhost is registered as an OAuth redirect URI for testing).
export function getPublicOrigin(request: NextRequest): string {
  const fromRequest = originFromRequest(request);
  const canonical = getCanonicalOrigin();

  if (process.env.NODE_ENV !== 'production' || !canonical) return fromRequest;
  if (LOCAL_HOSTS.has(hostnameOf(fromRequest))) return fromRequest;
  return canonical;
}

// True when the visitor is on a different public host than the canonical one (e.g. www.<domain>
// while the site is served from <domain>). Cookies are host-only, so anything that sets a cookie
// and then comes back via the canonical redirect_uri (OAuth) has to start on the canonical host.
export function isNonCanonicalHost(request: NextRequest): boolean {
  const canonical = getCanonicalOrigin();
  if (process.env.NODE_ENV !== 'production' || !canonical) return false;
  const requestHost = hostnameOf(originFromRequest(request));
  if (LOCAL_HOSTS.has(requestHost)) return false;
  return requestHost !== hostnameOf(canonical);
}

// Only same-site relative paths ("/profile", "/booking?x=1") are allowed as post-login targets.
// Rejects protocol-relative ("//evil.com") and backslash tricks ("/\evil.com") that browsers
// normalise into an off-site URL.
export function safeRedirectPath(value: string | null | undefined, fallback = '/profile'): string {
  if (!value || !/^\/(?![/\\])/.test(value) || /[\\\r\n]/.test(value)) return fallback;
  return value;
}
