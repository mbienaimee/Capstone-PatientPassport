import React, { useState, useEffect } from 'react';
import DoctorAccessRequestForm from '../access-control/DoctorAccessRequestForm';
import NotificationCenter from '../notifications/NotificationCenter';
import accessControlService, { AccessRequest } from '../../services/accessControlService';
import socketService from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import { hospitalAuthService } from '../../services/hospitalAuthService';

const DoctorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'notifications' | 'new-request'>('requests');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [hospitalAuth, setHospitalAuth] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Check for hospital authentication
    if (hospitalAuthService.isHospitalLoggedIn()) {
      const authData = hospitalAuthService.getHospitalAuthData();
      setHospitalAuth(authData);
    }

    if (user?.token || hospitalAuthService.isHospitalLoggedIn()) {
      const token = user?.token || hospitalAuthService.getHospitalAuthData()?.token;
      
      // Connect to WebSocket
      socketService.connect(token);
      socketService.joinDoctorNotifications();

      // Set up notification listeners
      socketService.onNotification((data) => {
        console.log('New notification received:', data);
      });

      socketService.onAccessResponse((data) => {
        console.log('Access response received:', data);
        fetchRequests(); // Refresh requests
      });

      return () => {
        socketService.removeAllListeners();
      };
    }
  }, [user?.token, hospitalAuth]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await accessControlService.getDoctorRequests();
      setRequests(response.data);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName });
    setShowRequestForm(true);
    setActiveTab('new-request');
  };

  const handleRequestSuccess = () => {
    setShowRequestForm(false);
    setSelectedPatient(null);
    setActiveTab('requests');
    fetchRequests();
  };

  const handleRequestCancel = () => {
    setShowRequestForm(false);
    setSelectedPatient(null);
    setActiveTab('requests');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (requestType: string) => {
    switch (requestType) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'edit':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'view':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">🏥 Doctor Dashboard - Patient Passport</h1>
              <p className="text-sm text-gray-600">Manage Patient Passport access requests</p>
            </div>
            {hospitalAuth && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. {hospitalAuth.doctor.name}</p>
                <p className="text-xs text-gray-600">{hospitalAuth.hospital.name}</p>
                <p className="text-xs text-gray-500">License: {hospitalAuth.doctor.licenseNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('new-request')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'new-request'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            New Request
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === 'requests' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">My Patient Passport Access Requests</h2>
              <p className="text-sm text-gray-600">
                Track the status of your access requests to Patient Passport medical records.
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No requests yet</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't made any access requests yet.</p>
                <button
                  onClick={() => setActiveTab('new-request')}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Make Your First Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.requestType)}`}>
                            {request.requestType.toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          Patient: {request.patientId} {/* This should be populated with patient name */}
                        </h4>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Reason:</strong> {request.reason}
                        </p>
                        
                        <div className="text-sm text-gray-500 mb-2">
                          <p><strong>Requested Data:</strong> {request.requestedData.join(', ')}</p>
                          <p><strong>Created:</strong> {formatDate(request.createdAt)}</p>
                          {request.expiresAt && (
                            <p><strong>Expires:</strong> {formatDate(request.expiresAt)}</p>
                          )}
                        </div>

                        {request.patientResponseReason && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Patient Response:</strong> {request.patientResponseReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Notifications</h2>
              <p className="text-sm text-gray-600">
                Stay updated with responses to your access requests.
              </p>
            </div>
            <NotificationCenter />
          </div>
        )}

        {activeTab === 'new-request' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">New Access Request</h2>
              <p className="text-sm text-gray-600">
                Request access to a patient's medical records.
              </p>
            </div>

            {showRequestForm && selectedPatient ? (
              <DoctorAccessRequestForm
                patientId={selectedPatient.id}
                patientName={selectedPatient.name}
                onSuccess={handleRequestSuccess}
                onCancel={handleRequestCancel}
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Patient</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a patient to request access to their medical records.
                  </p>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Enter patient ID or name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                    <button
                      onClick={() => {
                        // In a real app, this would search for patients
                        const patientId = prompt('Enter patient ID:');
                        const patientName = prompt('Enter patient name:');
                        if (patientId && patientName) {
                          handleNewRequest(patientId, patientName);
                        }
                      }}
                      className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                      Search Patient
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
