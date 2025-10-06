import express from 'express';
import { authenticate } from '@/middleware/auth';
import { handleValidationErrors } from '@/middleware/validation';
import { param, query } from 'express-validator';
import Notification from '@/models/Notification';
import { CustomError } from '@/middleware/errorHandler';

const router = express.Router();

// Get user notifications
router.get('/',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a positive integer'),
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;
      
      let query: any = { userId: req.user.id };
      
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < total
          },
          unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  }
);

// Mark notification as read
router.patch('/:notificationId/read',
  authenticate,
  [
    param('notificationId').isMongoId().withMessage('Valid notification ID is required')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { notificationId } = req.params;
      
      const notification = await Notification.markAsRead(notificationId, req.user.id);
      
      if (!notification) {
        throw new CustomError('Notification not found', 404);
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to mark notification as read'
      });
    }
  }
);

// Mark all notifications as read
router.patch('/read-all',
  authenticate,
  async (req: any, res: any) => {
    try {
      await Notification.updateMany(
        { userId: req.user.id, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }
);

// Delete notification
router.delete('/:notificationId',
  authenticate,
  [
    param('notificationId').isMongoId().withMessage('Valid notification ID is required')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const { notificationId } = req.params;
      
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId: req.user.id
      });
      
      if (!notification) {
        throw new CustomError('Notification not found', 404);
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete notification'
      });
    }
  }
);

// Get notification statistics
router.get('/stats',
  authenticate,
  async (req: any, res: any) => {
    try {
      const stats = await Notification.aggregate([
        { $match: { userId: req.user.id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
            urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
            medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
            low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        unread: 0,
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification statistics'
      });
    }
  }
);

export default router;
