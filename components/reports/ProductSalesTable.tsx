"use client";

import { Progress, Typography } from 'antd';
import { formatCurrency } from '@/lib/utils';

const { Text } = Typography;

interface ProductItem {
  name: string;
  revenue: number;
  unitsSold: number;
  category: string | null;
  currentStock: number | null;
}

export default function ProductSalesTable({
  data,
  isGlobalOnly,
  loading,
}: {
  data: ProductItem[];
  isGlobalOnly: boolean;
  loading: boolean;
}) {
  if (!loading && data.length === 0) {
    return <div className="text-center text-slate-400 py-8">No product sales in this period.</div>;
  }

  const maxRevenue = data.length > 0 ? data[0].revenue : 1;

  return (
    <div>
      {isGlobalOnly && (
        <Text type="secondary" className="text-xs block mb-4">
          Product sales are tracked from walk-in bills only and aren&apos;t attributed to a specific branch — this section always shows all branches combined.
        </Text>
      )}
      <div className="flex flex-col gap-5">
        {data.map((p, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-700">
              <span>
                {p.name}
                {p.category && <span className="text-slate-400 font-normal ml-2">{p.category}</span>}
              </span>
              <span className="text-slate-500">
                {formatCurrency(p.revenue)} · {p.unitsSold} sold
                {p.currentStock !== null && <span className="text-slate-400"> · {p.currentStock} in stock</span>}
              </span>
            </div>
            <Progress
              percent={Math.round((p.revenue / maxRevenue) * 100)}
              strokeColor={i === 0 ? '#10B981' : i === 1 ? '#3B82F6' : '#F59E0B'}
              railColor="#F3F4F6"
              showInfo={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
