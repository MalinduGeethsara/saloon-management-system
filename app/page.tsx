"use client";

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Avatar, Button, message } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PORTAL_ROUTES } from '@/app/routes';  

const { Title, Text } = Typography;

export default function PortalSelection() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Safely read the standard user_role cookie to determine what to show
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) {
      setUserRole(match[2]);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        // Clear local UI cookie 
        document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        message.success('Signed out successfully');
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      message.error('Failed to sign out');
    }
  };

  // Filter routes based on role (or show nothing while loading)
  const visibleRoutes = PORTAL_ROUTES.filter((portal: any) => 
    userRole && portal.allowedRoles?.includes(userRole)
  );

  return (
    <div style={{ background: '#F8F9FF', minHeight: '100vh', padding: '40px 20px' }}>
      
      {/* Topbar Logout Button */}
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
        <Button 
          type="text" 
          danger 
          icon={<LogoutOutlined />} 
          onClick={handleLogout} 
          style={{ fontWeight: 'bold', borderRadius: '12px' }}
        >
          Sign Out
        </Button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <Title level={1} style={{ fontWeight: 800, marginBottom: 8 }}>
          SALON<span style={{ color: '#7C4DFF' }}>PRO</span>
        </Title>
        <Text type="secondary">
          Welcome back. Select a portal below to continue.
        </Text>
        
        {/* Shows you who you are currently logged in as */}
        {userRole && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' }}>
              Logged in as: <span style={{ color: '#7C4DFF' }}>{userRole}</span>
            </Text>
          </div>
        )}
        
        {/* Dynamic Portal Grid */}
        <Row gutter={[24, 24]} style={{ marginTop: 60, justifyContent: 'center' }}>
          {visibleRoutes.map((portal: any) => (
            <Col xs={24} sm={12} key={portal.id}>
              <Link href={portal.href} style={{ textDecoration: 'none' }}>
                <Card 
                  hoverable 
                  style={{ borderRadius: 24, textAlign: 'left', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <Avatar size={54} icon={portal.icon} style={{ backgroundColor: '#F0EBFF', color: portal.color }} />
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{portal.title}</Title>
                      <Text type="secondary">{portal.desc}</Text>
                    </div>
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}