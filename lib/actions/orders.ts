'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { authorize } from '@/lib/access.server';
import { parsePageParams, wantsPagination } from '@/lib/pagination';
import type { Prisma } from '@prisma/client';

export interface OrderListOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: 'PENDING_PICKUP' | 'COLLECTED' | 'ALL';
}

// Without `page` this keeps the legacy behaviour (latest 200). With `page` it returns one page
// plus overall counts, so the KPI cards don't depend on how many rows happen to be loaded.
export async function getAllOrders(opts: OrderListOptions = {}) {
  try {
    if (!(await authorize('/owner/orders', 'view'))) {
      return { success: false, message: 'Unauthorized', data: [] };
    }

    const paginated = wantsPagination({ page: opts.page });
    const params = parsePageParams({ page: opts.page, pageSize: opts.pageSize });

    const where: Prisma.OrderWhereInput = {};
    const q = opts.q?.trim();
    if (q) {
      // Order ids are shown as ORD-<first 6 chars of the uuid, uppercased>
      const idPrefix = q.replace(/^ord-?/i, '').toLowerCase();
      where.OR = [
        ...(idPrefix ? [{ id: { startsWith: idPrefix } }] : []),
        { clientName: { contains: q } },
        { clientPhone: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { phone: { contains: q } } },
      ];
    }
    if (opts.status === 'PENDING_PICKUP' || opts.status === 'COLLECTED') where.status = opts.status;

    const include = { customer: true, items: true } satisfies Prisma.OrderInclude;

    let orders;
    let total = 0;
    let stats = { total: 0, pending: 0, collected: 0 };

    if (paginated) {
      const [rows, count, all, pending] = await db.$transaction([
        db.order.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
        db.order.count({ where }),
        db.order.count(),
        db.order.count({ where: { status: 'PENDING_PICKUP' } }),
      ]);
      orders = rows;
      total = count;
      stats = { total: all, pending, collected: all - pending };
    } else {
      orders = await db.order.findMany({ include, orderBy: { createdAt: 'desc' }, take: 200 });
    }

    const data = orders.map(o => ({
      key: o.id,
      id: `ORD-${o.id.slice(0, 6).toUpperCase()}`,
      customerName: o.customer?.name || o.clientName || 'Walk-in',
      customerPhone: o.customer?.phone || o.clientPhone || 'N/A',
      items: o.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      totalAmount: o.totalAmount,
      status: o.status,
      source: o.source,
      date: o.createdAt.toISOString().split('T')[0],
      collectedAt: o.collectedAt ? o.collectedAt.toISOString().split('T')[0] : null,
    }));

    return { success: true, data, total, stats };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, message: 'Server Error', data: [] };
  }
}

export async function updateOrderStatus(orderId: string, status: 'PENDING_PICKUP' | 'COLLECTED') {
  try {
    if (!(await authorize('/owner/orders', 'edit'))) {
      return { success: false, message: 'Unauthorized' };
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        status,
        collectedAt: status === 'COLLECTED' ? new Date() : null,
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function getMyOrders() {
  try {
    const session = await verifySession();
    if (!session || !session.id) return [];

    const orders = await db.order.findMany({
      where: { customerId: session.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(o => ({
      id: o.id,
      code: `ORD-${o.id.slice(0, 6).toUpperCase()}`,
      items: o.items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
      totalAmount: o.totalAmount,
      amount: `LKR ${o.totalAmount.toLocaleString()}`,
      status: o.status as 'PENDING_PICKUP' | 'COLLECTED',
      statusLabel: o.status === 'COLLECTED' ? 'Collected' : 'Pending Pickup',
      date: o.createdAt.toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return [];
  }
}
