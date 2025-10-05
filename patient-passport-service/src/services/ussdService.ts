import { logger } from './logger';
import ConsentToken from '../models/ConsentToken';
import PatientPassport from '../models/PatientPassport';
import { FederatedService } from './federatedService';

export class USSDService {
  private static readonly SESSION_TIMEOUT = 300000; // 5 minutes
  private static sessions: Map<string, any> = new Map();

  /**
   * Process USSD request
   */
  static async processUSSDRequest(
    phoneNumber: string,
    sessionId: string,
    text: string,
    serviceCode: string
  ): Promise<string> {
    try {
      // Clean phone number
      const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
      
      // Get or create session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          phoneNumber: cleanPhoneNumber,
          step: 'welcome',
          data: {},
          createdAt: new Date()
        };
        this.sessions.set(sessionId, session);
      }

      // Check session timeout
      if (Date.now() - session.createdAt.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        return this.getWelcomeMessage();
      }

      // Process based on current step
      let response = '';
      switch (session.step) {
        case 'welcome':
          response = await this.handleWelcomeStep(session, text);
          break;
        case 'main_menu':
          response = await this.handleMainMenuStep(session, text);
          break;
        case 'generate_token':
          response = await this.handleGenerateTokenStep(session, text);
          break;
        case 'view_audit':
          response = await this.handleViewAuditStep(session, text);
          break;
        case 'manage_proxies':
          response = await this.handleManageProxiesStep(session, text);
          break;
        default:
          response = this.getWelcomeMessage();
          session.step = 'welcome';
      }

      // Update session
      this.sessions.set(sessionId, session);

      return response;
    } catch (error) {
      logger.error('Error processing USSD request:', error);
      return 'CON Sorry, an error occurred. Please try again later.';
    }
  }

  /**
   * Handle welcome step
   */
  private static async handleWelcomeStep(session: any, text: string): Promise<string> {
    if (text === '') {
      return this.getWelcomeMessage();
    }

    // Check if user exists
    const patientPassport = await PatientPassport.findOne({
      phoneNumber: session.phoneNumber,
      isActive: true
    });

    if (!patientPassport) {
      return 'CON Patient not found. Please contact your hospital to register for Patient Passport service.';
    }

    session.patientPassport = patientPassport;
    session.step = 'main_menu';
    return this.getMainMenuMessage();
  }

  /**
   * Handle main menu step
   */
  private static async handleMainMenuStep(session: any, text: string): Promise<string> {
    switch (text) {
      case '1':
        session.step = 'generate_token';
        return this.getGenerateTokenMessage();
      case '2':
        session.step = 'view_audit';
        return this.getViewAuditMessage();
      case '3':
        session.step = 'manage_proxies';
        return this.getManageProxiesMessage();
      case '0':
        return 'END Thank you for using Patient Passport service.';
      default:
        return 'CON Invalid option. Please try again.\n\n' + this.getMainMenuMessage();
    }
  }

  /**
   * Handle generate token step
   */
  private static async handleGenerateTokenStep(session: any, text: string): Promise<string> {
    if (text === '') {
      return this.getGenerateTokenMessage();
    }

    if (text === '0') {
      session.step = 'main_menu';
      return this.getMainMenuMessage();
    }

    // Parse duration (in minutes)
    const duration = parseInt(text);
    if (isNaN(duration) || duration < 5 || duration > 1440) {
      return 'CON Invalid duration. Please enter a number between 5 and 1440 minutes.\n\n' + this.getGenerateTokenMessage();
    }

    try {
      // Generate consent token
      const consentToken = new ConsentToken({
        universalId: session.patientPassport.universalId,
        expiresAt: new Date(Date.now() + duration * 60 * 1000),
        createdBy: session.phoneNumber,
        purpose: 'USSD Generated Token',
        permissions: ['view']
      });

      await consentToken.save();

      // Add to patient passport
      session.patientPassport.consentTokens.push(consentToken._id);
      await session.patientPassport.save();

      this.sessions.delete(session.sessionId);
      
      return `END Token generated successfully!\n\nToken: ${consentToken.token}\nExpires: ${consentToken.expiresAt.toLocaleString()}\n\nShare this token with your healthcare provider.`;
    } catch (error) {
      logger.error('Error generating token:', error);
      return 'CON Error generating token. Please try again.\n\n' + this.getGenerateTokenMessage();
    }
  }

  /**
   * Handle view audit step
   */
  private static async handleViewAuditStep(session: any, text: string): Promise<string> {
    if (text === '') {
      return this.getViewAuditMessage();
    }

    if (text === '0') {
      session.step = 'main_menu';
      return this.getMainMenuMessage();
    }

    try {
      // Get recent audit logs (this would integrate with the main backend)
      const auditLogs = await this.getRecentAuditLogs(session.patientPassport.universalId);
      
      if (auditLogs.length === 0) {
        return 'CON No recent access records found.\n\n' + this.getViewAuditMessage();
      }

      let response = 'CON Recent Access Records:\n\n';
      auditLogs.slice(0, 5).forEach((log: any, index: number) => {
        response += `${index + 1}. ${log.action} - ${log.accessType}\n`;
        response += `   ${log.accessTime.toLocaleDateString()}\n\n`;
      });

      response += '0. Back to Main Menu\n\n' + this.getViewAuditMessage();
      return response;
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      return 'CON Error retrieving audit logs. Please try again.\n\n' + this.getViewAuditMessage();
    }
  }

  /**
   * Handle manage proxies step
   */
  private static async handleManageProxiesStep(session: any, text: string): Promise<string> {
    if (text === '') {
      return this.getManageProxiesMessage();
    }

    if (text === '0') {
      session.step = 'main_menu';
      return this.getMainMenuMessage();
    }

    // This would implement proxy management logic
    return 'CON Proxy management feature coming soon.\n\n' + this.getManageProxiesMessage();
  }

  /**
   * Get welcome message
   */
  private static getWelcomeMessage(): string {
    return `CON Welcome to Patient Passport Service

Please enter your phone number to continue:
(Format: +1234567890)`;
  }

  /**
   * Get main menu message
   */
  private static getMainMenuMessage(): string {
    return `CON Patient Passport Menu

1. Generate Access Token
2. View Access History
3. Manage Proxies
0. Exit

Please select an option:`;
  }

  /**
   * Get generate token message
   */
  private static getGenerateTokenMessage(): string {
    return `CON Generate Access Token

Enter duration in minutes (5-1440):
(0 to go back)`;
  }

  /**
   * Get view audit message
   */
  private static getViewAuditMessage(): string {
    return `CON View Access History

Enter any key to view recent access records:
(0 to go back)`;
  }

  /**
   * Get manage proxies message
   */
  private static getManageProxiesMessage(): string {
    return `CON Manage Proxies

This feature allows you to authorize family members to access your medical records.

Enter any key to continue:
(0 to go back)`;
  }

  /**
   * Clean phone number
   */
  private static cleanPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add + if not present and number doesn't start with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Get recent audit logs (placeholder - would integrate with main backend)
   */
  private static async getRecentAuditLogs(universalId: string): Promise<any[]> {
    // This would make an API call to the main backend to get audit logs
    // For now, return empty array
    return [];
  }

  /**
   * Clean up expired sessions
   */
  static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

