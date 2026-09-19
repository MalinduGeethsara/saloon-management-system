// Server-side access checks. They read the person's role and permissions FRESH from the database,
// so an owner taking access away (or giving it) takes effect on the very next request; the sign-in
// token is only trusted for "who is this".
import { NextResponse } from 'next/server';
import { db } from './db';
import { createSession, deleteSession, verifySession, type SessionPayload } from './session';
import { Access, AccessAction, PermissionRow, PAGE_KEYS, landingFor, permissionsFingerprint, resolveAnyAccess } from './access';

const STAFF_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'BARBER'];

const PERMISSION_SELECT = { pageKey: true, canView: true, canAdd: true, canEdit: true, canDelete: true } as const;

export interface Authorized {
  session: SessionPayload; // role is the CURRENT role from the database
  access: Access;
  rows: PermissionRow[];
}

// Signed-in staff member with their current role and permission rows (null: not staff / deleted)
async function loadStaff(): Promise<{ session: SessionPayload; role: string; rows: PermissionRow[] } | null> {
  const session = await verifySession();
  if (!session || !STAFF_ROLES.includes(session.role)) return null;
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { role: true, permissions: { where: { pageKey: { in: PAGE_KEYS } }, select: PERMISSION_SELECT } },
  });
  if (!user || !STAFF_ROLES.includes(user.role)) return null;
  return { session: { ...session, role: user.role }, role: user.role, rows: user.permissions };
}

// Rights of the signed-in staff member over `pages` (any one of them counts). null = not staff.
// Use it when the handler needs to look at the rights itself (e.g. barbers see only their own bookings).
export async function getAccess(pages: string | string[]): Promise<Authorized | null> {
  const staff = await loadStaff();
  if (!staff) return null;
  const access = resolveAnyAccess(staff.role, staff.rows, Array.isArray(pages) ? pages : [pages]);
  return { session: staff.session, access, rows: staff.rows };
}

// `pages` = the page(s) whose permission covers this operation (any one of them is enough).
// Returns null when the person is not signed in, no longer exists, or lacks that right.
export async function authorize(pages: string | string[], action: AccessAction): Promise<Authorized | null> {
  const found = await getAccess(pages);
  return found && found.access[action] ? found : null;
}

export const forbidden = (message = 'You do not have permission to do this') => NextResponse.json({ message, error: message }, { status: 403 });

// Sign the person in again with their CURRENT database state (role, permissions, lock flag). Returns the page to
// send them to.
export async function issueSessionFor(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true, role: true, mustChangePassword: true, permissions: { where: { pageKey: { in: PAGE_KEYS } }, select: PERMISSION_SELECT } },
  });
  if (!user) return '/';
  const staff = user.role !== 'CUSTOMER';
  await createSession({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    ...(staff ? { permissions: user.permissions } : {}),
    mustChangePassword: user.mustChangePassword,
  });
  return staff ? landingFor(user.role, user.permissions) : '/profile';
}

// If the owner changed this person's role or permissions since they signed in, re-issue their token now
// (called from the notification poll, so changes reach an open dashboard within seconds, no re-login).
export async function refreshSessionIfStale(session: SessionPayload): Promise<'refreshed' | 'same' | 'gone'> {
  if (session.role === 'CUSTOMER') return 'same';
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, phone: true, role: true, mustChangePassword: true, permissions: { where: { pageKey: { in: PAGE_KEYS } }, select: PERMISSION_SELECT } },
  });
  if (!user) {
    await deleteSession();
    return 'gone';
  }
  const sameFlag = !!user.mustChangePassword === !!session.mustChangePassword;
  const sameRole = user.role === session.role;
  const samePerms = permissionsFingerprint(user.permissions) === permissionsFingerprint(session.permissions as PermissionRow[] | undefined);
  if (sameFlag && sameRole && (samePerms || user.role === 'OWNER' || user.role === 'ADMIN')) return 'same';

  await createSession({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    permissions: user.permissions,
    mustChangePassword: user.mustChangePassword,
  });
  return 'refreshed';
}
