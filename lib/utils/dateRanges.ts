// Month helpers shared by the owner Expenses feature. Months are addressed as "YYYY-MM" keys and
// as { year, monthIndex } where monthIndex is 0-based (same convention as JS Dates and Payroll.month).

export interface MonthRef {
  year: number;
  monthIndex: number;
}

// Sri Lanka is UTC+5:30 all year (no DST). Real timestamps (payments) are bucketed into months as
// the business sees them, independent of whatever timezone the server happens to run in.
const BUSINESS_UTC_OFFSET_MINUTES = 330;

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseMonthKey(key: string | undefined | null): MonthRef | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key ?? '');
  if (!match) return null;
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
}

export function toMonthKey(m: MonthRef): string {
  return `${m.year}-${String(m.monthIndex + 1).padStart(2, '0')}`;
}

export function monthLabel(m: MonthRef): string {
  return `${SHORT_MONTHS[m.monthIndex]} ${m.year}`;
}

export function addMonths(m: MonthRef, delta: number): MonthRef {
  const total = m.year * 12 + m.monthIndex + delta;
  return { year: Math.floor(total / 12), monthIndex: ((total % 12) + 12) % 12 };
}

// [start, end) of a month for values stored as a calendar date at UTC midnight (Expense.date)
export function utcMonthBounds(m: MonthRef): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(m.year, m.monthIndex, 1)),
    end: new Date(Date.UTC(m.year, m.monthIndex + 1, 1)),
  };
}

// [start, end) of a month in Sri Lanka time, for real instants such as Payment.createdAt
export function businessMonthBounds(m: MonthRef): { start: Date; end: Date } {
  const offsetMs = BUSINESS_UTC_OFFSET_MINUTES * 60_000;
  return {
    start: new Date(Date.UTC(m.year, m.monthIndex, 1) - offsetMs),
    end: new Date(Date.UTC(m.year, m.monthIndex + 1, 1) - offsetMs),
  };
}

// The n months ending at (and including) `last`, oldest first
export function lastNMonths(last: MonthRef, n: number): MonthRef[] {
  return Array.from({ length: n }, (_, i) => addMonths(last, i - (n - 1)));
}
