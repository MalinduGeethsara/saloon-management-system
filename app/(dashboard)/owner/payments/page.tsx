"use client";

import React, { useState } from 'react';
import { 
  Table, Card, Typography, Tag, Button, Input, Statistic, Row, Col, Tooltip 
} from 'antd';
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
    key: '1', id: "INV-1023", client: "Kamal Perera", contact: "0771234567", barber: "Nuwan Pradeep",
    items: [{ name: "Haircut", type: "Service", price: 2500 }], 
    amount: 2500, method: "Cash", date: "2023-10-24" 
  },
  { 
    key: '2', id: "INV-1024", client: "Saman Kumara", contact: "0719876543", barber: "Kasun Perera",
    items: [{ name: "Beard Trim", type: "Service", price: 1500 }], 
    amount: 1500, method: "Card", date: "2023-10-24" 
  },
  { 
    key: '3', id: "INV-1025", client: "Nimal Siripala", contact: "0765551234", barber: "Lahiru Thirimanne",
    items: [{ name: "Haircut", type: "Service", price: 2500 }, { name: "Hair Gel", type: "Product", price: 5000 }], 
    amount: 7500, method: "Transfer", date: "2023-10-25" 
  },
];

function PaymentsContent() {
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false); 
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null); 

  const { showAlert } = useAlert();

  const handleAddNew = () => {
    setIsPaymentModalOpen(true);
  };

  const handleViewInvoice = (record: any) => {
    setSelectedInvoice(record);
    setIsInvoiceModalOpen(true);
  };

  const handleSavePayment = (paymentData: any) => {
    // Save as a new record automatically since editing is disabled
    const finalRecord = { ...paymentData, key: Date.now().toString() };
    setPayments(prev => [finalRecord, ...prev]);
    showAlert('success', 'Payment recorded successfully.');
    
    setIsPaymentModalOpen(false); 
    setSelectedInvoice(finalRecord); 
    setTimeout(() => setIsInvoiceModalOpen(true), 300); // Wait for modal animation, then open Print View
  };

  const filteredData = payments.filter(p => 
    p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalTransactions = payments.length;

  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono text-xs font-bold text-slate-500">{text}</span>,
    },
    {
      title: 'Client Details',
      dataIndex: 'client',
      key: 'client',
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{text}</span>
          <span className="text-xs text-slate-500">
            {record.items?.length > 1 ? `${record.items[0].name} +${record.items.length - 1} more` : record.items?.[0]?.name}
          </span>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span className="font-mono font-bold text-slate-800">Rs. {amount.toLocaleString()}</span>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <Tag icon={method === 'Cash' ? <WalletOutlined /> : <CreditCardOutlined />}>{method}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div className="flex items-center justify-end">
          <Tooltip title="View/Print Invoice">
            <Button 
              type="text" 
              shape="circle" 
              icon={<EyeOutlined className="text-blue-500" />} 
              onClick={() => handleViewInvoice(record)} 
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Payments & Billing</Title>
          <Text type="secondary">Manage transactions, invoices, and revenue.</Text>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search invoice..." 
            size="large"
            className="rounded-xl w-full md:w-64"
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAddNew}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200"
          >
            Create Bill
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic title={<span className="text-xs font-bold text-gray-400 uppercase">Total Revenue</span>} value={totalRevenue} prefix={<span className="text-emerald-500 text-2xl mr-2">Rs.</span>} valueStyle={{ fontWeight: 800, color: '#10B981' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic title={<span className="text-xs font-bold text-gray-400 uppercase">Total Transactions</span>} value={totalTransactions} valueStyle={{ fontWeight: 800, color: '#7C4DFF' }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 8 }} rowKey="key" />
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