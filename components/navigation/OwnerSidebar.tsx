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
  ScissorOutlined,
  ShoppingCartOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { resolveAccess, type PermissionRow } from '@/lib/access';
import { readSession, SESSION_REFRESHED_EVENT } from '@/hooks/useAccess';

const { Sider } = Layout;

interface OwnerSidebarProps {
  onClose?: () => void;
}

export function OwnerSidebar({ onClose }: OwnerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  // Who is signed in and what the owner allowed them (the same rules the server applies).
  // Re-read whenever the server re-issued their session because their access changed.
  const [session, setSession] = useState<{ role: string; rows: PermissionRow[] }>({ role: '', rows: [] });

  useEffect(() => {
    const read = () => setSession(readSession());
    read();
    window.addEventListener(SESSION_REFRESHED_EVENT, read);
    return () => window.removeEventListener(SESSION_REFRESHED_EVENT, read);
  }, []);

  const userRole = session.role.toLowerCase();
  const seesEverything = userRole === 'owner' || userRole === 'admin';
  const canSee = (key: string) => resolveAccess(session.role, session.rows, key).view;

  const rawMenuItems = [
    { key: '/owner', icon: <DashboardOutlined />, label: 'Intelligence', allowedRoles: ['owner', 'admin'] },
    { key: '/owner/calendar', icon: <CalendarOutlined />, label: 'Calendar', allowedRoles: ['owner', 'admin', 'manager', 'barber'] },
    { key: '/owner/bookings/manage', icon: <CarryOutOutlined />, label: 'Bookings', allowedRoles: ['owner', 'admin', 'manager'] },
    { key: '/owner/staff', icon: <UsergroupAddOutlined />, label: 'Staff', allowedRoles: ['owner', 'admin'] },
    {
      key: 'hr',
      icon: <SolutionOutlined />,
      label: 'Human Resources',
      allowedRoles: ['owner', 'admin'],
      children: [
        { key: '/owner/hr/attendance', label: 'Attendance' },
        { key: '/owner/hr/payroll', label: 'Payroll' },
      ],
    },
    { key: '/owner/shops', icon: <ShopOutlined />, label: 'My Shops', allowedRoles: ['owner', 'admin'] },
    { key: '/owner/services', icon: <ScissorOutlined />, label: 'Services', allowedRoles: ['owner', 'admin', 'manager'] },
    { key: '/owner/products', icon: <TeamOutlined />, label: 'Products', allowedRoles: ['owner', 'admin', 'manager'] },
    { key: '/owner/payments', icon: <DollarCircleOutlined />, label: 'Payments', allowedRoles: ['owner', 'admin', 'manager'] },
    { key: '/owner/orders', icon: <ShoppingCartOutlined />, label: 'Orders', allowedRoles: ['owner', 'admin', 'manager'] },
    // Owner's private books: stock orders, petty cash, bills, wages. Never granted to other roles.
    { key: '/owner/expenses', icon: <WalletOutlined />, label: 'Expenses', allowedRoles: ['owner'] },
    { key: '/owner/reports', icon: <BarChartOutlined />, label: 'Reports', allowedRoles: ['owner', 'admin'] },
  ];

  const filteredMenuItems = rawMenuItems
    .map((item) => {
      if (seesEverything) return item.allowedRoles.includes(userRole) ? item : null;
      // Everyone else: exactly the pages the owner gave them (Expenses is never given out)
      if (item.key === '/owner/expenses') return null;
      if (item.key === 'hr') {
        const children = item.children!.filter((c) => canSee(c.key));
        return children.length ? { ...item, children } : null;
      }
      return canSee(item.key) ? item : null;
    })
    .filter((item): item is NonNullable<typeof item> => !!item)
    .map(({ allowedRoles, ...cleanItem }) => cleanItem);

  return (
    <Sider 
      width={260} 
      theme="light" 
      style={{ borderRight: '1px solid #E2E8F0', height: '100dvh', position: 'sticky', top: 0 }}
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