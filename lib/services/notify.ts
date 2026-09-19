// THE place that decides who is told about what, and how.
//
// Every staff notification goes through notify(). POLICY below is the whole rulebook, one line per event:
// which audiences hear about it and on which channels (app = the bell in the dashboard, sms, email).
//
//  - owner    every OWNER account (plus STAFF_SMS_EXTRA_NUMBERS for SMS, OWNER_ALERT_EMAILS for email)
//  - manager  managers who are ALLOWED to see that part of the system (their permissions, read fresh from
//             the database), and, when a manager is assigned to a branch, only that branch's events
//  - barber   the specialist a booking is assigned to
//  - employee the staff member an event is about (their payslip, their attendance, their access)
//
// Fire-and-forget from the caller's point of view: a failing SMS/email is logged and never breaks the
// booking/payment that triggered it. Bell rows can be written inside the caller's transaction
// (notifyInTx), so they can never be lost between "money taken" and "owner told".
import type { PrismaClient } from '@prisma/client';
import { db } from '../db';
import { PAGE_KEYS, resolveAnyAccess, type PermissionRow } from '../access';
import { linkFor, type NotificationRef } from '../notification-links';
import { normalizePhone } from '../utils/phone';
import { realEmail } from '../utils/real-email';
import { sendSms } from './sms.service';
import { sendOwnerAlert } from './email.service';

export type NotifyEvent =
  | 'BOOKING_REQUESTED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_FAILED'
  | 'ORDER_PLACED'
  | 'STOCK_LOW'
  | 'STOCK_OUT'
  | 'PAYMENT_ALERT'
  | 'PAYSLIP_PAID'
  | 'ATTENDANCE_RECORDED'
  | 'ACCESS_CHANGED'
  | 'PASSWORD_CHANGED';

type Channel = 'app' | 'sms' | 'email';
type Audience = 'owner' | 'manager' | 'barber' | 'employee';

interface Rule {
  // A manager is only told when they may view at least one of these pages
  pages?: string[];
  owner?: Channel[];
  manager?: Channel[];
  barber?: Channel[];
  employee?: Channel[];
}

const BOOKING_PAGES = ['/owner/bookings/manage', '/owner/calendar'];

export const POLICY: Record<NotifyEvent, Rule> = {
  // A customer started a booking that is still waiting for payment
  BOOKING_REQUESTED: { pages: BOOKING_PAGES, owner: ['app', 'sms', 'email'], manager: ['app', 'sms'], barber: ['app', 'sms'] },
  // Paid online, or created/accepted by the salon
  BOOKING_CONFIRMED: { pages: BOOKING_PAGES, owner: ['app', 'sms', 'email'], manager: ['app', 'sms'], barber: ['app', 'sms', 'email'] },
  BOOKING_CANCELLED: { pages: BOOKING_PAGES, owner: ['app', 'sms', 'email'], manager: ['app', 'sms'], barber: ['app', 'sms', 'email'] },
  // The customer's payment failed / was abandoned and the slot was released
  PAYMENT_FAILED: { pages: [...BOOKING_PAGES, '/owner/payments'], owner: ['app', 'sms'], manager: ['app', 'sms'], barber: ['app'] },
  // A product sold or ordered
  ORDER_PLACED: { pages: ['/owner/orders'], owner: ['app', 'email'], manager: ['app'] },
  STOCK_LOW: { pages: ['/owner/products', '/owner/services'], owner: ['app', 'sms'], manager: ['app', 'sms'] },
  STOCK_OUT: { pages: ['/owner/products', '/owner/services'], owner: ['app', 'sms', 'email'], manager: ['app', 'sms'] },
  // Money problems that need somebody to act (refund needed, oversold, amount mismatch, chargeback)
  PAYMENT_ALERT: { pages: ['/owner/payments'], owner: ['app', 'sms', 'email'], manager: ['app', 'sms'] },
  // Things that are about ONE staff member
  PAYSLIP_PAID: { employee: ['app', 'sms'] },
  ATTENDANCE_RECORDED: { employee: ['app'] },
  ACCESS_CHANGED: { employee: ['app'] },
  PASSWORD_CHANGED: { employee: ['email'] }, // a security notice to the account holder's mailbox (no pop-up: they just did it)
};

export interface NotifyInput {
  event: NotifyEvent;
  title: string;
  desc: string;
  descFor?: Partial<Record<Audience, string>>; // wording for one audience (e.g. "assigned to you" for the barber)
  sms?: string;
  // Email content; the button goes to the record itself for whoever opens it
  // (a third item 'noBarber' keeps a row, e.g. money, out of the emails to barbers and other employees)
  email?: { subject: string; heading: string; intro?: string; rows: ([string, string] | [string, string, 'noBarber'])[]; urgent?: boolean };
  ref?: { type: NotificationRef; id: string };
  shopId?: string | null; // a manager assigned to a different branch is not told
  barberId?: string | null; // the assigned specialist
  employeeIds?: string[]; // the staff member(s) this is about
  actorId?: string | null; // whoever did it: they get the bell but no SMS/email about their own action
}

type Client = Pick<PrismaClient, 'user' | 'notification'>;

interface Recipient {
  id: string;
  role: string;
  name: string;
  phone: string | null;
  email: string | null;
  rows: PermissionRow[];
  channels: Set<Channel>;
  audience: Audience;
  text: string;
}

export interface NotifyPlan {
  input: NotifyInput;
  recipients: Recipient[];
  extraSms: string[];
  extraEmails: string[];
}

const csv = (value: string | undefined) => (value || '').split(',').map((v) => v.trim()).filter(Boolean);
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');

function safe<T>(label: string, promise: Promise<T>) {
  promise.catch((err) => console.error(`[Notify] ${label} failed silently:`, err));
}

// Who hears about this event, and on which channels
export async function planNotification(input: NotifyInput, client: Client = db): Promise<NotifyPlan> {
  const rule = POLICY[input.event];
  const ids = [input.barberId, ...(input.employeeIds || [])].filter((v): v is string => !!v);

  const users = await client.user.findMany({
    where: { OR: [{ role: { in: ['OWNER', 'MANAGER'] } }, ...(ids.length ? [{ id: { in: ids } }] : [])] },
    select: {
      id: true, role: true, name: true, phone: true, email: true, shopId: true,
      permissions: { where: { pageKey: { in: PAGE_KEYS } }, select: { pageKey: true, canView: true, canAdd: true, canEdit: true, canDelete: true } },
    },
  });

  const byId = new Map<string, Recipient>();
  const add = (u: (typeof users)[number], audience: Audience, channels: Channel[] | undefined) => {
    if (!channels || channels.length === 0) return;
    let r = byId.get(u.id);
    if (!r) {
      r = { id: u.id, role: u.role, name: u.name, phone: u.phone, email: u.email, rows: u.permissions, channels: new Set(), audience, text: '' };
      byId.set(u.id, r);
    }
    channels.forEach((c) => r!.channels.add(c));
    // an owner who is also the assigned barber is still addressed as the owner
    if (audience === 'owner' || (audience === 'manager' && r.audience !== 'owner')) r.audience = audience;
    r.text = input.descFor?.[audience] ?? (r.text || input.desc);
  };

  for (const u of users) {
    if (u.role === 'OWNER') add(u, 'owner', rule.owner);
    else if (u.role === 'MANAGER' && rule.manager) {
      const mayKnow = !rule.pages || resolveAnyAccess('MANAGER', u.permissions, rule.pages).view;
      const myBranch = !input.shopId || !u.shopId || u.shopId === input.shopId;
      if (mayKnow && myBranch) add(u, 'manager', rule.manager);
    }
  }
  if (input.barberId) {
    const u = users.find((x) => x.id === input.barberId);
    if (u) add(u, 'barber', rule.barber);
    else {
      const barber = await client.user.findUnique({ where: { id: input.barberId }, select: { id: true, role: true, name: true, phone: true, email: true, shopId: true, permissions: { where: { pageKey: { in: PAGE_KEYS } }, select: { pageKey: true, canView: true, canAdd: true, canEdit: true, canDelete: true } } } });
      if (barber && barber.role !== 'CUSTOMER') add(barber, 'barber', rule.barber);
    }
  }
  for (const id of input.employeeIds || []) {
    const u = users.find((x) => x.id === id);
    if (u) add(u, 'employee', rule.employee);
    else {
      const emp = await client.user.findUnique({ where: { id }, select: { id: true, role: true, name: true, phone: true, email: true, shopId: true, permissions: { where: { pageKey: { in: PAGE_KEYS } }, select: { pageKey: true, canView: true, canAdd: true, canEdit: true, canDelete: true } } } });
      if (emp && emp.role !== 'CUSTOMER') add(emp, 'employee', rule.employee);
    }
  }

  // Never text or email people about what they just did themselves (they still get the bell)
  if (input.actorId) byId.get(input.actorId)?.channels.delete('sms');
  if (input.actorId) byId.get(input.actorId)?.channels.delete('email');
  const actorIsOwner = !!input.actorId && users.some((u) => u.id === input.actorId && u.role === 'OWNER');

  const owner = rule.owner || [];
  return {
    input,
    recipients: Array.from(byId.values()),
    // the shared salon phone / extra mailboxes count as "the owner"
    extraSms: owner.includes('sms') && !actorIsOwner ? csv(process.env.STAFF_SMS_EXTRA_NUMBERS) : [],
    extraEmails: owner.includes('email') && !actorIsOwner ? csv(process.env.OWNER_ALERT_EMAILS) : [],
  };
}

// Writes the bell rows (pass the caller's transaction client to make them part of it)
export async function writeBellRows(plan: NotifyPlan, client: Client = db) {
  const rows = plan.recipients.filter((r) => r.channels.has('app'));
  if (rows.length === 0) return;
  await client.notification.createMany({
    data: rows.map((r) => ({
      userId: r.id,
      title: plan.input.title,
      desc: r.text || plan.input.desc,
      read: false,
      refType: plan.input.ref?.type ?? null,
      refId: plan.input.ref?.id ?? null,
    })),
  });
}

// SMS + email, fire-and-forget. Call after the transaction committed.
export function sendChannels(plan: NotifyPlan) {
  const { input } = plan;

  if (input.sms) {
    const sent = new Set<string>();
    const numbers = [...plan.recipients.filter((r) => r.channels.has('sms')).map((r) => r.phone), ...plan.extraSms];
    for (const number of numbers) {
      if (!number) continue;
      const key = normalizePhone(number); // "+94771234567", "0771234567" and "771234567" are one person
      if (!key || sent.has(key)) continue;
      sent.add(key);
      safe('staff SMS', sendSms(number, input.sms));
    }
  }

  if (input.email) {
    const email = input.email;
    const rowsFor = (r: Pick<Recipient, 'audience'>): [string, string][] =>
      email.rows.filter((row) => !(row[2] === 'noBarber' && (r.audience === 'barber' || r.audience === 'employee'))).map((row) => [row[0], row[1]]);
    const linkTo = (r: Pick<Recipient, 'role' | 'rows'>) => {
      const path = input.ref ? linkFor(input.ref.type, input.ref.id, r.role, r.rows) : null;
      return path ? `${appUrl()}${path}` : undefined;
    };

    // Owners: one email to all of them (they run the business together)
    const owners = plan.recipients.filter((r) => r.channels.has('email') && r.role === 'OWNER');
    const ownerEmails = Array.from(new Set([...owners.map((o) => realEmail(o.email)), ...plan.extraEmails].filter((e): e is string => !!e).map((e) => e.toLowerCase())));
    if (ownerEmails.length) {
      safe('owner email', sendOwnerAlert(ownerEmails, { ...email, rows: rowsFor({ audience: 'owner' }), audience: 'owner', actionUrl: linkTo({ role: 'OWNER', rows: [] }), actionLabel: 'Open in dashboard' }));
    }
    // Managers and barbers: one email each, with a button that opens the record for THEM
    for (const r of plan.recipients.filter((x) => x.channels.has('email') && x.role !== 'OWNER')) {
      const to = realEmail(r.email);
      if (!to) continue;
      safe('staff email', sendOwnerAlert([to], { ...email, rows: rowsFor(r), audience: 'staff', actionUrl: linkTo(r), actionLabel: 'Open in dashboard' }));
    }
  }
}

// Plan + bell rows + SMS/email, when there is no transaction to take part in
export async function notify(input: NotifyInput) {
  try {
    const plan = await planNotification(input);
    await writeBellRows(plan);
    sendChannels(plan);
  } catch (err) {
    console.error('[Notify] notification failed silently:', err);
  }
}

// Same, but the bell rows are written with the caller's transaction client. Returns the plan: call
// sendChannels(plan) once the transaction has committed.
export async function notifyInTx(input: NotifyInput, tx: Client): Promise<NotifyPlan> {
  const plan = await planNotification(input, tx);
  await writeBellRows(plan, tx);
  return plan;
}

// ─── Notices about one staff member ──────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '/owner': 'Intelligence', '/owner/calendar': 'Calendar', '/owner/bookings/manage': 'Bookings', '/owner/staff': 'Staff Members',
  '/owner/shops': 'Shops', '/owner/services': 'Services', '/owner/products': 'Products', '/owner/payments': 'Payments',
  '/owner/orders': 'Orders', '/owner/reports': 'Reports', '/owner/hr/attendance': 'HR & Attendance', '/owner/hr/payroll': 'Payroll',
};

// The owner changed someone's permissions: tell them what they can now use / lost
export async function notifyAccessChanged(userId: string, role: string, before: PermissionRow[], after: PermissionRow[], byName?: string) {
  try {
    const gained: string[] = [];
    const lost: string[] = [];
    for (const key of PAGE_KEYS) {
      const was = resolveAnyAccess(role, before, [key]);
      const now = resolveAnyAccess(role, after, [key]);
      if (!was.view && now.view) gained.push(PAGE_LABELS[key] || key);
      else if (was.view && !now.view) lost.push(PAGE_LABELS[key] || key);
    }
    const parts: string[] = [];
    if (gained.length) parts.push(`You can now use: ${gained.join(', ')}.`);
    if (lost.length) parts.push(`No longer available: ${lost.join(', ')}.`);
    if (parts.length === 0) parts.push('The actions you can take on your pages (add, edit, delete) were updated.');
    await notify({
      event: 'ACCESS_CHANGED',
      title: 'Your Access Was Updated',
      desc: `${byName ? `${byName} updated your permissions. ` : ''}${parts.join(' ')}`,
      employeeIds: [userId],
      ref: { type: 'ACCESS', id: userId },
    });
  } catch (err) {
    console.error('[Notify] access-changed notice failed silently:', err);
  }
}
