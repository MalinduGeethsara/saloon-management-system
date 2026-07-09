"use client";

import React, { useState, useEffect } from 'react';
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
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { getDashboardAnalytics } from '@/lib/actions/analytics';

const { Title, Text } = Typography;

function BusinessIntelligenceContent() {
  const { showAlert } = useAlert();
  const [timeRange, setTimeRange] = useState('This Month');
  const [selectedShop, setSelectedShop] = useState('all');
  const [shops, setShops] = useState<{label: string, value: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    kpis: { revenue: 0, bookings: 0, customers: 0, staff: 0 },
    recentTransactions: [] as any[],
    topStaff: [] as any[],
    popularServices: [] as any[]
  });

  useEffect(() => {
    // Fetch shops for dropdown
    fetch('/api/v1/shops')
      .then(res => res.json())
      .then(data => {
        if (data.shops) {
          setShops([
            { label: 'All Branches (Global)', value: 'all' },
            ...data.shops.map((s: any) => ({ label: s.name, value: s.id }))
          ]);
        }
      })
      .catch(() => console.error('Failed to load shops'));
  }, []);

  useEffect(() => {
    // Fetch dashboard data
    const loadAnalytics = async () => {
      setLoading(true);
      const res = await getDashboardAnalytics(selectedShop, timeRange);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        showAlert('error', res.message || 'Failed to load analytics data.');
      }
      setLoading(false);
    };
    
    loadAnalytics();
  }, [selectedShop, timeRange]);

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
      align: 'right' as const,
      render: (amount: number) => <span className="font-mono font-bold text-[#7C4DFF] text-[14px]">Rs. {amount.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (status: string) => {
        let color = status === 'COMPLETED' ? 'green' : 'gold';
        return <Tag color={color} className="rounded-full px-3 py-0.5 m-0 text-[10px] font-bold border-0">{status.toUpperCase()}</Tag>;
      },
    },
  ];

  const handleExportReport = () => {
    const csvRows = [];
    
    csvRows.push(`Business Intelligence Report (${timeRange})`);
    csvRows.push(`Generated: ${new Date().toLocaleString()}`);
    csvRows.push('');
    
    csvRows.push('KPI Summary');
    csvRows.push('Revenue,Bookings,Customers,Staff');
    csvRows.push(`Rs. ${data.kpis.revenue},${data.kpis.bookings},${data.kpis.customers},${data.kpis.staff}`);
    csvRows.push('');
    
    csvRows.push('Top Specialists');
    csvRows.push('Name,Role,Bookings,Sales');
    data.topStaff.forEach(staff => {
      csvRows.push(`"${staff.name}","${staff.role}",${staff.bookings},Rs. ${staff.sales}`);
    });
    csvRows.push('');
    
    csvRows.push('Popular Services');
    csvRows.push('Service Name,Popularity Percentage');
    data.popularServices.forEach(service => {
      csvRows.push(`"${service.name}",${service.percent}%`);
    });
    csvRows.push('');
    
    csvRows.push('Recent Transactions');
    csvRows.push('Invoice ID,Client,Service,Time,Amount,Status');
    data.recentTransactions.forEach(tx => {
      csvRows.push(`"${tx.id}","${tx.client}","${tx.service}","${tx.time}",Rs. ${tx.amount},"${tx.status}"`);
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `business_intelligence_report_${timeRange.toLowerCase().replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('success', 'Report downloading started...');
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="w-full md:w-auto">
          <Title level={2} style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(20px, 5vw, 30px)' }}>Business Intelligence</Title>
          <Text type="secondary" className="text-sm sm:text-base">Real-time overview of your salon's performance.</Text>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {shops.length > 0 && (
             <Select
               id="shop-select"
               value={selectedShop}
               onChange={setSelectedShop}
               className="w-full sm:w-48 h-12"
               size="large"
               options={shops}
             />
           )}
           <Select 
             id="time-range-select"
             value={timeRange} 
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
             onClick={handleExportReport}
           >
             Report
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        {[
          { label: 'Revenue', value: data.kpis.revenue, prefix: 'Rs.' },
          { label: 'Bookings', value: data.kpis.bookings, prefix: '' },
          { label: 'Customers', value: data.kpis.customers, prefix: '' },
          { label: 'Staff', value: data.kpis.staff, prefix: '' },
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
            loading={loading}
          >
            <div className="flex flex-col gap-6 pt-2">
              {data.popularServices.length === 0 && !loading && (
                <div className="text-center text-slate-400 py-4">No services booked in this period.</div>
              )}
              {data.popularServices.map(service => (
                <div key={service.name}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-bold text-slate-700">{service.name} ({service.count})</span>
                    <span className="text-sm font-bold text-slate-400">{service.percent}%</span>
                  </div>
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

        {/* Top Performing Staff */}
        <Col xs={24} lg={10}>
          <Card 
            title={<span className="font-bold text-lg">Top Specialists</span>} 
            variant="borderless" 
            className="shadow-sm rounded-3xl h-full"
            extra={<Button type="link" size="small" className="text-[#7C4DFF] font-bold">View All</Button>}
            loading={loading}
          >
            <div className="flex flex-col gap-5">
              {data.topStaff.length === 0 && !loading && (
                <div className="text-center text-slate-400 py-4">No staff data in this period.</div>
              )}
              {data.topStaff.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <Avatar 
                    size={40}
                    src={item.avatar}
                    style={{ 
                      backgroundColor: index === 0 ? '#7C4DFF' : '#F3E8FF', 
                      color: index === 0 ? 'white' : '#7C4DFF',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    {!item.avatar ? index + 1 : undefined}
                  </Avatar>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-slate-800 text-sm truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">{item.role} • {item.bookings} Bookings</span>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-emerald-600">
                      Rs. {(item.sales / 1000).toFixed(1)}k
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section: Recent Transactions */}
      <Card 
        title={<span className="font-bold text-lg">Recent Transactions</span>} 
        variant="borderless" 
        className="shadow-sm rounded-3xl overflow-hidden"
        extra={<Button type="link" icon={<RightOutlined />} href="/owner/payments" className="text-[#7C4DFF] font-bold">View All</Button>}
        styles={{ body: { padding: 0 } }} 
      >
        <Table 
          columns={columns} 
          dataSource={data.recentTransactions} 
          pagination={false} 
          rowKey="key"
          loading={loading}
          scroll={{ x: 900 }} 
          className="analytics-swipe-table"
        />
      </Card>

    </div>
  );
}

export default function BusinessIntelligence() {
  return (
    <AlertProvider>
      <BusinessIntelligenceContent />
    </AlertProvider>
  );
}