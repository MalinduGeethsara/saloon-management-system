// "The whole business, N users at a time": customers browse/sign up/book/pay/cancel while the owner,
// a manager and barbers run the salon on the dashboards, all against the production build with a
// realistically full database. Reports latency percentiles, error counts and server CPU/memory.
//
//   node qa/load/business.js --users 10 --minutes 5 [--cores 2] [--keep]
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync, execFile } = require('child_process');
const h = require('../lib/harness');
const { PASSWORD, nthWeekday, slotTime, staffLogin, bootstrapBusiness, registerCustomer, waitFor } = require('../suites/helpers');
const { seedVolume } = require('./seed-volume');

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : def; };
const USERS = Number(arg('users', 10));
const MINUTES = Number(arg('minutes', 5));
const CORES = Number(arg('cores', 2)); // CPUs the server + MySQL may use (emulates the droplet size)
const OWNER = { email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' };

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const think = (min, max) => h.sleep(min + Math.random() * (max - min));

// ── resource sampling ───────────────────────────────────────────────────────
function pidOnPort(port) {
  const r = spawnSync('powershell', ['-NoProfile', '-Command', `(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess`], { encoding: 'utf8' });
  return Number(String(r.stdout).trim()) || null;
}
function setAffinity(pid, mask) {
  if (!pid) return;
  spawnSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${pid}).ProcessorAffinity = ${mask}`], { encoding: 'utf8' });
}
function sampleProcs(pids) {
  const list = pids.filter(Boolean).join(',');
  const script = `$ids=@(${list}); $tree=@(); foreach($i in $ids){ $tree+=$i; $tree+=(Get-CimInstance Win32_Process -Filter "ParentProcessId=$i" | ForEach-Object { $_.ProcessId }) }; Get-Process -Id $tree -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id),$($_.ProcessName),$([int]($_.WorkingSet64/1MB)),$([math]::Round($_.TotalProcessorTime.TotalSeconds,2))" }`;
  // async on purpose: a blocking call would stall the load generator's own event loop and skew latencies
  return new Promise((resolve) => execFile('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8' }, (err, stdout) => {
    resolve(String(stdout || '').split(String.fromCharCode(10)).map((l) => l.trim()).filter(Boolean).map((l) => { const [id, name, mb, cpu] = l.split(','); return { id: +id, name, mb: +mb, cpu: +cpu }; }));
  }));
}

// ── counters ────────────────────────────────────────────────────────────────
const stat = { bookingsCreated: 0, slotTaken: 0, capBlocked: 0, paid: 0, failedPay: 0, abandoned: 0, cancelled: 0, signups: 0, logins: 0, staffActions: 0, unexpected: [], byType: {} };
function bad(kind, detail) { if (stat.unexpected.length < 60) stat.unexpected.push(`${kind}: ${String(detail).slice(0, 200)}`); }
const expectOk = (kind, r, extra = () => true) => { if (r.status >= 500 || r.status === 0 || !extra(r)) bad(kind, `${r.status} ${String(r.text).slice(0, 120)}`); return r; };

let stopAt = 0;
const running = () => Date.now() < stopAt;

// ── virtual users ───────────────────────────────────────────────────────────
async function customerLoop(ctx, id, pool) {
  const c = new h.Client('cust' + id);
  let loggedIn = false;
  let myBookings = [];
  while (running()) {
    // browse
    expectOk('GET /', await c.get('/'));
    await c.action('getPublicServices', [], { page: '/' });
    await think(800, 2500);
    if (Math.random() < 0.5) { expectOk('GET /services', await c.get('/services')); await think(500, 1500); }
    if (Math.random() < 0.3) { expectOk('GET /barbers', await c.get('/barbers')); await think(500, 1500); }

    // sign up (new) or log in (returning)
    if (!loggedIn) {
      if (Math.random() < 0.3) {
        const email = `load_${id}_${Date.now()}@qa.test`;
        const res = await registerCustomer({ name: 'Load User', email, ip: c.ip });
        if (res.error) { bad('signup', res.error); await think(2000, 4000); continue; }
        c.jar = res.client.jar; stat.signups++;
        await h.prisma().user.update({ where: { email }, data: { phone: '77' + String(Math.floor(1e7 + Math.random() * 9e7)) } }).catch(() => {});
      } else {
        const acct = pick(pool);
        const r = await c.post('/api/auth/login', { email: acct.email, password: PASSWORD });
        if (r.status === 429) { await think(2000, 4000); continue; }
        expectOk('login', r, (x) => x.status === 200);
        stat.logins++;
      }
      loggedIn = true;
      await think(500, 1500);
    }

    // booking wizard
    expectOk('GET /booking', await c.get('/booking'));
    const [barbers, services, shops] = await Promise.all([
      c.action('getAllPublicBarbers', [], { page: '/' }), c.action('getAllPublicServices', [], { page: '/' }), c.action('getPublicShops', [], { page: '/' }),
    ]);
    if (!Array.isArray(services.value) || !Array.isArray(barbers.value)) { bad('wizard data', services.text.slice(0, 100)); await think(1500, 3000); continue; }
    await think(1500, 4000);
    const barber = pick(ctx.barbers);
    const svc = [pick(services.value)];
    if (Math.random() < 0.3) svc.push(pick(services.value));
    const svcIds = [...new Set(svc.map((s) => s.id))];
    const day = nthWeekday(1 + rnd(20));
    const minutes = svc.reduce((a, s) => a + (s.duration || 30), 0);
    await c.action('getBookedSlots', [barber.id, day, minutes]);
    await think(1500, 4000);

    const payload = { serviceIds: svcIds, barberId: barber.id, date: day, time: slotTime(9 + rnd(8)), shopId: ctx.shopA.id };
    if (Math.random() < 0.25) { payload.productIds = [pick(ctx.products).id]; payload.address = '1 Load Rd'; payload.city = 'Colombo'; }
    if (!c.hasPhone) payload.phone = '077' + String(Math.floor(1e6 + Math.random() * 9e6));
    const t = await c.action('createBooking', [payload]);
    const v = t.value;
    if (!v) { bad('createBooking', t.status + ' ' + t.text.slice(0, 100)); await think(1500, 3000); continue; }
    if (v.success) {
      c.hasPhone = true; stat.bookingsCreated++;
      myBookings.push(v.bookingId);
      await think(3000, 9000); // paying on PayHere
      const roll = Math.random();
      if (roll < 0.85) {
        expectOk('payhere notify', await c.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(v.bookingId, v.payhere.amount, '2'), label: 'POST payhere notify (paid)' }), (x) => x.status === 200);
        stat.paid++;
        await think(500, 1500);
        const st = await c.action('getBookingPaymentStatus', [v.bookingId]);
        if (st.value?.paymentStatus !== 'COMPLETED') bad('payment status after paid', JSON.stringify(st.value));
      } else if (roll < 0.95) {
        await c.req('POST', '/api/v1/payments/payhere/notify', { form: h.payhereNotify(v.bookingId, v.payhere.amount, '-2'), label: 'POST payhere notify (failed)' });
        stat.failedPay++;
      } else stat.abandoned++;
      await think(800, 2000);
      expectOk('GET /profile', await c.get('/profile'));
      await c.action('getCustomerBookings', []);
      await c.action('getMyOrders', []);
      if (Math.random() < 0.1 && myBookings.length) {
        const r = await c.action('cancelBooking', [myBookings.pop()]);
        if (r.value?.success) stat.cancelled++;
      }
    } else if (/just taken|already/i.test(v.message || '')) stat.slotTaken++;
    else if (/waiting for payment|Too many booking/i.test(v.message || '')) stat.capBlocked++;
    else bad('createBooking', v.message);
    await think(2500, 7000);
  }
}

async function ownerLoop(ctx, id) {
  const c = (await staffLogin(OWNER.email, OWNER.password)).client;
  const ym = new Date().toISOString().slice(0, 7);
  const month = new Date().toLocaleString('en-US', { month: 'long' }) + ' ' + new Date().getFullYear();
  while (running()) {
    expectOk('owner dashboard page', await c.get('/owner'));
    const a = await c.action('getDashboardAnalytics', ['all', '30d']); if (!a.value?.success) bad('dashboard analytics', a.text.slice(0, 120));
    await think(2000, 5000);
    for (let p = 1; p <= 3 && running(); p++) { expectOk('owner bookings list', await c.get(`/api/v1/bookings?page=${p}&pageSize=10`, { label: 'GET bookings?page' }), (x) => x.status === 200); await think(1500, 3500); }
    const pay = await c.action('getAllPayments', [{ page: 1, pageSize: 10 }]); if (!pay.value?.success) bad('payments', pay.text.slice(0, 120));
    await think(1500, 3000);
    const rep = await c.action('getReportsAnalytics', ['all']); if (!rep.value?.success) bad('reports', rep.text.slice(0, 120));
    await c.action('getShopComparisonAnalytics', []); await c.action('getBookingTrendsAnalytics', ['all']); await c.action('getProductSalesAnalytics', []);
    await think(3000, 6000);
    const ex = await c.action('getExpenseOverview', [{ month: ym, compareMonth: ym }]); if (!ex.value?.success) bad('expense overview', ex.text.slice(0, 120));
    await c.action('getExpenses', [{ month: ym, page: 1, pageSize: 10 }]);
    if (Math.random() < 0.5) await c.action('createExpense', [{ category: 'PETTY_CASH', title: 'Load test expense', amount: 500 + rnd(2000), date: `${ym}-01` }]);
    await c.action('getMonthlyPayroll', [month]);
    await think(2000, 5000);
    // calendar loads every booking
    expectOk('owner calendar bookings (all)', await c.get('/api/v1/bookings', { label: 'GET bookings (all, calendar)' }), (x) => x.status === 200);
    await c.get('/api/v1/notifications');
    stat.staffActions++;
    await think(3000, 8000);
  }
}

async function managerLoop(ctx) {
  const c = ctx.managerC;
  while (running()) {
    // the bookings screen polls every 5 s
    for (let i = 0; i < 4 && running(); i++) { expectOk('manager bookings poll', await c.get('/api/v1/bookings?page=1&pageSize=10&status=PENDING', { label: 'GET bookings?page (poll)' }), (x) => x.status === 200); await c.get('/api/v1/notifications'); await think(4500, 5500); }
    const list = await c.get('/api/v1/bookings?page=1&pageSize=10&status=PENDING', { label: 'GET bookings?page (poll)' });
    const pend = (list.json?.bookings || [])[0];
    if (pend && Math.random() < 0.5) { const r = await c.put('/api/v1/bookings', { id: pend.id, status: 'CONFIRMED' }, { label: 'PUT booking status' }); expectOk('accept booking', r, (x) => x.status === 200); stat.staffActions++; }
    if (Math.random() < 0.4) {
      const r = await c.post('/api/v1/bookings', { serviceIds: [pick(ctx.services).id], barberId: pick(ctx.barbers).id, shopId: ctx.shopA.id, date: `${nthWeekday(1 + rnd(20))}T${String(9 + rnd(8)).padStart(2, '0')}:${pick(['00', '20', '40'])}:00`, clientName: 'Walk In ' + rnd(1e5), amount: 1500 }, { label: 'POST manual booking' });
      expectOk('manual booking', r, (x) => [201, 409].includes(x.status)); stat.staffActions++;
    }
    if (Math.random() < 0.4) {
      const r = await c.action('createManualBill', [{ invoiceNo: 'L-' + Date.now(), clientName: 'Bill ' + rnd(1e5), items: [{ name: 'Beard Oil', type: 'Product', price: 2300, productId: ctx.products[2].id }], amount: 2300, method: 'CASH' }]);
      if (!r.value?.success) bad('manual bill', r.text.slice(0, 120)); stat.staffActions++;
    }
    await c.action('getAllOrders', [{ page: 1, pageSize: 10 }]);
    await think(2000, 4000);
  }
}

async function barberLoop(ctx, idx) {
  const b = ctx.barbers[idx % ctx.barbers.length];
  const c = (await staffLogin(b.email)).client;
  const month = new Date().toLocaleString('en-US', { month: 'long' }) + ' ' + new Date().getFullYear();
  while (running()) {
    expectOk('barber dashboard', await c.get('/barber'));
    const r = await c.get('/api/v1/bookings', { label: 'GET bookings (barber own)' }); expectOk('barber bookings', r, (x) => x.status === 200);
    await think(2500, 6000);
    const mine = (r.json?.bookings || []).filter((x) => x.status === 'CONFIRMED');
    if (mine.length && Math.random() < 0.5) { const done = await c.put('/api/v1/bookings', { id: pick(mine).id, status: 'COMPLETED' }, { label: 'PUT booking status' }); expectOk('complete booking', done, (x) => x.status === 200); stat.staffActions++; }
    const e = await c.action('getMyCommissions', [month]); if (!e.value?.success) bad('commissions', e.text.slice(0, 120));
    await c.get('/api/v1/notifications');
    await think(3000, 8000);
  }
}

// ── main ────────────────────────────────────────────────────────────────────
(async () => {
  const out = { users: USERS, minutes: MINUTES, cores: CORES };
  try {
    console.log('Preparing InnoDB QA database…');
    await h.resetDatabase();
    h.createOwner(OWNER);
    h.clearNetLog(); h.setNetMode('ok');
    await h.startServer({}, `server-load-${USERS}.log`);
    const R = { check: () => {}, sec: () => {}, note: () => {} }; // bootstrap reports through the check() interface; not needed here
    const ctx = await bootstrapBusiness(R, OWNER);
    ctx.managerC = (await staffLogin('manager@qa.test')).client;
    // let the manager see everything the load needs
    await ctx.owner.post('/api/v1/permissions', { userId: ctx.manager.id, permissions: ['/owner/payments', '/owner/orders', '/owner/bookings/manage', '/owner/products'].map((pageKey) => ({ pageKey, canView: true, canAdd: true, canEdit: true, canDelete: false })) });
    ctx.managerC = (await staffLogin('manager@qa.test')).client;

    console.log('Seeding history (400 customers, 3000 bookings, orders, expenses, notifications)…');
    const t0 = Date.now();
    const seeded = await seedVolume(ctx);
    console.log(`  seeded in ${((Date.now() - t0) / 1000).toFixed(1)}s`, seeded.counts);
    const pool = seeded.customers.slice(0, 200);

    const serverPid = h.serverPid();
    const mysqlPid = pidOnPort(3306);
    // 2 real cores for the app AND the database together (like a 2 vCPU droplet); the load generator gets the rest
    const mask = CORES === 1 ? 1 : CORES === 2 ? 5 : CORES === 4 ? 0x55 : 0xFFFF;
    const treePids = (await sampleProcs([serverPid])).map((p) => p.id);
    for (const pid of treePids) setAffinity(pid, mask);
    setAffinity(mysqlPid, mask);
    setAffinity(process.pid, 0xFFFF & ~mask);
    console.log(`Server pids ${treePids.join(',')} + mysqld ${mysqlPid} pinned to ${CORES} core(s)`);

    // role mix for N users: ~60% customers, 1 owner (2 above 30), 1 manager per 10, barbers 2 per 10
    const nOwner = USERS >= 30 ? 2 : 1;
    const nManager = Math.max(1, Math.round(USERS / 10));
    const nBarber = Math.max(1, Math.round(USERS * 0.2));
    const nCustomer = Math.max(1, USERS - nOwner - nManager - nBarber);
    console.log(`Users: ${nCustomer} customers, ${nOwner} owner, ${nManager} manager, ${nBarber} barbers → ${MINUTES} min`);

    h.timings.length = 0;
    const samples = [];
    stopAt = Date.now() + MINUTES * 60 * 1000;
    const mon = setInterval(async () => {
      const [procs, my] = await Promise.all([sampleProcs([serverPid]), sampleProcs([mysqlPid])]);
      samples.push({ t: Date.now(), nodeMB: procs.filter((p) => /node/i.test(p.name)).reduce((a, p) => a + p.mb, 0), nodeCpu: procs.reduce((a, p) => a + p.cpu, 0), mysqlMB: my.reduce((a, p) => a + p.mb, 0), mysqlCpu: my.reduce((a, p) => a + p.cpu, 0), reqs: h.timings.length });
    }, 4000);

    const loops = [];
    for (let i = 0; i < nCustomer; i++) loops.push(customerLoop(ctx, i, pool).catch((e) => bad('customer crashed', e.stack)));
    for (let i = 0; i < nOwner; i++) loops.push(ownerLoop(ctx, i).catch((e) => bad('owner crashed', e.stack)));
    for (let i = 0; i < nManager; i++) loops.push(managerLoop(ctx).catch((e) => bad('manager crashed', e.stack)));
    for (let i = 0; i < nBarber; i++) loops.push(barberLoop(ctx, i).catch((e) => bad('barber crashed', e.stack)));
    await Promise.all(loops);
    clearInterval(mon);

    // ── results ──
    const secs = MINUTES * 60;
    const all = h.timingSummary();
    const total = h.timings.length;
    const errors5xx = h.timings.filter((t) => t.status >= 500 || t.status === 0).length;
    const allMs = h.timings.map((t) => t.ms).sort((a, b) => a - b);
    const pct = (p) => Math.round(allMs[Math.min(allMs.length - 1, Math.floor((p / 100) * allMs.length))] || 0);
    const cpuStart = samples[0], cpuEnd = samples[samples.length - 1];
    const wall = (cpuEnd.t - cpuStart.t) / 1000;
    const peakNode = Math.max(...samples.map((s) => s.nodeMB));
    const peakMy = Math.max(...samples.map((s) => s.mysqlMB));
    out.results = {
      requests: total, rps: +(total / secs).toFixed(1), errors5xxOrTimeout: errors5xx,
      p50: pct(50), p95: pct(95), p99: pct(99), max: Math.round(allMs[allMs.length - 1]),
      nodePeakMB: peakNode, mysqlPeakMB: peakMy,
      nodeCpuCoresAvg: +((cpuEnd.nodeCpu - cpuStart.nodeCpu) / wall).toFixed(2),
      mysqlCpuCoresAvg: +((cpuEnd.mysqlCpu - cpuStart.mysqlCpu) / wall).toFixed(2),
      business: { ...stat, unexpected: undefined, byType: undefined },
      unexpectedErrors: stat.unexpected,
      slowest: all.slice(0, 12),
    };
    out.samples = samples.map((s) => ({ t: Math.round((s.t - samples[0].t) / 1000), nodeMB: s.nodeMB, mysqlMB: s.mysqlMB }));
    out.endpoints = all;
    fs.writeFileSync(path.join(h.RESULTS_DIR, `load-${USERS}users.json`), JSON.stringify(out, null, 2));

    console.log('\n══════ RESULT ══════');
    console.log(JSON.stringify(out.results, (k, v) => (k === 'slowest' ? undefined : v), 2));
    console.log('\nSlowest endpoints (p95):');
    for (const e of all.slice(0, 12)) console.log(`  ${String(e.p95).padStart(6)} ms p95  ${String(e.p50).padStart(5)} ms p50  n=${String(e.n).padStart(5)}  5xx=${e.errors5xx}  ${e.label}`);
    const log = fs.readFileSync(path.join(h.RESULTS_DIR, `server-load-${USERS}.log`), 'utf8');
    const errLines = log.split('\n').filter((l) => /error|unhandled|deadlock|ECONN|Too many connections|Timed out/i.test(l));
    console.log(`\nServer log: ${errLines.length} error-ish lines`);
    errLines.slice(0, 8).forEach((l) => console.log('   ' + l.slice(0, 200)));
  } catch (err) {
    console.error('LOAD RUN CRASHED', err);
    process.exitCode = 1;
  } finally {
    h.stopServer();
    await h.closeDb();
    // give the pinned MySQL process all cores back
    const my = pidOnPort(3306); setAffinity(my, 0xFFFF);
    process.exit(process.exitCode || 0);
  }
})();
