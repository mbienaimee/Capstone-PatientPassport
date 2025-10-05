import mongoose, { Schema } from 'mongoose';

export interface IMedicalRecord extends mongoose.Document {
  _id: string;
  patientId: string; // Reference to Patient
  type: 'condition' | 'medication' | 'test' | 'visit' | 'image';
  data: {
    // For conditions
    name?: string;
    details?: string;
    diagnosed?: string;
    procedure?: string;
    
    // For medications
    medicationName?: string;
    dosage?: string;
    medicationStatus?: 'Active' | 'Past';
    
    // For tests
    testName?: string;
    testDate?: string;
    result?: string;
    testStatus?: 'Normal' | 'Critical' | 'Abnormal';
    
    // For visits
    hospital?: string;
    reason?: string;
    visitDate?: string;
    endDate?: string;
    
    // For images
    imageUrl?: string;
    imageType?: string;
    description?: string;
  };
  createdBy: string; // Doctor ID who created this record
  createdAt: Date;
  updatedAt: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>({
  patientId: {
    type: String,
    required: [true, 'Patient ID is required'],
    ref: 'Patient'
  },
  type: {
    type: String,
    enum: ['condition', 'medication', 'test', 'visit', 'image'],
    required: [true, 'Record type is required']
  },
  data: {
    // Condition fields
    name: String,
    details: String,
    diagnosed: String,
    procedure: String,
    
    // Medication fields
    medicationName: String,
    dosage: String,
    medicationStatus: {
      type: String,
      enum: ['Active', 'Past']
    },
    
    // Test fields
    testName: String,
    testDate: String,
    result: String,
    testStatus: {
      type: String,
      enum: ['Normal', 'Critical', 'Abnormal']
    },
    
    // Visit fields
    hospital: String,
    reason: String,
    visitDate: String,
    endDate: String,
    
    // Image fields
    imageUrl: String,
    imageType: String,
    description: String
  },
  createdBy: {
    type: String,
    required: [true, 'Created by is required'],
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
medicalRecordSchema.index({ patientId: 1, type: 1 });
medicalRecordSchema.index({ createdBy: 1 });

export default mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);

