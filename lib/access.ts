// One definition of "who may do what" for the staff dashboard. Pure functions, no imports: the edge
// middleware, the sidebar, the pages and the API routes all use exactly the same rules.
//
//  - OWNER and ADMIN can do everything.
//  - MANAGER and BARBER accounts only get what the owner tick-boxed on the Permissions page
//    (one row per page: view / add / edit / delete).
//  - A page with NO row for that person falls back to ROLE_DEFAULTS (view-only working pages). An explicit row
//    always wins, so the owner can also take a default away by un-ticking "View".
//  - Anything that is not a grantable page (Expenses, the Permissions page itself...) is owner-only.

export type AccessAction = 'view' | 'add' | 'edit' | 'delete';

export interface PermissionRow {
  pageKey: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Rights {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type Access = Rights & { source: 'role' | 'row' | 'default' | 'none' };

// The pages the owner can hand out, and what each one covers. The Permissions page is built from this list.
export const GRANTABLE_PAGES: { key: string; label: string; covers: string }[] = [
  { key: '/owner', label: 'Intelligence', covers: 'Dashboard numbers and charts' },
  { key: '/owner/calendar', label: 'Calendar', covers: 'The booking calendar (add/edit/cancel bookings)' },
  { key: '/owner/bookings/manage', label: 'Bookings', covers: 'All bookings: confirm, edit, complete, cancel' },
  { key: '/owner/staff', label: 'Staff Members', covers: 'Barber accounts only (never owners or managers)' },
  { key: '/owner/shops', label: 'Shops', covers: 'Branches and their opening hours' },
  { key: '/owner/services', label: 'Services', covers: 'Services and products catalogue' },
  { key: '/owner/products', label: 'Products', covers: 'Products and stock' },
  { key: '/owner/payments', label: 'Payments', covers: 'Payment history and walk-in bills' },
  { key: '/owner/orders', label: 'Orders', covers: 'Product orders and pickups' },
  { key: '/owner/reports', label: 'Reports', covers: 'Sales and booking reports' },
  { key: '/owner/hr/attendance', label: 'HR & Attendance', covers: 'Staff attendance and manual entries' },
  { key: '/owner/hr/payroll', label: 'Payroll', covers: 'Salaries, commissions and payslips' },
];

export const PAGE_KEYS = GRANTABLE_PAGES.map((p) => p.key);

const NONE: Rights = { view: false, add: false, edit: false, delete: false };
const VIEW: Rights = { view: true, add: false, edit: false, delete: false };
const FULL: Rights = { view: true, add: true, edit: true, delete: true };

// What a role may open without any permission row (their everyday, read-only pages)
export const ROLE_DEFAULTS: Record<string, Record<string, Rights>> = {
  MANAGER: {
    '/owner/calendar': VIEW,
    '/owner/bookings/manage': VIEW,
    '/owner/hr/attendance': VIEW,
  },
  BARBER: {
    '/owner/calendar': VIEW, // their own bookings only
  },
};

export function resolveAccess(role: string | null | undefined, rows: PermissionRow[] | null | undefined, pageKey: string): Access {
  if (role === 'OWNER' || role === 'ADMIN') return { ...FULL, source: 'role' };
  if (!role || role === 'CUSTOMER') return { ...NONE, source: 'none' };

  const row = (rows || []).find((r) => r.pageKey === pageKey);
  if (row) {
    const view = !!row.canView;
    // add/edit/delete never work without view
    return { view, add: view && !!row.canAdd, edit: view && !!row.canEdit, delete: view && !!row.canDelete, source: 'row' };
  }
  const fallback = ROLE_DEFAULTS[role]?.[pageKey];
  return fallback ? { ...fallback, source: 'default' } : { ...NONE, source: 'none' };
}

// Which grantable page a URL belongs to (segment-safe, longest match). null = not grantable = owner-only.
export function pageKeyForPath(path: string): string | null {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/owner') return '/owner';
  if (/^\/owner\/staff\/[^/]+\/permissions$/.test(clean)) return null; // only the owner hands out access
  let best: string | null = null;
  for (const key of PAGE_KEYS) {
    if (key === '/owner') continue;
    if ((clean === key || clean.startsWith(key + '/')) && (!best || key.length > best.length)) best = key;
  }
  return best;
}

// Best page to send someone to when they open something they may not see
const LANDING_ORDER = ['/owner/bookings/manage', '/owner', '/owner/calendar', '/owner/orders', '/owner/payments', '/owner/products', '/owner/services', '/owner/hr/attendance', '/owner/shops', '/owner/reports', '/owner/staff', '/owner/hr/payroll'];

export function landingFor(role: string | null | undefined, rows: PermissionRow[] | null | undefined): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'OWNER') return '/owner';
  if (role === 'BARBER') return '/barber';
  for (const key of LANDING_ORDER) {
    if (resolveAccess(role, rows, key).view) return key;
  }
  return '/no-access';
}

// Rights over ANY of several pages (e.g. the calendar and the bookings page both work on bookings)
export function resolveAnyAccess(role: string | null | undefined, rows: PermissionRow[] | null | undefined, pageKeys: string[]): Access {
  let best: Access = { ...NONE, source: 'none' };
  for (const key of pageKeys) {
    const a = resolveAccess(role, rows, key);
    if (a.view && !best.view) best = { ...a };
    else if (a.view) best = { ...best, add: best.add || a.add, edit: best.edit || a.edit, delete: best.delete || a.delete, source: best.source === 'row' || a.source === 'row' ? 'row' : best.source };
  }
  return best;
}

export function hasAnyPageView(role: string | null | undefined, rows: PermissionRow[] | null | undefined): boolean {
  return PAGE_KEYS.some((key) => resolveAccess(role, rows, key).view);
}

// Stable text for "did the permissions change?" comparisons
export function permissionsFingerprint(rows: PermissionRow[] | null | undefined): string {
  return (rows || [])
    .filter((r) => PAGE_KEYS.includes(r.pageKey))
    .map((r) => `${r.pageKey}:${r.canView ? 1 : 0}${r.canAdd ? 1 : 0}${r.canEdit ? 1 : 0}${r.canDelete ? 1 : 0}`)
    .sort()
    .join('|');
}
