// Tests prisma/create-owner.js (first OWNER / ADMIN accounts from .env values) against the QA database only.
//   node qa/create-accounts.js
const path = require('path');
const { spawnSync } = require('child_process');
const h = require('./lib/harness');
const ROOT = h.ROOT;
const bcrypt = require(path.join(ROOT, 'node_modules', 'bcryptjs'));

const run = (env) => {
  const clean = { ...process.env };
  // (Prisma also reads the project's own .env, which holds the real OWNER_*/ADMIN_* values: blank them explicitly)
  for (const k of ['OWNER_EMAIL', 'OWNER_NAME', 'OWNER_PASSWORD', 'OWNER_PHONE', 'ADMIN_EMAIL', 'ADMIN_NAME', 'ADMIN_PASSWORD', 'ADMIN_PHONE', 'NO_FORCE_PASSWORD_CHANGE']) clean[k] = '';
  const r = spawnSync('node', ['prisma/create-owner.js'], { cwd: ROOT, env: { ...clean, DATABASE_URL: h.qaDatabaseUrl(), ...env }, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout + r.stderr).trim() };
};
let failed = 0;
const check = (name, ok, detail) => { console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (ok ? '' : '\n        -> ' + detail)); if (!ok) failed++; };

(async () => {
  await h.resetDatabase();
  const db = h.prisma();

  let r = run({ OWNER_EMAIL: 'Boss@Test.LK', OWNER_NAME: 'The Boss', OWNER_PASSWORD: 'OwnerPass#12345', OWNER_PHONE: '+94 77 123 4567', ADMIN_EMAIL: 'admin@test.lk', ADMIN_NAME: 'Sys Admin', ADMIN_PASSWORD: 'AdminPass#12345' });
  const owner = await db.user.findUnique({ where: { email: 'boss@test.lk' } });
  const admin = await db.user.findUnique({ where: { email: 'admin@test.lk' } });
  check('creates the owner and the admin in one run', r.code === 0 && owner?.role === 'OWNER' && admin?.role === 'ADMIN', r.out);
  check('the phone is stored in the app\'s canonical form (771234567)', owner?.phone === '771234567', owner?.phone);
  check('passwords are stored as bcrypt hashes that match', await bcrypt.compare('OwnerPass#12345', owner.password) && await bcrypt.compare('AdminPass#12345', admin.password));
  check('accounts made from .env values must choose their own password at first sign-in', owner?.mustChangePassword === true && admin?.mustChangePassword === true, JSON.stringify([owner?.mustChangePassword, admin?.mustChangePassword]));
  check('it reminds you to delete the plain-text passwords from .env', /delete the OWNER_PASSWORD/i.test(r.out), r.out);

  r = run({ OWNER_EMAIL: 'boss@test.lk', OWNER_NAME: 'Changed', OWNER_PASSWORD: 'Different#12345' });
  const again = await db.user.findUnique({ where: { email: 'boss@test.lk' } });
  check('running again never changes an existing account', r.code === 0 && again.name === 'The Boss' && await bcrypt.compare('OwnerPass#12345', again.password) && /already exists/.test(r.out), r.out);

  r = run({ OWNER_EMAIL: 'second@test.lk', OWNER_NAME: 'Second Owner' });
  const second = await db.user.findUnique({ where: { email: 'second@test.lk' } });
  const gen = (r.out.match(/Generated password for second@test.lk: (\S+)/) || [])[1];
  check('a second owner can be added later; with no password one is generated and shown once', r.code === 0 && second?.role === 'OWNER' && gen && gen.length >= 12 && await bcrypt.compare(gen, second.password), r.out);

  r = run({ OWNER_EMAIL: 'seed@test.lk', OWNER_NAME: 'Seed Owner', OWNER_PASSWORD: 'SeedOwner#12345', NO_FORCE_PASSWORD_CHANGE: '1' });
  const seeded = await db.user.findUnique({ where: { email: 'seed@test.lk' } });
  check('NO_FORCE_PASSWORD_CHANGE=1 (for test data) creates an account without the lock', r.code === 0 && seeded?.mustChangePassword === false, r.out);

  r = run({ ADMIN_EMAIL: 'short@test.lk', ADMIN_NAME: 'Short', ADMIN_PASSWORD: 'abc' });
  check('a too-short password is refused', r.code === 1 && !(await db.user.findUnique({ where: { email: 'short@test.lk' } })), r.out);
  r = run({ OWNER_EMAIL: 'badphone@test.lk', OWNER_NAME: 'Bad Phone', OWNER_PHONE: '12345' });
  check('an invalid phone number is refused', r.code === 1 && !(await db.user.findUnique({ where: { email: 'badphone@test.lk' } })), r.out);
  r = run({ OWNER_EMAIL: 'samephone@test.lk', OWNER_NAME: 'Same Phone', OWNER_PHONE: '0771234567' });
  check('a phone number already used by another account is refused with a clear message', r.code === 1 && /already uses that phone/.test(r.out), r.out);
  r = run({ ADMIN_EMAIL: 'nameless@test.lk' });
  check('an email without a name is refused', r.code === 1 && /must both be set/.test(r.out), r.out);
  r = run({});
  check('with nothing set it says what to do', r.code === 1 && /Nothing to do/.test(r.out), r.out);

  await h.closeDb();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();
