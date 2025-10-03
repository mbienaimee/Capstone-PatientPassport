import mongoose, { Schema } from 'mongoose';
import { IHospitalVisit, IHospitalVisitModel } from '@/types';

const hospitalVisitSchema = new Schema<IHospitalVisit>({
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
  hospital: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital reference is required']
  },
  reason: {
    type: String,
    required: [true, 'Visit reason is required'],
    trim: true,
    minlength: [5, 'Reason must be at least 5 characters'],
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Visit date is required'],
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Visit date cannot be in the future'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Treatment cannot exceed 1000 characters']
  },
  followUpDate: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return !value || value >= this.date;
      },
      message: 'Follow-up date must be after visit date'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
hospitalVisitSchema.index({ patient: 1 });
hospitalVisitSchema.index({ doctor: 1 });
hospitalVisitSchema.index({ hospital: 1 });
hospitalVisitSchema.index({ date: -1 });
hospitalVisitSchema.index({ followUpDate: 1 });

// Virtual for patient info
hospitalVisitSchema.virtual('patientInfo', {
  ref: 'Patient',
  localField: 'patient',
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor info
hospitalVisitSchema.virtual('doctorInfo', {
  ref: 'Doctor',
  localField: 'doctor',
  foreignField: '_id',
  justOne: true
});

// Virtual for hospital info
hospitalVisitSchema.virtual('hospitalInfo', {
  ref: 'Hospital',
  localField: 'hospital',
  foreignField: '_id',
  justOne: true
});

// Method to check if follow-up is due
hospitalVisitSchema.methods.isFollowUpDue = function() {
  if (!this.followUpDate) return false;
  const now = new Date();
  return this.followUpDate <= now;
};

// Method to get summary
hospitalVisitSchema.methods.getSummary = function() {
  return {
    id: this._id,
    reason: this.reason,
    date: this.date,
    hasDiagnosis: !!this.diagnosis,
    hasTreatment: !!this.treatment,
    followUpDue: this.isFollowUpDue()
  };
};

// Static method to find by patient
hospitalVisitSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patient: patientId }).sort({ date: -1 });
};

// Static method to find by doctor
hospitalVisitSchema.statics.findByDoctor = function(doctorId: string) {
  return this.find({ doctor: doctorId }).sort({ date: -1 });
};

// Static method to find by hospital
hospitalVisitSchema.statics.findByHospital = function(hospitalId: string) {
  return this.find({ hospital: hospitalId }).sort({ date: -1 });
};

// Static method to find by date range
hospitalVisitSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to find recent visits
hospitalVisitSchema.statics.findRecent = function(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

// Static method to find follow-up due visits
hospitalVisitSchema.statics.findFollowUpDue = function() {
  const now = new Date();
  return this.find({
    followUpDate: { $lte: now, $exists: true }
  }).sort({ followUpDate: 1 });
};

export default mongoose.model<IHospitalVisit, IHospitalVisitModel>('HospitalVisit', hospitalVisitSchema);








