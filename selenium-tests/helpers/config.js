// Load the main app's .env so we share the same DATABASE_URL and SESSION_SECRET
// (needed to generate OTP hashes the real app will accept).
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const BASE_URL = process.env.SELENIUM_BASE_URL || 'http://localhost:3000';
const RUN_ID = Date.now();

// These tests create OWNER/ADMIN accounts with a known password directly in the database that
// .env points to. Never let them run against a public/production deployment by accident.
const baseHost = new URL(BASE_URL).hostname;
if (!['localhost', '127.0.0.1'].includes(baseHost) && process.env.SELENIUM_ALLOW_REMOTE !== '1') {
  throw new Error(
    `Refusing to run Selenium tests against ${BASE_URL}: they seed privileged test users into the DB from .env. ` +
    'Point SELENIUM_BASE_URL at localhost, or set SELENIUM_ALLOW_REMOTE=1 if you really mean it.'
  );
}

module.exports = {
  BASE_URL,
  RUN_ID,
  TEST_PASSWORD: 'SeleniumTest#12345',
  ACCOUNTS: {
    owner: { email: `sel_owner_${RUN_ID}@test.local`, name: 'Selenium Owner', role: 'OWNER' },
    admin: { email: `sel_admin_${RUN_ID}@test.local`, name: 'Selenium Admin', role: 'ADMIN' },
    manager: { email: `sel_manager_${RUN_ID}@test.local`, name: 'Selenium Manager', role: 'MANAGER' },
    barber: { email: `sel_barber_${RUN_ID}@test.local`, name: 'Selenium Barber', role: 'BARBER' },
    barber2: { email: `sel_barber2_${RUN_ID}@test.local`, name: 'Selenium Barber Two', role: 'BARBER' },
    customer: { email: `sel_customer_${RUN_ID}@test.local`, name: 'Selenium Customer', role: 'CUSTOMER' },
  },
  // Real sandbox card per PayHere's published test-card docs — no real money moves in sandbox mode.
  PAYHERE_SANDBOX_CARD: {
    number: '4916217501611292',
    name: 'Selenium Test',
    expiryMonth: '12',
    expiryYear: '30',
    cvv: '123',
  },
};
