import crypto from 'crypto';
import logger from '@/utils/logger';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  /**
   * Generate encryption key
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Encrypt data
   */
  static encrypt(text: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, keyBuffer);
      cipher.setAAD(Buffer.from('patient-passport', 'utf8'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV, tag, and encrypted data
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Error encrypting data:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  static decrypt(encryptedData: string, key: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(this.ALGORITHM, keyBuffer);
      decipher.setAAD(Buffer.from('patient-passport', 'utf8'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting data:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return actualSalt + ':' + hash.toString('hex');
  }

  /**
   * Verify hashed data
   */
  static verifyHash(data: string, hashedData: string): boolean {
    try {
      const parts = hashedData.split(':');
      if (parts.length !== 2) {
        return false;
      }

      const salt = parts[0];
      const hash = parts[1];
      const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
      
      return hash === newHash;
    } catch (error) {
      logger.error('Error verifying hash:', error);
      return false;
    }
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate API key
   */
  static generateApiKey(): string {
    return 'pp_' + this.generateSecureRandom(32);
  }

  /**
   * Generate JWT secret
   */
  static generateJWTSecret(): string {
    return this.generateSecureRandom(64);
  }
}

/**
 * Middleware to encrypt sensitive fields in request body
 */
export const encryptSensitiveFields = (fields: string[]) => {
  return (req: any, res: any, next: any) => {
    try {
      if (req.body && fields.length > 0) {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        
        if (!encryptionKey) {
          logger.warn('ENCRYPTION_KEY not configured, skipping encryption');
          return next();
        }

        fields.forEach(field => {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = EncryptionService.encrypt(req.body[field], encryptionKey);
          }
        });
      }
      next();
    } catch (error) {
      logger.error('Error in encryptSensitiveFields middleware:', error);
      next();
    }
  };
};

/**
 * Middleware to decrypt sensitive fields in response
 */
export const decryptSensitiveFields = (fields: string[]) => {
  return (req: any, res: any, next: any) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      try {
        if (data && fields.length > 0) {
          const encryptionKey = process.env.ENCRYPTION_KEY;
          
          if (encryptionKey) {
            const decryptedData = JSON.parse(JSON.stringify(data));
            
            const decryptFields = (obj: any) => {
              if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                  if (fields.includes(key) && typeof obj[key] === 'string') {
                    try {
                      obj[key] = EncryptionService.decrypt(obj[key], encryptionKey);
                    } catch (error) {
                      // Field might not be encrypted, continue
                    }
                  } else if (typeof obj[key] === 'object') {
                    decryptFields(obj[key]);
                  }
                }
              }
            };
            
            decryptFields(decryptedData);
            return originalSend.call(this, decryptedData);
          }
        }
        
        return originalSend.call(this, data);
      } catch (error) {
        logger.error('Error in decryptSensitiveFields middleware:', error);
        return originalSend.call(this, data);
      }
    };
    
    next();
  };
};

