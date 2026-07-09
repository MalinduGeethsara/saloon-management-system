'use server';

import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function getAllPayments() {
  try {
    const session = await verifySession();
    if (!session || !['OWNER', 'ADMIN', 'MANAGER'].includes(session.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    const payments = await db.payment.findMany({
      include: {
        customer: true,
        booking: {
          include: {
            barber: true,
            shop: true,
            services: { include: { service: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for performance
    });

    const formattedData = payments.map(p => ({
      key: p.id,
      id: `INV-${p.id.slice(0, 6).toUpperCase()}`,
      client: p.customer?.name || 'Walk-in',
      contact: p.customer?.phone || 'N/A',
      barber: p.booking?.barber?.name || 'Unknown',
      items: p.booking?.services?.map(bs => ({
        name: bs.service?.name,
        type: 'Service',
        price: bs.service?.price
      })) || [],
      amount: p.amount,
      method: p.method === 'CARD' ? 'Card' : p.method === 'CASH' ? 'Cash' : 'Transfer',
      date: p.createdAt.toISOString().split('T')[0],
      branch: p.booking?.shop?.name || 'Global'
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function getBillingCatalog() {
  try {
    const session = await verifySession();
    if (!session) return { success: false, data: [] };

    const services = await db.service.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, price: true }
    });

    const products = await db.product.findMany({
      where: { status: 'Active' },
      select: { id: true, name: true, price: true }
    });

    const staff = await db.user.findMany({
      where: { role: { in: ['BARBER', 'MANAGER'] } },
      select: { id: true, name: true }
    });

    const catalog = [
      ...services.map(s => ({
        label: s.name,
        value: s.id,
        type: 'Service',
        price: s.price
      })),
      ...products.map(p => ({
        label: p.name,
        value: p.id,
        type: 'Product',
        price: p.price
      }))
    ];

    return { success: true, data: catalog, staff: staff };
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return { success: false, data: [], staff: [] };
  }
}
