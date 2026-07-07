"use client";

import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Avatar, Tag, Empty, Button } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

export default function BarberDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const upcomingBookings = bookings
    .filter(b => dayjs(b.date).isAfter(dayjs()) && b.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const newBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingColumns = [
    {
      title: 'Time',
      dataIndex: 'date',
      key: 'time',
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="font-bold text-[#7C4DFF]">{dayjs(date).format('h:mm A')}</span>
          <span className="text-xs text-slate-400">{dayjs(date).format('MMM DD, YYYY')}</span>
        </div>
      )
    },
    {
      title: 'Client',
      dataIndex: 'customer',
      key: 'client',
      render: (customer: any) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} className="bg-slate-100 text-slate-400" />
          <span className="font-bold text-slate-800">{customer?.name || 'Walk-in'}</span>
        </div>
      )
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service: any) => <span className="font-medium text-slate-600">{service?.name}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'CONFIRMED' ? 'blue' : 'gold'} className="rounded-full font-bold px-3">
          {status}
        </Tag>
      )
    }
  ];

  const newlyAddedColumns = [
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="text-xs font-bold text-slate-500">{dayjs(date).fromNow()}</span>
    },
    {
      title: 'Client',
      dataIndex: 'customer',
      key: 'client',
      render: (customer: any) => <span className="font-bold text-slate-800">{customer?.name || 'Walk-in'}</span>
    },
    {
      title: 'Appointment Time',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <span className="font-medium text-slate-600">{dayjs(date).format('MMM DD, h:mm A')}</span>
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service: any) => <span className="text-slate-500">{service?.name}</span>
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-10 px-4 space-y-6">
      <div className="mb-6">
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Welcome Back</Title>
        <Text type="secondary" className="text-sm sm:text-base">Here's your schedule and latest updates.</Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card 
          title={<span className="font-bold text-lg"><CalendarOutlined className="mr-2 text-[#7C4DFF]" /> Upcoming Appointments</span>} 
          variant="borderless" 
          className="shadow-sm rounded-3xl h-full overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          {upcomingBookings.length > 0 ? (
            <Table 
              dataSource={upcomingBookings} 
              columns={upcomingColumns} 
              rowKey="id"
              pagination={false}
              loading={loading}
              className="custom-table"
            />
          ) : (
            <div className="p-10 flex justify-center">
              <Empty description="No upcoming appointments" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>

        {/* Newly Added Bookings */}
        <Card 
          title={<span className="font-bold text-lg"><ClockCircleOutlined className="mr-2 text-amber-500" /> Newly Added</span>} 
          variant="borderless" 
          className="shadow-sm rounded-3xl h-full overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          {newBookings.length > 0 ? (
            <Table 
              dataSource={newBookings} 
              columns={newlyAddedColumns} 
              rowKey="id"
              pagination={false}
              loading={loading}
              className="custom-table"
            />
          ) : (
            <div className="p-10 flex justify-center">
              <Empty description="No new bookings recently" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
