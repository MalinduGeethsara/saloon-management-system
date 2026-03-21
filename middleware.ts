import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value; // 'admin', 'owner', 'manager', 'barber'
  const url = request.nextUrl.clone();
  const path = url.pathname;


  const isProtectedPath = path === '/' || path.startsWith('/owner') || path.startsWith('/admin') || path.startsWith('/staff');
  
  if (!token && isProtectedPath) {
    url.pathname = '/login';
    if (path !== '/') url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  if (token && userRole && (path === '/login' || path === '/')) {
    if (userRole === 'admin') url.pathname = '/admin';
    else if (userRole === 'manager') url.pathname = '/owner/bookings/manage';
    else if (userRole === 'barber') url.pathname = '/owner/calendar';
    else url.pathname = '/owner'; // Default for Owner
    
    return NextResponse.redirect(url);
  }

  if (token && userRole) {
    
    // Admin Guard
    if (path.startsWith('/admin') && userRole !== 'admin') {
      url.pathname = '/owner';
      return NextResponse.redirect(url);
    }

    // Owner / Staff Guards
    if (path.startsWith('/owner')) {
      if (userRole === 'admin') {
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }

      if (userRole === 'manager') {
        const allowed = ['/owner/bookings/manage', '/owner/calendar', '/owner/services', '/owner/payments', '/owner/products'];
        if (!allowed.some(route => path.startsWith(route))) {
          url.pathname = '/owner/bookings/manage'; 
          return NextResponse.redirect(url);
        }
      }

      if (userRole === 'barber') {
        const allowedBarberRoutes = [
          '/owner/calendar', 
          '/owner/hr/attendance/1', 
          '/owner/hr/payroll/EMP-001' 
        ];
        
        const isAllowed = allowedBarberRoutes.some(route => path.startsWith(route));
        if (!isAllowed) {
          url.pathname = '/owner/calendar';
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return NextResponse.next();
}

export const proxy = middleware;

export const config = {
  matcher: ['/', '/login', '/owner/:path*', '/admin/:path*', '/staff/:path*'],
};