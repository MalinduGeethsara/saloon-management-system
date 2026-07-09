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
  id: string;
  name: string;
  color: string;
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: any) => void;
  barbers: Barber[];
  defaultDate?: Date | null;
  defaultBarberId?: string;
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
        service: undefined,
        barberId: defaultBarberId || barbers[0]?.id,
        date: initialDate,
        time: initialDate,
        duration: 60
      });
      setDuration(60);
    }
  }, [isOpen, defaultDate, defaultBarberId, barbers, form]);

  const [services, setServices] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/v1/services')
        .then(res => res.json())
        .then(data => {
          if (data.services) setServices(data.services);
        })
        .catch(console.error);

      fetch('/api/v1/shops')
        .then(res => res.json())
        .then(data => {
          if (data.shops) setShops(data.shops);
        })
        .catch(console.error);

      fetch('/api/v1/staff')
        .then(res => res.json())
        .then(data => {
          if (data.staff) setStaffList(data.staff);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const getActiveBarbers = (shopId?: string) => {
    if (staffList.length > 0) {
      return staffList
        .filter(s => s.role === 'BARBER' || s.role === 'MANAGER')
        .filter(s => !shopId || s.shopId === shopId)
        .map(s => ({ id: s.id, name: s.name, color: '#7C4DFF' }));
    }
    return barbers;
  };

  const handleFinish = (values: any) => {
    const startDateTime = values.date
      .hour(values.time.hour())
      .minute(values.time.minute())
      .second(0)
      .toDate();
    
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
    const currentBarbers = getActiveBarbers(values.shopId);
    const selectedBarber = currentBarbers.find(b => b.id === values.barberId);

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
        shopId: values.shopId,
        status: 'Confirmed'
      }
    };

    onSave(newBooking);
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
          
          <Form.Item name="shopId" label="Branch Location" rules={[{ required: true }]}>
            <Select placeholder="Select Branch" size="large" onChange={() => form.setFieldsValue({ barberId: undefined })}>
              {shops.map(shop => (
                <Option key={shop.id} value={shop.id}>{shop.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="service" label="Service" rules={[{ required: true }]}>
              <Select size="large" suffixIcon={<ScissorOutlined />} placeholder="Select Service">
                {services.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item noStyle dependencies={['shopId']}>
              {({ getFieldValue }) => {
                const currentShopId = getFieldValue('shopId');
                const filteredBarbers = getActiveBarbers(currentShopId);
                return (
                  <Form.Item name="barberId" label="Specialist" rules={[{ required: true }]}>
                    <Select size="large" disabled={userRole === 'barber'} placeholder="Select Specialist">
                      {filteredBarbers.map((b: any) => (
                        <Option key={b.id} value={b.id}>{b.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }}
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