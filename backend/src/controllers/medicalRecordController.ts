import { Request, Response } from 'express';
import MedicalRecord from '@/models/MedicalRecord';
import Patient from '@/models/Patient';
import { asyncHandler, CustomError } from '@/middleware/errorHandler';
import { 
  canDoctorEditObservation, 
  checkObservationEditAccess, 
  getObservationEditInfo,
  updateMedicationStatusByTime 
} from '@/utils/observationAccessControl';

// @desc    Get all medical records for a patient
// @route   GET /api/medical-records/patient/:patientId
// @access  Private (Patient, Doctor, Admin)
export const getPatientMedicalRecords = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const user = req.user;

  let patient;
  
  // If the patientId is actually a user ID (for patient role), find the patient by user reference
  if (user.role === 'patient' && patientId === user.id) {
    patient = await Patient.findOne({ user: patientId });
  } else {
    // For doctors and admins, use the patientId directly
    patient = await Patient.findById(patientId);
  }

  if (!patient) {
    throw new CustomError('Patient not found', 404);
  }

  // Check permissions
  if (user.role === 'patient' && patient.user.toString() !== user.id) {
    throw new CustomError('Not authorized to view this patient\'s records', 403);
  }

  // Get all medical records for the patient
  const records = await MedicalRecord.find({ patientId: patient._id })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  // Transform records to include OpenMRS metadata and edit access info
  const transformedRecords = records.map(record => {
    const editInfo = getObservationEditInfo(record, user.role === 'doctor' ? user.id : undefined);
    
    // Update medication status if needed (for synced observations)
    if (record.type === 'medication' && record.syncDate) {
      updateMedicationStatusByTime(record).catch(err => {
        console.error('Error updating medication status:', err);
      });
    }
    
    return {
      _id: record._id,
      type: record.type,
      data: record.data,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      // Include OpenMRS metadata if available
      openmrsData: record.openmrsData || null,
      // Include edit access information
      editAccess: editInfo,
      syncDate: record.syncDate || null,
      editableBy: record.editableBy || []
    };
  });

  // Group records by type
  const groupedRecords = {
    conditions: transformedRecords.filter(record => record.type === 'condition'),
    medications: transformedRecords.filter(record => record.type === 'medication'),
    tests: transformedRecords.filter(record => record.type === 'test'),
    visits: transformedRecords.filter(record => record.type === 'visit'),
    images: transformedRecords.filter(record => record.type === 'image')
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
    patientId: patient._id,
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
  console.log(`\n🔵 === UPDATE MEDICAL RECORD REQUEST ===`);
  console.log(`   Record ID: ${req.params.id}`);
  console.log(`   Request body keys: ${Object.keys(req.body)}`);
  console.log(`   Data keys: ${req.body.data ? Object.keys(req.body.data) : 'NO DATA'}`);
  
  const { id } = req.params;
  const { data } = req.body;
  const user = req.user;

  if (!user) {
    console.error(`❌ ERROR: req.user is undefined!`);
    throw new CustomError('Authentication required', 401);
  }

  console.log(`   User role: ${user.role}`);
  console.log(`   User ID: ${user._id || user.id}`);

  // Only doctors and admins can update medical records
  if (!['doctor', 'admin'].includes(user.role)) {
    console.error(`❌ ERROR: User role '${user.role}' is not authorized`);
    throw new CustomError('Not authorized to update medical records', 403);
  }

  const medicalRecord = await MedicalRecord.findById(id);
  if (!medicalRecord) {
    console.error(`❌ ERROR: Medical record ${id} not found`);
    throw new CustomError('Medical record not found', 404);
  }

  console.log(`   Record found: ${medicalRecord._id}`);
  console.log(`   Record has syncDate: ${!!medicalRecord.syncDate}`);
  console.log(`   Record syncDate: ${medicalRecord.syncDate || 'N/A'}`);

  // SPECIAL CASE: Legacy records (no syncDate) are ALWAYS editable by any doctor
  // This check happens BEFORE any other permission checks
  if (user.role === 'doctor' && !medicalRecord.syncDate) {
    console.log(`✅ Legacy record detected (no syncDate) - ALLOWING EDIT FOR ANY DOCTOR`);
    console.log(`   ⚠️ SKIPPING PERMISSION CHECK - Legacy records are always editable`);
    // Skip permission check for legacy records - they're always editable
  } else if (user.role === 'doctor') {
    // Get User ID - Mongoose documents use _id, but id is a virtual getter
    // Use _id.toString() for consistency
    const userId = user._id ? user._id.toString() : (user.id ? user.id.toString() : '');
    
    console.log(`🔍 Checking edit permission for doctor on record ${id}`);
    console.log(`   - User ID: ${userId}`);
    console.log(`   - User _id: ${user._id}`);
    console.log(`   - User id (virtual): ${user.id}`);
    console.log(`   - Record has syncDate: ${!!medicalRecord.syncDate}`);
    console.log(`   - Record syncDate: ${medicalRecord.syncDate || 'N/A'}`);
    console.log(`   - Record editableBy: ${JSON.stringify((medicalRecord.editableBy || []).map((id: any) => id.toString()))}`);
    console.log(`   - Record createdBy: ${medicalRecord.createdBy ? medicalRecord.createdBy.toString() : 'N/A'}`);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error(`❌ ERROR: User ID is missing or invalid!`);
      console.error(`   - user._id: ${user._id}`);
      console.error(`   - user.id: ${user.id}`);
      throw new CustomError('User ID not found. Please log in again.', 401);
    }
    
    const canEdit = canDoctorEditObservation(medicalRecord, userId);
    
    if (!canEdit) {
      console.log(`❌ Permission denied for user ${userId} on record ${id}`);
      
      // For synced observations, check time-based access for better error message
      if (medicalRecord.syncDate) {
        const editAccess = checkObservationEditAccess(medicalRecord);
        if (!editAccess.canEdit) {
          throw new CustomError(
            `Cannot edit observation: ${editAccess.reason}. Observations older than 3 hours are locked.`,
            403
          );
        }
      }
      
      throw new CustomError('You do not have permission to edit this observation', 403);
    }
    
    console.log(`✅ Doctor ${userId} has permission to edit record ${id}`);
    
    // Update medication status if it's a medication record
    if (medicalRecord.type === 'medication' && medicalRecord.syncDate) {
      await updateMedicationStatusByTime(medicalRecord);
    }
  }

  // Update the record data
  // Merge the new data with existing data, ensuring medications array is properly handled
  const updatedData = { ...medicalRecord.data, ...data };
  
  // If medications array is provided, ensure it's properly formatted
  if (data.medications && Array.isArray(data.medications)) {
    updatedData.medications = data.medications.map((med: any) => ({
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      startDate: med.startDate || '',
      endDate: med.endDate || '',
      prescribedBy: med.prescribedBy || '',
      medicationStatus: med.medicationStatus || 'Active'
    }));
    console.log(`💊 Saving ${updatedData.medications.length} medication(s) to observation ${id}`);
  }
  
  medicalRecord.data = updatedData;
  
  // Update lastEditedAt timestamp
  medicalRecord.lastEditedAt = new Date();
  
  // If doctor is not in editableBy array, add them
  if (user.role === 'doctor') {
    // Use _id.toString() for consistency (Mongoose documents use _id)
    const doctorUserId = user._id ? user._id.toString() : (user.id ? user.id.toString() : '');
    
    if (!doctorUserId || doctorUserId === 'undefined' || doctorUserId === 'null') {
      console.error(`❌ ERROR: Cannot add doctor to editableBy - User ID is missing!`);
    } else {
      // Initialize editableBy array if it doesn't exist
      if (!medicalRecord.editableBy) {
        medicalRecord.editableBy = [];
      }
      
      // Check if doctor is already in editableBy (compare as strings)
      const isAlreadyInArray = medicalRecord.editableBy.some((id: any) => id.toString() === doctorUserId);
      
      if (!isAlreadyInArray) {
        medicalRecord.editableBy.push(doctorUserId);
        console.log(`✅ Added doctor ${doctorUserId} to editableBy array for record ${id}`);
      } else {
        console.log(`ℹ️ Doctor ${doctorUserId} is already in editableBy array for record ${id}`);
      }
    }
  }
  
  console.log(`\n💾 Saving medical record to database...`);
  await medicalRecord.save();

  console.log(`✅ Medical record ${id} updated successfully`);
  if (updatedData.medications) {
    console.log(`   - ${updatedData.medications.length} medication(s) saved`);
  }
  console.log(`🔵 === UPDATE MEDICAL RECORD COMPLETE ===\n`);

  await medicalRecord.populate('createdBy', 'name email role');

  res.json({
    success: true,
    message: 'Medical record updated successfully',
    data: medicalRecord,
    editAccess: getObservationEditInfo(medicalRecord, user.role === 'doctor' ? user.id : undefined)
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

  let patient;
  
  // If the patientId is actually a user ID (for patient role), find the patient by user reference
  if (user.role === 'patient' && patientId === user.id) {
    patient = await Patient.findOne({ user: patientId });
  } else {
    // For doctors and admins, use the patientId directly
    patient = await Patient.findById(patientId);
  }

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
  const records = await MedicalRecord.find({ patientId: patient._id, type })
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  // Include edit access information
  const recordsWithEditInfo = records.map(record => {
    const editInfo = getObservationEditInfo(record, user.role === 'doctor' ? user.id : undefined);
    return {
      ...record.toObject(),
      editAccess: editInfo
    };
  });

  res.json({
    success: true,
    data: recordsWithEditInfo
  });
});

// @desc    Get edit access info for a specific medical record
// @route   GET /api/medical-records/:id/edit-access
// @access  Private (Doctor, Admin)
export const getMedicalRecordEditAccess = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  // Only doctors and admins can check edit access
  if (!['doctor', 'admin'].includes(user.role)) {
    throw new CustomError('Not authorized', 403);
  }

  const medicalRecord = await MedicalRecord.findById(id);
  if (!medicalRecord) {
    throw new CustomError('Medical record not found', 404);
  }

  const editInfo = getObservationEditInfo(medicalRecord, user.role === 'doctor' ? user.id : undefined);

  res.json({
    success: true,
    data: editInfo
  });
});
