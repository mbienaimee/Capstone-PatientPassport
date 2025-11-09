import mongoose, { Schema } from 'mongoose';
import { IMedicalCondition, IMedicalConditionModel } from '@/types';

const medicalConditionSchema = new Schema<IMedicalCondition>({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor reference is required']
  },
  name: {
    type: String,
    required: [true, 'Condition name is required'],
    trim: true,
    minlength: [2, 'Condition name must be at least 2 characters'],
    maxlength: [100, 'Condition name cannot exceed 100 characters']
  },
  details: {
    type: String,
    required: [true, 'Condition details are required'],
    trim: true,
    maxlength: [5000, 'Details cannot exceed 5000 characters']
  },
  diagnosed: {
    type: Date,
    required: [true, 'Diagnosis date is required'],
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Diagnosis date cannot be in the future'
    }
  },
  procedure: {
    type: String,
    trim: true,
    maxlength: [500, 'Procedure description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'chronic'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Notes cannot exceed 5000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
medicalConditionSchema.index({ patient: 1 });
medicalConditionSchema.index({ doctor: 1 });
medicalConditionSchema.index({ status: 1 });
medicalConditionSchema.index({ diagnosed: -1 });
medicalConditionSchema.index({ name: 1 });

// Virtual for patient info
medicalConditionSchema.virtual('patientInfo', {
  ref: 'Patient',
  localField: 'patient',
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor info
medicalConditionSchema.virtual('doctorInfo', {
  ref: 'Doctor',
  localField: 'doctor',
  foreignField: '_id',
  justOne: true
});

// Method to get summary
medicalConditionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    status: this.status,
    diagnosed: this.diagnosed,
    hasProcedure: !!this.procedure
  };
};

// Static method to find by patient
medicalConditionSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patient: patientId }).sort({ diagnosed: -1 });
};

// Static method to find by doctor
medicalConditionSchema.statics.findByDoctor = function(doctorId: string) {
  return this.find({ doctor: doctorId }).sort({ diagnosed: -1 });
};

// Static method to find by status
medicalConditionSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ diagnosed: -1 });
};

// Static method to find active conditions
medicalConditionSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ diagnosed: -1 });
};

// Static method to find by date range
medicalConditionSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    diagnosed: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ diagnosed: -1 });
};

export default mongoose.model<IMedicalCondition, IMedicalConditionModel>('MedicalCondition', medicalConditionSchema);








