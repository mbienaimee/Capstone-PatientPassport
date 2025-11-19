/**
 * Emergency Break-Glass Access - Quick Start Example
 * 
 * This file shows practical examples of using the emergency access system
 */

import React, { useState } from 'react';
import axios from 'axios';
import EmergencyAccessModal from '@/components/EmergencyAccessModal';

// ============================================================================
// Example 1: Basic Emergency Access in Doctor Dashboard
// ============================================================================

export function DoctorDashboardWithEmergency() {
  const [patients, setPatients] = useState<any[]>([]);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Handle emergency access request
  const handleEmergencyAccess = async (justification: string, hospitalId?: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Step 1: Request emergency access
      console.log('🚨 Requesting emergency access...');
      const accessResponse = await axios.post(
        `${API_URL}/api/emergency-access/request`,
        {
          patientId: selectedPatient._id,
          justification,
          hospitalId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Emergency access granted:', accessResponse.data);

      // Step 2: Fetch patient records
      console.log('📋 Fetching patient records...');
      const recordsResponse = await axios.get(
        `${API_URL}/api/emergency-access/patient/${selectedPatient._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Patient records retrieved:', recordsResponse.data);
      
      // Step 3: Display the data
      setPatientData(recordsResponse.data.data);
      setShowEmergencyModal(false);
      
      // Show success message
      alert(`Emergency access granted for ${selectedPatient.name}. Patient has been notified.`);
      
    } catch (error: any) {
      console.error('❌ Emergency access failed:', error);
      alert(error.response?.data?.message || 'Failed to request emergency access');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Doctor Dashboard</h1>

      {/* Patient List */}
      <div className="space-y-4">
        {patients.map(patient => (
          <div key={patient._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{patient.name}</h3>
                <p className="text-sm text-gray-600">{patient.email}</p>
              </div>
              
              <div className="flex space-x-2">
                {/* Regular access with OTP */}
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Request Access (OTP)
                </button>
                
                {/* Emergency access - NO OTP */}
                <button
                  onClick={() => {
                    setSelectedPatient(patient);
                    setShowEmergencyModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-1"
                >
                  <span>🚨</span>
                  <span>Emergency Access</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Access Modal */}
      <EmergencyAccessModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onSubmit={handleEmergencyAccess}
        patientName={selectedPatient?.name || ''}
        patientId={selectedPatient?._id || ''}
        hospitals={[
          { _id: '1', name: 'City Hospital' },
          { _id: '2', name: 'County Medical Center' }
        ]}
      />

      {/* Display Patient Data (if retrieved) */}
      {patientData && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">🚨 Emergency Access - Patient Records</h2>
          
          <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Accessed via Emergency Break-Glass Protocol. All actions are logged.
              Access expires: {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString()}
            </p>
          </div>

          {/* Patient Info */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Personal Information</h3>
            <p>Name: {patientData.patient.personalInfo.name}</p>
            <p>Blood Type: {patientData.patient.personalInfo.bloodType}</p>
            <p>DOB: {new Date(patientData.patient.personalInfo.dateOfBirth).toLocaleDateString()}</p>
          </div>

          {/* Medical Records */}
          <div>
            <h3 className="font-semibold mb-2">Medical Records ({patientData.medicalRecords.length})</h3>
            {patientData.medicalRecords.slice(0, 5).map((record: any) => (
              <div key={record._id} className="bg-white p-2 rounded mb-2 text-sm">
                <p><strong>{record.type}:</strong> {record.data.name || record.data.diagnosis}</p>
                <p className="text-gray-600 text-xs">{new Date(record.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Patient Viewing Their Emergency Access Audit Trail
// ============================================================================

export function PatientEmergencyAuditView() {
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      
      const response = await axios.get(
        `${API_URL}/api/emergency-access/audit/${userProfile.patientId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setAuditData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch audit:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAudit();
  }, []);

  if (loading) return <div>Loading audit trail...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🚨 Emergency Access to Your Medical Records</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-900">
          This page shows all times your medical records were accessed under emergency protocol
          without your explicit consent. All emergency accesses are logged for your protection.
        </p>
      </div>

      {auditData?.emergencyAccess.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-gray-600">No emergency accesses to your records.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {auditData?.emergencyAccess.map((access: any) => (
            <div key={access._id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-red-700">
                    🚨 Emergency Access
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(access.accessTime).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Doctor</p>
                  <p className="text-sm text-gray-900">{access.user.name}</p>
                  <p className="text-xs text-gray-600">{access.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">IP Address</p>
                  <p className="text-sm text-gray-900 font-mono">
                    {access.ipAddress || 'Not recorded'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Reason for Emergency Access</p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-sm text-gray-900">{access.justification}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  If you believe this access was inappropriate, please contact our privacy officer
                  at privacy@patientpassport.com
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {auditData?.summary && (
        <div className="mt-6 bg-gray-50 border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Emergency Accesses</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditData.summary.totalEmergencyAccesses}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Last Access</p>
              <p className="text-sm font-medium text-gray-900">
                {auditData.summary.lastAccess 
                  ? new Date(auditData.summary.lastAccess).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 3: Admin Viewing Emergency Access Logs (Simpler Version)
// ============================================================================

export function SimpleAdminEmergencyLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.get(
        `${API_URL}/api/emergency-access/logs?page=1&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setLogs(response.data.data.logs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, []);

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Doctor', 'Patient', 'Justification', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.accessTime).toLocaleString(),
      log.user.name,
      log.patient.user.name,
      log.justification,
      log.ipAddress || 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency-access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading logs...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🚨 Emergency Access Logs</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Justification
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(log.accessTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{log.user.name}</div>
                  <div className="text-xs text-gray-500">{log.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium">{log.patient.user.name}</div>
                  <div className="text-xs text-gray-500">{log.patient.user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm max-w-md truncate">
                    {log.justification}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: API Service Helper Functions
// ============================================================================

export class EmergencyAccessService {
  private baseURL: string;
  private getToken: () => string | null;

  constructor(baseURL: string, getToken: () => string | null) {
    this.baseURL = baseURL;
    this.getToken = getToken;
  }

  private getHeaders() {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Request emergency access to patient records
   */
  async requestEmergencyAccess(
    patientId: string,
    justification: string,
    hospitalId?: string
  ) {
    const response = await axios.post(
      `${this.baseURL}/api/emergency-access/request`,
      { patientId, justification, hospitalId },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  /**
   * Get patient records using emergency access
   */
  async getPatientRecords(patientId: string) {
    const response = await axios.get(
      `${this.baseURL}/api/emergency-access/patient/${patientId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  /**
   * Get all emergency access logs (admin only)
   */
  async getEmergencyLogs(filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams(filters as any);
    const response = await axios.get(
      `${this.baseURL}/api/emergency-access/logs?${params}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  /**
   * Get patient's emergency access audit trail
   */
  async getPatientAudit(patientId: string) {
    const response = await axios.get(
      `${this.baseURL}/api/emergency-access/audit/${patientId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  /**
   * Get doctor's emergency access history
   */
  async getDoctorHistory(page = 1, limit = 20) {
    const response = await axios.get(
      `${this.baseURL}/api/emergency-access/my-history?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

// Usage:
// const emergencyService = new EmergencyAccessService(
//   'http://localhost:5000',
//   () => localStorage.getItem('accessToken')
// );
