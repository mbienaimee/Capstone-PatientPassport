import { Request, Response, NextFunction } from 'express';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { ApiResponse } from '@/types';

// @desc    Assign patient to doctor
// @route   POST /api/assignments/assign-patient
// @access  Private (Receptionist, Admin)
export const assignPatientToDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId, doctorId, reason, priority = 'normal' } = req.body;

  if (!patientId || !doctorId) {
    throw new CustomError('Patient ID and Doctor ID are required', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId).populate('user', 'name email');
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Verify doctor exists and is active
  const doctor = await Doctor.findById(doctorId).populate('user', 'name email');
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  if (!doctor.isActive) {
    throw new CustomError('Doctor is not active', 400);
  }

  // Check if patient is already assigned to this doctor
  if (patient.assignedDoctors.includes(doctorId)) {
    throw new CustomError('Patient is already assigned to this doctor', 400);
  }

  // Add doctor to patient's assigned doctors
  patient.assignedDoctors.push(doctorId);
  await patient.save();

  // Add patient to doctor's patients list
  if (!doctor.patients.includes(patientId)) {
    doctor.patients.push(patientId);
    await doctor.save();
  }

  const response: ApiResponse = {
    success: true,
    message: 'Patient successfully assigned to doctor',
    data: {
      patient: {
        id: patient._id,
        name: patient.user.name,
        nationalId: patient.nationalId
      },
      doctor: {
        id: doctor._id,
        name: doctor.user.name,
        specialization: doctor.specialization
      },
      assignmentDate: new Date(),
      reason,
      priority
    }
  };

  res.status(201).json(response);
});

// @desc    Remove patient from doctor
// @route   DELETE /api/assignments/remove-patient
// @access  Private (Receptionist, Admin, Doctor)
export const removePatientFromDoctor = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId, doctorId, reason } = req.body;

  if (!patientId || !doctorId) {
    throw new CustomError('Patient ID and Doctor ID are required', 400);
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  // Remove doctor from patient's assigned doctors
  patient.assignedDoctors = patient.assignedDoctors.filter(id => id.toString() !== doctorId);
  await patient.save();

  // Remove patient from doctor's patients list
  doctor.patients = doctor.patients.filter(id => id.toString() !== patientId);
  await doctor.save();

  const response: ApiResponse = {
    success: true,
    message: 'Patient successfully removed from doctor',
    data: {
      patientId,
      doctorId,
      removalDate: new Date(),
      reason
    }
  };

  res.json(response);
});

// @desc    Get all assignments for a doctor
// @route   GET /api/assignments/doctor/:doctorId
// @access  Private (Doctor, Admin)
export const getDoctorAssignments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { doctorId } = req.params;

  const doctor = await Doctor.findById(doctorId)
    .populate('user', 'name email')
    .populate({
      path: 'patients',
      populate: {
        path: 'user',
        select: 'name email'
      }
    });

  if (!doctor) {
    throw new CustomError('Doctor not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Doctor assignments retrieved successfully',
    data: {
      doctor: {
        id: doctor._id,
        name: doctor.user.name,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber
      },
      patients: doctor.patients.map((patient: any) => ({
        id: patient._id,
        name: patient.user.name,
        nationalId: patient.nationalId,
        age: (patient as any).age,
        bloodType: patient.bloodType,
        status: patient.status
      })),
      totalPatients: doctor.patients.length
    }
  };

  res.json(response);
});

// @desc    Get all assignments for a patient
// @route   GET /api/assignments/patient/:patientId
// @access  Private (Patient, Doctor, Admin)
export const getPatientAssignments = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { patientId } = req.params;

  const patient = await Patient.findById(patientId)
    .populate('user', 'name email')
    .populate({
      path: 'assignedDoctors',
      populate: {
        path: 'user',
        select: 'name email'
      }
    });

  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Patient assignments retrieved successfully',
    data: {
      patient: {
        id: patient._id,
        name: patient.user.name,
        nationalId: patient.nationalId,
        age: (patient as any).age
      },
      doctors: patient.assignedDoctors.map((doctor: any) => ({
        id: doctor._id,
        name: doctor.user.name,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber
      })),
      totalDoctors: patient.assignedDoctors.length
    }
  };

  res.json(response);
});

// @desc    Get available doctors for assignment
// @route   GET /api/assignments/available-doctors
// @access  Private (Receptionist, Admin)
export const getAvailableDoctors = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { specialization, hospitalId } = req.query;

  const query: any = { isActive: true };
  
  if (specialization) {
    query.specialization = specialization;
  }
  
  if (hospitalId) {
    query.hospital = hospitalId;
  }

  const doctors = await Doctor.find(query)
    .populate('user', 'name email')
    .populate('hospital', 'name')
    .select('specialization licenseNumber patients');

  const availableDoctors = doctors.map(doctor => ({
    id: doctor._id,
    name: doctor.user.name,
    specialization: doctor.specialization,
    licenseNumber: doctor.licenseNumber,
    hospital: doctor.hospital.name,
    currentPatientCount: doctor.patients.length,
    isAvailable: doctor.patients.length < 50 // Assuming max 50 patients per doctor
  }));

  const response: ApiResponse = {
    success: true,
    message: 'Available doctors retrieved successfully',
    data: availableDoctors
  };

  res.json(response);
});

// @desc    Get assignment statistics
// @route   GET /api/assignments/statistics
// @access  Private (Admin)
export const getAssignmentStatistics = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const totalPatients = await Patient.countDocuments({ status: 'active' });
  const totalDoctors = await Doctor.countDocuments({ isActive: true });
  const unassignedPatients = await Patient.countDocuments({ 
    status: 'active', 
    assignedDoctors: { $size: 0 } 
  });
  const overassignedDoctors = await Doctor.countDocuments({
    isActive: true,
    $expr: { $gt: [{ $size: '$patients' }, 50] }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Assignment statistics retrieved successfully',
    data: {
      totalPatients,
      totalDoctors,
      unassignedPatients,
      overassignedDoctors,
      averagePatientsPerDoctor: totalDoctors > 0 ? Math.round(totalPatients / totalDoctors) : 0
    }
  };

  res.json(response);
});

