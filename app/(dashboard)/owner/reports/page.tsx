"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Row, 
  Col, 
  Statistic, 
  Select, 
  DatePicker, 
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
import { getReportsAnalytics } from '@/lib/actions/analytics';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function ReportsContent() {
  const { showAlert } = useAlert();
  
  const [selectedShop, setSelectedShop] = useState('all');
  const [shops, setShops] = useState<{label: string, value: string}[]>([]);
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('year'), dayjs()]);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    performanceData: [] as any[],
    topStaff: [] as any[],
    topServices: [] as any[],
    summary: {
      totalRevenue: 0,
      netProfit: 0,
      appointments: 0,
      newCustomers: 0
    }
  });

  useEffect(() => {
    fetch('/api/v1/shops')
      .then(res => res.json())
      .then(d => {
        if (d.shops) {
          setShops([
            { label: 'All Branches (Global)', value: 'all' },
            ...d.shops.map((s: any) => ({ label: s.name, value: s.id }))
          ]);
        }
      })
      .catch(() => console.error('Failed to load shops'));
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      const start = dateRange ? dateRange[0].toISOString() : undefined;
      const end = dateRange ? dateRange[1].toISOString() : undefined;
      
      const res = await getReportsAnalytics(selectedShop, start, end);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        showAlert('error', res.message || 'Failed to load reports.');
      }
      setLoading(false);
    };
    
    loadAnalytics();
  }, [selectedShop, dateRange]);

  const handleDownload = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Custom Bar Chart Component ---
  const renderBarChart = () => (
    <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-8 pb-2 overflow-x-auto snap-x">
      {data.performanceData.length === 0 && !loading && (
        <div className="w-full text-center text-slate-400 my-auto">No financial data available for this period.</div>
      )}
      {data.performanceData.map((item, index) => (
        <div key={index} className="group relative flex flex-col items-center flex-1 min-w-[30px] h-full justify-end snap-center">
          {/* Tooltip */}
          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-2 px-3 rounded pointer-events-none z-10 whitespace-nowrap shadow-lg">
            Rev: Rs. {item.rawRevenue.toLocaleString()} <br/>
            Exp: Rs. {item.rawExpense.toLocaleString()}
          </div>
          
          {/* Bar Group */}
          <div className="flex gap-1 w-full justify-center items-end h-full">
            {/* Revenue Bar */}
            <div 
              style={{ height: `${item.revenue}%` }} 
              className="w-4 bg-[#7C4DFF] rounded-t-md transition-all duration-500 hover:bg-[#6c42e0]"
            />
            {/* Expense Bar */}
            <div 
              style={{ height: `${item.expense}%` }} 
              className="w-4 bg-slate-200 rounded-t-md transition-all duration-500 hover:bg-slate-300"
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
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Analytics & Reports</Title>
          <Text type="secondary">Monitor business performance, revenue, and staff efficiency.</Text>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          {shops.length > 0 && (
             <Select
               id="shop-select-report"
               value={selectedShop}
               onChange={setSelectedShop}
               className="w-full sm:w-48 h-12"
               size="large"
               options={shops}
             />
          )}
          {/* 1. Date Range Picker */}
          <RangePicker 
            size="large" 
            className="rounded-xl shadow-sm border-slate-200 flex-1 min-w-[200px]" 
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
          />
          
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

      {/* KPI Stats Row */}
      <Row gutter={[16, 16]} className="mb-8">
        
        {/* 1. Total Revenue */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>}
              value={data.summary.totalRevenue} 
              precision={0}
              prefix={<span className="text-emerald-500 text-lg sm:text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} 
            />
          </Card>
        </Col>

        {/* 2. Net Profit */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Profit</span>}
              value={data.summary.netProfit} 
              precision={0}
              prefix={<span className="text-[#7C4DFF] text-lg sm:text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} 
            />
          </Card>
        </Col>

        {/* 3. Appointments */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointments</span>}
              value={data.summary.appointments} 
              prefix={<CalendarOutlined style={{ color: '#F59E0B' }} />}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} 
            />
          </Card>
        </Col>

        {/* 4. New Customers */}
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card variant="borderless" className="shadow-sm rounded-2xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Customers</span>}
              value={data.summary.newCustomers} 
              prefix={<UserOutlined style={{ color: '#3B82F6' }} />}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }} 
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
            loading={loading}
            title={
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-3">
                <div>
                  <h3 className="font-bold text-lg m-0">Revenue Analytics</h3>
                  <span className="text-[11px] text-slate-400 font-normal">Income vs Expenses</span>
                </div>
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
                <span className="text-xs font-bold text-slate-600">Expenses (Payroll)</span>
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
            loading={loading}
          >
            <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-2">
              {data.topStaff.length === 0 && !loading && (
                <div className="text-center text-slate-400 py-4">No staff data available.</div>
              )}
              {data.topStaff.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="relative">
                    <Avatar src={item.avatar} size={48} className="border border-slate-100 font-bold bg-[#F3E8FF] text-[#7C4DFF]">
                      {!item.avatar ? index + 1 : undefined}
                    </Avatar>
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
                      <div className="text-xs font-mono font-bold text-emerald-600">Rs. {(item.revenue/1000).toFixed(1)}k</div>
                    </div>
                    <Progress 
                      percent={item.percentage} 
                      size="small" 
                      showInfo={false} 
                      strokeColor="#7C4DFF" 
                      railColor="#F3F4F6" 
                    />
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
            loading={loading}
          >
            <div className="flex flex-col gap-5 max-h-[400px] overflow-y-auto pr-2">
              {data.topServices.length === 0 && !loading && (
                <div className="text-center text-slate-400 py-4">No services booked.</div>
              )}
              {data.topServices.map((service, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-700">
                    <span>{service.name}</span>
                    <span className="text-slate-400">{service.count} bookings</span>
                  </div>
                  <Progress 
                    percent={service.percentage} 
                    strokeColor={i === 0 ? '#10B981' : i === 1 ? '#3B82F6' : '#F59E0B'} 
                    railColor="#F3F4F6"
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