import mongoose, { Schema } from 'mongoose';
import { IHospital, IHospitalModel } from '@/types';

const hospitalSchema = new Schema<IHospital>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    minlength: [2, 'Hospital name must be at least 2 characters'],
    maxlength: [100, 'Hospital name cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
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
    required: [true, 'Admin contact is required'],
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  doctors: [{
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  patients: [{
    type: Schema.Types.ObjectId,
    ref: 'Patient'
  }],
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

// Indexes
hospitalSchema.index({ licenseNumber: 1 });
hospitalSchema.index({ user: 1 });
hospitalSchema.index({ name: 1 });
hospitalSchema.index({ status: 1 });
hospitalSchema.index({ adminContact: 1 });

// Virtual for doctor count
hospitalSchema.virtual('doctorCount').get(function() {
  return this.doctors.length;
});

// Virtual for patient count
hospitalSchema.virtual('patientCount').get(function() {
  return this.patients.length;
});

// Virtual for full profile
hospitalSchema.virtual('fullProfile', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Method to add doctor
hospitalSchema.methods.addDoctor = function(doctorId: string) {
  if (!this.doctors.includes(doctorId)) {
    this.doctors.push(doctorId);
  }
  return this.save();
};

// Method to remove doctor
hospitalSchema.methods.removeDoctor = function(doctorId: string) {
  this.doctors = this.doctors.filter(id => !id.equals(doctorId));
  return this.save();
};

// Method to add patient
hospitalSchema.methods.addPatient = function(patientId: string) {
  if (!this.patients.includes(patientId)) {
    this.patients.push(patientId);
  }
  return this.save();
};

// Method to remove patient
hospitalSchema.methods.removePatient = function(patientId: string) {
  this.patients = this.patients.filter(id => !id.equals(patientId));
  return this.save();
};

// Method to get summary
hospitalSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    licenseNumber: this.licenseNumber,
    status: this.status,
    doctorCount: this.doctorCount,
    patientCount: this.patientCount
  };
};

// Static method to find by license number
hospitalSchema.statics.findByLicenseNumber = function(licenseNumber: string) {
  return this.findOne({ licenseNumber: licenseNumber.toUpperCase() });
};

// Static method to find by name
hospitalSchema.statics.findByName = function(name: string) {
  return this.find({ 
    name: { $regex: name, $options: 'i' },
    status: 'active'
  });
};

// Static method to find by status
hospitalSchema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

// Static method to find active hospitals
hospitalSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find pending hospitals
hospitalSchema.statics.findPending = function() {
  return this.find({ status: 'pending' });
};

export default mongoose.model<IHospital, IHospitalModel>('Hospital', hospitalSchema);








