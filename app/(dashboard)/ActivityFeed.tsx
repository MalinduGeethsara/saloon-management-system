import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

const activities = [
  { id: 1, text: "Weekly Backup BK-770 Successful", time: "2 hours ago", type: "success" },
  { id: 2, text: "System Alert: High latency in Shop 04", time: "5 hours ago", type: "warning" },
  { id: 3, text: "Admin Login: User 'SystemRoot'", time: "1 day ago", type: "info" },
];

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      {activities.map((item) => (
        <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition">
          {item.type === "success" && <CheckCircle2 className="text-emerald-500 mt-1" size={18} />}
          {item.type === "warning" && <AlertCircle className="text-amber-500 mt-1" size={18} />}
          {item.type === "info" && <Clock className="text-blue-500 mt-1" size={18} />}
          <div>
            <p className="text-sm font-medium text-gray-800">{item.text}</p>
            <p className="text-xs text-gray-400">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}