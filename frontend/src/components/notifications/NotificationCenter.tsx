import React, { useState, useEffect } from 'react';
import notificationService, { Notification, NotificationStats } from '../../services/notificationService';
import socketService from '../../services/socketService';
import { toast } from 'react-hot-toast';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    setupSocketListeners();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        limit: showAll ? 50 : 10,
        unreadOnly: !showAll
      });
      setNotifications(response.data.notifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await notificationService.getStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.onNotification((data) => {
      console.log('New notification received:', data);
      fetchNotifications();
      fetchStats();
      
      // Show toast for urgent notifications
      if (data.priority === 'urgent') {
        toast.error(data.title, { duration: 10000 });
      } else {
        toast.success(data.title);
      }
    });
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      fetchStats();
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );
      fetchStats();
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Notifications
            {stats && stats.unread > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {stats.unread} unread
              </span>
            )}
          </h3>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showAll ? 'Show Unread Only' : 'Show All'}
            </button>
            {stats && stats.unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              <div className="text-sm text-red-500">Unread</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
              <div className="text-sm text-orange-500">Urgent</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{stats.high}</div>
              <div className="text-sm text-blue-500">High Priority</div>
            </div>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L16 7m-5 5h5m-5 5v-5m-5-5h5m-5 5v-5" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {showAll ? "You don't have any notifications." : "You don't have any unread notifications."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`border rounded-lg p-4 ${
                  notification.isRead 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-gray-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

