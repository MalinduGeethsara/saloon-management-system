"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { Button, Result } from 'antd';
import Link from 'next/link';

export default function ShopDashboardPage() {
  // This grabs the "S-01", "S-02" ID from the URL
  const params = useParams(); 
  const shopId = params.id; 

  return (
    <div className="p-10 flex justify-center items-center h-screen bg-gray-50">
      <Result
        status="success"
        title={`Welcome to Shop Dashboard: ${shopId}`}
        subTitle="This page is now working! You can start building your shop analytics here."
        extra={[
          <Link href="/owner/shops" key="back">
            <Button type="primary">Back to All Shops</Button>
          </Link>,
        ]}
      />
    </div>
  );
}