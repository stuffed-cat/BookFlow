import fp from 'fastify-plugin';

export default fp(async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    const url = req.url;
    const base = app.config.bookstackBaseUrl;
    if (!app.flags.books && (url === '/books' || url.startsWith('/books/'))) {
      return reply.from(`${base}${url}`);
    }
    if (!app.flags.pages && (url === '/pages' || url.startsWith('/pages/'))) {
      return reply.from(`${base}${url}`);
    }
  });
});
