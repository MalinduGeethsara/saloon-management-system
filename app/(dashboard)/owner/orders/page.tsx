"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Typography,
  Tag,
  Button,
  Statistic,
  Row,
  Col,
  Input,
  Segmented,
  Tooltip
} from 'antd';
import {
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { getAllOrders, updateOrderStatus } from "@/lib/actions/orders";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { useAccess } from "@/hooks/useAccess";

const { Title, Text } = Typography;

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Pickup' | 'Collected'>('All');

  // Server-side pagination: search + status filter run in the database, KPI counts are overall totals
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, collected: 0 });
  const requestSeq = React.useRef(0);

  // Arrived from a notification (?order=ID): show just that order (its ORD-xxxxxx number goes in the search box)
  const router = useRouter();
  const focusId = useSearchParams().get('order');
  React.useEffect(() => {
    if (!focusId) return;
    setStatusFilter('All');
    setSearchTerm(`ORD-${focusId.slice(0, 6).toUpperCase()}`);
    router.replace('/owner/orders', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  // Permissions: the owner's tick-boxes for this page
  const canEdit = useAccess('/owner/orders').edit;

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<any>(null);

  const { showAlert } = useAlert();

  const fetchOrders = async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const res = await getAllOrders({
        page,
        pageSize: PAGE_SIZE,
        q: debouncedSearch,
        status: statusFilter === 'Pending Pickup' ? 'PENDING_PICKUP' : statusFilter === 'Collected' ? 'COLLECTED' : 'ALL',
      });
      if (seq !== requestSeq.current) return; // superseded by a newer request
      if (res.success && res.data) {
        // e.g. the last row of the last page was just updated out of the filter: step back a page
        if (res.data.length === 0 && (res.total ?? 0) > 0 && page > 1) {
          setPage(Math.max(1, Math.ceil((res.total ?? 0) / PAGE_SIZE)));
          return;
        }
        setOrders(res.data);
        setTotal(res.total ?? 0);
        if (res.stats) setStats(res.stats);
      } else {
        showAlert('error', res.message || 'Failed to fetch orders');
      }
    } catch (e) {
      showAlert('error', 'Error fetching orders');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

  // Debounce the search box; a new search always starts from page 1
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  React.useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, statusFilter]);

  const handleToggleClick = (record: any) => {
    setTargetOrder(record);
    setIsConfirmOpen(true);
  };

  const confirmToggle = async () => {
    if (!targetOrder) return;
    const nextStatus = targetOrder.status === 'COLLECTED' ? 'PENDING_PICKUP' : 'COLLECTED';
    const res = await updateOrderStatus(targetOrder.key, nextStatus);
    if (res.success) {
      showAlert('success', nextStatus === 'COLLECTED' ? 'Order marked as collected.' : 'Order reverted to pending pickup.');
      fetchOrders();
    } else {
      showAlert('error', res.message || 'Failed to update order.');
    }
    setIsConfirmOpen(false);
    setTargetOrder(null);
  };

  const pendingCount = stats.pending;
  const collectedCount = stats.collected;

  const columns: any = [
    {
      title: 'Order',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono font-bold text-slate-700">{text}</span>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-sm">{record.customerName}</span>
          <span className="text-xs text-slate-500">{record.customerPhone}</span>
        </div>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_: any, record: any) => {
        const names = record.items.map((i: any) => i.name).join(', ');
        return (
          <Tooltip title={names}>
            <span className="text-sm text-slate-600 line-clamp-1 max-w-[220px] inline-block truncate align-bottom">{names}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => <span className="font-mono font-medium">Rs. {v.toLocaleString()}</span>,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (s: string) => <Tag color={s === 'WEBSITE' ? 'blue' : 'default'}>{s === 'WEBSITE' ? 'Website' : 'Walk-in'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => s === 'COLLECTED'
        ? <Tag color="green">Collected</Tag>
        : <Tag color="orange">Pending Pickup</Tag>,
    },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_: any, record: any) => {
        if (!canEdit) return <span className="text-xs text-slate-400">No Access</span>;
        return record.status === 'COLLECTED' ? (
          <Button size="small" icon={<UndoOutlined />} onClick={() => handleToggleClick(record)}>
            Revert
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            style={{ backgroundColor: '#7C4DFF' }}
            onClick={() => handleToggleClick(record)}
          >
            Mark Collected
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1585, margin: '0 auto', paddingBottom: 40 }}>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex-1">
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Order Management</Title>
          <Text type="secondary">Track product orders sold through bookings and walk-in bills.</Text>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="overflow-x-auto">
            <Segmented
              options={['All', 'Pending Pickup', 'Collected']}
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val as any); setPage(1); }}
              size="large"
            />
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search orders"
            size="large"
            className="sm:flex-1 md:w-64 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Orders</span>}
              value={stats.total}
              prefix={<ShoppingCartOutlined style={{ color: '#7C4DFF' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span className="text-xs font-bold text-gray-400 uppercase">Pending Pickup</span>}
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#F59E0B' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span className="text-xs font-bold text-gray-400 uppercase">Collected</span>}
              value={collectedCount}
              prefix={<CheckCircleOutlined style={{ color: '#059669' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <ResponsiveTable
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: (p) => setPage(p) }}
          rowKey="key"
          expandable={{
            expandedRowRender: (record: any) => (
              <div className="py-2">
                {record.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 px-4 text-sm">
                    <span className="text-slate-600">{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                    <span className="font-mono font-medium text-slate-700">Rs. {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ),
          }}
          renderMobileCard={(record: any) => (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{record.customerName}</div>
                  <div className="text-xs text-slate-500">{record.customerPhone}</div>
                </div>
                {record.status === 'COLLECTED' ? <Tag color="green" className="m-0">Collected</Tag> : <Tag color="orange" className="m-0">Pending Pickup</Tag>}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {record.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="truncate">{item.name} <span className="text-slate-400">× {item.quantity}</span></span>
                    <span className="font-mono shrink-0">Rs. {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span><span className="font-mono font-bold">{record.id}</span> • {record.date} • {record.source === 'WEBSITE' ? 'Website' : 'Walk-in'}</span>
                <span className="font-mono font-bold text-slate-800">Rs. {record.totalAmount.toLocaleString()}</span>
              </div>
              {canEdit && (
                <div className="mt-3 flex justify-end">
                  {record.status === 'COLLECTED' ? (
                    <Button size="small" icon={<UndoOutlined />} onClick={(e) => { e.stopPropagation(); handleToggleClick(record); }}>Revert</Button>
                  ) : (
                    <Button size="small" type="primary" icon={<CheckCircleOutlined />} style={{ backgroundColor: '#7C4DFF' }} onClick={(e) => { e.stopPropagation(); handleToggleClick(record); }}>Mark Collected</Button>
                  )}
                </div>
              )}
            </div>
          )}
        />
      </Card>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setTargetOrder(null); }}
        onConfirm={confirmToggle}
        title={targetOrder?.status === 'COLLECTED' ? 'Revert to Pending Pickup?' : 'Mark Order as Collected?'}
        description={targetOrder?.status === 'COLLECTED'
          ? 'This will mark the order as not yet picked up by the customer.'
          : 'Confirm the customer has picked up all items in this order.'}
        confirmText={targetOrder?.status === 'COLLECTED' ? 'Yes, Revert' : 'Yes, Mark Collected'}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AlertProvider>
      <Suspense fallback={null}>
        <OrdersContent />
      </Suspense>
    </AlertProvider>
  );
}
