import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { db } from './database/db';
import logger from './utils/logger';
import { verifyEmailConnection } from './utils/email';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/api/v1/auth';
import userRoutes from './routes/api/v1/users';
import workflowRoutes from './routes/api/v1/workflows';
import agentRoutes from './routes/api/v1/agents';
import apiKeyRoutes from './routes/api/v1/api-keys';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(express.json({ limit: '10mb' })); // JSON parsing with limit
app.use(express.urlencoded({ limit: '10mb', extended: true })); // URL encoding

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
});

// Error handling middleware for uncaught errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealth = await db.healthCheck();
    res.json({
      status: 'ok',
      database: dbHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error(`Health check failed: ${err.message}`);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    // Initialize database
    logger.info('Initializing database...');
    await db.initialize();
    logger.info('Database initialized successfully');

    // Verify email configuration
    logger.info('Verifying email configuration...');
    const emailOk = await verifyEmailConnection();
    if (!emailOk) {
      logger.warn('Email configuration may have issues - some features may not work');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.DATABASE_URL || 'postgres://localhost'}`);
    });
  } catch (err: any) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await db.close();
  process.exit(0);
});

// Start the server
start();

export default app;
