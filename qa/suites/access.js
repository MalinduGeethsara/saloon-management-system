// Access permissions the owner hands out, attendance entries, and who is told about what (bell / SMS / email).
// Runs against the same production build and database as the other suites (after them, so its extra accounts
// cannot disturb their counts).
const h = require('../lib/harness');
const { PASSWORD, staffLogin, waitFor, nthWeekday } = require('./helpers');

const sms = (to) => h.netLog().filter((e) => e.type === 'sms' && (!to || e.to === '94' + to.replace(/^0/, '')));
const emails = (to) => h.netLog().filter((e) => e.type === 'email' && (!to || e.to === to));
const redirected = (r) => r.status >= 300 && r.status < 400;
const locationOf = (r) => r.headers.get('location') || '';
const row = (pageKey, view = true, add = false, edit = false, del = false) => ({ pageKey, canView: view, canAdd: add, canEdit: edit, canDelete: del });

async function run(R, ctx) {
  const db = h.prisma();
  const A = (name, args, client) => client.action(name, args);

  const mkStaff = async (role, name, email, shopId, phone) => {
    const r = await ctx.owner.post('/api/v1/staff', { role, name, email, shopId, password: PASSWORD, salaryType: 'Commission', baseSalary: 40000, commissionRate: 10 });
    const user = r.json?.user;
    if (!user) throw new Error('could not create ' + email + ': ' + r.status + ' ' + r.text.slice(0, 200));
    if (phone) await db.user.update({ where: { id: user.id }, data: { phone } });
    return user;
  };
  const grant = (userId, permissions) => ctx.owner.post('/api/v1/permissions', { userId, permissions });
  const login = async (email) => (await staffLogin(email)).client;

  // This suite's own branches, service, product and barbers
  const shopA = (await ctx.owner.post('/api/v1/shops', { name: 'Access Colombo', address: '1 Access Road, Colombo', phone: '0112000001' })).json?.shop;
  const shopB = (await ctx.owner.post('/api/v1/shops', { name: 'Access Kandy', address: '2 Access Road, Kandy', phone: '0812000002' })).json?.shop;
  const svc = (await ctx.owner.post('/api/v1/services', { name: 'Access Haircut', price: 1500, duration: 30, description: 'Access suite service', shopId: null })).json?.service;
  const pomade = (await ctx.owner.post('/api/v1/products', { name: 'Access Pomade', price: 2500, stock: 10, brand: 'QA', category: 'Care', sku: 'ACC-POM' })).json?.product;
  if (!shopA?.id || !shopB?.id || !svc?.id || !pomade?.id) throw new Error('access suite setup failed');
  const bx0 = await mkStaff('BARBER', 'Access Barber 1', 'accessbarber1@qa.test', shopA.id, null);
  const bx1 = await mkStaff('BARBER', 'Access Barber 2', 'accessbarber2@qa.test', shopA.id, null);
  const bx2 = await mkStaff('BARBER', 'Access Barber 3', 'accessbarber3@qa.test', shopA.id, null);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('A1. Access the owner hands out: defaults, explicit rows, and what each tick-box really allows');
  const mgr = await mkStaff('MANAGER', 'Access Mgr', 'accessmgr@qa.test', shopA.id, '771110010');
  let mc = await login('accessmgr@qa.test');

  let r = await ctx.owner.get('/api/v1/permissions?userId=' + mgr.id);
  const eff = Object.fromEntries((r.json?.permissions || []).map((p) => [p.pageKey, p]));
  R.check('the Permissions page shows what a fresh manager really has: the everyday pages, view-only', eff['/owner/bookings/manage']?.canView && !eff['/owner/bookings/manage'].canAdd && eff['/owner/calendar']?.canView && eff['/owner/hr/attendance']?.canView && !eff['/owner/payments']?.canView, JSON.stringify(eff['/owner/bookings/manage']));
  R.check('the list of pages the owner can hand out matches the pages that exist (12, no Expenses)', (r.json?.permissions || []).length === 12 && !eff['/owner/expenses']);

  r = await mc.get('/api/v1/bookings');
  R.check('a manager with no tick-boxes can look at bookings (default view)', r.status === 200, r.status);
  r = await mc.post('/api/v1/bookings', { serviceIds: [svc.id], date: nthWeekday(60) + 'T10:00:00', shopId: shopA.id, barberId: bx0.id, clientName: 'Nope Walkin', amount: 1500 });
  R.check('...but cannot ADD a booking until the owner ticks Add', r.status === 403, r.status);
  r = await mc.put('/api/v1/bookings', { id: '00000000-0000-0000-0000-000000000000', status: 'CONFIRMED' });
  R.check('...cannot EDIT a booking (confirm / complete) until Edit is ticked', r.status === 403, r.status);
  r = await mc.del('/api/v1/bookings?id=00000000-0000-0000-0000-000000000000');
  R.check('...cannot DELETE a booking until Delete is ticked', r.status === 403, r.status);
  r = await mc.get('/owner/bookings/manage');
  R.check('...the Bookings page opens', r.status === 200, r.status);
  r = await mc.get('/owner/payments');
  R.check('...a page they were not given redirects them away', redirected(r) && /\/owner\/bookings\/manage/.test(locationOf(r)), r.status + ' ' + locationOf(r));
  r = await mc.get('/owner');
  R.check('...the Intelligence dashboard is not theirs either', redirected(r), r.status);

  // The old prefix bug: "Intelligence" is "/owner", which used to match every /owner/* page
  await grant(mgr.id, [row('/owner')]);
  mc = await login('accessmgr@qa.test');
  r = await mc.get('/owner');
  R.check('granting only Intelligence opens the dashboard...', r.status === 200, r.status);
  for (const p of ['/owner/payments', '/owner/orders', '/owner/hr/payroll', '/owner/reports', '/owner/expenses', '/owner/staff']) {
    r = await mc.get(p);
    R.check(`...and does NOT open ${p}`, redirected(r), r.status);
  }

  // Explicit "no" beats the role default
  await grant(mgr.id, [row('/owner/bookings/manage', false), row('/owner/calendar', false), row('/owner/hr/attendance', false)]);
  mc = await login('accessmgr@qa.test');
  r = await mc.get('/api/v1/bookings');
  R.check('un-ticking View on a default page really removes it (API)', r.status === 403, r.status);
  r = await mc.get('/owner/bookings/manage');
  R.check('...and (page)', redirected(r) && /no-access/.test(locationOf(r)), r.status + ' ' + locationOf(r));
  const noAccessPage = await mc.get('/no-access');
  R.check('...a manager left with no pages lands on a friendly "No pages yet" page', noAccessPage.status === 200 && /No pages yet/.test(noAccessPage.text));

  // Owner-only pages stay owner-only even when the person can manage staff
  await grant(mgr.id, [row('/owner/staff', true, true, true, true)]);
  mc = await login('accessmgr@qa.test');
  r = await mc.get(`/owner/staff/${bx0.id}/permissions`);
  R.check('the Permissions page itself is never available to a manager, even with Staff access', redirected(r), r.status);
  r = await mc.post('/api/v1/permissions', { userId: bx0.id, permissions: [row('/owner')] });
  R.check('...and neither is saving permissions', r.status === 403, r.status);

  // API validation of what can be saved
  r = await ctx.owner.post('/api/v1/permissions', { userId: mgr.id, permissions: [row('/owner/expenses', true, true, true, true), row('/owner/orders'), { nope: 1 }] });
  const savedKeys = (await db.staffPermission.findMany({ where: { userId: mgr.id } })).map((p) => p.pageKey);
  R.check('unknown pages (Expenses, junk) are dropped, real ones saved', r.status === 200 && savedKeys.length === 1 && savedKeys[0] === '/owner/orders' && r.json?.ignored?.length === 2, JSON.stringify({ savedKeys, r: r.json }));
  const cust = await db.user.findFirst({ where: { role: 'CUSTOMER' } });
  r = await ctx.owner.post('/api/v1/permissions', { userId: cust.id, permissions: [row('/owner')] });
  R.check('permissions cannot be attached to a customer', r.status === 404, r.status);
  r = await ctx.owner.post('/api/v1/permissions', { userId: mgr.id, permissions: [{ pageKey: '/owner/orders', canView: false, canAdd: true, canEdit: true, canDelete: true }] });
  const norm = await db.staffPermission.findFirst({ where: { userId: mgr.id, pageKey: '/owner/orders' } });
  R.check('Add/Edit/Delete without View are stored as "no"', norm && !norm.canAdd && !norm.canEdit && !norm.canDelete);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('A2. Changes take effect immediately, without signing in again');
  const live = await mkStaff('MANAGER', 'Live Mgr', 'livemgr@qa.test', shopA.id, '771110011');
  await grant(live.id, [row('/owner/payments')]);
  let lc = await login('livemgr@qa.test');
  r = await A('getAllPayments', [{}], lc);
  R.check('a manager with Payments can read payments', r.value?.success === true, JSON.stringify(r.value).slice(0, 120));
  await grant(live.id, [row('/owner/orders')]); // Payments taken away, Orders given
  r = await A('getAllPayments', [{}], lc);
  R.check('the owner takes Payments away: the SAME session is refused on the next request', r.value?.success !== true, JSON.stringify(r.value).slice(0, 120));
  const stale = await lc.get('/owner/orders');
  R.check('...but the page is still blocked by the stale token until the session refreshes', redirected(stale), stale.status);
  r = await lc.get('/api/v1/notifications');
  R.check('the next notification poll tells the browser its access changed and re-issues the session', r.status === 200 && r.json?.sessionRefreshed === true, JSON.stringify(r.json?.sessionRefreshed));
  const permsCookie = decodeURIComponent(lc.jar.get('user_permissions') || '');
  R.check('...the readable permissions cookie now matches', /\/owner\/orders/.test(permsCookie) && !/\/owner\/payments/.test(permsCookie), permsCookie);
  r = await lc.get('/owner/orders');
  R.check('...and the Orders page opens without signing in again', r.status === 200, r.status);
  r = await A('getAllOrders', [{}], lc);
  R.check('...and Orders data loads', r.value?.success === true, JSON.stringify(r.value).slice(0, 100));
  r = await lc.get('/api/v1/notifications');
  R.check('...it only refreshes once (not on every poll)', r.json?.sessionRefreshed === false);
  const gone = await mkStaff('BARBER', 'Gone Barber', 'gonebarber@qa.test', shopA.id, null);
  const gc = await login('gonebarber@qa.test');
  await db.user.delete({ where: { id: gone.id } });
  r = await gc.get('/api/v1/notifications');
  R.check('a deleted staff account is signed out at the next poll instead of lingering for an hour', r.status === 401, r.status);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('A3. Delegated staff management stays inside its fence');
  const deputy = await mkStaff('BARBER', 'Deputy Barber', 'deputy@qa.test', shopA.id, null);
  await grant(deputy.id, [row('/owner/staff', true, true, true, true), row('/owner/hr/attendance')]);
  const dc = await login('deputy@qa.test');
  r = await dc.get('/api/v1/staff');
  R.check('with the Staff page they see contact details', r.status === 200 && r.json?.staff?.some((s) => s.email), r.text.slice(0, 120));
  r = await dc.post('/api/v1/staff', { role: 'BARBER', name: 'Helper Barber', email: 'helper@qa.test', password: PASSWORD });
  R.check('...can add a barber', r.status === 200 && r.json?.user?.role === 'BARBER', r.text.slice(0, 160));
  r = await dc.post('/api/v1/staff', { role: 'MANAGER', name: 'Sneaky Mgr', email: 'sneaky.mgr@qa.test', password: PASSWORD });
  R.check('...cannot add a manager', r.status === 403, r.status);
  r = await dc.put('/api/v1/staff', { id: mgr.id, name: 'Renamed By Deputy' });
  R.check('...cannot edit a manager', r.status === 403, r.status);
  r = await dc.put('/api/v1/staff', { id: bx1.id, role: 'MANAGER' });
  R.check('...cannot promote a barber to manager', r.status === 403, r.status);
  const ownerUser = await db.user.findUnique({ where: { email: 'owner@qa.test' } });
  r = await dc.del('/api/v1/staff?id=' + ownerUser.id);
  R.check('...cannot delete the owner', r.status === 403, r.status);
  r = await dc.del('/api/v1/staff?id=' + deputy.id);
  R.check('...cannot delete themselves', r.status === 403, r.status);
  r = await dc.put('/api/v1/staff', { id: bx1.id, baseSalary: 1 });
  R.check('...pay settings need the Payroll page or Staff edit: allowed here because they have Staff edit', r.status === 200, r.status);
  await grant(deputy.id, [row('/owner/hr/attendance')]);
  const dc2 = await login('deputy@qa.test');
  r = await dc2.get('/api/v1/staff');
  const first = r.json?.staff?.[0] || {};
  R.check('with only Attendance the staff list is just names and branches (no email, phone or pay)', r.status === 200 && r.json.staff.length > 0 && !('email' in first) && !('phone' in first) && !('baseSalary' in first), JSON.stringify(first));
  r = await dc2.post('/api/v1/staff', { role: 'BARBER', name: 'Nope', email: 'nope@qa.test', password: PASSWORD });
  R.check('...and cannot add anybody', r.status === 403, r.status);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('B. Manual attendance entries');
  const b1 = bx0;
  const day = new Date(); day.setDate(day.getDate() - 1); day.setHours(12, 0, 0, 0);
  const at = (hh, mm) => { const d = new Date(day); d.setHours(hh, mm, 0, 0); return d.toISOString(); };
  const t0 = Date.now() - 1000;
  r = await ctx.owner.post('/api/v1/attendance', { userId: b1.id, date: day.toISOString(), checkIn: at(9, 0), checkOut: at(18, 0), note: 'Fingerprint device was down' });
  const rec = r.json?.record;
  R.check('the owner records a full day (in 9:00 AM, out 6:00 PM)', r.status === 201 && rec?.method === 'MANUAL' && rec?.recordedBy === ownerUser.id && rec?.note === 'Fingerprint device was down', r.text.slice(0, 200));
  R.check('...the exact times are kept (no time-zone drift)', rec && new Date(rec.checkIn).getTime() === new Date(at(9, 0)).getTime() && new Date(rec.checkOut).getTime() === new Date(at(18, 0)).getTime());
  r = await ctx.owner.post('/api/v1/attendance', { userId: b1.id, date: day.toISOString(), checkIn: at(9, 0), checkOut: at(8, 0) });
  R.check('clock-out before clock-in is refused with a clear message', r.status === 400 || r.status === 409, r.status + ' ' + r.text.slice(0, 100));
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  r = await ctx.owner.post('/api/v1/attendance', { userId: bx1.id, date: tomorrow.toISOString(), checkIn: tomorrow.toISOString() });
  R.check('an entry in the future is refused', r.status === 400 && /future/i.test(r.text), r.status + ' ' + r.text.slice(0, 100));
  r = await ctx.owner.post('/api/v1/attendance', { userId: '00000000-0000-0000-0000-000000000000', date: day.toISOString(), checkIn: at(9, 0) });
  R.check('an unknown staff member is refused', r.status === 404, r.status);
  r = await ctx.owner.post('/api/v1/attendance', { userId: bx1.id, date: 'not-a-date', checkIn: 'x' });
  R.check('junk dates are refused, not stored', r.status === 400, r.status);
  r = await ctx.owner.post('/api/v1/attendance', { userId: bx1.id, date: day.toISOString() });
  R.check('a new entry needs a clock-in time', r.status === 400, r.status);
  const told = await waitFor(async () => db.notification.findFirst({ where: { userId: b1.id, title: 'Attendance Updated', createdAt: { gte: new Date(t0) } } }));
  R.check('the employee is told their attendance was recorded (bell), with the times', !!told && /9:00 AM/.test(told.desc) && /6:00 PM/.test(told.desc), told?.desc);
  r = await ctx.owner.put('/api/v1/attendance', { id: rec.id, checkOut: at(19, 0), note: 'Stayed late' });
  R.check('editing a record works and keeps who changed it', r.status === 200 && new Date(r.json.record.checkOut).getTime() === new Date(at(19, 0)).getTime());
  r = await ctx.owner.put('/api/v1/attendance', { id: rec.id, checkOut: at(8, 0) });
  R.check('...an edit that puts clock-out before clock-in is refused', r.status === 400, r.status);

  await grant(mgr.id, [row('/owner/hr/attendance', true, true, false, false)]);
  mc = await login('accessmgr@qa.test');
  r = await mc.get('/api/v1/attendance?staff=1');
  R.check('a manager with Attendance can load the list of people for the entry form (names only)', r.status === 200 && r.json?.staff?.length >= 3 && !('email' in r.json.staff[0]), r.text.slice(0, 120));
  r = await mc.post('/api/v1/attendance', { userId: bx2.id, date: day.toISOString(), checkIn: at(10, 0) });
  R.check('...and add an entry (Add ticked)', r.status === 201, r.status + ' ' + r.text.slice(0, 100));
  r = await mc.put('/api/v1/attendance', { id: rec.id, checkOut: at(20, 0) });
  R.check('...but not edit one (Edit not ticked)', r.status === 403, r.status);
  r = await mc.del('/api/v1/attendance?id=' + rec.id);
  R.check('...or delete one', r.status === 403, r.status);
  r = await ctx.owner.del('/api/v1/attendance?id=' + rec.id);
  R.check('the owner can delete it', r.status === 200 && !(await db.attendance.findUnique({ where: { id: rec.id } })));
  const removed = await waitFor(async () => db.notification.findFirst({ where: { userId: b1.id, title: 'Attendance Updated', desc: { contains: 'removed' }, createdAt: { gte: new Date(t0) } } }));
  R.check('...and the employee is told it was removed', !!removed);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('C. Who is told about what: bell, SMS and email by role, permission and branch');
  const owner = ownerUser;
  await db.user.update({ where: { id: owner.id }, data: { phone: '771110001' } });
  const mgrA = await mkStaff('MANAGER', 'Notif Mgr A', 'notifa@qa.test', shopA.id, '771110002');
  const mgrB = await mkStaff('MANAGER', 'Notif Mgr B', 'notifb@qa.test', shopB.id, '771110003');
  const mgrN = await mkStaff('MANAGER', 'Notif Mgr None', 'notifn@qa.test', shopA.id, '771110004');
  const barber1 = await mkStaff('BARBER', 'Notif Barber 1', 'notifbarber1@qa.test', shopA.id, '771110005');
  const barber2 = await mkStaff('BARBER', 'Notif Barber 2', 'notifbarber2@qa.test', shopA.id, '771110006');
  await grant(mgrA.id, [row('/owner/bookings/manage', true, true, true, true), row('/owner/products'), row('/owner/payments')]);
  await grant(mgrB.id, [row('/owner/bookings/manage'), row('/owner/products'), row('/owner/orders')]);
  await grant(mgrN.id, [row('/owner/bookings/manage', false), row('/owner/calendar', false)]);
  const mgrAc = await login('notifa@qa.test');
  const rowsFor = (where) => db.notification.findMany({ where, include: { user: { select: { email: true } } } });
  // (earlier suites left other managers/owners in the database: only this section's own accounts are compared)
  const who = (list) => list.map((n) => n.user.email.split('@')[0]).filter((e) => /^notif|^owner$/.test(e)).sort();
  const since = (t) => ({ createdAt: { gte: new Date(t) } });

  // 1. a booking created by the owner for barber 1 at branch A
  const date = nthWeekday(45);
  const t1 = Date.now();
  r = await ctx.owner.post('/api/v1/bookings', { serviceIds: [svc.id], date: date + 'T10:00:00', shopId: shopA.id, barberId: barber1.id, clientName: 'Alice Walkin', amount: 1500 });
  const booking = r.json?.booking;
  R.check('the owner creates a booking for barber 1 at branch A', r.status === 201 && booking?.id, r.text.slice(0, 200));
  let bells = await rowsFor({ refType: 'BOOKING', refId: booking.id });
  R.check('bell: the owner, the manager of THAT branch (with bookings access) and the assigned barber are told; nobody else', JSON.stringify(who(bells)) === JSON.stringify(['notifa', 'notifbarber1', 'owner']), JSON.stringify(who(bells)));
  R.check('...every bell row knows which booking it is about (so a click opens it)', bells.every((n) => n.refType === 'BOOKING' && n.refId === booking.id));
  R.check('...the barber sees it worded for them ("assigned to you")', /assigned to you/i.test(bells.find((n) => n.user.email.startsWith('notifbarber1'))?.desc || ''));
  const smsA = await waitFor(() => sms('0771110002').find((e) => e.t >= t1 && /New booking/i.test(e.message)));
  const smsB1 = await waitFor(() => sms('0771110005').find((e) => e.t >= t1 && /New booking/i.test(e.message)));
  R.check('SMS: the branch manager and the assigned barber are texted', !!smsA && !!smsB1);
  R.check('SMS: other branch manager, the manager without access and the other barber are NOT', !sms('0771110003').some((e) => e.t >= t1) && !sms('0771110004').some((e) => e.t >= t1) && !sms('0771110006').some((e) => e.t >= t1));
  R.check('SMS: the owner is not texted about what they did themselves', !sms('0771110001').some((e) => e.t >= t1) && !sms('770000001').some((e) => e.t >= t1));
  const mailB1 = await waitFor(() => emails('notifbarber1@qa.test').find((e) => e.t >= t1));
  R.check('email: the assigned barber gets an email with their booking', !!mailB1 && /Alice Walkin/.test(mailB1.html) && /Team update/.test(mailB1.html));
  R.check('...it does not show money (amount / payment rows) to the barber', mailB1 && !/LKR/.test(mailB1.html) && !/>Amount</.test(mailB1.html));
  R.check('...its button opens THEIR page for that booking', mailB1 && new RegExp('/barber\\?booking=' + booking.id).test(mailB1.html), mailB1?.html.match(/href="([^"]*)"/)?.[1]);
  R.check('email: managers get no email for bookings (bell + SMS only)', !emails('notifa@qa.test').some((e) => e.t >= t1));
  R.check('email: the owner is not emailed about their own action', !emails('owner@qa.test').some((e) => e.t >= t1 && /Alice Walkin/.test(e.html)));

  // 2. the manager cancels it: the owner is emailed, the barber is told, the manager (actor) is not texted
  const t2 = Date.now();
  r = await mgrAc.put('/api/v1/bookings', { id: booking.id, status: 'CANCELLED' });
  R.check('a manager with Delete/Cancel cancels the booking', r.status === 200, r.status + ' ' + r.text.slice(0, 120));
  const cancelMailOwner = await waitFor(() => emails('owner@qa.test').find((e) => e.t >= t2 && /cancelled/i.test(e.subject)));
  R.check('email: the owner is emailed the cancellation, with a button to that booking', !!cancelMailOwner && new RegExp('bookings/manage\\?booking=' + booking.id).test(cancelMailOwner.html), cancelMailOwner?.subject);
  const cancelMailBarber = await waitFor(() => emails('notifbarber1@qa.test').find((e) => e.t >= t2 && /cancelled/i.test(e.subject)));
  R.check('email + SMS: the barber learns it is off their schedule', !!cancelMailBarber && !!(await waitFor(() => sms('0771110005').find((e) => e.t >= t2 && /cancelled/i.test(e.message)))));
  bells = await rowsFor({ refType: 'BOOKING', refId: booking.id, title: 'Booking Cancelled', ...since(t2) });
  R.check('bell: owner, barber and the acting manager see the cancellation', JSON.stringify(who(bells)) === JSON.stringify(['notifa', 'notifbarber1', 'owner']), JSON.stringify(who(bells)));
  R.check('SMS: the manager who cancelled is not texted about their own action', !sms('0771110002').some((e) => e.t >= t2 && /cancelled/i.test(e.message)));

  // 3. stock + counter sale: managers are told only if they may see products / orders
  await db.product.update({ where: { id: pomade.id }, data: { stock: 10 } });
  const t3 = Date.now();
  r = await A('createManualBill', [{ invoiceNo: 'QA-NOTIF-1', clientName: 'Bob Counter', items: [{ name: 'Pomade', type: 'Product', price: 2500, productId: pomade.id }], amount: 2500, method: 'Cash' }], ctx.owner);
  R.check('a product is sold at the counter (stock 10 to 9)', r.value?.success === true, JSON.stringify(r.value));
  const stockBells = await waitFor(async () => { const l = await rowsFor({ refType: 'PRODUCT', refId: pomade.id, title: 'Low Stock', ...since(t3) }); return l.length ? l : null; });
  R.check('bell: low stock reaches the owner and every manager who may see Products; not the manager without access, not barbers', JSON.stringify(who(stockBells || [])) === JSON.stringify(['notifa', 'notifb', 'owner']), JSON.stringify(who(stockBells || [])));
  R.check('SMS: ...same people are texted', !!(await waitFor(() => sms('0771110002').find((e) => e.t >= t3 && /Low stock/i.test(e.message)))) && !!(await waitFor(() => sms('0771110003').find((e) => e.t >= t3 && /Low stock/i.test(e.message)))) && !sms('0771110004').some((e) => e.t >= t3 && /stock/i.test(e.message)) && !sms('0771110005').some((e) => e.t >= t3 && /stock/i.test(e.message)));
  const saleBells = await waitFor(async () => { const l = await rowsFor({ refType: 'ORDER', title: 'New Product Sale', ...since(t3) }); return l.length ? l : null; });
  R.check('bell: the counter sale reaches the owner and the manager with Orders (branch B one), not the others', JSON.stringify(who(saleBells || [])) === JSON.stringify(['notifb', 'owner']), JSON.stringify(who(saleBells || [])));
  R.check('...it points at the exact order', (saleBells || []).every((n) => n.refId && n.refId.length > 10));

  // 4. salary paid
  let payroll = await db.payroll.findFirst({ where: { userId: barber1.id } });
  if (!payroll) payroll = await db.payroll.create({ data: { userId: barber1.id, month: 3, year: 2020, baseSalary: 40000, bonus: 0, totalAmount: 40000, status: 'PENDING' } });
  const t4 = Date.now();
  r = await A('markPayrollPaid', [payroll.id], ctx.owner);
  R.check('the owner marks a salary as paid', r.value?.success === true, JSON.stringify(r.value));
  const paidBell = await waitFor(() => db.notification.findFirst({ where: { userId: barber1.id, title: 'Salary Paid' } }));
  R.check('bell: the employee is told, and it points at their earnings', !!paidBell && paidBell.refType === 'PAYROLL', paidBell?.desc);
  R.check('SMS: ...and texted the amount', !!(await waitFor(() => sms('0771110005').find((e) => e.t >= t4 && /salary.*paid/i.test(e.message)))));
  R.check('nobody else is told about one employee\'s salary', !(await db.notification.count({ where: { title: 'Salary Paid', refId: payroll.id, userId: { not: barber1.id } } })));

  // 5. access changed
  r = await grant(barber2.id, [row('/owner/payments'), row('/owner/orders')]);
  const accessBell = await waitFor(() => db.notification.findFirst({ where: { userId: barber2.id, title: 'Your Access Was Updated' } }));
  R.check('bell: a staff member is told when the owner changes their access, and what changed', !!accessBell && /Payments/.test(accessBell.desc) && /Orders/.test(accessBell.desc), accessBell?.desc);

  // 6. the API hands the record reference to the bell
  const b1c = await login('notifbarber1@qa.test');
  r = await b1c.get('/api/v1/notifications');
  const item = r.json?.notifications?.find((n) => n.refType === 'BOOKING');
  R.check('the bell API returns what each notification is about (refType + refId)', !!item && item.refId === booking.id, JSON.stringify(item));

  // 7. a barber only ever sees THEIR bookings
  r = await b1c.get('/api/v1/bookings');
  R.check('a barber still sees only their own bookings', r.status === 200 && r.json.bookings.every((b) => b.barberId === barber1.id) && r.json.bookings.some((b) => b.id === booking.id));
  await grant(barber2.id, [row('/owner/bookings/manage')]);
  const b2c = await login('notifbarber2@qa.test');
  r = await b2c.get('/api/v1/bookings');
  R.check('...unless the owner gives them the Bookings page: then they see everyone\'s', r.status === 200 && r.json.bookings.some((b) => b.barberId !== barber2.id));
  // ─────────────────────────────────────────────────────────────────────────
  R.sec('D. First-run password: locked until the person chooses their own, then changeable any time');
  const bcrypt = require(require('path').join(h.ROOT, 'node_modules', 'bcryptjs'));
  const NEW_PW = 'Brand-New-Pass#77';
  const fresh = await mkStaff('MANAGER', 'Fresh Mgr', 'freshmgr@qa.test', shopA.id, '771110020');
  await db.user.update({ where: { id: fresh.id }, data: { mustChangePassword: true } });
  const fc = new h.Client('fresh');
  r = await fc.post('/api/auth/staff-login', { email: 'freshmgr@qa.test', password: PASSWORD });
  R.check('signing in with the handed-over password works and says it must be changed', r.status === 200 && r.json?.mustChangePassword === true, r.text);
  r = await fc.get('/api/v1/bookings');
  R.check('until then every data API refuses, with a clear code', r.status === 403 && r.json?.code === 'PASSWORD_CHANGE_REQUIRED', r.status + ' ' + r.text.slice(0, 120));
  r = await fc.get('/api/v1/notifications');
  R.check('...including the notification poll', r.status === 403);
  r = await fc.get('/owner/bookings/manage');
  R.check('...and every dashboard page sends them to the change-password page', redirected(r) && /change-password/.test(locationOf(r)), r.status + ' ' + locationOf(r));
  r = await fc.get('/profile');
  R.check('...the customer area too', redirected(r) && /change-password/.test(locationOf(r)), r.status + ' ' + locationOf(r));
  r = await fc.get('/staff-login');
  R.check('...and the sign-in page (they are already signed in)', redirected(r) && /change-password/.test(locationOf(r)));
  r = await fc.get('/');
  R.check('the public website still opens normally', r.status === 200, r.status);
  r = await fc.get('/change-password');
  R.check('the change-password page opens', r.status === 200 && /Choose your own password|Change password/.test(r.text), r.status);
  r = await fc.get('/api/auth/change-password');
  R.check('it knows this is a forced change', r.status === 200 && r.json?.forced === true, r.text);

  r = await fc.post('/api/auth/change-password', { currentPassword: 'wrong-password', newPassword: NEW_PW });
  R.check('a wrong current password is refused', r.status === 400 && /current password/i.test(r.text), r.status + ' ' + r.text);
  r = await fc.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: 'short1' });
  R.check('a too-short new password is refused', r.status === 400, r.status + ' ' + r.text);
  r = await fc.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: PASSWORD });
  R.check('reusing the same password is refused', r.status === 400 && /different/i.test(r.text), r.text);
  r = await fc.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: 'my-freshmgr-secret-1' });
  R.check('a password containing their own email name is refused', r.status === 400, r.text);
  r = await fc.post('/api/auth/change-password', { currentPassword: { $ne: 1 }, newPassword: NEW_PW });
  R.check('junk (non-text) input is refused, not passed to the database', r.status === 400, r.status);

  const tPw = Date.now();
  r = await fc.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: NEW_PW });
  R.check('choosing a proper new password works', r.status === 200 && r.json?.success === true, r.text);
  R.check('...and sends them to the right starting page for their role', r.json?.landing === '/owner/bookings/manage', r.json?.landing);
  const after = await db.user.findUnique({ where: { id: fresh.id } });
  R.check('the lock is lifted and the new password is stored as a hash', after.mustChangePassword === false && (await bcrypt.compare(NEW_PW, after.password)) && !(await bcrypt.compare(PASSWORD, after.password)));
  r = await fc.get('/api/v1/bookings');
  R.check('the same browser works immediately (a fresh session was issued)', r.status === 200, r.status);
  r = await fc.get('/owner/bookings/manage');
  R.check('...and the dashboard opens', r.status === 200, r.status);
  const oldLogin = await new h.Client('old').post('/api/auth/staff-login', { email: 'freshmgr@qa.test', password: PASSWORD });
  const newLogin = await new h.Client('new').post('/api/auth/staff-login', { email: 'freshmgr@qa.test', password: NEW_PW });
  R.check('the old password stops working; the new one signs in with no lock', oldLogin.status === 401 && newLogin.status === 200 && newLogin.json?.mustChangePassword === false);
  const mail = await waitFor(() => emails('freshmgr@qa.test').find((e) => e.t >= tPw && /password was changed/i.test(e.subject)));
  R.check('a "your password was changed" email is sent as a security notice', !!mail && /If you did not/i.test(mail.html), mail?.subject);
  R.check('...but no pop-up in the app (they just did it themselves)', (await db.notification.count({ where: { userId: fresh.id, title: 'Password Changed' } })) === 0);

  // anyone can change their own password later, voluntarily
  const vol = await staffLogin('accessbarber1@qa.test');
  r = await vol.client.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: 'Another-Good-Pass#5' });
  R.check('any signed-in staff member can change their password voluntarily', r.status === 200 && r.json?.landing === '/barber', r.status + ' ' + r.text);
  r = await new h.Client('anon').post('/api/auth/change-password', { currentPassword: 'x', newPassword: 'y'.repeat(12) });
  R.check('...but nobody who is not signed in can', r.status === 401);
  r = await new h.Client('anon2').get('/change-password');
  R.check('...the page redirects to sign-in', redirected(r) && /staff-login/.test(locationOf(r)), r.status + ' ' + locationOf(r));

  // a customer can change theirs too (they land on their profile)
  const custEmail = 'pwcustomer@qa.test';
  await db.user.create({ data: { email: custEmail, name: 'Pw Customer', role: 'CUSTOMER', password: bcrypt.hashSync(PASSWORD, 10) } });
  const cc = new h.Client('pwcust');
  await cc.post('/api/auth/login', { email: custEmail, password: PASSWORD });
  r = await cc.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: 'Customer-New-Pass#9' });
  R.check('a customer can change their password and lands on their profile', r.status === 200 && r.json?.landing === '/profile', r.status + ' ' + r.text);

  // the owner flagging someone who is already signed in locks them at the next poll
  const live2 = await staffLogin('notifbarber1@qa.test');
  r = await live2.client.get('/api/v1/bookings');
  R.check('(a barber who is already signed in works normally)', r.status === 200);
  await db.user.update({ where: { email: 'notifbarber1@qa.test' }, data: { mustChangePassword: true } });
  r = await live2.client.get('/api/v1/notifications');
  R.check('a lock set on someone already signed in reaches their open session at the next poll', r.status === 200 && r.json?.sessionRefreshed === true, r.status + ' ' + r.text.slice(0, 80));
  r = await live2.client.get('/api/v1/bookings');
  R.check('...and then they are locked like anyone else', r.status === 403 && r.json?.code === 'PASSWORD_CHANGE_REQUIRED', r.status);

  // guessing the current password from a signed-in session is limited
  const lock = await mkStaff('BARBER', 'Lock Barber', 'lockbarber@qa.test', shopA.id, null);
  await db.user.update({ where: { id: lock.id }, data: { mustChangePassword: true } });
  const lc2 = new h.Client('lockguess');
  await lc2.post('/api/auth/staff-login', { email: 'lockbarber@qa.test', password: PASSWORD });
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await lc2.post('/api/auth/change-password', { currentPassword: 'guess-' + i, newPassword: NEW_PW })).status);
  r = await lc2.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: NEW_PW });
  R.check('five wrong guesses at the current password lock the form for a while (even the right one is then refused)', codes.every((c) => c === 400) && r.status === 429, codes.join(',') + ' then ' + r.status);

}

module.exports = { run };
