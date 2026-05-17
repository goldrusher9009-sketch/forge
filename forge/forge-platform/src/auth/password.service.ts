import bcrypt from 'bcryptjs';

/**
 * Password strength requirements
 */
interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Password strength validation result
 */
interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
}

/**
 * Password validation result
 */
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Password service for hashing, validation, and strength checking
 */
export class PasswordService {
  /**
   * Default password requirements
   * - Minimum 12 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  private static readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  /**
   * Bcrypt salt rounds (higher = slower but more secure)
   * 12 is recommended for modern systems
   * 10 is minimum acceptable
   */
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   * @throws Error if password is invalid
   */
  static async hashPassword(password: string): Promise<string> {
    // Validate password first
    const validation = this.validatePassword(password);
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Failed to hash password: ${(error as Error).message}`);
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns Promise<boolean> - True if passwords match
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error(`Failed to compare passwords: ${(error as Error).message}`);
    }
  }

  /**
   * Validate password against requirements
   * @param password - Password to validate
   * @param requirements - Custom requirements (uses defaults if not provided)
   * @returns PasswordValidationResult
   */
  static validatePassword(
    password: string,
    requirements: PasswordRequirements = this.DEFAULT_REQUIREMENTS
  ): PasswordValidationResult {
    const errors: string[] = [];

    // Length check
    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }

    // Uppercase check
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Numbers check
    if (requirements.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special characters check
    if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*...)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check password strength and provide feedback
   * @param password - Password to check
   * @param requirements - Custom requirements (uses defaults if not provided)
   * @returns PasswordStrengthResult with score and feedback
   */
  static checkPasswordStrength(
    password: string,
    requirements: PasswordRequirements = this.DEFAULT_REQUIREMENTS
  ): PasswordStrengthResult {
    let score = 0;
    const feedback: string[] = [];
    const requirementsMet = {
      length: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      specialChars: false,
    };

    // Length scoring (0-20 points)
    if (password.length >= requirements.minLength) {
      score += 10;
      requirementsMet.length = true;
    }
    if (password.length >= requirements.minLength + 8) {
      score += 10;
    }

    // Uppercase scoring (0-20 points)
    if (/[A-Z]/.test(password)) {
      score += 20;
      requirementsMet.uppercase = true;
    } else if (requirements.requireUppercase) {
      feedback.push('Add uppercase letters for stronger password');
    }

    // Lowercase scoring (0-20 points)
    if (/[a-z]/.test(password)) {
      score += 20;
      requirementsMet.lowercase = true;
    } else if (requirements.requireLowercase) {
      feedback.push('Add lowercase letters for stronger password');
    }

    // Numbers scoring (0-20 points)
    if (/[0-9]/.test(password)) {
      score += 20;
      requirementsMet.numbers = true;
    } else if (requirements.requireNumbers) {
      feedback.push('Add numbers for stronger password');
    }

    // Special characters scoring (0-20 points)
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      score += 20;
      requirementsMet.specialChars = true;
    } else if (requirements.requireSpecialChars) {
      feedback.push('Add special characters for stronger password');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Add strength feedback
    if (score >= 80) {
      feedback.unshift('Excellent password strength');
    } else if (score >= 60) {
      feedback.unshift('Good password strength');
    } else if (score >= 40) {
      feedback.unshift('Fair password strength');
    } else {
      feedback.unshift('Weak password strength');
    }

    return {
      isValid: this.validatePassword(password, requirements).isValid,
      score,
      feedback,
      requirements: requirementsMet,
    };
  }

  /**
   * Generate a random secure password
   * Useful for password reset or temporary passwords
   * @param length - Password length (default: 16)
   * @returns string - Randomly generated password
   */
  static generateRandomPassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + specialChars;
    let password = '';

    // Ensure at least one character from each required category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password to randomize positions
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Check if a password needs to be changed
   * Useful for enforcing periodic password changes
   * @param lastChangedAt - Date when password was last changed
   * @param maxAgeDays - Maximum age of password in days (default: 90)
   * @returns boolean - True if password should be changed
   */
  static shouldChangePassword(lastChangedAt: Date, maxAgeDays: number = 90): boolean {
    const now = new Date();
    const daysPassed = (now.getTime() - lastChangedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysPassed > maxAgeDays;
  }

  /**
   * Check if password has been used before (for password history)
   * @param password - Current password
   * @param previousHashes - Array of previous password hashes
   * @returns Promise<boolean> - True if password matches any previous hash
   */
  static async checkPasswordHistory(password: string, previousHashes: string[]): Promise<boolean> {
    try {
      for (const hash of previousHashes) {
        const matches = await bcrypt.compare(password, hash);
        if (matches) {
          return true;
        }
      }
      return false;
    } catch (error) {
      throw new Error(`Failed to check password history: ${(error as Error).message}`);
    }
  }

  /**
   * Get password requirements as a formatted string
   * Useful for displaying to users
   */
  static getRequirementsText(requirements: PasswordRequirements = this.DEFAULT_REQUIREMENTS): string {
    const parts: string[] = [];

    parts.push(`At least ${requirements.minLength} characters`);
    if (requirements.requireUppercase) parts.push('One uppercase letter');
    if (requirements.requireLowercase) parts.push('One lowercase letter');
    if (requirements.requireNumbers) parts.push('One number');
    if (requirements.requireSpecialChars) parts.push('One special character (!@#$%^&*...)');

    return parts.join(', ');
  }
}

export default PasswordService;
