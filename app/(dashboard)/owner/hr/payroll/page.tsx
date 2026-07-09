"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, Typography, Row, Col, Statistic, Tag, Button, Select, Modal, Progress 
} from 'antd';
import { 
  DollarOutlined, RightOutlined, SyncOutlined, SettingOutlined 
} from '@ant-design/icons';
import { AlertProvider, useAlert } from "@/components/alerts/AlertSystem";
import { ConfirmationModal } from "@/components/modals/ConfirmationModal";
import { PayrollConfigModal } from "@/components/modals/PayrollConfigModal";
import { getMonthlyPayroll, processPayroll } from '@/lib/actions/payroll';

const { Title, Text } = Typography;

// --- Sri Lankan Payroll Constants ---
const EPF_EMPLOYEE_RATE = 0.08; 
const EPF_EMPLOYER_RATE = 0.12; 
const ETF_EMPLOYER_RATE = 0.03; 
const LEAVE_ALLOWANCE = 4;
const NO_PAY_RATE = 1000; 

// --- Payroll Calculation Engine ---
const calculatePayroll = (record: any) => {
  const grossEarnings = record.basicSalary + record.allowances + record.commissions;
  const epfDeduction = record.basicSalary * EPF_EMPLOYEE_RATE;
  const excessLeaves = Math.max(0, record.leavesTaken - LEAVE_ALLOWANCE);
  const noPayDeduction = excessLeaves * NO_PAY_RATE;
  const totalDeductions = epfDeduction + noPayDeduction;
  const netSalary = grossEarnings - totalDeductions;
  const epfEmployer = record.basicSalary * EPF_EMPLOYER_RATE;
  const etfEmployer = record.basicSalary * ETF_EMPLOYER_RATE;

  return {
    ...record,
    grossEarnings,
    epfDeduction,
    excessLeaves,
    noPayDeduction,
    totalDeductions,
    netSalary,
    epfEmployer,
    etfEmployer
  };
};

function PayrollContent() {
  const router = useRouter(); 
  const { showAlert } = useAlert();
  
  const [selectedMonth, setSelectedMonth] = useState('March 2026');
  const [payrollList, setPayrollList] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchPayroll = async () => {
    setIsLoadingData(true);
    const res = await getMonthlyPayroll(selectedMonth);
    if (res.success && res.data) {
      setPayrollList(res.data.map(calculatePayroll));
    }
    setIsLoadingData(false);
  };

  const [canAdd, setCanAdd] = useState(true);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    fetchPayroll();

    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (roleMatch) {
      if (roleMatch[2].toLowerCase() !== 'owner' && roleMatch[2].toLowerCase() !== 'admin') {
        const permMatch = document.cookie.match(new RegExp('(^| )user_permissions=([^;]+)'));
        if (permMatch) {
          try {
            const perms = JSON.parse(decodeURIComponent(permMatch[2]));
            const pagePerms = perms.find((p: any) => p.pageKey === '/owner/hr/payroll');
            if (pagePerms) {
              setCanAdd(pagePerms.canAdd);
              setCanEdit(pagePerms.canEdit);
            } else {
              setCanAdd(false);
              setCanEdit(false);
            }
          } catch (e) {}
        }
      }
    }
  }, [selectedMonth]);

  // --- Processing States ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- KPI Calculations ---
  const totalPayout = payrollList.reduce((sum, item) => sum + item.netSalary, 0);
  const totalPending = payrollList.filter(i => i.status === 'Pending').reduce((sum, item) => sum + item.netSalary, 0);
  const totalEPFETF = payrollList.reduce((sum, item) => sum + item.epfEmployer + item.etfEmployer, 0);

  // --- Handlers ---
  const handleViewPayslip = (record: any) => {
    router.push(`/owner/hr/payroll/${record.id}`); 
  };

  const handleOpenConfig = (e: React.MouseEvent, record: any) => {
    e.stopPropagation(); // prevent card click
    setSelectedStaff(record);
    setIsConfigModalOpen(true);
  };

  const startPayrollProcessing = async () => {
    setIsConfirmModalOpen(false); // Close the confirmation modal
    setIsProcessing(true); // Open the loading modal
    setProgress(0);

    // Simulate progress bar for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + 10;
      });
    }, 200);

    const res = await processPayroll(selectedMonth);
    clearInterval(interval);
    setProgress(100);

    setTimeout(() => {
      setIsProcessing(false);
      setProgress(0);
      if (res.success) {
        showAlert('success', res.message || `Payroll for ${selectedMonth} processed successfully!`);
        fetchPayroll(); // Refresh the list
      } else {
        showAlert('error', res.message || 'Failed to process payroll.');
      }
    }, 500);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Payroll Management</Title>
          <Text type="secondary">Process salaries, EPF/ETF contributions. Click an employee card to view their payslip.</Text>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select 
            id="month-select"
            value={selectedMonth} 
            onChange={setSelectedMonth}
            size="large"
            className="w-full sm:w-40"
            options={[
              { value: 'January 2026', label: 'January 2026' },
              { value: 'February 2026', label: 'February 2026' },
              { value: 'March 2026', label: 'March 2026' },
            ]}
          />
          {/* Re-Added the Run Payroll Button */}
          {canAdd && (
            <Button 
              type="primary" 
              size="large" 
              icon={<DollarOutlined />} 
              onClick={() => setIsConfirmModalOpen(true)}
              className="bg-[#1A1A1B] hover:bg-black rounded-xl font-bold border-none shadow-md w-full sm:w-auto"
            >
              Run Payroll
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Net Payout</span>}
              value={totalPayout} 
              prefix={<span className="text-[#7C4DFF] text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#1A1A1B', fontSize: '32px' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full flex flex-col justify-center text-center sm:text-left">
            <Statistic 
              title={<span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Payments</span>}
              value={totalPending} 
              prefix={<span className="text-orange-500 text-xl font-bold mr-1">Rs.</span>}
              styles={{ content: { fontWeight: 800, color: '#F97316', fontSize: '32px' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={24} lg={8}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full flex flex-col justify-center text-center sm:text-left bg-slate-50 border border-slate-100">
            <Statistic 
              title={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total EPF & ETF (Company Liability)</span>}
              value={totalEPFETF} 
              prefix="Rs."
              styles={{ content: { fontWeight: 800, color: '#475569', fontSize: '32px' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Employee Cards Grid */}
      <h3 className="text-lg font-bold text-slate-800 mb-4 mt-10">Employee Payroll List</h3>
      <Row gutter={[24, 24]}>
        {payrollList.map((employee) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={employee.key}>
            <Card 
              variant="borderless" 
              className="shadow-sm rounded-3xl cursor-pointer hover:shadow-lg hover:shadow-purple-100 hover:-translate-y-1 transition-all duration-300 border-2 border-[#7C4DFF] group h-full flex flex-col bg-white"
              onClick={() => handleViewPayslip(employee)}
              styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' } }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {employee.id}</div>
                <Tag color={employee.status === 'Paid' ? 'green' : 'orange'} className="rounded-full px-3 py-1 m-0 font-bold border-0 text-[10px]">
                  {employee.status.toUpperCase()}
                </Tag>
              </div>

              <div className="mb-6 flex-grow">
                <h3 className="text-xl font-black text-slate-800 m-0 truncate group-hover:text-[#7C4DFF] transition-colors">{employee.name}</h3>
                <span className="text-xs text-[#7C4DFF] font-bold uppercase tracking-wider">{employee.role}</span>
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Base Salary:</span>
                    <span className="font-bold text-slate-700">Rs. {employee.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Commission:</span>
                    <span className="font-bold text-emerald-600">+Rs. {employee.commissions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-2 font-bold">
                    <span className="text-slate-800">Net Salary:</span>
                    <span className="text-[#7C4DFF]">Rs. {employee.netSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center mt-auto gap-2">
                {canEdit && (
                  <Button 
                    type="text" 
                    shape="circle" 
                    icon={<SettingOutlined />} 
                    onClick={(e) => handleOpenConfig(e, employee)}
                    className="hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  />
                )}
                <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[#7C4DFF] group-hover:bg-[#7C4DFF] group-hover:text-white transition-colors duration-300">
                  <RightOutlined className="text-xs" />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 1. Confirmation Modal */}
      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={startPayrollProcessing}
        title={`Run ${selectedMonth} Payroll?`}
        description="This action will calculate EPF, ETF, No-Pay leaves, and generate official payslips for all active employees."
        confirmText="Yes, Run Payroll"
        isDanger={false}
      />

      {/* 2. Processing Modal (Loading Bar & Countdown) */}
      <Modal 
        open={isProcessing} 
        footer={null} 
        closable={false} 
        centered 
        width={400}
        zIndex={1100}
        styles={{ body: { padding: '40px 20px' } }}
      >
        <div className="flex flex-col items-center text-center">
          <SyncOutlined spin className="text-5xl text-[#7C4DFF] mb-6" />
          <h3 className="text-xl font-black text-slate-800 mb-2">Processing Payroll...</h3>
          <p className="text-sm text-slate-500 mb-8 px-4">
            Calculating earnings, statutory deductions, and preparing payslips for {selectedMonth}.
          </p>
          
          <div className="w-full px-4 mb-2">
            <Progress 
              percent={progress} 
              strokeColor="#7C4DFF" 
              railColor="#F3E8FF"
              status="active" 
              size={[undefined, 12]}
              showInfo={false}
            />
          </div>
          
          <div className="flex justify-between w-full px-4 text-xs font-bold font-mono text-slate-400 mt-2 tracking-wider">
            <span>{progress}% COMPLETE</span>
            <span>EST. TIME: {Math.ceil((100 - progress) * 0.035)}s</span>
          </div>
        </div>
      </Modal>

      {/* 3. Configuration Modal */}
      <PayrollConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        staff={selectedStaff}
        onSaveSuccess={() => fetchPayroll()}
      />

    </div>
  );
}

export default function OwnerPayroll() {
  return (
    <AlertProvider>
      <PayrollContent />
    </AlertProvider>
  );
}