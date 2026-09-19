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
    const r = await ctx.owner.post('/api/v1/staff', { role, name, email, shopId, password: PASSWORD, requirePasswordChange: false, salaryType: 'Commission', baseSalary: 40000, commissionRate: 10 });
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
  r = await dc.post('/api/v1/staff', { role: 'BARBER', name: 'Helper Barber', email: 'helper@qa.test', password: PASSWORD, requirePasswordChange: false });
  R.check('...can add a barber', r.status === 200 && r.json?.user?.role === 'BARBER', r.text.slice(0, 160));
  r = await dc.post('/api/v1/staff', { role: 'MANAGER', name: 'Sneaky Mgr', email: 'sneaky.mgr@qa.test', password: PASSWORD, requirePasswordChange: false });
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
  r = await dc2.post('/api/v1/staff', { role: 'BARBER', name: 'Nope', email: 'nope@qa.test', password: PASSWORD, requirePasswordChange: false });
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
  r = await fc.post('/api/auth/change-password', { currentPassword: PASSWORD, newPassword: 'freshmgr@qa.test' });
  R.check('a password that is just their own email address is refused', r.status === 400 && /email address/i.test(r.text), r.text);
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

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('E. A manual (walk-in) bill texts a thank-you with the receipt to the number on the bill');
  const bill = (extra) => A('createManualBill', [{ invoiceNo: 'QA-BILL', items: [{ name: 'Access Haircut', type: 'Service', price: 1500 }, { name: 'Access Beard Trim', type: 'Service', price: 1500 }], amount: 3000, method: 'Cash', ...extra }], ctx.owner);
  const smsSince = (to, t) => sms(to).filter((e) => e.t >= t);

  let tBill = Date.now();
  r = await bill({ clientName: 'Receipt Rita Perera', clientPhone: '0771110030' });
  R.check('the bill is saved and the screen is told a receipt SMS was sent', r.value?.success === true && r.value?.receiptSms === 'sent', JSON.stringify(r.value));
  const ritaPay = await db.payment.findFirst({ where: { clientName: 'Receipt Rita Perera' } });
  const receipt = await waitFor(() => smsSince('0771110030', tBill).find((e) => /Thank you/i.test(e.message)));
  R.check('the customer gets a thank-you SMS at the number typed on the bill', !!receipt, JSON.stringify(sms('0771110030').map((e) => e.message)));
  R.check('...it greets them by first name, with the amount and how they paid', receipt && /Thank you, Receipt!/.test(receipt.message) && /LKR 3,000 received \(Cash\)/.test(receipt.message), receipt?.message);
  R.check('...it carries the SAME invoice number the Payments page shows for this bill', receipt && ritaPay && receipt.message.includes('INV-' + ritaPay.id.slice(0, 6).toUpperCase()), receipt?.message);
  R.check('...and names what they bought, in one short SMS', receipt && /Access Haircut, Access Beard Trim/.test(receipt.message) && receipt.message.length <= 160, receipt && receipt.message.length + ' chars');
  R.check('...sent from the salon\'s sender ID', receipt?.sender === 'Mr Polaa');

  tBill = Date.now();
  r = await bill({ clientName: 'Formatted Fiona', clientPhone: '+94 77 111 0031' });
  R.check('a number typed with +94 and spaces works too (same person, same result)', r.value?.receiptSms === 'sent' && !!(await waitFor(() => smsSince('0771110031', tBill).find((e) => /Thank you, Formatted/.test(e.message)))), JSON.stringify(r.value));

  tBill = Date.now();
  r = await bill({ clientName: 'No Number Nadun', clientPhone: '' });
  await h.sleep(1200);
  R.check('a bill with no number is still saved, and no SMS is sent', r.value?.success === true && r.value?.receiptSms === 'no-number' && !sms().some((e) => e.t >= tBill && /Thank you/i.test(e.message)), JSON.stringify(r.value));

  tBill = Date.now();
  r = await bill({ clientName: 'Bad Number Bala', clientPhone: '0112345678' });
  await h.sleep(1200);
  R.check('a landline / invalid number: the bill is saved, no SMS, and the cashier is told why', r.value?.success === true && r.value?.receiptSms === 'invalid-number' && !!(await db.payment.findFirst({ where: { clientName: 'Bad Number Bala' } })) && !sms().some((e) => e.t >= tBill && /Thank you/i.test(e.message)), JSON.stringify(r.value));

  const nobody = await ctx.cust[1].action('createManualBill', [{ invoiceNo: 'X', clientName: 'Hacker', clientPhone: '0771110032', items: [{ name: 'x', type: 'Service', price: 1 }], amount: 1, method: 'Cash' }]);
  await h.sleep(800);
  R.check('a customer cannot create a bill (and so cannot make the salon text anyone)', nobody.value?.success !== true && !sms('0771110032').length, JSON.stringify(nobody.value));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('F. A new manager or barber is welcomed by email (sign-in details) and SMS');
  const HANDOVER = 'Handover-Pass#42';
  const tWel = Date.now();
  r = await ctx.owner.post('/api/v1/staff', { role: 'BARBER', name: 'Wimal Silva', email: 'wimal.welcome@qa.test', phone: '0771110040', shopId: shopA.id, password: HANDOVER, requirePasswordChange: true });
  R.check('the owner adds a barber (with a mobile number and a password)', r.status === 200 && r.json?.user?.role === 'BARBER', r.text.slice(0, 160));
  R.check('...and the screen is told a welcome email and SMS went out', r.json?.welcome?.email === 'sent' && r.json?.welcome?.sms === 'sent', JSON.stringify(r.json?.welcome));
  const wMail = await waitFor(() => emails('wimal.welcome@qa.test').find((e) => e.t >= tWel));
  R.check('the barber gets a welcome email', !!wMail && /Welcome to MR POLAA/.test(wMail.subject), wMail?.subject);
  R.check('...that greets them by name, says their role and branch, and has the Welcome banner', wMail && /Welcome to the team, Wimal!/.test(wMail.html) && />Barber</.test(wMail.html) && /Access Colombo/.test(wMail.html) && /MR POLAA &mdash; Welcome/.test(wMail.html));
  R.check('...with everything needed to sign in: the address, their email and the password', wMail && /\/staff-login/.test(wMail.html) && /wimal\.welcome@qa\.test/.test(wMail.html) && wMail.html.includes(HANDOVER), '');
  R.check('...says the password is temporary and must be replaced at first sign-in', wMail && /Temporary password/.test(wMail.html) && /choose your own password/.test(wMail.html));
  const wSms = await waitFor(() => smsSince('0771110040', tWel).find((e) => /Welcome, Wimal!/.test(e.message)));
  R.check('the barber also gets a welcome SMS with where to sign in', !!wSms && /\/staff-login/.test(wSms.message) && wSms.sender === 'Mr Polaa', wSms?.message);
  R.check('...but the password is NEVER put in the SMS (only in the email), and it is short', wSms && !wSms.message.includes(HANDOVER) && wSms.message.length <= 200, wSms && wSms.message.length + ' chars');
  const wLogin = await new h.Client('wimal').post('/api/auth/staff-login', { email: 'wimal.welcome@qa.test', password: HANDOVER });
  R.check('the emailed details really work, and the first sign-in demands a new password', wLogin.status === 200 && wLogin.json?.mustChangePassword === true, wLogin.text);

  // password left blank: the system makes one, and the email is the only place the new person gets it
  const tGen = Date.now();
  r = await ctx.owner.post('/api/v1/staff', { role: 'MANAGER', name: 'Gayani Manager', email: 'gayani.welcome@qa.test', phone: '0771110041', shopId: shopA.id, requirePasswordChange: true });
  const generated = r.json?.generatedPassword;
  const gMail = await waitFor(() => emails('gayani.welcome@qa.test').find((e) => e.t >= tGen));
  R.check('a blank password is generated, and that generated password is in the welcome email', r.status === 200 && !!generated && generated.length >= 12 && !!gMail && gMail.html.includes(generated), r.text.slice(0, 120));
  R.check('...a manager\'s email says what a manager gets', gMail && /Manager/.test(gMail.html) && /pages the owner gives you access to/.test(gMail.html));
  const gLogin = await new h.Client('gayani').post('/api/auth/staff-login', { email: 'gayani.welcome@qa.test', password: generated });
  R.check('...and it signs in (locked to choosing a new one)', gLogin.status === 200 && gLogin.json?.mustChangePassword === true, gLogin.text);

  // no number / a landline: the email still goes; the SMS is skipped and the owner is told
  const tNo = Date.now();
  r = await ctx.owner.post('/api/v1/staff', { role: 'BARBER', name: 'Nimal NoPhone', email: 'nimal.welcome@qa.test', password: HANDOVER });
  await h.sleep(800);
  R.check('no phone number: welcome email only, and the screen says no SMS', r.json?.welcome?.email === 'sent' && r.json?.welcome?.sms === 'no-number' && !!emails('nimal.welcome@qa.test').find((e) => e.t >= tNo) && !sms().some((e) => e.t >= tNo && /Welcome, Nimal/.test(e.message)), JSON.stringify(r.json?.welcome));
  r = await ctx.owner.post('/api/v1/staff', { role: 'BARBER', name: 'Lasantha Landline', email: 'lasantha.welcome@qa.test', phone: '0112345678', password: HANDOVER });
  R.check('a landline: the barber is still added and emailed; the owner is told the SMS could not be sent', r.status === 200 && r.json?.welcome?.sms === 'invalid-number' && r.json?.welcome?.email === 'sent', JSON.stringify(r.json?.welcome));

  // the owner can un-tick "choose your own password"
  const tOpt = Date.now();
  r = await ctx.owner.post('/api/v1/staff', { role: 'BARBER', name: 'Ruwan Relaxed', email: 'ruwan.welcome@qa.test', phone: '0771110042', password: HANDOVER });
  const rMail = await waitFor(() => emails('ruwan.welcome@qa.test').find((e) => e.t >= tOpt));
  const rLogin = await new h.Client('ruwan').post('/api/auth/staff-login', { email: 'ruwan.welcome@qa.test', password: HANDOVER });
  R.check('by DEFAULT a new staff member is not locked: they go straight in, and the email says just "Password"', rLogin.json?.mustChangePassword === false && rMail && !/Temporary password/.test(rMail.html) && !/choose your own password/.test(rMail.html), rLogin.text);
  const ruwan = await db.user.findUnique({ where: { email: 'ruwan.welcome@qa.test' } });
  r = await ctx.owner.get('/api/v1/staff');
  R.check('the staff list tells the owner who still has to choose a password', r.json?.staff?.find((x) => x.id === ruwan.id)?.mustChangePassword === false && r.json?.staff?.find((x) => x.email === 'wimal.welcome@qa.test')?.mustChangePassword === true, '');
  r = await ctx.owner.put('/api/v1/staff', { id: ruwan.id, requirePasswordChange: true });
  const locked = await new h.Client('ruwan2').post('/api/auth/staff-login', { email: 'ruwan.welcome@qa.test', password: HANDOVER });
  R.check('the owner can switch "ask them to choose a new password" ON for someone later', r.status === 200 && locked.json?.mustChangePassword === true, r.text);
  r = await ctx.owner.put('/api/v1/staff', { id: ruwan.id, requirePasswordChange: false });
  const unlocked = await new h.Client('ruwan3').post('/api/auth/staff-login', { email: 'ruwan.welcome@qa.test', password: HANDOVER });
  R.check('...and OFF again (the prompt stops immediately, no matter how many times they signed in)', r.status === 200 && unlocked.json?.mustChangePassword === false, r.text);
  const sneakyLock = await new h.Client('deputy-nope').post('/api/v1/staff', { id: ruwan.id, requirePasswordChange: true });
  R.check('(only people allowed to edit staff can do that)', sneakyLock.status === 401 || sneakyLock.status === 403);

  // safety
  const tX = Date.now();
  r = await ctx.owner.post('/api/v1/staff', { role: 'BARBER', name: '<b>Bold</b> <script>alert(1)</script> Bob', email: 'bob.welcome@qa.test', password: HANDOVER });
  const xMail = await waitFor(() => emails('bob.welcome@qa.test').find((e) => e.t >= tX));
  R.check('a name with HTML in it is shown as text in the email, never as markup', !!xMail && !/<script>alert/.test(xMail.html) && !/<b>Bold/.test(xMail.html) && /&lt;b&gt;/.test(xMail.html));
  const before = emails('wimal.welcome@qa.test').length;
  const wimal = await db.user.findUnique({ where: { email: 'wimal.welcome@qa.test' } });
  r = await ctx.owner.put('/api/v1/staff', { id: wimal.id, name: 'Wimal S. Silva' });
  await h.sleep(600);
  R.check('editing a staff member does NOT send the welcome again', r.status === 200 && emails('wimal.welcome@qa.test').length === before);
  r = await new h.Client('anon3').post('/api/v1/staff', { role: 'BARBER', name: 'Spam', email: 'spam.welcome@qa.test', phone: '0771110043', password: HANDOVER });
  await h.sleep(600);
  R.check('nobody without permission can make the system email or text a stranger', r.status === 401 || r.status === 403, r.status);
  R.check('...and no message was sent to that stranger', !emails('spam.welcome@qa.test').length && !sms('0771110043').length);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('G. A manual bill can also be emailed (optional email on the bill)');
  const tEm = Date.now();
  r = await bill({ clientName: 'Email Emily', clientPhone: '0771110033', clientEmail: 'emily.bill@qa.test' });
  R.check('a bill with a phone AND an email: both receipts go out', r.value?.success === true && r.value?.receiptSms === 'sent' && r.value?.receiptEmail === 'sent', JSON.stringify(r.value));
  const emilyPay = await db.payment.findFirst({ where: { clientName: 'Email Emily' } });
  const em = await waitFor(() => emails('emily.bill@qa.test').find((e) => e.t >= tEm));
  R.check('the customer gets a receipt email', !!em && /Payment Receipt INV-/.test(em.subject), em?.subject);
  R.check('...with their name, what they bought, the amount and how they paid', em && /Email Emily/.test(em.html) && /Access Haircut, Access Beard Trim/.test(em.html) && /LKR 3,000/.test(em.html) && /Paid by Cash/.test(em.html));
  R.check('...the same invoice number as the SMS and the Payments page', em && emilyPay && em.subject.includes('INV-' + emilyPay.id.slice(0, 6).toUpperCase()) && em.html.includes('#' + emilyPay.id.slice(0, 8).toUpperCase()), em?.subject);
  R.check('...it says "Bill reference" (there is no booking) and is sent from the salon address', em && /Bill reference/.test(em.html) && !/Booking reference/.test(em.html) && /MR POLAA/.test(em.from || ''), em?.from);
  R.check('the SMS still goes to the phone too', !!(await waitFor(() => smsSince('0771110033', tEm).find((e) => /Thank you, Email/.test(e.message)))));

  const tProd = Date.now();
  r = await bill({ clientName: 'Product Pia', clientPhone: '', clientEmail: 'pia.bill@qa.test', items: [{ name: 'Access Pomade', type: 'Product', price: 2500, productId: pomade.id }], amount: 2500 });
  const pm = await waitFor(() => emails('pia.bill@qa.test').find((e) => e.t >= tProd));
  R.check('email only (no phone) works, and a products-only bill lists the product without an empty "Services" section', r.value?.receiptSms === 'no-number' && r.value?.receiptEmail === 'sent' && !!pm && /Access Pomade/.test(pm.html) && !/>Services</.test(pm.html), JSON.stringify(r.value));

  tBill = Date.now();
  r = await bill({ clientName: 'Bad Email Bob', clientPhone: '', clientEmail: 'not-an-email' });
  await h.sleep(1000);
  R.check('a badly typed email: the bill is still saved, nothing is sent, and the cashier is told', r.value?.success === true && r.value?.receiptEmail === 'invalid-email' && !!(await db.payment.findFirst({ where: { clientName: 'Bad Email Bob' } })) && !emails('not-an-email').length, JSON.stringify(r.value));
  r = await bill({ clientName: 'No Email Ned', clientPhone: '', clientEmail: '' });
  R.check('no email typed: nothing to send, bill saved', r.value?.success === true && r.value?.receiptEmail === 'no-email', JSON.stringify(r.value));
  r = await bill({ clientName: 'Placeholder Pat', clientPhone: '', clientEmail: 'walkin_123@salon.com' });
  R.check('the internal walk-in placeholder address is never emailed', r.value?.receiptEmail === 'invalid-email' && !emails('walkin_123@salon.com').length, JSON.stringify(r.value));
  const sneaky = await ctx.cust[1].action('createManualBill', [{ invoiceNo: 'X', clientName: 'Hacker', clientEmail: 'victim.bill@qa.test', items: [{ name: 'x', type: 'Service', price: 1 }], amount: 1, method: 'Cash' }]);
  await h.sleep(600);
  R.check('a customer cannot make the salon email a stranger', sneaky.value?.success !== true && !emails('victim.bill@qa.test').length);

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('H. Manual bookings: clear reasons, nothing left behind, and the commission follows the barber');
  const nextDow = (dow, weeksAhead = 2) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + 7 * weeksAhead);
    const z = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  };
  const monday = nextDow(1);
  const sunday = nextDow(0);
  const walkIns = () => db.user.count({ where: { email: { startsWith: 'walkin_' } } });
  await db.user.update({ where: { id: bx0.id }, data: { commissionRate: 15 } });
  const longSvc = (await ctx.owner.post('/api/v1/services', { name: 'Access Long Treatment', price: 9000, duration: 240, description: 'long', shopId: null })).json?.service;
  const manual = (extra) => ctx.owner.post('/api/v1/bookings', { serviceIds: [svc.id], shopId: shopA.id, barberId: bx0.id, clientName: 'Manual Mala', amount: 1500, ...extra });

  let w0 = await walkIns();
  r = await manual({ date: monday + 'T09:45:00' });
  const mb = r.json?.booking;
  R.check('a manual booking for an open day is created (the form sends a list of services)', r.status === 201 && mb?.id && mb.barberId === bx0.id, r.status + ' ' + r.text.slice(0, 160));
  R.check('...and creates the walk-in customer together with it', (await walkIns()) === w0 + 1);
  r = await ctx.owner.post('/api/v1/bookings', { serviceId: svc.id, shopId: shopA.id, barberId: bx0.id, clientName: 'Calendar Cara', amount: 1500, date: monday + 'T10:30:00' });
  R.check('the older single-service shape (calendar) still works', r.status === 201, r.status + ' ' + r.text.slice(0, 160));

  w0 = await walkIns();
  r = await manual({ date: sunday + 'T10:00:00' });
  R.check('Sunday is refused and the reason is in the message the screen shows', r.status === 400 && /closed on Sundays/.test(r.json?.message || ''), r.status + ' ' + r.text.slice(0, 160));
  r = await manual({ date: monday + 'T16:00:00', serviceIds: [longSvc.id], amount: 9000 });
  R.check('a visit that would run past closing time is refused, saying when the branch is open', r.status === 400 && /open 9:00 AM - 6:00 PM/.test(r.json?.message || ''), r.status + ' ' + r.text.slice(0, 200));
  r = await manual({ date: monday + 'T09:45:00', clientName: 'Clash Clara' });
  R.check('the specialist already booked at that time: refused with a plain message', r.status === 409 && /already booked/.test(r.json?.message || ''), r.status + ' ' + r.text.slice(0, 160));
  r = await manual({ date: monday + 'T11:15:00', serviceIds: [] });
  R.check('no service chosen: a clear message', r.status === 400 && /at least one service/i.test(r.json?.message || ''), r.status + ' ' + r.text.slice(0, 160));
  r = await manual({ date: monday + 'T11:15:00', serviceIds: ['00000000-0000-0000-0000-000000000000'] });
  R.check('an unknown service: a clear message', r.status === 400, r.status + ' ' + r.text.slice(0, 160));
  R.check('none of the refused bookings left a walk-in customer behind', (await walkIns()) === w0, 'walk-ins ' + (await walkIns()) + ' vs ' + w0);
  const shopClosedNow = (await ctx.owner.post('/api/v1/shops', { name: 'Access Renovating', address: '3 Access Road', status: 'Renovating' })).json?.shop;
  r = await manual({ date: monday + 'T11:15:00', shopId: shopClosedNow.id });
  R.check('a branch that is closed for renovation takes no bookings', r.status === 400 && /Renovating/.test(r.json?.message || '') && (await walkIns()) === w0, r.status + ' ' + r.text.slice(0, 160));

  // the commission follows the barber who did the work, at THEIR rate
  r = await ctx.owner.put('/api/v1/bookings', { id: mb.id, action: 'PAYMENT_COMPLETE', paymentMethod: 'Cash' });
  R.check('the manual booking is completed and paid at the salon', r.status === 200, r.status + ' ' + r.text.slice(0, 120));
  const comm = await db.commission.findFirst({ where: { bookingId: mb.id } });
  R.check('the commission goes to the barber the booking was made for, at that barber\'s rate (15% of 1,500 = 225)', comm && comm.barberId === bx0.id && comm.rateApplied === 15 && comm.billedAmount === 1500 && comm.amount === 225, JSON.stringify(comm));
  const bx0c = new h.Client('bx0b');
  await bx0c.post('/api/auth/staff-login', { email: 'accessbarber1@qa.test', password: 'Another-Good-Pass#5' });
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long' }) + ' ' + new Date().getFullYear();
  r = await A('getMyCommissions', [monthLabel], bx0c);
  R.check('that barber sees it in their own earnings', r.value?.success === true && r.value.data.breakdown.some((b) => b.amount === 225 && b.rateApplied === 15 && /Manual Mala/.test(b.customerName)), JSON.stringify(r.value).slice(0, 220));
  const otherC = await login('accessbarber2@qa.test');
  r = await A('getMyCommissions', [monthLabel], otherC);
  R.check('...and another barber does not', r.value?.success === true && !r.value.data.breakdown.some((b) => /Manual Mala/.test(b.customerName)));
  r = await ctx.owner.put('/api/v1/bookings', { id: mb.id, action: 'PAYMENT_COMPLETE', paymentMethod: 'Cash' });
  R.check('completing it twice does not pay the commission twice', (await db.commission.count({ where: { bookingId: mb.id } })) === 1, r.status);

  // a walk-in bill: commission on the SERVICES only, for the barber named on the bill
  r = await A('createManualBill', [{ invoiceNo: 'QA-COMM', clientName: 'Bill Basil', barberId: bx0.id, barberName: 'Access Barber 1', items: [{ name: 'Access Haircut', type: 'Service', price: 1500 }, { name: 'Access Pomade', type: 'Product', price: 2500, productId: pomade.id }], amount: 4000, method: 'Cash' }], ctx.owner);
  const billPay = await db.payment.findFirst({ where: { clientName: 'Bill Basil' } });
  const billComm = billPay && (await db.commission.findFirst({ where: { paymentId: billPay.id } }));
  R.check('a walk-in bill pays the named barber commission on the services only, not the product', r.value?.success === true && billComm && billComm.barberId === bx0.id && billComm.billedAmount === 1500 && billComm.amount === 225, JSON.stringify(billComm));

  // ─────────────────────────────────────────────────────────────────────────
  R.sec('I. The bill of a manual booking goes to the phone and email typed on it');
  const complete = (id, extra) => ctx.owner.put('/api/v1/bookings', { id, action: 'PAYMENT_COMPLETE', paymentMethod: 'Cash', ...extra });
  const bookFor = async (time, name, extra = {}) => (await manual({ barberId: bx1.id, date: monday + 'T' + time, clientName: name, ...extra })).json?.booking;

  let bA = await bookFor('11:15:00', 'Bill Walkin');
  let tI = Date.now();
  r = await complete(bA.id, { contactPhone: '0771110051', contactEmail: 'bill.walkin@qa.test' });
  R.check('completing a manual booking with a number and an email on the bill: both are sent', r.status === 200 && r.json?.receiptSms === 'sent' && r.json?.receiptEmail === 'sent', r.text.slice(0, 200));
  const billPayA = await db.payment.findFirst({ where: { bookingId: bA.id } });
  const iSms = await waitFor(() => smsSince('0771110051', tI).find((e) => /Thank you, Bill!/.test(e.message)));
  R.check('the customer gets a thank-you SMS at that number, with the amount and invoice number', !!iSms && /LKR 1,500 received \(CASH\)|LKR 1,500 received \(Cash\)/.test(iSms.message) && iSms.message.includes('INV-' + billPayA.id.slice(0, 6).toUpperCase()), iSms?.message);
  const iMail = await waitFor(() => emails('bill.walkin@qa.test').find((e) => e.t >= tI));
  R.check('...and the bill by email, with what they had done', !!iMail && /Payment Receipt INV-/.test(iMail.subject) && /Access Haircut/.test(iMail.html) && /LKR 1,500/.test(iMail.html), iMail?.subject);
  R.check('...the number is remembered on the booking for later messages', (await db.booking.findUnique({ where: { id: bA.id } })).contactPhone === '771110051');
  const nBefore = h.netLog().length;
  r = await complete(bA.id, { contactPhone: '0771110051', contactEmail: 'bill.walkin@qa.test' });
  await h.sleep(800);
  R.check('completing it again does not send the bill twice', r.json?.receiptSms === null && h.netLog().length === nBefore, r.text.slice(0, 160));

  let bB = await bookFor('13:45:00', 'Silent Walkin');
  tI = Date.now();
  r = await complete(bB.id, {});
  await h.sleep(800);
  R.check('no number and no email typed (a walk-in has none): the payment is recorded, nothing is sent, the screen is told', r.status === 200 && r.json?.receiptSms === 'no-number' && r.json?.receiptEmail === 'no-email' && !sms().some((e) => e.t >= tI && /Thank you, Silent/.test(e.message)), r.text.slice(0, 160));

  let bC = await bookFor('14:30:00', 'Typo Walkin');
  tI = Date.now();
  r = await complete(bC.id, { contactPhone: '12345', contactEmail: 'not-an-email' });
  await h.sleep(800);
  R.check('a wrong number / email is still a recorded payment, but nothing is sent and the screen says why', r.status === 200 && r.json?.receiptSms === 'invalid-number' && r.json?.receiptEmail === 'invalid-email' && (await db.payment.findFirst({ where: { bookingId: bC.id } })).status === 'COMPLETED' && !emails('not-an-email').length, r.text.slice(0, 160));

  // a customer who HAS a phone and email on file: they get the bill without anything being typed; a typed number wins
  const onFile = await db.user.create({ data: { email: 'onfile.customer@qa.test', name: 'Onfile Olivia', phone: '771110052', role: 'CUSTOMER', password: bcrypt.hashSync(PASSWORD, 10) } });
  let bD = await bookFor('16:00:00', 'ignored', { clientName: undefined, customerId: onFile.id });
  tI = Date.now();
  r = await complete(bD.id, {});
  R.check('a customer with a number and email on file gets the bill at those with nothing typed', r.json?.receiptSms === 'sent' && r.json?.receiptEmail === 'sent' && !!(await waitFor(() => smsSince('0771110052', tI).find((e) => /Thank you, Onfile/.test(e.message)))) && !!(await waitFor(() => emails('onfile.customer@qa.test').find((e) => e.t >= tI))), r.text.slice(0, 160));
  const tuesday = nextDow(2);
  const bE = (await manual({ barberId: bx1.id, date: tuesday + 'T09:00:00', customerId: onFile.id, clientName: undefined })).json?.booking;
  tI = Date.now();
  r = await complete(bE.id, { contactPhone: '0771110053' });
  R.check('a number typed on the bill wins over the one on file', r.json?.receiptSms === 'sent' && !!(await waitFor(() => smsSince('0771110053', tI).find((e) => /Thank you, Onfile/.test(e.message)))) && !smsSince('0771110052', tI).some((e) => /Thank you/.test(e.message)), r.text.slice(0, 160));
  const anon4 = await new h.Client('anon4').put('/api/v1/bookings', { id: bE.id, action: 'PAYMENT_COMPLETE', contactPhone: '0771110054' });
  await h.sleep(500);
  R.check('nobody without permission can make the system text a number through a bill', (anon4.status === 401 || anon4.status === 403) && !sms('0771110054').length);

}

module.exports = { run };
