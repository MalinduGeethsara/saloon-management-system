import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, UserX, UserCheck } from "lucide-react";

export default function SecurityLogs() {
  const logs = [
    { id: 1, event: "Admin Login", user: "system_admin", ip: "192.168.1.1", time: "10 mins ago", status: "success" },
    { id: 2, event: "Failed Login Attempt", user: "unknown", ip: "45.12.9.22", time: "1 hour ago", status: "failed" },
    { id: 3, event: "Shop Data Modified", user: "owner_04", ip: "192.168.1.45", time: "3 hours ago", status: "success" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#1A1A1B]">Security Logs</h1>
      
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:shadow-sm transition">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {log.status === 'success' ? <UserCheck size={20} /> : <UserX size={20} />}
              </div>
              <div>
                <p className="font-bold text-[#1A1A1B]">{log.event}</p>
                <p className="text-xs text-gray-400">User: {log.user} • IP: {log.ip}</p>
              </div>
            </div>
            <span className="text-sm font-mono text-gray-400">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}