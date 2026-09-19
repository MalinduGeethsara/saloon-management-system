const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { buildDriver } = require('../helpers/driver');
const { loginStaff, loginCustomer, logout } = require('../helpers/auth');
const { db, createTestUser, issueTestOtp } = require('../helpers/db');
const { BASE_URL, ACCOUNTS, TEST_PASSWORD } = require('../helpers/config');
const { fillById, waitForBodyText } = require('../helpers/ui');

describe('01 - Authentication (all roles)', function () {
  this.timeout(60000);
  let driver;

  before(async () => {
    driver = await buildDriver();
    // Staff roles aren't self-registerable — create them directly, same as a real onboarding
    // via the Staff page would (see 02-owner-staff-crud.test.js for that flow itself).
    for (const key of ['owner', 'admin', 'manager', 'barber', 'barber2']) {
      await createTestUser(ACCOUNTS[key]);
    }
  });

  after(async () => {
    await driver.quit();
  });

  it('registers a new customer end-to-end through the real signup + email-OTP flow', async () => {
    const email = ACCOUNTS.customer.email;
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.xpath('//button[text()="Sign Up"]')), 10000).click();
    await driver.sleep(300);

    // Step 1: name + method (email, the default) + email + password, all on one form
    await driver.findElement(By.css('input[placeholder="Malindu Geethsara"]')).sendKeys(ACCOUNTS.customer.name);
    await driver.findElement(By.css('input[type="email"]')).sendKeys(email);
    await driver.findElement(By.css('input[type="password"]')).sendKeys(TEST_PASSWORD);
    await driver.findElement(By.xpath('//button[contains(text(),"Send Email Code")]')).click();

    // The real /api/auth/send-code endpoint just fired for real (a real Resend email was sent —
    // free at this volume). We can't read that inbox, so we mint our own deterministic code the
    // same way the server does and use that to drive the rest of the flow.
    await driver.sleep(1500);
    const code = await issueTestOtp(email.toLowerCase(), 'REGISTER');

    // Step 2: just the 6-digit code — name/email/password already carried in component state
    await driver.wait(until.elementLocated(By.css('input[placeholder="••••••"]')), 10000).sendKeys(code);
    await driver.findElement(By.xpath('//button[contains(text(),"Verify & Register")]')).click();
    await driver.sleep(2000);

    const user = await db.user.findFirst({ where: { email: email.toLowerCase() } });
    expect(user, 'customer should exist after registration').to.not.be.null;
    expect(user.role).to.equal('CUSTOMER');
  });

  it('logs the new customer in and reaches their profile', async () => {
    await loginCustomer(driver, ACCOUNTS.customer.email, TEST_PASSWORD);
    await waitForBodyText(driver, ACCOUNTS.customer.name, 10000);
  });

  it('rejects a wrong password with a clear error, not a crash', async () => {
    await driver.get(`${BASE_URL}/login`);
    await driver.manage().deleteAllCookies();
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.css('input[placeholder*="customer@salon.com"]')), 10000).sendKeys(ACCOUNTS.customer.email);
    await driver.findElement(By.css('input[type="password"]')).sendKeys('DefinitelyWrongPassword');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.sleep(1500);
    await waitForBodyText(driver, 'Invalid', 5000).catch(async () => {
      await waitForBodyText(driver, 'error', 5000);
    });
  });

  it('logs in as OWNER and reaches the owner dashboard', async () => {
    await loginStaff(driver, ACCOUNTS.owner.email, TEST_PASSWORD);
    expect(await driver.getCurrentUrl()).to.include('/owner');
  });

  it('logs in as ADMIN and reaches the admin area', async () => {
    await loginStaff(driver, ACCOUNTS.admin.email, TEST_PASSWORD);
    const url = await driver.getCurrentUrl();
    expect(url).to.match(/\/(admin|owner)/);
  });

  it('logs in as MANAGER and reaches a manager-accessible page', async () => {
    await loginStaff(driver, ACCOUNTS.manager.email, TEST_PASSWORD);
    const url = await driver.getCurrentUrl();
    expect(url).to.not.include('/staff-login');
  });

  it('logs in as BARBER and reaches the barber dashboard', async () => {
    await loginStaff(driver, ACCOUNTS.barber.email, TEST_PASSWORD);
    expect(await driver.getCurrentUrl()).to.include('/barber');
  });

  it('logs out and can no longer reach a protected API route', async () => {
    await logout(driver);
    const status = await driver.executeAsyncScript((cb) => {
      fetch('/api/v1/staff').then((r) => cb(r.status)).catch(() => cb(-1));
    });
    expect(status).to.equal(403);
  });
});
