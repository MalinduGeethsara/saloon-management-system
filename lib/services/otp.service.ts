import crypto from 'crypto';
import { db } from '../db';
import type { OtpPurpose } from '@prisma/client';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const VERIFIED_WINDOW_MS = 10 * 60 * 1000; // how long a consumed OTP counts as "recently verified"

function hashCode(identifier: string, purpose: OtpPurpose, code: string): string {
  const secret = process.env.SESSION_SECRET || 'a-very-secret-default-key-for-dev';
  return crypto.createHmac('sha256', secret).update(`${identifier}:${purpose}:${code}`).digest('hex');
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function issueOtp(identifier: string, purpose: OtpPurpose) {
  // Only one active code per identifier+purpose at a time
  await db.otpCode.deleteMany({ where: { identifier, purpose, consumedAt: null } });

  const code = generateCode();
  await db.otpCode.create({
    data: {
      identifier,
      purpose,
      codeHash: hashCode(identifier, purpose, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  // Opportunistic cleanup of long-expired rows for this identifier
  db.otpCode.deleteMany({
    where: { identifier, expiresAt: { lt: new Date(Date.now() - OTP_TTL_MS) } },
  }).catch(() => {});

  return code;
}

export async function verifyOtp(identifier: string, purpose: OtpPurpose, submittedCode: string) {
  const record = await db.otpCode.findFirst({
    where: { identifier, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return { success: false, reason: 'not_found' as const };
  if (record.expiresAt < new Date()) return { success: false, reason: 'expired' as const };
  if (record.attempts >= MAX_ATTEMPTS) return { success: false, reason: 'too_many_attempts' as const };

  const expectedHash = Buffer.from(hashCode(identifier, purpose, submittedCode));
  const actualHash = Buffer.from(record.codeHash);

  const matches = expectedHash.length === actualHash.length && crypto.timingSafeEqual(expectedHash, actualHash);

  if (!matches) {
    await db.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { success: false, reason: 'mismatch' as const };
  }

  await db.otpCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
  return { success: true as const };
}

// Used by registration/password-reset endpoints to confirm the OTP step actually happened server-side
export async function wasRecentlyVerified(identifier: string, purpose: OtpPurpose) {
  const record = await db.otpCode.findFirst({
    where: {
      identifier,
      purpose,
      consumedAt: { gte: new Date(Date.now() - VERIFIED_WINDOW_MS) },
    },
    orderBy: { consumedAt: 'desc' },
  });
  return !!record;
}
