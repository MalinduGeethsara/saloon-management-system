"use client";

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Avatar, 
  Tag, 
  Input, 
  Modal, 
  Form, 
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Select,
  Upload,
  QRCode,
  Switch
} from 'antd';
import { 
  PlusOutlined, 
  ShopOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  EnvironmentOutlined,
  PhoneOutlined,
  QrcodeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Title, Text } = Typography;

// --- Interfaces ---
interface Shop {
  key: string;
  name: string;
  owner: string;
  location: string;
  region: string;
  contact: string;
  br: string;
  status: 'Active' | 'Inactive';
  image?: string;
}

const SL_REGIONS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", 
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar", 
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee", 
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", 
  "Moneragala", "Ratnapura", "Kegalle"
];

const INITIAL_SHOPS: Shop[] = [
  { 
    key: '1', 
    name: 'Mr Polaa Barber Shop', 
    owner: 'Nimesh Haththasingha', 
    location: 'New Road', 
    region: 'Hambantota',
    contact: '0712568071', 
    br: 'BR-SP-2021-001', 
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=150&q=80'
  },
  { 
    key: '2', 
    name: 'Kandy Styles', 
    owner: 'Nimal Siripala', 
    location: 'Peradeniya Rd', 
    region: 'Kandy',
    contact: '0812233445', 
    br: 'BR-CP-2023-089', 
    status: 'Active' 
  },
];

export default function ShopDataPage() {
  const [mounted, setMounted] = useState(false);
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const [searchText, setSearchText] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [activeQRShop, setActiveQRShop] = useState<Shop | null>(null);
  
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setMounted(true);
  }, []);

  const downloadQRCode = () => {
    const canvas = document.getElementById('shop-qr-wrapper')?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.download = `${activeQRShop?.name || 'shop'}-qr.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      messageApi.success("QR Code downloaded!");
    }
  };

  const toggleStatus = (key: string, checked: boolean) => {
    setShops(prev => prev.map(item => 
      item.key === key ? { ...item, status: checked ? 'Active' : 'Inactive' } : item
    ));
    messageApi.info(`Shop status set to ${checked ? 'Active' : 'Inactive'}`);
  };

  const handleAddNew = () => {
    setEditingShop(null);
    setFileList([]);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Shop) => {
    setEditingShop(record);
    setFileList(record.image ? [{ uid: '-1', name: 'image.png', status: 'done', url: record.image }] : []);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    const imageUrl = fileList[0]?.url || fileList[0]?.thumbUrl || '';
    if (editingShop) {
      setShops(prev => prev.map(item => 
        item.key === editingShop.key ? { ...item, ...values, image: imageUrl } : item
      ));
      messageApi.success('Shop details updated');
    } else {
      setShops(prev => [{
        key: `shop-${Date.now()}`,
        status: 'Active',
        ...values,
        image: imageUrl
      }, ...prev]);
      messageApi.success('Shop registered successfully');
    }
    setIsModalOpen(false);
  };

  if (!mounted) return null;

  const filteredData = shops.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.owner.toLowerCase().includes(searchText.toLowerCase()) ||
    item.region.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Shop Identity',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Shop) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar 
            shape="square" size={50} src={record.image}
            icon={!record.image && <ShopOutlined />} 
            style={{ backgroundColor: '#F3E8FF', color: '#7C4DFF', borderRadius: '12px', flexShrink: 0 }} 
          />
          <div className="flex flex-col">
            <Text strong className="text-[15px]">{text}</Text>
            <Text type="secondary" className="text-[12px]">
              <EnvironmentOutlined /> {record.location}, {record.region}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Owner Information',
      dataIndex: 'owner',
      key: 'owner',
      render: (text: string, record: Shop) => (
        <div className="min-w-[150px]">
          <div className="font-medium">{text}</div>
          <div className="text-[12px] text-slate-400 font-medium">
            <PhoneOutlined className="mr-1" />{record.contact}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Shop) => (
        <Space size="middle" className="min-w-[120px]">
          <Tag color={status === 'Active' ? 'success' : 'default'} className="rounded-full px-3 py-0.5 m-0 font-bold border-0">
            {status.toUpperCase()}
          </Tag>
          <Switch 
            size="small" 
            checked={status === 'Active'} 
            onChange={(checked) => toggleStatus(record.key, checked)} 
          />
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: Shop) => (
        <Space className="min-w-[120px]">
          <Tooltip title="QR Profile">
            <Button type="text" shape="circle" icon={<QrcodeOutlined style={{ color: '#7C4DFF' }} />} onClick={() => { setActiveQRShop(record); setIsQRModalOpen(true); }} />
          </Tooltip>
          <Tooltip title="Edit Info">
            <Button type="text" shape="circle" icon={<EditOutlined style={{ color: '#7C4DFF' }} />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="Remove this shop permanently?" onConfirm={() => {
            setShops(prev => prev.filter(i => i.key !== record.key));
            messageApi.success('Shop deleted');
          }} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}>
            <Button type="text" shape="circle" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      {contextHolder}
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Registered Shops</Title>
          <Text type="secondary">Digital identity management for Sri Lankan salon branches.</Text>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Input 
            prefix={<SearchOutlined className="text-slate-400" />} 
            placeholder="Search shops..." 
            size="large"
            className="rounded-xl w-full md:w-72 shadow-sm border-slate-200"
            onChange={e => setSearchText(e.target.value)}
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAddNew} 
            className="bg-[#1A1A1B] hover:bg-black rounded-xl font-bold border-none shadow-md h-12"
          >
            Register Shop
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          pagination={{ pageSize: 8, size: 'small' }} 
          rowKey="key" 
          scroll={{ x: 1000 }} 
          className="custom-table" 
        />
      </Card>

      {/* Register/Edit Modal */}
      <Modal 
        title={editingShop ? "Edit Shop Profile" : "Register New Branch"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        forceRender 
        destroyOnHidden 
        centered 
        width={650}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-2">
          <Form.Item label={<span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Identity Photo</span>}>
            <Upload listType="picture-card" fileList={fileList} onChange={({ fileList }) => setFileList(fileList)} beforeUpload={() => false} maxCount={1}>
              {fileList.length < 1 && <div><PlusOutlined /><div className="mt-1 text-[11px] font-bold">UPLOAD</div></div>}
            </Upload>
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="name" label={<span className="font-bold text-slate-700 text-[11px] uppercase">Shop Name</span>} rules={[{ required: true }]}><Input size="large" className="rounded-xl" placeholder="Mr Polaa Barber Shop" /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="owner" label={<span className="font-bold text-slate-700 text-[11px] uppercase">Owner Name</span>} rules={[{ required: true }]}><Input size="large" className="rounded-xl" placeholder="Nimesh Haththasingha" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="region" label={<span className="font-bold text-slate-700 text-[11px] uppercase">District</span>} rules={[{ required: true }]}>
                <Select size="large" className="rounded-xl" showSearch options={SL_REGIONS.map(r => ({ label: r, value: r }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}><Form.Item name="location" label={<span className="font-bold text-slate-700 text-[11px] uppercase">City</span>} rules={[{ required: true }]}><Input size="large" className="rounded-xl" placeholder="Walasmulla" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}><Form.Item name="contact" label={<span className="font-bold text-slate-700 text-[11px] uppercase">Contact</span>} rules={[{ required: true }]}><Input size="large" className="rounded-xl" placeholder="077xxxxxxx" /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="br" label={<span className="font-bold text-slate-700 text-[11px] uppercase">BR Number</span>} rules={[{ required: true }]}><Input size="large" className="rounded-xl" placeholder="BR-WP-xxxx" /></Form.Item></Col>
          </Row>
          <div className="flex justify-end gap-3 mt-6">
            <Button size="large" className="rounded-xl border-slate-200 font-bold" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" size="large" className="bg-[#7C4DFF] hover:bg-[#6c42e0] border-none font-bold min-w-[140px] rounded-xl h-12 shadow-md shadow-purple-100">Save Shop</Button>
          </div>
        </Form>
      </Modal>

      {/* QR Code Modal */}
      <Modal open={isQRModalOpen} onCancel={() => setIsQRModalOpen(false)} footer={null} centered width={320} styles={{ body: { padding: '32px 24px' } }}>
        <div className="text-center">
          <div id="shop-qr-wrapper" className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <QRCode value={`https://saloonpro.lk/book/${activeQRShop?.key}`} size={200} color="#7C4DFF" bordered={false} />
          </div>
          <Title level={4} className="mt-5 mb-0 font-bold">{activeQRShop?.name}</Title>
          <Text type="secondary" className="block mb-6">{activeQRShop?.region}, Sri Lanka</Text>
          <Button type="primary" icon={<DownloadOutlined />} block onClick={downloadQRCode} className="bg-[#7C4DFF] border-none h-12 rounded-xl font-bold shadow-lg shadow-purple-100">
            Download Image
          </Button>
        </div>
      </Modal>
    </div>
  );
}