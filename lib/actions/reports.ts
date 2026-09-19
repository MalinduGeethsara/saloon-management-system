'use server';

import { db } from '@/lib/db';
import { authorize } from '@/lib/access.server';
import { Prisma } from '@prisma/client';

// Owner, or a manager the owner gave the Reports page
async function requireReportsAccess() {
  const allowed = await authorize('/owner/reports', 'view');
  return allowed ? allowed.session : null;
}

function resolveDateRange(startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }
  return { start: new Date(new Date().getFullYear(), 0, 1), end: new Date() };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getReportsAnalytics(shopId: string | 'all', startDate?: string, endDate?: string) {
  try {
    const session = await requireReportsAccess();
    if (!session) return { success: false, message: 'Unauthorized' };

    const { start, end } = resolveDateRange(startDate, endDate);

    const shopFilter = shopId !== 'all' ? { shopId } : {};
    const paymentShopFilter = shopId !== 'all' ? { booking: { shopId } } : {};

    // 1. Performance Data (Monthly Revenue vs Expense)
    const payments = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
        ...paymentShopFilter
      },
      select: { amount: true, createdAt: true }
    });

    const payrolls = await db.payroll.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: start, lte: end },
        user: shopId !== 'all' ? { shopId } : {}
      },
      select: { totalAmount: true, createdAt: true }
    });

    const monthlyData: Record<string, { month: string, revenue: number, expense: number }> = {};

    // Initialize months between start and end
    const current = new Date(start);
    while (current <= end) {
      const key = `${current.getFullYear()}-${current.getMonth()}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: MONTH_NAMES[current.getMonth()], revenue: 0, expense: 0 };
      }
      current.setMonth(current.getMonth() + 1);
    }

    payments.forEach(p => {
      const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
      if (monthlyData[key]) {
        monthlyData[key].revenue += p.amount;
      }
    });

    payrolls.forEach(p => {
      const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`;
      if (monthlyData[key]) {
        monthlyData[key].expense += p.totalAmount;
      }
    });

    // To prevent extremely large bars, we calculate max value and normalize to 100% for the chart.
    const performanceDataRaw = Object.values(monthlyData);
    let maxVal = 1;
    performanceDataRaw.forEach(d => {
      if (d.revenue > maxVal) maxVal = d.revenue;
      if (d.expense > maxVal) maxVal = d.expense;
    });

    const performanceData = performanceDataRaw.map(d => ({
      month: d.month,
      rawRevenue: d.revenue,
      rawExpense: d.expense,
      revenue: d.revenue === 0 ? 0 : Math.max(5, Math.round((d.revenue / maxVal) * 100)),
      expense: d.expense === 0 ? 0 : Math.max(5, Math.round((d.expense / maxVal) * 100)),
      // Margin must be computed from the RAW dollar values (d.revenue/d.expense), never the
      // normalized 0-100 bar-height fields above — null (not 0) when there's no revenue to divide by,
      // so the UI can render a visible gap instead of a fake 0%.
      margin: d.revenue === 0 ? null : Math.round(((d.revenue - d.expense) / d.revenue) * 100),
    }));

    const totalRevenue = performanceDataRaw.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpense = performanceDataRaw.reduce((sum, item) => sum + item.expense, 0);
    const netProfit = totalRevenue - totalExpense;
    const overallMargin = totalRevenue === 0 ? null : Math.round((netProfit / totalRevenue) * 100);

    // 2. Top Staff
    const completedBookings = await db.booking.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
        ...shopFilter,
        barberId: { not: null }
      },
      include: {
        barber: true,
        payment: true
      }
    });

    const staffStats: Record<string, { name: string, role: string, revenue: number, avatar: string | null }> = {};
    completedBookings.forEach(b => {
      if (b.barberId && b.barber) {
        if (!staffStats[b.barberId]) {
          staffStats[b.barberId] = {
            name: b.barber.name,
            role: b.barber.role === 'BARBER' ? 'Stylist' : 'Senior Stylist',
            revenue: 0,
            avatar: b.barber.imageUrl
          };
        }
        if (b.payment?.status === 'COMPLETED') {
          staffStats[b.barberId].revenue += b.payment.amount;
        }
      }
    });

    let maxStaffRev = 1;
    Object.values(staffStats).forEach(s => { if (s.revenue > maxStaffRev) maxStaffRev = s.revenue; });

    const topStaff = Object.values(staffStats)
      .sort((a, b) => b.revenue - a.revenue)
      .map(s => ({
        ...s,
        percentage: Math.round((s.revenue / maxStaffRev) * 100)
      }));

    // 3. Top Services
    const bookingServices = await db.bookingService.findMany({
      where: {
        booking: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: start, lte: end },
          ...shopFilter
        }
      },
      include: { service: true }
    });

    const serviceStats: Record<string, { name: string, count: number }> = {};
    let maxServiceCount = 1;

    bookingServices.forEach(bs => {
      if (bs.service) {
        if (!serviceStats[bs.serviceId]) {
          serviceStats[bs.serviceId] = { name: bs.service.name, count: 0 };
        }
        serviceStats[bs.serviceId].count += 1;
        if (serviceStats[bs.serviceId].count > maxServiceCount) {
          maxServiceCount = serviceStats[bs.serviceId].count;
        }
      }
    });

    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .map(s => ({
        ...s,
        percentage: Math.round((s.count / maxServiceCount) * 100)
      }));

    // Summary metrics
    const appointments = await db.booking.count({
      where: {
        createdAt: { gte: start, lte: end },
        ...shopFilter
      }
    });

    const newCustomersCount = await db.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: start, lte: end }
      }
    });

    return {
      success: true,
      data: {
        performanceData,
        topStaff,
        topServices,
        summary: {
          totalRevenue,
          netProfit,
          overallMargin,
          appointments,
          newCustomers: newCustomersCount
        }
      }
    };

  } catch (error) {
    console.error('Error fetching reports analytics:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function getShopComparisonAnalytics(startDate?: string, endDate?: string) {
  try {
    const session = await requireReportsAccess();
    if (!session) return { success: false, message: 'Unauthorized' };

    const { start, end } = resolveDateRange(startDate, endDate);

    const shops = await db.shop.findMany({ select: { id: true, name: true } });

    const bookingAgg = await db.booking.groupBy({
      by: ['shopId'],
      where: { date: { gte: start, lte: end }, shopId: { not: null }, status: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });

    // Payment has no shopId of its own — attribute revenue via the linked booking's shop.
    // Using Payment.amount (not Booking.totalAmount) to stay consistent with the revenue
    // definition used in getReportsAnalytics above. Note: app/api/v1/shops/route.ts computes
    // "revenue" differently (from Booking.totalAmount) — a pre-existing inconsistency in the
    // codebase; this function intentionally does not introduce a third definition.
    const payments = await db.payment.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: start, lte: end }, booking: { shopId: { not: null } } },
      select: { amount: true, booking: { select: { shopId: true } } },
    });
    const revenueByShop: Record<string, number> = {};
    payments.forEach(p => {
      const sid = p.booking?.shopId;
      if (!sid) return;
      revenueByShop[sid] = (revenueByShop[sid] || 0) + p.amount;
    });

    const completedBookings = await db.booking.findMany({
      where: { status: 'COMPLETED', date: { gte: start, lte: end }, barberId: { not: null } },
      include: { barber: { select: { id: true, name: true, shopId: true, imageUrl: true } }, payment: true },
    });
    const staffByShop: Record<string, Record<string, { name: string; revenue: number; bookings: number; avatar: string | null }>> = {};
    completedBookings.forEach(b => {
      if (!b.barberId || !b.barber?.shopId) return;
      const sid = b.barber.shopId;
      staffByShop[sid] ??= {};
      staffByShop[sid][b.barberId] ??= { name: b.barber.name, revenue: 0, bookings: 0, avatar: b.barber.imageUrl };
      staffByShop[sid][b.barberId].bookings += 1;
      if (b.payment?.status === 'COMPLETED') staffByShop[sid][b.barberId].revenue += b.payment.amount;
    });

    const comparison = shops.map(s => {
      const agg = bookingAgg.find(a => a.shopId === s.id);
      const topStaffForShop = Object.values(staffByShop[s.id] || {})
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);
      const bookingsCount = agg?._count._all || 0;
      return {
        shopId: s.id,
        shopName: s.name,
        revenue: revenueByShop[s.id] || 0,
        bookings: bookingsCount,
        avgTicket: bookingsCount > 0 ? Math.round((agg?._sum.totalAmount || 0) / bookingsCount) : 0,
        topStaff: topStaffForShop,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return { success: true, data: comparison };
  } catch (error) {
    console.error('Error fetching shop comparison analytics:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function getBookingTrendsAnalytics(shopId: string | 'all', startDate?: string, endDate?: string) {
  try {
    const session = await requireReportsAccess();
    if (!session) return { success: false, message: 'Unauthorized' };

    const { start, end } = resolveDateRange(startDate, endDate);
    const shopFilter = shopId !== 'all' ? { shopId } : {};

    // (a) Status breakdown
    const statusAgg = await db.booking.groupBy({
      by: ['status'],
      where: { date: { gte: start, lte: end }, ...shopFilter },
      _count: { _all: true },
    });
    const statusBreakdown = statusAgg.map(s => ({ status: s.status, count: s._count._all }));
    const totalBookings = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
    const cancelledCount = statusBreakdown.find(s => s.status === 'CANCELLED')?.count || 0;
    const completedCount = statusBreakdown.find(s => s.status === 'COMPLETED')?.count || 0;
    const cancellationRate = totalBookings === 0 ? null : Math.round((cancelledCount / totalBookings) * 100);
    const completionRate = totalBookings === 0 ? null : Math.round((completedCount / totalBookings) * 100);

    // (b) New vs returning, bucketed by month.
    // "New" is determined by a customer's global (not shop-filtered) first-ever booking —
    // that's a system-wide fact about the customer, not a per-branch one.
    const bookingsInRange = await db.booking.findMany({
      where: { status: { not: 'CANCELLED' }, date: { gte: start, lte: end }, ...shopFilter },
      select: { customerId: true, date: true },
    });
    const customerIds = [...new Set(bookingsInRange.map(b => b.customerId))];
    const firstBookings = customerIds.length
      ? await db.booking.groupBy({ by: ['customerId'], where: { customerId: { in: customerIds } }, _min: { date: true } })
      : [];
    const firstDateMap = new Map(firstBookings.map(f => [f.customerId, f._min.date!]));

    const retentionByMonth: Record<string, { month: string; newCustomers: Set<string>; returningCustomers: Set<string> }> = {};
    bookingsInRange.forEach(b => {
      const key = `${b.date.getFullYear()}-${b.date.getMonth()}`;
      retentionByMonth[key] ??= { month: MONTH_NAMES[b.date.getMonth()], newCustomers: new Set(), returningCustomers: new Set() };
      const firstDate = firstDateMap.get(b.customerId);
      const isNewThisMonth = !!firstDate && firstDate.getFullYear() === b.date.getFullYear() && firstDate.getMonth() === b.date.getMonth();
      if (isNewThisMonth) retentionByMonth[key].newCustomers.add(b.customerId);
      else retentionByMonth[key].returningCustomers.add(b.customerId);
    });
    const retentionTrend = Object.entries(retentionByMonth)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([, r]) => ({
        month: r.month,
        newCustomers: r.newCustomers.size,
        returningCustomers: r.returningCustomers.size,
      }));

    // (c) Peak hours / days — bucketed in JS from Booking.date's actual time-of-day.
    const allBookingDates = await db.booking.findMany({
      where: { date: { gte: start, lte: end }, ...shopFilter },
      select: { date: true },
    });
    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    const byDay = DAY_NAMES.map(d => ({ day: d, count: 0 }));
    allBookingDates.forEach(b => {
      byHour[b.date.getHours()].count += 1;
      byDay[b.date.getDay()].count += 1;
    });

    return {
      success: true,
      data: { statusBreakdown, cancellationRate, completionRate, totalBookings, retentionTrend, byHour, byDay },
    };
  } catch (error) {
    console.error('Error fetching booking trends analytics:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function getProductSalesAnalytics(startDate?: string, endDate?: string) {
  try {
    const session = await requireReportsAccess();
    if (!session) return { success: false, message: 'Unauthorized' };

    const { start, end } = resolveDateRange(startDate, endDate);

    // Product sales are only tracked via walk-in bill line items (Payment.items), which carry
    // no shopId — this section is deliberately global-only (see isGlobalOnly below).
    const payments = await db.payment.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: start, lte: end }, items: { not: Prisma.DbNull } },
      select: { items: true },
    });

    const productStats: Record<string, { name: string; revenue: number; unitsSold: number }> = {};
    payments.forEach(p => {
      const items = (p.items as unknown as { name: string; type: string; price: number }[] | null) || [];
      items.forEach(item => {
        if (item?.type !== 'Product' || !item.name) return;
        const key = item.name.trim().toLowerCase();
        productStats[key] ??= { name: item.name, revenue: 0, unitsSold: 0 };
        productStats[key].revenue += item.price || 0;
        productStats[key].unitsSold += 1;
      });
    });

    const catalog = await db.product.findMany({ select: { name: true, category: true, brand: true, stock: true } });
    const catalogMap = new Map(catalog.map(c => [c.name.trim().toLowerCase(), c]));

    const topProducts = Object.entries(productStats)
      .map(([key, s]) => ({
        ...s,
        category: catalogMap.get(key)?.category ?? null,
        currentStock: catalogMap.get(key)?.stock ?? null,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalProductRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);

    return { success: true, data: { topProducts, totalProductRevenue, isGlobalOnly: true } };
  } catch (error) {
    console.error('Error fetching product sales analytics:', error);
    return { success: false, message: 'Server Error' };
  }
}
