import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export default fp(async (app) => {
  const prisma = new PrismaClient();
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
