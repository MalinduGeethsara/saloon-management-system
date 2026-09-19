"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, Row, Col } from 'antd';
import dayjs from 'dayjs';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseInput,
  type ExpenseRow,
} from '@/lib/expense-categories';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Resolve true when saved so the modal can close; false keeps it open for corrections
  onSave: (data: ExpenseInput) => Promise<boolean>;
  expenseToEdit?: ExpenseRow | null;
  branches: { id: string; name: string }[];
  // Pre-fills the date for new entries (the month currently being viewed)
  defaultDate?: string;
}

export function ExpenseModal({ isOpen, onClose, onSave, expenseToEdit, branches, defaultDate }: ExpenseModalProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  // The dialog is rendered into a portal that only exists in the browser: rendering it during hydration would not match the server HTML
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (expenseToEdit) {
      form.setFieldsValue({
        category: expenseToEdit.category,
        title: expenseToEdit.title,
        amount: expenseToEdit.amount,
        date: dayjs(expenseToEdit.date),
        supplier: expenseToEdit.supplier ?? undefined,
        shopId: expenseToEdit.shopId ?? undefined,
        note: expenseToEdit.note ?? undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ category: 'STOCK_ORDER', date: defaultDate ? dayjs(defaultDate) : dayjs() });
    }
  }, [isOpen, expenseToEdit, defaultDate, form]);

  const handleFinish = async (values: any) => {
    setSaving(true);
    const ok = await onSave({
      id: expenseToEdit?.id,
      category: values.category,
      title: values.title,
      amount: values.amount,
      date: values.date.format('YYYY-MM-DD'),
      supplier: values.supplier,
      shopId: values.shopId ?? null,
      note: values.note,
    });
    setSaving(false);
    if (ok) onClose();
  };

  if (!mounted) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      forceRender
      centered
      title={expenseToEdit ? 'Edit Expense' : 'Add Expense'}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="category" label="Category" rules={[{ required: true }]}>
              <Select
                size="large"
                options={EXPENSE_CATEGORIES.map(c => ({ value: c, label: EXPENSE_CATEGORY_LABELS[c] }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Choose a date' }]}>
              <DatePicker
                size="large"
                className="w-full"
                allowClear={false}
                disabledDate={(d) => d.isAfter(dayjs(), 'day')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="title"
          label="What was it for?"
          rules={[{ required: true, message: 'Enter a short description' }, { max: 120 }]}
        >
          <Input size="large" placeholder="e.g. Hair gel restock, tea & sugar, electricity bill" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="amount"
              label="Amount (Rs.)"
              rules={[{ required: true, message: 'Enter the amount' }, { type: 'number', min: 0.01, message: 'Must be more than 0' }]}
            >
              <InputNumber size="large" className="w-full" min={0} precision={2} inputMode="decimal" placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="shopId" label="Branch (optional)">
              <Select
                size="large"
                allowClear
                placeholder="All / not branch-specific"
                options={branches.map(b => ({ value: b.id, label: b.name }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="supplier" label="Supplier (optional)" rules={[{ max: 120 }]}>
          <Input size="large" placeholder="Who did you buy from?" />
        </Form.Item>

        <Form.Item name="note" label="Note (optional)" rules={[{ max: 1000 }]}>
          <Input.TextArea rows={3} placeholder="Invoice no., items, anything worth remembering" />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving} className="bg-[#7C4DFF]">
            {expenseToEdit ? 'Update' : 'Save Expense'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
