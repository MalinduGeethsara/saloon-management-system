"use client";

import { Progress } from 'antd';

interface ServiceItem {
  name: string;
  count: number;
  percentage: number;
}

export default function PopularServicesList({ data }: { data: ServiceItem[] }) {
  if (data.length === 0) {
    return <div className="text-center text-slate-400 py-4">No services booked.</div>;
  }

  return (
    <div className="flex flex-col gap-5 max-h-[400px] overflow-y-auto pr-2">
      {data.map((service, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-700">
            <span>{service.name}</span>
            <span className="text-slate-400">{service.count} bookings</span>
          </div>
          <Progress
            percent={service.percentage}
            strokeColor={i === 0 ? '#10B981' : i === 1 ? '#3B82F6' : '#F59E0B'}
            railColor="#F3F4F6"
          />
        </div>
      ))}
    </div>
  );
}
