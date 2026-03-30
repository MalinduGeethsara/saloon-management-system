"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Card, Typography, Row, Col, Button, Divider, Select 
} from 'antd';
import { 
  ArrowLeftOutlined, PrinterOutlined, BankOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// --- Sri Lankan Payroll Constants ---
const EPF_EMPLOYEE_RATE = 0.08; 
const EPF_EMPLOYER_RATE = 0.12; 
const ETF_EMPLOYER_RATE = 0.03; 
const LEAVE_ALLOWANCE = 4;
const NO_PAY_RATE = 1000; 

// --- Mock Data Fetcher (Now reacts to the selected month) ---
const fetchEmployeePayroll = (id: string, month: string) => {
  // Simulating different data for different months so you can see the UI update
  let leavesTaken = 2;
  let commissions = 15000;
  let status = 'Paid';

  if (month === 'February 2026') {
    leavesTaken = 6; // Exceeds allowance, triggers No Pay
    commissions = 12000;
  } else if (month === 'January 2026') {
    leavesTaken = 0; // Perfect attendance
    commissions = 18000;
  } else if (month === 'March 2026') {
    status = 'Pending';
  }

  return { 
    id: id || 'EMP-001', 
    name: 'Kasun Perera', 
    role: 'Senior Barber', 
    department: 'Hair Styling',
    basicSalary: 75000, 
    allowances: 5000, 
    commissions: commissions, 
    leavesTaken: leavesTaken, 
    status: status, 
    method: 'Bank Transfer',
    bankDetails: 'BOC - 123456789',
    month: month
  };
};

export default function PayslipPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params?.id as string;

  // New State for Month Selection
  const [selectedMonth, setSelectedMonth] = useState('March 2026');

  // Fetch and Calculate based on the currently selected month
  const record = fetchEmployeePayroll(employeeId, selectedMonth);
  
  const grossEarnings = record.basicSalary + record.allowances + record.commissions;
  const epfDeduction = record.basicSalary * EPF_EMPLOYEE_RATE;
  const excessLeaves = Math.max(0, record.leavesTaken - LEAVE_ALLOWANCE);
  const noPayDeduction = excessLeaves * NO_PAY_RATE;
  const totalDeductions = epfDeduction + noPayDeduction;
  const netSalary = grossEarnings - totalDeductions;
  
  const epfEmployer = record.basicSalary * EPF_EMPLOYER_RATE;
  const etfEmployer = record.basicSalary * ETF_EMPLOYER_RATE;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* PRINT STYLES */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @media print {
            html, body {
              height: 100vh;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body * {
              visibility: hidden;
            }
            #printable-payslip, #printable-payslip * {
              visibility: visible;
            }
            #printable-payslip {
              position: absolute;
              left: 0;
              top: 0;
              width: 100vw;
              height: 100vh; 
              margin: 0;
              padding: 40px; 
              box-sizing: border-box;
              overflow: hidden; 
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
        `
      }} />

      <div className="max-w-[1000px] mx-auto pb-10 px-4">
        
        {/* ====================================================================
          1. SCREEN VIEW 
          ==================================================================== */}
        <div className="print:hidden">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Button 
              type="text" 
              shape="circle"
              size="large"
              icon={<ArrowLeftOutlined style={{ fontSize: '20px' }} />} 
              onClick={() => router.back()} 
              className="text-slate-500 hover:bg-slate-100"
            />
            
            {/* Added Dropdown and Print Button Group */}
            <div className="flex gap-3 w-full sm:w-auto">
              <Select 
                value={selectedMonth} 
                onChange={setSelectedMonth}
                size="large"
                className="w-full sm:w-48"
                options={[
                  { value: 'January 2026', label: 'January 2026' },
                  { value: 'February 2026', label: 'February 2026' },
                  { value: 'March 2026', label: 'March 2026' },
                ]}
              />
              <Button 
                type="primary" 
                size="large" 
                icon={<PrinterOutlined />} 
                onClick={handlePrint}
                className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-bold shadow-md shadow-purple-100 border-none w-full sm:w-auto"
              >
                Print Official Payslip
              </Button>
            </div>
          </div>

          <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden mb-8 transition-all duration-300">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 m-0">{record.name}</h3>
                <span className="text-sm font-bold text-[#7C4DFF] uppercase tracking-wider">{record.role}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  {record.month}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-2">ID: {record.id}</div>
              </div>
            </div>

            <div className="p-6">
              <Row gutter={[32, 32]} align="stretch">
                <Col xs={24} md={12}>
                  <div className="h-full flex flex-col">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" /> Earnings
                    </h4>
                    <div className="space-y-3 flex-grow">
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                        <span>Basic Salary</span><span>Rs. {record.basicSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                        <span>Fixed Allowances</span><span>Rs. {record.allowances.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-slate-600 transition-colors">
                        <span>Commissions</span><span className="text-emerald-600 font-bold">Rs. {record.commissions.toLocaleString()}</span>
                      </div>
                    </div>
                    <Divider className="my-4" />
                    <div className="flex justify-between font-black text-slate-800 text-lg mt-auto">
                      <span>Gross Earnings</span><span>Rs. {grossEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} md={12}>
                  <div className="h-full flex flex-col">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" /> Deductions
                    </h4>
                    <div className="space-y-3 flex-grow">
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                        <span>EPF (8%)</span><span className="text-red-500">Rs. {epfDeduction.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-slate-600 transition-colors">
                        <div className="flex flex-col">
                          <span>No Pay Leave</span>
                          <span className="text-[10px] text-slate-400">({excessLeaves} days over limit)</span>
                        </div>
                        <span className="text-red-500 font-bold">Rs. {noPayDeduction.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-slate-600">
                        <span>Salary Advances</span><span className="text-red-500">Rs. 0</span>
                      </div>
                    </div>
                    <Divider className="my-4 border-red-100" />
                    <div className="flex justify-between font-black text-red-600 text-lg mt-auto">
                      <span>Total Deductions</span><span>Rs. {totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="mt-8 bg-[#F3E8FF] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center border border-purple-100 gap-4 transition-all">
                <div>
                  <h4 className="text-xs font-bold text-[#7C4DFF] uppercase tracking-widest m-0">Net Salary Payable</h4>
                  <div className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                    <BankOutlined /> {record.method} ({record.bankDetails})
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-4xl font-black text-[#7C4DFF]">
                    Rs. {netSalary.toLocaleString()}
                  </div>
                  <div className={`text-xs font-bold mt-1 uppercase tracking-widest ${record.status === 'Paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                    Status: {record.status}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl flex items-start gap-3 border border-slate-100">
                <SafetyCertificateOutlined className="text-slate-400 text-lg mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employer Contributions (Not Deducted)</div>
                  <div className="text-xs text-slate-400 font-medium">
                    EPF (12%): Rs. {epfEmployer.toLocaleString()} &nbsp;•&nbsp; ETF (3%): Rs. {etfEmployer.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ====================================================================
          2. PRINTABLE PAYSLIP VIEW 
          ==================================================================== */}
        <div id="printable-payslip" className="hidden print:block bg-white text-black font-sans">
          
          <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-widest mb-1">Mr Polaa Salon</h1>
              <p className="text-sm m-0 font-medium">Main Street, Walasmulla, Sri Lanka</p>
              <p className="text-sm m-0 font-medium">Tel: +94 41 224 5678</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold uppercase tracking-widest border-2 border-black px-4 py-1 inline-block mb-2">Payslip</h2>
              <p className="text-sm font-bold m-0 uppercase">Month: {record.month}</p>
            </div>
          </div>

          <div className="border-2 border-black mb-8 text-sm">
            <div className="flex border-b border-black">
              <div className="w-1/2 p-3 border-r border-black flex justify-between">
                <span className="font-bold uppercase">Employee Name:</span> <span>{record.name}</span>
              </div>
              <div className="w-1/2 p-3 flex justify-between">
                <span className="font-bold uppercase">Employee ID:</span> <span>{record.id}</span>
              </div>
            </div>
            <div className="flex border-b border-black">
              <div className="w-1/2 p-3 border-r border-black flex justify-between">
                <span className="font-bold uppercase">Designation:</span> <span>{record.role}</span>
              </div>
              <div className="w-1/2 p-3 flex justify-between">
                <span className="font-bold uppercase">Department:</span> <span>{record.department}</span>
              </div>
            </div>
            <div className="flex">
              <div className="w-1/2 p-3 border-r border-black flex justify-between">
                <span className="font-bold uppercase">Payment Method:</span> <span>{record.method}</span>
              </div>
              <div className="w-1/2 p-3 flex justify-between">
                <span className="font-bold uppercase">Leaves Taken:</span> <span>{record.leavesTaken} / {LEAVE_ALLOWANCE}</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-black flex mb-8 text-sm">
            <div className="w-1/2 border-r border-black flex flex-col">
              <div className="bg-gray-100 p-2 border-b border-black text-center font-bold uppercase tracking-widest">Earnings</div>
              <div className="p-4 space-y-3 flex-grow min-h-[140px]">
                <div className="flex justify-between"><span>Basic Salary</span><span>{record.basicSalary.toLocaleString()}.00</span></div>
                <div className="flex justify-between"><span>Fixed Allowances</span><span>{record.allowances.toLocaleString()}.00</span></div>
                <div className="flex justify-between"><span>Commissions</span><span>{record.commissions.toLocaleString()}.00</span></div>
              </div>
              <div className="p-3 border-t border-black bg-gray-50 flex justify-between font-bold text-base mt-auto">
                <span>Gross Earnings</span><span>{grossEarnings.toLocaleString()}.00</span>
              </div>
            </div>

            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-100 p-2 border-b border-black text-center font-bold uppercase tracking-widest">Deductions</div>
              <div className="p-4 space-y-3 flex-grow min-h-[140px]">
                <div className="flex justify-between"><span>EPF (8%)</span><span>{epfDeduction.toLocaleString()}.00</span></div>
                <div className="flex justify-between"><span>No Pay ({excessLeaves} days)</span><span>{noPayDeduction.toLocaleString()}.00</span></div>
                <div className="flex justify-between"><span>Advances / Loans</span><span>0.00</span></div>
              </div>
              <div className="p-3 border-t border-black bg-gray-50 flex justify-between font-bold text-base mt-auto">
                <span>Total Deductions</span><span>{totalDeductions.toLocaleString()}.00</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-3 border-2 border-black mb-8">
            <div>
              <span className="text-xl font-bold uppercase tracking-widest block mb-1">Net Salary Payable</span>
              <span className="text-xs font-medium italic">Transfer to: {record.bankDetails}</span>
            </div>
            <span className="text-3xl font-black border-l-2 border-black pl-6 py-1">Rs. {netSalary.toLocaleString()}.00</span>
          </div>

          <div className="flex justify-between items-start mt-10 pt-6 text-sm">
            <div className="w-1/3">
              <p className="font-bold text-xs uppercase mb-2 border-b border-gray-400 pb-1 inline-block">Company Contributions</p>
              <p className="m-0 text-xs text-gray-600">EPF (12%): Rs. {epfEmployer.toLocaleString()}.00</p>
              <p className="m-0 text-xs text-gray-600">ETF (3%): Rs. {etfEmployer.toLocaleString()}.00</p>
            </div>
            
            <div className="w-2/3 flex justify-end gap-12 text-center">
              <div className="flex flex-col items-center">
                <div className="border-t-2 border-black w-40 pt-2 mt-10"><span className="text-[10px] font-bold uppercase tracking-wider">Employer Signature</span></div>
              </div>
              <div className="flex flex-col items-center">
                <div className="border-t-2 border-black w-40 pt-2 mt-10"><span className="text-[10px] font-bold uppercase tracking-wider">Employee Signature</span></div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8 text-[10px] font-mono text-gray-400 border-t border-gray-200 pt-3">
            This is a computer-generated document. • Generated on {dayjs().format('DD MMM YYYY, hh:mm A')}
          </div>
        </div>

      </div>
    </>
  );
}