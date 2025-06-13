import type { Express } from 'express';
import { createServer, type Server } from 'http';
import express from 'express';
import { authRouter } from './auth';
import { candidatesRouter } from './candidates';
import { employersRouter } from './employers';
import { jobsRouter } from './jobs';
import { adminRouter } from './admin';
import { adminSearchRouter } from './admin/search';

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  app.use('/api/auth', authRouter);
  app.use('/api/candidates', candidatesRouter);
  app.use('/api/employers', employersRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/admin/search', adminSearchRouter);
  app.use('/api/admin', adminRouter);

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
