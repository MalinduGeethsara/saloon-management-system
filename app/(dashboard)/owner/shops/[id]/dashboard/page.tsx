import React from 'react';
import { db as prisma } from '@/lib/db';
import { Card, Row, Col, Statistic, Avatar, Tag, Divider, Empty } from 'antd';
import { ShopOutlined, DollarCircleOutlined, CalendarOutlined, TeamOutlined, UserOutlined, ArrowLeftOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';
import { ShopHoursEditor } from '@/components/shops/ShopHoursEditor';
import { AlertProvider } from '@/components/alerts/AlertSystem';

export default async function ShopDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const shopId = resolvedParams.id;

  // Fetch shop data
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      // Only the columns this page shows: `staff: true` / `customer: true` would load password hashes
      // into a page that also renders client components
      staff: { select: { id: true, name: true, email: true, phone: true, role: true, imageUrl: true } },
      bookings: {
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          barber: { select: { id: true, name: true } },
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
    <AlertProvider>
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
          
          <div className="flex gap-2">
            <Tag color={shop.status === 'Open' ? 'green' : 'red'} className="px-4 py-1 text-sm font-bold rounded-full border-none">
              {shop.status.toUpperCase()}
            </Tag>
          </div>
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
            {/* Operating Schedule */}
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-lg"><ClockCircleOutlined className="mr-2 text-blue-500" /> Operating Schedule</span>
                    <ShopHoursEditor shop={shop} />
                  </div>
                }
                variant="borderless"
                className="shadow-sm rounded-3xl border border-slate-100 h-full"
              >
                <div className="flex flex-col gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const schedule = (shop.operatingHours as any)?.[day] || { open: '09:00', close: '18:00', isClosed: day === 'Sunday' };
                    return (
                      <div key={day} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className="font-bold text-slate-700">{day}</span>
                        {schedule.isClosed ? (
                          <Tag color="red" className="m-0 font-bold border-none">CLOSED</Tag>
                        ) : (
                          <span className="text-slate-500 font-semibold">{schedule.open} - {schedule.close}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>

            {/* Staff List */}
            <Col xs={24} lg={16}>
              <Card
                title={<span className="font-bold text-lg"><TeamOutlined className="mr-2 text-emerald-500" /> Assigned Staff Members</span>}
                variant="borderless"
                className="shadow-sm rounded-3xl border border-slate-100 h-full"
              >
                {shop.staff.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {shop.staff.map((member: any) => (
                      <div key={member.id} className="p-4 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow bg-white">
                        <Avatar
                          src={member.imageUrl}
                          size={56}
                          className="border border-slate-200 bg-slate-100 shrink-0"
                          icon={<UserOutlined className="text-slate-400" />}
                        />
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-800 text-lg truncate">{member.name}</div>
                          <Tag color="purple" className="rounded-full border-none m-0 mt-1 font-bold text-xs">
                            {member.role || 'Staff'}
                          </Tag>
                          <div className="flex gap-2 mt-2">
                            {member.phone && <a href={`tel:${member.phone}`}><PhoneOutlined className="text-slate-400 hover:text-[#7C4DFF] cursor-pointer" /></a>}
                            {member.email && <a href={`mailto:${member.email}`}><MailOutlined className="text-slate-400 hover:text-[#7C4DFF] cursor-pointer" /></a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 flex justify-center"><Empty description="No staff members assigned to this shop" /></div>
                )}
              </Card>
            </Col>
          </Row>

        </div>
    </AlertProvider>
  );
}