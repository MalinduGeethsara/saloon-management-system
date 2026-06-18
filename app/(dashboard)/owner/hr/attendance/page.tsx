"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Table, Card, Tag, Button, Typography, Space, Dropdown, MenuProps, Avatar, Input, DatePicker } from 'antd';
import type { InputRef, TableColumnType } from 'antd';
import { 
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  EnvironmentOutlined, MoreOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ManualAttendanceModal } from "@/components/modals/ManualAttendanceModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Title, Text } = Typography;

const INITIAL_DATA = [
  { key: '1', name: "Mahesh Madushanka", shop: "Colombo 07", status: "Present", clockIn: "08:50 AM", clockOut: "05:30 PM" },
  { key: '2', name: "Malith Sandaruwan", shop: "Colombo 07", status: "On Leave", clockIn: "-", clockOut: "-" },
  { key: '3', name: "Vindana Lakmal", shop: "Nugegoda", status: "Present", clockIn: "09:05 AM", clockOut: "06:15 PM" },
];

const STAFF_NAMES = ["Mahesh Madushanka", "Malith Sandaruwan", "Vindana Lakmal"];

function AttendanceContent() {
  const [attendanceData, setAttendanceData] = useState(INITIAL_DATA);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

  const handleAddNew = () => { setEditingRecord(null); setIsEntryModalOpen(true); };
  const handleEdit = (record: any) => { setEditingRecord(record); setIsEntryModalOpen(true); };
  const handleDeleteClick = (key: string) => { setRecordToDelete(key); setIsDeleteModalOpen(true); };

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
      setAttendanceData(prev => prev.map(item => item.key === newRecord.key ? { ...item, ...newRecord } : item));
      showAlert('success', 'Attendance record updated successfully.');
    } else {
      setAttendanceData(prev => [{ key: String(Date.now()), ...newRecord }, ...prev]);
      showAlert('success', 'New attendance record added.');
    }
    setIsEntryModalOpen(false);
  };

  const getColumnSearchProps = (dataIndex: string, placeholder: string): TableColumnType<any> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${placeholder}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90, backgroundColor: '#7C4DFF', border: 'none' }}>Search</Button>
          <Button onClick={() => { clearFilters && clearFilters(); confirm(); }} size="small" style={{ width: 90 }}>Reset</Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#7C4DFF' : undefined }} />,
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes((value as string).toLowerCase()),
  });

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      align: 'left' as const,
      ...getColumnSearchProps('name', 'Employee'),
      render: (text: string, record: any) => (
        // FIX: Made the name clickable to go to the employee's detail page
        <Link href={`/owner/hr/attendance/${record.key}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#F3E8FF', color: '#7C4DFF' }} />
          <span className="font-bold text-[#7C4DFF] hover:underline">{text}</span>
        </Link>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'shop',
      key: 'shop',
      width: 150,
      align: 'center' as const,
      render: (text: string) => <Space className="text-slate-500 whitespace-nowrap"><EnvironmentOutlined /> {text}</Space>,
    },
    {
      title: 'Clock In',
      dataIndex: 'clockIn',
      key: 'clockIn',
      width: 130,
      align: 'center' as const,
      render: (text: string) => <span className="font-mono font-medium text-slate-600">{text}</span>,
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      width: 130,
      align: 'center' as const,
      render: (text: string) => <span className="font-mono font-medium text-slate-600">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      align: 'center' as const,
      render: (status: string) => {
        let color = 'green';
        let icon = <CheckCircleOutlined />;
        if (status === 'On Leave') { color = 'red'; icon = <CloseCircleOutlined />; }
        if (status === 'Late') { color = 'orange'; icon = <ClockCircleOutlined />; }
        return (
          <Tag color={color} className="rounded-full px-4 py-0.5 font-bold border-0 flex items-center justify-center gap-1 w-fit mx-auto">
            {icon} {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Dropdown menu={{ items: [
          { key: 'edit', label: 'Edit Record', icon: <EditOutlined />, onClick: () => handleEdit(record) },
          { type: 'divider' },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteClick(record.key) }
        ]}} trigger={['click']} placement="bottomRight">
          <Button type="text" shape="circle" icon={<MoreOutlined style={{ fontSize: '18px' }} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Attendance Tracking</Title>
          <Text type="secondary">Monitor staff check-ins and leaves. Click an employee name to view details.</Text>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <DatePicker style={{ borderRadius: '12px', height: '48px' }} defaultValue={dayjs()} className="hidden sm:block" />
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAddNew} className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold h-12 shadow-md w-full md:w-auto">
            Manual Entry
          </Button>
        </div>
      </div>

      <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={attendanceData} pagination={{ pageSize: 8, size: 'small' }} rowKey="key" scroll={{ x: 1000 }} />
      </Card>

      <ManualAttendanceModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} onSave={handleSaveRecord} staffList={STAFF_NAMES} recordToEdit={editingRecord} />
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title="Delete Record?" description="Are you sure?" confirmText="Yes, Delete" isDanger={true} />
    </div>
  );
}

export default function AttendancePage() {
  return (
    <AlertProvider><AttendanceContent /></AlertProvider>
  );
}