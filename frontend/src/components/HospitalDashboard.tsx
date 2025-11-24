import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DoctorManagement from "./DoctorManagement";
import PatientList from "./PatientList";
import { apiService } from "../services/api";
import { useNotification } from "../contexts/NotificationContext";
import { 
  FiHome,
  FiUsers,
  FiUserCheck,
  FiLogOut,
  FiShield,
  FiSearch
} from "react-icons/fi";

interface HospitalInfo {
  _id: string;
  name: string;
  address: string;
  contact: string;
  licenseNumber: string;
  status: string;
  adminContact?: string;
  email?: string;
  createdAt?: string;
}

interface UserResponse {
  success: boolean;
  data: {
    profile?: HospitalInfo;
    [key: string]: unknown;
  };
}

interface HospitalStats {
  totalDoctors: number;
  totalPatients: number;
  recentPatients: unknown[];
  recentMedicalConditions: unknown[];
  recentTestResults: unknown[];
}

interface Doctor {
  _id: string;
  licenseNumber: string;
  specialization: string;
  isActive: boolean;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Patient {
  _id: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  address: string;
  status: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  assignedDoctors?: Array<{
    _id: string;
    specialization: string;
    user: {
      name: string;
    };
  }>;
}

const HospitalDashboard: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<"overview" | "doctors" | "patients">("overview");
  const [activeNav, setActiveNav] = useState("overview");
  const [hospitalId, setHospitalId] = useState<string>("");
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [hospitalStats, setHospitalStats] = useState<HospitalStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const hasInitiallyFetched = useRef(false);
  const previousHospitalId = useRef<string | null>(null);

  const fetchHospitalInfo = useCallback(
    async (isRetry = false) => {
      try {
        setError(null);

        if (!user) {
          throw new Error("User not authenticated");
        }

        if (user.role !== "hospital") {
          throw new Error("User is not a hospital");
        }

        // Prevent unnecessary fetches if we already have the data
        if (!isRetry && hasInitiallyFetched.current && hospitalId) {
          console.log('✅ Hospital data already loaded, skipping fetch');
          return;
        }

        const cacheKey = `hospital-info-${user._id}`;
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTime = 30000;

        if (!isRetry && cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (Date.now() - parsed.timestamp < cacheTime) {
              setHospitalId(parsed.data.hospital._id);
              setHospitalInfo(parsed.data.hospital);
              setHospitalStats(parsed.data.stats || null);
              return;
            }
          } catch (error) {
            console.error("Error parsing cached data:", error);
          }
        }

        let response;
        try {
          response = await apiService.request("/dashboard/hospital");
        } catch (dashboardError) {
          const userResponse = await apiService.request("/auth/me");
          if (userResponse.success && (userResponse as UserResponse).data.profile) {
            const hospitalProfile = (userResponse as UserResponse).data.profile!;
            response = {
              success: true,
              data: {
                hospital: {
                  _id: hospitalProfile._id,
                  name: hospitalProfile.name,
                  address: hospitalProfile.address || "",
                  contact: hospitalProfile.contact || "",
                  licenseNumber: hospitalProfile.licenseNumber || "",
                  status: hospitalProfile.status || "active",
                },
                stats: {
                  totalDoctors: 0,
                  totalPatients: 0,
                  recentPatients: [],
                  recentMedicalConditions: [],
                  recentTestResults: [],
                },
              },
            };
          } else {
            throw dashboardError;
          }
        }

        if (response.success && response.data) {
          const data = response.data as {
            hospital?: HospitalInfo;
            stats?: HospitalStats;
            doctors?: Doctor[];
            patients?: Patient[];
          };

          if (data.hospital) {
            // Only update hospitalId if it's different to prevent unnecessary re-renders
            if (previousHospitalId.current !== data.hospital._id) {
              setHospitalId(data.hospital._id);
              previousHospitalId.current = data.hospital._id;
            }
            
            setHospitalInfo(data.hospital);
            setHospitalStats(data.stats || null);
            hasInitiallyFetched.current = true;

            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: data,
                timestamp: Date.now(),
              })
            );

            // Only show notification on initial load or retry
            if (!hasInitiallyFetched.current || isRetry) {
              showNotification({
                type: "success",
                title: "Dashboard Loaded",
                message: `Welcome to ${data.hospital.name} dashboard`,
              });
            }
          } else {
            throw new Error("Hospital data not found in response");
          }
        } else {
          throw new Error(response.message || "Failed to load hospital dashboard");
        }
      } catch (error) {
        console.error("Error fetching hospital info:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        setError(errorMessage);

        showNotification({
          type: "error",
          title: "Dashboard Error",
          message: `Failed to load hospital dashboard: ${errorMessage}`,
        });

        if (errorMessage.includes("not authenticated") || errorMessage.includes("401")) {
          setTimeout(() => {
            logout();
            navigate("/hospital-login");
          }, 2000);
        }
      } finally {
        // Loading handled by isLoading state
      }
    },
    [user, logout, navigate, showNotification]
  );

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchHospitalInfo(true);
  };

  useEffect(() => {
    if (isLoading) return;

    if (user && user.role !== "hospital") {
      navigate("/");
      return;
    }

    if (!user) {
      navigate("/hospital-login");
      return;
    }

    // Only fetch on initial mount or when user changes
    if (!hasInitiallyFetched.current) {
      fetchHospitalInfo();
    }
  }, [user, isLoading, navigate, fetchHospitalInfo]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileDropdown) setShowProfileDropdown(false);
    };
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/hospital-login");
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("hospitalAuth");
      navigate("/hospital-login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-600 mx-auto mb-4"></div>
          <p className="text-sm text-black font-semibold">Loading Hospital Dashboard...</p>
          <p className="text-xs text-black mt-1">Please wait while we prepare your data</p>
        </div>
      </div>
    );
  }

  if (error && !hospitalId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-lg font-bold text-black mb-3">Dashboard Error</h1>
          <p className="text-sm text-black mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-white text-green-500 px-4 py-2 rounded-lg hover:bg-green-500 hover:text-white transition-colors border border-green-500 text-sm"
            >
              Logout
            </button>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-black mt-3">Retry attempt: {retryCount}</p>
          )}
        </div>
      </div>
    );
  }

  // Show loading/error state ONLY if we have actually tried and failed, not during initial load
  if (!hospitalId || !hospitalInfo) {
    // If we have an error and tried multiple times, show error page
    if (error && retryCount > 0) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-lg font-bold text-black mb-3">
              Hospital Information Not Available
            </h1>
            <p className="text-sm text-black mb-4">
              {error || "Unable to load hospital information. Please try again."}
            </p>
            <div className="flex flex-col space-y-2 items-center">
              <button
                onClick={() => {
                  setError(null);
                  setRetryCount(prev => prev + 1);
                  fetchHospitalInfo();
                }}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Try Again
              </button>
              <button
                onClick={handleLogout}
                className="bg-white text-green-500 px-6 py-2 rounded-lg hover:bg-green-50 transition-colors border border-green-500 text-sm"
              >
                Logout
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Retry attempt: {retryCount}</p>
          </div>
        </div>
      );
    }
    
    // Otherwise, show loading state (initial load in progress)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading hospital dashboard...</p>
          <p className="text-xs text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar - Redesigned */}
        <aside className="w-56 bg-gradient-to-b from-green-600 to-green-700 flex flex-col shadow-lg">
          {/* Logo/Header Section */}
          <div className="p-4 border-b border-green-500/20">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FiHome className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{hospitalInfo?.name || 'Hospital'}</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search here.."
                className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-white/70" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-2 px-2">MENU</p>
              <div className="space-y-1">
                {[
                  { id: 'overview', label: 'Dashboard Overview', icon: FiHome },
                  { id: 'doctors', label: 'Doctors', icon: FiUserCheck },
                  { id: 'patients', label: 'Patients', icon: FiUsers }
                ].map((nav) => {
                  const Icon = nav.icon;
                  const isActive = activeNav === nav.id;
                  return (
                    <button
                      key={nav.id}
                      onClick={() => {
                        setActiveNav(nav.id);
                        setActiveTab(nav.id as "overview" | "doctors" | "patients");
                      }}
                      className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg transition-all duration-200 text-xs font-medium ${
                        isActive
                          ? 'bg-white text-green-700'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-green-700' : 'text-white/80'}`} />
                      <span>{nav.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-green-500/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-2.5 py-2 text-white/90 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200 text-xs font-medium"
            >
              <FiLogOut className="h-3.5 w-3.5" />
              <span>Quit</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
              <div>
                  <h1 className="text-xl font-semibold text-black leading-tight">Dashboard</h1>
                  <p className="text-xs font-normal text-black mt-0.5">Dashboard &gt; Overview Analytics</p>
              </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 bg-white rounded-full"></span>
                    <span>{hospitalInfo?.name || 'Hospital'}</span>
                </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Key Metrics Cards - Redesigned */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FiUserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-black mb-0.5">{hospitalStats?.totalDoctors || 0}</p>
                <p className="text-xs font-medium text-black mb-1">Total Doctors</p>
                <p className="text-[10px] font-normal text-black">All The Doctors Registered</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <FiUsers className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-black mb-0.5">{hospitalStats?.totalPatients || 0}</p>
                <p className="text-xs font-medium text-black mb-1">Total Patients</p>
                <p className="text-[10px] font-normal text-black">All Patients Registered</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <FiShield className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-black mb-0.5">100%</p>
                <p className="text-xs font-medium text-black mb-1">System Health</p>
                <p className="text-[10px] font-normal text-black">System Operational Status</p>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                {/* Hospital Information Card */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-black">Hospital Information</h2>
                        <p className="text-xs font-normal text-black mt-0.5">Complete hospital details and status</p>
                      </div>
                      <div className="flex items-center space-x-1.5 px-2 py-1 bg-gray-100 rounded-full">
                        <div className="h-1.5 w-1.5 bg-black rounded-full"></div>
                        <span className="text-[10px] font-medium text-black">Connected</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1 p-3 border border-gray-100 rounded-lg">
                        <label className="text-[10px] font-medium text-black uppercase tracking-wide">Hospital Name</label>
                        <p className="text-sm font-semibold text-black mt-1">{hospitalInfo?.name}</p>
                      </div>

                      <div className="space-y-1 p-3 border border-gray-100 rounded-lg">
                        <label className="text-[10px] font-medium text-black uppercase tracking-wide">License Number</label>
                        <p className="text-sm font-semibold text-black mt-1">{hospitalInfo?.licenseNumber}</p>
                      </div>

                      <div className="space-y-1 p-3 border border-gray-100 rounded-lg">
                        <label className="text-[10px] font-medium text-black uppercase tracking-wide">Status</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            hospitalInfo?.status === "active"
                              ? "bg-gray-100 text-black"
                              : hospitalInfo?.status === "pending"
                              ? "bg-yellow-100 text-black"
                              : "bg-red-100 text-black"
                          }`}>
                            {hospitalInfo?.status === "active" ? "Active" : hospitalInfo?.status === "pending" ? "Pending" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2 p-3 border border-gray-100 rounded-lg">
                        <label className="text-[10px] font-medium text-black uppercase tracking-wide">Address</label>
                        <p className="text-sm font-semibold text-black mt-1">{hospitalInfo?.address}</p>
                      </div>

                      <div className="space-y-1 p-3 border border-gray-100 rounded-lg">
                        <label className="text-[10px] font-medium text-black uppercase tracking-wide">Contact</label>
                        <p className="text-sm font-semibold text-black mt-1">{hospitalInfo?.contact}</p>
                      </div>

                      {hospitalInfo?.email && (
                        <div className="space-y-1 p-3 border border-gray-100 rounded-lg">
                          <label className="text-[10px] font-medium text-black uppercase tracking-wide">Email</label>
                          <p className="text-sm font-semibold text-black mt-1">{hospitalInfo.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity & Quick Actions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Recent Activity */}
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                          <h2 className="text-sm font-semibold text-black">Recent Activity</h2>
                          <p className="text-xs font-normal text-black mt-0.5">Latest hospital operations</p>
                      </div>
                        <button className="text-xs font-medium text-black hover:text-black">
                        View All
                      </button>
                    </div>
                  </div>

                    <div className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="h-7 w-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-xs">P</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-black">New Patient Registration</p>
                            <p className="text-[10px] font-normal text-black mt-0.5">Patient registered successfully</p>
                        </div>
                          <span className="text-[10px] font-normal text-black whitespace-nowrap">2 min ago</span>
                        </div>

                        <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="h-7 w-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FiUserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-black">Doctor Assignment</p>
                            <p className="text-[10px] font-normal text-black mt-0.5">Doctor assigned to patient</p>
                        </div>
                          <span className="text-[10px] font-normal text-black whitespace-nowrap">15 min ago</span>
                        </div>

                        <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="h-7 w-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 font-bold text-xs">R</span>
                      </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-black">Medical Report Generated</p>
                            <p className="text-[10px] font-normal text-black mt-0.5">Lab results completed</p>
                        </div>
                          <span className="text-[10px] font-normal text-black whitespace-nowrap">1 hour ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-black">Quick Actions</h3>
                  </div>
                    <div className="p-4">
                      <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab("doctors")}
                          className="w-full flex items-center space-x-3 p-3 text-left border border-gray-100 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all group"
                      >
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                            <FiUserCheck className="h-4 w-4 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-black group-hover:text-black">Manage Doctors</h4>
                            <p className="text-[10px] font-normal text-black mt-0.5">Add and manage medical staff</p>
                        </div>
                          <span className="text-black group-hover:text-black">→</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("patients")}
                          className="w-full flex items-center space-x-3 p-3 text-left border border-gray-100 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all group"
                      >
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                            <FiUsers className="h-4 w-4 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-black group-hover:text-black">Patient Records</h4>
                            <p className="text-[10px] font-normal text-black mt-0.5">Access patient medical records</p>
                        </div>
                          <span className="text-black group-hover:text-black">→</span>
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "doctors" && hospitalId && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-black">Medical Staff</h2>
                      <p className="text-xs font-normal text-black mt-0.5">Manage doctors and medical professionals</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <DoctorManagement hospitalId={hospitalId} />
                </div>
              </div>
            )}

            {activeTab === "patients" && hospitalId && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-black">Patients</h2>
                      <p className="text-xs font-normal text-black mt-0.5">View and manage patient records</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <PatientList
                    hospitalId={hospitalId}
                    onViewPatient={(patient) => {
                      console.log("View patient:", patient);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HospitalDashboard;
