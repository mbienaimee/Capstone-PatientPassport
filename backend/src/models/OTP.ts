import mongoose, { Schema } from 'mongoose';

export interface IOTP {
  _id: string;
  identifier: string; // email or phone number
  type: 'email' | 'phone';
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>({
  identifier: {
    type: String,
    required: [true, 'Identifier (email or phone) is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['email', 'phone'],
    required: [true, 'OTP type is required']
  },
  code: {
    type: String,
    required: [true, 'OTP code is required'],
    length: 6
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  }
}, {
  timestamps: true
});

// Indexes
otpSchema.index({ identifier: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate OTP
otpSchema.statics.generateOTP = function(identifier: string, type: 'email' | 'phone') {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return this.create({
    identifier,
    type,
    code
  });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(identifier: string, code: string, type: 'email' | 'phone') {
  const otp = await this.findOne({
    identifier,
    code,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otp) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  if (otp.attempts >= 3) {
    return { valid: false, message: 'Too many attempts. Please request a new OTP' };
  }

  // Mark as used
  otp.isUsed = true;
  await otp.save();

  return { valid: true, message: 'OTP verified successfully' };
};

// Define the interface for static methods
interface IOTPModel extends mongoose.Model<IOTP> {
  generateOTP(identifier: string, type: 'email' | 'phone'): Promise<IOTP>;
  verifyOTP(identifier: string, code: string, type: 'email' | 'phone'): Promise<{ valid: boolean; message: string }>;
}

export default mongoose.model<IOTP, IOTPModel>('OTP', otpSchema);
