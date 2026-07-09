"use client";

import React from 'react';
import { Modal, Button, Typography, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  CreditCardOutlined,
  CalendarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface BookingActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onGenerateBill?: (record: any) => void;
  onViewInvoice?: (record: any) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function BookingActionModal({ 
  isOpen, 
  onClose, 
  booking, 
  onAccept, 
  onDecline, 
  onGenerateBill,
  onViewInvoice,
  onDelete,
  canEdit = true,
  canDelete = false
}: BookingActionModalProps) {
  if (!booking) return null;

  const isPending = booking.status === 'Pending' || booking.status === 'PENDING';
  const isConfirmed = booking.status === 'Confirmed' || booking.status === 'CONFIRMED';
  const isCompleted = booking.status === 'Paid' || booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'Cancelled' || booking.status === 'CANCELLED';

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <InfoCircleOutlined className="text-[#7C4DFF]" />
          <span className="font-bold">Booking Actions</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      className="custom-modal rounded-2xl overflow-hidden"
    >
      <div className="py-4">
        {/* Booking Info Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
              <UserOutlined />
            </div>
            <div>
              <Text className="font-bold text-slate-800 text-base">{booking.client || booking.customer?.name || 'Walk-in'}</Text>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <CalendarOutlined /> 
                {booking.date ? dayjs(booking.date).format('MMM DD, YYYY - h:mm A') : 'Unknown Date'}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2 mt-2">
            <Text type="secondary">Status:</Text>
            <Text strong className={isPending ? 'text-amber-500' : isConfirmed ? 'text-blue-500' : isCompleted ? 'text-emerald-500' : 'text-red-500'}>
              {booking.status}
            </Text>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {isPending && canEdit && (
            <>
              <Button 
                type="primary" 
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => { onClose(); onAccept && onAccept(booking.id); }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200 h-12 rounded-xl font-bold text-base"
              >
                Accept Booking
              </Button>
              <Button 
                type="primary" 
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={() => { onClose(); onDecline && onDecline(booking.id); }}
                className="w-full shadow-md h-12 rounded-xl font-bold text-base"
              >
                Decline Booking
              </Button>
            </>
          )}

          {isConfirmed && canEdit && (
            <Button 
              type="primary" 
              size="large"
              icon={<CreditCardOutlined />}
              onClick={() => { onClose(); onGenerateBill && onGenerateBill(booking); }}
              className="w-full bg-[#7C4DFF] hover:bg-[#6c42e0] shadow-md shadow-purple-200 h-12 rounded-xl font-bold text-base"
            >
              Generate Bill & Complete
            </Button>
          )}

          {(isCompleted) && (
            <Button 
              type="primary" 
              size="large"
              icon={<CreditCardOutlined />}
              onClick={() => { onClose(); onViewInvoice && onViewInvoice(booking); }}
              className="w-full bg-slate-800 hover:bg-slate-900 shadow-md h-12 rounded-xl font-bold text-base"
            >
              View Invoice
            </Button>
          )}

          {(isCancelled || (!canEdit && !isCompleted)) && (
            <div className="text-center p-6 bg-slate-50 rounded-xl text-slate-500 font-medium">
              No further actions available for this booking.
            </div>
          )}

          {canDelete && (
            <>
              <Divider className="my-2" />
              <Button 
                danger
                type="text"
                size="large"
                icon={<DeleteOutlined />}
                onClick={() => { onClose(); onDelete && onDelete(booking.id); }}
                className="w-full h-12 rounded-xl font-bold text-base hover:bg-red-50"
              >
                Delete Booking
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
