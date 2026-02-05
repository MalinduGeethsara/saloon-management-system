"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Server, Users, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#1A1A1B]">System Overview</h1>
          <p className="text-gray-500 mt-1">Real-time status of your Salon network.</p>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Connections" value="124" icon={<Activity />} color="text-blue-500" />
        <StatCard title="Global Shops" value="12" icon={<Server />} color="text-[#C5A059]" />
        <StatCard title="Active Barbers" value="48" icon={<Users />} color="text-purple-500" />
        <StatCard title="System Alerts" value="0" icon={<AlertCircle />} color="text-emerald-500" />
      </div>

      {/* Activity Log */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-gray-50">
          <CardTitle className="text-lg font-bold">Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm text-gray-700 font-medium">Automatic Database Backup BK-00{i}</span>
                </div>
                <span className="text-xs font-mono text-gray-400">Feb 0{i}, 2026 - 10:00 AM</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-[#1A1A1B]">{value}</div>
      </CardContent>
    </Card>
  );
}