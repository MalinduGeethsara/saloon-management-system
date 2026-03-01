"use client";

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Statistic, 
  Select, 
  DatePicker, 
  List,
  Avatar,
  Progress
} from 'antd';
import { 
  DownloadOutlined, 
  RiseOutlined, 
  FallOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  PrinterOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- Mock Data ---
const PERFORMANCE_DATA = [
  { month: 'Jan', revenue: 65, expense: 40 },
  { month: 'Feb', revenue: 59, expense: 45 },
  { month: 'Mar', revenue: 80, expense: 50 },
  { month: 'Apr', revenue: 81, expense: 45 },
  { month: 'May', revenue: 56, expense: 30 },
  { month: 'Jun', revenue: 55, expense: 35 },
  { month: 'Jul', revenue: 40, expense: 25 },
  { month: 'Aug', revenue: 75, expense: 45 },
  { month: 'Sep', revenue: 95, expense: 55 },
  { month: 'Oct', revenue: 85, expense: 50 },
  { month: 'Nov', revenue: 90, expense: 60 },
  { month: 'Dec', revenue: 105, expense: 65 },
];

const TOP_STAFF = [
  { name: "Alex Rivers", role: "Senior Barber", revenue: 450000, percentage: 85, avatar: "https://i.pravatar.cc/150?u=1" },
  { name: "Jordan Smith", role: "Specialist", revenue: 320000, percentage: 65, avatar: "https://i.pravatar.cc/150?u=2" },
  { name: "Sam Wilson", role: "Barber", revenue: 210000, percentage: 45, avatar: "https://i.pravatar.cc/150?u=3" },
];

const TOP_SERVICES = [
  { name: "Classic Haircut", count: 145, percentage: 90 },
  { name: "Beard Trim & Shape", count: 98, percentage: 60 },
  { name: "Hair Coloring", count: 45, percentage: 30 },
  { name: "Facial Treatment", count: 22, percentage: 15 },
];

function ReportsContent() {
  const { showAlert } = useAlert();
  const [timeRange, setTimeRange] = useState('monthly');

  const handleDownload = () => {
    showAlert('success', 'Report downloading started...');
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Custom Bar Chart Component ---
  const renderBarChart = () => (
    <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 pb-2">
      {PERFORMANCE_DATA.map((item, index) => (
        <div key={index} className="group relative flex flex-col items-center flex-1 h-full justify-end">
          {/* Tooltip */}
          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap">
            Rev: Rs. {item.revenue}k
          </div>
          
          {/* Bar Group */}
          <div className="flex gap-1 w-full justify-center items-end h-full">
            {/* Revenue Bar */}
            <div 
              style={{ height: `${item.revenue}%` }} 
              className="w-3 bg-[#7C4DFF] rounded-t-sm transition-all duration-500 hover:bg-[#6c42e0]"
            />
            {/* Expense Bar */}
            <div 
              style={{ height: `${item.expense}%` }} 
              className="w-3 bg-slate-200 rounded-t-sm transition-all duration-500"
            />
          </div>
          
          {/* Label */}
          <span className="text-[10px] text-slate-400 mt-2 font-medium">{item.month}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Analytics & Reports</Title>
          <Text type="secondary">Monitor business performance, revenue, and staff efficiency.</Text>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <RangePicker size="large" className="rounded-xl shadow-sm border-slate-200" />
          
          <Button 
            size="large" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            className="rounded-xl font-semibold border-slate-200 text-slate-600"
          >
            Print
          </Button>
          
          <Button 
            type="primary" 
            size="large" 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
            style={{ backgroundColor: '#7C4DFF', borderRadius: '12px', fontWeight: 600 }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Stats Row - Adjusted Borders and Spacing */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        
        {/* 1. Total Revenue */}
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '100%' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Revenue</span>}
              value={124500} 
              precision={2}
              prefix={<span className="text-emerald-500 text-xl mr-1">Rs.</span>}
              valueStyle={{ fontWeight: 800, color: '#1a1a1b', fontSize: '20px' }}
              suffix={
                <div className="text-[10px] font-bold text-emerald-500 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full ml-1 mt-1">
                  <RiseOutlined /> 12%
                </div>
              }
            />
          </Card>
        </Col>

        {/* 2. Net Profit */}
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '100%' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Net Profit</span>}
              value={840000} 
              prefix={<span className="text-[#7C4DFF] text-xl mr-1">Rs.</span>}
              valueStyle={{ fontWeight: 800, color: '#1a1a1b', fontSize: '20px' }}
              suffix={
                <div className="text-[10px] font-bold text-emerald-500 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full ml-1 mt-1">
                  <RiseOutlined /> 8%
                </div>
              }
            />
          </Card>
        </Col>

        {/* 3. Appointments */}
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '100%' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Appointments</span>}
              value={342} 
              prefix={<CalendarOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ fontWeight: 800, color: '#1a1a1b', fontSize: '20px' }}
              suffix={
                <div className="text-[10px] font-bold text-red-500 flex items-center bg-red-50 px-2 py-0.5 rounded-full ml-1 mt-1">
                  <FallOutlined /> 2%
                </div>
              }
            />
          </Card>
        </Col>

        {/* 4. New Customers */}
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '100%' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">New Customers</span>}
              value={48} 
              prefix={<UserOutlined style={{ color: '#3B82F6' }} />}
              valueStyle={{ fontWeight: 800, color: '#1a1a1b', fontSize: '20px' }}
              suffix={
                <div className="text-[10px] font-bold text-emerald-500 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full ml-1 mt-1">
                  <RiseOutlined /> 15%
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Main Chart Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
            title={
              <div className="flex justify-between items-center py-2">
                <div>
                  <h3 className="font-bold text-lg m-0">Revenue Analytics</h3>
                  <span className="text-xs text-slate-400 font-normal">Income vs Expenses over time</span>
                </div>
                <Select 
                  defaultValue="monthly" 
                  style={{ width: 120 }} 
                  variant="borderless"
                  className="bg-slate-50 rounded-lg"
                  onChange={setTimeRange}
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                  ]}
                />
              </div>
            }
          >
            {renderBarChart()}
            
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#7C4DFF]" />
                <span className="text-xs font-semibold text-slate-600">Total Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-xs font-semibold text-slate-600">Expenses</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Top Performers Column */}
        <Col xs={24} lg={8}>
          {/* Top Staff */}
          <Card 
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: 24 }}
            title={<span className="font-bold">Top Staff</span>}
            extra={<Button type="link" size="small">View All</Button>}
          >
            <List
              itemLayout="horizontal"
              dataSource={TOP_STAFF}
              renderItem={(item, index) => (
                <List.Item style={{ padding: '12px 0', borderBlockEnd: 'none' }}>
                  <List.Item.Meta
                    avatar={
                      <div className="relative">
                        <Avatar src={item.avatar} size={48} />
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
                          {index + 1}
                        </div>
                      </div>
                    }
                    title={<span className="font-semibold text-sm">{item.name}</span>}
                    description={
                      <div>
                        <div className="text-xs text-slate-400 mb-1">{item.role}</div>
                        <Progress percent={item.percentage} size="small" showInfo={false} strokeColor="#7C4DFF" />
                        <div className="text-right text-xs font-mono font-bold text-slate-600 mt-1">Rs. {item.revenue.toLocaleString()}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Top Services */}
          <Card 
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
            title={<span className="font-bold">Popular Services</span>}
          >
            <div className="space-y-4">
              {TOP_SERVICES.map((service, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                    <span>{service.name}</span>
                    <span>{service.count} bookings</span>
                  </div>
                  <Progress 
                    percent={service.percentage} 
                    strokeColor={i === 0 ? '#10B981' : i === 1 ? '#3B82F6' : '#F59E0B'} 
                    size="small" 
                    showInfo={false} 
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// Wrapper
export default function OwnerReports() {
  return (
    <AlertProvider>
      <ReportsContent />
    </AlertProvider>
  );
}