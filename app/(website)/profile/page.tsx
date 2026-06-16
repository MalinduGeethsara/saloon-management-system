"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HomeOutlined, 
  CalendarOutlined, 
  LogoutOutlined,
  EyeOutlined
} from '@ant-design/icons';

export default function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [mounted, setMounted] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState({
    name: "malindu",
    phone: "713307710",
    initials: "M"
  });

  useEffect(() => {
    // Check if user role is present, otherwise redirect immediately to login
    const roleCookie = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const userRole = roleCookie ? roleCookie[2] : null;
    
    if (!userRole) {
      window.location.href = '/login?callbackUrl=/profile';
      return;
    }

    setMounted(true);

    // Load or initialize appointments from localStorage
    const existing = localStorage.getItem("appointments");
    if (existing) {
      try {
        setAppointments(JSON.parse(existing));
      } catch (err) {
        console.error("Failed to parse appointments:", err);
      }
    } else {
      const initial = [
        {
          id: "1",
          code: "SLAD70507",
          date: "2026-09-24",
          time: "4:00 PM",
          status: "Pending",
          amount: "LKR 4,000.00",
          paymentMethod: "Card",
          paymentStatus: "Paid",
          barberName: "Kasun",
          barberRole: "Senior Barber"
        }
      ];
      localStorage.setItem("appointments", JSON.stringify(initial));
      setAppointments(initial);
    }

    // Load logged in user's role/name if available
    if (roleCookie) {
      if (userRole !== 'customer') {
        setUser({
          name: userRole.charAt(0).toUpperCase() + userRole.slice(1),
          phone: "Staff Member",
          initials: userRole.charAt(0).toUpperCase()
        });
      } else {
        const nameCookie = document.cookie.match(new RegExp('(^| )user_name=([^;]+)'));
        const userName = nameCookie ? decodeURIComponent(nameCookie[2]) : null;
        
        const phoneCookie = document.cookie.match(new RegExp('(^| )user_phone=([^;]+)'));
        const userPhone = phoneCookie ? decodeURIComponent(phoneCookie[2]) : null;
        
        if (userName) {
          setUser({
            name: userName,
            phone: userPhone || "",
            initials: userName.charAt(0).toUpperCase()
          });
        }
      }
    }
  }, []);

  const handleCancelAppointment = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      const updated = appointments.map(app => {
        if (app.id === id) {
          return { ...app, status: "Cancelled", paymentStatus: "Refunded" };
        }
        return app;
      });
      localStorage.setItem("appointments", JSON.stringify(updated));
      setAppointments(updated);
      setIsModalOpen(false);
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Clear cookies locally first so UI responds immediately
      document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user_phone=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always redirect and force page reload to clear state
      window.location.href = '/';
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pt-24 pb-32 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-300 dark:bg-zinc-800 mb-4"></div>
          <div className="h-4 bg-zinc-300 dark:bg-zinc-800 rounded w-32 mb-2"></div>
          <div className="h-3 bg-zinc-300 dark:bg-zinc-800 rounded w-24"></div>
        </div>
      </div>
    );
  }

  const upcomingCount = appointments.filter(app => app.status === "Pending" || app.status === "Confirmed").length;

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-6 w-full mt-10">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center mb-6 shadow-sm dark:shadow-none">
              <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800/50 animate-in fade-in zoom-in-95 duration-500">
                <span className="text-3xl text-amber-600 dark:text-amber-500 font-bold uppercase">{user.initials}</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide capitalize">{user.name}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-mono text-sm mt-1">{user.phone}</p>
            </div>

            <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-3 px-6 py-5 font-bold text-sm transition-all border-l-4 cursor-pointer ${
                  activeTab === "dashboard" 
                    ? "bg-zinc-50 dark:bg-zinc-900 border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500" 
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <HomeOutlined className="text-lg" /> Dashboard
              </button>
              
              <button 
                onClick={() => setActiveTab("appointments")}
                className={`flex items-center gap-3 px-6 py-5 font-bold text-sm transition-all border-l-4 cursor-pointer ${
                  activeTab === "appointments" 
                    ? "bg-zinc-50 dark:bg-zinc-900 border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500" 
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <CalendarOutlined className="text-lg" /> Appointments ({appointments.length})
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-3 px-6 py-5 font-bold text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all border-t border-zinc-200 dark:border-zinc-800 border-l-4 border-l-transparent cursor-pointer"
              >
                <LogoutOutlined className="text-lg text-red-500" /> <span className="text-red-500">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none min-h-[400px]">
            
            {activeTab === "appointments" && (
              <div className="animate-in fade-in duration-500">
                <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <CalendarOutlined className="text-amber-600 dark:text-amber-500" />
                    Appointments History
                  </h2>
                </div>
                
                <div className="p-0 overflow-x-auto">
                  {appointments.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                      No appointments found.
                    </div>
                  ) : (
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
                        {appointments.map((app, index) => (
                          <tr key={app.id || index} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400">{index + 1}</td>
                            <td className="py-5 px-6 text-sm font-bold text-zinc-900 dark:text-white">{app.code}</td>
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400">{app.date} / {app.time}</td>
                            <td className="py-5 px-6">
                              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                app.status === "Pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500" :
                                app.status === "Cancelled" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" :
                                "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">{app.amount}</td>
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400">{app.paymentMethod}</td>
                            <td className="py-5 px-6">
                              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                app.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500" :
                                app.paymentStatus === "Refunded" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" :
                                "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                              }`}>
                                {app.paymentStatus}
                              </span>
                            </td>
                            <td className="py-5 px-6 flex justify-center">
                              <button 
                                onClick={() => {
                                  setSelectedAppointment(app);
                                  setIsModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer"
                              >
                                <EyeOutlined />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="p-8 md:p-12 text-center text-zinc-500 dark:text-zinc-400 font-light flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-6">
                  <CalendarOutlined className="text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-wide">Welcome back, <span className="capitalize font-bold text-amber-600 dark:text-amber-500">{user.name}</span></h3>
                <p className="text-lg">You have <span className="font-bold text-amber-600 dark:text-amber-500">{upcomingCount}</span> upcoming {upcomingCount === 1 ? "appointment" : "appointments"}.</p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Detail Modal Overlay */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-zinc-900 dark:text-white">
            <h3 className="text-xl font-bold mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center tracking-wide">
              <span>Appointment Details</span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Appointment Code</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{selectedAppointment.code}</span>
              </div>

              {selectedAppointment.barberName && (
                <div className="flex justify-between items-center py-3 border-y border-zinc-100 dark:border-zinc-800/50">
                  <span className="text-zinc-500 text-sm font-medium">Artisan</span>
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-white">{selectedAppointment.barberName}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 tracking-wide uppercase font-semibold">{selectedAppointment.barberRole}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Date</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedAppointment.date}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Time</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedAppointment.time}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Status</span>
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                  selectedAppointment.status === "Pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500" :
                  selectedAppointment.status === "Cancelled" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" :
                  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                }`}>
                  {selectedAppointment.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Amount Paid</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedAppointment.amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Payment Status</span>
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                  selectedAppointment.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500" :
                  selectedAppointment.paymentStatus === "Refunded" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" :
                  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                }`}>
                  {selectedAppointment.paymentStatus}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex gap-4">
              {selectedAppointment.status === "Pending" && (
                <button
                  onClick={() => handleCancelAppointment(selectedAppointment.id)}
                  className="flex-1 py-3 border border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold uppercase tracking-widest transition-all text-center cursor-pointer font-semibold"
                >
                  Cancel Appointment
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest transition-all text-center cursor-pointer font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

