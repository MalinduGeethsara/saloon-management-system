"use client";

import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker } from 'antd';
import dayjs from 'dayjs';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  paymentToEdit?: any; // <--- This solves your error
}

export const PaymentModal = ({ isOpen, onClose, onSave, paymentToEdit }: PaymentModalProps) => {
  const [form] = Form.useForm();

  // Watch for changes to 'isOpen' or 'paymentToEdit'
  useEffect(() => {
    if (isOpen) {
      if (paymentToEdit) {
        // EDIT MODE: Fill form with existing data
        form.setFieldsValue({
          ...paymentToEdit,
          // Convert string date back to Dayjs object for the DatePicker
          date: paymentToEdit.date ? dayjs(paymentToEdit.date) : dayjs(),
        });
      } else {
        // ADD MODE: Clear form and set defaults
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          status: 'Paid',
          method: 'Cash',
          // Auto-generate a random ID for new entries
          id: `INV-${Math.floor(1000 + Math.random() * 9000)}` 
        });
      }
    }
  }, [isOpen, paymentToEdit, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      const formattedData = {
        ...values,
        // Convert Dayjs object back to string for storage
        date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        // Keep the original key if we are editing!
        key: paymentToEdit ? paymentToEdit.key : null, 
      };
      
      onSave(formattedData);
      onClose();
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  return (
    <Modal
      title={paymentToEdit ? "Edit Payment" : "New Payment"}
      open={isOpen}
      onOk={handleOk}
      onCancel={onClose}
      okText={paymentToEdit ? "Update Payment" : "Save Record"}
      okButtonProps={{ style: { backgroundColor: '#7C4DFF' } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: 'Paid', method: 'Cash' }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item 
            name="id" 
            label="Invoice ID" 
            rules={[{ required: true, message: 'Please enter ID' }]}
          >
            <Input placeholder="INV-0000" />
          </Form.Item>

          <Form.Item 
            name="date" 
            label="Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
        </div>

        <Form.Item 
          name="client" 
          label="Client Name" 
          rules={[{ required: true, message: 'Please enter client name' }]}
        >
          <Input placeholder="Ex: Kamal Perera" />
        </Form.Item>

        <Form.Item 
          name="service" 
          label="Service/Product" 
          rules={[{ required: true, message: 'Please enter service' }]}
        >
          <Input placeholder="Ex: Haircut + Beard Trim" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item 
            name="amount" 
            label="Amount (Rs)" 
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              formatter={value => `Rs. ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(displayValue) => displayValue?.replace(/Rs\.\s?|(,*)/g, '') as unknown as number}
            />
          </Form.Item>

          <Form.Item name="method" label="Payment Method">
            <Select>
              <Select.Option value="Cash">Cash</Select.Option>
              <Select.Option value="Card">Card</Select.Option>
              <Select.Option value="Transfer">Transfer</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="status" label="Payment Status">
          <Select>
            <Select.Option value="Paid">Paid</Select.Option>
            <Select.Option value="Pending">Pending</Select.Option>
            <Select.Option value="Refunded">Refunded</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};