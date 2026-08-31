"use client";

import React, { useState } from 'react';
import {
  Table,
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

const { Title, Text } = Typography;

function OrdersContent() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Pickup' | 'Collected'>('All');

  // Permissions State
  const [canEdit, setCanEdit] = useState(true);

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<any>(null);

  const { showAlert } = useAlert();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        showAlert('error', res.message || 'Failed to fetch orders');
      }
    } catch (e) {
      showAlert('error', 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();

    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (roleMatch) {
      const role = roleMatch[2].toLowerCase();
      if (role !== 'owner' && role !== 'admin') {
        const permMatch = document.cookie.match(new RegExp('(^| )user_permissions=([^;]+)'));
        if (permMatch) {
          try {
            const perms = JSON.parse(decodeURIComponent(permMatch[2]));
            const pagePerms = perms.find((p: any) => p.pageKey === '/owner/orders');
            setCanEdit(pagePerms ? pagePerms.canEdit : false);
          } catch (e) {}
        }
      }
    }
  }, []);

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

  const filteredOrders = orders
    .filter(o => statusFilter === 'All' || (statusFilter === 'Collected') === (o.status === 'COLLECTED'))
    .filter(o =>
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const pendingCount = orders.filter(o => o.status === 'PENDING_PICKUP').length;
  const collectedCount = orders.filter(o => o.status === 'COLLECTED').length;

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

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Segmented
            options={['All', 'Pending Pickup', 'Collected']}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            size="large"
          />
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search order, customer..."
            size="large"
            className="flex-1 md:w-64 rounded-xl"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Orders</span>}
              value={orders.length}
              prefix={<ShoppingCartOutlined style={{ color: '#7C4DFF' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic
              title={<span className="text-xs font-bold text-gray-400 uppercase">Pending Pickup</span>}
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#F59E0B' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
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
        <Table
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          pagination={{ pageSize: 10 }}
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
      <OrdersContent />
    </AlertProvider>
  );
}
