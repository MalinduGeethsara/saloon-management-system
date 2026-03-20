import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const path = request.nextUrl.pathname;

  const isProtectedRoute = 
    path === '/' || 
    path.startsWith('/owner') || 
    path.startsWith('/admin') ||
    path.startsWith('/staff');

  const isLoginPage = path === '/login';

  // 1. Unauthenticated users trying to access protected routes -> send to Login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users trying to view the login page -> send to Portal
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Strict Role-Based Access Control (RBAC)
  if (token && userRole) {
    // Prevent non-owners from accessing Owner pages
    if (path.startsWith('/owner') && userRole !== 'owner') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Prevent Staff from accessing Admin pages
    if (path.startsWith('/admin') && userRole !== 'admin' && userRole !== 'owner') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/owner/:path*', '/admin/:path*', '/staff/:path*', '/login'],
};