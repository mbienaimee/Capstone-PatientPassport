import mongoose, { Schema } from 'mongoose';
import { IPatient, IPatientModel } from '@/types';

const emergencyContactSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Emergency contact name is required'],
    trim: true
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Emergency contact phone is required'],
    trim: true
  }
}, { _id: false });

const patientSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  nationalId: {
    type: String,
    required: [true, 'National ID is required'],
    unique: true,
    trim: true,
    match: [/^\d{10,16}$/, 'National ID must be between 10 and 16 digits']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value: Date) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: [true, 'Gender is required']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  emergencyContact: {
    type: emergencyContactSchema,
    required: [true, 'Emergency contact is required']
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null
  },
  allergies: [{
    type: String,
    trim: true
  }],
  currentMedications: [{
    type: String,
    trim: true
  }],
  medicalHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'MedicalCondition'
  }],
  medications: [{
    type: Schema.Types.ObjectId,
    ref: 'Medication'
  }],
  testResults: [{
    type: Schema.Types.ObjectId,
    ref: 'TestResult'
  }],
  hospitalVisits: [{
    type: Schema.Types.ObjectId,
    ref: 'HospitalVisit'
  }],
  assignedDoctors: [{
    type: Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  
  // Temporary OTP fields for passport access
  tempOTP: {
    type: String,
    default: null
  },
  tempOTPExpiry: {
    type: Date,
    default: null
  },
  tempOTPDoctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes (removed duplicates - nationalId and user already have unique: true)
patientSchema.index({ status: 1 });
patientSchema.index({ assignedDoctors: 1 });

// Virtual for age
patientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date((this as any).dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for full profile
patientSchema.virtual('fullProfile', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
patientSchema.pre('save', function(next) {
  // Convert nationalId to string and remove any non-numeric characters
  if ((this as any).nationalId) {
    (this as any).nationalId = (this as any).nationalId.replace(/\D/g, '');
  }
  next();
});

// Method to get summary
patientSchema.methods.getSummary = function() {
  return {
    id: this._id,
    nationalId: this.nationalId,
    age: this.age,
    bloodType: this.bloodType,
    status: this.status,
    allergies: this.allergies,
    currentMedications: this.currentMedications,
    medicalHistoryCount: this.medicalHistory ? this.medicalHistory.length : 0,
    medicationsCount: this.medications ? this.medications.length : 0,
    testResultsCount: this.testResults ? this.testResults.length : 0,
    hospitalVisitsCount: this.hospitalVisits ? this.hospitalVisits.length : 0
  };
};

// Static method to find by national ID
patientSchema.statics.findByNationalId = function(nationalId: string) {
  return this.findOne({ nationalId: nationalId.replace(/\D/g, '') });
};

// Static method to find active patients
patientSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

export default mongoose.model<IPatient, IPatientModel>('Patient', patientSchema);








