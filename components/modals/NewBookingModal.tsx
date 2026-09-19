"use client";

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  ConfigProvider,
  Typography
} from 'antd';
import {
  UserOutlined,
  ScissorOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined
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
        serviceIds: [undefined],
        barberId: defaultBarberId || barbers[0]?.id,
        date: initialDate,
        time: initialDate,
      });
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

  // Auto-calculated from whichever services are currently selected — no manual duration entry
  const selectedServiceIds: (string | undefined)[] = Form.useWatch('serviceIds', form) || [];
  const selectedServices = selectedServiceIds
    .map(id => services.find(s => s.id === id))
    .filter(Boolean) as any[];
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  const handleFinish = (values: any) => {
    const startDateTime = values.date
      .hour(values.time.hour())
      .minute(values.time.minute())
      .second(0)
      .toDate();

    const validServiceIds: string[] = (values.serviceIds || []).filter(Boolean);
    const chosenServices = validServiceIds
      .map(id => services.find(s => s.id === id))
      .filter(Boolean) as any[];
    const computedDuration = chosenServices.reduce((sum, s) => sum + (s.duration || 30), 0) || 30;
    const computedAmount = chosenServices.reduce((sum, s) => sum + (s.price || 0), 0);

    const endDateTime = new Date(startDateTime.getTime() + computedDuration * 60000);
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
        serviceIds: validServiceIds,
        amount: computedAmount,
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

          <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-2 block">Services</Text>
          <Form.List name="serviceIds">
            {(fields, { add, remove }) => (
              <div className="mb-4">
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex gap-2 mb-2 items-center">
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[{ required: true, message: 'Select a service' }]}
                      className="mb-0 flex-1"
                    >
                      <Select
                        size="large"
                        suffixIcon={<ScissorOutlined />}
                        placeholder="Select Service"
                        showSearch
                        optionFilterProp="children"
                      >
                        {services.map(s => (
                          <Option key={s.id} value={s.id}>{s.name} — Rs. {s.price} ({s.duration}m)</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    )}
                  </div>
                ))}
                <Button type="dashed" block onClick={() => add()} icon={<PlusOutlined />}>
                  Add Another Service
                </Button>
              </div>
            )}
          </Form.List>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker size="large" format="MMM D, YYYY" className="w-full" suffixIcon={<CalendarOutlined />} />
            </Form.Item>
            <Form.Item name="time" label="Time" rules={[{ required: true }]}>
              <TimePicker size="large" use12Hours format="h:mm a" minuteStep={15} className="w-full" suffixIcon={<ClockCircleOutlined />} />
            </Form.Item>
          </div>

          <div className="mb-4 bg-[#F8F9FF] p-4 rounded-xl border border-[#E2E8F0] flex justify-between items-center">
            <div>
              <span className="text-xs uppercase font-bold text-gray-500 block">Total Duration</span>
              <span className="text-sm font-bold text-[#7C4DFF]">{totalDuration} Minutes</span>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-gray-500 block">Total Price</span>
              <span className="text-sm font-bold text-[#7C4DFF]">Rs. {totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <Button type="primary" htmlType="submit" block size="large" icon={<CheckCircleOutlined />}>Confirm Booking</Button>
        </Form>
      </Modal>
    </ConfigProvider>
  );
}
