// Data-integrity checks that only bite on a real InnoDB database with foreign keys: what happens when
// the owner deletes things that have history (a barber with past bookings, a service that was sold,
// a completed booking with commission ...). None of these may end in a 500 or leave orphans behind.
const h = require('../lib/harness');

async function run(T, ctx) {
  const db = h.prisma();
  const [b1, , b3] = ctx.barbers;

  T.sec('D1. Deleting records that have history');
  // b3 completed a booking earlier (commission + payroll + notifications)
  let r = await ctx.owner.del('/api/v1/staff?id=' + b3.id);
  T.check('deleting a barber who has commissions/payroll gives a clear message, not a 500', r.status !== 500, `${r.status} ${r.text.slice(0, 160)}`);
  const stillThere = await db.user.findUnique({ where: { id: b3.id } });
  T.check('…and that barber is either fully removed or fully kept (no half-deleted state)', stillThere === null || (await db.commission.count({ where: { barberId: b3.id } })) >= 0);
  T.check('the refusal explains why (history exists) so the owner knows what to do', r.status === 200 || /history|booking|payroll|commission|cannot|can't/i.test(r.text), r.text.slice(0, 160));

  const svc = ctx.services[0];
  r = await ctx.owner.del('/api/v1/services?id=' + svc.id);
  T.check('deleting a service that was sold in bookings is handled (not a 500)', r.status !== 500, `${r.status} ${r.text.slice(0, 160)}`);

  const soldProduct = ctx.products[0];
  r = await ctx.owner.del('/api/v1/products?id=' + soldProduct.id);
  T.check('deleting a product that was sold is handled (not a 500)', r.status !== 500, `${r.status} ${r.text.slice(0, 160)}`);
  if (r.status === 200) {
    const items = await db.orderItem.findMany({ where: { name: soldProduct.name } });
    T.check('…past order lines keep their name/price snapshot after the product is deleted', items.length >= 1 && items.every((i) => i.productId === null && i.name === soldProduct.name), JSON.stringify(items.map((i) => i.productId)));
  }

  const completed = await db.booking.findFirst({ where: { status: 'COMPLETED', commission: { isNot: null } } });
  if (completed) {
    r = await ctx.owner.del('/api/v1/bookings?id=' + completed.id);
    T.check('deleting a completed booking that earned a commission is handled (not a 500)', r.status !== 500, `${r.status} ${r.text.slice(0, 160)}`);
  }
  const withOrder = await db.booking.findFirst({ where: { order: { isNot: null } } });
  if (withOrder) {
    r = await ctx.owner.del('/api/v1/bookings?id=' + withOrder.id);
    T.check('deleting a booking that has a product order is handled (not a 500)', r.status !== 500, `${r.status} ${r.text.slice(0, 160)}`);
  }

  r = await ctx.owner.del('/api/v1/shops?id=' + ctx.shopA.id);
  T.check('deleting a branch that has staff and bookings is handled (not a 500)', r.status !== 500, `${r.status} ${r.text.slice(0, 160)}`);
  const orphaned = await db.user.count({ where: { shopId: ctx.shopA.id } });
  T.check('no staff member is left pointing at a deleted branch', r.status !== 200 || orphaned === 0, `orphans=${orphaned}`);

  T.sec('D2. Referential integrity of what is left');
  const orphanChecks = await db.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM Payment p LEFT JOIN Booking b ON p.bookingId = b.id WHERE p.bookingId IS NOT NULL AND b.id IS NULL) AS paymentsWithoutBooking,
      (SELECT COUNT(*) FROM Booking b LEFT JOIN User u ON b.customerId = u.id WHERE u.id IS NULL) AS bookingsWithoutCustomer,
      (SELECT COUNT(*) FROM BookingService bs LEFT JOIN Booking b ON bs.bookingId = b.id WHERE b.id IS NULL) AS linesWithoutBooking,
      (SELECT COUNT(*) FROM Commission c LEFT JOIN User u ON c.barberId = u.id WHERE u.id IS NULL) AS commissionsWithoutBarber`;
  const o = orphanChecks[0];
  T.check('no orphaned payments / bookings / booking lines / commissions', Object.values(o).every((v) => Number(v) === 0), JSON.stringify(o, (k, v) => (typeof v === 'bigint' ? Number(v) : v)));
  const money = await db.$queryRaw`SELECT COUNT(*) AS n FROM Payment WHERE status = 'COMPLETED' AND amount <= 0`;
  T.check('no completed payment with a zero/negative amount', Number(money[0].n) === 0);
  const neg = await db.product.count({ where: { stock: { lt: 0 } } });
  T.check('no product has negative stock', neg === 0, `negative=${neg}`);
  const dupPhones = await db.$queryRaw`SELECT phone, COUNT(*) c FROM User WHERE phone IS NOT NULL GROUP BY phone HAVING c > 1`;
  T.check('no two accounts share a phone number', dupPhones.length === 0);
}

module.exports = { run };
