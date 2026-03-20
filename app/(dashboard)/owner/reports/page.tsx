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
    <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 pb-2 overflow-x-auto snap-x">
      {PERFORMANCE_DATA.map((item, index) => (
        <div key={index} className="group relative flex flex-col items-center flex-1 min-w-[30px] h-full justify-end snap-center">
          {/* Tooltip */}
          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap shadow-lg">
            Rev: Rs. {item.revenue}k
          </div>
          
          {/* Bar Group */}
          <div className="flex gap-1 w-full justify-center items-end h-full">
            {/* Revenue Bar */}
            <div 
              style={{ height: `${item.revenue}%` }} 
              className="w-3 bg-[#7C4DFF] rounded-t-md transition-all duration-500 hover:bg-[#6c42e0]"
            />
            {/* Expense Bar */}
            <div 
              style={{ height: `${item.expense}%` }} 
              className="w-3 bg-slate-200 rounded-t-md transition-all duration-500 hover:bg-slate-300"
            />
          </div>
          
          {/* Label */}
          <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">{item.month}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <Title level={2} className="m-0 font-black">Analytics & Reports</Title>
          <Text type="secondary">Monitor business performance, revenue, and staff efficiency.</Text>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          {/* 1. Date Range Picker */}
          <RangePicker size="large" className="rounded-xl shadow-sm border-slate-200 flex-1 min-w-[200px]" />
          
          {/* 2. Export PDF Button */}
          <Button 
            type="primary" 
            size="large" 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold shadow-md shadow-purple-100 border-none w-full sm:w-40 flex justify-center items-center"
          >
            Export PDF
          </Button>

          {/* 3. Print Button */}
          <Button 
            size="large" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            className="rounded-xl font-bold border-slate-200 text-slate-600 shadow-sm w-full sm:w-32 flex justify-center items-center"
          >
            Print
          </Button>
        </div>
      </div>

      {/* KPI Stats Row - Fixed Deprecated valueStyle */}
      <Row gutter={[16, 16]} className="mb-8">
        
        {/* 1. Total Revenue */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>}
              value={124500} 
              precision={0}
              prefix={<span className="text-emerald-500 text-lg sm:text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} // FIX: styles.content
              suffix={
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 w-fit mx-auto sm:mx-0">
                  <RiseOutlined /> 12%
                </div>
              }
            />
          </Card>
        </Col>

        {/* 2. Net Profit */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Profit</span>}
              value={840000} 
              precision={0}
              prefix={<span className="text-[#7C4DFF] text-lg sm:text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} // FIX: styles.content
              suffix={
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 w-fit mx-auto sm:mx-0">
                  <RiseOutlined /> 8%
                </div>
              }
            />
          </Card>
        </Col>

        {/* 3. Appointments */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointments</span>}
              value={342} 
              prefix={<CalendarOutlined style={{ color: '#F59E0B' }} />}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} // FIX: styles.content
              suffix={
                <div className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full mt-2 w-fit mx-auto sm:mx-0">
                  <FallOutlined /> 2%
                </div>
              }
            />
          </Card>
        </Col>

        {/* 4. New Customers */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Customers</span>}
              value={48} 
              prefix={<UserOutlined style={{ color: '#3B82F6' }} />}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} // FIX: styles.content
              suffix={
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 w-fit mx-auto sm:mx-0">
                  <RiseOutlined /> 15%
                </div>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Main Chart & Details Section */}
      <Row gutter={[24, 24]}>
        
        {/* Chart Column */}
        <Col xs={24} lg={16}>
          <Card 
            variant="borderless" 
            className="shadow-sm rounded-3xl h-full"
            title={
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-3">
                <div>
                  <h3 className="font-bold text-lg m-0">Revenue Analytics</h3>
                  <span className="text-[11px] text-slate-400 font-normal">Income vs Expenses</span>
                </div>
                <Select 
  defaultValue="monthly" 
  variant="borderless"
  className="w-[120px] bg-slate-50 rounded-lg text-slate-600 font-semibold" 
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
            
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#7C4DFF]" />
                <span className="text-xs font-bold text-slate-600">Total Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-xs font-bold text-slate-600">Expenses</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Top Performers Column */}
        <Col xs={24} lg={8}>
          
          {/* Top Staff */}
          <Card 
            variant="borderless" 
            className="shadow-sm rounded-3xl mb-6"
            title={<span className="font-bold">Top Staff</span>}
            extra={<Button type="link" size="small" className="text-[#7C4DFF] font-bold">View All</Button>}
          >
            <div className="flex flex-col gap-6">
              {TOP_STAFF.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="relative">
                    <Avatar src={item.avatar} size={48} className="border border-slate-100" />
                    <div className="absolute -bottom-1 -right-1 bg-[#1a1a1b] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <div className="font-bold text-sm text-slate-800 truncate">{item.name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.role}</div>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-600">Rs. {(item.revenue/1000).toFixed(0)}k</div>
                    </div>
                    <Progress percent={item.percentage} size="small" showInfo={false} strokeColor="#7C4DFF" trailColor="#F3F4F6" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Services */}
          <Card 
            variant="borderless" 
            className="shadow-sm rounded-3xl"
            title={<span className="font-bold">Popular Services</span>}
          >
            <div className="flex flex-col gap-5">
              {TOP_SERVICES.map((service, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-700">
                    <span>{service.name}</span>
                    <span className="text-slate-400">{service.count} bookings</span>
                  </div>
                  <Progress 
                    percent={service.percentage} 
                    strokeColor={i === 0 ? '#10B981' : i === 1 ? '#3B82F6' : '#F59E0B'} 
                    trailColor="#F3F4F6"
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