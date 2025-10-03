import mongoose, { Schema } from 'mongoose';
import { IMedication, IMedicationModel } from '@/types';

const medicationSchema = new Schema<IMedication>({
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
    required: [true, 'Medication name is required'],
    trim: true,
    minlength: [2, 'Medication name must be at least 2 characters'],
    maxlength: [100, 'Medication name cannot exceed 100 characters']
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true,
    maxlength: [50, 'Dosage cannot exceed 50 characters']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true,
    enum: [
      'Once daily',
      'Twice daily',
      'Three times daily',
      'Four times daily',
      'Every 4 hours',
      'Every 6 hours',
      'Every 8 hours',
      'Every 12 hours',
      'As needed',
      'Before meals',
      'After meals',
      'At bedtime',
      'Weekly',
      'Monthly'
    ]
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Start date cannot be in the future'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return !value || value >= this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
medicationSchema.index({ patient: 1 });
medicationSchema.index({ doctor: 1 });
medicationSchema.index({ status: 1 });
medicationSchema.index({ startDate: -1 });
medicationSchema.index({ name: 1 });

// Virtual for patient info
medicationSchema.virtual('patientInfo', {
  ref: 'Patient',
  localField: 'patient',
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor info
medicationSchema.virtual('doctorInfo', {
  ref: 'Doctor',
  localField: 'doctor',
  foreignField: '_id',
  justOne: true
});

// Virtual for duration
medicationSchema.virtual('duration').get(function() {
  if (!this.endDate) return null;
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Method to check if medication is active
medicationSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now);
};

// Method to get summary
medicationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    dosage: this.dosage,
    frequency: this.frequency,
    status: this.status,
    isActive: this.isActive(),
    duration: this.duration
  };
};

// Static method to find by patient
medicationSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patient: patientId }).sort({ startDate: -1 });
};

// Static method to find by doctor
medicationSchema.statics.findByDoctor = function(doctorId: string) {
  return this.find({ doctor: doctorId }).sort({ startDate: -1 });
};

// Static method to find by status
medicationSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ startDate: -1 });
};

// Static method to find active medications
medicationSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ startDate: -1 });
};

// Static method to find current medications (active and not expired)
medicationSchema.statics.findCurrent = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: now } }
    ]
  }).sort({ startDate: -1 });
};

// Static method to find by date range
medicationSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    startDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ startDate: -1 });
};

export default mongoose.model<IMedication, IMedicationModel>('Medication', medicationSchema);








