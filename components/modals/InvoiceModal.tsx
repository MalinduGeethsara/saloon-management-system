"use client";

import React, { useRef } from 'react';
import { Modal, Button, Typography, Divider } from 'antd';
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
    const content = printRef.current?.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=400');
    
    if (printWindow && content) {
      printWindow.document.write('<html><head><title>Print Invoice</title>');
      printWindow.document.write(`
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
          .invoice-header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
          .item-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          .divider { border-bottom: 1px dashed #000; margin: 15px 0; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(content);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    }
  };

  return (
    <Modal
      title={<span className="font-bold text-lg">Receipt #{data.id}</span>}
      open={isOpen}
      onCancel={onClose}
      width={400}
      centered
      footer={[
        <Button key="close" onClick={onClose} style={{ height: '40px', minWidth: '100px' }}>Close</Button>,
        <Button key="print" type="primary" onClick={handlePrint} icon={<PrinterOutlined />} style={{ height: '40px', minWidth: '100px', backgroundColor: '#7C4DFF' }}>Print Bill</Button>,
      ]}
    >
      <div ref={printRef} className="p-4 bg-white border border-slate-200" style={{ maxWidth: '350px', margin: '0 auto' }}>
        <div className="invoice-header text-center mb-4 border-b border-dashed border-slate-300 pb-4">
          <Title level={3} style={{ margin: 0 }}>SALON PRO</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>Unisex Salon</Text>
        </div>

        <div className="info-row flex justify-between text-xs text-slate-600 mb-1">
          <span>Date: {data.date ? dayjs(data.date).format('DD/MM/YYYY') : '-'}</span>
          <span>Time: {dayjs().format('HH:mm')}</span>
        </div>
        <div className="info-row flex justify-between text-xs text-slate-600 mb-1">
          <span>Client: {data.client ?? 'Walk-in Client'}</span>
          <span>Specialist: {data.barber || 'N/A'}</span>
        </div>
        <div className="info-row flex justify-between text-xs text-slate-600 mb-4">
          <span>Contact: {data.contact || 'N/A'}</span>
          <span>Method: {data.method ?? 'Cash'}</span>
        </div>

        <div className="divider border-b border-dashed border-slate-300 my-3"></div>

        <div className="space-y-2 mb-4">
          {data.items?.map((item: any, index: number) => (
            <div key={index} className="item-row flex justify-between text-sm">
              <span>{item.name} <span className="text-[10px] text-slate-400">({item.type})</span></span>
              <span>Rs. {item.price?.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="divider border-b border-dashed border-slate-300 my-3"></div>

        <div className="total-row flex justify-between items-center font-bold text-lg mt-2 pt-2">
          <span>TOTAL</span>
          <span>Rs. {data.amount?.toLocaleString()}</span>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          *** Thank you for visiting! ***
        </div>
      </div>
    </Modal>
  );
};