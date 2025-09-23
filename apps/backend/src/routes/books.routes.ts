import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { BooksController } from '../controllers/books.controller';

export default fp(async (app: FastifyInstance) => {
  app.get('/books', BooksController.list);
  app.post('/books', BooksController.create);
});
