"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { Layout, ConfigProvider, Drawer, Button, message } from 'antd';
import { 
  MenuOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  LogoutOutlined 
} from '@ant-design/icons';
import { AdminSidebar } from "@/components/navigation/AdminSidebar";
import { OwnerSidebar } from "@/components/navigation/OwnerSidebar";
import { NotificationBell } from "@/components/layout/NotificationBell"; 
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Header, Content, Sider } = Layout;

const SINHALA_DAYS = ["ඉරිදා", "සඳුදා", "අඟහරුවාදා", "බදාදා", "බ්‍රහස්පතින්දා", "සිකුරාදා", "සෙනසුරාදා"];
const SINHALA_MONTHS = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); 
  
  const [messageApi, contextHolder] = message.useMessage();
  
  // Sidebar States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  const isOwnerRoute = pathname.startsWith("/owner");
  const isAdminRoute = pathname.startsWith("/admin");

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const executeLogout = async () => {
    try {
      const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
      const currentUserRole = match ? match[2] : null;

      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (response.ok) {
        document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        messageApi.success('Signed out successfully');
        setIsLogoutModalOpen(false); 
        
        if (currentUserRole === 'customer') {
          router.push('/');  
        } else {
          router.push('/staff-login'); 
        }
        
        router.refresh();
      } else {
        messageApi.error('Failed to sign out');
      }
    } catch (error) {
      messageApi.error('Something went wrong during logout');
    }
  };

  const SidebarContent = isOwnerRoute ? (
    <OwnerSidebar onClose={closeMobileMenu} />
  ) : isAdminRoute ? (
    <AdminSidebar onClose={closeMobileMenu} />
  ) : (
    <div style={{ width: 260, background: '#FFFFFF', borderRight: '1px solid #E2E8F0', height: '100%' }} />
  );

  const [profileName, setProfileName] = useState('System User');
  const [profileRole, setProfileRole] = useState('Staff');

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);

    const nameMatch = document.cookie.match(new RegExp('(^| )user_name=([^;]+)'));
    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));

    const currentName = nameMatch ? decodeURIComponent(nameMatch[2]) : null;
    const currentRole = roleMatch ? roleMatch[2].toLowerCase() : null;

    if (currentName) {
      setProfileName(currentName);
    } else {
      if (currentRole === 'barber') setProfileName('Barber');
      else if (isOwnerRoute) setProfileName('Nimesh Haththasingha');
      else if (isAdminRoute) setProfileName('System Admin');
    }

    if (currentRole) {
      const roleStr = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
      setProfileRole(`${roleStr} Profile`);
    } else {
      if (isOwnerRoute) setProfileRole('Owner Profile');
      else if (isAdminRoute) setProfileRole('Super Admin');
    }

    return () => clearInterval(timer);
  }, [isOwnerRoute, isAdminRoute]);

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
        cssVar: { key: 'app-theme' },
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
      {/* ✅ FIX 3: Inject the context holder right inside ConfigProvider */}
      {contextHolder}

      <style jsx global>{`
        .dashboard-sider { display: none !important; }
        .dashboard-main { 
          margin-left: 0 !important; 
          transition: margin-left 0.3s cubic-bezier(0.2, 0, 0, 1) !important;
        }
        .desktop-menu-btn { display: none !important; }
        .mobile-menu-btn { display: inline-flex !important; }
        
        @media (min-width: 992px) {
          .dashboard-sider { 
            display: block !important; 
            transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1) !important;
          }
          .dashboard-sider.sidebar-closed { transform: translateX(-260px) !important; }
          .dashboard-sider.sidebar-open { transform: translateX(0) !important; }
          .dashboard-main.sidebar-closed { margin-left: 0 !important; }
          .dashboard-main.sidebar-open { margin-left: 260px !important; }
          .mobile-menu-btn { display: none !important; }
          .desktop-menu-btn { display: inline-flex !important; }
        }
      `}</style>

      <Layout style={{ minHeight: '100vh', overflow: 'hidden' }}>
        
        <Sider 
          width={260} 
          theme="light" 
          className={`dashboard-sider ${desktopSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          style={{ 
            borderRight: '1px solid #E2E8F0', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 
          }}
        >
          {SidebarContent}
        </Sider>

        <Drawer
          placement="left"
          open={mobileMenuOpen}
          onClose={closeMobileMenu}
          styles={{ body: { padding: 0 }, wrapper: { width: 280 } }}
          closable={false}
        >
          {SidebarContent}
        </Drawer>

        <Layout className={`dashboard-main ${desktopSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          
          <Header style={{ 
            padding: '0 24px', background: '#F8F9FF', display: 'flex', alignItems: 'center', 
            justifyContent: 'space-between', height: '80px', position: 'sticky', top: 0, zIndex: 99, backdropFilter: 'blur(8px)',
          }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button className="mobile-menu-btn" icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} size="large" type="text" />
              <Button className="desktop-menu-btn" icon={desktopSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} size="large" type="text" />
              
              {mounted && (
                <div className="hidden sm:flex flex-col" style={{ lineHeight: '1.2' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#2D3748' }}>{greeting}! 👋</span>
                  <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600 }}>{formattedTime} • {formattedSinhalaDate}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <NotificationBell />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {mounted && (
                  <div style={{ textAlign: 'right', lineHeight: '1.2' }} className="hidden sm:block">
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#2D3748' }}>{profileName}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#718096' }}>{profileRole}</p>
                  </div>
                )}
                
                <Button 
                  type="text" 
                  danger 
                  icon={<LogoutOutlined style={{ fontSize: '18px' }} />} 
                  onClick={() => setIsLogoutModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FFF5F5' }}
                  title="Sign Out"
                />
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

      <ConfirmationModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        title="Sign Out"
        description="Are you sure you want to securely log out of the system? Any unsaved changes may be lost."
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        isDanger={true}
      />
    </ConfigProvider>
  );
}