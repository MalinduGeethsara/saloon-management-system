"use client";

import React, { useState } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Dropdown, 
  MenuProps,
  Statistic,
  Row,
  Col,
  Input
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ScissorOutlined,
  ClockCircleOutlined,
  TagOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ServiceModal } from "@/components/modals/ServiceModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Title, Text } = Typography;

// --- Mock Initial Data ---
const INITIAL_SERVICES = [
  { key: '1', name: "Classic Haircut", category: "Hair", price: 2500, duration: 45, status: "Active", description: "Standard haircut with wash and styling." },
  { key: '2', name: "Beard Trim & Shape", category: "Beard", price: 1500, duration: 30, status: "Active", description: "Professional beard grooming." },
  { key: '3', name: "Hair Coloring", category: "Hair", price: 5000, duration: 90, status: "Active", description: "Full head coloring or highlights." },
  { key: '4', name: "Royal Facial", category: "Face", price: 3500, duration: 60, status: "Inactive", description: "Deep cleansing facial treatment." },
];

function ServicesContent() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const { showAlert } = useAlert();

  // --- Handlers ---

  const handleAdd = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingService(record);
    setIsServiceModalOpen(true);
  };

  const handleDeleteClick = (key: string) => {
    setServiceToDelete(key);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      setServices(prev => prev.filter(s => s.key !== serviceToDelete));
      showAlert('success', 'Service removed successfully.');
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleSaveService = (serviceData: any) => {
    if (serviceData.key) {
      // UPDATE Existing
      setServices(prev => 
        prev.map(s => s.key === serviceData.key ? { ...s, ...serviceData } : s)
      );
      showAlert('success', `${serviceData.name} updated successfully.`);
    } else {
      // CREATE New
      const newService = {
        ...serviceData,
        key: String(Date.now()), // Generate simple ID
      };
      setServices(prev => [newService, ...prev]);
      showAlert('success', 'New service added to catalog.');
    }
  };

  // --- Filtering Logic ---
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Table Configuration ---
  const columns = [
    {
      title: 'Service Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{text}</span>
          <span className="text-xs text-slate-500 truncate max-w-[200px]">{record.description}</span>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        let color = 'blue';
        if (category === 'Beard') color = 'orange';
        if (category === 'Face') color = 'purple';
        return <Tag color={color}>{category}</Tag>;
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span className="font-mono font-bold text-slate-700">Rs. {price.toLocaleString()}</span>,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => (
        <div className="flex items-center gap-1 text-slate-500">
          <ClockCircleOutlined /> {duration} mins
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'success' : 'default'} className="rounded-full px-3 font-semibold">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          { 
            key: '1', 
            label: 'Edit Service', 
            icon: <EditOutlined />, 
            onClick: () => handleEdit(record) 
          },
          { type: 'divider' },
          { 
            key: '2', 
            label: 'Remove', 
            icon: <DeleteOutlined />, 
            danger: true,
            onClick: () => handleDeleteClick(record.key)
          },
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
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Service Menu</Title>
          <Text type="secondary">Manage the services offered, pricing, and duration.</Text>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search services..." 
            size="large"
            className="rounded-xl w-full md:w-64"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none"
          >
            Add Service
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Services</span>}
              value={services.length} 
              prefix={<ScissorOutlined style={{ color: '#7C4DFF' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Active Services</span>}
              value={services.filter(s => s.status === 'Active').length} 
              prefix={<TagOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Avg Price</span>}
              value={services.length > 0 ? Math.round(services.reduce((acc, curr) => acc + curr.price, 0) / services.length) : 0} 
              prefix={<span className="text-amber-500 text-2xl mr-1">Rs.</span>}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredServices} 
          pagination={{ pageSize: 8 }}
          rowKey="key"
        />
      </Card>

      {/* Modals */}
      <ServiceModal 
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        serviceToEdit={editingService}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Service?"
        description="Are you sure you want to remove this service? It will no longer be available for booking."
        confirmText="Yes, Delete"
        isDanger={true}
      />
    </div>
  );
}

// Wrapper
export default function ServicesPage() {
  return (
    <AlertProvider>
      <ServicesContent />
    </AlertProvider>
  );
}