import type { FastifyRequest, FastifyReply } from 'fastify';
import type { MigrationFlags } from '../config';

export class AdminController {
  static getFlags = async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(req.server.flags);
  };
}
