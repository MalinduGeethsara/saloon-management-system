import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

// Pages each role can access under /owner without needing explicit DB permissions
const ROLE_OWNER_BYPASSES: Record<string, string[]> = {
  BARBER:  ['/owner/calendar'],
  MANAGER: ['/owner/calendar', '/owner/bookings/manage', '/owner/hr/attendance'],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const url = request.nextUrl.clone();
  const path = url.pathname;

  const session = token ? await decrypt(token) : null;
  const userRole = session?.role;

  // ── Customer-side protection ──────────────────────────────────────────────
  const isCustomerPath =
    path.startsWith('/customer') ||
    path.startsWith('/profile') ||
    path.startsWith('/booking');

  if (isCustomerPath && !session) {
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // ── Staff-side protection ─────────────────────────────────────────────────
  const isStaffPath =
    path.startsWith('/owner') ||
    path.startsWith('/admin') ||
    (path === '/barber' || path.startsWith('/barber/')) ||
    path.startsWith('/manager') ||
    (path.startsWith('/staff') && !path.startsWith('/staff-login'));

  if (isStaffPath && (!session || session.role === 'CUSTOMER')) {
    url.pathname = '/staff-login';
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // ── Post-login redirects (already authenticated) ──────────────────────────
  if (session && userRole) {
    if (path === '/login') {
      url.pathname = userRole === 'CUSTOMER' ? '/profile' : '/owner';
      return NextResponse.redirect(url);
    }

    if (path === '/staff-login') {
      if (userRole === 'ADMIN') url.pathname = '/admin';
      else if (userRole === 'MANAGER') url.pathname = '/owner/bookings/manage';
      else if (userRole === 'BARBER') url.pathname = '/barber';
      else url.pathname = '/owner';
      return NextResponse.redirect(url);
    }

    // ── Admin can only access /admin ────────────────────────────────────────
    if (path.startsWith('/admin') && userRole !== 'ADMIN') {
      url.pathname = '/owner';
      return NextResponse.redirect(url);
    }

    // ── /owner/* permission checks ──────────────────────────────────────────
    if (path.startsWith('/owner')) {
      if (userRole === 'ADMIN') {
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }

      if (userRole !== 'OWNER') {
        const bypass = ROLE_OWNER_BYPASSES[userRole] || [];
        const isBypassed = bypass.some(p => path.startsWith(p));

        if (!isBypassed) {
          const allowed = (session.permissions as any[]) || [];
          if (path !== '/owner' && !allowed.some(perm => path.startsWith(perm.pageKey) && perm.canView)) {
            url.pathname = '/owner';
            return NextResponse.redirect(url);
          }
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
