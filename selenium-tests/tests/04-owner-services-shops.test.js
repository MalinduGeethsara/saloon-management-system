const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { buildDriver } = require('../helpers/driver');
const { loginStaff } = require('../helpers/auth');
const { db, createTestUser, findFirstShop } = require('../helpers/db');
const { BASE_URL, ACCOUNTS, TEST_PASSWORD } = require('../helpers/config');
const { fillById, waitForBodyText, clearAndType } = require('../helpers/ui');

describe('04 - Owner: Services & Shops CRUD', function () {
  this.timeout(60000);
  let driver;
  const serviceName = 'Selenium Test Haircut';
  const shopName = 'Selenium Test Branch';

  before(async () => {
    driver = await buildDriver();
    await createTestUser(ACCOUNTS.owner);
    await loginStaff(driver, ACCOUNTS.owner.email, TEST_PASSWORD);
  });

  after(async () => {
    await driver.quit();
  });

  // --- Services (catalog page also manages products under category="Product") ---

  it('creates a Service item', async () => {
    await driver.get(`${BASE_URL}/owner/services`);
    await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Add Service")]')), 10000).click();
    await driver.sleep(500);

    await fillById(driver, 'name', serviceName);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-form-item") and .//label[contains(.,"Category")]]//div[contains(@class,"ant-select")]')).click();
    await driver.sleep(300);
    await driver.wait(until.elementLocated(By.xpath('//div[contains(@class,"ant-select-item-option") and contains(.,"Service")]')), 5000).click();

    const shop = await findFirstShop();
    await driver.findElement(By.xpath('//div[contains(@class,"ant-form-item") and .//label[contains(.,"Branch Location")]]//div[contains(@class,"ant-select")]')).click();
    await driver.sleep(300);
    await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,"ant-select-item-option") and contains(.,"${shop.name}")]`)), 5000).click();

    await driver.findElement(By.css('input[id$="price"]')).sendKeys('1200');
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Add Item")]')).click();
    await driver.sleep(1500);

    const created = await db.service.findFirst({ where: { name: serviceName } });
    expect(created, 'service should be created').to.not.be.null;
  });

  it('edits the service (rename)', async () => {
    await driver.get(`${BASE_URL}/owner/services`);
    await driver.sleep(1000);
    const row = await driver.wait(until.elementLocated(By.xpath(`//tr[.//text()[contains(.,"${serviceName}")]]`)), 10000);
    await row.findElement(By.css('button.ant-dropdown-trigger')).click();
    await driver.sleep(300);
    await driver.findElement(By.xpath('//li[contains(@class,"ant-dropdown-menu-item") and contains(.,"Edit Item")]')).click();
    await driver.sleep(500);

    const renamedTo = `${serviceName} Renamed`;
    const nameInput = await driver.findElement(By.css('input[id$="name"]'));
    await clearAndType(nameInput, renamedTo);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Update Item")]')).click();
    await driver.sleep(1500);

    const updated = await db.service.findFirst({ where: { name: renamedTo } });
    expect(updated, 'service should be renamed').to.not.be.null;
  });

  it('deletes the service', async () => {
    const renamedTo = `${serviceName} Renamed`;
    await driver.get(`${BASE_URL}/owner/services`);
    await driver.sleep(1000);
    const row = await driver.wait(until.elementLocated(By.xpath(`//tr[.//text()[contains(.,"${renamedTo}")]]`)), 10000);
    await row.findElement(By.css('button.ant-dropdown-trigger')).click();
    await driver.sleep(300);
    await driver.findElement(By.xpath('//li[contains(@class,"ant-dropdown-menu-item") and contains(.,"Remove Item")]')).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath('//button[contains(.,"Delete Item")]')).click();
    await driver.sleep(1500);

    const deleted = await db.service.findFirst({ where: { name: renamedTo } });
    expect(deleted, 'service should be deleted').to.be.null;
  });

  // --- Shops (branches) ---

  it('creates a Shop/branch (default operating hours pre-filled)', async () => {
    await driver.get(`${BASE_URL}/owner/shops`);
    await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Add Location") and not(ancestor::div[contains(@class,"ant-modal")])]')), 10000).click();
    await driver.sleep(500);

    await fillById(driver, 'name', shopName);
    await fillById(driver, 'address', '456 Selenium Avenue');
    await fillById(driver, 'manager', 'Selenium Manager');
    await fillById(driver, 'phone', '0771230000');
    // openTime/closeTime default to 09:00/18:00 already — no need to touch the TimePickers

    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Add Location")]')).click();
    await driver.sleep(1500);

    const created = await db.shop.findFirst({ where: { name: shopName } });
    expect(created, 'shop should be created').to.not.be.null;
  });

  it('edits the shop (rename)', async () => {
    await driver.get(`${BASE_URL}/owner/shops`);
    await driver.sleep(1000);
    const card = await driver.wait(until.elementLocated(By.xpath(`//*[contains(.,"${shopName}")]/ancestor::div[contains(@class,"ant-card")]`)), 10000);
    const shopMenuBtns = await card.findElements(By.css('button')); await shopMenuBtns[shopMenuBtns.length - 1].click();
    await driver.sleep(300);
    await driver.findElement(By.xpath('//li[contains(@class,"ant-dropdown-menu-item") and contains(.,"Edit Details")]')).click();
    await driver.sleep(500);

    const renamedTo = `${shopName} Renamed`;
    const nameInput = await driver.findElement(By.css('input[id$="name"]'));
    await clearAndType(nameInput, renamedTo);
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Update Location")]')).click();
    await driver.sleep(1500);

    const updated = await db.shop.findFirst({ where: { name: renamedTo } });
    expect(updated, 'shop should be renamed').to.not.be.null;
  });

  it('closes/deletes the shop', async () => {
    const renamedTo = `${shopName} Renamed`;
    await driver.get(`${BASE_URL}/owner/shops`);
    await driver.sleep(1000);
    const card = await driver.wait(until.elementLocated(By.xpath(`//*[contains(.,"${renamedTo}")]/ancestor::div[contains(@class,"ant-card")]`)), 10000);
    const shopMenuBtns = await card.findElements(By.css('button')); await shopMenuBtns[shopMenuBtns.length - 1].click();
    await driver.sleep(300);
    await driver.findElement(By.xpath('//li[contains(@class,"ant-dropdown-menu-item") and contains(.,"Close Location")]')).click();
    await driver.sleep(500);
    await driver.findElement(By.xpath('//button[contains(.,"Yes, Close Location")]')).click();
    await driver.sleep(1500);

    const deleted = await db.shop.findFirst({ where: { name: renamedTo } });
    expect(deleted, 'shop should be deleted').to.be.null;
  });
});
