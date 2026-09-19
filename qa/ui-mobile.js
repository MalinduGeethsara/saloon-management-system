// Mobile audit: opens every page as the role that uses it, on a phone-sized screen (390x844 and
// 360x740), and reports horizontal overflow (anything wider than the screen that is not inside its own
// scroll area). Screenshots go to qa/results/shots/mobile-*.png.
//   node qa/ui-mobile.js [--width 390]
const fs = require('fs');
const path = require('path');
const h = require('./lib/harness');
const { PASSWORD, bootstrapBusiness, registerCustomer, staffLogin } = require('./suites/helpers');
const { seedVolume } = require('./load/seed-volume');

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const T = (f) => require(path.join(h.ROOT, 'selenium-tests', 'helpers', f));

const argW = process.argv.indexOf('--width');
const WIDTHS = argW > -1 ? [Number(process.argv[argW + 1])] : [390, 360];
const SHOTS = path.join(h.RESULTS_DIR, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const FIND_OVERFLOW = `
  const vw = document.documentElement.clientWidth;
  const page = document.documentElement.scrollWidth - vw;
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
    // inside its own horizontal scroll area (a table, a chip row) -> that is fine
    let p = el.parentElement, scrolls = false;
    while (p && p !== document.body) {
      const o = getComputedStyle(p).overflowX;
      if ((o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') && p.getBoundingClientRect().right <= vw + 1) { scrolls = true; break; }
      p = p.parentElement;
    }
    if (scrolls) continue;
    bad.push((el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 3).join('.')).slice(0, 80) + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
    if (bad.length >= 4) break;
  }
  return { page, bad };
`;

async function addCookies(driver, client) {
  await driver.get(h.BASE + '/robots.txt');
  await driver.manage().deleteAllCookies();
  for (const [name, value] of client.jar) {
    await driver.manage().addCookie({ name, value, path: '/', domain: 'localhost' });
  }
}

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  h.clearNetLog();
  await h.startServer({}, 'server-mobile.log');
  const driver = await T('driver').buildDriver();
  const rows = [];
  try {
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    await seedVolume(ctx, { customers: 60, bookings: 250, notifications: 200, expenses: 40, orders: 30 });
    const cust = (await registerCustomer({ name: 'Mobile Customer', email: 'mobile@qa.test' })).client;
    const roles = {
      public: null,
      customer: cust,
      owner: ctx.owner,
      manager: ctx.managerC,
      barber: ctx.barberC[0],
      admin: ctx.adminC,
    };
    const pages = {
      public: ['/', '/services', '/products', '/barbers', '/about', '/contact', '/login', '/staff-login', '/forgot-password', '/privacy-policy', '/terms-conditions', '/refund-policy'],
      customer: ['/profile', '/booking'],
      owner: ['/owner', '/owner/bookings/manage', '/owner/calendar', '/owner/orders', '/owner/payments', '/owner/products', '/owner/services', '/owner/reports', '/owner/expenses', '/owner/shops', '/owner/staff', `/owner/staff/${ctx.barbers[0].id}/permissions`, '/owner/hr/payroll', `/owner/hr/payroll/${ctx.barbers[0].id}`, '/owner/hr/attendance', `/owner/shops/${ctx.shopA.id}/dashboard`],
      manager: ['/manager/attendance'],
      barber: ['/barber', '/barber/earnings'],
      admin: ['/admin', '/admin/shops', '/admin/logs', '/admin/backups', '/admin/settings'],
    };

    for (const width of WIDTHS) {
      await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width, height: width === 390 ? 844 : 740, deviceScaleFactor: 1, mobile: true });
      for (const [role, list] of Object.entries(pages)) {
        if (roles[role]) await addCookies(driver, roles[role]); else { await driver.get(h.BASE + '/robots.txt'); await driver.manage().deleteAllCookies(); }
        for (const p of list) {
          await driver.get(h.BASE + p);
          await driver.sleep(1400);
          const res = await driver.executeScript(FIND_OVERFLOW);
          const url = (await driver.getCurrentUrl()).replace(h.BASE, '');
          const row = { width, role, page: p, landed: url, overflowPx: res.page, offenders: res.bad };
          rows.push(row);
          const flag = res.page > 1 ? 'OVERFLOW' : 'ok';
          console.log(`${String(width).padEnd(4)} ${role.padEnd(9)} ${p.replace(ctx.barbers[0].id, ':id').replace(ctx.shopA.id, ':id').padEnd(34)} ${flag.padEnd(9)}${res.page > 1 ? ' +' + res.page + 'px ' + res.bad.join(' | ') : ''}${url !== p && !url.startsWith(p.split('?')[0]) ? '  (landed on ' + url + ')' : ''}`);
          if (width === WIDTHS[0]) {
            const name = `mobile-${role}-${p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}`.slice(0, 80);
            fs.writeFileSync(path.join(SHOTS, name + '.png'), await driver.takeScreenshot(), 'base64');
          }
        }
      }
    }
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  fs.writeFileSync(path.join(h.RESULTS_DIR, 'mobile-audit.json'), JSON.stringify(rows, null, 2));
  const bad = rows.filter((r) => r.overflowPx > 1);
  console.log(`\n${rows.length} page views, ${bad.length} with horizontal overflow`);
  process.exit(bad.length ? 1 : 0);
})();
