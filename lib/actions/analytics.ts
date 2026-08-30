'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

// Helper to get date boundaries based on range string
function getDateBounds(timeRange: string) {
  const now = new Date();
  const start = new Date();
  
  if (timeRange === 'Today') {
    start.setHours(0, 0, 0, 0);
  } else if (timeRange === 'This Week') {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
  } else if (timeRange === 'This Month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (timeRange === 'Last 30 Days') {
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  } else {
    // Default to last 30 days
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }
  
  return { start, end: now };
}

export async function getDashboardAnalytics(shopId: string | 'all', timeRange: string) {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const { start, end } = getDateBounds(timeRange);

    // Common filter for shop
    const shopFilter = shopId !== 'all' ? { shopId } : {};
    // For payments, we filter by booking.shopId
    const paymentShopFilter = shopId !== 'all' ? { booking: { shopId } } : {};

    // 1. Calculate KPIs
    const payments = await db.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
        ...paymentShopFilter
      },
      _sum: { amount: true }
    });
    const revenue = payments._sum.amount || 0;

    const bookings = await db.booking.count({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: start, lte: end },
        ...shopFilter
      }
    });

    // For distinct customers, Prisma count doesn't easily do distinct on relations with nested filters, 
    // so we'll fetch unique customerIds from bookings
    const customerBookings = await db.booking.findMany({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: start, lte: end },
        ...shopFilter
      },
      select: { customerId: true },
      distinct: ['customerId']
    });
    const customers = customerBookings.length;

    const staffCount = await db.user.count({
      where: {
        role: { in: ['BARBER', 'MANAGER'] },
        ...(shopId !== 'all' ? { shopId } : {})
      }
    });

    // 2. Recent Transactions
    const recentTx = await db.payment.findMany({
      where: {
        ...paymentShopFilter
      },
      include: {
        customer: true,
        booking: {
          include: { services: { include: { service: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedTx = recentTx.map(tx => ({
      key: tx.id,
      id: `INV-${tx.id.substring(0, 6).toUpperCase()}`,
      client: tx.customer?.name || 'Walk-in',
      service: tx.booking?.services[0]?.service?.name || 'Service',
      amount: tx.amount,
      status: tx.status,
      time: new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // 3. Top Staff
    // Get all completed bookings with barber and payment in timeframe
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

    const staffStats: Record<string, { name: string, role: string, sales: number, bookings: number, avatar: string | null }> = {};
    
    completedBookings.forEach(b => {
      if (b.barberId && b.barber) {
        if (!staffStats[b.barberId]) {
          staffStats[b.barberId] = {
            name: b.barber.name,
            role: b.barber.role === 'BARBER' ? 'Stylist' : 'Senior Stylist',
            sales: 0,
            bookings: 0,
            avatar: b.barber.imageUrl
          };
        }
        staffStats[b.barberId].bookings += 1;
        if (b.payment?.status === 'COMPLETED') {
          staffStats[b.barberId].sales += b.payment.amount;
        }
      }
    });

    const topStaff = Object.values(staffStats)
      .sort((a, b) => b.sales - a.sales);

    // 4. Popular Services
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
    let totalServices = 0;

    bookingServices.forEach(bs => {
      if (bs.service) {
        totalServices++;
        if (!serviceStats[bs.serviceId]) {
          serviceStats[bs.serviceId] = { name: bs.service.name, count: 0 };
        }
        serviceStats[bs.serviceId].count += 1;
      }
    });

    const colors = ['#7C4DFF', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];
    const popularServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // top 5
      .map((s, index) => ({
        name: s.name,
        count: s.count,
        percent: totalServices > 0 ? Math.round((s.count / totalServices) * 100) : 0,
        color: colors[index % colors.length]
      }));

    return {
      success: true,
      data: {
        kpis: {
          revenue,
          bookings,
          customers,
          staff: staffCount
        },
        recentTransactions: formattedTx,
        topStaff,
        popularServices
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function getReportsAnalytics(shopId: string | 'all', startDate?: string, endDate?: string) {
  try {
    const session = await verifySession();
    if (!session) return { success: false, message: 'Unauthorized' };

    let start = new Date(new Date().getFullYear(), 0, 1); // default to start of current year
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    const shopFilter = shopId !== 'all' ? { shopId } : {};
    const paymentShopFilter = shopId !== 'all' ? { booking: { shopId } } : {};

    // 1. Performance Data (Monthly Revenue vs Expense)
    // We will group payments by month for the given date range.
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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize months between start and end
    const current = new Date(start);
    while (current <= end) {
      const key = `${current.getFullYear()}-${current.getMonth()}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: monthNames[current.getMonth()], revenue: 0, expense: 0 };
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
      revenue: Math.max(5, Math.round((d.revenue / maxVal) * 100)), // % for height, min 5% if > 0
      expense: Math.max(5, Math.round((d.expense / maxVal) * 100)),
    })).map(d => ({
      ...d,
      revenue: d.rawRevenue === 0 ? 0 : d.revenue,
      expense: d.rawExpense === 0 ? 0 : d.expense,
    }));

    const totalRevenue = performanceDataRaw.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpense = performanceDataRaw.reduce((sum, item) => sum + item.expense, 0);
    const netProfit = totalRevenue - totalExpense;

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
