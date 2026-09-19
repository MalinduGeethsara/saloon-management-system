// Real-browser check of the notification bell: nothing may be missed, and new ones make a sound.
//   node qa/ui-bell.js
const path = require('path');
const h = require('./lib/harness');
const { bootstrapBusiness } = require('./suites/helpers');

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { By, until, Builder } = sel('selenium-webdriver');
const chrome = sel('selenium-webdriver/chrome');
const R = new h.Report('ui-bell');

async function addCookies(driver, client) {
  await driver.get(h.BASE + '/robots.txt');
  await driver.manage().deleteAllCookies();
  for (const [name, value] of client.jar) await driver.manage().addCookie({ name, value, path: '/', domain: 'localhost' });
}
// (some pages keep other, closed dialogs in the page: look for the one that is actually showing)
const dialogTitle = async (driver, timeout = 12000) => {
  let text = '';
  await driver.wait(async () => {
    for (const el of await driver.findElements(By.css('.ant-modal-title'))) {
      if (await el.isDisplayed().catch(() => false)) { text = await el.getText(); return true; }
    }
    return false;
  }, timeout);
  return text;
};
const oscillators = (driver) => driver.executeScript('return window.__oscillators || 0');
const unread = (db, userId) => db.notification.count({ where: { userId, read: false } });

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  await h.startServer({}, 'server-uibell.log');
  const options = new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--window-size=1400,900');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    const db = h.prisma();
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    const owner = await db.user.findUnique({ where: { email: 'owner@qa.test' } });
    await db.notification.deleteMany({});
    await db.notification.createMany({ data: [
      { userId: owner.id, title: 'New Booking Request', desc: 'Older unread booking request', read: false },
      { userId: owner.id, title: 'New Booking Confirmed', desc: 'Older unread confirmed booking', read: false },
    ] });

    R.sec('Opening the dashboard with unread notifications waiting');
    await addCookies(driver, ctx.owner);
    await driver.get(h.BASE + '/owner');
    const first = await dialogTitle(driver);
    R.check('a dialog appears straight away saying how many are unread', /2 new notifications/i.test(first), first);
    R.check('the browser tab title shows the unread count', /^\(2\)/.test(await driver.getTitle()), await driver.getTitle());
    const badge = await driver.findElement(By.css('.ant-badge-count')).getText();
    R.check('the bell shows a numbered badge', badge === '2', badge);

    // count every oscillator the page starts (= tones played)
    await driver.executeScript(`
      window.__oscillators = 0;
      const orig = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function () { window.__oscillators++; return orig.apply(this, arguments); };
    `);
    await driver.findElement(By.css('body')).click(); // the first tap unlocks browser audio
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Acknowledge"]')).click();
    await driver.sleep(800);
    // (antd keeps a closed dialog in the page, hidden)
    const dialogGone = await driver.executeScript("const w = document.querySelector('.ant-modal-wrap'); return !w || getComputedStyle(w).display === 'none'");
    R.check('acknowledging closes the dialog and marks them read', (await unread(db, owner.id)) === 0 && dialogGone);
    R.check('the tab title count is cleared', !/^\(\d+\)/.test(await driver.getTitle()), await driver.getTitle());

    R.sec('A new notification arrives while the dashboard is open');
    await db.notification.create({ data: { userId: owner.id, title: 'New Booking Confirmed', desc: 'Kasun booked a haircut for tomorrow 10:00 AM', read: false } });
    const live = await dialogTitle(driver, 15000);
    R.check('it pops up within a few seconds', /New Booking Confirmed/i.test(live), live);
    const tones = await oscillators(driver);
    R.check('a notification tone plays (two-note chime)', tones === 2, `${tones} tones started`);
    R.check('the title shows (1) while it is unacknowledged', /^\(1\)/.test(await driver.getTitle()), await driver.getTitle());
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Open"]')).click();
    await driver.wait(until.urlContains('/owner/bookings/manage'), 10000);
    R.check('"Open" goes to the bookings page and marks it read', (await unread(db, owner.id)) === 0);

    R.sec('Urgent items sound different and go to the right page');
    const before = await oscillators(driver);
    await db.notification.create({ data: { userId: owner.id, title: 'Out of Stock', desc: 'Pomade is out of stock. Please restock.', read: false } });
    await dialogTitle(driver, 15000);
    const urgentTones = (await oscillators(driver)) - before;
    R.check('an urgent notification plays the longer four-note alert', urgentTones === 4, `${urgentTones} tones`);
    const titleColor = await driver.findElement(By.css('.ant-modal-title span')).getCssValue('color');
    R.check('and is shown in red', /220, 38, 38/.test(titleColor), titleColor);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Open"]')).click();
    await driver.wait(until.urlContains('/owner/products'), 10000);
    R.check('a stock alert opens the Products page', true);

    R.sec('The bell list and the sound switch');
    await driver.findElement(By.css('button[aria-label^="Notifications"]')).click();
    await driver.sleep(500);
    const listText = await driver.findElement(By.css('.ant-popover')).getText();
    R.check('the bell keeps showing earlier notifications (read ones dimmed), not just unread', /Pomade is out of stock/.test(listText) && /Kasun booked a haircut/.test(listText) && /Older unread booking request/.test(listText));
    const sw = await driver.findElement(By.css('.ant-popover [role="switch"]'));
    R.check('the sound switch is on by default', (await sw.getAttribute('aria-checked')) === 'true');
    await sw.click();
    await driver.sleep(300);
    await driver.findElement(By.css('body')).click();
    const beforeMute = await oscillators(driver);
    await db.notification.create({ data: { userId: owner.id, title: 'New Booking Request', desc: 'Muted test', read: false } });
    await dialogTitle(driver, 15000);
    R.check('with sound off the dialog still appears but stays silent', (await oscillators(driver)) === beforeMute, `${(await oscillators(driver)) - beforeMute} tones`);
    R.check('the sound choice is remembered', (await driver.executeScript("return localStorage.getItem('polaa_notification_sound')")) === 'off');

    // ── clicking a notification opens the exact record it is about ──────────────────────────────
    R.sec('Clicking a notification opens the exact record');
    await db.notification.deleteMany({});
    const barber = ctx.barbers[0];
    const customer = await db.user.create({ data: { email: 'dana.deeplink@qa.test', name: 'Deeplink Dana', role: 'CUSTOMER', password: 'x' } });
    const soon = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    const booking = await db.booking.create({
      data: { date: soon, status: 'CONFIRMED', totalAmount: 1500, customerId: customer.id, barberId: barber.id, shopId: ctx.shopA.id, source: 'ADMIN', services: { create: [{ service: { connect: { id: ctx.services[0].id } } }] } },
    });
    await db.payment.create({ data: { amount: 1500, status: 'PENDING', method: 'CASH', bookingId: booking.id, customerId: customer.id } });
    const order = await db.order.create({ data: { source: 'ADMIN', totalAmount: 2500, clientName: 'Order Olga', items: { create: [{ name: 'Pomade', price: 2500, quantity: 1 }] } } });
    const orderNo = 'ORD-' + order.id.slice(0, 6).toUpperCase();
    const modalWith = async (text, timeout = 12000) => {
      await driver.wait(async () => {
        const els = await driver.findElements(By.xpath('//div[contains(@class,"ant-modal")]//*[contains(normalize-space(.), "' + text + '")]'));
        for (const el of els) { if (await el.isDisplayed().catch(() => false)) return true; }
        return false;
      }, timeout);
      return true;
    };

    // 1. a booking notification -> the bookings page with THAT booking's actions open
    await driver.get(h.BASE + '/owner');
    await driver.sleep(1500);
    await db.notification.create({ data: { userId: owner.id, title: 'New Appointment', desc: 'Booking created for Deeplink Dana', read: false, refType: 'BOOKING', refId: booking.id } });
    await dialogTitle(driver, 15000);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Open"]')).click();
    await driver.wait(until.urlContains('/owner/bookings/manage'), 10000);
    const opened = await modalWith('Deeplink Dana');
    R.check('a booking notification opens the bookings page with that booking open', opened && (await driver.findElement(By.xpath('//*[contains(text(),"Booking Actions")]')).isDisplayed()));
    await driver.wait(async () => !/booking=/.test(await driver.getCurrentUrl()), 8000).catch(() => {});
    R.check('...the ?booking= part is removed from the address afterwards (a refresh will not reopen it)', !/booking=/.test(await driver.getCurrentUrl()), await driver.getCurrentUrl());

    // 2. an order notification -> orders page filtered to that order
    await db.notification.create({ data: { userId: owner.id, title: 'New Product Order', desc: 'Order Olga ordered Pomade', read: false, refType: 'ORDER', refId: order.id } });
    await driver.get(h.BASE + '/owner');
    await dialogTitle(driver, 15000);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Open"]')).click();
    await driver.wait(until.urlContains('/owner/orders'), 10000);
    await driver.wait(async () => (await driver.findElements(By.xpath('//td[contains(.,"Order Olga")]'))).length > 0, 12000).catch(() => {});
    const searchVal = await driver.executeScript("const i = [...document.querySelectorAll('input')].find(x => /ORD-/.test(x.value)); return i ? i.value : ''");
    R.check('an order notification opens Orders showing just that order (its number is in the search box)', searchVal === orderNo && (await driver.findElements(By.xpath('//td[contains(.,"Order Olga")]'))).length > 0, searchVal);

    // 3. a stock alert -> that product's edit form
    await db.notification.create({ data: { userId: owner.id, title: 'Low Stock', desc: 'Shampoo is running low', read: false, refType: 'PRODUCT', refId: ctx.products[1].id } });
    await driver.get(h.BASE + '/owner');
    await dialogTitle(driver, 15000);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Open"]')).click();
    await driver.wait(until.urlContains('/owner/products'), 10000);
    await driver.wait(async () => driver.executeScript("return [...document.querySelectorAll('.ant-modal input')].some(i => i.value === 'Shampoo')"), 12000).catch(() => {});
    R.check('a stock notification opens that product\'s form', await driver.executeScript("return [...document.querySelectorAll('.ant-modal input')].some(i => i.value === 'Shampoo')"));

    // 4. from the bell list (not the popup) and for a barber
    const barberClient = await require('./suites/helpers').staffLogin(barber.email);
    await db.notification.deleteMany({});
    await db.notification.create({ data: { userId: barber.id, title: 'New Appointment', desc: 'New booking with Deeplink Dana assigned to you', read: true, refType: 'BOOKING', refId: booking.id } });
    await addCookies(driver, barberClient.client);
    await driver.get(h.BASE + '/barber');
    await driver.sleep(2500);
    await driver.findElement(By.css('button[aria-label^="Notifications"]')).click();
    await driver.sleep(600);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-popover")]//*[contains(text(),"assigned to you")]')).click();
    await modalWith('Deeplink Dana').catch(() => {});
    R.check('a barber clicking a notification in the bell list lands on their dashboard with that booking open', /\/barber/.test(await driver.getCurrentUrl()) && (await driver.findElements(By.xpath('//*[contains(text(),"Booking Actions")]'))).length > 0, await driver.getCurrentUrl());

    // 5. a notification about something this person cannot open does not pretend to
    await db.notification.create({ data: { userId: barber.id, title: 'New Product Order', desc: 'Someone ordered Pomade', read: false, refType: 'ORDER', refId: order.id } });
    await driver.get(h.BASE + '/barber');
    await dialogTitle(driver, 15000);
    const openButtons = await driver.findElements(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Open"]'));
    R.check('a barber has no Open button for an order they may not see (only Acknowledge)', openButtons.length === 0);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Acknowledge"]')).click();

    // 6. access changes reach an open dashboard without signing in again
    const manager = await db.user.findUnique({ where: { id: ctx.manager.id } });
    await ctx.owner.post('/api/v1/permissions', { userId: manager.id, permissions: [] });
    const mgrClient = (await require('./suites/helpers').staffLogin(manager.email)).client;
    await db.notification.deleteMany({});
    await addCookies(driver, mgrClient);
    await driver.get(h.BASE + '/owner/bookings/manage');
    await driver.sleep(2500);
    const menuText = () => driver.findElement(By.css('.ant-menu')).getText();
    R.check('a manager with the default access sees only Calendar, Bookings and Attendance in the menu', !/Payments/.test(await menuText()) && /Bookings/.test(await menuText()), (await menuText()).replace(/\n/g, ' | '));
    await ctx.owner.post('/api/v1/permissions', { userId: manager.id, permissions: [{ pageKey: '/owner/payments', canView: true, canAdd: false, canEdit: false, canDelete: false }, { pageKey: '/owner/bookings/manage', canView: true, canAdd: false, canEdit: false, canDelete: false }] });
    const appeared = await driver.wait(async () => /Payments/.test(await menuText()), 20000).then(() => true).catch(() => false);
    R.check('the owner gives them Payments: it appears in their open menu within seconds, no re-login', appeared, (await menuText()).replace(/\n/g, ' | '));
    await ctx.owner.post('/api/v1/permissions', { userId: manager.id, permissions: [{ pageKey: '/owner/bookings/manage', canView: false, canAdd: false, canEdit: false, canDelete: false }, { pageKey: '/owner/payments', canView: true, canAdd: false, canEdit: false, canDelete: false }] });
    const bounced = await driver.wait(async () => !/manage/.test(await driver.getCurrentUrl()), 25000).then(() => true).catch(() => false);
    R.check('...and when Bookings is taken away, the page they were on moves them somewhere they are allowed', bounced, await driver.getCurrentUrl());
  } catch (err) {
    R.check('bell checks completed without a UI error', false, err.message);
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  process.exit(R.summary() ? 1 : 0);
})();
