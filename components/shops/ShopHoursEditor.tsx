"use client";

import React, { useState } from 'react';
import { Button, Modal, Form, TimePicker, Switch, Card } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/components/alerts/AlertSystem';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_SCHEDULE = DAYS.reduce((acc, day) => {
  acc[day] = { open: '09:00', close: '18:00', isClosed: day === 'Sunday' };
  return acc;
}, {} as any);

export function ShopHoursEditor({ shop }: { shop: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleEditClick = () => {
    const hours = shop.operatingHours || DEFAULT_SCHEDULE;
    
    // Map to form fields
    const formData: any = {};
    DAYS.forEach(day => {
      formData[`${day}_isClosed`] = hours[day]?.isClosed || false;
      formData[`${day}_time`] = [
        dayjs(hours[day]?.open || '09:00', 'HH:mm'),
        dayjs(hours[day]?.close || '18:00', 'HH:mm')
      ];
    });
    
    form.setFieldsValue(formData);
    setIsOpen(true);
  };

  const handleSave = async (values: any) => {
    const operatingHours: any = {};
    
    DAYS.forEach(day => {
      operatingHours[day] = {
        isClosed: values[`${day}_isClosed`],
        open: values[`${day}_time`]?.[0]?.format('HH:mm') || '09:00',
        close: values[`${day}_time`]?.[1]?.format('HH:mm') || '18:00',
      };
    });

    try {
      const res = await fetch('/api/v1/shops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shop.id, operatingHours })
      });
      
      if (res.ok) {
        showAlert('success', 'Operating hours updated!');
        setIsOpen(false);
        router.refresh(); 
      } else {
        showAlert('error', 'Failed to update hours');
      }
    } catch (e) {
      showAlert('error', 'An error occurred while updating hours');
    }
  };

  return (
    <>
      <Button 
        type="primary" 
        icon={<EditOutlined />} 
        onClick={handleEditClick}
        className="bg-[#7C4DFF] hover:bg-[#6c42e0] border-none rounded-xl font-bold"
      >
        Edit Schedule
      </Button>

      <Modal
        open={isOpen}
        title="Edit 7-Day Operating Schedule"
        onCancel={() => setIsOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-6">
          {DAYS.map(day => (
            <div key={day} className="flex items-center justify-between p-3 mb-2 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-4 w-1/3">
                <Form.Item name={`${day}_isClosed`} valuePropName="checked" className="m-0">
                  <Switch checkedChildren="Closed" unCheckedChildren="Open" />
                </Form.Item>
                <span className="font-bold text-slate-700 w-24">{day}</span>
              </div>
              
              <Form.Item noStyle dependencies={[`${day}_isClosed`]}>
                {({ getFieldValue }) => (
                  <Form.Item 
                    name={`${day}_time`} 
                    className="m-0 flex-1"
                  >
                    <TimePicker.RangePicker 
                      format="HH:mm" 
                      minuteStep={15} 
                      className="w-full"
                      disabled={getFieldValue(`${day}_isClosed`)}
                    />
                  </Form.Item>
                )}
              </Form.Item>
            </div>
          ))}

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setIsOpen(false)} size="large" className="rounded-xl">Cancel</Button>
            <Button type="primary" htmlType="submit" size="large" className="bg-[#7C4DFF] rounded-xl font-bold">Save Schedule</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
