"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from "next/navigation";
import { Layout, ConfigProvider, Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { OwnerSidebar } from "@/components/navigation/OwnerSidebar";

// Import the new Notification component
import { NotificationBell } from "@/components/layout/NotificationBell"; 

const { Header, Content, Sider } = Layout;

// --- Sinhala Translation Arrays ---
const SINHALA_DAYS = ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
const SINHALA_MONTHS = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // --- Date & Time State ---
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

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

  // --- Real-time Clock Effect ---
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Time & Greeting Logic ---
  const currentHour = time.getHours();
  let greeting = "Good evening";
  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  }

  // --- Sinhala Date Formatting ---
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
            
            {/* Left Side: Hamburger + Greeting + Sinhala Date/Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button 
                className="mobile-menu-btn"
                icon={<MenuOutlined />} 
                onClick={() => setMobileMenuOpen(true)} 
                size="large"
                type="text"
              />
              
              {/* Greeting & Sinhala Date display */}
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

            {/* Right Side: Notifs & Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              
              {/* The New Notification Bell Component */}
              <NotificationBell />
              
              {/* Profile Details (Avatar removed) */}
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