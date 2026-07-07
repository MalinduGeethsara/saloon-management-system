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

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Permissions State
  const [canAdd, setCanAdd] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const [canDelete, setCanDelete] = useState(true);
  
  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selection States
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { showAlert } = useAlert();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/products');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products.map((p: any) => ({ ...p, key: p.id })));
      } else {
        showAlert('error', data.message || 'Failed to fetch products');
      }
    } catch (e) {
      showAlert('error', 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
    
    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (roleMatch) {
      const role = roleMatch[2].toLowerCase();
      if (role !== 'owner' && role !== 'admin') {
        const permMatch = document.cookie.match(new RegExp('(^| )user_permissions=([^;]+)'));
        if (permMatch) {
          try {
            const perms = JSON.parse(decodeURIComponent(permMatch[2]));
            const pagePerms = perms.find((p: any) => p.pageKey === '/owner/products');
            if (pagePerms) {
              setCanAdd(pagePerms.canAdd);
              setCanEdit(pagePerms.canEdit);
              setCanDelete(pagePerms.canDelete);
            } else {
              setCanAdd(false);
              setCanEdit(false);
              setCanDelete(false);
            }
          } catch (e) {}
        }
      }
    }
  }, []);

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

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        const res = await fetch(`/api/v1/products?id=${productToDelete}`, { method: 'DELETE' });
        if (res.ok) {
          setProducts(prev => prev.filter(p => p.key !== productToDelete));
          showAlert('success', 'Product removed from inventory.');
          setIsDeleteModalOpen(false);
          setProductToDelete(null);
        } else {
          showAlert('error', 'Failed to delete product.');
        }
      } catch (e) {
        showAlert('error', 'Error deleting product.');
      }
    }
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (productData.id) {
        // UPDATE Existing
        const res = await fetch('/api/v1/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        if (res.ok) {
          fetchProducts();
          showAlert('success', `${productData.name} updated successfully.`);
        } else {
          showAlert('error', 'Failed to update product.');
        }
      } else {
        // CREATE New
        const res = await fetch('/api/v1/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
        if (res.ok) {
          fetchProducts();
          showAlert('success', 'New product added to inventory.');
        } else {
          showAlert('error', 'Failed to add product.');
        }
      }
    } catch (e) {
      showAlert('error', 'Error saving product.');
    }
  };

  // --- Filtering Logic ---
  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Views ---

  // 1. Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => (
        <Card 
          key={product.key}
          hoverable
          className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md group"
          styles={{ body: { padding: 0 } }}
          cover={
            <div className="relative h-48 w-full bg-white flex items-center justify-center overflow-hidden p-4 group">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${product.imageUrl || product.image || 'https://via.placeholder.com/300'})`, opacity: 0.95 }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                {canEdit && (
                  <Button 
                    shape="circle" 
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit(product)}
                    className="border-none bg-white/90 text-slate-800 hover:bg-white hover:text-[#7C4DFF]"
                  />
                )}
                {canDelete && (
                  <Button 
                    shape="circle" 
                    icon={<DeleteOutlined />} 
                    danger
                    onClick={() => handleDeleteClick(product.key)}
                    className="border-none bg-white/90 hover:bg-white"
                  />
                )}
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                {product.status === 'Inactive' && (
                  <Tag color="default" className="m-0 border-none shadow-sm font-semibold">Inactive</Tag>
                )}
                {product.stock === 0 ? (
                  <Tag color="red" className="m-0 border-none shadow-sm font-semibold">Out of Stock</Tag>
                ) : product.stock < 10 ? (
                  <Tag color="orange" className="m-0 border-none shadow-sm font-semibold">Low Stock ({product.stock})</Tag>
                ) : (
                  <Tag color="green" className="m-0 border-none shadow-sm font-semibold">In Stock ({product.stock})</Tag>
                )}
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

  // 2. List View
  const renderListView = () => {
    const columns: any = [
      {
        title: 'Product',
        dataIndex: 'name',
        key: 'name',
        width: 300,
        render: (text: string, record: any) => (
          <div className="flex items-center gap-3">
            <Avatar shape="square" size={48} src={record.imageUrl || record.image || undefined} icon={<PictureOutlined />} className="bg-gray-100 border border-gray-200" />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 text-sm">{text}</span>
              <span className="text-xs text-slate-500">{record.brand} • <span className="font-mono">{record.sku}</span></span>
            </div>
          </div>
        ),
      },
      { title: 'Category', dataIndex: 'category', key: 'category', render: (t: string) => <Tag>{t}</Tag> },
      { title: 'Price (LKR)', dataIndex: 'price', key: 'price', render: (p: number) => <span className="font-mono font-medium">Rs. {p.toLocaleString()}</span> },
      { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (s: number) => <span style={{ color: s >= 10 ? '#059669' : s > 0 ? '#F59E0B' : '#DC2626', fontWeight: 700 }}>{s} units</span> },
      {
        title: 'Status',
        key: 'status',
        render: (_: any, record: any) => {
          if (record.status === 'Inactive') return <Tag color="default">Inactive</Tag>;
          if (record.stock === 0) return <Tag color="red">Out of Stock</Tag>;
          if (record.stock < 10) return <Tag color="orange">Low Stock</Tag>;
          return <Tag color="green">In Stock</Tag>;
        },
      },
      {
        title: 'Action',
        key: 'action',
        align: 'right',
        render: (_: any, record: any) => {
          const items: MenuProps['items'] = [];
          if (canEdit) items.push({ key: '1', label: 'Edit', icon: <EditOutlined />, onClick: () => handleEdit(record) });
          if (canDelete) items.push({ key: '2', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteClick(record.key) });
          
          if (items.length === 0) return <span className="text-xs text-slate-400">No Access</span>;

          return (
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button type="text" shape="circle" icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      },
    ];

    return (
      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={filteredProducts} pagination={{ pageSize: 8 }} rowKey="key" />
      </Card>
    );
  };

  return (
   <div style={{ maxWidth: 1585, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex-1">
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Inventory Management</Title>
          <Text type="secondary">Track stock levels, manage suppliers, and update pricing.</Text>
        </div>
        
        {/* Controls Container - Aligned on one line for md+ screens */}
        <div className="flex items-center gap-3 w-full md:w-auto">
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
            placeholder="Search..." 
            size="large"
            className="flex-1 md:w-64 rounded-xl"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {canAdd && (
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
              style={{ backgroundColor: '#7C4DFF', borderRadius: '12px', fontWeight: 600 }}
              className="shrink-0"
            >
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Total Products</span>}
              value={products.length} 
              prefix={<ShoppingOutlined style={{ color: '#7C4DFF' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Low Stock Items</span>}
              value={products.filter(p => p.stock > 0 && p.stock < 10).length} 
              prefix={<AlertOutlined style={{ color: '#F59E0B' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <Statistic 
              title={<span className="text-xs font-bold text-gray-400 uppercase">Out of Stock</span>}
              value={products.filter(p => p.stock === 0).length} 
              prefix={<InboxOutlined style={{ color: '#DC2626' }} />}
              styles={{ content: { fontWeight: 800 } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Content Area */}
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