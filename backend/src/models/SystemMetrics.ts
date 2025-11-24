import mongoose, { Schema, Document } from 'mongoose';

/**
 * System Metrics Model
 * Tracks accuracy, response time, and usability metrics
 */

export interface ISystemMetrics extends Document {
  timestamp: Date;
  metricType: 'response_time' | 'accuracy' | 'usability' | 'error' | 'api_call';
  
  // Response Time Metrics
  endpoint?: string;
  method?: string;
  responseTime?: number; // milliseconds
  statusCode?: number;
  
  // Accuracy Metrics
  operation?: string;
  expectedResult?: any;
  actualResult?: any;
  isAccurate?: boolean;
  accuracyScore?: number; // 0-100
  
  // Usability Metrics
  userId?: Schema.Types.ObjectId;
  userRole?: 'patient' | 'doctor' | 'hospital';
  action?: string;
  completionTime?: number; // milliseconds
  clickCount?: number;
  errorCount?: number;
  satisfactionScore?: number; // 1-5
  
  // Error Tracking
  errorType?: string;
  errorMessage?: string;
  errorStack?: string;
  
  // Additional Context
  userAgent?: string;
  ip?: string;
  metadata?: any;
}

const systemMetricsSchema = new Schema<ISystemMetrics>({
  timestamp: {
    type: Date,
    default: Date.now
  },
  metricType: {
    type: String,
    enum: ['response_time', 'accuracy', 'usability', 'error', 'api_call'],
    required: true
  },
  
  // Response Time Metrics
  endpoint: {
    type: String,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    uppercase: true
  },
  responseTime: {
    type: Number,
    min: 0
  },
  statusCode: {
    type: Number
  },
  
  // Accuracy Metrics
  operation: {
    type: String,
    trim: true
  },
  expectedResult: Schema.Types.Mixed,
  actualResult: Schema.Types.Mixed,
  isAccurate: Boolean,
  accuracyScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Usability Metrics
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  userRole: {
    type: String,
    enum: ['patient', 'doctor', 'hospital']
  },
  action: {
    type: String,
    trim: true
  },
  completionTime: {
    type: Number,
    min: 0
  },
  clickCount: {
    type: Number,
    min: 0
  },
  errorCount: {
    type: Number,
    min: 0,
    default: 0
  },
  satisfactionScore: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Error Tracking
  errorType: String,
  errorMessage: String,
  errorStack: String,
  
  // Additional Context
  userAgent: String,
  ip: String,
  metadata: Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for performance
systemMetricsSchema.index({ timestamp: -1, metricType: 1 });
systemMetricsSchema.index({ endpoint: 1, timestamp: -1 });
systemMetricsSchema.index({ userId: 1, timestamp: -1 });

// TTL Index - auto-delete metrics older than 90 days
systemMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export default mongoose.model<ISystemMetrics>('SystemMetrics', systemMetricsSchema);
