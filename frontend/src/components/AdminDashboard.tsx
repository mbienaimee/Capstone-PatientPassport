import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  MapPin,
  Calendar,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  Menu,
  X,
  Home,
  BarChart3,
  PieChart,
  Bell,
  User,
  Power,
  PowerOff,
  Loader2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import Logo from "./Logo";
import { dataService } from "../services/dataService";

// Define types
interface DashboardStats {
  totalPatients: number;
  totalHospitals: number;
  totalDoctors: number;
  pendingHospitals: number;
  newRegistrations: number;
  systemStatus: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  contactNumber: string;
  address: string;
  emergencyContact: string;
  status: 'active' | 'inactive';
  registrationDate: string;
}

interface Hospital {
  id: string;
  name: string;
  email: string;
  address: string;
  contact: string;
  licenseNumber: string;
  adminContact: string;
  status: 'active' | 'pending' | 'inactive';
  registrationDate: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'hospitals'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalHospitals: 0,
    totalDoctors: 0,
    pendingHospitals: 0,
    newRegistrations: 0,
    systemStatus: 'Loading...'
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [updatingPatients, setUpdatingPatients] = useState<Set<string>>(new Set());
  const [updatingHospitals, setUpdatingHospitals] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');

  // Chart data
  const barChartData = [
    { name: 'Patients', value: dashboardStats.totalPatients, color: '#10B981' },
    { name: 'Hospitals', value: dashboardStats.totalHospitals, color: '#3B82F6' },
    { name: 'Doctors', value: dashboardStats.totalDoctors, color: '#8B5CF6' },
    { name: 'Pending', value: dashboardStats.pendingHospitals, color: '#F59E0B' }
  ];

  const pieChartData = [
    { name: 'Active Hospitals', value: dashboardStats.totalHospitals, color: '#10B981' },
    { name: 'Pending Hospitals', value: dashboardStats.pendingHospitals, color: '#F59E0B' },
    { name: 'New Registrations', value: dashboardStats.newRegistrations, color: '#3B82F6' }
  ];

  const lineChartData = [
    { month: 'Jan', patients: 45, hospitals: 12 },
    { month: 'Feb', patients: 52, hospitals: 15 },
    { month: 'Mar', patients: 48, hospitals: 18 },
    { month: 'Apr', patients: 61, hospitals: 20 },
    { month: 'May', patients: 55, hospitals: 22 },
    { month: 'Jun', patients: dashboardStats.totalPatients, hospitals: dashboardStats.totalHospitals }
  ];

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/hospital-login');
    }
  }, [user, navigate]);

    const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const overviewData = await dataService.getAdminOverview();
      
      if (overviewData.stats) {
        setDashboardStats(overviewData.stats);
      }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

  const loadPatients = async () => {
    try {
      console.log('🔄 Loading patients...');
      const patientsData = await dataService.getAdminAllPatients();
      console.log('Patients data received:', patientsData);
      console.log('First patient structure:', patientsData[0]);
      setPatients(patientsData as unknown as Patient[]);
      console.log('Patients state updated');
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadHospitals = async () => {
    try {
      console.log('🔄 Loading hospitals...');
      const hospitalsData = await dataService.getAdminAllHospitals();
      console.log('Hospitals data received:', hospitalsData);
      setHospitals(hospitalsData as unknown as Hospital[]);
      console.log('Hospitals state updated');
    } catch (error) {
      console.error('Error loading hospitals:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDashboardData(),
      loadPatients(),
      loadHospitals()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
    loadPatients();
    loadHospitals();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/hospital-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Toggle functions
  const handleToggleHospitalStatus = async (hospitalId: string, currentStatus: string) => {
    try {
      console.log('🔄 Toggle hospital status clicked:', { hospitalId, currentStatus });
      
      // Add to updating set
      setUpdatingHospitals(prev => new Set(prev).add(hospitalId));
      
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      console.log('🔄 New status will be:', newStatus);
      
      await dataService.updateHospitalStatus(hospitalId, newStatus as 'active' | 'inactive' | 'pending');
      
      // Update local state
      setHospitals(prev => prev.map(hospital => 
        hospital.id === hospitalId 
          ? { ...hospital, status: newStatus as 'active' | 'pending' | 'inactive' }
          : hospital
      ));
      
      console.log('Hospital status updated locally');
      
      // Refresh dashboard data
      await handleRefresh();
      console.log('Dashboard refreshed');
    } catch (error) {
      console.error('Error updating hospital status:', error);
    } finally {
      // Remove from updating set
      setUpdatingHospitals(prev => {
        const newSet = new Set(prev);
        newSet.delete(hospitalId);
        return newSet;
      });
    }
  };

  const handleTogglePatientStatus = async (patientId: string, currentStatus: string) => {
    try {
      console.log('🔄 Toggle patient status clicked:', { patientId, currentStatus });
      
      // Find the patient to see its full structure
      const patient = patients.find(p => p.id === patientId);
      console.log('Full patient object:', patient);
      
      // Add to updating set
      setUpdatingPatients(prev => new Set(prev).add(patientId));
      
      // Handle undefined status - default to 'active' if undefined
      const actualStatus = currentStatus || 'active';
      const newStatus = actualStatus === 'active' ? 'inactive' : 'active';
      console.log('🔄 Actual status:', actualStatus, 'New status will be:', newStatus);
      
      await dataService.updatePatientStatus(patientId, newStatus as 'active' | 'inactive');
      
      // Update local state
      setPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? { ...patient, status: newStatus }
          : patient
      ));
      
      console.log('Patient status updated locally');
      
      // Refresh dashboard data
      await handleRefresh();
      console.log('Dashboard refreshed');
    } catch (error) {
      console.error('Error updating patient status:', error);
    } finally {
      // Remove from updating set
      setUpdatingPatients(prev => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
    }
  };

  // Filter functions
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.nationalId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || hospital.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-green-200">
          <div className="flex items-center space-x-3">
            <Logo size="sm" className="text-green-600" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-green-100 text-green-700 border-r-2 border-green-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home className="mr-3 h-5 w-5" />
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'patients'
                  ? 'bg-green-100 text-green-700 border-r-2 border-green-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Users className="mr-3 h-5 w-5" />
              Patients ({patients.length})
            </button>
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'hospitals'
                  ? 'bg-green-100 text-green-700 border-r-2 border-green-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Building2 className="mr-3 h-5 w-5" />
              Hospitals ({hospitals.length})
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 px-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
          </nav>
        </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'overview' && 'Dashboard Overview'}
                  {activeTab === 'patients' && 'Patient Management'}
                  {activeTab === 'hospitals' && 'Hospital Management'}
              </h1>
                <p className="text-xs text-gray-600">
                  {activeTab === 'overview' && 'Complete system analytics and insights'}
                  {activeTab === 'patients' && 'Manage and monitor patient data'}
                  {activeTab === 'hospitals' && 'Oversee hospital registrations and status'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <Bell className="h-5 w-5" />
              </button>
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
          {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-600">Total Patients</p>
                      <p className="text-xl font-bold text-gray-900">{dashboardStats.totalPatients}</p>
                      <p className="text-xs text-gray-500 mt-1">+{dashboardStats.newRegistrations} this month</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                </div>
              </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-600">Total Hospitals</p>
                      <p className="text-xl font-bold text-gray-900">{dashboardStats.totalHospitals}</p>
                      <p className="text-xs text-gray-500 mt-1">Active institutions</p>
              </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-600">Total Doctors</p>
                      <p className="text-xl font-bold text-gray-900">{dashboardStats.totalDoctors}</p>
                      <p className="text-xs text-gray-500 mt-1">Medical professionals</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

                <div className="bg-white rounded-xl shadow-lg border border-yellow-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-yellow-600">Pending Approvals</p>
                      <p className="text-xl font-bold text-gray-900">{dashboardStats.pendingHospitals}</p>
                      <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
                    <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                        </div>
            </div>
          </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">System Overview</h3>
                      <p className="text-xs text-gray-600">User distribution across platform</p>
                    </div>
                  </div>
                  
              <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
              </ResponsiveContainer>
            </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Hospital Status</h3>
                      <p className="text-xs text-gray-600">Registration status breakdown</p>
                    </div>
              </div>
                  
                <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                    <Pie
                        data={pieChartData}
                      cx="50%"
                      cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      dataKey="value"
                    >
                        {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Growth Trends</h3>
                      <p className="text-xs text-gray-600">Monthly registration trends</p>
                    </div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="patients" 
                      stackId="1" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hospitals" 
                      stackId="2" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
                      <p className="text-xs text-gray-600">Latest system activities and updates</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">New patient registrations</p>
                      <p className="text-xs text-gray-600">{dashboardStats.newRegistrations} new patients registered this month</p>
                    </div>
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">Hospital approvals</p>
                      <p className="text-xs text-gray-600">{dashboardStats.pendingHospitals} hospitals pending approval</p>
                    </div>
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">System health</p>
                      <p className="text-xs text-gray-600">All systems operational and running smoothly</p>
                    </div>
                    <div className="text-xs text-gray-500">Live</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients by name, email, or national ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
            </div>
          </div>
              </div>
            </div>

            {/* Patients List */}
            <div className="bg-white rounded-xl shadow-lg border border-green-200/50">
              <div className="p-6 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">All Patients</h2>
                      <p className="text-xs text-gray-600">{filteredPatients.length} patients found</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Patient</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Registration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">No patients found</p>
                              <p className="text-xs text-gray-500">
                                {searchTerm ? 'Try adjusting your search criteria' : 'No patients have been registered yet'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-green-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="ml-4">
                              <div className="text-xs font-medium text-gray-900">{patient.name}</div>
                              <div className="text-xs text-gray-500">ID: {patient.nationalId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{patient.email}</div>
                            <div className="text-xs text-gray-500">{patient.contactNumber}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center text-xs text-gray-900">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              {patient.address}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (patient.status || 'active') === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(patient.status || 'active') === 'active' ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={() => handleTogglePatientStatus(patient.id, patient.status || 'active')}
                                disabled={updatingPatients.has(patient.id)}
                                className={`p-1 rounded transition-all duration-200 ${
                                  updatingPatients.has(patient.id)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-gray-100 hover:scale-110'
                                }`}
                                title={`${(patient.status || 'active') === 'active' ? 'Deactivate' : 'Activate'} patient`}
                              >
                                {updatingPatients.has(patient.id) ? (
                                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                ) : (patient.status || 'active') === 'active' ? (
                                  <Power className="h-4 w-4 text-green-600" />
                                ) : (
                                  <PowerOff className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">
                              {new Date(patient.registrationDate).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-lg border border-green-200/50 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search hospitals by name, email, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'pending' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hospitals List */}
            <div className="bg-white rounded-xl shadow-lg border border-green-200/50">
              <div className="p-6 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">All Hospitals</h2>
                      <p className="text-xs text-gray-600">{filteredHospitals.length} hospitals found</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Hospital</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase tracking-wider">Registration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHospitals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">No hospitals found</p>
                              <p className="text-xs text-gray-500">
                                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search criteria' : 'No hospitals have been registered yet'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredHospitals.map((hospital) => (
                        <tr key={hospital.id} className="hover:bg-green-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="ml-4">
                              <div className="text-xs font-medium text-gray-900">{hospital.name}</div>
                              <div className="text-xs text-gray-500">License: {hospital.licenseNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{hospital.email}</div>
                            <div className="text-xs text-gray-500">{hospital.contact}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center text-xs text-gray-900">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              {hospital.address}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                hospital.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : hospital.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {hospital.status === 'active' ? 'Active' : 
                                 hospital.status === 'pending' ? 'Pending' : 'Inactive'}
                              </span>
                              {hospital.status !== 'pending' && (
                                <button
                                  onClick={() => handleToggleHospitalStatus(hospital.id, hospital.status)}
                                  disabled={updatingHospitals.has(hospital.id)}
                                  className={`p-1 rounded transition-all duration-200 ${
                                    updatingHospitals.has(hospital.id)
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-gray-100 hover:scale-110'
                                  }`}
                                  title={`${hospital.status === 'active' ? 'Deactivate' : 'Activate'} hospital`}
                                >
                                  {updatingHospitals.has(hospital.id) ? (
                                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                  ) : hospital.status === 'active' ? (
                                    <Power className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <PowerOff className="h-4 w-4 text-gray-400" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">
                              {new Date(hospital.registrationDate).toLocaleDateString()}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;