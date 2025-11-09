import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import Logo from "./Logo";
import { 
  FiUser, 
  FiMail, 
  FiShield, 
  FiCalendar, 
  FiPhone, 
  FiHeart, 
  FiActivity, 
  FiHome, 
  FiImage, 
  FiChevronDown, 
  FiEye, 
  FiBell,
  FiLogOut,
  FiFileText,
  FiBuilding,
  FiPill
} from 'react-icons/fi';
import { Calendar, Stethoscope, Building as BuildingIcon, User, Pill, Activity, FileText, RefreshCw } from 'lucide-react';

interface MedicalCondition {
  name: string;
  details: string;
  diagnosed?: string;
  procedure?: string;
}

interface Medication {
  name: string;
  dosage: string;
  status: "Active" | "Past";
}

interface TestResult {
  name: string;
  date: string;
  status: "Normal" | "Critical" | "Normal Sinus Rhythm";
}

interface HospitalVisit {
  hospital: string;
  reason: string;
  date: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface PatientProfile {
  _id: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  address: string;
  emergencyContact: EmergencyContact;
  bloodType?: string;
  allergies?: string[];
  status: string;
}

const PatientPassport: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [expandedCondition, setExpandedCondition] = useState<number | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [medicalData, setMedicalData] = useState<{
    conditions: MedicalCondition[];
    medications: Medication[];
    tests: TestResult[];
    visits: HospitalVisit[];
    images: unknown[];
  }>({
    conditions: [],
    medications: [],
    tests: [],
    visits: [],
    images: []
  });
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/patient-login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Fetch medical records and patient profile when component mounts
  useEffect(() => {
    const fetchMedicalRecords = async (isManualRefresh = false) => {
      if (isAuthenticated && user?.id) {
        try {
          if (isManualRefresh) {
            setIsRefreshing(true);
          } else {
            setDataLoading(true);
          }
          console.log('Fetching complete patient passport data...');
          
          // Get the patient profile including emergency contact information
          const patientResponse = await apiService.getCurrentUser();
          console.log('Patient profile response:', patientResponse);
          
          if (patientResponse.success && patientResponse.data) {
            // Set patient profile data (includes emergency contact)
            const profile = (patientResponse.data as unknown as { profile: PatientProfile }).profile;
            console.log('Patient profile data:', profile);
            console.log('Emergency contact:', profile?.emergencyContact);
            setPatientProfile(profile);
            
            // Fetch complete passport data using the new endpoint
            if (profile?._id) {
              const response = await apiService.getPatientPassport(profile._id);
              console.log('Complete passport response:', response);
              
              if (response.success && response.data) {
                const passportData = response.data;
                console.log('Passport data:', passportData);
                console.log('Medical records structure:', passportData.medicalRecords);
                console.log('Conditions array:', passportData.medicalRecords?.conditions);
                console.log('Medications array:', passportData.medicalRecords?.medications);
                console.log('Tests array:', passportData.medicalRecords?.tests);
                console.log('Visits array:', passportData.medicalRecords?.visits);
                
                // Set medical data from the passport response
                if (passportData.medicalRecords) {
                  setMedicalData(passportData.medicalRecords);
                }
                
                // Update patient profile with complete data if available
                if (passportData.patient) {
                  setPatientProfile(passportData.patient);
                }
              }
            } else {
              console.warn('No patient profile ID found');
              // Set empty data if no profile ID
              setMedicalData({
                conditions: [],
                medications: [],
                tests: [],
                visits: [],
                images: []
              });
            }
          } else {
            console.warn('Failed to fetch patient profile:', patientResponse.message);
            // Set empty data on error
            setMedicalData({
              conditions: [],
              medications: [],
              tests: [],
              visits: [],
              images: []
            });
            setPatientProfile(null);
          }
        } catch (error) {
          console.error('Error fetching medical records:', error);
          // Set empty data on error to show empty state
          setMedicalData({
            conditions: [],
            medications: [],
            tests: [],
            visits: [],
            images: []
          });
          setPatientProfile(null);
        } finally {
          setDataLoading(false);
          setIsRefreshing(false);
          setLastRefreshTime(new Date());
        }
      }
    };

    fetchMedicalRecords();

    // Auto-refresh medical records every 60 seconds to catch new OpenMRS synced observations
    const refreshInterval = setInterval(() => {
      if (isAuthenticated && user?.id) {
        console.log('🔄 Auto-refreshing medical records...');
        fetchMedicalRecords(false); // Auto-refresh
      }
    }, 60000); // Refresh every 60 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, user?.id]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (isAuthenticated && user?.id) {
      setIsRefreshing(true);
      try {
        console.log('🔄 Manual refresh triggered...');
        // Get the patient profile including emergency contact information
        const patientResponse = await apiService.getCurrentUser();
        
        if (patientResponse.success && patientResponse.data) {
          const profile = (patientResponse.data as unknown as { profile: PatientProfile }).profile;
          setPatientProfile(profile);
          
          // Fetch complete passport data
          if (profile?._id) {
            const response = await apiService.getPatientPassport(profile._id);
            
            if (response.success && response.data) {
              const passportData = response.data;
              
              if (passportData.medicalRecords) {
                setMedicalData(passportData.medicalRecords);
              }
              
              if (passportData.patient) {
                setPatientProfile(passportData.patient);
              }
              
              console.log('✅ Data refreshed successfully');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error refreshing data:', error);
      } finally {
        setIsRefreshing(false);
        setLastRefreshTime(new Date());
      }
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your passport...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Transform database records to component format
  console.log('Current medicalData state:', medicalData);
  console.log('Conditions to process:', medicalData.conditions);
  
  const medicalHistory: MedicalCondition[] = (medicalData.conditions || []).map((record: unknown, index: number) => {
    try {
      console.log(`Processing condition ${index}:`, record);
      
      // Handle different possible data structures
      let conditionData: any = {};
      
      if (record && typeof record === 'object') {
        const r = record as any;
        // Check if it has a 'data' property (new format)
        if (r.data && typeof r.data === 'object') {
          conditionData = r.data;
        }
        // Check if it has direct properties (old format)
        else if (r.condition || r.name) {
          conditionData = {
            name: r.condition || r.name || '',
            details: r.notes || r.details || '',
            diagnosed: r.diagnosedDate || r.diagnosed || '',
            procedure: r.diagnosedBy || r.procedure || ''
          };
        }
        // Fallback to direct mapping
        else {
          conditionData = r;
        }
      }
      
      return {
        name: conditionData.name || '',
        details: conditionData.details || '',
        diagnosed: conditionData.diagnosed || '',
        procedure: conditionData.procedure || ''
      };
    } catch (error) {
      console.error(`Error processing condition ${index}:`, error, record);
      return {
        name: '',
        details: '',
        diagnosed: '',
        procedure: ''
      };
    }
  });

  const medications: Medication[] = (medicalData.medications || []).map((record: unknown, index: number) => {
    try {
      console.log(`Processing medication ${index}:`, record);
      
      // Handle different possible data structures
      let medicationData: any = {};
      
      if (record && typeof record === 'object') {
        const r = record as any;
        // Check if it has a 'data' property (new format)
        if (r.data && typeof r.data === 'object') {
          medicationData = r.data;
        }
        // Check if it has direct properties (old format)
        else if (r.name || r.medicationName) {
          medicationData = {
            medicationName: r.name || r.medicationName || '',
            dosage: r.dosage || '',
            status: r.status || 'Active'
          };
        }
        // Fallback to direct mapping
        else {
          medicationData = r;
        }
      }
      
      return {
        name: medicationData.medicationName || medicationData.name || '',
        dosage: medicationData.dosage || '',
        status: (medicationData.status || 'Active') as "Active" | "Past"
      };
    } catch (error) {
      console.error(`Error processing medication ${index}:`, error, record);
      return {
        name: '',
        dosage: '',
        status: 'Active' as "Active" | "Past"
      };
    }
  });

  const testResults: TestResult[] = (medicalData.tests || []).map((record: unknown, index: number) => {
    try {
      console.log(`Processing test ${index}:`, record);
      
      // Handle different possible data structures
      let testData: any = {};
      
      if (record && typeof record === 'object') {
        const r = record as any;
        // Check if it has a 'data' property (new format)
        if (r.data && typeof r.data === 'object') {
          testData = r.data;
        }
        // Check if it has direct properties (old format)
        else if (r.testType || r.testName) {
          testData = {
            testName: r.testType || r.testName || '',
            testDate: r.testDate || '',
            status: r.status || 'Normal'
          };
        }
        // Fallback to direct mapping
        else {
          testData = r;
        }
      }
      
      return {
        name: testData.testName || testData.testType || '',
        date: testData.testDate || '',
        status: (testData.status || 'Normal') as "Normal" | "Critical" | "Normal Sinus Rhythm"
      };
    } catch (error) {
      console.error(`Error processing test ${index}:`, error, record);
      return {
        name: '',
        date: '',
        status: 'Normal' as "Normal" | "Critical" | "Normal Sinus Rhythm"
      };
    }
  });

  const hospitalVisits: HospitalVisit[] = (medicalData.visits || []).map((record: unknown, index: number) => {
    try {
      console.log(`Processing visit ${index}:`, record);
      
      // Handle different possible data structures
      let visitData: any = {};
      
      if (record && typeof record === 'object') {
        const r = record as any;
        // Check if it has a 'data' property (new format)
        if (r.data && typeof r.data === 'object') {
          visitData = r.data;
        }
        // Check if it has direct properties (old format)
        else if (r.hospital || r.reason) {
          visitData = {
            hospital: r.hospital || '',
            reason: r.reason || '',
            visitDate: r.visitDate || ''
          };
        }
        // Fallback to direct mapping
        else {
          visitData = r;
        }
      }
      
      return {
        hospital: visitData.hospital || '',
        reason: visitData.reason || '',
        date: visitData.visitDate || ''
      };
    } catch (error) {
      console.error(`Error processing visit ${index}:`, error, record);
      return {
        hospital: '',
        reason: '',
        date: ''
      };
    }
  });

  const medicalImages = (medicalData.images || []).map((record: unknown, index: number) => {
    try {
      console.log(`Processing image ${index}:`, record);
      
      // Handle different possible data structures
      let imageData: any = {};
      
      if (record && typeof record === 'object') {
        const r = record as any;
        // Check if it has a 'data' property (new format)
        if (r.data && typeof r.data === 'object') {
          imageData = r.data;
        }
        // Check if it has direct properties (old format)
        else if (r.imageUrl || r.url) {
          imageData = {
            imageUrl: r.imageUrl || r.url || '',
            description: r.description || ''
          };
        }
        // Fallback to direct mapping
        else {
          imageData = r;
        }
      }
      
      return {
        url: imageData.imageUrl || imageData.url || '',
        alt: imageData.description || 'Medical Image'
      };
    } catch (error) {
      console.error(`Error processing image ${index}:`, error, record);
      return {
        url: '',
        alt: 'Medical Image'
      };
    }
  });

  // Helper function to extract name from object or string
  const getName = (obj: any): string => {
    if (!obj) return 'Unknown';
    if (typeof obj === 'string') return obj;
    if (obj.name) return obj.name;
    if (obj.user?.name) return obj.user.name;
    return 'Unknown';
  };

  // Helper function to check if dates are close (within same day)
  const datesMatch = (date1: any, date2: any): boolean => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  // Combine medical history data into consolidated records
  const getConsolidatedMedicalHistory = () => {
    const records: any[] = [];
    
    // Get raw data from medicalData for better compatibility
    const rawVisits = medicalData.visits || hospitalVisits || [];
    const rawConditions = medicalData.conditions || medicalHistory || [];
    const rawMedications = medicalData.medications || medications || [];
    const rawTests = medicalData.tests || testResults || [];
    
    // Process hospital visits - they contain the most complete information
    const visits = rawVisits;
    const conditions = medicalHistory.length > 0 ? medicalHistory : rawConditions.map((c: any) => ({
      name: c.condition || c.name || '',
      diagnosed: c.diagnosedDate || c.diagnosed || c.date || '',
      details: c.notes || c.details || '',
      procedure: c.diagnosedBy || c.procedure || ''
    }));
    const meds = medications.length > 0 ? medications : rawMedications;
    const tests = testResults.length > 0 ? testResults : rawTests;

    // Create consolidated records from hospital visits
    visits.forEach((visit: any, index: number) => {
      // Extract visit data (handle both direct and nested formats)
      const visitData = visit.data || visit;
      const visitDateStr = visitData.date || visitData.visitDate;
      const visitDate = visitDateStr ? (typeof visitDateStr === 'string' ? new Date(visitDateStr) : visitDateStr) : new Date();
      
      // Find related conditions (diagnosed on the same date)
      const relatedConditions = conditions.filter((c: any) => {
        const condDate = c.diagnosed || c.diagnosedDate;
        if (!condDate) return false;
        return datesMatch(condDate, visitDate);
      });
      
      // Find related medications (prescribed around visit date)
      const relatedMedications = meds.filter((m: any) => {
        const medData = m.data || m;
        const startDate = medData.startDate;
        if (!startDate) return false;
        const medDate = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const visit = typeof visitDate === 'string' ? new Date(visitDate) : visitDate;
        const daysDiff = Math.abs((medDate.getTime() - visit.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      });

      // Find related tests (tested on the same date or within 3 days)
      const relatedTests = tests.filter((t: any) => {
        const testData = t.data || t;
        const testDate = testData.date || testData.testDate;
        if (!testDate) return false;
        const test = typeof testDate === 'string' ? new Date(testDate) : testDate;
        const visit = typeof visitDate === 'string' ? new Date(visitDate) : visitDate;
        const daysDiff = Math.abs((test.getTime() - visit.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 3;
      });

      // Extract doctor and hospital names
      const doctorName = getName(visitData.doctor) || visitData.doctorName || 'Unknown';
      const hospitalName = getName(visitData.hospital) || visitData.hospital || 'Unknown';

      // Get diagnosis from visit or related conditions
      const diagnosis = visitData.diagnosis || 
                       visitData.reason ||
                       relatedConditions.map((c: any) => c.name).join(', ') || 
                       'No diagnosis recorded';

      records.push({
        id: visit._id || visit.id || `visit-${index}`,
        date: visitDate,
        diagnosis: diagnosis,
        medications: relatedMedications.map((m: any) => {
          const medData = m.data || m;
          return {
            name: medData.medicationName || medData.name || '',
            dosage: medData.dosage || '',
            frequency: medData.frequency || '',
            startDate: medData.startDate,
            endDate: medData.endDate,
            prescribedBy: getName(medData.prescribedBy)
          };
        }),
        testResults: relatedTests.map((t: any) => {
          const testData = t.data || t;
          return {
            testType: testData.testName || testData.testType || testData.name || '',
            results: testData.result || testData.results || '',
            status: testData.status || 'normal',
            date: testData.date || testData.testDate
          };
        }),
        doctorName: doctorName,
        hospitalName: hospitalName,
        visitType: visitData.reason || 'General Visit',
        notes: visitData.treatment || visitData.notes || ''
      });
    });

    // Add standalone conditions without visits
    conditions.forEach((condition: any, index: number) => {
      const condData = condition.data || condition;
      const conditionDateStr = condData.diagnosed || condData.diagnosedDate || condData.date;
      const conditionDate = conditionDateStr ? (typeof conditionDateStr === 'string' ? new Date(conditionDateStr) : conditionDateStr) : new Date();
      
      const hasVisit = visits.some((visit: any) => {
        const visitData = visit.data || visit;
        const visitDate = visitData.date || visitData.visitDate;
        if (!visitDate) return false;
        return datesMatch(visitDate, conditionDate);
      });

      if (!hasVisit) {
        // Find medications and tests around this condition date
        const relatedMedications = meds.filter((m: any) => {
          const medData = m.data || m;
          const startDate = medData.startDate;
          if (!startDate) return false;
          return datesMatch(startDate, conditionDate);
        });

        const relatedTests = tests.filter((t: any) => {
          const testData = t.data || t;
          const testDate = testData.date || testData.testDate;
          if (!testDate) return false;
          return datesMatch(testDate, conditionDate);
        });

        records.push({
          id: condition._id || condition.id || `condition-${index}`,
          date: conditionDate,
          diagnosis: condData.condition || condData.name || 'No diagnosis',
          medications: relatedMedications.map((m: any) => {
            const medData = m.data || m;
            return {
              name: medData.medicationName || medData.name || '',
              dosage: medData.dosage || '',
              frequency: medData.frequency || '',
              startDate: medData.startDate,
              endDate: medData.endDate,
              prescribedBy: getName(medData.prescribedBy)
            };
          }),
          testResults: relatedTests.map((t: any) => {
            const testData = t.data || t;
            return {
              testType: testData.testName || testData.testType || testData.name || '',
              results: testData.result || testData.results || '',
              status: testData.status || 'normal',
              date: testData.date || testData.testDate
            };
          }),
          doctorName: condData.diagnosedBy || condData.procedure || 'Unknown',
          hospitalName: 'Unknown',
          visitType: 'Diagnosis Only',
          notes: condData.notes || condData.details || ''
        });
      }
    });

    // Sort by date (most recent first)
    return records.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  };

  const consolidatedRecords = getConsolidatedMedicalHistory();

  // Empty state component
  const isMedicationCurrentlyActive = (medication: any) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Check if medication is active based on status and dates
    if (medication.status !== 'active' && medication.status !== 'Active') return false;
    
    // Check start date
    if (medication.startDate) {
      const startDate = new Date(medication.startDate);
      if (startDate > now) return false;
    }
    
    // Check end date
    if (medication.endDate) {
      const endDate = new Date(medication.endDate);
      if (endDate < now) return false;
    }
    
    // If no time constraints, medication is active
    if (!medication.startTime && !medication.endTime) return true;
    
    // Check time constraints
    if (medication.startTime) {
      const [startHour, startMinute] = medication.startTime.split(':').map(Number);
      const startTimeMinutes = startHour * 60 + startMinute;
      if (currentTime < startTimeMinutes) return false;
    }
    
    if (medication.endTime) {
      const [endHour, endMinute] = medication.endTime.split(':').map(Number);
      const endTimeMinutes = endHour * 60 + endMinute;
      if (currentTime > endTimeMinutes) return false;
    }
    
    return true;
  };

  const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) => (
    <div className="text-center py-6">
      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden sm:flex items-center space-x-4 lg:space-x-6">
            <button 
              onClick={() => navigate('/')}
              className="nav-link"
            >
              Home
            </button>
            <button className="nav-link-active">
              My Passport
            </button>
            <button 
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="nav-link flex items-center gap-2"
            >
              <FiLogOut className="w-4 h-4" />
              Logout
            </button>
          </nav>
          
          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="sm:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <button 
                onClick={() => {
                  navigate('/');
                  setShowMobileMenu(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Home
              </button>
              <button className="block w-full text-left px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md">
                My Passport
              </button>
              <button 
                onClick={async () => {
                  await logout();
                  navigate('/');
                  setShowMobileMenu(false);
                }}
                className="flex w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md items-center gap-2"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Patient Passport Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Complete medical history and health information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-green-600">
                Patient Information
              </h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 py-2">
                <FiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">Name</span>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{user?.name || 'Loading...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">Email</span>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{user?.email || 'Loading...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiShield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">Role</span>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 capitalize">{user?.role || 'Loading...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiShield className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">National ID</span>
                  <p className="text-sm font-semibold text-gray-900">{patientProfile?.nationalId || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Date of Birth</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {patientProfile?.dateOfBirth ? new Date(patientProfile.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Gender</span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{patientProfile?.gender || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Contact Number</span>
                  <p className="text-sm font-semibold text-gray-900">{patientProfile?.contactNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <FiHome className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-500">Address</span>
                  <p className="text-sm font-semibold text-gray-900">{patientProfile?.address || 'N/A'}</p>
                </div>
              </div>
              {patientProfile?.bloodType && (
                <div className="flex items-center gap-3 py-2">
                  <FiHeart className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-500">Blood Type</span>
                    <p className="text-sm font-semibold text-gray-900">{patientProfile.bloodType}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title text-green-600">
                Emergency Contact
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiPhone className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
              </div>
              <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                {patientProfile?.emergencyContact ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 block sm:inline">Name</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {patientProfile.emergencyContact.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiHeart className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 block sm:inline">Relationship</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {patientProfile.emergencyContact.relationship || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-500 block sm:inline">Phone</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {patientProfile.emergencyContact.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <FiPhone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No emergency contact information available</p>
                    <p className="text-gray-400 text-xs mt-1">Please update your profile to add emergency contact details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Medical History - All in One Card */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Activity className="h-6 w-6 mr-2 text-green-600" />
                Medical History
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete medical records with diagnosis, medications, tests, and visit information
              </p>
            </div>
            
            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isRefreshing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 active:scale-95'
              }`}
              title={lastRefreshTime ? `Last refreshed: ${lastRefreshTime.toLocaleTimeString()}` : 'Refresh data'}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {consolidatedRecords.length > 0 ? (
              consolidatedRecords.map((record: any, index: number) => (
                <div 
                  key={record.id || index}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">{record.visitType}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-2 bg-green-50 px-3 py-1.5 rounded border border-green-200">
                          <BuildingIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-700">{record.hospitalName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-700">{record.doctorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-red-500" />
                      Diagnosis
                    </h4>
                    <p className="text-gray-900 bg-white p-3 rounded border border-green-200">
                      {record.diagnosis || 'No diagnosis recorded'}
                    </p>
                  </div>

                  {/* Medications */}
                  {record.medications && record.medications.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Pill className="h-4 w-4 mr-1 text-blue-500" />
                        Medications
                      </h4>
                      <div className="space-y-2">
                        {record.medications.map((med: any, medIndex: number) => (
                          <div key={medIndex} className="bg-white p-3 rounded border border-green-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{med.name}</p>
                                <p className="text-sm text-gray-600">
                                  {med.dosage} - {med.frequency}
                                </p>
                                {med.prescribedBy && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Prescribed by: {med.prescribedBy}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                {med.startDate && (
                                  <p>Start: {new Date(med.startDate).toLocaleDateString()}</p>
                                )}
                                {med.endDate && (
                                  <p>End: {new Date(med.endDate).toLocaleDateString()}</p>
                                )}
                                {!med.endDate && (
                                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs mt-1">
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Results */}
                  {record.testResults && record.testResults.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-1 text-green-500" />
                        Test Results
                      </h4>
                      <div className="space-y-2">
                        {record.testResults.map((test: any, testIndex: number) => (
                          <div key={testIndex} className="bg-white p-3 rounded border border-green-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{test.testType}</p>
                                <p className="text-sm text-gray-700 mt-1">{test.results}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                test.status === 'normal' ? 'bg-green-100 text-green-800' :
                                test.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {test.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {record.notes && (
                    <div className="mt-4 pt-4 border-t border-green-300">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded border border-green-200">
                        {record.notes}
                      </p>
                    </div>
                  )}

                  {/* No medications or tests message */}
                  {(!record.medications || record.medications.length === 0) && 
                   (!record.testResults || record.testResults.length === 0) && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No medications or test results recorded for this visit
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No medical history records available</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical Images */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title text-green-600">
              Medical Images
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Uploaded X-rays, scans, and other diagnostic images
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {medicalImages.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title="No Medical Images" 
                  description="Your X-rays, scans, and other diagnostic images will appear here once uploaded by your healthcare providers."
                  icon={FiImage}
                />
              </div>
            ) : (
              medicalImages.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 cursor-pointer hover:opacity-90 transition-opacity shadow-md hover:shadow-lg group"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <FiEye className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientPassport;