import fp from 'fastify-plugin';
import type { MigrationFlags } from '../config';

export default fp(async (app) => {
  const cfgFlags = app.config.initialFlags;
  const flags: MigrationFlags = { ...cfgFlags };
  app.decorate('flags', flags);
});
