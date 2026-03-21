"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from "next/navigation";
import { Layout, ConfigProvider, Drawer, Button } from 'antd';
import { MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { OwnerSidebar } from "@/components/navigation/OwnerSidebar";
import { NotificationBell } from "@/components/layout/NotificationBell"; 

const { Header, Content, Sider } = Layout;

const SINHALA_DAYS = ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
const SINHALA_MONTHS = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 1. States for both Mobile and Desktop sidebars
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); // Defaults to open on desktop
  
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  const isOwnerRoute = pathname.startsWith("/owner");
  const isAdminRoute = pathname.startsWith("/admin");

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const SidebarContent = isOwnerRoute ? (
    <OwnerSidebar onClose={closeMobileMenu} />
  ) : isAdminRoute ? (
    <AdminSidebar onClose={closeMobileMenu} />
  ) : (
    <div style={{ width: 260, background: '#FFFFFF', borderRight: '1px solid #E2E8F0', height: '100%' }} />
  );

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = time.getHours();
  let greeting = "Good evening";
  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  }

  const dayName = SINHALA_DAYS[time.getDay()];
  const monthName = SINHALA_MONTHS[time.getMonth()];
  const dateNum = time.getDate();
  const year = time.getFullYear();
  
  const formattedSinhalaDate = `${dayName}, ${year} ${monthName} ${dateNum}`;
  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

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
      {/* 2. Added CSS logic to handle smooth sliding animations */}
      <style jsx global>{`
        /* Default: Mobile View */
        .dashboard-sider { display: none !important; }
        .dashboard-main { 
          margin-left: 0 !important; 
          transition: margin-left 0.3s cubic-bezier(0.2, 0, 0, 1) !important;
        }
        .desktop-menu-btn { display: none !important; }
        .mobile-menu-btn { display: inline-flex !important; }
        
        /* Desktop View (992px and up) */
        @media (min-width: 992px) {
          .dashboard-sider { 
            display: block !important; 
            transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1) !important;
          }
          
          /* Dynamic classes controlled by React state */
          .dashboard-sider.sidebar-closed { transform: translateX(-260px) !important; }
          .dashboard-sider.sidebar-open { transform: translateX(0) !important; }
          
          .dashboard-main.sidebar-closed { margin-left: 0 !important; }
          .dashboard-main.sidebar-open { margin-left: 260px !important; }
          
          .mobile-menu-btn { display: none !important; }
          .desktop-menu-btn { display: inline-flex !important; }
        }
      `}</style>

      <Layout style={{ minHeight: '100vh', overflow: 'hidden' }}>
        
        {/* --- DESKTOP SIDEBAR --- */}
        <Sider 
          width={260} 
          theme="light" 
          /* 3. Apply dynamic class based on state */
          className={`dashboard-sider ${desktopSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
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
          onClose={closeMobileMenu}
          styles={{ 
            body: { padding: 0 },
            wrapper: { width: 280 } 
          }}
          closable={false}
        >
          {SidebarContent}
        </Drawer>

        {/* --- MAIN LAYOUT --- */}
        {/* 4. Apply dynamic class to shift the main content area */}
        <Layout className={`dashboard-main ${desktopSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              {/* Mobile Menu Button (Only shows on small screens) */}
              <Button 
                className="mobile-menu-btn"
                icon={<MenuOutlined />} 
                onClick={() => setMobileMenuOpen(true)} 
                size="large"
                type="text"
              />

              {/* 5. Desktop Menu Button (Only shows on large screens) */}
              <Button 
                className="desktop-menu-btn"
                icon={desktopSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} 
                onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} 
                size="large"
                type="text"
              />
              
              {mounted && (
                <div className="hidden sm:flex flex-col" style={{ lineHeight: '1.2' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#2D3748' }}>
                    {greeting}! 👋
                  </span>
                  <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600 }}>
                    {formattedTime} • {formattedSinhalaDate}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <NotificationBell />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right', lineHeight: '1.2' }} className="hidden sm:block">
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#2D3748' }}>
                    {isOwnerRoute ? 'Karenath Smith' : 'System Admin'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#718096' }}>
                    {isOwnerRoute ? 'Owner Profile' : 'Super Admin'}
                  </p>
                </div>
              </div>
            </div>
          </Header>

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