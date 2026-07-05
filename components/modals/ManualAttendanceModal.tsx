"use client";

import React, { useEffect } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Button, Input } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with the plugin to parse "08:30 AM" format
dayjs.extend(customParseFormat);

const { Option } = Select;
const { TextArea } = Input;

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: any) => void;
  staffList: string[];
  recordToEdit?: any; // New prop for editing
}

export function ManualAttendanceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  staffList,
  recordToEdit 
}: ManualAttendanceModalProps) {
  const [form] = Form.useForm();

  // Populate form when modal opens or recordToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (recordToEdit) {
        // Parse the existing data into Dayjs objects for Ant Design inputs
        form.setFieldsValue({
          name: recordToEdit.name,
          status: recordToEdit.status,
          date: dayjs(), // Assuming current date for demo, or parse record date if available
          clockIn: recordToEdit.clockIn !== '-' ? dayjs(recordToEdit.clockIn, 'h:mm A') : undefined,
          clockOut: recordToEdit.clockOut !== '-' ? dayjs(recordToEdit.clockOut, 'h:mm A') : undefined,
          reason: "Correction", // Default reason for edits
        });
      } else {
        form.resetFields(); // Clear form for "Add New" mode
        form.setFieldsValue({
          date: dayjs(),
          status: 'Present'
        });
      }
    }
  }, [isOpen, recordToEdit, form]);

  const handleFinish = (values: any) => {
    const newRecord = {
      // Preserve ID if editing, otherwise allow parent to generate one
      key: recordToEdit?.key, 
      name: values.name,
      shop: "Walasmulla", 
      status: values.status,
      clockIn: values.clockIn ? values.clockIn.format('h:mm A') : '-',
      clockOut: values.clockOut ? values.clockOut.format('h:mm A') : '-',
      date: values.date.format('YYYY-MM-DD'),
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      title={recordToEdit ? "Edit Attendance Record" : "Manual Attendance Entry"}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: 20 }}
      >
        <Form.Item name="name" label="Staff Member" rules={[{ required: true }]}>
          <Select placeholder="Select Employee" disabled={!!recordToEdit}> 
            {/* Disable name change in edit mode if desired */}
            {staffList.map(name => (
              <Option key={name} value={name}>{name}</Option>
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

        <Form.Item name="reason" label={recordToEdit ? "Reason for Edit" : "Reason for Manual Entry"}>
          <TextArea rows={2} placeholder="e.g. System error, Forgot ID" />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" style={{ backgroundColor: '#1A1A1B' }}>
            {recordToEdit ? "Update Record" : "Save Record"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}