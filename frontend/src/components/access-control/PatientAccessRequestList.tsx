import React, { useState, useEffect } from 'react';
import accessControlService, { AccessRequest } from '../../services/accessControlService';
import { toast } from 'react-hot-toast';
import socketService from '../../services/socketService';

const PatientAccessRequestList: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    
    // Setup socket listener
    const accessRequestHandler = (data: any) => {
      console.log('New access request received:', data);
      fetchRequests(); // Refresh the list
      toast.success('New access request received!');
    };
    
    socketService.onAccessRequest(accessRequestHandler);
    
    // Cleanup on unmount
    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await accessControlService.getPendingRequests();
      setRequests((response.data as any) || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load access requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, status: 'approved' | 'denied', reason?: string) => {
    try {
      setRespondingTo(requestId);
      await accessControlService.respondToRequest(requestId, { requestId, status, reason });
      
      toast.success(`Access request ${status} successfully`);
      fetchRequests(); // Refresh the list
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast.error(error.response?.data?.message || 'Failed to respond to request');
    } finally {
      setRespondingTo(null);
    }
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

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have any pending access requests at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            🏥 Pending Patient Passport Access Requests
          </h3>
          
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                      Request from Dr. {request.doctorId} {/* This should be populated with doctor name */}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Reason:</strong> {request.reason}
                    </p>
                    
                    <div className="text-sm text-gray-500 mb-3">
                      <p><strong>Requested Data:</strong> {request.requestedData.join(', ')}</p>
                      <p><strong>Expires:</strong> {formatDate(request.expiresAt)}</p>
                    </div>
                  </div>
                </div>
                
                {request.status === 'pending' && (
                  <div className="flex space-x-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleResponse(request._id, 'approved')}
                      disabled={respondingTo === request._id}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {respondingTo === request._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please provide a reason for denying access (optional):');
                        handleResponse(request._id, 'denied', reason || undefined);
                      }}
                      disabled={respondingTo === request._id}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {respondingTo === request._id ? 'Processing...' : 'Deny'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAccessRequestList;
