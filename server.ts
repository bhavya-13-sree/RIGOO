import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './server/routes/api.ts';
import { setupSocketIO } from './server/socket.ts';
import { initDatabase } from './server/db/index.ts';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  app.use(express.json());

  // API router
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'RIGOO — Share the Journey',
      founders: ['M. Rethika', 'H. Bhavya Sree'],
      timestamp: new Date().toISOString()
    });
  });

  // Setup Socket.IO real-time tracking
  setupSocketIO(io);

  // Initialize DB engine
  await initDatabase();

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[RIGOO Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[RIGOO Server] Startup failed:', err);
  process.exit(1);
});
