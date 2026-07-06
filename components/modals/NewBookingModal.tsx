"use client";

import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  TimePicker, 
  Slider, 
  Button, 
  ConfigProvider, 
  Typography, 
  message 
} from 'antd';
import { 
  UserOutlined, 
  ScissorOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

interface Barber {
  id: number;
  name: string;
  color: string;
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: any) => void;
  barbers: Barber[];
  defaultDate?: Date | null;
  defaultBarberId?: number;
}

export function NewBookingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  barbers, 
  defaultDate, 
  defaultBarberId 
}: NewBookingModalProps) {
  const [form] = Form.useForm();
  const [duration, setDuration] = useState(60);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string>('owner');

  useEffect(() => {
    setMounted(true);
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) setUserRole(match[2]);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      form.resetFields();
      const initialDate = defaultDate ? dayjs(defaultDate) : dayjs();
      form.setFieldsValue({
        clientName: '',
        service: 'Haircut',
        barberId: defaultBarberId || barbers[0]?.id,
        date: initialDate,
        time: initialDate,
        duration: 60
      });
      setDuration(60);
    }
  }, [isOpen, defaultDate, defaultBarberId, barbers, form]);

  const handleFinish = (values: any) => {
    const startDateTime = values.date
      .hour(values.time.hour())
      .minute(values.time.minute())
      .second(0)
      .toDate();
    
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    const selectedBarber = barbers.find(b => b.id === values.barberId);

    const newBooking = {
      id: String(Date.now()),
      title: values.clientName,
      start: startDateTime,
      end: endDateTime,
      backgroundColor: selectedBarber?.color || '#1A1A1B',
      borderColor: selectedBarber?.color || '#1A1A1B',
      textColor: '#FFFFFF',
      extendedProps: {
        barberId: values.barberId,
        barberName: selectedBarber?.name,
        service: values.service,
        status: 'Confirmed'
      }
    };

    onSave(newBooking);
    message.success('Appointment scheduled successfully');
    onClose();
  };

  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#7C4DFF',
          borderRadius: 12,
        }
      }}
    >
      <Modal
        title={<div className="flex items-center gap-2"><CalendarOutlined style={{ color: '#7C4DFF' }} /> New Appointment</div>}
        open={isOpen}
        onCancel={onClose}
        footer={null}
        forceRender
        destroyOnHidden // FIX: Replaced destroyOnClose with destroyOnHidden
        centered
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} className="flex flex-col gap-1">
          <div className="bg-[#F8F9FF] p-4 rounded-xl border border-[#E2E8F0] mb-4">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-2 block">Client Details</Text>
            <Form.Item name="clientName" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <Input size="large" placeholder="Client Name" prefix={<UserOutlined />} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="service" label="Service" rules={[{ required: true }]}>
              <Select size="large" suffixIcon={<ScissorOutlined />}>
                <Option value="Haircut">Haircut</Option>
                <Option value="Beard Trim">Beard Trim</Option>
              </Select>
            </Form.Item>
            <Form.Item name="barberId" label="Specialist" rules={[{ required: true }]}>
              <Select size="large" disabled={userRole === 'barber'}>
                {barbers.map(b => (
                  <Option key={b.id} value={b.id}>{b.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker size="large" format="MMM D, YYYY" className="w-full" suffixIcon={<CalendarOutlined />} />
            </Form.Item>
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <TimePicker size="large" use12Hours format="h:mm a" minuteStep={15} className="w-full" suffixIcon={<ClockCircleOutlined />} />
            </Form.Item>
          </div>

          <div className="mb-4 bg-white p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs uppercase font-bold text-gray-500">Duration</span>
              <span className="text-sm font-bold text-[#7C4DFF]">{duration} Minutes</span>
            </div>
            <Form.Item name="duration" style={{ marginBottom: 0 }}>
              <Slider min={15} max={180} step={15} value={duration} onChange={setDuration} />
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" block size="large" icon={<CheckCircleOutlined />}>Confirm Booking</Button>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}