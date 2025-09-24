import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import replyFrom from '@fastify/reply-from';
import { AppConfig, loadConfig } from './config';
import configPlugin from './plugins/config';
import prismaPlugin from './plugins/prisma';

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
        await this.app.register(configPlugin);
        await this.app.register(prismaPlugin);
    }
    
    public async init() {
        await this.registerPlugins();
        // 一阶段仅代理：不注册本地 books 路由

        // 最后一条通配符路由：将未被以上路由匹配的请求全部代理到 BookStack
        this.app.all('/*', async (req, reply) => {
            return reply.from(`${this.cfg.bookstackBaseUrl}${req.url}`);
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
