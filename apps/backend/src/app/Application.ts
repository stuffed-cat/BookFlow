import Fastify, { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config.js';
import { PluginManager } from './infra/PluginManager.js';
import { Router } from './http/Router.js';
import { ErrorHandler } from './http/ErrorHandler.js';

/**
 * Application 聚合根：承载 Fastify 实例、注册插件/路由/错误处理，并负责生命周期控制。
 */
export class Application {
  private readonly app: FastifyInstance;

  constructor(private readonly cfg: AppConfig) {
    this.app = Fastify({ logger: true });
  }

  /**
   * 初始化应用：
   * - 注册基础插件（CORS、reply-from、Prisma）
   * - 注册路由
   * - 注册错误处理
   */
  public async init() {
    await new PluginManager(this.app, this.cfg).setup();
    new Router(this.app, this.cfg).register();
    new ErrorHandler(this.app).register();
  }

  /** 启动 HTTP 服务 */
  public async listen() {
    const port = this.cfg.port;
    await this.app
      .listen({ port, host: '0.0.0.0' })
      .then(() => this.app.log.info(`Backend listening on http://localhost:${port}`));
  }

  /** 关闭应用（Fastify 将通过 onClose 钩子释放 Prisma） */
  public async close() {
    await this.app.close();
  }

  /** 暴露内部 Fastify，用于测试或扩展（谨慎使用） */
  public get server() {
    return this.app;
  }
}
