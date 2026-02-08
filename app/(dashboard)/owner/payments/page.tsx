"use client";

import React, { useState } from 'react';
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
  Tooltip, 
  Dropdown, // <--- Added
  MenuProps, // <--- Added
  message 
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  WalletOutlined, 
  CreditCardOutlined, 
  EditOutlined, 
  PrinterOutlined, 
  EyeOutlined,
  MoreOutlined // <--- Added for the "Three Dots" icon
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { InvoiceModal } from "@/components/modals/InvoiceModal";

const { Title, Text } = Typography;

// --- Mock Data ---
const INITIAL_PAYMENTS = [
  { key: '1', id: "INV-1023", client: "Kamal Perera", service: "Haircut", amount: 2500, method: "Cash", status: "Paid", date: "2023-10-24" },
  { key: '2', id: "INV-1024", client: "Saman Kumara", service: "Beard Trim", amount: 1500, method: "Card", status: "Paid", date: "2023-10-24" },
  { key: '3', id: "INV-1025", client: "Nimal Siripala", service: "Full Package", amount: 7500, method: "Transfer", status: "Pending", date: "2023-10-25" },
];

function PaymentsContent() {
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false); 
  const [editingPayment, setEditingPayment] = useState<any>(null); 
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null); 

  const { showAlert } = useAlert();

  // --- Handlers ---

  const handleAddNew = () => {
    setEditingPayment(null);
    setIsPaymentModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingPayment(record);
    setIsPaymentModalOpen(true);
  };

  const handleViewInvoice = (record: any) => {
    setSelectedInvoice(record);
    setIsInvoiceModalOpen(true);
  };

  const handleDirectPrint = (data: any) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Invoice #${data.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; width: 300px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
              .total { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; font-weight: bold; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h3>SALON PRO</h3>
              <p>Invoice: ${data.id}</p>
            </div>
            <div class="row"><span>Date:</span><span>${dayjs().format('DD/MM/YYYY')}</span></div>
            <div class="row"><span>Client:</span><span>${data.client}</span></div>
            <br/>
            <div class="row"><span>${data.service}</span><span>${data.amount}</span></div>
            <div class="row total"><span>TOTAL</span><span>Rs. ${data.amount}</span></div>
            <div style="text-align:center; font-size:10px; margin-top:20px;">Thank you!</div>
          </body>
        </html>
      `);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
    message.success("Printing Invoice...");
  };

  const handleSavePayment = (paymentData: any) => {
    if (paymentData.key) {
      setPayments(prev => prev.map(p => p.key === paymentData.key ? { ...p, ...paymentData } : p));
      showAlert('success', 'Payment updated successfully.');
    } else {
      const newPayment = {
        ...paymentData,
        key: Date.now().toString(), 
      };
      setPayments(prev => [newPayment, ...prev]);
      showAlert('success', 'Payment recorded successfully.');
    }
  };

  const handleDelete = (key: string) => {
    setPayments(prev => prev.filter(p => p.key !== key));
    showAlert('success', 'Record deleted.');
  };

  // --- Filter ---
  const filteredData = payments.filter(p => 
    p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Stats ---
  const totalRevenue = payments.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.amount : acc, 0);
  const pendingAmount = payments.reduce((acc, curr) => curr.status === 'Pending' ? acc + curr.amount : acc, 0);

  // --- Columns ---
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
          <span className="text-xs text-slate-500">{record.service}</span>
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
        <Tag icon={method === 'Cash' ? <WalletOutlined /> : <CreditCardOutlined />}>
          {method}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Paid' ? 'green' : 'gold'} className="rounded-full px-3 font-semibold">
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: any) => {
        // Define the menu items for the dropdown
        const menuItems: MenuProps['items'] = [
          {
            key: 'edit',
            label: 'Edit Details',
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Delete Record',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record.key),
          },
        ];

        return (
          <div className="flex items-center justify-end gap-1">
            {/* 1. View Invoice (Quick Action) */}
            <Tooltip title="View Invoice">
              <Button 
                type="text" 
                shape="circle" 
                icon={<EyeOutlined className="text-blue-500" />} 
                onClick={() => handleViewInvoice(record)}
              />
            </Tooltip>

            {/* 2. Direct Print (Quick Action) */}
            <Tooltip title="Print Receipt">
              <Button 
                type="text" 
                shape="circle" 
                icon={<PrinterOutlined className="text-slate-600" />} 
                onClick={() => handleDirectPrint(record)}
              />
            </Tooltip>

            {/* 3. More Actions (Edit & Delete hidden here) */}
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button 
                type="text" 
                shape="circle" 
                icon={<MoreOutlined style={{ fontSize: '18px', fontWeight: 'bold' }} />} 
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header */}
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
            New Payment
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Revenue</span>}
              value={totalRevenue} 
              prefix={<span className="text-emerald-500 text-2xl mr-2">Rs.</span>}
              valueStyle={{ fontWeight: 800, color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Pending Payments</span>}
              value={pendingAmount} 
              prefix={<span className="text-amber-500 text-2xl mr-2">Rs.</span>}
              valueStyle={{ fontWeight: 800, color: '#F59E0B' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Data Table */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          pagination={{ pageSize: 8 }}
          rowKey="key"
        />
      </Card>

      {/* Modals */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handleSavePayment}
        paymentToEdit={editingPayment} 
      />

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        data={selectedInvoice} 
      />
    </div>
  );
}

// Wrapper
export default function OwnerPayments() {
  return (
    <AlertProvider>
      <PaymentsContent />
    </AlertProvider>
  );
}