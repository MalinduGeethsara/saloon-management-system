"use client";
import React from 'react';
import { Table, Button, Card, Typography, Space, Avatar } from 'antd';
import { PlusOutlined, ShopOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ShopDataPage() {
  const columns = [
    {
      title: 'Shop Name',
      dataIndex: 'name',
      render: (text: string) => (
        <Space>
          <Avatar shape="square" icon={<ShopOutlined />} style={{ background: '#F0EBFF', color: '#7C4DFF' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    { title: 'Owner', dataIndex: 'owner' },
    { title: 'BR Number', dataIndex: 'br' },
    {
      title: 'Action',
      align: 'right' as const,
      render: () => <Button type="text" icon={<EditOutlined />} style={{ color: '#7C4DFF', fontWeight: 'bold' }}>Edit</Button>,
    },
  ];

  const data = [
    { key: '1', name: 'LuxeBarber Downtown', owner: 'Karenath Smith', br: 'BR-2026-001' },
    { key: '2', name: 'LuxeBarber Kandy', owner: 'Kamal Perera', br: 'BR-2026-005' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Registered Shops</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} style={{ borderRadius: '14px', height: '48px' }}>Add New Shop</Button>
      </div>
      
      {/* FIX: Replaced 'bordered={false}' with 'variant="borderless"' */}
      <Card variant="borderless" style={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Table columns={columns} dataSource={data} pagination={false} />
      </Card>
    </div>
  );
}