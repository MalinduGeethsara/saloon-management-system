// Creates the OWNER and/or ADMIN account for a fresh production database, from values in .env.
// (prisma/seed.js is for local demos: it creates demo staff/customers that share one password.)
//
//   .env:
//     OWNER_EMAIL="you@example.com"      OWNER_NAME="Your Name"      OWNER_PASSWORD="a-long-strong-password"   OWNER_PHONE="0771234567"
//     ADMIN_EMAIL="admin@example.com"    ADMIN_NAME="System Admin"   ADMIN_PASSWORD="another-long-password"    ADMIN_PHONE=""
//
//   node --env-file=.env prisma/create-owner.js
//
// - The password you put in .env is only a FIRST password: the account is locked to the "choose your own
//   password" page until they set one (set NO_FORCE_PASSWORD_CHANGE=1 to switch that off, e.g. for test data).
//
// - Each account is created only if its *_EMAIL and *_NAME are set (fill in just the ones you need).
// - *_PHONE is optional. If *_PASSWORD is omitted a random one is generated and printed once.
// - An email that already has an account is left alone (nothing is changed), so it is safe to run again,
//   for example to add one more owner: put the new person's OWNER_* values in .env and run it once more.
// - Once the accounts exist the database holds only a hash: DELETE the *_PASSWORD lines from .env afterwards,
//   so no plain-text password stays on the server.
// Run it from the project root; --env-file (Node 20.6+) supplies DATABASE_URL from .env.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Same canonical form the app stores: the bare 9-digit local number (no 0, no country code)
function normalizePhone(value) {
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('94') && digits.length > 9) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

async function createAccount(role, prefix) {
  const email = (process.env[`${prefix}_EMAIL`] || '').trim().toLowerCase();
  const name = (process.env[`${prefix}_NAME`] || '').trim();
  const rawPhone = (process.env[`${prefix}_PHONE`] || '').trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : null;

  if (!email && !name) return { skipped: true };
  if (!email || !name) {
    console.error(`${prefix}_EMAIL and ${prefix}_NAME must both be set to create the ${role}.`);
    return { failed: true };
  }
  if (phone && !/^7[0-8]\d{7}$/.test(phone)) {
    console.error(`${prefix}_PHONE is not a valid Sri Lankan mobile number.`);
    return { failed: true };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`A user with ${email} already exists (role ${existing.role}). Nothing changed.`);
    return { skipped: true };
  }
  if (phone && (await prisma.user.findUnique({ where: { phone } }))) {
    console.error(`Another account already uses that phone number (${prefix}_PHONE). ${role} not created.`);
    return { failed: true };
  }

  const generated = !process.env[`${prefix}_PASSWORD`];
  const password = process.env[`${prefix}_PASSWORD`] || crypto.randomBytes(12).toString('base64url');
  if (password.length < 10) {
    console.error(`Use a ${prefix}_PASSWORD of at least 10 characters.`);
    return { failed: true };
  }

  await prisma.user.create({
    data: { email, name, phone, role, password: await bcrypt.hash(password, 10), mustChangePassword: !process.env.NO_FORCE_PASSWORD_CHANGE },
  });

  console.log(`Created ${role}: ${email}${process.env.NO_FORCE_PASSWORD_CHANGE ? '' : ' (must choose a new password at first sign-in)'}`);
  if (generated) {
    console.log(`Generated password for ${email}: ${password}`);
    console.log('Save this now and change it after your first login - it will not be shown again.');
  }
  return { created: true, plain: !generated };
}

async function main() {
  const owner = await createAccount('OWNER', 'OWNER');
  const admin = await createAccount('ADMIN', 'ADMIN');

  if (owner.failed || admin.failed) process.exit(1);
  if (owner.skipped && admin.skipped && !owner.created && !admin.created && !process.env.OWNER_EMAIL && !process.env.ADMIN_EMAIL) {
    console.error('Nothing to do: set OWNER_EMAIL + OWNER_NAME and/or ADMIN_EMAIL + ADMIN_NAME in .env.');
    process.exit(1);
  }
  if (owner.plain || admin.plain) {
    console.log('\nNow delete the OWNER_PASSWORD / ADMIN_PASSWORD lines from .env: the accounts are saved (as hashes), and a plain-text password should not stay on disk.\nThey only work for the first sign-in anyway: it makes each person choose their own password.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
