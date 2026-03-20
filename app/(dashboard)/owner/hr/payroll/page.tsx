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
            style={{ width: 90, backgroundColor: '#7C4DFF', border: 'none' }}
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
      record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  // --- Columns ---
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      // REMOVED fixed: 'left' for full row swipe
      width: 250,
      align: 'left' as const,
      ...getColumnSearchProps('name', 'Employee'),
      render: (text: string, record: any) => (
        <Space size="middle">
          <Avatar style={{ backgroundColor: '#F3E8FF', color: '#7C4DFF' }}>{text[0]}</Avatar>
          <div className="flex flex-col">
            <Text strong className="text-slate-800">{text}</Text>
            <Text type="secondary" className="text-[11px]">{record.role}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Basic Salary',
      dataIndex: 'basic',
      key: 'basic',
      width: 140,
      align: 'right' as const, // Numbers align right
      render: (val: number) => <Text className="font-mono">Rs. {val.toLocaleString()}</Text>,
    },
    {
      title: 'Bonus/Comms',
      dataIndex: 'bonus',
      key: 'bonus',
      width: 140,
      align: 'right' as const, // Numbers align right
      render: (val: number) => <Text className="text-emerald-600 font-mono">+ Rs. {val.toLocaleString()}</Text>,
    },
    {
      title: 'Total Payable',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right' as const, // Numbers align right
      render: (val: number) => <Text strong className="text-slate-800 font-mono text-[15px]">Rs. {val.toLocaleString()}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center' as const, // Tags align center
      filters: [
        { text: 'Paid', value: 'Paid' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Processing', value: 'Processing' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string) => {
        let color = 'blue';
        if (status === 'Paid') color = 'green';
        if (status === 'Pending') color = 'gold';
        return <Tag color={color} className="rounded-full px-4 font-bold border-0">{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      // REMOVED fixed: 'right' so it sits at the end of the swipe
      width: 100,
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
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button type="text" shape="circle" icon={<MoreOutlined className="text-lg" />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} className="m-0 font-black">Payroll Management</Title>
          <Text type="secondary">Manage employee salaries, bonuses, and payment status.</Text>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<BankOutlined />} 
          className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold border-none w-full md:w-auto h-12 shadow-md shadow-purple-100"
        >
          Run Payroll
        </Button>
      </div>

      {/* KPI Stats - Centered on Mobile */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Disbursed</Text>}
              value={payroll.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.total, 0)} 
              prefix={<span className="text-emerald-500 text-lg md:text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#10B981', fontSize: '24px' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Payments</Text>}
              value={payroll.filter(p => p.status !== 'Paid').reduce((acc, curr) => acc + curr.total, 0)} 
              prefix={<span className="text-amber-500 text-lg md:text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#F59E0B', fontSize: '24px' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table Container - FULL SWIPE */}
      <Card 
        variant="borderless" 
        className="shadow-sm rounded-3xl overflow-hidden"
        styles={{ body: { padding: 0 } }} 
      >
        <Table 
          columns={columns} 
          dataSource={payroll} 
          pagination={{ pageSize: 8, size: 'small' }}
          rowKey="key"
          // Force horizontal scroll for the entire table
          scroll={{ x: 1000 }} 
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