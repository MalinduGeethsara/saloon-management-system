// Concurrency and failure-mode checks: the things that only go wrong when several people act at
// the same moment (double booking, duplicate webhooks, last item in stock) or when a gateway is down.
const h = require('../lib/harness');
const { nthWeekday, slotTime, waitFor, registerCustomer, staffLogin } = require('./helpers');
const { sms, emails, STAFF_EXTRA } = require('./functional');

async function newCustomer(tag, phoneSuffix) {
  const res = await registerCustomer({ name: `Race ${tag}`, email: `race_${tag}@qa.test` });
  if (res.error) throw new Error(res.error);
  await h.prisma().user.update({ where: { email: `race_${tag}@qa.test` }, data: { phone: '77555' + String(phoneSuffix).padStart(4, '0') } });
  return res.client;
}

async function run(X, ctx) {
  const db = h.prisma();
  const anon = new h.Client('anon');
  const [b1, b2, b3] = ctx.barbers;
  const svc = ctx.services[0];

  X.sec('R1. Ten customers try to book the same barber + time at the same instant');
  const racers = [];
  for (let i = 0; i < 10; i++) racers.push(await newCustomer('slot' + i, i));
  const raceDay = nthWeekday(15);
  const outcomes = await Promise.all(racers.map((c) => c.action('createBooking', [{ serviceIds: [svc.id], barberId: b1.id, date: raceDay, time: slotTime(14), shopId: ctx.shopA.id }])));
  const wins = outcomes.filter((o) => o.value?.success).length;
  const rows = await db.booking.count({ where: { barberId: b1.id, date: new Date(raceDay + ' ' + slotTime(14)), status: { in: ['PENDING', 'CONFIRMED'] } } });
  X.check('exactly one of ten simultaneous customers gets the slot', wins === 1 && rows === 1, `${wins} succeeded, ${rows} live bookings for one slot`);
  const msgs = outcomes.filter((o) => !o.value?.success).map((o) => o.value?.message);
  X.check('the other nine get a friendly "slot taken" message (not "server error")', msgs.length === 9 && msgs.every((m) => m && !/server error/i.test(m)), [...new Set(msgs)].join(' | '));

  X.sec('R2. Overlapping bookings (different start times) are blocked for the same barber');
  const overlapDay = nthWeekday(16);
  const first = await racers[0].action('createBooking', [{ serviceIds: [ctx.services[2].id], barberId: b2.id, date: overlapDay, time: slotTime(10), shopId: ctx.shopA.id }]); // 90 min colour
  const second = await racers[1].action('createBooking', [{ serviceIds: [svc.id], barberId: b2.id, date: overlapDay, time: '11:00 AM', shopId: ctx.shopA.id }]); // inside the colour
  const third = await racers[2].action('createBooking', [{ serviceIds: [svc.id], barberId: b2.id, date: overlapDay, time: '11:30 AM', shopId: ctx.shopA.id }]); // right after it
  X.check('a 90-minute colour at 10:00 blocks a 30-minute cut at 11:00', first.value?.success && second.value?.success === false, JSON.stringify(second.value)?.slice(0, 160));
  X.check('…but the next slot after it (11:30) is free', third.value?.success === true, JSON.stringify(third.value)?.slice(0, 160));
  const grid = await racers[3].action('getBookedSlots', [b2.id, overlapDay, 45]);
  X.check('the booking wizard greys out every grid slot the long service blocks', Array.isArray(grid.value) && grid.value.includes('09:45 AM') && grid.value.includes('10:30 AM') && !grid.value.includes('01:00 PM'), JSON.stringify(grid.value));

  X.sec('R3. PayHere sends the same "paid" notification several times at once');
  const buyer = await newCustomer('dup', 20);
  const oil = ctx.products[2];
  const oilBefore = (await db.product.findUnique({ where: { id: oil.id } })).stock;
  const bk = (await buyer.action('createBooking', [{ serviceIds: [svc.id], productIds: [oil.id], barberId: b3.id, date: nthWeekday(17), time: slotTime(9), shopId: ctx.shopA.id, address: '1 Test Rd', city: 'Colombo' }])).value;
  const t0 = Date.now();
  const form = h.payhereNotify(bk.bookingId, 3800, '2');
  const dupResults = await Promise.all(Array.from({ length: 6 }, () => anon.req('POST', '/api/v1/payments/payhere/notify', { form })));
  await h.sleep(1200);
  X.check('every duplicate notify is answered 200 (PayHere would retry a 500 forever)', dupResults.every((r) => r.status === 200), dupResults.map((r) => r.status).join(','));
  const oilAfter = (await db.product.findUnique({ where: { id: oil.id } })).stock;
  const orders = await db.order.count({ where: { bookingId: bk.bookingId } });
  const confMails = emails('race_dup@qa.test').filter((e) => e.t >= t0 && /Confirmed/i.test(e.subject)).length;
  const bellRows = await db.notification.count({ where: { title: 'New Booking Confirmed', createdAt: { gte: new Date(t0) } } });
  X.check('stock is reduced exactly once', oilBefore - oilAfter === 1, `stock ${oilBefore} → ${oilAfter}`);
  X.check('exactly one pickup Order is created', orders === 1, `orders=${orders}`);
  X.check('the customer receives exactly one confirmation email', confMails === 1, `emails=${confMails}`);
  X.check('staff get one set of "confirmed" bell rows (owner, manager, barber)', bellRows === 3, `rows=${bellRows}`);
  const finalBk = await db.booking.findUnique({ where: { id: bk.bookingId }, include: { payment: true } });
  X.check('booking ends CONFIRMED / payment COMPLETED', finalBk.status === 'CONFIRMED' && finalBk.payment.status === 'COMPLETED');

  X.sec('R4. Two customers pay for the last unit in stock');
  const last = (await ctx.owner.post('/api/v1/products', { name: 'Last One', price: 999, stock: 1, brand: 'QA', category: 'x', sku: 'QA-LAST' })).json.product;
  const p1 = await newCustomer('last1', 31);
  const p2 = await newCustomer('last2', 32);
  const l1 = (await p1.action('createBooking', [{ serviceIds: [svc.id], productIds: [last.id], barberId: b3.id, date: nthWeekday(18), time: slotTime(9), shopId: ctx.shopA.id, address: 'a', city: 'b' }])).value;
  const l2 = (await p2.action('createBooking', [{ serviceIds: [svc.id], productIds: [last.id], barberId: b3.id, date: nthWeekday(18), time: slotTime(12), shopId: ctx.shopA.id, address: 'a', city: 'b' }])).value;
  X.check('both can start checkout while 1 unit is left', l1?.success && l2?.success, JSON.stringify([l1, l2]).slice(0, 200));
  const tLast = Date.now();
  await Promise.all([l1, l2].map((b) => anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(b.bookingId, 2499, '2') })));
  await h.sleep(800);
  const lastStock = (await db.product.findUnique({ where: { id: last.id } })).stock;
  const lastOrders = await db.order.count({ where: { items: { some: { productId: last.id } } } });
  X.check('stock never goes negative and only one order is created', lastStock === 0 && lastOrders === 1, `stock=${lastStock} orders=${lastOrders}`);
  const oversold = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tLast && /ACTION NEEDED/.test(e.message)));
  X.check('the salon is told (SMS + bell) that one paid order needs a manual refund/replacement', !!oversold && (await db.notification.count({ where: { title: { contains: 'Oversold' } } })) >= 1);
  const oversoldMail = await waitFor(() => emails('owner@qa.test').find((e) => e.t >= tLast && /ACTION NEEDED.*sold-out/i.test(e.subject)));
  X.check('the owner is also emailed (red action-needed) about the paid order for a sold-out product', !!oversoldMail && /Action needed/.test(oversoldMail.html));
  const both = await db.booking.findMany({ where: { id: { in: [l1.bookingId, l2.bookingId] } } });
  X.check('both customers still get their booking confirmed (they paid for the service)', both.every((b) => b.status === 'CONFIRMED'));

  X.sec('R5. Customer cancels at the same moment PayHere confirms payment');
  const inconsistent = [];
  for (let i = 0; i < 6; i++) {
    const c = await newCustomer('cx' + i, 40 + i);
    const b = (await c.action('createBooking', [{ serviceIds: [svc.id], barberId: b3.id, date: nthWeekday(19 + i), time: slotTime(15), shopId: ctx.shopA.id }])).value;
    await Promise.all([
      c.action('cancelBooking', [b.bookingId]),
      anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(b.bookingId, 1500, '2') }),
    ]);
    await h.sleep(150);
    const row = await db.booking.findUnique({ where: { id: b.bookingId }, include: { payment: true } });
    const combo = `${row.status}/${row.payment.status}`;
    if (!['CONFIRMED/COMPLETED', 'CANCELLED/REFUNDED', 'CANCELLED/FAILED'].includes(combo)) inconsistent.push(combo);
  }
  X.check('booking and payment never end up contradicting each other (e.g. CANCELLED but paid, unrefunded)', inconsistent.length === 0, inconsistent.join(', '));

  X.sec('R6. Staff double-click: the same booking marked COMPLETED twice at once');
  const walk = (await ctx.owner.post('/api/v1/bookings', { serviceIds: [svc.id], barberId: b1.id, shopId: ctx.shopA.id, date: `${nthWeekday(30)}T15:00:00`, clientName: 'Double Click', amount: 1500 })).json.booking;
  const both2 = await Promise.all([ctx.owner.put('/api/v1/bookings', { id: walk.id, status: 'COMPLETED' }), ctx.managerC.put('/api/v1/bookings', { id: walk.id, status: 'COMPLETED' })]);
  const comms = await db.commission.count({ where: { bookingId: walk.id } });
  X.check('the barber commission is recorded once, not twice', comms === 1, `commission rows=${comms}, statuses ${both2.map((r) => r.status)}`);

  X.sec('R7. Five staff members create overlapping manual bookings at once');
  const day = nthWeekday(31);
  const staffRes = await Promise.all([ctx.owner, ctx.managerC, ctx.owner, ctx.managerC, ctx.adminC].map((c, i) => c.post('/api/v1/bookings', { serviceIds: [svc.id], barberId: b2.id, shopId: ctx.shopA.id, date: `${day}T16:${String(i * 5).padStart(2, '0')}:00`, clientName: 'Overlap ' + i, amount: 1500 })));
  const okCount = staffRes.filter((r) => r.status === 201).length;
  X.check('only one of five overlapping staff bookings is accepted', okCount === 1, `${okCount} accepted: ${staffRes.map((r) => r.status).join(',')}`);

  X.sec('R8. SMS / email gateway outage must not break the business');
  h.setNetMode('fail');
  const outC = await newCustomer('outage', 60);
  const ob = (await outC.action('createBooking', [{ serviceIds: [svc.id], barberId: b3.id, date: nthWeekday(20), time: slotTime(16), shopId: ctx.shopA.id }])).value;
  X.check('booking checkout still works while the SMS gateway is down', ob?.success, JSON.stringify(ob)?.slice(0, 160));
  const nr = await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(ob.bookingId, 1500, '2') });
  const ob2 = await db.booking.findUnique({ where: { id: ob.bookingId }, include: { payment: true } });
  X.check('payment confirmation still succeeds while email + SMS are down', nr.status === 200 && ob2.status === 'CONFIRMED' && ob2.payment.status === 'COMPLETED');
  const sc = await new h.Client('otp-down', '203.0.113.99').post('/api/auth/send-code', { identifier: 'down@qa.test', purpose: 'REGISTER' });
  X.check('OTP request answers normally during an outage (no hang, no 500)', sc.status === 200, sc.status);
  const bill = await ctx.owner.action('createManualBill', [{ invoiceNo: 'INV-OUT', clientName: 'Outage', items: [{ name: 'Beard Oil', type: 'Product', price: 2300, productId: ctx.products[2].id }], amount: 2300, method: 'CASH' }]);
  X.check('staff billing works during the outage', bill.value?.success, JSON.stringify(bill.value));
  h.setNetMode('ok');

  X.sec('R9. Server health after all of the above');
  const health = await anon.get('/');
  X.check('site still answers 200', health.status === 200);
  const log = require('fs').readFileSync(require('path').join(h.RESULTS_DIR, 'server.log'), 'utf8');
  const unhandled = (log.match(/unhandled|UnhandledPromiseRejection|Error: connect|ECONNREFUSED|Too many connections|Timed out fetching a new connection/gi) || []).length;
  X.check('server log shows no unhandled rejections or DB connection exhaustion', unhandled === 0, `${unhandled} suspicious log lines`);
}

module.exports = { run };
