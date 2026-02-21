"use client";

import React, { useState } from 'react';
import { 
  Table, 
  Card, 
  Tag, 
  Button, 
  Typography, 
  Space, 
  Dropdown, 
  MenuProps, 
  Avatar, 
  Input, 
  DatePicker 
} from 'antd';
import { 
  PlusOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EnvironmentOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ManualAttendanceModal } from "@/components/modals/ManualAttendanceModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Title, Text } = Typography;

// --- Mock Initial Data (Sri Lankan Names) ---
const INITIAL_DATA = [
  { key: '1', name: "Kasun Perera", shop: "Colombo 07", status: "Present", clockIn: "08:50 AM", clockOut: "05:30 PM" },
  { key: '2', name: "Amila Silva", shop: "Colombo 07", status: "On Leave", clockIn: "-", clockOut: "-" },
  { key: '3', name: "Nimali Dias", shop: "Nugegoda", status: "Present", clockIn: "09:05 AM", clockOut: "06:15 PM" },
  { key: '4', name: "Ruwan Fernando", shop: "Kandy", status: "Late", clockIn: "10:30 AM", clockOut: "07:00 PM" },
  { key: '5', name: "Chamara Kumara", shop: "Galle", status: "Present", clockIn: "08:45 AM", clockOut: "05:00 PM" },
];

const STAFF_NAMES = [
  "Kasun Perera", 
  "Amila Silva", 
  "Nimali Dias", 
  "Ruwan Fernando", 
  "Chamara Kumara", 
  "Dilshan Bandara", 
  "Samanthi Perera"
];

function AttendanceContent() {
  const [attendanceData, setAttendanceData] = useState(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const handleDeleteClick = (key: string) => {
    setRecordToDelete(key);
    setIsDeleteModalOpen(true);
  };

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
        { key: String(Date.now()), ...newRecord },
        ...prev
      ]);
      showAlert('success', 'New attendance record added.');
    }
  };

  // --- Filter ---
  const filteredData = attendanceData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.shop.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Table Columns ---
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#F3E8FF', color: '#7C4DFF' }} />
          <span className="font-bold text-slate-800">{text}</span>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'shop',
      key: 'shop',
      render: (text: string) => (
        <Space className="text-slate-500">
          <EnvironmentOutlined /> {text}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        let icon = <CheckCircleOutlined />;
        
        if (status === 'On Leave') { color = 'red'; icon = <CloseCircleOutlined />; }
        if (status === 'Late') { color = 'orange'; icon = <ClockCircleOutlined />; }

        return (
          <Tag color={color} className="rounded-full px-3 font-semibold border-0 flex items-center gap-1 w-fit">
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
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDeleteClick(record.key),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" shape="circle" icon={<MoreOutlined style={{ fontSize: '18px' }} />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Attendance Tracking</Title>
          <Text type="secondary">Monitor staff check-ins, manage leaves, and track locations.</Text>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <DatePicker 
             style={{ borderRadius: '12px', height: '40px' }} 
             defaultValue={dayjs()} 
             format="YYYY-MM-DD"
             className="hidden sm:block"
           />
          <Input 
            prefix={<SearchOutlined className="text-gray-400" />} 
            placeholder="Search..." 
            size="large"
            className="rounded-xl w-full md:w-48"
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />} 
            onClick={handleAddNew}
            // THEME: Applied your purple color
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold shadow-lg shadow-purple-200 border-none"
          >
            Manual Entry
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }} 
        bodyStyle={{ padding: 0 }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          pagination={{ pageSize: 8 }}
          rowKey="key"
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
        isDanger={true}
      />
    </div>
  );
}

// Wrap with Provider for Alerts
export default function AttendancePage() {
  return (
    <AlertProvider>
      <AttendanceContent />
    </AlertProvider>
  );
}