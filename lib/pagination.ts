// Shared server-side pagination helpers. Plain module (no 'use server') so both route handlers and
// server actions can import the helpers and the types.

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

type RawParam = string | number | null | undefined;

function toPositiveInt(value: RawParam): number | null {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

// Clamps untrusted page/pageSize input (query string or action argument) into safe bounds.
export function parsePageParams(
  input: { page?: RawParam; pageSize?: RawParam },
  defaultPageSize = DEFAULT_PAGE_SIZE,
): PageParams {
  const page = toPositiveInt(input.page) ?? 1;
  const pageSize = Math.min(toPositiveInt(input.pageSize) ?? defaultPageSize, MAX_PAGE_SIZE);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

// True when the caller explicitly asked for a page. Endpoints keep their legacy "return
// everything" behaviour otherwise (the barber dashboard and calendar still need the full list).
export function wantsPagination(input: { page?: RawParam }): boolean {
  return toPositiveInt(input.page) !== null;
}

export function toPaginated<T>(items: T[], total: number, params: PageParams): Paginated<T> {
  return { items, total, page: params.page, pageSize: params.pageSize };
}
