import { Router, Request, Response, NextFunction } from 'express';
import { userRepository } from '../../../database/repositories/user.repository';
import { authenticateToken, requireRole } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validation';
import { logger } from '../../../utils/logger';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

const router = Router();

/**
 * User Management API Routes
 * Handles CRUD operations for user profiles, authentication, and permissions
 */

// Schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  organization_id: Joi.string().uuid().optional(),
});

const updateUserSchema = Joi.object({
  first_name: Joi.string().optional(),
  last_name: Joi.string().optional(),
  avatar_url: Joi.string().uri().optional(),
});

const passwordChangeSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required(),
});

/**
 * POST /api/v1/users - Create new user
 */
router.post('/', validateRequest(createUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, first_name, last_name, organization_id } = req.body;

    // Check if user exists
    const existing = await userRepository.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await userRepository.createUser({
      email: email.toLowerCase(),
      password_hash,
      first_name,
      last_name,
      organization_id,
    });

    logger.info(`User created: ${user.id}`);

    res.status(201).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users/me - Get current user profile
 */
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const user = await userRepository.getUserWithPermissions(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      organization_id: user.organization_id,
      mfa_enabled: user.mfa_enabled,
      permissions: user.permissions,
      created_at: user.created_at,
      last_login: user.last_login,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users/:id - Get user by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userRepository.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      organization_id: user.organization_id,
      created_at: user.created_at,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/users/me - Update current user profile
 */
router.put('/me', authenticateToken, validateRequest(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const user = await userRepository.updateUser(userId, req.body);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User updated: ${userId}`);

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/me/password - Change password
 */
router.post('/me/password', authenticateToken, validateRequest(passwordChangeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { current_password, new_password } = req.body;

    const user = await userRepository.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    await userRepository.updatePassword(userId, new_password_hash);

    logger.info(`Password changed for user: ${userId}`);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/me/mfa/enable - Enable MFA
 */
router.post('/me/mfa/enable', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { mfa_type } = req.body;

    if (!['totp', 'sms', 'email'].includes(mfa_type)) {
      return res.status(400).json({ error: 'Invalid MFA type' });
    }

    // Generate secret for MFA
    const secret = uuidv4();

    // Enable MFA
    await userRepository.enableMFA(userId, mfa_type, secret);

    logger.info(`MFA enabled for user: ${userId}`);

    res.json({
      mfa_type,
      // In production, return QR code for TOTP
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/me/mfa/disable - Disable MFA
 */
router.post('/me/mfa/disable', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    await userRepository.disableMFA(userId);

    logger.info(`MFA disabled for user: ${userId}`);

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/users/me - Delete current user account
 */
router.delete('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    await userRepository.deleteUser(userId);

    logger.info(`User deleted: ${userId}`);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/users - List all users (admin only)
 */
router.get('/', authenticateToken, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { offset = 0, limit = 50 } = req.query;

    const result = await userRepository.listUsers(
      parseInt(offset as string),
      parseInt(limit as string)
    );

    res.json({
      data: result.users.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        created_at: u.created_at,
      })),
      total: result.total,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/:id/roles - Assign role to user (admin only)
 */
router.post('/:id/roles', authenticateToken, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    const success = await userRepository.assignRole(id, role_id);

    if (!success) {
      return res.status(400).json({ error: 'Failed to assign role' });
    }

    logger.info(`Role assigned to user ${id}: ${role_id}`);

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/users/:id/roles/:roleId - Remove role from user (admin only)
 */
router.delete('/:id/roles/:roleId', authenticateToken, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, roleId } = req.params;

    const success = await userRepository.removeRole(id, roleId);

    if (!success) {
      return res.status(400).json({ error: 'Failed to remove role' });
    }

    logger.info(`Role removed from user ${id}: ${roleId}`);

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/:id/permissions - Grant permission to user (admin only)
 */
router.post('/:id/permissions', authenticateToken, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permission, scope = 'own' } = req.body;

    const success = await userRepository.grantPermission(id, permission, scope);

    if (!success) {
      return res.status(400).json({ error: 'Failed to grant permission' });
    }

    logger.info(`Permission granted to user ${id}: ${permission} (${scope})`);

    res.json({ message: 'Permission granted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/users/:id/permissions/:permission - Revoke permission (admin only)
 */
router.delete('/:id/permissions/:permission', authenticateToken, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, permission } = req.params;
    const { scope } = req.query;

    const success = await userRepository.revokePermission(
      id,
      permission,
      scope as 'own' | 'team' | 'org'
    );

    if (!success) {
      return res.status(400).json({ error: 'Failed to revoke permission' });
    }

    logger.info(`Permission revoked from user ${id}: ${permission}`);

    res.json({ message: 'Permission revoked successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
