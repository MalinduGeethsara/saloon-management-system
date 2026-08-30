"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Button, Input } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Option } = Select;
const { TextArea } = Input;

interface StaffMember { id: string; name: string; }

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: any) => void;
  staffList: StaffMember[];
  recordToEdit?: any;
}

export function ManualAttendanceModal({
  isOpen,
  onClose,
  onSave,
  staffList,
  recordToEdit
}: ManualAttendanceModalProps) {
  const [form] = Form.useForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      if (recordToEdit) {
        form.setFieldsValue({
          userId: recordToEdit.userId,
          status: recordToEdit.status,
          date: dayjs(),
          clockIn: recordToEdit.clockIn !== '-' ? dayjs(recordToEdit.clockIn, 'h:mm A') : undefined,
          clockOut: recordToEdit.clockOut !== '-' ? dayjs(recordToEdit.clockOut, 'h:mm A') : undefined,
          reason: 'Correction',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ date: dayjs(), status: 'Present' });
      }
    }
  }, [isOpen, recordToEdit, form, mounted]);

  const handleFinish = (values: any) => {
    const staff = staffList.find(s => s.id === values.userId);
    const record = {
      key: recordToEdit?.key,
      userId: values.userId,
      name: staff?.name || 'Unknown',
      status: values.status,
      clockIn: values.clockIn ? values.clockIn.format('h:mm A') : '-',
      clockOut: values.clockOut ? values.clockOut.format('h:mm A') : '-',
      clockInRaw: values.clockIn ? values.date.format('YYYY-MM-DD') + 'T' + values.clockIn.format('HH:mm:ss') : new Date().toISOString(),
      clockOutRaw: values.clockOut ? values.date.format('YYYY-MM-DD') + 'T' + values.clockOut.format('HH:mm:ss') : null,
      date: values.date.format('YYYY-MM-DD'),
    };
    onSave(record);
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
      title={recordToEdit ? 'Edit Attendance Record' : 'Manual Attendance Entry'}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 20 }}>
        <Form.Item name="userId" label="Staff Member" rules={[{ required: true, message: 'Select a staff member' }]}>
          <Select placeholder="Select Employee" disabled={!!recordToEdit} showSearch optionFilterProp="children">
            {staffList.map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select>
              <Option value="Present">Present</Option>
              <Option value="On Leave">On Leave</Option>
              <Option value="Half Day">Half Day</Option>
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="clockIn" label="Clock In Time">
            <TimePicker use12Hours format="h:mm a" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="clockOut" label="Clock Out Time">
            <TimePicker use12Hours format="h:mm a" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="reason" label={recordToEdit ? 'Reason for Edit' : 'Reason for Manual Entry'}>
          <TextArea rows={2} placeholder="e.g. System error, Forgot ID" />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" style={{ backgroundColor: '#1A1A1B' }}>
            {recordToEdit ? 'Update Record' : 'Save Record'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
