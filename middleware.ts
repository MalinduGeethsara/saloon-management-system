import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';
import { landingFor, pageKeyForPath, resolveAccess } from './lib/access';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const url = request.nextUrl.clone();
  const path = url.pathname;

  const session = token ? await decrypt(token) : null;
  const userRole = session?.role;

  // ── First-run / handed-over password: nothing else opens until the person chooses their own ─────
  if (session?.mustChangePassword) {
    if (path === '/change-password' || path.startsWith('/api/auth/') || path === '/api/auth') return NextResponse.next();
    if (path.startsWith('/api/v1/')) {
      // (the payment gateway's server-to-server call has no session, so it never gets here)
      return NextResponse.json({ success: false, code: 'PASSWORD_CHANGE_REQUIRED', message: 'Please set a new password first.', error: 'Please set a new password first.' }, { status: 403 });
    }
    const staffOrAccount =
      path.startsWith('/owner') || path.startsWith('/admin') || path === '/barber' || path.startsWith('/barber/') ||
      path.startsWith('/manager') || path.startsWith('/profile') || path.startsWith('/booking') || path.startsWith('/customer') ||
      path === '/staff-login' || path === '/login' || path === '/no-access' || (path.startsWith('/staff') && !path.startsWith('/staff-login'));
    if (staffOrAccount) {
      url.pathname = '/change-password';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // ── The change-password page needs a signed-in person ────────────────────
  if (path === '/change-password' && !session) {
    url.pathname = '/staff-login';
    url.searchParams.set('callbackUrl', '/change-password');
    return NextResponse.redirect(url);
  }

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

    if (path === '/staff-login' && userRole !== 'CUSTOMER') {
      url.pathname = landingFor(userRole, (session.permissions as any[]) || []);
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
        // The token's permissions decide which PAGES open (the APIs re-check the database on every call).
        // A page that is not on the grantable list (Expenses, the Permissions page...) is owner-only.
        const perms = (session.permissions as any[]) || [];
        const pageKey = pageKeyForPath(path);
        const canOpen = !!pageKey && resolveAccess(userRole, perms, pageKey).view;
        if (!canOpen) {
          url.pathname = landingFor(userRole, perms);
          url.search = '';
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
