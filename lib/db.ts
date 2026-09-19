import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

/**
 * Utility for executing complex operations in an ACID-compliant transaction.
 *
 * Serializable is the strictest level, so two transactions touching the same rows can be aborted
 * by MySQL as deadlock victims (Prisma error P2034). That is not a real failure: the whole callback
 * is simply run again (so it must keep its state inside the callback), which is what makes
 * concurrent bookings/payments resolve cleanly instead of surfacing as 500 errors.
 * @param callback Function containing the transaction logic using Prisma's interactive transaction client.
 * @returns The result of the callback.
 */
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.$transaction(callback, {
        maxWait: 5000, // default: 2000
        timeout: 10000, // default: 5000
        isolationLevel: 'Serializable', // Highest isolation level for strict ACID compliance
      });
    } catch (err: any) {
      const conflict = err?.code === 'P2034' || /deadlock|write conflict/i.test(String(err?.message || ''));
      if (!conflict || attempt >= MAX_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, 20 * attempt + Math.random() * 60));
    }
  }
}
