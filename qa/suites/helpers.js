const bcrypt = require(require('path').join(require('../lib/harness').ROOT, 'node_modules', 'bcryptjs'));
const h = require('../lib/harness');

const PASSWORD = 'QaPass#12345';

// nth future date (YYYY-MM-DD) that is not a Sunday (the default shop hours close on Sundays)
function nthWeekday(n) {
  const d = new Date();
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) count++;
  }
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// The wizard offers a fixed grid of eight slots; slotTime(9) is the first, slotTime(10) the second, ...
const GRID = ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', '01:00 PM', '01:45 PM', '02:30 PM', '04:00 PM'];
function slotTime(n) {
  return GRID[(((n - 9) % 8) + 8) % 8];
}

async function waitFor(fn, { timeout = 6000, every = 100 } = {}) {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) return null;
    await h.sleep(every);
  }
}

// Read the OTP the app "sent" (captured by the mock gateway) for an email or phone identifier
async function otpFor(identifier, since = 0) {
  const isEmail = identifier.includes('@');
  const to = isEmail ? identifier.toLowerCase() : '94' + identifier.replace(/\D/g, '').replace(/^94/, '').replace(/^0/, '');
  const hit = await waitFor(() => {
    const list = h.netLog().filter((e) => e.t >= since && e.type === (isEmail ? 'email' : 'sms') && e.to === to && /verification code/i.test((e.subject || '') + (e.message || '')));
    return list.length ? list[list.length - 1] : null;
  });
  if (!hit) return null;
  const m = isEmail ? String(hit.html).match(/>\s*(\d{6})\s*</) : String(hit.message).match(/(\d{6})/);
  return m ? m[1] : null;
}

// Full customer sign-up exactly as the website does it: send code -> verify code -> register
async function registerCustomer({ name, email, phone, password = PASSWORD, ip }) {
  const c = new h.Client(name, ip);
  const identifier = email || phone;
  const since = Date.now() - 50;
  const sent = await c.post('/api/auth/send-code', { identifier, purpose: 'REGISTER' });
  if (sent.status !== 200) return { client: c, error: 'send-code ' + sent.status + ' ' + sent.text };
  const code = await otpFor(identifier, since);
  if (!code) return { client: c, error: 'no OTP captured' };
  const verified = await c.post('/api/auth/verify-code', { identifier, purpose: 'REGISTER', code });
  if (verified.status !== 200) return { client: c, error: 'verify-code ' + verified.status + ' ' + verified.text };
  const reg = await c.post('/api/auth/login', { isRegister: true, email, phone, password, name });
  if (reg.status !== 200) return { client: c, error: 'register ' + reg.status + ' ' + reg.text };
  return { client: c, reg: reg.json };
}

async function staffLogin(email, password = PASSWORD, ip) {
  const c = new h.Client(email, ip);
  const r = await c.post('/api/auth/staff-login', { email, password });
  return { client: c, res: r };
}

// Business bootstrap through the real owner APIs, starting from the empty "owner only" DB
async function bootstrapBusiness(R, ownerCreds) {
  const ctx = { PASSWORD, ownerCreds };
  const owner = await staffLogin(ownerCreds.email, ownerCreds.password);
  ctx.owner = owner.client;
  R.check('owner can log in with the create-owner.js credentials', owner.res.status === 200 && owner.res.json?.role === 'OWNER', owner.res.text);

  const mkShop = async (name, address) => {
    const r = await ctx.owner.post('/api/v1/shops', { name, address, phone: '0112345678' });
    return r.json?.shop;
  };
  ctx.shopA = await mkShop('QA Colombo', '12 Galle Road, Colombo');
  ctx.shopB = await mkShop('QA Kandy', '5 Temple Street, Kandy');
  R.check('owner creates two shops', ctx.shopA?.id && ctx.shopB?.id);

  const mkStaff = async (role, name, email, shopId, extra = {}) => {
    const r = await ctx.owner.post('/api/v1/staff', { role, name, email, shopId, password: PASSWORD, salaryType: 'Commission', baseSalary: 50000, commissionRate: 10, ...extra });
    return r.json?.user;
  };
  ctx.manager = await mkStaff('MANAGER', 'QA Manager', 'manager@qa.test', ctx.shopA?.id, { salaryType: 'Salary' });
  ctx.barbers = [];
  for (let i = 1; i <= 4; i++) {
    ctx.barbers.push(await mkStaff('BARBER', `QA Barber ${i}`, `barber${i}@qa.test`, i === 4 ? ctx.shopB?.id : ctx.shopA?.id));
  }
  R.check('owner creates a manager and four barbers', ctx.manager?.id && ctx.barbers.every((b) => b?.id));

  // ADMIN cannot be created through the UI; create one directly like the DB owner would
  const db = h.prisma();
  ctx.adminUser = await db.user.create({ data: { email: 'admin@qa.test', name: 'QA Admin', role: 'ADMIN', password: await bcrypt.hash(PASSWORD, 10) } });

  const mkService = async (name, price, duration) => (await ctx.owner.post('/api/v1/services', { name, price, duration, description: name + ' service', shopId: null })).json?.service;
  ctx.services = [await mkService('Haircut', 1500, 30), await mkService('Beard Trim', 800, 20), await mkService('Hair Colour', 6000, 90), await mkService('Facial', 3500, 45)];
  R.check('owner creates four services', ctx.services.every((s) => s?.id));

  const mkProduct = async (name, price, stock, sku) => (await ctx.owner.post('/api/v1/products', { name, price, stock, brand: 'QA', category: 'Care', sku })).json?.product;
  ctx.products = [await mkProduct('Pomade', 2500, 10, 'QA-POM'), await mkProduct('Shampoo', 1800, 3, 'QA-SHA'), await mkProduct('Beard Oil', 2200, 50, 'QA-OIL')];
  R.check('owner creates three products', ctx.products.every((p) => p?.id));

  // staff sessions
  ctx.managerC = (await staffLogin('manager@qa.test')).client;
  ctx.barberC = [];
  for (let i = 1; i <= 4; i++) ctx.barberC.push((await staffLogin(`barber${i}@qa.test`)).client);
  ctx.adminC = (await staffLogin('admin@qa.test')).client;
  return ctx;
}

module.exports = { GRID, PASSWORD, nthWeekday, slotTime, waitFor, otpFor, registerCustomer, staffLogin, bootstrapBusiness };
