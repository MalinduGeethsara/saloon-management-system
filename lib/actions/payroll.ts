'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Master Stylist',
  MANAGER: 'Manager',
  BARBER: 'Senior Barber',
  ADMIN: 'Administrator',
};

export async function getMonthlyPayroll(monthStr: string) {
  try {
    const session = await verifySession();
    if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    const [monthName, yearStr] = monthStr.split(' ');
    const year = parseInt(yearStr);
    const monthIndex = new Date(Date.parse(monthName + " 1, " + year)).getMonth();

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const staff = await db.user.findMany({
      where: { role: { in: ['BARBER', 'MANAGER'] } },
      include: {
        payroll: { where: { month: monthIndex, year: year } },
        bookingsAsBarber: {
          where: {
            status: 'COMPLETED',
            date: { gte: startDate, lte: endDate }
          }
        }
      }
    });

    const payrollData = staff.map(employee => {
      if (employee.payroll && employee.payroll.length > 0) {
        const saved = employee.payroll[0];
        return {
          key: employee.id,
          payrollId: saved.id,
          id: `EMP-${employee.id.slice(0, 4).toUpperCase()}`,
          name: employee.name,
          role: ROLE_LABELS[employee.role] ?? employee.role,
          salaryType: employee.salaryType || 'Commission',
          basicSalary: saved.baseSalary,
          commissionRate: employee.commissionRate || 0,
          allowances: employee.allowances || 0,
          commissions: saved.bonus || 0,
          leavesTaken: 0,
          status: saved.status === 'PAID' ? 'Paid' : 'Pending',
          method: 'Bank Transfer',
          revenueGenerated: 0,
        };
      }

      const totalRevenue = employee.bookingsAsBarber.reduce((sum, b) => sum + b.totalAmount, 0);
      const salaryType = employee.salaryType || 'Commission';
      const commissionAmount = (totalRevenue * (employee.commissionRate || 0)) / 100;

      return {
        key: employee.id,
        payrollId: null,
        id: `EMP-${employee.id.slice(0, 4).toUpperCase()}`,
        name: employee.name,
        role: ROLE_LABELS[employee.role] ?? employee.role,
        salaryType,
        basicSalary: employee.baseSalary || 0,
        commissionRate: employee.commissionRate || 0,
        allowances: employee.allowances || 0,
        commissions: commissionAmount,
        leavesTaken: 0,
        status: 'Pending',
        method: 'Bank Transfer',
        revenueGenerated: totalRevenue,
      };
    });

    return { success: true, data: payrollData };
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function processPayroll(monthStr: string) {
  try {
    const session = await verifySession();
    if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    const [monthName, yearStr] = monthStr.split(' ');
    const year = parseInt(yearStr);
    const monthIndex = new Date(Date.parse(monthName + " 1, " + year)).getMonth();

    const existing = await db.payroll.findFirst({ where: { month: monthIndex, year } });
    if (existing) {
      return { success: false, message: 'Payroll has already been processed for this month.' };
    }

    const previewRes = await getMonthlyPayroll(monthStr);
    if (!previewRes.success || !previewRes.data) return previewRes;

    const EPF_EMPLOYEE_RATE = 0.08;
    const NO_PAY_RATE = 1000;
    const LEAVE_ALLOWANCE = 4;

    const payrollsToCreate = previewRes.data.map(emp => {
      const grossEarnings = emp.basicSalary + emp.allowances + emp.commissions;
      const epfDeduction = emp.basicSalary * EPF_EMPLOYEE_RATE;
      const excessLeaves = Math.max(0, emp.leavesTaken - LEAVE_ALLOWANCE);
      const noPayDeduction = excessLeaves * NO_PAY_RATE;
      const netSalary = grossEarnings - (epfDeduction + noPayDeduction);

      return {
        userId: emp.key,
        month: monthIndex,
        year,
        baseSalary: emp.basicSalary,
        bonus: emp.commissions,
        totalAmount: netSalary,
        status: 'PENDING',
      };
    });

    if (payrollsToCreate.length === 0) {
      return { success: false, message: 'No active staff to process.' };
    }

    await db.$transaction(
      payrollsToCreate.map(p => db.payroll.create({ data: p }))
    );

    return { success: true, message: 'Payroll processed and locked successfully.' };
  } catch (error) {
    console.error('Error processing payroll:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function markPayrollPaid(payrollId: string) {
  try {
    const session = await verifySession();
    if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    await db.payroll.update({
      where: { id: payrollId },
      data: { status: 'PAID' }
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking payroll paid:', error);
    return { success: false, message: 'Server Error' };
  }
}
