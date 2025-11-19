import React, { useState, useEffect } from 'react';
import { ShieldAlert, User, Calendar, AlertTriangle, Filter, Download, Eye } from 'lucide-react';
import { apiService } from '../services/api';

interface EmergencyAccessLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  patient: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
  };
  justification: string;
  accessTime: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  accessType: 'regular' | 'emergency' | 'consent';
  action: 'view' | 'create' | 'update' | 'delete';
  details: string;
  accessTime: string;
}

const EmergencyAccessAuditDashboard: React.FC = () => {
  const [logs, setLogs] = useState<EmergencyAccessLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<EmergencyAccessLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    doctorId: '',
    patientId: ''
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.doctorId && { doctorId: filters.doctorId }),
        ...(filters.patientId && { patientId: filters.patientId })
      });

      const response = await apiService.request(`/emergency-access/logs?${params}`);

      if (response.success && response.data) {
        const responseData = response.data as { logs: EmergencyAccessLog[]; pagination: { totalPages: number } };
        setLogs(responseData.logs);
        setTotalPages(responseData.pagination.totalPages);
      }
      setError('');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }; message?: string }; message?: string };
      setError(error.response?.data?.message || error.message || 'Failed to fetch emergency access logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const viewLogDetails = (log: EmergencyAccessLog) => {
    setSelectedLog(log);
  };

  const exportLogs = () => {
    // Create CSV content
    const headers = ['Date/Time', 'Doctor', 'Doctor Email', 'Patient', 'Patient Email', 'Justification', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.accessTime).toLocaleString(),
      log.user.name,
      log.user.email,
      log.patient.user.name,
      log.patient.user.email,
      log.justification,
      log.ipAddress || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency-access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergency Access Audit Dashboard</h1>
                <p className="text-sm text-gray-600">Review and monitor all break-glass access requests</p>
              </div>
            </div>
            <button
              onClick={exportLogs}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={() => setFilters({ startDate: '', endDate: '', doctorId: '', patientId: '' })}
                className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Emergency Accesses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{logs.length}</p>
              </div>
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Doctors</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {new Set(logs.map(log => log.user._id)).size}
                </p>
              </div>
              <User className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {new Set(logs.map(log => log.patient._id)).size}
                </p>
              </div>
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Access Logs</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldAlert className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emergency access logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Justification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(log.accessTime).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{log.user.name}</div>
                          <div className="text-sm text-gray-500">{log.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{log.patient.user.name}</div>
                          <div className="text-sm text-gray-500">{log.patient.user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md truncate">
                            {log.justification}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => viewLogDetails(log)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedLog(null)} />
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
                  <h2 className="text-xl font-bold">Emergency Access Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Doctor</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLog.user.name}</p>
                      <p className="text-xs text-gray-500">{selectedLog.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Patient</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedLog.patient.user.name}</p>
                      <p className="text-xs text-gray-500">{selectedLog.patient.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Access Time</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedLog.accessTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">IP Address</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Justification</label>
                    <p className="mt-1 text-sm text-gray-900 p-3 bg-gray-50 rounded border border-gray-200">
                      {selectedLog.justification}
                    </p>
                  </div>
                  {selectedLog.userAgent && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">User Agent</label>
                      <p className="mt-1 text-xs text-gray-600 font-mono break-all">{selectedLog.userAgent}</p>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyAccessAuditDashboard;
