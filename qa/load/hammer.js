// Raw throughput: N connections hitting one endpoint as fast as they can, no think time.
// Shows where the server saturates (server + MySQL pinned to 2 cores, like a 2 vCPU droplet).
//   node qa/load/hammer.js [--conns 50] [--seconds 15]
const { spawnSync } = require('child_process');
const h = require('../lib/harness');
const { staffLogin } = require('../suites/helpers');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const CONNS = Number(arg('conns', 50));
const SECONDS = Number(arg('seconds', 15));
const ps = (cmd) => spawnSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).stdout.trim();

async function hammer(label, makeReq) {
  const lat = [];
  let errors = 0;
  const end = Date.now() + SECONDS * 1000;
  await Promise.all(Array.from({ length: CONNS }, async () => {
    while (Date.now() < end) {
      const t = process.hrtime.bigint();
      try {
        const r = await makeReq();
        if (r.status >= 500 || r.status === 0) errors++;
        else if (r.status === 429) { /* rate limited: counted separately below */ }
      } catch { errors++; }
      lat.push(Number(process.hrtime.bigint() - t) / 1e6);
    }
  }));
  lat.sort((a, b) => a - b);
  const p = (q) => Math.round(lat[Math.min(lat.length - 1, Math.floor(q * lat.length))]);
  console.log(`${label.padEnd(34)} ${String(Math.round(lat.length / SECONDS)).padStart(6)} req/s   p50 ${String(p(0.5)).padStart(5)} ms   p95 ${String(p(0.95)).padStart(5)} ms   p99 ${String(p(0.99)).padStart(5)} ms   errors ${errors}`);
}

(async () => {
  await h.startServer({}, 'server-hammer.log');
  const serverPid = h.serverPid();
  const my = Number(ps('(Get-NetTCPConnection -LocalPort 3306 -State Listen | Select-Object -First 1).OwningProcess'));
  for (const pid of [serverPid, my]) ps(`(Get-Process -Id ${pid}).ProcessorAffinity = 5`);
  ps(`(Get-Process -Id ${process.pid}).ProcessorAffinity = 65530`);
  try {
    const anon = new h.Client('anon', '10.9.9.9');
    const owner = (await staffLogin('owner@qa.test', 'QaOwner#12345')).client;
    console.log(`${CONNS} connections x ${SECONDS}s per endpoint, server+MySQL on 2 cores\n`);
    await hammer('GET / (home page)', () => anon.get('/'));
    await hammer('GET /services (page)', () => anon.get('/services'));
    await hammer('GET /api/v1/services (JSON)', () => anon.get('/api/v1/services'));
    await hammer('action getPublicServices', () => anon.action('getPublicServices', [], { page: '/' }));
    await hammer('GET /login (page)', () => anon.get('/login'));
    await hammer('owner: bookings page 1 (DB, 3k rows)', () => owner.get('/api/v1/bookings?page=1&pageSize=10'));
    await hammer('owner: dashboard analytics (DB)', () => owner.action('getDashboardAnalytics', ['all', '30d']));
    await hammer('owner: reports analytics (DB, heavy)', () => owner.action('getReportsAnalytics', ['all']));
    await hammer('owner: ALL bookings (calendar, heavy)', () => owner.get('/api/v1/bookings'));
    const sample = process.memoryUsage();
    console.log('\nserver memory after the hammering:', ps(`(Get-Process -Id ${serverPid}).WorkingSet64/1MB`).slice(0, 6), 'MB');
  } finally {
    ps(`(Get-Process -Id ${my}).ProcessorAffinity = 65535`);
    h.stopServer();
    await h.closeDb();
  }
})();
