"use client";

import React, { useState, useEffect } from 'react';
import { Card, Switch, Button, Typography, Space, message, Spin } from 'antd';
import { 
  SaveOutlined, 
  SafetyCertificateOutlined,
  CalendarOutlined,
  CarryOutOutlined,
  ScissorOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  BarChartOutlined,
  SolutionOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

const AVAILABLE_PERMISSIONS = [
  { key: '/owner/calendar', label: 'Calendar', icon: <CalendarOutlined /> },
  { key: '/owner/bookings/manage', label: 'Bookings', icon: <CarryOutOutlined /> },
  { key: '/owner/services', label: 'Services', icon: <ScissorOutlined /> },
  { key: '/owner/products', label: 'Products', icon: <TeamOutlined /> },
  { key: '/owner/payments', label: 'Payments', icon: <DollarCircleOutlined /> },
  { key: '/owner/reports', label: 'Reports', icon: <BarChartOutlined /> },
  { key: '/owner/hr/attendance', label: 'HR & Attendance', icon: <SolutionOutlined /> },
];

export default function PermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const userId = unwrappedParams.id;
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetch(`/api/v1/permissions?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.permissions) {
          setPermissions(data.permissions.map((p: any) => p.pageKey));
        }
        setLoading(false);
      })
      .catch(() => {
        messageApi.error("Failed to load permissions");
        setLoading(false);
      });
  }, [userId, messageApi]);

  const handleToggle = (key: string, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, key]);
    } else {
      setPermissions(prev => prev.filter(p => p !== key));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          permissions: permissions
        })
      });

      if (res.ok) {
        messageApi.success('Permissions saved successfully!');
        router.push('/owner/staff');
      } else {
        messageApi.error('Failed to save permissions');
      }
    } catch (error) {
      messageApi.error('An error occurred');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="max-w-[800px] mx-auto pb-10 px-4 mt-8">
      {contextHolder}
      <div className="flex items-center gap-4 mb-8 border-b pb-4 border-slate-200">
        <SafetyCertificateOutlined className="text-3xl text-purple-600" />
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Manage Staff Permissions</Title>
          <Text type="secondary">Control exactly which modules this staff member can access.</Text>
        </div>
      </div>

      <Card className="shadow-sm rounded-2xl border-slate-200">
        <div className="flex flex-col gap-6">
          {AVAILABLE_PERMISSIONS.map(perm => (
            <div key={perm.key} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
              <Space size="middle">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-purple-600">
                  {perm.icon}
                </div>
                <div>
                  <Text strong className="text-slate-800 block text-base">{perm.label}</Text>
                  <Text type="secondary" className="text-xs">Grant access to the {perm.label} module</Text>
                </div>
              </Space>
              <Switch 
                checked={permissions.includes(perm.key)} 
                onChange={(checked) => handleToggle(perm.key, checked)}
                className={permissions.includes(perm.key) ? 'bg-purple-600' : 'bg-slate-300'}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-4">
          <Button size="large" onClick={() => router.push('/owner/staff')}>Cancel</Button>
          <Button 
            type="primary" 
            size="large" 
            icon={<SaveOutlined />} 
            onClick={handleSave} 
            loading={saving}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] border-none font-bold shadow-md shadow-purple-100"
          >
            Save Permissions
          </Button>
        </div>
      </Card>
    </div>
  );
}
