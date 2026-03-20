"use client";

import React from 'react';
import { Modal, Button, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false
}: ConfirmationModalProps) {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      zIndex={1050} // FIX: Added a higher zIndex so it ALWAYS sits on top of other modals
      styles={{ body: { padding: '20px 0 0 0' } }}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
          <ExclamationCircleOutlined style={{ fontSize: '24px' }} />
        </div>
        
        <div className="space-y-2 px-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <Text type="secondary" className="block text-sm leading-relaxed">
            {description}
          </Text>
        </div>

        <div className="flex gap-3 w-full pt-4">
          <Button block size="large" onClick={onClose} className="rounded-xl">
            {cancelText}
          </Button>
          <Button 
            block 
            size="large" 
            type="primary" 
            danger={isDanger}
            onClick={onConfirm}
            className={`rounded-xl ${!isDanger && 'bg-[#7C4DFF] hover:bg-[#6c42e0]'}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}