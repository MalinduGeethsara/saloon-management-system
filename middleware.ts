import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Export as 'middleware' for backward compatibility
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const url = request.nextUrl.clone();
  const path = url.pathname;

  if (!token && (path === '/' || path.startsWith('/owner') || path.startsWith('/admin') || path.startsWith('/staff'))) {
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  if (token && path === '/login') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (token && userRole) {
    if (path.startsWith('/owner') && userRole !== 'owner') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    if (path.startsWith('/admin') && userRole !== 'admin' && userRole !== 'owner') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// FIX: Export as 'proxy' to satisfy Next.js 16 requirements
export const proxy = middleware;

export const config = {
  matcher: ['/', '/login', '/owner/:path*', '/admin/:path*', '/staff/:path*'],
};