import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { AdminController } from '../controllers/admin.controller';

export default fp(async (app: FastifyInstance) => {
  app.get('/admin/flags', AdminController.getFlags);
  app.post('/admin/flags', AdminController.setFlags);
});
