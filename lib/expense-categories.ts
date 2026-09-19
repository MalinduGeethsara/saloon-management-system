// Shared (client + server) definitions for the Expenses feature. Plain module: 'use server' files
// may only export async functions, so constants and types live here.

export const EXPENSE_CATEGORIES = ['STOCK_ORDER', 'PETTY_CASH', 'UTILITIES', 'RENT', 'OTHER'] as const;
export type ExpenseCategoryKey = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryKey, string> = {
  STOCK_ORDER: 'Stock order',
  PETTY_CASH: 'Petty cash',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  OTHER: 'Other',
};

// The overview groups the money going out into four buckets. Wages come from Payroll, the rest
// from Expense rows. Colours are a validated colour-blind-safe categorical set (fixed order).
export const SPEND_GROUPS = [
  { key: 'stock', label: 'Stock orders', color: '#2a78d6' },
  { key: 'petty', label: 'Petty cash', color: '#eb6834' },
  { key: 'wages', label: 'Wages', color: '#4a3aa7' },
  { key: 'bills', label: 'Bills & other', color: '#1baf7a' },
] as const;
export type SpendGroupKey = (typeof SPEND_GROUPS)[number]['key'];

export interface MonthSummary {
  key: string;      // "YYYY-MM"
  label: string;    // "Sep 2026"
  stock: number;
  petty: number;
  bills: number;    // utilities + rent + other
  wages: number;    // Payroll marked PAID for that period
  wagesPending: number; // Payroll processed but not yet paid (accrued, not counted in totalSpend)
  totalSpend: number;
  revenue: number;  // completed payments
  net: number;      // revenue - totalSpend
}

export interface ExpenseRow {
  id: string;
  category: ExpenseCategoryKey;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  supplier: string | null;
  note: string | null;
  shopId: string | null;
  shopName: string | null;
}

export interface ExpenseInput {
  id?: string;
  category: ExpenseCategoryKey;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  supplier?: string | null;
  note?: string | null;
  shopId?: string | null;
}
