import mongoose, { Schema } from 'mongoose';

export interface IPatientPassport {
  _id: string;
  universalId: string;
  phoneNumber: string;
  isActive: boolean;
  consentTokens: string[]; // References to ConsentToken
  proxies: ProxyUser[];
  preferences: PatientPreferences;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProxyUser {
  name: string;
  phoneNumber: string;
  relationship: string;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
}

export interface PatientPreferences {
  allowEmergencyAccess: boolean;
  allowDataSharing: boolean;
  notificationSettings: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  dataRetentionDays: number;
}

const proxyUserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Proxy name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Proxy phone number is required'],
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: [{
    type: String,
    enum: ['view', 'consent', 'emergency']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const patientPreferencesSchema = new Schema({
  allowEmergencyAccess: {
    type: Boolean,
    default: true
  },
  allowDataSharing: {
    type: Boolean,
    default: true
  },
  notificationSettings: {
    sms: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  dataRetentionDays: {
    type: Number,
    default: 30,
    min: 1,
    max: 365
  }
}, { _id: false });

const patientPassportSchema = new Schema({
  universalId: {
    type: String,
    required: [true, 'Universal ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  consentTokens: [{
    type: Schema.Types.ObjectId,
    ref: 'ConsentToken'
  }],
  proxies: [proxyUserSchema],
  preferences: {
    type: patientPreferencesSchema,
    default: () => ({})
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
patientPassportSchema.index({ universalId: 1 });
patientPassportSchema.index({ phoneNumber: 1 });
patientPassportSchema.index({ isActive: 1 });

// Virtual for active consent tokens
patientPassportSchema.virtual('activeConsentTokens', {
  ref: 'ConsentToken',
  localField: 'consentTokens',
  foreignField: '_id',
  match: { isActive: true, expiresAt: { $gt: new Date() } }
});

// Virtual for active proxies
patientPassportSchema.virtual('activeProxies').get(function() {
  return this.proxies.filter((proxy: ProxyUser) => proxy.isActive);
});

export default mongoose.model<IPatientPassport>('PatientPassport', patientPassportSchema);

