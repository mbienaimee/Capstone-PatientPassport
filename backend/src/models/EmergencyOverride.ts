import mongoose, { Schema } from 'mongoose';
import { EmergencyOverride as IEmergencyOverride } from '@/types';

const emergencyOverrideSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  justification: {
    type: String,
    required: [true, 'Justification is required'],
    trim: true,
    maxlength: [500, 'Justification cannot exceed 500 characters']
  },
  accessTime: {
    type: Date,
    required: [true, 'Access time is required'],
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
emergencyOverrideSchema.index({ user: 1 });
emergencyOverrideSchema.index({ patient: 1 });
emergencyOverrideSchema.index({ accessTime: -1 });
emergencyOverrideSchema.index({ createdAt: -1 });
// Compound index for emergency access verification (most common query)
emergencyOverrideSchema.index({ user: 1, patient: 1, accessTime: -1 });

// Virtual for user details
emergencyOverrideSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Virtual for patient details
emergencyOverrideSchema.virtual('patientDetails', {
  ref: 'Patient',
  localField: 'patient',
  foreignField: '_id',
  justOne: true
});

export default mongoose.model<IEmergencyOverride>('EmergencyOverride', emergencyOverrideSchema);

