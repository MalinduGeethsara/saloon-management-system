export const CHART_COLORS = {
  revenue: '#7C4DFF',
  expense: '#CBD5E0',
  margin: '#10B981',
  newCustomers: '#3B82F6',
  returningCustomers: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
  pending: '#F59E0B',
  confirmed: '#3B82F6',
};

export const STATUS_COLORS: Record<string, string> = {
  COMPLETED: CHART_COLORS.completed,
  CANCELLED: CHART_COLORS.cancelled,
  PENDING: CHART_COLORS.pending,
  CONFIRMED: CHART_COLORS.confirmed,
};

export const CHART_AXIS_STYLE = {
  fontFamily: 'inherit',
  fontSize: 11,
  fill: '#94a3b8',
};

export function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean;
  label?: string | number;
  payload?: { name: string; value: number; color?: string }[];
  formatter?: (name: string, value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-slate-800 text-white text-xs py-2 px-3 rounded shadow-lg">
      {label && <div className="font-bold mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {formatter ? formatter(p.name, p.value) : `${p.name}: ${p.value}`}
        </div>
      ))}
    </div>
  );
}
