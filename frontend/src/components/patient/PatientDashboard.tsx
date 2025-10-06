import React, { useState, useEffect } from 'react';
import PatientAccessRequestList from '../access-control/PatientAccessRequestList';
import NotificationCenter from '../notifications/NotificationCenter';
import socketService from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';

const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'notifications'>('requests');
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.token) {
      // Connect to WebSocket
      socketService.connect(user.token);
      socketService.joinPatientNotifications();

      // Set up notification listeners
      socketService.onNotification((data) => {
        console.log('New notification received:', data);
        setHasNewNotifications(true);
      });

      socketService.onAccessRequest((data) => {
        console.log('New access request received:', data);
        setHasNewNotifications(true);
      });

      return () => {
        socketService.removeAllListeners();
      };
    }
  }, [user?.token]);

  const handleTabChange = (tab: 'requests' | 'notifications') => {
    setActiveTab(tab);
    if (tab === 'notifications') {
      setHasNewNotifications(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">🏥 Patient Passport Dashboard</h1>
          <p className="text-sm text-gray-600">Manage access to your Patient Passport medical records</p>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          <button
            onClick={() => handleTabChange('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Access Requests
          </button>
          <button
            onClick={() => handleTabChange('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm relative ${
              activeTab === 'notifications'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notifications
            {hasNewNotifications && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            )}
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === 'requests' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Pending Patient Passport Access Requests</h2>
              <p className="text-sm text-gray-600">
                Review and approve or deny requests from healthcare providers to access your Patient Passport medical records.
              </p>
            </div>
            <PatientAccessRequestList />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Notifications</h2>
              <p className="text-sm text-gray-600">
                Stay updated with important information about your medical records and access requests.
              </p>
            </div>
            <NotificationCenter />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (Optional) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex">
          <button
            onClick={() => handleTabChange('requests')}
            className={`flex-1 flex flex-col items-center py-2 px-3 ${
              activeTab === 'requests' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs mt-1">Requests</span>
          </button>
          <button
            onClick={() => handleTabChange('notifications')}
            className={`flex-1 flex flex-col items-center py-2 px-3 relative ${
              activeTab === 'notifications' ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L16 7m-5 5h5m-5 5v-5m-5-5h5m-5 5v-5" />
            </svg>
            <span className="text-xs mt-1">Notifications</span>
            {hasNewNotifications && (
              <span className="absolute top-1 right-3 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
