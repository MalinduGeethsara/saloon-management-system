"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { Card, Typography, Row, Col, Statistic, Select, Table, Tag, Input } from 'antd';
import { matchesQuery } from '@/hooks/useSearchFilter';
import { DollarOutlined, ScissorOutlined, TrophyOutlined, SearchOutlined } from '@ant-design/icons';
import { getMyCommissions } from '@/lib/actions/payroll';

const { Title, Text } = Typography;

export default function BarberEarningsPage() {
  const monthOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const label = dayjs().subtract(i, 'month').format('MMMM YYYY');
      return { value: label, label };
    }), []);

  const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('MMMM YYYY'));
  const [data, setData] = useState<{ monthTotal: number; transactionCount: number; lifetimeTotal: number; breakdown: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getMyCommissions(selectedMonth);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedMonth]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => d ? dayjs(d).format('DD MMM YYYY') : '-',
    },
    {
      title: 'Client',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Details',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string, row: any) => desc || (row.source === 'manual' ? 'Manual bill' : 'Booking'),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'manual' ? 'gold' : 'purple'} className="rounded-full border-0 font-bold">
          {source === 'manual' ? 'Walk-in' : 'Booking'}
        </Tag>
      ),
    },
    {
      title: 'Billed Amount',
      dataIndex: 'billedAmount',
      key: 'billedAmount',
      align: 'right' as const,
      render: (v: number) => `Rs. ${v.toLocaleString()}`,
    },
    {
      title: 'Rate',
      dataIndex: 'rateApplied',
      key: 'rateApplied',
      align: 'right' as const,
      render: (v: number) => `${v}%`,
    },
    {
      title: 'Commission',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (v: number) => <span className="font-bold text-emerald-600">Rs. {v.toLocaleString()}</span>,
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto pb-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>My Earnings</Title>
          <Text type="secondary">Commission earned from your completed bookings and walk-in bills.</Text>
        </div>
        <Select
          value={selectedMonth}
          onChange={setSelectedMonth}
          size="large"
          className="w-full sm:w-48"
          options={monthOptions}
        />
      </div>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full">
            <Statistic
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Month's Commission</span>}
              value={data?.monthTotal ?? 0}
              prefix={<DollarOutlined className="text-[#7C4DFF] mr-1" />}
              styles={{ content: { fontWeight: 800, color: '#1A1A1B', fontSize: '28px' } }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full">
            <Statistic
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transactions Completed</span>}
              value={data?.transactionCount ?? 0}
              prefix={<ScissorOutlined className="text-emerald-500 mr-1" />}
              styles={{ content: { fontWeight: 800, color: '#1A1A1B', fontSize: '28px' } }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full bg-slate-50 border border-slate-100">
            <Statistic
              title={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lifetime Earnings</span>}
              value={data?.lifetimeTotal ?? 0}
              prefix={<TrophyOutlined className="text-amber-500 mr-1" />}
              styles={{ content: { fontWeight: 800, color: '#475569', fontSize: '28px' } }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search earnings"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 sm:max-w-sm"
      />

      <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden">
        <Table
          dataSource={(data?.breakdown ?? []).filter((r: any) => matchesQuery(search, r.customerName, r.description, r.source, r.amount))}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'No commission-earning transactions for this month yet.' }}
        />
      </Card>
    </div>
  );
}
