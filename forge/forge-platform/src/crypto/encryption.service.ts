import crypto from 'crypto';

/**
 * Encryption configuration
 */
interface EncryptionConfig {
  algorithm: string;
  encryptionKey: string; // Must be 32 bytes for AES-256
  encoding: BufferEncoding;
}

/**
 * Encrypted data structure
 */
interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
  algorithm: string;
}

/**
 * Encryption service using AES-256-GCM
 * GCM (Galois/Counter Mode) provides both encryption and authentication
 */
export class EncryptionService {
  private config: EncryptionConfig;
  private algorithm = 'aes-256-gcm';
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits
  private saltLength = 64;

  constructor(encryptionKey: string) {
    // Validate encryption key (must be 32 bytes for AES-256)
    if (encryptionKey.length !== 32) {
      throw new Error('Encryption key must be exactly 32 bytes (256 bits)');
    }

    this.config = {
      algorithm: this.algorithm,
      encryptionKey,
      encoding: 'hex',
    };
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param plaintext - Data to encrypt
   * @param additionalAuthenticatedData - Optional AAD for authentication
   * @returns EncryptedData with IV, encrypted data, and auth tag
   */
  encrypt(plaintext: string, additionalAuthenticatedData?: string): EncryptedData {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        Buffer.from(this.config.encryptionKey, 'hex'),
        iv
      );

      // Add AAD if provided
      if (additionalAuthenticatedData) {
        cipher.setAAD(Buffer.from(additionalAuthenticatedData, 'utf8'));
      }

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const tag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        data: encrypted,
        tag: tag.toString('hex'),
        algorithm: this.algorithm,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData - Data to decrypt
   * @param additionalAuthenticatedData - Optional AAD for verification
   * @returns Decrypted plaintext
   */
  decrypt(encryptedData: EncryptedData, additionalAuthenticatedData?: string): string {
    try {
      // Validate algorithm
      if (encryptedData.algorithm !== this.algorithm) {
        throw new Error(`Algorithm mismatch: expected ${this.algorithm}, got ${encryptedData.algorithm}`);
      }

      // Create decipher
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(this.config.encryptionKey, 'hex'),
        iv
      );

      // Add AAD if provided
      if (additionalAuthenticatedData) {
        decipher.setAAD(Buffer.from(additionalAuthenticatedData, 'utf8'));
      }

      // Set authentication tag
      decipher.setAuthTag(tag);

      // Decrypt data
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * Encrypt a JSON object
   * @param data - Object to encrypt
   * @param additionalAuthenticatedData - Optional AAD
   * @returns EncryptedData
   */
  encryptJSON<T>(data: T, additionalAuthenticatedData?: string): EncryptedData {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString, additionalAuthenticatedData);
  }

  /**
   * Decrypt to a JSON object
   * @param encryptedData - Data to decrypt
   * @param additionalAuthenticatedData - Optional AAD
   * @returns Decrypted object
   */
  decryptJSON<T>(encryptedData: EncryptedData, additionalAuthenticatedData?: string): T {
    const jsonString = this.decrypt(encryptedData, additionalAuthenticatedData);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Derive a key from a password using PBKDF2
   * @param password - Password to derive from
   * @param salt - Optional salt (generated if not provided)
   * @param iterations - PBKDF2 iterations (default: 100000)
   * @returns Derived key
   */
  static deriveKey(password: string, salt?: string, iterations: number = 100000): { key: string; salt: string } {
    try {
      const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(64);

      const derivedKey = crypto.pbkdf2Sync(
        password,
        saltBuffer,
        iterations,
        32, // 256 bits
        'sha256'
      );

      return {
        key: derivedKey.toString('hex'),
        salt: saltBuffer.toString('hex'),
      };
    } catch (error) {
      throw new Error(`Key derivation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Hash data using SHA-256
   * @param data - Data to hash
   * @returns Hash in hex format
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create HMAC for data integrity verification
   * @param data - Data to create HMAC for
   * @param secret - Secret key
   * @returns HMAC in hex format
   */
  static hmac(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Generate a random key of specified length
   * @param length - Key length in bytes (default: 32 for AES-256)
   * @returns Random key in hex format
   */
  static generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a random token
   * @param length - Token length in bytes (default: 32)
   * @returns Random token in hex format
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * @param str1 - First string to compare
   * @param str2 - Second string to compare
   * @returns Boolean indicating if strings are equal
   */
  static constantTimeCompare(str1: string, str2: string): boolean {
    if (str1.length !== str2.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < str1.length; i++) {
      result |= str1.charCodeAt(i) ^ str2.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Encrypt sensitive audit log data
   * @param auditData - Audit data to encrypt
   * @param userId - User ID as AAD
   * @returns Encrypted data
   */
  encryptAuditLog(auditData: any, userId: string): EncryptedData {
    const jsonString = JSON.stringify(auditData);
    return this.encrypt(jsonString, `audit:${userId}`);
  }

  /**
   * Decrypt audit log data
   * @param encryptedData - Encrypted audit data
   * @param userId - User ID for AAD verification
   * @returns Decrypted audit data
   */
  decryptAuditLog(encryptedData: EncryptedData, userId: string): any {
    const jsonString = this.decrypt(encryptedData, `audit:${userId}`);
    return JSON.parse(jsonString);
  }

  /**
   * Verify data integrity using HMAC
   * @param data - Data to verify
   * @param hmac - Expected HMAC
   * @param secret - Secret key
   * @returns Boolean indicating if data is authentic
   */
  static verifyHMAC(data: string, hmac: string, secret: string): boolean {
    const expectedHmac = this.hmac(data, secret);
    return this.constantTimeCompare(hmac, expectedHmac);
  }
}

export default EncryptionService;
