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
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceToDelete, setServiceToDelete] = useState<any>(null);

  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [resSvc, resProd] = await Promise.all([
        fetch('/api/v1/services').then(r => r.json()),
        fetch('/api/v1/products').then(r => r.json())
      ]);
      const formattedServices = (resSvc.services || []).map((s: any) => ({ ...s, key: s.id, category: 'Service' }));
      const formattedProducts = (resProd.products || []).map((p: any) => ({ ...p, key: p.id, category: 'Product' }));
      setServices([...formattedServices, ...formattedProducts]);
    } catch (e) {
      showAlert('error', 'Failed to load catalog');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchCatalog();
  }, []);

  const handleAdd = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingService(record);
    setIsServiceModalOpen(true);
  };

  const handleDeleteClick = (record: any) => {
    setServiceToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      const endpoint = serviceToDelete.category === 'Service' ? '/api/v1/services' : '/api/v1/products';
      try {
        const res = await fetch(`${endpoint}?id=${serviceToDelete.key}`, { method: 'DELETE' });
        if (res.ok) {
          showAlert('success', 'Item removed successfully.');
          fetchCatalog();
        } else {
          showAlert('error', 'Failed to delete item.');
        }
      } catch (e) {
        showAlert('error', 'An error occurred.');
      }
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleSaveService = async (serviceData: any) => {
    const isEdit = !!serviceData.key;
    const endpoint = serviceData.category === 'Service' ? '/api/v1/services' : '/api/v1/products';
    const payload = isEdit ? { ...serviceData, id: serviceData.key } : serviceData;
    
    try {
      const res = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showAlert('success', `${serviceData.name} saved successfully.`);
        fetchCatalog();
        setIsServiceModalOpen(false);
      } else {
        const err = await res.json();
        showAlert('error', err.message || 'Failed to save item.');
      }
    } catch (e) {
      showAlert('error', 'An error occurred.');
    }
  };

  const handleToggleStatus = async (record: any, checked: boolean) => {
    const endpoint = record.category === 'Service' ? '/api/v1/services' : '/api/v1/products';
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.key, status: checked ? "Active" : "Inactive" })
      });
      if (res.ok) {
        showAlert('success', `Status updated successfully.`);
        fetchCatalog();
      } else {
        showAlert('error', 'Failed to update status.');
      }
    } catch (e) {
      showAlert('error', 'An error occurred.');
    }
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
        <div className="flex items-center gap-3">
          {record.imageUrl ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 relative">
              {/* Using standard img for simplicity in the table to avoid next/image layout issues */}
              <img src={record.imageUrl} alt={text} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
              {record.category === 'Service' ? (
                <ScissorOutlined className="text-slate-400 text-lg" />
              ) : (
                <ShoppingOutlined className="text-slate-400 text-lg" />
              )}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-[14px]">{text}</span>
            <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{record.description}</span>
          </div>
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
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <Switch 
            size="small" 
            checked={status === 'Active'} 
            onChange={(checked) => handleToggleStatus(record, checked)} 
          />
          <Text type={status === 'Active' ? 'success' : 'secondary'} className="text-[10px] font-bold uppercase inline-block min-w-[65px] text-left">
            {status}
          </Text>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      width: 80,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          { key: '1', label: 'Edit Item', icon: <EditOutlined />, onClick: () => handleEdit(record) },
          { type: 'divider' },
          { key: '2', label: 'Remove Item', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteClick(record) },
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
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Catalog Management</Title>
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