"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, theme } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { useToken } = theme;

export const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Automatically grabs the #7C4DFF color from the ConfigProvider
  const { token } = useToken();

  const onFinish = async (values: any) => {
    setLoading(true);
    
    console.log('Login attempt:', values);

    // Simulating an API login call
    setTimeout(() => {
      setLoading(false);
      message.success('Welcome back!');
      
      // Redirecting to the dashboard
      router.push('/owner'); // Update this path based on where they should go
    }, 1200);
  };

  return (
    <Card 
      style={{ 
        width: '100%', 
        maxWidth: 400, 
        // Generates a soft shadow matching your exact purple color
        boxShadow: `0 20px 40px ${token.colorPrimary}15`, 
        borderRadius: 16,
        padding: '12px 8px'
      }}
      variant="borderless" // <-- FIX: Changed from bordered={false} to variant="borderless"
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {/* Friendly Icon Box using the #7C4DFF theme color */}
        <div style={{ 
          width: 64, 
          height: 64, 
          backgroundColor: `${token.colorPrimary}15`, // Purple with 15% opacity
          borderRadius: '50%', // Circle shape
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <TeamOutlined style={{ color: token.colorPrimary, fontSize: '32px' }} />
        </div>
        
        <Title level={3} style={{ marginBottom: 4, fontWeight: 600, color: token.colorTextHeading }}>
          Welcome Back
        </Title>
        <Text type="secondary" style={{ fontSize: '15px' }}>
          Please enter your credentials to login
        </Text>
      </div>

      <Form
        name="system_login"
        layout="vertical"
        onFinish={onFinish}
        size="large"
        requiredMark={false}
      >
        <Form.Item
          label={<span style={{ fontWeight: 500 }}>Email Address</span>}
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />} 
            placeholder="user@salon.com" 
            style={{ padding: '10px 14px' }}
          />
        </Form.Item>

        <Form.Item
          label={<span style={{ fontWeight: 500 }}>Password</span>}
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password 
            prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />} 
            placeholder="••••••••" 
            style={{ padding: '10px 14px' }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading}
            style={{ height: 48, fontSize: '16px', fontWeight: 500, borderRadius: '8px' }}
          >
            Log In
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};