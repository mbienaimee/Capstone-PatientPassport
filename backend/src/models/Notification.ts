import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  userId: string;
  type: 'access_request' | 'access_approved' | 'access_denied' | 'emergency_access';
  title: string;
  message: string;
  data?: any; // Additional data for the notification
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  markAsRead(): Promise<INotification>;
}

export interface INotificationModel extends Model<INotification> {
  findUnreadByUser(userId: string): Promise<INotification[]>;
  markAsRead(notificationId: string, userId: string): Promise<INotification | null>;
}

const NotificationSchema = new Schema<INotification>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['access_request', 'access_approved', 'access_denied', 'emergency_access'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    type: Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, priority: 1 });

// Static methods
NotificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({
    userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

NotificationSchema.statics.markAsRead = function(notificationId: string, userId: string) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

// Instance methods
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

export default mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);
