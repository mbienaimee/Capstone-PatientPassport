import { apiService } from './api';

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
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    
    const response = await apiService.request(`/notifications?${queryParams.toString()}`);
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const response = await apiService.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await apiService.request('/notifications/read-all', {
      method: 'PATCH',
    });
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    const response = await apiService.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  // Get notification statistics
  async getStats() {
    const response = await apiService.request('/notifications/stats');
    return response.data;
  }
}

export default new NotificationService();













