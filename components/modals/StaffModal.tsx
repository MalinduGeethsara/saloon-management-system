"use client";

import React from 'react';
import { Modal, Button, Form, Input, Select, Divider, Tag, Avatar, Tabs } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, DollarOutlined } from '@ant-design/icons';

const { Option } = Select;

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any; // In a real app, define a proper Staff interface
  mode: 'add' | 'edit';
}

export function StaffModal({ isOpen, onClose, staff, mode }: StaffModalProps) {
  const [form] = Form.useForm();

  // Reset or Set form values when modal opens
  React.useEffect(() => {
    if (isOpen && staff && mode === 'edit') {
      form.setFieldsValue(staff);
    } else {
      form.resetFields();
    }
  }, [isOpen, staff, mode, form]);

  const handleFinish = (values: any) => {
    console.log('Form values:', values);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
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
      <Tabs defaultActiveKey="1" items={[
        {
          key: '1',
          label: 'Profile & Role',
          children: (
            <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                  <Input prefix={<UserOutlined />} placeholder="John Doe" size="large" />
                </Form.Item>
                <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                  <Input prefix={<MailOutlined />} placeholder="john@salon.com" size="large" />
                </Form.Item>
                <Form.Item name="phone" label="Phone Number">
                  <Input prefix={<PhoneOutlined />} placeholder="+94 77 123 4567" size="large" />
                </Form.Item>
                <Form.Item name="branch" label="Assigned Branch">
                  <Select placeholder="Select Branch" size="large">
                    <Option value="Walasmulla">Walasmulla Studio</Option>
                    <Option value="Colombo">Colombo Branch</Option>
                    <Option value="Galle">Galle Branch</Option>
                  </Select>
                </Form.Item>
              </div>

             <Divider titlePlacement="left" style={{ fontSize: '12px', color: '#9ca3af' }}>JOB DETAILS</Divider>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="role" label="Job Role" rules={[{ required: true }]}>
                  <Select placeholder="Select Role" size="large">
                    <Option value="Master Stylist">Master Stylist</Option>
                    <Option value="Senior Barber">Senior Barber</Option>
                    <Option value="Barber">Barber</Option>
                    <Option value="Manager">Manager</Option>
                    <Option value="Receptionist">Receptionist</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="status" label="Employment Status">
                  <Select placeholder="Status" size="large"> {/* <-- FIXED */}
                    <Option value="Active"><Tag color="green">Active</Tag></Option>
                    <Option value="Leave"><Tag color="orange">On Leave</Tag></Option>
                    <Option value="Inactive"><Tag color="red">Inactive</Tag></Option>
                  </Select>
                </Form.Item>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <Button onClick={onClose} size="large">Cancel</Button>
                <Button type="primary" htmlType="submit" size="large" style={{ backgroundColor: '#7C4DFF' }}>
                  Save Changes
                </Button>
              </div>
            </Form>
          )
        },
        {
          key: '2',
          label: 'Payroll & Commission',
          children: (
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="salaryType" label="Salary Structure">
  <               Select size="large">
                    <Option value="Commission">Commission Based</Option>
                    <Option value="Fixed">Fixed Salary</Option>
                    <Option value="Hybrid">Fixed + Commission</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="comm" label="Commission Rate (%)">
                  <Input suffix="%" size="large" />
                </Form.Item>
              </div>
              
              <Form.Item name="baseSalary" label="Base Salary (LKR)">
                <Input prefix="Rs." size="large" />
              </Form.Item>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <SafetyCertificateOutlined style={{ color: '#2563eb', fontSize: '20px', marginTop: '4px' }} />
                <div>
                  <h4 className="font-bold text-blue-900 m-0">Payroll Note</h4>
                  <p className="text-blue-700 text-xs m-0">Changes to commission rates will apply from the next billing cycle automatically.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <Button onClick={onClose} size="large">Cancel</Button>
                <Button type="primary" size="large" style={{ backgroundColor: '#7C4DFF' }}>
                  Update Payroll
                </Button>
              </div>
            </Form>
          )
        }
      ]} />
    </Modal>
  );
}