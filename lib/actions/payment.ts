'use server';

import { db, withTransaction } from '@/lib/db';
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
        barber: true,
        booking: {
          include: {
            barber: true,
            shop: true,
            services: { include: { service: true } },
            products: { include: { product: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const data = payments.map(p => {
      const bookingItems = [
        ...(p.booking?.services?.map(bs => ({ name: bs.service?.name, type: 'Service', price: bs.service?.price })) || []),
        ...(p.booking?.products?.map(bp => ({ name: bp.product?.name, type: 'Product', price: bp.product?.price })) || []),
      ];

      return {
        key: p.id,
        id: `INV-${p.id.slice(0, 6).toUpperCase()}`,
        client: p.booking ? (p.customer?.name || 'Customer') : (p.clientName || 'Walk-in'),
        contact: p.booking ? (p.customer?.phone || 'N/A') : (p.clientPhone || 'N/A'),
        barber: p.booking?.barber?.name || p.barber?.name || p.barberName || 'N/A',
        barberId: p.booking?.barberId || p.barberId || undefined,
        items: bookingItems.length > 0 ? bookingItems : ((p.items as any[]) || []),
        amount: p.amount,
        method: p.method === 'CARD' ? 'Card' : p.method === 'CASH' ? 'Cash' : p.method || 'Cash',
        date: p.createdAt.toISOString().split('T')[0],
        branch: p.booking?.shop?.name || 'Global',
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function createManualBill(data: {
  invoiceNo: string;
  clientName: string;
  clientPhone?: string;
  barberName?: string;
  barberId?: string;
  items: { name: string; type: string; price: number }[];
  amount: number;
  method: string;
  branch?: string;
}) {
  try {
    const session = await verifySession();
    if (!session || !['OWNER', 'ADMIN', 'MANAGER'].includes(session.role)) {
      return { success: false, message: 'Unauthorized' };
    }

    await withTransaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          method: data.method,
          status: 'COMPLETED',
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          barberName: data.barberName,
          barberId: data.barberId || null,
          items: data.items,
        }
      });

      // Commission is earned on services performed, not on retail products sold alongside them
      const serviceAmount = data.items
        .filter(item => item.type === 'Service')
        .reduce((sum, item) => sum + (item.price || 0), 0);

      if (data.barberId && serviceAmount > 0) {
        const barber = await tx.user.findUnique({ where: { id: data.barberId } });
        if (barber) {
          const rateApplied = barber.commissionRate || 0;
          const now = payment.createdAt;
          await tx.commission.create({
            data: {
              paymentId: payment.id,
              barberId: data.barberId,
              amount: (serviceAmount * rateApplied) / 100,
              rateApplied,
              billedAmount: serviceAmount,
              month: now.getMonth(),
              year: now.getFullYear(),
            }
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating manual bill:', error);
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
