"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, Avatar } from 'antd';
import { CHART_COLORS, CHART_AXIS_STYLE, ChartTooltip } from './chartTheme';
import { formatCurrency } from '@/lib/utils';

interface ShopRow {
  shopId: string;
  shopName: string;
  revenue: number;
  bookings: number;
  avgTicket: number;
  topStaff: { name: string; revenue: number; bookings: number; avatar: string | null }[];
}

export default function ShopComparisonChart({ data, loading }: { data: ShopRow[]; loading: boolean }) {
  if (!loading && data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No branch data available.</div>;
  }

  const columns = [
    { title: 'Branch', dataIndex: 'shopName', key: 'shopName', render: (v: string) => <span className="font-bold">{v}</span> },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (v: number) => formatCurrency(v) },
    { title: 'Bookings', dataIndex: 'bookings', key: 'bookings' },
    { title: 'Avg. Ticket', dataIndex: 'avgTicket', key: 'avgTicket', render: (v: number) => formatCurrency(v) },
    {
      title: 'Top Staff',
      dataIndex: 'topStaff',
      key: 'topStaff',
      render: (staff: ShopRow['topStaff']) => (
        <div className="flex gap-1">
          {staff.length === 0 && <span className="text-slate-400 text-xs">—</span>}
          {staff.map((s, i) => (
            <span key={i} title={s.name}>
              <Avatar src={s.avatar} size={28} className="bg-[#F3E8FF] text-[#7C4DFF] border border-white">
                {!s.avatar ? s.name.charAt(0) : undefined}
              </Avatar>
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="h-60 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="shopName" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={payload?.map(p => ({ name: p.name as string, value: p.value as number, color: p.color }))}
                  formatter={(_, value) => `Revenue: ${formatCurrency(value)}`}
                />
              )}
            />
            <Bar dataKey="revenue" name="revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="shopId"
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="small"
        loading={loading}
      />
    </div>
  );
}
