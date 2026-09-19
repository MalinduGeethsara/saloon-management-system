// How fast does the booking flow feel on a phone? Loads /booking with a mid-range phone profile
// (4G network, 4x slower CPU) using the REAL service photos from /public, and reports when each step
// becomes usable, how many bytes the photos cost, and how many server calls run before first paint.
//   node qa/ui-perf.js
const fs = require('fs');
const path = require('path');
const h = require('./lib/harness');
const { PASSWORD, bootstrapBusiness } = require('./suites/helpers');
const bcrypt = require(path.join(h.ROOT, 'node_modules', 'bcryptjs'));

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { By, until } = sel('selenium-webdriver');
const T = (f) => require(path.join(h.ROOT, 'selenium-tests', 'helpers', f));

const mb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  await h.startServer({}, 'server-uiperf.log');
  const driver = await T('driver').buildDriver();
  try {
    const db = h.prisma();
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    // give the services the real photos the salon uses
    const svc = await db.service.findMany();
    const imgs = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    for (const [i, s] of svc.entries()) await db.service.update({ where: { id: s.id }, data: { imageUrl: `/images/website/services/${imgs[i % imgs.length]}.jpg` } });
    for (let i = 0; i < 6; i++) await db.service.create({ data: { name: `Extra Service ${i}`, price: 1000 + i, duration: 30, imageUrl: `/images/website/services/${imgs[(i + 4) % imgs.length]}.jpg` } });
    await db.user.create({ data: { email: 'perf@qa.test', name: 'Perf Customer', role: 'CUSTOMER', password: await bcrypt.hash(PASSWORD, 10), phone: '771230009' } });

    await T('auth').loginCustomer(driver, 'perf@qa.test', PASSWORD);
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await driver.sendDevToolsCommand('Network.enable', {});
    await driver.sendDevToolsCommand('Network.setCacheDisabled', { cacheDisabled: true });
    await driver.sendDevToolsCommand('Network.emulateNetworkConditions', { offline: false, latency: 90, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 });
    await driver.sendDevToolsCommand('Emulation.setCPUThrottlingRate', { rate: 4 });

    const t0 = Date.now();
    await driver.get(h.BASE + '/booking');
    await driver.wait(until.elementLocated(By.xpath('//button[@role="radio"][contains(.,"QA Colombo")]')), 60000);
    const tBranch = Date.now() - t0;
    const actionsBefore = await driver.executeScript(`return performance.getEntriesByType('resource').filter(e => e.initiatorType === 'fetch' && e.name.includes('/booking')).length`);

    const t1 = Date.now();
    await driver.findElement(By.xpath('//button[@role="radio"][contains(.,"QA Colombo")]')).click();
    await driver.wait(until.elementLocated(By.xpath('//button[@role="checkbox"][contains(.,"Haircut")]')), 60000);
    const tServices = Date.now() - t1;
    // let the thumbnails finish
    await driver.wait(async () => driver.executeScript(`return Array.from(document.images).every(i => i.complete)`), 120000).catch(() => {});
    const tImages = Date.now() - t1;

    const res = await driver.executeScript(`
      const imgs = performance.getEntriesByType('resource').filter(e => e.initiatorType === 'img' || /\\.(jpg|jpeg|png|webp)/i.test(e.name));
      return { count: imgs.length, bytes: imgs.reduce((a, e) => a + (e.transferSize || e.encodedBodySize || 0), 0), largest: Math.max(0, ...imgs.map(e => e.transferSize || e.encodedBodySize || 0)) };
    `);
    console.log(`\nPhone profile: 4G, 4x slower CPU, no cache`);
    console.log(`  first branch card usable ......... ${(tBranch / 1000).toFixed(1)} s`);
    console.log(`  services list usable after tap ... ${(tServices / 1000).toFixed(1)} s`);
    console.log(`  all thumbnails finished .......... ${(tImages / 1000).toFixed(1)} s`);
    const broken = await driver.executeScript('return Array.from(document.images).filter(i => i.complete && i.naturalWidth === 0).length');
    console.log(`  broken thumbnails ................ ${broken}`);
    console.log(`  photos downloaded ................ ${res.count} files, ${mb(res.bytes)} (largest ${mb(res.largest)})`);
    console.log(`  fetch calls to /booking at start . ${actionsBefore}`);
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
})().catch((e) => { console.error(e); h.stopServer(); process.exit(1); });
