// Lighthouse (mobile + desktop) against the production build served on the QA port.
//   node qa/lighthouse.js <path-to-lighthouse-bin>
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const h = require('./lib/harness');

const LH = process.argv[2];
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGES = ['/', '/services', '/products', '/barbers', '/about', '/contact', '/login', '/staff-login', '/privacy-policy'];

(async () => {
  // Real image CDNs must be reachable for realistic paint metrics
  await h.startServer({}, 'server-lighthouse.log');
  const rows = [];
  try {
    for (const form of ['mobile', 'desktop']) {
      for (const p of PAGES) {
        const out = path.join(h.RESULTS_DIR, `lh-${form}-${p === '/' ? 'home' : p.slice(1)}.json`);
        const args = [`${h.BASE}${p}`, '--output=json', `--output-path=${out}`, '--quiet', `--chrome-path=${CHROME}`,
          '--chrome-flags=--headless=new --no-sandbox --disable-gpu', '--only-categories=performance,accessibility,best-practices,seo'];
        if (form === 'desktop') args.push('--preset=desktop');
        const r = spawnSync(process.execPath, [LH, ...args], { encoding: 'utf8', timeout: 240000 });
        if (!fs.existsSync(out)) { rows.push({ form, p, error: (r.stderr || r.stdout || '').slice(0, 200) }); console.log('ERR', form, p, (r.stderr || '').slice(0, 150)); continue; }
        const j = JSON.parse(fs.readFileSync(out, 'utf8'));
        const c = j.categories;
        const a = j.audits;
        const row = {
          form, p,
          perf: Math.round(c.performance.score * 100), a11y: Math.round(c.accessibility.score * 100), bp: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
          fcp: a['first-contentful-paint'].displayValue, lcp: a['largest-contentful-paint'].displayValue, tbt: a['total-blocking-time'].displayValue,
          cls: a['cumulative-layout-shift'].displayValue, si: a['speed-index'].displayValue,
          failing: Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'notApplicable').map((x) => x.id),
        };
        rows.push(row);
        console.log(`${form.padEnd(7)} ${p.padEnd(16)} perf ${row.perf}  a11y ${row.a11y}  bp ${row.bp}  seo ${row.seo}   FCP ${row.fcp}  LCP ${row.lcp}  TBT ${row.tbt}  CLS ${row.cls}`);
      }
    }
    fs.writeFileSync(path.join(h.RESULTS_DIR, 'lighthouse-summary.json'), JSON.stringify(rows, null, 2));
  } finally { h.stopServer(); await h.closeDb(); }
})();
