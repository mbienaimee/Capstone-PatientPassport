import AccessRequest, { IAccessRequest } from '@/models/AccessRequest';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Hospital from '@/models/Hospital';
import Patient from '@/models/Patient';
import { CustomError } from '@/middleware/errorHandler';
import { sendNotificationEmail } from './simpleEmailService';

export interface PatientPassportAccessRequest {
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

class PatientPassportAccessService {
  // Create access request for Patient Passport
  async createAccessRequest(data: PatientPassportAccessRequest): Promise<IAccessRequest> {
    try {
      // Validate that patient and doctor exist
      const [patient, doctor, hospital] = await Promise.all([
        Patient.findById(data.patientId).populate('user'),
        User.findById(data.doctorId),
        Hospital.findById(data.hospitalId)
      ]);

      if (!patient) {
        throw new CustomError('Patient not found in Patient Passport system', 404);
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
            title: '🔐 Updated Access Request - Patient Passport',
            message: `Dr. ${doctor.name} from ${hospital.name} has updated their access request to your Patient Passport medical records.`,
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
          userId: patient.user._id.toString(),
          type: 'access_request',
          title: '🔐 New Access Request - Patient Passport',
          message: `Dr. ${doctor.name} from ${hospital.name} is requesting access to your Patient Passport medical records.`,
          data: {
            requestId: accessRequest._id,
            doctorName: doctor.name,
            hospitalName: hospital.name,
            requestType: data.requestType,
            reason: data.reason,
            patientPassportId: patient._id
          },
          priority: data.requestType === 'emergency' ? 'urgent' : 'high'
        });
      }

      // Send email notification to patient
      await this.sendPatientPassportAccessRequestEmail(patient, doctor, hospital, accessRequest);

      return accessRequest;
    } catch (error) {
      console.error('Error creating Patient Passport access request:', error);
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
        title: `Patient Passport Access ${response.status === 'approved' ? 'Approved' : 'Denied'}`,
        message: `Your access request for Patient Passport records has been ${response.status}.`,
        data: {
          requestId: request._id,
          patientId: request.patientId,
          status: response.status,
          reason: response.reason
        },
        priority: 'medium'
      });

      // Send email notification to doctor
      await this.sendPatientPassportAccessResponseEmail(doctor, hospital, request, response);

      return request;
    } catch (error) {
      console.error('Error responding to Patient Passport access request:', error);
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

  // Send Patient Passport access request email to patient
  private async sendPatientPassportAccessRequestEmail(patient: any, doctor: any, hospital: any, request: IAccessRequest): Promise<void> {
    const dataTypeLabels: { [key: string]: string } = {
      'medical_history': 'Medical History',
      'medications': 'Current Medications',
      'allergies': 'Allergies & Reactions',
      'lab_results': 'Lab Results',
      'imaging': 'Imaging Reports',
      'emergency_contacts': 'Emergency Contacts',
      'insurance': 'Insurance Information'
    };

    const requestedDataLabels = request.requestedData.map(type => dataTypeLabels[type] || type).join(', ');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏥 Patient Passport</h1>
          <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">Your Digital Medical Records</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">🔐 Access Request to Your Patient Passport</h2>
          <p>Dear ${patient.user.name},</p>
          <p><strong>Dr. ${doctor.name}</strong> from <strong>${hospital.name}</strong> is requesting access to your Patient Passport medical records.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #059669; margin-top: 0;">📋 Request Details:</h3>
            <p><strong>🔍 Access Type:</strong> ${request.requestType === 'view' ? 'View Only' : request.requestType === 'edit' ? 'Edit Access' : 'Emergency Access'}</p>
            <p><strong>📝 Reason:</strong> ${request.reason}</p>
            <p><strong>📊 Requested Data:</strong> ${requestedDataLabels}</p>
            <p><strong>⏰ Expires:</strong> ${request.expiresAt.toLocaleString()}</p>
            <p><strong>🆔 Patient Passport ID:</strong> ${patient._id}</p>
            ${request.requestType === 'emergency' ? '<p style="color: #dc2626; font-weight: bold;">🚨 EMERGENCY ACCESS - This request will be automatically approved</p>' : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/patient/access-requests" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px; font-weight: bold;">
              📱 Review Request Now
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⏰ Important:</strong> This request will expire in ${request.requestType === 'emergency' ? '2 hours' : '24 hours'}. 
              Please respond as soon as possible to ensure your healthcare provider can access your Patient Passport records when needed.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated message from your Patient Passport system. 
            If you didn't expect this request, please contact support immediately.
          </p>
        </div>
      </div>
    `;

    await sendNotificationEmail(patient.user.email, '🔐 Access Request - Patient Passport', emailContent);
  }

  // Send Patient Passport access response email to doctor
  private async sendPatientPassportAccessResponseEmail(doctor: any, hospital: any, request: IAccessRequest, response: AccessResponse): Promise<void> {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏥 Patient Passport</h1>
          <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">Digital Medical Records System</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151; margin-bottom: 20px;">Patient Passport Access ${response.status === 'approved' ? 'Approved' : 'Denied'}</h2>
          <p>Dear Dr. ${doctor.name},</p>
          <p>Your access request for Patient Passport records has been <strong>${response.status}</strong>.</p>
          
          ${response.reason ? `<div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${response.status === 'approved' ? '#10b981' : '#dc2626'};">
            <p style="margin: 0;"><strong>Patient Response:</strong> ${response.reason}</p>
          </div>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/doctor/access-requests" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              📊 View Request Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated message from the Patient Passport system.
          </p>
        </div>
      </div>
    `;

    await sendNotificationEmail(doctor.email, `Patient Passport Access ${response.status === 'approved' ? 'Approved' : 'Denied'}`, emailContent);
  }

  // Get access request by doctor and patient
  async getAccessRequestByDoctorAndPatient(doctorId: string, patientId: string): Promise<IAccessRequest | null> {
    return await AccessRequest.findOne({
      doctorId,
      patientId,
      status: 'approved'
    }).sort({ approvedAt: -1 });
  }
}

export default new PatientPassportAccessService();

