import api from './api';

export interface Notification {
  _id: string;
  userId: string;
  type: 'access_request' | 'access_approved' | 'access_denied' | 'emergency_access';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

class NotificationService {
  // Get user notifications
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    const response = await api.get('/notifications', { params });
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Get notification statistics
  async getStats() {
    const response = await api.get('/notifications/stats');
    return response.data;
  }
}

export default new NotificationService();


