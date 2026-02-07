"use client";

import React, { useState } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Button, 
  Space, 
  Dropdown, 
  MenuProps,
  Statistic,
  Row,
  Col,
  Input,
  Avatar,
  Segmented,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ShoppingOutlined,
  InboxOutlined,
  AlertOutlined,
  PictureOutlined,
  AppstoreOutlined,
  BarsOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ProductModal } from "@/components/modals/ProductModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Title, Text } = Typography;

// --- Mock Initial Data with Images ---
const INITIAL_PRODUCTS = [
  { 
    key: '1', 
    name: "Matte Pomade", 
    brand: "Suavecito", 
    category: "Hair Care", 
    price: 3500, 
    stock: 45, 
    status: "In Stock", 
    sku: "POM-001",
    image: "https://m.media-amazon.com/images/I/61+yVw-oQoL._SX522_.jpg" 
  },
  { 
    key: '2', 
    name: "Beard Oil", 
    brand: "Viking Revolution", 
    category: "Beard Care", 
    price: 2800, 
    stock: 8, 
    status: "Low Stock", 
    sku: "OIL-023",
    image: "https://m.media-amazon.com/images/I/71w+7+3-cZL._SX522_.jpg"
  },
  { 
    key: '3', 
    name: "Fade Brush", 
    brand: "Wahl", 
    category: "Equipment", 
    price: 1500, 
    stock: 12, 
    status: "In Stock", 
    sku: "EQP-104",
    image: "https://m.media-amazon.com/images/I/71K+P-1+XlL._SX522_.jpg"
  },
  { 
    key: '4', 
    name: "Aftershave Splash", 
    brand: "Nivea Men", 
    category: "Shaving", 
    price: 1200, 
    stock: 0, 
    status: "Out of Stock", 
    sku: "SHV-009",
    image: "https://m.media-amazon.com/images/I/61+9+8+1+L._SX522_.jpg"
  },
  { 
    key: '5', 
    name: "Styling Comb", 
    brand: "Kent", 
    category: "Equipment", 
    price: 850, 
    stock: 25, 
    status: "In Stock", 
    sku: "CMB-005",
    image: "https://m.media-amazon.com/images/I/61vY1X4wFmL._SL1500_.jpg"
  },
];

function ProductsContent() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); // Default to Grid (Folder view)
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selection States
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { showAlert } = useAlert();

  // --- Handlers ---

  const handleAdd = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingProduct(record);
    setIsProductModalOpen(true);
  };

  const handleDeleteClick = (key: string) => {
    setProductToDelete(key);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProducts(prev => prev.filter(p => p.key !== productToDelete));
      showAlert('success', 'Product removed from inventory.');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = (productData: any) => {
    if (productData.key) {
      // UPDATE Existing
      setProducts(prev => 
        prev.map(p => p.key === productData.key ? { ...p, ...productData } : p)
      );
      showAlert('success', `${productData.name} updated successfully.`);
    } else {
      // CREATE New
      const newProduct = {
        ...productData,
        key: String(Date.now()), 
      };
      setProducts(prev => [newProduct, ...prev]);
      showAlert('success', 'New product added to inventory.');
    }
  };

  // --- Filtering Logic ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Helpers ---

  // 1. Grid View (Folder Style)
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <Card 
          key={product.key}
          hoverable
          className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md group"
          bodyStyle={{ padding: 0 }}
          cover={
            <div className="relative h-48 w-full bg-white flex items-center justify-center overflow-hidden p-4">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${product.image})`, opacity: 0.9 }}
              />
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                <Button 
                  shape="circle" 
                  icon={<EditOutlined />} 
                  onClick={() => handleEdit(product)}
                  className="border-none bg-white/90 text-slate-800 hover:bg-white hover:text-[#7C4DFF]"
                />
                <Button 
                  shape="circle" 
                  icon={<DeleteOutlined />} 
                  danger
                  onClick={() => handleDeleteClick(product.key)}
                  className="border-none bg-white/90 hover:bg-white"
                />
              </div>
              {/* Stock Badge */}
              <div className="absolute top-3 right-3">
                <Tag color={product.status === 'Out of Stock' ? 'red' : product.status === 'Low Stock' ? 'orange' : 'green'} className="m-0 border-none shadow-sm font-semibold">
                  {product.status === 'In Stock' ? `${product.stock} left` : product.status}
                </Tag>
              </div>
            </div>
          }
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-1">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{product.category}</div>
              <div className="font-mono text-[#7C4DFF] font-bold">Rs. {product.price.toLocaleString()}</div>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1 truncate" title={product.name}>{product.name}</h3>
            <div className="text-xs text-slate-500 flex justify-between items-center">
              <span>{product.brand}</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{product.sku}</span>
            </div>
          </div>
        </Card>
      ))}
      {filteredProducts.length === 0 && (
        <div className="col-span-full flex justify-center py-12">
          <Empty description="No products found" />
        </div>
      )}
    </div>
  );

  // 2. List View (Table Style)
  const renderListView = () => {
    const columns: any = [
      {
        title: 'Product',
        dataIndex: 'name',
        key: 'name',
        width: 300,
        render: (text: string, record: any) => (
          <div className="flex items-center gap-3">
            <Avatar shape="square" size={48} src={record.image} icon={<PictureOutlined />} className="bg-gray-100 border border-gray-200" />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 text-sm">{text}</span>
              <span className="text-xs text-slate-500">{record.brand} • <span className="font-mono">{record.sku}</span></span>
            </div>
          </div>
        ),
      },
      { title: 'Category', dataIndex: 'category', key: 'category', render: (t: string) => <Tag>{t}</Tag> },
      { title: 'Price (LKR)', dataIndex: 'price', key: 'price', render: (p: number) => <span className="font-mono font-medium">Rs. {p.toLocaleString()}</span> },
      { 
        title: 'Stock', 
        dataIndex: 'stock', 
        key: 'stock', 
        render: (s: number) => <span style={{ color: s > 10 ? '#059669' : '#DC2626', fontWeight: 700 }}>{s} units</span> 
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (s: string) => {
          let color = 'green';
          if (s === 'Low Stock') color = 'orange';
          if (s === 'Out of Stock') color = 'red';
          return <Tag color={color}>{s}</Tag>;
        },
      },
      {
        title: 'Action',
        key: 'action',
        align: 'right',
        render: (_: any, record: any) => (
          <Dropdown menu={{ items: [
            { key: '1', label: 'Edit', icon: <EditOutlined />, onClick: () => handleEdit(record) },
            { key: '2', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteClick(record.key) },
          ] }} trigger={['click']}>
            <Button type="text" shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ];

    return (
      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }} bodyStyle={{ padding: 0 }}>
        <Table columns={columns} dataSource={filteredProducts} pagination={{ pageSize: 8 }} rowKey="key" />
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Inventory Management</Title>
          <Text type="secondary">Track stock levels, manage suppliers, and update pricing.</Text>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          {/* View Toggle */}
          <Segmented
            options={[
              { value: 'grid', icon: <AppstoreOutlined /> },
              { value: 'list', icon: <BarsOutlined /> },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val as 'list' | 'grid')}
            size="large"
            className="hidden sm:block"
          />

          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search products..." 
            size="large"
            className="w-full sm:w-64 rounded-xl"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            style={{ backgroundColor: '#1A1A1B', borderRadius: '12px', fontWeight: 600 }}
            className="w-full sm:w-auto"
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Products</span>}
              value={products.length} 
              prefix={<ShoppingOutlined style={{ color: '#7C4DFF' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Low Stock Items</span>}
              value={products.filter(p => p.stock > 0 && p.stock < 10).length} 
              prefix={<AlertOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Out of Stock</span>}
              value={products.filter(p => p.stock === 0).length} 
              prefix={<InboxOutlined style={{ color: '#DC2626' }} />}
              valueStyle={{ fontWeight: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Content Area (Grid or List) */}
      <div className="min-h-[400px]">
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </div>

      {/* Modals */}
      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="Are you sure you want to remove this item? This action is permanent."
        confirmText="Yes, Delete"
        isDanger={true}
      />
    </div>
  );
}

// Wrapper
export default function ProductsPage() {
  return (
    <AlertProvider>
      <ProductsContent />
    </AlertProvider>
  );
}