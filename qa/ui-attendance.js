// Real-browser check of the manual attendance entry: big, easy date and time controls.
//   node qa/ui-attendance.js
const path = require('path');
const h = require('./lib/harness');
const { bootstrapBusiness } = require('./suites/helpers');

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { By, until, Builder } = sel('selenium-webdriver');
const chrome = sel('selenium-webdriver/chrome');
const R = new h.Report('ui-attendance');

async function addCookies(driver, client) {
  await driver.get(h.BASE + '/robots.txt');
  await driver.manage().deleteAllCookies();
  for (const [name, value] of client.jar) await driver.manage().addCookie({ name, value, path: '/', domain: 'localhost' });
}
const inModal = (xpath) => By.xpath('//div[contains(@class,"ant-modal")]' + xpath);
const click = async (driver, by) => { const el = await driver.wait(until.elementLocated(by), 8000); await driver.wait(until.elementIsVisible(el), 8000); await el.click(); return el; };

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  await h.startServer({}, 'server-uiattendance.log');
  const options = new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--window-size=1400,1000');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    const db = h.prisma();
    const ctx = await bootstrapBusiness({ check: () => {} }, { email: 'owner@qa.test', password: 'QaOwner#12345' });
    const owner = await db.user.findUnique({ where: { email: 'owner@qa.test' } });
    await addCookies(driver, ctx.owner);
    await driver.get(h.BASE + '/owner/hr/attendance');

    R.sec('The manual entry form');
    await click(driver, By.xpath('//button[contains(.,"Manual Entry")]'));
    await driver.wait(until.elementLocated(inModal('//*[contains(text(),"Manual Attendance Entry")]')), 8000);
    const larges = await driver.findElements(inModal('//div[contains(@class,"ant-picker-large")]'));
    R.check('the date and both time fields are the large size', larges.length === 3, `${larges.length} large pickers`);
    const heights = [];
    for (const el of larges) heights.push((await el.getRect()).height);
    R.check('each is at least 48px tall (easy to hit, also with a thumb)', heights.every((v) => v >= 48), heights.join(', '));
    const chips = await driver.findElements(inModal('//button[normalize-space()="Today" or normalize-space()="Yesterday" or normalize-space()="9:00 AM" or normalize-space()="5:00 PM"]'));
    R.check('one-tap choices are offered for the day (Today, Yesterday) and for common times', chips.length === 4, `${chips.length} of 4`);
    const chipHeight = (await chips[0].getRect()).height;
    R.check('the one-tap buttons are big', chipHeight >= 44, chipHeight);
    const kbd = await driver.executeScript("return [...document.querySelectorAll('.ant-modal .ant-picker input')].every(i => i.readOnly)");
    R.check('the pickers do not pop up the phone keyboard (pick, do not type)', kbd === true);

    R.sec('Entering a normal day in a few taps');
    await click(driver, By.xpath('//div[contains(@class,"ant-modal")]//div[contains(@class,"ant-select")]'));
    await click(driver, By.xpath('//div[contains(@class,"ant-select-item-option") and contains(.,"QA Barber 1")]'));
    await click(driver, inModal('//button[normalize-space()="Yesterday"]'));
    await click(driver, inModal('//button[normalize-space()="9:00 AM"]'));
    await click(driver, inModal('//button[normalize-space()="5:00 PM"]'));
    const inVal = await driver.findElement(inModal('//input[@placeholder="Pick a time"]')).getAttribute('value');
    const outVal = await driver.findElement(inModal('//input[@placeholder="Still working"]')).getAttribute('value');
    R.check('the chosen times show in the fields (9:00 AM / 5:00 PM)', inVal === '9:00 AM' && outVal === '5:00 PM', `${inVal} / ${outVal}`);
    const dateVal = await driver.executeScript("return document.querySelector('.ant-modal .ant-picker input').value");
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    R.check('the date shows in words (yesterday)', dateVal.replace(/,/g, '').replace(/\s+/g, ' ') === yesterday.replace(/,/g, '').replace(/\s+/g, ' '), `${dateVal} vs ${yesterday}`);
    await click(driver, inModal('//button[normalize-space()="Save Record"]'));
    await driver.wait(async () => (await db.attendance.count()) === 1, 10000).catch(() => {});
    const rec = await db.attendance.findFirst({ include: { user: true } });
    R.check('the entry is saved for the right person, by the owner, as MANUAL', !!rec && rec.user.email === 'barber1@qa.test' && rec.recordedBy === owner.id && rec.method === 'MANUAL', JSON.stringify(rec && { u: rec.user.email, by: rec.recordedBy, m: rec.method }));
    R.check('the times saved are exactly 9:00 and 17:00 on that day (no time-zone shift)', !!rec && new Date(rec.checkIn).getHours() === 9 && new Date(rec.checkOut).getHours() === 17, rec && `${rec.checkIn} ${rec.checkOut}`);
    await driver.wait(async () => (await driver.findElements(By.xpath('//td[contains(.,"QA Barber 1")]'))).length > 0, 10000).catch(() => {});
    R.check('the modal closed and the record shows in the table', (await driver.findElements(By.xpath('//td[contains(.,"QA Barber 1")]'))).length > 0);

    R.sec('Mistakes are explained, and the form keeps what was typed');
    await click(driver, By.xpath('//button[contains(.,"Manual Entry")]'));
    await driver.sleep(500);
    await click(driver, inModal('//button[normalize-space()="Save Record"]'));
    const msg = await driver.wait(until.elementLocated(inModal('//*[@role="alert"]')), 5000);
    R.check('saving with nothing chosen says what to do', /Choose the staff member/.test(await msg.getText()), await msg.getText());
    R.check('...and the form stays open', (await driver.findElements(inModal('//button[normalize-space()="Save Record"]'))).length > 0);
    await click(driver, inModal('//button[normalize-space()="Cancel"]'));

    R.sec('On a phone');
    // (a headless window cannot be narrower than about 500px, so the phone size is emulated)
    await driver.sendDevToolsCommand('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await driver.get(h.BASE + '/owner/hr/attendance');
    await driver.sleep(800);
    await click(driver, By.xpath('//button[contains(.,"Manual Entry")]'));
    await driver.wait(until.elementLocated(inModal('//*[contains(text(),"Manual Attendance Entry")]')), 8000);
    await driver.sleep(500);
    const overflow = await driver.executeScript('return document.documentElement.scrollWidth - document.documentElement.clientWidth');
    R.check('the form fits a 390px phone screen with no sideways scrolling', overflow <= 0, `overflow ${overflow}px`);
    const modalRect = await (await driver.findElement(By.xpath('//div[contains(concat(" ", normalize-space(@class), " "), " ant-modal ")][.//*[contains(text(),"Manual Attendance Entry")]]'))).getRect();
    const vw = await driver.executeScript('return window.innerWidth');
    R.check('...and is not wider than the screen', vw <= 400 && modalRect.width <= vw, `modal ${modalRect.width}px, screen ${vw}px`);
    const save = await (await driver.findElement(inModal('//button[normalize-space()="Save Record"]'))).getRect();
    R.check('...the Save button is full width and easy to hit', save.height >= 48 && save.width >= 200, `${save.width}x${save.height}`);
  } catch (err) {
    R.check('attendance UI checks completed without an error', false, err.stack || err.message);
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  process.exit(R.summary() ? 1 : 0);
})();
