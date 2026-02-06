"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarberPerformance } from "@/components/reports/BarberPerformance";
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  Download,
  Calendar as CalendarIcon
} from "lucide-react";

export default function OwnerReportsPage() {
  const paymentGrowthData = [
    { month: "Sept", amount: "$12,400", growth: "+5%" },
    { month: "Oct", amount: "$14,200", growth: "+14%" },
    { month: "Nov", amount: "$13,800", growth: "-2%" },
    { month: "Dec", amount: "$18,900", growth: "+36%" },
    { month: "Jan", amount: "$21,400", growth: "+13%" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#1A1A1B] tracking-tight">Business Intelligence</h1>
          <p className="text-gray-500 mt-1 font-medium">Detailed growth metrics and staff productivity logs.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#1A1A1B] text-[#C5A059] px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">
          <Download size={18} />
          Export Full Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportSummaryCard 
          title="Total Revenue (YTD)" 
          value="$142,500" 
          change="+22%" 
          icon={<CreditCard className="text-blue-600" />} 
        />
        <ReportSummaryCard 
          title="New Clients" 
          value="482" 
          change="+12%" 
          icon={<Users className="text-purple-600" />} 
        />
        <ReportSummaryCard 
          title="Avg. Service Price" 
          value="$42.50" 
          change="+5%" 
          icon={<TrendingUp className="text-emerald-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Payment Growth Trends */}
        <Card className="lg:col-span-7 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Monthly Payment Growth</CardTitle>
            <CalendarIcon size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="text-right">Growth Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentGrowthData.map((data) => (
                  <TableRow key={data.month}>
                    <TableCell className="font-semibold text-gray-700">{data.month} 2025/26</TableCell>
                    <TableCell className="font-mono font-bold text-[#1A1A1B]">{data.amount}</TableCell>
                    <TableCell className={`text-right font-bold ${data.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {data.growth}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Revenue Distribution Chart (Visual Representation) */}
        <Card className="lg:col-span-5 border-none shadow-sm bg-[#1A1A1B] text-white">
          <CardHeader>
            <CardTitle className="text-[#C5A059] text-lg">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 pt-4">
              <DistributionBar label="Haircuts" percent={65} color="bg-[#C5A059]" />
              <DistributionBar label="Shaves & Beards" percent={20} color="bg-white" />
              <DistributionBar label="Product Sales" percent={10} color="bg-zinc-500" />
              <DistributionBar label="Other" percent={5} color="bg-zinc-700" />
            </div>
            <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-gray-400 leading-relaxed italic">
                * Based on the last 30 days of transactions. Haircuts remain the primary driver of shop revenue.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barber Performance Component */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-[#C5A059] rounded-full" />
          <h2 className="text-2xl font-black text-[#1A1A1B]">Barber Productivity Insights</h2>
        </div>
        <BarberPerformance />
      </section>
    </div>
  );
}

// Sub-component for KPI Cards
function ReportSummaryCard({ title, value, change, icon }: any) {
  return (
    <Card className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-zinc-50 rounded-lg group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
            <ArrowUpRight size={12} /> {change}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-[#1A1A1B] mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-component for Revenue Distribution Bars
function DistributionBar({ label, percent, color }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}