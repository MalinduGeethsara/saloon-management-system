// Real-browser check of the dashboard "Manual Booking" form: only FREE times are offered, closed days can't be
// picked, and a booking made from it really lands with the right specialist.
//   node qa/ui-manual-booking.js
const path = require('path');
const h = require('./lib/harness');
const { bootstrapBusiness } = require('./suites/helpers');

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { By, until, Builder } = sel('selenium-webdriver');
const chrome = sel('selenium-webdriver/chrome');
const R = new h.Report('ui-manual-booking');

async function addCookies(driver, client) {
  await driver.get(h.BASE + '/robots.txt');
  await driver.manage().deleteAllCookies();
  for (const [name, value] of client.jar) await driver.manage().addCookie({ name, value, path: '/', domain: 'localhost' });
}
const z = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
function nextDow(dow, minDaysAhead = 3) {
  const d = new Date();
  d.setDate(d.getDate() + minDaysAhead);
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  return d;
}

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  await h.startServer({}, 'server-uimanual.log');
  const options = new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--window-size=1400,1100');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    const db = h.prisma();
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    const barber = ctx.barbers[0];
    const haircut = ctx.services.find((s) => s.name === 'Haircut'); // 30 min
    const colour = ctx.services.find((s) => s.name === 'Hair Colour'); // 90 min
    const monday = nextDow(1);
    const sunday = nextDow(0);

    // the specialist already has 09:45 and 01:00 PM taken that Monday
    for (const time of ['09:45:00', '13:00:00']) {
      const r = await ctx.owner.post('/api/v1/bookings', { serviceIds: [haircut.id], shopId: ctx.shopA.id, barberId: barber.id, clientName: 'Already Booked', amount: 1500, date: `${ymd(monday)}T${time}` });
      if (r.status !== 201) throw new Error('setup booking failed ' + r.status + ' ' + r.text);
    }

    await addCookies(driver, ctx.owner);
    await driver.get(h.BASE + '/owner/bookings/manage');
    const modal = By.css('.ant-modal-wrap:not([style*="display: none"]) .ant-modal');
    // the notification dialog (new bookings alert the owner) sits on top of the page until acknowledged
    const dismissBell = async () => {
      for (let i = 0; i < 8; i++) {
        const btns = await driver.findElements(By.xpath('//div[contains(@class,"ant-modal")]//button[normalize-space()="Acknowledge"]'));
        for (const b of btns) if (await b.isDisplayed().catch(() => false)) { await b.click(); await driver.sleep(600); return; }
        await driver.sleep(1000);
      }
    };
    const openForm = async () => {
      await dismissBell();
      await (await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Manual Booking")]')), 12000)).click();
      await driver.wait(until.elementLocated(By.xpath('//div[contains(@class,"ant-modal")]//*[contains(text(),"New Appointment")]')), 8000);
      await driver.sleep(600);
    };
    const selects = () => driver.findElements(By.css('.ant-modal .ant-select'));
    const choose = async (index, text) => {
      const list = await selects();
      await list[index].click();
      const opt = await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,"ant-select-dropdown") and not(contains(@class,"ant-select-dropdown-hidden"))]//div[contains(@class,"ant-select-item-option") and contains(.,"${text}")]`)), 8000);
      await driver.wait(until.elementIsVisible(opt), 5000);
      await opt.click();
      await driver.sleep(400);
    };
    const slotLabels = async () => {
      await driver.sleep(900); // the diary is fetched
      const btns = await driver.findElements(By.xpath('//div[@aria-label="Free times"]//button'));
      const out = [];
      for (const b of btns) if (await b.isDisplayed().catch(() => false)) out.push((await b.getText()).trim());
      return out;
    };
    const pickDate = async (d) => {
      await (await driver.findElement(By.css('.ant-modal .ant-picker input'))).click();
      const title = ymd(d);
      for (let i = 0; i < 3; i++) {
        const cells = await driver.findElements(By.xpath(`//td[@title="${title}"]`));
        if (cells.length) return cells[0];
        await (await driver.findElement(By.css('.ant-picker-header-next-btn'))).click();
        await driver.sleep(300);
      }
      throw new Error('date cell not found ' + title);
    };

    R.sec('Opening the form');
    await openForm();
    R.check('the time field offers buttons, not a free clock', (await driver.findElements(By.xpath('//div[@aria-label="Free times"]'))).length === 1);

    R.sec('Only free times are shown');
    await choose(0, 'QA Colombo');
    await choose(1, 'QA Barber 1');
    await choose(2, 'Haircut');
    const dateAfterBranch = await driver.executeScript("return document.querySelector('.ant-modal .ant-picker input').value");
    R.check('once the branch is known the date is never a closed day (Sundays are skipped even if today is one)', !/^Sun/.test(dateAfterBranch), dateAfterBranch);
    R.check('with the branch chosen, opening hours are shown', /Open:/.test(await driver.findElement(By.css('.ant-modal')).getText()));
    const cell = await pickDate(monday);
    await cell.click();
    let slots = await slotLabels();
    R.check('the two taken times (09:45 AM and 01:00 PM) are NOT shown', !slots.includes('09:45 AM') && !slots.includes('01:00 PM'), slots.join(' | '));
    R.check('the free ones are (09:00, 10:30, 11:15, 01:45, 02:30, 04:00)', ['09:00 AM', '10:30 AM', '11:15 AM', '01:45 PM', '02:30 PM', '04:00 PM'].every((t) => slots.includes(t)), slots.join(' | '));

    await choose(2, 'Hair Colour');
    slots = await slotLabels();
    R.check('a longer service (90 min) also hides the time that would run into the next booking (09:00 AM)', !slots.includes('09:00 AM') && slots.includes('10:30 AM'), slots.join(' | '));
    await choose(2, 'Haircut');
    slots = await slotLabels();
    R.check('back to a short service: 09:00 AM is free again', slots.includes('09:00 AM'), slots.join(' | '));

    await (await driver.findElement(By.css('.ant-modal .ant-picker input'))).click();
    const sundayCell = await pickDate(sunday);
    R.check('a Sunday cannot be picked in the calendar (greyed out)', /disabled/.test(await sundayCell.getAttribute('class')), await sundayCell.getAttribute('class'));
    await (await driver.findElement(By.css('.ant-modal .ant-picker input'))).click().catch(() => {});
    await driver.findElement(By.css('.ant-modal-title')).click();

    R.sec('Making the booking');
    await (await driver.findElement(By.css('.ant-modal .ant-picker input'))).click();
    await (await pickDate(monday)).click();
    slots = await slotLabels();
    await driver.findElement(By.xpath('//div[@aria-label="Free times"]//button[normalize-space()="10:30 AM"]')).click();
    await driver.findElement(By.css('.ant-modal input[placeholder="Client Name"]')).sendKeys('UI Walkin Wendy');
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Confirm Booking")]')).click();
    await driver.wait(async () => (await db.booking.count({ where: { customer: { name: 'UI Walkin Wendy' } } })) === 1, 15000).catch(() => {});
    const made = await db.booking.findFirst({ where: { customer: { name: 'UI Walkin Wendy' } }, include: { services: true } });
    R.check('the booking is created for that specialist, that branch and that time', !!made && made.barberId === barber.id && made.shopId === ctx.shopA.id && made.status === 'CONFIRMED' && new Date(made.date).getHours() === 10 && new Date(made.date).getMinutes() === 30 && ymd(new Date(made.date)) === ymd(monday), made && `${made.barberId} ${made.date}`);
    const alertText = await driver.wait(until.elementLocated(By.css('body')), 3000).then((b) => b.getText());
    R.check('the screen says it was created', /Manual booking created/.test(alertText));

    await driver.sleep(1200);
    await openForm();
    await choose(0, 'QA Colombo');
    await choose(1, 'QA Barber 1');
    await choose(2, 'Haircut');
    await (await driver.findElement(By.css('.ant-modal .ant-picker input'))).click();
    await (await pickDate(monday)).click();
    slots = await slotLabels();
    R.check('re-opening the form: the time just booked (10:30 AM) is no longer offered', !slots.includes('10:30 AM') && slots.includes('11:15 AM'), slots.join(' | '));
  } catch (err) {
    R.check('manual booking UI checks completed without an error', false, err.stack || err.message);
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  process.exit(R.summary() ? 1 : 0);
})();
