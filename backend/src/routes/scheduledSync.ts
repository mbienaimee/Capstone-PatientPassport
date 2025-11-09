import { Router, Request, Response } from 'express';
import { directDBSyncService } from '../services/directDBSyncService';

const router = Router();

/**
 * @swagger
 * /api/scheduled-sync/status:
 *   get:
 *     summary: Get scheduled sync service status
 *     tags: [Scheduled Sync]
 *     responses:
 *       200:
 *         description: Sync service status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = directDBSyncService.getStatus();
  res.json({
    success: true,
    data: status
  });
});

/**
 * @swagger
 * /api/scheduled-sync/sync-now:
 *   post:
 *     summary: Trigger immediate sync
 *     tags: [Scheduled Sync]
 *     responses:
 *       200:
 *         description: Sync triggered successfully
 */
router.post('/sync-now', async (req: Request, res: Response) => {
  const result = await directDBSyncService.syncNow();
  res.json(result);
});

export default router;
