"use client";

import React, { useState } from 'react';
import { Table, Grid, Pagination, Spin, Empty } from 'antd';
import type { TableProps } from 'antd';

type ResponsiveTableProps<T> = TableProps<T> & {
  /**
   * When given, phones (< md) render this card per row instead of a horizontally scrolling table.
   * Row clicks (`onRow().onClick`) and pagination (`pagination`) keep working in card mode.
   */
  renderMobileCard?: (record: T, index: number) => React.ReactNode;
};

// antd Table that behaves on phones: horizontal scroll is on by default, and pages that provide
// `renderMobileCard` get a stacked card list instead of a wide table (much less sideways swiping).
export function ResponsiveTable<T extends object>({
  renderMobileCard,
  scroll,
  pagination,
  ...rest
}: ResponsiveTableProps<T>) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [localPage, setLocalPage] = useState(1);

  const pagCfg = pagination === false ? null : typeof pagination === 'object' ? pagination : {};
  const mergedPagination = pagCfg
    ? {
        showSizeChanger: false,
        showLessItems: true,
        showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total}`,
        ...pagCfg,
      }
    : false;

  if (isMobile && renderMobileCard) {
    const data = (rest.dataSource ?? []) as T[];
    const pageSize = pagCfg?.pageSize ?? 10;
    const controlled = pagCfg?.current !== undefined;
    const current = controlled ? (pagCfg?.current as number) : localPage;
    const total = pagCfg?.total ?? data.length;
    // Controlled (server-paginated) data is already one page; otherwise slice locally
    const rows = !pagCfg || controlled ? data : data.slice((current - 1) * pageSize, current * pageSize);

    return (
      <div>
        {rest.loading && rows.length === 0 ? (
          <div className="flex justify-center py-12"><Spin /></div>
        ) : rows.length === 0 ? (
          <Empty className="py-10" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="flex flex-col gap-3 p-3">
            {rows.map((record, index) => {
              const rowProps = rest.onRow?.(record, index);
              const clickable = typeof rowProps?.onClick === 'function';
              return (
                <div
                  key={typeof rest.rowKey === 'function' ? rest.rowKey(record) : String((record as any)[(rest.rowKey as string) ?? 'key'] ?? index)}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={(e) => rowProps?.onClick?.(e as any)}
                  onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) rowProps?.onClick?.(e as any); }}
                  className={clickable ? 'cursor-pointer active:opacity-80' : undefined}
                >
                  {renderMobileCard(record, index)}
                </div>
              );
            })}
          </div>
        )}

        {pagCfg && total > pageSize && (
          <div className="flex justify-center pb-4">
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              showSizeChanger={false}
              showLessItems
              size="small"
              onChange={(page, size) => {
                if (!controlled) setLocalPage(page);
                pagCfg.onChange?.(page, size);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return <Table<T> scroll={{ x: 'max-content', ...scroll }} pagination={mergedPagination} {...rest} />;
}
