import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import duelRoutes from './routes/duels';
import problemRoutes from './routes/problems';
import problemSetRoutes from './routes/problemSets';
import submissionRoutes from './routes/submissions';
import userRoutes from './routes/users';

export const createApp = () => {
  const app = express();

  // Render/Railway/etc. sit behind one proxy hop; needed for correct client IPs in rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
      status: dbReady ? 'ok' : 'degraded',
      database: dbReady ? 'connected' : 'disconnected',
      executionProvider: config.execution.provider,
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/problems', problemRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/duels', duelRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/problem-sets', problemSetRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
