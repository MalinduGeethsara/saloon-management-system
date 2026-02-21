"use client";

import React, { useState } from 'react';
import { usePathname } from "next/navigation";
import { Layout, ConfigProvider, Input, Badge, Avatar, Drawer, Button } from 'antd';
import { SearchOutlined, BellOutlined, MenuOutlined } from '@ant-design/icons';
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { OwnerSidebar } from "@/components/navigation/OwnerSidebar";

const { Header, Content, Sider } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logic: Check if the current URL belongs to Owner or Admin
  const isOwnerRoute = pathname.startsWith("/owner");
  const isAdminRoute = pathname.startsWith("/admin");

  // Determine which sidebar to render
  const SidebarContent = isOwnerRoute ? (
    <OwnerSidebar />
  ) : isAdminRoute ? (
    <AdminSidebar />
  ) : (
    <div style={{ width: 260, background: '#FFFFFF', borderRight: '1px solid #E2E8F0', height: '100%' }} />
  );

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
          Drawer: { colorBgElevated: '#FFFFFF' }
        }
      }}
    >
      <style jsx global>{`
        /* Default: Mobile View */
        .dashboard-sider {
          display: none !important;
        }
        .dashboard-main {
          margin-left: 0 !important;
        }
        
        /* Desktop View (lg breakpoint approx 992px) */
        @media (min-width: 992px) {
          .dashboard-sider {
            display: block !important;
          }
          .dashboard-main {
            margin-left: 260px !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>

      <Layout style={{ minHeight: '100vh' }}>
        
        {/* --- DESKTOP SIDEBAR --- */}
        <Sider 
          width={260} 
          theme="light" 
          className="dashboard-sider"
          style={{ 
            borderRight: '1px solid #E2E8F0',
            position: 'fixed', 
            height: '100vh', 
            left: 0, 
            top: 0, 
            zIndex: 100 
          }}
        >
          {SidebarContent}
        </Sider>

        {/* --- MOBILE DRAWER SIDEBAR --- */}
        <Drawer
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          // FIX: Removed deprecated 'width' prop
          // FIX: Added width to 'wrapper' inside styles prop
          styles={{ 
            body: { padding: 0 },
            wrapper: { width: 280 } 
          }}
          closable={false}
        >
          {SidebarContent}
        </Drawer>

        {/* --- MAIN LAYOUT --- */}
        <Layout className="dashboard-main" style={{ transition: 'margin-left 0.2s' }}>
          
          {/* HEADER */}
          <Header style={{ 
            padding: '0 24px', 
            background: '#F8F9FF', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            height: '80px',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            backdropFilter: 'blur(8px)',
          }}>
            
            {/* Left Side: Hamburger (Mobile Only via CSS) + Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button 
                className="mobile-menu-btn"
                icon={<MenuOutlined />} 
                onClick={() => setMobileMenuOpen(true)} 
                size="large"
                type="text"
              />
              
              <Input 
                placeholder="Search Dashboard" 
                prefix={<SearchOutlined style={{ color: '#A0AEC0' }} />} 
                style={{ 
                  width: '100%', 
                  maxWidth: '300px',
                  borderRadius: '12px', 
                  background: '#FFFFFF', 
                  border: '1px solid #E2E8F0' 
                }} 
              />
            </div>

            {/* Right Side: Profile & Notifs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Badge dot color="#7C4DFF">
                <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '20px', color: '#718096' }} />} />
              </Badge>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right', lineHeight: '1.2' }} className="hidden sm:block">
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#2D3748' }}>
                    {isOwnerRoute ? 'Karenath Smith' : 'System Admin'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#718096' }}>
                    {isOwnerRoute ? 'Owner Profile' : 'Super Admin'}
                  </p>
                </div>
                <Avatar 
                  src="https://i.pravatar.cc/150?u=a" 
                  size="large" 
                  style={{ border: '2px solid #FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} 
                />
              </div>
            </div>
          </Header>

          {/* CONTENT AREA */}
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