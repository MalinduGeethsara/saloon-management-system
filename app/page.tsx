"use client";
import { Card, Row, Col, Typography, Avatar } from 'antd';
import { SettingOutlined, ShopOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function PortalSelection() {
  const portals = [
    { title: 'Administration', desc: 'System health and root settings', icon: <SettingOutlined />, href: '/admin', color: '#7C4DFF' },
    { title: 'Owner Portal', desc: 'Shop reports and staff performance', icon: <ShopOutlined />, href: '/owner', color: '#48BB78' },
    { title: 'Public Site', desc: 'Client-facing booking and portfolio', icon: <GlobalOutlined />, href: '/public', color: '#3182CE' },
    { title: 'Staff Login', desc: 'Manager and Barber access', icon: <UserOutlined />, href: '/login', color: '#ED8936' },
  ];

  return (
    <div style={{ background: '#F8F9FF', minHeight: '100vh', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <Title level={1} style={{ fontWeight: 800, marginBottom: 8 }}>SALON<span style={{ color: '#7C4DFF' }}>PRO</span></Title>
        <Text type="secondary">Advanced management portal for bookings, staff, and financial reporting.</Text>
        
        <Row gutter={[24, 24]} style={{ marginTop: 60 }}>
          {portals.map((p) => (
            <Col xs={24} sm={12} key={p.href}>
              <Link href={p.href} style={{ textDecoration: 'none' }}>
                <Card hoverable style={{ borderRadius: 24, textAlign: 'left', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <Avatar size={54} icon={p.icon} style={{ backgroundColor: '#F0EBFF', color: p.color }} />
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{p.title}</Title>
                      <Text type="secondary">{p.desc}</Text>
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