"use client";

import React, { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Segmented,
  Select,
  Avatar,
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  PrinterOutlined, 
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { NewBookingModal } from '@/components/modals/NewBookingModal';
import { useAccess } from '@/hooks/useAccess';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { InvoiceModal } from '@/components/modals/InvoiceModal';
import BookingActionModal from '@/components/modals/BookingActionModal';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';

import dayjs from 'dayjs';

const { Title, Text } = Typography;

// --- Mock Initial Data ---
const INITIAL_BOOKINGS = [
  { key: "1", id: "B-101", client: "Kamal Perera", barber: "Malith Sandaruwan", status: "Pending", total: 2500, date: "2023-10-26" },
  { key: "2", id: "B-102", client: "Saman Kumara", barber: "Mahesh Madushanka", status: "Confirmed", total: 1800, date: "2023-10-26" },
  { key: "3", id: "B-103", client: "Nimal Siripala", barber: "Vindana Lakmal", status: "Pending", total: 3200, date: "2023-10-27" },
  { key: "4", id: "B-104", client: "Ruwan Fernando", barber: "Malith Sandaruwan", status: "Cancelled", total: 1500, date: "2023-10-25" },
];

const BARBERS_LIST = [
  { id: '1', name: 'Malith Sandaruwan', color: '#18181b' },
  { id: '2', name: 'Mahesh Madushanka', color: '#7C4DFF' },
  { id: '3', name: 'Vindana Lakmal', color: '#2563eb' },
];

// One API booking -> one table row
const toRow = (b: any) => ({
  key: b.id,
  id: b.id,
  client: b.customer?.name || 'Unknown',
  barber: b.barber?.name || 'Unknown',
  branch: b.shop?.name || 'Global / All',
  status: b.status === 'CONFIRMED' ? 'Confirmed' : b.status === 'COMPLETED' ? 'Paid' : b.status === 'CANCELLED' ? 'Cancelled' : 'Pending',
  total: b.totalAmount,
  date: b.date,
  // Already paid online (e.g. via the payment gateway at booking time) vs. still needs
  // payment collected in person — determines whether Payment Method is editable later.
  paymentStatus: b.payment?.status,
  paymentMethod: b.payment?.method,
  source: b.source, // 'WEBSITE' (customer booked it themselves) or 'ADMIN' (staff-created)
  // Real booked services/products (name/price), for showing what was actually paid instead of a fake line item
  services: b.services?.map((bs: any) => ({ name: bs.service?.name, price: bs.service?.price })) || [],
  products: b.products?.map((bp: any) => ({ name: bp.product?.name, price: bp.product?.price })) || [],
});

function ManageBookingsContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('owner');
  
  // Permissions
  // What this person may do here (the owner's tick-boxes; the server checks the same rules again)
  const access = useAccess(['/owner/bookings/manage', '/owner/calendar']);
  const canAdd = access.add;
  const canEdit = access.edit;
  const canDelete = access.delete;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); 
  const [modalType, setModalType] = useState<'accept' | 'decline' | 'delete' | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  // Row click actions modal
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  
  const { showAlert } = useAlert();
  const router = useRouter();

  // Arrived from a notification (?booking=ID): open exactly that booking, wherever it is in the list
  const focusId = useSearchParams().get('booking');
  React.useEffect(() => {
    if (!focusId) return;
    let cancelled = false;
    (async () => {
      let found: any = null;
      try {
        const res = await fetch(`/api/v1/bookings?page=1&pageSize=5&q=${encodeURIComponent(focusId)}`);
        const data = await res.json();
        found = (data.bookings || []).find((b: any) => b.id === focusId) || null;
      } catch {}
      if (cancelled) return;
      if (found) {
        setSelectedRow(toRow(found));
        setIsRowModalOpen(true);
      } else {
        showAlert('error', 'That booking could not be found. It may have been deleted.');
      }
      router.replace('/owner/bookings/manage', { scroll: false });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  // Server-side pagination + filters. Search/filters are debounced/reset to page 1; the 5s poll
  // re-requests the *current* page so the user is never bounced back to page 1.
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0 });
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  const queryRef = useRef({ page: 1, q: '', status: 'ALL', source: 'ALL' });
  queryRef.current = { page, q: debouncedSearch, status: statusFilter, source: sourceFilter };
  const requestSeq = useRef(0);

  const fetchBookings = async (showSpinner = false) => {
    const seq = ++requestSeq.current;
    if (showSpinner) setLoading(true);
    try {
      const { page: p, q, status, source } = queryRef.current;
      const qs = new URLSearchParams({ page: String(p), pageSize: String(PAGE_SIZE) });
      if (q) qs.set('q', q);
      if (status !== 'ALL') qs.set('status', status);
      if (source !== 'ALL') qs.set('source', source);

      const res = await fetch(`/api/v1/bookings?${qs.toString()}`);
      const data = await res.json();
      if (seq !== requestSeq.current) return; // a newer request superseded this one

      if (data.bookings) {
        setTotal(data.total ?? 0);
        if (data.stats) setStats(data.stats);
        // e.g. the last row of the last page was deleted: step back to the new last page
        if (data.bookings.length === 0 && data.total > 0 && p > 1) {
          setPage(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
          return;
        }
        setBookings(data.bookings.map(toRow));
      }
    } catch (e) {
      if (showSpinner) showAlert('error', 'Failed to load bookings');
    }
    if (seq === requestSeq.current) setLoading(false);
  };

  // Debounce the search box; a new search always starts from page 1
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  // Any page/filter change loads immediately (with spinner)...
  React.useEffect(() => {
    fetchBookings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, statusFilter, sourceFilter]);

  // ...and a real-time poll every 5 seconds keeps the current view fresh (no spinner)
  React.useEffect(() => {
    const intervalId = setInterval(() => fetchBookings(false), 5000);

    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (roleMatch) {
      setUserRole(roleMatch[2].toLowerCase());
    }

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActionClick = (id: string, type: 'accept' | 'decline' | 'delete') => {
    setSelectedBookingId(id);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBookingId || !modalType) return;
    try {
      if (modalType === 'delete') {
        const res = await fetch(`/api/v1/bookings?id=${selectedBookingId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          showAlert("success", "Booking deleted successfully.");
          fetchBookings();
        } else {
          showAlert("error", "Failed to delete booking.");
        }
      } else {
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
      }
    } catch (e) {
      showAlert("error", "An error occurred.");
    }
    setIsModalOpen(false);
    setSelectedBookingId(null);
    setModalType(null);
  };

  const handleSaveNewBooking = async (newBookingData: any) => {
    try {
      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceIds: newBookingData.extendedProps.serviceIds,
          barberId: newBookingData.extendedProps.barberId,
          shopId: newBookingData.extendedProps.shopId || null,
          date: newBookingData.start,
          amount: newBookingData.extendedProps.amount,
          clientName: newBookingData.title, // Pass the client name for walk-in creation
        })
      });
      if (res.ok) {
        showAlert("success", "Manual booking created.");
        fetchBookings();
        setIsAddModalOpen(false);
      } else {
        const errorData = await res.json();
        showAlert("error", errorData.error || "Failed to create booking.");
      }
    } catch (e) {
      showAlert("error", "An error occurred.");
    }
  };

  // Real booked services + products for a booking, falling back to a single generic line only
  // for legacy bookings that predate this data being tracked.
  const buildBillingItems = (record: any) => {
    const items = [
      ...(record.services?.map((s: any) => ({ type: 'Service', name: s.name, price: s.price })) || []),
      ...(record.products?.map((p: any) => ({ type: 'Product', name: p.name, price: p.price })) || []),
    ];
    return items.length > 0 ? items : [{ type: 'Service', name: 'Salon Service Booking', price: record.total }];
  };

  const handleGenerateBill = (record: any) => {
    const realItems = buildBillingItems(record);

    setPaymentData({
      bookingId: record.id,
      client: record.client === 'Unknown' ? '' : record.client,
      barber: record.barber,
      date: record.date,
      items: realItems,
      // Booked via the public site (already paid + services fixed at booking time) vs. a manual/walk-in bill
      source: record.source,
      alreadyPaid: record.paymentStatus === 'COMPLETED',
      paymentMethod: record.paymentMethod,
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
        fetchBookings(); // Fetch new status to ensure dashboard is real-time
      } else {
        const error = await res.json();
        showAlert("error", error.message || "Failed to record payment.");
      }
    } catch (e) {
      showAlert("error", "An error occurred while processing payment.");
    }
  };

  const handleViewInvoice = (record: any) => {
    // Construct invoice data for already paid bookings
    const amount = record.payment?.amount || record.total || 0;
    const paymentMethod = record.payment?.method || record.paymentMethod || 'CASH';
    setInvoiceData({
      bookingId: record.id,
      client: record.client === 'Unknown' ? '' : record.client,
      barber: record.barber,
      date: record.date,
      method: paymentMethod,
      amount: amount,
      items: buildBillingItems(record)
    });
    setIsInvoiceModalOpen(true);
  };

  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text: string) => <span className="font-mono text-xs font-bold text-slate-500">{text}</span>,
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      width: 200,
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>,
    },
    {
      title: 'Specialist',
      dataIndex: 'barber',
      key: 'barber',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Avatar size="small" icon={<UserOutlined />} className="bg-slate-100" /> {text}
        </div>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => (
        <Tag color={source === 'WEBSITE' ? 'purple' : 'default'} className="rounded-full px-3 font-semibold border-0">
          {source === 'WEBSITE' ? 'Website' : 'Walk-in / Admin'}
        </Tag>
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
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      width: 150,
      render: (text: string) => <span className="text-[12px] font-semibold text-slate-600">{text || 'Global / All'}</span>,
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
        let customClass = "rounded-full px-3 font-semibold border-0";
        if (status === 'Confirmed') color = 'blue';
        if (status === 'Paid') color = 'green';
        if (status === 'Pending') {
          color = 'orange';
          customClass += " animate-pulse shadow-sm shadow-orange-200";
        }
        if (status === 'Cancelled') color = 'red';
        return <Tag color={color} className={customClass}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  const visibleColumns = userRole === 'barber' 
    ? columns.filter((col: any) => col.key !== 'barber')
    : columns;

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Booking Requests</Title>
          <Text type="secondary">Swipe table horizontally to see all columns on mobile.</Text>
        </div>
        
        {canAdd && (
          <Button 
            type="primary" size="large" icon={<PlusOutlined />} 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none h-12 w-full md:w-auto"
          >
            Manual Booking
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl">
            <Statistic title={<span className="text-xs font-bold text-gray-400 uppercase">Requests</span>} value={stats.total} prefix={<CalendarOutlined style={{ color: '#7C4DFF' }} />} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl">
            <Statistic 
  title={<span className="text-xs font-bold text-gray-400 uppercase">Pending</span>} 
  value={stats.pending} 
  styles={{ content: { color: '#F59E0B', fontWeight: 800 } }}
/>
          </Card>
        </Col>
        <Col xs={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl">
            <Statistic 
  title={<span className="text-xs font-bold text-gray-400 uppercase">Confirmed</span>} 
  value={stats.confirmed} 
  styles={{ 
    content: { color: '#10B981', fontWeight: 800 } 
  }} 
/>
          </Card>
        </Col>
      </Row>

      {/* Full Swipeable Table */}
      <Card 
        variant="borderless" 
        className="shadow-sm rounded-3xl overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        {/* Search + filters run on the server so they cover every page, not just the loaded one */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-slate-100">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search bookings"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="lg:max-w-sm"
          />
          <div className="overflow-x-auto">
            <Segmented
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v as string); setPage(1); }}
              options={[
                { label: 'All', value: 'ALL' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Confirmed', value: 'CONFIRMED' },
                { label: 'Paid', value: 'COMPLETED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
            />
          </div>
          <Select
            value={sourceFilter}
            onChange={(v) => { setSourceFilter(v); setPage(1); }}
            className="w-full lg:w-48"
            options={[
              { label: 'All sources', value: 'ALL' },
              { label: 'Website', value: 'WEBSITE' },
              { label: 'Walk-in / Admin', value: 'ADMIN' },
            ]}
          />
        </div>

        <ResponsiveTable
          columns={visibleColumns}
          dataSource={bookings}
          loading={loading}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: (p) => setPage(p),
          }}
          rowKey="key"
          // x: 1200 keeps the desktop columns readable; phones get the card list below instead
          scroll={{ x: 1200 }}
          renderMobileCard={(record) => (
            <div className={`rounded-2xl border p-4 ${record.status === 'Pending' ? 'bg-amber-50/60 border-amber-200' : record.source === 'WEBSITE' ? 'bg-purple-50/60 border-purple-100' : 'bg-white border-slate-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{record.client}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{dayjs(record.date).format('MMM DD, YYYY • h:mm A')}</div>
                </div>
                <Tag
                  color={record.status === 'Confirmed' ? 'blue' : record.status === 'Paid' ? 'green' : record.status === 'Pending' ? 'orange' : record.status === 'Cancelled' ? 'red' : 'default'}
                  className="rounded-full px-3 font-semibold border-0 m-0 shrink-0"
                >
                  {record.status.toUpperCase()}
                </Tag>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-600 flex items-center gap-1.5 min-w-0">
                  <UserOutlined className="text-slate-400" /> <span className="truncate">{record.barber}</span>
                </span>
                <span className="font-bold text-slate-800 shrink-0">Rs. {record.total.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>{record.source === 'WEBSITE' ? 'Website' : 'Walk-in / Admin'} • {record.branch}</span>
                <span className="font-mono">{record.id.slice(0, 8)}</span>
              </div>
            </div>
          )}
          className="booking-swipe-table cursor-pointer"
          rowClassName={(record) =>
            record.status === 'Pending'
              ? 'bg-amber-50/50 hover:bg-amber-100/50'
              : record.source === 'WEBSITE'
                ? '!bg-purple-50/60 hover:!bg-purple-100/50 transition-colors'
                : 'hover:bg-slate-50 transition-colors'
          }
          onRow={(record) => ({
            onClick: () => {
              setSelectedRow(record);
              setIsRowModalOpen(true);
            }
          })}
        />
      </Card>

      <NewBookingModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewBooking} barbers={BARBERS_LIST} />
      
      <ConfirmationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmAction} 
        title={modalType === 'accept' ? "Confirm Booking?" : modalType === 'delete' ? "Delete Booking?" : "Decline Booking?"} 
        description={modalType === 'accept' ? "Confirm and notify client?" : modalType === 'delete' ? "Are you sure you want to completely delete this booking? This action cannot be undone." : "Decline and remove this request?"}
        confirmText={modalType === 'accept' ? "Confirm" : modalType === 'delete' ? "Delete" : "Decline"} 
        isDanger={modalType === 'decline' || modalType === 'delete'} 
      />

      <BookingActionModal 
        isOpen={isRowModalOpen}
        onClose={() => setIsRowModalOpen(false)}
        booking={selectedRow}
        onAccept={(id) => handleActionClick(id, 'accept')}
        onDecline={(id) => handleActionClick(id, 'decline')}
        onDelete={(id) => { setIsRowModalOpen(false); handleActionClick(id, 'delete'); }}
        onGenerateBill={(record) => { setIsRowModalOpen(false); handleGenerateBill(record); }}
        onViewInvoice={(record) => { setIsRowModalOpen(false); handleViewInvoice(record); }}
        canEdit={canEdit}
        canCancel={canDelete}
        canDelete={canDelete}
      />

      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSave={handleSavePayment} paymentToEdit={paymentData} />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} data={invoiceData} />
    </div>
  );
}

export default function ManageBookings() {
  return (
    <AlertProvider>
      <Suspense fallback={null}>
        <ManageBookingsContent />
      </Suspense>
    </AlertProvider>
  );
}