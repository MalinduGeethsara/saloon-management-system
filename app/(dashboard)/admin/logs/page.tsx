"use client";

import React, { useState } from 'react';
import { Card, Timeline, Typography, Tag, Avatar, Segmented } from 'antd';
import { 
  SafetyCertificateOutlined, 
  WarningOutlined, 
  LoginOutlined, 
  DatabaseOutlined,
  UserAddOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SecurityLogs() {
  const [filter, setFilter] = useState('All');

  const logs = [
    { 
      key: '1',
      time: '10:45 AM', 
      action: 'Admin Login', 
      user: 'system_admin', 
      status: 'success', 
      icon: <LoginOutlined /> 
    },
    { 
      key: '2',
      time: '09:30 AM', 
      action: 'Failed Login Attempt', 
      user: 'unknown_ip (192.168.1.1)', 
      status: 'error', 
      icon: <WarningOutlined /> 
    },
    { 
      key: '3',
      time: '08:15 AM',
      action: 'Database Backup Created',
      user: 'system_cron',
      status: 'success',
      icon: <DatabaseOutlined />
    },
    { 
      key: '4',
      time: 'Yesterday', 
      action: 'Shop Data Modified', 
      user: 'owner_john_luxe', 
      status: 'processing', 
      icon: <SafetyCertificateOutlined /> 
    },
    {
      key: '5',
      time: 'Yesterday',
      action: 'New Staff Registered',
      user: 'owner_john_luxe',
      status: 'success',
      icon: <UserAddOutlined />
    },
    {
      key: '6',
      time: '2 days ago',
      action: 'Unauthorized API Access',
      user: 'unknown_ip (103.88.22.14)',
      status: 'error',
      icon: <WarningOutlined />
    }
  ];

  const filteredLogs = logs.filter(log => {
    if (filter === 'All') return true;
    return log.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-6">
      {/* Header Section */}
      <header className="mb-8">
        <Title level={2} style={{ fontWeight: 800, margin: 0, color: '#2D3748' }}>
          Security Logs
        </Title>
        <Text type="secondary" className="text-sm">
          Audit trail of system access and administrative actions.
        </Text>
      </header>

      {/* Filter Segmented Control - Scrollable on mobile screens */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-none flex">
        <Segmented
          options={['All', 'Success', 'Error', 'Processing']}
          value={filter}
          onChange={(value) => setFilter(value as string)}
          size="large"
          className="bg-slate-100 rounded-xl p-1 font-semibold text-slate-600"
        />
      </div>

      <Card 
        variant="borderless" 
        className="rounded-3xl shadow-sm border border-slate-100 bg-white"
        styles={{ body: { padding: '24px 16px' } }}
      >
        <Timeline
          className="responsive-timeline"
          items={filteredLogs.map(log => ({
            icon: (
              <Avatar 
                size={28} 
                icon={log.icon} 
                className={`flex items-center justify-center border transition-all duration-300 ${
                  log.status === 'error' 
                    ? 'bg-rose-50 border-rose-100 text-rose-500' 
                    : log.status === 'processing'
                    ? 'bg-blue-50 border-blue-100 text-blue-500'
                    : 'bg-purple-50 border-purple-100 text-[#7C4DFF]'
                }`}
              />
            ),
            content: (
              <div className="bg-white hover:bg-slate-50/50 border border-slate-100/80 p-4 sm:p-5 rounded-2xl shadow-sm transition-all duration-300 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Text strong className="text-slate-800 text-sm sm:text-base tracking-tight font-bold">{log.action}</Text>
                    <Tag 
                      color={
                        log.status === 'success' ? 'purple' : 
                        log.status === 'error' ? 'red' : 
                        'blue'
                      } 
                      className="rounded-full border-0 px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase m-0"
                    >
                      {log.status.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span className="font-light">Performed by:</span>
                    <span className="font-bold text-[#7C4DFF] bg-[#F5F3FF] px-2.5 py-0.5 rounded-lg text-[11px] tracking-wide">{log.user}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg">
                    {log.time}
                  </span>
                </div>
              </div>
            )
          }))}
        />
      </Card>
    </div>
  );
}