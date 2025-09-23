import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { HealthController } from '../controllers/health.controller';

export default fp(async (app: FastifyInstance) => {
  app.get('/health', HealthController.status);
});
