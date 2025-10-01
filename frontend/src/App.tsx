import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientPassportLanding from './components/PatientPassportLanding';
import PatientPassportLogin from './components/PatientPassportLogin';
import PatientRegistrationForm from './components/PatientRegistrationForm';
import HospitalLogin from './components/HospitalLogin';
import HospitalRegistration from './components/HospitalRegistration';
import PatientPassport from './components/PatientPassport';
import UpdatePatientPassport from './components/UpdatePatientPassport';
import AdminDashboard from './components/AdminDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import MyPatients from './components/MyPatients';
import SearchPatient from './components/SearchPatient';
import PatientListDashboard from './components/PatientListDashboard';
import HospitalListPage from './components/HospitalListPage';

export default function App() {
  return (
    <Router>
      <div className="app-container bg-gradient-to-br from-slate-50 to-green-50">
        <Routes>
          {/* Landing and Authentication Routes */}
          <Route path="/" element={<PatientPassportLanding />} />
          <Route path="/patient-login" element={<PatientPassportLogin />} />
          <Route path="/patient-register" element={<PatientRegistrationForm />} />
          <Route path="/hospital-login" element={<HospitalLogin />} />
          <Route path="/hospital-register" element={<HospitalRegistration />} />
          
          {/* Patient Routes */}
          <Route path="/patient-passport" element={<PatientPassport />} />
          <Route path="/update-passport" element={<UpdatePatientPassport />} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/patient-list" element={<PatientListDashboard />} />
          <Route path="/hospital-list" element={<HospitalListPage />} />

          
          {/* Doctor Routes */}
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/my-patients" element={<MyPatients />} />
          <Route path="/search-patient" element={<SearchPatient />} />
          
          {/* Fallback Route */}
          <Route path="*" element={<PatientPassportLanding />} />
        </Routes>
      </div>
    </Router>
  );
}
