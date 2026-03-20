"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, theme } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';

const { Title, Text } = Typography;
const { useToken } = theme;

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  const { token } = useToken();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const onFinish = async (values: any) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(`Welcome back, ${data.name}!`);
        // If they just logged in normally, send them to the main portal selection page
        router.push(callbackUrl === '/login' ? '/' : callbackUrl); 
        router.refresh(); 
      } else {
        message.error(data.message || 'Invalid email or password');
      }
    } catch (error) {
      message.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      style={{ 
        width: '100%', 
        maxWidth: 400, 
        boxShadow: `0 20px 40px ${token.colorPrimary}15`, 
        borderRadius: 16,
        padding: '12px 8px'
      }}
      variant="borderless" 
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          backgroundColor: `${token.colorPrimary}15`, 
          borderRadius: '50%', 
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
            placeholder="owner@salon.com" 
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

        {/* --- Added Demo Credentials Box matching your theme --- */}
        <div style={{ 
          backgroundColor: '#F8F9FF', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '24px', 
          fontSize: '12px', 
          color: '#64748B', 
          border: '1px solid #E2E8F0',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: token.colorPrimary }}>Demo Logins (Pass: password123)</strong><br />
          <span style={{ display: 'inline-block', width: '50px', fontWeight: 600 }}>Owner:</span> owner@salon.com<br />
          <span style={{ display: 'inline-block', width: '50px', fontWeight: 600 }}>Admin:</span> admin@salon.com<br />
          <span style={{ display: 'inline-block', width: '50px', fontWeight: 600 }}>Barber:</span> barber@salon.com
        </div>

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