import Patient from '@/models/Patient';
import Hospital from '@/models/Hospital';
import Doctor from '@/models/Doctor';
import MedicalCondition from '@/models/MedicalCondition';
import Medication from '@/models/Medication';
import mongoose from 'mongoose';
import { CustomError } from '@/middleware/errorHandler';

/**
 * OpenMRS Integration Service
 * Handles bidirectional sync between Patient Passport and OpenMRS systems
 * Uses PATIENT NAME as the common identifier (not National ID)
 */

interface PatientMapping {
  passportPatientId: string;
  openmrsPatientUuid: string;
  patientName: string; // Changed from nationalId to patientName
  syncedAt: Date;
}

interface HospitalMapping {
  passportHospitalId: string;
  openmrsHospitalUuid: string;
  hospitalName: string;
  syncedAt: Date;
}

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

    // Find user by name
    const User = mongoose.model('User');
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${patientName}$`, 'i') },
      role: 'patient'
    });

    if (!user) {
      throw new CustomError(`User "${patientName}" not found`, 404);
    }

    // Find patient
    const patient = await Patient.findOne({ user: user._id });
    if (!patient) {
      throw new CustomError(`Patient "${patientName}" not found`, 404);
    }

    // Find doctor - try multiple approaches
    let doctor = await Doctor.findOne({ 
      licenseNumber: doctorLicenseNumber.toUpperCase() 
    });
    
    // If not found, try finding by username (for OpenMRS users)
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
    
    // If still not found, create a placeholder doctor record
    if (!doctor) {
      console.warn(`⚠️ Doctor ${doctorLicenseNumber} not found - creating placeholder`);
      
      // Create a placeholder user for this OpenMRS doctor
      const doctorUserPlaceholder = await User.create({
        name: `Dr. ${doctorLicenseNumber}`,
        email: `${doctorLicenseNumber.toLowerCase()}@openmrs.system`,
        password: Math.random().toString(36),
        role: 'doctor',
        isActive: true,
        isEmailVerified: false
      });
      
      doctor = await Doctor.create({
        user: doctorUserPlaceholder._id,
        licenseNumber: doctorLicenseNumber.toUpperCase(),
        specialization: 'General Practice',
        hospital: null,
        yearsOfExperience: 0
      });
      
      console.log(`✅ Created placeholder doctor: ${doctor.licenseNumber}`);
    }

    // Find hospital - be flexible with name matching
    let hospital = await Hospital.findOne({ 
      name: { $regex: new RegExp(`^${hospitalName}$`, 'i') } 
    });
    
    // Try partial match if exact match fails
    if (!hospital) {
      hospital = await Hospital.findOne({
        name: { $regex: new RegExp(hospitalName, 'i') }
      });
    }
    
    // If still not found, create a placeholder hospital
    if (!hospital) {
      console.warn(`⚠️ Hospital ${hospitalName} not found - creating placeholder`);
      
      // Create placeholder hospital user
      const hospitalUserPlaceholder = await User.create({
        name: hospitalName,
        email: `${hospitalName.toLowerCase().replace(/\s+/g, '')}@openmrs.system`,
        password: Math.random().toString(36),
        role: 'hospital',
        isActive: true,
        isEmailVerified: false
      });
      
      hospital = await Hospital.create({
        user: hospitalUserPlaceholder._id,
        name: hospitalName,
        registrationNumber: `OPENMRS-${Date.now()}`,
        address: 'Address not provided',
        phone: '000-000-0000',
        email: hospitalUserPlaceholder.email,
        type: 'General Hospital',
        isApproved: true
      });
      
      console.log(`✅ Created placeholder hospital: ${hospital.name}`);
    }

    if (observationType === 'diagnosis') {
      // Create medical condition
      const condition = await MedicalCondition.create({
        patient: patient._id,
        doctor: doctor._id,
        name: observationData.diagnosis,
        details: observationData.details || '',
        diagnosed: observationData.date || new Date(),
        status: observationData.status || 'active',
        notes: `Added from OpenMRS - Hospital: ${hospitalName}`
      });

      // Add to patient's medical history
      if (!patient.medicalHistory.includes(condition._id)) {
        patient.medicalHistory.push(condition._id);
        await patient.save();
      }

      console.log(`✅ Diagnosis stored in passport system from OpenMRS`);
      return condition;
    } else if (observationType === 'medication') {
      // Create medication
      const medication = await Medication.create({
        patient: patient._id,
        doctor: doctor._id,
        hospital: hospital._id,
        name: observationData.medicationName,
        dosage: observationData.dosage,
        frequency: observationData.frequency || 'As needed',
        startDate: observationData.startDate || new Date(),
        endDate: observationData.endDate,
        status: observationData.status || 'active',
        notes: `Added from OpenMRS - Hospital: ${hospitalName}`
      });

      // Add to patient's medications
      if (!patient.medications.includes(medication._id)) {
        patient.medications.push(medication._id);
        await patient.save();
      }

      console.log(`✅ Medication stored in passport system from OpenMRS`);
      return medication;
    }
    
    // If neither diagnosis nor medication type
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
