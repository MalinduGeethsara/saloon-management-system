"use client";

import React, { useState, useEffect } from 'react';
import { Card, Checkbox, Button, Typography, Space, message, Spin, Table } from 'antd';
import { 
  SaveOutlined, 
  SafetyCertificateOutlined,
  CalendarOutlined,
  CarryOutOutlined,
  ScissorOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  BarChartOutlined,
  SolutionOutlined,
  DashboardOutlined,
  ShopOutlined,
  UsergroupAddOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { GRANTABLE_PAGES } from '@/lib/access';

const { Title, Text } = Typography;

// Icons for the pages the owner can hand out (the list itself lives in lib/access.ts, shared with the server)
const PAGE_ICONS: Record<string, React.ReactNode> = {
  '/owner': <DashboardOutlined />,
  '/owner/calendar': <CalendarOutlined />,
  '/owner/bookings/manage': <CarryOutOutlined />,
  '/owner/staff': <UsergroupAddOutlined />,
  '/owner/shops': <ShopOutlined />,
  '/owner/services': <ScissorOutlined />,
  '/owner/products': <TeamOutlined />,
  '/owner/payments': <DollarCircleOutlined />,
  '/owner/orders': <ShoppingCartOutlined />,
  '/owner/reports': <BarChartOutlined />,
  '/owner/hr/attendance': <SolutionOutlined />,
  '/owner/hr/payroll': <DollarCircleOutlined />,
};

const AVAILABLE_PERMISSIONS = GRANTABLE_PAGES.map((p) => ({ key: p.key, label: p.label, covers: p.covers, icon: PAGE_ICONS[p.key] }));

interface PermissionState {
  pageKey: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function PermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const userId = unwrappedParams.id;
  const [permissions, setPermissions] = useState<PermissionState[]>(
    AVAILABLE_PERMISSIONS.map(p => ({
      pageKey: p.key,
      canView: false,
      canAdd: false,
      canEdit: false,
      canDelete: false
    }))
  );
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [person, setPerson] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetch(`/api/v1/permissions?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.name) setPerson({ name: data.name, role: data.role });
        if (data.permissions) {
          // Merge fetched permissions with available schema
          setPermissions(prev => prev.map(p => {
            const fetched = data.permissions.find((fp: any) => fp.pageKey === p.pageKey);
            return fetched ? { ...p, ...fetched } : p;
          }));
        }
        setLoading(false);
      })
      .catch(() => {
        messageApi.error("Failed to load permissions");
        setLoading(false);
      });
  }, [userId, messageApi]);

  const handleToggle = (pageKey: string, field: keyof PermissionState, checked: boolean) => {
    setPermissions(prev => prev.map(p => {
      if (p.pageKey === pageKey) {
        const newPerm = { ...p, [field]: checked };
        // If they can add/edit/delete, they MUST be able to view
        if (field !== 'canView' && checked) {
          newPerm.canView = true;
        }
        // If they can't view, they can't do anything else
        if (field === 'canView' && !checked) {
          newPerm.canAdd = false;
          newPerm.canEdit = false;
          newPerm.canDelete = false;
        }
        return newPerm;
      }
      return p;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Every page is sent, ticked or not: an explicit "no" also switches off a page their role would get by default
      const res = await fetch('/api/v1/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permissions })
      });

      if (res.ok) {
        messageApi.success('Saved. It takes effect within a few seconds, no need for them to sign in again.');
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

  const columns = [
    {
      title: 'Module',
      dataIndex: 'pageKey',
      key: 'module',
      render: (key: string) => {
        const moduleDef = AVAILABLE_PERMISSIONS.find(m => m.key === key);
        return (
          <Space size="middle">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-purple-600">
              {moduleDef?.icon}
            </div>
            <div className="flex flex-col">
              <Text strong className="text-slate-800 text-base">{moduleDef?.label}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{moduleDef?.covers}</Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'View',
      key: 'canView',
      align: 'center' as const,
      render: (_: any, record: PermissionState) => (
        <Checkbox 
          checked={record.canView} 
          onChange={(e) => handleToggle(record.pageKey, 'canView', e.target.checked)} 
        />
      )
    },
    {
      title: 'Add / Create',
      key: 'canAdd',
      align: 'center' as const,
      render: (_: any, record: PermissionState) => (
        <Checkbox 
          checked={record.canAdd} 
          onChange={(e) => handleToggle(record.pageKey, 'canAdd', e.target.checked)}
          disabled={!record.canView}
        />
      )
    },
    {
      title: 'Edit / Update',
      key: 'canEdit',
      align: 'center' as const,
      render: (_: any, record: PermissionState) => (
        <Checkbox 
          checked={record.canEdit} 
          onChange={(e) => handleToggle(record.pageKey, 'canEdit', e.target.checked)}
          disabled={!record.canView}
        />
      )
    },
    {
      title: 'Delete / Cancel',
      key: 'canDelete',
      align: 'center' as const,
      render: (_: any, record: PermissionState) => (
        <Checkbox 
          checked={record.canDelete} 
          onChange={(e) => handleToggle(record.pageKey, 'canDelete', e.target.checked)}
          disabled={!record.canView}
        />
      )
    }
  ];

  return (
    <div className="max-w-[1000px] mx-auto pb-10 px-4 mt-8">
      {contextHolder}
      <div className="flex items-center gap-4 mb-8 border-b pb-4 border-slate-200">
        <SafetyCertificateOutlined className="text-3xl text-purple-600" />
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Manage Staff Permissions</Title>
          <Text type="secondary">
            {person ? <><b>{person.name}</b> ({person.role.toLowerCase()}). </> : null}
            Tick what they can do on each page. Anything left unticked stays hidden from them. Changes apply within a few seconds.
          </Text>
        </div>
      </div>

      <Card className="shadow-sm rounded-2xl border-slate-200" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={permissions} 
          rowKey="pageKey"
          pagination={false}
          scroll={{ x: 'max-content' }}
          className="permissions-table"
        />

        <div className="p-6 border-t border-slate-200 flex justify-end gap-4 bg-slate-50 rounded-b-2xl">
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
      
      <style jsx global>{`
        .permissions-table .ant-table-thead > tr > th {
          background-color: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
