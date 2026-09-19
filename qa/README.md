# QA rig

Automated, isolated checks for the whole business. Nothing here touches the real database or sends real SMS, email or payments.

```
npm run build                      # the suites run against the production build
node qa/run.js                      # functional + security + resilience (concurrency) + integrity + access (permissions, attendance, notifications)
node qa/run.js security             # or just one of: functional security resilience integrity access
node qa/load/business.js --users 10 --minutes 5   # the whole business, N users at once, on 2 CPU cores
node qa/load/hammer.js              # raw throughput per endpoint
node qa/selenium.js                # real-browser UI tests (needs Chrome + matching chromedriver)
node qa/lighthouse.js <path to lighthouse/cli/index.js>
node qa/build-check.js             # clean-checkout npm ci + build, with time and peak memory
```

How it stays safe: `saloon_qa` (created fresh as InnoDB) replaces the real database name, outbound SMS/email are
intercepted by `qa/lib/mock-net.js` and recorded, and PayHere/session/device secrets are throwaway values.
The same suites run in GitHub Actions (`.github/workflows/ci-cd.yml`) against MySQL 8.
