import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createMissingEnvPrismaStub(): PrismaClient {
  const throwMissingEnv = () => {
    throw new Error('DATABASE_URL is not set. Configure it in your deployment environment.');
  };

  const handler: ProxyHandler<(...args: unknown[]) => unknown> = {
    get() {
      return new Proxy(throwMissingEnv, handler);
    },
    apply() {
      throwMissingEnv();
    },
    construct() {
      throwMissingEnv();
      return {};
    },
  };

  return new Proxy(throwMissingEnv, handler) as unknown as PrismaClient;
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    return createMissingEnvPrismaStub();
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
