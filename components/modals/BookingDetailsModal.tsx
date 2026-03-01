"use client";

import React from 'react';
import { Modal, Button, Descriptions, Tag, Typography, Divider, Space, Popconfirm } from 'antd';
import { 
  UserOutlined, 
  ScissorOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  DeleteOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any; // The event object from FullCalendar
  onCancelBooking: (id: string) => void;
}

export function BookingDetailsModal({ 
  isOpen, 
  onClose, 
  event, 
  onCancelBooking 
}: BookingDetailsModalProps) {
  if (!event) return null;

  // Extract data from FullCalendar event object
  const { title, start, end, extendedProps } = event;
  const { barberName, service, status } = extendedProps || {};

  const handleConfirmCancel = () => {
    onCancelBooking(event.id);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ color: '#7C4DFF' }} />
          <span>Booking Details</span>
        </div>
      }
    >
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{title}</Title>
            <Text type="secondary"><UserOutlined /> Client</Text>
          </div>
          <Tag color={status === 'Confirmed' ? 'green' : 'gold'} style={{ fontSize: 14, padding: '4px 10px' }}>
            {status || 'Scheduled'}
          </Tag>
        </div>

        <Descriptions column={1} bordered size="small" labelStyle={{ width: '120px', fontWeight: 600 }}>
          <Descriptions.Item label={<Space><ScissorOutlined /> Service</Space>}>
            {service || 'General Service'}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><UserOutlined /> Specialist</Space>}>
            <span style={{ color: '#7C4DFF', fontWeight: 600 }}>{barberName || 'Staff Member'}</span>
          </Descriptions.Item>
          <Descriptions.Item label={<Space><CalendarOutlined /> Date</Space>}>
            {dayjs(start).format('dddd, MMMM D, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label={<Space><ClockCircleOutlined /> Time</Space>}>
            {dayjs(start).format('h:mm A')} - {dayjs(end).format('h:mm A')}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={onClose} icon={<CloseOutlined />}>
            Close
          </Button>
          
          <Popconfirm
            title="Cancel Appointment"
            description="Are you sure you want to cancel this booking? This action cannot be undone."
            onConfirm={handleConfirmCancel}
            okText="Yes, Cancel"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button danger type="primary" icon={<DeleteOutlined />}>
              Cancel Booking
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Modal>
  );
}