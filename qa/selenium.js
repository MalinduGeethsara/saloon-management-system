// Runs the browser (Selenium/Chrome) UI suite against the QA server + InnoDB QA database.
// Skips 08 (needs the real PayHere sandbox popup) and 09 (sends real SMS).
//   node qa/selenium.js
const path = require('path');
const { spawn } = require('child_process');
const h = require('./lib/harness');

(async () => {
  await h.resetDatabase();
  h.createOwner({ email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' });
  h.clearNetLog();
  // the UI tests pick "the first branch": a brand-new owner-only database has none yet
  await h.prisma().shop.create({ data: { name: 'Selenium Base Branch', address: '1 Test Road, Colombo', phone: '0112223334' } });
  await h.startServer({}, 'server-selenium.log');
  let code = 1;
  try {
    const dir = path.join(h.ROOT, 'selenium-tests');
    const mocha = path.join(dir, 'node_modules', 'mocha', 'bin', 'mocha.js');
    const tests = ['01-auth', '02-owner-staff-crud', '03-owner-products-stock', '04-owner-services-shops'].map((t) => `tests/${t}.test.js`);
    const env = {
      ...process.env,
      SELENIUM_BASE_URL: h.BASE,
      DATABASE_URL: h.qaDatabaseUrl(),
      SESSION_SECRET: h.QA_SECRETS.SESSION_SECRET,
      FINGERPRINT_DEVICE_KEY: h.QA_SECRETS.FINGERPRINT_DEVICE_KEY,
    };
    // One mocha process per file: each file creates its own accounts with a per-process run id
    code = 0;
    for (const t of tests) {
      const c = await new Promise((resolve) => {
        const p = spawn(process.execPath, [mocha, '--timeout', '120000', '--reporter', 'spec', t], { cwd: dir, env, stdio: 'inherit' });
        p.on('exit', resolve);
      });
      code = code || c;
    }
  } finally {
    h.stopServer();
    await h.closeDb();
  }
  process.exit(code || 0);
})();
