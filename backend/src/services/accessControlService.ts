import AccessRequest, { IAccessRequest } from '@/models/AccessRequest';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Hospital from '@/models/Hospital';
import { CustomError } from '@/middleware/errorHandler';
import { sendNotificationEmail } from './simpleEmailService';

export interface AccessRequestData {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  requestType: 'view' | 'edit' | 'emergency';
  reason: string;
  requestedData: string[];
  expiresInHours?: number;
}

export interface AccessResponse {
  requestId: string;
  status: 'approved' | 'denied';
  reason?: string;
}

class AccessControlService {
  // Create a new access request
  async createAccessRequest(data: AccessRequestData): Promise<IAccessRequest> {
    try {
      // Validate that patient and doctor exist
      const [patient, doctor, hospital] = await Promise.all([
        User.findById(data.patientId),
        User.findById(data.doctorId),
        Hospital.findById(data.hospitalId)
      ]);

      if (!patient) {
        throw new CustomError('Patient not found', 404);
      }
      if (!doctor) {
        throw new CustomError('Doctor not found', 404);
      }
      if (!hospital) {
        throw new CustomError('Hospital not found', 404);
      }

      // Check if there's already a pending request for this doctor-patient combination
      const existingRequest = await AccessRequest.findOne({
        patientId: data.patientId,
        doctorId: data.doctorId,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      let accessRequest: IAccessRequest;

      if (existingRequest) {
        // Update existing pending request instead of creating a new one
        console.log('Updating existing pending request:', existingRequest._id);
        
        existingRequest.requestType = data.requestType;
        existingRequest.reason = data.reason;
        existingRequest.requestedData = data.requestedData;
        existingRequest.expiresAt = new Date(Date.now() + (data.expiresInHours || 24) * 60 * 60 * 1000);
        existingRequest.updatedAt = new Date();
        
        accessRequest = await existingRequest.save();
        
        // Update the notification
        await Notification.findOneAndUpdate(
          { 'data.requestId': existingRequest._id },
          {
            title: 'Updated Access Request',
            message: `Dr. ${doctor.name} from ${hospital.name} has updated their access request to your medical records.`,
            'data.requestType': data.requestType,
            'data.reason': data.reason,
            updatedAt: new Date()
          }
        );
      } else {
        // Create new access request
        accessRequest = new AccessRequest({
          ...data,
          expiresAt: new Date(Date.now() + (data.expiresInHours || 24) * 60 * 60 * 1000)
        });

        await accessRequest.save();

        // Create notification for patient
        await this.createNotification({
          userId: data.patientId,
          type: 'access_request',
          title: 'New Access Request',
          message: `Dr. ${doctor.name} from ${hospital.name} is requesting access to your medical records.`,
          data: {
            requestId: accessRequest._id,
            doctorName: doctor.name,
            hospitalName: hospital.name,
            requestType: data.requestType,
            reason: data.reason
          },
          priority: data.requestType === 'emergency' ? 'urgent' : 'high'
        });
      }

      // Send email notification to patient
      await this.sendAccessRequestEmail(patient, doctor, hospital, accessRequest);

      return accessRequest;
    } catch (error) {
      console.error('Error creating access request:', error);
      throw error;
    }
  }

  // Get pending requests for a patient
  async getPendingRequests(patientId: string): Promise<IAccessRequest[]> {
    return AccessRequest.findPendingRequests(patientId);
  }

  // Get requests by doctor
  async getRequestsByDoctor(doctorId: string): Promise<IAccessRequest[]> {
    return AccessRequest.findByDoctor(doctorId);
  }

  // Patient responds to access request
  async respondToRequest(requestId: string, patientId: string, response: AccessResponse): Promise<IAccessRequest> {
    try {
      const request = await AccessRequest.findOne({
        _id: requestId,
        patientId,
        status: 'pending'
      });

      if (!request) {
        throw new CustomError('Access request not found or already processed', 404);
      }

      if (request.isExpired()) {
        throw new CustomError('Access request has expired', 400);
      }

      // Update the request based on patient response
      if (response.status === 'approved') {
        await request.approve(response.reason);
      } else {
        await request.deny(response.reason);
      }

      // Create notification for doctor
      const doctor = await User.findById(request.doctorId);
      const hospital = await Hospital.findById(request.hospitalId);
      
      await this.createNotification({
        userId: request.doctorId,
        type: response.status === 'approved' ? 'access_approved' : 'access_denied',
        title: `Access Request ${response.status === 'approved' ? 'Approved' : 'Denied'}`,
        message: `Your access request for ${request.patientId} has been ${response.status}.`,
        data: {
          requestId: request._id,
          patientId: request.patientId,
          status: response.status,
          reason: response.reason
        },
        priority: 'medium'
      });

      // Send email notification to doctor
      await this.sendAccessResponseEmail(doctor, hospital, request, response);

      return request;
    } catch (error) {
      console.error('Error responding to access request:', error);
      throw error;
    }
  }

  // Get access request by ID
  async getAccessRequest(requestId: string, userId: string): Promise<IAccessRequest> {
    const request = await AccessRequest.findOne({
      _id: requestId,
      $or: [{ patientId: userId }, { doctorId: userId }]
    }).populate('patientId', 'name email').populate('doctorId', 'name email').populate('hospitalId', 'name address');

    if (!request) {
      throw new CustomError('Access request not found', 404);
    }

    return request;
  }

  // Create notification
  private async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: string;
  }): Promise<void> {
    const notification = new Notification({
      ...data,
      expiresAt: data.priority === 'urgent' ? new Date(Date.now() + 2 * 60 * 60 * 1000) : undefined // 2 hours for urgent
    });

    await notification.save();
  }

  // Send access request email to patient
  private async sendAccessRequestEmail(patient: any, doctor: any, hospital: any, request: IAccessRequest): Promise<void> {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Patient Passport</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Access Request</h2>
          <p>Dear ${patient.name},</p>
          <p><strong>Dr. ${doctor.name}</strong> from <strong>${hospital.name}</strong> is requesting access to your medical records.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">Request Details:</h3>
            <p><strong>Type:</strong> ${request.requestType}</p>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Requested Data:</strong> ${request.requestedData.join(', ')}</p>
            <p><strong>Expires:</strong> ${request.expiresAt.toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/patient/access-requests" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">
              Review Request
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This request will expire in 24 hours. Please respond as soon as possible.
          </p>
        </div>
      </div>
    `;

    await sendNotificationEmail(patient.email, 'Access Request - Patient Passport', emailContent);
  }

  // Send access response email to doctor
  private async sendAccessResponseEmail(doctor: any, hospital: any, request: IAccessRequest, response: AccessResponse): Promise<void> {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Patient Passport</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Access Request ${response.status === 'approved' ? 'Approved' : 'Denied'}</h2>
          <p>Dear Dr. ${doctor.name},</p>
          <p>Your access request for patient records has been <strong>${response.status}</strong>.</p>
          
          ${response.reason ? `<p><strong>Reason:</strong> ${response.reason}</p>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/doctor/access-requests" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Request
            </a>
          </div>
        </div>
      </div>
    `;

    await sendNotificationEmail(doctor.email, `Access Request ${response.status === 'approved' ? 'Approved' : 'Denied'} - Patient Passport`, emailContent);
  }
}

export default new AccessControlService();



