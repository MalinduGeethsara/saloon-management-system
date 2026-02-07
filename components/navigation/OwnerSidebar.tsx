"use client";
import React from 'react';
import { Layout, Menu, Progress, Button, Typography } from 'antd';
import { 
  DashboardOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  ShopOutlined,
  DollarCircleOutlined,
  BarChartOutlined,
  CarryOutOutlined,
  SolutionOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;

export function OwnerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { key: '/owner', icon: <DashboardOutlined />, label: 'Intelligence' },
    { key: '/owner/calendar', icon: <CalendarOutlined />, label: 'Calendar' },
    { key: '/owner/bookings/manage', icon: <CarryOutOutlined />, label: 'Bookings' },
    { key: '/owner/staff', icon: <UsergroupAddOutlined />, label: 'Staff' },
    { 
      key: 'hr', 
      icon: <SolutionOutlined />, 
      label: 'Human Resources',
      children: [
        { key: '/owner/hr/attendance', label: 'Attendance' },
        { key: '/owner/hr/payroll', label: 'Payroll' },
      ]
    },
    { key: '/owner/shops', icon: <ShopOutlined />, label: 'My Shops' },
    { key: '/owner/products', icon: <TeamOutlined />, label: 'Products' },
    { key: '/owner/payments', icon: <DollarCircleOutlined />, label: 'Payments' },
    { key: '/owner/reports', icon: <BarChartOutlined />, label: 'Reports' },
  ];

  return (
    <Sider 
      width={260} 
      theme="light" 
      style={{ borderRight: '1px solid #E2E8F0', height: '100vh', position: 'sticky', top: 0 }}
    >
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 32, height: 32, background: '#7C4DFF', borderRadius: 8, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 'bold' }}>S</div>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#2D3748', letterSpacing: '-1px' }}>salonpro</span>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={({ key }) => router.push(key)}
        style={{ borderRight: 0, padding: '0 12px' }}
        items={menuItems}
      />

      <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, padding: '16px', background: '#F8F9FF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Typography.Text strong style={{ fontSize: '12px' }}>Business Health</Typography.Text>
          <Typography.Text style={{ fontSize: '10px', color: '#7C4DFF' }}>84%</Typography.Text>
        </div>
        
        {/* FIX: Corrected size property for TypeScript compatibility */}
        <Progress 
          percent={84} 
          showInfo={false} 
          strokeColor="#7C4DFF" 
          size={{ height: 8 }} 
        />
        
        <Button type="primary" block size="small" style={{ marginTop: 12, borderRadius: 8, fontSize: '12px', height: '32px' }}>
          View Full Audit
        </Button>
      </div>
    </Sider>
  );
}