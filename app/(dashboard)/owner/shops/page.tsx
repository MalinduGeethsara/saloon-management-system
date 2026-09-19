"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { AppPagination } from '@/components/ui/AppPagination';
import { usePagedList } from '@/hooks/usePagedList';
import { 
  Card, 
  Typography, 
  Button, 
  Tag, 
  Avatar, 
  Row, 
  Col, 
  Statistic, 
  Dropdown, 
  Input,
  Tooltip
} from 'antd';
import { 
  ShopOutlined, 
  PhoneOutlined, 
  UserOutlined, 
  SettingOutlined, 
  EllipsisOutlined, 
  PlusOutlined, 
  SearchOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { LocationModal } from "@/components/modals/LocationModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { useAccess } from '@/hooks/useAccess';

const { Title, Text } = Typography;

// Removed mock data

function ShopsContent() {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [shopToDelete, setShopToDelete] = useState<string | null>(null);

  const access = useAccess('/owner/shops');
  const canAdd = access.add;
  const canEdit = access.edit;
  const canDelete = access.delete;

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/shops');
      const data = await res.json();
      if (res.ok) {
        setShops(data.shops.map((s: any) => ({
          ...s,
          key: s.id,
          staffCount: s.staff ? s.staff.length : 0,
          staffMembers: s.staff || [],
          revenue: s.revenue || 0
        })));
      }
    } catch (e) {
      showAlert('error', 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchShops();

  }, []);

  const handleAdd = () => {
    setEditingShop(null);
    setIsModalOpen(true);
  };

  const handleManage = (shopKey: string) => {
    showAlert('success', `Navigating to ${shopKey} dashboard...`);
    router.push(`/owner/shops/${shopKey}/dashboard`); 
  };

  const handleSettings = (shop: any) => {
    setEditingShop(shop);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (key: string) => {
    setShopToDelete(key);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (shopToDelete) {
      try {
        const res = await fetch(`/api/v1/shops?id=${shopToDelete}`, { method: 'DELETE' });
        if (res.ok) {
          showAlert('success', 'Location closed and removed successfully.');
          fetchShops();
          setIsDeleteModalOpen(false);
          setShopToDelete(null);
        } else {
          showAlert('error', 'Failed to delete shop.');
        }
      } catch (e) {
        showAlert('error', 'Error deleting shop.');
      }
    }
  };

  const handleSaveShop = async (shopData: any) => {
    try {
      if (shopData.key) {
        // UPDATE Existing
        const payload = { ...shopData, id: shopData.key };
        const res = await fetch('/api/v1/shops', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          fetchShops();
          showAlert('success', 'Location details updated.');
        } else {
          showAlert('error', 'Failed to update shop.');
        }
      } else {
        // CREATE New
        const res = await fetch('/api/v1/shops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shopData)
        });
        if (res.ok) {
          fetchShops();
          showAlert('success', 'New location added successfully.');
        } else {
          showAlert('error', 'Failed to add shop.');
        }
      }
    } catch (e) {
      showAlert('error', 'Error saving shop.');
    }
  };

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const shopPaging = usePagedList(filteredShops, 9);

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(20px, 5vw, 30px)' }}>Location Management</Title>
          <Text type="secondary">Manage your shop branches, managers, and performance.</Text>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search locations..." 
            size="large"
            className="rounded-xl w-full md:w-64"
            onChange={e => setSearchTerm(e.target.value)}
          />
          {canAdd && (
            <Button 
              type="primary" 
              size="large" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
              className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none h-12"
            >
              Add Location
            </Button>
          )}
        </div>
      </div>

      {/* Grid Layout - Optimized for Mobile Swiping/Stacking */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {shopPaging.pageItems.map((shop) => (
            <Card 
              key={shop.key}
              hoverable
              className="overflow-hidden border border-slate-200 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md group"
              styles={{ body: { padding: 0 } }} 
              cover={
                <div className="relative h-44 w-full overflow-hidden">
                  <img 
                    src={shop.imageUrl || '/images/site/shop-front.jpg'} 
                    alt={shop.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute top-3 right-3">
                    <Tag color={shop.status === 'Open' ? 'green' : 'red'} className="m-0 border-0 font-bold px-3 py-1 rounded-full shadow-md">
                      {shop.status.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="font-bold text-lg leading-tight mb-1">{shop.name}</div>
                    <div className="text-[11px] opacity-90 flex items-center gap-1">
                      <EnvironmentOutlined /> {shop.address}
                    </div>
                  </div>
                </div>
              }
            >
              <div className="p-5">
                {/* Manager Info Row */}
                <div className="flex items-center gap-3 mb-5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#7C4DFF', flexShrink: 0 }} />
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manager</div>
                    <div className="text-sm font-semibold text-slate-800 truncate">{shop.manager}</div>
                  </div>
                  <Button 
                    type="text" 
                    icon={<PhoneOutlined className="text-[#7C4DFF]" />} 
                    className="ml-auto bg-white shadow-sm rounded-lg" 
                    href={`tel:${shop.phone}`}
                  />
                </div>

                {/* KPI Section - Horizontal scrollable on tiny devices */}
                <Row gutter={12} className="mb-6">
                  <Col span={12}>
                    <Statistic 
                      title={<span className="text-[10px] uppercase font-bold text-slate-400">Monthly Revenue</span>}
                      value={shop.revenue} 
                      prefix={<span className="text-[#7C4DFF] text-xs font-bold">Rs.</span>}
                      styles={{ content: { fontSize: '16px', fontWeight: 800 } }}
                    />
                  </Col>
                  <Col span={12}>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Staff ({shop.staffCount})</span>
                      <Avatar.Group max={{ count: 3, style: { color: '#f56a00', backgroundColor: '#fde3cf' } }}>
                        {shop.staffMembers?.map((staff: any) => (
                          <Tooltip title={staff.name} placement="top" key={staff.id}>
                            <Avatar src={staff.imageUrl} style={{ backgroundColor: '#7C4DFF' }}>
                              {staff.name.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </Avatar.Group>
                      {shop.staffCount === 0 && <span className="text-xs text-slate-400 font-semibold mt-1">No staff assigned</span>}
                    </div>
                  </Col>
                </Row>

                {/* Full-width Actions for Mobile Accessibility */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="primary" 
                    block 
                    className="bg-[#1A1A1B] hover:bg-black rounded-xl font-bold h-11 border-none shadow-md"
                    icon={<ShopOutlined />}
                    onClick={() => handleManage(shop.key)}
                  >
                    Manage
                  </Button>
                  
                  {(canEdit || canDelete) && (
                    <Dropdown 
                      menu={{ items: [
                        ...(canEdit ? [{ key: '1', label: 'Edit Details', icon: <SettingOutlined />, onClick: () => handleSettings(shop) }] : []),
                        ...(canEdit && canDelete ? [{ type: 'divider' as const }] : []),
                        ...(canDelete ? [{ key: '3', label: 'Close Location', danger: true, onClick: () => handleDeleteClick(shop.key) }] : []),
                      ] }} 
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button className="h-11 w-12 flex items-center justify-center rounded-xl border-slate-200 bg-white">
                        <EllipsisOutlined style={{ fontSize: 20 }} />
                      </Button>
                    </Dropdown>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>
      <AppPagination current={shopPaging.page} pageSize={shopPaging.pageSize} total={shopPaging.total} onChange={shopPaging.setPage} />

      <LocationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveShop}
        shopToEdit={editingShop}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Close Location?"
        description="Are you sure you want to close this location? This will remove it from your dashboard."
        confirmText="Yes, Close Location"
        isDanger={true}
      />
    </div>
  );
}

// Wrapper
export default function OwnerShops() {
  return (
    <AlertProvider>
      <ShopsContent />
    </AlertProvider>
  );
}