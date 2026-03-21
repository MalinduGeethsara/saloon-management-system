"use client";
import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { 
  HomeOutlined, 
  DatabaseOutlined, 
  ShopOutlined, 
  SafetyCertificateOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Sider } = Layout;

// 1. Added onClose prop interface
interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { key: '/admin', icon: <HomeOutlined />, label: 'Dashboard' },
    { key: '/admin/backups', icon: <DatabaseOutlined />, label: 'System Backups' },
    { key: '/admin/shops', icon: <ShopOutlined />, label: 'Shop Data' },
    { key: '/admin/logs', icon: <SafetyCertificateOutlined />, label: 'Security Logs' },
  ];

  return (
    <Sider 
      width={260} 
      theme="light" 
      style={{ height: '100vh', borderRight: '1px solid #E2E8F0', position: 'sticky', top: 0 }}
    >
      {/* Admin Logo */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
  {/* The Text */}
  <div style={{ display: 'grid', color: '#7C4DFF', fontWeight: 'bolder', fontSize: '18px' }}>SYSTEM ADMIN</div>
  
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

      {/* Admin Specific Widget */}
      <div style={{ margin: 'auto 20px 20px', padding: '20px', background: '#F8F9FF', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <CloudUploadOutlined style={{ fontSize: '20px', color: '#7C4DFF' }} />
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>System Status</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#48BB78' }}>Operational</p>
            </div>
         </div>
         <Button type="primary" block style={{ borderRadius: '12px', background: '#2D3748' }}>
            Run Diagnostics
         </Button>
      </div>
    </Sider>
  );
}