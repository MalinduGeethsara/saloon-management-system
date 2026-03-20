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
    setIsServiceModalOpen(false);
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
            style={{ width: 90, backgroundColor: '#7C4DFF', border: 'none' }}
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
      record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase()),
    filterDropdownProps: {
      onOpenChange: (visible) => {
        if (visible) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
  });

  // --- Table Configuration ---
  const columns = [
    {
      title: 'Item Name & Description',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      align: 'left' as const, // Anchor to left
      ...getColumnSearchProps('name', 'Name'), 
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-[14px]">{text}</span>
          <span className="text-[11px] text-slate-500 truncate max-w-[240px]">{record.description}</span>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      align: 'center' as const, // Center align tag
      filters: [
        { text: 'Service', value: 'Service' },
        { text: 'Product', value: 'Product' },
      ],
      onFilter: (value: any, record: any) => record.category === value, 
      render: (category: string) => {
        // Distinct colors for Service vs Product
        const color = category === 'Product' ? 'purple' : 'blue';
        return <Tag color={color} className="font-bold border-0 px-3 py-0.5 rounded-md">{category.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right' as const, // Right align money
      render: (price: number) => <span className="font-mono font-bold text-slate-700 text-[15px]">Rs. {price.toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160, // Widened slightly to give the toggle enough room
      align: 'center' as const, // Center align switch
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string, record: any) => (
        // FIX: Added whitespace-nowrap to prevent text dropping to next line
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <Switch 
            size="small" 
            checked={status === 'Active'} 
            onChange={(checked) => handleToggleStatus(record.key, checked)} 
          />
          {/* FIX: Replaced w-12 with min-w-[65px] to fit "INACTIVE" perfectly */}
          <Text type={status === 'Active' ? 'success' : 'secondary'} className="text-[10px] font-bold uppercase inline-block min-w-[65px] text-left">
            {status}
          </Text>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const, // Push actions to the far right edge
      width: 80,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          { key: '1', label: 'Edit Item', icon: <EditOutlined />, onClick: () => handleEdit(record) },
          { type: 'divider' },
          { key: '2', label: 'Remove Item', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteClick(record.key) },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" shape="circle" icon={<MoreOutlined className="text-lg" />} />
          </Dropdown>
        );
      },
    },
  ];

  const totalServices = services.filter(s => s.category === 'Service').length;
  const totalProducts = services.filter(s => s.category === 'Product').length;

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} className="m-0 font-black">Catalog Management</Title>
          <Text type="secondary">Manage services and products. Swipe table to see all details.</Text>
        </div>
        
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold shadow-md shadow-purple-100 border-none w-full md:w-auto h-12"
        >
          Add Item
        </Button>
      </div>

      {/* KPI Stats - Centered layout for mobile */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={12} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Services</span>}
              value={totalServices} 
              prefix={<ScissorOutlined style={{ color: '#7C4DFF', fontSize: '20px', marginRight: '4px' }} />}
              styles={{ content: { fontWeight: 800, fontSize: '24px' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products</span>}
              value={totalProducts} 
              prefix={<ShoppingOutlined style={{ color: '#F59E0B', fontSize: '20px', marginRight: '4px' }} />}
              styles={{ content: { fontWeight: 800, fontSize: '24px' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm rounded-2xl flex items-center justify-center text-center sm:text-left sm:justify-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Catalog</span>}
              value={services.filter(s => s.status === 'Active').length} 
              prefix={<TagOutlined style={{ color: '#10B981', fontSize: '20px', marginRight: '4px' }} />}
              styles={{ content: { fontWeight: 800, fontSize: '24px' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table - FULL SWIPE */}
      <Card 
        variant="borderless" 
        className="shadow-sm rounded-3xl overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        <Table 
          columns={columns} 
          dataSource={services} 
          pagination={{ pageSize: 8, size: 'small' }}
          rowKey="key"
          // Force horizontal scroll for full table swipe
          scroll={{ x: 1000 }} 
        />
      </Card>

      {/* Reusable Modals */}
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
        confirmText="Delete Item"
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