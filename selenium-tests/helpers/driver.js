const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');

// HEADLESS=false lets you watch the browser while a suite runs — useful while first setting
// this up on a new machine. Defaults to headless for normal/CI runs.
async function buildDriver() {
  const options = new chrome.Options();
  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }
  options.addArguments('--window-size=1600,1000', '--no-sandbox', '--disable-dev-shm-usage');
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 30000, script: 30000 });
  return driver;
}

module.exports = { buildDriver };
