const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { TEST_PASSWORD } = require('./config');

const db = new PrismaClient();

function hashOtpCode(identifier, purpose, code) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not loaded — check helpers/config.js path to ../../.env');
  return crypto.createHmac('sha256', secret).update(`${identifier}:${purpose}:${code}`).digest('hex');
}

// The app hashes OTP codes with HMAC before storing them (see lib/services/otp.service.ts) — by
// design, there is no way to recover a code that was actually delivered by SMS/email. For
// flows that must be automated deterministically, we mint our own OTP record the same way the
// server does and return the plaintext code directly, instead of reading a real inbox.
async function issueTestOtp(identifier, purpose) {
  await db.otpCode.deleteMany({ where: { identifier, purpose, consumedAt: null } });
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await db.otpCode.create({
    data: {
      identifier,
      purpose,
      codeHash: hashOtpCode(identifier, purpose, code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
  return code;
}

async function createTestUser({ email, name, role, phone }) {
  const password = await bcrypt.hash(TEST_PASSWORD, 10);
  return db.user.create({ data: { email, name, role, password, phone: phone || null } });
}

async function findFirstShop() {
  return db.shop.findFirst();
}

async function findFirstService() {
  return db.service.findFirst({ where: { status: 'Active' } });
}

// Deletes every record this suite could plausibly have created, matched by the `sel_` /
// `SELENIUM_RUN_` naming convention used throughout — safe to run even if a previous run crashed
// partway through and left orphans.
async function cleanupAll() {
  const userWhere = {
    OR: [
      { email: { contains: '@test.local' } },
      { email: { contains: 'selenium_walkin_' } },
      { name: { startsWith: 'Selenium' } },
    ],
  };
  const users = await db.user.findMany({ where: userWhere, select: { id: true } });
  const userIds = users.map((u) => u.id);

  if (userIds.length) {
    await db.payment.deleteMany({ where: { OR: [{ customerId: { in: userIds } }, { barberId: { in: userIds } }] } });
    await db.booking.deleteMany({ where: { OR: [{ customerId: { in: userIds } }, { barberId: { in: userIds } }] } });
    await db.attendance.deleteMany({ where: { userId: { in: userIds } } });
    await db.staffPermission.deleteMany({ where: { userId: { in: userIds } } });
    await db.commission.deleteMany({ where: { barberId: { in: userIds } } }).catch(() => {});
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }

  await db.product.deleteMany({ where: { name: { startsWith: 'Selenium' } } });
  await db.service.deleteMany({ where: { name: { startsWith: 'Selenium' } } });
  await db.shop.deleteMany({ where: { name: { startsWith: 'Selenium' } } });
  await db.otpCode.deleteMany({ where: { identifier: { contains: '@test.local' } } });

  return { deletedUsers: userIds.length };
}

module.exports = { db, issueTestOtp, createTestUser, findFirstShop, findFirstService, cleanupAll };
