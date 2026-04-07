import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    return new Proxy(
      {},
      {
        get() {
          throw new Error('DATABASE_URL is not set. Configure it in your deployment environment.');
        },
      },
    ) as PrismaClient;
  }

  return new PrismaClient({
    log: ['warn', 'error'],
  });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
}
