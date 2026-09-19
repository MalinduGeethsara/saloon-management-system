"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { safeCallbackPath } from '@/lib/utils/safe-redirect';

const { Title, Text } = Typography;
const { useToken } = theme;

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  const [messageApi, contextHolder] = message.useMessage();
  
  const { token } = useToken();
  // ✅ Defaults back to staff-login if no callback URL is provided
  const callbackUrl = safeCallbackPath(searchParams.get('callbackUrl'), '/staff-login');

  const onFinish = async (values: any) => {
    setLoading(true);
    
    try {
      // ✅ Point this to your newly renamed staff API route
      const response = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        messageApi.success(`Welcome back, ${data.name}!`);
        
        let destination = callbackUrl;
        // A first-run / handed-over password must be replaced before anything else opens
        if (data.mustChangePassword) {
          router.push('/change-password');
          router.refresh();
          return;
        }
        
        if (destination === '/staff-login' || destination === '/' || destination === '/login') {
          const userRole = (data.role || '').toLowerCase();
          if (userRole === 'admin') destination = '/admin';
          else if (userRole === 'manager') destination = '/owner/bookings/manage';
          else if (userRole === 'barber') destination = '/barber';
          else destination = '/owner'; 
        }

        router.push(destination); 
        router.refresh(); 
      } else {
        messageApi.error(data.message || 'Invalid email or password');
      }
    } catch (error) {
      messageApi.error('Something went wrong. Please try again.');
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

      {contextHolder}

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          backgroundColor: `${token.colorPrimary}15`, 
          borderRadius: '50%', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          overflow: 'hidden', 
          position: 'relative' 
        }}>
          <Image 
            src="/images/dashboard/logo_black.png"  
            alt="Salon Logo" 
            fill 
            style={{ objectFit: 'contain' }} 
          />
        </div>
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
            placeholder="name@example.com" 
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