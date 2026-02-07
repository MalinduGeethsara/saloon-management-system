"use client";

import React, { useState } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Avatar, 
  Space, 
  Dropdown, 
  MenuProps,
  Statistic,
  Row,
  Col 
} from 'antd';
import { 
  UserOutlined, 
  MoreOutlined, 
  PlusOutlined, 
  TeamOutlined, 
  DollarOutlined, 
  ScissorOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { StaffModal } from "@/components/modals/StaffModal";

const { Title, Text } = Typography;

// --- Mock Data ---
const STAFF_DATA = [
  { 
    key: '1', 
    name: "Nuwan Pradeep", 
    role: "Senior Barber", 
    branch: "Downtown", 
    comm: "40%", 
    earnings: "Rs. 185,000", 
    status: "Active",
    email: "nuwan@salon.com",
    phone: "0771234567"
  },
  { 
    key: '2', 
    name: "Kasun Perera", 
    role: "Barber", 
    branch: "Downtown", 
    comm: "35%", 
    earnings: "Rs. 120,000", 
    status: "Active",
    email: "kasun@salon.com",
    phone: "0719876543"
  },
  { 
    key: '3', 
    name: "Lahiru Thirimanne", 
    role: "Manager", 
    branch: "Westside", 
    comm: "N/A", 
    earnings: "Rs. 250,000", 
    status: "On Leave",
    email: "lahiru@salon.com",
    phone: "0765551234"
  },
  { 
    key: '4', 
    name: "Chamara Silva", 
    role: "Barber", 
    branch: "Westside", 
    comm: "35%", 
    earnings: "Rs. 98,500", 
    status: "Active",
    email: "chamara@salon.com",
    phone: "0702223333"
  },
];

export default function OwnerStaff() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // --- Handlers ---
  const handleAdd = () => {
    setModalMode('add');
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setModalMode('edit');
    setSelectedStaff(record);
    setIsModalOpen(true);
  };

  // --- Table Configuration ---
  const columns = [
    {
      title: 'Staff Member',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#F0EBFF', color: '#7C4DFF' }} icon={<UserOutlined />} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>{text}</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{record.email}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => (
        <Space>
          {text === 'Manager' ? <DollarOutlined className="text-gray-400" /> : <ScissorOutlined className="text-gray-400" />}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
    },
    {
      title: 'Commission',
      dataIndex: 'comm',
      key: 'comm',
      render: (text: string) => <Tag bordered={false}>{text}</Tag>,
    },
    {
      title: 'MDT Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      render: (text: string) => <span style={{ fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = status === 'Active' ? 'green' : status === 'On Leave' ? 'orange' : 'red';
        return <Tag color={color} style={{ borderRadius: '12px' }}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          { key: '1', label: 'Edit Details', icon: <EditOutlined />, onClick: () => handleEdit(record) },
          { key: '2', label: 'View Performance', icon: <DollarOutlined /> },
          { type: 'divider' },
          { key: '3', label: 'Deactivate', icon: <DeleteOutlined />, danger: true },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Staff Directory</Title>
          <Text type="secondary">Manage your team profiles, roles, and payroll.</Text>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{ 
            backgroundColor: '#1A1A1B', 
            borderRadius: '12px', 
            height: '48px', 
            padding: '0 24px', 
            fontWeight: 600 
          }}
        >
          Add New Staff
        </Button>
      </div>

      {/* Stats Overview */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#9CA3AF' }}>Total Staff</span>}
              value={12} 
              prefix={<TeamOutlined style={{ color: '#7C4DFF' }} />}
              valueStyle={{ fontWeight: 800, fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#9CA3AF' }}>Active Today</span>}
              value={9} 
              prefix={<ScissorOutlined style={{ color: '#059669' }} />}
              valueStyle={{ fontWeight: 800, fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#9CA3AF' }}>Total Payroll (MDT)</span>}
              value="Rs. 653,500" 
              valueStyle={{ fontWeight: 800, fontSize: 28, color: '#1A1A1B' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Data Table */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table 
          columns={columns} 
          dataSource={STAFF_DATA} 
          pagination={{ pageSize: 6 }}
          rowKey="key"
        />
      </Card>

      {/* Reusable Modal */}
      <StaffModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        staff={selectedStaff}
        mode={modalMode}
      />
    </div>
  );
}