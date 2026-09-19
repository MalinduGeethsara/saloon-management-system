// Real-browser check of the search bars: public services / products / barbers, and the dashboard
// lists (catalog, staff), on a phone-sized screen.
//   node qa/ui-search.js
const path = require('path');
const h = require('./lib/harness');
const { bootstrapBusiness } = require('./suites/helpers');

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { By, until, Key } = sel('selenium-webdriver');
const T = (f) => require(path.join(h.ROOT, 'selenium-tests', 'helpers', f));
const R = new h.Report('ui-search');

async function addCookies(driver, client) {
  await driver.get(h.BASE + '/robots.txt');
  await driver.manage().deleteAllCookies();
  for (const [name, value] of client.jar) await driver.manage().addCookie({ name, value, path: '/', domain: 'localhost' });
}
async function type(driver, css, text) {
  const el = await driver.wait(until.elementLocated(By.css(css)), 10000);
  await el.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
  if (text) await el.sendKeys(text);
  await driver.sleep(400);
}
const count = async (driver, css) => (await driver.findElements(By.css(css))).length;
const text = async (driver) => driver.findElement(By.css('body')).getText();

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  await h.startServer({}, 'server-uisearch.log');
  const driver = await T('driver').buildDriver();
  try {
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    for (const [i, n] of ['Kids Cut', 'Head Massage', 'Hair Spa'].entries()) await ctx.owner.post('/api/v1/services', { name: n, price: 900 + i, duration: 30 });
    for (const [n, b] of [['Wax', 'Zeta'], ['Serum', 'Zeta'], ['Comb', 'Acme']]) await ctx.owner.post('/api/v1/products', { name: n, price: 500, stock: 20, brand: b, category: n === 'Comb' ? 'Tools' : 'Care', sku: 'S-' + n });
    await driver.get(h.BASE + '/robots.txt');
    await driver.manage().deleteAllCookies();

    R.sec('Public site');
    await driver.get(h.BASE + '/services');
    await driver.wait(until.elementLocated(By.css('input[type="search"]')), 10000);
    await driver.sleep(800);
    const all = await count(driver, 'h4.text-2xl');
    R.check('the services page shows a search box and every service', all >= 7, `${all} cards`);
    await type(driver, 'input[type="search"]', 'beard');
    const one = await count(driver, 'h4.text-2xl');
    R.check('typing narrows the services list ("beard" → Beard Trim only)', one === 1 && /Beard Trim/.test(await text(driver)), `${one} cards`);
    R.check('the result count is shown', /1 of \d+ services/.test(await text(driver)));
    await type(driver, 'input[type="search"]', 'zzzz');
    R.check('no match shows a friendly message with a way to clear', /No services match/.test(await text(driver)));
    await driver.findElement(By.xpath('//button[normalize-space()="Clear search"]')).click();
    await driver.sleep(300);
    R.check('clearing brings every service back', (await count(driver, 'h4.text-2xl')) === all);
    await type(driver, 'input[type="search"]', 'hair');
    R.check('search also matches part of a word and several services at once ("hair" → Haircut, Hair Colour, Hair Spa)', (await count(driver, 'h4.text-2xl')) === 3);

    await driver.get(h.BASE + '/products');
    await driver.wait(until.elementLocated(By.css('input[type="search"]')), 10000);
    await driver.sleep(800);
    await type(driver, 'input[type="search"]', 'zeta');
    R.check('products can be searched by brand ("zeta" → Wax and Serum)', (await count(driver, 'h4.text-2xl')) === 2);
    await type(driver, 'input[type="search"]', '');
    const tabs = await driver.findElements(By.css('[role="tab"]'));
    R.check('category chips are offered when products have categories', tabs.length >= 3, `${tabs.length} chips`);
    await driver.findElement(By.xpath('//button[@role="tab" and normalize-space()="Tools"]')).click();
    await driver.sleep(300);
    R.check('a category chip filters the list (Tools → Comb)', (await count(driver, 'h4.text-2xl')) === 1 && /Comb/.test(await text(driver)));

    R.sec('Dashboard (owner, phone screen)');
    await addCookies(driver, ctx.owner);
    await driver.get(h.BASE + '/owner/services');
    await driver.wait(until.elementLocated(By.css('input[placeholder="Search services & products"]')), 15000);
    await driver.sleep(800);
    const rowsAll = await count(driver, 'tbody tr.ant-table-row');
    await type(driver, 'input[placeholder="Search services & products"]', 'pomade');
    R.check('catalog search finds a product by name', (await count(driver, 'tbody tr.ant-table-row')) === 1, `${rowsAll} rows before`);
    await type(driver, 'input[placeholder="Search services & products"]', 'zeta');
    R.check('…and by brand', (await count(driver, 'tbody tr.ant-table-row')) === 2);
    await type(driver, 'input[placeholder="Search services & products"]', 'nothingmatches');
    R.check('…and shows an empty state when nothing matches', /No items match your search/.test(await text(driver)));
    await type(driver, 'input[placeholder="Search services & products"]', '');
    await driver.findElement(By.xpath('//label[contains(@class,"ant-segmented-item")][.//*[normalize-space()="Services"]]')).click();
    await driver.sleep(400);
    R.check('the Services/Products switch narrows the list', (await count(driver, 'tbody tr.ant-table-row')) === 7, `${await count(driver, 'tbody tr.ant-table-row')} rows`);

    await driver.get(h.BASE + '/owner/staff');
    await driver.wait(until.elementLocated(By.css('input[placeholder="Search staff"]')), 15000);
    await driver.sleep(800);
    await type(driver, 'input[placeholder="Search staff"]', 'barber 4');
    R.check('staff search finds one person by name', (await count(driver, 'tbody tr.ant-table-row')) === 1);
    await type(driver, 'input[placeholder="Search staff"]', 'manager@qa.test');
    R.check('…or by email', (await count(driver, 'tbody tr.ant-table-row')) === 1);

    await driver.get(h.BASE + '/owner/hr/payroll');
    await driver.wait(until.elementLocated(By.css('input[placeholder="Search employees"]')), 15000);
    await driver.sleep(1200);
    await type(driver, 'input[placeholder="Search employees"]', 'barber 2');
    R.check('payroll employee search narrows the cards', /QA Barber 2/.test(await text(driver)) && !/QA Barber 3/.test(await text(driver)));

    await driver.get(h.BASE + '/owner/calendar');
    await driver.wait(until.elementLocated(By.css('input[placeholder="Search bookings"]')), 15000);
    R.check('the calendar search box is visible on a phone', (await driver.findElement(By.css('input[placeholder="Search bookings"]')).isDisplayed()) === true);
  } catch (err) {
    R.check('search checks completed without a UI error', false, err.message);
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  process.exit(R.summary() ? 1 : 0);
})();
