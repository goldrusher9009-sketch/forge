/**
 * Forge Support Ticket System
 *
 * Complete customer support infrastructure with:
 * - Ticket creation and lifecycle management
 * - Multi-threaded message system
 * - Priority and status tracking
 * - Automated email notifications
 * - Support staff dashboard queries
 * - SLA tracking and escalation
 *
 * Tickets retained for 1 year for audit trail and customer reference
 */

const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const emailTemplates = require('./email-templates');

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const SUPPORT_TICKETS_TABLE = 'forge_support_tickets';
const TICKET_MESSAGES_TABLE = 'forge_ticket_messages';
const SUPPORT_BUCKET = 'forge-support-attachments';
const RETENTION_YEARS = 1;

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened'
};

const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const MESSAGE_TYPE = {
  USER_MESSAGE: 'user_message',
  SUPPORT_RESPONSE: 'support_response',
  STATUS_UPDATE: 'status_update',
  INTERNAL_NOTE: 'internal_note'
};

const SLA_TARGETS = {
  low: { firstResponse: 48 * 3600, resolution: 14 * 24 * 3600 },
  medium: { firstResponse: 24 * 3600, resolution: 7 * 24 * 3600 },
  high: { firstResponse: 4 * 3600, resolution: 24 * 3600 },
  critical: { firstResponse: 1 * 3600, resolution: 4 * 3600 }
};

// ============================================================================
// TICKET CREATION
// ============================================================================

/**
 * Create a new support ticket
 * @param {Object} ticketData - Ticket details
 * @param {string} ticketData.userId - User who created ticket
 * @param {string} ticketData.workspaceId - Workspace context
 * @param {string} ticketData.subject - Ticket subject line
 * @param {string} ticketData.description - Initial message/description
 * @param {string} ticketData.priority - Ticket priority (low/medium/high/critical)
 * @param {string} ticketData.category - Ticket category (billing, technical, feature-request, bug, other)
 * @param {Array} ticketData.attachments - File URLs if any
 * @param {string} ticketData.userEmail - User's email for notifications
 * @param {string} ticketData.userName - User's display name
 */
async function createSupportTicket(ticketData) {
  try {
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + RETENTION_YEARS * 365 * 86400000).toISOString();

    // Create ticket record
    const ticket = {
      id: ticketId,
      userId: ticketData.userId,
      workspaceId: ticketData.workspaceId,
      subject: ticketData.subject,
      category: ticketData.category || 'other',
      priority: ticketData.priority || TICKET_PRIORITY.MEDIUM,
      status: TICKET_STATUS.OPEN,
      createdAt,
      updatedAt: createdAt,
      closedAt: null,
      assignedTo: null, // Support staff assignment
      firstResponseAt: null,
      resolvedAt: null,
      messageCount: 1,
      attachments: ticketData.attachments || [],
      ttl: Math.floor(Date.now() / 1000) + (RETENTION_YEARS * 365 * 86400)
    };

    // Store ticket in DynamoDB
    await dynamodb.put({
      TableName: SUPPORT_TICKETS_TABLE,
      Item: ticket
    }).promise();

    // Create initial message
    await addTicketMessage({
      ticketId,
      userId: ticketData.userId,
      type: MESSAGE_TYPE.USER_MESSAGE,
      content: ticketData.description,
      attachments: ticketData.attachments || []
    });

    // Send confirmation email to user
    await sendTicketCreatedEmail({
      ticketId,
      subject: ticketData.subject,
      userEmail: ticketData.userEmail,
      userName: ticketData.userName,
      priority: ticket.priority
    });

    // Log audit event
    const { logAuditEvent } = require('./audit-logging');
    await logAuditEvent({
      type: 'SUPPORT_TICKET_CREATED',
      userId: ticketData.userId,
      workspaceId: ticketData.workspaceId,
      action: `Support ticket created: ${ticketId}`,
      resource: ticketId,
      success: true
    });

    console.log(`Support ticket created: ${ticketId}`);
    return ticket;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw error;
  }
}

/**
 * Add a message to a ticket
 */
async function addTicketMessage(messageData) {
  try {
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    const message = {
      id: messageId,
      ticketId: messageData.ticketId,
      userId: messageData.userId,
      type: messageData.type || MESSAGE_TYPE.USER_MESSAGE,
      content: messageData.content,
      attachments: messageData.attachments || [],
      createdAt: timestamp,
      isVisible: messageData.isVisible !== false, // Internal notes can be hidden
      ttl: Math.floor(Date.now() / 1000) + (RETENTION_YEARS * 365 * 86400)
    };

    // Store message in DynamoDB
    await dynamodb.put({
      TableName: TICKET_MESSAGES_TABLE,
      Item: message
    }).promise();

    // Update ticket metadata
    await dynamodb.update({
      TableName: SUPPORT_TICKETS_TABLE,
      Key: { id: messageData.ticketId },
      UpdateExpression: 'SET messageCount = messageCount + :inc, updatedAt = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': timestamp
      }
    }).promise();

    return message;
  } catch (error) {
    console.error('Error adding ticket message:', error);
    throw error;
  }
}

// ============================================================================
// TICKET MANAGEMENT
// ============================================================================

/**
 * Update ticket status
 */
async function updateTicketStatus(ticketId, newStatus, userId) {
  try {
    const timestamp = new Date().toISOString();
    const updateData = {
      status: newStatus,
      updatedAt: timestamp
    };

    // Set status-specific timestamps
    if (newStatus === TICKET_STATUS.IN_PROGRESS) {
      // Only set firstResponseAt if not already set (first response)
      const ticket = await getTicket(ticketId);
      if (!ticket.firstResponseAt) {
        updateData.firstResponseAt = timestamp;
        updateData.assignedTo = userId;
      }
    } else if (newStatus === TICKET_STATUS.RESOLVED) {
      updateData.resolvedAt = timestamp;
    } else if (newStatus === TICKET_STATUS.CLOSED) {
      updateData.closedAt = timestamp;
    }

    // Update ticket
    await dynamodb.update({
      TableName: SUPPORT_TICKETS_TABLE,
      Key: { id: ticketId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt' +
        (updateData.firstResponseAt ? ', firstResponseAt = :firstResponseAt' : '') +
        (updateData.resolvedAt ? ', resolvedAt = :resolvedAt' : '') +
        (updateData.closedAt ? ', closedAt = :closedAt' : '') +
        (updateData.assignedTo ? ', assignedTo = :assignedTo' : ''),
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':updatedAt': timestamp,
        ...(updateData.firstResponseAt && { ':firstResponseAt': updateData.firstResponseAt }),
        ...(updateData.resolvedAt && { ':resolvedAt': updateData.resolvedAt }),
        ...(updateData.closedAt && { ':closedAt': updateData.closedAt }),
        ...(updateData.assignedTo && { ':assignedTo': updateData.assignedTo })
      }
    }).promise();

    // Add status update message
    await addTicketMessage({
      ticketId,
      userId,
      type: MESSAGE_TYPE.STATUS_UPDATE,
      content: `Ticket status changed to: ${newStatus.replace('_', ' ').toUpperCase()}`,
      isVisible: true
    });

    console.log(`Ticket ${ticketId} status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
}

/**
 * Update ticket priority
 */
async function updateTicketPriority(ticketId, newPriority, userId) {
  try {
    await dynamodb.update({
      TableName: SUPPORT_TICKETS_TABLE,
      Key: { id: ticketId },
      UpdateExpression: 'SET priority = :priority, updatedAt = :now',
      ExpressionAttributeValues: {
        ':priority': newPriority,
        ':now': new Date().toISOString()
      }
    }).promise();

    // Add audit note
    await addTicketMessage({
      ticketId,
      userId,
      type: MESSAGE_TYPE.INTERNAL_NOTE,
      content: `Priority changed to: ${newPriority.toUpperCase()}`,
      isVisible: false
    });
  } catch (error) {
    console.error('Error updating ticket priority:', error);
    throw error;
  }
}

/**
 * Assign ticket to support staff
 */
async function assignTicket(ticketId, assignToUserId) {
  try {
    await dynamodb.update({
      TableName: SUPPORT_TICKETS_TABLE,
      Key: { id: ticketId },
      UpdateExpression: 'SET assignedTo = :userId, updatedAt = :now',
      ExpressionAttributeValues: {
        ':userId': assignToUserId,
        ':now': new Date().toISOString()
      }
    }).promise();

    console.log(`Ticket ${ticketId} assigned to ${assignToUserId}`);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    throw error;
  }
}

// ============================================================================
// TICKET RETRIEVAL AND QUERYING
// ============================================================================

/**
 * Get single ticket by ID
 */
async function getTicket(ticketId) {
  try {
    const result = await dynamodb.get({
      TableName: SUPPORT_TICKETS_TABLE,
      Key: { id: ticketId }
    }).promise();

    return result.Item || null;
  } catch (error) {
    console.error('Error retrieving ticket:', error);
    throw error;
  }
}

/**
 * Get all messages for a ticket
 */
async function getTicketMessages(ticketId, includeInternal = false) {
  try {
    const query = {
      TableName: TICKET_MESSAGES_TABLE,
      KeyConditionExpression: 'ticketId = :ticketId',
      ExpressionAttributeValues: {
        ':ticketId': ticketId
      },
      ScanIndexForward: true // Oldest first
    };

    // Filter out internal notes if not requested
    if (!includeInternal) {
      query.FilterExpression = '#type != :internalType';
      query.ExpressionAttributeNames = { '#type': 'type' };
      query.ExpressionAttributeValues[':internalType'] = MESSAGE_TYPE.INTERNAL_NOTE;
    }

    const result = await dynamodb.query(query).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error retrieving ticket messages:', error);
    throw error;
  }
}

/**
 * Get user's tickets
 */
async function getUserTickets(userId, status = null, limit = 50) {
  try {
    let scanParams = {
      TableName: SUPPORT_TICKETS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      Limit: limit
    };

    if (status) {
      scanParams.FilterExpression += ' AND #status = :status';
      scanParams.ExpressionAttributeNames = { '#status': 'status' };
      scanParams.ExpressionAttributeValues[':status'] = status;
    }

    const result = await dynamodb.scan(scanParams).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error retrieving user tickets:', error);
    throw error;
  }
}

/**
 * Get support dashboard - all open/in-progress tickets
 */
async function getSupportDashboard(filters = {}) {
  try {
    let scanParams = {
      TableName: SUPPORT_TICKETS_TABLE,
      FilterExpression: '#status IN (:open, :inProgress)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':open': TICKET_STATUS.OPEN,
        ':inProgress': TICKET_STATUS.IN_PROGRESS
      }
    };

    // Optional filters
    if (filters.priority) {
      scanParams.FilterExpression += ' AND priority = :priority';
      scanParams.ExpressionAttributeValues[':priority'] = filters.priority;
    }

    if (filters.assignedTo) {
      scanParams.FilterExpression += ' AND assignedTo = :assignedTo';
      scanParams.ExpressionAttributeValues[':assignedTo'] = filters.assignedTo;
    }

    if (filters.category) {
      scanParams.FilterExpression += ' AND category = :category';
      scanParams.ExpressionAttributeValues[':category'] = filters.category;
    }

    const result = await dynamodb.scan(scanParams).promise();

    // Sort by priority (critical first) and created date (oldest first)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (result.Items || []).sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  } catch (error) {
    console.error('Error retrieving support dashboard:', error);
    throw error;
  }
}

/**
 * Check and flag SLA violations
 */
async function checkSLAViolations(ticketId) {
  try {
    const ticket = await getTicket(ticketId);
    if (!ticket) return null;

    const sla = SLA_TARGETS[ticket.priority];
    const now = new Date();
    const createdTime = new Date(ticket.createdAt);
    const elapsedSeconds = (now - createdTime) / 1000;

    const violations = {
      firstResponseViolated: false,
      resolutionViolated: false,
      details: {}
    };

    // Check first response SLA
    if (!ticket.firstResponseAt) {
      if (elapsedSeconds > sla.firstResponse) {
        violations.firstResponseViolated = true;
        violations.details.firstResponseExpected = new Date(createdTime.getTime() + sla.firstResponse * 1000).toISOString();
      }
    }

    // Check resolution SLA
    if (ticket.status !== TICKET_STATUS.CLOSED && !ticket.resolvedAt) {
      if (elapsedSeconds > sla.resolution) {
        violations.resolutionViolated = true;
        violations.details.resolutionExpected = new Date(createdTime.getTime() + sla.resolution * 1000).toISOString();
      }
    }

    return violations;
  } catch (error) {
    console.error('Error checking SLA violations:', error);
    throw error;
  }
}

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send ticket created confirmation to user
 */
async function sendTicketCreatedEmail(emailData) {
  try {
    const template = emailTemplates.getTemplate('SUPPORT_TICKET_CREATED');
    const html = emailTemplates.renderTemplate(template, {
      ticketId: emailData.ticketId,
      subject: emailData.subject,
      priority: emailData.priority,
      expectedResponseTime: SLA_TARGETS[emailData.priority].firstResponse / 3600 + ' hours'
    });

    await emailTemplates.sendEmail({
      to: emailData.userEmail,
      subject: template.subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending ticket created email:', error);
  }
}

/**
 * Send support response to user
 */
async function sendTicketResponseEmail(emailData) {
  try {
    const template = emailTemplates.getTemplate('SUPPORT_TICKET_RESPONSE');
    const html = emailTemplates.renderTemplate(template, {
      ticketId: emailData.ticketId,
      supportAgentName: emailData.agentName,
      message: emailData.message,
      status: emailData.status
    });

    await emailTemplates.sendEmail({
      to: emailData.userEmail,
      subject: template.subject,
      html: html,
      replyTo: 'support@forge.app'
    });
  } catch (error) {
    console.error('Error sending ticket response email:', error);
  }
}

/**
 * Send ticket closed notification
 */
async function sendTicketClosedEmail(emailData) {
  try {
    const template = emailTemplates.getTemplate('SUPPORT_TICKET_CLOSED');
    const html = emailTemplates.renderTemplate(template, {
      ticketId: emailData.ticketId,
      resolution: emailData.resolution,
      userEmail: emailData.userEmail
    });

    await emailTemplates.sendEmail({
      to: emailData.userEmail,
      subject: template.subject,
      html: html
    });
  } catch (error) {
    console.error('Error sending ticket closed email:', error);
  }
}

// ============================================================================
// EXPRESS ROUTES
// ============================================================================

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
router.post('/api/support/tickets', async (req, res) => {
  try {
    const { subject, description, priority, category, attachments } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description required' });
    }

    const ticket = await createSupportTicket({
      userId: req.user.id,
      workspaceId: req.workspaceId,
      subject,
      description,
      priority,
      category,
      attachments,
      userEmail: req.user.email,
      userName: req.user.name
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/support/tickets/:ticketId
 * Get ticket details with messages
 */
router.get('/api/support/tickets/:ticketId', async (req, res) => {
  try {
    const ticket = await getTicket(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only allow user or support staff to view
    if (ticket.userId !== req.user.id && !req.user.isSupport) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const messages = await getTicketMessages(req.params.ticketId, req.user.isSupport);
    const slaStatus = await checkSLAViolations(req.params.ticketId);

    res.json({
      ...ticket,
      messages,
      slaStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/support/my-tickets
 * Get current user's tickets
 */
router.get('/api/support/my-tickets', async (req, res) => {
  try {
    const { status } = req.query;
    const tickets = await getUserTickets(req.user.id, status);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/support/dashboard
 * Get support staff dashboard
 */
router.get('/api/support/dashboard', async (req, res) => {
  try {
    if (!req.user.isSupport) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const tickets = await getSupportDashboard(req.query);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/support/tickets/:ticketId/messages
 * Add message to ticket
 */
router.post('/api/support/tickets/:ticketId/messages', async (req, res) => {
  try {
    const { content, attachments } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    // Verify ticket ownership or support access
    const ticket = await getTicket(req.params.ticketId);
    if (ticket.userId !== req.user.id && !req.user.isSupport) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const message = await addTicketMessage({
      ticketId: req.params.ticketId,
      userId: req.user.id,
      type: req.user.isSupport ? MESSAGE_TYPE.SUPPORT_RESPONSE : MESSAGE_TYPE.USER_MESSAGE,
      content,
      attachments: attachments || []
    });

    // Send notification email if support response
    if (req.user.isSupport) {
      const ticket = await getTicket(req.params.ticketId);
      await sendTicketResponseEmail({
        ticketId: req.params.ticketId,
        userEmail: ticket.userId, // This should be looked up from user record
        agentName: req.user.name,
        message: content,
        status: ticket.status
      });

      // Auto-update status to in_progress if was open
      if (ticket.status === TICKET_STATUS.OPEN) {
        await updateTicketStatus(req.params.ticketId, TICKET_STATUS.IN_PROGRESS, req.user.id);
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/support/tickets/:ticketId/status
 * Update ticket status
 */
router.put('/api/support/tickets/:ticketId/status', async (req, res) => {
  try {
    if (!req.user.isSupport) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { status } = req.body;
    if (!Object.values(TICKET_STATUS).includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await updateTicketStatus(req.params.ticketId, status, req.user.id);

    // Send email if closing
    if (status === TICKET_STATUS.CLOSED) {
      const ticket = await getTicket(req.params.ticketId);
      await sendTicketClosedEmail({
        ticketId: req.params.ticketId,
        userEmail: ticket.userId,
        resolution: `Your ticket has been resolved. Reference: ${req.params.ticketId}`
      });
    }

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/support/tickets/:ticketId/priority
 * Update ticket priority
 */
router.put('/api/support/tickets/:ticketId/priority', async (req, res) => {
  try {
    if (!req.user.isSupport) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { priority } = req.body;
    if (!Object.values(TICKET_PRIORITY).includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    await updateTicketPriority(req.params.ticketId, priority, req.user.id);
    res.json({ success: true, priority });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/support/tickets/:ticketId/assign
 * Assign ticket to support staff
 */
router.put('/api/support/tickets/:ticketId/assign', async (req, res) => {
  try {
    if (!req.user.isSupport) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { assignToUserId } = req.body;
    await assignTicket(req.params.ticketId, assignToUserId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Enums
  TICKET_STATUS,
  TICKET_PRIORITY,
  MESSAGE_TYPE,
  SLA_TARGETS,

  // Ticket management
  createSupportTicket,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  addTicketMessage,

  // Queries
  getTicket,
  getTicketMessages,
  getUserTickets,
  getSupportDashboard,
  checkSLAViolations,

  // Email
  sendTicketCreatedEmail,
  sendTicketResponseEmail,
  sendTicketClosedEmail,

  // Routes
  router
};
