"use client";

import React, { useState, useRef } from 'react';
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
  Input,
  Space,
  Switch
} from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ScissorOutlined,
  TagOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ServiceModal } from "@/components/modals/ServiceModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Title, Text } = Typography;

// --- Mock Initial Data Updated for Service/Product ---
const INITIAL_SERVICES = [
  { key: '1', name: "Classic Haircut", category: "Service", price: 2500, status: "Active", description: "Standard haircut with wash and styling." },
  { key: '2', name: "Beard Trim & Shape", category: "Service", price: 1500, status: "Active", description: "Professional beard grooming." },
  { key: '3', name: "Hair Coloring", category: "Service", price: 5000, status: "Active", description: "Full head coloring or highlights." },
  { key: '4', name: "Matte Clay Wax", category: "Product", price: 1800, status: "Active", description: "Premium styling wax." },
  { key: '5', name: "Beard Oil", category: "Product", price: 1200, status: "Inactive", description: "Nourishing oil for beard growth." },
];

function ServicesContent() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  
  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

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
      showAlert('success', 'Item removed successfully.');
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleSaveService = (serviceData: any) => {
    if (serviceData.key) {
      setServices(prev => 
        prev.map(s => s.key === serviceData.key ? { ...s, ...serviceData } : s)
      );
      showAlert('success', `${serviceData.name} updated successfully.`);
    } else {
      const newService = {
        ...serviceData,
        key: String(Date.now()), 
      };
      setServices(prev => [newService, ...prev]);
      showAlert('success', 'New item added to catalog.');
    }
  };

const handleToggleStatus = (key: string, checked: boolean) => {
    setServices(prev => 
      prev.map(s => s.key === key ? { ...s, status: checked ? "Active" : "Inactive" } : s)
    );
    // FIX: Changed 'info' to 'success' to match your AlertType
    showAlert('success', `Status updated successfully.`);
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
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, backgroundColor: '#7C4DFF' }}
          >
            Search
          </Button>
          <Button
            onClick={() => { clearFilters && clearFilters(); confirm(); }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#7C4DFF' : undefined, fontSize: '16px' }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  // --- Table Configuration ---
  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name', 'Name'), 
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
      filters: [
        { text: 'Service', value: 'Service' },
        { text: 'Product', value: 'Product' },
      ],
      onFilter: (value: any, record: any) => record.category === value, 
      render: (category: string) => {
        // Distinct colors for Service vs Product
        const color = category === 'Product' ? 'purple' : 'blue';
        return <Tag color={color} className="font-semibold">{category}</Tag>;
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <span className="font-mono font-bold text-slate-700">Rs. {price.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string, record: any) => (
        <div className="flex items-center gap-2">
          <Switch 
            size="small" 
            checked={status === 'Active'} 
            onChange={(checked) => handleToggleStatus(record.key, checked)} 
          />
          <Text type={status === 'Active' ? 'success' : 'secondary'} className="text-xs font-semibold">
            {status.toUpperCase()}
          </Text>
        </div>
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
            label: 'Edit Item', 
            icon: <EditOutlined />, 
            onClick: () => handleEdit(record) 
          },
          { type: 'divider' },
          { 
            key: '2', 
            label: 'Remove Item', 
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

  const totalServices = services.filter(s => s.category === 'Service').length;
  const totalProducts = services.filter(s => s.category === 'Product').length;

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Catalog Management</Title>
          <Text type="secondary">Manage the services and products offered to customers.</Text>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none"
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Services</span>}
              value={totalServices} 
              prefix={<ScissorOutlined style={{ color: '#7C4DFF' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Products</span>}
              value={totalProducts} 
              prefix={<ShoppingOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Active Catalog</span>}
              value={services.filter(s => s.status === 'Active').length} 
              prefix={<TagOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <Table 
          columns={columns} 
          dataSource={services} 
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
        title="Delete Item?"
        description="Are you sure you want to remove this item? It will no longer be available for billing."
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