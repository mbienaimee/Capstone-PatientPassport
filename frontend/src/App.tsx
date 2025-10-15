import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PatientPassportLanding from './components/PatientPassportLanding';
import PatientPassportLogin from './components/PatientPassportLogin';
import OTPLogin from './components/OTPLogin';
import PatientRegistrationForm from './components/PatientRegistrationForm';
import HospitalLogin from './components/HospitalLogin';
import HospitalRegistration from './components/HospitalRegistration';
import PatientPassport from './components/PatientPassport';
import UpdatePatientPassport from './components/UpdatePatientPassport';
import EmailVerification from './components/EmailVerification';
import OTPVerification from './components/OTPVerification';
import OTPVerificationPage from './components/OTPVerificationPage';
import HospitalDashboard from './components/HospitalDashboard';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import EnhancedDoctorDashboard from './components/EnhancedDoctorDashboard';
import MyPatients from './components/MyPatients';
import SearchPatient from './components/SearchPatient';
import PatientListDashboard from './components/PatientListDashboard';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import HospitalListPage from './components/HospitalListPage';
import DoctorPatientPassport from './components/DoctorPatientPassport';
import DoctorAccessRequest from './components/DoctorAccessRequest';
import DoctorLoginPage from './components/DoctorLoginPage';

// Wrapper component for OTP verification to handle state
const OTPVerificationWrapper: React.FC = () => {
  const location = useLocation();
  const { email, userType } = location.state || { email: '', userType: 'patient' };
  
  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h1>
          <p className="text-gray-600 mb-6">Please complete registration first.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return <OTPVerification email={email} userType={userType} />;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="app-container bg-gradient-to-br from-slate-50 to-green-50 min-h-screen">
            <Routes>
              {/* Landing and Authentication Routes */}
              <Route path="/" element={<PatientPassportLanding />} />
              <Route path="/patient-login" element={<PatientPassportLogin />} />
              <Route path="/patient-register" element={<PatientRegistrationForm />} />
              <Route path="/hospital-login" element={<HospitalLogin />} />
              <Route path="/hospital-register" element={<HospitalRegistration />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/otp-verification" element={<OTPVerificationPage />} />
              
              {/* Patient Routes */}
              <Route path="/patient-passport" element={<PatientPassport />} />
              <Route path="/update-passport" element={<UpdatePatientPassport />} />
              <Route path="/otp-login" element={<OTPLogin />} />
              
              {/* Hospital Routes */}
              <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
              <Route path="/doctor-patient-passport" element={<DoctorPatientPassport />} />
              <Route path="/doctor-access-request" element={<DoctorAccessRequest />} />
              
              {/* Admin Routes */}
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/patient-list" element={<PatientListDashboard />} />
              <Route path="/hospital-list" element={<HospitalListPage />} />

              
              {/* Doctor Routes */}
              <Route path="/doctor-login" element={<DoctorLoginPage />} />
              <Route path="/doctor-dashboard" element={<EnhancedDoctorDashboard />} />
              <Route path="/doctor-dashboard-original" element={<DoctorDashboard />} />
              <Route path="/my-patients" element={<MyPatients />} />
              <Route path="/search-patient" element={<SearchPatient />} />
              
              {/* Receptionist Routes */}
              <Route path="/receptionist-dashboard" element={<ReceptionistDashboard />} />
              
              {/* Fallback Route */}
              <Route path="*" element={<PatientPassportLanding />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
