import { Router, Request, Response } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from '../../../database/db';
import { UserRepository } from '../../../database/repositories/user.repository';
import { authenticateToken } from '../../../middleware/auth';
import logger from '../../../utils/logger';
import { sendEmail } from '../../../utils/email';
import { generateOTP, verifyOTP } from '../../../utils/mfa';

const router = Router();
const userRepo = new UserRepository(db);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8),
  mfa_code: Joi.string().optional().length(6),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(8),
  first_name: Joi.string().required().max(100),
  last_name: Joi.string().required().max(100),
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required(),
});

const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  new_password: Joi.string().required().min(8),
});

const mfaVerifySchema = Joi.object({
  mfa_code: Joi.string().required().length(6),
});

// POST /api/v1/auth/register - Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      logger.warn(`Registration validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    // Check if user already exists
    const existingUser = await userRepo.getUserByEmail(value.email);
    if (existingUser) {
      logger.warn(`Registration failed: email already exists ${value.email}`);
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await userRepo.createUser(
      value.email,
      value.password,
      value.first_name,
      value.last_name,
      'user'
    );

    // Send verification email
    const verificationToken = jwt.sign(
      { user_id: user.id, type: 'email_verification' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await sendEmail({
      to: user.email,
      subject: 'Verify your Forge account',
      html: `<p>Click <a href="${process.env.APP_URL}/verify-email?token=${verificationToken}">here</a> to verify your email</p>`,
    });

    logger.info(`User registered: ${user.id}`);
    res.status(201).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (err: any) {
    logger.error(`Registration failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// POST /api/v1/auth/login - Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.warn(`Login validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    // Get user by email
    const user = await userRepo.getUserByEmail(value.email);
    if (!user) {
      logger.warn(`Login failed: user not found ${value.email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(value.password, user.password_hash);
    if (!passwordMatch) {
      logger.warn(`Login failed: invalid password for ${value.email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.email_verified_at) {
      logger.info(`Login blocked: email not verified for ${value.email}`);
      return res.status(403).json({ error: 'Please verify your email first' });
    }

    // Check MFA requirement
    if (user.mfa_enabled && user.mfa_type) {
      if (!value.mfa_code) {
        logger.info(`Login requires MFA: ${user.id}`);
        return res.status(403).json({
          error: 'MFA code required',
          requires_mfa: true,
          mfa_type: user.mfa_type,
        });
      }

      // Verify MFA code
      const mfaValid = await verifyOTP(value.mfa_code, user.mfa_secret || '');
      if (!mfaValid) {
        logger.warn(`Login failed: invalid MFA code for ${user.id}`);
        return res.status(401).json({ error: 'Invalid MFA code' });
      }
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        user_id: user.id,
        type: 'refresh',
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await userRepo.updateLastLogin(user.id);

    logger.info(`User logged in: ${user.id}`);
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    logger.error(`Login failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/v1/auth/logout - Logout user
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    logger.info(`User logged out: ${req.user?.id}`);
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    logger.error(`Logout failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// POST /api/v1/auth/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      logger.warn(`Token refresh validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    try {
      const decoded = jwt.verify(value.refresh_token, JWT_REFRESH_SECRET) as any;

      if (decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Invalid token type' });
      }

      const user = await userRepo.getUserById(decoded.user_id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const accessToken = jwt.sign(
        {
          user_id: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      logger.info(`Token refreshed for user: ${user.id}`);
      res.json({
        access_token: accessToken,
        expires_in: 3600,
      });
    } catch (jwtErr) {
      logger.warn(`Invalid refresh token`);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  } catch (err: any) {
    logger.error(`Token refresh failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// POST /api/v1/auth/verify-email - Verify email address
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { error, value } = verifyEmailSchema.validate(req.body);
    if (error) {
      logger.warn(`Email verification validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    try {
      const decoded = jwt.verify(value.token, JWT_SECRET) as any;

      if (decoded.type !== 'email_verification') {
        return res.status(401).json({ error: 'Invalid token type' });
      }

      const user = await userRepo.verifyEmail(decoded.user_id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      logger.info(`Email verified for user: ${user.id}`);
      res.json({
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          email_verified_at: user.email_verified_at,
        },
      });
    } catch (jwtErr) {
      logger.warn(`Invalid email verification token`);
      return res.status(401).json({ error: 'Invalid or expired verification token' });
    }
  } catch (err: any) {
    logger.error(`Email verification failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /api/v1/auth/password-reset-request - Request password reset
router.post('/password-reset-request', async (req: Request, res: Response) => {
  try {
    const { error, value } = passwordResetRequestSchema.validate(req.body);
    if (error) {
      logger.warn(`Password reset request validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const user = await userRepo.getUserByEmail(value.email);
    if (!user) {
      // Don't reveal if email exists
      logger.info(`Password reset requested for non-existent email: ${value.email}`);
      return res.json({ message: 'If email exists, password reset link will be sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      {
        user_id: user.id,
        type: 'password_reset',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: 'Reset your Forge password',
      html: `<p>Click <a href="${process.env.APP_URL}/reset-password?token=${resetToken}">here</a> to reset your password</p>`,
    });

    logger.info(`Password reset email sent for user: ${user.id}`);
    res.json({ message: 'If email exists, password reset link will be sent' });
  } catch (err: any) {
    logger.error(`Password reset request failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/v1/auth/password-reset - Reset password
router.post('/password-reset', async (req: Request, res: Response) => {
  try {
    const { error, value } = passwordResetSchema.validate(req.body);
    if (error) {
      logger.warn(`Password reset validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    try {
      const decoded = jwt.verify(value.token, JWT_SECRET) as any;

      if (decoded.type !== 'password_reset') {
        return res.status(401).json({ error: 'Invalid token type' });
      }

      const user = await userRepo.updatePassword(decoded.user_id, value.new_password);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      logger.info(`Password reset for user: ${user.id}`);
      res.json({ message: 'Password reset successfully' });
    } catch (jwtErr) {
      logger.warn(`Invalid password reset token`);
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }
  } catch (err: any) {
    logger.error(`Password reset failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/v1/auth/mfa/verify - Verify MFA code (for additional verification flows)
router.post('/mfa/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { error, value } = mfaVerifySchema.validate(req.body);
    if (error) {
      logger.warn(`MFA verification validation failed: ${error.message}`);
      return res.status(400).json({ error: error.message });
    }

    const user = await userRepo.getUserById(req.user?.id as string);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfa_enabled) {
      return res.status(400).json({ error: 'MFA not enabled for this user' });
    }

    const mfaValid = await verifyOTP(value.mfa_code, user.mfa_secret || '');
    if (!mfaValid) {
      logger.warn(`MFA verification failed for user: ${user.id}`);
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    logger.info(`MFA verified for user: ${user.id}`);
    res.json({ message: 'MFA code verified' });
  } catch (err: any) {
    logger.error(`MFA verification failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to verify MFA code' });
  }
});

export default router;
