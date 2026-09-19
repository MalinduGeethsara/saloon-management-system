"use client";

import React, { useState, useEffect } from 'react';
import {
  HomeOutlined,
  CalendarOutlined,
  LogoutOutlined,
  EyeOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getCustomerBookings, cancelBooking } from "@/lib/actions/booking";
import { getMyOrders } from "@/lib/actions/orders";
import { usePagedList } from "@/hooks/usePagedList";
import PublicPagination from "@/components/website/PublicPagination";

const PAGE_SIZE = 8;

const PAYMENT_PILL = (status: string) =>
  status === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500" :
  status === "Refunded" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" :
  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500";

interface Appointment {
  id: string;
  code: string;
  date: string;
  time: string;
  status: string;
  amount: string;
  paymentMethod: string;
  paymentStatus: string;
  barberName?: string;
  barberRole?: string;
  serviceName?: string;
  productNames?: string;
}

interface OrderItemView {
  name: string;
  price: number;
  quantity: number;
}

interface CustomerOrder {
  id: string;
  code: string;
  items: OrderItemView[];
  totalAmount: number;
  amount: string;
  status: 'PENDING_PICKUP' | 'COLLECTED';
  statusLabel: string;
  date: string;
}

export default function ProfileDashboard() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointmentFilter, setAppointmentFilter] = useState<"upcoming" | "past">("upcoming");
  const [mounted, setMounted] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [user, setUser] = useState({
    name: "",
    phone: "",
    initials: ""
  });

  useEffect(() => {
    // Check if user role is present, otherwise redirect immediately to login
    const roleCookie = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const userRole = roleCookie ? roleCookie[2].toLowerCase() : null;
    
    if (!userRole) {
      window.location.href = '/login?callbackUrl=/profile';
      return;
    }

    const loadData = async () => {
      const [bookingsData, ordersData] = await Promise.all([
        getCustomerBookings(),
        getMyOrders()
      ]);
      setAppointments(bookingsData);
      setOrders(ordersData);
      setMounted(true);
    };

    loadData();

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

  const handleCancelAppointment = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      const result = await cancelBooking(id);
      if (result.success) {
        setAppointments(appointments.map(app => 
          app.id === id ? { ...app, status: "Cancelled", paymentStatus: "Refunded" } : app
        ));
      } else {
        alert(result.message || "Failed to cancel booking.");
      }
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

  const upcomingAppointments = appointments.filter(app => app.status === "Pending" || app.status === "Confirmed");
  const pastAppointments = appointments.filter(app => app.status === "Completed" || app.status === "Cancelled");
  const displayedAppointments = appointmentFilter === "upcoming" ? upcomingAppointments : pastAppointments;

  const apptPaging = usePagedList(displayedAppointments, PAGE_SIZE);
  const orderPaging = usePagedList(orders, PAGE_SIZE);

  if (!mounted) {
    return (
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen pt-10 pb-16 md:pt-24 md:pb-32 items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-300 dark:bg-zinc-800 mb-4"></div>
          <div className="h-4 bg-zinc-300 dark:bg-zinc-800 rounded w-32 mb-2"></div>
          <div className="h-3 bg-zinc-300 dark:bg-zinc-800 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-amber-600 selection:text-white font-sans transition-colors duration-500 pt-10 pb-16 md:pt-24 md:pb-32">
      <ScrollReveal direction="down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-4 md:mt-10">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-6 lg:p-8 flex flex-row lg:flex-col items-center gap-4 lg:gap-0 lg:items-center mb-6 shadow-sm dark:shadow-none">
              <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center lg:mb-4 border border-amber-200 dark:border-amber-800/50 animate-in fade-in zoom-in-95 duration-500 shrink-0">
                <span className="text-2xl lg:text-3xl text-amber-600 dark:text-amber-500 font-bold uppercase">{user.initials}</span>
              </div>
              <div className="flex flex-col items-start lg:items-center">
                <h2 className="text-lg lg:text-xl font-bold text-zinc-900 dark:text-white tracking-wide capitalize">{user.name}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 font-mono text-xs lg:text-sm mt-1">{user.phone || "No phone added"}</p>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col gap-1 lg:gap-2 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-1 lg:p-0 overflow-x-auto">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`flex-1 flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 py-4 lg:px-6 lg:py-5 font-bold text-xs lg:text-sm transition-all border-b-2 lg:border-b-0 lg:border-l-4 cursor-pointer ${
                  activeTab === "dashboard" 
                    ? "bg-zinc-50 dark:bg-zinc-900 border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500" 
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <HomeOutlined className="text-base lg:text-lg" /> <span>Dashboard</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("appointments")}
                className={`flex-1 flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 py-4 lg:px-6 lg:py-5 font-bold text-xs lg:text-sm transition-all border-b-2 lg:border-b-0 lg:border-l-4 cursor-pointer ${
                  activeTab === "appointments" 
                    ? "bg-zinc-50 dark:bg-zinc-900 border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500" 
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <CalendarOutlined className="text-base lg:text-lg" /> <span>Appointments ({appointments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`flex-1 flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 py-4 lg:px-6 lg:py-5 font-bold text-xs lg:text-sm transition-all border-b-2 lg:border-b-0 lg:border-l-4 cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-zinc-50 dark:bg-zinc-900 border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-500"
                    : "border-transparent text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                <ShoppingOutlined className="text-base lg:text-lg" /> <span>Orders ({orders.length})</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 py-4 lg:px-6 lg:py-5 font-bold text-xs lg:text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-all border-b-2 lg:border-b-0 border-transparent lg:border-t lg:border-zinc-200 lg:dark:border-zinc-800 lg:border-l-4 lg:border-l-transparent cursor-pointer"
              >
                <LogoutOutlined className="text-base lg:text-lg text-red-500" /> <span className="text-red-500">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none min-h-[400px]">
            
            {activeTab === "appointments" && (
              <div className="animate-in fade-in duration-500">
                <div className="p-4 sm:p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <CalendarOutlined className="text-amber-600 dark:text-amber-500" />
                    Appointments History
                  </h2>
                  <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1 self-start sm:self-auto">
                    <button
                      onClick={() => { setAppointmentFilter("upcoming"); apptPaging.setPage(1); }}
                      className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        appointmentFilter === "upcoming" 
                          ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-500 shadow-sm" 
                          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      Upcoming ({upcomingAppointments.length})
                    </button>
                    <button
                      onClick={() => { setAppointmentFilter("past"); apptPaging.setPage(1); }}
                      className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                        appointmentFilter === "past" 
                          ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-500 shadow-sm" 
                          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      Past ({pastAppointments.length})
                    </button>
                  </div>
                </div>
                
                {/* Phones: one card per appointment instead of a 9-column table */}
                {displayedAppointments.length > 0 && (
                  <div className="md:hidden p-4 space-y-3">
                    {apptPaging.pageItems.map((app, index) => (
                      <button
                        key={app.id || index}
                        type="button"
                        onClick={() => { setSelectedAppointment(app); setIsModalOpen(true); }}
                        className="w-full text-left border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 active:bg-zinc-100 dark:active:bg-zinc-800/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-zinc-900 dark:text-white">{app.code}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{app.date} / {app.time}</div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${PAYMENT_PILL(app.paymentStatus)}`}>
                            {app.paymentStatus}
                          </span>
                        </div>
                        <div className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {app.serviceName}
                          {app.productNames && <span className="block text-xs font-normal text-zinc-400 truncate">+ {app.productNames}</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span className="font-bold text-amber-600 dark:text-amber-500 truncate">{app.barberName}</span>
                          <span className="font-medium text-zinc-600 dark:text-zinc-400 shrink-0">{app.amount}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className={`p-0 overflow-x-auto ${displayedAppointments.length > 0 ? 'hidden md:block' : ''}`}>
                  {displayedAppointments.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                      No {appointmentFilter} appointments found.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">#</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Code</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Date/Time</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Service</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Artisan</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Amount</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Payment Method</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Payment Status</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apptPaging.pageItems.map((app, index) => (
                          <tr key={app.id || index} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400 align-top">{(apptPaging.page - 1) * PAGE_SIZE + index + 1}</td>
                            <td className="py-5 px-6 text-sm font-bold text-zinc-900 dark:text-white align-top">{app.code}</td>
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400 align-top">{app.date} / {app.time}</td>
                            <td className="py-5 px-6 text-sm font-medium text-zinc-800 dark:text-zinc-200 align-top">
                              {app.serviceName}
                              {app.productNames && (
                                <div className="text-xs font-normal text-zinc-400 mt-0.5 max-w-[55%] truncate" title={app.productNames}>+ {app.productNames}</div>
                              )}
                            </td>
                            <td className="py-5 px-6 text-sm font-bold text-amber-600 dark:text-amber-500 align-top">{app.barberName}</td>
                            <td className="py-5 px-6 text-sm font-medium text-zinc-600 dark:text-zinc-400 align-top">{app.amount}</td>
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400 align-top">{app.paymentMethod}</td>
                            <td className="py-5 px-6 align-top">
                              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                app.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500" :
                                app.paymentStatus === "Refunded" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500" :
                                "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                              }`}>
                                {app.paymentStatus}
                              </span>
                            </td>
                            <td className="py-5 px-6 align-top">
                              <button
                                onClick={() => {
                                  setSelectedAppointment(app);
                                  setIsModalOpen(true);
                                }}
                                className="w-8 h-8 mx-auto rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer"
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

                <div className="px-4 pb-6 md:px-8">
                  <PublicPagination current={apptPaging.page} totalPages={apptPaging.totalPages} onChange={apptPaging.setPage} className="!mt-6" />
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="animate-in fade-in duration-500">
                <div className="p-4 sm:p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <ShoppingOutlined className="text-amber-600 dark:text-amber-500" />
                    My Orders
                  </h2>
                </div>

                {orders.length > 0 && (
                  <div className="md:hidden p-4 space-y-3">
                    {orderPaging.pageItems.map((order, index) => (
                      <button
                        key={order.id || index}
                        type="button"
                        onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }}
                        className="w-full text-left border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 active:bg-zinc-100 dark:active:bg-zinc-800/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-zinc-900 dark:text-white">{order.code}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{order.date}</div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            order.status === "COLLECTED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                          }`}>
                            {order.statusLabel}
                          </span>
                        </div>
                        <div className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{order.items.map(i => i.name).join(', ')}</div>
                        <div className="mt-2 text-right text-sm font-medium text-zinc-600 dark:text-zinc-400">{order.amount}</div>
                      </button>
                    ))}
                  </div>
                )}

                <div className={`p-0 overflow-x-auto ${orders.length > 0 ? 'hidden md:block' : ''}`}>
                  {orders.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                      No product orders yet.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">#</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Code</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Date</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Items</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Status</th>
                          <th className="py-5 px-6 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderPaging.pageItems.map((order, index) => (
                          <tr key={order.id || index} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400 align-top">{(orderPaging.page - 1) * PAGE_SIZE + index + 1}</td>
                            <td className="py-5 px-6 text-sm font-bold text-zinc-900 dark:text-white align-top">{order.code}</td>
                            <td className="py-5 px-6 text-sm text-zinc-600 dark:text-zinc-400 align-top">{order.date}</td>
                            <td className="py-5 px-6 text-sm font-medium text-zinc-800 dark:text-zinc-200 align-top max-w-[240px] truncate" title={order.items.map(i => i.name).join(', ')}>
                              {order.items.map(i => i.name).join(', ')}
                            </td>
                            <td className="py-5 px-6 text-sm font-medium text-zinc-600 dark:text-zinc-400 align-top">{order.amount}</td>
                            <td className="py-5 px-6 align-top">
                              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                order.status === "COLLECTED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500" :
                                "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                              }`}>
                                {order.statusLabel}
                              </span>
                            </td>
                            <td className="py-5 px-6 align-top">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsOrderModalOpen(true);
                                }}
                                className="w-8 h-8 mx-auto rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all cursor-pointer"
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

                <div className="px-4 pb-6 md:px-8">
                  <PublicPagination current={orderPaging.page} totalPages={orderPaging.totalPages} onChange={orderPaging.setPage} className="!mt-6" />
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <div className="p-8 md:p-12 text-center text-zinc-500 dark:text-zinc-400 font-light flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-6">
                  <CalendarOutlined className="text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-wide">Welcome back, <span className="capitalize font-bold text-amber-600 dark:text-amber-500">{user.name}</span></h3>
                <p className="text-lg">You have <span className="font-bold text-amber-600 dark:text-amber-500">{upcomingAppointments.length}</span> upcoming {upcomingAppointments.length === 1 ? "appointment" : "appointments"}.</p>
              </div>
            )}

          </div>

        </div>

      </div>
      </ScrollReveal>

      {/* Detail Modal Overlay */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-zinc-900 dark:text-white">
            <h3 className="text-xl font-bold mb-4 sm:mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center tracking-wide">
              <span>Appointment Details</span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </h3>
            
            <div className="space-y-4 sm:space-y-6">
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

              {selectedAppointment.serviceName && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">Service</span>
                  <span className="font-bold text-zinc-900 dark:text-white text-right max-w-[55%] truncate" title={selectedAppointment.serviceName}>{selectedAppointment.serviceName}</span>
                </div>
              )}

              {selectedAppointment.productNames && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">Products</span>
                  <span className="font-bold text-zinc-900 dark:text-white text-right max-w-[55%] truncate" title={selectedAppointment.productNames}>{selectedAppointment.productNames}</span>
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

            <div className="mt-6 sm:mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
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

      {/* Order Detail Modal Overlay */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-zinc-900 dark:text-white">
            <h3 className="text-xl font-bold mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center tracking-wide">
              <span>Order Details</span>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </h3>

            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Order Code</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{selectedOrder.code}</span>
              </div>

              <div className="py-3 border-y border-zinc-100 dark:border-zinc-800/50 space-y-3">
                <span className="text-zinc-500 text-sm font-medium block">Items</span>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{item.name} <span className="text-zinc-400">× {item.quantity}</span></span>
                    <span className="font-bold text-zinc-900 dark:text-white">Rs. {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Date</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedOrder.date}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Status</span>
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                  selectedOrder.status === "COLLECTED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500" :
                  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                }`}>
                  {selectedOrder.statusLabel}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Total</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedOrder.amount}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="w-full py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold uppercase tracking-widest transition-all text-center cursor-pointer font-semibold"
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

