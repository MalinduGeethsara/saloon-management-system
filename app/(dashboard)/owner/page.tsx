"use client";

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Table, 
  Tag, 
  Avatar, 
  Button, 
  Select
} from 'antd';
import { 
  CalendarOutlined, 
  RightOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// --- Mock Data ---
const RECENT_TRANSACTIONS = [
  { key: '1', id: 'INV-1024', client: 'Kamal Perera', service: 'Haircut + Beard', amount: 3500, status: 'Completed', time: '10:30 AM' },
  { key: '2', id: 'INV-1025', client: 'Saman Kumara', service: 'Haircut', amount: 1500, status: 'Completed', time: '11:15 AM' },
  { key: '3', id: 'INV-1026', client: 'Nimal Siripala', service: 'Full Service', amount: 5000, status: 'Pending', time: '12:00 PM' },
  { key: '4', id: 'INV-1027', client: 'Ruwan Fernando', service: 'Beard Trim', amount: 1200, status: 'Completed', time: '12:45 PM' },
  { key: '5', id: 'INV-1028', client: 'Chamara Silva', service: 'Hair Coloring', amount: 8500, status: 'Completed', time: '01:30 PM' },
];

const TOP_STAFF = [
  { name: 'Nuwan Pradeep', role: 'Senior Barber', sales: 185000, bookings: 42 },
  { name: 'Kasun Perera', role: 'Barber', sales: 120000, bookings: 38 },
  { name: 'Lahiru Thirimanne', role: 'Stylist', sales: 95000, bookings: 25 },
];

const POPULAR_SERVICES = [
  { name: 'Gentlemans Cut', percent: 75, color: '#7C4DFF' },
  { name: 'Beard Sculpting', percent: 60, color: '#10B981' },
  { name: 'Hair Coloring', percent: 30, color: '#F59E0B' },
  { name: 'Facial Treatment', percent: 20, color: '#EC4899' },
];

export default function BusinessIntelligence() {
  const [timeRange, setTimeRange] = useState('This Month');

  // --- Table Columns with Mobile-Optimized Alignments ---
  const columns = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
      width: 110, 
      align: 'left' as const,
      render: (text: string) => <span className="font-mono text-xs font-semibold text-slate-400">{text}</span>,
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      width: 180,
      align: 'left' as const,
      render: (text: string) => <span className="font-bold text-slate-700">{text}</span>,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 200,
      align: 'left' as const,
      render: (text: string) => <span className="text-xs font-medium text-slate-500">{text}</span>,
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: 120,
      align: 'center' as const,
      render: (text: string) => <span className="text-xs text-slate-500 whitespace-nowrap">{text}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right' as const, // Right-align for clean reading of numbers
      render: (amount: number) => <span className="font-mono font-bold text-[#7C4DFF] text-[14px]">Rs. {amount.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const, // Center tags
      render: (status: string) => {
        let color = status === 'Completed' ? 'green' : 'gold';
        return <Tag color={color} className="rounded-full px-3 py-0.5 m-0 text-[10px] font-bold border-0">{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="w-full md:w-auto">
          <Title level={2} style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(20px, 5vw, 30px)' }}>Business Intelligence</Title>
          <Text type="secondary" className="text-sm sm:text-base">Real-time overview of your salon's performance.</Text>
        </div>
        
        {/* Controls - Full width on mobile, auto on desktop */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <Select 
             defaultValue="This Month" 
             className="w-full sm:w-40 h-12" 
             size="large"
             onChange={setTimeRange}
             options={[
               { value: 'Today', label: 'Today' },
               { value: 'This Week', label: 'This Week' },
               { value: 'This Month', label: 'This Month' },
             ]}
           />
           <Button 
             type="primary" 
             size="large"
             icon={<CalendarOutlined />} 
             className="h-12 w-full sm:w-auto bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl border-none font-bold shadow-md shadow-purple-100"
           >
             Report
           </Button>
        </div>
      </div>

      {/* KPI Cards - Centered content on mobile, left on desktop */}
      <Row gutter={[16, 16]}>
        {[
          { label: 'Revenue', value: 458000, prefix: 'Rs.' },
          { label: 'Bookings', value: 142, prefix: '' },
          { label: 'Customers', value: 28, prefix: '+' },
          { label: 'Staff', value: 8, prefix: '' },
        ].map((kpi, i) => (
          <Col xs={12} lg={6} key={i}>
            <Card variant="borderless" className="shadow-sm rounded-2xl flex flex-col justify-center text-center sm:text-left sm:items-start h-full">
              <Statistic 
                title={<span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</span>}
                value={kpi.value}
                prefix={<span className="text-xs text-slate-400 font-bold mr-1">{kpi.prefix}</span>}
                styles={{ content: { fontWeight: 800, color: '#1A1A1B', fontSize: 'clamp(18px, 4vw, 24px)' } }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Middle Section: Services & Staff */}
      <Row gutter={[16, 16]}>
        
        {/* Popular Services */}
        <Col xs={24} lg={14}>
          <Card 
            title={<span className="font-bold text-lg">Popular Services</span>} 
            variant="borderless" 
            className="shadow-sm rounded-3xl h-full"
          >
            <div className="flex flex-col gap-6 pt-2">
              {POPULAR_SERVICES.map(service => (
                <div key={service.name}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-bold text-slate-700">{service.name}</span>
                    <span className="text-sm font-bold text-slate-400">{service.percent}%</span>
                  </div>
                  {/* FIX: trailColor changed to railColor */}
                  <Progress 
                    percent={service.percent} 
                    showInfo={false} 
                    strokeColor={service.color} 
                    railColor="#F3F4F6"
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Top Performing Staff - Mobile Overflow Fixed */}
        <Col xs={24} lg={10}>
          <Card 
            title={<span className="font-bold text-lg">Top Specialists</span>} 
            variant="borderless" 
            className="shadow-sm rounded-3xl h-full"
            extra={<Button type="link" size="small" className="text-[#7C4DFF] font-bold">View All</Button>}
          >
            <div className="flex flex-col gap-5">
              {TOP_STAFF.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <Avatar 
                    size={40}
                    style={{ 
                      backgroundColor: index === 0 ? '#7C4DFF' : '#F3E8FF', 
                      color: index === 0 ? 'white' : '#7C4DFF',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </Avatar>
                  
                  {/* min-w-0 allows truncation to work inside flex */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-slate-800 text-sm truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">{item.role} • {item.bookings} Bookings</span>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-emerald-600 text-[13px]">
                      Rs. {(item.sales / 1000).toFixed(0)}k
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold flex justify-end items-center gap-0.5">
                      <ArrowUpOutlined className="text-emerald-500" /> 12%
                    </div>
                  </div>
                  <div className="font-mono font-bold text-emerald-600">
                    Rs. {(item.sales / 1000).toFixed(1)}k
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section: Recent Transactions - FULL SWIPE */}
      <Card 
        title={<span className="font-bold text-lg">Recent Transactions</span>} 
        variant="borderless" 
        className="shadow-sm rounded-3xl overflow-hidden"
        extra={<Button type="link" icon={<RightOutlined />} href="/owner/payments" className="text-[#7C4DFF] font-bold">View All</Button>}
        styles={{ body: { padding: 0 } }} 
      >
        <Table 
          columns={columns} 
          dataSource={RECENT_TRANSACTIONS} 
          pagination={false} 
          rowKey="key"
          // Force horizontal scroll for full table swipe
          scroll={{ x: 900 }} 
          className="analytics-swipe-table"
        />
      </Card>

    </div>
  );
}