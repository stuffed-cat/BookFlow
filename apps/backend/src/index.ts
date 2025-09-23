import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import httpProxy from '@fastify/http-proxy';

dotenv.config();

// Config & Flags
type MigrationFlags = {
    books: boolean;
    pages: boolean;
    comments: boolean;
};

const flags: MigrationFlags = {
    books: process.env.FLAG_BOOKS ? process.env.FLAG_BOOKS === 'true' : true,
    pages: process.env.FLAG_PAGES === 'true',
    comments: process.env.FLAG_COMMENTS === 'true',
};

const LEGACY_BASE = process.env.LEGACY_BASE_URL ?? 'http://localhost:8081'; // 假设外部 PHP BookStack 端口

const app: FastifyInstance = Fastify({ logger: true });
await app.register(cors, { origin: true });

// Prisma
const prisma = new PrismaClient();

// Health
app.get('/health', async () => ({ status: 'ok', flags }));

// Admin flag endpoints (简单版，未鉴权，后续接 JWT)
app.get('/admin/flags', async () => flags);
app.post('/admin/flags', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as Partial<MigrationFlags>;
    if (typeof body.books === 'boolean') flags.books = body.books;
    if (typeof body.pages === 'boolean') flags.pages = body.pages;
    if (typeof body.comments === 'boolean') flags.comments = body.comments;
    return reply.send(flags);
});

// Books module - migrated example
app.register(async (r) => {
    // List books
    r.get('/books', async () => prisma.book.findMany());

    // Create book
    r.post('/books', async (req: FastifyRequest, reply: FastifyReply) => {
        const body = (req.body ?? {}) as { title?: string; author?: string; ownerId?: number };
        if (!body.title || !body.author || !body.ownerId) {
            return reply.code(400).send({ error: 'title, author, ownerId are required' });
        }
        const created = await prisma.book.create({
            data: { title: body.title, author: body.author, ownerId: Number(body.ownerId) },
        });
        return reply.code(201).send(created);
    });
});

// Proxy plugin (mounted at /legacy, rewritten to /)
await app.register(httpProxy, {
    upstream: LEGACY_BASE,
    prefix: '/legacy',
    rewritePrefix: '/',
    http2: false,
    replyOptions: { rewriteHeaders: (headers) => headers },
});

// Global dispatch strategy: If module not migrated, forward to legacy via redirect
app.addHook('onRequest', async (req, reply) => {
    const url = req.url;
    if (!flags.books && (url === '/books' || url.startsWith('/books/'))) {
        return reply.redirect(307, `/legacy${url}`);
    }
    if (!flags.pages && (url === '/pages' || url.startsWith('/pages/'))) {
        return reply.redirect(307, `/legacy${url}`);
    }
});

// Example unified auth placeholder
app.post('/auth/login', async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
app
    .listen({ port, host: '0.0.0.0' })
    .then(() => console.log(`Backend listening on http://localhost:${port}`))
    .catch((err: unknown) => {
        app.log.error(err);
        process.exit(1);
    });
