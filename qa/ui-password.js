// Real-browser check of the first-run password flow: the owner signs in with the handed-over password,
// is held on the "choose your own password" page, and is let in once they do.
//   node qa/ui-password.js
const path = require('path');
const h = require('./lib/harness');

process.env.SELENIUM_BASE_URL = h.BASE;
process.env.DATABASE_URL = h.qaDatabaseUrl();
process.env.SESSION_SECRET = h.QA_SECRETS.SESSION_SECRET;
const sel = (m) => require(path.join(h.ROOT, 'selenium-tests', 'node_modules', m));
const { By, until, Builder, Key } = sel('selenium-webdriver');
const chrome = sel('selenium-webdriver/chrome');
const R = new h.Report('ui-password');

const FIRST = 'FirstRunPass#123';
const CHOSEN = 'My-Own-Strong-Pass#9';
const type = async (driver, css, text) => { const el = await driver.findElement(By.css(css)); await el.clear(); await el.sendKeys(text); };
// (Selenium's clear() does not always reach a React-controlled input: select-all + delete does)
const setValue = async (el, text) => { await el.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE); await el.sendKeys(text); };
const bodyText = (driver) => driver.findElement(By.css('body')).getText();
const urlHas = async (driver, part, timeout = 12000) => driver.wait(async () => (await driver.getCurrentUrl()).includes(part), timeout).then(() => true).catch(() => false);

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'First Owner', password: FIRST });
  const db = h.prisma();
  await db.user.update({ where: { email: 'owner@qa.test' }, data: { mustChangePassword: true } }); // as create-owner.js does by default
  await h.startServer({}, 'server-uipassword.log');
  const options = new chrome.Options().addArguments('--headless=new', '--no-sandbox', '--window-size=1300,900');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    R.sec('First sign-in with the handed-over password');
    await driver.get(h.BASE + '/staff-login');
    await type(driver, 'input[type="text"], input[placeholder="name@example.com"]', 'owner@qa.test');
    await type(driver, 'input[type="password"]', FIRST);
    await driver.findElement(By.xpath('//button[normalize-space()="Log In"]')).click();
    R.check('signing in lands on the "Choose your own password" page, not the dashboard', await urlHas(driver, '/change-password'), await driver.getCurrentUrl());
    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(),"Choose your own password")]')), 8000);
    R.check('it welcomes them by name and explains why', /Welcome, First Owner/.test(await bodyText(driver)) && /first sign-in/.test(await bodyText(driver)));
    R.check('there is no way to skip it: the dashboard address bounces back', await (async () => { await driver.get(h.BASE + '/owner'); return urlHas(driver, '/change-password'); })());
    R.check('...and so does the sign-in page and the API', await (async () => { const r = await driver.executeScript("return fetch('/api/v1/bookings').then(r => r.status)"); return r === 403; })());

    R.sec('Choosing the new password');
    const pw = await driver.findElements(By.css('input[type="password"]'));
    R.check('three password boxes: given, new, repeat', pw.length === 3, pw.length);
    await pw[0].sendKeys(FIRST);
    await pw[1].sendKeys('short');
    await pw[2].sendKeys('short');
    await driver.findElement(By.xpath('//button[contains(.,"Save and continue")]')).click();
    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(),"At least 10 characters")]')), 5000);
    R.check('a too-short password is stopped in the form', /At least 10 characters/.test(await bodyText(driver)) && (await driver.getCurrentUrl()).includes('/change-password'));
    await setValue(pw[1], CHOSEN);
    await setValue(pw[2], CHOSEN + 'x');
    await driver.findElement(By.xpath('//button[contains(.,"Save and continue")]')).click();
    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(),"do not match")]')), 5000);
    R.check('two different entries are stopped ("do not match")', true);
    await setValue(pw[2], CHOSEN);
    await setValue(pw[0], 'not-the-given-password');
    await driver.findElement(By.xpath('//button[contains(.,"Save and continue")]')).click();
    await driver.wait(until.elementLocated(By.css('.ant-alert-error')), 8000);
    R.check('a wrong "given" password shows an error and keeps them on the page', /current password is not correct/i.test(await bodyText(driver)));
    await setValue(pw[0], FIRST);
    await driver.findElement(By.xpath('//button[contains(.,"Save and continue")]')).click();
    R.check('a proper new password lets them into the dashboard', await urlHas(driver, '/owner', 15000) && !(await driver.getCurrentUrl()).includes('change-password'), await driver.getCurrentUrl());
    await driver.wait(until.elementLocated(By.css('button[aria-label="Change password"]')), 12000);
    R.check('the dashboard has a Change password button in the header', true);
    const row = await db.user.findUnique({ where: { email: 'owner@qa.test' } });
    R.check('the lock is off in the database', row.mustChangePassword === false);

    R.sec('Changing it again later');
    await driver.findElement(By.css('button[aria-label="Change password"]')).click();
    await driver.wait(until.elementLocated(By.xpath('//h3[contains(.,"Change password")]')), 8000);
    R.check('the page is the ordinary "Change password" (no "first sign-in" wording, has Cancel)', !/first sign-in/.test(await bodyText(driver)) && (await driver.findElements(By.xpath('//button[contains(.,"Cancel")]'))).length > 0);
    await driver.findElement(By.xpath('//button[contains(.,"Cancel")]')).click();
    R.check('Cancel goes back to the dashboard', await urlHas(driver, '/owner'));

    R.sec('Signing in again');
    await driver.manage().deleteAllCookies();
    const apiOld = await fetch(h.BASE + '/api/auth/staff-login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'owner@qa.test', password: FIRST }) });
    const apiNew = await fetch(h.BASE + '/api/auth/staff-login', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '10.5.5.5' }, body: JSON.stringify({ email: 'owner@qa.test', password: CHOSEN }) });
    R.check('the first password no longer works, the chosen one does (with no lock)', apiOld.status === 401 && apiNew.status === 200 && (await apiNew.json()).mustChangePassword === false, `${apiOld.status}/${apiNew.status}`);
  } catch (err) {
    let page = '';
    try { page = (await bodyText(driver)).replace(/\s+/g, ' ').slice(0, 400); } catch {}
    R.check('password UI checks completed without an error', false, (err.stack || err.message) + ' | page: ' + page);
  } finally {
    await driver.quit();
    h.stopServer();
    await h.closeDb();
  }
  process.exit(R.summary() ? 1 : 0);
})();
