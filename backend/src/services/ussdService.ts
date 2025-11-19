import Patient from '@/models/Patient';
import PatientPassport from '@/models/PatientPassport';
import MedicalRecord from '@/models/MedicalRecord';
import User from '@/models/User';
import { smsService } from './smsService';

/**
 * USSD Service for handling Patient Passport access via USSD
 * Implements Africa's Talking USSD protocol
 * 
 * Updated to include MedicalRecord collection for complete historical records
 * including OpenMRS-synced observations
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
        return await this.showMedicalHistory(passport, language, path);
      
      case '3':
        return await this.showCurrentMedications(passport, language, path);
      
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
   * Show medical history (conditions) - includes MedicalRecord collection
   */
  private async showMedicalHistory(passport: any, language: 'en' | 'rw', path: string[]): Promise<string> {
    try {
      // Get both legacy conditions and MedicalRecord conditions
      const legacyConditions = passport.medicalInfo?.medicalConditions || [];
      
      // Fetch MedicalRecord conditions for this patient
      const patientId = passport.patient._id || passport.patient;
      const medicalRecordConditions = await MedicalRecord.find({
        patientId: patientId,
        type: 'condition'
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      
      console.log(`📋 USSD Medical History:`, {
        patientId,
        legacyCount: legacyConditions.length,
        medicalRecordCount: medicalRecordConditions.length
      });
      
      // Combine and format all conditions
      const allConditions: any[] = [];
      
      // Add MedicalRecord conditions (including OpenMRS synced)
      // FILTER OUT test results, measurements, vitals, and notes - only show actual diagnoses
      medicalRecordConditions.forEach((record: any) => {
        const data = record.data || {};
        const conditionName = (data.diagnosis || data.name || data.condition || '').trim();
        
        // Skip empty or invalid names
        if (!conditionName || conditionName === 'Unknown') {
          return;
        }
        
        // Skip if this is NOT a medical diagnosis (filter out tests, measurements, vitals, notes)
        const isNotDiagnosis = /\b(test|rapid test|lab|laboratory|screening|examination|x-ray|ultrasound|scan|blood work|serum|arterial|oxygen|saturation|pulse|weight|height|temperature|blood pressure|heart rate|bmi|vitals|encounter note|text of|note|observation|measurement)\b/i.test(conditionName);
        
        // Only include actual medical diagnoses
        if (!isNotDiagnosis) {
          allConditions.push({
            condition: conditionName,
            status: data.status || 'active',
            diagnosedDate: data.diagnosed || data.diagnosedDate || data.date || record.createdAt,
            diagnosedBy: data.diagnosedBy || data.doctor || 'Unknown',
            notes: data.notes || data.details || '',
            hospital: data.hospital || '',
            isFromOpenMRS: !!record.openmrsData,
            source: record.openmrsData ? 'OpenMRS' : 'Manual Entry',
            medications: Array.isArray(data.medications) ? data.medications : [],
            createdAt: record.createdAt // Keep original timestamp for sorting
          });
        }
      });
      
      // Add legacy conditions (filter out OpenMRS duplicates)
      legacyConditions.forEach((cond: any) => {
        const notes = (cond as any).notes || '';
        if (!notes.includes('Added from OpenMRS')) {
          allConditions.push({
            condition: cond.condition || 'Unknown',
            status: cond.status || 'active',
            diagnosedDate: cond.diagnosedDate,
            diagnosedBy: cond.diagnosedBy || 'Unknown',
            notes: notes,
            hospital: '',
            isFromOpenMRS: false,
            source: 'Legacy',
            medications: []
          });
        }
      });
      
      // Sort by date (most recent first) - use createdAt for accurate sorting
      allConditions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.diagnosedDate || 0).getTime();
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.diagnosedDate || 0).getTime();
        return dateB - dateA; // Most recent first
      });
      
      console.log(`   Total conditions after merge: ${allConditions.length}`);
      
      // If viewing a specific condition
      if (path.length === 5 && path[4]) {
        const index = parseInt(path[4]) - 1;
        if (index >= 0 && index < allConditions.length) {
          return this.showConditionDetails(allConditions[index], language);
        }
      }
      
      // Show list of conditions
      if (allConditions.length === 0) {
        return language === 'en' 
          ? 'END No medical conditions recorded.'
          : 'END Nta ndwara zanditswe.';
      }
      
      if (language === 'en') {
        let msg = `CON MEDICAL HISTORY (${allConditions.length})\n`;
        allConditions.slice(0, 5).forEach((cond: any, i: number) => {
          const status = cond.status || 'active';
          const source = cond.isFromOpenMRS ? '*' : '';
          msg += `${i + 1}. ${source}${cond.condition} [${status}]\n`;
          
          // Show medications under the condition
          if (cond.medications && cond.medications.length > 0) {
            cond.medications.slice(0, 2).forEach((med: any) => {
              msg += `   - ${med.name || 'N/A'}`;
              if (med.dosage) msg += ` (${med.dosage})`;
              msg += '\n';
            });
            if (cond.medications.length > 2) {
              msg += `   (${cond.medications.length - 2} more meds)\n`;
            }
          }
        });
        
        if (allConditions.length > 5) {
          msg += `\nShowing 5 of ${allConditions.length}`;
        }
        msg += '\n*=OpenMRS synced';
        msg += '\n0. Back to Main Menu';
        
        return msg;
      } else {
        let msg = `CON AMATEKA Y'UBUZIMA (${allConditions.length})\n`;
        allConditions.slice(0, 5).forEach((cond: any, i: number) => {
          const status = cond.status || 'active';
          const source = cond.isFromOpenMRS ? '*' : '';
          msg += `${i + 1}. ${source}${cond.condition} [${status}]\n`;
          
          // Show medications under the condition
          if (cond.medications && cond.medications.length > 0) {
            cond.medications.slice(0, 2).forEach((med: any) => {
              msg += `   - ${med.name || 'N/A'}`;
              if (med.dosage) msg += ` (${med.dosage})`;
              msg += '\n';
            });
            if (cond.medications.length > 2) {
              msg += `   (${cond.medications.length - 2} andi)\n`;
            }
          }
        });
        
        if (allConditions.length > 5) {
          msg += `\nBigaragaza 5 muri ${allConditions.length}`;
        }
        msg += '\n*=Yakuwe kuri OpenMRS';
        msg += '\n0. Subira ku menu y\'ibanze';
        
        return msg;
      }
    } catch (error: any) {
      console.error('❌ Error fetching medical history for USSD:', error);
      return language === 'en'
        ? 'END Unable to load medical history. Please try again.'
        : 'END Ntidushobora gufungura amateka. Ongera ugerageze.';
    }
  }
  
  /**
   * Show specific condition details - includes medications
   */
  private showConditionDetails(condition: any, language: 'en' | 'rw'): string {
    if (language === 'en') {
      let msg = `END CONDITION DETAILS\n`;
      msg += `Name: ${condition.condition || 'N/A'}\n`;
      msg += `Status: ${condition.status || 'N/A'}\n`;
      msg += `Diagnosed: ${condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString() : 'N/A'}\n`;
      msg += `By: ${condition.diagnosedBy || 'N/A'}`;
      
      if (condition.hospital) {
        msg += `\nHospital: ${condition.hospital}`;
      }
      
      if (condition.isFromOpenMRS) {
        msg += `\nSource: OpenMRS (Synced)`;
      }
      
      // Show medications if available
      if (condition.medications && condition.medications.length > 0) {
        msg += `\n\nMEDICATIONS:`;
        condition.medications.slice(0, 3).forEach((med: any, i: number) => {
          msg += `\n${i + 1}. ${med.name || 'N/A'}`;
          if (med.dosage) msg += ` - ${med.dosage}`;
          if (med.frequency) msg += ` - ${med.frequency}`;
        });
        if (condition.medications.length > 3) {
          msg += `\n+${condition.medications.length - 3} more`;
        }
      }
      
      if (condition.notes) {
        msg += `\n\nNotes: ${condition.notes.substring(0, 80)}`;
      }
      
      return msg;
    } else {
      let msg = `END IBISOBANURO BY'INDWARA\n`;
      msg += `Izina: ${condition.condition || 'Nta na kimwe'}\n`;
      msg += `Imiterere: ${condition.status || 'Nta na kimwe'}\n`;
      msg += `Yasuzumwe: ${condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString() : 'Nta na kimwe'}\n`;
      msg += `Na: ${condition.diagnosedBy || 'Nta na kimwe'}`;
      
      if (condition.hospital) {
        msg += `\nIbitaro: ${condition.hospital}`;
      }
      
      if (condition.isFromMRS) {
        msg += `\nInkomoko: OpenMRS`;
      }
      
      // Show medications if available
      if (condition.medications && condition.medications.length > 0) {
        msg += `\n\nIMITI:`;
        condition.medications.slice(0, 3).forEach((med: any, i: number) => {
          msg += `\n${i + 1}. ${med.name || 'Nta na kimwe'}`;
          if (med.dosage) msg += ` - ${med.dosage}`;
          if (med.frequency) msg += ` - ${med.frequency}`;
        });
        if (condition.medications.length > 3) {
          msg += `\n+${condition.medications.length - 3} iyindi`;
        }
      }
      
      if (condition.notes) {
        msg += `\n\nIbisobanuro: ${condition.notes.substring(0, 80)}`;
      }
      
      return msg;
    }
  }
  
  /**
   * Show current medications - includes MedicalRecord collection
   */
  private async showCurrentMedications(passport: any, language: 'en' | 'rw', path: string[]): Promise<string> {
    try {
      const legacyMedications = passport.medicalInfo?.currentMedications || [];
      
      // Fetch MedicalRecord medications
      const patientId = passport.patient._id || passport.patient;
      const medicalRecordMedications = await MedicalRecord.find({
        patientId: patientId,
        type: 'medication'
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      
      // Also get medications from conditions
      const medicalRecordConditions = await MedicalRecord.find({
        patientId: patientId,
        type: 'condition',
        'data.medications': { $exists: true, $ne: [] }
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      
      console.log(`💊 USSD Medications:`, {
        patientId,
        legacyCount: legacyMedications.length,
        medicalRecordMedicationsCount: medicalRecordMedications.length,
        conditionsWithMedicationsCount: medicalRecordConditions.length
      });
      
      // Combine all medications
      const allMedications: any[] = [];
      
      // Add medications from MedicalRecord medication type
      medicalRecordMedications.forEach((record: any) => {
        const data = record.data || {};
        allMedications.push({
          name: data.medicationName || data.name || 'Unknown',
          dosage: data.dosage || '',
          frequency: data.frequency || '',
          prescribedBy: data.prescribedBy || data.doctor || '',
          startDate: data.startDate || data.date,
          status: data.medicationStatus || data.status || 'Active',
          isFromOpenMRS: !!record.openmrsData
        });
      });
      
      // Add medications from conditions
      medicalRecordConditions.forEach((record: any) => {
        const medications = (record.data?.medications || []);
        medications.forEach((med: any) => {
          allMedications.push({
            name: med.name || med.medicationName || 'Unknown',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            prescribedBy: med.prescribedBy || '',
            startDate: med.startDate,
            status: med.medicationStatus || 'Active',
            isFromOpenMRS: !!record.openmrsData,
            linkedTo: record.data?.diagnosis || record.data?.condition
          });
        });
      });
      
      // Add legacy medications (filter OpenMRS duplicates)
      legacyMedications.forEach((med: any) => {
        const notes = (med as any).notes || '';
        if (!notes.includes('Added from OpenMRS')) {
          allMedications.push({
            name: med.name || 'Unknown',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            prescribedBy: med.prescribedBy || '',
            startDate: med.startDate,
            status: med.status || 'Active',
            isFromOpenMRS: false
          });
        }
      });
      
      // Filter active medications
      const activeMedications = allMedications.filter(m => 
        m.status !== 'Past' && m.status !== 'Discontinued'
      );
      
      console.log(`   Total active medications: ${activeMedications.length}`);
      
      // If viewing a specific medication
      if (path.length === 5 && path[4]) {
        const index = parseInt(path[4]) - 1;
        if (index >= 0 && index < activeMedications.length) {
          return this.showMedicationDetails(activeMedications[index], language);
        }
      }
    
      // Show list of medications
      if (activeMedications.length === 0) {
        return language === 'en' 
          ? 'END No current medications.'
          : 'END Nta miti ukoresha.';
      }
      
      if (language === 'en') {
        let msg = `CON CURRENT MEDICATIONS (${activeMedications.length})\n`;
        activeMedications.slice(0, 5).forEach((med: any, i: number) => {
          const source = med.isFromOpenMRS ? '📡' : '';
          msg += `${i + 1}. ${source}${med.name || 'Unknown'}\n`;
          if (med.dosage || med.frequency) {
            msg += `   ${med.dosage || ''} ${med.frequency || ''}\n`;
          }
        });
        
        if (activeMedications.length > 5) {
          msg += `\nShowing 5 of ${activeMedications.length}`;
        }
        msg += '\n📡=OpenMRS synced';
        msg += '\n0. Back to Main Menu';
        
        return msg;
      } else {
        let msg = `CON IMITI UKORESHA (${activeMedications.length})\n`;
        activeMedications.slice(0, 5).forEach((med: any, i: number) => {
          const source = med.isFromOpenMRS ? '📡' : '';
          msg += `${i + 1}. ${source}${med.name || 'Ntizwi'}\n`;
          if (med.dosage || med.frequency) {
            msg += `   ${med.dosage || ''} ${med.frequency || ''}\n`;
          }
        });
        
        if (activeMedications.length > 5) {
          msg += `\nBigaragaza 5 muri ${activeMedications.length}`;
        }
        msg += '\n📡=Yakuwe kuri OpenMRS';
        msg += '\n0. Subira ku menu y\'ibanze';
        
        return msg;
      }
    } catch (error: any) {
      console.error('❌ Error fetching medications for USSD:', error);
      return language === 'en'
        ? 'END Unable to load medications. Please try again.'
        : 'END Ntidushobora gufungura imiti. Ongera ugerageze.';
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
      
      // Always show passport summary on screen, with note about SMS status
      const frontendUrl = process.env.FRONTEND_URL || 'https://jade-pothos-e432d0.netlify.app';
      
      if (language === 'en') {
        let message = `END Passport Summary:\n`;
        message += `Name: ${passport.personalInfo?.fullName || 'N/A'}\n`;
        message += `ID: ${passport.personalInfo?.nationalId || 'N/A'}\n`;
        message += `Blood: ${passport.personalInfo?.bloodType || 'N/A'}\n\n`;
        
        if (smsSent) {
          message += `✓ Details sent via SMS!\n`;
        } else {
          message += `Note: SMS not configured.\n`;
        }
        
        message += `\nVisit: ${frontendUrl}/patient-passport`;
        return message;
      } else {
        let message = `END Incamake ya Passport:\n`;
        message += `Amazina: ${passport.personalInfo?.fullName || 'Nta na kimwe'}\n`;
        message += `Irangamuntu: ${passport.personalInfo?.nationalId || 'Nta na kimwe'}\n`;
        message += `Amaraso: ${passport.personalInfo?.bloodType || 'Nta na kimwe'}\n\n`;
        
        if (smsSent) {
          message += `✓ Ibisobanuro byoherejwe kuri SMS!\n`;
        } else {
          message += `Icyitonderwa: SMS ntago iteganyijwe.\n`;
        }
        
        message += `\nSura: ${frontendUrl}/patient-passport`;
        return message;
      }
    } catch (error) {
      console.error('❌ Error in sendPassportAndConfirm:', error);
      
      // Even on error, show passport summary
      const frontendUrl = process.env.FRONTEND_URL || 'https://jade-pothos-e432d0.netlify.app';
      if (language === 'en') {
        return `END Passport Summary:\nName: ${passport.personalInfo?.fullName || 'N/A'}\nID: ${passport.personalInfo?.nationalId || 'N/A'}\nBlood: ${passport.personalInfo?.bloodType || 'N/A'}\n\nVisit: ${frontendUrl}/patient-passport`;
      } else {
        return `END Incamake ya Passport:\nAmazina: ${passport.personalInfo?.fullName || 'Nta na kimwe'}\nIrangamuntu: ${passport.personalInfo?.nationalId || 'Nta na kimwe'}\nAmaraso: ${passport.personalInfo?.bloodType || 'Nta na kimwe'}\n\nSura: ${frontendUrl}/patient-passport`;
      }
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
