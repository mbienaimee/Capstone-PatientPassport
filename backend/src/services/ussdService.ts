import Patient from '@/models/Patient';
import PatientPassport from '@/models/PatientPassport';
import User from '@/models/User';
import { smsService } from './smsService';
import { CustomError } from '@/middleware/errorHandler';

/**
 * USSD Service for handling Patient Passport access via USSD
 * Implements Africa's Talking USSD protocol
 */

interface USSDSession {
  sessionId: string;
  phoneNumber: string;
  serviceCode: string;
  text: string;
  data?: {
    language?: 'en' | 'rw';
    method?: 'nationalId' | 'email';
    nationalId?: string;
    email?: string;
  };
}

class USSDService {
  /**
   * Process USSD request and return appropriate response
   */
  async processUSSDRequest(session: USSDSession): Promise<string> {
    try {
      const { text, phoneNumber, sessionId } = session;
      
      // Parse the user's navigation path
      const path = text ? text.split('*').filter(Boolean) : [];
      
      console.log(`📱 USSD Request - Session: ${sessionId}, Phone: ${phoneNumber}, Text: "${text}"`);
      console.log(`   Path: [${path.join(', ')}]`);
      
      // Level 0: Language selection
      if (path.length === 0) {
        return this.showLanguageMenu();
      }
      
      // Level 1: Access method selection
      if (path.length === 1) {
        const language = path[0] === '1' ? 'en' : 'rw';
        return this.showAccessMethodMenu(language);
      }
      
      // Level 2: Input prompt
      if (path.length === 2) {
        const language = path[0] === '1' ? 'en' : 'rw';
        const method = path[1] === '1' ? 'nationalId' : 'email';
        return this.showInputPrompt(language, method);
      }
      
      // Level 3: Process input and send passport
      if (path.length === 3) {
        const language = path[0] === '1' ? 'en' : 'rw';
        const method = path[1] === '1' ? 'nationalId' : 'email';
        const input = path[2];
        
        return await this.processPassportRequest(
          phoneNumber,
          language,
          method,
          input
        );
      }
      
      // Invalid navigation
      return this.showError(
        path[0] === '1' ? 'en' : 'rw',
        'Invalid selection. Please try again.'
      );
      
    } catch (error) {
      console.error('❌ USSD Error:', error);
      return 'END An error occurred. Please try again later.';
    }
  }
  
  /**
   * Show language selection menu
   */
  private showLanguageMenu(): string {
    return 'CON Choose a language / Hitamo ururimi\n' +
           '1. English\n' +
           '2. Kinyarwanda';
  }
  
  /**
   * Show access method menu
   */
  private showAccessMethodMenu(language: 'en' | 'rw'): string {
    if (language === 'en') {
      return 'CON View my Patient Passport\n' +
             '1. Use National ID\n' +
             '2. Use Email';
    } else {
      return 'CON Reba Passport yawe y\'ubuzima\n' +
             '1. Koresha Irangamuntu\n' +
             '2. Koresha Email';
    }
  }
  
  /**
   * Show input prompt
   */
  private showInputPrompt(language: 'en' | 'rw', method: 'nationalId' | 'email'): string {
    if (language === 'en') {
      if (method === 'nationalId') {
        return 'CON Enter your National ID (16 digits):';
      } else {
        return 'CON Enter your Email address:';
      }
    } else {
      if (method === 'nationalId') {
        return 'CON Shyiramo Irangamuntu (imibare 16):';
      } else {
        return 'CON Shyiramo Email yawe:';
      }
    }
  }
  
  /**
   * Process passport request and send via SMS
   */
  private async processPassportRequest(
    phoneNumber: string,
    language: 'en' | 'rw',
    method: 'nationalId' | 'email',
    input: string
  ): Promise<string> {
    try {
      // Validate input
      const validationResult = this.validateInput(method, input);
      if (!validationResult.valid) {
        return this.showError(language, validationResult.message!);
      }
      
      // Fetch patient data
      let patient;
      let user;
      
      if (method === 'nationalId') {
        patient = await Patient.findOne({ nationalId: input })
          .populate('user', 'name email phone')
          .lean();
          
        if (!patient) {
          return this.showError(
            language,
            language === 'en' 
              ? 'Patient not found with this National ID.' 
              : 'Ntiwabonye umurwayi ufite iri rangamuntu.'
          );
        }
        
        user = patient.user;
      } else {
        user = await User.findOne({ email: input }).lean();
        
        if (!user) {
          return this.showError(
            language,
            language === 'en' 
              ? 'User not found with this email.' 
              : 'Ntiwabonye umukoresha ufite iyi email.'
          );
        }
        
        patient = await Patient.findOne({ user: user._id })
          .populate('user', 'name email phone')
          .lean();
          
        if (!patient) {
          return this.showError(
            language,
            language === 'en' 
              ? 'Patient record not found.' 
              : 'Ntabwo haboneka inyandiko y\'umurwayi.'
          );
        }
      }
      
      // Get patient passport
      const passport = await PatientPassport.findByPatientId(patient._id);
      
      if (!passport) {
        return this.showError(
          language,
          language === 'en' 
            ? 'Patient passport not found.' 
            : 'Ntabwo haboneka passport y\'umurwayi.'
        );
      }
      
      // Format and send passport via SMS
      await this.sendPassportViaSMS(phoneNumber, passport, language);
      
      // Log access
      await passport.addAccessRecord(
        null, // No doctor involved
        'ussd_access',
        `USSD access via ${method} from ${phoneNumber}`,
        false
      );
      
      // Return success message
      if (language === 'en') {
        return 'END Your Patient Passport has been sent to your phone via SMS. Thank you!';
      } else {
        return 'END Passport yawe y\'ubuzima yoherejwe kuri telephone yawe binyuze kuri SMS. Murakoze!';
      }
      
    } catch (error) {
      console.error('❌ Error processing passport request:', error);
      return this.showError(
        language,
        language === 'en' 
          ? 'Unable to process your request. Please try again later.' 
          : 'Ntidushobora gutunganya icyifuzo cyawe. Ongera ugerageze nyuma.'
      );
    }
  }
  
  /**
   * Validate user input
   */
  private validateInput(method: 'nationalId' | 'email', input: string): { valid: boolean; message?: string } {
    if (method === 'nationalId') {
      // Rwanda National ID is 16 digits
      if (!/^\d{16}$/.test(input)) {
        return {
          valid: false,
          message: 'Invalid National ID. Must be 16 digits.'
        };
      }
    } else {
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
        return {
          valid: false,
          message: 'Invalid email format.'
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Send patient passport via SMS
   */
  private async sendPassportViaSMS(
    phoneNumber: string,
    passport: any,
    language: 'en' | 'rw'
  ): Promise<void> {
    try {
      // Format passport summary
      const summary = this.formatPassportSummary(passport, language);
      
      // Send via SMS service
      await smsService.sendSMS(phoneNumber, summary);
      
      // Also send detailed link
      const detailMessage = language === 'en'
        ? `For full details, visit: ${process.env.FRONTEND_URL}/patient-passport\nPassport ID: ${passport._id}`
        : `Kugira ngo ubone ibisobanuro byuzuye, sura: ${process.env.FRONTEND_URL}/patient-passport\nID ya Passport: ${passport._id}`;
        
      await smsService.sendSMS(phoneNumber, detailMessage);
      
      console.log(`✅ Passport SMS sent to ${phoneNumber}`);
      
    } catch (error) {
      console.error('❌ Error sending passport SMS:', error);
      throw new CustomError('Failed to send passport via SMS', 500);
    }
  }
  
  /**
   * Format passport summary for SMS
   */
  private formatPassportSummary(passport: any, language: 'en' | 'rw'): string {
    const { personalInfo, medicalInfo } = passport;
    
    if (language === 'en') {
      let message = `PATIENT PASSPORT\n`;
      message += `Name: ${personalInfo.fullName}\n`;
      message += `ID: ${personalInfo.nationalId}\n`;
      message += `DOB: ${new Date(personalInfo.dateOfBirth).toLocaleDateString()}\n`;
      message += `Blood: ${personalInfo.bloodType || 'N/A'}\n`;
      
      if (medicalInfo.allergies && medicalInfo.allergies.length > 0) {
        message += `Allergies: ${medicalInfo.allergies.join(', ')}\n`;
      }
      
      message += `Emergency: ${personalInfo.emergencyContact.name} (${personalInfo.emergencyContact.phone})`;
      
      return message;
    } else {
      let message = `PASSPORT Y'UBUZIMA\n`;
      message += `Amazina: ${personalInfo.fullName}\n`;
      message += `Irangamuntu: ${personalInfo.nationalId}\n`;
      message += `Itariki y'amavuko: ${new Date(personalInfo.dateOfBirth).toLocaleDateString()}\n`;
      message += `Ubwoko bw'amaraso: ${personalInfo.bloodType || 'Nta na kimwe'}\n`;
      
      if (medicalInfo.allergies && medicalInfo.allergies.length > 0) {
        message += `Imiti itemewe: ${medicalInfo.allergies.join(', ')}\n`;
      }
      
      message += `Uhamagarwa mu byihutirwa: ${personalInfo.emergencyContact.name} (${personalInfo.emergencyContact.phone})`;
      
      return message;
    }
  }
  
  /**
   * Show error message
   */
  private showError(language: 'en' | 'rw', message: string): string {
    if (language === 'en') {
      return `END Error: ${message}`;
    } else {
      return `END Ikosa: ${message}`;
    }
  }
}

export const ussdService = new USSDService();
