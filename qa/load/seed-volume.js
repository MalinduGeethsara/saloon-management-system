// Fills the QA database with a realistic amount of history, so the load test measures queries
// against thousands of rows (like the salon after a few months) instead of an empty database.
const crypto = require('crypto');
const path = require('path');
const h = require('../lib/harness');
const bcrypt = require(path.join(h.ROOT, 'node_modules', 'bcryptjs'));

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];

async function seedVolume(ctx, { customers = 400, bookings = 3000, notifications = 3000, expenses = 300, orders = 250 } = {}) {
  const db = h.prisma();
  const password = await bcrypt.hash(ctx.PASSWORD, 10);
  const staffAll = await db.user.findMany({ where: { role: { in: ['OWNER', 'MANAGER', 'BARBER'] } }, select: { id: true, role: true, commissionRate: true } });
  const barbers = staffAll.filter((s) => s.role === 'BARBER');
  const services = await db.service.findMany();
  const products = await db.product.findMany();
  const shops = await db.shop.findMany();

  // customers
  const custRows = Array.from({ length: customers }, (_, i) => ({
    id: crypto.randomUUID(), email: `vol_${i}@qa.test`, phone: String(771000000 + i), password, name: `Volume Customer ${i}`, role: 'CUSTOMER',
  }));
  for (const part of chunk(custRows, 200)) await db.user.createMany({ data: part });

  // bookings (past 180 days .. next 14 days)
  const now = Date.now();
  const rows = { booking: [], bookingService: [], payment: [], commission: [] };
  for (let i = 0; i < bookings; i++) {
    const days = -180 + Math.random() * 194;
    const when = new Date(now + days * 86400000);
    when.setHours(9 + rnd(8), rnd(4) * 15, 0, 0);
    const past = when.getTime() < now;
    const status = past ? (Math.random() < 0.86 ? 'COMPLETED' : Math.random() < 0.6 ? 'CANCELLED' : 'CONFIRMED') : (Math.random() < 0.8 ? 'CONFIRMED' : 'PENDING');
    const svc = pick(services);
    const barber = pick(barbers);
    const customer = pick(custRows);
    const id = crypto.randomUUID();
    const shop = pick(shops);
    const website = Math.random() < 0.6;
    rows.booking.push({ id, date: when, status, source: website ? 'WEBSITE' : 'ADMIN', totalAmount: svc.price, serviceAmount: svc.price, customerId: customer.id, barberId: barber.id, shopId: shop.id, createdAt: new Date(when.getTime() - 86400000 * rnd(5)) });
    rows.bookingService.push({ id: crypto.randomUUID(), bookingId: id, serviceId: svc.id });
    const payStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'CANCELLED' ? 'FAILED' : status === 'CONFIRMED' && website ? 'COMPLETED' : 'PENDING';
    const payId = crypto.randomUUID();
    rows.payment.push({ id: payId, amount: svc.price, status: payStatus, method: website ? 'PAYHERE' : pick(['CASH', 'CARD']), bookingId: id, customerId: customer.id, createdAt: when });
    if (status === 'COMPLETED') {
      rows.commission.push({ id: crypto.randomUUID(), amount: (svc.price * barber.commissionRate) / 100, rateApplied: barber.commissionRate, billedAmount: svc.price, month: when.getMonth(), year: when.getFullYear(), bookingId: id, barberId: barber.id });
    }
  }
  for (const part of chunk(rows.booking, 500)) await db.booking.createMany({ data: part });
  for (const part of chunk(rows.bookingService, 500)) await db.bookingService.createMany({ data: part });
  for (const part of chunk(rows.payment, 500)) await db.payment.createMany({ data: part });
  for (const part of chunk(rows.commission, 500)) await db.commission.createMany({ data: part });

  // orders (product pickups)
  const orderRows = [];
  const itemRows = [];
  for (let i = 0; i < orders; i++) {
    const p = pick(products);
    const id = crypto.randomUUID();
    orderRows.push({ id, status: Math.random() < 0.7 ? 'COLLECTED' : 'PENDING_PICKUP', totalAmount: p.price, source: 'WEBSITE', customerId: pick(custRows).id, createdAt: new Date(now - rnd(150) * 86400000) });
    itemRows.push({ id: crypto.randomUUID(), orderId: id, productId: p.id, name: p.name, price: p.price, quantity: 1 });
  }
  await db.order.createMany({ data: orderRows });
  await db.orderItem.createMany({ data: itemRows });

  // notifications for staff
  const owner = await db.user.findFirst({ where: { role: 'OWNER' } });
  const notes = Array.from({ length: notifications }, (_, i) => ({ id: crypto.randomUUID(), userId: pick([owner, ...staffAll]).id ?? owner.id, title: 'New Booking Confirmed', desc: 'Volume notification ' + i, read: Math.random() < 0.9, createdAt: new Date(now - rnd(90) * 86400000) }));
  for (const part of chunk(notes, 500)) await db.notification.createMany({ data: part });

  // expenses
  const cats = ['STOCK_ORDER', 'PETTY_CASH', 'UTILITIES', 'RENT', 'OTHER'];
  const exp = Array.from({ length: expenses }, (_, i) => ({ id: crypto.randomUUID(), category: pick(cats), title: 'Volume expense ' + i, amount: 500 + rnd(50000), date: new Date(now - rnd(180) * 86400000), createdById: owner.id, shopId: Math.random() < 0.5 ? pick(shops).id : null }));
  await db.expense.createMany({ data: exp });

  return { customers: custRows.map((c) => ({ email: c.email, id: c.id })), counts: { customers, bookings, orders, notifications, expenses } };
}

module.exports = { seedVolume };
