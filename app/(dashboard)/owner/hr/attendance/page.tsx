"use client";

import React, { useState } from 'react';
import { Table, Card, Tag, Button, Typography, Space, Dropdown, MenuProps } from 'antd';
import { 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  MoreVertical,
  Edit2,
  Trash2
} from "lucide-react";
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ManualAttendanceModal } from "@/components/modals/ManualAttendanceModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Title, Text } = Typography;

// --- Mock Initial Data ---
const INITIAL_DATA = [
  { key: '1', name: "Alex Rivers", shop: "Downtown", status: "Present", clockIn: "08:50 AM", clockOut: "05:30 PM" },
  { key: '2', name: "Sam Wilson", shop: "Downtown", status: "On Leave", clockIn: "-", clockOut: "-" },
  { key: '3', name: "Jordan Smith", shop: "Westside", status: "Present", clockIn: "09:05 AM", clockOut: "06:15 PM" },
];

const STAFF_NAMES = ["Alex Rivers", "Sam Wilson", "Jordan Smith", "Nuwan Pradeep", "Kasun Perera"];

function AttendanceContent() {
  const [attendanceData, setAttendanceData] = useState(INITIAL_DATA);
  
  // Modal States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  
  const { showAlert } = useAlert();

  // --- Handlers ---
  
  const handleAddNew = () => {
    setEditingRecord(null);
    setIsEntryModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsEntryModalOpen(true);
  };

  // 1. Trigger the confirmation modal
  const handleDeleteClick = (key: string) => {
    setRecordToDelete(key);
    setIsDeleteModalOpen(true);
  };

  // 2. Actually delete the record
  const confirmDelete = () => {
    if (recordToDelete) {
      setAttendanceData(prev => prev.filter(item => item.key !== recordToDelete));
      showAlert('success', 'Record deleted successfully.');
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleSaveRecord = (newRecord: any) => {
    if (newRecord.key) {
      // UPDATE
      setAttendanceData(prev => 
        prev.map(item => item.key === newRecord.key ? { ...item, ...newRecord } : item)
      );
      showAlert('success', 'Attendance record updated successfully.');
    } else {
      // ADD
      setAttendanceData(prev => [
        ...prev, 
        { key: String(Date.now()), ...newRecord }
      ]);
      showAlert('success', 'New attendance record added.');
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-bold text-slate-700">{text}</span>,
    },
    {
      title: 'Location',
      dataIndex: 'shop',
      key: 'shop',
      render: (text: string) => (
        <Space className="text-slate-500">
          <MapPin size={14} /> {text}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        let icon = <CheckCircle size={14} />;
        
        if (status === 'On Leave') { color = 'red'; icon = <XCircle size={14} />; }
        if (status === 'Half Day') { color = 'orange'; icon = <AlertCircle size={14} />; }

        return (
          <Tag color={color} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content', padding: '4px 10px', borderRadius: 12 }}>
            {icon} {status}
          </Tag>
        );
      },
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'clockIn',
      render: (text: string) => <span className="font-mono font-medium text-slate-600">{text}</span>,
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      render: (text: string) => <span className="font-mono font-medium text-slate-600">{text}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          {
            key: 'edit',
            label: 'Edit Record',
            icon: <Edit2 size={14} />,
            onClick: () => handleEdit(record),
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <Trash2 size={14} />,
            danger: true,
            onClick: () => handleDeleteClick(record.key), // Open modal instead of delete directly
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" shape="circle" icon={<MoreVertical size={16} className="text-slate-400" />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto' }}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Attendance Tracking</Title>
          <Text type="secondary">Monitor staff check-ins and manage leaves.</Text>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusCircle size={18} />} 
          onClick={handleAddNew}
          style={{ backgroundColor: '#1A1A1B', borderRadius: '10px', height: '45px', fontWeight: 600 }}
        >
          Manual Entry
        </Button>
      </div>

      {/* Main Table */}
      <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }} bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={attendanceData} 
          pagination={false}
          rowClassName="hover:bg-slate-50 transition-colors"
        />
      </Card>

      {/* Manual Entry/Edit Modal */}
      <ManualAttendanceModal 
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveRecord}
        staffList={STAFF_NAMES}
        recordToEdit={editingRecord}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record?"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Keep it"
        isDanger={true}
      />
    </div>
  );
}

// Wrap with Provider for Alerts
export default function AttendanceTracking() {
  return (
    <AlertProvider>
      <AttendanceContent />
    </AlertProvider>
  );
}