"use client";

import React, { useState, useRef } from "react";
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
  Input,
  Space,
  Avatar,
  Dropdown,
  MenuProps
} from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  PrinterOutlined, 
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  PlusOutlined,
  SyncOutlined,
  DownOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { NewBookingModal } from "@/components/modals/NewBookingModal";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { InvoiceModal } from "@/components/modals/InvoiceModal";

import dayjs from 'dayjs';

const { Title, Text } = Typography;

// --- Mock Initial Data ---
const INITIAL_BOOKINGS = [
  { key: "1", id: "B-101", client: "Kamal Perera", barber: "Nuwan Pradeep", status: "Pending", total: 2500, date: "2023-10-26" },
  { key: "2", id: "B-102", client: "Saman Kumara", barber: "Kasun Perera", status: "Confirmed", total: 1800, date: "2023-10-26" },
  { key: "3", id: "B-103", client: "Nimal Siripala", barber: "Lahiru Thirimanne", status: "Pending", total: 3200, date: "2023-10-27" },
  { key: "4", id: "B-104", client: "Ruwan Fernando", barber: "Nuwan Pradeep", status: "Cancelled", total: 1500, date: "2023-10-25" },
];

const BARBERS_LIST = [
  { id: 1, name: 'Nuwan Pradeep', color: '#18181b' },
  { id: 2, name: 'Kasun Perera', color: '#7C4DFF' },
  { id: 3, name: 'Lahiru Thirimanne', color: '#2563eb' },
];

function ManageBookingsContent() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [modalType, setModalType] = useState<'accept' | 'decline' | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  
  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

  // --- Column Search Logic ---
  const getColumnSearchProps = (dataIndex: string, title: string): TableColumnType<any> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${title}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, backgroundColor: '#7C4DFF', border: 'none' }}
          >
            Search
          </Button>
          <Button onClick={() => { clearFilters && clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#7C4DFF' : undefined, fontSize: '14px' }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase()),
    // ✅ FIXED: Modern API for filter dropdown open changes
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

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
    } else if (modalType === 'decline') {
      setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
      showAlert("error", `Booking ${selectedBookingId} was declined.`);
    }
    setIsModalOpen(false);
    setSelectedBookingId(null);
    setModalType(null);
  };

  const handleSaveNewBooking = (newBookingData: any) => {
    const newEntry = {
      key: String(Date.now()),
      id: `B-${Math.floor(1000 + Math.random() * 9000)}`,
      client: newBookingData.title,
      barber: newBookingData.extendedProps.barberName,
      status: "Confirmed", 
      total: 2000, 
      date: dayjs(newBookingData.start).format("YYYY-MM-DD")
    };
    setBookings(prev => [newEntry, ...prev]);
    setIsAddModalOpen(false);
    showAlert("success", "Manual booking created.");
  };

  const handleGenerateBill = (record: any) => {
    setPaymentData({
      bookingId: record.id, client: record.client, barber: record.barber, date: record.date,
      items: [{ type: 'Service', name: 'Salon Service Booking', price: record.total }] 
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (finalData: any) => {
    setIsPaymentModalOpen(false);
    setBookings(prev => prev.map(b => b.id === finalData.bookingId ? { ...b, status: "Paid" } : b));
    setInvoiceData(finalData);
    setTimeout(() => setIsInvoiceModalOpen(true), 300); 
    showAlert("success", "Payment recorded successfully.");
  };

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ...getColumnSearchProps('id', 'Booking ID'),
      render: (text: string) => <span className="font-mono text-xs font-bold text-slate-500">{text}</span>,
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      width: 200,
      ...getColumnSearchProps('client', 'Client'),
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>,
    },
    {
      title: 'Specialist',
      dataIndex: 'barber',
      key: 'barber',
      width: 200,
      filters: BARBERS_LIST.map(b => ({ text: b.name, value: b.name })),
      onFilter: (value: any, record: any) => record.barber === value,
      render: (text: string) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Avatar size="small" icon={<UserOutlined />} className="bg-slate-100" /> {text}
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (amount: number) => <span className="font-bold text-slate-800">Rs. {amount.toLocaleString()}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date: string) => <span className="text-slate-500">{dayjs(date).format('MMM DD, YYYY')}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        let color = 'default';
        if (status === 'Confirmed') color = 'blue';
        if (status === 'Paid') color = 'green';
        if (status === 'Pending') color = 'gold';
        if (status === 'Cancelled') color = 'red';
        return <Tag color={color} className="rounded-full px-3 font-semibold border-0">{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 180,
      render: (_: any, record: any) => (
        <div className="flex justify-end gap-2">
          {record.status === "Pending" && (
            <>
              <Tooltip title="Accept">
                <Button 
                  type="text" shape="circle" 
                  icon={<CheckCircleOutlined className="text-emerald-500" />} 
                  onClick={() => handleActionClick(record.id, 'accept')}
                  className="bg-emerald-50 hover:bg-emerald-100"
                />
              </Tooltip>
              <Tooltip title="Decline">
                <Button 
                  type="text" shape="circle" 
                  icon={<CloseCircleOutlined className="text-red-500" />} 
                  onClick={() => handleActionClick(record.id, 'decline')}
                  className="bg-red-50 hover:bg-red-100"
                />
              </Tooltip>
            </>
          )}
          {record.status === "Confirmed" && (
            <Tooltip title="Process Payment & Invoice">
              <Button 
                type="text" shape="circle" 
                icon={<PrinterOutlined className="text-[#7C4DFF]" />} 
                onClick={() => handleGenerateBill(record)}
                className="bg-[#F3E8FF] hover:bg-[#E9D5FF]"
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Booking Requests</Title>
          <Text type="secondary">Swipe table horizontally to see all columns on mobile.</Text>
        </div>
        
        <Button 
          type="primary" size="large" icon={<PlusOutlined />} 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none h-12 w-full md:w-auto"
        >
          Manual Booking
        </Button>
      </div>

      {/* KPI Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl">
            <Statistic title={<span className="text-xs font-bold text-gray-400 uppercase">Requests</span>} value={bookings.length} prefix={<CalendarOutlined style={{ color: '#7C4DFF' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl">
            <Statistic 
  title={<span className="text-xs font-bold text-gray-400 uppercase">Pending</span>} 
  value={bookings.filter(b => b.status === 'Pending').length} 
  styles={{ content: { color: '#F59E0B', fontWeight: 800 } }}
/>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl">
            <Statistic title={<span className="text-xs font-bold text-gray-400 uppercase">Confirmed</span>} value={bookings.filter(b => b.status === 'Confirmed' || b.status === 'Paid').length} valueStyle={{ color: '#10B981', fontWeight: 800 }} />
          </Card>
        </Col>
      </Row>

      {/* Full Swipeable Table */}
      <Card 
        variant="borderless" 
        className="shadow-sm rounded-3xl overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        <Table 
          columns={columns} 
          dataSource={bookings} 
          pagination={{ pageSize: 8 }}
          rowKey="key"
          // x: 1200 ensures it is wider than mobile screens to force swiping
          scroll={{ x: 1200 }} 
          className="booking-swipe-table"
        />
      </Card>

      <NewBookingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewBooking} barbers={BARBERS_LIST} />
      
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

export default function ManageBookings() {
  return (
    <AlertProvider>
      <ManageBookingsContent />
    </AlertProvider>
  );
}