import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';

async function start() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve('dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  const port = Number(process.env.PORT || 5173);
  app.listen(port, () => console.log(`http://localhost:${port}`));
}

start();
