import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAccessRequest extends Document {
  _id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  requestType: 'view' | 'edit' | 'emergency';
  reason: string;
  requestedData: string[]; // Array of data types requested
  status: 'pending' | 'approved' | 'denied' | 'expired';
  expiresAt: Date;
  approvedAt?: Date;
  deniedAt?: Date;
  patientResponse?: 'approved' | 'denied';
  patientResponseAt?: Date;
  patientResponseReason?: string;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  approve(reason?: string): Promise<IAccessRequest>;
  deny(reason?: string): Promise<IAccessRequest>;
  isExpired(): boolean;
}

export interface IAccessRequestModel extends Model<IAccessRequest> {
  findPendingRequests(patientId: string): Promise<IAccessRequest[]>;
  findByDoctor(doctorId: string): Promise<IAccessRequest[]>;
}

const AccessRequestSchema = new Schema<IAccessRequest>({
  patientId: {
    type: String,
    required: true,
    ref: 'User'
  },
  doctorId: {
    type: String,
    required: true,
    ref: 'User'
  },
  hospitalId: {
    type: String,
    required: true,
    ref: 'Hospital'
  },
  requestType: {
    type: String,
    enum: ['view', 'edit', 'emergency'],
    required: true,
    default: 'view'
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  requestedData: [{
    type: String,
    enum: ['medical_history', 'medications', 'allergies', 'lab_results', 'imaging', 'emergency_contacts', 'insurance']
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  approvedAt: {
    type: Date
  },
  deniedAt: {
    type: Date
  },
  patientResponse: {
    type: String,
    enum: ['approved', 'denied']
  },
  patientResponseAt: {
    type: Date
  },
  patientResponseReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better performance
AccessRequestSchema.index({ patientId: 1, status: 1 });
AccessRequestSchema.index({ doctorId: 1, status: 1 });
AccessRequestSchema.index({ status: 1, expiresAt: 1 });

// Static methods
AccessRequestSchema.statics.findPendingRequests = function(patientId: string) {
  return this.find({
    patientId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('doctorId', 'name email').populate('hospitalId', 'name address');
};

AccessRequestSchema.statics.findByDoctor = function(doctorId: string) {
  return this.find({ doctorId }).populate('patientId', 'name email').populate('hospitalId', 'name address');
};

// Instance methods
AccessRequestSchema.methods.approve = function(reason?: string) {
  this.status = 'approved';
  this.patientResponse = 'approved';
  this.patientResponseAt = new Date();
  this.approvedAt = new Date();
  if (reason) this.patientResponseReason = reason;
  return this.save();
};

AccessRequestSchema.methods.deny = function(reason?: string) {
  this.status = 'denied';
  this.patientResponse = 'denied';
  this.patientResponseAt = new Date();
  this.deniedAt = new Date();
  if (reason) this.patientResponseReason = reason;
  return this.save();
};

AccessRequestSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

// Pre-save middleware to handle expiration
AccessRequestSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

export default mongoose.model<IAccessRequest, IAccessRequestModel>('AccessRequest', AccessRequestSchema);
