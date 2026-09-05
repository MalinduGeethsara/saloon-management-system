"use client";

import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardOutlined,
  CalendarOutlined,
  DollarOutlined,
  CloseOutlined
} from '@ant-design/icons';
import Image from 'next/image';

const { Sider } = Layout;

export function BarberSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      key: '/barber',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/barber/calendar',
      icon: <CalendarOutlined />,
      label: 'My Schedule',
    },
    {
      key: '/barber/earnings',
      icon: <DollarOutlined />,
      label: 'My Earnings',
    }
  ];

  return (
    <Sider 
      width={260} 
      theme="light" 
      className="h-full border-r border-slate-200"
      style={{ background: '#FFFFFF' }}
    >
      <div className="p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C4DFF] to-[#6c42e0] flex items-center justify-center text-white font-black text-xl shadow-md shadow-purple-200">
            S
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 m-0 leading-tight">SalonPro</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">My Dashboard</p>
          </div>
        </div>
        {onClose && (
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose} 
            className="md:hidden text-slate-400 hover:text-slate-600"
          />
        )}
      </div>

      <div className="px-4 py-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-4">Menu</div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          onClick={({ key }) => {
            router.push(key);
            if (onClose) onClose();
          }}
          items={menuItems}
          className="border-r-0"
          style={{ background: 'transparent' }}
        />
      </div>
    </Sider>
  );
}
