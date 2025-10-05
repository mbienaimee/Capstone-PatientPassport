import mongoose, { Schema, Document } from 'mongoose';

// Extended interface with virtuals
interface IConsentTokenDocument extends Document {
  _id: string;
  universalId: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isExpired: boolean;
  isValid: boolean;
}

const consentTokenSchema = new Schema({
  universalId: {
    type: String,
    required: [true, 'Universal ID is required'],
    trim: true,
    index: true
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    trim: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 } // TTL index
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    required: [true, 'Created by is required'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
consentTokenSchema.index({ universalId: 1, isActive: 1 });
consentTokenSchema.index({ token: 1 });
consentTokenSchema.index({ expiresAt: 1 });

// Virtual for expiration status
consentTokenSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for validity status
consentTokenSchema.virtual('isValid').get(function() {
  return this.isActive && (new Date() > this.expiresAt) === false;
});

// Pre-save middleware to generate token if not provided
consentTokenSchema.pre('save', function(next) {
  if (!this.token) {
    // Generate a 6-digit numeric token
    this.token = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

export default mongoose.model<IConsentTokenDocument>('ConsentToken', consentTokenSchema);

