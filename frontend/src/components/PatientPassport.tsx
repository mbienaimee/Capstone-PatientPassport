/* eslint-disable @typescript-eslint/no-explicit-any */
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
  FiHome, 
  FiImage, 
  FiEye,
  FiLogOut
} from 'react-icons/fi';

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
  
  // Pagination state for medical history
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 8;

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
                // Backend may return a Passport model with different shapes depending on API
                // Normalize to the frontend `medicalData` shape: { conditions, medications, tests, visits, images }
                if (passportData.medicalRecords) {
                  setMedicalData(passportData.medicalRecords);
                } else if (passportData.medicalInfo || passportData.medicalInfo?.medicalConditions || passportData.testResults || passportData.hospitalVisits) {
                  const normalized = {
                    conditions: passportData.medicalInfo?.medicalConditions || passportData.medicalInfo?.medicalConditions || [],
                    medications: passportData.medicalInfo?.currentMedications || [],
                    tests: passportData.testResults || [],
                    visits: passportData.hospitalVisits || [],
                    images: passportData.medicalImages || passportData.images || []
                  };
                  setMedicalData(normalized);
                } else if (passportData.passport && (passportData.passport.medicalInfo || passportData.passport.testResults)) {
                  // When the API wraps the passport under data.passport
                  const p = passportData.passport;
                  const normalized = {
                    conditions: p.medicalInfo?.medicalConditions || [],
                    medications: p.medicalInfo?.currentMedications || [],
                    tests: p.testResults || [],
                    visits: p.hospitalVisits || [],
                    images: p.medicalImages || p.images || []
                  };
                  setMedicalData(normalized);
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
        (async () => {
          // If user is a doctor or admin, attempt a patient-level sync before fetching
          try {
            if ((user?.role === 'doctor' || user?.role === 'admin') && patientProfile?.nationalId) {
              console.log('🔁 Auto-triggering patient sync (doctor/admin)...');
              try {
                await apiService.syncPatient(patientProfile.nationalId);
                console.log('🔁 Patient sync triggered');
              } catch (syncErr) {
                console.warn('Auto-sync failed or not permitted:', syncErr);
              }
            }
          } catch (err) {
            console.warn('Error during auto-sync step:', err);
          }

          // Always refresh the passport data after attempting sync
          fetchMedicalRecords(false);
        })();
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
  
  // Debug: Log first condition to see its structure
  if (medicalData.conditions && medicalData.conditions.length > 0) {
    console.log('🔍 First condition structure:', JSON.stringify(medicalData.conditions[0], null, 2));
    const firstCond = medicalData.conditions[0] as any;
    if (firstCond.data) {
      console.log('   - data.doctor:', firstCond.data.doctor);
      console.log('   - data.hospital:', firstCond.data.hospital);
      console.log('   - openmrsData?.creatorName:', firstCond.openmrsData?.creatorName);
      console.log('   - openmrsData?.locationName:', firstCond.openmrsData?.locationName);
    }
  }
  
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

  // FIXED: Extract medications from embedded arrays in conditions
  const medications: Medication[] = [];
  (medicalData.conditions || []).forEach((record: unknown) => {
    if (record && typeof record === 'object') {
      const r = record as any;
      const condData = r.data || r;
      if (condData.medications && Array.isArray(condData.medications)) {
        condData.medications.forEach((med: any) => {
          medications.push({
            name: med.name || med.medicationName || '',
            dosage: med.dosage || '',
            status: (med.medicationStatus || med.status || 'Active') as "Active" | "Past"
          });
        });
      }
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
    const rawTests = medicalData.tests || testResults || [];
    
    // FIXED: Extract medications from conditions (they are embedded in data.medications)
    const rawMedications: any[] = [];
    rawConditions.forEach((c: any) => {
      const condData = c.data || c;
      if (condData.medications && Array.isArray(condData.medications)) {
        condData.medications.forEach((med: any) => {
          rawMedications.push({
            ...med,
            // Preserve parent condition info for date matching
            conditionId: c._id,
            conditionDate: condData.diagnosedDate || condData.diagnosed || condData.date
          });
        });
      }
    });
    
    console.log('🔍 getConsolidatedMedicalHistory - Raw data counts:', {
      visits: rawVisits.length,
      conditions: rawConditions.length,
      medications: rawMedications.length,
      tests: rawTests.length
    });
    
    // Process hospital visits - they contain the most complete information
    const visits = rawVisits;
    const conditions = rawConditions.map((c: any) => {
      // Handle nested data structure from API
      const condData = c.data || c;
      
      // ENHANCED: Extract doctor and hospital from multiple sources
      const doctor = condData.doctor || 
                    condData.diagnosedBy ||
                    c.doctor ||
                    c.openmrsData?.creatorName ||
                    'Unknown Doctor';
      
      const hospital = condData.hospital || 
                      c.hospital ||
                      c.openmrsData?.locationName ||
                      'Unknown Hospital';
      
      return {
        _id: c._id || c.id,
        name: condData.diagnosis || condData.condition || condData.name || '',
        diagnosed: condData.diagnosedDate || condData.diagnosed || condData.date || '',
        details: condData.notes || condData.details || '',
        procedure: condData.diagnosedBy || condData.procedure || '',
        openmrsData: c.openmrsData || condData.openmrsData,
        hospital: hospital,
        doctor: doctor,
        // Preserve the full data object for later extraction
        data: condData
      };
    });
    const tests = rawTests;

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

      // ENHANCED: Extract doctor and hospital names from multiple sources
      const doctorName = getName(visitData.doctor) || 
                        visitData.doctorName || 
                        visitData.diagnosedBy ||
                        visitData.prescribedBy ||
                        visit.openmrsData?.creatorName ||
                        'Unknown Doctor';
      const hospitalName = getName(visitData.hospital) || 
                          visitData.hospital || 
                          visit.openmrsData?.locationName ||
                          'Unknown Hospital';

      // Get diagnosis from visit or related conditions
      const diagnosis = visitData.diagnosis || 
                       visitData.reason ||
                       relatedConditions.map((c: any) => c.name).join(', ') || 
                       'No diagnosis recorded';

      // FIXED: Extract embedded medications from related conditions (NO DUPLICATION)
      const visitMedications: any[] = [];
      relatedConditions.forEach((cond: any) => {
        const condData = cond.data || cond;
        if (condData.medications && Array.isArray(condData.medications)) {
          condData.medications.forEach((med: any) => {
            visitMedications.push({
              name: med.name || med.medicationName || '',
              dosage: med.dosage || '',
              frequency: med.frequency || '',
              startDate: med.startDate,
              endDate: med.endDate,
              prescribedBy: med.prescribedBy || doctorName
            });
          });
        }
      });

      records.push({
        id: visit._id || visit.id || `visit-${index}`,
        date: visitDate,
        diagnosis: diagnosis,
        // carry through openmrs metadata if present on visit
        openmrsData: visitData.openmrsData || visit.openmrsData || visit.data?.openmrsData,
        medications: visitMedications,
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
      // condition already normalized above, use directly
      const conditionDateStr = condition.diagnosed;
      const conditionDate = conditionDateStr ? (typeof conditionDateStr === 'string' ? new Date(conditionDateStr) : conditionDateStr) : new Date();
      
      const hasVisit = visits.some((visit: any) => {
        const visitData = visit.data || visit;
        const visitDate = visitData.date || visitData.visitDate;
        if (!visitDate) return false;
        return datesMatch(visitDate, conditionDate);
      });

      if (!hasVisit) {
        // FIXED: Get medications directly from condition's embedded data
        const condData = condition.data || condition;
        const embeddedMedications = condData.medications || [];

        const relatedTests = tests.filter((t: any) => {
          const testData = t.data || t;
          const testDate = testData.date || testData.testDate;
          if (!testDate) return false;
          return datesMatch(testDate, conditionDate);
        });

        // ENHANCED: Extract doctor and hospital from multiple sources (data object, openmrsData, direct properties)
        const hospitalName = condData.hospital || 
                           condition.hospital?.name || 
                           condition.hospital || 
                           condition.openmrsData?.locationName ||
                           'Unknown Hospital';
        const doctorName = condData.doctor || 
                          condData.diagnosedBy ||
                          condition.doctor?.name || 
                          condition.doctor || 
                          condition.procedure || 
                          condition.openmrsData?.creatorName ||
                          'Unknown Doctor';

        // FIXED: Only use embedded medications (no duplication)
        const allMedications = embeddedMedications.map((med: any) => ({
          name: med.name || med.medicationName || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          startDate: med.startDate,
          endDate: med.endDate,
          prescribedBy: med.prescribedBy || doctorName
        }));

        records.push({
          id: condition._id || `condition-${index}`,
          date: conditionDate,
          diagnosis: condition.name || 'No diagnosis',
          // preserve OpenMRS metadata if present on the condition
          openmrsData: condition.openmrsData,
          medications: allMedications,
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
          visitType: 'Diagnosis Only',
          notes: condition.details || ''
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
  
  // Debug: Log first consolidated record to verify doctor and hospital
  if (consolidatedRecords.length > 0) {
    console.log('🔍 First consolidated record:', {
      id: consolidatedRecords[0].id,
      doctorName: consolidatedRecords[0].doctorName,
      hospitalName: consolidatedRecords[0].hospitalName,
      diagnosis: consolidatedRecords[0].diagnosis
    });
  }
  
  // Calculate pagination values
  const totalRecords = consolidatedRecords.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = consolidatedRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  
  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to top of medical history section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top of medical history section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Empty state component
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
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
              <FiShield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Patient Passport Overview
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Complete medical history and health information
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-green-600 flex items-center gap-2">
                <FiUser className="h-5 w-5" />
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
              <h2 className="dashboard-card-title text-green-600 flex items-center gap-2">
                <FiShield className="h-5 w-5" />
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
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Medical History
              </h2>
              <p className="text-sm text-gray-600">
                Complete medical records with diagnosis, medications, tests, and visit information
              </p>
            </div>
            
            <div className="flex items-center">
              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isRefreshing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-md hover:shadow-lg'
                }`}
                title={lastRefreshTime ? `Last refreshed: ${lastRefreshTime.toLocaleTimeString()}` : 'Refresh data'}
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {consolidatedRecords.length > 0 ? (
              <>
                {/* Pagination Info */}
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold text-green-700">{indexOfFirstRecord + 1}</span> to{' '}
                    <span className="font-semibold text-green-700">
                      {Math.min(indexOfLastRecord, totalRecords)}
                    </span>{' '}
                    of <span className="font-semibold text-green-700">{totalRecords}</span> medical records
                  </div>
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold text-green-700">{currentPage}</span> of{' '}
                    <span className="font-semibold text-green-700">{totalPages}</span>
                  </div>
                </div>

                {/* Medical Records */}
                {currentRecords.map((record: any, index: number) => (
                <div 
                  key={record.id || index}
                  className="bg-white rounded-xl border border-green-500 p-6 shadow-lg hover:shadow-xl transition-all duration-300 mb-5"
                >
                  {/* Header */}
                  <div className="bg-green-500 rounded-lg p-5 mb-5 -m-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <span className="inline-block px-4 py-1.5 bg-green-600 text-white rounded-full text-xs font-bold mb-3">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        <h3 className="text-xl font-bold text-white">
                          {record.visitType || 'Medical Visit'}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-2 md:text-right">
                        <div className="inline-block px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-bold shadow-md">
                          {record.hospitalName || 'Hospital'}
                        </div>
                        <div className="inline-block px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-bold shadow-md">
                          Dr. {record.doctorName || 'Doctor'}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Show OpenMRS synced banner if present */}
                  {((record as any).openmrsData && (record as any).openmrsData.synced) || ((record as any).data && (record as any).data.openmrsData && (record as any).data.openmrsData.synced) ? (
                    <div className="mb-4 px-4 py-3 bg-green-50 border-l-4 border-green-500 text-green-900 rounded-r-lg">
                      <strong className="text-sm font-bold">Synced from OpenMRS</strong>
                      <span className="ml-2 text-sm text-gray-700">{(record as any).diagnosis || (record as any).data?.name || ''}</span>
                      {(record as any).notes || (record as any).data?.treatment ? (
                        <div className="text-xs text-gray-600 mt-1">Treatment: {(record as any).notes || (record as any).data?.treatment}</div>
                      ) : null}
                      <div className="text-xs text-gray-600 mt-1">{(record as any).doctorName || (record as any).data?.doctor || ''} {(record as any).hospitalName ? `| ${ (record as any).hospitalName }` : ''}</div>
                    </div>
                  ) : null}

                  {/* Diagnosis */}
                  <div className="mb-5">
                    <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b-2 border-green-500">
                      Diagnosis
                    </h4>
                    <div className="bg-gray-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                      <p className="text-gray-900 font-semibold text-base leading-relaxed">
                        {record.diagnosis || 'No diagnosis recorded'}
                      </p>
                    </div>
                  </div>

                  {/* Medications */}
                  {record.medications && record.medications.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b-2 border-green-500">
                        Medications
                      </h4>
                      <div className="space-y-3">
                        {record.medications.map((med: any, medIndex: number) => (
                          <div key={medIndex} className="bg-gray-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                              <div className="flex-1">
                                <p className="font-bold text-gray-900 text-lg mb-2">{med.name}</p>
                                <p className="text-sm text-gray-700 font-semibold mb-2">
                                  {med.dosage} - {med.frequency}
                                </p>
                                {med.prescribedBy && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Prescribed by: {med.prescribedBy}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-start md:items-end gap-2">
                                {med.startDate && (
                                  <p className="text-xs text-gray-600 font-medium">Start: {new Date(med.startDate).toLocaleDateString()}</p>
                                )}
                                {med.endDate && (
                                  <p className="text-xs text-gray-600 font-medium">End: {new Date(med.endDate).toLocaleDateString()}</p>
                                )}
                                {!med.endDate && (
                                  <span className="inline-block px-4 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold">
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
                    <div className="mb-5">
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b-2 border-green-500">
                        Test Results
                      </h4>
                      <div className="space-y-3">
                        {record.testResults.map((test: any, testIndex: number) => (
                          <div key={testIndex} className="bg-gray-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                              <div className="flex-1">
                                <p className="font-bold text-gray-900 text-lg mb-2">{test.testType}</p>
                                <p className="text-sm text-gray-700 font-semibold">{test.results}</p>
                              </div>
                              <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                                test.status === 'normal' ? 'bg-green-500 text-white' :
                                test.status === 'abnormal' ? 'bg-green-500 text-white' :
                                'bg-green-500 text-white'
                              }`}>
                                {test.status?.toUpperCase() || 'NORMAL'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {record.notes && (
                    <div className="mt-5 pt-5 border-t-2 border-gray-200">
                      <h4 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b-2 border-green-500">
                        Additional Notes
                      </h4>
                      <div className="bg-gray-50 border-l-4 border-green-500 p-5 rounded-r-lg">
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          {record.notes}
                        </p>
                      </div>
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
              }
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white border-2 border-green-200 rounded-lg px-6 py-4 mt-4">
                  {/* Previous Button */}
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                      // Show all pages if total pages <= 7
                      // Otherwise show first, last, current, and adjacent pages
                      const shouldShow =
                        totalPages <= 7 ||
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

                      if (!shouldShow) {
                        // Show ellipsis for skipped pages
                        if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                          return (
                            <span key={pageNumber} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => goToPage(pageNumber)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            currentPage === pageNumber
                              ? 'bg-green-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                    }`}
                  >
                    <span>Next</span>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <p className="text-lg font-semibold text-gray-700 mb-2">No medical history records available</p>
                <p className="text-sm text-gray-500">Your medical records will appear here once they are added by your healthcare providers.</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical Images */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h2 className="dashboard-card-title text-green-600 flex items-center gap-2">
              <FiImage className="h-5 w-5" />
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