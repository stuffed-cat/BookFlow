import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfig } from '../../config.js';

/**
 * Router 负责所有 HTTP 路由的注册。
 * 目前包含：
 * - /health 数据库健康检查
 * - /books 示例列表接口
 * - 通配符代理到 BookStack（仅业务第一阶段）
 */
export class Router {
  constructor(private readonly app: FastifyInstance, private readonly cfg: AppConfig) {}

  public register() {
    // 健康检查（数据库）
    this.app.get('/health', async (_req: FastifyRequest, reply: FastifyReply) => {
      try {
        await (this.app as any).prisma.$queryRaw`SELECT 1`;
        return reply.send({ ok: true, db: 'up' });
      } catch (e) {
        return reply.code(503).send({ ok: false, db: 'down', error: (e as Error).message });
      }
    });

    // 示例 API：便于验证 DB 与 Prisma 是否工作
    this.app.get('/books', async (_req: FastifyRequest, reply: FastifyReply) => {
      const items = await (this.app as any).prisma.book.findMany({ take: 20, orderBy: { id: 'desc' } });
      return reply.send(items);
    });

    // 最后一条通配符代理（排除 OPTIONS，交由 @fastify/cors 处理预检以避免重复注册）
    this.app.route({
      method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
      url: '/*',
      handler: async (req, reply) => reply.from(`${this.cfg.bookstackBaseUrl}${req.url}`),
    });
  }
}
