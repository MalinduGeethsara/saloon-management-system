// Proves the app builds from a clean checkout the way the droplet/CI will do it (no node_modules,
// no .next, no real secrets), and measures the build's time and peak memory on 2 CPU cores.
//   node qa/build-check.js [--heap 1536]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync, execFile } = require('child_process');
const h = require('./lib/harness');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const HEAP = arg('heap', '1536');
const REUSE = process.argv.includes('--reuse'); // build again in the existing copy (skips copy + npm ci)
const BUILD_CMD = process.argv.includes('--webpack') ? 'npx next build --webpack' : 'npx next build';
const DEST = path.join(os.tmpdir(), 'saloon-clean-build');

function sampleTreeMB(rootPid) {
  const script = `$ids=@(${rootPid}); $all=@(); $queue=$ids; while($queue.Count){ $next=@(); foreach($q in $queue){ $all+=$q; $next+=(Get-CimInstance Win32_Process -Filter "ParentProcessId=$q" | ForEach-Object { $_.ProcessId }) }; $queue=$next }; ($all | ForEach-Object { (Get-Process -Id $_ -ErrorAction SilentlyContinue).WorkingSet64 } | Measure-Object -Sum).Sum/1MB`;
  return new Promise((resolve) => execFile('powershell', ['-NoProfile', '-Command', script], { encoding: 'utf8' }, (e, out) => resolve(Math.round(Number(String(out).trim()) || 0))));
}

(async () => {
  if (!REUSE) {
  console.log('Copying the project (without node_modules, .next, .git, .env, QA output) to', DEST);
  spawnSync('powershell', ['-NoProfile', '-Command', `if (Test-Path '${DEST}') { Remove-Item -Recurse -Force '${DEST}' }`]);
  spawnSync('robocopy', [h.ROOT, DEST, '/E', '/XD', 'node_modules', '.next', '.git', 'results', '.claude', '.vscode', 'load-testing', '/XF', '.env', '*.sql', '*.tsbuildinfo', '/NFL', '/NDL', '/NJH', '/NJS', '/NP'], { encoding: 'utf8' });
  // A production-like .env with throwaway values: the build must not need anything real
  fs.writeFileSync(path.join(DEST, '.env'), [
    `DATABASE_URL="${h.qaDatabaseUrl()}"`,
    'SESSION_SECRET="clean-build-check-secret-0123456789abcdef0123456789abcdef"',
    'NEXT_PUBLIC_APP_URL="https://mr-polaa.com"',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="demo"',
    'PAYHERE_MERCHANT_ID="1200000"', 'PAYHERE_MERCHANT_SECRET="x"', 'PAYHERE_MODE="live"',
  ].join('\n'));
  }

  const cmd = REUSE ? BUILD_CMD : `npm ci --no-audit --no-fund && ${BUILD_CMD}`;
  const started = Date.now();
  const proc = spawn('cmd', ['/c', cmd], { cwd: DEST, env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${HEAP}`, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  // two cores only, like the droplet (children inherit the affinity)
  spawnSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${proc.pid}).ProcessorAffinity = 5`]);
  let out = '';
  proc.stdout.on('data', (d) => (out += d));
  proc.stderr.on('data', (d) => (out += d));
  let peak = 0, phase = 'npm ci';
  const peaks = { 'npm ci': 0, 'next build': 0 };
  const phaseStart = { 'npm ci': Date.now() };
  const phaseEnd = {};
  const t = setInterval(async () => {
    const mb = await sampleTreeMB(proc.pid);
    if (mb > peak) peak = mb;
    if (phase === 'npm ci' && /Next.js d|Creating an optimized production build|Turbopack/i.test(out)) { phaseEnd['npm ci'] = Date.now(); phase = 'next build'; phaseStart['next build'] = Date.now(); }
    if (mb > peaks[phase]) peaks[phase] = mb;
  }, 2500);
  const code = await new Promise((r) => proc.on('exit', r));
  clearInterval(t);
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  const ok = code === 0 && fs.existsSync(path.join(DEST, '.next', 'BUILD_ID'));
  console.log(out.split('\n').slice(-14).join('\n'));
  console.log(`\nCLEAN BUILD ${ok ? 'OK' : 'FAILED'} (exit ${code}) in ${secs}s on 2 cores, heap cap ${HEAP} MB, peak memory of the whole process tree: ${peak} MB`);
  process.exit(ok ? 0 : 1);
})();
