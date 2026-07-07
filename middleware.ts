import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Decrypt and verify the session properly
  const session = token ? await decrypt(token) : null;
  const userRole = session?.role; // 'ADMIN', 'OWNER', 'MANAGER', 'BARBER', 'CUSTOMER'

  const isCustomerPath = path.startsWith('/customer') || path.startsWith('/profile') || path.startsWith('/booking');
  
  if (isCustomerPath) {
    if (!session) {
      url.pathname = '/login'; 
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
  }

  const isStaffPath = 
    path.startsWith('/owner') || 
    path.startsWith('/admin') || 
    (path.startsWith('/staff') && !path.startsWith('/staff-login'));

  if (isStaffPath) {
    if (!session || session.role === 'CUSTOMER') {
      url.pathname = '/staff-login'; 
      url.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(url);
    }
  }

  if (session && userRole) {
    if (path === '/login') {
      if (userRole === 'CUSTOMER') url.pathname = '/profile'; 
      else url.pathname = '/owner'; 
      return NextResponse.redirect(url);
    }

    if (path === '/staff-login') {
      if (userRole === 'ADMIN') url.pathname = '/admin';
      else url.pathname = '/owner';
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/admin') && userRole !== 'ADMIN') {
      url.pathname = '/owner';
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/owner')) {
      if (userRole === 'ADMIN') {
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
      
      // Dynamic permissions for custom staff roles
      if (userRole !== 'OWNER') {
        const allowed = (session.permissions as any[]) || [];
        
        // Allow base /owner path just in case, otherwise check if they are trying to access a specific page
        if (path !== '/owner' && !allowed.some(perm => path.startsWith(perm.pageKey) && perm.canView)) {
          url.pathname = '/owner'; 
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