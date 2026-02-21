"use client";

import React, { useState } from "react";
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Statistic, 
  Row, 
  Col, 
  Tooltip,
  Input
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  PrinterOutlined, 
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  PlusOutlined // Imported for the new button
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
// 1. IMPORT THE MODAL
import { NewBookingModal } from "@/components/modals/NewBookingModal";
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// --- Mock Initial Data ---
const INITIAL_BOOKINGS = [
  { key: "1", id: "B-101", client: "Kamal Perera", barber: "Nuwan Pradeep", status: "Pending", total: 2500, date: "2023-10-26" },
  { key: "2", id: "B-102", client: "Saman Kumara", barber: "Kasun Perera", status: "Confirmed", total: 1800, date: "2023-10-26" },
  { key: "3", id: "B-103", client: "Nimal Siripala", barber: "Lahiru Thirimanne", status: "Pending", total: 3200, date: "2023-10-27" },
  { key: "4", id: "B-104", client: "Ruwan Fernando", barber: "Nuwan Pradeep", status: "Cancelled", total: 1500, date: "2023-10-25" },
];

// --- Barber Data for the Modal ---
const BARBERS_LIST = [
  { id: 1, name: 'Nuwan Pradeep', color: '#18181b' },
  { id: 2, name: 'Kasun Perera', color: '#7C4DFF' },
  { id: 3, name: 'Lahiru Thirimanne', color: '#2563eb' },
];

function ManageBookingsContent() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false); // For Confirmation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For New Booking
  
  const [modalType, setModalType] = useState<'accept' | 'decline' | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  const { showAlert } = useAlert();

  // --- Handlers ---

  const handleActionClick = (id: string, type: 'accept' | 'decline') => {
    setSelectedBookingId(id);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedBookingId || !modalType) return;

    if (modalType === 'accept') {
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBookingId ? { ...b, status: "Confirmed" } : b))
      );
      showAlert("success", `Booking ${selectedBookingId} confirmed successfully.`);
    } 
    
    else if (modalType === 'decline') {
      setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
      showAlert("error", `Booking ${selectedBookingId} was declined.`);
    }

    setIsModalOpen(false);
    setSelectedBookingId(null);
    setModalType(null);
  };

  // 2. HANDLE SAVING FROM THE NEW BOOKING MODAL
  const handleSaveNewBooking = (newBookingData: any) => {
    // Transform the data from the modal to match the table structure
    const newEntry = {
      key: newBookingData.id,
      id: `B-${Math.floor(1000 + Math.random() * 9000)}`, // Generate ID
      client: newBookingData.title,
      barber: newBookingData.extendedProps.barberName,
      status: "Confirmed", // Manual bookings are usually confirmed immediately
      total: 2000, // Placeholder price (since modal doesn't calculate it yet)
      date: dayjs(newBookingData.start).format("YYYY-MM-DD")
    };

    setBookings(prev => [newEntry, ...prev]);
    setIsAddModalOpen(false);
    showAlert("success", "Manual booking created successfully.");
  };

  const handlePrint = (id: string) => {
    showAlert("success", `Generating invoice for ${id}...`);
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  // --- Filter ---
  const filteredBookings = bookings.filter(b => 
    b.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Columns ---
  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono text-xs font-bold text-slate-500">{text}</span>,
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>,
    },
    {
      title: 'Specialist',
      dataIndex: 'barber',
      key: 'barber',
      render: (text: string) => (
        <div className="flex items-center gap-2 text-slate-600">
          <UserOutlined /> {text}
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => <span className="font-bold text-slate-800">Rs. {amount.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'Confirmed') color = 'green';
        if (status === 'Pending') color = 'gold';
        if (status === 'Cancelled') color = 'red';
        
        return (
          <Tag color={color} className="rounded-full px-3 font-semibold border-0">
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div className="flex justify-end gap-2">
          {record.status === "Pending" && (
            <>
              <Tooltip title="Accept Booking">
                <Button 
                  type="text" 
                  shape="circle" 
                  icon={<CheckCircleOutlined className="text-emerald-500" />} 
                  onClick={() => handleActionClick(record.id, 'accept')}
                  className="bg-emerald-50 hover:bg-emerald-100"
                />
              </Tooltip>
              <Tooltip title="Decline Booking">
                <Button 
                  type="text" 
                  shape="circle" 
                  icon={<CloseCircleOutlined className="text-red-500" />} 
                  onClick={() => handleActionClick(record.id, 'decline')}
                  className="bg-red-50 hover:bg-red-100"
                />
              </Tooltip>
            </>
          )}
          
          <Tooltip title="Print Invoice">
            <Button 
              type="text" 
              shape="circle" 
              icon={<PrinterOutlined className="text-slate-500" />} 
              onClick={() => handlePrint(record.id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Booking Requests</Title>
          <Text type="secondary">Manage incoming appointments and invoices.</Text>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search bookings..." 
            size="large"
            className="rounded-xl w-full md:w-48"
            onChange={e => setSearchTerm(e.target.value)}
          />
          {/* 3. NEW MANUAL BOOKING BUTTON */}
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none"
          >
            Manual Booking
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Requests</span>}
              value={bookings.length} 
              prefix={<CalendarOutlined style={{ color: '#7C4DFF', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Pending</span>}
              value={bookings.filter(b => b.status === 'Pending').length} 
              prefix={<CheckCircleOutlined style={{ color: '#F59E0B', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#F59E0B' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Confirmed Today</span>}
              value={bookings.filter(b => b.status === 'Confirmed').length} 
              prefix={<CheckCircleOutlined style={{ color: '#10B981', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 800, color: '#10B981' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredBookings} 
          pagination={{ pageSize: 8 }}
          rowKey="key"
        />
      </Card>

      {/* 4. LINKED NEW BOOKING MODAL */}
      <NewBookingModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewBooking}
        barbers={BARBERS_LIST}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={modalType === 'accept' ? "Confirm Booking?" : "Decline Booking?"}
        description={
          modalType === 'accept' 
            ? "Are you sure you want to confirm this booking? The client will be notified immediately."
            : "Are you sure you want to decline this request? This action cannot be undone."
        }
        confirmText={modalType === 'accept' ? "Yes, Confirm" : "Yes, Decline"}
        isDanger={modalType === 'decline'}
      />
    </div>
  );
}

// Export wrapper with Provider
export default function ManageBookings() {
  return (
    <AlertProvider>
      <ManageBookingsContent />
    </AlertProvider>
  );
}