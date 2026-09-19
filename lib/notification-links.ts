// Where clicking a notification (or the button in an email) should take someone, based on WHAT it is about and
// what THEY are allowed to open. Pure functions, so the bell (browser) and the emails (server) agree.
import { landingFor, resolveAccess, type PermissionRow } from './access';

export type NotificationRef = 'BOOKING' | 'ORDER' | 'PRODUCT' | 'PAYROLL' | 'ATTENDANCE' | 'ACCESS';

const enc = encodeURIComponent;

export function linkFor(refType: string | null | undefined, refId: string | null | undefined, role: string | null | undefined, rows: PermissionRow[] | null | undefined): string | null {
  const can = (page: string) => resolveAccess(role, rows, page).view;
  const id = refId ? enc(refId) : '';

  switch (refType) {
    case 'BOOKING':
      if (role === 'BARBER' && !can('/owner/bookings/manage')) return id ? `/barber?booking=${id}` : '/barber';
      if (can('/owner/bookings/manage')) return id ? `/owner/bookings/manage?booking=${id}` : '/owner/bookings/manage';
      if (can('/owner/calendar')) return '/owner/calendar';
      return can('/owner/payments') ? '/owner/payments' : null; // money alerts for someone who only has Payments
    case 'ORDER':
      return can('/owner/orders') ? (id ? `/owner/orders?order=${id}` : '/owner/orders') : null;
    case 'PRODUCT':
      if (can('/owner/products')) return id ? `/owner/products?product=${id}` : '/owner/products';
      return can('/owner/services') ? '/owner/services' : null;
    case 'PAYROLL':
      if (role === 'BARBER') return '/barber/earnings';
      return can('/owner/hr/payroll') ? '/owner/hr/payroll' : null;
    case 'ACCESS': {
      const landing = landingFor(role, rows);
      return landing === '/no-access' ? null : landing;
    }
    case 'ATTENDANCE':
    default:
      return null;
  }
}
