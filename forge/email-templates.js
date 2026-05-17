/**
 * Forge Email Templates
 *
 * Transactional email templates for:
 * - User authentication (signup, password reset)
 * - Billing (invoice, payment reminders, cancellation)
 * - Support (ticket confirmation, responses)
 * - Notifications (team invites, document sharing)
 *
 * Integrated with SendGrid or AWS SES for delivery
 */

// ============================================================================
// AUTHENTICATION EMAILS
// ============================================================================

const WELCOME_EMAIL = {
  subject: 'Welcome to Forge - Let\'s Get Started!',
  preheader: 'Your account is ready. Verify your email to get started.',
  template: (data) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { color: #999; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Forge!</h1>
        </div>
        <div class="content">
            <p>Hi ${data.name},</p>
            <p>Thanks for signing up for Forge. Your account is ready, and we can't wait to help your team collaborate more effectively.</p>

            <p><strong>Next Step: Verify Your Email</strong></p>
            <p>Click the button below to verify your email address and complete your signup:</p>

            <a href="${data.verificationLink}" class="button">Verify Email (${data.verificationCode})</a>

            <p>Or copy this code: <code>${data.verificationCode}</code></p>

            <p><strong>What to Expect:</strong></p>
            <ul>
                <li>Create or join a workspace</li>
                <li>Invite team members</li>
                <li>Start collaborating with real-time sync</li>
                <li>Organize files and documents</li>
            </ul>

            <p>Questions? Our support team is here to help at support@forge.app</p>

            <p>Best regards,<br/>The Forge Team</p>

            <div class="footer">
                <p>This email was sent to ${data.email}</p>
                <p>© 2026 Forge. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `
};

const EMAIL_VERIFICATION = {
  subject: 'Verify Your Forge Email Address',
  preheader: 'Your verification code is {{verificationCode}}',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Verify Your Email</h2>
        <p>Hi ${data.name},</p>
        <p>We received a request to verify your email address for your Forge account.</p>

        <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 6px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">Your verification code:</p>
            <p style="margin: 10px 0; font-size: 36px; font-weight: bold; letter-spacing: 2px;">${data.verificationCode}</p>
            <p style="margin: 0; font-size: 12px; color: #999;">Expires in 15 minutes</p>
        </div>

        <p>Or click here: <a href="${data.verificationLink}">Verify Email</a></p>

        <p>If you didn't request this, please ignore this email.</p>
    </div>
</body>
</html>
  `
};

const PASSWORD_RESET = {
  subject: 'Reset Your Forge Password',
  preheader: 'Click the link to reset your password',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset the password for your Forge account.</p>

        <p><a href="${data.resetLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>

        <p>Or copy this link:<br/>${data.resetLink}</p>

        <p><strong>This link expires in 1 hour.</strong></p>

        <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
    </div>
</body>
</html>
  `
};

const PASSWORD_CHANGED = {
  subject: 'Your Forge Password Has Been Changed',
  preheader: 'Your password was successfully updated',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Changed</h2>
        <p>Hi ${data.name},</p>
        <p>Your Forge password was successfully changed on ${data.date} at ${data.time}.</p>

        <p><strong>Device:</strong> ${data.device}</p>
        <p><strong>Location:</strong> ${data.location}</p>

        <p>If this wasn't you, <a href="${data.securityLink}">click here to secure your account</a> immediately.</p>
    </div>
</body>
</html>
  `
};

// ============================================================================
// BILLING EMAILS
// ============================================================================

const INVOICE_EMAIL = {
  subject: 'Your Forge Invoice #{{invoiceNumber}}',
  preheader: 'Invoice for {{amount}} is ready for download',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Your Invoice</h2>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for your payment. Your invoice is ready.</p>

        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <table style="width: 100%;">
                <tr>
                    <td><strong>Invoice Number:</strong></td>
                    <td>${data.invoiceNumber}</td>
                </tr>
                <tr>
                    <td><strong>Invoice Date:</strong></td>
                    <td>${data.invoiceDate}</td>
                </tr>
                <tr>
                    <td><strong>Amount Paid:</strong></td>
                    <td>${data.currency} ${data.amount}</td>
                </tr>
                <tr>
                    <td><strong>Plan:</strong></td>
                    <td>${data.planName}</td>
                </tr>
                <tr>
                    <td><strong>Period:</strong></td>
                    <td>${data.billingPeriod}</td>
                </tr>
            </table>
        </div>

        <p><a href="${data.invoicePdfUrl}">Download Invoice (PDF)</a></p>

        <p>You can view all your invoices in your <a href="${data.billingDashboardLink}">Forge Billing Dashboard</a>.</p>
    </div>
</body>
</html>
  `
};

const PAYMENT_FAILED = {
  subject: 'Payment Failed - Action Required',
  preheader: 'We couldn\'t process your payment. Please update your payment method.',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Payment Failed</h2>
        <p>Hi ${data.customerName},</p>
        <p>We attempted to charge your payment method for your Forge ${data.planName} subscription, but the payment was declined.</p>

        <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #ffc107;">
            <strong>Error:</strong> ${data.errorMessage}
        </div>

        <p><strong>What You Need to Do:</strong></p>
        <ol>
            <li><a href="${data.paymentMethodLink}">Update Your Payment Method</a></li>
            <li>We'll automatically retry in 5 days</li>
            <li>Your access continues while we retry</li>
        </ol>

        <p>If you need help, please contact <a href="mailto:billing@forge.app">billing@forge.app</a></p>
    </div>
</body>
</html>
  `
};

const SUBSCRIPTION_CONFIRMED = {
  subject: 'Subscription Confirmed - Welcome to Forge {{planName}}!',
  preheader: 'Your {{planName}} subscription is now active',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Subscription Confirmed!</h2>
        <p>Hi ${data.customerName},</p>
        <p>Your upgrade to Forge ${data.planName} is confirmed. Your new features are now available!</p>

        <div style="background: #d4edda; padding: 15px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #28a745;">
            <strong>Plan:</strong> ${data.planName}<br/>
            <strong>Billing Cycle:</strong> ${data.billingCycle}<br/>
            <strong>Amount:</strong> ${data.currency} ${data.amount}/${data.billingCycle === 'annual' ? 'year' : 'month'}<br/>
            <strong>Renewal Date:</strong> ${data.renewalDate}
        </div>

        <p><strong>New Features Unlocked:</strong></p>
        <ul>
            ${data.features.map(f => `<li>${f}</li>`).join('')}
        </ul>

        <p><a href="${data.dashboardLink}">Go to Your Dashboard</a></p>
    </div>
</body>
</html>
  `
};

const SUBSCRIPTION_CANCELED = {
  subject: 'Your Forge Subscription Has Been Canceled',
  preheader: 'Your subscription will end on {{endDate}}',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Subscription Canceled</h2>
        <p>Hi ${data.customerName},</p>
        <p>Your Forge subscription has been canceled as requested.</p>

        <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <strong>Cancellation Effective:</strong> ${data.cancellationDate}<br/>
            <strong>Last Day of Access:</strong> ${data.lastAccessDate}<br/>
            <strong>Refund Status:</strong> ${data.refundStatus}
        </div>

        <p>Your workspace and data will be available until ${data.lastAccessDate}. After that, we'll retain your data for 90 days before permanent deletion.</p>

        <p><strong>Want to come back?</strong> You can resubscribe anytime and restore your workspace.</p>

        <p><a href="mailto:support@forge.app">Contact Support</a> if you have any questions.</p>
    </div>
</body>
</html>
  `
};

// ============================================================================
// COLLABORATION EMAILS
// ============================================================================

const TEAM_INVITE = {
  subject: 'You\'re Invited to Join {{workspaceName}} on Forge',
  preheader: '{{inviterName}} invited you to collaborate',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Team Invitation</h2>
        <p>Hi ${data.invitedName},</p>
        <p>${data.inviterName} from ${data.companyName} invited you to join their Forge workspace.</p>

        <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 6px; text-align: center;">
            <p><strong>${data.workspaceName}</strong></p>
            <p style="color: #666; margin: 10px 0;">${data.workspaceDescription}</p>
        </div>

        <p><a href="${data.acceptLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>

        <p><strong>Workspace Role:</strong> ${data.role}</p>
        <p><strong>Permissions:</strong> ${data.permissions}</p>

        <p>This invitation expires in 7 days.</p>
    </div>
</body>
</html>
  `
};

const DOCUMENT_SHARED = {
  subject: '{{documentName}} was shared with you on Forge',
  preheader: '{{senderName}} shared a document with you',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Document Shared</h2>
        <p>Hi ${data.recipientName},</p>
        <p>${data.senderName} shared a document with you on Forge.</p>

        <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; color: #999; font-size: 12px;">Document</p>
            <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">${data.documentName}</p>
        </div>

        <p><strong>Access Level:</strong> ${data.accessLevel}</p>
        <p><strong>Shared At:</strong> ${data.sharedDate}</p>

        <p><a href="${data.documentLink}">Open Document</a></p>
    </div>
</body>
</html>
  `
};

// ============================================================================
// SUPPORT EMAILS
// ============================================================================

const SUPPORT_TICKET_CREATED = {
  subject: 'Support Ticket #{{ticketId}} - {{subject}}',
  preheader: 'Your support request has been received',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Support Ticket Created</h2>
        <p>Hi ${data.customerName},</p>
        <p>We received your support request and will get back to you shortly.</p>

        <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <strong>Ticket ID:</strong> #${data.ticketId}<br/>
            <strong>Subject:</strong> ${data.subject}<br/>
            <strong>Priority:</strong> ${data.priority}<br/>
            <strong>Submitted:</strong> ${data.createdDate}
        </div>

        <p><strong>Your Message:</strong></p>
        <blockquote style="border-left: 4px solid #ddd; padding-left: 15px; color: #666;">
            ${data.message}
        </blockquote>

        <p><a href="${data.ticketLink}">View Your Ticket</a></p>

        <p><strong>Expected Response Time:</strong> ${data.expectedResponseTime}</p>
    </div>
</body>
</html>
  `
};

const SUPPORT_TICKET_RESPONSE = {
  subject: 'Response to Your Support Ticket #{{ticketId}}',
  preheader: 'Support team responded to your ticket',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Support Response</h2>
        <p>Hi ${data.customerName},</p>
        <p>Our support team responded to your ticket:</p>

        <div style="background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #666; font-size: 12px;">From: ${data.supportAgentName}</p>
            <p style="margin: 10px 0 0 0;">${data.response}</p>
        </div>

        <p><a href="${data.ticketLink}">Reply to Ticket</a></p>

        <p>If your issue is resolved, you can close the ticket in your dashboard.</p>
    </div>
</body>
</html>
  `
};

const SUPPORT_TICKET_CLOSED = {
  subject: 'Your Support Ticket #{{ticketId}} Has Been Closed',
  preheader: 'Your issue has been resolved',
  template: (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Ticket Closed</h2>
        <p>Hi ${data.customerName},</p>
        <p>Your support ticket has been closed. If you have any follow-up questions, please reply to this email.</p>

        <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 6px;">
            <strong>Ticket ID:</strong> #${data.ticketId}<br/>
            <strong>Subject:</strong> ${data.subject}<br/>
            <strong>Resolution:</strong> ${data.resolution}
        </div>

        <p><strong>Would you like to provide feedback?</strong> Please take a moment to <a href="${data.feedbackLink}">rate your support experience</a>.</p>
    </div>
</body>
</html>
  `
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Render email template with data
 */
function renderTemplate(template, data) {
  if (typeof template === 'function') {
    return template(data);
  }
  return template;
}

/**
 * Get template by name
 */
function getTemplate(templateName) {
  const templates = {
    welcome: WELCOME_EMAIL,
    email_verification: EMAIL_VERIFICATION,
    password_reset: PASSWORD_RESET,
    password_changed: PASSWORD_CHANGED,
    invoice: INVOICE_EMAIL,
    payment_failed: PAYMENT_FAILED,
    subscription_confirmed: SUBSCRIPTION_CONFIRMED,
    subscription_canceled: SUBSCRIPTION_CANCELED,
    team_invite: TEAM_INVITE,
    document_shared: DOCUMENT_SHARED,
    support_ticket_created: SUPPORT_TICKET_CREATED,
    support_ticket_response: SUPPORT_TICKET_RESPONSE,
    support_ticket_closed: SUPPORT_TICKET_CLOSED
  };

  return templates[templateName];
}

/**
 * Send email via SendGrid or AWS SES
 */
async function sendEmail(emailData) {
  // Implementation would use SendGrid API or AWS SES
  console.log('Sending email:', {
    to: emailData.to,
    subject: emailData.subject,
    preheader: emailData.preheader
  });

  // SendGrid example:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(emailData);

  // AWS SES example:
  // const ses = new AWS.SES();
  // await ses.sendEmail({
  //   Source: 'noreply@forge.app',
  //   Destination: { ToAddresses: [emailData.to] },
  //   Message: { ... }
  // }).promise();
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Auth templates
  WELCOME_EMAIL,
  EMAIL_VERIFICATION,
  PASSWORD_RESET,
  PASSWORD_CHANGED,

  // Billing templates
  INVOICE_EMAIL,
  PAYMENT_FAILED,
  SUBSCRIPTION_CONFIRMED,
  SUBSCRIPTION_CANCELED,

  // Collaboration templates
  TEAM_INVITE,
  DOCUMENT_SHARED,

  // Support templates
  SUPPORT_TICKET_CREATED,
  SUPPORT_TICKET_RESPONSE,
  SUPPORT_TICKET_CLOSED,

  // Functions
  renderTemplate,
  getTemplate,
  sendEmail
};
