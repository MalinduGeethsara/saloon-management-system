const { By, until, Key } = require('selenium-webdriver');

// .clear() alone is unreliable on React-controlled inputs — React can repopulate the value
// between clear() and sendKeys(). Select-all + type replaces it atomically instead.
async function clearAndType(el, value) {
  await el.sendKeys(Key.chord(Key.CONTROL, 'a'));
  await el.sendKeys(value);
}

// XPath text matching is the most reliable way to find Ant Design elements, which rarely expose
// stable class names or test ids. Use `.` (the element's full string-value, all descendant text
// included) rather than `text()` (direct text nodes only) — most buttons here wrap an icon plus
// a <span>label</span>, so their own direct text() is empty even though they render visible text.
function byText(text, tag = '*') {
  return By.xpath(`//${tag}[contains(., "${text}")]`);
}

async function clickByText(driver, text, tag = '*', timeout = 10000) {
  const el = await driver.wait(until.elementLocated(byText(text, tag)), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  await el.click();
  return el;
}

async function waitForBodyText(driver, text, timeout = 10000) {
  await driver.wait(async () => {
    const body = await driver.findElement(By.css('body')).getText();
    return body.includes(text);
  }, timeout, `Timed out waiting for body text to contain "${text}"`);
}

async function fillById(driver, idSuffix, value) {
  const el = await driver.wait(until.elementLocated(By.css(`input[id$="${idSuffix}"]`)), 10000);
  await clearAndType(el, value);
  return el;
}

async function selectAntOption(driver, triggerSelector, optionText) {
  await driver.findElement(By.css(triggerSelector)).click();
  await driver.sleep(300);
  const option = await driver.wait(
    until.elementLocated(By.xpath(`//div[contains(@class,"ant-select-item-option") and contains(., "${optionText}")]`)),
    5000
  );
  await option.click();
}

module.exports = { byText, clickByText, waitForBodyText, fillById, selectAntOption, clearAndType };
