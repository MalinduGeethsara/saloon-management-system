"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, ShoppingBag, MapPin } from "lucide-react";

export default function OwnerFinancials() {
  return (
    <div className="space-y-8 p-2">
      <header>
        <h1 className="text-4xl font-black text-[#1A1A1B]">Business Intelligence</h1>
        <p className="text-gray-500">Revenue analytics across all active branches.</p>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Monthly Revenue" value="$42,580" trend="+12.5%" icon={<DollarSign />} color="text-emerald-600" />
        <StatCard title="Total Appointments" value="1,842" trend="+3.2%" icon={<Users />} color="text-blue-600" />
        <StatCard title="Product Sales" value="$6,120" trend="+18.7%" icon={<ShoppingBag />} color="text-[#C5A059]" />
        <StatCard title="Growth Rate" value="24%" trend="+2.1%" icon={<TrendingUp />} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branch Performance Comparison */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Branch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <BranchProgress name="Downtown Studio" value={85} total="$18,400" />
            <BranchProgress name="Westside Barbering" value={65} total="$12,180" />
            <BranchProgress name="East Gate Saloon" value={45} total="$8,200" />
            <BranchProgress name="North Point" value={25} total="$3,800" />
          </CardContent>
        </Card>

        {/* Top Performing Staff */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top Earning Barbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Alex Rivers", shop: "Downtown", revenue: "$5,240" },
                { name: "Jordan Smith", shop: "Westside", revenue: "$4,890" },
                { name: "Sam Wilson", shop: "Downtown", revenue: "$4,100" },
              ].map((staff, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 border-b last:border-0">
                  <div>
                    <p className="font-bold text-[#1A1A1B]">{staff.name}</p>
                    <p className="text-xs text-gray-400">{staff.shop} Branch</p>
                  </div>
                  <span className="font-mono font-bold text-[#C5A059]">{staff.revenue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: any) {
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-[#1A1A1B]">{value}</div>
        <p className="text-xs font-medium text-emerald-500 mt-1">{trend} increase</p>
      </CardContent>
    </Card>
  );
}

function BranchProgress({ name, value, total }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-gray-600">{name}</span>
        <span className="text-[#1A1A1B] font-bold">{total}</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className="bg-[#C5A059] h-full transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}