/**
 * Authentication Middleware
 * Handles JWT token validation, refresh token rotation, and user context attachment
 * 
 * Features:
 * - Access token validation (15-minute expiration)
 * - Automatic token refresh with rotation
 * - Secure refresh token handling (7-day expiration)
 * - Error-specific responses for expired/invalid tokens
 * - Request user context injection
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'user' | 'admin' | 'agent' | 'service';
        permissions: string[];
      };
    }
  }
}

interface TokenPayload {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'agent' | 'service';
  permissions: string[];
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  private readonly accessTokenSecret = process.env.JWT_SECRET || 'your-256-bit-secret-key';
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-256-bit-refresh-secret';
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  /**
   * Main authentication middleware
   * Validates access token and attempts refresh if expired
   */
  authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: 'Missing or invalid authorization header',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      const token = authHeader.substring(7);

      try {
        // Try to verify access token
        const decoded = jwt.verify(token, this.accessTokenSecret) as TokenPayload;
        
        if (decoded.type !== 'access') {
          return res.status(401).json({
            success: false,
            error: {
              code: 'AUTHENTICATION_FAILED',
              message: 'Invalid token type',
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        }

        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions
        };

        next();
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          // Token expired - try refresh token from cookies/headers
          const refreshToken = req.cookies?.refreshToken || 
                              req.headers['x-refresh-token'];
          
          if (!refreshToken) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'TOKEN_EXPIRED',
                message: 'Access token expired. Please refresh your token.',
                timestamp: new Date().toISOString(),
                requestId: req.id
              }
            });
          }

          // Verify refresh token
          try {
            const refreshPayload = jwt.verify(
              refreshToken,
              this.refreshTokenSecret
            ) as TokenPayload;

            if (refreshPayload.type !== 'refresh') {
              throw new Error('Invalid refresh token type');
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
              {
                id: refreshPayload.id,
                email: refreshPayload.email,
                role: refreshPayload.role,
                permissions: refreshPayload.permissions,
                type: 'access'
              },
              this.accessTokenSecret,
              { expiresIn: this.accessTokenExpiry }
            );

            // Optionally generate new refresh token (token rotation)
            const newRefreshToken = jwt.sign(
              {
                id: refreshPayload.id,
                email: refreshPayload.email,
                role: refreshPayload.role,
                permissions: refreshPayload.permissions,
                type: 'refresh'
              },
              this.refreshTokenSecret,
              { expiresIn: this.refreshTokenExpiry }
            );

            // Set tokens in response headers
            res.setHeader('X-Access-Token', newAccessToken);
            res.setHeader('X-Refresh-Token', newRefreshToken);
            res.cookie('refreshToken', newRefreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Attach user context
            req.user = {
              id: refreshPayload.id,
              email: refreshPayload.email,
              role: refreshPayload.role,
              permissions: refreshPayload.permissions
            };

            next();
          } catch (refreshError) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Refresh token is invalid or expired',
                timestamp: new Date().toISOString(),
                requestId: req.id
              }
            });
          }
        } else if (error instanceof jwt.JsonWebTokenError) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Token is invalid or malformed',
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication processing failed',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  };

  /**
   * Generate access token for user
   */
  generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      this.accessTokenSecret,
      { expiresIn: this.accessTokenExpiry }
    );
  }

  /**
   * Generate refresh token for user
   */
  generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );
  }

  /**
   * Verify and decode token without throwing
   */
  verifyToken(token: string, type: 'access' | 'refresh' = 'access'): TokenPayload | null {
    try {
      const secret = type === 'access' ? this.accessTokenSecret : this.refreshTokenSecret;
      const decoded = jwt.verify(token, secret) as TokenPayload;
      
      if (decoded.type !== type) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Optional: Middleware that doesn't require auth (for public endpoints)
   * Attaches user if token present, continues if not
   */
  optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No auth - continue without user context
        return next();
      }

      const token = authHeader.substring(7);
      const decoded = this.verifyToken(token, 'access');

      if (decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions
        };
      }

      next();
    } catch (error) {
      // Silent fail - continue without user
      next();
    }
  };
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();
