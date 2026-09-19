// Shared QA harness: isolated DB + production server + HTTP client + reporting.
//
// Nothing here touches the real database or the real SMS/email/payment gateways:
//   - DATABASE_URL is derived from .env but pointed at a separate `saloon_qa` database
//   - SMS/email are intercepted by lib/mock-net.js (recorded to a JSONL log)
//   - PayHere/session/device secrets are synthetic QA values
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const QA_DIR = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(QA_DIR, 'results');
fs.mkdirSync(RESULTS_DIR, { recursive: true });

const QA_DB = 'saloon_qa';
const PORT = Number(process.env.QA_PORT || 47321);
const BASE = `http://localhost:${PORT}`;
const NET_LOG = path.join(RESULTS_DIR, 'net.jsonl');
const NET_MODE_FILE = path.join(RESULTS_DIR, 'net-mode.txt');

// Synthetic secrets: the QA server never needs the real ones
const QA_SECRETS = {
  SESSION_SECRET: 'qa-session-secret-' + 'x'.repeat(40),
  PAYHERE_MERCHANT_ID: '1200000',
  PAYHERE_MERCHANT_SECRET: 'qa-payhere-merchant-secret',
  PAYHERE_MODE: 'sandbox',
  FINGERPRINT_DEVICE_KEY: 'qa-fingerprint-device-key-0123456789',
};

function readDotEnv() {
  const out = {};
  const text = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return out;
}

function qaDatabaseUrl() {
  const url = new URL(readDotEnv().DATABASE_URL);
  if (url.pathname.replace('/', '') === QA_DB) throw new Error('.env already points at the QA database?!');
  url.pathname = '/' + QA_DB;
  return url.toString();
}

function serverEnv(extra = {}) {
  return {
    ...process.env,
    ...QA_SECRETS,
    DATABASE_URL: qaDatabaseUrl(),
    PORT: String(PORT),
    // gateways are mocked, but keep the values non-empty so the "not configured" branches are not the ones exercised
    NOTIFYLK_USER_ID: 'qa-user',
    NOTIFYLK_API_KEY: 'qa-key',
    NOTIFYLK_SENDER_ID: 'Mr Polaa',
    RESEND_API_KEY: 're_qa_mock',
    RESEND_FROM_EMAIL: 'MR POLAA <bookings@mr-polaa.com>',
    STAFF_SMS_EXTRA_NUMBERS: '0770000001',
    QA_NET_LOG: NET_LOG,
    QA_NET_MODE_FILE: NET_MODE_FILE,
    NODE_OPTIONS: `--require ${path.join(QA_DIR, 'lib', 'mock-net.js').replace(/\\/g, '/')} ${process.env.QA_NODE_OPTIONS || ''}`.trim(),
    ...extra,
  };
}

// ── database ────────────────────────────────────────────────────────────────

// Fresh QA database with InnoDB tables and enforced foreign keys, like the production MySQL 8.
// (A WAMP install defaults to MyISAM, which has no transactions, no row locks and ignores foreign
// keys, so `prisma db push` there would build a database that behaves nothing like production.)
async function resetDatabase() {
  const { PrismaClient } = require(path.join(ROOT, 'node_modules', '@prisma', 'client'));
  const adminUrl = new URL(qaDatabaseUrl());
  adminUrl.pathname = '/mysql';
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl.toString() } } });
  await admin.$executeRawUnsafe('DROP DATABASE IF EXISTS `' + QA_DB + '`');
  await admin.$executeRawUnsafe('CREATE DATABASE `' + QA_DB + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await admin.$disconnect();

  const diff = spawnSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: ROOT, shell: true, encoding: 'utf8',
  });
  if (diff.status !== 0) throw new Error('prisma migrate diff failed:\n' + diff.stdout + diff.stderr);
  const statements = diff.stdout.replace(/^--.*$/gm, '').split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);

  const db = new PrismaClient({ datasources: { db: { url: qaDatabaseUrl() } } });
  // one interactive transaction = one connection, so the session setting applies to every statement
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET SESSION default_storage_engine = InnoDB');
    for (const statement of statements) await tx.$executeRawUnsafe(statement);
  }, { timeout: 60000, maxWait: 10000 });
  const engines = await db.$queryRaw`SELECT DISTINCT ENGINE e FROM information_schema.TABLES WHERE TABLE_SCHEMA = ${QA_DB}`;
  const fkCount = await db.$queryRaw`SELECT COUNT(*) n FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ${QA_DB}`;
  await db.$disconnect();
  if (engines.length !== 1 || engines[0].e !== 'InnoDB' || Number(fkCount[0].n) < 10) {
    throw new Error(`QA database is not InnoDB with foreign keys (engines: ${JSON.stringify(engines)}, FKs: ${fkCount[0].n})`);
  }
}

function createOwner({ email, name, password }) {
  const env = { ...process.env, DATABASE_URL: qaDatabaseUrl(), OWNER_EMAIL: email, OWNER_NAME: name, OWNER_PASSWORD: password, OWNER_PHONE: '', ADMIN_EMAIL: '', ADMIN_NAME: '', ADMIN_PASSWORD: '', ADMIN_PHONE: '', NO_FORCE_PASSWORD_CHANGE: '1' };
  const r = spawnSync('node', ['prisma/create-owner.js'], { cwd: ROOT, env, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('create-owner failed:\n' + r.stdout + r.stderr);
}

// Direct DB access for assertions (read/verify) and fixtures the UI can't create (e.g. the ADMIN role)
let _prisma;
function prisma() {
  if (!_prisma) {
    const { PrismaClient } = require(path.join(ROOT, 'node_modules', '@prisma', 'client'));
    _prisma = new PrismaClient({ datasources: { db: { url: qaDatabaseUrl() } } });
  }
  return _prisma;
}
async function closeDb() { if (_prisma) await _prisma.$disconnect(); _prisma = null; }

// ── server ──────────────────────────────────────────────────────────────────

let serverProc = null;
let serverLog = null;

async function startServer(extraEnv = {}, logName = 'server.log') {
  const logPath = path.join(RESULTS_DIR, logName);
  serverLog = fs.openSync(logPath, 'w');
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const proc = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
    cwd: ROOT, env: serverEnv(extraEnv), stdio: ['ignore', serverLog, serverLog], windowsHide: true,
  });
  serverProc = proc;
  proc.on('exit', (code) => { proc.exited = code ?? 'signal'; });
  for (let i = 0; i < 90; i++) {
    if (serverProc.exited !== undefined) throw new Error('server exited early, see ' + logPath);
    try { const r = await fetch(BASE + '/api/v1/services'); if (r.status) return serverProc.pid; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('server did not start in 90s, see ' + logPath);
}

function stopServer() {
  if (!serverProc) return;
  if (serverProc.exited === undefined) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/F', '/T', '/PID', String(serverProc.pid)], { stdio: 'ignore' });
    else serverProc.kill('SIGKILL');
  }
  serverProc = null;
}
function serverPid() { return serverProc?.pid; }

function setNetMode(mode) { fs.writeFileSync(NET_MODE_FILE, mode); }
function clearNetLog() { try { fs.writeFileSync(NET_LOG, ''); } catch {} }
function netLog() {
  try {
    return fs.readFileSync(NET_LOG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch { return []; }
}

// ── HTTP client ─────────────────────────────────────────────────────────────

const timings = []; // {label, ms, status}
const leaks = []; // responses that contained a bcrypt password hash (must stay empty)
const HASH_RE = /\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}/;

class Client {
  constructor(label, ip) {
    this.label = label;
    this.ip = ip || `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
    this.jar = new Map();
  }

  cookieHeader() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '); }

  absorb(res) {
    const list = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of list) {
      const [pair, ...attrs] = c.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const maxAge = attrs.map((a) => a.trim().toLowerCase()).find((a) => a.startsWith('max-age='));
      const expires = attrs.map((a) => a.trim()).find((a) => a.toLowerCase().startsWith('expires='));
      const expired = (maxAge && Number(maxAge.split('=')[1]) <= 0) || (expires && new Date(expires.split('=')[1]).getTime() < Date.now()) || value === '';
      if (expired) this.jar.delete(name); else this.jar.set(name, value);
    }
  }

  async req(method, url, { json, form, body, headers = {}, timeoutMs = 30000, label } = {}) {
    const h = { 'cf-connecting-ip': this.ip, ...headers };
    const cookie = this.cookieHeader();
    if (cookie) h.cookie = cookie;
    let payload = body;
    if (json !== undefined) { payload = JSON.stringify(json); h['content-type'] = 'application/json'; }
    if (form) { payload = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; }
    const started = process.hrtime.bigint();
    let res;
    try {
      res = await fetch(url.startsWith('http') ? url : BASE + url, { method, headers: h, body: payload, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      timings.push({ label: label || `${method} ${url}`, ms: Number(process.hrtime.bigint() - started) / 1e6, status: 0 });
      return { status: 0, ok: false, text: String(err), json: null, headers: new Headers(), error: err };
    }
    const text = await res.text();
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    timings.push({ label: label || `${method} ${url.split('?')[0]}`, ms, status: res.status });
    this.absorb(res);
    if (HASH_RE.test(text)) leaks.push(`${method} ${url.split('?')[0]} as ${this.label}`);
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, text, json: parsed, headers: res.headers, ms };
  }

  get(url, opts) { return this.req('GET', url, opts); }
  post(url, json, opts) { return this.req('POST', url, { json, ...opts }); }
  put(url, json, opts) { return this.req('PUT', url, { json, ...opts }); }
  del(url, json, opts) { return this.req('DELETE', url, { json, ...opts }); }

  async action(name, args = [], opts = {}) {
    const id = actionId(name);
    if (!id) throw new Error('unknown server action ' + name);
    const r = await this.req('POST', opts.page || actionPage(name), {
      body: JSON.stringify(args),
      headers: { 'next-action': id, 'content-type': 'text/plain;charset=UTF-8', accept: 'text/x-component' },
      label: 'action ' + name,
      timeoutMs: opts.timeoutMs,
    });
    r.value = parseFlight(r.text);
    return r;
  }
}

let _manifest;
function actionId(name) {
  if (!_manifest) {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, '.next', 'server', 'server-reference-manifest.json'), 'utf8'));
    _manifest = {};
    for (const [id, info] of Object.entries(m.node || {})) _manifest[info.exportedName] = id;
  }
  return _manifest[name];
}
// A server action is only registered under the pages that use it. Post to one of those pages (like
// the real UI does): "/(dashboard)/owner/payments/page" -> "/owner/payments".
function actionPage(name) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, '.next', 'server', 'server-reference-manifest.json'), 'utf8'));
  for (const info of Object.values(m.node || {})) {
    if (info.exportedName !== name) continue;
    const pages = Object.keys(info.workers).map((w) => w.replace(/^app/, '').replace(/\/page$/, '').replace(/\/\([^)]*\)/g, '').replace(/\[[^\]]+\]/g, '00000000-0000-0000-0000-000000000000') || '/');
    const isPublic = (p) => !/^\/(owner|admin|barber|manager|booking|profile)/.test(p);
    return pages.find((p) => isPublic(p) && !p.includes('0000-0000')) || pages.find((p) => !p.includes('0000-0000')) || pages[0] || '/';
  }
  return '/';
}
function knownActions() { actionId('x'); return Object.keys(_manifest); }

// React Flight response: lines like `0:{"a":"$@1",...}` then `1:<value>`. Return the resolved value.
function parseFlight(text) {
  const lines = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([0-9a-f]+):(.*)$/);
    if (m) lines[m[1]] = m[2];
  }
  try {
    const root = JSON.parse(lines['0'] || 'null');
    const ref = typeof root?.a === 'string' ? root.a.match(/^\$@([0-9a-f]+)$/) : null;
    const raw = ref ? lines[ref[1]] : lines['1'];
    return raw === undefined ? undefined : JSON.parse(raw);
  } catch { return undefined; }
}

// ── reporting ───────────────────────────────────────────────────────────────

class Report {
  constructor(name) { this.name = name; this.results = []; this.section = ''; this.startedAt = Date.now(); }
  sec(title) { this.section = title; console.log(`\n── ${title}`); }
  check(name, cond, detail = '') {
    const ok = !!cond;
    this.results.push({ section: this.section, name, ok, detail: ok ? '' : String(detail).slice(0, 400) });
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : '\n        → ' + String(detail).slice(0, 300)}`);
    return ok;
  }
  note(name, detail) {
    this.results.push({ section: this.section, name, ok: true, note: true, detail: String(detail).slice(0, 400) });
    console.log(`  NOTE  ${name}: ${detail}`);
  }
  summary() {
    const checks = this.results.filter((r) => !r.note);
    const failed = checks.filter((r) => !r.ok);
    console.log(`\n${this.name}: ${checks.length - failed.length}/${checks.length} passed` + (failed.length ? `, ${failed.length} FAILED` : ''));
    for (const f of failed) console.log(`   ✗ [${f.section}] ${f.name}${f.detail ? ' — ' + f.detail : ''}`);
    fs.writeFileSync(path.join(RESULTS_DIR, `${this.name}.json`), JSON.stringify({ name: this.name, finishedAt: new Date().toISOString(), results: this.results }, null, 2));
    return failed.length;
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}
function timingSummary(filter = () => true) {
  const groups = {};
  for (const t of timings.filter(filter)) (groups[t.label] ||= []).push(t);
  return Object.entries(groups).map(([label, arr]) => {
    const ms = arr.map((a) => a.ms).sort((a, b) => a - b);
    const errors = arr.filter((a) => a.status === 0 || a.status >= 500).length;
    return { label, n: arr.length, p50: Math.round(percentile(ms, 50)), p95: Math.round(percentile(ms, 95)), max: Math.round(ms[ms.length - 1]), errors5xx: errors };
  }).sort((a, b) => b.p95 - a.p95);
}

// ── helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => crypto.randomBytes(4).toString('hex');

// Next weekday date (YYYY-MM-DD) at least `daysAhead` days out, skipping Sunday (salons often closed)
function futureDate(daysAhead = 2) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// PayHere server-to-server notification with a valid signature (uses the QA merchant secret)
function payhereNotify(orderId, amount, statusCode = '2', overrides = {}) {
  const merchantId = QA_SECRETS.PAYHERE_MERCHANT_ID;
  const md5 = (s) => crypto.createHash('md5').update(s).digest('hex').toUpperCase();
  const amt = Number(amount).toFixed(2);
  const sig = md5(`${merchantId}${orderId}${amt}LKR${statusCode}${md5(QA_SECRETS.PAYHERE_MERCHANT_SECRET)}`);
  return {
    merchant_id: merchantId, order_id: orderId, payment_id: 'QA' + uid(), payhere_amount: amt, payhere_currency: 'LKR',
    status_code: statusCode, md5sig: sig, method: 'VISA', status_message: 'Successfully received the payment', ...overrides,
  };
}

function extractOtp(html) {
  const m = String(html).match(/\b(\d{6})\b/g);
  return m ? m[m.length - 1] : null;
}

module.exports = {
  ROOT, QA_DIR, RESULTS_DIR, BASE, PORT, QA_SECRETS, QA_DB,
  qaDatabaseUrl, resetDatabase, createOwner, prisma, closeDb,
  startServer, stopServer, serverPid, setNetMode, clearNetLog, netLog,
  Client, actionId, knownActions, parseFlight, Report, timings, leaks, timingSummary,
  sleep, uid, futureDate, payhereNotify, extractOtp, readDotEnv,
};
