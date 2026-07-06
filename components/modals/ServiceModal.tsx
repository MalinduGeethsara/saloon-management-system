"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider, Switch, Typography } from 'antd';
import { 
  ScissorOutlined, 
  TagOutlined 
} from '@ant-design/icons';
import { ImageUpload } from '@/components/ui/ImageUpload';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: any) => void;
  serviceToEdit?: any;
}

export function ServiceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  serviceToEdit 
}: ServiceModalProps & { onSave: (service: any) => Promise<void> }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Reset or Populate form
  useEffect(() => {
    if (isOpen) {
      if (serviceToEdit) {
        form.setFieldsValue({
          ...serviceToEdit,
          isActive: serviceToEdit.status === 'Active'
        });
        setImageUrl(serviceToEdit.imageUrl || serviceToEdit.image || '');
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, category: 'Service' }); // Default values
        setImageUrl('');
      }
    }
  }, [isOpen, serviceToEdit, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    const serviceData = {
      ...values,
      status: values.isActive ? 'Active' : 'Inactive',
      key: serviceToEdit?.key, 
      imageUrl: imageUrl
    };
    delete serviceData.isActive;
    
    await onSave(serviceData);
    setLoading(false);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
          <ScissorOutlined className="text-[#7C4DFF]" />
          {serviceToEdit ? "Edit Item Details" : "Add New Item"}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 24 }}
      >
        <Row gutter={32}>
          <Col span={10}>
            <Form.Item label="Item Image" style={{ marginBottom: 0 }}>
              <div className="flex justify-center p-4 border-2 border-dashed border-gray-200 bg-slate-50 rounded-xl">
                <ImageUpload 
                  value={imageUrl} 
                  onChange={(url) => {
                    setImageUrl(url);
                    form.setFieldValue('imageUrl', url);
                  }}
                  folder="salon/services"
                />
              </div>
            </Form.Item>
            <Form.Item name="imageUrl" hidden>
              <Input />
            </Form.Item>
          </Col>
          <Col span={14}>
            <Form.Item 
              name="name" 
              label="Item Name" 
              rules={[{ required: true, message: 'Please enter name' }]}
            >
              <Input prefix={<TagOutlined className="text-gray-400" />} placeholder="e.g. Premium Haircut or Hair Gel" size="large" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Select placeholder="Select Category" size="large">
                    <Option value="Service">Service</Option>
                    <Option value="Product">Product</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="price" 
                  label="Price (LKR)" 
                  rules={[{ required: true, message: 'Enter price' }]}
                >
                  <InputNumber 
                    prefix="Rs." 
                    style={{ width: '100%' }} 
                    size="large" 
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item 
              name="duration" 
              label="Duration (Minutes) - Services Only"
            >
              <InputNumber 
                style={{ width: '100%' }} 
                size="large" 
                min={0}
                placeholder="e.g. 30"
              />
            </Form.Item>
          </Col>
        </Row>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center mb-6 mt-2">
          <div>
            <Text strong className="block text-slate-800">Item Status</Text>
            <Text type="secondary" className="text-xs">Turn off to hide from billing/booking menu.</Text>
          </div>
          <Form.Item name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </div>

        <Form.Item name="description" label="Description (Optional)">
          <TextArea rows={3} placeholder="Brief details about the item..." />
        </Form.Item>

        <Divider />

        <div className="flex justify-end gap-3">
          <Button size="large" onClick={onClose} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            loading={loading}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold border-none"
          >
            {serviceToEdit ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}