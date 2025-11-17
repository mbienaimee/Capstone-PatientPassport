import Patient from '@/models/Patient';
import Hospital from '@/models/Hospital';
import Doctor from '@/models/Doctor';
// Legacy models removed - using only MedicalRecord as single source of truth
import MedicalRecord from '@/models/MedicalRecord';
import mongoose from 'mongoose';
import { CustomError } from '@/middleware/errorHandler';
import OPENMRS_CONFIG from '@/config/openmrsIntegrationConfig';

/**
 * OpenMRS Integration Service
 * Handles bidirectional sync between Patient Passport and OpenMRS systems
 * Uses PATIENT NAME as the common identifier
 */

interface PatientMapping {
  passportPatientId: string;
  openmrsPatientUuid: string;
  patientName: string;
  syncedAt: Date;
}

interface HospitalMapping {
  passportHospitalId: string;
  openmrsHospitalUuid: string;
  hospitalName: string;
  syncedAt: Date;
}

/**
 * Helper: Generate safe email from text
 */
const generateSafeEmail = (text: string, domain: string = OPENMRS_CONFIG.PLACEHOLDER_EMAIL_DOMAIN): string => {
  const sanitized = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, OPENMRS_CONFIG.MAX_EMAIL_LENGTH);
  
  return `${sanitized || 'user'}@${domain}`;
};

/**
 * Helper: Extract field value with fallback chain
 */
const extractFieldValue = (data: any, fieldNames: string[], fallback: string = ''): string => {
  for (const fieldName of fieldNames) {
    const value = data[fieldName];
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
};

/**
 * Helper: Parse date safely, ensuring it's not in the future
 */
const parseSafeDate = (data: any, fieldNames: string[]): Date => {
  const now = new Date();
  
  for (const fieldName of fieldNames) {
    const value = data[fieldName];
    if (value) {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime()) && parsedDate <= now) {
        return parsedDate;
      }
    }
  }
  
  return now;
};

/**
 * Get or create patient mapping between systems using PATIENT NAME
 */
export const syncPatientMapping = async (
  patientName: string,
  openmrsPatientUuid?: string
): Promise<PatientMapping> => {
  try {
    // Find patient in passport system by name (User.name)
    const passportPatient = await Patient.findOne()
      .populate({
        path: 'user',
        match: { name: { $regex: new RegExp(`^${patientName}$`, 'i') } },
        select: 'name email'
      });

    // If no match found through populate, search directly
    let finalPatient = passportPatient;
    if (!passportPatient || !passportPatient.user) {
      const User = mongoose.model('User');
      const user = await User.findOne({ 
        name: { $regex: new RegExp(`^${patientName}$`, 'i') },
        role: 'patient'
      });
      
      if (user) {
        finalPatient = await Patient.findOne({ user: user._id }).populate('user', 'name email');
      }
    }

    if (!finalPatient || !finalPatient.user) {
      throw new CustomError(`Patient with name "${patientName}" not found in Patient Passport system`, 404);
    }

    // Store OpenMRS UUID in patient record if provided
    if (openmrsPatientUuid && !finalPatient.openmrsUuid) {
      finalPatient.openmrsUuid = openmrsPatientUuid;
      await finalPatient.save();
    }

    const mapping: PatientMapping = {
      passportPatientId: finalPatient._id.toString(),
      openmrsPatientUuid: finalPatient.openmrsUuid || openmrsPatientUuid || '',
      patientName: finalPatient.user.name,
      syncedAt: new Date()
    };

    console.log(`✅ Patient mapping synced by name:`, mapping);
    return mapping;
  } catch (error) {
    console.error('❌ Error syncing patient mapping:', error);
    throw error;
  }
};

/**
 * Get or create hospital mapping between systems
 */
export const syncHospitalMapping = async (
  hospitalName: string,
  openmrsHospitalUuid?: string,
  passportHospitalId?: string
): Promise<HospitalMapping> => {
  try {
    let passportHospital;

    // Find hospital by ID or name
    if (passportHospitalId) {
      passportHospital = await Hospital.findById(passportHospitalId);
    } else {
      passportHospital = await Hospital.findOne({ 
        name: { $regex: new RegExp(`^${hospitalName}$`, 'i') } 
      });
    }

    if (!passportHospital) {
      throw new CustomError(`Hospital ${hospitalName} not found in Patient Passport system`, 404);
    }

    // Store OpenMRS UUID if provided
    if (openmrsHospitalUuid && !passportHospital.openmrsUuid) {
      passportHospital.openmrsUuid = openmrsHospitalUuid;
      await passportHospital.save();
    }

    const mapping: HospitalMapping = {
      passportHospitalId: passportHospital._id.toString(),
      openmrsHospitalUuid: passportHospital.openmrsUuid || openmrsHospitalUuid || '',
      hospitalName: passportHospital.name,
      syncedAt: new Date()
    };

    console.log(`✅ Hospital mapping synced:`, mapping);
    return mapping;
  } catch (error) {
    console.error('❌ Error syncing hospital mapping:', error);
    throw error;
  }
};

/**
 * Get patient medical data formatted for OpenMRS observations
 * This automatically populates diagnosis and medication data
 * Uses PATIENT NAME to find the patient
 */
export const getPatientDataForOpenMRS = async (
  patientName: string,
  hospitalId?: string
) => {
  try {
    console.log(`📋 Fetching patient data for OpenMRS - Patient Name: ${patientName}`);

    // Find user by name
    const User = mongoose.model('User');
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${patientName}$`, 'i') },
      role: 'patient'
    });

    if (!user) {
      throw new CustomError(`User with name "${patientName}" not found`, 404);
    }

    // Find patient
    const patient = await Patient.findOne({ user: user._id })
      .populate('user', 'name email')
      .populate({
        path: 'medicalHistory',
        populate: [
          { path: 'doctor', populate: { path: 'user', select: 'name' } },
          { path: 'hospital', select: 'name' }
        ]
      })
      .populate({
        path: 'medications',
        populate: [
          { path: 'doctor', populate: { path: 'user', select: 'name' } },
          { path: 'hospital', select: 'name' }
        ]
      })
      .populate({
        path: 'hospitalVisits',
        populate: [
          { path: 'doctor', populate: { path: 'user', select: 'name' } },
          { path: 'hospital', select: 'name' }
        ]
      });

    if (!patient) {
      throw new CustomError(`Patient "${patientName}" not found`, 404);
    }

    // Format diagnosis data - grouped by hospital
    const diagnosisByHospital: any = {};
    
    // From medical conditions
    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      for (const condition of patient.medicalHistory as any[]) {
        const hospitalName = condition.hospital?.name || 'Unknown Hospital';
        if (!diagnosisByHospital[hospitalName]) {
          diagnosisByHospital[hospitalName] = [];
        }
        
        diagnosisByHospital[hospitalName].push({
          type: 'diagnosis',
          conceptName: 'DIAGNOSIS',
          valueCoded: condition.name,
          valueText: condition.details,
          obsDatetime: condition.diagnosed,
          provider: condition.doctor?.user?.name || 'Unknown Doctor',
          hospital: hospitalName,
          status: condition.status,
          notes: condition.notes,
          source: 'medical_condition'
        });
      }
    }

    // From hospital visits
    if (patient.hospitalVisits && patient.hospitalVisits.length > 0) {
      for (const visit of patient.hospitalVisits as any[]) {
        if (visit.diagnosis) {
          const hospitalName = visit.hospital?.name || 'Unknown Hospital';
          if (!diagnosisByHospital[hospitalName]) {
            diagnosisByHospital[hospitalName] = [];
          }
          
          diagnosisByHospital[hospitalName].push({
            type: 'diagnosis',
            conceptName: 'DIAGNOSIS',
            valueCoded: visit.diagnosis,
            valueText: visit.notes,
            obsDatetime: visit.date,
            provider: visit.doctor?.user?.name || 'Unknown Doctor',
            hospital: hospitalName,
            visitReason: visit.reason,
            treatment: visit.treatment,
            source: 'hospital_visit'
          });
        }
      }
    }

    // Format medication data - grouped by hospital
    const medicationsByHospital: any = {};
    
    if (patient.medications && patient.medications.length > 0) {
      for (const med of patient.medications as any[]) {
        const hospitalName = med.hospital?.name || 'Unknown Hospital';
        if (!medicationsByHospital[hospitalName]) {
          medicationsByHospital[hospitalName] = [];
        }
        
        medicationsByHospital[hospitalName].push({
          type: 'medication',
          conceptName: 'MEDICATION',
          valueDrug: med.name,
          valueCoded: med.name,
          valueText: `${med.dosage} - ${med.frequency}`,
          obsDatetime: med.startDate,
          provider: med.doctor?.user?.name || 'Unknown Doctor',
          hospital: hospitalName,
          dosage: med.dosage,
          frequency: med.frequency,
          status: med.status,
          startDate: med.startDate,
          endDate: med.endDate,
          notes: med.notes,
          source: 'medication'
        });
      }
    }

    // Combine all observations
    const allObservations = [
      ...Object.values(diagnosisByHospital).flat(),
      ...Object.values(medicationsByHospital).flat()
    ];

    // Sort by date (most recent first)
    allObservations.sort((a: any, b: any) => 
      new Date(b.obsDatetime).getTime() - new Date(a.obsDatetime).getTime()
    );

    const response = {
      patient: {
        passportId: patient._id,
        patientName: patient.user?.name,
        openmrsUuid: patient.openmrsUuid,
        nationalId: patient.nationalId,
        fullName: patient.user?.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies || []
      },
      observations: allObservations,
      diagnosisByHospital,
      medicationsByHospital,
      summary: {
        totalDiagnoses: Object.values(diagnosisByHospital).flat().length,
        totalMedications: Object.values(medicationsByHospital).flat().length,
        hospitalsCount: new Set([
          ...Object.keys(diagnosisByHospital),
          ...Object.keys(medicationsByHospital)
        ]).size
      },
      syncedAt: new Date()
    };

    console.log(`✅ Patient data retrieved for OpenMRS:`);
    console.log(`   Patient: ${response.patient.fullName}`);
    console.log(`   Total Diagnoses: ${response.summary.totalDiagnoses}`);
    console.log(`   Total Medications: ${response.summary.totalMedications}`);
    console.log(`   Hospitals: ${response.summary.hospitalsCount}`);

    return response;
  } catch (error) {
    console.error('❌ Error fetching patient data for OpenMRS:', error);
    throw error;
  }
};

/**
 * Get patient by OpenMRS UUID
 */
export const getPatientByOpenmrsUuid = async (openmrsUuid: string) => {
  try {
    const patient = await Patient.findOne({ openmrsUuid })
      .populate('user', 'name email')
      .populate('assignedDoctors');

    if (!patient) {
      throw new CustomError(`Patient with OpenMRS UUID ${openmrsUuid} not found`, 404);
    }

    return patient;
  } catch (error) {
    console.error('❌ Error fetching patient by OpenMRS UUID:', error);
    throw error;
  }
};

/**
 * Sync doctor data between systems
 */
export const syncDoctorData = async (
  licenseNumber: string,
  openmrsProviderUuid?: string
) => {
  try {
    const doctor = await Doctor.findOne({ 
      licenseNumber: licenseNumber.toUpperCase() 
    }).populate('user', 'name email').populate('hospital', 'name');

    if (!doctor) {
      throw new CustomError(`Doctor with license ${licenseNumber} not found`, 404);
    }

    // Store OpenMRS provider UUID if provided
    if (openmrsProviderUuid && !doctor.openmrsProviderUuid) {
      doctor.openmrsProviderUuid = openmrsProviderUuid;
      await doctor.save();
    }

    return {
      passportDoctorId: doctor._id.toString(),
      openmrsProviderUuid: doctor.openmrsProviderUuid || openmrsProviderUuid || '',
      licenseNumber: doctor.licenseNumber,
      name: doctor.user?.name,
      specialization: doctor.specialization,
      hospital: doctor.hospital?.name,
      syncedAt: new Date()
    };
  } catch (error) {
    console.error('❌ Error syncing doctor data:', error);
    throw error;
  }
};

/**
 * Store observation data from OpenMRS into passport
 * This is called when doctors add new data in OpenMRS
 * Uses PATIENT NAME to find the patient
 */
export const storeOpenMRSObservation = async (
  patientName: string,
  observationType: 'diagnosis' | 'medication',
  observationData: any,
  doctorLicenseNumber: string,
  hospitalName: string
) => {
  try {
    console.log(`📝 Storing OpenMRS observation in passport:`);
    console.log(`   Type: ${observationType}`);
    console.log(`   Patient Name: ${patientName}`);
    console.log(`   Doctor License: ${doctorLicenseNumber}`);
    console.log(`   Hospital: ${hospitalName}`);

    // Find user by name with flexible matching
    const User = mongoose.model('User');
    
    // Normalize patient name: trim, remove extra spaces, handle case
    const normalizedPatientName = patientName.trim().replace(/\s+/g, ' ');
    
    // Try multiple matching strategies for better patient matching
    let user = await User.findOne({ 
      name: { $regex: new RegExp(`^${normalizedPatientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      role: 'patient'
    });

    // If exact match not found, try flexible matching (handles name variations)
    if (!user) {
      // Try matching with normalized spaces
      const flexiblePattern = normalizedPatientName.split(' ').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      user = await User.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${flexiblePattern}$`, 'i') }, role: 'patient' },
          { name: { $regex: new RegExp(flexiblePattern, 'i') }, role: 'patient' }
        ]
      });
    }

    // If still not found, try matching individual name parts
    if (!user && normalizedPatientName.includes(' ')) {
      const nameParts = normalizedPatientName.split(' ').filter(part => part.length > 2);
      if (nameParts.length >= 2) {
        // Try matching first and last name
        const firstLastPattern = `${nameParts[0]}.*${nameParts[nameParts.length - 1]}`;
        user = await User.findOne({
          name: { $regex: new RegExp(firstLastPattern, 'i') },
          role: 'patient'
        });
      }
    }

    if (!user) {
      console.error(`❌ Patient matching failed for: "${patientName}"`);
      console.error(`   Tried normalized: "${normalizedPatientName}"`);
      throw new CustomError(`User "${patientName}" not found in Patient Passport. Please ensure patient name matches exactly.`, 404);
    }
    
    console.log(`✅ Patient matched: "${patientName}" → "${user.name}"`);

    // Find patient
    const patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      throw new CustomError(`Patient "${patientName}" not found`, 404);
    }

    // STEP 1: Find or create HOSPITAL
    let hospital = await Hospital.findOne({ 
      name: { $regex: new RegExp(`^${hospitalName}$`, 'i') } 
    });
    
    // Try partial match if exact match fails
    if (!hospital) {
      hospital = await Hospital.findOne({
        name: { $regex: new RegExp(hospitalName, 'i') }
      });
    }
    
    // Create placeholder hospital if not found
    if (!hospital) {
      console.warn(`⚠️ Hospital ${hospitalName} not found - creating placeholder`);
      
      const placeholderEmail = generateSafeEmail(hospitalName);
      
      // Check if user with this email already exists
      let hospitalUser = await User.findOne({ email: placeholderEmail });
      
      if (!hospitalUser) {
        hospitalUser = await User.create({
          name: hospitalName,
          email: placeholderEmail,
          password: Math.random().toString(36),
          role: 'hospital',
          isActive: true,
          isEmailVerified: false
        });
        console.log(`✅ Created placeholder hospital user: ${placeholderEmail}`);
      } else {
        console.log(`ℹ️ Found existing hospital user: ${placeholderEmail}`);
      }
      
      hospital = await Hospital.create({
        user: hospitalUser._id,
        name: hospitalName,
        licenseNumber: `${OPENMRS_CONFIG.HOSPITAL_LICENSE_PREFIX}-${Date.now()}`,
        address: OPENMRS_CONFIG.DEFAULT_HOSPITAL_ADDRESS,
        contact: OPENMRS_CONFIG.DEFAULT_HOSPITAL_CONTACT,
        status: 'active'
      });
      
      console.log(`✅ Created placeholder hospital: ${hospital.name}`);
    }

    // STEP 2: Find or create DOCTOR
    let doctor = await Doctor.findOne({ 
      licenseNumber: doctorLicenseNumber.toUpperCase() 
    });
    
    // Try finding by username for OpenMRS users
    if (!doctor) {
      const doctorUser = await User.findOne({
        $or: [
          { email: { $regex: new RegExp(doctorLicenseNumber, 'i') } },
          { name: { $regex: new RegExp(doctorLicenseNumber, 'i') } }
        ],
        role: 'doctor'
      });
      
      if (doctorUser) {
        doctor = await Doctor.findOne({ user: doctorUser._id });
      }
    }
    
    // Create placeholder doctor if not found
    if (!doctor) {
      console.warn(`⚠️ Doctor ${doctorLicenseNumber} not found - creating placeholder`);
      
      const placeholderEmail = generateSafeEmail(doctorLicenseNumber);
      
      // Check if user with this email already exists
      let doctorUser = await User.findOne({ email: placeholderEmail });
      
      if (!doctorUser) {
        doctorUser = await User.create({
          name: `Dr. ${doctorLicenseNumber}`,
          email: placeholderEmail,
          password: Math.random().toString(36),
          role: 'doctor',
          isActive: true,
          isEmailVerified: false
        });
        console.log(`✅ Created placeholder doctor user: ${placeholderEmail}`);
      } else {
        console.log(`ℹ️ Found existing doctor user: ${placeholderEmail}`);
      }
      
      doctor = await Doctor.create({
        user: doctorUser._id,
        licenseNumber: doctorLicenseNumber.toUpperCase(),
        specialization: OPENMRS_CONFIG.DEFAULT_DOCTOR_SPECIALIZATION,
        hospital: hospital._id,
        yearsOfExperience: OPENMRS_CONFIG.DEFAULT_DOCTOR_EXPERIENCE
      });
      
      console.log(`✅ Created placeholder doctor: ${doctor.licenseNumber} at ${hospital.name}`);
    }

    // STEP 3: Store the observation
    console.log(`📊 Processing observation data:`, JSON.stringify(observationData, null, 2));
    
    if (observationType === 'diagnosis') {
      // Extract diagnosis information using flexible field mapping
      let diagnosisName = extractFieldValue(
        observationData,
        OPENMRS_CONFIG.DIAGNOSIS_FIELD_NAMES,
        OPENMRS_CONFIG.DEFAULT_DIAGNOSIS_FALLBACK
      );
      
      let diagnosisDetails = extractFieldValue(
        observationData,
        OPENMRS_CONFIG.DETAILS_FIELD_NAMES,
        OPENMRS_CONFIG.DEFAULT_DETAILS_FALLBACK
      );
      
      // Combine concept and value if both exist
      if (observationData.concept && observationData.value) {
        diagnosisName = observationData.concept.trim();
        diagnosisDetails = `Result: ${observationData.value.trim()}`;
        if (observationData.comment) {
          diagnosisDetails += ` - ${observationData.comment.trim()}`;
        }
      }
      
      // Build observation notes from value and comment (actual clinical data)
      let observationNotes = '';
      if (observationData.value && typeof observationData.value === 'string') {
        observationNotes = observationData.value.trim();
      }
      if (observationData.comment && typeof observationData.comment === 'string') {
        observationNotes += (observationNotes ? ' - ' : '') + observationData.comment.trim();
      }
      if (observationData.details && typeof observationData.details === 'string' && !observationNotes) {
        observationNotes = observationData.details.trim();
      }
      
      // Parse diagnosis date safely
      const diagnosisDate = parseSafeDate(observationData, OPENMRS_CONFIG.DATE_FIELD_NAMES);
      
      // **CRITICAL: Check for duplicate observation by obsId to prevent duplicates**
      const obsId = observationData.obs_id || observationData.obsId;
      if (obsId) {
        const existingRecord = await MedicalRecord.findOne({
          patientId: patient._id,
          'openmrsData.obsId': obsId
        });
        
        if (existingRecord) {
          console.log(`⏭️  Observation already exists (obsId: ${obsId}), skipping duplicate`);
          console.log(`   - Existing Record ID: ${existingRecord._id}`);
          console.log(`   - Created at: ${existingRecord.createdAt}`);
          return { medicalRecord: existingRecord, duplicate: true };
        }
      }
      
      console.log(`   📋 Creating diagnosis: ${diagnosisName}`);
      console.log(`   📝 Details: ${diagnosisDetails}`);
      console.log(`   📅 Date: ${diagnosisDate.toISOString()}`);
      
      // REMOVED: Legacy MedicalCondition creation to prevent duplicates
      // We now use ONLY MedicalRecord as the single source of truth
      
      // Get doctor name - use doctorLicenseNumber if it's a name (e.g., "Jake Doctor"), otherwise get from User
      let doctorDisplayName = doctorLicenseNumber;
      if (doctor.user) {
        const doctorUser = await mongoose.model('User').findById(doctor.user).select('name');
        if (doctorUser && doctorUser.name) {
          doctorDisplayName = doctorUser.name;
        } else if (doctorLicenseNumber && !doctorLicenseNumber.includes('SYNC') && !doctorLicenseNumber.includes('SERVICE')) {
          // If license number looks like a name (not a service identifier), use it
          doctorDisplayName = doctorLicenseNumber;
        }
      } else if (doctorLicenseNumber && !doctorLicenseNumber.includes('SYNC') && !doctorLicenseNumber.includes('SERVICE')) {
        // If license number looks like a name, use it directly
        doctorDisplayName = doctorLicenseNumber;
      } else {
        // If doctor not found, use the provided name as-is (should be "Jake Doctor" format, NOT "Dr. Jake Doctor")
        // The doctorLicenseNumber parameter is actually the provider name from OpenMRS
        doctorDisplayName = doctorLicenseNumber || 'Unknown Doctor';
        
        // Remove "Dr." prefix if present (should not be there, but clean it up)
        if (doctorDisplayName.startsWith('Dr. ')) {
          doctorDisplayName = doctorDisplayName.substring(4).trim();
        }
        
        console.log(`   ⚠️ Doctor not found by license, using provider name: "${doctorDisplayName}"`);
      }

      // Create MedicalRecord (new format - used by frontend)
      // Grant doctor edit access and set sync date for time-based access control
      const syncDate = new Date();
      const medicalRecord = await MedicalRecord.create({
        patientId: patient._id,
        type: 'condition',
        data: {
          diagnosis: diagnosisName,
          name: diagnosisName,
          details: diagnosisDetails,
          diagnosed: diagnosisDate.toISOString(),
          diagnosedDate: diagnosisDate.toISOString(),
          date: diagnosisDate.toISOString(),
          hospital: hospitalName, // Use hospitalName parameter (e.g., "Site 1")
          doctor: doctorDisplayName, // Use actual provider name (e.g., "Jake Doctor")
          diagnosedBy: doctorDisplayName,
          notes: observationNotes || diagnosisDetails || `Observation from OpenMRS`,
          status: observationData.status || OPENMRS_CONFIG.DEFAULT_OBSERVATION_STATUS
        },
        createdBy: doctor._id.toString(),
        editableBy: [doctor._id.toString()], // Grant the doctor edit access
        syncDate: syncDate, // Record when it was synced (for time-based access control)
        openmrsData: {
          obsId: observationData.obs_id || observationData.obsId,
          conceptId: observationData.concept_id || observationData.conceptId,
          personId: observationData.person_id || observationData.personId,
          obsDatetime: diagnosisDate,
          dateCreated: new Date(),
          creatorName: doctorDisplayName, // Store actual provider name
          locationName: hospitalName, // Store actual location name (e.g., "Site 1")
          encounterUuid: observationData.encounter_uuid || observationData.encounterUuid,
          providerUuid: observationData.provider_uuid || observationData.providerUuid,
          valueType: observationData.value_type || (observationData.value_text ? 'text' : observationData.value_numeric ? 'numeric' : 'coded')
        }
      });

      // REMOVED: Legacy patient.medicalHistory update (no longer needed)
      // MedicalRecord is now the single source of truth

      console.log(`✅ Diagnosis stored successfully!`);
      console.log(`   - MedicalRecord ID: ${medicalRecord._id}`);
      console.log(`   - Patient: ${patientName}`);
      console.log(`   - Hospital: ${hospitalName}`);
      console.log(`   - Doctor: ${doctorLicenseNumber}`);
      return { medicalRecord };
      
    } else if (observationType === 'medication') {
      // Extract medication information using flexible field mapping
      let medicationName = extractFieldValue(
        observationData,
        OPENMRS_CONFIG.MEDICATION_FIELD_NAMES,
        OPENMRS_CONFIG.DEFAULT_MEDICATION_FALLBACK
      );
      
      let medicationDosage = extractFieldValue(
        observationData,
        OPENMRS_CONFIG.DOSAGE_FIELD_NAMES,
        OPENMRS_CONFIG.DEFAULT_DOSAGE_FALLBACK
      );
      
      // Use concept and value appropriately
      if (observationData.concept && observationData.value) {
        medicationName = observationData.concept.trim();
        medicationDosage = observationData.value.trim();
      }
      
      // Build medication notes from value, comment, and details (actual clinical data)
      let medicationNotes = '';
      if (observationData.comment && typeof observationData.comment === 'string') {
        medicationNotes = observationData.comment.trim();
      }
      if (observationData.details && typeof observationData.details === 'string' && !medicationNotes) {
        medicationNotes = observationData.details.trim();
      }
      if (!medicationNotes && medicationDosage) {
        medicationNotes = `Dosage: ${medicationDosage}`;
      }
      
      // Parse medication start date safely
      const startDate = parseSafeDate(observationData, OPENMRS_CONFIG.DATE_FIELD_NAMES);
      
      // **CRITICAL: Check for duplicate observation by obsId to prevent duplicates**
      const obsId = observationData.obs_id || observationData.obsId;
      if (obsId) {
        const existingRecord = await MedicalRecord.findOne({
          patientId: patient._id,
          'openmrsData.obsId': obsId
        });
        
        if (existingRecord) {
          console.log(`⏭️  Medication already exists (obsId: ${obsId}), skipping duplicate`);
          console.log(`   - Existing Record ID: ${existingRecord._id}`);
          console.log(`   - Created at: ${existingRecord.createdAt}`);
          return { medicalRecord: existingRecord, duplicate: true };
        }
      }
      
      console.log(`   💊 Creating medication: ${medicationName}`);
      console.log(`   📝 Dosage: ${medicationDosage}`);
      console.log(`   📅 Start Date: ${startDate.toISOString()}`);
      
      // REMOVED: Legacy Medication creation to prevent duplicates
      // We now use ONLY MedicalRecord as the single source of truth

      // Get doctor name - use doctorLicenseNumber if it's a name (e.g., "Jake Doctor"), otherwise get from User
      let doctorDisplayName = doctorLicenseNumber;
      if (doctor.user) {
        const doctorUser = await mongoose.model('User').findById(doctor.user).select('name');
        if (doctorUser && doctorUser.name) {
          doctorDisplayName = doctorUser.name;
        } else if (doctorLicenseNumber && !doctorLicenseNumber.includes('SYNC') && !doctorLicenseNumber.includes('SERVICE')) {
          // If license number looks like a name (not a service identifier), use it
          doctorDisplayName = doctorLicenseNumber;
        }
      } else if (doctorLicenseNumber && !doctorLicenseNumber.includes('SYNC') && !doctorLicenseNumber.includes('SERVICE')) {
        // If license number looks like a name, use it directly
        doctorDisplayName = doctorLicenseNumber;
      } else {
        // If doctor not found, use the provided name as-is (should be "Jake Doctor" format, NOT "Dr. Jake Doctor")
        // The doctorLicenseNumber parameter is actually the provider name from OpenMRS
        doctorDisplayName = doctorLicenseNumber || 'Unknown Doctor';
        
        // Remove "Dr." prefix if present (should not be there, but clean it up)
        if (doctorDisplayName.startsWith('Dr. ')) {
          doctorDisplayName = doctorDisplayName.substring(4).trim();
        }
        
        console.log(`   ⚠️ Doctor not found by license, using provider name: "${doctorDisplayName}"`);
      }

      // Create MedicalRecord (new format - used by frontend)
      // Grant doctor edit access and set sync date for time-based access control
      const syncDate = new Date();
      const medicalRecord = await MedicalRecord.create({
        patientId: patient._id,
        type: 'medication',
        data: {
          medicationName: medicationName,
          name: medicationName,
          dosage: medicationDosage,
          frequency: observationData.frequency || OPENMRS_CONFIG.DEFAULT_MEDICATION_FREQUENCY,
          startDate: startDate.toISOString(),
          endDate: observationData.endDate ? new Date(observationData.endDate).toISOString() : undefined,
          date: startDate.toISOString(),
          hospital: hospitalName, // Use hospitalName parameter (e.g., "Site 1")
          doctor: doctorDisplayName, // Use actual provider name (e.g., "Jake Doctor")
          prescribedBy: doctorDisplayName,
          notes: medicationNotes || `Prescribed from OpenMRS`,
          medicationStatus: 'Active', // Initially active (will be updated based on time)
          status: observationData.status || OPENMRS_CONFIG.DEFAULT_OBSERVATION_STATUS
        },
        createdBy: doctor._id.toString(),
        editableBy: [doctor._id.toString()], // Grant the doctor edit access
        syncDate: syncDate, // Record when it was synced (for time-based access control)
        openmrsData: {
          obsId: observationData.obs_id || observationData.obsId,
          conceptId: observationData.concept_id || observationData.conceptId,
          personId: observationData.person_id || observationData.personId,
          obsDatetime: startDate,
          dateCreated: new Date(),
          creatorName: doctorDisplayName, // Store actual provider name
          locationName: hospitalName, // Store actual location name (e.g., "Site 1")
          encounterUuid: observationData.encounter_uuid || observationData.encounterUuid,
          providerUuid: observationData.provider_uuid || observationData.providerUuid,
          valueType: observationData.value_type || (observationData.value_text ? 'text' : observationData.value_numeric ? 'numeric' : 'coded')
        }
      });

      // REMOVED: Legacy patient.medications update (no longer needed)
      // MedicalRecord is now the single source of truth

      console.log(`✅ Medication stored successfully!`);
      console.log(`   - MedicalRecord ID: ${medicalRecord._id}`);
      console.log(`   - Patient: ${patientName}`);
      console.log(`   - Hospital: ${hospitalName}`);
      console.log(`   - Doctor: ${doctorLicenseNumber}`);
      return { medicalRecord };
    }
    
    throw new CustomError(`Invalid observation type: ${observationType}`, 400);
  } catch (error) {
    console.error('❌ Error storing OpenMRS observation:', error);
    throw error;
  }
};

export default {
  syncPatientMapping,
  syncHospitalMapping,
  getPatientDataForOpenMRS,
  getPatientByOpenmrsUuid,
  syncDoctorData,
  storeOpenMRSObservation
};
