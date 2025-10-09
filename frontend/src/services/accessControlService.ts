import api from './api';

export interface AccessRequestData {
  patientId: string;
  hospitalId: string;
  requestType: 'view' | 'edit' | 'emergency';
  reason: string;
  requestedData: string[];
  expiresInHours?: number;
}

export interface AccessResponse {
  requestId: string;
  status: 'approved' | 'denied';
  reason?: string;
}

export interface AccessRequest {
  _id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  requestType: string;
  reason: string;
  requestedData: string[];
  status: 'pending' | 'approved' | 'denied' | 'expired';
  expiresAt: string;
  approvedAt?: string;
  deniedAt?: string;
  patientResponse?: 'approved' | 'denied';
  patientResponseAt?: string;
  patientResponseReason?: string;
  createdAt: string;
  updatedAt: string;
}

class AccessControlService {
  // Create access request (Doctor)
  async createAccessRequest(data: AccessRequestData) {
    const response = await api.post('/access-control/request', data);
    return response.data;
  }

  // Get pending requests for patient
  async getPendingRequests() {
    const response = await api.get('/access-control/patient/pending');
    return response.data;
  }

  // Get requests by doctor
  async getDoctorRequests() {
    const response = await api.get('/access-control/doctor/requests');
    return response.data;
  }

  // Patient responds to access request
  async respondToRequest(requestId: string, response: AccessResponse) {
    const apiResponse = await api.post(`/access-control/respond/${requestId}`, response);
    return apiResponse.data;
  }

  // Get specific access request
  async getAccessRequest(requestId: string) {
    const response = await api.get(`/access-control/${requestId}`);
    return response.data;
  }

  // Emergency access
  async createEmergencyAccess(data: Omit<AccessRequestData, 'requestType'>) {
    const response = await api.post('/access-control/emergency', data);
    return response.data;
  }
}

export default new AccessControlService();












