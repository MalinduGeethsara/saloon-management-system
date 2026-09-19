// Opens every page (as the role that uses it, phone-sized) and lists JavaScript console errors and
// failed network requests (HTTP 4xx/5xx). Also scans the server's own log for errors.
//   node qa/ui-errors.js
const fs = require('fs');
const path = require('path');
const h = require('./lib/harness');
const { bootstrapBusiness, registerCustomer } = require('./suites/helpers');
const { seedVolume } = require('./load/seed-volume');

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { Builder } = sel('selenium-webdriver');
const chrome = sel('selenium-webdriver/chrome');

async function addCookies(driver, client) {
  await driver.get(h.BASE + '/robots.txt');
  await driver.manage().deleteAllCookies();
  if (client) for (const [name, value] of client.jar) await driver.manage().addCookie({ name, value, path: '/', domain: 'localhost' });
}

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  h.clearNetLog();
  await h.startServer({}, 'server-errors.log');
  const options = new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--window-size=390,844');
  options.setLoggingPrefs({ browser: 'ALL', performance: 'ALL' });
  options.setPerfLoggingPrefs({ enableNetwork: true });
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  const problems = [];
  let pagesSeen = 0;
  try {
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    await seedVolume(ctx, { customers: 60, bookings: 250, notifications: 200, expenses: 40, orders: 30 });
    for (const [i, sv] of (await h.prisma().service.findMany()).entries()) await h.prisma().service.update({ where: { id: sv.id }, data: { imageUrl: `/images/website/services/${[6, 7, 8, 9][i % 4]}.jpg` } });
    const cust = (await registerCustomer({ name: 'Errors Customer', email: 'errors@qa.test' })).client;
    const groups = [
      [null, ['/', '/services', '/products', '/barbers', '/about', '/contact', '/login', '/staff-login', '/forgot-password', '/privacy-policy', '/terms-conditions', '/refund-policy']],
      [cust, ['/profile', '/booking']],
      [ctx.owner, ['/owner', '/owner/bookings/manage', '/owner/calendar', '/owner/orders', '/owner/payments', '/owner/products', '/owner/services', '/owner/reports', '/owner/expenses', '/owner/shops', '/owner/staff', `/owner/staff/${ctx.barbers[0].id}/permissions`, '/owner/hr/payroll', `/owner/hr/payroll/${ctx.barbers[0].id}`, '/owner/hr/attendance', `/owner/shops/${ctx.shopA.id}/dashboard`]],
      [ctx.managerC, ['/manager/attendance']],
      [ctx.barberC[0], ['/barber', '/barber/earnings']],
      [ctx.adminC, ['/admin', '/admin/shops', '/admin/logs', '/admin/backups', '/admin/settings']],
    ];
    for (const [client, pages] of groups) {
      await addCookies(driver, client);
      for (const p of pages) {
        await driver.manage().logs().get('browser');
        await driver.manage().logs().get('performance');
        await driver.get(h.BASE + p);
        await driver.sleep(1800);
        pagesSeen++;
        const consoleErrors = (await driver.manage().logs().get('browser')).filter((e) => e.level.name === 'SEVERE').map((e) => e.message.replace(h.BASE, '').slice(0, 200));
        const failed = [];
        for (const entry of await driver.manage().logs().get('performance')) {
          try {
            const m = JSON.parse(entry.message).message;
            if (m.method === 'Network.responseReceived' && m.params.response.status >= 400 && !/favicon|\/_next\/webpack-hmr/.test(m.params.response.url)) {
              failed.push(`${m.params.response.status} ${m.params.response.url.replace(h.BASE, '')}`.slice(0, 160));
            }
          } catch {}
        }
        if (consoleErrors.length || failed.length) problems.push({ page: p.replace(ctx.barbers[0].id, ':id').replace(ctx.shopA.id, ':id'), consoleErrors: [...new Set(consoleErrors)], failed: [...new Set(failed)] });
      }
    }
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  console.log(`\n${pagesSeen} pages opened.`);
  if (!problems.length) console.log('No console errors and no failed requests on any page.');
  for (const pr of problems) {
    console.log(`\n${pr.page}`);
    pr.consoleErrors.forEach((e) => console.log('   console:', e));
    pr.failed.forEach((e) => console.log('   request :', e));
  }
  const log = fs.readFileSync(path.join(h.RESULTS_DIR, 'server-errors.log'), 'utf8').split('\n').filter((l) => /error|unhandled|deadlock|ECONN|TypeError|ReferenceError/i.test(l) && !/PayHere\] Running/.test(l));
  console.log(`\nServer log: ${log.length} error lines`);
  log.slice(0, 8).forEach((l) => console.log('   ' + l.slice(0, 200)));
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e); h.stopServer(); process.exit(1); });
