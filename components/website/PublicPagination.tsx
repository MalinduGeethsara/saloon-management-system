"use client";

import React from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

interface PublicPaginationProps {
  current: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

// Pager for the public website (zinc/amber theme, dark-mode aware). Prev/Next plus a compact
// window of page numbers so it fits a 320px phone.
export default function PublicPagination({ current, totalPages, onChange, className = '' }: PublicPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'gap')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }

  const btn = 'h-10 min-w-10 px-3 flex items-center justify-center text-sm font-bold border transition-colors';
  const idle = 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-500';
  const active = 'border-amber-600 bg-amber-600 text-white dark:text-zinc-950';
  const disabled = 'border-zinc-200 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 cursor-not-allowed';

  const go = (p: number) => {
    onChange(p);
    // Keep the user at the top of the list after paging on long pages
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1.5 sm:gap-2 mt-12 md:mt-16 ${className}`}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={current === 1}
        onClick={() => go(current - 1)}
        className={`${btn} ${current === 1 ? disabled : idle}`}
      >
        <LeftOutlined />
      </button>

      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="h-10 flex items-end pb-2 text-zinc-400 select-none">…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Page ${p}`}
            aria-current={p === current ? 'page' : undefined}
            onClick={() => go(p)}
            className={`${btn} ${p === current ? active : idle}`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={current === totalPages}
        onClick={() => go(current + 1)}
        className={`${btn} ${current === totalPages ? disabled : idle}`}
      >
        <RightOutlined />
      </button>
    </nav>
  );
}
