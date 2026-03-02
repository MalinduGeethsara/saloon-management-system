"use client";

import React from 'react';
import { ConfigProvider } from 'antd';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    // ConfigProvider forces your custom purple theme for this specific page
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7C4DFF', // Your requested custom purple
          colorInfo: '#7C4DFF',
          borderRadius: 8, // Smooth rounded corners
          colorBgContainer: '#ffffff', // White card background
        },
        components: {
          Button: {
            controlHeight: 48, // Taller buttons for a modern feel
            fontSize: 16,
            fontWeight: 500,
          },
          Input: {
            controlHeight: 48,
          }
        }
      }}
    >
      <div 
        style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#F4F0FF', // A very soft matching purple background
          padding: '20px'
        }}
      >
        <LoginForm />
      </div>
    </ConfigProvider>
  );
}