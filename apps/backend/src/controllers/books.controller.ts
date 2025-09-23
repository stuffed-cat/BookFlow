import type { FastifyRequest, FastifyReply } from 'fastify';

export class BooksController {
  static list = async (req: FastifyRequest, reply: FastifyReply) => {
    const items = await req.server.prisma.book.findMany();
    return reply.send(items);
  };

  static create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as { title?: string; author?: string; ownerId?: number };
    if (!body.title || !body.author || !body.ownerId) {
      return reply.code(400).send({ error: 'title, author, ownerId are required' });
    }
    const created = await req.server.prisma.book.create({
      data: { title: body.title, author: body.author, ownerId: Number(body.ownerId) },
    });
    return reply.code(201).send(created);
  };
}
