"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider, message } from 'antd';
import { ShoppingOutlined, NumberOutlined, TagOutlined, PlusOutlined } from '@ant-design/icons';
import { ImageUpload } from '@/components/ui/ImageUpload';

const { Option } = Select;
const { TextArea } = Input;

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
        setImageUrl(productToEdit.image || productToEdit.imageUrl || '');
      } else {
        form.resetFields();
        setImageUrl('');
      }
    }
  }, [isOpen, productToEdit, form]);

  const handleFinish = (values: any) => {
    const productData = {
      ...values,
      id: productToEdit?.id || productToEdit?.key,
      status: values.stock > 0 ? (values.stock < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      imageUrl: imageUrl
    };
    onSave(productData);
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
        .product-image-uploader {
          width: 100% !important;
          background-color: #f8fafc;
          border-radius: 12px;
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
              <div className="product-image-uploader flex justify-center p-4 border-2 border-dashed border-gray-200">
                <ImageUpload 
                  value={imageUrl} 
                  onChange={(url) => {
                    setImageUrl(url);
                    form.setFieldValue('imageUrl', url);
                  }}
                  folder="salon/products"
                />
              </div>
            </Form.Item>
            
            {/* Helper Text below image */}
            <div className="text-center mt-2">
              <span className="text-xs text-slate-400">
                Recommended size: 500x500px
              </span>
            </div>

            {/* Hidden Input for Form Logic */}
            <Form.Item name="imageUrl" hidden>
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