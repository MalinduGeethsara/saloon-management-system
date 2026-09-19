// Orchestrates the QA run: fresh DB (owner only) -> production server -> suites.
//   node qa/run.js [functional] [security] [resilience] [integrity] [access]     (default: all)
const h = require('./lib/harness');
const suites = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const want = (n) => suites.length === 0 || suites.includes(n);
const OWNER = { email: 'owner@qa.test', name: 'QA Owner', password: 'QaOwner#12345' };

(async () => {
  let failed = 0;
  try {
    console.log('Resetting the QA database (owner only)…');
    await h.resetDatabase();
    h.createOwner(OWNER);
    h.clearNetLog();
    h.setNetMode('ok');
    console.log('Starting the production build on port', h.PORT);
    await h.startServer();

    const R = new h.Report('functional');
    const ctx = await require('./suites/functional').run(R, OWNER);
    failed += R.summary();

    if (want('security')) {
      const S = new h.Report('security');
      await require('./suites/security').run(S, ctx, OWNER);
      failed += S.summary();
    }
    if (want('resilience')) {
      const X = new h.Report('resilience');
      await require('./suites/resilience').run(X, ctx);
      failed += X.summary();
    }
    if (want('integrity')) {
      const T = new h.Report('integrity');
      await require('./suites/integrity').run(T, ctx);
      failed += T.summary();
    }
    if (want('access')) {
      const Y = new h.Report('access');
      await require('./suites/access').run(Y, ctx);
      failed += Y.summary();
    }
  } catch (err) {
    console.error('QA run crashed:', err);
    failed += 1;
  } finally {
    h.stopServer();
    await h.closeDb();
  }
  process.exit(failed ? 1 : 0);
})();
