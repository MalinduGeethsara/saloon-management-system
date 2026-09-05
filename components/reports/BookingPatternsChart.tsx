"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CHART_COLORS, CHART_AXIS_STYLE, ChartTooltip } from './chartTheme';

interface HourPoint { hour: number; count: number }
interface DayPoint { day: string; count: number }

function formatHour(h: number) {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export default function BookingPatternsChart({ byHour, byDay, loading }: { byHour: HourPoint[]; byDay: DayPoint[]; loading: boolean }) {
  const total = byHour.reduce((s, h) => s + h.count, 0);
  if (!loading && total === 0) {
    return <div className="text-center text-slate-400 py-8">No booking activity for this period.</div>;
  }

  const hourData = byHour.map(h => ({ label: formatHour(h.hour), count: h.count }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">By Hour of Day</div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ ...CHART_AXIS_STYLE, fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip
                content={({ active, label, payload }) => (
                  <ChartTooltip
                    active={active}
                    label={label}
                    payload={payload?.map(p => ({ name: 'Bookings', value: p.value as number, color: p.color }))}
                  />
                )}
              />
              <Bar dataKey="count" fill={CHART_COLORS.revenue} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">By Day of Week</div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip
                content={({ active, label, payload }) => (
                  <ChartTooltip
                    active={active}
                    label={label}
                    payload={payload?.map(p => ({ name: 'Bookings', value: p.value as number, color: p.color }))}
                  />
                )}
              />
              <Bar dataKey="count" fill={CHART_COLORS.margin} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
