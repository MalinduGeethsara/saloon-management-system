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
  Select, 
  List 
} from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  ShopOutlined, 
  RightOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// --- Mock Data (Sri Lankan Context) ---
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

  // --- Table Columns ---
  const columns = [
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      render: (text: string) => <span className="font-bold text-slate-700">{text}</span>,
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (text: string) => <span className="text-xs text-slate-500">{text}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span className="font-mono font-bold text-[#7C4DFF]">Rs. {amount.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = status === 'Completed' ? 'green' : 'gold';
        return <Tag color={color} className="rounded-full px-2 text-[10px] font-bold">{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Business Intelligence</Title>
          <Text type="secondary">Real-time overview of your salon's performance.</Text>
        </div>
        
        <div className="flex gap-3">
           <Select 
             defaultValue="This Month" 
             style={{ width: 140 }} 
             onChange={setTimeRange}
             options={[
               { value: 'Today', label: 'Today' },
               { value: 'This Week', label: 'This Week' },
               { value: 'This Month', label: 'This Month' },
             ]}
           />
           <Button type="primary" icon={<CalendarOutlined />} style={{ backgroundColor: '#7C4DFF' }}>
             Download Report
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
<Row gutter={[16, 16]} className="mb-6">
  {/* Total Revenue Card */}
  <Col xs={24} sm={12} lg={6}>
    <Card variant="borderless" className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <Statistic 
        title={<span className="text-xs font-bold text-gray-400 uppercase">Total Revenue</span>}
        value={458000}
        styles={{ content: { fontWeight: 800, color: '#1A1A1B' } }}
      />
    </Card>
  </Col>

  {/* Total Bookings Card */}
  <Col xs={24} sm={12} lg={6}>
    <Card variant="borderless" className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <Statistic 
        title={<span className="text-xs font-bold text-gray-400 uppercase">Total Bookings</span>}
        value={142}
        styles={{ content: { fontWeight: 800, color: '#1A1A1B' } }}
      />
    </Card>
  </Col>

  {/* New Customers Card */}
  <Col xs={24} sm={12} lg={6}>
    <Card variant="borderless" className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <Statistic 
        title={<span className="text-xs font-bold text-gray-400 uppercase">New Customers</span>}
        value={28}
        styles={{ content: { fontWeight: 800, color: '#1A1A1B' } }}
      />
    </Card>
  </Col>

  {/* Active Staff Card */}
  <Col xs={24} sm={12} lg={6}>
    <Card variant="borderless" className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <Statistic 
        title={<span className="text-xs font-bold text-gray-400 uppercase">Active Staff</span>}
        value={8}
        styles={{ content: { fontWeight: 800, color: '#1A1A1B' } }}
      />
    </Card>
  </Col>
</Row>

      {/* Middle Section: Services & Staff */}
      <Row gutter={[16, 16]} className="mb-6">
        
        {/* Popular Services */}
        <Col xs={24} lg={14}>
          <Card 
            title={<span className="font-bold">Popular Services</span>} 
            bordered={false} 
            className="shadow-sm rounded-2xl h-full"
          >
            <div className="flex flex-col gap-6 pt-2">
              {POPULAR_SERVICES.map(service => (
                <div key={service.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{service.name}</span>
                    <span className="text-sm font-bold text-slate-500">{service.percent}%</span>
                  </div>
                  <Progress 
                    percent={service.percent} 
                    showInfo={false} 
                    strokeColor={service.color} 
                    trailColor="#F3F4F6"
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Top Performing Staff */}
        <Col xs={24} lg={10}>
          <Card 
            title={<span className="font-bold">Top Specialists</span>} 
            bordered={false} 
            className="shadow-sm rounded-2xl h-full"
            extra={<Button type="text" size="small" style={{ color: '#7C4DFF' }}>View All</Button>}
          >
            <List
              itemLayout="horizontal"
              dataSource={TOP_STAFF}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ backgroundColor: index === 0 ? '#7C4DFF' : '#F3E8FF', color: index === 0 ? 'white' : '#7C4DFF' }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={<span className="font-bold text-slate-800">{item.name}</span>}
                    description={<span className="text-xs text-slate-500">{item.role} • {item.bookings} Bookings</span>}
                  />
                  <div className="font-mono font-bold text-emerald-600">
                    Rs. {(item.sales / 1000).toFixed(1)}k
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Bottom Section: Recent Transactions */}
      <Card 
        title={<span className="font-bold">Recent Transactions (Today)</span>} 
        bordered={false} 
        className="shadow-sm rounded-2xl overflow-hidden"
        extra={<Button type="text" icon={<RightOutlined />} href="/owner/payments">View All</Button>}
        bodyStyle={{ padding: 0 }}
      >
        <Table 
          columns={columns} 
          dataSource={RECENT_TRANSACTIONS} 
          pagination={false} 
          rowKey="key"
        />
      </Card>

    </div>
  );
}