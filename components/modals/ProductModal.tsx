"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider, Image } from 'antd';
import { ShoppingOutlined, NumberOutlined, TagOutlined, LinkOutlined } from '@ant-design/icons';

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
  const [previewImage, setPreviewImage] = useState<string>('');

  // Reset or Populate form
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        form.setFieldsValue(productToEdit);
        setPreviewImage(productToEdit.image || '');
      } else {
        form.resetFields();
        setPreviewImage('');
      }
    }
  }, [isOpen, productToEdit, form]);

  const handleFinish = (values: any) => {
    const productData = {
      ...values,
      key: productToEdit?.key,
      status: values.stock > 0 ? (values.stock < 10 ? 'Low Stock' : 'In Stock') : 'Out of Stock',
      // If no image provided, use a default placeholder
      image: values.image || 'https://via.placeholder.com/150?text=No+Image'
    };
    onSave(productData);
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewImage(e.target.value);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={700}
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <ShoppingOutlined className="text-[#7C4DFF]" />
          {productToEdit ? "Edit Product Details" : "Add New Product"}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 24 }}
      >
        <Row gutter={24}>
          {/* Left Column: Image Preview & URL */}
          <Col span={8}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-full aspect-square bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                {previewImage ? (
                  <Image 
                    src={previewImage} 
                    alt="Preview" 
                    width="100%" 
                    height="100%" 
                    style={{ objectFit: 'cover' }} 
                    fallback="https://via.placeholder.com/150?text=Error"
                  />
                ) : (
                  <span className="text-slate-400 text-xs">No Image Preview</span>
                )}
              </div>
              <Form.Item 
                name="image" 
                label="Image URL" 
                style={{ width: '100%' }}
                rules={[{ type: 'url', message: 'Enter a valid URL' }]}
              >
                <Input 
                  prefix={<LinkOutlined className="text-gray-400" />} 
                  placeholder="https://..." 
                  onChange={handleImageChange} 
                />
              </Form.Item>
            </div>
          </Col>

          {/* Right Column: Details */}
          <Col span={16}>
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
                  <Input placeholder="e.g. Suavecito" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Select placeholder="Select">
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
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="sku" label="SKU / Barcode">
              <Input prefix={<NumberOutlined className="text-gray-400" />} placeholder="Auto-generated if empty" />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0 24px 0' }} />

        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Product details..." />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-4">
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