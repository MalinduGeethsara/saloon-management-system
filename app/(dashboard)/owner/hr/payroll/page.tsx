"use client";

import React, { useState, useRef } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Input, 
  Statistic, 
  Row, 
  Col, 
  Avatar, 
  Dropdown,
  MenuProps,
  Space
} from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import { 
  SearchOutlined, 
  BankOutlined, 
  MoreOutlined,
  PayCircleOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";

const { Title, Text } = Typography;

// --- Mock Data ---
const INITIAL_PAYROLL = [
  { key: '1', name: "Kasun Perera", role: "Senior Barber", basic: 75000, bonus: 10000, total: 85000, status: "Paid" },
  { key: '2', name: "Amila Silva", role: "Junior Barber", basic: 40000, bonus: 5000, total: 45000, status: "Pending" },
  { key: '3', name: "Nimali Dias", role: "Receptionist", basic: 35000, bonus: 5000, total: 40000, status: "Processing" },
];

function PayrollContent() {
  const [payroll, setPayroll] = useState(INITIAL_PAYROLL);
  
  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

  const handleProcessPayment = (key: string) => {
    setPayroll(prev => prev.map(p => p.key === key ? { ...p, status: 'Paid' } : p));
    showAlert('success', 'Payment marked as Paid.');
  };

  // --- Column Search Setup ---
  const getColumnSearchProps = (dataIndex: string, placeholder: string): TableColumnType<any> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${placeholder}`}
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
            style={{ width: 90, backgroundColor: '#7C4DFF' }}
          >
            Search
          </Button>
          <Button
            onClick={() => { clearFilters && clearFilters(); confirm(); }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#7C4DFF' : undefined, fontSize: '16px' }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  // --- Columns ---
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name', 'Employee'), // Added Search Here
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar style={{ backgroundColor: '#F3E8FF', color: '#7C4DFF' }}>{text[0]}</Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{text}</span>
            <span className="text-xs text-slate-500">{record.role}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basic',
      key: 'basic',
      render: (val: number) => <span>Rs. {val.toLocaleString()}</span>,
    },
    {
      title: 'Bonus/Comms',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (val: number) => <span className="text-emerald-600">+ Rs. {val.toLocaleString()}</span>,
    },
    {
      title: 'Total Payable',
      dataIndex: 'total',
      key: 'total',
      render: (val: number) => <span className="font-bold text-slate-800">Rs. {val.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Paid', value: 'Paid' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Processing', value: 'Processing' },
      ],
      onFilter: (value: any, record: any) => record.status === value, // Added Filter Here
      render: (status: string) => {
        let color = 'blue';
        if (status === 'Paid') color = 'green';
        if (status === 'Pending') color = 'gold';
        return <Tag color={color} className="rounded-full px-3 font-semibold">{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'pay',
            label: 'Mark as Paid',
            icon: <PayCircleOutlined />,
            disabled: record.status === 'Paid',
            onClick: () => handleProcessPayment(record.key),
          },
          {
            key: 'print',
            label: 'Print Slip',
            icon: <PrinterOutlined />,
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Payroll Management</Title>
          <Text type="secondary">Manage employee salaries, bonuses, and payment status.</Text>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {/* Removed Global Search Bar */}
          <Button 
            type="primary" 
            size="large" 
            icon={<BankOutlined />} 
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none"
          >
            Run Payroll
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Disbursed</span>}
              value={payroll.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.total, 0)} 
              prefix={<span className="text-emerald-500 text-2xl mr-2">Rs.</span>}
              valueStyle={{ fontWeight: 800, color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Pending Payments</span>}
              value={payroll.filter(p => p.status !== 'Paid').reduce((acc, curr) => acc + curr.total, 0)} 
              prefix={<span className="text-amber-500 text-2xl mr-2">Rs.</span>}
              valueStyle={{ fontWeight: 800, color: '#F59E0B' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }} // FIX: Updated bodyStyle API
      >
        <Table 
          columns={columns} 
          dataSource={payroll} 
          pagination={{ pageSize: 8 }}
          rowKey="key"
        />
      </Card>
    </div>
  );
}

export default function PayrollPage() {
  return (
    <AlertProvider>
      <PayrollContent />
    </AlertProvider>
  );
}