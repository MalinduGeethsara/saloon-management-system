"use client";

import React, { Suspense } from 'react'; // Added Suspense
import { ConfigProvider, Spin } from 'antd';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7C4DFF',
          borderRadius: 8,
        },
      }}
    >
      <div 
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#F4F0FF',
          padding: '20px'
        }}
      >
        {/* FIX: Wrap the form in Suspense to prevent the Prerender Error */}
        <Suspense fallback={<Spin size="large" />}>
          <LoginForm />
        </Suspense>
      </div>
    </ConfigProvider>
  );
}