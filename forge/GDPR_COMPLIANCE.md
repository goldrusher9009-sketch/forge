# Forge GDPR Compliance Guide

**Last Updated: June 15, 2026**
**Version: 1.0**

## 1. GDPR Overview

The General Data Protection Regulation (GDPR) is the EU's comprehensive data protection law effective since May 25, 2018. Forge is committed to full GDPR compliance for all users, regardless of location.

## 2. Legal Basis for Processing

Forge processes personal data under the following lawful bases:

### 2.1 Contractual Performance (Article 6(1)(b))
- **Data:** Email, password, name, workspace information
- **Purpose:** Provide the Service under the terms of service
- **Duration:** Active account + 90-day retention after deletion

### 2.2 Consent (Article 6(1)(a))
- **Data:** Marketing emails, analytics, feature usage
- **Purpose:** Send promotional communications, improve product
- **How to Withdraw:** Unsubscribe in email or account settings

### 2.3 Legal Obligation (Article 6(1)(c))
- **Data:** Payment records, invoices
- **Purpose:** Comply with tax and accounting requirements
- **Duration:** 7 years per tax regulations

### 2.4 Legitimate Interests (Article 6(1)(f))
- **Data:** Usage analytics, error logs
- **Purpose:** Prevent fraud, security, product improvement
- **Balance Test:** Our interests don't override user rights

## 3. Data Subject Rights

### 3.1 Right of Access (Article 15)

Users can request all personal data we hold about them.

**How to Request:**
- Use "Download My Data" in account settings, OR
- Email privacy@forge.app with subject "GDPR RIGHT OF ACCESS"

**What We Provide:**
- All personal data in structured, machine-readable format
- Information about processing purposes and legal basis
- Recipient information for shared data

**Our Response Time:** 30 days (extendable to 90 days for complex requests)

**Format:** JSON or CSV file with full data export

### 3.2 Right to Rectification (Article 16)

Users can correct inaccurate personal data.

**How to Request:**
- Update through "Edit Profile" in account settings, OR
- Email privacy@forge.app with correction details

**Our Response Time:** Immediate for self-service, 30 days for our records

**Example:**
- Incorrect name → corrected in user profile
- Wrong company information → updated immediately
- Historical inaccuracy → marked and corrected

### 3.3 Right to Erasure (Article 17)

Users can request deletion of personal data ("Right to be Forgotten").

**Exceptions (we must retain data):**
- Legal obligation (accounting, tax)
- Legal claims or defense
- Public task performance
- Legitimate interests (fraud prevention)

**How to Request:**
- "Delete Account" in account settings, OR
- Email privacy@forge.app with subject "RIGHT TO ERASURE"

**What Gets Deleted:**
- Account profile and settings
- Workspace data and documents
- Payment methods (except Stripe tokens)
- Usage logs and analytics

**What Remains (lawfully):**
- Billing records (7 years per tax law)
- Backup copies (deleted after 30-day retention)
- Anonymized usage data (for product improvement)

**Our Response Time:** 30 days

### 3.4 Right to Restrict Processing (Article 18)

Users can limit how we process their data.

**Use Cases:**
- Dispute accuracy while we investigate
- Processing is unlawful but you don't want deletion
- We no longer need data but you need it for a claim
- You object to processing pending our response

**How to Request:** Email privacy@forge.app with "RESTRICT PROCESSING"

**Our Response:**
- Flag data as restricted
- Only process if you consent or for legal obligations
- Notify you before removing restriction

**Response Time:** 30 days

### 3.5 Right to Data Portability (Article 20)

Users can receive their data in portable format and send to another service.

**How to Request:**
- "Export Data" in account settings, OR
- Email privacy@forge.app with subject "DATA PORTABILITY REQUEST"

**Format Provided:**
- JSON (machine-readable, structured format)
- CSV (for bulk data)
- Includes all personal data and content

**What's Included:**
- Account information
- Documents and content you created
- Comments and collaboration history
- Usage data (anonymized where possible)

**What's NOT Included:**
- Data of other users (even if you shared access)
- Shared content you don't own
- Metadata about other users' interactions

**Response Time:** 30 days

### 3.6 Right to Object (Article 21)

Users can object to processing for marketing or profiling.

**Marketing Emails:**
- Click "Unsubscribe" in any email, OR
- Account settings → Email Preferences, OR
- Email privacy@forge.app with "UNSUBSCRIBE"

**Effective Immediately:** No more marketing emails

**Profiling/Analytics:**
- Email privacy@forge.app to opt-out of analytics
- We'll stop collecting new usage data
- Existing data handling continues per contract

**Response Time:** Immediate for unsubscribe, 30 days for analytics opt-out

### 3.7 Right Not to be Subject to Automated Decision-Making (Article 22)

Users have rights regarding fully automated decisions that produce legal or similarly significant effects.

**Forge's Current Use:**
- Automated login attempt detection (for security)
- Automated fraud detection (for payment processing)
- Automated plan recommendations (for upselling)

**User Rights:**
- Request human review of automated decisions
- Obtain explanation of automated decision logic
- Contest automated decision outcomes

**How to Request:** Email privacy@forge.app with "AUTOMATED DECISION REVIEW"

**Response Time:** 30 days

## 4. Data Protection Obligations

### 4.1 Legitimate Interest Assessment (LIA)

Before processing for legitimate interests, we conduct an LIA:

| Processing Purpose | Legitimate Interest | User Impact | Assessment |
|-------------------|-------------------|------------|-----------|
| Error logging | Improve service quality | High (logs usage) | Justified (essential) |
| Analytics | Product development | High (tracks behavior) | Balanced (anonymized where possible) |
| Security monitoring | Prevent fraud | Low (protects user) | Justified (essential) |
| Marketing emails | Customer engagement | Medium (targeted ads) | Optional (opt-in required) |

### 4.2 Data Protection Impact Assessment (DPIA)

DPIAs are required for high-risk processing:

**Processing Triggering DPIA:**
- Payment data handling
- Employee data access
- Biometric data processing
- Large-scale monitoring
- New AI/ML processing

**DPIA Scope:**
1. Description of processing
2. Necessity and proportionality
3. Risk assessment (likelihood + severity)
4. Mitigation measures
5. Consultation with supervisory authority (if high risk)

### 4.3 Privacy by Design

Forge incorporates privacy in all systems:

- **Data Minimization:** Collect only necessary data
- **Storage Limitation:** Delete data per retention schedule
- **Access Control:** Role-based permissions
- **Encryption:** At-rest and in-transit
- **Auditing:** Log all data access
- **User Controls:** Data export, deletion, preferences

## 5. Processor Relationships

### 5.1 Sub-Processors

We use processors (vendors) who handle personal data on our behalf:

| Processor | Purpose | Location | Legal Basis |
|-----------|---------|----------|------------|
| Stripe | Payment processing | USA | Contract (DPA executed) |
| AWS | Infrastructure | EU/USA | Contract (Standard Contractual Clauses) |
| SendGrid | Email delivery | USA | Contract (GDPR-compliant) |
| Google Analytics | Usage analytics | USA | Legitimate interest (anonymized) |

**Notification:** Changes to processors require 30 days' notice

### 5.2 Data Processing Agreements (DPA)

All processors have executed DPAs covering:
- Processing instructions
- Data subject rights assistance
- Security and encryption
- Sub-processor notification
- Audit and compliance
- Data deletion/return obligations

### 5.3 Standard Contractual Clauses (SCC)

For international transfers (US, etc.), we use EU-approved Standard Contractual Clauses and supplementary measures:

- Encryption by Forge before transmission
- Strict access controls at processor
- Contractual restrictions on government access
- Regular adequacy assessments

## 6. Data Breach Notification

### 6.1 Breach Definition

A breach is unauthorized access, disclosure, alteration, or destruction of personal data.

**Examples:**
- Hacked database credentials
- Employee accidentally sharing customer data
- Data transmitted unencrypted to wrong recipient
- Server breach exposing data files

### 6.2 Breach Response Procedure

**1. Detection (Immediate)**
- Intrusion detection alerts
- User reports
- Access monitoring
- Investigate within 24 hours

**2. Assessment (24-48 hours)**
- What data was accessed?
- Who had access?
- What is the risk to individuals?
- Log all findings

**3. Notification to Supervisory Authority (72 hours)**
- Notify authority where most affected individuals reside
- Include: nature of breach, likely consequences, measures taken
- Send to: [Authority contact to be updated per region]

**4. Notification to Data Subjects (without undue delay)**

**For High-Risk Breaches:**
- Email individuals with clear breach description
- What data was compromised?
- Recommended protective actions
- Our contact for questions

**For Low-Risk Breaches (anonymized data):**
- May publish notice instead of individual contact

**Letter Template:**

```
Subject: Important Security Notice - Personal Data Access

Dear [User],

We're writing to inform you of a security incident affecting your Forge account.

What Happened:
On [date], unauthorized access to [system] exposed [data types].

What Data:
- Your name, email, company information
- NOT your password (encrypted)
- NOT payment method (handled separately)

What We're Doing:
- Immediately reset all sessions
- Require password change
- Enhanced monitoring of your account
- Full investigation underway

What You Should Do:
- Change your Forge password immediately
- If you reused password elsewhere, change those too
- Monitor accounts for suspicious activity
- Contact us with questions: security@forge.app

Timeline:
- [Date]: Incident detected and contained
- [Date]: Investigation completed
- [Date]: This notification sent

Our Commitment:
We've implemented [security improvements]. Full details in our incident report.

Sincerely,
Forge Security Team
```

### 6.3 Breach Log

We maintain a breach log (internal, not public) documenting:
- Date discovered and reported
- Data affected and scale
- Likely consequences
- Remedial actions taken
- Notification sent dates

## 7. International Data Transfers

### 7.1 Transfer Mechanisms

**EU to US:**
- Standard Contractual Clauses (primary)
- Supplementary safeguards (encryption, access controls)
- Adequacy determination for AWS EU regions
- Annual review of transfer necessity

**EU to Other Countries:**
- Adequacy decision (where available)
- Standard Contractual Clauses
- Binding Corporate Rules (if applicable)

### 7.2 Transfer Impact Assessment

Before transferring data to a third country:
1. Assess foreign law access to data
2. Evaluate existence of adequate safeguards
3. Document residual risks
4. Implement supplementary measures
5. Regular review and updates

## 8. Third-Party Rights

### 8.1 Your Rights Regarding Shared Data

If another user shares data with you:
- You cannot independently delete their data
- You cannot modify their data
- You cannot export their data
- They remain the data controller for their data

### 8.2 Collaborators' Data Rights

If you invite collaborators:
- You're responsible for their consent
- They have rights over their contributed data
- They can request their data portability
- Document collaboration consent

## 9. Automated Decision-Making Policy

### 9.1 Decisions Affecting Users

Forge uses automated decisions in limited cases:

**Automated Decisions Currently in Use:**

1. **Login Security:**
   - System: Detect suspicious login attempts
   - Data: IP, location, time, device
   - Effect: Temporary account restriction
   - Override: Contact support@forge.app
   - Right to Explanation: Email dpo@forge.app

2. **Fraud Detection:**
   - System: Stripe fraud detection
   - Data: Payment method, amount, frequency
   - Effect: Payment decline
   - Override: Retry or contact Stripe support
   - Right to Explanation: Email security@forge.app

3. **Plan Recommendations:**
   - System: Suggest upgrades based on usage
   - Data: Team size, storage, API calls
   - Effect: In-app notification (no action taken)
   - Override: Ignore or contact sales@forge.app
   - Right to Explanation: Included in notification

### 9.2 User Rights

For any automated decision:

- **Right to Explanation:** Request why decision was made
- **Right to Human Review:** Request manual review by employee
- **Right to Contest:** Challenge accuracy or appropriateness

**How to Exercise Rights:**

```
Email: dpo@forge.app
Subject: AUTOMATED DECISION REVIEW

Include:
1. Decision made (date and type)
2. Your account information
3. Why you contest the decision
4. Relief requested

We'll respond within 30 days.
```

## 10. Employee and Contractor Data

### 10.1 Personnel Data Processing

Forge processes employee/contractor data for:
- Employment contract performance
- Tax and regulatory compliance
- Payroll and benefits
- Health and safety
- Performance management

### 10.2 Employee Rights

Employees have all GDPR rights:
- Right to access their personnel file
- Right to correct inaccurate information
- Right to object to certain processing
- Right to data portability

**Employee Privacy Notice:** [To be provided in employee handbook]

## 11. GDPR Compliance Checklist

### 11.1 Pre-Launch

- [ ] Privacy notice published and accessible
- [ ] DPAs executed with all processors
- [ ] Standard Contractual Clauses for US transfers
- [ ] Data subject rights processes implemented
- [ ] Breach response procedure documented
- [ ] DPIA completed for key processing
- [ ] Automated decision process documented
- [ ] Audit logging implemented
- [ ] Retention schedule enforced
- [ ] Employee training completed

### 11.2 Ongoing

- [ ] Monitor for new processing requiring DPIA
- [ ] Review processor compliance quarterly
- [ ] Test breach response annually
- [ ] Update privacy notice with changes
- [ ] Maintain breach log
- [ ] Track data subject rights requests
- [ ] Ensure data deletion per schedule
- [ ] Monitor for data protection changes
- [ ] Update DPAs for new processors
- [ ] Review international transfer mechanisms

## 12. Contacts and Resources

**Data Protection Officer:** dpo@forge.app
**Privacy Inquiries:** privacy@forge.app
**Compliance Questions:** compliance@forge.app
**Breach Reporting:** security@forge.app (24/7)

**Supervisory Authorities:**
- EU residents: Your local data protection authority
- Ireland (our EU representative): Data Protection Commission (www.dataprotection.ie)

**External Resources:**
- GDPR Full Text: https://gdpr-info.eu
- Article 29 Working Party Guidelines: https://ec.europa.eu/newsroom/article29
- EDPB Decisions: https://edpb.ec.europa.eu

---

**This GDPR Compliance Guide is reviewed and updated annually or when requirements change.**

**Last DPIA Review:** June 15, 2026
**Next DPIA Review:** June 15, 2027
**Next Processor Review:** September 15, 2026
