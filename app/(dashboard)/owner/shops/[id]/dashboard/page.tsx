import React from 'react';
import { db as prisma } from '@/lib/db';
import { Card, Row, Col, Statistic, Avatar, Tag, Divider, Empty } from 'antd';
import { ShopOutlined, DollarCircleOutlined, CalendarOutlined, TeamOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';

export default async function ShopDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const shopId = resolvedParams.id;

  // Fetch shop data
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      staff: true,
      bookings: {
        include: {
          customer: true,
          barber: true,
          services: { include: { service: true } }
        },
        orderBy: {
          date: 'desc'
        },
        take: 10
      }
    }
  });

  if (!shop) {
    return (
      <div className="p-10 flex justify-center items-center h-screen bg-gray-50">
        <Empty description="Shop not found" />
      </div>
    );
  }

  // Calculate KPIs
  const totalBookings = shop.bookings.length;
  const totalRevenue = shop.bookings.reduce((sum: any, b: any) => sum + (b.totalAmount || 0), 0);
  const staffCount = shop.staff.length;

  return (
    <div className="max-w-[1400px] mx-auto pb-10 px-4 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/owner/shops">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeftOutlined className="text-slate-500" />
            </div>
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7C4DFF] to-[#6c42e0] flex items-center justify-center shadow-md shadow-purple-200">
            <ShopOutlined className="text-white text-2xl" />
          </div>
          <div>
            <h2 className="text-[28px] md:text-3xl font-extrabold m-0 text-slate-800 leading-tight">{shop.name}</h2>
            <span className="text-slate-500 font-medium">{shop.address || 'No Address Provided'}</span>
          </div>
        </div>
        
        <Tag color={shop.status === 'Open' ? 'green' : 'red'} className="px-4 py-1 text-sm font-bold rounded-full border-none">
          {shop.status.toUpperCase()}
        </Tag>
      </div>

      <Divider className="my-2 border-slate-100" />

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full border border-slate-100">
            <Statistic 
              title={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</span>}
              value={totalRevenue}
              prefix={<DollarCircleOutlined className="text-emerald-500 mr-2" />}
              styles={{ content: { fontWeight: 800, color: '#1e293b', fontSize: '28px' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full border border-slate-100">
            <Statistic 
              title={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Bookings</span>}
              value={totalBookings}
              prefix={<CalendarOutlined className="text-[#7C4DFF] mr-2" />}
              styles={{ content: { fontWeight: 800, color: '#1e293b', fontSize: '28px' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full border border-slate-100">
            <Statistic 
              title={<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Staff</span>}
              value={staffCount}
              prefix={<TeamOutlined className="text-blue-500 mr-2" />}
              styles={{ content: { fontWeight: 800, color: '#1e293b', fontSize: '28px' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-4">
        {/* Recent Bookings */}
        <Col xs={24} lg={16}>
          <Card 
            title={<span className="font-bold text-lg"><CalendarOutlined className="mr-2 text-[#7C4DFF]" /> Recent Bookings</span>} 
            variant="borderless" 
            className="shadow-sm rounded-3xl border border-slate-100 h-full"
          >
            {shop.bookings.length > 0 ? (
              <div className="flex flex-col gap-4">
                {shop.bookings.map((booking: any) => (
                  <div key={booking.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="bg-white border border-slate-200" icon={<UserOutlined className="text-slate-400" />} />
                      <div>
                        <div className="font-bold text-slate-800">{booking.customer?.name || 'Walk-in Client'}</div>
                        <div className="text-xs text-slate-500">
                          {booking.services?.map((bs: any) => bs.service?.name).join(', ') || 'General Service'} • {dayjs(booking.date).format('MMM DD, YYYY h:mm A')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-800">Rs. {booking.totalAmount?.toLocaleString() || 0}</div>
                        <div className="text-xs text-slate-500">{booking.barber?.name || 'Any Specialist'}</div>
                      </div>
                      <Tag color={booking.status === 'CONFIRMED' ? 'blue' : booking.status === 'COMPLETED' ? 'green' : 'gold'} className="rounded-full font-bold m-0 border-none">
                        {booking.status}
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 flex justify-center"><Empty description="No bookings for this shop yet" /></div>
            )}
          </Card>
        </Col>

        {/* Staff List */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span className="font-bold text-lg"><TeamOutlined className="mr-2 text-emerald-500" /> Assigned Staff</span>} 
            variant="borderless" 
            className="shadow-sm rounded-3xl border border-slate-100 h-full"
          >
            {shop.staff.length > 0 ? (
              <div className="flex flex-col gap-3">
                {shop.staff.map((member: any) => (
                  <div key={member.id} className="p-3 rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <Avatar className="bg-slate-200 text-slate-600">{member.name.charAt(0)}</Avatar>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{member.name}</div>
                      <div className="text-xs font-bold text-[#7C4DFF] uppercase tracking-wider">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 flex justify-center"><Empty description="No staff assigned" /></div>
            )}
          </Card>
        </Col>
      </Row>

    </div>
  );
}