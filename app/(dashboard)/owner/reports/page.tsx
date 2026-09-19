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
} from 'antd';
import {
  DownloadOutlined,
  CalendarOutlined,
  UserOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { getReportsAnalytics, getShopComparisonAnalytics, getBookingTrendsAnalytics, getProductSalesAnalytics } from '@/lib/actions/reports';
import { formatCurrency } from '@/lib/utils';
import dayjs from 'dayjs';
import RevenueExpenseChart from '@/components/reports/RevenueExpenseChart';
import TopStaffList from '@/components/reports/TopStaffList';
import PopularServicesList from '@/components/reports/PopularServicesList';
import ShopComparisonChart from '@/components/reports/ShopComparisonChart';
import BookingStatusChart from '@/components/reports/BookingStatusChart';
import CustomerRetentionChart from '@/components/reports/CustomerRetentionChart';
import BookingPatternsChart from '@/components/reports/BookingPatternsChart';
import ProductSalesTable from '@/components/reports/ProductSalesTable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type ReportsData = NonNullable<Awaited<ReturnType<typeof getReportsAnalytics>>['data']>;
type TrendsData = NonNullable<Awaited<ReturnType<typeof getBookingTrendsAnalytics>>['data']>;
type ProductsData = NonNullable<Awaited<ReturnType<typeof getProductSalesAnalytics>>['data']>;
type ComparisonData = NonNullable<Awaited<ReturnType<typeof getShopComparisonAnalytics>>['data']>;

const EMPTY_REPORTS: ReportsData = {
  performanceData: [],
  topStaff: [],
  topServices: [],
  summary: {
    totalRevenue: 0,
    netProfit: 0,
    overallMargin: null,
    appointments: 0,
    newCustomers: 0
  }
};

const EMPTY_TRENDS: TrendsData = {
  statusBreakdown: [],
  cancellationRate: null,
  completionRate: null,
  totalBookings: 0,
  retentionTrend: [],
  byHour: [],
  byDay: [],
};

const EMPTY_PRODUCTS: ProductsData = {
  topProducts: [],
  totalProductRevenue: 0,
  isGlobalOnly: true,
};

function ReportsContent() {
  const { showAlert } = useAlert();

  const [selectedShop, setSelectedShop] = useState('all');
  const [shops, setShops] = useState<{label: string, value: string}[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([dayjs().startOf('year'), dayjs()]);
  const [loading, setLoading] = useState(true);

  const [reports, setReports] = useState<ReportsData>(EMPTY_REPORTS);
  const [trends, setTrends] = useState<TrendsData>(EMPTY_TRENDS);
  const [products, setProducts] = useState<ProductsData>(EMPTY_PRODUCTS);
  const [comparison, setComparison] = useState<ComparisonData>([]);

  useEffect(() => {
    fetch('/api/v1/shops')
      .then(res => res.json())
      .then(d => {
        if (d.shops) {
          setShops([
            { label: 'All Branches (Global)', value: 'all' },
            ...d.shops.map((s: { id: string; name: string }) => ({ label: s.name, value: s.id }))
          ]);
        }
      })
      .catch(() => console.error('Failed to load shops'));
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      const start = dateRange?.[0] ? dateRange[0].toISOString() : undefined;
      const end = dateRange?.[1] ? dateRange[1].toISOString() : undefined;

      const [reportsRes, trendsRes, productsRes, comparisonRes] = await Promise.all([
        getReportsAnalytics(selectedShop, start, end),
        getBookingTrendsAnalytics(selectedShop, start, end),
        getProductSalesAnalytics(start, end),
        selectedShop === 'all' ? getShopComparisonAnalytics(start, end) : Promise.resolve(null),
      ]);

      if (reportsRes.success && reportsRes.data) {
        setReports(reportsRes.data);
      } else {
        showAlert('error', reportsRes.message || 'Failed to load reports.');
      }

      if (trendsRes.success && trendsRes.data) {
        setTrends(trendsRes.data);
      } else {
        showAlert('error', trendsRes.message || 'Failed to load booking trends.');
      }

      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      } else {
        showAlert('error', productsRes.message || 'Failed to load product sales.');
      }

      if (comparisonRes) {
        if (comparisonRes.success && comparisonRes.data) {
          setComparison(comparisonRes.data);
        } else {
          showAlert('error', comparisonRes.message || 'Failed to load branch comparison.');
        }
      } else {
        setComparison([]);
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
              value={reports.summary.totalRevenue}
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
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Profit {reports.summary.overallMargin !== null && `(${reports.summary.overallMargin}% margin)`}</span>}
              value={reports.summary.netProfit}
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
              value={reports.summary.appointments}
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
              value={reports.summary.newCustomers}
              prefix={<UserOutlined style={{ color: '#3B82F6' }} />}
              styles={{ content: { fontWeight: 800, color: '#1a1a1b', fontSize: 'clamp(18px, 4vw, 24px)' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Chart & Details Section */}
      <Row gutter={[24, 24]} className="mb-6">

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
                  <span className="text-[11px] text-slate-400 font-normal">Income, expenses, and profit margin</span>
                </div>
              </div>
            }
          >
            <RevenueExpenseChart data={reports.performanceData} loading={loading} />

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#7C4DFF]" />
                <span className="text-xs font-bold text-slate-600">Total Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-xs font-bold text-slate-600">Expenses (Payroll)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="text-xs font-bold text-slate-600">Margin %</span>
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
            <TopStaffList data={reports.topStaff} />
          </Card>

          {/* Top Services */}
          <Card
            variant="borderless"
            className="shadow-sm rounded-3xl"
            title={<span className="font-bold">Popular Services</span>}
            loading={loading}
          >
            <PopularServicesList data={reports.topServices} />
          </Card>

        </Col>
      </Row>

      {/* Booking Trends & Retention */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card
            variant="borderless"
            className="shadow-sm rounded-3xl h-full"
            loading={loading}
            title={
              <div>
                <h3 className="font-bold text-lg m-0">Customer Retention</h3>
                <span className="text-[11px] text-slate-400 font-normal">New vs. returning customers by month</span>
              </div>
            }
          >
            <CustomerRetentionChart data={trends.retentionTrend} loading={loading} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            variant="borderless"
            className="shadow-sm rounded-3xl h-full"
            loading={loading}
            title={
              <div>
                <h3 className="font-bold text-lg m-0">Booking Status</h3>
                <span className="text-[11px] text-slate-400 font-normal">Completion & cancellation breakdown</span>
              </div>
            }
          >
            <BookingStatusChart
              data={trends.statusBreakdown}
              completionRate={trends.completionRate}
              cancellationRate={trends.cancellationRate}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Booking Patterns */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24}>
          <Card
            variant="borderless"
            className="shadow-sm rounded-3xl"
            loading={loading}
            title={
              <div>
                <h3 className="font-bold text-lg m-0">Booking Patterns</h3>
                <span className="text-[11px] text-slate-400 font-normal">Peak hours and days</span>
              </div>
            }
          >
            <BookingPatternsChart byHour={trends.byHour} byDay={trends.byDay} loading={loading} />
          </Card>
        </Col>
      </Row>

      {/* Shop Comparison */}
      {selectedShop === 'all' && (
        <Row gutter={[24, 24]} className="mb-6">
          <Col xs={24}>
            <Card
              variant="borderless"
              className="shadow-sm rounded-3xl"
              loading={loading}
              title={
                <div>
                  <h3 className="font-bold text-lg m-0">Branch Comparison</h3>
                  <span className="text-[11px] text-slate-400 font-normal">Revenue and performance across all branches</span>
                </div>
              }
            >
              <ShopComparisonChart data={comparison} loading={loading} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Product Sales */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card
            variant="borderless"
            className="shadow-sm rounded-3xl"
            loading={loading}
            title={
              <div>
                <h3 className="font-bold text-lg m-0">Product Sales</h3>
                <span className="text-[11px] text-slate-400 font-normal">Total: {formatCurrency(products.totalProductRevenue)}</span>
              </div>
            }
          >
            <ProductSalesTable data={products.topProducts} isGlobalOnly={products.isGlobalOnly} loading={loading} />
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
