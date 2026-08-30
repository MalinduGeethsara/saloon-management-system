"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { CHART_COLORS, CHART_AXIS_STYLE, ChartTooltip } from './chartTheme';

interface RetentionPoint {
  month: string;
  newCustomers: number;
  returningCustomers: number;
}

export default function CustomerRetentionChart({ data, loading }: { data: RetentionPoint[]; loading: boolean }) {
  if (!loading && data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No customer activity for this period.</div>;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Tooltip
            content={({ active, label, payload }) => (
              <ChartTooltip
                active={active}
                label={label}
                payload={payload?.map(p => ({ name: p.name as string, value: p.value as number, color: p.color }))}
              />
            )}
          />
          <Line type="monotone" dataKey="newCustomers" name="New" stroke={CHART_COLORS.newCustomers} strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="returningCustomers" name="Returning" stroke={CHART_COLORS.returningCustomers} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
