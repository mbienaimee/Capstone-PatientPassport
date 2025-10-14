import mongoose, { Schema } from 'mongoose';
import { ITestResult, ITestResultModel } from '@/types';

const testResultSchema = new Schema<ITestResult>({
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
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    minlength: [2, 'Test name must be at least 2 characters'],
    maxlength: [100, 'Test name cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Test date is required'],
    default: Date.now,
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Test date cannot be in the future'
    }
  },
  status: {
    type: String,
    enum: ['normal', 'critical', 'abnormal'],
    required: [true, 'Test status is required'],
    default: 'normal'
  },
  findings: {
    type: String,
    required: [true, 'Test findings are required'],
    trim: true,
    maxlength: [2000, 'Findings cannot exceed 2000 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  attachments: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
testResultSchema.index({ patient: 1 });
testResultSchema.index({ doctor: 1 });
testResultSchema.index({ hospital: 1 });
testResultSchema.index({ status: 1 });
testResultSchema.index({ date: -1 });
testResultSchema.index({ name: 1 });

// Virtual for patient info
testResultSchema.virtual('patientInfo', {
  ref: 'Patient',
  localField: 'patient',
  foreignField: '_id',
  justOne: true
});

// Virtual for doctor info
testResultSchema.virtual('doctorInfo', {
  ref: 'Doctor',
  localField: 'doctor',
  foreignField: '_id',
  justOne: true
});

// Virtual for hospital info
testResultSchema.virtual('hospitalInfo', {
  ref: 'Hospital',
  localField: 'hospital',
  foreignField: '_id',
  justOne: true
});

// Method to check if critical
testResultSchema.methods.isCritical = function() {
  return this.status === 'critical';
};

// Method to get summary
testResultSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    status: this.status,
    date: this.date,
    isCritical: this.isCritical(),
    hasAttachments: this.attachments ? this.attachments.length > 0 : false
  };
};

// Static method to find by patient
testResultSchema.statics.findByPatient = function(patientId: string) {
  return this.find({ patient: patientId }).sort({ date: -1 });
};

// Static method to find by doctor
testResultSchema.statics.findByDoctor = function(doctorId: string) {
  return this.find({ doctor: doctorId }).sort({ date: -1 });
};

// Static method to find by hospital
testResultSchema.statics.findByHospital = function(hospitalId: string) {
  return this.find({ hospital: hospitalId }).sort({ date: -1 });
};

// Static method to find by status
testResultSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ date: -1 });
};

// Static method to find critical results
testResultSchema.statics.findCritical = function() {
  return this.find({ status: 'critical' }).sort({ date: -1 });
};

// Static method to find by date range
testResultSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to find recent results
testResultSchema.statics.findRecent = function(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

export default mongoose.model<ITestResult, ITestResultModel>('TestResult', testResultSchema);
