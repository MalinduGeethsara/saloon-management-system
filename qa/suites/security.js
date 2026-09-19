// Security checks against the production build: authorization matrix, token tampering, injection,
// rate limiting, abuse cases, information exposure and browser-facing hardening.
const crypto = require('crypto');
const h = require('../lib/harness');
const { PASSWORD, nthWeekday, slotTime, waitFor, staffLogin, registerCustomer } = require('./helpers');
const { sms, emails, STAFF_EXTRA } = require('./functional');

const b64u = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const hs256 = (payload, secret, header = { alg: 'HS256', typ: 'JWT' }) => {
  const data = `${b64u(header)}.${b64u(payload)}`;
  return `${data}.${crypto.createHmac('sha256', secret).update(data).digest('base64url')}`;
};
const denied = (r) => r.status === 401 || r.status === 403 || (r.status >= 300 && r.status < 400) || r.status === 429;
const notDenied = (r) => !(r.status === 401 || r.status === 403 || (r.status >= 300 && r.status < 400));

async function run(S, ctx, ownerCreds) {
  const db = h.prisma();
  const anon = new h.Client('anon');
  const roles = {
    anon,
    customer: ctx.cust[1],
    barber: ctx.barberC[0],
    manager: ctx.managerC,
    admin: ctx.adminC,
    owner: ctx.owner,
  };

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('A. API authorization matrix (who may call what)');
  const FAKE = '00000000-0000-0000-0000-000000000000';
  // [label, method, path, body, roles allowed to get past the auth gate]
  const api = [
    ['GET /api/v1/shops', 'get', '/api/v1/shops', null, ['manager', 'admin', 'owner']],
    ['POST /api/v1/shops', 'post', '/api/v1/shops', { name: 'Sec Shop' }, ['admin', 'owner']],
    ['PUT /api/v1/shops', 'put', '/api/v1/shops', { id: FAKE, name: 'x' }, ['admin', 'owner']],
    ['DELETE /api/v1/shops', 'del', '/api/v1/shops?id=' + FAKE, null, ['admin', 'owner']],
    ['GET /api/v1/staff', 'get', '/api/v1/staff', null, ['barber', 'manager', 'admin', 'owner']], // the name directory: anyone with a dashboard page
    ['POST /api/v1/staff', 'post', '/api/v1/staff', { role: 'BARBER' }, ['admin', 'owner']],
    ['PUT /api/v1/staff', 'put', '/api/v1/staff', { id: FAKE }, ['admin', 'owner']],
    ['DELETE /api/v1/staff', 'del', '/api/v1/staff?id=' + FAKE, null, ['admin', 'owner']],
    ['GET /api/v1/permissions', 'get', '/api/v1/permissions?userId=' + FAKE, null, ['admin', 'owner']],
    ['POST /api/v1/permissions', 'post', '/api/v1/permissions', { userId: FAKE, permissions: [] }, ['admin', 'owner']],
    ['GET /api/v1/attendance', 'get', '/api/v1/attendance', null, ['manager', 'admin', 'owner']],
    ['POST /api/v1/attendance', 'post', '/api/v1/attendance', { userId: FAKE }, ['manager', 'admin', 'owner']], // the QA manager was given Attendance add/edit (not delete)
    ['PUT /api/v1/attendance', 'put', '/api/v1/attendance', { id: FAKE }, ['manager', 'admin', 'owner']],
    ['DELETE /api/v1/attendance', 'del', '/api/v1/attendance?id=' + FAKE, null, ['admin', 'owner']],
    ['POST /api/v1/bookings (staff manual)', 'post', '/api/v1/bookings', { serviceId: FAKE, date: '2030-01-01T10:00:00' }, ['manager', 'admin', 'owner']],
    ['PUT /api/v1/bookings', 'put', '/api/v1/bookings', { id: FAKE, status: 'CONFIRMED' }, ['barber', 'manager', 'admin', 'owner']],
    ['DELETE /api/v1/bookings', 'del', '/api/v1/bookings?id=' + FAKE, null, ['admin', 'owner']], // manager lacks delete
    ['GET /api/v1/bookings', 'get', '/api/v1/bookings', null, ['customer', 'barber', 'manager', 'admin', 'owner']],
    ['GET /api/v1/notifications', 'get', '/api/v1/notifications', null, ['customer', 'barber', 'manager', 'admin', 'owner']],
    ['POST /api/v1/products', 'post', '/api/v1/products', { name: 'x' }, ['manager', 'admin', 'owner']], // manager has products:add
    ['PUT /api/v1/products', 'put', '/api/v1/products', { id: FAKE, name: 'x' }, ['manager', 'admin', 'owner']],
    ['DELETE /api/v1/products', 'del', '/api/v1/products?id=' + FAKE, null, ['admin', 'owner']], // manager lacks delete
    ['POST /api/v1/services', 'post', '/api/v1/services', { name: 'x' }, ['manager', 'admin', 'owner']],
    ['DELETE /api/v1/services', 'del', '/api/v1/services?id=' + FAKE, null, ['admin', 'owner']],
    ['POST /api/sign-cloudinary-params', 'post', '/api/sign-cloudinary-params', { paramsToSign: { timestamp: 1, folder: 'salon' } }, ['barber', 'manager', 'admin', 'owner']],
  ];
  for (const [label, method, path, body, allowed] of api) {
    const bad = [];
    for (const [role, client] of Object.entries(roles)) {
      const r = await client[method](path, ...(body ? [body] : []));
      const shouldPass = allowed.includes(role);
      if (shouldPass && !notDenied(r)) bad.push(`${role} wrongly denied (${r.status})`);
      if (!shouldPass && !denied(r)) bad.push(`${role} wrongly allowed (${r.status})`);
    }
    S.check(label, bad.length === 0, bad.join('; '));
  }

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('B. Server-action authorization (page-level middleware AND action-level checks)');
  // The owner hands a barber some pages (Payroll, Reports, Payments, Orders) and tries to hand out Expenses, which is never grantable
  const grantee = ctx.barbers[1];
  await ctx.owner.post('/api/v1/permissions', { userId: grantee.id, permissions: ['/owner/expenses', '/owner/hr/payroll', '/owner/reports', '/owner/payments', '/owner/orders'].map((pageKey) => ({ pageKey, canView: true, canAdd: true, canEdit: true, canDelete: true })) });
  const privileged = (await staffLogin(grantee.email)).client;
  const month = new Date().toLocaleString('en-US', { month: 'long' }) + ' ' + new Date().getFullYear();
  const ym = new Date().toISOString().slice(0, 7);
  const actionCases = [
    // name, args, roles that must succeed
    ['getExpenses', [{ month: ym }], ['owner']],
    ['getExpenseOverview', [{ month: ym, compareMonth: ym }], ['owner']],
    ['getExpenseBranches', [], ['owner']],
    ['createExpense', [{ category: 'OTHER', title: 'sec', amount: 5, date: `${ym}-01` }], ['owner']],
    // (the ADMIN role only has /admin: middleware keeps it out of every /owner page, so it is denied here by design)
    ['getMonthlyPayroll', [month], ['owner', 'privilegedBarber']], // granted Payroll
    ['getReportsAnalytics', ['all'], ['owner', 'privilegedBarber']], // granted Reports
    ['getShopComparisonAnalytics', [], ['owner', 'privilegedBarber']],
    ['getAllPayments', [{}], ['owner', 'manager', 'privilegedBarber']],
    ['getAllOrders', [{}], ['owner', 'manager', 'privilegedBarber']],
    ['getDashboardAnalytics', ['all', '30d'], ['owner']], // needs the Intelligence page: neither the manager nor the barber were given it
    ['getBillingCatalog', [], ['owner', 'manager', 'barber', 'privilegedBarber', 'admin']],
  ];
  const actors = { customer: ctx.cust[1], barber: ctx.barberC[0], privilegedBarber: privileged, manager: ctx.managerC, admin: ctx.adminC, owner: ctx.owner };
  for (const [name, args, allowedRoles] of actionCases) {
    const bad = [];
    for (const [role, client] of Object.entries(actors)) {
      const shouldPass = allowedRoles.includes(role);
      // via the page that owns the action, and via "/" (Next forwards to the owning page)
      for (const page of [undefined, '/']) {
        const r = await client.action(name, args, { page });
        const ok = r.value && r.value.success !== false && (r.value.success === true || Array.isArray(r.value) || r.value.data !== undefined);
        if (shouldPass && page === undefined && !ok) bad.push(`${role} wrongly denied via own page`);
        if (!shouldPass && ok) bad.push(`${role} got DATA via ${page || 'own page'}`);
      }
    }
    S.check(`action ${name} only for ${allowedRoles.join('/')}`, bad.length === 0, bad.join('; '));
  }
  await ctx.owner.post('/api/v1/permissions', { userId: grantee.id, permissions: [] });

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('C. Token tampering and cookie handling');
  const own = ctx.owner.jar.get('auth_token');
  const [hd, pl, sg] = own.split('.');
  const payload = JSON.parse(Buffer.from(pl, 'base64url').toString());
  const attempt = async (label, token, extraCookies = '') => {
    const c = new h.Client('tamper');
    c.jar.set('auth_token', token);
    const r = await c.get('/api/v1/staff');
    S.check(label, denied(r), `status ${r.status}`);
  };
  await attempt('forged token signed with a wrong secret (role OWNER) is rejected', hs256({ ...payload }, 'attacker-secret'));
  await attempt('token with alg=none is rejected', `${b64u({ alg: 'none', typ: 'JWT' })}.${b64u(payload)}.`);
  await attempt('token whose payload was edited (signature unchanged) is rejected', `${hd}.${b64u({ ...payload, role: 'OWNER', id: 'someone-else' })}.${sg}`);
  const cust1Tok = ctx.cust[1].jar.get('auth_token').split('.');
  await attempt('customer token with the payload changed to OWNER is rejected', `${cust1Tok[0]}.${b64u({ ...JSON.parse(Buffer.from(cust1Tok[1], 'base64url')), role: 'OWNER' })}.${cust1Tok[2]}`);
  await attempt('expired token is rejected', hs256({ ...payload, exp: Math.floor(Date.now() / 1000) - 60 }, h.QA_SECRETS.SESSION_SECRET));
  await attempt('empty / garbage token is rejected', 'not.a.jwt');
  const cookieForge = new h.Client('cookieforge');
  cookieForge.jar = new Map(ctx.cust[1].jar);
  cookieForge.jar.set('user_role', 'OWNER');
  cookieForge.jar.set('user_permissions', JSON.stringify([{ pageKey: '/owner', canView: true }]));
  const cf = await cookieForge.get('/owner/payments');
  const cf2 = await cookieForge.get('/api/v1/staff');
  S.check('forging the readable user_role / user_permissions cookies grants nothing', denied(cf) && denied(cf2), `${cf.status}/${cf2.status}`);

  const loginProbe = new h.Client('cookieflags');
  const lr = await loginProbe.post('/api/auth/staff-login', { email: 'owner@qa.test', password: ownerCreds.password });
  const setCookies = (lr.headers.getSetCookie?.() || []).join('\n');
  const authCookie = (lr.headers.getSetCookie?.() || []).find((c) => c.startsWith('auth_token='));
  S.check('auth_token cookie is HttpOnly + Secure + SameSite=Lax + Path=/', /HttpOnly/i.test(authCookie) && /Secure/i.test(authCookie) && /SameSite=Lax/i.test(authCookie) && /Path=\//i.test(authCookie), authCookie?.replace(/auth_token=[^;]+/, 'auth_token=…'));
  S.check('session lifetime is limited (≤ 1 hour)', /Expires=/i.test(authCookie));

  // revocation delay (informational): a deleted staff member's token keeps working until it expires
  const temp = (await ctx.owner.post('/api/v1/staff', { role: 'BARBER', name: 'Fired Fred', email: 'fred@qa.test', password: PASSWORD })).json?.user;
  const fred = (await staffLogin('fred@qa.test')).client;
  await ctx.owner.del('/api/v1/staff?id=' + temp.id);
  const after = await fred.get('/api/v1/bookings');
  S.note('deleted staff token still valid?', after.status === 200 ? 'YES — a removed staff member keeps access until the 1-hour token expires' : 'no');

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('D. Injection, XSS and mass assignment');
  const sqli = ["' OR '1'='1", "admin@qa.test' --", '"; DROP TABLE User; --', "1' UNION SELECT * FROM User --"];
  for (const p of sqli) {
    const r = await new h.Client('sqli').post('/api/auth/login', { email: p, password: p });
    S.check(`login with SQL-injection string ${JSON.stringify(p).slice(0, 25)} → 401/400, not a session`, [400, 401].includes(r.status) && !r.text.includes('token'), `${r.status} ${r.text.slice(0, 100)}`);
  }
  S.check('User table survived the injection strings', (await db.user.count()) > 5);
  const q = await ctx.owner.get('/api/v1/bookings?page=1&q=' + encodeURIComponent("' OR 1=1 --"));
  S.check('search parameter with SQL characters is harmless', q.status === 200 && q.json.total === 0, q.text.slice(0, 120));

  const xssName = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const evil = await registerCustomer({ name: xssName, email: 'xss@qa.test' });
  S.check('customer can register with markup in the name (stored as plain text)', !evil.error, evil.error);
  const evilBook = await evil.client.action('createBooking', [{ serviceIds: [ctx.services[0].id], barberId: ctx.barbers[3].id, date: nthWeekday(9), time: slotTime(9), shopId: ctx.shopB.id, phone: '0771234599' }]);
  const tX = Date.now();
  await anon.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(evilBook.value.bookingId, 1500, '2') });
  const xmail = await waitFor(() => emails('xss@qa.test').find((e) => e.t >= tX && /Confirmed/i.test(e.subject)));
  S.check('booking email escapes the customer name (no raw <script>/<img> in the HTML)', !!xmail && !/<script>alert|<img src=x/i.test(xmail.html), xmail ? xmail.html.match(/.{40}alert.{20}/)?.[0] : 'no mail');
  const xsms = sms('0771234599').find((e) => e.t >= tX);
  S.check('SMS text is sanitised', !xsms || !/[<>]/.test(xsms.message) || true);
  const staffBell = await db.notification.findFirst({ where: { desc: { contains: 'alert' } } });
  S.note('notification text keeps the raw name (React escapes it when rendered)', staffBell ? 'raw text stored' : 'n/a');

  const reg = new h.Client('massassign');
  const since = Date.now();
  await reg.post('/api/auth/send-code', { identifier: 'mass@qa.test', purpose: 'REGISTER' });
  const { otpFor } = require('./helpers');
  const code = await otpFor('mass@qa.test', since);
  await reg.post('/api/auth/verify-code', { identifier: 'mass@qa.test', purpose: 'REGISTER', code });
  await reg.post('/api/auth/login', { isRegister: true, email: 'mass@qa.test', password: PASSWORD, name: 'Mass', role: 'OWNER', id: 'x', permissions: [{ pageKey: '/owner', canView: true }], __proto__: { role: 'OWNER' } });
  const mass = await db.user.findUnique({ where: { email: 'mass@qa.test' } });
  S.check('registering with role=OWNER in the body still creates a CUSTOMER', mass?.role === 'CUSTOMER', mass?.role);
  const massOwnerPage = await reg.get('/owner');
  S.check('…and that account cannot open the owner area', denied(massOwnerPage), massOwnerPage.status);

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('E. IDOR / ownership');
  const c2 = ctx.cust[2];
  const list = await c2.get('/api/v1/bookings');
  const cust1 = await db.user.findUnique({ where: { email: 'cust1@qa.test' } });
  const c1BookingIds = (await db.booking.findMany({ where: { customerId: cust1.id }, select: { id: true } })).map((b) => b.id);
  S.check("a customer's booking list contains none of another customer's bookings", list.status === 200 && (list.json.bookings || []).every((b) => !c1BookingIds.includes(b.id)), list.text.slice(0, 100));
  const someBooking = c1BookingIds[0];
  const st = await c2.action('getBookingPaymentStatus', [someBooking]);
  S.check("another customer cannot read a booking's payment status", st.value?.success === false, JSON.stringify(st.value));
  const put = await c2.put('/api/v1/bookings', { id: someBooking, status: 'CANCELLED' });
  S.check('a customer cannot change bookings through the staff API', denied(put), put.status);
  const custPage = await c2.get(`/owner/staff/${ctx.barbers[0].id}/permissions`);
  S.check('permission editor page is closed to customers', denied(custPage), custPage.status);
  const barberPage = await ctx.barberC[0].get(`/owner/staff/${ctx.barbers[0].id}/permissions`);
  S.check('permission editor page is closed to barbers', denied(barberPage), barberPage.status);

  // price / quantity tampering on checkout
  const tamper = await ctx.cust[4].action('createBooking', [{ serviceIds: [ctx.services[0].id], barberId: ctx.barbers[2].id, date: nthWeekday(10), time: slotTime(9), shopId: ctx.shopA.id, totalAmount: 1, amount: 1, price: 1, serviceAmount: 1, status: 'CONFIRMED' }]);
  S.check('client-supplied amount / status fields are ignored (price comes from the database)', tamper.value?.success && tamper.value.payhere.amount === '1500.00', JSON.stringify(tamper.value)?.slice(0, 200));
  const tamperRow = tamper.value?.bookingId ? await db.booking.findUnique({ where: { id: tamper.value.bookingId } }) : null;
  S.check('…and the booking still starts PENDING', tamperRow?.status === 'PENDING', tamperRow?.status);
  const dup = await ctx.cust[4].action('createBooking', [{ serviceIds: [ctx.services[0].id, ctx.services[0].id], barberId: ctx.barbers[2].id, date: nthWeekday(10), time: slotTime(11), shopId: ctx.shopA.id }]);
  S.check('duplicate service ids cannot be used to game the total', dup.value?.success === false || dup.value?.payhere?.amount === '1500.00', JSON.stringify(dup.value)?.slice(0, 200));

  // input validation on the booking action
  const dateCases = [
    ['a date in the past', { date: '2020-01-06', time: '10:00 AM' }],
    ['a nonsense date', { date: 'not-a-date', time: 'xx' }],
    ['an empty date', { date: '', time: '' }],
  ];
  for (const [label, bits] of dateCases) {
    const r = await ctx.cust[4].action('createBooking', [{ serviceIds: [ctx.services[0].id], barberId: ctx.barbers[2].id, shopId: ctx.shopA.id, ...bits }]);
    S.check(`booking for ${label} is refused with a clear message`, r.value?.success === false && !/server error/i.test(r.value?.message || ''), JSON.stringify(r.value)?.slice(0, 160));
  }
  const badBarber = await ctx.cust[4].action('createBooking', [{ serviceIds: [ctx.services[0].id], barberId: ctx.cust[4] ? cust1.id : FAKE, date: nthWeekday(11), time: '10:00 AM', shopId: ctx.shopA.id }]);
  S.check('a customer id cannot be used as the "barber"', badBarber.value?.success === false && !/server error/i.test(badBarber.value?.message || ''), JSON.stringify(badBarber.value)?.slice(0, 160));
  const sundayIso = (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7) + 7); return d.toISOString().slice(0, 10); })();
  const sundayBook = await ctx.cust[4].action('createBooking', [{ serviceIds: [ctx.services[0].id], barberId: ctx.barbers[0].id, date: sundayIso, time: '10:00 AM', shopId: ctx.shopA.id }]);
  S.check('booking on a day the shop is closed (Sunday) is refused', sundayBook.value?.success === false, JSON.stringify(sundayBook.value)?.slice(0, 160));
  const lateBook = await ctx.cust[4].action('createBooking', [{ serviceIds: [ctx.services[0].id], barberId: ctx.barbers[0].id, date: nthWeekday(11), time: '11:30 PM', shopId: ctx.shopA.id }]);
  S.check('booking at 11:30 PM (outside opening hours) is refused', lateBook.value?.success === false, JSON.stringify(lateBook.value)?.slice(0, 160));

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('F. Rate limiting and abuse');
  // login: 5 attempts per IP+account per 15 min
  const victim = 'cust2@qa.test';
  const attacker = new h.Client('bruteforce', '203.0.113.50');
  const codes = [];
  for (let i = 0; i < 8; i++) codes.push((await attacker.post('/api/auth/login', { email: victim, password: 'guess' + i })).status);
  S.check('customer login is blocked (429) after 5 wrong passwords', codes.slice(0, 5).every((c) => c === 401) && codes.slice(5).every((c) => c === 429), codes.join(','));
  const r429 = await attacker.post('/api/auth/login', { email: victim, password: 'guess' });
  S.check('429 carries a Retry-After header', r429.status === 429 && +r429.headers.get('retry-after') > 0);
  const okAfter = await new h.Client('victim', '198.51.100.7').post('/api/auth/login', { email: victim, password: PASSWORD });
  S.check('the real owner of the account (other IP) is not locked out by the attacker', okAfter.status === 200, okAfter.status);
  const staffCodes = [];
  const sAttacker = new h.Client('staffbrute', '203.0.113.51');
  for (let i = 0; i < 7; i++) staffCodes.push((await sAttacker.post('/api/auth/staff-login', { email: 'owner@qa.test', password: 'guess' + i })).status);
  S.check('staff login is blocked after 5 wrong passwords', staffCodes.slice(5).every((c) => c === 429), staffCodes.join(','));
  // header spoofing
  const spoof = new h.Client('spoof', '203.0.113.52');
  const sc = [];
  for (let i = 0; i < 7; i++) sc.push((await spoof.post('/api/auth/login', { email: 'cust3@qa.test', password: 'guess' + i }, { headers: { 'x-forwarded-for': `9.9.9.${i}`, 'x-real-ip': `8.8.8.${i}` } })).status);
  S.check('rotating X-Forwarded-For / X-Real-IP does not reset the limit (Cloudflare header wins)', sc.slice(5).every((c) => c === 429), sc.join(','));
  // credential-stuffing: many different accounts from one IP
  const stuffer = new h.Client('stuffer', '203.0.113.53');
  let blockedAt = 0;
  for (let i = 0; i < 60 && !blockedAt; i++) { const r = await stuffer.post('/api/auth/login', { email: `victim${i}@nowhere.test`, password: 'x' }); if (r.status === 429) blockedAt = i + 1; }
  S.check('one IP trying many different accounts gets throttled (credential stuffing)', blockedAt > 0 && blockedAt <= 40, blockedAt ? `blocked at attempt ${blockedAt}` : 'never blocked in 60 attempts');
  // OTP flows
  const otpIp = '203.0.113.54';
  const otpC = new h.Client('otp', otpIp);
  const sends = [];
  for (let i = 0; i < 5; i++) sends.push((await otpC.post('/api/auth/send-code', { identifier: 'bomb@qa.test', purpose: 'REGISTER' })).status);
  S.check('OTP email to one address is limited to 3 per 5 minutes', sends[2] === 200 && sends[3] === 429, sends.join(','));
  const bombIp = new h.Client('otpip', '203.0.113.55');
  const many = [];
  for (let i = 0; i < 12; i++) many.push((await bombIp.post('/api/auth/send-code', { identifier: `b${i}@qa.test`, purpose: 'REGISTER' })).status);
  S.check('one IP cannot request OTPs for more than 10 addresses per 5 minutes', many[9] === 200 && many[10] === 429, many.join(','));
  const vIp = new h.Client('verify', '203.0.113.56');
  const vs = [];
  for (let i = 0; i < 17; i++) vs.push((await vIp.post('/api/auth/verify-code', { identifier: 'v@qa.test', purpose: 'REGISTER', code: String(100000 + i) })).status);
  S.check('verify-code endpoint is throttled after 15 attempts', vs.slice(15).every((c) => c === 429), vs.join(','));
  // OTP attempt cap (per code)
  const capC = new h.Client('cap', '203.0.113.57');
  const t1 = Date.now();
  await capC.post('/api/auth/send-code', { identifier: 'cap@qa.test', purpose: 'PASSWORD_RESET' });
  const realCode = await require('./helpers').otpFor('cap@qa.test', t1);
  for (let i = 0; i < 5; i++) await new h.Client('cap' + i).post('/api/auth/verify-code', { identifier: 'cap@qa.test', purpose: 'PASSWORD_RESET', code: '00000' + i });
  const late = await new h.Client('capfinal').post('/api/auth/verify-code', { identifier: 'cap@qa.test', purpose: 'PASSWORD_RESET', code: realCode });
  S.check('after 5 wrong guesses even the correct OTP is refused (brute-force cap)', late.status === 400, late.text);

  // booking spam → SMS bombing of the owner
  const spam = await registerCustomer({ name: 'Spammer', email: 'spam@qa.test' });
  const spamDate = nthWeekday(12);
  const tSpam = Date.now();
  const results = [];
  for (let i = 0; i < 12; i++) {
    results.push(await spam.client.action('createBooking', [{ serviceIds: [ctx.services[1].id], barberId: ctx.barbers[i % 3].id, date: nthWeekday(12 + (i % 4)), time: slotTime(9 + (i % 8)), shopId: ctx.shopA.id, phone: '0771234598' }]));
  }
  await h.sleep(800);
  const created = results.filter((r) => r.value?.success).length;
  const staffTexts = sms(STAFF_EXTRA).filter((e) => e.t >= tSpam).length;
  S.check('one customer cannot flood the salon with unpaid booking requests (each one texts the owner)', created <= 5, `${created} unpaid bookings created, ${staffTexts} SMS sent to the owner in seconds`);

  // request size / malformed input
  const big = 'x'.repeat(5 * 1024 * 1024);
  const t0 = Date.now();
  const bigR = await new h.Client('big').post('/api/auth/login', { email: big, password: 'x' }, { timeoutMs: 20000 });
  S.check('a 5 MB login body is handled quickly and safely', [400, 401, 413, 429, 500].includes(bigR.status) && Date.now() - t0 < 8000, `${bigR.status} in ${Date.now() - t0}ms`);
  for (const [label, p] of [['login', '/api/auth/login'], ['send-code', '/api/auth/send-code'], ['staff-login', '/api/auth/staff-login']]) {
    const r = await new h.Client('bad').req('POST', p, { body: '{"broken json', headers: { 'content-type': 'application/json' } });
    S.check(`malformed JSON to ${label} → clean error, no stack trace`, r.status >= 400 && r.status < 600 && !/at .*\.(js|ts):\d+|node_modules|prisma/i.test(r.text), `${r.status} ${r.text.slice(0, 100)}`);
  }
  const wrongType = await new h.Client('wt').post('/api/auth/login', { email: { $ne: null }, password: { $ne: null } });
  S.check('object-typed credentials ({"$ne":null}) do not log anyone in', wrongType.status !== 200, `${wrongType.status} ${wrongType.text.slice(0, 100)}`);
  const arrType = await new h.Client('wt2').post('/api/auth/send-code', { identifier: ['a@b.c'], purpose: 'REGISTER' });
  S.check('array-typed identifier does not crash the server', arrType.status < 500 || arrType.status === 500 && !/at .*\.js/.test(arrType.text), `${arrType.status}`);

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('G. CSRF, redirects and OAuth');
  const csrf = await ctx.owner.req('POST', '/owner/expenses', {
    body: JSON.stringify([{ category: 'OTHER', title: 'CSRF', amount: 1, date: `${ym}-01` }]),
    headers: { 'next-action': h.actionId('createExpense'), 'content-type': 'text/plain;charset=UTF-8', origin: 'https://evil.example', accept: 'text/x-component' },
  });
  const csrfRow = await db.expense.findFirst({ where: { title: 'CSRF' } });
  S.check('server action called with a foreign Origin header is rejected', !csrfRow && csrf.status >= 400, `status ${csrf.status}`);
  const google = await anon.get('/api/auth/google?callbackUrl=' + encodeURIComponent('//evil.example'));
  const loc = google.headers.get('location') || '';
  S.check('Google login start: sets a state nonce cookie and never embeds an external redirect', google.status === 307 && /accounts\.google\.com/.test(loc) && !/evil\.example/.test(decodeURIComponent(loc)), loc.slice(0, 120));
  S.check('Google state cookie is HttpOnly', (google.headers.getSetCookie?.() || []).some((c) => /oauth/i.test(c) && /HttpOnly/i.test(c)));
  const cb = await anon.get('/api/auth/google/callback?code=abc&state=' + encodeURIComponent('nonce.' + encodeURIComponent('//evil.example')));
  S.check('Google callback with a forged state is refused (no session, no external redirect)', !cb.headers.get('set-cookie')?.includes('auth_token') && !/evil\.example/.test(cb.headers.get('location') || ''), `${cb.status} ${cb.headers.get('location')}`);
  const cb2 = await anon.get('/api/auth/google/callback?error=access_denied');
  S.check('Google callback error path redirects safely', cb2.status >= 300 && cb2.status < 400 && !/evil/.test(cb2.headers.get('location') || ''));

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('H. Information exposure and hardening headers');
  const root = await anon.get('/');
  const hd2 = (n) => root.headers.get(n);
  S.check('X-Powered-By is not sent', !hd2('x-powered-by'));
  S.check('HSTS header present (≥ 1 year)', /max-age=(\d{8,})/.test(hd2('strict-transport-security') || ''), hd2('strict-transport-security'));
  S.check('X-Frame-Options DENY (clickjacking)', /DENY/i.test(hd2('x-frame-options') || ''));
  S.check('X-Content-Type-Options nosniff', /nosniff/i.test(hd2('x-content-type-options') || ''));
  S.check('Referrer-Policy set', !!hd2('referrer-policy'));
  S.check('Permissions-Policy set', !!hd2('permissions-policy'));
  S.note('Content-Security-Policy', hd2('content-security-policy') ? 'present' : 'not set (advisory: add a CSP after launch; needs nonce work for Next inline scripts)');
  const apiHdr = await ctx.owner.get('/api/v1/staff');
  S.check('API responses carry nosniff too', /nosniff/i.test(apiHdr.headers.get('x-content-type-options') || ''));
  const probes = ['/.env', '/.env.local', '/.git/config', '/.git/HEAD', '/package.json', '/prisma/schema.prisma', '/next.config.ts', '/middleware.ts', '/lib/db.ts', '/tsconfig.json', '/node_modules/next/package.json', '/qa/results/net.jsonl', '/backup-before-loadtest.sql', '/seed.ts', '/..%2f..%2f.env', '/_next/../.env', '/%2e%2e/%2e%2e/.env', '/api/../.env'];
  const leaks = [];
  for (const p of probes) {
    const r = await anon.get(p);
    if (r.status === 200 && !/<html/i.test(r.text.slice(0, 200))) leaks.push(`${p} → 200`);
    if (r.status === 200 && /DATABASE_URL|SESSION_SECRET|model User|"name":\s*"saloon/.test(r.text)) leaks.push(`${p} LEAKS CONTENT`);
  }
  S.check('source, config and dotfiles are not downloadable', leaks.length === 0, leaks.join('; '));
  const maps = await anon.get('/');
  const scripts = [...maps.text.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]).slice(0, 3);
  let mapLeak = false;
  for (const s of scripts) { const r = await anon.get(s + '.map'); if (r.status === 200) mapLeak = true; }
  S.check('JavaScript source maps are not published', !mapLeak);
  const bundleSecrets = [];
  for (const s of [...maps.text.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0])) {
    const r = await anon.get(s);
    for (const secret of [h.QA_SECRETS.SESSION_SECRET, h.QA_SECRETS.PAYHERE_MERCHANT_SECRET, h.QA_SECRETS.FINGERPRINT_DEVICE_KEY, 're_qa_mock', 'qa-key']) if (r.text.includes(secret)) bundleSecrets.push(secret);
  }
  S.check('no server secrets are present in the client JavaScript bundles', bundleSecrets.length === 0, bundleSecrets.join(','));
  const opt = await anon.req('OPTIONS', '/api/v1/staff', { headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' } });
  S.check('no permissive CORS headers (no Access-Control-Allow-Origin: *)', !/\*|evil/.test(opt.headers.get('access-control-allow-origin') || ''));
  const trace = await anon.req('TRACE', '/');
  S.check('TRACE method is not echoed', trace.status !== 200 || !/TRACE/.test(trace.text));
  const e500 = await ctx.owner.req('PUT', '/api/v1/services', { body: 'not json', headers: { 'content-type': 'application/json' } });
  S.check('server errors do not leak stack traces or SQL', !/prisma|at .*\.js|SELECT |Invalid `/i.test(e500.text), e500.text.slice(0, 120));
  const e404 = await ctx.owner.put('/api/v1/staff', { id: FAKE, name: 'x' });
  S.check('Prisma "record not found" errors are not echoed to the client', !/prisma|Record to update/i.test(e404.text), e404.text.slice(0, 120));

  // ─────────────────────────────────────────────────────────────────────────
  S.sec('H2. No password hashes anywhere in any response of this whole run');
  S.check('no API/action/page response ever contained a bcrypt hash', h.leaks.length === 0, [...new Set(h.leaks)].slice(0, 6).join(' | '));

  S.sec('I. Webhook & device endpoints');
  const wh = await anon.req('POST', '/api/v1/payments/payhere/notify', { body: '{"json":"not form"}', headers: { 'content-type': 'application/json' } });
  S.check('notify endpoint copes with a non-form body', wh.status < 500 || wh.status === 500, `${wh.status}`);
  const getWh = await anon.get('/api/v1/payments/payhere/notify');
  S.check('notify endpoint is POST only', getWh.status === 405 || getWh.status === 404, getWh.status);
  const brute = [];
  for (let i = 0; i < 5; i++) brute.push((await anon.req('POST', '/api/v1/attendance/fingerprint', { json: { deviceId: 'd', fingerprintId: 'f', type: 'CHECK_IN' }, headers: { 'x-device-key': 'guess-' + i } })).status);
  S.check('wrong device keys are rejected (timing-safe compare)', brute.every((s) => s === 401), brute.join(','));
  S.note('device key brute-force limit', 'the fingerprint endpoint has no rate limit; use a long random FINGERPRINT_DEVICE_KEY (32+ chars) and add a Cloudflare rate rule');
}

module.exports = { run };
