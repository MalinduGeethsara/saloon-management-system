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
  UsergroupAddOutlined,
  ScissorOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;

// 1. Added onClose prop interface
interface OwnerSidebarProps {
  onClose?: () => void;
}

export function OwnerSidebar({ onClose }: OwnerSidebarProps) {
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
    { key: '/owner/services', icon: <ScissorOutlined />, label: 'Services' },
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
      {/* Admin Logo */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
  {/* The Text */}
  <div style={{ display: 'grid', color: '#7C4DFF', fontWeight: 'bolder', fontSize: '18px' }}>MR POLAA</div>
  
  {/* The Horizontal Divider Line */}
  <div style={{ padding: '1px',width: '100%', height: '1px', backgroundColor: '#7C4DFF' }} />
</div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={({ key }) => {
          router.push(key);
          // 2. Call onClose when a link is clicked
          if (onClose) onClose();
        }} 
        style={{ borderRight: 0, padding: '0 12px' }}
        items={menuItems}
      />

 
    </Sider>
  );
}