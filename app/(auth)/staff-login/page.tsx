"use client";

import React, { Suspense } from 'react';
import { ConfigProvider, Spin } from 'antd';
import { LoginForm } from '@/components/auth/LoginForm';

export default function StaffLoginPage() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7C4DFF',
          borderRadius: 8,
        },
      }}
    >
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F4F0FF] py-10 px-4 sm:px-6 md:px-8 overflow-y-auto">
        <Suspense fallback={<Spin size="large" />}>
          <LoginForm />
        </Suspense>
      </div>
    </ConfigProvider>
  );
}