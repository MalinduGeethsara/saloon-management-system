"use client";
import React, { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
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

interface OwnerSidebarProps {
  onClose?: () => void;
}

export function OwnerSidebar({ onClose }: OwnerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('owner');
  const [attendanceId, setAttendanceId] = useState<string>('1');
  const [empId, setEmpId] = useState<string>('EMP-001');

  useEffect(() => {
    const matchRole = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (matchRole) setUserRole(matchRole[2]);

    const matchAttendance = document.cookie.match(new RegExp('(^| )attendance_id=([^;]+)'));
    if (matchAttendance) setAttendanceId(matchAttendance[2]);

    const matchEmp = document.cookie.match(new RegExp('(^| )emp_id=([^;]+)'));
    if (matchEmp) setEmpId(matchEmp[2]);
  }, []);

  const hrChildrenLinks = userRole === 'barber' ? [
    { key: `/owner/hr/attendance/${attendanceId}`, label: 'My Attendance' },
    { key: `/owner/hr/payroll/${empId}`, label: 'My Payroll' },
  ] : [
    { key: '/owner/hr/attendance', label: 'Attendance' },
    { key: '/owner/hr/payroll', label: 'Payroll' },
  ];

  const rawMenuItems = [
    { key: '/owner', icon: <DashboardOutlined />, label: 'Intelligence', allowedRoles: ['owner'] },
    { key: '/owner/calendar', icon: <CalendarOutlined />, label: 'Calendar', allowedRoles: ['owner', 'manager', 'barber'] },
    { key: '/owner/bookings/manage', icon: <CarryOutOutlined />, label: 'Bookings', allowedRoles: ['owner', 'manager'] },
    { key: '/owner/staff', icon: <UsergroupAddOutlined />, label: 'Staff', allowedRoles: ['owner'] },
    { 
      key: 'hr', 
      icon: <SolutionOutlined />, 
      label: 'Human Resources',
      allowedRoles: ['owner', 'barber'],
      children: hrChildrenLinks  
    },
    { key: '/owner/shops', icon: <ShopOutlined />, label: 'My Shops', allowedRoles: ['owner'] },
    { key: '/owner/services', icon: <ScissorOutlined />, label: 'Services', allowedRoles: ['owner', 'manager'] },
    { key: '/owner/products', icon: <TeamOutlined />, label: 'Products', allowedRoles: ['owner', 'manager'] },
    { key: '/owner/payments', icon: <DollarCircleOutlined />, label: 'Payments', allowedRoles: ['owner', 'manager'] },
    { key: '/owner/reports', icon: <BarChartOutlined />, label: 'Reports', allowedRoles: ['owner'] },
  ];

 const filteredMenuItems = rawMenuItems
  .filter(item => item.allowedRoles.includes(userRole))
  .map(({ allowedRoles, ...cleanItem }) => cleanItem);

  return (
    <Sider 
      width={260} 
      theme="light" 
      style={{ borderRight: '1px solid #E2E8F0', height: '100vh', position: 'sticky', top: 0 }}
    >
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'grid', color: '#7C4DFF', fontWeight: 'bolder', fontSize: '18px' }}>MR POLAA</div>
        <div style={{ padding: '1px',width: '100%', height: '1px', backgroundColor: '#7C4DFF' }} />
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        onClick={({ key }) => {
          router.push(key);
          if (onClose) onClose();
        }} 
        style={{ borderRight: 0, padding: '0 12px' }}
        items={filteredMenuItems}
      />
    </Sider>
  );
}