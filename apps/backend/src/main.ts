import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import replyFrom from '@fastify/reply-from';
import { AppConfig, loadConfig } from './config.js';

export class BookFlowApp {
    private app: FastifyInstance;
    private cfg: AppConfig;

    constructor(cfg?: AppConfig) {
        this.cfg = cfg ?? loadConfig();
        this.app = Fastify({ logger: true });
    }

    private async registerPlugins() {
        await this.app.register(cors, { origin: this.cfg.corsOrigin ?? true });
        await this.app.register(replyFrom, {});
        // 强制要求数据库存在且可连接；否则直接崩溃
        if (!this.cfg.databaseUrl) {
            this.app.log.error('DATABASE_URL not set; exit.');
            throw new Error('DATABASE_URL is required');
        }

    const { default: prismaPlugin } = await import('./plugins/prisma.js');
    await this.app.register(prismaPlugin);
        await (this.app as any).prisma.$connect();
        this.app.log.info('Prisma connected, database features enabled');

        // 健康检查（数据库）
        this.app.get('/health', async (_req, reply) => {
            try {
                await (this.app as any).prisma.$queryRaw`SELECT 1`;
                return reply.send({ ok: true, db: 'up' });
            } catch (e) {
                return reply.code(503).send({ ok: false, db: 'down', error: (e as Error).message });
            }
        });

        // 示例 API：仅在连接成功时暴露（便于验证）
        this.app.get('/books', async (_req, reply) => {
            const items = await (this.app as any).prisma.book.findMany({ take: 20, orderBy: { id: 'desc' } });
            return reply.send(items);
        });
    }

    public async init() {
        await this.registerPlugins();
        // 一阶段仅代理：不注册本地 books 路由

        // 最后一条通配符代理（排除 OPTIONS，交由 @fastify/cors 处理预检以避免重复注册）
        this.app.route({
            method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
            url: '/*',
            handler: async (req, reply) => reply.from(`${this.cfg.bookstackBaseUrl}${req.url}`),
        });

        // 统一错误处理：将上游连接失败类错误映射为 502 Bad Gateway
        this.app.setErrorHandler((err, _req, reply) => {
            const code = (err as any)?.code;
            if (code === 'FST_REPLY_FROM_INTERNAL_SERVER_ERROR' || code === 'ECONNREFUSED') {
                return reply.code(502).send({ error: 'Bad Gateway', message: 'Upstream unreachable', details: code });
            }
            return reply.code((err as any).statusCode ?? 500).send({ error: 'Internal Server Error' });
        });
    }

    public async listen() {
        const port = this.cfg.port;
        await this.app
            .listen({ port, host: '0.0.0.0' })
            .then(() => this.app.log.info(`Backend listening on http://localhost:${port}`));
    }

    public async close() {
        try {
            await this.app.close();
        } finally {
            // prisma disconnected via onClose hook
        }
    }
}

// Bootstrap when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const app = new BookFlowApp();
    let closing = false;
    const shutdown = async (signal: string) => {
        if (closing) return; closing = true;
        app['app'].log.info({ signal }, 'Shutting down');
        await app.close();
        process.exit(0);
    };
    process.once('SIGINT', () => void shutdown('SIGINT'));
    process.once('SIGTERM', () => void shutdown('SIGTERM'));
    app
        .init()
        .then(() => app.listen())
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err);
            process.exit(1);
        });
}
