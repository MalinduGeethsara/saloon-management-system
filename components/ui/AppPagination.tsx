"use client";

import React from 'react';
import { Pagination } from 'antd';

interface AppPaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}

// Dashboard pager for card grids and lists (tables use antd's own `pagination` prop).
// Renders nothing when everything fits on one page.
export function AppPagination({ current, pageSize, total, onChange, className = '' }: AppPaginationProps) {
  if (total <= pageSize) return null;

  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 ${className}`}>
      <span className="text-xs text-slate-500 font-medium">
        Showing {from}-{to} of {total}
      </span>
      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={onChange}
        showSizeChanger={false}
        showLessItems
        size="small"
      />
    </div>
  );
}
