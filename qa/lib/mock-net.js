// Preloaded into the QA server with NODE_OPTIONS=--require. Intercepts the two outbound gateways
// (notify.lk SMS and Resend email), records every call to a JSONL file, and answers with a
// success response, so the QA run can verify WHAT was sent without sending anything real.
// Set the file named by QA_NET_MODE_FILE to "fail" to simulate a gateway outage.
const fs = require('fs');

const LOG = process.env.QA_NET_LOG;
const MODE_FILE = process.env.QA_NET_MODE_FILE;
const LATENCY_MS = Number(process.env.QA_NET_LATENCY_MS || 150);
const realFetch = globalThis.fetch;

function mode() {
  try { return fs.readFileSync(MODE_FILE, 'utf8').trim(); } catch { return 'ok'; }
}
function record(entry) {
  if (LOG) fs.appendFileSync(LOG, JSON.stringify({ t: Date.now(), ...entry }) + '\n');
}
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

globalThis.fetch = async function patchedFetch(input, init) {
  let url = '';
  try { url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url; } catch {}
  let host = '';
  try { host = new URL(url).host; } catch {}

  if (host === 'app.notify.lk') {
    const params = new URLSearchParams(String(init?.body || ''));
    const isStatus = url.includes('/status');
    if (!isStatus) {
      record({ type: 'sms', to: params.get('to'), sender: params.get('sender_id'), message: params.get('message'), failed: mode() === 'fail' });
    }
    await sleep(LATENCY_MS);
    if (mode() === 'fail') return json({ status: 'error', message: 'simulated outage' }, 500);
    return json({ status: 'success', data: isStatus ? { active: true, acc_balance: 999 } : 'queued' });
  }

  if (host === 'api.resend.com') {
    let body = {};
    try { body = JSON.parse(String(init?.body || '{}')); } catch {}
    record({ type: 'email', to: [].concat(body.to || []).join(','), from: body.from, subject: body.subject, html: body.html, failed: mode() === 'fail' });
    await sleep(LATENCY_MS);
    if (mode() === 'fail') return json({ name: 'application_error', message: 'simulated outage', statusCode: 500 }, 500);
    return json({ id: 'mock-' + Math.random().toString(36).slice(2) });
  }

  // Anything else must not leave the machine during QA except the local server and read-only image CDNs
  const PUBLIC_ASSET_HOSTS = ['res.cloudinary.com', 'images.unsplash.com']; // image optimizer fetches (read-only CDNs)
  if (host && !PUBLIC_ASSET_HOSTS.includes(host) && !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    record({ type: 'blocked', url });
    throw new TypeError('QA: outbound request blocked: ' + host);
  }
  return realFetch(input, init);
};
