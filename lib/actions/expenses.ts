'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { parsePageParams } from '@/lib/pagination';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategoryKey,
  type ExpenseInput,
  type ExpenseRow,
  type MonthSummary,
} from '@/lib/expense-categories';
import {
  type MonthRef,
  businessMonthBounds,
  lastNMonths,
  monthLabel,
  parseMonthKey,
  toMonthKey,
  utcMonthBounds,
} from '@/lib/utils/dateRanges';
import type { Prisma } from '@prisma/client';

// Expenses are the owner's private books: every action re-checks the session role on the server.
// (Route-level protection in middleware.ts keeps other roles off /owner/expenses, but server
// actions can be invoked directly, so they must not rely on that.)
async function requireOwner() {
  const session = await verifySession();
  if (!session || session.role !== 'OWNER') return null;
  return session;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) return null;
  const year = d.getUTCFullYear();
  if (year < 2020 || d.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) return null;
  return d;
}

function validateInput(input: ExpenseInput): { ok: true; data: Omit<Prisma.ExpenseUncheckedCreateInput, 'createdById'> } | { ok: false; message: string } {
  if (!EXPENSE_CATEGORIES.includes(input.category)) return { ok: false, message: 'Invalid category.' };

  const title = input.title?.trim();
  if (!title || title.length > 120) return { ok: false, message: 'Title is required (max 120 characters).' };

  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 1_000_000_000) {
    return { ok: false, message: 'Amount must be greater than 0.' };
  }

  const date = parseCalendarDate(input.date);
  if (!date) return { ok: false, message: 'Please choose a valid date.' };

  const supplier = input.supplier?.trim() || null;
  if (supplier && supplier.length > 120) return { ok: false, message: 'Supplier name is too long.' };
  const note = input.note?.trim() || null;
  if (note && note.length > 1000) return { ok: false, message: 'Note is too long (max 1000 characters).' };

  return {
    ok: true,
    data: {
      category: input.category,
      title,
      amount: round2(input.amount),
      date,
      supplier,
      note,
      shopId: input.shopId || null,
    },
  };
}

export async function createExpense(input: ExpenseInput) {
  try {
    const session = await requireOwner();
    if (!session) return { success: false, message: 'Unauthorized' };

    const parsed = validateInput(input);
    if (!parsed.ok) return { success: false, message: parsed.message };

    if (parsed.data.shopId) {
      const shop = await db.shop.findUnique({ where: { id: parsed.data.shopId }, select: { id: true } });
      if (!shop) return { success: false, message: 'Selected branch no longer exists.' };
    }

    await db.expense.create({ data: { ...parsed.data, createdById: session.id } });
    return { success: true };
  } catch (error) {
    console.error('Error creating expense:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function updateExpense(input: ExpenseInput) {
  try {
    const session = await requireOwner();
    if (!session) return { success: false, message: 'Unauthorized' };
    if (!input.id) return { success: false, message: 'Missing expense id.' };

    const parsed = validateInput(input);
    if (!parsed.ok) return { success: false, message: parsed.message };

    if (parsed.data.shopId) {
      const shop = await db.shop.findUnique({ where: { id: parsed.data.shopId }, select: { id: true } });
      if (!shop) return { success: false, message: 'Selected branch no longer exists.' };
    }

    const result = await db.expense.updateMany({ where: { id: input.id }, data: parsed.data });
    if (result.count === 0) return { success: false, message: 'Expense not found.' };
    return { success: true };
  } catch (error) {
    console.error('Error updating expense:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function deleteExpense(id: string) {
  try {
    const session = await requireOwner();
    if (!session) return { success: false, message: 'Unauthorized' };

    const result = await db.expense.deleteMany({ where: { id } });
    if (result.count === 0) return { success: false, message: 'Expense not found.' };
    return { success: true };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { success: false, message: 'Server Error' };
  }
}

export interface ExpenseListOptions {
  month: string; // "YYYY-MM"
  page?: number;
  pageSize?: number;
  category?: ExpenseCategoryKey | 'ALL';
  shopId?: string; // 'ALL' or a shop id
  q?: string;
}

export async function getExpenses(opts: ExpenseListOptions) {
  try {
    const session = await requireOwner();
    if (!session) return { success: false, message: 'Unauthorized' };

    const month = parseMonthKey(opts.month);
    if (!month) return { success: false, message: 'Invalid month.' };

    const params = parsePageParams({ page: opts.page ?? 1, pageSize: opts.pageSize });
    const { start, end } = utcMonthBounds(month);

    const where: Prisma.ExpenseWhereInput = { date: { gte: start, lt: end } };
    if (opts.category && opts.category !== 'ALL' && EXPENSE_CATEGORIES.includes(opts.category)) where.category = opts.category;
    if (opts.shopId && opts.shopId !== 'ALL') where.shopId = opts.shopId;
    const q = opts.q?.trim();
    if (q) where.OR = [{ title: { contains: q } }, { supplier: { contains: q } }, { note: { contains: q } }];

    const [rows, total, agg] = await db.$transaction([
      db.expense.findMany({
        where,
        include: { shop: { select: { name: true } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: params.skip,
        take: params.take,
      }),
      db.expense.count({ where }),
      db.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    const items: ExpenseRow[] = rows.map(r => ({
      id: r.id,
      category: r.category,
      title: r.title,
      amount: r.amount,
      date: r.date.toISOString().slice(0, 10),
      supplier: r.supplier,
      note: r.note,
      shopId: r.shopId,
      shopName: r.shop?.name ?? null,
    }));

    return {
      success: true,
      data: { items, total, page: params.page, pageSize: params.pageSize, sum: round2(agg._sum.amount ?? 0) },
    };
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return { success: false, message: 'Server Error' };
  }
}

// One month of money in/out. Wages count only Payroll marked PAID (bucketed by the pay period, not
// by when the row was created); processed-but-unpaid payroll is reported separately as "pending".
// Payroll.totalAmount is the net salary after the employee's EPF deduction, matching what the
// reports page treats as the wage expense; employer EPF/ETF remittances are not modelled.
async function summarizeMonth(m: MonthRef, shopId?: string): Promise<MonthSummary> {
  const expenseRange = utcMonthBounds(m);
  const revenueRange = businessMonthBounds(m);

  const [byCategory, payroll, revenue] = await Promise.all([
    db.expense.groupBy({
      by: ['category'],
      where: { date: { gte: expenseRange.start, lt: expenseRange.end }, ...(shopId ? { shopId } : {}) },
      _sum: { amount: true },
    }),
    db.payroll.groupBy({
      by: ['status'],
      where: { year: m.year, month: m.monthIndex, ...(shopId ? { user: { shopId } } : {}) },
      _sum: { totalAmount: true },
    }),
    db.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: revenueRange.start, lt: revenueRange.end },
        ...(shopId ? { booking: { shopId } } : {}),
      },
      _sum: { amount: true },
    }),
  ]);

  const cat = (key: ExpenseCategoryKey) => byCategory.find(r => r.category === key)?._sum?.amount ?? 0;
  const stock = cat('STOCK_ORDER');
  const petty = cat('PETTY_CASH');
  const bills = cat('UTILITIES') + cat('RENT') + cat('OTHER');
  const wages = payroll.find(r => r.status === 'PAID')?._sum?.totalAmount ?? 0;
  const wagesPending = payroll.find(r => r.status === 'PENDING')?._sum?.totalAmount ?? 0;
  const totalSpend = stock + petty + bills + wages;
  const revenueTotal = revenue._sum?.amount ?? 0;

  return {
    key: toMonthKey(m),
    label: monthLabel(m),
    stock: round2(stock),
    petty: round2(petty),
    bills: round2(bills),
    wages: round2(wages),
    wagesPending: round2(wagesPending),
    totalSpend: round2(totalSpend),
    revenue: round2(revenueTotal),
    net: round2(revenueTotal - totalSpend),
  };
}

export async function getExpenseOverview(opts: { month: string; compareMonth: string; shopId?: string }) {
  try {
    const session = await requireOwner();
    if (!session) return { success: false, message: 'Unauthorized' };

    const selected = parseMonthKey(opts.month);
    const compare = parseMonthKey(opts.compareMonth);
    if (!selected || !compare) return { success: false, message: 'Invalid month.' };

    const shopId = opts.shopId && opts.shopId !== 'ALL' ? opts.shopId : undefined;
    const trendMonths = lastNMonths(selected, 6);

    // The compare month may sit outside the 6-month trend window; each distinct month is computed once
    const needed = new Map<string, MonthRef>();
    [...trendMonths, compare].forEach(m => needed.set(toMonthKey(m), m));
    const summaries = new Map<string, MonthSummary>();
    await Promise.all(
      [...needed.entries()].map(async ([key, m]) => {
        summaries.set(key, await summarizeMonth(m, shopId));
      }),
    );

    return {
      success: true,
      data: {
        selected: summaries.get(toMonthKey(selected))!,
        compare: summaries.get(toMonthKey(compare))!,
        trend: trendMonths.map(m => summaries.get(toMonthKey(m))!),
      },
    };
  } catch (error) {
    console.error('Error building expense overview:', error);
    return { success: false, message: 'Server Error' };
  }
}

// Branch dropdown options for the owner's expense filters/forms
export async function getExpenseBranches() {
  try {
    const session = await requireOwner();
    if (!session) return { success: false, message: 'Unauthorized', data: [] as { id: string; name: string }[] };
    const shops = await db.shop.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    return { success: true, data: shops };
  } catch (error) {
    console.error('Error fetching branches:', error);
    return { success: false, message: 'Server Error', data: [] as { id: string; name: string }[] };
  }
}
