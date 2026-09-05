"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Statistic } from 'antd';
import { STATUS_COLORS, ChartTooltip } from './chartTheme';

interface StatusItem {
  status: string;
  count: number;
}

export default function BookingStatusChart({
  data,
  completionRate,
  cancellationRate,
  loading,
}: {
  data: StatusItem[];
  completionRate: number | null;
  cancellationRate: number | null;
  loading: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (!loading && total === 0) {
    return <div className="text-center text-slate-400 py-8">No booking data available.</div>;
  }

  return (
    <div>
      <div className="flex justify-around mb-4">
        <Statistic
          title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>}
          value={completionRate === null ? 'N/A' : `${completionRate}%`}
          styles={{ content: { fontWeight: 800, color: '#10B981', fontSize: 20 } }}
        />
        <Statistic
          title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cancellation Rate</span>}
          value={cancellationRate === null ? 'N/A' : `${cancellationRate}%`}
          styles={{ content: { fontWeight: 800, color: '#EF4444', fontSize: 20 } }}
        />
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((d, i) => (
                <Cell key={i} fill={STATUS_COLORS[d.status] || '#94a3b8'} />
              ))}
            </Pie>
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload?.map(p => ({ name: p.name as string, value: p.value as number, color: p.payload?.fill }))}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
