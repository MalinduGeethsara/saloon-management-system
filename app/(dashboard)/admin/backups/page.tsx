"use client";
import { Database, Download, RefreshCw } from "lucide-react";

export default function BackupPage() {
  const backups = [
    { id: "BK-770", date: "Feb 01, 2026", size: "45.2 MB", type: "Weekly Auto" },
    { id: "BK-769", date: "Jan 25, 2026", size: "44.8 MB", type: "Weekly Auto" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Backups</h1>
        <button className="bg-[#1A1A1B] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-black transition">
          <RefreshCw size={18} /> Run Manual Backup
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold">Backup ID</th>
              <th className="px-6 py-4 text-sm font-semibold">Date</th>
              <th className="px-6 py-4 text-sm font-semibold">Size</th>
              <th className="px-6 py-4 text-sm font-semibold">Type</th>
              <th className="px-6 py-4 text-sm font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {backups.map((bk) => (
              <tr key={bk.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium flex items-center gap-2">
                  <Database size={16} className="text-gray-400" /> {bk.id}
                </td>
                <td className="px-6 py-4 text-gray-600">{bk.date}</td>
                <td className="px-6 py-4 text-gray-600">{bk.size}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                    {bk.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#C5A059] hover:underline flex items-center gap-1 ml-auto">
                    <Download size={16} /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}