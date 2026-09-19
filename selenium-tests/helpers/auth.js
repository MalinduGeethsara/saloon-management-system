const { By, until } = require('selenium-webdriver');
const { BASE_URL } = require('./config');

async function loginStaff(driver, email, password) {
  // A still-valid session from a previous login makes /staff-login auto-redirect away before
  // the form ever renders — always start from a clean slate.
  await driver.get(`${BASE_URL}/staff-login`);
  await driver.manage().deleteAllCookies();
  await driver.get(`${BASE_URL}/staff-login`);
  await driver.wait(until.elementLocated(By.css('input[id$="email"]')), 10000).sendKeys(email);
  await driver.findElement(By.css('input[id$="password"]')).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  // Login redirects client-side (router.push) after the fetch resolves, and Next dev mode
  // compiles each route on first visit — that can take a few seconds, so wait for the URL to
  // actually leave /staff-login rather than sleeping a fixed, sometimes-too-short amount.
  await driver.wait(async () => !(await driver.getCurrentUrl()).includes('/staff-login'), 20000);
  await driver.sleep(500);
}

async function loginCustomer(driver, email, password) {
  await driver.get(`${BASE_URL}/login`);
  await driver.manage().deleteAllCookies();
  await driver.get(`${BASE_URL}/login`);
  await driver.wait(until.elementLocated(By.css('input[placeholder*="customer@salon.com"]')), 10000).sendKeys(email);
  await driver.findElement(By.css('input[type="password"]')).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(async () => !(await driver.getCurrentUrl()).includes('/login'), 20000);
  await driver.sleep(500);
}

async function logout(driver) {
  await driver.executeScript(`
    return fetch('/api/auth/logout', { method: 'POST' });
  `);
  await driver.manage().deleteAllCookies();
}

module.exports = { loginStaff, loginCustomer, logout };
