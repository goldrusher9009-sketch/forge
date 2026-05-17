import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import logger from './logger';

/**
 * Generate TOTP secret and QR code
 */
export async function generateTOTPSecret(email: string): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  try {
    const secret = speakeasy.generateSecret({
      name: `Forge (${email})`,
      issuer: 'Forge',
      length: 32,
    });

    if (!secret.otpauth_url) {
      throw new Error('Failed to generate TOTP secret');
    }

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    logger.info(`TOTP secret generated for ${email}`);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  } catch (err: any) {
    logger.error(`TOTP generation failed: ${err.message}`);
    throw err;
  }
}

/**
 * Verify TOTP token
 */
export async function verifyOTP(token: string, secret: string): Promise<boolean> {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time windows (30 second windows)
    });

    return verified ? true : false;
  } catch (err: any) {
    logger.error(`OTP verification failed: ${err.message}`);
    return false;
  }
}

/**
 * Generate SMS OTP (6 digit code)
 */
export function generateSMSOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate email OTP (6 digit code)
 */
export function generateEmailOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verify OTP code (numeric, 6 digits)
 */
export function verifyNumericOTP(provided: string, stored: string): boolean {
  return provided === stored;
}
