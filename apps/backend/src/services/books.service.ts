import type { PrismaClient } from '@prisma/client';

export class BooksService {
  constructor(private prisma: PrismaClient) {}

  async list() {
    return this.prisma.book.findMany();
  }
}
