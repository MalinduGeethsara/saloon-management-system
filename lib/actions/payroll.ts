'use server';

import { db, withTransaction } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { authorize } from '@/lib/access.server';
import { notify } from '@/lib/services/notify';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Master Stylist',
  MANAGER: 'Manager',
  BARBER: 'Senior Barber',
  ADMIN: 'Administrator',
};

function parseMonthStr(monthStr: string) {
  const [monthName, yearStr] = monthStr.split(' ');
  const year = parseInt(yearStr);
  const monthIndex = new Date(Date.parse(monthName + " 1, " + year)).getMonth();
  return { monthIndex, year };
}

function buildBreakdownRow(c: any) {
  const isBooking = !!c.bookingId;
  return {
    id: c.id,
    source: isBooking ? 'booking' as const : 'manual' as const,
    date: isBooking ? c.booking?.date : (c.payment?.createdAt || c.createdAt),
    customerName: isBooking ? (c.booking?.customer?.name || 'Customer') : (c.payment?.clientName || 'Walk-in'),
    description: isBooking
      ? (c.booking?.services?.map((bs: any) => bs.service?.name).filter(Boolean).join(', ') || '')
      : (Array.isArray(c.payment?.items) ? (c.payment.items as any[]).map((i) => i.name).filter(Boolean).join(', ') : ''),
    billedAmount: c.billedAmount,
    rateApplied: c.rateApplied,
    amount: c.amount,
    swept: c.payrollId !== null,
  };
}

export async function getMonthlyPayroll(monthStr: string) {
  try {
    if (!(await authorize('/owner/hr/payroll', 'view'))) {
      return { success: false, message: 'Unauthorized' };
    }

    const { monthIndex, year } = parseMonthStr(monthStr);

    const staff = await db.user.findMany({
      where: { role: { in: ['BARBER', 'MANAGER'] } },
      include: {
        payroll: { where: { month: monthIndex, year } },
        commissions: {
          where: { month: monthIndex, year },
          include: {
            booking: { include: { customer: true, services: { include: { service: true } } } },
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
        }
      }
    });

    const payrollData = staff.map(employee => {
      const breakdown = employee.commissions.map(buildBreakdownRow);
      const totalCommission = employee.commissions.reduce((sum, c) => sum + c.amount, 0);
      const totalRevenue = employee.commissions.reduce((sum, c) => sum + c.billedAmount, 0);
      const unswept = employee.commissions
        .filter(c => c.payrollId === null)
        .reduce((sum, c) => sum + c.amount, 0);

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
          revenueGenerated: totalRevenue,
          breakdown,
          unswept,
        };
      }

      return {
        key: employee.id,
        payrollId: null,
        id: `EMP-${employee.id.slice(0, 4).toUpperCase()}`,
        name: employee.name,
        role: ROLE_LABELS[employee.role] ?? employee.role,
        salaryType: employee.salaryType || 'Commission',
        basicSalary: employee.baseSalary || 0,
        commissionRate: employee.commissionRate || 0,
        allowances: employee.allowances || 0,
        commissions: totalCommission,
        leavesTaken: 0,
        status: 'Pending',
        method: 'Bank Transfer',
        revenueGenerated: totalRevenue,
        breakdown,
        unswept: 0, // nothing has been "processed" yet for this month, so drift doesn't apply
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
    if (!(await authorize('/owner/hr/payroll', 'add'))) {
      return { success: false, message: 'Unauthorized' };
    }

    const { monthIndex, year } = parseMonthStr(monthStr);

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

    await withTransaction(async (tx) => {
      for (const p of payrollsToCreate) {
        const payroll = await tx.payroll.create({ data: p });
        // Sweep this barber's not-yet-swept commissions for the month into the new payroll run,
        // so the payslip can trace exactly which bookings/bills produced its bonus figure.
        await tx.commission.updateMany({
          where: { barberId: p.userId, month: monthIndex, year, payrollId: null },
          data: { payrollId: payroll.id }
        });
      }
    });

    return { success: true, message: 'Payroll processed and locked successfully.' };
  } catch (error) {
    console.error('Error processing payroll:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function markPayrollPaid(payrollId: string) {
  try {
    const allowed = await authorize('/owner/hr/payroll', 'edit');
    if (!allowed) {
      return { success: false, message: 'Unauthorized' };
    }

    const before = await db.payroll.findUnique({ where: { id: payrollId }, select: { status: true } });
    const payroll = await db.payroll.update({
      where: { id: payrollId },
      data: { status: 'PAID' }
    });

    // The employee is told their salary was paid (only the first time it flips to PAID)
    if (before && before.status !== 'PAID') {
      const label = new Date(payroll.year, payroll.month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const amount = `LKR ${Math.round(payroll.totalAmount).toLocaleString()}`;
      void notify({
        event: 'PAYSLIP_PAID',
        title: 'Salary Paid',
        desc: `Your salary for ${label} (${amount}) has been paid.`,
        sms: `MR POLAA: Your salary for ${label} (${amount}) has been paid.`,
        employeeIds: [payroll.userId],
        actorId: allowed.session.id,
        ref: { type: 'PAYROLL', id: payroll.id },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking payroll paid:', error);
    return { success: false, message: 'Server Error' };
  }
}

// Self-service — a barber/manager can see only their own commission history, never another's.
export async function getMyCommissions(monthStr: string) {
  try {
    const session = await verifySession();
    if (!session || !['BARBER', 'MANAGER'].includes(session.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    const { monthIndex, year } = parseMonthStr(monthStr);

    const commissions = await db.commission.findMany({
      where: { barberId: session.id, month: monthIndex, year },
      include: {
        booking: { include: { customer: true, services: { include: { service: true } } } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const lifetime = await db.commission.aggregate({
      where: { barberId: session.id },
      _sum: { amount: true },
    });

    return {
      success: true,
      data: {
        monthTotal: commissions.reduce((sum, c) => sum + c.amount, 0),
        transactionCount: commissions.length,
        lifetimeTotal: lifetime._sum.amount || 0,
        breakdown: commissions.map(buildBreakdownRow),
      }
    };
  } catch (error) {
    console.error('Error fetching my commissions:', error);
    return { success: false, message: 'Server Error' };
  }
}
