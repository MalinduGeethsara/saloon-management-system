import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, Input, Select, Alert } from 'antd';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  remainingLeaves: number;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  remainingLeaves 
}) => {
  const [form] = Form.useForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset the form every time the modal opens
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, form]);

  const handleSubmit = () => {
    // Validates that the form is filled out BEFORE sending the data back
    // to the parent page to trigger the Confirmation Modal
    form.validateFields().then(values => {
      onSave(values);
    });
  };

  if (!mounted) return null;

  return (
    <Modal
      title={<span className="font-bold text-xl">Apply for Leave</span>}
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Submit Application"
      okButtonProps={{ className: "bg-[#7C4DFF] rounded-lg font-bold h-10 shadow-md border-none" }}
      cancelButtonProps={{ className: "rounded-lg font-bold h-10" }}
      forceRender
      destroyOnHidden 
    >
      {remainingLeaves <= 0 && (
        <Alert 
          message={<span className="font-bold text-red-700">Leave Limit Exceeded</span>}
          description="You have 0 remaining leaves. Further applications will incur a Rs. 1,000 salary penalty per day." 
          type="error" 
          className="mb-6 rounded-xl border-red-200 bg-red-50" 
          showIcon 
        />
      )}
      
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item 
          name="leaveType" 
          label={<span className="font-semibold text-slate-700">Leave Type</span>} 
          rules={[{ required: true, message: 'Please select a leave type' }]}
        >
          <Select 
            size="large"
            placeholder="Select leave type"
            className="rounded-xl"
            options={[
              { value: 'Sick Leave', label: 'Sick Leave' },
              { value: 'Casual Leave', label: 'Casual Leave' },
              { value: 'Annual Leave', label: 'Annual Leave' },            ]}
          />
        </Form.Item>

        <Form.Item 
          name="dates" 
          label={<span className="font-semibold text-slate-700">Select Dates</span>} 
          rules={[{ required: true, message: 'Please select leave dates' }]}
        >
          <RangePicker className="w-full rounded-xl h-12" />
        </Form.Item>

        <Form.Item 
          name="reason" 
          label={<span className="font-semibold text-slate-700">Reason for Leave</span>} 
          rules={[{ required: true, message: 'Reason is required' }]}
        >
          <TextArea rows={4} className="rounded-xl p-3" placeholder="Briefly explain your reason..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};