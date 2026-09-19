"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  ConfigProvider,
  Typography
} from 'antd';
import {
  UserOutlined,
  ScissorOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getBookedSlots } from '@/lib/actions/booking';
import {
  DEFAULT_SLOT_MINUTES,
  SLOT_GRID,
  isShopOpenOnDay,
  isShopTemporarilyClosed,
  parseBookingDateTime,
  shopClosedReason,
  summarizeOpeningHours,
} from '@/lib/services/booking-slots';

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

// The free times, as buttons: only what can really be booked is offered
function SlotPicker({ value, onChange, slots }: { value?: string; onChange?: (v: string) => void; slots: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Free times">
      {slots.map((label) => (
        <Button
          key={label}
          size="large"
          role="radio"
          aria-checked={value === label}
          type={value === label ? 'primary' : 'default'}
          onClick={() => onChange?.(label)}
          style={{ height: 46, fontWeight: 600 }}
        >
          {label}
        </Button>
      ))}
    </div>
  );
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
    if (match) setUserRole(decodeURIComponent(match[2]).toLowerCase());
  }, []);

  const [services, setServices] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [booked, setBooked] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      form.resetFields();
      form.setFieldsValue({
        clientName: '',
        serviceIds: [undefined],
        barberId: defaultBarberId || undefined,
        date: defaultDate ? dayjs(defaultDate) : dayjs(),
        time: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultDate, defaultBarberId, form, mounted]);

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

  const shopId: string | undefined = Form.useWatch('shopId', form);
  const barberId: string | undefined = Form.useWatch('barberId', form);
  const date: Dayjs | undefined = Form.useWatch('date', form);
  const time: string | undefined = Form.useWatch('time', form);
  const shop = shops.find(s => s.id === shopId) || null;
  const dateStr = date ? date.format('YYYY-MM-DD') : '';
  const visitMinutes = totalDuration || DEFAULT_SLOT_MINUTES;

  // Only one branch: no need to choose it
  useEffect(() => {
    if (isOpen && shops.length === 1 && !form.getFieldValue('shopId')) form.setFieldsValue({ shopId: shops[0].id });
  }, [isOpen, shops, form]);

  // Only one person to choose from: choose them
  useEffect(() => {
    if (!isOpen || !shopId) return;
    const options = getActiveBarbers(shopId);
    const current = form.getFieldValue('barberId');
    if (options.length === 1 && current !== options[0].id) form.setFieldsValue({ barberId: options[0].id });
    else if (current && !options.some(o => o.id === current)) form.setFieldsValue({ barberId: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, shopId, staffList]);

  // Closed days can't be picked; if the date is a closed day (e.g. today is Sunday) move to the next open one
  const dayIsClosed = (d: Dayjs) => !!shop && (isShopTemporarilyClosed(shop) || !isShopOpenOnDay(shop, d.toDate()));
  useEffect(() => {
    if (!isOpen || !shop || !date) return;
    if (!dayIsClosed(date)) return;
    let next = date;
    for (let i = 0; i < 14 && dayIsClosed(next); i++) next = next.add(1, 'day');
    if (!dayIsClosed(next)) form.setFieldsValue({ date: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, shop, dateStr]);

  // What the specialist already has on that day (the same source the website booking uses)
  const seq = useRef(0);
  useEffect(() => {
    if (!isOpen || !barberId || !dateStr) { setBooked([]); return; }
    const mine = ++seq.current;
    setLoadingSlots(true);
    getBookedSlots(barberId, dateStr, visitMinutes)
      .then((list) => { if (mine === seq.current) setBooked(list || []); })
      .catch(() => { if (mine === seq.current) setBooked([]); })
      .finally(() => { if (mine === seq.current) setLoadingSlots(false); });
  }, [isOpen, barberId, dateStr, visitMinutes]);

  // The times that can really be booked: not taken, not already past, and the branch is open for the whole visit
  const { free, dayMessage } = useMemo(() => {
    if (!shop || !dateStr) return { free: [] as string[], dayMessage: '' };
    const noon = parseBookingDateTime(dateStr, '12:00 PM');
    if (noon && (isShopTemporarilyClosed(shop) || !isShopOpenOnDay(shop, noon))) {
      return { free: [] as string[], dayMessage: shopClosedReason(shop, noon, 0) || 'This branch is closed that day.' };
    }
    const now = Date.now();
    const list = SLOT_GRID.filter((label) => {
      const start = parseBookingDateTime(dateStr, label);
      if (!start || start.getTime() <= now) return false;
      if (booked.includes(label)) return false;
      return !shopClosedReason(shop, start, visitMinutes);
    });
    return { free: list, dayMessage: '' };
  }, [shop, dateStr, booked, visitMinutes]);

  // A time that stopped being free (other date/specialist/services) is dropped instead of silently kept
  useEffect(() => {
    if (time && !free.includes(time) && !loadingSlots) form.setFieldsValue({ time: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [free, loadingSlots]);

  const handleFinish = (values: any) => {
    const startDateTime = parseBookingDateTime(values.date.format('YYYY-MM-DD'), values.time);
    if (!startDateTime) return;

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

  const slotHelp = !shop
    ? 'Choose the branch first.'
    : !barberId
      ? 'Choose the specialist to see their free times.'
      : dayMessage
        ? dayMessage
        : loadingSlots
          ? 'Checking the diary…'
          : free.length === 0
            ? 'No free time left that day for this specialist. Try another date or another specialist.'
            : '';

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
        styles={{ body: { maxHeight: '80dvh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} className="flex flex-col gap-1">
          <div className="bg-[#F8F9FF] p-4 rounded-xl border border-[#E2E8F0] mb-4">
            <Text type="secondary" className="text-xs uppercase font-bold tracking-wider mb-2 block">Client Details</Text>
            <Form.Item name="clientName" rules={[{ required: true, message: 'Enter the client name' }]} style={{ marginBottom: 0 }}>
              <Input size="large" placeholder="Client Name" prefix={<UserOutlined />} />
            </Form.Item>
          </div>

          <Form.Item name="shopId" label="Branch Location" rules={[{ required: true, message: 'Choose the branch' }]}>
            <Select placeholder="Select Branch" size="large" onChange={() => form.setFieldsValue({ barberId: undefined, time: undefined })}>
              {shops.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
          {shop && <div className="text-xs text-slate-500 -mt-3 mb-3">Open: {summarizeOpeningHours(shop)}</div>}

          <Form.Item noStyle dependencies={['shopId']}>
            {({ getFieldValue }) => {
              const currentShopId = getFieldValue('shopId');
              const filteredBarbers = getActiveBarbers(currentShopId);
              return (
                <Form.Item name="barberId" label="Specialist" rules={[{ required: true, message: 'Choose the specialist' }]}>
                  <Select size="large" disabled={userRole === 'barber'} placeholder="Select Specialist" onChange={() => form.setFieldsValue({ time: undefined })}>
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

          <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Pick the date' }]}>
            <DatePicker
              size="large"
              format="ddd, MMM D, YYYY"
              className="w-full"
              suffixIcon={<CalendarOutlined />}
              allowClear={false}
              inputReadOnly
              disabledDate={(d) => d.isBefore(dayjs(), 'day') || dayIsClosed(d)}
              onChange={() => form.setFieldsValue({ time: undefined })}
            />
          </Form.Item>

          <Form.Item
            name="time"
            label={<span>Time <span className="font-normal text-slate-400">(only free times are shown)</span></span>}
            rules={[{ required: true, message: 'Pick one of the free times' }]}
            extra={slotHelp ? <span className="text-amber-600">{slotHelp}</span> : undefined}
          >
            <SlotPicker slots={free} />
          </Form.Item>

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
