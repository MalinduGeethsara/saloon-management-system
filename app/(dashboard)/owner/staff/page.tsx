"use client";

import React, { useState, useRef } from 'react';
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
  Col,
  Input
} from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import { 
  UserOutlined, 
  MoreOutlined, 
  PlusOutlined, 
  TeamOutlined, 
  DollarOutlined, 
  ScissorOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { StaffModal } from "@/components/modals/StaffModal";

const { Title, Text } = Typography;

// --- Mock Data ---
const STAFF_DATA = [
  { key: '1', name: "Nuwan Pradeep", role: "Senior Barber", branch: "Downtown", earnings: "Rs. 185,000", status: "Active", email: "nuwan@salon.com", phone: "0771234567" },
  { key: '2', name: "Kasun Perera", role: "Barber", branch: "Downtown", earnings: "Rs. 120,000", status: "Active", email: "kasun@salon.com", phone: "0719876543" },
  { key: '3', name: "Lahiru Thirimanne", role: "Manager", branch: "Westside", earnings: "Rs. 250,000", status: "On Leave", email: "lahiru@salon.com", phone: "0765551234" },
  { key: '4', name: "Chamara Silva", role: "Barber", branch: "Westside", earnings: "Rs. 98,500", status: "Active", email: "chamara@salon.com", phone: "0702223333" },
];

function StaffContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

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

  const handleDelete = (key: string) => {
    showAlert('success', 'Staff member deactivated.');
  };

  // --- Column Search Setup ---
  const getColumnSearchProps = (dataIndex: string, placeholder: string): TableColumnType<any> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${placeholder}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ backgroundColor: '#7C4DFF' }}>Search</Button>
          <Button onClick={() => { clearFilters && clearFilters(); confirm(); }} size="small">Reset</Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#7C4DFF' : undefined }} />,
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) setTimeout(() => searchInput.current?.select(), 100);
      },
    },
  });

  // --- Table Configuration ---
  const columns = [
    {
      title: 'Staff Member',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      align: 'left' as const,
      ...getColumnSearchProps('name', 'Name'),
      render: (text: string, record: any) => (
        <Space size="middle">
          <Avatar style={{ backgroundColor: '#F3E8FF', color: '#7C4DFF' }} icon={<UserOutlined />} />
          <div className="flex flex-col">
            <Text strong className="text-slate-800">{text}</Text>
            <Text type="secondary" className="text-[11px]">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 180,
      align: 'center' as const,
      render: (text: string) => (
        <Tag icon={text === 'Manager' ? <DollarOutlined /> : <ScissorOutlined />} color="default" className="border-slate-200 text-slate-600 px-3 py-0.5 rounded-md">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      width: 150,
      align: 'center' as const,
    },
    {
      title: 'Monthly Earnings',
      dataIndex: 'earnings',
      key: 'earnings',
      width: 160,
      align: 'right' as const,
      render: (text: string) => <Text strong className="text-emerald-600 font-mono">{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center' as const,
      render: (status: string) => {
        let color = status === 'Active' ? 'green' : status === 'On Leave' ? 'orange' : 'red';
        return <Tag color={color} className="rounded-full px-4 font-bold border-0">{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          { key: '1', label: 'Edit', icon: <EditOutlined />, onClick: () => handleEdit(record) },
          { key: '2', label: 'Stats', icon: <DollarOutlined /> },
          { type: 'divider' },
          { key: '3', label: 'Remove', icon: <DeleteOutlined />, danger: true },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" shape="circle" icon={<MoreOutlined className="text-lg" />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Staff Directory</Title>
          <Text type="secondary">Team management and performance tracking.</Text>
        </div>
        <Button 
          type="primary" size="large" icon={<PlusOutlined />} 
          className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold h-12 w-full md:w-auto border-none shadow-md shadow-purple-100"
          onClick={() => { setModalMode('add'); setSelectedStaff(null); setIsModalOpen(true); }}
        >
          Add New Staff
        </Button>
      </div>

      {/* KPI Cards - Improved Alignment */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Team</Text>} 
              value={STAFF_DATA.length} 
              prefix={<TeamOutlined style={{ color: '#7C4DFF', fontSize: '20px' }} />} 
              styles={{ content: { fontWeight: 800, fontSize: '24px' } }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</Text>} 
              value={STAFF_DATA.filter(s => s.status === 'Active').length} 
              prefix={<ScissorOutlined style={{ color: '#059669', fontSize: '20px' }} />} 
              styles={{ content: { fontWeight: 800, fontSize: '24px' } }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payroll</Text>} 
              value="653k" 
              prefix={<span style={{ color: '#F59E0B', fontSize: '14px', fontWeight: 700, marginRight: 4 }}>Rs.</span>} 
              styles={{ content: { fontWeight: 800, fontSize: '24px' } }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Table - FULL SWIPE */}
      <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={STAFF_DATA} 
          pagination={{ pageSize: 8 }}
          rowKey="key"
          scroll={{ x: 1000 }} 
        />
      </Card>

      <StaffModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} staff={selectedStaff} mode={modalMode} />
    </div>
  );
}

// Wrapper
export default function OwnerStaff() {
  return (
    <AlertProvider>
      <StaffContent />
    </AlertProvider>
  );
}