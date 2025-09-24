import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * ErrorHandler 负责全局错误映射与响应格式化。
 */
export class ErrorHandler {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * 注册 Fastify 全局错误处理。
   * - 将上游连接失败类错误映射为 502 Bad Gateway
   * - 其余错误使用默认的 statusCode 或 500
   */
  public register() {
    this.app.setErrorHandler((err: FastifyError & { code?: string; statusCode?: number }, _req: FastifyRequest, reply: FastifyReply) => {
      const code = err?.code;
      if (code === 'FST_REPLY_FROM_INTERNAL_SERVER_ERROR' || code === 'ECONNREFUSED') {
        return reply.code(502).send({ error: 'Bad Gateway', message: 'Upstream unreachable', details: code });
      }
      return reply.code(err.statusCode ?? 500).send({ error: 'Internal Server Error' });
    });
  }
}
