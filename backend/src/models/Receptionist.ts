import mongoose, { Schema } from 'mongoose';
import { IReceptionist, IReceptionistModel } from '@/types';

const receptionistSchema = new Schema<IReceptionist>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  hospital: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital reference is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    enum: [
      'General Reception',
      'Emergency',
      'Outpatient',
      'Inpatient',
      'Surgery',
      'Pediatrics',
      'Cardiology',
      'Neurology',
      'Oncology',
      'Radiology'
    ]
  },
  shift: {
    type: String,
    required: [true, 'Shift is required'],
    enum: ['Morning', 'Afternoon', 'Night', 'Flexible']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    canAssignDoctors: {
      type: Boolean,
      default: true
    },
    canViewPatientRecords: {
      type: Boolean,
      default: true
    },
    canScheduleAppointments: {
      type: Boolean,
      default: true
    },
    canAccessEmergencyOverride: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
receptionistSchema.index({ employeeId: 1 });
receptionistSchema.index({ user: 1 });
receptionistSchema.index({ hospital: 1 });
receptionistSchema.index({ department: 1 });

// Virtual for full profile
receptionistSchema.virtual('fullProfile', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Method to get summary
receptionistSchema.methods.getSummary = function() {
  return {
    id: this._id,
    employeeId: this.employeeId,
    department: this.department,
    shift: this.shift,
    isActive: this.isActive,
    permissions: this.permissions
  };
};

// Static method to find by employee ID
receptionistSchema.statics.findByEmployeeId = function(employeeId: string) {
  return this.findOne({ employeeId: employeeId.toUpperCase() });
};

// Static method to find by hospital
receptionistSchema.statics.findByHospital = function(hospitalId: string) {
  return this.find({ hospital: hospitalId, isActive: true });
};

// Static method to find active receptionists
receptionistSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

export default mongoose.model<IReceptionist, IReceptionistModel>('Receptionist', receptionistSchema);


















