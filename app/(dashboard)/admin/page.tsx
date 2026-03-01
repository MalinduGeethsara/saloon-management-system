"use client";
import React from 'react';
import { Card, Row, Col, Typography, Avatar, Space, Divider } from 'antd';
import { 
  RocketOutlined, 
  ShopOutlined, 
  TeamOutlined, 
  BellOutlined,
  CheckCircleFilled 
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const activities = [
    { id: 1, title: 'Database Backup BK-001', time: 'Feb 01, 2026' },
    { id: 2, title: 'Database Backup BK-002', time: 'Feb 02, 2026' },
    { id: 3, title: 'Database Backup BK-003', time: 'Feb 03, 2026' },
  ];

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <Title level={1} style={{ fontWeight: 800, margin: 0 }}>System Overview</Title>
        <Text type="secondary">Real-time status of your Salon network.</Text>
      </header>

      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Active Connections" value="124" icon={<RocketOutlined />} color="#3182CE" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Global Shops" value="12" icon={<ShopOutlined />} color="#7C4DFF" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Active Barbers" value="48" icon={<TeamOutlined />} color="#E53E3E" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="System Alerts" value="0" icon={<BellOutlined />} color="#48BB78" />
        </Col>
      </Row>

      {/* FIX: Replaced List component with a manual map inside a Card */}
      <Card 
        variant="borderless" 
        title={<span style={{ fontWeight: 800 }}>Recent Activity</span>} 
        style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {activities.map((item, index) => (
            <React.Fragment key={item.id}>
              <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size="middle">
                  <CheckCircleFilled style={{ color: '#48BB78', fontSize: '20px' }} />
                  <div>
                    <Text strong style={{ display: 'block' }}>{item.title}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Snapshot completed successfully.</Text>
                  </div>
                </Space>
                <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                  {item.time}
                </Text>
              </div>
              {index !== activities.length - 1 && <Divider style={{ margin: 0 }} />}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card variant="borderless" style={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <Text type="secondary" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{title}</Text>
          <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{value}</Title>
        </div>
        <Avatar size={40} icon={icon} style={{ backgroundColor: `${color}15`, color: color, borderRadius: '12px' }} />
      </div>
    </Card>
  );
}