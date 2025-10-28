import Patient from '@/models/Patient';
import PatientPassport from '@/models/PatientPassport';
import User from '@/models/User';
import { smsService } from './smsService';

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
    patientId?: string;
    passportId?: string;
  };
}

// In-memory session storage (in production, use Redis or database)
const sessionData: Map<string, any> = new Map();

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
      
      const language = path[0] === '1' ? 'en' : 'rw';
      
      // Level 1: Access method selection
      if (path.length === 1) {
        return this.showAccessMethodMenu(language);
      }
      
      // Level 2: Input prompt
      if (path.length === 2) {
        const method = path[1] === '1' ? 'nationalId' : 'email';
        return this.showInputPrompt(language, method);
      }
      
      // Level 3: Verify identity and show main menu
      if (path.length === 3) {
        const method = path[1] === '1' ? 'nationalId' : 'email';
        const input = path[2];
        
        // Get passport and store in session
        const passport = await this.getPassportByIdentifier(method, input, language);
        
        if (typeof passport === 'string') {
          return passport; // Error message
        }
        
        // Store passport in session
        sessionData.set(sessionId, { passport, language });
        
        return this.showMainMenu(language, passport);
      }
      
      // Level 4+: Handle menu selections
      if (path.length >= 4) {
        const storedSession = sessionData.get(sessionId);
        
        if (!storedSession) {
          return this.showError(language, 
            language === 'en' 
              ? 'Session expired. Please start again.' 
              : 'Igihe cyarangiye. Tangira ukundi.');
        }
        
        const menuChoice = path[3];
        const { passport } = storedSession;
        
        return await this.handleMenuSelection(menuChoice, passport, language, path, sessionId);
      }
      
      // Invalid navigation
      return this.showError(language, 'Invalid selection. Please try again.');
      
    } catch (error: any) {
      console.error('❌ USSD Top-Level Error:', error);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Error message:', error?.message);
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
        return 'CON Enter your National ID:';
      } else {
        return 'CON Enter your Email address:';
      }
    } else {
      if (method === 'nationalId') {
        return 'CON Shyiramo Irangamuntu ryawe:';
      } else {
        return 'CON Shyiramo Email yawe:';
      }
    }
  }
  
  /**
   * Get passport by identifier (National ID or Email)
   */
  private async getPassportByIdentifier(
    method: 'nationalId' | 'email',
    input: string,
    language: 'en' | 'rw'
  ): Promise<any> {
    try {
      // Validate input
      const validationResult = this.validateInput(method, input);
      if (!validationResult.valid) {
        return this.showError(language, validationResult.message!);
      }
      
      // Clean and normalize input
      const cleanedInput = method === 'nationalId' 
        ? input.replace(/\D/g, '') 
        : input.trim().toLowerCase();
      
      console.log(`🔍 Searching for patient using ${method}: ${cleanedInput}`);
      
      let patient;
      
      if (method === 'nationalId') {
        patient = await Patient.findOne({ nationalId: cleanedInput })
          .populate('user', 'name email phone')
          .lean();
          
        console.log(`📋 Patient found by National ID:`, patient ? 'Yes' : 'No');
          
        if (!patient) {
          return this.showError(language,
            language === 'en' 
              ? 'Patient not found. Please check and try again.' 
              : 'Ntiwabonye umurwayi. Suzuma hanyuma ugerageze.');
        }
      } else {
        const emailRegex = new RegExp(`^${cleanedInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const user = await User.findOne({ email: emailRegex }).lean();
        
        console.log(`📧 User found by email:`, user ? 'Yes' : 'No');
        
        if (!user) {
          return this.showError(language,
            language === 'en' 
              ? 'User not found. Please check and try again.' 
              : 'Ntiwabonye umukoresha. Suzuma hanyuma ugerageze.');
        }
        
        patient = await Patient.findOne({ user: user._id })
          .populate('user', 'name email phone')
          .lean();
          
        if (!patient) {
          return this.showError(language,
            language === 'en' 
              ? 'Patient record not found.' 
              : 'Ntabwo haboneka inyandiko y\'umurwayi.');
        }
      }
      
      console.log(`🔍 Searching for passport for patient ID: ${patient._id}`);
      
      const passport = await PatientPassport.findByPatientId(patient._id);
      
      console.log(`📄 Passport found:`, passport ? 'Yes' : 'No');
      
      if (!passport) {
        return this.showError(language,
          language === 'en' 
            ? 'Passport not found. Contact your healthcare provider.' 
            : 'Ntabwo haboneka passport. Vugana n\'inzego z\'ubuzima.');
      }
      
      return passport;
      
    } catch (error: any) {
      console.error('❌ Error getting passport:', error);
      return this.showError(language,
        language === 'en' 
          ? 'Unable to process your request.' 
          : 'Ntidushobora gutunganya icyifuzo cyawe.');
    }
  }
  
  /**
   * Show main menu after successful authentication
   */
  private showMainMenu(language: 'en' | 'rw', passport: any): string {
    const name = passport.personalInfo?.fullName || 'Patient';
    
    if (language === 'en') {
      return `CON Welcome ${name}!\n` +
             'Select an option:\n' +
             '1. View Summary\n' +
             '2. Medical History\n' +
             '3. Current Medications\n' +
             '4. Hospital Visits\n' +
             '5. Test Results\n' +
             '0. Send Full Passport via SMS';
    } else {
      return `CON Murakaza neza ${name}!\n` +
             'Hitamo:\n' +
             '1. Reba Incamake\n' +
             '2. Amateka y\'ubuzima\n' +
             '3. Imiti ukoresha\n' +
             '4. Ibitaro wasuriye\n' +
             '5. Ibisubizo by\'ibizamini\n' +
             '0. Ohereza Passport yose kuri SMS';
    }
  }
  
  /**
   * Handle menu selection
   */
  private async handleMenuSelection(
    choice: string,
    passport: any,
    language: 'en' | 'rw',
    path: string[],
    sessionId: string
  ): Promise<string> {
    switch (choice) {
      case '1':
        return this.showSummary(passport, language);
      
      case '2':
        return this.showMedicalHistory(passport, language, path);
      
      case '3':
        return this.showCurrentMedications(passport, language, path);
      
      case '4':
        return this.showHospitalVisits(passport, language, path);
      
      case '5':
        return this.showTestResults(passport, language, path);
      
      case '0':
        // Send full passport via SMS
        return await this.sendPassportAndConfirm(passport, language, sessionId);
      
      default:
        return this.showError(language,
          language === 'en' 
            ? 'Invalid option. Please try again.' 
            : 'Ihitamo ridakwiye. Ongera ugerageze.');
    }
  }
  
  /**
   * Show passport summary
   */
  private showSummary(passport: any, language: 'en' | 'rw'): string {
    const { personalInfo, medicalInfo } = passport;
    
    if (language === 'en') {
      let msg = `END PATIENT SUMMARY\n`;
      msg += `Name: ${personalInfo?.fullName || 'N/A'}\n`;
      msg += `ID: ${personalInfo?.nationalId || 'N/A'}\n`;
      msg += `Blood: ${personalInfo?.bloodType || 'N/A'}\n`;
      msg += `DOB: ${personalInfo?.dateOfBirth ? new Date(personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}\n`;
      
      if (medicalInfo?.allergies && medicalInfo.allergies.length > 0) {
        msg += `\nAllergies: ${medicalInfo.allergies.slice(0, 2).join(', ')}`;
        if (medicalInfo.allergies.length > 2) {
          msg += ` +${medicalInfo.allergies.length - 2} more`;
        }
      }
      
      return msg;
    } else {
      let msg = `END INCAMAKE Y'UMURWAYI\n`;
      msg += `Amazina: ${personalInfo?.fullName || 'Nta na kimwe'}\n`;
      msg += `Irangamuntu: ${personalInfo?.nationalId || 'Nta na kimwe'}\n`;
      msg += `Amaraso: ${personalInfo?.bloodType || 'Nta na kimwe'}\n`;
      msg += `Amavuko: ${personalInfo?.dateOfBirth ? new Date(personalInfo.dateOfBirth).toLocaleDateString() : 'Nta na kimwe'}\n`;
      
      if (medicalInfo?.allergies && medicalInfo.allergies.length > 0) {
        msg += `\nImiti itemewe: ${medicalInfo.allergies.slice(0, 2).join(', ')}`;
        if (medicalInfo.allergies.length > 2) {
          msg += ` +${medicalInfo.allergies.length - 2} andi`;
        }
      }
      
      return msg;
    }
  }
  
  /**
   * Show medical history (conditions)
   */
  private showMedicalHistory(passport: any, language: 'en' | 'rw', path: string[]): string {
    const conditions = passport.medicalInfo?.medicalConditions || [];
    
    // If viewing a specific condition
    if (path.length === 5 && path[4]) {
      const index = parseInt(path[4]) - 1;
      if (index >= 0 && index < conditions.length) {
        return this.showConditionDetails(conditions[index], language);
      }
    }
    
    // Show list of conditions
    if (conditions.length === 0) {
      return language === 'en' 
        ? 'END No medical conditions recorded.'
        : 'END Nta ndwara zanditswe.';
    }
    
    if (language === 'en') {
      let msg = `CON MEDICAL CONDITIONS (${conditions.length})\n`;
      conditions.slice(0, 5).forEach((cond: any, i: number) => {
        const status = cond.status || 'active';
        msg += `${i + 1}. ${cond.condition || 'Unknown'} [${status}]\n`;
      });
      
      if (conditions.length > 5) {
        msg += `\nShowing 5 of ${conditions.length}`;
      }
      msg += '\n0. Back to Main Menu';
      
      return msg;
    } else {
      let msg = `CON INDWARA (${conditions.length})\n`;
      conditions.slice(0, 5).forEach((cond: any, i: number) => {
        const status = cond.status || 'active';
        msg += `${i + 1}. ${cond.condition || 'Ntizwi'} [${status}]\n`;
      });
      
      if (conditions.length > 5) {
        msg += `\nBigaragaza 5 muri ${conditions.length}`;
      }
      msg += '\n0. Subira ku menu y\'ibanze';
      
      return msg;
    }
  }
  
  /**
   * Show specific condition details
   */
  private showConditionDetails(condition: any, language: 'en' | 'rw'): string {
    if (language === 'en') {
      let msg = `END CONDITION DETAILS\n`;
      msg += `Name: ${condition.condition || 'N/A'}\n`;
      msg += `Status: ${condition.status || 'N/A'}\n`;
      msg += `Diagnosed: ${condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString() : 'N/A'}\n`;
      msg += `By: ${condition.diagnosedBy || 'N/A'}`;
      
      if (condition.notes) {
        msg += `\nNotes: ${condition.notes.substring(0, 50)}`;
      }
      
      return msg;
    } else {
      let msg = `END IBISOBANURO BY'INDWARA\n`;
      msg += `Izina: ${condition.condition || 'Nta na kimwe'}\n`;
      msg += `Imiterere: ${condition.status || 'Nta na kimwe'}\n`;
      msg += `Yasuzumwe: ${condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString() : 'Nta na kimwe'}\n`;
      msg += `Na: ${condition.diagnosedBy || 'Nta na kimwe'}`;
      
      if (condition.notes) {
        msg += `\nIbisobanuro: ${condition.notes.substring(0, 50)}`;
      }
      
      return msg;
    }
  }
  
  /**
   * Show current medications
   */
  private showCurrentMedications(passport: any, language: 'en' | 'rw', path: string[]): string {
    const medications = passport.medicalInfo?.currentMedications || [];
    
    // If viewing a specific medication
    if (path.length === 5 && path[4]) {
      const index = parseInt(path[4]) - 1;
      if (index >= 0 && index < medications.length) {
        return this.showMedicationDetails(medications[index], language);
      }
    }
    
    // Show list of medications
    if (medications.length === 0) {
      return language === 'en' 
        ? 'END No current medications.'
        : 'END Nta miti ukoresha.';
    }
    
    if (language === 'en') {
      let msg = `CON CURRENT MEDICATIONS (${medications.length})\n`;
      medications.slice(0, 5).forEach((med: any, i: number) => {
        msg += `${i + 1}. ${med.name || 'Unknown'}\n`;
        msg += `   ${med.dosage || ''} ${med.frequency || ''}\n`;
      });
      
      if (medications.length > 5) {
        msg += `\nShowing 5 of ${medications.length}`;
      }
      msg += '\n0. Back to Main Menu';
      
      return msg;
    } else {
      let msg = `CON IMITI UKORESHA (${medications.length})\n`;
      medications.slice(0, 5).forEach((med: any, i: number) => {
        msg += `${i + 1}. ${med.name || 'Ntizwi'}\n`;
        msg += `   ${med.dosage || ''} ${med.frequency || ''}\n`;
      });
      
      if (medications.length > 5) {
        msg += `\nBigaragaza 5 muri ${medications.length}`;
      }
      msg += '\n0. Subira ku menu y\'ibanze';
      
      return msg;
    }
  }
  
  /**
   * Show medication details
   */
  private showMedicationDetails(medication: any, language: 'en' | 'rw'): string {
    if (language === 'en') {
      let msg = `END MEDICATION DETAILS\n`;
      msg += `Name: ${medication.name || 'N/A'}\n`;
      msg += `Dosage: ${medication.dosage || 'N/A'}\n`;
      msg += `Frequency: ${medication.frequency || 'N/A'}\n`;
      msg += `Prescribed by: ${medication.prescribedBy || 'N/A'}\n`;
      msg += `Start date: ${medication.startDate ? new Date(medication.startDate).toLocaleDateString() : 'N/A'}`;
      
      return msg;
    } else {
      let msg = `END IBISOBANURO BY'UMUTI\n`;
      msg += `Izina: ${medication.name || 'Nta na kimwe'}\n`;
      msg += `Ingano: ${medication.dosage || 'Nta na kimwe'}\n`;
      msg += `Inshuro: ${medication.frequency || 'Nta na kimwe'}\n`;
      msg += `Watanze: ${medication.prescribedBy || 'Nta na kimwe'}\n`;
      msg += `Watangiye: ${medication.startDate ? new Date(medication.startDate).toLocaleDateString() : 'Nta na kimwe'}`;
      
      return msg;
    }
  }
  
  /**
   * Show hospital visits
   */
  private showHospitalVisits(passport: any, language: 'en' | 'rw', path: string[]): string {
    const visits = passport.hospitalVisits || [];
    
    // If viewing a specific visit
    if (path.length === 5 && path[4]) {
      const index = parseInt(path[4]) - 1;
      if (index >= 0 && index < visits.length) {
        return this.showVisitDetails(visits[index], language);
      }
    }
    
    // Show list of visits
    if (visits.length === 0) {
      return language === 'en' 
        ? 'END No hospital visits recorded.'
        : 'END Nta bitaro wasuriye byanditswe.';
    }
    
    if (language === 'en') {
      let msg = `CON HOSPITAL VISITS (${visits.length})\n`;
      visits.slice(0, 5).forEach((visit: any, i: number) => {
        const date = visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'N/A';
        msg += `${i + 1}. ${visit.hospital || 'Unknown'} - ${date}\n`;
      });
      
      if (visits.length > 5) {
        msg += `\nShowing 5 of ${visits.length}`;
      }
      msg += '\n0. Back to Main Menu';
      
      return msg;
    } else {
      let msg = `CON IBITARO WASURIYE (${visits.length})\n`;
      visits.slice(0, 5).forEach((visit: any, i: number) => {
        const date = visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'Nta na kimwe';
        msg += `${i + 1}. ${visit.hospital || 'Kitazwi'} - ${date}\n`;
      });
      
      if (visits.length > 5) {
        msg += `\nBigaragaza 5 muri ${visits.length}`;
      }
      msg += '\n0. Subira ku menu y\'ibanze';
      
      return msg;
    }
  }
  
  /**
   * Show visit details
   */
  private showVisitDetails(visit: any, language: 'en' | 'rw'): string {
    if (language === 'en') {
      let msg = `END VISIT DETAILS\n`;
      msg += `Hospital: ${visit.hospital || 'N/A'}\n`;
      msg += `Date: ${visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'N/A'}\n`;
      msg += `Doctor: ${visit.doctor || 'N/A'}\n`;
      msg += `Reason: ${visit.reason || 'N/A'}\n`;
      msg += `Diagnosis: ${visit.diagnosis || 'N/A'}`;
      
      return msg;
    } else {
      let msg = `END IBISOBANURO BY'ISURA\n`;
      msg += `Ibitaro: ${visit.hospital || 'Nta na kimwe'}\n`;
      msg += `Itariki: ${visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'Nta na kimwe'}\n`;
      msg += `Muganga: ${visit.doctor || 'Nta na kimwe'}\n`;
      msg += `Impamvu: ${visit.reason || 'Nta na kimwe'}\n`;
      msg += `Isuzuma: ${visit.diagnosis || 'Nta na kimwe'}`;
      
      return msg;
    }
  }
  
  /**
   * Show test results
   */
  private showTestResults(passport: any, language: 'en' | 'rw', path: string[]): string {
    const tests = passport.testResults || [];
    
    // If viewing a specific test
    if (path.length === 5 && path[4]) {
      const index = parseInt(path[4]) - 1;
      if (index >= 0 && index < tests.length) {
        return this.showTestDetails(tests[index], language);
      }
    }
    
    // Show list of tests
    if (tests.length === 0) {
      return language === 'en' 
        ? 'END No test results available.'
        : 'END Nta bisubizo by\'ibizamini bihari.';
    }
    
    if (language === 'en') {
      let msg = `CON TEST RESULTS (${tests.length})\n`;
      tests.slice(0, 5).forEach((test: any, i: number) => {
        const date = test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A';
        const status = test.status || 'normal';
        msg += `${i + 1}. ${test.testType || 'Unknown'} [${status}] - ${date}\n`;
      });
      
      if (tests.length > 5) {
        msg += `\nShowing 5 of ${tests.length}`;
      }
      msg += '\n0. Back to Main Menu';
      
      return msg;
    } else {
      let msg = `CON IBISUBIZO BY'IBIZAMINI (${tests.length})\n`;
      tests.slice(0, 5).forEach((test: any, i: number) => {
        const date = test.testDate ? new Date(test.testDate).toLocaleDateString() : 'Nta na kimwe';
        const status = test.status || 'normal';
        msg += `${i + 1}. ${test.testType || 'Kitazwi'} [${status}] - ${date}\n`;
      });
      
      if (tests.length > 5) {
        msg += `\nBigaragaza 5 muri ${tests.length}`;
      }
      msg += '\n0. Subira ku menu y\'ibanze';
      
      return msg;
    }
  }
  
  /**
   * Show test details
   */
  private showTestDetails(test: any, language: 'en' | 'rw'): string {
    if (language === 'en') {
      let msg = `END TEST DETAILS\n`;
      msg += `Type: ${test.testType || 'N/A'}\n`;
      msg += `Date: ${test.testDate ? new Date(test.testDate).toLocaleDateString() : 'N/A'}\n`;
      msg += `Status: ${test.status || 'N/A'}\n`;
      msg += `Result: ${test.results || 'N/A'}\n`;
      msg += `Range: ${test.normalRange || 'N/A'}`;
      
      return msg;
    } else {
      let msg = `END IBISOBANURO BY'IKIZAMINI\n`;
      msg += `Ubwoko: ${test.testType || 'Nta na kimwe'}\n`;
      msg += `Itariki: ${test.testDate ? new Date(test.testDate).toLocaleDateString() : 'Nta na kimwe'}\n`;
      msg += `Imiterere: ${test.status || 'Nta na kimwe'}\n`;
      msg += `Igisubizo: ${test.results || 'Nta na kimwe'}\n`;
      msg += `Urwego: ${test.normalRange || 'Nta na kimwe'}`;
      
      return msg;
    }
  }
  
  /**
   * Send passport via SMS and show confirmation
   */
  private async sendPassportAndConfirm(passport: any, language: 'en' | 'rw', sessionId: string): Promise<string> {
    const phoneNumber = sessionData.get(sessionId)?.phoneNumber || '+250788123456';
    
    try {
      // Try to send SMS
      const smsSent = await this.sendPassportViaSMS(phoneNumber, passport, language);
      
      // Log access
      await passport.addAccessRecord(
        null,
        'view',
        `USSD full passport access from ${phoneNumber}`,
        false
      );
      
      if (language === 'en') {
        return smsSent
          ? 'END Your full Patient Passport has been sent to your phone via SMS. Thank you!'
          : `END Passport Summary:\nName: ${passport.personalInfo?.fullName}\nID: ${passport.personalInfo?.nationalId}\nBlood: ${passport.personalInfo?.bloodType || 'N/A'}\n\nVisit: ${process.env.FRONTEND_URL}/patient-passport`;
      } else {
        return smsSent
          ? 'END Passport yawe yose yoherejwe kuri telephone yawe. Murakoze!'
          : `END Incamake ya Passport:\nAmazina: ${passport.personalInfo?.fullName}\nIrangamuntu: ${passport.personalInfo?.nationalId}\nAmaraso: ${passport.personalInfo?.bloodType || 'Nta na kimwe'}\n\nSura: ${process.env.FRONTEND_URL}/patient-passport`;
      }
    } catch (error) {
      console.error('❌ Error in sendPassportAndConfirm:', error);
      return this.showError(language,
        language === 'en' 
          ? 'Failed to send SMS. Please try again.' 
          : 'Byanze kohereza SMS. Ongera ugerageze.');
    }
  }
  
  /**
   * Validate user input
   */
  private validateInput(method: 'nationalId' | 'email', input: string): { valid: boolean; message?: string } {
    if (method === 'nationalId') {
      // National ID should be 10-16 digits (matching Patient model validation)
      const cleanedId = input.replace(/\D/g, ''); // Remove non-numeric characters
      if (!/^\d{10,16}$/.test(cleanedId)) {
        return {
          valid: false,
          message: 'Invalid National ID. Must be 10-16 digits.'
        };
      }
    } else {
      // Basic email validation
      const trimmedEmail = input.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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
  ): Promise<boolean> {
    try {
      // Format passport summary
      const summary = this.formatPassportSummary(passport, language);
      
      console.log(`📤 Attempting to send SMS to ${phoneNumber}`);
      
      // Send via SMS service
      await smsService.sendSMS(phoneNumber, summary);
      
      // Also send detailed link
      const detailMessage = language === 'en'
        ? `For full details, visit: ${process.env.FRONTEND_URL}/patient-passport\nPassport ID: ${passport._id}`
        : `Kugira ngo ubone ibisobanuro byuzuye, sura: ${process.env.FRONTEND_URL}/patient-passport\nID ya Passport: ${passport._id}`;
        
      await smsService.sendSMS(phoneNumber, detailMessage);
      
      console.log(`✅ Passport SMS sent to ${phoneNumber}`);
      return true;
      
    } catch (error: any) {
      console.error('❌ Error sending passport SMS:', error);
      console.error('❌ SMS Error details:', error?.message);
      // Don't throw - just log the error and return false
      // This allows the USSD flow to continue even if SMS fails
      return false;
    }
  }
  
  /**
   * Format passport summary for SMS
   */
  private formatPassportSummary(passport: any, language: 'en' | 'rw'): string {
    const { personalInfo, medicalInfo } = passport || {};
    
    if (!personalInfo) {
      console.warn('⚠️ Missing personalInfo in passport');
      return language === 'en' 
        ? 'PATIENT PASSPORT\nData incomplete. Please contact your healthcare provider.'
        : 'PASSPORT Y\'UBUZIMA\nAmakuru ntuzuye. Nyamuneka vugana n\'inzego z\'ubuzima.';
    }
    
    if (language === 'en') {
      let message = `PATIENT PASSPORT\n`;
      message += `Name: ${personalInfo.fullName || 'N/A'}\n`;
      message += `ID: ${personalInfo.nationalId || 'N/A'}\n`;
      message += `DOB: ${personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}\n`;
      message += `Blood: ${personalInfo.bloodType || 'N/A'}\n`;
      
      if (medicalInfo?.allergies && medicalInfo.allergies.length > 0) {
        message += `Allergies: ${medicalInfo.allergies.join(', ')}\n`;
      }
      
      if (personalInfo.emergencyContact) {
        message += `Emergency: ${personalInfo.emergencyContact.name || 'N/A'} (${personalInfo.emergencyContact.phone || 'N/A'})`;
      }
      
      return message;
    } else {
      let message = `PASSPORT Y'UBUZIMA\n`;
      message += `Amazina: ${personalInfo.fullName || 'Nta na kimwe'}\n`;
      message += `Irangamuntu: ${personalInfo.nationalId || 'Nta na kimwe'}\n`;
      message += `Itariki y'amavuko: ${personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth).toLocaleDateString() : 'Nta na kimwe'}\n`;
      message += `Ubwoko bw'amaraso: ${personalInfo.bloodType || 'Nta na kimwe'}\n`;
      
      if (medicalInfo?.allergies && medicalInfo.allergies.length > 0) {
        message += `Imiti itemewe: ${medicalInfo.allergies.join(', ')}\n`;
      }
      
      if (personalInfo.emergencyContact) {
        message += `Uhamagarwa mu byihutirwa: ${personalInfo.emergencyContact.name || 'Nta na kimwe'} (${personalInfo.emergencyContact.phone || 'Nta na kimwe'})`;
      }
      
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
