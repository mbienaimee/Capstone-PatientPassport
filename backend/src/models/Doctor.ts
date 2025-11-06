import mongoose, { Schema } from 'mongoose';
import { IDoctor, IDoctorModel } from '@/types';

const doctorSchema = new Schema<IDoctor>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true,
    enum: [
      'General Practice',
      'Cardiology',
      'Dermatology',
      'Endocrinology',
      'Gastroenterology',
      'Hematology',
      'Infectious Disease',
      'Nephrology',
      'Neurology',
      'Oncology',
      'Pediatrics',
      'Psychiatry',
      'Pulmonology',
      'Rheumatology',
      'Urology',
      'Emergency Medicine',
      'Anesthesiology',
      'Radiology',
      'Pathology',
      'Surgery',
      'Internal Medicine',
      'Family Medicine',
      'Obstetrics and Gynecology',
      'Ophthalmology',
      'Orthopedics',
      'Otolaryngology'
    ]
  },
  hospital: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital reference is required']
  },
  patients: [{
    type: Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  // OpenMRS Integration
  openmrsProviderUuid: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (removed duplicates - user and licenseNumber already have unique: true)
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isActive: 1 });

// Virtual for patient count
doctorSchema.virtual('patientCount').get(function() {
  return this.patients ? this.patients.length : 0;
});

// Virtual for full profile
doctorSchema.virtual('fullProfile', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Virtual for hospital info
doctorSchema.virtual('hospitalInfo', {
  ref: 'Hospital',
  localField: 'hospital',
  foreignField: '_id',
  justOne: true
});

// Method to add patient
doctorSchema.methods.addPatient = function(patientId: string) {
  if (!this.patients.includes(patientId)) {
    this.patients.push(patientId);
  }
  return this.save();
};

// Method to remove patient
doctorSchema.methods.removePatient = function(patientId: string) {
  this.patients = this.patients.filter(id => !id.equals(patientId));
  return this.save();
};

// Method to get summary
doctorSchema.methods.getSummary = function() {
  return {
    id: this._id,
    licenseNumber: this.licenseNumber,
    specialization: this.specialization,
    patientCount: this.patientCount,
    isActive: this.isActive
  };
};

// Static method to find by license number
doctorSchema.statics.findByLicenseNumber = function(licenseNumber: string) {
  return this.findOne({ licenseNumber: licenseNumber.toUpperCase() });
};

// Static method to find by specialization
doctorSchema.statics.findBySpecialization = function(specialization: string) {
  return this.find({ specialization, isActive: true });
};

// Static method to find by hospital
doctorSchema.statics.findByHospital = function(hospitalId: string) {
  return this.find({ hospital: hospitalId, isActive: true });
};

// Static method to find active doctors
doctorSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

export default mongoose.model<IDoctor, IDoctorModel>('Doctor', doctorSchema);








