import { Request, Response, NextFunction } from 'express';
import User from '@/models/User';
import Patient from '@/models/Patient';
import Hospital from '@/models/Hospital';
import Doctor from '@/models/Doctor';
import MedicalCondition from '@/models/MedicalCondition';
import Medication from '@/models/Medication';
import TestResult from '@/models/TestResult';
import HospitalVisit from '@/models/HospitalVisit';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse, DashboardStats } from '@/types';

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
export const getAdminDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Get basic counts
  const totalPatients = await Patient.countDocuments({ status: 'active' });
  const totalHospitals = await Hospital.countDocuments({ status: 'active' });
  const totalDoctors = await Doctor.countDocuments({ isActive: true });
  const pendingHospitals = await Hospital.countDocuments({ status: 'pending' });

  // Get new registrations in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newRegistrations = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Get recent activity
  const recentPatients = await Patient.find({ status: 'active' })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentHospitals = await Hospital.find({ status: 'pending' })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentActivity = [
    ...recentPatients.map(patient => ({
      type: 'patient',
      id: patient._id,
      name: patient.user.name,
      date: patient.createdAt,
      status: 'registered'
    })),
    ...recentHospitals.map(hospital => ({
      type: 'hospital',
      id: hospital._id,
      name: hospital.name,
      date: hospital.createdAt,
      status: 'pending_approval'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  // Get monthly registration trends for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyRegistrations = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const stats: DashboardStats = {
    totalPatients,
    totalHospitals,
    totalDoctors,
    newRegistrations,
    activePatients: totalPatients,
    pendingHospitals,
    recentActivity
  };

  const response: ApiResponse = {
    success: true,
    message: 'Admin dashboard data retrieved successfully',
    data: {
      stats,
      monthlyRegistrations
    }
  };

  res.json(response);
});

// @desc    Get hospital dashboard statistics
// @route   GET /api/dashboard/hospital
// @access  Private (Hospital)
export const getHospitalDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let hospitalId = req.user.hospital || req.params.hospitalId;

  // If hospitalId is not directly available, find it by user ID
  if (!hospitalId && req.user.role === 'hospital') {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (hospital) {
      hospitalId = hospital._id;
    }
  }

  if (!hospitalId) {
    throw new CustomError('Hospital ID is required', 400);
  }

  // Get hospital information with populated data
  const hospital = await Hospital.findById(hospitalId)
    .select('name address contact licenseNumber status adminContact createdAt patients')
    .populate('user', 'name email');

  if (!hospital) {
    throw new CustomError('Hospital not found', 404);
  }

  console.log('Hospital found:', hospital.name);
  console.log('Hospital patients array length:', hospital.patients?.length || 0);

  // Get hospital-specific counts
  const totalDoctors = await Doctor.countDocuments({ hospital: hospitalId, isActive: true });
  
  // Get patient IDs from hospital's patients array
  const hospitalPatientIds = hospital.patients || [];
  console.log('Hospital patient IDs:', hospitalPatientIds);
  
  // Get ALL patients from database for hospital to see
  const allPatientsInDatabase = await Patient.find({})
    .populate('user', 'name email')
    .populate({
      path: 'assignedDoctors',
      select: 'specialization user',
      populate: {
        path: 'user',
        select: 'name'
      }
    })
    .select('nationalId dateOfBirth gender contactNumber address status createdAt hospitalVisits')
    .sort({ createdAt: -1 });

  console.log('Total patients in database:', allPatientsInDatabase.length);
  
  const totalPatients = allPatientsInDatabase.length;
  
  // Get recent patients using all patients
  const recentPatients = allPatientsInDatabase.slice(0, 5);

  // Get all doctors for this hospital
  const doctors = await Doctor.find({ hospital: hospitalId, isActive: true })
    .populate('user', 'name email')
    .select('licenseNumber specialization isActive createdAt')
    .sort({ createdAt: -1 });

  // Return ALL patients from the database (not filtered by hospital)
  const allPatients = allPatientsInDatabase;

  console.log('Returning patients count:', allPatients.length);

  // Get recent medical records
  const recentMedicalConditions = await MedicalCondition.find({ hospital: hospitalId })
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentTestResults = await TestResult.find({ hospital: hospitalId })
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get monthly statistics for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyVisits = await HospitalVisit.aggregate([
    {
      $match: {
        hospital: hospitalId,
        date: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Hospital dashboard data retrieved successfully',
    data: {
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        contact: hospital.contact,
        licenseNumber: hospital.licenseNumber,
        status: hospital.status,
        adminContact: hospital.adminContact,
        email: hospital.user?.email,
        createdAt: hospital.createdAt
      },
      stats: {
        totalDoctors,
        totalPatients,
        recentPatients,
        recentMedicalConditions,
        recentTestResults
      },
      doctors,
      patients: allPatients,
      monthlyVisits
    }
  };

  res.json(response);
});

// @desc    Get doctor dashboard statistics
// @route   GET /api/dashboard/doctor
// @access  Private (Doctor)
export const getDoctorDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let doctorId = req.user.doctor || req.params.doctorId;

  // If doctorId is not directly available, find it by user ID
  if (!doctorId && req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (doctor) {
      doctorId = doctor._id;
    }
  }

  if (!doctorId) {
    throw new CustomError('Doctor ID is required', 400);
  }

  // Get doctor-specific counts - show ALL patients, not just assigned ones
  const totalPatients = await Patient.countDocuments({ status: 'active' }); // All active patients
  const totalMedicalConditions = await MedicalCondition.countDocuments({ doctor: doctorId });
  const totalMedications = await Medication.countDocuments({ doctor: doctorId });
  const totalTestResults = await TestResult.countDocuments({ doctor: doctorId });

  // Get all patients from the database
  const recentPatients = await Patient.find({ status: 'active' })
    .populate('user', 'name email')
    .populate('assignedDoctors', 'specialization')
    .populate('assignedDoctors.user', 'name')
    .sort({ createdAt: -1 });

  // Get recent medical records
  const recentMedicalConditions = await MedicalCondition.find({ doctor: doctorId })
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentMedications = await Medication.find({ doctor: doctorId })
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get critical test results
  const criticalTestResults = await TestResult.find({ 
    doctor: doctorId, 
    status: 'critical' 
  })
    .populate('patient', 'nationalId')
    .populate('patient.user', 'name')
    .sort({ date: -1 })
    .limit(5);

  // Get monthly statistics for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRecords = await MedicalCondition.aggregate([
    {
      $match: {
        doctor: doctorId,
        diagnosed: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$diagnosed' },
          month: { $month: '$diagnosed' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Doctor dashboard data retrieved successfully',
    data: {
      stats: {
        totalPatients,
        totalMedicalConditions,
        totalMedications,
        totalTestResults,
        recentPatients,
        recentMedicalConditions,
        recentMedications,
        criticalTestResults
      },
      monthlyRecords
    }
  };

  res.json(response);
});

// @desc    Get patient dashboard statistics
// @route   GET /api/dashboard/patient
// @access  Private (Patient)
export const getPatientDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const patientId = req.user.patient || req.params.patientId;

  if (!patientId) {
    throw new CustomError('Patient ID is required', 400);
  }

  // Get patient-specific counts
  const totalMedicalConditions = await MedicalCondition.countDocuments({ patient: patientId });
  const totalMedications = await Medication.countDocuments({ patient: patientId });
  const totalTestResults = await TestResult.countDocuments({ patient: patientId });
  const totalHospitalVisits = await HospitalVisit.countDocuments({ patient: patientId });

  // Get active medications
  const activeMedications = await Medication.find({ 
    patient: patientId, 
    status: 'active' 
  })
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .sort({ startDate: -1 });

  // Get recent medical conditions
  const recentMedicalConditions = await MedicalCondition.find({ patient: patientId })
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .sort({ diagnosed: -1 })
    .limit(5);

  // Get recent test results
  const recentTestResults = await TestResult.find({ patient: patientId })
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .populate('hospital', 'name')
    .sort({ date: -1 })
    .limit(5);

  // Get recent hospital visits
  const recentHospitalVisits = await HospitalVisit.find({ patient: patientId })
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .populate('hospital', 'name')
    .sort({ date: -1 })
    .limit(5);

  // Get upcoming follow-ups
  const upcomingFollowUps = await HospitalVisit.find({
    patient: patientId,
    followUpDate: { $gte: new Date() }
  })
    .populate('doctor', 'specialization')
    .populate('doctor.user', 'name')
    .populate('hospital', 'name')
    .sort({ followUpDate: 1 })
    .limit(5);

  // Get monthly health trends for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyHealthData = await MedicalCondition.aggregate([
    {
      $match: {
        patient: patientId,
        diagnosed: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$diagnosed' },
          month: { $month: '$diagnosed' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'Patient dashboard data retrieved successfully',
    data: {
      stats: {
        totalMedicalConditions,
        totalMedications,
        totalTestResults,
        totalHospitalVisits,
        activeMedications,
        recentMedicalConditions,
        recentTestResults,
        recentHospitalVisits,
        upcomingFollowUps
      },
      monthlyHealthData
    }
  };

  res.json(response);
});

// @desc    Get general statistics
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
export const getGeneralStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const totalUsers = await User.countDocuments({ isActive: true });
  const totalPatients = await Patient.countDocuments({ status: 'active' });
  const totalHospitals = await Hospital.countDocuments({ status: 'active' });
  const totalDoctors = await Doctor.countDocuments({ isActive: true });
  const totalMedicalConditions = await MedicalCondition.countDocuments();
  const totalMedications = await Medication.countDocuments();
  const totalTestResults = await TestResult.countDocuments();
  const totalHospitalVisits = await HospitalVisit.countDocuments();

  // Get status distribution
  const hospitalStatusDistribution = await Hospital.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const patientStatusDistribution = await Patient.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const response: ApiResponse = {
    success: true,
    message: 'General statistics retrieved successfully',
    data: {
      totals: {
        users: totalUsers,
        patients: totalPatients,
        hospitals: totalHospitals,
        doctors: totalDoctors,
        medicalConditions: totalMedicalConditions,
        medications: totalMedications,
        testResults: totalTestResults,
        hospitalVisits: totalHospitalVisits
      },
      distributions: {
        hospitals: hospitalStatusDistribution,
        patients: patientStatusDistribution
      }
    }
  };

  res.json(response);
});

// @desc    Get all patients for admin dashboard
// @route   GET /api/dashboard/admin/patients
// @access  Private (Admin)
export const getAllPatients = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔄 Fetching all patients for admin dashboard');
    const patients = await Patient.find()
      .populate('user', 'name email')
      .select('nationalId dateOfBirth gender bloodType contactNumber address emergencyContact status createdAt')
      .sort({ createdAt: -1 });

    console.log('📊 Raw patients from DB:', patients.length, 'patients found');
    console.log('📊 First patient from DB:', patients[0]);

    const formattedPatients = patients.map(patient => ({
      id: patient._id,
      name: patient.user?.name || 'Unknown',
      email: patient.user?.email || 'No email',
      nationalId: patient.nationalId,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodType: patient.bloodType,
      contactNumber: patient.contactNumber,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      status: patient.status,
      registrationDate: patient.createdAt
    }));

    console.log('📊 Formatted patients:', formattedPatients.length, 'patients');
    console.log('📊 First formatted patient:', formattedPatients[0]);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Patients data retrieved successfully',
      data: {
        patients: formattedPatients,
        totalCount: formattedPatients.length
      }
    };

    console.log('✅ Sending response with', formattedPatients.length, 'patients');
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error fetching all patients:', error);
    throw new CustomError('Failed to fetch patients data', 500);
  }
});

// @desc    Get all hospitals for admin dashboard
// @route   GET /api/dashboard/admin/hospitals
// @access  Private (Admin)
export const getAllHospitals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await Hospital.find()
      .populate('user', 'name email')
      .select('name address contact licenseNumber adminContact status createdAt')
      .sort({ createdAt: -1 });

    const formattedHospitals = hospitals.map(hospital => ({
      id: hospital._id,
      name: hospital.name,
      email: hospital.user?.email || 'No email',
      address: hospital.address,
      contact: hospital.contact,
      licenseNumber: hospital.licenseNumber,
      adminContact: hospital.adminContact,
      status: hospital.status,
      registrationDate: hospital.createdAt
    }));

    const response: ApiResponse<any> = {
      success: true,
      message: 'Hospitals data retrieved successfully',
      data: {
        hospitals: formattedHospitals,
        totalCount: formattedHospitals.length
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching all hospitals:', error);
    throw new CustomError('Failed to fetch hospitals data', 500);
  }
});

// @desc    Get comprehensive admin dashboard data
// @route   GET /api/dashboard/admin/overview
// @access  Private (Admin)
export const getAdminOverview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get basic counts
    const totalPatients = await Patient.countDocuments({ status: 'active' });
    const totalHospitals = await Hospital.countDocuments();
    const totalDoctors = await Doctor.countDocuments({ isActive: true });
    const pendingHospitals = await Hospital.countDocuments({ status: 'pending' });

    // Get new registrations in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get recent patients (last 10)
    const recentPatients = await Patient.find({ status: 'active' })
      .populate('user', 'name email')
      .select('nationalId dateOfBirth contactNumber address createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent hospitals (last 10)
    const recentHospitals = await Hospital.find()
      .populate('user', 'name email')
      .select('name address contact status createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Admin overview data retrieved successfully',
      data: {
        stats: {
          totalPatients,
          totalHospitals,
          totalDoctors,
          pendingHospitals,
          newRegistrations,
          systemStatus: 'Online'
        },
        recentPatients: recentPatients.map(patient => ({
          id: patient._id,
          name: patient.user?.name || 'Unknown',
          email: patient.user?.email || 'No email',
          nationalId: patient.nationalId,
          address: patient.address,
          registrationDate: patient.createdAt
        })),
        recentHospitals: recentHospitals.map(hospital => ({
          id: hospital._id,
          name: hospital.name,
          email: hospital.user?.email || 'No email',
          address: hospital.address,
          status: hospital.status,
          registrationDate: hospital.createdAt
        }))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    throw new CustomError('Failed to fetch admin overview data', 500);
  }
});

// Update hospital status
export const updateHospitalStatus = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = req.params;
  const { status } = req.body;

  console.log('🔄 Update hospital status request:', { hospitalId, status });

  if (!hospitalId || !status) {
    throw new CustomError('Hospital ID and status are required', 400);
  }

  if (!['active', 'inactive', 'pending'].includes(status)) {
    throw new CustomError('Invalid status. Must be active, inactive, or pending', 400);
  }

  try {
    console.log('🔄 Finding hospital with ID:', hospitalId);
    const hospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      { status },
      { new: true }
    ).populate('user', 'name email');

    console.log('🏥 Hospital found:', hospital);

    if (!hospital) {
      throw new CustomError('Hospital not found', 404);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: `Hospital status updated to ${status}`,
      data: {
        hospital: {
          id: hospital._id,
          name: hospital.name,
          email: hospital.user?.email,
          status: hospital.status,
          address: hospital.address,
          contact: hospital.contact,
          licenseNumber: hospital.licenseNumber,
          adminContact: hospital.adminContact,
          registrationDate: hospital.createdAt
        }
      }
    };

    console.log('✅ Hospital status update response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error updating hospital status:', error);
    throw new CustomError('Failed to update hospital status', 500);
  }
});

// Update patient status
export const updatePatientStatus = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { status } = req.body;

  console.log('🔄 Update patient status request:', { patientId, status });

  if (!patientId || !status) {
    throw new CustomError('Patient ID and status are required', 400);
  }

  if (!['active', 'inactive'].includes(status)) {
    throw new CustomError('Invalid status. Must be active or inactive', 400);
  }

  try {
    console.log('🔄 Finding patient with ID:', patientId);
    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { status },
      { new: true }
    ).populate('user', 'name email');

    console.log('📊 Patient found:', patient);

    if (!patient) {
      throw new CustomError('Patient not found', 404);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: `Patient status updated to ${status}`,
      data: {
        patient: {
          id: patient._id,
          name: patient.user?.name,
          email: patient.user?.email,
          nationalId: patient.nationalId,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodType: patient.bloodType,
          contactNumber: patient.contactNumber,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          status: patient.status,
          registrationDate: patient.createdAt
        }
      }
    };

    console.log('✅ Patient status update response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error updating patient status:', error);
    throw new CustomError('Failed to update patient status', 500);
  }
});





































