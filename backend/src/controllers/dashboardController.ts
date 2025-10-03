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
  const hospitalId = req.user.hospital || req.params.hospitalId;

  if (!hospitalId) {
    throw new CustomError('Hospital ID is required', 400);
  }

  // Get hospital-specific counts
  const totalDoctors = await Doctor.countDocuments({ hospital: hospitalId, isActive: true });
  const totalPatients = await Patient.countDocuments({ hospitalVisits: { $in: [hospitalId] } });

  // Get recent patients
  const recentPatients = await Patient.find({ hospitalVisits: { $in: [hospitalId] } })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

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
      stats: {
        totalDoctors,
        totalPatients,
        recentPatients,
        recentMedicalConditions,
        recentTestResults
      },
      monthlyVisits
    }
  };

  res.json(response);
});

// @desc    Get doctor dashboard statistics
// @route   GET /api/dashboard/doctor
// @access  Private (Doctor)
export const getDoctorDashboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const doctorId = req.user.doctor || req.params.doctorId;

  if (!doctorId) {
    throw new CustomError('Doctor ID is required', 400);
  }

  // Get doctor-specific counts
  const totalPatients = await Patient.countDocuments({ assignedDoctors: { $in: [doctorId] } });
  const totalMedicalConditions = await MedicalCondition.countDocuments({ doctor: doctorId });
  const totalMedications = await Medication.countDocuments({ doctor: doctorId });
  const totalTestResults = await TestResult.countDocuments({ doctor: doctorId });

  // Get recent patients
  const recentPatients = await Patient.find({ assignedDoctors: { $in: [doctorId] } })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

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








