'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function getAllOrders() {
  try {
    const session = await verifySession();
    if (!session || !['OWNER', 'ADMIN', 'MANAGER'].includes(session.role)) {
      return { success: false, message: 'Unauthorized', data: [] };
    }

    const orders = await db.order.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

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

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, message: 'Server Error', data: [] };
  }
}

export async function updateOrderStatus(orderId: string, status: 'PENDING_PICKUP' | 'COLLECTED') {
  try {
    const session = await verifySession();
    if (!session || !['OWNER', 'ADMIN', 'MANAGER'].includes(session.role)) {
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
