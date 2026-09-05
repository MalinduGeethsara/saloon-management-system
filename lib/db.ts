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
 * @param callback Function containing the transaction logic using Prisma's interactive transaction client.
 * @returns The result of the callback.
 */
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return await db.$transaction(callback, {
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
    isolationLevel: 'Serializable', // Highest isolation level for strict ACID compliance
  });
}
