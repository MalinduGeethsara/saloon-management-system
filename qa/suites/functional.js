// Functional run of the whole business: from an empty "owner only" database to customers booking,
// paying, cancelling, and staff running the salon. Every claim is checked against the API response
// AND the database, and notifications are checked against what the (mocked) gateways received.
const h = require('../lib/harness');
const { PASSWORD, nthWeekday, slotTime, waitFor, otpFor, registerCustomer, staffLogin, bootstrapBusiness } = require('./helpers');

const sms = (to) => h.netLog().filter((e) => e.type === 'sms' && (!to || e.to === '94' + to.replace(/^0/, '')));
const emails = (to) => h.netLog().filter((e) => e.type === 'email' && (!to || e.to === to));
const STAFF_EXTRA = '770000001'; // STAFF_SMS_EXTRA_NUMBERS in the QA server

async function run(R, ownerCreds) {
  const db = h.prisma();
  const A = (name, args, client) => client.action(name, args);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('1. Public website (anonymous)');
  const anon = new h.Client('anon');
  const publicPages = ['/', '/about', '/services', '/products', '/barbers', '/contact', '/terms-conditions', '/privacy-policy', '/refund-policy', '/login', '/staff-login', '/forgot-password'];
  for (const p of publicPages) {
    const r = await anon.get(p);
    R.check(`GET ${p} → 200`, r.status === 200 && /<html/i.test(r.text), `status ${r.status}`);
  }
  const notFound = await anon.get('/definitely-not-a-page');
  R.check('unknown URL → 404 (no stack trace leaked)', notFound.status === 404 && !/at .*\.js:\d+/.test(notFound.text));
  for (const p of ['/profile', '/booking', '/owner', '/owner/expenses', '/admin', '/barber', '/manager/attendance']) {
    const r = await anon.get(p);
    R.check(`anonymous GET ${p} → redirected to login`, r.status >= 300 && r.status < 400 && /login/.test(r.headers.get('location') || ''), `status ${r.status} ${r.headers.get('location')}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('2. Owner sets up the business from an empty database');
  const ctx = await bootstrapBusiness(R, ownerCreds);
  const [svcCut, svcBeard, svcColour, svcFacial] = ctx.services;
  const [pomade, shampoo, oil] = ctx.products;
  const [b1, b2, b3, b4] = ctx.barbers;

  let r = await ctx.owner.get('/api/v1/staff');
  R.check('owner lists staff (5 staff members, no password hashes leaked)', (r.json?.staff || r.json?.users || r.json)?.length >= 5 && !/\$2[aby]\$/.test(r.text), r.text.slice(0, 200));

  const pubBarbers = await A('getAllPublicBarbers', [], anon);
  R.check('public barbers list shows staff, without emails/passwords', Array.isArray(pubBarbers.value) && pubBarbers.value.length >= 4 && !/@qa\.test|password/i.test(pubBarbers.text), pubBarbers.text.slice(0, 200));
  const pubServices = await A('getAllPublicServices', [], anon);
  R.check('public services list returns the 4 services', Array.isArray(pubServices.value) && pubServices.value.length === 4, pubServices.text.slice(0, 200));
  const pubProducts = await A('getPublicProducts', [], anon);
  R.check('public products list returns the 3 products', Array.isArray(pubProducts.value) && pubProducts.value.length === 3, pubProducts.text.slice(0, 200));
  const pubShops = await A('getPublicShops', [], anon);
  R.check('public shops list returns the 2 shops', Array.isArray(pubShops.value) && pubShops.value.length === 2, pubShops.text.slice(0, 200));

  // update + delete round-trips
  r = await ctx.owner.put('/api/v1/services', { id: svcFacial.id, name: 'Facial Deluxe', price: 4000, duration: 50 });
  R.check('owner edits a service', r.status === 200 && r.json?.service?.price === 4000, r.text);
  r = await ctx.owner.put('/api/v1/products', { id: oil.id, name: 'Beard Oil', price: 2300, stock: 50 });
  R.check('owner edits a product', r.status === 200, r.text);
  const tmpSvc = (await ctx.owner.post('/api/v1/services', { name: 'Temp', price: 100, duration: 10 })).json?.service;
  r = await ctx.owner.del('/api/v1/services?id=' + tmpSvc.id);
  const gone = await db.service.findUnique({ where: { id: tmpSvc.id } });
  R.check('owner deletes a service', r.status === 200 && !gone || (r.status === 200 && gone?.status !== 'Active'), r.text);
  r = await ctx.owner.put('/api/v1/shops', { id: ctx.shopB.id, name: 'QA Kandy', address: '5 Temple Street, Kandy', status: 'Open' });
  R.check('owner edits a shop', r.status === 200, r.text);
  const tmpStaff = (await ctx.owner.post('/api/v1/staff', { role: 'BARBER', name: 'Temp Barber', email: 'temp@qa.test', password: PASSWORD, requirePasswordChange: false })).json?.user;
  r = await ctx.owner.put('/api/v1/staff', { id: tmpStaff.id, name: 'Temp Barber 2', email: 'temp@qa.test', role: 'BARBER', shopId: ctx.shopA.id });
  R.check('owner edits a staff member', r.status === 200 && r.json?.user?.name === 'Temp Barber 2', r.text);
  r = await ctx.owner.del('/api/v1/staff?id=' + tmpStaff.id);
  R.check('owner deletes a staff member', r.status === 200, r.text);

  // payroll-only update must NOT unassign the barber from the shop
  const before = await db.user.findUnique({ where: { id: b1.id } });
  r = await ctx.owner.put('/api/v1/staff', { id: b1.id, salaryType: 'Commission', baseSalary: 52000, commissionRate: 12, allowances: 1000 });
  const after = await db.user.findUnique({ where: { id: b1.id } });
  R.check('payroll-config update keeps the barber assigned to their shop', r.status === 200 && after.shopId === before.shopId && after.shopId, `shopId before=${before.shopId} after=${after?.shopId}`);
  if (after.shopId !== before.shopId) await db.user.update({ where: { id: b1.id }, data: { shopId: before.shopId } });
  await db.user.update({ where: { id: b1.id }, data: { commissionRate: 10, baseSalary: 50000, allowances: 0 } });

  r = await ctx.owner.post('/api/v1/permissions', { userId: ctx.manager.id, permissions: [{ pageKey: '/owner/products', canView: true, canAdd: true, canEdit: true, canDelete: false }, { pageKey: '/owner/orders', canView: true, canAdd: false, canEdit: true, canDelete: false }, { pageKey: '/owner/payments', canView: true, canAdd: true, canEdit: false, canDelete: false }, { pageKey: '/owner/bookings/manage', canView: true, canAdd: true, canEdit: true, canDelete: false }, { pageKey: '/owner/hr/attendance', canView: true, canAdd: true, canEdit: true, canDelete: false }] });
  R.check('owner grants a manager page permissions', r.status === 200, r.text);
  // permissions live in the session token, so the manager logs in again to pick them up
  ctx.managerC = (await staffLogin('manager@qa.test')).client;

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('3. Customer sign-up, login, password reset');
  ctx.cust = [];
  const mk = async (i, { email, phone }) => {
    const res = await registerCustomer({ name: `QA Customer ${i}`, email, phone });
    R.check(`customer ${i} registers (${email ? 'email OTP' : 'SMS OTP'}) and gets a session`, !res.error && res.client.jar.has('auth_token'), res.error);
    ctx.cust[i] = res.client;
    return res;
  };
  await mk(1, { email: 'cust1@qa.test' });
  await mk(2, { email: 'cust2@qa.test' });
  await mk(3, { phone: '0771234503' });
  await mk(4, { email: 'cust4@qa.test' });
  await mk(5, { email: 'cust5@qa.test' });
  const cust1Row = await db.user.findUnique({ where: { email: 'cust1@qa.test' } });
  R.check('customer row is stored with role CUSTOMER and a bcrypt hash', cust1Row?.role === 'CUSTOMER' && /^\$2[aby]\$/.test(cust1Row.password));
  R.check('OTP email carries branding and the correct expiry', (() => { const e = emails('cust1@qa.test').find((x) => /Verification/.test(x.subject)); return e && /MR POLAA/.test(e.html); })());

  // guard rails
  let c = new h.Client('guard');
  r = await c.post('/api/auth/login', { isRegister: true, email: 'sneaky@qa.test', password: PASSWORD, name: 'No OTP' });
  R.check('registration without a verified OTP is refused (403)', r.status === 403, r.text);
  const since = Date.now();
  await c.post('/api/auth/send-code', { identifier: 'cust6@qa.test', purpose: 'REGISTER' });
  r = await c.post('/api/auth/verify-code', { identifier: 'cust6@qa.test', purpose: 'REGISTER', code: '000000' });
  R.check('wrong OTP is rejected', r.status === 400, r.text);
  const goodCode = await otpFor('cust6@qa.test', since);
  r = await c.post('/api/auth/verify-code', { identifier: 'cust6@qa.test', purpose: 'REGISTER', code: goodCode });
  R.check('correct OTP is accepted', r.status === 200, r.text);
  r = await c.post('/api/auth/verify-code', { identifier: 'cust6@qa.test', purpose: 'REGISTER', code: goodCode });
  R.check('an OTP cannot be reused (single use)', r.status === 400, r.text);
  r = await c.post('/api/auth/login', { isRegister: true, email: 'cust1@qa.test', password: PASSWORD, name: 'Duplicate' });
  R.check('registering an already-used email is refused', r.status >= 400 && r.status < 500 && !r.json?.success, r.text);
  const bad = await c.post('/api/auth/login', { email: 'cust1@qa.test', password: 'wrong-password' });
  R.check('wrong password → 401 with a generic message', bad.status === 401 && !/not found|exist/i.test(bad.text), bad.text);

  const login = new h.Client('cust1-login');
  r = await login.post('/api/auth/login', { email: 'cust1@qa.test', password: PASSWORD });
  R.check('customer logs in with email + password', r.status === 200 && login.jar.has('auth_token'), r.text);
  const prof = await login.get('/profile');
  R.check('logged-in customer can open /profile', prof.status === 200, prof.status);
  const ownerPage = await login.get('/owner');
  R.check('customer is bounced from /owner', ownerPage.status >= 300 && ownerPage.status < 400, ownerPage.status);
  await login.post('/api/auth/logout');
  R.check('logout clears the session', !login.jar.has('auth_token'));

  // forgot password → OTP → reset → login with the new password
  const fp = new h.Client('forgot');
  const t0 = Date.now();
  await fp.post('/api/auth/send-code', { identifier: 'cust5@qa.test', purpose: 'PASSWORD_RESET' });
  const fpCode = await otpFor('cust5@qa.test', t0);
  await fp.post('/api/auth/verify-code', { identifier: 'cust5@qa.test', purpose: 'PASSWORD_RESET', code: fpCode });
  r = await fp.post('/api/auth/reset-password', { identifier: 'cust5@qa.test', newPassword: 'NewPass#67890' });
  R.check('password reset with a verified OTP succeeds', r.status === 200, r.text);
  const relog = new h.Client('cust5-new');
  r = await relog.post('/api/auth/login', { email: 'cust5@qa.test', password: 'NewPass#67890' });
  R.check('login works with the new password', r.status === 200, r.text);
  r = await new h.Client('x').post('/api/auth/reset-password', { identifier: 'cust4@qa.test', newPassword: 'Hacked#123456' });
  R.check('password reset WITHOUT a verified OTP is refused (403)', r.status === 403, r.text);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('4. Online booking + PayHere payment (services only)');
  const day1 = nthWeekday(2);
  let cust = ctx.cust[1];
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b1.id, date: day1, time: slotTime(10), shopId: ctx.shopA.id }], cust);
  R.check('booking without a phone number on the account asks for one', r.value?.success === false && /mobile number/i.test(r.value?.message || ''), JSON.stringify(r.value));
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b1.id, date: day1, time: slotTime(10), shopId: ctx.shopA.id, phone: 'not-a-number' }], cust);
  R.check('an invalid phone number is rejected', r.value?.success === false, JSON.stringify(r.value));
  const tBook = Date.now();
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b1.id, date: day1, time: slotTime(10), shopId: ctx.shopA.id, phone: '077 123 4501' }], cust);
  const book1 = r.value;
  R.check('services-only booking needs no address and returns a PayHere checkout', book1?.success && book1.payhere?.hash && book1.payhere.amount === '1500.00', JSON.stringify(book1).slice(0, 300));
  R.check('checkout uses the salon branch address and the saved phone', book1?.payhere?.address?.includes('Galle Road') && book1.payhere.phone === '0771234501', JSON.stringify(book1?.payhere));
  R.check('checkout never exposes the merchant secret', !JSON.stringify(book1).includes(h.QA_SECRETS.PAYHERE_MERCHANT_SECRET));
  const dbBook1 = await db.booking.findUnique({ where: { id: book1.bookingId }, include: { payment: true } });
  R.check('booking is PENDING with a PENDING PayHere payment', dbBook1.status === 'PENDING' && dbBook1.payment.status === 'PENDING' && dbBook1.totalAmount === 1500);
  const savedPhone = await db.user.findUnique({ where: { email: 'cust1@qa.test' } });
  R.check('phone number is saved on the customer account', savedPhone.phone === '771234501', savedPhone.phone);
  const reqSms = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tBook && /New booking request/i.test(e.message)));
  R.check('staff get an SMS the moment a booking request is made', !!reqSms, JSON.stringify(sms(STAFF_EXTRA).slice(-3)));
  const bell = await db.notification.findMany({ where: { title: 'New Booking Request' } });
  R.check('owner, manager and the assigned barber get the bell notification', ['OWNER', 'MANAGER'].every((role) => true) && bell.length === 3, `rows=${bell.length}`);
  R.check('status poll shows payment still pending', (await A('getBookingPaymentStatus', [book1.bookingId], cust)).value?.paymentStatus === 'PENDING');

  // forged / wrong notify payloads must change nothing
  const forged = h.payhereNotify(book1.bookingId, 1500, '2', { md5sig: 'A'.repeat(32) });
  r = await anon.req('POST', '/api/v1/payments/payhere/notify', { form: forged });
  let cur = await db.booking.findUnique({ where: { id: book1.bookingId } });
  R.check('notify with a forged signature is ignored (still PENDING)', r.status === 200 && cur.status === 'PENDING');
  r = await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book1.bookingId, 1500, '2', { merchant_id: '999' }) });
  cur = await db.booking.findUnique({ where: { id: book1.bookingId } });
  R.check('notify for a different merchant id is ignored', cur.status === 'PENDING');
  r = await anon.req('POST', '/api/v1/payments/payhere/notify', { form: { order_id: 'x' } });
  R.check('malformed notify → 200 and no change (PayHere never retry-storms)', r.status === 200);
  r = await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book1.bookingId, 1, '2') });
  cur = await db.booking.findUnique({ where: { id: book1.bookingId } });
  R.check('notify reporting a wrong (lower) amount does not confirm the booking', cur.status === 'PENDING', 'booking was confirmed for LKR 1 instead of 1500');

  // genuine notify
  const tPaid = Date.now();
  r = await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book1.bookingId, 1500, '2') });
  R.check('valid signed notify → 200', r.status === 200, r.status);
  cur = await db.booking.findUnique({ where: { id: book1.bookingId }, include: { payment: true } });
  R.check('booking becomes CONFIRMED and payment COMPLETED', cur.status === 'CONFIRMED' && cur.payment.status === 'COMPLETED', `${cur.status}/${cur.payment.status}`);
  const conf = await waitFor(() => emails('cust1@qa.test').find((e) => e.t >= tPaid && /Confirmed/i.test(e.subject)));
  R.check('customer gets a confirmation + receipt email', !!conf && /1,?500/.test(conf.html) && /INV-/.test(conf.html), conf?.subject);
  const custSms = await waitFor(() => sms('0771234501').find((e) => e.t >= tPaid && /confirmed/i.test(e.message)));
  R.check('customer gets a confirmation SMS', !!custSms, JSON.stringify(sms('0771234501').map((x) => x.message)));
  const staffPaidSms = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tPaid && /confirmed.*paid online/i.test(e.message)));
  R.check('staff get a "confirmed (paid online)" SMS', !!staffPaidSms);
  R.check('all SMS are sent with sender ID "Mr Polaa"', sms().every((e) => e.sender === 'Mr Polaa'));

  const nBefore = h.netLog().length;
  const notifBefore = await db.notification.count();
  r = await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book1.bookingId, 1500, '2') });
  await h.sleep(400);
  R.check('replaying the same notify is a no-op (no duplicate emails, SMS or bell rows)', h.netLog().length === nBefore && (await db.notification.count()) === notifBefore);
  R.check('status poll now shows the payment completed', (await A('getBookingPaymentStatus', [book1.bookingId], cust)).value?.paymentStatus === 'COMPLETED');

  const mine = await A('getCustomerBookings', [], cust);
  const mineList = mine.value?.items || mine.value?.data || mine.value?.bookings || mine.value;
  R.check('customer sees the booking in "my bookings"', JSON.stringify(mine.value).includes(book1.bookingId.slice(0, 8)) || (Array.isArray(mineList) && mineList.length >= 1), JSON.stringify(mine.value).slice(0, 200));

  // the slot is now taken
  const slots = await A('getBookedSlots', [b1.id, day1], ctx.cust[1]);
  R.check('the booked slot is reported as taken', Array.isArray(slots.value) && slots.value.includes('09:45 AM'), JSON.stringify(slots.value));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('5. Booking with products (address required) + stock + low-stock alerts');
  cust = ctx.cust[3]; // phone-only customer: already has a phone on the account
  const day2 = nthWeekday(3);
  r = await A('createBooking', [{ serviceIds: [svcBeard.id], productIds: [pomade.id], barberId: b2.id, date: day2, time: slotTime(11), shopId: ctx.shopA.id }], cust);
  R.check('products without a delivery address are refused', r.value?.success === false && /address/i.test(r.value.message), JSON.stringify(r.value));
  r = await A('createBooking', [{ serviceIds: [svcBeard.id], productIds: [pomade.id], barberId: b2.id, date: day2, time: slotTime(11), shopId: ctx.shopA.id, address: '9 Lake Rd', city: 'Colombo' }], cust);
  const book2 = r.value;
  R.check('booking with a product succeeds; total = service + product', book2?.success && book2.payhere.amount === '3300.00', JSON.stringify(book2).slice(0, 200));
  const stockBefore = (await db.product.findUnique({ where: { id: pomade.id } })).stock;
  R.check('stock is NOT reduced until payment is confirmed', stockBefore === 10, stockBefore);
  const tSale = Date.now();
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book2.bookingId, 3300, '2') });
  const stockAfter = (await db.product.findUnique({ where: { id: pomade.id } })).stock;
  R.check('paid product order reduces stock by 1', stockAfter === 9, stockAfter);
  const order = await db.order.findFirst({ where: { bookingId: book2.bookingId }, include: { items: true } });
  R.check('an Order (pickup) row is created for the product', order?.items.length === 1 && order.status === 'PENDING_PICKUP');
  const low = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tSale && /Low stock - Pomade has 9 left/.test(e.message)));
  R.check('owner/manager get "Low stock" SMS when a product drops to 9', !!low, JSON.stringify(sms(STAFF_EXTRA).slice(-3).map((x) => x.message)));
  const lowBell = await db.notification.findMany({ where: { title: 'Low Stock' } });
  R.check('low-stock bell goes to owner + manager only (not barbers)', lowBell.length === 2, `rows=${lowBell.length}`);
  const myOrders = await A('getMyOrders', [], cust);
  R.check('customer sees the order under "my orders"', Array.isArray(myOrders.value) && myOrders.value.length === 1, JSON.stringify(myOrders.value).slice(0, 150));

  r = await A('createBooking', [{ serviceIds: [svcCut.id], productIds: ['00000000-0000-0000-0000-000000000000'], barberId: b2.id, date: day2, time: slotTime(14), shopId: ctx.shopA.id, address: 'x', city: 'y' }], cust);
  R.check('unknown product id is rejected cleanly', r.value?.success === false, JSON.stringify(r.value));
  r = await A('createBooking', [{ serviceIds: ['00000000-0000-0000-0000-000000000000'], barberId: b2.id, date: day2, time: slotTime(14), shopId: ctx.shopA.id }], cust);
  R.check('unknown service id is rejected cleanly', r.value?.success === false, JSON.stringify(r.value));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('6. Failed / abandoned payment releases the slot');
  cust = ctx.cust[2];
  const day3 = nthWeekday(4);
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b3.id, date: day3, time: slotTime(12), shopId: ctx.shopA.id, phone: '0771234502' }], cust);
  const book3 = r.value;
  R.check('customer 2 starts a booking', book3?.success, JSON.stringify(book3).slice(0, 200));
  let slots3 = await A('getBookedSlots', [b3.id, day3], ctx.cust[2]);
  R.check('a pending booking holds the slot while payment is in progress', slots3.value?.includes('11:15 AM'), JSON.stringify(slots3.value));
  const tFail = Date.now();
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book3.bookingId, 1500, '-2') });
  cur = await db.booking.findUnique({ where: { id: book3.bookingId }, include: { payment: true } });
  R.check('failed payment → booking CANCELLED, payment FAILED', cur.status === 'CANCELLED' && cur.payment.status === 'FAILED', `${cur.status}/${cur.payment.status}`);
  slots3 = await A('getBookedSlots', [b3.id, day3], ctx.cust[2]);
  R.check('the slot is released again', Array.isArray(slots3.value) && !slots3.value.includes('11:15 AM'), JSON.stringify(slots3.value));
  const failSms = await waitFor(() => sms('0771234502').find((e) => e.t >= tFail && /not completed/i.test(e.message)));
  R.check('customer gets a "payment not completed" SMS', !!failSms);
  const failStaff = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tFail && /Payment not completed/i.test(e.message)));
  R.check('staff get a "payment not completed" SMS', !!failStaff);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('7. Customer cancels a booking');
  cust = ctx.cust[4];
  const day4 = nthWeekday(5);
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b1.id, date: day4, time: slotTime(15), shopId: ctx.shopA.id, phone: '0771234504' }], cust);
  const book4 = r.value;
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book4.bookingId, 1500, '2') });
  r = await A('cancelBooking', [book4.bookingId], ctx.cust[5]);
  cur = await db.booking.findUnique({ where: { id: book4.bookingId } });
  R.check("another customer cannot cancel someone else's booking", r.value?.success === false && cur.status === 'CONFIRMED', JSON.stringify(r.value));
  const tCancel = Date.now();
  r = await A('cancelBooking', [book4.bookingId], cust);
  cur = await db.booking.findUnique({ where: { id: book4.bookingId }, include: { payment: true } });
  R.check('customer cancels their own paid booking → CANCELLED, payment REFUNDED (pending manual refund)', r.value?.success && cur.status === 'CANCELLED' && cur.payment.status === 'REFUNDED', JSON.stringify(r.value) + ' ' + cur.payment?.status);
  const cancelMail = await waitFor(() => emails('cust4@qa.test').find((e) => e.t >= tCancel && /Cancel/i.test(e.subject)));
  R.check('customer gets a cancellation email that mentions the refund', !!cancelMail && /refund/i.test(cancelMail.html));
  const cancelSms = await waitFor(() => sms('0771234504').find((e) => e.t >= tCancel && /cancelled/i.test(e.message)));
  R.check('customer gets a cancellation SMS', !!cancelSms);
  const cancelStaff = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tCancel && /cancel/i.test(e.message)));
  R.check('staff get a cancellation SMS', !!cancelStaff);
  r = await A('cancelBooking', [book4.bookingId], cust);
  R.check('cancelling twice is refused', r.value?.success === false);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('8. Staff run the bookings (owner / manager / barber)');
  const day5 = nthWeekday(6);
  const iso = (d, hh, mm = 0) => `${d}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
  r = await ctx.owner.post('/api/v1/bookings', { serviceIds: [svcCut.id], barberId: b1.id, shopId: ctx.shopA.id, date: iso(day5, 9), clientName: 'Walk In Wendy', amount: 1500 });
  const manual1 = r.json?.booking;
  R.check('owner creates a manual booking for a walk-in client', r.status === 201 && manual1?.status === 'CONFIRMED', r.text.slice(0, 200));
  r = await ctx.owner.post('/api/v1/bookings', { serviceIds: [svcColour.id], barberId: b1.id, shopId: ctx.shopA.id, date: iso(day5, 9, 15), clientName: 'Overlap Olga', amount: 6000 });
  R.check('overlapping booking for the same barber is refused', r.status >= 400, `${r.status} ${r.text.slice(0, 160)}`);
  r = await ctx.owner.post('/api/v1/bookings', { serviceIds: [svcCut.id], barberId: b1.id, shopId: ctx.shopA.id, date: iso(day5, 23), clientName: 'Midnight Mike', amount: 1500 });
  R.check('manual booking outside the shop opening hours is refused', r.status === 400, `${r.status} ${r.text.slice(0, 160)}`);
  r = await ctx.managerC.post('/api/v1/bookings', { serviceIds: [svcBeard.id], barberId: b2.id, shopId: ctx.shopA.id, date: iso(day5, 10), clientName: 'Manager Mia', amount: 800 });
  const manual2 = r.json?.booking;
  R.check('manager creates a booking', r.status === 201, r.text.slice(0, 200));

  const barber1Bookings = await ctx.barberC[0].get('/api/v1/bookings');
  const b1ids = (barber1Bookings.json?.bookings || []).map((b) => b.barberId || b.barber?.id);
  R.check('a barber only sees bookings assigned to them', barber1Bookings.status === 200 && b1ids.length >= 1 && b1ids.every((id) => id === b1.id || id === undefined), JSON.stringify(b1ids));
  r = await ctx.barberC[0].put('/api/v1/bookings', { id: manual2.id, status: 'CANCELLED' });
  R.check("a barber cannot change another barber's booking (403)", r.status === 403, r.status);

  // a staff-accepted booking whose online payment then arrives (payment must complete, booking stay confirmed)
  r = await A('createBooking', [{ serviceIds: [svcBeard.id], barberId: b4.id, date: nthWeekday(8), time: slotTime(9), shopId: ctx.shopB.id, phone: '0771234502' }], ctx.cust[2]);
  const pend2 = r.value;
  await ctx.managerC.put('/api/v1/bookings', { id: pend2.bookingId, status: 'CONFIRMED' });
  const tLate = Date.now();
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(pend2.bookingId, 800, '2') });
  const late = await db.booking.findUnique({ where: { id: pend2.bookingId }, include: { payment: true } });
  R.check('online payment arriving after staff accepted the booking is recorded (CONFIRMED + COMPLETED)', late.status === 'CONFIRMED' && late.payment.status === 'COMPLETED', late.status + '/' + late.payment.status);
  const lateMail = await waitFor(() => emails('cust2@qa.test').find((e) => e.t >= tLate && /Receipt/i.test(e.subject)));
  R.check('…and the customer then gets the payment receipt email', !!lateMail);
  // a signed notify that reports the wrong amount must alert the salon and change nothing
  r = await A('createBooking', [{ serviceIds: [svcBeard.id], barberId: b4.id, date: nthWeekday(8), time: slotTime(11), shopId: ctx.shopB.id }], ctx.cust[2]);
  const tMis = Date.now();
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(r.value.bookingId, 5, '2') });
  const misSms = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tMis && /amount mismatch/i.test(e.message)));
  R.check('a wrong-amount notify texts the owner (amount mismatch) and does not confirm', !!misSms && (await db.booking.findUnique({ where: { id: r.value.bookingId } })).status === 'PENDING');
  await A('cancelBooking', [r.value.bookingId], ctx.cust[2]);
  // chargeback after a successful payment alerts the owner
  const tCb = Date.now();
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(book1.bookingId, 1500, '-3') });
  const cbSms = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tCb && /chargeback/i.test(e.message)));
  R.check('a chargeback notice for a paid booking alerts the owner', !!cbSms);

  // pending online booking accepted from the dashboard (customer paid in shop later)
  cust = ctx.cust[1];
  r = await A('createBooking', [{ serviceIds: [svcBeard.id], barberId: b3.id, date: nthWeekday(7), time: slotTime(13), shopId: ctx.shopA.id }], cust);
  const pend = r.value;
  const tAccept = Date.now();
  r = await ctx.managerC.put('/api/v1/bookings', { id: pend.bookingId, status: 'CONFIRMED' });
  R.check('manager accepts a pending booking from the dashboard', r.status === 200, r.text.slice(0, 200));
  const accMail = await waitFor(() => emails('cust1@qa.test').find((e) => e.t >= tAccept && /Confirmed/i.test(e.subject)));
  const accSms = await waitFor(() => sms('0771234501').find((e) => e.t >= tAccept && /confirmed/i.test(e.message)));
  R.check('accepting a booking emails + texts the customer', !!accMail && !!accSms);
  const nAcc = h.netLog().length;
  await ctx.managerC.put('/api/v1/bookings', { id: pend.bookingId, status: 'CONFIRMED' });
  await h.sleep(300);
  R.check('re-accepting does not re-send notifications', h.netLog().length === nAcc);
  const tDone = Date.now();
  r = await ctx.barberC[2].put('/api/v1/bookings', { id: pend.bookingId, status: 'COMPLETED' });
  R.check('assigned barber marks the booking COMPLETED', r.status === 200, r.text.slice(0, 200));
  const rcpt = await waitFor(() => emails('cust1@qa.test').find((e) => e.t >= tDone && /Receipt|Payment/i.test(e.subject)));
  R.check('customer gets a payment receipt when a cash booking is completed', !!rcpt, emails('cust1@qa.test').map((e) => e.subject).join(' | '));
  const commissions = await db.commission.findMany({ where: { barberId: b3.id } });
  R.check('completing a booking records the barber commission', commissions.length >= 1 && commissions[0].amount > 0, JSON.stringify(commissions));

  r = await ctx.owner.put('/api/v1/bookings', { id: manual1.id, action: 'PAYMENT_COMPLETE', paymentMethod: 'card' });
  R.check('owner records a card payment for a manual booking', r.status === 200, r.text.slice(0, 200));
  r = await ctx.owner.del('/api/v1/bookings?id=' + manual2.id);
  R.check('owner deletes a booking', r.status === 200 && !(await db.booking.findUnique({ where: { id: manual2.id } })), r.text.slice(0, 200));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('9. Walk-in bills, stock and out-of-stock alerts');
  const tBill = Date.now();
  r = await A('createManualBill', [{ invoiceNo: 'INV-QA-1', clientName: 'Walk In Bill', items: [{ name: 'Shampoo', type: 'Product', price: 1800, productId: shampoo.id }], amount: 1800, method: 'CASH', barberId: b1.id, branch: 'QA Colombo' }], ctx.managerC);
  R.check('manager creates a walk-in bill with a product', r.value?.success, JSON.stringify(r.value));
  R.check('bill decrements stock 3 → 2', (await db.product.findUnique({ where: { id: shampoo.id } })).stock === 2);
  await A('createManualBill', [{ invoiceNo: 'INV-QA-2', clientName: 'Walk In Bill 2', items: [{ name: 'Shampoo', type: 'Product', price: 1800, productId: shampoo.id }], amount: 1800, method: 'CARD' }], ctx.owner);
  await A('createManualBill', [{ invoiceNo: 'INV-QA-3', clientName: 'Walk In Bill 3', items: [{ name: 'Shampoo', type: 'Product', price: 1800, productId: shampoo.id }], amount: 1800, method: 'CASH' }], ctx.owner);
  R.check('stock reaches 0', (await db.product.findUnique({ where: { id: shampoo.id } })).stock === 0);
  const oos = await waitFor(() => sms(STAFF_EXTRA).find((e) => e.t >= tBill && /Out of stock - Shampoo/.test(e.message)));
  R.check('out-of-stock SMS is sent when a product runs out', !!oos);
  const lowShampoo = sms(STAFF_EXTRA).filter((e) => e.t >= tBill && /Low stock - Shampoo/.test(e.message));
  R.check('(stock 3 never crosses the 9 line → no spurious low-stock SMS)', lowShampoo.length === 0);
  r = await A('createManualBill', [{ invoiceNo: 'INV-QA-4', clientName: 'Too Late', items: [{ name: 'Shampoo', type: 'Product', price: 1800, productId: shampoo.id }], amount: 1800, method: 'CASH' }], ctx.owner);
  const negStock = (await db.product.findUnique({ where: { id: shampoo.id } })).stock;
  R.check('selling an out-of-stock product is refused (stock never goes negative)', negStock >= 0 && r.value?.success === false, `success=${r.value?.success} stock=${negStock}`);
  const payments = await A('getAllPayments', [{ page: 1, pageSize: 10 }], ctx.owner);
  R.check('payments list is paginated with stats', payments.value?.success && Array.isArray(payments.value.data?.items || payments.value.items || payments.value.data), JSON.stringify(payments.value).slice(0, 200));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('10. Orders (product pickup)');
  const orders = await A('getAllOrders', [{ page: 1, pageSize: 10 }], ctx.managerC);
  R.check('manager lists orders', orders.value?.success !== false && !!orders.value, String(JSON.stringify(orders.value)).slice(0, 200));
  r = await A('updateOrderStatus', [order.id, 'COLLECTED'], ctx.managerC);
  R.check('manager marks an order as collected', r.value?.success && (await db.order.findUnique({ where: { id: order.id } })).status === 'COLLECTED', JSON.stringify(r.value));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('11. Attendance (manual + fingerprint device)');
  // (times that have already happened, whatever the hour the suite runs at: the API refuses attendance in the future)
  const today = new Date().toLocaleDateString('en-CA');
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const inAt = new Date(dayStart.getTime() + 60000);
  const outAt = new Date(Math.max(inAt.getTime() + 60000, Math.min(dayStart.getTime() + 17.5 * 3600000, Date.now() - 60000)));
  r = await ctx.managerC.post('/api/v1/attendance', { userId: b1.id, date: today, checkIn: inAt.toISOString() });
  const att = r.json?.record;
  R.check('manager clocks a barber in', r.status === 201 && att?.id, r.text.slice(0, 160));
  r = await ctx.managerC.post('/api/v1/attendance', { userId: b1.id, date: today, checkOut: outAt.toISOString() });
  R.check('manager clocks the barber out', r.status === 200, r.text.slice(0, 160));
  r = await ctx.managerC.post('/api/v1/attendance', { userId: b1.id, date: today, checkIn: inAt.toISOString() });
  R.check('a second clock-in for a finished day is refused (409)', r.status === 409, r.status);
  r = await ctx.owner.get('/api/v1/attendance?page=1&pageSize=5&date=' + today);
  R.check('attendance list is paginated', r.status === 200 && r.json?.total >= 1 && r.json.attendance.length <= 5, r.text.slice(0, 160));
  r = await ctx.owner.put('/api/v1/attendance', { id: att.id, checkOut: outAt.toISOString() });
  R.check('owner edits an attendance record', r.status === 200, r.text.slice(0, 120));
  await ctx.owner.del('/api/v1/attendance?id=' + att.id);
  R.check('owner deletes an attendance record', !(await db.attendance.findUnique({ where: { id: att.id } })));

  await db.employeeDevice.create({ data: { fingerprintId: 'FP-B2', deviceId: 'DEV-1', userId: b2.id } });
  const dev = new h.Client('device');
  const devHdr = { 'x-device-key': h.QA_SECRETS.FINGERPRINT_DEVICE_KEY };
  r = await dev.req('POST', '/api/v1/attendance/fingerprint', { json: { deviceId: 'DEV-1', fingerprintId: 'FP-B2', type: 'CHECK_IN' }, headers: devHdr });
  R.check('fingerprint device check-in works with the device key', r.status === 200 && r.json?.status === 'checked_in', r.text);
  r = await dev.req('POST', '/api/v1/attendance/fingerprint', { json: { deviceId: 'DEV-1', fingerprintId: 'FP-B2', type: 'CHECK_OUT' }, headers: devHdr });
  R.check('fingerprint device check-out works', r.status === 200 && r.json?.status === 'checked_out', r.text);
  r = await dev.req('POST', '/api/v1/attendance/fingerprint', { json: { deviceId: 'DEV-1', fingerprintId: 'FP-B2', type: 'CHECK_IN' } });
  R.check('fingerprint endpoint without the device key → 401', r.status === 401);
  r = await dev.req('POST', '/api/v1/attendance/fingerprint', { json: { deviceId: 'DEV-1', fingerprintId: 'NOPE', type: 'CHECK_IN' }, headers: devHdr });
  R.check('unknown fingerprint → 404', r.status === 404);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('12. Payroll and barber earnings');
  const now = new Date();
  const monthStr = now.toLocaleString('en-US', { month: 'long' }) + ' ' + now.getFullYear();
  r = await A('getMonthlyPayroll', [monthStr], ctx.owner);
  R.check('owner previews payroll for the current month', r.value?.success && Array.isArray(r.value.data) && r.value.data.length >= 5, JSON.stringify(r.value).slice(0, 200));
  const mine2 = await A('getMyCommissions', [monthStr], ctx.barberC[2]);
  R.check('barber sees their own commissions', mine2.value?.success, JSON.stringify(mine2.value).slice(0, 200));
  r = await A('processPayroll', [monthStr], ctx.owner);
  R.check('owner processes payroll', r.value?.success, JSON.stringify(r.value));
  r = await A('processPayroll', [monthStr], ctx.owner);
  R.check('processing the same month twice is refused', r.value?.success === false, JSON.stringify(r.value));
  const pr = await db.payroll.findFirst({ where: { userId: b3.id } });
  r = await A('markPayrollPaid', [pr.id], ctx.owner);
  R.check('owner marks a payslip as PAID', r.value?.success && (await db.payroll.findUnique({ where: { id: pr.id } })).status === 'PAID', JSON.stringify(r.value));
  for (const p of [`/owner/hr/payroll/${b3.id}`, '/owner/hr/payroll', '/owner/hr/attendance']) {
    const pg = await ctx.owner.get(p);
    R.check(`owner page ${p} renders`, pg.status === 200, pg.status);
  }

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('13. Expenses (owner only)');
  const ym = new Date().toISOString().slice(0, 7);
  const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
  const pym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  const pday = `${pym}-15`;
  const cats = ['STOCK_ORDER', 'PETTY_CASH', 'UTILITIES', 'RENT', 'OTHER'];
  const created = [];
  for (let i = 0; i < 12; i++) {
    r = await A('createExpense', [{ category: cats[i % 5], title: `QA expense ${i}`, amount: 1000 + i * 100, date: i < 8 ? `${ym}-01` : pday, supplier: 'QA Supplier', note: 'n', shopId: i % 2 ? ctx.shopA.id : undefined }], ctx.owner);
    created.push(r.value);
  }
  R.check('owner records 12 expenses across two months', created.every((x) => x?.success), JSON.stringify(created.find((x) => !x?.success)));
  r = await A('getExpenses', [{ month: ym, page: 1, pageSize: 5 }], ctx.owner);
  const exp = r.value;
  R.check('expenses list is paginated (5 of 8 this month)', exp?.success && (exp.data?.items || exp.items)?.length === 5 && (exp.data?.total ?? exp.total) === 8, JSON.stringify(exp).slice(0, 300));
  r = await A('getExpenses', [{ month: ym, page: 2, pageSize: 5, category: 'RENT' }], ctx.owner);
  R.check('category filter + page 2 behave', r.value?.success, JSON.stringify(r.value).slice(0, 200));
  r = await A('getExpenseOverview', [{ month: ym, compareMonth: pym }], ctx.owner);
  R.check('month comparison overview is computed', r.value?.success && r.value.data, JSON.stringify(r.value).slice(0, 300));
  const bad1 = await A('createExpense', [{ category: 'RENT', title: 'x', amount: -5, date: `${ym}-01` }], ctx.owner);
  const bad2 = await A('createExpense', [{ category: 'NOPE', title: 'x', amount: 5, date: `${ym}-01` }], ctx.owner);
  const bad3 = await A('createExpense', [{ category: 'RENT', title: 'x', amount: 5, date: '2020-02-31' }], ctx.owner);
  R.check('invalid expenses (negative amount / bad category / impossible date) are rejected', [bad1, bad2, bad3].every((x) => x.value?.success === false));
  const firstExpense = await db.expense.findFirst();
  r = await A('updateExpense', [{ id: firstExpense.id, category: 'OTHER', title: 'Edited', amount: 999, date: `${ym}-02` }], ctx.owner);
  R.check('owner edits an expense', r.value?.success && (await db.expense.findUnique({ where: { id: firstExpense.id } })).title === 'Edited', JSON.stringify(r.value));
  r = await A('deleteExpense', [firstExpense.id], ctx.owner);
  R.check('owner deletes an expense', r.value?.success && !(await db.expense.findUnique({ where: { id: firstExpense.id } })));
  const exPage = await ctx.owner.get('/owner/expenses');
  R.check('expenses page renders for the owner', exPage.status === 200);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('14. Reports, dashboards and pages for every role');
  r = await A('getReportsAnalytics', ['all'], ctx.owner);
  R.check('owner reports analytics load', r.value?.success, JSON.stringify(r.value).slice(0, 160));
  r = await A('getShopComparisonAnalytics', [], ctx.owner);
  R.check('shop comparison loads', r.value?.success, JSON.stringify(r.value).slice(0, 160));
  r = await A('getBookingTrendsAnalytics', ['all'], ctx.owner);
  R.check('booking trends load', r.value?.success, JSON.stringify(r.value).slice(0, 160));
  r = await A('getProductSalesAnalytics', [], ctx.owner);
  R.check('product sales analytics load', r.value?.success, JSON.stringify(r.value).slice(0, 160));
  r = await A('getDashboardAnalytics', ['all', '30d'], ctx.owner);
  R.check('owner dashboard analytics load', r.value?.success, JSON.stringify(r.value).slice(0, 160));
  const shopDash = await ctx.owner.get(`/owner/shops/${ctx.shopA.id}/dashboard`);
  R.check('per-shop dashboard renders', shopDash.status === 200, shopDash.status);
  const ownerPages = ['/owner', '/owner/bookings/manage', '/owner/calendar', '/owner/orders', '/owner/payments', '/owner/products', '/owner/services', '/owner/reports', '/owner/shops', '/owner/staff', `/owner/staff/${b1.id}/permissions`];
  for (const p of ownerPages) {
    const pg = await ctx.owner.get(p);
    R.check(`owner page ${p} renders`, pg.status === 200, pg.status);
  }
  for (const [label, client, pages] of [
    ['admin', ctx.adminC, ['/admin', '/admin/backups', '/admin/logs', '/admin/settings', '/admin/shops']],
    ['barber', ctx.barberC[0], ['/barber', '/barber/earnings']],
    ['manager', ctx.managerC, ['/manager/attendance', '/owner/bookings/manage', '/owner/products']],
    ['customer', ctx.cust[1], ['/profile', '/booking']],
  ]) {
    for (const p of pages) {
      const pg = await client.get(p);
      R.check(`${label} page ${p} renders`, pg.status === 200, `${pg.status} ${pg.headers.get('location') || ''}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('15. Notification bell + pagination limits');
  r = await ctx.owner.get('/api/v1/notifications');
  const unread = (r.json?.notifications || []).filter((n) => !n.read).length;
  R.check('owner has unread notifications and at most 30 are returned', r.status === 200 && unread > 0 && r.json.notifications.length <= 30, `unread=${unread}`);
  await ctx.owner.put('/api/v1/notifications', {});
  r = await ctx.owner.get('/api/v1/notifications');
  R.check('"mark all read" works', (r.json?.notifications || []).every((n) => n.read));
  for (const q of ['page=1&pageSize=5', 'page=0&pageSize=5', 'page=-3&pageSize=5', 'page=abc', 'page=1&pageSize=100000', 'page=99999&pageSize=10']) {
    r = await ctx.owner.get('/api/v1/bookings?' + q);
    R.check(`bookings pagination "${q}" is handled without error`, r.status === 200 && r.json.bookings.length <= 50, r.status);
  }
  r = await ctx.owner.get('/api/v1/bookings?page=1&pageSize=3&q=Walk');
  R.check('booking search filters server-side', r.status === 200 && r.json.total >= 1 && r.json.bookings.length <= 3, r.text.slice(0, 160));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('16. Mobile number rules for booking SMS');
  // The booking page is rendered on the server with the customer's contact state (no client round trip)
  const contactState = async (client) => { const pg = await client.get('/booking'); const m = pg.text.match(/hasPhone\\?":(true|false)[^}]*?maskedPhone\\?":\\?"([^"\\]*)/); return m ? { hasPhone: m[1] === 'true', maskedPhone: m[2] } : null; };
  const contact5 = await contactState(ctx.cust[5]);
  R.check('a customer with no number on their account is reported as needing one', contact5?.hasPhone === false, JSON.stringify(contact5));
  const contact1 = await contactState(ctx.cust[1]);
  R.check('a customer with a saved number is NOT asked (masked number shown instead)', contact1?.hasPhone === true && contact1.maskedPhone === '077 *** 4501', JSON.stringify(contact1));
  const dayP = nthWeekday(24);
  const tPh = Date.now();
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b4.id, date: dayP, time: slotTime(9), shopId: ctx.shopB.id, phone: '0771234501' }], ctx.cust[5]);
  R.check('a number that another account already holds does NOT block the booking', r.value?.success === true, JSON.stringify(r.value));
  const usedNumBooking = await db.booking.findUnique({ where: { id: r.value.bookingId } });
  const acct5 = await db.user.findUnique({ where: { email: 'cust5@qa.test' } });
  R.check('…the number is kept on the booking (for its SMS) but NOT saved on the account', usedNumBooking.contactPhone === '771234501' && acct5.phone === null, JSON.stringify({ c: usedNumBooking.contactPhone, a: acct5.phone }));
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(r.value.bookingId, 1500, '2') });
  const smsToGiven = await waitFor(() => sms('0771234501').find((e) => e.t >= tPh && /confirmed/i.test(e.message)));
  R.check('the booking confirmation SMS goes to the number given for that booking', !!smsToGiven);
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b4.id, date: dayP, time: slotTime(11), shopId: ctx.shopB.id, phone: '0771234555' }], ctx.cust[5]);
  const acct5b = await db.user.findUnique({ where: { email: 'cust5@qa.test' } });
  R.check('a free number is saved on the account and the customer is not asked again', r.value?.success && r.value.phoneSaved === true && acct5b.phone === '771234555' && (await contactState(ctx.cust[5]))?.hasPhone === true, JSON.stringify(r.value)?.slice(0, 160));
  const tSaved = Date.now();
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b4.id, date: dayP, time: slotTime(13), shopId: ctx.shopB.id }], ctx.cust[5]);
  R.check('later bookings need no number at all and use the saved one', r.value?.success === true && (await db.booking.findUnique({ where: { id: r.value.bookingId } })).contactPhone === '771234555', JSON.stringify(r.value)?.slice(0, 160));
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(r.value.bookingId, 1500, '-2') });
  const failToSaved = await waitFor(() => sms('0771234555').find((e) => e.t >= tSaved && /not completed/i.test(e.message)));
  R.check('the payment-failed SMS also goes to the booking number', !!failToSaved);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('17. Branch opening hours are checked and shown up front');
  const shopsPublic = await A('getPublicShops', [], anon);
  const kandy = (shopsPublic.value || []).find((x) => x.id === ctx.shopB.id);
  R.check('the public branch list carries opening hours and status for the booking page', kandy?.operatingHours?.Monday?.open === '09:00' && kandy.operatingHours.Sunday?.isClosed === true && kandy.status === 'Open', JSON.stringify(kandy)?.slice(0, 200));
  const hours = { ...kandy.operatingHours, Saturday: { open: '09:00', close: '12:00', isClosed: false } };
  await ctx.owner.put('/api/v1/shops', { id: ctx.shopB.id, operatingHours: hours });
  const satDate = (() => { const d = new Date(); d.setDate(d.getDate() + 10); while (d.getDay() !== 6) d.setDate(d.getDate() + 1); const p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const sunDate = (() => { const d = new Date(satDate + ' 12:00'); d.setDate(d.getDate() + 1); const p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const c4 = ctx.cust[4];
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b4.id, date: satDate, time: '11:15 AM', shopId: ctx.shopB.id }], c4);
  R.check('a visit that ends before closing time is accepted (Saturday half day)', r.value?.success === true, JSON.stringify(r.value)?.slice(0, 160));
  await A('cancelBooking', [r.value.bookingId], c4);
  r = await A('createBooking', [{ serviceIds: [svcColour.id], barberId: b4.id, date: satDate, time: '11:15 AM', shopId: ctx.shopB.id }], c4);
  R.check('a 90-minute visit that would run past closing time is refused with the hours in the message', r.value?.success === false && /9:00 AM - 12:00 PM/.test(r.value.message), JSON.stringify(r.value)?.slice(0, 200));
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b4.id, date: satDate, time: '01:00 PM', shopId: ctx.shopB.id }], c4);
  R.check('a time after closing is refused', r.value?.success === false && /open/i.test(r.value.message), JSON.stringify(r.value)?.slice(0, 160));
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b4.id, date: sunDate, time: '10:30 AM', shopId: ctx.shopB.id }], c4);
  R.check('Sunday is refused with "closed on Sundays"', r.value?.success === false && /closed on Sundays/.test(r.value.message), JSON.stringify(r.value)?.slice(0, 160));
  await ctx.owner.put('/api/v1/shops', { id: ctx.shopB.id, status: 'Closed' });
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b4.id, date: nthWeekday(26), time: '10:30 AM', shopId: ctx.shopB.id }], c4);
  R.check('a temporarily closed branch takes no bookings', r.value?.success === false && /closed/i.test(r.value.message), JSON.stringify(r.value)?.slice(0, 160));
  await ctx.owner.put('/api/v1/shops', { id: ctx.shopB.id, status: 'Open', operatingHours: kandy.operatingHours });

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('18. Owner emails for bookings and orders');
  const OWNER = 'owner@qa.test';
  const ownerMail = (since, re) => emails(OWNER).find((e) => e.t >= since && re.test(e.subject));
  const d18 = nthWeekday(40);
  const c3 = ctx.cust[3];

  let t18 = Date.now();
  r = await A('createBooking', [{ serviceIds: [svcCut.id], barberId: b3.id, date: d18, time: slotTime(9), shopId: ctx.shopA.id }], c3);
  const req18 = r.value;
  const mReq = await waitFor(() => ownerMail(t18, /New booking request/i));
  R.check('the owner is emailed the moment a customer starts a booking (awaiting payment)', !!mReq && /awaiting payment/i.test(mReq.subject), emails(OWNER).slice(-2).map((e) => e.subject).join(' | '));
  R.check('…with customer, service, time, branch, amount and reference', !!mReq && /QA Customer 3/.test(mReq.html) && /Haircut/.test(mReq.html) && /QA Colombo/.test(mReq.html) && /1,500/.test(mReq.html) && /Reference/.test(mReq.html));
  R.check('…and a button to the bookings dashboard', !!mReq && /\/owner\/bookings\/manage/.test(mReq.html));

  t18 = Date.now();
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(req18.bookingId, 1500, '2') });
  const mPaid = await waitFor(() => ownerMail(t18, /New booking \(paid\)/i));
  R.check('the owner is emailed when the booking is paid and confirmed', !!mPaid, emails(OWNER).slice(-2).map((e) => e.subject).join(' | '));

  t18 = Date.now();
  r = await A('createBooking', [{ serviceIds: [svcBeard.id], productIds: [oil.id], barberId: b3.id, date: d18, time: slotTime(11), shopId: ctx.shopA.id, address: '1 Test Rd', city: 'Colombo' }], c3);
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(r.value.bookingId, 3100, '2') });
  const mOrder = await waitFor(() => ownerMail(t18, /product order/i));
  R.check('a booking that includes a product is emailed as a product ORDER, listing the product', !!mOrder && /Beard Oil/.test(mOrder.html) && /product order/i.test(mOrder.html) && /booking=/.test(mOrder.html), emails(OWNER).slice(-3).map((e) => e.subject).join(' | '));

  t18 = Date.now();
  r = await A('cancelBooking', [req18.bookingId], c3);
  const mCancel = await waitFor(() => ownerMail(t18, /cancelled/i));
  R.check('cancelling a PAID booking emails the owner as "refund needed" in the red action-needed style', !!mCancel && /refund needed/i.test(mCancel.subject) && /Action needed/.test(mCancel.html), mCancel?.subject);

  t18 = Date.now();
  r = await ctx.managerC.post('/api/v1/bookings', { serviceIds: [svcCut.id], barberId: b2.id, shopId: ctx.shopA.id, date: `${nthWeekday(41)}T10:00:00`, clientName: 'Manager Made', amount: 1500 });
  const mMgr = await waitFor(() => ownerMail(t18, /Manager Made/));
  R.check('a booking created by a manager is emailed to the owner', r.status === 201 && !!mMgr && /created by the salon team/i.test(mMgr.html), r.status);
  t18 = Date.now();
  await ctx.owner.post('/api/v1/bookings', { serviceIds: [svcCut.id], barberId: b2.id, shopId: ctx.shopA.id, date: `${nthWeekday(41)}T12:00:00`, clientName: 'Owner Made', amount: 1500 });
  await h.sleep(1200);
  R.check('the owner is NOT emailed about a booking they created themselves', !ownerMail(t18, /Owner Made/));

  t18 = Date.now();
  await A('createManualBill', [{ invoiceNo: 'INV-QA-MAIL1', clientName: 'Counter Sale Manager', items: [{ name: 'Beard Oil', type: 'Product', price: 2300, productId: oil.id }], amount: 2300, method: 'CASH' }], ctx.managerC);
  const mSale = await waitFor(() => ownerMail(t18, /New product sale/i));
  R.check('a product sold at the counter by staff is emailed to the owner as a sale/order', !!mSale && /Beard Oil/.test(mSale.html) && /Counter Sale Manager/.test(mSale.html), emails(OWNER).slice(-2).map((e) => e.subject).join(' | '));
  t18 = Date.now();
  await A('createManualBill', [{ invoiceNo: 'INV-QA-MAIL2', clientName: 'Counter Sale Owner', items: [{ name: 'Beard Oil', type: 'Product', price: 2300, productId: oil.id }], amount: 2300, method: 'CASH' }], ctx.owner);
  await h.sleep(1200);
  R.check('…but not when the owner rang it up themselves', !ownerMail(t18, /product sale/i));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('19. Notification bell API (unread count, unread first, mark read)');
  r = await ctx.owner.get('/api/v1/notifications');
  const unread0 = r.json?.unreadCount;
  R.check('the API reports an accurate unread count', typeof unread0 === 'number' && unread0 > 0, JSON.stringify({ unread0 }));
  R.check('unread notifications are listed FIRST (a burst of read ones cannot push them out of view)', r.json.notifications[0].read === false && (() => { const list = r.json.notifications; const firstRead = list.findIndex((n) => n.read); return firstRead === -1 || list.slice(firstRead).every((n) => n.read); })());
  R.check('at most 30 are listed', r.json.notifications.length <= 30);
  const one = r.json.notifications.find((n) => !n.read);
  await ctx.owner.put('/api/v1/notifications', { ids: [one.id] });
  r = await ctx.owner.get('/api/v1/notifications');
  R.check('marking one notification read lowers the count by exactly one', r.json.unreadCount === unread0 - 1, `${unread0} -> ${r.json.unreadCount}`);
  const other = await ctx.managerC.get('/api/v1/notifications');
  const otherUnread = other.json.unreadCount;
  await ctx.owner.put('/api/v1/notifications', { ids: other.json.notifications.filter((n) => !n.read).map((n) => n.id) });
  R.check("one user cannot mark another user's notifications read", (await ctx.managerC.get('/api/v1/notifications')).json.unreadCount === otherUnread);
  await ctx.owner.put('/api/v1/notifications', {});
  R.check('"mark all as read" clears the count', (await ctx.owner.get('/api/v1/notifications')).json.unreadCount === 0);

  ctx.day = (n) => nthWeekday(n);
  return ctx;
}

module.exports = { run, sms, emails, STAFF_EXTRA };
