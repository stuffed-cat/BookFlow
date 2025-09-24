import fp from 'fastify-plugin';

export default fp(async (app) => {
  // Force binary engine and disable data proxy before importing PrismaClient
  process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
  process.env.PRISMA_CLIENT_DATAPROXY = 'false';
  process.env.PRISMA_GENERATE_DATAPROXY = 'false';

  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.DATABASE_URL;
  const prisma = new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
  });
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
