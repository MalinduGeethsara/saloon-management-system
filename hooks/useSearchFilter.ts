"use client";

import { useMemo, useState } from "react";

// Client-side search over a small list. Every word typed must appear in at least one of the fields
// ("beard oil" finds "Beard Oil", "oil for beard", brand "Beard Co" ...), case-insensitive.
export function matchesQuery(query: string, ...fields: unknown[]): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = fields
    .filter((f) => f !== null && f !== undefined)
    .map((f) => String(f).toLowerCase())
    .join("  ");
  return terms.every((t) => haystack.includes(t));
}

export function useSearchFilter<T>(items: T[], getFields: (item: T) => unknown[], initial = "") {
  const [query, setQuery] = useState(initial);
  const filtered = useMemo(
    () => (query.trim() ? items.filter((item) => matchesQuery(query, ...getFields(item))) : items),
    // getFields is an inline arrow in callers; the list and the query are what change the result
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, query],
  );
  return { query, setQuery, filtered, isSearching: query.trim().length > 0 };
}
