import fp from 'fastify-plugin';
import { loadConfig } from '../config';

export default fp(async (app) => {
  const cfg = loadConfig();
  app.decorate('config', cfg);
});
