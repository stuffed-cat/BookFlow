import { loadConfig } from './config.js';
import { Application } from './app/Application.js';

/**
 * 程序入口：仅负责装载配置与引导 Application。
 * 业务逻辑、路由、插件与错误处理均在 app/ 下的类中维护。
 */
export class BookFlowApp {
    private app: Application;

    constructor() {
        const cfg = loadConfig();
        this.app = new Application(cfg);
    }

    public async init() {
        await this.app.init();
    }

    public async listen() {
        await this.app.listen();
    }

    public async close() {
        await this.app.close();
    }
}

// Bootstrap when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const app = new BookFlowApp();
    let closing = false;
    const shutdown = async (signal: string) => {
        if (closing) return; closing = true;
        // 这里无法直接访问 fastify 实例的 logger，保持简单打印
        // eslint-disable-next-line no-console
        console.log({ signal }, 'Shutting down');
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
