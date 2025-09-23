import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import replyFrom from '@fastify/reply-from';
import { AppConfig, MigrationFlags, loadConfig } from './config';
import configPlugin from './plugins/config';
import prismaPlugin from './plugins/prisma';
import flagsPlugin from './plugins/flags';
import dispatchPlugin from './plugins/dispatch';
import healthRoutes from './routes/health.routes';
import adminRoutes from './routes/admin.routes';
import booksRoutes from './routes/books.routes';

export class BookFlowApp {
    private app: FastifyInstance;
    private flags: MigrationFlags;
    private cfg: AppConfig;

    constructor(cfg?: AppConfig) {
        this.cfg = cfg ?? loadConfig();
        this.flags = { ...this.cfg.initialFlags };
        this.app = Fastify({ logger: true });
    }

    private async registerPlugins() {
        await this.app.register(cors, { origin: this.cfg.corsOrigin ?? true });
        await this.app.register(replyFrom, {});
        await this.app.register(configPlugin);
        await this.app.register(prismaPlugin);
        await this.app.register(flagsPlugin);
    }

    private async registerDispatch() {
        await this.app.register(dispatchPlugin);
    }

    private async registerBooksModule() {
        await this.app.register(booksRoutes);
    }
    
    public async init() {
        await this.registerPlugins();
        await this.registerDispatch();
        await this.app.register(healthRoutes);
        await this.app.register(adminRoutes);
        await this.registerBooksModule();
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
