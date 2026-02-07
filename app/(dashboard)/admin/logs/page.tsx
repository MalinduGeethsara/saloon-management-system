"use client";

import React from 'react';
import { Card, Timeline, Typography, Tag, Avatar } from 'antd';
import { 
  SafetyCertificateOutlined, 
  WarningOutlined, 
  LoginOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SecurityLogs() {
  const logs = [
    { 
      time: '10:45 AM', 
      action: 'Admin Login', 
      user: 'system_admin', 
      status: 'success', 
      icon: <LoginOutlined /> 
    },
    { 
      time: '09:30 AM', 
      action: 'Failed Login Attempt', 
      user: 'unknown_ip (192.168.1.1)', 
      status: 'error', 
      icon: <WarningOutlined /> 
    },
    { 
      time: 'Yesterday', 
      action: 'Shop Data Modified', 
      user: 'owner_john_luxe', 
      status: 'processing', 
      icon: <SafetyCertificateOutlined /> 
    }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <Title level={2} style={{ fontWeight: 800, margin: 0, color: '#2D3748' }}>
          Security Logs
        </Title>
        <Text type="secondary">Audit trail of system access and administrative actions.</Text>
      </header>
      
      {/* FIX 1: Replaced 'bordered={false}' with 'variant="borderless"' */}
      <Card 
        variant="borderless" 
        style={{ 
          borderRadius: '24px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          padding: '20px'
        }}
      >
        <Timeline
          mode="start" // FIX 2: Replaced 'left' with 'start'
          items={logs.map(log => ({
            // FIX 3: Replaced 'label' with 'title'
            title: <Text type="secondary" style={{ fontSize: '12px' }}>{log.time}</Text>,
            
            // FIX 4: Replaced 'children' with 'content'
            content: (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text strong style={{ fontSize: '15px' }}>{log.action}</Text>
                  <Tag 
                    color={
                      log.status === 'success' ? 'purple' : 
                      log.status === 'error' ? 'red' : 
                      'blue'
                    } 
                    style={{ borderRadius: '6px', border: 'none', fontSize: '10px' }}
                  >
                     {log.status.toUpperCase()}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginTop: '4px' }}>
                  Performed by: <span style={{ color: '#7C4DFF', fontWeight: 600 }}>{log.user}</span>
                </Text>
              </div>
            ),
            
            // FIX 5: Replaced 'dot' with 'icon'
            icon: (
              <Avatar 
                size="small" 
                icon={log.icon} 
                style={{ 
                  backgroundColor: log.status === 'error' ? '#FFF1F0' : '#F0EBFF', 
                  color: log.status === 'error' ? '#F5222D' : '#7C4DFF' 
                }} 
              />
            )
          }))}
        />
      </Card>
    </div>
  );
}