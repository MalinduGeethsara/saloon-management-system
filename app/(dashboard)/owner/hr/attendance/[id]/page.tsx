"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, Typography, Row, Col, Statistic, Table, Tag, Button, Alert, Tooltip, DatePicker
} from 'antd';
import { 
  ArrowLeftOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ApplyLeaveModal } from "@/components/modals/ApplyLeaveModal";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";

const { Title, Text } = Typography;

// --- Config & Constants ---
const EMPLOYEE = { name: "Kasun Perera", role: "Senior Barber", baseSalary: 75000 };
const MONTHLY_WORK_DAYS = 25;
const REQUIRED_HOURS = 11;
const MAX_LEAVES = 4;

const MOCK_LEAVES = [
  { key: '1', dates: "2023-10-10", reason: "Sick Leave - Doctor appointment", status: "Approved" },
  { key: '2', dates: "2023-11-05", reason: "Casual Leave - Family Event", status: "Pending" },
];

// --- Algorithm: Calculate Hours Between Time Strings ---
const calculateHours = (clockIn: string, clockOut: string) => {
  if (!clockIn || !clockOut || clockIn === "-" || clockOut === "-") return 0;
  const start = dayjs(`2000-01-01 ${clockIn}`, "YYYY-MM-DD hh:mm A");
  const end = dayjs(`2000-01-01 ${clockOut}`, "YYYY-MM-DD hh:mm A");
  return end.diff(start, 'hour', true); // returns decimal hours
};

function EmployeeProfileContent() {
  const router = useRouter();
  const { showAlert } = useAlert();
  
  // ✅ Added mounted state to prevent hydration errors
  const [mounted, setMounted] = useState(false);
  
  // States
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaves, setLeaves] = useState(MOCK_LEAVES);

  // Dynamic Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean; title: string; description: string; confirmText: string; isDanger: boolean; action: (() => void) | null;
  }>({
    isOpen: false, title: '', description: '', confirmText: '', isDanger: false, action: null
  });

  // ✅ Trigger mounted state on client load
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Calculations for Leaves
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
  const remainingLeaves = MAX_LEAVES - approvedLeaves;

  // --- Dynamic Monthly Log Generator ---
  const monthlyLogs = useMemo(() => {
    const daysInMonth = selectedMonth.daysInMonth();
    const logs = [];
    const today = dayjs();

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = selectedMonth.date(i);
      const dateString = currentDate.format('YYYY-MM-DD');
      const dayOfWeek = currentDate.format('ddd');
      const isPastOrToday = currentDate.isBefore(today, 'day') || currentDate.isSame(today, 'day');
      const isSunday = currentDate.day() === 0;

      // Check if this specific date has an Approved Leave
      const hasLeave = leaves.some(l => l.status === 'Approved' && l.dates.includes(dateString));

      let clockIn = "-";
      let clockOut = "-";
      let status = "Future";

      if (hasLeave) {
        status = "Leave";
      } else if (isSunday) {
        status = "Holiday";
      } else if (isPastOrToday) {
        // Generating realistic mock data for past days
        // 90% chance they showed up, 10% chance absent
        const showedUp = Math.random() > 0.1;
        if (showedUp) {
          clockIn = "08:00 AM";
          // 80% chance they worked full hours, 20% left early
          clockOut = Math.random() > 0.2 ? "07:30 PM" : "05:00 PM";
          status = "Worked";
        } else {
          status = "Absent";
        }
      }

      logs.push({
        key: dateString,
        date: dateString,
        dayOfWeek,
        clockIn,
        clockOut,
        status
      });
    }
    
    // Return newest days at the top
    return logs.reverse();
  }, [selectedMonth, leaves]);

  const daysWorked = monthlyLogs.filter(log => log.status === 'Worked').length;

  // --- Core Handlers (These run AFTER confirmation) ---
  const executeApplyLeave = (values: any) => {
    const startDate = values.dates[0].format('YYYY-MM-DD');
    const endDate = values.dates[1].format('YYYY-MM-DD');
    const dateString = startDate === endDate ? startDate : `${startDate} to ${endDate}`;

    const newLeave = {
      key: Date.now().toString(),
      dates: dateString,
      reason: `${values.leaveType} - ${values.reason}`, 
      status: "Pending" 
    };
    
    setLeaves([newLeave, ...leaves]);
    setIsLeaveModalOpen(false);
    showAlert('success', 'Leave application submitted successfully.');
  };

  const executeLeaveAction = (key: string, newStatus: string) => {
    setLeaves(prev => prev.map(leave => 
      leave.key === key ? { ...leave, status: newStatus } : leave
    ));
    
    if (newStatus === 'Approved') {
      showAlert('success', 'Leave approved. Deductions recalculated.');
    } else {
      showAlert('success', 'Leave request rejected.');
    }
  };

  // --- Prompts (These trigger the Confirmation Modal) ---
  const promptApplyLeave = (values: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Submit Leave Application?',
      description: 'Are you sure you want to submit this leave request? It will be logged for HR review.',
      confirmText: 'Yes, Submit',
      isDanger: false,
      action: () => {
        executeApplyLeave(values);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const promptLeaveAction = (key: string, newStatus: string) => {
    const isApprove = newStatus === 'Approved';
    setConfirmConfig({
      isOpen: true,
      title: isApprove ? 'Approve Leave?' : 'Reject Leave?',
      description: isApprove 
        ? 'Are you sure you want to approve this leave? This will recalculate the remaining leaves and potential salary deductions.' 
        : 'Are you sure you want to reject this leave request?',
      confirmText: isApprove ? 'Approve Leave' : 'Reject Leave',
      isDanger: !isApprove, 
      action: () => {
        executeLeaveAction(key, newStatus);
        setConfirmConfig(prev => ({ ...prev, isOpen: false })); 
      }
    });
  };

  // --- Table Columns ---
  const logColumns = [
    { 
      title: 'Date', 
      key: 'date', 
      width: 140, 
      render: (_: any, record: any) => (
        <div>
          <div className="font-bold">{dayjs(record.date).format('DD MMM')}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest">{record.dayOfWeek}</div>
        </div>
      )
    },
    { title: 'In / Out', key: 'times', width: 180, render: (_: any, record: any) => (
        record.status === 'Worked' ? (
          <div className="flex gap-2 font-mono text-xs">
            <Tag className="m-0 bg-slate-50">{record.clockIn}</Tag> 
            <span className="text-slate-300">→</span> 
            <Tag className="m-0 bg-slate-50">{record.clockOut}</Tag>
          </div>
        ) : <span className="text-slate-300">—</span>
      )
    },
    {
      title: 'Hrs',
      key: 'hours',
      width: 100,
      render: (_: any, record: any) => {
        const hours = calculateHours(record.clockIn, record.clockOut);
        return hours > 0 ? <span className="font-bold text-slate-700">{hours.toFixed(1)}h</span> : <span className="text-slate-300">-</span>;
      }
    },
    {
      title: 'Day Status',
      key: 'status',
      width: 150,
      render: (_: any, record: any) => {
        if (record.status === 'Future') return <span className="text-xs text-slate-300 font-medium italic">Pending...</span>;
        if (record.status === 'Leave') return <Tag color="blue" className="rounded-full px-3 py-0.5 m-0 font-bold border-0">LEAVE</Tag>;
        if (record.status === 'Holiday') return <Tag className="rounded-full px-3 py-0.5 m-0 font-bold border-0 bg-slate-100 text-slate-400">OFF DAY</Tag>;
        if (record.status === 'Absent') return <Tag color="red" className="rounded-full px-3 py-0.5 m-0 font-bold border-0">ABSENT</Tag>;
        
        const hours = calculateHours(record.clockIn, record.clockOut);
        const isComplete = hours >= REQUIRED_HOURS;
        return (
          <Tag color={isComplete ? 'green' : 'orange'} className="rounded-full px-3 py-0.5 m-0 font-bold border-0 flex items-center gap-1 w-fit">
            {isComplete ? <CheckCircleOutlined /> : <WarningOutlined />}
            {isComplete ? 'Complete' : 'Short'}
          </Tag>
        );
      }
    }
  ];

  const leaveColumns = [
    { title: 'Date(s)', dataIndex: 'dates', key: 'dates', width: 130 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 180, render: (t: string) => <span className="text-xs text-slate-600">{t}</span> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = status === 'Approved' ? 'green' : status === 'Pending' ? 'gold' : 'red';
        return <Tag color={color} className="rounded-full font-bold px-3 py-0.5 m-0 border-0">{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 90,
      align: 'right' as const,
      render: (_: any, record: any) => {
        if (record.status !== 'Pending') {
          return <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Resolved</span>;
        }
        return (
          <div className="flex gap-1 justify-end">
            <Tooltip title="Approve Leave">
              <Button size="small" type="text" shape="circle" className="bg-emerald-50 hover:bg-emerald-100" icon={<CheckCircleOutlined className="text-emerald-600" />} onClick={() => promptLeaveAction(record.key, 'Approved')} />
            </Tooltip>
            <Tooltip title="Reject Leave">
              <Button size="small" type="text" shape="circle" className="bg-red-50 hover:bg-red-100" icon={<CloseCircleOutlined className="text-red-600" />} onClick={() => promptLeaveAction(record.key, 'Rejected')} />
            </Tooltip>
          </div>
        );
      }
    }
  ];

  // ✅ Wait until mounted before returning the UI (Prevents Hydration Mismatch)
  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} className="mb-2 -ml-3 text-slate-500 font-medium">
            Back to Roster
          </Button>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{EMPLOYEE.name}</Title>
          <Text type="secondary">{EMPLOYEE.role} • Attendance & Leave Profile</Text>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Month Picker to browse historical data */}
          <DatePicker 
            picker="month" 
            value={selectedMonth} 
            onChange={(date) => date && setSelectedMonth(date)} 
            className="h-12 rounded-xl border-slate-200 shadow-sm w-full sm:w-48"
            allowClear={false}
          />
          <Button 
            type="primary" 
            size="large" 
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold shadow-md shadow-purple-100 border-none w-full sm:w-auto h-12"
            onClick={() => setIsLeaveModalOpen(true)}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Warning Policy Alert */}
      <Alert
        title={<span className="font-bold">Company Leave & Work Policy</span>}
        description={
          <ul className="list-disc pl-4 mt-1 text-sm text-slate-600">
            <li>Employees are expected to complete <b>{MONTHLY_WORK_DAYS} days</b> per month at <b>{REQUIRED_HOURS} hours/day</b>.</li>
            <li>Allowed Leaves: <b>{MAX_LEAVES} days/month</b>.</li>
            <li><span className="text-red-600 font-bold">Salary Deduction: Rs. 1,000 is deducted from the salary per leave taken.</span></li>
          </ul>
        }
        type="warning"
        showIcon
        className="mb-8 rounded-2xl border-orange-200 bg-orange-50"
      />

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="mb-8 mt-8">
        <Col xs={12} md={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full flex flex-col justify-center text-center sm:text-left sm:items-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining Leaves</span>}
              value={remainingLeaves} 
              suffix={<span className="text-slate-300 text-lg">/ {MAX_LEAVES}</span>}
              styles={{ content: { fontWeight: 800, color: remainingLeaves > 0 ? '#10B981' : '#EF4444', fontSize: '32px' } }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full flex flex-col justify-center text-center sm:text-left sm:items-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Days Worked</span>}
              value={daysWorked} 
              suffix={<span className="text-slate-300 text-lg">/ {selectedMonth.daysInMonth()}</span>}
              styles={{ content: { fontWeight: 800, color: '#7C4DFF', fontSize: '32px' } }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full bg-red-50 flex flex-col justify-center text-center sm:text-left sm:items-start">
            <Statistic 
              title={<span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Est. Leave Deductions</span>}
              value={approvedLeaves * 1000} 
              prefix={<span className="text-red-400 text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#EF4444', fontSize: '32px' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Layout Grid */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card 
            variant="borderless" 
            className="shadow-sm rounded-3xl overflow-hidden h-full" 
            title={
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-slate-400" />
                <span className="font-bold text-lg">Timesheet: {selectedMonth.format('MMMM YYYY')}</span>
              </div>
            } 
            styles={{ body: { padding: 0 } }}
          >
            {/* Added scroll Y so the long 31-day table doesn't make the page massively long */}
            <Table 
              columns={logColumns} 
              dataSource={monthlyLogs} 
              pagination={false} 
              scroll={{ x: 500, y: 500 }} 
              rowClassName={(record) => record.status === 'Absent' ? 'bg-red-50/40' : record.status === 'Holiday' ? 'bg-slate-50/50' : ''}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden h-full" title={<span className="font-bold text-lg">Leave Requests</span>} styles={{ body: { padding: 0 } }}>
            <Table columns={leaveColumns} dataSource={leaves} pagination={{ pageSize: 4, size: 'small' }} scroll={{ x: 400 }} />
          </Card>
        </Col>
      </Row>

      {/* Application Modal */}
      <ApplyLeaveModal 
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSave={promptApplyLeave}
        remainingLeaves={remainingLeaves}
      />

      {/* Central Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => confirmConfig.action?.()}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        isDanger={confirmConfig.isDanger}
      />
    </div>
  );
}

export default function EmployeeAttendanceProfile() {
  return (
    <AlertProvider>
      <EmployeeProfileContent />
    </AlertProvider>
  );
}