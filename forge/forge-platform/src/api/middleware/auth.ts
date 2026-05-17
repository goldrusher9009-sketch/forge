import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../types';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export class AuthMiddleware {
  static verify(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Missing authorization token', 'MISSING_TOKEN');
    }

    try {
      // TODO: Implement JWT verification
      // For now, extract userId from token (simplified)
      req.userId = 'user-id-from-token';
      req.userRole = 'user';
      next();
    } catch (err) {
      throw new ApiError(401, 'Invalid token', 'INVALID_TOKEN');
    }
  }

  static requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.userRole || !roles.includes(req.userRole)) {
        throw new ApiError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      next();
    };
  }
}

export const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  AuthMiddleware.verify(req, res, next);
};

export const requireAdmin = AuthMiddleware.requireRole('admin');
