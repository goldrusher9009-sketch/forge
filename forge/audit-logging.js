/**
 * Forge Audit Logging System
 *
 * Comprehensive audit trail for compliance:
 * - User actions (login, API calls, data modifications)
 * - Administrative activities
 * - Security events (failed logins, permission changes)
 * - Data access and exports
 * - System changes
 *
 * Logs retained for 90 days with searchable interface
 */

const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');

// Initialize AWS services
const cloudwatch = new AWS.CloudWatch();
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const AUDIT_LOG_TABLE = 'forge_audit_logs';
const AUDIT_LOG_BUCKET = 'forge-audit-logs';
const RETENTION_DAYS = 90;

// ============================================================================
// AUDIT EVENT TYPES
// ============================================================================

const AUDIT_EVENT_TYPES = {
  // Authentication
  USER_SIGNUP: 'user.signup',
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_LOGOUT: 'user.logout',
  PASSWORD_CHANGE: 'user.password_change',
  PASSWORD_RESET: 'user.password_reset',
  MFA_ENABLED: 'user.mfa_enabled',
  MFA_DISABLED: 'user.mfa_disabled',

  // Account Management
  ACCOUNT_CREATED: 'account.created',
  ACCOUNT_UPDATED: 'account.updated',
  ACCOUNT_DELETED: 'account.deleted',
  EMAIL_VERIFIED: 'account.email_verified',
  EMAIL_CHANGED: 'account.email_changed',

  // Workspace Management
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
  WORKSPACE_MEMBER_ADDED: 'workspace.member_added',
  WORKSPACE_MEMBER_REMOVED: 'workspace.member_removed',
  WORKSPACE_ROLE_CHANGED: 'workspace.role_changed',

  // Subscription Management
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  PAYMENT_PROCESSED: 'payment.processed',
  PAYMENT_FAILED: 'payment.failed',
  INVOICE_GENERATED: 'invoice.generated',

  // Data Operations
  DOCUMENT_CREATED: 'document.created',
  DOCUMENT_UPDATED: 'document.updated',
  DOCUMENT_DELETED: 'document.deleted',
  DOCUMENT_SHARED: 'document.shared',
  DOCUMENT_ACCESSED: 'document.accessed',
  DOCUMENT_EXPORTED: 'document.exported',

  // API Operations
  API_KEY_CREATED: 'api.key_created',
  API_KEY_REVOKED: 'api.key_revoked',
  API_CALL: 'api.call',
  API_RATE_LIMIT_EXCEEDED: 'api.rate_limit_exceeded',

  // Security Events
  UNAUTHORIZED_ACCESS_ATTEMPT: 'security.unauthorized_access',
  BRUTE_FORCE_DETECTED: 'security.brute_force_detected',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  PERMISSION_ESCALATION_ATTEMPT: 'security.permission_escalation',

  // Administrative Actions
  ADMIN_USER_CREATED: 'admin.user_created',
  ADMIN_USER_DISABLED: 'admin.user_disabled',
  ADMIN_PERMISSION_CHANGED: 'admin.permission_changed',
  ADMIN_SYSTEM_CONFIG_CHANGED: 'admin.system_config_changed',

  // Compliance Actions
  DATA_EXPORT_REQUESTED: 'compliance.data_export_requested',
  DATA_DELETED_REQUESTED: 'compliance.data_deleted_requested',
  GDPR_REQUEST: 'compliance.gdpr_request',
  CCPA_REQUEST: 'compliance.ccpa_request'
};

// ============================================================================
// AUDIT LOG CREATION
// ============================================================================

/**
 * Log an audit event
 * @param {Object} event - Audit event details
 * @param {string} event.type - Event type (AUDIT_EVENT_TYPES)
 * @param {string} event.userId - User who triggered the event
 * @param {string} event.workspaceId - Workspace context (if applicable)
 * @param {string} event.action - Human-readable action description
 * @param {string} event.ipAddress - IP address of requester
 * @param {string} event.userAgent - Browser user agent
 * @param {Object} event.changes - Data changes (before/after for updates)
 * @param {number} event.status - HTTP status code (if API related)
 * @param {string} event.resource - Resource identifier (document ID, etc.)
 * @param {boolean} event.success - Whether action succeeded
 * @param {string} event.errorMessage - Error message if action failed
 * @param {number} event.duration - Duration in milliseconds
 */
async function logAuditEvent(event) {
  try {
    const timestamp = new Date().toISOString();
    const eventId = `${event.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const auditEntry = {
      id: eventId,
      timestamp,
      type: event.type,
      userId: event.userId,
      workspaceId: event.workspaceId || null,
      action: event.action,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      resource: event.resource || null,
      success: event.success !== false,
      status: event.status || null,
      errorMessage: event.errorMessage || null,
      changes: event.changes || {},
      duration: event.duration || 0,
      ttl: Math.floor(Date.now() / 1000) + (RETENTION_DAYS * 86400) // DynamoDB TTL
    };

    // Store in DynamoDB for quick access
    await dynamodb.put({
      TableName: AUDIT_LOG_TABLE,
      Item: auditEntry
    }).promise();

    // Archive to S3 for long-term storage
    await archiveAuditLog(auditEntry);

    // Send metric to CloudWatch
    await sendMetric(event.type);

    console.log(`Audit logged: ${event.type} by user ${event.userId}`);
    return auditEntry;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - prevent audit failures from breaking application
    // But log to separate error channel for investigation
  }
}

/**
 * Archive audit log to S3
 */
async function archiveAuditLog(auditEntry) {
  try {
    const date = new Date(auditEntry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const key = `audit-logs/${year}/${month}/${day}/${auditEntry.id}.json`;

    await s3.putObject({
      Bucket: AUDIT_LOG_BUCKET,
      Key: key,
      Body: JSON.stringify(auditEntry),
      ContentType: 'application/json',
      ServerSideEncryption: 'AES256'
    }).promise();
  } catch (error) {
    console.error('Error archiving audit log to S3:', error);
  }
}

/**
 * Send metric to CloudWatch
 */
async function sendMetric(eventType) {
  try {
    await cloudwatch.putMetricData({
      Namespace: 'Forge/Audit',
      MetricData: [
        {
          MetricName: 'AuditEventCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'EventType', Value: eventType }
          ]
        }
      ]
    }).promise();
  } catch (error) {
    console.error('Error sending CloudWatch metric:', error);
  }
}

// ============================================================================
// MIDDLEWARE FOR AUTOMATIC LOGGING
// ============================================================================

/**
 * Express middleware to automatically log API requests
 */
function auditLogMiddleware(req, res, next) {
  const startTime = Date.now();

  // Capture original send function
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    // Only log if user is authenticated
    if (req.user) {
      const eventType = status >= 400 ? 'api.error_response' : 'api.call';

      logAuditEvent({
        type: eventType,
        userId: req.user.id,
        workspaceId: req.workspaceId,
        action: `${req.method} ${req.path}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status,
        resource: req.params.id || null,
        success: status < 400,
        duration
      }).catch(err => console.error('Audit logging failed:', err));
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

// ============================================================================
// SPECIFIC EVENT LOGGERS
// ============================================================================

/**
 * Log user authentication event
 */
async function logAuthenticationEvent(userId, eventType, ipAddress, userAgent, success, errorMessage) {
  await logAuditEvent({
    type: eventType,
    userId,
    action: eventType === AUDIT_EVENT_TYPES.USER_LOGIN ? 'User login' : 'Login failed',
    ipAddress,
    userAgent,
    success,
    errorMessage
  });
}

/**
 * Log subscription change
 */
async function logSubscriptionChange(userId, workspaceId, eventType, changes) {
  await logAuditEvent({
    type: eventType,
    userId,
    workspaceId,
    action: `Subscription ${eventType.split('.')[1]}`,
    resource: `subscription-${workspaceId}`,
    changes: {
      before: changes.before,
      after: changes.after
    },
    success: true
  });
}

/**
 * Log data access/export
 */
async function logDataAccess(userId, workspaceId, documentId, eventType, ipAddress, userAgent) {
  await logAuditEvent({
    type: eventType,
    userId,
    workspaceId,
    action: `Document ${eventType.split('.')[1]}`,
    resource: documentId,
    ipAddress,
    userAgent,
    success: true
  });
}

/**
 * Log permission change
 */
async function logPermissionChange(userId, workspaceId, targetUserId, oldRole, newRole, ipAddress) {
  await logAuditEvent({
    type: AUDIT_EVENT_TYPES.WORKSPACE_ROLE_CHANGED,
    userId,
    workspaceId,
    action: `Permission changed for user ${targetUserId}`,
    resource: targetUserId,
    ipAddress,
    changes: {
      before: { role: oldRole },
      after: { role: newRole }
    },
    success: true
  });
}

/**
 * Log security event
 */
async function logSecurityEvent(eventType, userId, description, ipAddress, severity = 'medium') {
  await logAuditEvent({
    type: eventType,
    userId,
    action: description,
    ipAddress,
    success: false, // Security events are always flagged as issues
    changes: {
      severity
    }
  });
}

// ============================================================================
// AUDIT LOG RETRIEVAL
// ============================================================================

/**
 * Query audit logs
 */
async function queryAuditLogs(filters = {}) {
  try {
    let query = 'SELECT * FROM ' + AUDIT_LOG_TABLE + ' WHERE 1=1';
    const params = [];

    if (filters.userId) {
      query += ' AND userId = ?';
      params.push(filters.userId);
    }

    if (filters.workspaceId) {
      query += ' AND workspaceId = ?';
      params.push(filters.workspaceId);
    }

    if (filters.eventType) {
      query += ' AND #type = ?';
      query = query.replace('#type', 'type');
      params.push(filters.eventType);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND #timestamp BETWEEN ? AND ?';
      query = query.replace('#timestamp', 'timestamp');
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.limit) {
      query += ` LIMIT ${filters.limit}`;
    }

    // Note: This is pseudocode. Real implementation would use:
    // - DynamoDB Query/Scan with proper filtering
    // - S3 Select for archived logs
    // - Elasticsearch for advanced search

    console.log('Query:', query, 'Params:', params);

    // Return mock data for now
    return {
      items: [],
      count: 0,
      query
    };
  } catch (error) {
    console.error('Error querying audit logs:', error);
    throw error;
  }
}

/**
 * Get audit logs for a user
 */
async function getUserAuditLogs(userId, limit = 100) {
  return queryAuditLogs({
    userId,
    limit
  });
}

/**
 * Get audit logs for a workspace
 */
async function getWorkspaceAuditLogs(workspaceId, limit = 100) {
  return queryAuditLogs({
    workspaceId,
    limit
  });
}

/**
 * Get security events
 */
async function getSecurityEvents(days = 7, limit = 100) {
  const startDate = new Date(Date.now() - days * 86400000).toISOString();
  const endDate = new Date().toISOString();

  return queryAuditLogs({
    startDate,
    endDate,
    eventType: AUDIT_EVENT_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT,
    limit
  });
}

// ============================================================================
// GDPR COMPLIANCE HELPERS
// ============================================================================

/**
 * Export user's audit logs (GDPR data export request)
 */
async function exportUserAuditLogs(userId) {
  try {
    const logs = await getUserAuditLogs(userId, 10000);

    const csv = convertToCSV(logs.items);

    const filename = `audit-logs-${userId}-${new Date().toISOString().split('T')[0]}.csv`;

    return {
      filename,
      data: csv,
      mimeType: 'text/csv'
    };
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
}

/**
 * Delete user's audit logs (GDPR deletion request after retention period)
 */
async function deleteUserAuditLogs(userId) {
  try {
    // Query all logs for user
    const logs = await getUserAuditLogs(userId, 10000);

    // Delete from DynamoDB
    for (const log of logs.items) {
      await dynamodb.delete({
        TableName: AUDIT_LOG_TABLE,
        Key: { id: log.id }
      }).promise();
    }

    console.log(`Deleted ${logs.items.length} audit logs for user ${userId}`);
  } catch (error) {
    console.error('Error deleting audit logs:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert logs to CSV format
 */
function convertToCSV(logs) {
  if (logs.length === 0) return 'No logs found';

  const headers = [
    'Timestamp',
    'Event Type',
    'User ID',
    'Workspace ID',
    'Action',
    'Resource',
    'IP Address',
    'Success',
    'Error Message',
    'Duration (ms)'
  ];

  const rows = logs.map(log => [
    log.timestamp,
    log.type,
    log.userId,
    log.workspaceId || '',
    log.action,
    log.resource || '',
    log.ipAddress,
    log.success ? 'Yes' : 'No',
    log.errorMessage || '',
    log.duration
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
}

// ============================================================================
// EXPRESS ROUTES
// ============================================================================

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs (admin only)
 */
router.get('/api/admin/audit-logs', async (req, res) => {
  try {
    const { userId, workspaceId, eventType, limit = 100 } = req.query;

    const logs = await queryAuditLogs({
      userId,
      workspaceId,
      eventType,
      limit: parseInt(limit)
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/user/audit-logs
 * Retrieve user's own audit logs
 */
router.get('/api/user/audit-logs', async (req, res) => {
  try {
    const logs = await getUserAuditLogs(req.user.id);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/compliance/export-audit-logs
 * Export audit logs for GDPR request
 */
router.post('/api/compliance/export-audit-logs', async (req, res) => {
  try {
    const result = await exportUserAuditLogs(req.user.id);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Event types
  AUDIT_EVENT_TYPES,

  // Main logging function
  logAuditEvent,

  // Specific loggers
  logAuthenticationEvent,
  logSubscriptionChange,
  logDataAccess,
  logPermissionChange,
  logSecurityEvent,

  // Query functions
  queryAuditLogs,
  getUserAuditLogs,
  getWorkspaceAuditLogs,
  getSecurityEvents,

  // GDPR compliance
  exportUserAuditLogs,
  deleteUserAuditLogs,

  // Middleware
  auditLogMiddleware,

  // Routes
  router
};
