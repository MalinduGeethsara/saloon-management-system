"use client";

import React from 'react';
import { usePathname } from "next/navigation";
import { Layout, ConfigProvider, Input, Badge, Avatar } from 'antd';
import { SearchOutlined, BellOutlined } from '@ant-design/icons';
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { OwnerSidebar } from "@/components/navigation/OwnerSidebar";

const { Header, Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Logic: Check if the current URL belongs to Owner or Admin
  const isOwnerRoute = pathname.startsWith("/owner");
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7C4DFF',
          borderRadius: 14,
          colorBgLayout: '#F8F9FF',
          colorTextBase: '#2D3748',
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          Layout: { headerBg: '#F8F9FF', siderBg: '#FFFFFF' },
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* DYNAMIC SIDEBAR RENDER */}
        {isOwnerRoute ? (
          <OwnerSidebar />
        ) : isAdminRoute ? (
          <AdminSidebar />
        ) : (
          // Fallback for shared pages (like generic profile)
          <div style={{ width: 260, background: '#FFFFFF', borderRight: '1px solid #E2E8F0' }} />
        )}

        <Layout>
          {/* COMMON HEADER FOR BOTH ROLES */}
          <Header style={{ 
            padding: '0 24px', 
            background: '#F8F9FF', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            height: '80px'
          }}>
            <Input 
              placeholder="Search Dashboard" 
              prefix={<SearchOutlined style={{ color: '#A0AEC0' }} />} 
              style={{ width: 300, borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Badge dot color="#7C4DFF">
                <BellOutlined style={{ fontSize: '20px', color: '#718096' }} />
              </Badge>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#2D3748' }}>
                    {isOwnerRoute ? 'Karenath Smith' : 'System Admin'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#718096' }}>
                    {isOwnerRoute ? 'Owner Profile' : 'Super Admin'}
                  </p>
                </div>
                <Avatar src="https://i.pravatar.cc/150?u=a" size="large" style={{ border: '2px solid #FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
              </div>
            </div>
          </Header>

          {/* PAGE CONTENT */}
          <Content style={{ padding: '24px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}