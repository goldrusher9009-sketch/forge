import { EventEmitter } from 'events';
import { EncryptionService } from '../crypto/encryption.service';

/**
 * Audit event types for comprehensive platform tracking
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_CHALLENGE = 'MFA_CHALLENGE',

  // User management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_PERMISSION_GRANTED = 'USER_PERMISSION_GRANTED',
  USER_PERMISSION_REVOKED = 'USER_PERMISSION_REVOKED',

  // Workflow events
  WORKFLOW_CREATED = 'WORKFLOW_CREATED',
  WORKFLOW_UPDATED = 'WORKFLOW_UPDATED',
  WORKFLOW_DELETED = 'WORKFLOW_DELETED',
  WORKFLOW_EXECUTED = 'WORKFLOW_EXECUTED',
  WORKFLOW_EXECUTION_FAILED = 'WORKFLOW_EXECUTION_FAILED',
  WORKFLOW_PAUSED = 'WORKFLOW_PAUSED',
  WORKFLOW_RESUMED = 'WORKFLOW_RESUMED',

  // Agent events
  AGENT_CREATED = 'AGENT_CREATED',
  AGENT_UPDATED = 'AGENT_UPDATED',
  AGENT_DELETED = 'AGENT_DELETED',
  AGENT_TRAINED = 'AGENT_TRAINED',
  AGENT_DEPLOYED = 'AGENT_DEPLOYED',

  // API Key events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  API_KEY_ROTATED = 'API_KEY_ROTATED',

  // Authorization events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // System events
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  DATABASE_MIGRATED = 'DATABASE_MIGRATED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

/**
 * Audit log severity levels
 */
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string;
  userAgent: string;
  resource: {
    type: string; // 'user', 'workflow', 'agent', 'api_key', etc.
    id: string;
    name?: string;
  };
  action: string; // Detailed action description
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  status: 'success' | 'failure';
  errorMessage?: string;
  additionalData?: Record<string, any>;
}

/**
 * AuditService: Comprehensive audit logging for compliance and security monitoring
 * Uses EventEmitter pattern for async processing and optional encryption for sensitive data
 */
export class AuditService extends EventEmitter {
  private static instance: AuditService;
  private encryptionService?: EncryptionService;
  private enableEncryption: boolean;
  private auditLog: AuditLogEntry[] = [];
  private maxLogSize: number = 10000; // In-memory limit before external persistence

  private constructor() {
    super();
    this.enableEncryption = process.env.ENCRYPT_AUDIT_LOGS === 'true';
    
    if (this.enableEncryption && process.env.ENCRYPTION_KEY) {
      try {
        this.encryptionService = new EncryptionService(
          Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
        );
      } catch (error) {
        console.warn('Failed to initialize encryption for audit logs:', error);
        this.enableEncryption = false;
      }
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit event
   */
  public async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date(),
    };

    try {
      // Encrypt sensitive data if enabled
      if (this.enableEncryption && this.encryptionService) {
        const sensitiveFields = ['changes', 'additionalData', 'errorMessage'];
        const encryptedEntry = { ...auditEntry };

        for (const field of sensitiveFields) {
          if (encryptedEntry[field as keyof AuditLogEntry]) {
            encryptedEntry[field as keyof AuditLogEntry] = 
              this.encryptionService.encryptAuditLog(
                encryptedEntry[field as keyof AuditLogEntry] as any,
                entry.userId || 'system'
              ) as any;
          }
        }

        this.auditLog.push(encryptedEntry);
      } else {
        this.auditLog.push(auditEntry);
      }

      // Maintain max log size
      if (this.auditLog.length > this.maxLogSize) {
        this.auditLog = this.auditLog.slice(-this.maxLogSize);
      }

      // Emit event for potential external handlers (logging service, database, etc.)
      this.emit('audit', auditEntry);

      // Log critical events to console
      if (auditEntry.severity === AuditSeverity.CRITICAL) {
        console.warn(`🚨 AUDIT ALERT [${auditEntry.eventType}]:`, {
          user: auditEntry.userEmail,
          resource: auditEntry.resource,
          action: auditEntry.action,
          timestamp: auditEntry.timestamp,
        });
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit failures shouldn't crash the application
    }
  }

  /**
   * Convenience method for successful operations
   */
  public async logSuccess(
    eventType: AuditEventType,
    userId: string | null,
    userEmail: string | null,
    ipAddress: string,
    userAgent: string,
    resource: AuditLogEntry['resource'],
    action: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      resource,
      action,
      status: 'success',
      additionalData,
    });
  }

  /**
   * Convenience method for failed operations
   */
  public async logFailure(
    eventType: AuditEventType,
    userId: string | null,
    userEmail: string | null,
    ipAddress: string,
    userAgent: string,
    resource: AuditLogEntry['resource'],
    action: string,
    errorMessage: string,
    severity: AuditSeverity = AuditSeverity.WARNING
  ): Promise<void> {
    await this.log({
      eventType,
      severity,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      resource,
      action,
      status: 'failure',
      errorMessage,
    });
  }

  /**
   * Convenience method for tracked changes
   */
  public async logChanges(
    eventType: AuditEventType,
    userId: string | null,
    userEmail: string | null,
    ipAddress: string,
    userAgent: string,
    resource: AuditLogEntry['resource'],
    action: string,
    before: Record<string, any>,
    after: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: AuditSeverity.INFO,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      resource,
      action,
      status: 'success',
      changes: { before, after },
    });
  }

  /**
   * Get audit logs with optional filtering
   */
  public getLogs(
    filter?: {
      eventType?: AuditEventType;
      userId?: string;
      severity?: AuditSeverity;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): AuditLogEntry[] {
    let results = [...this.auditLog];

    if (filter?.eventType) {
      results = results.filter(entry => entry.eventType === filter.eventType);
    }

    if (filter?.userId) {
      results = results.filter(entry => entry.userId === filter.userId);
    }

    if (filter?.severity) {
      results = results.filter(entry => entry.severity === filter.severity);
    }

    if (filter?.startDate) {
      results = results.filter(entry => entry.timestamp >= filter.startDate!);
    }

    if (filter?.endDate) {
      results = results.filter(entry => entry.timestamp <= filter.endDate!);
    }

    const limit = filter?.limit || 100;
    return results.slice(-limit);
  }

  /**
   * Get audit summary statistics
   */
  public getSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    lastEvent: AuditLogEntry | null;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    for (const entry of this.auditLog) {
      eventsByType[entry.eventType] = (eventsByType[entry.eventType] || 0) + 1;
      eventsBySeverity[entry.severity] = (eventsBySeverity[entry.severity] || 0) + 1;
    }

    return {
      totalEvents: this.auditLog.length,
      eventsByType,
      eventsBySeverity,
      lastEvent: this.auditLog[this.auditLog.length - 1] || null,
    };
  }

  /**
   * Clear old logs (for maintenance)
   */
  public clearOldLogs(olderThanDays: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const initialLength = this.auditLog.length;
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffDate);

    return initialLength - this.auditLog.length;
  }

  /**
   * Generate a unique ID for audit entries
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Audit middleware factory for Express
 */
export function createAuditMiddleware() {
  const auditService = AuditService.getInstance();

  return (req: any, res: any, next: any) => {
    // Capture response
    const originalSend = res.send;
    res.send = function (data: any) {
      res.send = originalSend;

      // Only audit non-GET requests and API endpoints
      if (req.method !== 'GET' && req.path.startsWith('/api/')) {
        const statusCode = res.statusCode;
        const success = statusCode >= 200 && statusCode < 300;

        auditService.log({
          eventType: success ? AuditEventType.ERROR_OCCURRED : AuditEventType.SYSTEM_CONFIG_CHANGED,
          severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
          userId: req.user?.id || null,
          userEmail: req.user?.email || null,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          resource: {
            type: 'api_request',
            id: req.path,
          },
          action: `${req.method} ${req.path}`,
          status: success ? 'success' : 'failure',
          additionalData: {
            statusCode,
            duration: Date.now() - (req.startTime || Date.now()),
          },
        }).catch(error => console.error('Audit log error:', error));
      }

      return res.send(data);
    };

    req.startTime = Date.now();
    next();
  };
}

export default AuditService;
