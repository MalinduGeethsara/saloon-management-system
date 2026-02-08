"use client";

import React, { useRef } from 'react';
import { Modal, Button, Descriptions, Tag, Divider, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export const InvoiceModal = ({ isOpen, onClose, data }: InvoiceModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handlePrint = () => {
    // Simple print logic for the modal content
    const content = printRef.current?.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    if (printWindow && content) {
      printWindow.document.write('<html><head><title>Print Invoice</title>');
      // Add some basic styles for the print window
      printWindow.document.write(`
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .invoice-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .invoice-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total { font-weight: bold; font-size: 18px; margin-top: 10px; border-top: 2px solid #000; padding-top: 10px; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(content);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Invoice #{data.id}</span>
          <Tag color={data.status === 'Paid' ? 'green' : 'gold'}>{data.status}</Tag>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={500}
      centered
      // --- FIX: Custom Footer for Equal Button Sizes ---
      footer={[
        <Button 
          key="close" 
          onClick={onClose}
          style={{ height: '40px', minWidth: '120px' }} // Matching size
        >
          Close
        </Button>,
        <Button 
          key="print" 
          type="primary" 
          onClick={handlePrint}
          icon={<PrinterOutlined />}
          style={{ height: '40px', minWidth: '120px', backgroundColor: '#7C4DFF' }} // Matching size
        >
          Print Invoice
        </Button>,
      ]}
    >
      <div ref={printRef} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
        <div className="invoice-header text-center mb-6">
          <Title level={4} style={{ margin: 0 }}>SALON PRO</Title>
          <Text type="secondary">Official Receipt</Text>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
            <span className="text-slate-500">Date</span>
            <span className="font-medium text-slate-800">
              {data.date ? dayjs(data.date).format('DD MMM YYYY') : '-'}
            </span>
          </div>
          
          <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
            <span className="text-slate-500">Client</span>
            <span className="font-medium text-slate-800">{data.client}</span>
          </div>

          <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
            <span className="text-slate-500">Service</span>
            <span className="font-medium text-slate-800">{data.service}</span>
          </div>

          <div className="flex justify-between border-b border-dashed border-slate-300 pb-2">
            <span className="text-slate-500">Payment Method</span>
            <span className="font-medium text-slate-800">{data.method}</span>
          </div>

          <div className="flex justify-between items-center pt-4 mt-2">
            <span className="font-bold text-lg text-slate-800">TOTAL PAID</span>
            <span className="font-bold text-xl text-[#7C4DFF]">
              Rs. {data.amount?.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Text type="secondary" className="text-xs">
            Thank you for your business!
          </Text>
        </div>
      </div>
    </Modal>
  );
};