import mongoose, { Schema } from 'mongoose';
import { AuditLog as IAuditLog } from '@/types';

const auditLogSchema = new Schema({
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
  accessType: {
    type: String,
    required: [true, 'Access type is required'],
    enum: ['regular', 'emergency', 'consent'],
    default: 'regular'
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['view', 'create', 'update', 'delete']
  },
  details: {
    type: String,
    required: [true, 'Details are required'],
    trim: true,
    maxlength: [1000, 'Details cannot exceed 1000 characters']
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

// Indexes
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ patient: 1 });
auditLogSchema.index({ accessType: 1 });
auditLogSchema.index({ accessTime: -1 });
auditLogSchema.index({ createdAt: -1 });

// Virtual for user details
auditLogSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Virtual for patient details
auditLogSchema.virtual('patientDetails', {
  ref: 'Patient',
  localField: 'patient',
  foreignField: '_id',
  justOne: true
});

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

