"use client";
import React from 'react';
import { ConfigProvider, Layout } from 'antd';

const { Content } = Layout;

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7C4DFF', // Cascal Purple
          colorBgLayout: '#F8F9FF', // Lavender Background
          borderRadius: 14,
          colorTextBase: '#2D3748',
        },
        components: {
          Layout: { siderBg: '#FFFFFF', headerBg: '#F8F9FF' },
          Menu: { itemSelectedBg: '#F0EBFF', itemSelectedColor: '#7C4DFF' }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#F8F9FF' }}>
        <Content style={{ padding: '40px 24px' }}>
          {children}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}