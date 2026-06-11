"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  LogoutOutlined,
  EyeOutlined
} from '@ant-design/icons';

const mockAppointments = [
  {
    id: "1",
    code: "SLAD70507",
    date: "2026-09-24",
    time: "4:00 PM",
    status: "Pending",
    amount: "LKR 4,000.00",
    paymentMethod: "Card",
    paymentStatus: "Paid"
  }
];

export default function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 w-full mt-10">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center mb-6 shadow-sm dark:shadow-none">
              <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800/50">
                <span className="text-3xl text-amber-600 dark:text-amber-500 font-bold">M</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide">malindu</h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-mono text-sm mt-1">713307710</p>
            </div>

            <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-3 px-6 py-5 font-bold text-sm transition-all border-l-4 ${
                  activeTab === "dashboard" 
                    ? "bg-zinc-50 dark:bg-zinc-900 border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500" 
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <HomeOutlined className="text-lg" /> Dashboard
              </button>
              
              <button 
                onClick={() => setActiveTab("appointments")}
                className={`flex items-center gap-3 px-6 py-5 font-bold text-sm transition-all border-l-4 ${
                  activeTab === "appointments" 
                    ? "bg-zinc-50 dark:bg-zinc-900 border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500" 
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <CalendarOutlined className="text-lg" /> Appointments
              </button>
              
              <Link 
                href="/"
                className="flex items-center gap-3 px-6 py-5 font-bold text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all border-t border-zinc-200 dark:border-zinc-800 border-l-4 border-l-transparent"
              >
                <LogoutOutlined className="text-lg text-red-500" /> <span className="text-red-500">Logout</span>
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
            
            {activeTab === "appointments" && (
              <div>
                <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <CalendarOutlined className="text-amber-600 dark:text-amber-500" />
                    Appointments History
                  </h2>
                </div>
                
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">#</th>
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Code</th>
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Date/Time</th>
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Status</th>
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Amount</th>
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Payment Method</th>
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Payment Status</th>
                        <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockAppointments.map((app, index) => (
                        <tr key={app.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400">{index + 1}</td>
                          <td className="py-5 px-6 text-sm font-bold text-zinc-900 dark:text-white">{app.code}</td>
                          <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400">{app.date} / {app.time}</td>
                          <td className="py-5 px-6">
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                              {app.status}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">{app.amount}</td>
                          <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400">{app.paymentMethod}</td>
                          <td className="py-5 px-6">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded-full">
                              {app.paymentStatus}
                            </span>
                          </td>
                          <td className="py-5 px-6 flex justify-center">
                            <button className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all">
                              <EyeOutlined />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="p-8 md:p-12 text-center text-zinc-500 dark:text-zinc-400 font-light flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-6">
                  <CalendarOutlined className="text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Welcome back, Malindu</h3>
                <p className="text-lg">You have <span className="font-bold text-amber-600 dark:text-amber-500">1</span> upcoming appointment.</p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
