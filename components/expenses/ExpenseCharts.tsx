"use client";

import React from 'react';
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_AXIS_STYLE, ChartTooltip } from '@/components/reports/chartTheme';
import { formatCurrency } from '@/lib/utils';
import { SPEND_GROUPS, type MonthSummary } from '@/lib/expense-categories';

// Selected month = brand purple, comparison month = muted slate (emphasis vs. context). Identity is
// never colour-alone: the legend, tooltips and the "Table" view all carry the labels and values.
export const COMPARE_COLORS = { selected: '#7C4DFF', compare: '#94a3b8' } as const;
const REVENUE_LINE = '#0f172a';
const SURFACE = '#ffffff';

const compactMoney = (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v));

export function ChartLegend({ items }: { items: { label: string; color: string; line?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs text-slate-600">
      {items.map(i => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          {i.line ? (
            <span className="inline-block w-4 h-0.5 rounded" style={{ backgroundColor: i.color }} />
          ) : (
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: i.color }} />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

function moneyTooltip(active?: boolean, label?: string | number, payload?: readonly any[]) {
  return (
    <ChartTooltip
      active={active}
      label={label}
      payload={payload?.map(p => ({ name: String(p.name), value: Number(p.value), color: p.color ?? p.stroke }))}
      formatter={(name, value) => `${name}: ${formatCurrency(value)}`}
    />
  );
}

// Grouped bars: each spend group, selected month next to the comparison month (one shared y-axis)
export function CompareChart({ selected, compare }: { selected: MonthSummary; compare: MonthSummary }) {
  const data = SPEND_GROUPS.map(g => ({
    group: g.label,
    [selected.label]: selected[g.key],
    [compare.label]: compare[g.key],
  }));
  // Same month picked twice: keep series names unique
  const compareName = compare.key === selected.key ? `${compare.label} (compare)` : compare.label;
  if (compareName !== compare.label) data.forEach(d => { d[compareName] = d[compare.label]; });

  return (
    <div>
      <ChartLegend
        items={[
          { label: selected.label, color: COMPARE_COLORS.selected },
          { label: compareName, color: COMPARE_COLORS.compare },
        ]}
      />
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="group" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={44} tickFormatter={compactMoney} />
            <Tooltip cursor={{ fill: 'rgba(148,163,184,0.12)' }} content={({ active, label, payload }) => moneyTooltip(active, label, payload)} />
            <Bar dataKey={selected.label} name={selected.label} fill={COMPARE_COLORS.selected} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey={compareName} name={compareName} fill={COMPARE_COLORS.compare} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Six months of spending stacked by group, with revenue as a line on the same axis
export function TrendChart({ months }: { months: MonthSummary[] }) {
  const data = months.map(m => ({ month: m.label, stock: m.stock, petty: m.petty, wages: m.wages, bills: m.bills, revenue: m.revenue }));

  return (
    <div>
      <ChartLegend
        items={[
          ...SPEND_GROUPS.map(g => ({ label: g.label, color: g.color })),
          { label: 'Revenue', color: REVENUE_LINE, line: true },
        ]}
      />
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={44} tickFormatter={compactMoney} />
            <Tooltip cursor={{ fill: 'rgba(148,163,184,0.12)' }} content={({ active, label, payload }) => moneyTooltip(active, label, payload)} />
            {SPEND_GROUPS.map((g, i) => (
              <Bar
                key={g.key}
                dataKey={g.key}
                name={g.label}
                stackId="spend"
                fill={g.color}
                stroke={SURFACE}
                strokeWidth={2}
                maxBarSize={36}
                radius={i === SPEND_GROUPS.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
            <Line dataKey="revenue" name="Revenue" stroke={REVENUE_LINE} strokeWidth={2} dot={{ r: 3, stroke: SURFACE, strokeWidth: 2, fill: REVENUE_LINE }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
