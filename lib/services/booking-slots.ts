// Everything that decides whether a barber is free at a given time. Used by BOTH booking paths
// (customer checkout and staff manual booking) so they cannot disagree about availability.
import type { Prisma } from '@prisma/client';

// A checkout that is started but not paid holds the slot for this long, then it is free again
export const PENDING_HOLD_MS = 25 * 60 * 1000;

// The time slots the public booking wizard offers (kept in step with app/(website)/booking/page.tsx)
export const SLOT_GRID = ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '01:00 PM', '01:45 PM', '02:30 PM', '04:00 PM'];
export const DEFAULT_SLOT_MINUTES = 45;
export const DEFAULT_SERVICE_MINUTES = 30;
export const MAX_BOOKING_HORIZON_DAYS = 120;

// "2026-09-21" + "10:30 AM" (or "14:30") -> local Date, or null when it is not a real date/time
export function parseBookingDateTime(dateStr: unknown, timeStr: unknown): Date | null {
  if (typeof dateStr !== 'string' || typeof timeStr !== 'string') return null;
  const d = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!d) return null;
  let hours: number;
  let minutes: number;
  const t12 = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const t24 = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (t12) {
    hours = Number(t12[1]);
    minutes = Number(t12[2]);
    if (hours < 1 || hours > 12) return null;
    const pm = t12[3].toUpperCase() === 'PM';
    hours = (hours % 12) + (pm ? 12 : 0);
  } else if (t24) {
    hours = Number(t24[1]);
    minutes = Number(t24[2]);
  } else {
    return null;
  }
  if (hours > 23 || minutes > 59) return null;
  const year = Number(d[1]);
  const month = Number(d[2]);
  const day = Number(d[3]);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  // rejects 2026-02-31 and friends (JS would silently roll them over)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function totalDurationMinutes(services: { duration?: number | null }[]): number {
  const sum = services.reduce((acc, s) => acc + (s.duration || DEFAULT_SERVICE_MINUTES), 0);
  return sum || DEFAULT_SERVICE_MINUTES;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Opening hours ────────────────────────────────────────────────────────────
// Shop.operatingHours is JSON like { Monday: { open: "09:00", close: "18:00", isClosed: false }, ... }.
// The helpers below are used by BOTH the booking page (to show hours, grey out closed days and hide
// times the branch is closed for) and the server (which refuses such a booking), so they always agree.

export interface ShopHoursInfo { name?: string | null; status?: string | null; operatingHours?: unknown }
interface DaySchedule { open?: string; close?: string; isClosed?: boolean }

function scheduleFor(shop: ShopHoursInfo | null | undefined, date: Date): DaySchedule | null {
  const hours = shop?.operatingHours;
  if (!hours || typeof hours !== 'object') return null;
  const day = (hours as Record<string, DaySchedule>)[DAY_NAMES[date.getDay()]];
  return day && typeof day === 'object' ? day : null;
}

export function isShopTemporarilyClosed(shop: ShopHoursInfo | null | undefined): boolean {
  return shop?.status === 'Closed' || shop?.status === 'Renovating';
}

// Is the branch open at all on this calendar day? (Shops without hours configured are treated as open.)
export function isShopOpenOnDay(shop: ShopHoursInfo | null | undefined, date: Date): boolean {
  if (!shop || isShopTemporarilyClosed(shop)) return false;
  const schedule = scheduleFor(shop, date);
  return !schedule?.isClosed;
}

const toMinutes = (hhmm: string | undefined) => {
  const m = hhmm?.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

// Does a visit of `durationMinutes` starting at `start` fit between opening and closing time?
export function fitsOpeningHours(shop: ShopHoursInfo | null | undefined, start: Date, durationMinutes = 0): boolean {
  if (!isShopOpenOnDay(shop, start)) return false;
  const schedule = scheduleFor(shop, start);
  const open = toMinutes(schedule?.open);
  const close = toMinutes(schedule?.close);
  if (open === null || close === null) return true;
  const from = start.getHours() * 60 + start.getMinutes();
  return from >= open && from + durationMinutes <= close;
}

export function formatClock(hhmm: string | undefined): string {
  const mins = toMinutes(hhmm);
  if (mins === null) return '';
  const h24 = Math.floor(mins / 60);
  const minutes = mins % 60;
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

// "Mon-Sat 9:00 AM - 6:00 PM · Closed Sun" (consecutive days with the same hours are grouped)
export function summarizeOpeningHours(shop: ShopHoursInfo | null | undefined): string {
  const hours = shop?.operatingHours;
  if (!hours || typeof hours !== 'object') return '';
  const order = [1, 2, 3, 4, 5, 6, 0]; // Monday first
  const label = (i: number) => {
    const d = (hours as Record<string, DaySchedule>)[DAY_NAMES[i]];
    return !d ? 'unset' : d.isClosed ? 'closed' : `${formatClock(d.open)} - ${formatClock(d.close)}`;
  };
  const groups: { days: number[]; text: string }[] = [];
  for (const i of order) {
    const text = label(i);
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.days.push(i);
    else groups.push({ days: [i], text });
  }
  const parts: string[] = [];
  const closedDays: string[] = [];
  for (const g of groups) {
    if (g.text === 'unset') continue;
    const names = g.days.length > 1 ? `${DAY_SHORT[g.days[0]]}-${DAY_SHORT[g.days[g.days.length - 1]]}` : DAY_SHORT[g.days[0]];
    if (g.text === 'closed') closedDays.push(names);
    else parts.push(`${names} ${g.text}`);
  }
  if (closedDays.length) parts.push(`Closed ${closedDays.join(', ')}`);
  return parts.join(' · ');
}

// Today's hours for a branch card: "Open today 9:00 AM - 6:00 PM" / "Closed today"
export function todayHoursLabel(shop: ShopHoursInfo | null | undefined, now = new Date()): string {
  if (isShopTemporarilyClosed(shop)) return `Temporarily ${String(shop?.status).toLowerCase()}`;
  const schedule = scheduleFor(shop, now);
  if (!schedule) return '';
  if (schedule.isClosed) return 'Closed today';
  return `Open today ${formatClock(schedule.open)} - ${formatClock(schedule.close)}`;
}

// Is the branch open for a visit starting at `start`? Returns an error message, or null when fine.
export function shopClosedReason(shop: ShopHoursInfo | null, start: Date, durationMinutes = 0): string | null {
  if (!shop) return 'That branch was not found.';
  const name = shop.name || 'This branch';
  if (isShopTemporarilyClosed(shop)) return `${name} is currently ${shop.status}.`;
  const dayName = DAY_NAMES[start.getDay()];
  if (!isShopOpenOnDay(shop, start)) return `${name} is closed on ${dayName}s.`;
  if (!fitsOpeningHours(shop, start, durationMinutes)) {
    const schedule = scheduleFor(shop, start);
    return `${name} is open ${formatClock(schedule?.open)} - ${formatClock(schedule?.close)} on ${dayName}s, so that visit does not fit.`;
  }
  return null;
}

// Serialises everybody who is booking the same barber: the row lock is held until the surrounding
// transaction ends, so "check for a clash, then insert" cannot interleave with another customer's.
export async function lockBarber(tx: Pick<Prisma.TransactionClient, '$queryRaw'>, barberId: string) {
  await tx.$queryRaw`SELECT id FROM User WHERE id = ${barberId} FOR UPDATE`;
}

async function bookingsThatBlock(tx: Pick<Prisma.TransactionClient, 'booking'>, barberId: string, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const rows = await tx.booking.findMany({
    where: {
      barberId,
      date: { gte: dayStart, lte: dayEnd },
      // confirmed/completed always block; an unpaid checkout only holds the slot briefly
      OR: [
        { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        { status: 'PENDING', createdAt: { gte: new Date(Date.now() - PENDING_HOLD_MS) } },
      ],
    },
    select: { id: true, date: true, services: { select: { service: { select: { duration: true } } } } },
  });
  return rows.map((b) => ({
    id: b.id,
    start: b.date,
    end: new Date(b.date.getTime() + totalDurationMinutes(b.services.map((bs) => ({ duration: bs.service?.duration }))) * 60000),
  }));
}

// Does [start, start + duration) run into another live booking of this barber?
export async function hasSlotConflict(
  tx: Pick<Prisma.TransactionClient, 'booking'>,
  opts: { barberId: string; start: Date; durationMinutes: number; excludeBookingId?: string },
): Promise<boolean> {
  const end = new Date(opts.start.getTime() + opts.durationMinutes * 60000);
  const existing = await bookingsThatBlock(tx, opts.barberId, opts.start);
  return existing.some((e) => e.id !== opts.excludeBookingId && opts.start < e.end && end > e.start);
}

// The wizard's grid slots that a booking of `durationMinutes` cannot use on `dateStr` (YYYY-MM-DD)
export async function unavailableGridSlots(
  db: Pick<Prisma.TransactionClient, 'booking'>,
  barberId: string,
  dateStr: string,
  durationMinutes = DEFAULT_SLOT_MINUTES,
): Promise<string[]> {
  const day = parseBookingDateTime(dateStr, '12:00 AM');
  if (!day) return [];
  const existing = await bookingsThatBlock(db, barberId, day);
  const blocked: string[] = [];
  for (const label of SLOT_GRID) {
    const start = parseBookingDateTime(dateStr, label)!;
    const end = new Date(start.getTime() + durationMinutes * 60000);
    if (existing.some((e) => start < e.end && end > e.start)) blocked.push(label);
  }
  return blocked;
}
