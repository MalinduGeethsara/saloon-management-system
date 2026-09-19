"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Col, DatePicker, Empty, Input, Row, Segmented, Select, Table, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { AlertProvider, useAlert } from '@/components/alerts/AlertSystem';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { ExpenseModal } from '@/components/modals/ExpenseModal';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { CompareChart, TrendChart, COMPARE_COLORS } from '@/components/expenses/ExpenseCharts';
import {
  createExpense,
  deleteExpense,
  getExpenseBranches,
  getExpenseOverview,
  getExpenses,
  updateExpense,
} from '@/lib/actions/expenses';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  SPEND_GROUPS,
  type ExpenseCategoryKey,
  type ExpenseInput,
  type ExpenseRow,
  type MonthSummary,
} from '@/lib/expense-categories';
import { formatCurrency } from '@/lib/utils';

const { Title, Text } = Typography;

const PAGE_SIZE = 10;
const CATEGORY_DOT: Record<ExpenseCategoryKey, string> = {
  STOCK_ORDER: SPEND_GROUPS[0].color,
  PETTY_CASH: SPEND_GROUPS[1].color,
  UTILITIES: SPEND_GROUPS[3].color,
  RENT: SPEND_GROUPS[3].color,
  OTHER: SPEND_GROUPS[3].color,
};

interface Overview {
  selected: MonthSummary;
  compare: MonthSummary;
  trend: MonthSummary[];
}

// "Up is bad" for money going out, "up is good" for revenue/net
function Delta({ current, previous, upIsGood, prevLabel }: { current: number; previous: number; upIsGood: boolean; prevLabel: string }) {
  const diff = current - previous;
  if (Math.abs(diff) < 0.005) {
    return <span className="text-[11px] text-slate-400">No change vs {prevLabel}</span>;
  }
  const up = diff > 0;
  const good = up === upIsGood;
  const pct = previous !== 0 ? ` ${Math.abs((diff / Math.abs(previous)) * 100).toFixed(1)}%` : '';
  return (
    <span className={`text-[11px] font-semibold ${good ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {pct || ` ${formatCurrency(Math.abs(diff))}`} <span className="font-normal text-slate-400">vs {prevLabel}</span>
    </span>
  );
}

function Tile({
  label, value, current, previous, upIsGood, prevLabel, note, accent,
}: {
  label: string; value: number; current: number; previous: number; upIsGood: boolean; prevLabel: string; note?: string; accent?: string;
}) {
  return (
    <Card variant="borderless" className="shadow-sm rounded-2xl h-full" styles={{ body: { padding: 16 } }}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {accent && <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: accent }} />}
        {label}
      </div>
      <div className={`mt-1 font-extrabold ${value < 0 ? 'text-red-500' : 'text-slate-800'}`} style={{ fontSize: 'clamp(18px, 5vw, 24px)' }}>
        {formatCurrency(value)}
      </div>
      <div className="mt-0.5"><Delta current={current} previous={previous} upIsGood={upIsGood} prevLabel={prevLabel} /></div>
      {note && <div className="mt-1 text-[11px] text-slate-400">{note}</div>}
    </Card>
  );
}

function ExpensesContent() {
  const { showAlert } = useAlert();

  const [month, setMonth] = useState<Dayjs>(() => dayjs().startOf('month'));
  const [compareMonth, setCompareMonth] = useState<Dayjs>(() => dayjs().startOf('month').subtract(1, 'month'));
  const [shopId, setShopId] = useState<string>('ALL');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [compareView, setCompareView] = useState<'Chart' | 'Table'>('Chart');

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [sum, setSum] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<ExpenseCategoryKey | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [toDelete, setToDelete] = useState<ExpenseRow | null>(null);

  const monthKey = month.format('YYYY-MM');
  const compareKey = compareMonth.format('YYYY-MM');
  const overviewSeq = useRef(0);
  const listSeq = useRef(0);

  const loadOverview = useCallback(async () => {
    const seq = ++overviewSeq.current;
    setLoadingOverview(true);
    const res = await getExpenseOverview({ month: monthKey, compareMonth: compareKey, shopId });
    if (seq !== overviewSeq.current) return; // superseded by a newer request
    if (res.success && res.data) setOverview(res.data);
    else showAlert('error', res.message || 'Failed to load expenses overview');
    setLoadingOverview(false);
  }, [monthKey, compareKey, shopId, showAlert]);

  const loadList = useCallback(async (pageToLoad: number) => {
    const seq = ++listSeq.current;
    setLoadingList(true);
    const res = await getExpenses({ month: monthKey, page: pageToLoad, pageSize: PAGE_SIZE, category, shopId, q: debouncedSearch });
    if (seq !== listSeq.current) return;
    if (res.success && res.data) {
      // The last row of the last page was deleted: step back to the new last page
      if (res.data.items.length === 0 && res.data.total > 0 && pageToLoad > 1) {
        setPage(Math.max(1, Math.ceil(res.data.total / PAGE_SIZE)));
        return;
      }
      setRows(res.data.items);
      setTotal(res.data.total);
      setSum(res.data.sum);
    } else {
      showAlert('error', res.message || 'Failed to load expenses');
    }
    setLoadingList(false);
  }, [monthKey, category, shopId, debouncedSearch, showAlert]);

  useEffect(() => {
    getExpenseBranches().then(res => { if (res.success) setBranches(res.data); });
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadList(page); }, [loadList, page]);

  // Debounce the search box; a new search always starts from page 1
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchText.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const refreshAll = () => { loadOverview(); loadList(page); };

  const handleSave = async (data: ExpenseInput): Promise<boolean> => {
    const res = data.id ? await updateExpense(data) : await createExpense(data);
    if (!res.success) {
      showAlert('error', res.message || 'Failed to save expense.');
      return false;
    }
    showAlert('success', data.id ? 'Expense updated.' : 'Expense added.');
    refreshAll();
    return true;
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const res = await deleteExpense(toDelete.id);
    if (res.success) {
      showAlert('success', 'Expense deleted.');
      refreshAll();
    } else {
      showAlert('error', res.message || 'Failed to delete expense.');
    }
    setToDelete(null);
  };

  const openAdd = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (row: ExpenseRow) => { setEditing(row); setIsModalOpen(true); };

  const sel = overview?.selected;
  const cmp = overview?.compare;

  const categoryLabel = (c: ExpenseCategoryKey) => (
    <span className="inline-flex items-center gap-1.5 text-slate-700 text-[13px]">
      <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: CATEGORY_DOT[c] }} />
      {EXPENSE_CATEGORY_LABELS[c]}
    </span>
  );

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (d: string) => <span className="text-slate-500">{dayjs(d).format('MMM DD, YYYY')}</span> },
    {
      title: 'Description', dataIndex: 'title', key: 'title',
      render: (t: string, r: ExpenseRow) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{t}</span>
          {(r.supplier || r.note) && <span className="text-[11px] text-slate-400 truncate max-w-[320px]">{[r.supplier, r.note].filter(Boolean).join(' • ')}</span>}
        </div>
      ),
    },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 150, render: (c: ExpenseCategoryKey) => categoryLabel(c) },
    { title: 'Branch', dataIndex: 'shopName', key: 'shopName', width: 150, render: (s: string | null) => <span className="text-[12px] text-slate-600">{s || 'All / general'}</span> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 150, align: 'right' as const, render: (a: number) => <span className="font-mono font-bold text-slate-800">{formatCurrency(a)}</span> },
    {
      title: '', key: 'actions', width: 90, align: 'right' as const,
      render: (_: unknown, r: ExpenseRow) => (
        <div className="flex justify-end gap-1">
          <Button type="text" shape="circle" icon={<EditOutlined />} aria-label="Edit expense" onClick={() => openEdit(r)} />
          <Button type="text" shape="circle" danger icon={<DeleteOutlined />} aria-label="Delete expense" onClick={() => setToDelete(r)} />
        </div>
      ),
    },
  ];

  const compareRows = sel && cmp
    ? [
        ...SPEND_GROUPS.map(g => ({ key: g.key, label: g.label, color: g.color, cur: sel[g.key], prev: cmp[g.key] })),
        { key: 'total', label: 'Total spend', color: '', cur: sel.totalSpend, prev: cmp.totalSpend },
        { key: 'revenue', label: 'Revenue', color: '', cur: sel.revenue, prev: cmp.revenue },
        { key: 'net', label: 'Net (revenue − spend)', color: '', cur: sel.net, prev: cmp.net },
      ]
    : [];

  return (
    <div className="max-w-[1600px] mx-auto pb-10 px-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Expenses</Title>
          <Text type="secondary">Stock orders, petty cash, bills and wages in one place, compared month to month.</Text>
        </div>
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month</span>
            <DatePicker
              picker="month" allowClear={false} format="MMMM YYYY" value={month} size="large" className="w-full"
              disabledDate={(d) => d.isAfter(dayjs(), 'month')}
              onChange={(d) => { if (d) { setMonth(d.startOf('month')); setPage(1); } }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compare with</span>
            <DatePicker
              picker="month" allowClear={false} format="MMMM YYYY" value={compareMonth} size="large" className="w-full"
              disabledDate={(d) => d.isAfter(dayjs(), 'month')}
              onChange={(d) => { if (d) setCompareMonth(d.startOf('month')); }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch</span>
            <Select
              size="large" value={shopId} className="w-full lg:w-48"
              onChange={(v) => { setShopId(v); setPage(1); }}
              options={[{ value: 'ALL', label: 'All branches' }, ...branches.map(b => ({ value: b.id, label: b.name }))]}
            />
          </div>
          <Button
            type="primary" size="large" icon={<PlusOutlined />} onClick={openAdd}
            className="bg-[#7C4DFF] hover:bg-[#6c42e0] rounded-xl font-semibold border-none h-10 self-end w-full lg:w-auto"
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      {sel && cmp ? (
        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} md={12} xl={6}>
            <Tile label={`Total spend · ${sel.label}`} value={sel.totalSpend} current={sel.totalSpend} previous={cmp.totalSpend} upIsGood={false} prevLabel={cmp.label}
              note={sel.wagesPending > 0 ? `+ ${formatCurrency(sel.wagesPending)} wages processed, not yet paid` : undefined} />
          </Col>
          {SPEND_GROUPS.map(g => (
            <Col xs={12} md={6} xl={4} key={g.key}>
              <Tile label={g.label} accent={g.color} value={sel[g.key]} current={sel[g.key]} previous={cmp[g.key]} upIsGood={false} prevLabel={cmp.label} />
            </Col>
          ))}
          <Col xs={12} md={6} xl={3}>
            <Tile label="Revenue" value={sel.revenue} current={sel.revenue} previous={cmp.revenue} upIsGood prevLabel={cmp.label}
              note={shopId !== 'ALL' ? 'Booking payments only (walk-in bills have no branch)' : undefined} />
          </Col>
          <Col xs={12} md={6} xl={3}>
            <Tile label="Net" value={sel.net} current={sel.net} previous={cmp.net} upIsGood prevLabel={cmp.label} />
          </Col>
        </Row>
      ) : (
        <div className="h-32 mb-6 rounded-2xl bg-white animate-pulse" />
      )}

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} xl={10}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full" loading={loadingOverview && !overview}
            title={<span className="font-bold">{sel && cmp ? `${sel.label} vs ${cmp.label}` : 'Month comparison'}</span>}
            extra={<Segmented size="small" value={compareView} onChange={(v) => setCompareView(v as 'Chart' | 'Table')} options={['Chart', 'Table']} />}
          >
            {sel && cmp && (compareView === 'Chart' ? (
              <CompareChart selected={sel} compare={cmp} />
            ) : (
              <Table
                size="small" pagination={false} rowKey="key" dataSource={compareRows} scroll={{ x: 'max-content' }}
                columns={[
                  { title: '', dataIndex: 'label', key: 'label', render: (l: string, r: any) => (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      {r.color && <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: r.color }} />}{l}
                    </span>
                  ) },
                  { title: sel.label, dataIndex: 'cur', key: 'cur', align: 'right' as const, render: (v: number) => <span style={{ color: COMPARE_COLORS.selected }} className="font-mono font-bold">{formatCurrency(v)}</span> },
                  { title: cmp.label, dataIndex: 'prev', key: 'prev', align: 'right' as const, render: (v: number) => <span className="font-mono text-slate-500">{formatCurrency(v)}</span> },
                  { title: 'Change', key: 'chg', align: 'right' as const, render: (_: unknown, r: any) => <span className="font-mono">{r.cur - r.prev >= 0 ? '+' : '−'}{formatCurrency(Math.abs(r.cur - r.prev))}</span> },
                ]}
              />
            ))}
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card variant="borderless" className="shadow-sm rounded-3xl h-full" loading={loadingOverview && !overview}
            title={<span className="font-bold">Last 6 months: spending vs revenue</span>}
          >
            {overview && <TrendChart months={overview.trend} />}
          </Card>
        </Col>
      </Row>

      {/* Expenses list */}
      <Card variant="borderless" className="shadow-sm rounded-3xl overflow-hidden" styles={{ body: { padding: 0 } }}>
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-800">{sel?.label ?? month.format('MMM YYYY')} entries</div>
            <div className="text-xs text-slate-500">
              {total} {total === 1 ? 'entry' : 'entries'} · {formatCurrency(sum)} logged here. Wages are added automatically from Payroll.
            </div>
          </div>
          <Input
            allowClear prefix={<SearchOutlined className="text-slate-400" />} placeholder="Search description, supplier, note"
            value={searchText} onChange={(e) => setSearchText(e.target.value)} className="lg:max-w-xs"
          />
          <Select
            value={category} className="w-full lg:w-44"
            onChange={(v) => { setCategory(v); setPage(1); }}
            options={[{ value: 'ALL', label: 'All categories' }, ...EXPENSE_CATEGORIES.map(c => ({ value: c, label: EXPENSE_CATEGORY_LABELS[c] }))]}
          />
        </div>

        <ResponsiveTable
          columns={columns}
          dataSource={rows}
          loading={loadingList}
          rowKey="id"
          pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: (p) => setPage(p) }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No expenses logged for this selection" /> }}
          scroll={{ x: 900 }}
          renderMobileCard={(r: ExpenseRow) => (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{r.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{dayjs(r.date).format('MMM DD, YYYY')}{r.shopName ? ` • ${r.shopName}` : ''}</div>
                </div>
                <span className="font-mono font-bold text-slate-800 shrink-0">{formatCurrency(r.amount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                {categoryLabel(r.category)}
                <div className="flex gap-1">
                  <Button size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</Button>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); setToDelete(r); }} aria-label="Delete expense" />
                </div>
              </div>
              {(r.supplier || r.note) && <div className="mt-2 text-[11px] text-slate-400">{[r.supplier, r.note].filter(Boolean).join(' • ')}</div>}
            </div>
          )}
        />
      </Card>

      <p className="mt-4 text-[11px] text-slate-400">
        Wages = net salaries from Payroll marked <b>Paid</b> for the month (statutory EPF/ETF remittances are not included). Revenue = completed payments.
        Months follow Sri Lanka time.
      </p>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        expenseToEdit={editing}
        branches={branches}
        defaultDate={month.isSame(dayjs(), 'month') ? dayjs().format('YYYY-MM-DD') : month.endOf('month').format('YYYY-MM-DD')}
      />

      <ConfirmationModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Expense?"
        description={toDelete ? `Remove "${toDelete.title}" (${formatCurrency(toDelete.amount)})? This changes this month's totals.` : ''}
        confirmText="Yes, Delete"
        isDanger={true}
      />
    </div>
  );
}

export default function OwnerExpensesPage() {
  return (
    <AlertProvider>
      <ExpensesContent />
    </AlertProvider>
  );
}
