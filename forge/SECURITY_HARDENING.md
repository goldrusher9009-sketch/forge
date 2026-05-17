# Forge Platform - Security Hardening Guide

**Version:** 1.0  
**Date:** May 6, 2026  
**Status:** In Implementation

---

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [API Security](#api-security)
3. [Data Protection](#data-protection)
4. [Infrastructure Security](#infrastructure-security)
5. [Security Headers](#security-headers)
6. [Input Validation](#input-validation)
7. [Secrets Management](#secrets-management)
8. [Compliance & Auditing](#compliance--auditing)

---

## Authentication & Authorization

### JWT Token Management

**Current State:** Basic token handling  
**Target State:** Production-grade JWT with refresh tokens

```typescript
// src/auth/jwt.ts
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'agent';
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export class JWTManager {
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      algorithm: 'HS256',
      issuer: 'forge-platform',
      audience: 'forge-api'
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(userId: string, tokenVersion: number): string {
    return jwt.sign(
      { userId, tokenVersion },
      this.refreshTokenSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        algorithm: 'HS256',
        issuer: 'forge-platform',
        jwtid: randomBytes(16).toString('hex')
      }
    );
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
        issuer: 'forge-platform',
        audience: 'forge-api'
      }) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256'],
        issuer: 'forge-platform'
      }) as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for claims inspection)
   */
  decodeToken(token: string): any {
    return jwt.decode(token, { complete: true });
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// src/auth/rbac.ts

export enum Role {
  USER = 'user',
  ADMIN = 'admin',
  AGENT = 'agent',
  SERVICE = 'service'
}

export enum Permission {
  // User permissions
  READ_OWN_PROFILE = 'read:own_profile',
  UPDATE_OWN_PROFILE = 'update:own_profile',
  DELETE_OWN_ACCOUNT = 'delete:own_account',

  // Workflow permissions
  CREATE_WORKFLOW = 'create:workflow',
  READ_WORKFLOW = 'read:workflow',
  UPDATE_WORKFLOW = 'update:workflow',
  DELETE_WORKFLOW = 'delete:workflow',
  EXECUTE_WORKFLOW = 'execute:workflow',

  // Agent permissions
  MANAGE_AGENTS = 'manage:agents',
  VIEW_AGENT_LOGS = 'view:agent_logs',
  CONTROL_AGENTS = 'control:agents',

  // Admin permissions
  MANAGE_USERS = 'manage:users',
  VIEW_AUDIT_LOG = 'view:audit_log',
  MANAGE_SYSTEM = 'manage:system',
  VIEW_METRICS = 'view:metrics'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.CREATE_WORKFLOW,
    Permission.READ_WORKFLOW,
    Permission.UPDATE_WORKFLOW,
    Permission.DELETE_WORKFLOW,
    Permission.EXECUTE_WORKFLOW
  ],
  [Role.ADMIN]: [
    ...Object.values(Permission)
  ],
  [Role.AGENT]: [
    Permission.READ_WORKFLOW,
    Permission.EXECUTE_WORKFLOW,
    Permission.VIEW_AGENT_LOGS
  ],
  [Role.SERVICE]: [
    Permission.READ_WORKFLOW,
    Permission.EXECUTE_WORKFLOW
  ]
};

export class RBACManager {
  hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role].includes(permission);
  }

  hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(role, p));
  }

  hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(role, p));
  }
}
```

---

## API Security

### Rate Limiting

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../lib/redis';

// Global rate limiter
export const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:global:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin'
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// Per-user rate limiter for API
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:api:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    // Allow more requests for premium users
    if (req.user?.tier === 'premium') return 500;
    return 100;
  },
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'API rate limit exceeded'
});
```

### CORS Configuration

```typescript
// src/middleware/cors.ts
import cors from 'cors';

export const corsMiddleware = cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
});
```

---

## Data Protection

### Password Hashing

```typescript
// src/auth/password.ts
import bcrypt from 'bcrypt';

export class PasswordManager {
  private readonly saltRounds = 12;

  /**
   * Hash password with bcrypt
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one digit');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### Encryption for Sensitive Data

```typescript
// src/lib/encryption.ts
import crypto from 'crypto';

export class EncryptionManager {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash data for comparison (non-reversible)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
```

---

## Infrastructure Security

### Helmet Security Headers

```typescript
// src/middleware/helmet.ts
import helmet from 'helmet';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", process.env.API_URL!],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});
```

### HTTPS Enforcement

```typescript
// src/middleware/https.ts
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(301, `https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
};
```

---

## Input Validation

### Zod Schema Validation

```typescript
// src/schemas/validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const workflowSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  steps: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['agent', 'condition', 'loop', 'action']),
    config: z.record(z.unknown())
  })),
  triggers: z.array(z.string()).optional()
});

export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
};
```

---

## Secrets Management

### Environment Configuration

```bash
# .env.example
# JWT Secrets (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Encryption Key (must be 32 bytes hex: openssl rand -hex 32)
ENCRYPTION_KEY=your_encryption_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/forge
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000

# Redis
REDIS_URL=redis://localhost:6379

# API Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_URL=https://forge.yourdomain.com
API_URL=https://api.forge.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
NODE_ENV=production
SESSION_SECRET=your_session_secret_here

# Logging
LOG_LEVEL=info
```

### Secret Rotation

```typescript
// src/lib/secretRotation.ts
export class SecretRotationManager {
  /**
   * Rotate JWT secrets
   * Old tokens remain valid until their expiry
   */
  async rotateJWTSecrets(): Promise<void> {
    const oldSecret = process.env.JWT_ACCESS_SECRET;
    const newSecret = generateRandomSecret();

    // Store old secret in separate key for validation period
    await this.storeOldSecret('jwt_access', oldSecret);

    // Update environment
    process.env.JWT_ACCESS_SECRET = newSecret;

    // Persist to secret manager
    await this.persistToSecretManager('JWT_ACCESS_SECRET', newSecret);

    console.log('JWT secrets rotated successfully');
  }

  /**
   * Rotate encryption key
   * All encrypted data needs to be re-encrypted
   */
  async rotateEncryptionKey(): Promise<void> {
    const oldKey = process.env.ENCRYPTION_KEY!;
    const newKey = generateRandomSecret();

    // Re-encrypt all sensitive data
    const sensitiveRecords = await db.query(
      'SELECT * FROM sensitive_data WHERE encrypted = true'
    );

    for (const record of sensitiveRecords) {
      const decrypted = decrypt(record.data, oldKey);
      const reEncrypted = encrypt(decrypted, newKey);

      await db.update('sensitive_data')
        .set({ data: reEncrypted })
        .where({ id: record.id });
    }

    process.env.ENCRYPTION_KEY = newKey;
    await this.persistToSecretManager('ENCRYPTION_KEY', newKey);
  }
}
```

---

## Compliance & Auditing

### Audit Logging

```typescript
// src/middleware/auditLog.ts
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  error?: string;
  timestamp: Date;
}

export class AuditLogger {
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: generateUUID(),
      timestamp: new Date()
    };

    // Store in database
    await db.table('audit_logs').insert(auditEntry);

    // Stream to SIEM if configured
    if (process.env.SIEM_ENDPOINT) {
      await this.streamToSIEM(auditEntry);
    }

    // Emit event for monitoring
    eventBus.emit('audit:logged', auditEntry);
  }

  async getAuditTrail(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return db.table('audit_logs')
      .where('userId', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }
}

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function(data) {
    auditLogger.log({
      userId: req.user?.id || 'anonymous',
      action: `${req.method} ${req.path}`,
      resource: req.baseUrl,
      resourceId: req.params.id || 'N/A',
      changes: req.body || {},
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      status: res.statusCode < 400 ? 'success' : 'failure'
    }).catch(err => console.error('Audit log failed:', err));

    return originalJson.call(this, data);
  };

  next();
};
```

---

## Implementation Checklist

- [ ] Update package.json with security dependencies
- [ ] Implement JWT authentication with refresh tokens
- [ ] Set up RBAC system with permissions
- [ ] Configure rate limiting middleware
- [ ] Implement CORS configuration
- [ ] Add Helmet security headers
- [ ] Set up password hashing and validation
- [ ] Implement encryption for sensitive data
- [ ] Add input validation with Zod
- [ ] Configure secrets management
- [ ] Set up audit logging
- [ ] Create security headers middleware
- [ ] Implement HTTPS enforcement
- [ ] Add database encryption
- [ ] Set up secret rotation procedures
- [ ] Create security testing suite
- [ ] Document all security measures

---

## Next Steps

1. Install security dependencies in package.json
2. Implement JWT and authentication middleware
3. Set up RBAC system
4. Configure rate limiting
5. Add security headers and HTTPS enforcement
6. Create audit logging system

