import type { PrismaClient } from '@prisma/client';
import type { AppConfig, MigrationFlags } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    config: AppConfig;
    flags: MigrationFlags;
  }
}

export { };
