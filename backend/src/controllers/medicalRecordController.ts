import { Request, Response } from 'express';
import MedicalRecord from '@/models/MedicalRecord';
import Patient from '@/models/Patient';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';

// @desc    Get all medical records for a patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private (Patient, Doctor, Admin)
export const getPatientMedicalRecords = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const user = req.user;

  // Check if patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Check permissions
  if (user.role === 'patient' && patient.user.toString() !== user.id) {
    throw new CustomError('Not authorized to view this patient\'s records', 403);
  }

  // Get all medical records for the patient
  const records = await MedicalRecord.find({ patientId })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  // Group records by type
  const groupedRecords = {
    conditions: records.filter(record => record.type === 'condition'),
    medications: records.filter(record => record.type === 'medication'),
    tests: records.filter(record => record.type === 'test'),
    visits: records.filter(record => record.type === 'visit'),
    images: records.filter(record => record.type === 'image')
  };

  res.json({
    success: true,
    data: groupedRecords
  });
});

// @desc    Add a new medical record
// @route   POST /api/medical-records
// @access  Private (Doctor, Admin)
export const addMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const { patientId, type, data } = req.body;
  const user = req.user;

  // Only doctors and admins can add medical records
  if (!['doctor', 'admin'].includes(user.role)) {
    throw new CustomError('Not authorized to add medical records', 403);
  }

  // Check if patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Create new medical record
  const medicalRecord = await MedicalRecord.create({
    patientId,
    type,
    data,
    createdBy: user.id
  });

  // Populate the createdBy field
  await medicalRecord.populate('createdBy', 'name email role');

  res.status(201).json({
    success: true,
    message: 'Medical record added successfully',
    data: medicalRecord
  });
});

// @desc    Update a medical record
// @route   PUT /api/medical-records/:id
// @access  Private (Doctor, Admin)
export const updateMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data } = req.body;
  const user = req.user;

  // Only doctors and admins can update medical records
  if (!['doctor', 'admin'].includes(user.role)) {
    throw new CustomError('Not authorized to update medical records', 403);
  }

  const medicalRecord = await MedicalRecord.findById(id);
  if (!medicalRecord) {
    throw new CustomError('Medical record not found', 404);
  }

  // Update the record
  medicalRecord.data = { ...medicalRecord.data, ...data };
  await medicalRecord.save();

  await medicalRecord.populate('createdBy', 'name email role');

  res.json({
    success: true,
    message: 'Medical record updated successfully',
    data: medicalRecord
  });
});

// @desc    Delete a medical record
// @route   DELETE /api/medical-records/:id
// @access  Private (Doctor, Admin)
export const deleteMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  // Only doctors and admins can delete medical records
  if (!['doctor', 'admin'].includes(user.role)) {
    throw new CustomError('Not authorized to delete medical records', 403);
  }

  const medicalRecord = await MedicalRecord.findById(id);
  if (!medicalRecord) {
    throw new CustomError('Medical record not found', 404);
  }

  await MedicalRecord.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Medical record deleted successfully'
  });
});

// @desc    Get medical records by type
// @route   GET /api/medical-records/patient/:patientId/type/:type
// @access  Private (Patient, Doctor, Admin)
export const getMedicalRecordsByType = asyncHandler(async (req: Request, res: Response) => {
  const { patientId, type } = req.params;
  const user = req.user;

  // Check if patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Check permissions
  if (user.role === 'patient' && patient.user.toString() !== user.id) {
    throw new CustomError('Not authorized to view this patient\'s records', 403);
  }

  // Validate type
  const validTypes = ['condition', 'medication', 'test', 'visit', 'image'];
  if (!validTypes.includes(type)) {
    throw new CustomError('Invalid record type', 400);
  }

  // Get records by type
  const records = await MedicalRecord.find({ patientId, type })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: records
  });
});
