"use client";

import React, { useState } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Avatar, message } from 'antd';
import { 
  DownloadOutlined, 
  DeleteOutlined, 
  RollbackOutlined, 
  CloudUploadOutlined,
  DatabaseOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

// Using Typography.Title directly in the JSX is safer for Turbopack hydration
const { Title, Text } = Typography;

// Initial mock data
const INITIAL_BACKUPS = [
  { key: '1', name: 'backup_2026_02_01.sql', size: '156MB', status: 'completed', date: '2026-02-01' },
  { key: '2', name: 'backup_2026_02_07.sql', size: '158MB', status: 'completed', date: '2026-02-07' },
];

export default function BackupsPage() {

  const [messageApi, contextHolder] = message.useMessage();
  // 1. Convert static data to state so we can add new items to it
  const [backups, setBackups] = useState(INITIAL_BACKUPS);
  
  // 2. Add a loading state for the button
  const [isCreating, setIsCreating] = useState(false);

  // 3. Function to handle creating a new backup
  const handleCreateBackup = () => {
    setIsCreating(true); // Start the loading spinner

    // Simulate a network request / backup process taking 2 seconds
    setTimeout(() => {
      const now = dayjs();
      
      // Generate a realistic looking new backup record
      const newBackup = {
        key: String(Date.now()), // Unique ID
        name: `backup_${now.format('YYYY_MM_DD_HHmmss')}.sql`,
        size: `${Math.floor(Math.random() * 50) + 130}MB`, // Random size between 130-180MB
        status: 'completed',
        date: now.format('YYYY-MM-DD'),
      };

      // Add the new backup to the top of the list
      setBackups(prev => [newBackup, ...prev]);
      
      setIsCreating(false); // Stop the loading spinner
      message.success('New system backup created successfully!');
    }, 2000);
  };

  // 4. Function to handle deleting a backup
  const handleDelete = (keyToDelete: string) => {
    setBackups(prev => prev.filter(backup => backup.key !== keyToDelete));
    message.success('Backup deleted successfully.');
  };

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
      render: ( record: any) => (
        <Space size="middle">
          <Button icon={<DownloadOutlined />} type="text" style={{ color: '#7C4DFF' }}>Download</Button>
          <Button icon={<RollbackOutlined />} type="text" style={{ color: '#7C4DFF' }}>Restore</Button>
          {/* Attached the delete handler here */}
          <Button 
            icon={<DeleteOutlined />} 
            type="text" 
            danger 
            onClick={() => handleDelete(record.key)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap', 
        gap: '16px'       
      }}>
        <div>
          <Title level={2} style={{ fontWeight: 800, margin: 0, color: '#2D3748' }}>
            System Backups
          </Title>
          <Text type="secondary">Manage and download your database snapshots.</Text>
        </div>
        
        {/* Added onClick and loading state to the button */}
        <Button 
          type="primary" 
          icon={<CloudUploadOutlined />} 
          size="large"
          onClick={handleCreateBackup}
          loading={isCreating}
          style={{ 
            height: '48px', 
            borderRadius: '14px', 
            background: '#7C4DFF',
            boxShadow: '0 4px 14px rgba(124, 77, 255, 0.3)' 
          }}
        >
          {isCreating ? 'Creating...' : 'Create New Backup'}
        </Button>
      </div>

      <Card 
        variant="borderless"
        style={{ 
          borderRadius: '24px', 
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden' 
        }}
        styles={{ body: { padding: 0 } }} 
      >
        <Table 
          dataSource={backups} // Now using the state instead of static data
          columns={columns} 
          pagination={false}
          scroll={{ x: 'max-content' }} 
        />
      </Card>
    </div>
  );
}