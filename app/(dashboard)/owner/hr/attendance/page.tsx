"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, Tag, Button, Typography, Space, Dropdown, MenuProps, Avatar, Input, DatePicker } from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  EnvironmentOutlined, MoreOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ManualAttendanceModal } from "@/components/modals/ManualAttendanceModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { ResponsiveTable } from "@/components/ui/ResponsiveTable";
import { useAccess } from "@/hooks/useAccess";

const { Title, Text } = Typography;

function AttendanceContent() {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const { showAlert } = useAlert();

  // Server-side pagination: date + employee-name search + page all go to the API
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const requestSeq = useRef(0);

  const fetchAttendance = async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (selectedDate) qs.set('date', selectedDate.format('YYYY-MM-DD'));
      if (debouncedSearch) qs.set('q', debouncedSearch);
      const res = await fetch(`/api/v1/attendance?${qs.toString()}`);
      if (seq !== requestSeq.current) return; // superseded by a newer request
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showAlert('error', err.message || 'Failed to load attendance');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (seq !== requestSeq.current) return;
      if (data.attendance) {
        // e.g. the last record of the last page was deleted: step back to the new last page
        if (data.attendance.length === 0 && data.total > 0 && page > 1) {
          setPage(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
          return;
        }
        setTotal(data.total ?? data.attendance.length);
        setAttendanceData(data.attendance.map((a: any) => ({
          key: a.id,
          userId: a.userId,
          name: a.user?.name || 'Unknown',
          shop: 'Main Shop',
          role: a.user?.role || '',
          status: a.checkOut ? 'Present' : a.checkIn ? 'Active (In)' : 'Absent',
          method: a.method || 'MANUAL',
          clockIn: a.checkIn ? dayjs(a.checkIn).format('hh:mm A') : '-',
          clockOut: a.checkOut ? dayjs(a.checkOut).format('hh:mm A') : '-',
          checkInRaw: a.checkIn,
          checkOutRaw: a.checkOut,
        })));
      }
    } catch (e: any) {
      showAlert('error', 'Failed to load attendance');
      console.error('[Attendance fetch]', e);
    }
    if (seq === requestSeq.current) setLoading(false);
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
    setPage(1);
  };

  // Debounce the name search; a new search always starts from page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedDate, debouncedSearch]);

  // What this person may do here (the owner's tick-boxes; the server checks the same rules again)
  const access = useAccess('/owner/hr/attendance');
  const canAdd = access.add;
  const canEdit = access.edit;
  const canDelete = access.delete;

  useEffect(() => {
    // The people a manual entry can be made for (works for anyone who may use this page)
    fetch('/api/v1/attendance?staff=1')
      .then(r => r.json())
      .then(d => {
        if (d.staff) {
          setStaffList(d.staff.map((st: any) => ({ id: st.id, name: st.name })));
        }
      })
      .catch(() => {});
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
          fetchAttendance();
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

  // Returns false when the server refused the entry, so the form stays open with what was typed
  const handleSaveRecord = async (newRecord: any): Promise<boolean> => {
    try {
      const isEdit = !!newRecord.key;
      // The chosen day at noon: safely inside that calendar day in any time zone
      const dayAtNoon = dayjs(newRecord.date).hour(12).minute(0).second(0).toISOString();

      const body = isEdit
        ? { id: newRecord.key, checkIn: newRecord.clockInRaw, checkOut: newRecord.clockOutRaw, note: newRecord.note }
        : {
            userId: newRecord.userId,
            date: dayAtNoon,
            checkIn: newRecord.clockInRaw || null,
            checkOut: newRecord.clockOutRaw || null,
            method: 'MANUAL',
            note: newRecord.note,
          };

      const res = await fetch('/api/v1/attendance', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showAlert('success', 'Attendance record saved.');
        fetchAttendance();
        return true;
      }
      const err = await res.json().catch(() => ({}));
      showAlert('error', err.message || 'Failed to save record.');
      return false;
    } catch {
      showAlert('error', 'An error occurred.');
      return false;
    }
  };

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      align: 'left' as const,
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
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <DatePicker
            style={{ borderRadius: '12px', height: '48px' }}
            value={selectedDate}
            onChange={handleDateChange}
            allowClear={true}
            placeholder="Filter by date..."
            className="w-full sm:w-auto"
          />
          {canAdd && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAddNew} className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold h-12 shadow-md w-full md:w-auto">
              Manual Entry
            </Button>
          )}
        </div>
      </div>

      <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <div className="p-4 border-b border-slate-100">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search staff"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="sm:max-w-xs"
          />
        </div>
        <ResponsiveTable
          columns={columns}
          dataSource={attendanceData}
          loading={loading}
          pagination={{ current: page, pageSize: PAGE_SIZE, total, size: 'small', onChange: (p) => setPage(p) }}
          rowKey="key"
          scroll={{ x: 1000 }}
          renderMobileCard={(record: any) => {
            const statusColor = record.status === 'Active (In)' ? 'blue' : record.status === 'Absent' || record.status === 'On Leave' ? 'red' : 'green';
            const menuItems: MenuProps['items'] = [
              ...(canEdit ? [{ key: 'edit', label: 'Edit Record', icon: <EditOutlined />, onClick: () => handleEdit(record) }] : []),
              ...(canDelete ? [{ key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true, onClick: () => handleDeleteClick(record.key) }] : []),
            ];
            return (
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/owner/hr/attendance/${record.key}`} className="flex items-center gap-2 min-w-0">
                    <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#F3E8FF', color: '#7C4DFF' }} />
                    <span className="font-bold text-[#7C4DFF] truncate">{record.name}</span>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tag color={statusColor} className="rounded-full px-3 font-bold border-0 text-[10px] m-0">{record.status.toUpperCase()}</Tag>
                    {menuItems.length > 0 && (
                      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                        <Button type="text" shape="circle" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
                      </Dropdown>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-mono text-slate-600">
                  <span>In: {record.clockIn}</span>
                  <span>Out: {record.clockOut}</span>
                  <span className="text-[10px] font-sans font-bold text-slate-400">{record.method === 'FINGERPRINT' ? 'FINGERPRINT' : 'MANUAL'}</span>
                </div>
              </div>
            );
          }}
        />
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
