// Real-browser walk through the customer booking wizard on the production build, on a PHONE-sized
// screen: branch -> services -> specialist -> day/time -> extras -> mobile number -> Pay.
// Also checks the branch opening hours (closed Sunday) and takes a screenshot of every step
// (qa/results/shots) so the layout can be looked at.
//   node qa/ui-booking.js
const fs = require('fs');
const path = require('path');
const h = require('./lib/harness');
const { PASSWORD, nthWeekday, bootstrapBusiness } = require('./suites/helpers');
const bcrypt = require(path.join(h.ROOT, 'node_modules', 'bcryptjs'));

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { By, until } = sel('selenium-webdriver');
const T = (f) => require(path.join(h.ROOT, 'selenium-tests', 'helpers', f));

const R = new h.Report('ui-booking');
const SHOTS = path.join(h.RESULTS_DIR, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

async function phoneScreen(driver) {
  await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
}
async function shot(driver, name) {
  await driver.sleep(400);
  fs.writeFileSync(path.join(SHOTS, name + '.png'), await driver.takeScreenshot(), 'base64');
}
async function click(driver, xpath, timeout = 10000) {
  const el = await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', el);
  await driver.sleep(150);
  await el.click();
  return el;
}
const bodyText = async (driver) => driver.findElement(By.css('body')).getText();
const overflowX = (driver) => driver.executeScript('return document.documentElement.scrollWidth - document.documentElement.clientWidth');

// login -> branch -> services -> specialist (the first three steps)
async function toTimeStep(driver, email, tag) {
  await T('auth').loginCustomer(driver, email, PASSWORD);
  await driver.get(h.BASE + '/booking');
  await click(driver, '//button[@role="radio"][contains(.,"QA Colombo")]');
  await click(driver, '//button[@role="checkbox"][contains(.,"Haircut")]');
  if (tag) await shot(driver, `${tag}-2-services`);
  await click(driver, '//button[normalize-space()="Continue"]');
  await click(driver, '//button[@role="radio"][contains(.,"QA Barber 1")]');
  await driver.wait(until.elementLocated(By.xpath('//*[contains(.,"Pick a day and time")]')), 10000);
}

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  h.clearNetLog();
  await h.startServer({}, 'server-uibooking.log');
  const driver = await T('driver').buildDriver();
  try {
    await phoneScreen(driver);
    const db = h.prisma();
    R.sec('Booking wizard in a real browser (phone-sized screen)');
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    const hash = await bcrypt.hash(PASSWORD, 10);
    await db.user.create({ data: { email: 'ui1@qa.test', name: 'UI Customer One', role: 'CUSTOMER', password: hash } });
    await db.user.create({ data: { email: 'ui2@qa.test', name: 'UI Customer Two', role: 'CUSTOMER', password: hash, phone: '771230002' } });
    for (const [i, sv] of (await db.service.findMany()).entries()) await db.service.update({ where: { id: sv.id }, data: { imageUrl: `/images/website/services/${[6, 7, 8, 9][i % 4]}.jpg` } });
    // a customer whose number is already on ANOTHER account
    await db.user.create({ data: { email: 'ui3@qa.test', name: 'UI Customer Three', role: 'CUSTOMER', password: hash } });

    // ── step 1
    await T('auth').loginCustomer(driver, 'ui1@qa.test', PASSWORD);
    await driver.get(h.BASE + '/booking');
    await driver.wait(until.elementLocated(By.xpath('//button[@role="radio"][contains(.,"QA Colombo")]')), 10000);
    await driver.wait(async () => /Select a branch/.test(await bodyText(driver)), 15000); // the site's intro splash covers the page for a moment
    const step1 = await bodyText(driver);
    R.check('branch cards show today\'s opening hours and the weekly hours (Sunday closed)', /Open today|Closed today/.test(step1) && /Closed Sun/.test(step1), step1.slice(0, 300));
    await shot(driver, 'ui1-1-branch');
    R.check('no horizontal scrolling on the branch step (phone)', (await overflowX(driver)) <= 1, await overflowX(driver));

    // ── steps 2-3
    await click(driver, '//button[@role="radio"][contains(.,"QA Colombo")]'); // auto-advances
    await driver.wait(until.elementLocated(By.xpath('//button[@role="checkbox"][contains(.,"Haircut")]')), 10000);
    R.check('picking a branch moves straight on to the services (no extra tap)', true);
    const imgs = await driver.findElements(By.css('main img, form img, [role="group"] img'));
    let bigImages = 0;
    for (const im of imgs) { const r = await im.getRect(); if (r.width > 80 || r.height > 80) bigImages++; }
    const brokenImgs = await driver.executeScript('return Array.from(document.images).filter(i => i.complete && i.naturalWidth === 0).length');
    const shownImgs = await driver.executeScript('return Array.from(document.images).filter(i => i.complete && i.naturalWidth > 0).length');
    R.check('the service thumbnails really load (none broken)', brokenImgs === 0 && shownImgs > 0, `${brokenImgs} broken, ${shownImgs} shown`);
    R.check('no large photos in the service list (small thumbnails only)', bigImages === 0, `${bigImages} large images`);
    await click(driver, '//button[@role="checkbox"][contains(.,"Haircut")]');
    await shot(driver, 'ui1-2-services');
    const continueBtn = await driver.findElement(By.xpath('//button[normalize-space()="Continue"]'));
    const barRect = await continueBtn.getRect();
    const viewport = await driver.executeScript('return window.innerHeight');
    R.check('the Continue button stays pinned on screen (sticky bar)', barRect.y + barRect.height <= viewport + 2, JSON.stringify(barRect));
    await continueBtn.click();
    await click(driver, '//button[@role="radio"][contains(.,"QA Barber 1")]'); // auto-advances
    await driver.wait(until.elementLocated(By.xpath('//*[contains(.,"Pick a day and time")]')), 10000);
    await shot(driver, 'ui1-3-time');

    // ── step 4: hours + closed days
    const t4 = await bodyText(driver);
    R.check('the time step shows the branch opening hours', /Mon-Sat 9:00 AM - 6:00 PM/.test(t4) && /Closed Sun/.test(t4), t4.slice(0, 300));
    const chips = await driver.findElements(By.css('[aria-label="Next available days"] button'));
    const chipLabels = await Promise.all(chips.map((c) => c.getText()));
    R.check('the quick day chips never offer a Sunday', chipLabels.length >= 3 && chipLabels.every((l) => !/^SUN/i.test(l)), chipLabels.join(' | ').replace(/\n/g, ' '));
    await shot(driver, 'ui1-4-time-slots');
    R.check('no horizontal scrolling on the time step (phone)', (await overflowX(driver)) <= 1, await overflowX(driver));

    const sunday = (() => { const d = new Date(); d.setDate(d.getDate() + 1); while (d.getDay() !== 0) d.setDate(d.getDate() + 1); return d; })();
    await click(driver, '//h2[contains(.,"Pick a day and time")]/following::button[contains(.,"Select a date") or contains(@class,"font-mono")][1]');
    for (let i = 0; i < 3; i++) {
      const shown = await driver.findElement(By.xpath('//button[@aria-label="Next month"]/preceding-sibling::span')).getText();
      if (shown.toLowerCase() === new Date(sunday).toLocaleString('en-US', { month: 'long' }).toLowerCase() + ' ' + sunday.getFullYear()) break;
      await driver.findElement(By.css('button[aria-label="Next month"]')).click();
      await driver.sleep(150);
    }
    await shot(driver, 'ui1-4-calendar');
    const closedCell = await driver.findElement(By.xpath(`//button[contains(@aria-label,"(closed)") and normalize-space()="${sunday.getDate()}"]`));
    R.check('Sunday shows as closed in the calendar', !!closedCell);
    await closedCell.click();
    await driver.sleep(500);
    const sunText = await bodyText(driver);
    R.check('picking a Sunday explains that the branch is closed', /is closed on Sundays/.test(sunText), sunText.slice(0, 200));
    const closedSlots = await driver.findElements(By.xpath('//button[@role="radio" and @disabled and contains(.,"Closed")]'));
    R.check('every time slot is blocked and marked Closed on a Sunday', closedSlots.length === 8, `${closedSlots.length} closed slots`);
    await shot(driver, 'ui1-4-sunday');
    R.check('Continue stays disabled on a closed day', (await driver.findElement(By.xpath('//button[normalize-space()="Continue"]')).getAttribute('disabled')) !== null);

    // ── pick a real day and time
    await click(driver, '//div[@aria-label="Next available days"]//button[1]');
    await click(driver, '//button[@role="radio"][contains(.,"10:30 AM") and not(@disabled)]');
    await shot(driver, 'ui1-4-picked');
    await click(driver, '//button[normalize-space()="Continue"]');
    await driver.wait(until.elementLocated(By.xpath('//button[normalize-space()="Skip"]')), 10000);
    await shot(driver, 'ui1-5-extras');
    await click(driver, '//button[normalize-space()="Skip"]');

    // ── step 6: phone is asked because this account has none
    await driver.wait(until.elementLocated(By.css('#payment-form')), 10000);
    await shot(driver, 'ui1-6-pay');
    const body = await bodyText(driver);
    R.check('the review shows branch, specialist, day/time and total', /QA Colombo/.test(body) && /QA Barber 1/.test(body) && /10:30 AM/.test(body) && /1,500/.test(body));
    R.check('services-only booking does NOT ask for a delivery address', !/Address\s*\*/i.test(body) && !/City\s*\*/i.test(body));
    R.check('a customer without a number on their account is asked for a mobile number', /Mobile Number/i.test(body));
    await click(driver, '//button[@form="payment-form"]');
    await driver.sleep(700);
    const nativeInvalid = await driver.executeScript('return document.querySelector("input[type=tel]").matches(":invalid")');
    R.check('paying without a mobile number is blocked and creates no booking', (nativeInvalid || /valid mobile number/i.test(await bodyText(driver))) && (await db.booking.count()) === 0);
    await driver.findElement(By.css('input[type="tel"]')).sendKeys('077 123 4567');
    await click(driver, '//button[@form="payment-form"]');
    let booking = null;
    for (let i = 0; i < 20 && !booking; i++) { await driver.sleep(500); booking = await db.booking.findFirst({ include: { payment: true, customer: true } }); }
    R.check('Pay creates a PENDING booking with a PENDING PayHere payment', booking && booking.status === 'PENDING' && booking.payment?.status === 'PENDING');
    R.check('…for the chosen barber, branch and total', booking && booking.totalAmount === 1500 && booking.barberId === ctx.barbers[0].id && booking.shopId === ctx.shopA.id);
    R.check('the number is saved on the account and on the booking', booking?.customer.phone === '771234567' && booking?.contactPhone === '771234567', JSON.stringify({ a: booking?.customer.phone, b: booking?.contactPhone }));

    // ── a customer who already has a number is not asked, and sees which number gets the SMS
    await toTimeStep(driver, 'ui2@qa.test');
    await click(driver, '//div[@aria-label="Next available days"]//button[1]');
    const takenSlotVisible = await driver.findElements(By.xpath('//button[@role="radio"][contains(.,"10:30 AM")]'));
    R.check('another customer sees the taken time blocked', takenSlotVisible.length === 1 && (await takenSlotVisible[0].getAttribute('disabled')) !== null);
    await click(driver, '//button[@role="radio"][contains(.,"01:00 PM") and not(@disabled)]');
    await click(driver, '//button[normalize-space()="Continue"]');
    await click(driver, '//button[normalize-space()="Skip"]');
    await driver.wait(until.elementLocated(By.css('#payment-form')), 10000);
    const body2 = await bodyText(driver);
    R.check('a customer with a saved number is NOT asked for one', !/Mobile Number\s*\*/i.test(body2) && /077 \*\*\* 0002/.test(body2), body2.slice(-500));
    await shot(driver, 'ui2-6-pay-no-phone-field');
    await click(driver, '//button[@form="payment-form"]');
    let second = null;
    for (let i = 0; i < 20 && !second; i++) { await driver.sleep(500); second = await db.booking.findFirst({ where: { customer: { email: 'ui2@qa.test' } } }); }
    R.check('…and the booking is created straight away using the saved number', second && second.contactPhone === '771230002', second?.contactPhone);

    // ── a number that another account already has is accepted for the booking
    await toTimeStep(driver, 'ui3@qa.test');
    await click(driver, '//div[@aria-label="Next available days"]//button[2]');
    await click(driver, '//button[@role="radio"][contains(.,"11:15 AM") and not(@disabled)]');
    await click(driver, '//button[normalize-space()="Continue"]');
    await click(driver, '//button[normalize-space()="Skip"]');
    await driver.wait(until.elementLocated(By.css('#payment-form')), 10000);
    await driver.findElement(By.css('input[type="tel"]')).sendKeys('0771230002'); // ui2's number
    await click(driver, '//button[@form="payment-form"]');
    let third = null;
    for (let i = 0; i < 20 && !third; i++) { await driver.sleep(500); third = await db.booking.findFirst({ where: { customer: { email: 'ui3@qa.test' } } }); }
    R.check('a number already used by another account does not stop the booking', third && third.contactPhone === '771230002' && !(await driver.findElements(By.css('[role="alert"]'))).length, third?.contactPhone);
  } catch (err) {
    R.check('wizard completed without a UI error', false, err.message);
    try { await shot(driver, 'failure'); } catch {}
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  process.exit(R.summary() ? 1 : 0);
})();
