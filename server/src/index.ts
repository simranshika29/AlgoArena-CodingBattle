import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { DuelManager } from './duels/duelManager';
import { registerDuelHandlers } from './duels/socketHandlers';

const start = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const app = createApp();
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: config.corsOrigins, methods: ['GET', 'POST'] },
  });
  const duelManager = new DuelManager(io);
  registerDuelHandlers(io, duelManager);

  server.listen(config.port, () => {
    console.log(`AlgoArena API listening on port ${config.port} (${config.nodeEnv})`);
    console.log(`Code execution provider: ${config.execution.provider}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    duelManager.shutdown();
    io.close();
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
