"use client";

import React, { useEffect } from 'react';
import { Modal, Button, Form, Input, Select, Divider } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { useAlert } from "@/components/alerts/AlertSystem";

const { Option } = Select;

interface PayrollConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any; 
  onSaveSuccess: () => void;
}

export function PayrollConfigModal({ isOpen, onClose, staff, onSaveSuccess }: PayrollConfigModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (isOpen && staff) {
      form.setFieldsValue({
        salaryType: staff.salaryType || 'Commission',
        baseSalary: staff.basicSalary || 0,
        commissionRate: staff.commissionRate || 0,
      });
    }
  }, [isOpen, staff, form]);

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: staff.key, // employee.key is the db id
          salaryType: values.salaryType,
          baseSalary: values.baseSalary,
          commissionRate: values.commissionRate
        })
      });

      if (res.ok) {
        showAlert('success', 'Payroll structure updated successfully.');
        onSaveSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        showAlert('error', errorData.error || 'Failed to update payroll structure.');
      }
    } catch (e) {
      showAlert('error', 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={500}
      title={
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
            Configure Pay Structure
          </h3>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
            {staff?.name} • {staff?.role}
          </span>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item name="salaryType" label="Salary Structure">
            <Select size="large">
              <Option value="Commission">Commission Based</Option>
              <Option value="Fixed">Fixed Salary</Option>
              <Option value="Hybrid">Fixed + Commission</Option>
            </Select>
          </Form.Item>
          <Form.Item name="commissionRate" label="Commission Rate (%)">
            <Input suffix="%" size="large" type="number" />
          </Form.Item>
        </div>
        
        <Form.Item name="baseSalary" label="Base Salary (LKR)">
          <Input prefix="Rs." size="large" type="number" />
        </Form.Item>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3 mt-4">
          <SafetyCertificateOutlined style={{ color: '#2563eb', fontSize: '20px', marginTop: '4px' }} />
          <div>
            <h4 className="font-bold text-blue-900 m-0 text-sm">Payroll Note</h4>
            <p className="text-blue-700 text-xs m-0">Changes to commission rates will apply instantly to all completed bookings for the currently viewed month.</p>
          </div>
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
