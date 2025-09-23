import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MigrationFlags } from '../config';

export class AdminController {
  static getFlags = async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(req.server.flags);
  };

  static setFlags = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body ?? {}) as Partial<MigrationFlags>;
    if (typeof body.books === 'boolean') req.server.flags.books = body.books;
    if (typeof body.pages === 'boolean') req.server.flags.pages = body.pages;
    if (typeof body.comments === 'boolean') req.server.flags.comments = body.comments;
    return reply.send(req.server.flags);
  };
}
