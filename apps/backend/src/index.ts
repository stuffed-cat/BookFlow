import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

const prisma = new PrismaClient();

app.get('/health', async () => ({ status: 'ok' }));

app.get('/books', async () => {
    return prisma.book.findMany();
});

app.post('/books', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as { title?: string; author?: string; ownerId?: number };
    if (!body.title || !body.author || !body.ownerId) {
        return reply.code(400).send({ error: 'title, author, ownerId are required' });
    }
    const created = await prisma.book.create({
        data: { title: body.title, author: body.author, ownerId: Number(body.ownerId) },
    });
    return reply.code(201).send(created);
});

const port = Number(process.env.PORT ?? 3001);
app
    .listen({ port, host: '0.0.0.0' })
    .then(() => console.log(`Backend listening on http://localhost:${port}`))
    .catch((err: unknown) => {
        app.log.error(err);
        process.exit(1);
    });
