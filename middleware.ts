import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value; // 'admin', 'owner', 'manager', 'barber', 'customer'
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. PUBLIC ROUTES (No Guard)

  // 2. CUSTOMER ROUTE GUARDS
  const isCustomerPath = path.startsWith('/customer'); 
  
  if (isCustomerPath) {
    if (!token || userRole !== 'customer') {
      url.pathname = '/login'; 
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
  }

  // 3. STAFF / ADMIN ROUTE GUARDS

  const isStaffPath = 
    path.startsWith('/owner') || 
    path.startsWith('/admin') || 
    (path.startsWith('/staff') && !path.startsWith('/staff-login'));

  if (isStaffPath) {
    const validStaffRoles = ['admin', 'owner', 'manager', 'barber'];
    
    // If no token, or they are just a 'customer', kick them to the Staff Login
    if (!token || !validStaffRoles.includes(userRole as string)) {
      url.pathname = '/staff-login'; 
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
  }

  // 4. LOGIN REDIRECTIONS (If already logged in)
  if (token && userRole) {
    
    // If a logged-in user hits the customer login
    if (path === '/login') {
      if (userRole === 'customer') url.pathname = '/customer'; 
      else url.pathname = '/owner'; 
      return NextResponse.redirect(url);
    }

    // If a logged-in user hits the staff login
    if (path === '/staff-login') {
      if (userRole === 'admin') url.pathname = '/admin';
      else if (userRole === 'manager') url.pathname = '/owner/bookings/manage';
      else if (userRole === 'barber') url.pathname = '/owner/calendar';
      else if (userRole === 'owner') url.pathname = '/owner';
      else url.pathname = '/'; 
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/admin') && userRole !== 'admin') {
      url.pathname = '/owner';
      return NextResponse.redirect(url);
    }

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
        const allowed = ['/owner/calendar', '/owner/hr/attendance', '/owner/hr/payroll'];
        if (!allowed.some(route => path.startsWith(route))) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};