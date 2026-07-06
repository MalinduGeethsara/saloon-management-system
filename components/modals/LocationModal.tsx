"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Upload, message, Row, Col } from 'antd';
import { ShopOutlined, UserOutlined, EnvironmentOutlined, PhoneOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { RcFile, UploadChangeParam, UploadFile, UploadProps } from 'antd/es/upload';

const { Option } = Select;

// --- Helpers ---
const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

const beforeUpload = (file: RcFile) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) message.error('You can only upload JPG/PNG file!');
  return isJpgOrPng;
};

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

  // Dummy upload request
  const dummyRequest = ({ onSuccess }: any) => setTimeout(() => onSuccess("ok"), 0);

  const handleImageChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') { setLoading(true); return; }
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj as RcFile, (url) => {
        setLoading(false);
        setImageUrl(url);
        form.setFieldValue('image', url);
      });
    }
  };

  const handleFinish = (values: any) => {
    onSave({
      ...values,
      key: shopToEdit?.key, // Preserve ID if editing
      image: imageUrl || 'https://via.placeholder.com/800x400?text=Shop+Image',
      // Default stats for new shops
      staff: shopToEdit?.staff || 0,
      revenue: shopToEdit?.revenue || 0,
    });
    onClose();
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

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
          <Upload
            name="avatar"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            customRequest={dummyRequest}
            beforeUpload={beforeUpload}
            onChange={handleImageChange}
            style={{ width: '100%' }}
          >
            {imageUrl ? <img src={imageUrl} alt="shop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : uploadButton}
          </Upload>
          <Form.Item name="image" hidden><Input /></Form.Item>
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