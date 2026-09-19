"use client";

import React, { useState, useRef } from 'react';
import {
  Card, Typography, Tag, Button, Input, Statistic, Row, Col, Select
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, WalletOutlined, CreditCardOutlined, EyeOutlined 
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { InvoiceModal } from "@/components/modals/InvoiceModal";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";

import { getAllPayments, createManualBill } from '@/lib/actions/payment';
import { useAccess } from '@/hooks/useAccess';

const { Title, Text } = Typography;

function PaymentsContent() {
  const [payments, setPayments] = useState<any[]>([]);

  // Server-side pagination + filters (search/method/branch cover every page, not just the loaded one)
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ revenue: 0, count: 0 });
  const [shops, setShops] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [shopFilter, setShopFilter] = useState('ALL');
  const requestSeq = useRef(0);
  // What this person may do here (the owner's tick-boxes; the server checks the same rules again)
  const access = useAccess('/owner/payments');
  const canAdd = access.add;
  const canEdit = access.edit;
  const canDelete = access.delete;

  const fetchPayments = async (pageOverride?: number) => {
    const seq = ++requestSeq.current;
    setLoading(true);
    const res = await getAllPayments({
      page: pageOverride ?? page,
      pageSize: PAGE_SIZE,
      q: debouncedSearch,
      method: methodFilter,
      shopId: shopFilter,
    });
    if (seq !== requestSeq.current) return; // superseded by a newer request
    if (res.success && res.data) {
      // e.g. the last page emptied out after a filter change: step back to the new last page
      if (res.data.length === 0 && (res.total ?? 0) > 0 && (pageOverride ?? page) > 1) {
        setPage(Math.max(1, Math.ceil((res.total ?? 0) / PAGE_SIZE)));
        return;
      }
      setPayments(res.data);
      setTotal(res.total ?? 0);
      if (res.stats) setStats(res.stats);
      if (res.shops) setShops(res.shops);
    }
    setLoading(false);
  };

  // Debounce the search box; a new search always starts from page 1
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  React.useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, methodFilter, shopFilter]);
  
  // Modals state
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

  const handleSavePayment = async (paymentData: any) => {
    const finalRecord = { ...paymentData, key: Date.now().toString() };

    const billRes = await createManualBill({
      invoiceNo: paymentData.id,
      clientName: paymentData.client,
      clientPhone: paymentData.contact,
      barberName: paymentData.barber,
      barberId: paymentData.barberId,
      items: paymentData.items,
      amount: paymentData.amount,
      method: paymentData.method,
    });

    if (!billRes.success) {
      showAlert('error', billRes.message || 'Failed to record payment.');
      return;
    }

    await fetchPayments(1);
    setPage(1);

    showAlert('success', 'Payment recorded successfully.');
    setIsPaymentModalOpen(false);
    setSelectedInvoice(finalRecord);
    setTimeout(() => setIsInvoiceModalOpen(true), 300);
  };

  const totalRevenue = stats.revenue;
  const totalTransactions = stats.count;

  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      align: 'left' as const,
      render: (text: string) => <span className="font-mono text-xs font-bold text-slate-500">{text}</span>,
    },
    {
      title: 'Client Details',
      dataIndex: 'client',
      key: 'client',
      width: 200,
      align: 'left' as const,
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
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      width: 150,
      align: 'left' as const,
      render: (text: string) => <span className="text-[12px] font-semibold text-slate-600">{text || 'Global'}</span>,
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
    }
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Payments & Billing</Title>
          <Text type="secondary">Manage transactions, invoices, and revenue. Swipe table to see all data.</Text>
        </div>
        {canAdd && (
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAddNew}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold border-none w-full md:w-auto h-12 shadow-md shadow-purple-100"
          >
            Create Bill
          </Button>
        )}
      </div>

      {/* KPI Stats - Centered on Mobile */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={12}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>} 
              value={totalRevenue} 
              prefix={<span className="text-emerald-500 text-lg md:text-xl font-bold mr-1">Rs.</span>} 
              styles={{ content: { fontWeight: 800, color: '#10B981', fontSize: '24px' } }} 
            />
          </Card>
        </Col>
        <Col xs={12}>
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-slate-100">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search payments"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="lg:max-w-sm"
          />
          <Select
            value={methodFilter}
            onChange={(v) => { setMethodFilter(v); setPage(1); }}
            className="w-full lg:w-44"
            options={[
              { label: 'All methods', value: 'ALL' },
              { label: 'Cash', value: 'Cash' },
              { label: 'Card', value: 'Card' },
              { label: 'Transfer', value: 'Transfer' },
              { label: 'PayHere', value: 'PayHere' },
            ]}
          />
          <Select
            value={shopFilter}
            onChange={(v) => { setShopFilter(v); setPage(1); }}
            className="w-full lg:w-52"
            options={[{ label: 'All branches', value: 'ALL' }, ...shops.map(sh => ({ label: sh.name, value: sh.id }))]}
          />
        </div>

        <ResponsiveTable
          columns={columns}
          dataSource={payments}
          loading={loading}
          pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: (p) => setPage(p) }}
          rowKey="key"
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onClick: () => handleViewInvoice(record),
            className: 'cursor-pointer hover:bg-purple-50 transition-colors'
          })}
          renderMobileCard={(record) => (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{record.client}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {record.items?.length > 1 ? `${record.items[0].name} +${record.items.length - 1} more` : record.items?.[0]?.name}
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-800 shrink-0">Rs. {record.amount.toLocaleString()}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono font-bold">{record.id}</span>
                <span>{record.method} • {record.branch || 'Global'} • {record.date}</span>
              </div>
            </div>
          )}
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