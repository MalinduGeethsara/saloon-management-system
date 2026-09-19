'use server';

import { db, withTransaction } from '@/lib/db';
import { authorize, getAccess } from '@/lib/access.server';
import { notifyIfLowStock } from '@/lib/services/stock-notifications';
import { emailWalkInReceipt, notifyCounterSale, notifyWalkInReceipt } from '@/lib/services/booking-notifications';
import { parsePageParams, wantsPagination } from '@/lib/pagination';
import type { Prisma } from '@prisma/client';

export interface PaymentListOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  method?: string; // Cash | Card | Transfer | PayHere (case-insensitive, matches the stored value)
  shopId?: string;
}

// Without `page` this keeps the legacy behaviour (latest 100). With `page` it returns one page of
// real, completed transactions plus filtered totals — pending/failed gateway attempts are not
// invoices and must not count towards revenue.
export async function getAllPayments(opts: PaymentListOptions = {}) {
  try {
    const allowed = await authorize('/owner/payments', 'view');
    if (!allowed) {
      return { success: false, message: 'Unauthorized' };
    }

    const paginated = wantsPagination({ page: opts.page });
    const params = parsePageParams({ page: opts.page, pageSize: opts.pageSize });

    const where: Prisma.PaymentWhereInput = paginated ? { status: 'COMPLETED' } : {};
    const q = opts.q?.trim();
    if (q) {
      // Invoice ids are shown as INV-<first 6 chars of the uuid, uppercased>
      const idPrefix = q.replace(/^inv-?/i, '').toLowerCase();
      where.OR = [
        ...(idPrefix ? [{ id: { startsWith: idPrefix } }] : []),
        { clientName: { contains: q } },
        { customer: { name: { contains: q } } },
        { barberName: { contains: q } },
        { barber: { name: { contains: q } } },
      ];
    }
    if (opts.method && opts.method !== 'ALL') where.method = opts.method;
    if (opts.shopId && opts.shopId !== 'ALL') where.booking = { shopId: opts.shopId };

    const include = {
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
    } satisfies Prisma.PaymentInclude;

    let payments;
    let total = 0;
    let stats = { revenue: 0, count: 0 };
    let shops: { id: string; name: string }[] = [];

    if (paginated) {
      const [rows, count, agg, shopRows] = await db.$transaction([
        db.payment.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
        db.payment.count({ where }),
        db.payment.aggregate({ where, _sum: { amount: true } }),
        db.shop.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      ]);
      payments = rows;
      total = count;
      stats = { revenue: agg._sum.amount ?? 0, count };
      shops = shopRows;
    } else {
      payments = await db.payment.findMany({ include, orderBy: { createdAt: 'desc' }, take: 100 });
    }

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

    return { success: true, data, total, stats, shops };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return { success: false, message: 'Server Error' };
  }
}

export async function createManualBill(data: {
  invoiceNo: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  barberName?: string;
  barberId?: string;
  items: { name: string; type: string; price: number; productId?: string }[];
  amount: number;
  method: string;
  branch?: string;
}) {
  try {
    const allowed = await authorize(['/owner/payments', '/owner/bookings/manage'], 'add');
    if (!allowed) {
      return { success: false, message: 'Unauthorized' };
    }
    const session = allowed.session;

    let soldOrderId: string | null = null;
    let paymentId = '';
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
      paymentId = payment.id;

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

      // Products sold on a walk-in bill are also tracked as an Order for pickup-management —
      // mirrors the same thing createBooking does for products bought through the website.
      const productItems = data.items.filter(item => item.type === 'Product');
      if (productItems.length > 0) {
        // Decrement stock now, atomically — same conditional-update pattern as createBooking,
        // so a race against the last unit is rejected instead of overselling.
        for (const item of productItems) {
          if (!item.productId) continue; // no catalog link to decrement against
          const stockResult = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: 1 } },
            data: { stock: { decrement: 1 } }
          });
          if (stockResult.count === 0) {
            throw new Error(`STOCK_UNAVAILABLE: ${item.name} just went out of stock. Please remove it and try again.`);
          }
        }

        const productAmount = productItems.reduce((sum, item) => sum + (item.price || 0), 0);
        const order = await tx.order.create({
          data: {
            source: 'ADMIN',
            totalAmount: productAmount,
            clientName: data.clientName,
            clientPhone: data.clientPhone,
            paymentId: payment.id,
            items: {
              create: productItems.map(item => ({
                productId: item.productId || null,
                name: item.name,
                price: item.price,
                quantity: 1,
              }))
            }
          }
        });
        soldOrderId = order.id;
      }
    });

    // Stock was decremented above: alert the owner/managers if a product just got low or ran out
    for (const item of data.items) {
      if (item.type === 'Product' && item.productId) void notifyIfLowStock(item.productId);
    }
    const soldProducts = data.items.filter(i => i.type === 'Product');
    if (soldProducts.length > 0) {
      notifyCounterSale({
        orderId: soldOrderId,
        clientName: data.clientName,
        items: soldProducts,
        amount: data.amount,
        method: data.method,
        invoiceNo: data.invoiceNo,
        servedBy: data.barberName,
        actorId: session.id,
      });
    }

    // Thank-you SMS with the receipt to the number on the bill (the cashier is told if it could not be sent)
    const receiptSms = notifyWalkInReceipt({ phone: data.clientPhone, name: data.clientName, amount: data.amount, method: data.method, paymentId, items: data.items });

    // ...and by email, when the cashier typed an address
    const receiptEmail = emailWalkInReceipt({ email: data.clientEmail, name: data.clientName, amount: data.amount, method: data.method, paymentId, items: data.items });

    return { success: true, receiptSms, receiptEmail };
  } catch (error: any) {
    console.error('Error creating manual bill:', error);
    if (typeof error?.message === 'string' && error.message.startsWith('STOCK_UNAVAILABLE:')) {
      return { success: false, message: error.message.replace('STOCK_UNAVAILABLE: ', '') };
    }
    return { success: false, message: 'Server Error' };
  }
}

export async function getBillingCatalog() {
  try {
    if (!(await getAccess('/owner/payments'))) return { success: false, data: [] };

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
