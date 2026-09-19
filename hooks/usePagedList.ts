"use client";

import { useMemo, useState } from 'react';

// Client-side pagination for small, already-loaded lists (card grids, short tables).
// For data that keeps growing (bookings, payments, ...) paginate on the server instead.
export function usePagedList<T>(items: T[], pageSize = 12) {
  const [requestedPage, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Search/filter changes shrink the list — never sit on a page that no longer exists
  const page = Math.min(requestedPage, totalPages);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return { pageItems, page, setPage, pageSize, total: items.length, totalPages };
}
