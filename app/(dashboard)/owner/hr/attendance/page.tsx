"use client";

import React, { useState, useRef, useEffect } from 'react';
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

function AttendanceContent() {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const searchInput = useRef<InputRef>(null);
  const { showAlert } = useAlert();

  const fetchAttendance = async (date?: dayjs.Dayjs | null) => {
    const target = date === undefined ? selectedDate : date;
    try {
      const url = target
        ? `/api/v1/attendance?date=${target.format('YYYY-MM-DD')}`
        : '/api/v1/attendance';
      const res = await fetch(url);
      const data = await res.json();
      if (data.attendance) {
        setAttendanceData(data.attendance.map((a: any) => ({
          key: a.id,
          userId: a.userId,
          name: a.user?.name || 'Unknown',
          shop: a.user?.shop?.name || 'Main Shop',
          role: a.user?.role || '',
          status: a.checkOut ? 'Present' : a.checkIn ? 'Active (In)' : 'Absent',
          method: a.method || 'MANUAL',
          clockIn: a.checkIn ? dayjs(a.checkIn).format('hh:mm A') : '-',
          clockOut: a.checkOut ? dayjs(a.checkOut).format('hh:mm A') : '-',
        })));
      }
    } catch {
      showAlert('error', 'Failed to load attendance');
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
    fetchAttendance(date);
  };

  const [canAdd, setCanAdd] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  const [canDelete, setCanDelete] = useState(true);

  useEffect(() => {
    fetchAttendance(null);

    // Fetch real staff list
    fetch('/api/v1/staff')
      .then(r => r.json())
      .then(d => {
        if (d.staff) {
          setStaffList(d.staff.map((s: any) => ({ id: s.id, name: s.name })));
        }
      })
      .catch(() => {});

    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (roleMatch) {
      if (roleMatch[2].toLowerCase() !== 'owner' && roleMatch[2].toLowerCase() !== 'admin') {
        const permMatch = document.cookie.match(new RegExp('(^| )user_permissions=([^;]+)'));
        if (permMatch) {
          try {
            const perms = JSON.parse(decodeURIComponent(permMatch[2]));
            const pagePerms = perms.find((p: any) => p.pageKey === '/owner/hr/attendance');
            if (pagePerms) {
              setCanAdd(pagePerms.canAdd);
              setCanEdit(pagePerms.canEdit);
              setCanDelete(pagePerms.canDelete);
            } else {
              setCanAdd(false);
              setCanEdit(false);
              setCanDelete(false);
            }
          } catch {}
        }
      }
    }
  }, []);

  const handleAddNew = () => { setEditingRecord(null); setIsEntryModalOpen(true); };
  const handleEdit = (record: any) => { setEditingRecord(record); setIsEntryModalOpen(true); };
  const handleDeleteClick = (key: string) => { setRecordToDelete(key); setIsDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        const res = await fetch(`/api/v1/attendance?id=${recordToDelete}`, { method: 'DELETE' });
        if (res.ok) {
          showAlert('success', 'Record deleted successfully.');
          fetchAttendance(selectedDate ?? null);
        } else {
          showAlert('error', 'Failed to delete record.');
        }
      } catch {
        showAlert('error', 'An error occurred.');
      }
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleSaveRecord = async (newRecord: any) => {
    try {
      const isEdit = !!newRecord.key;
      const now = new Date();
      const dateStr = newRecord.date || now.toISOString().split('T')[0];

      const body = isEdit
        ? { id: newRecord.key, checkIn: newRecord.clockInRaw, checkOut: newRecord.clockOutRaw }
        : {
            userId: newRecord.userId,
            date: new Date(dateStr).toISOString(),
            checkIn: newRecord.clockInRaw || now.toISOString(),
            checkOut: newRecord.clockOutRaw || null,
            method: 'MANUAL',
            allowDuplicate: isEdit,
          };

      const res = await fetch('/api/v1/attendance', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showAlert('success', 'Attendance record saved.');
        fetchAttendance(selectedDate ?? null);
      } else {
        const err = await res.json();
        showAlert('error', err.message || 'Failed to save record.');
      }
    } catch {
      showAlert('error', 'An error occurred.');
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
    onFilter: (value, record) => record[dataIndex]?.toString().toLowerCase().includes((value as string).toLowerCase()),
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
      width: 120,
      align: 'center' as const,
      render: (text: string) => <span className="font-mono font-medium text-slate-600">{text}</span>,
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOut',
      key: 'clockOut',
      width: 120,
      align: 'center' as const,
      render: (text: string) => <span className="font-mono font-medium text-slate-600">{text}</span>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 130,
      align: 'center' as const,
      render: (method: string) => (
        <Tag color={method === 'FINGERPRINT' ? 'green' : 'blue'} className="rounded-full px-3 py-0.5 font-bold border-0 text-[10px]">
          {method === 'FINGERPRINT' ? 'Fingerprint' : 'Manual'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center' as const,
      render: (status: string) => {
        let color = 'green';
        let icon = <CheckCircleOutlined />;
        if (status === 'On Leave' || status === 'Absent') { color = 'red'; icon = <CloseCircleOutlined />; }
        if (status === 'Active (In)') { color = 'blue'; icon = <ClockCircleOutlined />; }
        return (
          <Tag color={color} className="rounded-full px-3 py-0.5 font-bold border-0 flex items-center justify-center gap-1 w-fit mx-auto text-[10px]">
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
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          ...(canEdit ? [{ key: 'edit', label: 'Edit Record', icon: <EditOutlined />, onClick: () => handleEdit(record) }] : []),
          ...(canEdit && canDelete ? [{ type: 'divider' as const }] : []),
          ...(canDelete ? [{ key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteClick(record.key) }] : []),
        ];
        if (items.length === 0) return null;
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" shape="circle" icon={<MoreOutlined style={{ fontSize: '18px' }} />} />
          </Dropdown>
        );
      },
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
          <DatePicker
            style={{ borderRadius: '12px', height: '48px' }}
            value={selectedDate}
            onChange={handleDateChange}
            allowClear={true}
            placeholder="Filter by date..."
            className="hidden sm:block"
          />
          {canAdd && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAddNew} className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold h-12 shadow-md w-full md:w-auto">
              Manual Entry
            </Button>
          )}
        </div>
      </div>

      <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={attendanceData} pagination={{ pageSize: 8, size: 'small' }} rowKey="key" scroll={{ x: 1000 }} />
      </Card>

      <ManualAttendanceModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveRecord}
        staffList={staffList}
        recordToEdit={editingRecord}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record?"
        description="Are you sure?"
        confirmText="Yes, Delete"
        isDanger={true}
      />
    </div>
  );
}

export default function AttendancePage() {
  return (
    <AlertProvider><AttendanceContent /></AlertProvider>
  );
}
