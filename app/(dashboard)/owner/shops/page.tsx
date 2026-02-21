"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
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
  Input 
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

const { Title, Text } = Typography;

// --- Mock Data ---
const INITIAL_SHOPS = [
  { 
    key: "S-01", 
    name: "Colombo City Cuts", 
    manager: "Kamal Perera", 
    phone: "+94 77 123 4567", 
    status: "Open", 
    address: "Union Place, Colombo 02",
    staff: 8,
    revenue: 450000,
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800"
  },
  { 
    key: "S-02", 
    name: "Kandy Kings Barber", 
    manager: "Nuwan Silva", 
    phone: "+94 71 987 6543", 
    status: "Open", 
    address: "Peradeniya Rd, Kandy",
    staff: 5,
    revenue: 280000,
    image: "https://images.unsplash.com/photo-1503951914875-befea74701c5?auto=format&fit=crop&q=80&w=800"
  },
  { 
    key: "S-03", 
    name: "Galle Fort Grooming", 
    manager: "Lahiru Fernando", 
    phone: "+94 76 555 1234", 
    status: "Closed", 
    address: "Pedlar St, Galle Fort",
    staff: 3,
    revenue: 120000,
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800"
  },
];

function ShopsContent() {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const [shops, setShops] = useState(INITIAL_SHOPS);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [shopToDelete, setShopToDelete] = useState<string | null>(null);

  // --- Handlers ---

  const handleAdd = () => {
    setEditingShop(null);
    setIsModalOpen(true);
  };

  const handleManage = (shopKey: string) => {
    // FIX: Navigation is now enabled
    showAlert('success', `Navigating to ${shopKey} dashboard...`);
    
    // This assumes your file structure is /app/owner/shops/[id]/dashboard/page.tsx
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

  const confirmDelete = () => {
    if (shopToDelete) {
      setShops(prev => prev.filter(s => s.key !== shopToDelete));
      showAlert('success', 'Location closed and removed successfully.');
      setIsDeleteModalOpen(false);
      setShopToDelete(null);
    }
  };

  const handleSaveShop = (shopData: any) => {
    if (shopData.key) {
      // Update
      setShops(prev => prev.map(s => s.key === shopData.key ? { ...s, ...shopData } : s));
      showAlert('success', 'Location details updated.');
    } else {
      // Create
      const newShop = {
        ...shopData,
        key: `S-${Date.now()}`, 
        staff: 0,
        revenue: 0
      };
      setShops(prev => [newShop, ...prev]);
      showAlert('success', 'New location added successfully.');
    }
  };

  // --- Search Logic ---
  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Location Management</Title>
          <Text type="secondary">Manage your shop branches, managers, and performance.</Text>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search locations..." 
            size="large"
            className="rounded-xl w-full md:w-64"
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none"
          >
            Add Location
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => (
          <Card 
            key={shop.key}
            hoverable
            className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md group"
            bodyStyle={{ padding: 0 }}
            cover={
              <div className="relative h-40 w-full overflow-hidden">
                <img 
                  src={shop.image} 
                  alt={shop.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute top-3 right-3">
                  <Tag color={shop.status === 'Open' ? 'green' : 'red'} className="m-0 border-0 font-bold px-3 py-1 rounded-full shadow-sm">
                    {shop.status.toUpperCase()}
                  </Tag>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <div className="font-bold text-lg">{shop.name}</div>
                  <div className="text-xs opacity-90 flex items-center gap-1">
                    <EnvironmentOutlined /> {shop.address}
                  </div>
                </div>
              </div>
            }
          >
            <div className="p-5">
              
              {/* Manager Info */}
              <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#7C4DFF' }} />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Manager</div>
                  <div className="text-sm font-semibold text-slate-800">{shop.manager}</div>
                </div>
                <Button 
                  type="text" 
                  icon={<PhoneOutlined className="text-slate-400" />} 
                  className="ml-auto" 
                  href={`tel:${shop.phone}`}
                />
              </div>

              {/* Mini Stats */}
              <Row gutter={8} className="mb-6">
                <Col span={12}>
                  <Statistic 
                    title={<span className="text-[10px] uppercase font-bold text-slate-400">Monthly Rev</span>}
                    value={shop.revenue} 
                    prefix={<span className="text-[#7C4DFF] text-xs">Rs.</span>}
                    valueStyle={{ fontSize: '16px', fontWeight: 700 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title={<span className="text-[10px] uppercase font-bold text-slate-400">Staff Count</span>}
                    value={shop.staff} 
                    suffix={<span className="text-xs text-slate-400">members</span>}
                    valueStyle={{ fontSize: '16px', fontWeight: 700 }}
                  />
                </Col>
              </Row>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button 
                  type="primary" 
                  block 
                  className="bg-[#1A1A1B] hover:bg-black rounded-lg font-semibold h-10 border-none"
                  icon={<ShopOutlined />}
                  onClick={() => handleManage(shop.key)}
                >
                  Manage
                </Button>
                
                <Dropdown 
                  menu={{ items: [
                    { key: '1', label: 'Edit Details', icon: <SettingOutlined />, onClick: () => handleSettings(shop) },
                    { type: 'divider' },
                    { key: '3', label: 'Close Location', danger: true, onClick: () => handleDeleteClick(shop.key) },
                  ] }} 
                  trigger={['click']}
                >
                  <Button className="h-10 w-10 flex items-center justify-center rounded-lg border-slate-200">
                    <EllipsisOutlined style={{ fontSize: 18 }} />
                  </Button>
                </Dropdown>
              </div>

            </div>
          </Card>
        ))}
      </div>

      {/* Modals */}
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