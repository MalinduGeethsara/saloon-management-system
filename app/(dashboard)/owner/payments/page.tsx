"use client";

import React, { useState, useRef } from 'react';
import { 
  Table, Card, Typography, Tag, Button, Input, Statistic, Row, Col, Tooltip, Space
} from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import { 
  PlusOutlined, SearchOutlined, WalletOutlined, CreditCardOutlined, EyeOutlined 
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { InvoiceModal } from "@/components/modals/InvoiceModal";

const { Title, Text } = Typography;

// --- Mock Data ---
const INITIAL_PAYMENTS = [
  { 
    key: '1', id: "INV-1023", client: "Kamal Perera", contact: "0771234567", barber: "Malith Sandaruwan",
    items: [{ name: "Haircut", type: "Service", price: 2500 }], 
    amount: 2500, method: "Cash", date: "2023-10-24" 
  },
  { 
    key: '2', id: "INV-1024", client: "Saman Kumara", contact: "0719876543", barber: "Mahesh Madushanka",
    items: [{ name: "Beard Trim", type: "Service", price: 1500 }], 
    amount: 1500, method: "Card", date: "2023-10-24" 
  },
  { 
    key: '3', id: "INV-1025", client: "Nimal Siripala", contact: "0765551234", barber: "Vindana Lakmal",
    items: [{ name: "Haircut", type: "Service", price: 2500 }, { name: "Hair Gel", type: "Product", price: 5000 }], 
    amount: 7500, method: "Transfer", date: "2023-10-25" 
  },
];

function PaymentsContent() {
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  
  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false); 
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null); 

  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

  const handleAddNew = () => {
    setIsPaymentModalOpen(true);
  };

  const handleViewInvoice = (record: any) => {
    setSelectedInvoice(record);
    setIsInvoiceModalOpen(true);
  };

  const handleSavePayment = (paymentData: any) => {
    const finalRecord = { ...paymentData, key: Date.now().toString() };
    setPayments(prev => [finalRecord, ...prev]);
    showAlert('success', 'Payment recorded successfully.');
    
    setIsPaymentModalOpen(false); 
    setSelectedInvoice(finalRecord); 
    setTimeout(() => setIsInvoiceModalOpen(true), 300); // Wait for modal animation, then open Print View
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
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalTransactions = payments.length;

  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      align: 'left' as const,
      ...getColumnSearchProps('id', 'ID'), 
      render: (text: string) => <span className="font-mono text-xs font-bold text-slate-500">{text}</span>,
    },
    {
      title: 'Client Details',
      dataIndex: 'client',
      key: 'client',
      width: 250,
      align: 'left' as const,
      ...getColumnSearchProps('client', 'Client'), 
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-[14px]">{text}</span>
          <span className="text-[11px] text-slate-500">
            {record.items?.length > 1 ? `${record.items[0].name} +${record.items.length - 1} more` : record.items?.[0]?.name}
          </span>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right' as const, // Right-align financial figures
      render: (amount: number) => <span className="font-mono font-bold text-slate-800 text-[15px]">Rs. {amount.toLocaleString()}</span>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 140,
      align: 'center' as const, // Center align tags
      filters: [
        { text: 'Cash', value: 'Cash' },
        { text: 'Card', value: 'Card' },
        { text: 'Transfer', value: 'Transfer' },
      ],
      onFilter: (value: any, record: any) => record.method === value,
      render: (method: string) => (
        <Tag className="font-semibold px-3 py-0.5 rounded-md" icon={method === 'Cash' ? <WalletOutlined /> : <CreditCardOutlined />}>{method}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      align: 'center' as const,
      render: (text: string) => <span className="text-slate-500">{text}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'right' as const, // Push action icon to the right
      render: (_: any, record: any) => (
        <div className="flex items-center justify-end">
          <Tooltip title="View/Print Invoice">
            <Button 
              type="text" 
              shape="circle" 
              icon={<EyeOutlined className="text-[#7C4DFF] text-lg" />} 
              onClick={() => handleViewInvoice(record)} 
              className="bg-[#F3E8FF] hover:bg-[#E9D5FF]"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Payments & Billing</Title>
          <Text type="secondary">Manage transactions, invoices, and revenue. Swipe table to see all data.</Text>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleAddNew}
          className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold border-none w-full md:w-auto h-12 shadow-md shadow-purple-100"
        >
          Create Bill
        </Button>
      </div>

      {/* KPI Stats - Centered on Mobile */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>} 
              value={totalRevenue} 
              prefix={<span className="text-emerald-500 text-lg md:text-xl font-bold mr-1">Rs.</span>} 
              styles={{ content: { fontWeight: 800, color: '#10B981', fontSize: '24px' } }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transactions</span>} 
              value={totalTransactions} 
              styles={{ content: { fontWeight: 800, color: '#7C4DFF', fontSize: '24px' } }} 
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
          dataSource={payments} 
          pagination={{ pageSize: 8, size: 'small' }} 
          rowKey="key" 
          // Force horizontal scroll for the entire table
          scroll={{ x: 900 }}
        />
      </Card>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        onSave={handleSavePayment} 
      />
      <InvoiceModal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)} 
        data={selectedInvoice} 
      />
    </div>
  );
}

export default function OwnerPayments() {
  return (
    <AlertProvider>
      <PaymentsContent />
    </AlertProvider>
  );
}