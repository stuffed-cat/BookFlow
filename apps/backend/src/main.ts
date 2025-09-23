import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import replyFrom from '@fastify/reply-from';
import { PrismaClient } from '@prisma/client';
import { AppConfig, MigrationFlags, loadConfig } from './config';

export class BookFlowApp {
  private app: FastifyInstance;
  private prisma: PrismaClient;
  private flags: MigrationFlags;
  private cfg: AppConfig;

  constructor(cfg?: AppConfig) {
    this.cfg = cfg ?? loadConfig();
    this.flags = { ...this.cfg.initialFlags };
    this.app = Fastify({ logger: true });
    this.prisma = new PrismaClient();
  }

  private async registerPlugins() {
    await this.app.register(cors, { origin: this.cfg.corsOrigin ?? true });
  await this.app.register(replyFrom, {});
  }

  private registerHealth() {
    this.app.get('/health', async () => ({ status: 'ok', flags: this.flags }));
  }

  private registerAdmin() {
    this.app.get('/admin/flags', async () => this.flags);
    this.app.post('/admin/flags', async (req: FastifyRequest, reply: FastifyReply) => {
      const body = (req.body ?? {}) as Partial<MigrationFlags>;
      if (typeof body.books === 'boolean') this.flags.books = body.books;
      if (typeof body.pages === 'boolean') this.flags.pages = body.pages;
      if (typeof body.comments === 'boolean') this.flags.comments = body.comments;
      return reply.send(this.flags);
    });
  }

  private registerDispatch() {
    this.app.addHook('onRequest', async (req, reply) => {
      const url = req.url;
      if (!this.flags.books && (url === '/books' || url.startsWith('/books/'))) {
        return reply.from(`${this.cfg.legacyBaseUrl}${url}`);
      }
      if (!this.flags.pages && (url === '/pages' || url.startsWith('/pages/'))) {
        return reply.from(`${this.cfg.legacyBaseUrl}${url}`);
      }
    });
  }

  private registerBooksModule() {
    this.app.get('/books', async () => this.prisma.book.findMany());
    this.app.post('/books', async (req: FastifyRequest, reply: FastifyReply) => {
      const body = (req.body ?? {}) as { title?: string; author?: string; ownerId?: number };
      if (!body.title || !body.author || !body.ownerId) {
        return reply.code(400).send({ error: 'title, author, ownerId are required' });
      }
      const created = await this.prisma.book.create({
        data: { title: body.title, author: body.author, ownerId: Number(body.ownerId) },
      });
      return reply.code(201).send(created);
    });
  }

  private registerAuthPlaceholder() {
    this.app.post('/auth/login', async () => ({ ok: true }));
  }

  public async init() {
    await this.registerPlugins();
    this.registerHealth();
    this.registerAdmin();
    this.registerDispatch();
    this.registerBooksModule();
    this.registerAuthPlaceholder();
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
      await this.prisma.$disconnect();
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
