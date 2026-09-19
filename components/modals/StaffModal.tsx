"use client";

import React from 'react';
import { Modal, Button, Form, Input, Select, Divider, Tag, Avatar, Tabs, AutoComplete } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, DollarOutlined } from '@ant-design/icons';
import { ImageUpload } from '@/components/ui/ImageUpload';

const { Option } = Select;

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any; // In a real app, define a proper Staff interface
  mode: 'add' | 'edit';
}

export function StaffModal({ isOpen, onClose, staff, mode, onSave }: StaffModalProps & { onSave: (values: any) => Promise<void> }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState<string>('');
  const [shops, setShops] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/v1/shops').then(res => res.json()).then(data => {
      if (data.shops) setShops(data.shops);
    });
  }, []);

  React.useEffect(() => {
    if (isOpen && staff && mode === 'edit') {
      form.setFieldsValue({
        ...staff,
        password: '' // empty password on edit unless they want to change it
      });
      setImageUrl(staff.imageUrl || '');
    } else if (isOpen && mode === 'add') {
      form.resetFields();
      setImageUrl('');
    }
  }, [isOpen, staff, mode, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    await onSave({ ...values, imageUrl });
    setLoading(false);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={650}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ backgroundColor: '#7C4DFF' }} icon={<UserOutlined />} />
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              {mode === 'add' ? 'Add New Staff Member' : staff?.name}
            </h3>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
              {mode === 'add' ? 'Enter staff details below' : staff?.role}
            </span>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 16 }}>
                <div style={{ width: 120 }}>
                  <Form.Item label="Profile Photo" style={{ marginBottom: 0 }}>
                    <div className="flex justify-center border-2 border-dashed border-gray-200 bg-slate-50 rounded-xl overflow-hidden w-[120px] h-[120px]">
                      <ImageUpload 
                        value={imageUrl} 
                        onChange={(url) => {
                          setImageUrl(url);
                          form.setFieldValue('imageUrl', url);
                        }}
                        folder="salon/staff"
                      />
                    </div>
                  </Form.Item>
                  <Form.Item name="imageUrl" hidden><Input /></Form.Item>
                </div>
                
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                    <Input prefix={<UserOutlined />} placeholder="John Doe" size="large" />
                  </Form.Item>
                  <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<MailOutlined />} placeholder="john@salon.com" size="large" />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Form.Item name="phone" label="Phone Number">
                  <Input prefix={<PhoneOutlined />} placeholder="+94 77 123 4567" size="large" />
                </Form.Item>
                <Form.Item name="shopId" label="Assigned Branch" rules={[{ required: true, message: 'Please select a branch' }]}>
                  <Select placeholder="Select Branch" size="large" allowClear>
                    {shops.map(shop => (
                      <Option key={shop.id} value={shop.id}>{shop.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

             <Divider titlePlacement="left" style={{ fontSize: '12px', color: '#9ca3af' }}>JOB DETAILS</Divider>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Form.Item name="role" label="Job Role" rules={[{ required: true }]}>
                  <AutoComplete 
                    options={[{ value: 'MANAGER' }, { value: 'BARBER' }, { value: 'CASHIER' }]}
                    placeholder="e.g. CASHIER, RECEPTIONIST"
                    size="large"
                    filterOption={(inputValue, option) =>
                      option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </Form.Item>
                <Form.Item name="password" label="Password (leave blank to keep)">
                  <Input.Password placeholder="Secure password" size="large" />
                </Form.Item>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <Button onClick={onClose} size="large">Cancel</Button>
                <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ backgroundColor: '#7C4DFF' }}>
                  Save Changes
                </Button>
              </div>
            </Form>
    </Modal>
  );
}