import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import replyFrom from '@fastify/reply-from';
import type { AppConfig } from '../../config.js';

/**
 * PluginManager 负责应用级插件的注册与底层依赖的初始化。
 * - 注册 CORS、反向代理支持
 * - 初始化 Prisma 连接（强制要求存在 DATABASE_URL）
 */
export class PluginManager {
  constructor(private readonly app: FastifyInstance, private readonly cfg: AppConfig) {}

  /**
   * 注册所有必须的插件，并建立数据库连接。
   * 若缺少 DATABASE_URL 或连接失败，将抛出异常以阻止应用继续启动。
   */
  public async setup() {
    // CORS
    await this.app.register(cors, { origin: this.cfg.corsOrigin ?? true });

    // reply-from（用于代理下游 BookStack）
    await this.app.register(replyFrom, {});

    // 强制要求数据库存在且可连接；否则直接崩溃
    if (!this.cfg.databaseUrl) {
      this.app.log.error('DATABASE_URL not set; exit.');
      throw new Error('DATABASE_URL is required');
    }

    // Prisma 插件（定义在项目 src/plugins/prisma.ts）
    const { default: prismaPlugin } = await import('../../plugins/prisma.js');
    await this.app.register(prismaPlugin);

    // 主动建立连接，确保数据库可用
    await (this.app as any).prisma.$connect();
    this.app.log.info('Prisma connected, database features enabled');
  }
}
