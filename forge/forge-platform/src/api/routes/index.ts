import { Router } from 'express';
import agentsRouter from './agents';
import workflowsRouter from './workflows';
import queueRouter from './queue';

const router = Router();

// API routes
router.use('/agents', agentsRouter);
router.use('/workflows', workflowsRouter);
router.use('/queue', queueRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
  });
});

export default router;
