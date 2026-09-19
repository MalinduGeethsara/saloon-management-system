const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { buildDriver } = require('../helpers/driver');
const { loginStaff } = require('../helpers/auth');
const { db, createTestUser } = require('../helpers/db');
const { BASE_URL, ACCOUNTS, TEST_PASSWORD } = require('../helpers/config');
const { fillById, waitForBodyText, clearAndType } = require('../helpers/ui');

describe('03 - Owner: Products & stock management', function () {
  this.timeout(60000);
  let driver;
  const productName = 'Selenium Test Shampoo';

  before(async () => {
    driver = await buildDriver();
    await createTestUser(ACCOUNTS.owner);
    await loginStaff(driver, ACCOUNTS.owner.email, TEST_PASSWORD);
  });

  after(async () => {
    await driver.quit();
  });

  it('creates a product with low stock (5 units) and shows "Low Stock" status', async () => {
    // ProductModal uses `forceRender`, so its (hidden) submit button already exists in the DOM
    // alongside the page-level trigger button with the same text — exclude modal descendants to
    // unambiguously target the trigger.
    await driver.get(`${BASE_URL}/owner/products`);
    await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Add Product") and not(ancestor::div[contains(@class,"ant-modal")])]')), 10000).click();
    await driver.sleep(500);

    await fillById(driver, 'name', productName);
    await fillById(driver, 'brand', 'Selenium Brand');
    await driver.findElement(By.xpath('//div[contains(@class,"ant-form-item") and .//label[contains(.,"Category")]]//div[contains(@class,"ant-select")]')).click();
    await driver.sleep(300);
    await driver.wait(until.elementLocated(By.xpath('//div[contains(@class,"ant-select-item-option") and contains(.,"Hair Care")]')), 5000).click();

    const priceInput = await driver.findElement(By.css('input[id$="price"]'));
    await priceInput.sendKeys('850');
    const stockInput = await driver.findElement(By.css('input[id$="stock"]'));
    await stockInput.sendKeys('5');

    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Add Product")]')).click();
    await driver.sleep(1500);

    const created = await db.product.findFirst({ where: { name: productName } });
    expect(created, 'product should be created').to.not.be.null;
    expect(created.stock).to.equal(5);
    await waitForBodyText(driver, 'Low Stock', 10000);
  });

  it('raises stock to 50 and shows "In Stock"', async () => {
    await driver.get(`${BASE_URL}/owner/products`);
    await driver.sleep(1000);
    const card = await driver.wait(until.elementLocated(By.xpath(`//*[contains(.,"${productName}")]/ancestor::div[contains(@class,"ant-card")]`)), 10000);
    const editBtn = await card.findElement(By.css('button:has(.anticon-edit)'));
    await driver.executeScript('arguments[0].click();', editBtn);
    await driver.sleep(500);

    const stockInput = await driver.findElement(By.css('input[id$="stock"]'));
    await clearAndType(stockInput, '50');
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Update Product")]')).click();
    await driver.sleep(1500);

    const updated = await db.product.findFirst({ where: { name: productName } });
    expect(updated.stock).to.equal(50);
    await waitForBodyText(driver, 'In Stock', 10000);
  });

  it('drops stock to 0 and shows "Out of Stock"', async () => {
    await driver.get(`${BASE_URL}/owner/products`);
    await driver.sleep(1000);
    const card = await driver.wait(until.elementLocated(By.xpath(`//*[contains(.,"${productName}")]/ancestor::div[contains(@class,"ant-card")]`)), 10000);
    const editBtn = await card.findElement(By.css('button:has(.anticon-edit)'));
    await driver.executeScript('arguments[0].click();', editBtn);
    await driver.sleep(500);

    const stockInput = await driver.findElement(By.css('input[id$="stock"]'));
    await clearAndType(stockInput, '0');
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Update Product")]')).click();
    await driver.sleep(1500);

    await waitForBodyText(driver, 'Out of Stock', 10000);
  });

  it('deletes the product (with confirmation modal)', async () => {
    await driver.get(`${BASE_URL}/owner/products`);
    await driver.sleep(1000);
    const card = await driver.wait(until.elementLocated(By.xpath(`//*[contains(.,"${productName}")]/ancestor::div[contains(@class,"ant-card")]`)), 10000);
    const deleteBtn = await card.findElement(By.css('button:has(.anticon-delete)'));
    await driver.executeScript('arguments[0].click();', deleteBtn);
    await driver.sleep(500);
    await driver.findElement(By.xpath('//button[contains(.,"Yes, Delete")]')).click();
    await driver.sleep(1500);

    const deleted = await db.product.findFirst({ where: { name: productName } });
    expect(deleted, 'product should be deleted').to.be.null;
  });
});
