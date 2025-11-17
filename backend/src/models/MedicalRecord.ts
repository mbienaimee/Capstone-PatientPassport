import mongoose, { Schema } from 'mongoose';

export interface IMedicalRecord extends mongoose.Document {
  _id: string;
  patientId: string; // Reference to Patient
  type: 'condition' | 'medication' | 'test' | 'visit' | 'image';
  data: {
    // For conditions
    name?: string;
    diagnosis?: string;        // Alias for name (for frontend compatibility)
    details?: string;
    diagnosed?: string;
    diagnosedDate?: string;   // Alias for diagnosed (for frontend compatibility)
    date?: string;            // Generic date field (for frontend compatibility)
    procedure?: string;
    doctor?: string;          // Doctor/provider name
    diagnosedBy?: string;      // Who diagnosed the condition
    hospital?: string;        // Hospital name (available for all types)
    
    // For medications
    medicationName?: string;
    dosage?: string;
    medicationStatus?: 'Active' | 'Past';
    frequency?: string;       // Medication frequency
    startDate?: string;       // Medication start date
    endDate?: string;        // Medication end date
    prescribedBy?: string;    // Who prescribed the medication
    medications?: Array<{    // Array of medications (for multiple medications per observation)
      name: string;
      dosage?: string;
      frequency?: string;
      startDate?: string;
      endDate?: string;
      prescribedBy?: string;
      medicationStatus?: 'Active' | 'Past';
    }>;
    
    // For tests
    testName?: string;
    testDate?: string;
    result?: string;
    testStatus?: 'Normal' | 'Critical' | 'Abnormal';
    
    // For visits
    reason?: string;
    visitDate?: string;
    treatment?: string;       // Treatment provided during visit
    
    // For images
    imageUrl?: string;
    imageType?: string;
    description?: string;
    
    // Common fields (available for all types)
    notes?: string;           // General notes
    status?: string;          // General status field
  };
  createdBy: string; // Doctor ID who created this record
  
  // Edit access control (for synced observations)
  editableBy?: string[];      // Array of doctor IDs who can edit this record
  lastEditedAt?: Date;        // When the record was last edited
  syncDate?: Date;            // When the record was synced from OpenMRS (for time-based access control)
  
  // OpenMRS metadata (for synced records)
  openmrsData?: {
    obsId?: number;           // OpenMRS obs_id
    conceptId?: number;        // OpenMRS concept_id
    personId?: number;         // OpenMRS person_id
    obsDatetime?: Date;        // When observation was taken
    dateCreated?: Date;        // When entered into OpenMRS
    creatorName?: string;      // Doctor/user who entered in OpenMRS
    locationName?: string;     // Hospital/Location name from OpenMRS
    encounterUuid?: string;    // OpenMRS encounter UUID
    providerUuid?: string;     // OpenMRS provider UUID
    valueType?: 'text' | 'numeric' | 'coded'; // Type of value stored
  };
  
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
    diagnosis: String,        // Alias for name (for frontend compatibility)
    details: String,
    diagnosed: String,
    diagnosedDate: String,     // Alias for diagnosed (for frontend compatibility)
    date: String,             // Generic date field (for frontend compatibility)
    procedure: String,
    doctor: String,           // Doctor/provider name
    diagnosedBy: String,      // Who diagnosed the condition
    hospital: String,         // Hospital name (available for all types)
    
    // Medication fields
    medicationName: String,
    dosage: String,
    frequency: String,        // Medication frequency
    medicationStatus: {
      type: String,
      enum: ['Active', 'Past']
    },
    startDate: String,       // Medication start date
    endDate: String,         // Medication end date
    prescribedBy: String,    // Who prescribed the medication
    medications: [{          // Array of medications (for multiple medications per observation)
      name: String,
      dosage: String,
      frequency: String,
      startDate: String,
      endDate: String,
      prescribedBy: String,
      medicationStatus: {
        type: String,
        enum: ['Active', 'Past']
      }
    }],
    
    // Test fields
    testName: String,
    testDate: String,
    result: String,
    testStatus: {
      type: String,
      enum: ['Normal', 'Critical', 'Abnormal']
    },
    
    // Visit fields
    reason: String,
    visitDate: String,
    treatment: String,       // Treatment provided during visit
    
    // Image fields
    imageUrl: String,
    imageType: String,
    description: String,
    
    // Common fields (available for all types)
    notes: String,           // General notes
    status: String          // General status field
  },
  createdBy: {
    type: String,
    required: [true, 'Created by is required'],
    ref: 'User'
  },
  // Edit access control (for synced observations)
  editableBy: [{
    type: String,
    ref: 'User'
  }],
  lastEditedAt: Date,
  syncDate: Date,  // When synced from OpenMRS (for time-based access control)
  // OpenMRS metadata for synced records
  openmrsData: {
    obsId: Number,
    conceptId: Number,
    personId: Number,
    obsDatetime: Date,
    dateCreated: Date,
    creatorName: String,
    locationName: String,
    encounterUuid: String,
    providerUuid: String,
    valueType: {
      type: String,
      enum: ['text', 'numeric', 'coded']
    }
  }
}, {
  timestamps: true
});

// Indexes for performance optimization
medicalRecordSchema.index({ patientId: 1, type: 1 });
medicalRecordSchema.index({ patientId: 1, createdAt: -1 }); // For sorted queries
medicalRecordSchema.index({ createdBy: 1 });
medicalRecordSchema.index({ syncDate: -1 }); // For time-based queries
medicalRecordSchema.index({ 'openmrsData.obsId': 1 }, { sparse: true }); // For sync lookups

export default mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);

