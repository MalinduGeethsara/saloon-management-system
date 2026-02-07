"use client";

import React from 'react';
import { Card, Table, Button, Space, Typography, Tag, Avatar } from 'antd';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  RollbackOutlined, 
  CloudUploadOutlined,
  DatabaseOutlined 
} from '@ant-design/icons';

// Using Typography.Title directly in the JSX is safer for Turbopack hydration
const { Title, Text } = Typography;

export default function BackupsPage() {
  const dataSource = [
    { key: '1', name: 'backup_2026_02_01.sql', size: '156MB', status: 'completed', date: '2026-02-01' },
    { key: '2', name: 'backup_2026_02_07.sql', size: '158MB', status: 'completed', date: '2026-02-07' },
  ];

  const columns = [
    { 
      title: 'File Name', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string) => (
        <Space>
          <Avatar 
            shape="square" 
            size="small" 
            icon={<DatabaseOutlined />} 
            style={{ backgroundColor: '#F0EBFF', color: '#7C4DFF' }} 
          />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => (
        <Tag color="purple" style={{ borderRadius: '6px', border: 'none', fontWeight: 'bold' }}>
          {status.toUpperCase()}
        </Tag>
      ) 
    },
    { title: 'Created At', dataIndex: 'date', key: 'date' },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: () => (
        <Space size="middle">
          <Button icon={<DownloadOutlined />} type="text" style={{ color: '#7C4DFF' }}>Download</Button>
          <Button icon={<RollbackOutlined />} type="text" style={{ color: '#7C4DFF' }}>Restore</Button>
          <Button icon={<DeleteOutlined />} type="text" danger>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={2} style={{ fontWeight: 800, margin: 0, color: '#2D3748' }}>
            System Backups
          </Typography.Title>
          <Typography.Text type="secondary">Manage and download your database snapshots.</Typography.Text>
        </div>
        <Button 
          type="primary" 
          icon={<CloudUploadOutlined />} 
          size="large"
          style={{ 
            height: '48px', 
            borderRadius: '14px', 
            background: '#7C4DFF',
            boxShadow: '0 4px 14px rgba(124, 77, 255, 0.3)' 
          }}
        >
          Create New Backup
        </Button>
      </div>

      <Card 
        variant="borderless"
        style={{ 
          borderRadius: '24px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}
      >
        <Table 
          dataSource={dataSource} 
          columns={columns} 
          pagination={false} 
        />
      </Card>
    </div>
  );
}