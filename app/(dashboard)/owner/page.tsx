"use client";
import React from 'react';
import { Row, Col, Card, Typography, Statistic, Progress, Avatar, Tag, Space, Divider } from 'antd';
import { ArrowUpOutlined, DollarOutlined, UserOutlined, ShoppingCartOutlined, RiseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function OwnerFinancials() {
  const topBarbers = [
    { name: "Alex Rivers", shop: "Downtown", revenue: "$5,240" },
    { name: "Jordan Smith", shop: "Westside", revenue: "$4,890" },
    { name: "Sam Wilson", shop: "Downtown", revenue: "$4,100" },
  ];

  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <Title level={1} style={{ fontWeight: 800, margin: 0 }}>Business Intelligence</Title>
        <Text type="secondary">Revenue analytics across all active branches.</Text>
      </header>

      {/* KPI Stats Row */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Monthly Revenue" value={42580} prefix="$" trend="12.5%" icon={<DollarOutlined />} color="#48BB78" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Total Appointments" value={1842} trend="3.2%" icon={<UserOutlined />} color="#3182CE" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Product Sales" value={6120} prefix="$" trend="18.7%" icon={<ShoppingCartOutlined />} color="#7C4DFF" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="Growth Rate" value={24} suffix="%" trend="2.1%" icon={<RiseOutlined />} color="#7C4DFF" />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Branch Performance - Progress Bars */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Text strong style={{ fontSize: 18 }}>Revenue by Branch</Text>} 
            variant="borderless" 
            style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <BranchProgress name="Downtown Studio" value={85} total="$18,400" />
              <BranchProgress name="Westside Barbering" value={65} total="$12,180" />
              <BranchProgress name="East Gate Saloon" value={45} total="$8,200" />
              <BranchProgress name="North Point" value={25} total="$3,800" />
            </div>
          </Card>
        </Col>

        {/* Top Performers - Manual List (Fixes List deprecation) */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Text strong style={{ fontSize: 18 }}>Top Earning Barbers</Text>} 
            variant="borderless" 
            style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {topBarbers.map((item, index) => (
                <React.Fragment key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                    <Space>
                      <Avatar style={{ backgroundColor: '#F0EBFF', color: '#7C4DFF' }}>{item.name[0]}</Avatar>
                      <div>
                        <Text strong style={{ display: 'block' }}>{item.name}</Text>
                        <Tag color="blue" style={{ border: 'none', fontSize: '10px' }}>{item.shop}</Tag>
                      </div>
                    </Space>
                    <Text strong style={{ color: '#7C4DFF', fontSize: '16px' }}>{item.revenue}</Text>
                  </div>
                  {index !== topBarbers.length - 1 && <Divider style={{ margin: 0 }} />}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// FIX: Updated Statistic Component Props
function StatCard({ title, value, prefix, suffix, trend, icon, color }: any) {
  return (
    <Card variant="borderless" style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <Statistic
        title={<Text type="secondary" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>}
        value={value}
        prefix={prefix}
        suffix={suffix}
        // FIX: Replaced valueStyle with styles.content
        styles={{ content: { fontWeight: 900, color: '#2D3748', fontSize: '28px' } }}
      />
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag color="success" icon={<ArrowUpOutlined />} style={{ borderRadius: 6, border: 'none', padding: '2px 8px' }}>{trend}</Tag>
        <Avatar size="small" icon={icon} style={{ backgroundColor: `${color}15`, color: color }} />
      </div>
    </Card>
  );
}

// FIX: Updated Progress Component Props
function BranchProgress({ name, value, total }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>{name}</Text>
        <Text strong style={{ color: '#7C4DFF' }}>{total}</Text>
      </div>
      {/* FIX: trailColor -> railColor, strokeWidth -> size */}
      <Progress 
        percent={value} 
        showInfo={false} 
        strokeColor="#7C4DFF" 
        size={[undefined, 8]} 
        railColor="#F0F2F5" 
      />
    </div>
  );
}