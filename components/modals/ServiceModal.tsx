"use client";

import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, Row, Col, Divider } from 'antd';
import { 
  ScissorOutlined, 
  DollarOutlined, 
  ClockCircleOutlined, 
  TagOutlined 
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

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
}: ServiceModalProps) {
  const [form] = Form.useForm();

  // Reset or Populate form
  useEffect(() => {
    if (isOpen) {
      if (serviceToEdit) {
        form.setFieldsValue(serviceToEdit);
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'Active', duration: 30 }); // Defaults
      }
    }
  }, [isOpen, serviceToEdit, form]);

  const handleFinish = (values: any) => {
    const serviceData = {
      ...values,
      key: serviceToEdit?.key, // Preserve ID if editing
    };
    onSave(serviceData);
    onClose();
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
          {serviceToEdit ? "Edit Service Details" : "Add New Service"}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 24 }}
      >
        <Form.Item 
          name="name" 
          label="Service Name" 
          rules={[{ required: true, message: 'Please enter service name' }]}
        >
          <Input prefix={<TagOutlined className="text-gray-400" />} placeholder="e.g. Premium Haircut" size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select placeholder="Select Category" size="large">
                <Option value="Hair">Hair</Option>
                <Option value="Beard">Beard</Option>
                <Option value="Face">Face/Skin</Option>
                <Option value="Package">Full Package</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Status">
              <Select size="large">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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
          <Col span={12}>
            <Form.Item 
              name="duration" 
              label="Duration (Mins)" 
              rules={[{ required: true, message: 'Enter duration' }]}
            >
              <InputNumber 
                prefix={<ClockCircleOutlined className="text-gray-400" />}
                style={{ width: '100%' }} 
                size="large" 
                min={5} 
                step={5}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Description (Optional)">
          <TextArea rows={3} placeholder="Brief details about the service..." />
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
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold border-none"
          >
            {serviceToEdit ? "Update Service" : "Add Service"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}