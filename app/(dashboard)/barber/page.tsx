"use client";

import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Avatar, Tag, Empty, Button } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AlertProvider, useAlert } from '@/components/alerts/AlertSystem';
import BookingActionModal from '@/components/modals/BookingActionModal';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { InvoiceModal } from '@/components/modals/InvoiceModal';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

function BarberDashboardContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { showAlert } = useAlert();
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'accept' | 'decline' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const handleActionClick = (id: string, type: 'accept' | 'decline') => {
    setSelectedBookingId(id);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBookingId || !modalType) return;
    try {
      const status = modalType === 'accept' ? 'CONFIRMED' : 'CANCELLED';
      const res = await fetch('/api/v1/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBookingId, status })
      });
      if (res.ok) {
        showAlert("success", `Booking ${modalType === 'accept' ? 'confirmed' : 'declined'} successfully.`);
        fetchBookings();
      } else {
        showAlert("error", "Failed to update booking status.");
      }
    } catch (e) {
      showAlert("error", "An error occurred.");
    }
    setIsModalOpen(false);
    setSelectedBookingId(null);
    setModalType(null);
  };

  const handleGenerateBill = (record: any) => {
    // Determine total properly. The barber table doesn't display total directly, but backend sends it
    const amount = record.payment?.amount || record.services?.reduce((sum: number, s: any) => sum + (s.service?.price || 0), 0) || 0;
    setPaymentData({
      bookingId: record.id, 
      client: record.customer?.name || 'Walk-in', 
      barber: record.barber?.name, 
      date: record.date,
      items: [{ type: 'Service', name: 'Salon Service Booking', price: amount }] 
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (finalData: any) => {
    setIsPaymentModalOpen(false);
    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: finalData.bookingId, 
          action: 'PAYMENT_COMPLETE',
          paymentMethod: finalData.method 
        })
      });
      
      if (res.ok) {
        setInvoiceData(finalData);
        setTimeout(() => setIsInvoiceModalOpen(true), 300); 
        showAlert("success", "Payment recorded successfully.");
        fetchBookings();
      } else {
        const error = await res.json();
        showAlert("error", error.message || "Failed to record payment.");
      }
    } catch (e) {
      showAlert("error", "An error occurred while processing payment.");
    }
  };

  const handleViewInvoice = (record: any) => {
    const amount = record.payment?.amount || record.services?.reduce((sum: number, s: any) => sum + (s.service?.price || 0), 0) || 0;
    const paymentMethod = record.payment?.method || 'CASH';
    setInvoiceData({
      bookingId: record.id, 
      client: record.customer?.name || 'Walk-in', 
      barber: record.barber?.name, 
      date: record.date,
      method: paymentMethod,
      amount: amount,
      items: [{ type: 'Service', name: 'Salon Service Booking', price: amount }] 
    });
    setIsInvoiceModalOpen(true);
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    
    // Add real-time polling every 5 seconds
    const interval = setInterval(() => {
      fetchBookings();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const upcomingBookings = bookings
    .filter(b => dayjs(b.date).isAfter(dayjs()) && b.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const newBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingColumns = [
    {
      title: 'Time',
      dataIndex: 'date',
      key: 'time',
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="font-bold text-[#7C4DFF]">{dayjs(date).format('h:mm A')}</span>
          <span className="text-xs text-slate-400">{dayjs(date).format('MMM DD, YYYY')}</span>
        </div>
      )
    },
    {
      title: 'Client',
      dataIndex: 'customer',
      key: 'client',
      render: (customer: any) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} className="bg-slate-100 text-slate-400" />
          <span className="font-bold text-slate-800">{customer?.name || 'Walk-in'}</span>
        </div>
      )
    },
    {
      title: 'Service',
      dataIndex: 'services',
      key: 'service',
      render: (services: any[]) => <span className="font-medium text-slate-600">{services?.map(s => s.service?.name).filter(Boolean).join(', ') || 'No Service'}</span>
    },
    {
      title: 'Specialist',
      dataIndex: 'barber',
      key: 'barber',
      render: (barber: any) => <span className="font-bold text-[#7C4DFF]">{barber?.name || 'Unassigned'}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let customClass = "rounded-full font-bold px-3 border-0";
        if (status === 'CONFIRMED') color = 'blue';
        if (status === 'PENDING') {
          color = 'orange';
          customClass += " animate-pulse shadow-sm shadow-orange-200";
        }
        return (
          <Tag color={color} className={customClass}>
            {status}
          </Tag>
        );
      }
    }
  ];

  const newlyAddedColumns = [
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="text-xs font-bold text-slate-500">{dayjs(date).fromNow()}</span>
    },
    {
      title: 'Client',
      dataIndex: 'customer',
      key: 'client',
      render: (customer: any) => <span className="font-bold text-slate-800">{customer?.name || 'Walk-in'}</span>
    },
    {
      title: 'Appointment Time',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <span className="font-medium text-slate-600">{dayjs(date).format('MMM DD, h:mm A')}</span>
    },
    {
      title: 'Service',
      dataIndex: 'services',
      key: 'service',
      render: (services: any[]) => <span className="text-slate-500">{services?.map(s => s.service?.name).filter(Boolean).join(', ') || 'No Service'}</span>
    },
    {
      title: 'Specialist',
      dataIndex: 'barber',
      key: 'barber',
      render: (barber: any) => <span className="font-bold text-[#7C4DFF]">{barber?.name || 'Unassigned'}</span>
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-10 px-4 space-y-6">
      <div className="mb-6">
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Welcome Back</Title>
        <Text type="secondary" className="text-sm sm:text-base">Here's your schedule and latest updates.</Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card 
          title={<span className="font-bold text-lg"><CalendarOutlined className="mr-2 text-[#7C4DFF]" /> Upcoming Appointments</span>} 
          variant="borderless" 
          className="shadow-sm rounded-3xl h-full overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          {upcomingBookings.length > 0 ? (
            <Table 
              dataSource={upcomingBookings} 
              columns={upcomingColumns} 
              rowKey="id"
              pagination={false}
              loading={loading}
              className="custom-table cursor-pointer"
              rowClassName="hover:bg-slate-50 transition-colors"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedRow(record);
                  setIsRowModalOpen(true);
                }
              })}
            />
          ) : (
            <div className="p-10 flex justify-center">
              <Empty description="No upcoming appointments" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>

        {/* Newly Added Bookings */}
        <Card 
          title={<span className="font-bold text-lg"><ClockCircleOutlined className="mr-2 text-amber-500" /> Newly Added</span>} 
          variant="borderless" 
          className="shadow-sm rounded-3xl h-full overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          {newBookings.length > 0 ? (
            <Table 
              dataSource={newBookings} 
              columns={newlyAddedColumns} 
              rowKey="id"
              pagination={false}
              loading={loading}
              className="custom-table cursor-pointer"
              rowClassName={(record) => record.status === 'PENDING' ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-slate-50 transition-colors'}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedRow(record);
                  setIsRowModalOpen(true);
                }
              })}
            />
          ) : (
            <div className="p-10 flex justify-center">
              <Empty description="No new bookings recently" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>
      </div>
      
      <BookingActionModal 
        isOpen={isRowModalOpen}
        onClose={() => setIsRowModalOpen(false)}
        booking={selectedRow}
        onAccept={(id) => handleActionClick(id, 'accept')}
        onDecline={(id) => handleActionClick(id, 'decline')}
        onGenerateBill={(record) => { setIsRowModalOpen(false); handleGenerateBill(record); }}
        onViewInvoice={(record) => { setIsRowModalOpen(false); handleViewInvoice(record); }}
      />
      <ConfirmationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmAction} 
        title={modalType === 'accept' ? "Confirm Booking?" : "Decline Booking?"} 
        description={modalType === 'accept' ? "Confirm and notify client?" : "Decline and remove this request?"}
        confirmText={modalType === 'accept' ? "Confirm" : "Decline"} 
        isDanger={modalType === 'decline'} 
      />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} paymentToEdit={paymentData} />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} data={invoiceData} />
    </div>
  );
}

export default function BarberDashboard() {
  return (
    <AlertProvider>
      <BarberDashboardContent />
    </AlertProvider>
  );
}
