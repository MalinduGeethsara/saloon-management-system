"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col } from 'antd';
import { ShopOutlined, UserOutlined, EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons';
import { ImageUpload } from '@/components/ui/ImageUpload';

const { Option } = Select;

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  shopToEdit?: any;
}

export function LocationModal({ isOpen, onClose, onSave, shopToEdit }: LocationModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      if (shopToEdit) {
        form.setFieldsValue(shopToEdit);
        setImageUrl(shopToEdit.image || '');
      } else {
        form.resetFields();
        setImageUrl('');
      }
    }
  }, [isOpen, shopToEdit, form]);

  const handleImageChange = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('imageUrl', url);
  };

  const handleFinish = (values: any) => {
    onSave({
      ...values,
      key: shopToEdit?.key, // Preserve ID if editing
      // Default stats for new shops
      staff: shopToEdit?.staff || 0,
      revenue: shopToEdit?.revenue || 0,
    });
    onClose();
  };

  if (!mounted) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      forceRender
      centered
      title={shopToEdit ? "Edit Location Details" : "Add New Location"}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 20 }}>
        
        <Form.Item label="Cover Image">
          <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200">
            <ImageUpload 
              value={imageUrl} 
              onChange={handleImageChange}
              folder="salon/shops"
            />
          </div>
          <Form.Item name="imageUrl" hidden><Input /></Form.Item>
        </Form.Item>

        <Form.Item name="name" label="Shop Name" rules={[{ required: true }]}>
          <Input prefix={<ShopOutlined />} placeholder="e.g. Kandy Kings" size="large" />
        </Form.Item>

        <Form.Item name="address" label="Address" rules={[{ required: true }]}>
          <Input prefix={<EnvironmentOutlined />} placeholder="Street, City" size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="manager" label="Manager Name" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder="Manager Name" size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
              <Input prefix={<PhoneOutlined />} placeholder="+94..." size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="status" label="Status">
          <Select size="large">
            <Option value="Open">Open</Option>
            <Option value="Closed">Closed</Option>
            <Option value="Renovating">Renovating</Option>
          </Select>
        </Form.Item>

        <div className="flex justify-end gap-3 mt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" className="bg-[#7C4DFF]">
            {shopToEdit ? "Update Location" : "Add Location"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}