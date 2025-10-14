import mongoose, { Schema } from 'mongoose';
import { IPatientPassport, IPatientPassportModel } from '@/types';

const passportSchema = new Schema<IPatientPassport>({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true
  },
  
  // Personal Information
  personalInfo: {
    fullName: { type: String, required: true },
    nationalId: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      required: true 
    },
    bloodType: { 
      type: String, 
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: false 
    },
    contactNumber: { type: String, required: true },
    email: { type: String, required: false },
    address: { type: String, required: true },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true }
    }
  },

  // Medical Information
  medicalInfo: {
    allergies: [{ type: String }],
    currentMedications: [{ 
      name: String,
      dosage: String,
      frequency: String,
      prescribedBy: String,
      startDate: Date
    }],
    medicalConditions: [{
      condition: String,
      diagnosedDate: Date,
      diagnosedBy: String,
      status: { type: String, enum: ['active', 'resolved', 'chronic'], default: 'active' },
      notes: String
    }],
    immunizations: [{
      vaccine: String,
      date: Date,
      administeredBy: String,
      batchNumber: String
    }],
    surgeries: [{
      procedure: String,
      date: Date,
      surgeon: String,
      hospital: String,
      notes: String
    }]
  },

  // Test Results
  testResults: [{
    testType: String,
    testDate: Date,
    results: String,
    normalRange: String,
    status: { type: String, enum: ['normal', 'abnormal', 'critical'], default: 'normal' },
    labTechnician: String,
    notes: String
  }],

  // Hospital Visits
  hospitalVisits: [{
    visitDate: Date,
    hospital: String,
    doctor: String,
    reason: String,
    diagnosis: String,
    treatment: String,
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date,
    notes: String
  }],

  // Insurance Information
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    effectiveDate: Date,
    expiryDate: Date,
    coverageType: String
  },

  // Access Control
  accessHistory: [{
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    accessDate: { type: Date, default: Date.now },
    accessType: { type: String, enum: ['view', 'update'], default: 'view' },
    reason: String,
    otpVerified: { type: Boolean, default: false }
  }],

  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'Doctor' },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for better performance
passportSchema.index({ patient: 1 });
passportSchema.index({ 'personalInfo.nationalId': 1 });
passportSchema.index({ 'accessHistory.doctor': 1 });
passportSchema.index({ lastUpdated: -1 });

// Virtual for passport ID
passportSchema.virtual('passportId').get(function() {
  return this._id.toString();
});

// Method to add access record
passportSchema.methods.addAccessRecord = function(doctorId: string, accessType: string, reason: string, otpVerified: boolean = false) {
  this.accessHistory.push({
    doctor: doctorId,
    accessDate: new Date(),
    accessType,
    reason,
    otpVerified
  });
  return this.save();
};

// Method to update passport
passportSchema.methods.updatePassport = function(updateData: any, updatedBy: string) {
  // Update the relevant fields
  if (updateData.personalInfo) {
    this.personalInfo = { ...this.personalInfo, ...updateData.personalInfo };
  }
  if (updateData.medicalInfo) {
    this.medicalInfo = { ...this.medicalInfo, ...updateData.medicalInfo };
  }
  if (updateData.testResults) {
    this.testResults = updateData.testResults;
  }
  if (updateData.hospitalVisits) {
    this.hospitalVisits = updateData.hospitalVisits;
  }
  if (updateData.insurance) {
    this.insurance = { ...this.insurance, ...updateData.insurance };
  }

  // Update metadata
  this.lastUpdated = new Date();
  this.lastUpdatedBy = updatedBy;
  this.version += 1;

  return this.save();
};

// Method to get summary
passportSchema.methods.getSummary = function() {
  return {
    id: this._id,
    patientId: this.patient,
    fullName: this.personalInfo.fullName,
    nationalId: this.personalInfo.nationalId,
    lastUpdated: this.lastUpdated,
    version: this.version,
    accessCount: this.accessHistory ? this.accessHistory.length : 0
  };
};

// Static method to find by patient ID
passportSchema.statics.findByPatientId = function(patientId: string) {
  return this.findOne({ patient: patientId, isActive: true });
};

// Static method to find by national ID
passportSchema.statics.findByNationalId = function(nationalId: string) {
  return this.findOne({ 'personalInfo.nationalId': nationalId, isActive: true });
};

// Static method to get recent access
passportSchema.statics.getRecentAccess = function(doctorId: string, limit: number = 10) {
  return this.find({ 
    'accessHistory.doctor': doctorId,
    isActive: true 
  })
  .sort({ 'accessHistory.accessDate': -1 })
  .limit(limit)
  .populate('patient', 'user nationalId')
  .populate('patient.user', 'name email');
};

export default mongoose.model<IPatientPassport, IPatientPassportModel>('PatientPassport', passportSchema);
