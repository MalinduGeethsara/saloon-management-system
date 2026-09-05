"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CHART_COLORS, CHART_AXIS_STYLE, ChartTooltip } from './chartTheme';
import { formatCurrency } from '@/lib/utils';

interface PerformancePoint {
  month: string;
  rawRevenue: number;
  rawExpense: number;
  margin: number | null;
}

export default function RevenueExpenseChart({ data, loading }: { data: PerformancePoint[]; loading: boolean }) {
  if (!loading && data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-slate-400">
        No financial data available for this period.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
          <YAxis yAxisId="right" orientation="right" domain={[-100, 100]} unit="%" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            content={({ active, label, payload }) => (
              <ChartTooltip
                active={active}
                label={label}
                payload={payload?.map(p => ({ name: p.name as string, value: p.value as number, color: p.color }))}
                formatter={(name, value) =>
                  name === 'margin' ? `Margin: ${value}%` : `${name === 'rawRevenue' ? 'Revenue' : 'Expense'}: ${formatCurrency(value)}`
                }
              />
            )}
          />
          <Bar yAxisId="left" dataKey="rawRevenue" name="rawRevenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} barSize={16} />
          <Bar yAxisId="left" dataKey="rawExpense" name="rawExpense" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} barSize={16} />
          <Line yAxisId="right" dataKey="margin" name="margin" stroke={CHART_COLORS.margin} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
