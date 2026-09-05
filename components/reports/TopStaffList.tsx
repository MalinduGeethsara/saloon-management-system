"use client";

import { Avatar, Progress } from 'antd';

interface StaffItem {
  name: string;
  role: string;
  revenue: number;
  avatar: string | null;
  percentage: number;
}

export default function TopStaffList({ data }: { data: StaffItem[] }) {
  if (data.length === 0) {
    return <div className="text-center text-slate-400 py-4">No staff data available.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-2">
      {data.map((item, index) => (
        <div key={index} className="flex gap-4 items-center">
          <div className="relative">
            <Avatar src={item.avatar} size={48} className="border border-slate-100 font-bold bg-[#F3E8FF] text-[#7C4DFF]">
              {!item.avatar ? index + 1 : undefined}
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-[#1a1a1b] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
              {index + 1}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-1">
              <div>
                <div className="font-bold text-sm text-slate-800 truncate">{item.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.role}</div>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600">Rs. {(item.revenue / 1000).toFixed(1)}k</div>
            </div>
            <Progress
              percent={item.percentage}
              size="small"
              showInfo={false}
              strokeColor="#7C4DFF"
              railColor="#F3F4F6"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
