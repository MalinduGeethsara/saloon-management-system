const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { buildDriver } = require('../helpers/driver');
const { loginStaff } = require('../helpers/auth');
const { db, createTestUser, findFirstShop } = require('../helpers/db');
const { BASE_URL, ACCOUNTS, TEST_PASSWORD } = require('../helpers/config');
const { fillById, waitForBodyText, clearAndType } = require('../helpers/ui');

describe('02 - Owner: Staff CRUD (create, payroll-only update, full edit, delete)', function () {
  this.timeout(60000);
  let driver;
  const newStaffName = 'Selenium New Barber';
  const newStaffEmail = ACCOUNTS.barber2.email.replace('barber2', 'newbarber');

  before(async () => {
    driver = await buildDriver();
    await createTestUser(ACCOUNTS.owner);
    await loginStaff(driver, ACCOUNTS.owner.email, TEST_PASSWORD);
  });

  after(async () => {
    await driver.quit();
  });

  it('creates a new staff member (BARBER) via the Staff page', async () => {
    await driver.get(`${BASE_URL}/owner/staff`);
    await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Add New Staff")]')), 10000).click();
    await driver.sleep(400);

    await fillById(driver, 'name', newStaffName);
    await fillById(driver, 'email', newStaffEmail);
    await fillById(driver, 'phone', '0770009999');

    // Job Role is an AutoComplete (free-text input), not a plain Select
    const roleInput = await driver.findElement(By.css('input[id$="role"]'));
    await roleInput.sendKeys('BARBER');
    await driver.sleep(300);

    // Assigned Branch is a real Select, required
    await driver.findElement(By.xpath('//div[contains(@class,"ant-form-item") and .//label[contains(.,"Assigned Branch")]]//div[contains(@class,"ant-select")]')).click();
    await driver.sleep(300);
    const shop = await findFirstShop();
    await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,"ant-select-item-option") and contains(.,"${shop.name}")]`)), 5000).click();

    await driver.findElement(By.xpath('//button[contains(.,"Save Changes")]')).click();
    await waitForBodyText(driver, 'added successfully', 10000);

    const created = await db.user.findFirst({ where: { email: newStaffEmail } });
    expect(created, 'staff should be created').to.not.be.null;
    expect(created.role).to.equal('BARBER');
  });

  it('updates payroll only, without touching name/email/role (regression check)', async () => {
    await driver.get(`${BASE_URL}/owner/hr/payroll`);
    await driver.sleep(1000);

    const card = await driver.wait(
      until.elementLocated(By.xpath(`(//*[text()[contains(.,"${newStaffName}")]]/ancestor::div[.//button[.//*[contains(@class,"anticon-setting")]]])[last()]`)),
      10000
    );
    await driver.executeScript('arguments[0].scrollIntoView(true);', card);
    await card.findElement(By.css('button:has(.anticon-setting)')).click();
    await driver.sleep(500);

    await fillById(driver, 'baseSalary', '20000');
    await driver.findElement(By.xpath('//div[contains(@class,"ant-modal")]//button[contains(.,"Save") or contains(.,"Update")]')).click();
    await driver.sleep(1000);

    const updated = await db.user.findFirst({ where: { email: newStaffEmail } });
    expect(updated.baseSalary).to.equal(20000);
    // regression: a payroll-only save must keep the barber in their branch
    expect(updated.shopId, 'payroll save must not unassign the branch').to.not.be.null;
    expect(updated.name).to.equal(newStaffName);
    expect(updated.role).to.equal('BARBER');
  });

  it('edits the full staff profile (rename) — must reselect branch since payroll save nulled it (known pre-existing bug)', async () => {
    await driver.get(`${BASE_URL}/owner/staff`);
    await driver.sleep(800);

    const row = await driver.wait(until.elementLocated(By.xpath(`//tr[.//text()[contains(.,"${newStaffName}")]]`)), 10000);
    const menuBtn = await row.findElement(By.css('button.ant-dropdown-trigger'));
    await menuBtn.click();
    await driver.sleep(300);
    await driver.findElement(By.xpath('//li[contains(@class,"ant-dropdown-menu-item") and contains(.,"Edit Staff")]')).click();
    await driver.sleep(500);

    const renamedTo = `${newStaffName} Renamed`;
    const nameInput = await driver.findElement(By.css('input[id$="name"]'));
    await clearAndType(nameInput, renamedTo);

    // The branch is kept by the payroll-only save now; only pick one if the field is somehow empty
    const emptyBranch = await driver.findElements(By.xpath('//div[contains(@class,"ant-select") and contains(.,"Select Branch")]'));
    if (emptyBranch.length) {
      await emptyBranch[0].click();
      await driver.sleep(300);
      const shop = await findFirstShop();
      await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class,"ant-select-item-option") and contains(.,"${shop.name}")]`)), 5000).click();
    }

    await driver.findElement(By.xpath('//button[contains(.,"Save Changes")]')).click();
    await driver.sleep(1000);

    const updated = await db.user.findFirst({ where: { email: newStaffEmail } });
    expect(updated.name).to.equal(renamedTo);
  });

  it('deletes the staff member', async () => {
    await driver.get(`${BASE_URL}/owner/staff`);
    await driver.sleep(800);
    const renamedTo = `${newStaffName} Renamed`;
    const row = await driver.wait(until.elementLocated(By.xpath(`//tr[.//text()[contains(.,"${renamedTo}")]]`)), 10000);
    const menuBtn = await row.findElement(By.css('button.ant-dropdown-trigger'));
    await menuBtn.click();
    await driver.sleep(300);
    await driver.findElement(By.xpath('//li[contains(@class,"ant-dropdown-menu-item") and contains(.,"Remove")]')).click();
    await driver.sleep(1000);

    const deleted = await db.user.findFirst({ where: { email: newStaffEmail } });
    expect(deleted, 'staff should be deleted').to.be.null;
  });
});
