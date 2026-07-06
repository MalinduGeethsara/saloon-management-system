"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider, Upload, message } from 'antd';
import { ShoppingOutlined, NumberOutlined, TagOutlined, PlusOutlined, LoadingOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { UploadChangeParam } from 'antd/es/upload';

const { Option } = Select;
const { TextArea } = Input;

// --- Helper: Convert Image to Base64 ---
const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

// --- Helper: Validate File ---
const beforeUpload = (file: RcFile) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('You can only upload JPG/PNG file!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Image must be smaller than 2MB!');
  }
  return isJpgOrPng && isLt2M;
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  productToEdit?: any;
}

export function ProductModal({ 
  isOpen, 
  onClose, 
  onSave, 
  productToEdit 
}: ProductModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset or Populate form
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      if (productToEdit) {
        form.setFieldsValue(productToEdit);
        setImageUrl(productToEdit.image || '');
      } else {
        form.resetFields();
        setImageUrl('');
      }
    }
  }, [isOpen, productToEdit, form]);

  // FIX: Custom Request to Simulate Upload
  const dummyRequest = ({ file, onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  // Handle Upload Change
  const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj as RcFile, (url) => {
        setLoading(false);
        setImageUrl(url);
        form.setFieldValue('image', url);
      });
    }
  };

  const handleFinish = (values: any) => {
    const productData = {
      ...values,
      key: productToEdit?.key,
      status: values.stock > 0 ? (values.stock < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      image: imageUrl || 'https://via.placeholder.com/150?text=No+Image'
    };
    onSave(productData);
    onClose();
  };

  // Large Upload Button UI
  const uploadButton = (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
      {loading ? <LoadingOutlined style={{ fontSize: 24 }} /> : <CloudUploadOutlined style={{ fontSize: 32 }} />}
      <div style={{ marginTop: 12, fontWeight: 500 }}>
        {loading ? 'Uploading...' : 'Click to Upload Image'}
      </div>
      <div className="text-xs mt-1 text-slate-300">JPG or PNG (Max 2MB)</div>
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
      width={800} // Increased width for better layout
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <ShoppingOutlined className="text-[#7C4DFF]" />
          {productToEdit ? "Edit Product Details" : "Add New Product"}
        </div>
      }
    >
      {/* Custom Style to Override Ant Design Upload Size */}
      <style jsx global>{`
        .product-image-uploader .ant-upload.ant-upload-select {
          width: 100% !important;
          height: 250px !important; /* Increased Height */
          background-color: #f8fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          transition: border-color 0.3s;
        }
        .product-image-uploader .ant-upload.ant-upload-select:hover {
          border-color: #7C4DFF;
        }
      `}</style>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 24 }}
      >
        <Row gutter={32}>
          
          {/* Left Column: LARGE Image Uploader */}
          <Col span={10}>
            <Form.Item label="Product Image" style={{ marginBottom: 0 }}>
              <Upload
                name="avatar"
                listType="picture-card"
                className="product-image-uploader"
                showUploadList={false}
                customRequest={dummyRequest}
                beforeUpload={beforeUpload}
                onChange={handleChange}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="product" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain', // Ensures whole image is seen
                      padding: 8,
                      borderRadius: 12
                    }} 
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            </Form.Item>
            
            {/* Helper Text below image */}
            <div className="text-center mt-2">
              <span className="text-xs text-slate-400">
                Recommended size: 500x500px
              </span>
            </div>

            {/* Hidden Input for Form Logic */}
            <Form.Item name="image" hidden>
              <Input />
            </Form.Item>
          </Col>

          {/* Right Column: Details */}
          <Col span={14}>
            <Form.Item 
              name="name" 
              label="Product Name" 
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input prefix={<TagOutlined className="text-gray-400" />} placeholder="e.g. Matte Clay" size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="brand" 
                  label="Brand" 
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input placeholder="e.g. Suavecito" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Select placeholder="Select" size="large">
                    <Option value="Hair Care">Hair Care</Option>
                    <Option value="Beard Care">Beard Care</Option>
                    <Option value="Shaving">Shaving</Option>
                    <Option value="Equipment">Equipment</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="price" 
                  label="Price (Rs)" 
                  rules={[{ required: true }]}
                >
                  <InputNumber 
                    prefix="Rs." 
                    style={{ width: '100%' }} 
                    min={0}
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="stock" 
                  label="Stock" 
                  rules={[{ required: true }]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0} 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="sku" label="SKU / Barcode">
              <Input prefix={<NumberOutlined className="text-gray-400" />} placeholder="Auto-generated if empty" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0' }} />

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Product details..." />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button size="large" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold"
          >
            {productToEdit ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}