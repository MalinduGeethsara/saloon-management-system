"use client";

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons'; 
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

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
        
        let destination = callbackUrl;
        
        // If they just logged in normally, figure out exactly where to send them based on their role
        if (destination === '/' || destination === '/login') {
          if (data.role === 'admin') destination = '/admin';
          else if (data.role === 'manager') destination = '/owner/bookings/manage';
          else if (data.role === 'barber') destination = '/owner/calendar';
          else destination = '/owner'; // Owner
        }

        router.push(destination); 
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
        
        {/* ✅ Image Container */}
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
            src="/images/dashboard/logo.png"  
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

        {/* ✅ Updated Demo Credentials Box */}
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
          <span style={{ display: 'inline-block', width: '65px', fontWeight: 600 }}>Admin:</span> admin@salon.com<br />
          <span style={{ display: 'inline-block', width: '65px', fontWeight: 600 }}>Owner:</span> owner@salon.com<br />
          <span style={{ display: 'inline-block', width: '65px', fontWeight: 600 }}>Manager:</span> manager@salon.com<br />
          <span style={{ display: 'inline-block', width: '65px', fontWeight: 600 }}>Barber:</span> barber@salon.com
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