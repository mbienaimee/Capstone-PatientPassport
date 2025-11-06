import mongoose, { Schema } from 'mongoose';
import { IHospital, IHospitalModel } from '@/types';

const HospitalSchema = new Schema<IHospital>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Hospital address is required'],
    trim: true
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  adminContact: {
    type: String,
    required: false,
    trim: true
  },
  hospitalId: {
    type: String,
    unique: true,
    trim: true,
    sparse: true
  },
  fhirEndpoint: {
    type: String,
    trim: true
  },
  apiKey: {
    type: String,
    trim: true
  },
  doctors: [{
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  patients: [{
    type: Schema.Types.ObjectId,
    ref: 'Patient'
  }],
  // OpenMRS Integration
  openmrsUuid: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (removed duplicates - user, licenseNumber, and hospitalId already have unique: true)
HospitalSchema.index({ status: 1 });

// Virtual for doctor count
HospitalSchema.virtual('doctorCount').get(function() {
  return this.doctors ? this.doctors.length : 0;
});

// Virtual for patient count
HospitalSchema.virtual('patientCount').get(function() {
  return this.patients ? this.patients.length : 0;
});

// Virtual for full profile
HospitalSchema.virtual('fullProfile', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Method to get summary
HospitalSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    address: this.address,
    contact: this.contact,
    licenseNumber: this.licenseNumber,
    status: this.status,
    doctorCount: this.doctorCount,
    patientCount: this.patientCount
  };
};

// Static method to find by license number
HospitalSchema.statics.findByLicenseNumber = function(licenseNumber: string) {
  return this.findOne({ licenseNumber: licenseNumber.toUpperCase() });
};

// Static method to find pending hospitals
HospitalSchema.statics.findPending = function() {
  return this.find({ status: 'pending' });
};

// Static method to find active hospitals
HospitalSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find by license (for hospital auth)
HospitalSchema.statics.findByLicense = function(licenseNumber: string) {
  return this.findOne({ licenseNumber: licenseNumber.toUpperCase(), status: 'active' });
};

// Static method to find active hospitals (for hospital auth)
HospitalSchema.statics.findActiveHospitals = function() {
  return this.find({ status: 'active' }).select('-doctors -patients');
};

export default mongoose.model<IHospital, IHospitalModel>('Hospital', HospitalSchema);