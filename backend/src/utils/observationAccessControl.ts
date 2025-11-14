/**
 * Utility functions for time-based observation access control
 * 
 * Rules:
 * - < 2 hours: Can edit, medication is Active
 * - 2-3 hours: Medication is inactive, can still edit
 * - > 3 hours: Cannot edit (locked)
 */

import { IMedicalRecord } from '@/models/MedicalRecord';

/**
 * Check if an observation can be edited based on time since sync
 * @param record - Medical record to check
 * @returns Object with isEditable flag and time information
 */
export const checkObservationEditAccess = (record: IMedicalRecord | any) => {
  if (!record.syncDate) {
    // If no syncDate, it's not a synced observation - allow edit (legacy records)
    return {
      isEditable: true,
      canEdit: true,
      hoursSinceSync: null,
      medicationStatus: record.data?.medicationStatus || 'Active',
      reason: 'Not a synced observation'
    };
  }

  const now = new Date();
  const syncDate = new Date(record.syncDate);
  const hoursSinceSync = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);

  // Rule 1: > 3 hours = Cannot edit
  if (hoursSinceSync > 3) {
    return {
      isEditable: false,
      canEdit: false,
      hoursSinceSync: hoursSinceSync.toFixed(2),
      medicationStatus: record.type === 'medication' ? 'Past' : record.data?.medicationStatus,
      reason: `Observation is ${hoursSinceSync.toFixed(2)} hours old (locked after 3 hours)`
    };
  }

  // Rule 2: 2-3 hours = Can edit, but medication is inactive
  if (hoursSinceSync >= 2 && hoursSinceSync <= 3) {
    return {
      isEditable: true,
      canEdit: true,
      hoursSinceSync: hoursSinceSync.toFixed(2),
      medicationStatus: record.type === 'medication' ? 'Past' : record.data?.medicationStatus,
      reason: `Observation is ${hoursSinceSync.toFixed(2)} hours old (medication inactive after 2 hours)`
    };
  }

  // Rule 3: < 2 hours = Can edit, medication is active
  return {
    isEditable: true,
    canEdit: true,
    hoursSinceSync: hoursSinceSync.toFixed(2),
    medicationStatus: record.type === 'medication' ? 'Active' : record.data?.medicationStatus,
    reason: `Observation is ${hoursSinceSync.toFixed(2)} hours old (editable, medication active)`
  };
};

/**
 * Update medication status based on time since sync
 * @param record - Medical record to update
 * @returns Updated record or null if no update needed
 */
export const updateMedicationStatusByTime = async (record: IMedicalRecord | any) => {
  if (record.type !== 'medication' || !record.syncDate) {
    return null;
  }

  const now = new Date();
  const syncDate = new Date(record.syncDate);
  const hoursSinceSync = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);

  // Update medication status based on 2-hour rule
  const shouldBeActive = hoursSinceSync < 2;
  const currentStatus = record.data?.medicationStatus;

  if (shouldBeActive && currentStatus !== 'Active') {
    record.data.medicationStatus = 'Active';
    await record.save();
    return record;
  } else if (!shouldBeActive && currentStatus !== 'Past') {
    record.data.medicationStatus = 'Past';
    await record.save();
    return record;
  }

  return null;
};

/**
 * Check if a doctor has edit access to an observation
 * @param record - Medical record to check
 * @param doctorId - Doctor ID (User ID) to check access for
 * @returns true if doctor can edit
 */
export const canDoctorEditObservation = (record: IMedicalRecord | any, doctorId: string): boolean => {
  console.log(`\n🔍 === canDoctorEditObservation CHECK ===`);
  console.log(`   Record ID: ${record._id}`);
  console.log(`   Doctor ID: ${doctorId}`);
  console.log(`   Record has syncDate: ${!!record.syncDate}`);
  console.log(`   Record syncDate: ${record.syncDate || 'N/A'}`);
  
  if (!doctorId || doctorId === 'undefined' || doctorId === 'null') {
    console.log(`❌ Invalid doctorId: ${doctorId}`);
    return false;
  }
  
  // IMPORTANT: Check for legacy records FIRST (before time-based checks)
  // For records without syncDate (legacy records), allow ANY doctor to edit
  // These are not synced observations, so any doctor should be able to edit them
  if (!record.syncDate) {
    console.log(`✅ Legacy record (no syncDate) - allowing edit for doctor ${doctorId}`);
    console.log(`🔍 === canDoctorEditObservation: ALLOWED (Legacy) ===\n`);
    return true; // Any doctor can edit legacy records
  }

  // For synced observations, check time-based access
  const timeAccess = checkObservationEditAccess(record);
  console.log(`   Time access result:`, {
    canEdit: timeAccess.canEdit,
    hoursSinceSync: timeAccess.hoursSinceSync,
    reason: timeAccess.reason
  });
  
  // CRITICAL: For observations < 2 hours old, ALWAYS allow ANY doctor to edit
  // This check happens BEFORE the timeAccess.canEdit check to ensure recent observations are editable
  if (timeAccess.hoursSinceSync) {
    const hours = parseFloat(timeAccess.hoursSinceSync);
    console.log(`   Hours since sync: ${hours}`);
    if (hours < 2) {
      console.log(`✅ Observation < 2 hours old (${hours.toFixed(2)}h) - ALLOWING EDIT FOR ANY DOCTOR`);
      console.log(`🔍 === canDoctorEditObservation: ALLOWED (< 2 hours) ===\n`);
      return true; // Any doctor can edit observations < 2 hours old
    }
  }
  
  if (!timeAccess.canEdit) {
    console.log(`❌ Time-based access denied: ${timeAccess.reason}`);
    console.log(`🔍 === canDoctorEditObservation: DENIED (Time-based) ===\n`);
    return false;
  }

  // For observations 2-3 hours old, check if doctor is in editableBy array or is creator
  // editableBy contains User IDs (not Doctor IDs)
  if (record.editableBy && Array.isArray(record.editableBy)) {
    const doctorIdStr = doctorId.toString();
    console.log(`   Checking editableBy array:`, record.editableBy.map((id: any) => id.toString()));
    const isInEditableBy = record.editableBy.some((id: any) => id.toString() === doctorIdStr);
    if (isInEditableBy) {
      console.log(`✅ Doctor ${doctorId} found in editableBy array`);
      console.log(`🔍 === canDoctorEditObservation: ALLOWED (In editableBy) ===\n`);
      return true;
    } else {
      console.log(`   Doctor ${doctorId} NOT found in editableBy array`);
    }
  } else {
    console.log(`   No editableBy array found`);
  }

  // If no editableBy array, check if doctor created it (createdBy is User ID)
  if (record.createdBy) {
    const createdById = record.createdBy.toString();
    const doctorIdStr = doctorId.toString();
    console.log(`   Checking createdBy: ${createdById} vs doctorId: ${doctorIdStr}`);
    if (createdById === doctorIdStr) {
      console.log(`✅ Doctor ${doctorId} is the creator of this observation`);
      console.log(`🔍 === canDoctorEditObservation: ALLOWED (Creator) ===\n`);
      return true;
    } else {
      console.log(`   Doctor ${doctorId} is NOT the creator`);
    }
  } else {
    console.log(`   No createdBy found`);
  }

  console.log(`❌ Doctor ${doctorId} does not have permission to edit observation ${record._id}`);
  console.log(`🔍 === canDoctorEditObservation: DENIED (No match) ===\n`);
  return false;
};

/**
 * Get edit access information for frontend
 * @param record - Medical record
 * @param doctorUserId - Doctor's User ID (optional) - NOT Doctor model ID
 * @returns Edit access information
 */
export const getObservationEditInfo = (record: IMedicalRecord | any, doctorUserId?: string) => {
  const timeAccess = checkObservationEditAccess(record);
  
  // For legacy records (no syncDate), always allow edit if doctor is viewing
  if (!record.syncDate) {
    if (doctorUserId) {
      // Doctor is viewing - allow edit
      return {
        canEdit: true,
        isEditable: true,
        hoursSinceSync: null,
        medicationStatus: record.data?.medicationStatus || 'Active',
        reason: 'Legacy record - editable by any doctor',
        syncDate: null,
        editableBy: record.editableBy || []
      };
    } else {
      // Not a doctor - use time-based access
      return {
        canEdit: timeAccess.canEdit,
        isEditable: timeAccess.isEditable,
        hoursSinceSync: timeAccess.hoursSinceSync,
        medicationStatus: timeAccess.medicationStatus,
        reason: timeAccess.reason,
        syncDate: null,
        editableBy: record.editableBy || []
      };
    }
  }
  
  // For synced observations, check doctor-specific permissions if doctorUserId is provided
  let canEdit = timeAccess.canEdit;
  if (doctorUserId) {
    canEdit = canDoctorEditObservation(record, doctorUserId);
  }

  return {
    canEdit,
    isEditable: timeAccess.isEditable,
    hoursSinceSync: timeAccess.hoursSinceSync,
    medicationStatus: timeAccess.medicationStatus,
    reason: timeAccess.reason,
    syncDate: record.syncDate,
    editableBy: record.editableBy || []
  };
};

