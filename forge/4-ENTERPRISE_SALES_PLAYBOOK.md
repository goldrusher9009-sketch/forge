# 4. ENTERPRISE SALES PLAYBOOK FOR FORGE
**For:** Enterprise Sales Team  
**Status:** Complete reference playbook  
**Created:** May 11, 2026

---

## 📋 PLAYBOOK OVERVIEW

This playbook provides the complete framework for selling Forge to enterprise customers. It covers deal structures, pricing strategies, contract templates, and implementation guidance.

**Key Metrics:**
- Target contract value: $50K–$500K+ annually
- Sales cycle: 3–6 months
- Close rate: 25–35% (with proper execution)
- Average deal size: $120K/year
- Expansion potential: 30–50% Year 2 uplift through feature adoption

---

## 🎯 ENTERPRISE POSITIONING

### Why Enterprise Buys Forge

Enterprises choose Forge because:

1. **Consolidation** — Replaces 3–5 fragmented tools (saves engineering time, reduces headcount needs)
2. **Compliance** — Built for regulated industries (HIPAA, SOC2, FedRAMP ready)
3. **Scale** — Handles unlimited API calls, concurrent users, storage (no surprises at scale)
4. **Customization** — Dedicated engineering, custom features, white-label options
5. **Partnership** — Not just vendor-customer; we grow with them

### Ideal Customer Profile (ICP)

| Attribute | Target |
|-----------|--------|
| Company Size | 500–50,000 employees |
| Industry | FinServ, HealthTech, SaaS, EdTech, Gov Contractors |
| Annual Revenue | $50M–$5B+ |
| IT Maturity | Intermediate to advanced |
| Buyer | VP Engineering, CTO, Principal Architect |
| Pain Points | Tool sprawl, compliance complexity, API cost explosion |
| Budget | $100K–$500K for platform tooling |

### Competitive Positioning

**vs. Competitors:**
- vs. Internal Build: "We're cheaper than hiring 3 engineers for 18 months"
- vs. Zapier/Integromat: "Enterprise-grade, not consumer automation"
- vs. AWS Services: "Higher-level abstraction, reduce engineering burden by 60%"
- vs. Microsoft/Salesforce Ecosystem: "Best-of-breed, not lock-in"

---

## 💰 PRICING STRATEGY

### Enterprise Pricing Tiers

#### Tier 1: Growth Enterprise
**Target:** $100K–$250K ARR
- **Base fee:** $50K/year
- **Included:**
  - Up to 100 concurrent users
  - 50M API calls/month
  - 1TB storage
  - Email support + 1 quarterly business review
  - Standard SLA (99.5%)
- **Overage pricing:**
  - $30 per 1M additional API calls
  - $0.25/GB additional storage
  - $5 per additional concurrent user

#### Tier 2: Strategic Enterprise
**Target:** $250K–$500K ARR
- **Base fee:** $150K/year
- **Included:**
  - Up to 500 concurrent users
  - 500M API calls/month
  - 10TB storage
  - Phone support + monthly business reviews
  - Priority feature requests (2 per quarter)
  - Enhanced SLA (99.9%)
  - Dedicated success manager
- **Overage pricing:**
  - $25 per 1M additional API calls
  - $0.20/GB additional storage
  - $4 per additional concurrent user

#### Tier 3: Strategic Partner
**Target:** $500K–$2M+ ARR
- **Base fee:** Custom (typically $300K–$1M+/year)
- **Included:**
  - Unlimited concurrent users
  - Unlimited API calls
  - Unlimited storage
  - 24/7 phone support
  - Weekly business reviews
  - Unlimited feature requests + custom dev (up to 500 hours/year)
  - Premium SLA (99.95%)
  - Dedicated account team (CSM + Technical lead)
  - White-label options
  - Custom integrations
  - Advanced security hardening
- **Additional options:**
  - On-premise deployment: +$200K/year
  - Custom SLA negotiation (up to 99.99%)
  - Advanced compliance (FedRAMP, HIPAA BAA)

### Custom Pricing Calculator

```javascript
// USE THIS WHEN: Customer has unusual requirements
// PROCESS: Fill in each variable, calculate total, present to customer

CUSTOM_PRICING_CALCULATOR = {
  BASE_TIERS: {
    growth: 50000,        // $50K minimum
    strategic: 150000,    // $150K base
    partner: 300000       // $300K base (minimum for strategic partner)
  },

  USAGE_MULTIPLIERS: {
    api_calls: {
      per_million: 30,                    // $30 per 1M calls
      brackets: [
        { threshold: 100_000_000, rate: 25 },   // 100M+ calls = $25/M
        { threshold: 500_000_000, rate: 20 },   // 500M+ calls = $20/M
        { threshold: 1_000_000_000, rate: 15 }  // 1B+ calls = $15/M
      ]
    },
    storage: {
      per_gb: 0.25,                       // $0.25/GB
      brackets: [
        { threshold: 10000, rate: 0.20 },    // 10TB+ = $0.20/GB
        { threshold: 50000, rate: 0.15 },    // 50TB+ = $0.15/GB
      ]
    },
    users: {
      per_user: 5,                        // $5 per additional user
      brackets: [
        { threshold: 500, rate: 4 },      // 500+ users = $4/user
        { threshold: 1000, rate: 3 },     // 1000+ users = $3/user
      ]
    }
  },

  FEATURE_MULTIPLIERS: {
    dedicated_success_manager: 20000,     // +$20K/year
    white_label: 50000,                   // +$50K/year
    custom_integrations: 150000,          // +$150K for 500 dev hours
    on_premise_deployment: 200000,        // +$200K/year
    advanced_compliance: 100000,          // +$100K (FedRAMP/HIPAA hardening)
    24_7_phone_support: 50000,            // +$50K/year
    premium_sla: 75000,                   // +$75K for 99.95% SLA
    api_quotas_unlimited: 200000,         // +$200K for unlimited API calls
    advanced_analytics: 30000             // +$30K for custom reporting
  },

  DISCOUNT_RULES: {
    annual_commitment: 0.10,              // 10% discount for 2-year prepay
    three_year_commitment: 0.15,          // 15% discount for 3-year prepay
    volume_500k_plus: 0.05,               // 5% discount if deal >$500K
    nonprofit_edu: 0.25,                  // 25% discount for nonprofit/education
    startup_revenue_lt_10m: 0.20,         // 20% discount for startup <$10M ARR
    marketplace_partner: 0.10             // 10% discount for partner ecosystem
  },

  CALCULATION: {
    annual_cost = BASE_TIER +
                  (usage_api_calls * api_call_rate) +
                  (storage_gb * storage_rate) +
                  (users * user_rate) +
                  sum(feature_multipliers_selected) -
                  (discount_percentage * subtotal)
    
    monthly_cost = annual_cost / 12
  }
}
```

### Pricing Presentation Template

When presenting custom pricing:

```
Dear [Customer],

Thank you for partnering with Forge. Based on your requirements:

PROPOSED ANNUAL INVESTMENT: $287,500

BREAKDOWN:
├─ Base Enterprise Tier:           $150,000
├─ 250 Additional Users:            $20,000 (additional seats)
├─ 250M Extra API Calls:            $7,500
├─ 5TB Additional Storage:          $1,250
├─ Dedicated Success Manager:       $20,000
├─ Advanced Security Hardening:     $50,000
├─ Custom API Integration Module:   $30,000
├─ Premium SLA (99.95%):            $7,500
├─ 24/7 Escalation Support:         $5,000
└─ Professional Services (100 hrs):  $15,000
                                     ─────────
SUBTOTAL:                            $306,250
Annual Commitment Discount (-10%):   -$30,625
                                     ─────────
ANNUAL COST:                         $275,625

MONTHLY COST:                        ~$22,969
(or $275,625 if paid annually)

This represents a 35% investment reduction from legacy systems
while consolidating 4 vendor relationships.

Next steps: Contract review by [Date], implementation kickoff [Date]
```

---

## 📋 DEAL STRUCTURE TEMPLATES

### Standard Enterprise Deal (100K–250K)

**Timeline:**
- Weeks 1–2: Discovery & scoping
- Weeks 3–4: Technical evaluation & proof of concept
- Weeks 5–8: Negotiation & contracting
- Weeks 9–12: Implementation & onboarding

**Success Factors:**
- Get CFO/Finance approval early (deals stall on budget authority)
- Identify 2–3 power users for evaluation; listen to their blockers
- Demo competitive advantage vs. their current stack
- Show reference customers in their industry
- Have a CTO/technical founder join 1–2 calls to build credibility

**Red Flags:**
- Committee decision-making with no clear sponsor (dead deal)
- "We need to evaluate 3 other vendors" (low intent)
- Procurement needs 6-month RFP process (budget misalignment)
- "We'll fund this in next fiscal year" (not closing this quarter)

### High-Value Strategic Deal (500K–2M+)

**Timeline:**
- Months 1–2: Executive relationship building (CEO/CTO calls)
- Months 2–3: Technical deep-dive + architecture review
- Months 3–4: Custom feature/compliance scoping
- Months 4–5: Commercial negotiation + legal review
- Months 5–6: Implementation planning + dev work commencement

**Success Factors:**
- Have CEO/Founder on first call to signal importance
- Get co-sell agreement with 1–2 industry partners
- Propose multi-year pricing (locks in value)
- Frame as "digital transformation partner" not just vendor
- Include exec business review (quarterly) in contract
- Reserve 500 hours of custom dev work (shows commitment)

**Red Flags:**
- Procurement committee wants "best of breed" (tool sprawl won't solve their problem)
- Heavy legal redlines on liability/SLA (deal will take 4+ months)
- "Build this custom feature first, then we'll talk pricing" (negotiating backwards)
- Multi-vendor POC requirement (dilutes our advantage)

### Land-and-Expand Deal

**Year 1:** Start with single team/department at $50K–$100K
- Product team pilot
- Finance/Operations early adoption
- Limited user base (25–50 users)

**Year 2:** Expand to enterprise level at $200K–$400K
- Company-wide deployment
- New departments (HR, legal, procurement)
- 500+ concurrent users
- Advanced integrations

**Growth Levers:**
- Success story from Year 1 proof-of-value
- Cost-per-user decreases significantly (justifies expansion)
- New use cases discovered by customers (feature adoption)
- Competitive replacement (we displace 2–3 other tools)

---

## 📝 CONTRACT LANGUAGE TEMPLATES

### Enterprise Software Agreement (Standard Terms)

```markdown
# ENTERPRISE SOFTWARE AGREEMENT

This Agreement ("Agreement") is entered into between:
- Forge Platform, Inc. ("Company")
- [Customer Name], Inc. ("Customer")

Effective Date: [DATE]
Contract Term: [1–3 YEARS]
Annual Cost: $[AMOUNT]

## 1. SERVICE DESCRIPTION

Company will provide:
- Access to the Forge Platform (SaaS)
- Support via email/phone (see support tier)
- Quarterly business reviews
- Included training and onboarding
- Monthly platform updates and security patches

## 2. SERVICE LEVEL AGREEMENT

Company commits to:
- 99.5% uptime for Growth tier
- 99.9% uptime for Strategic tier
- 99.95% uptime for Partner tier

Measured monthly. Exceeds 30 min downtime = service credit (5% of monthly fee).

## 3. SUPPORT & SUCCESS

### Growth Tier
- Email support (24-hour response)
- 1 quarterly business review
- Standard ticket SLA (48 hours)

### Strategic Tier
- Phone + email support (4-hour response for critical)
- Monthly business reviews
- Dedicated Success Manager
- Critical ticket SLA (2 hours)

### Partner Tier
- 24/7 phone support
- Weekly business reviews + executive briefings
- Dedicated account team (CSM + Technical Lead)
- Emergency SLA (30 minutes)

## 4. DATA & SECURITY

Company commits to:
- SOC2 Type II compliance
- HIPAA BAA available (Custom tier)
- Encryption at rest and in transit
- Annual security audits
- Data residency options (US, EU, etc.)

Customer commits to:
- Comply with Forge Acceptable Use Policy
- Not use platform for unlawful purposes
- Notify Company of security incidents

## 5. INTELLECTUAL PROPERTY

- Customer retains all rights to Customer Data
- Company retains all rights to Forge Platform
- Customer grants Company right to use Customer Data for:
  - Operational improvements
  - Anonymized analytics
  - Product development

## 6. FEES & PAYMENT

- Annual cost: $[AMOUNT]
- Due within 30 days of invoice
- Paid annually or monthly ($[MONTHLY_AMOUNT])
- Overage charges billed monthly in arrears

## 7. RENEWAL & TERMINATION

- Auto-renewal at end of term (same price)
- Either party may terminate with 90 days notice
- For cause termination: 30 days notice
- Data export provided for 30 days post-termination
- Immediate termination for security violation

## 8. WARRANTIES & DISCLAIMERS

Company warrants:
- Platform will perform substantially as described
- Will not infringe third-party IP rights
- Complies with applicable laws

DISCLAIMER: Platform provided "AS IS" without warranties of merchantability
or fitness for particular purpose.

## 9. LIABILITY LIMITATION

Total liability under this Agreement is capped at:
- 12 months of annual fees paid
- Excludes indemnification obligations
- Excludes data breach/security incidents

## 10. CONFIDENTIALITY

Both parties will:
- Maintain confidentiality of proprietary information
- Not disclose pricing/terms without written consent
- Limit access to "need to know" personnel

## 11. COMPLIANCE & REGULATIONS

- Company complies with SOC2, GDPR, CCPA
- Customer responsible for data residency compliance
- Custom compliance available (HIPAA, FedRAMP)

---

**Authorized by:**

Company:  ______________________ Date: ________
Customer: ______________________ Date: ________
```

### Custom Feature Development Agreement

Use this when enterprise customer needs bespoke development work.

```markdown
# STATEMENT OF WORK (SOW)
# Custom Development for [CUSTOMER NAME]

**Effective Date:** [DATE]
**Completion Date:** [DATE] (estimated)
**Cost:** $[AMOUNT] ($[RATE]/hour, [HOURS] hours)

## SCOPE OF WORK

Customer requests the following custom development:

1. [Feature/Integration Name]
   - Description: [What we're building]
   - Requirements: [Specific capabilities]
   - Success criteria: [How we measure success]
   - Estimated hours: [X hours]

2. [Additional features as needed]

## TIMELINE

- Week 1–2: Requirements gathering & design review
- Week 3–4: Development & testing
- Week 5: Deployment & training
- Week 6: Support & optimization

## DELIVERABLES

Company will deliver:
- Fully functional feature in production
- API documentation
- User training (2 sessions, max 20 attendees)
- 30 days of post-launch support

## PAYMENT SCHEDULE

- 50% due upon SOW signature
- 50% due upon completion/deployment

## INTELLECTUAL PROPERTY

- Custom code ownership: [Company/Customer/Shared]
- Customer may use custom code internally
- Company may use learnings/patterns in product

## SUPPORT & CHANGES

- Scope changes require written amendment
- Additional hours billed at $[RATE]/hour
- Out-of-scope requests will be declined or added to future SOW

---

Authorized by:
Company:  ______________________ Date: ________
Customer: ______________________ Date: ________
```

### Service Level Agreement (SLA) Terms

```markdown
# SERVICE LEVEL AGREEMENT ADDENDUM

## UPTIME COMMITMENT

| Tier | Monthly Uptime | Monthly Downtime Budget |
|------|----------------|------------------------|
| Growth | 99.5% | 3.6 hours |
| Strategic | 99.9% | 43 minutes |
| Partner | 99.95% | 22 minutes |

Uptime measured from external monitors, excluding:
- Scheduled maintenance (announced 7 days in advance)
- Customer-caused outages (misconfiguration, DDoS, etc.)
- Third-party service outages (cloud provider, ISP)
- Force majeure events

## SERVICE CREDITS

If monthly uptime falls below commitment:
- 90%–99.4% uptime = 5% monthly fee credit
- 95%–98.9% uptime = 10% monthly fee credit
- <95% uptime = 25% monthly fee credit

Max credits: 3 months per calendar year

## INCIDENT RESPONSE

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|----------------|-----------------|
| Critical | Platform down, all users affected | 15 minutes | 2 hours |
| High | Major feature unavailable, >50% users affected | 1 hour | 4 hours |
| Medium | Feature partially unavailable, <50% users affected | 4 hours | 24 hours |
| Low | Minor issue, workaround available | 24 hours | 7 days |

## MONTHLY REPORTING

Company will provide:
- Monthly uptime report with incident details
- Performance metrics (API latency, throughput)
- Roadmap updates & feature releases
- Security incident disclosure (if any)
```

---

## 🏆 REFERENCE CUSTOMERS & CASE STUDIES

### Case Study Template

When customer asks "Do you work with companies like us?" — have these ready.

```markdown
# CASE STUDY: [CUSTOMER NAME]

**Company:** [Name], [$ARR], [Industry]
**Team Size:** [X people], [Department]
**Challenge:** [What they were struggling with]

## SITUATION

[Customer] was using [Old tools/process]. Challenges:
- Tool sprawl: 4 different platforms
- Cost: $X/month across all vendors
- Integration complexity: Manual data syncing
- Scalability issue: API limits hit monthly

## SOLUTION

Implemented Forge Platform with:
- [Feature 1] for [use case]
- [Feature 2] for [use case]
- Custom integration with [system]
- Dedicated support for [team]

## RESULTS

- 50% cost reduction ($X → $Y annually)
- 80% time savings on integration work
- Zero API limit issues (unlimited tier)
- 3 legacy tools eliminated
- Team satisfaction: 9/10

## TIMELINE

- POC: 2 weeks
- Implementation: 4 weeks
- Full deployment: 6 weeks

## QUOTE

"Forge replaced our tool sprawl with a single, scalable platform. We cut costs
and eliminated the integration headaches that were slowing us down."

— [Buyer name], [Title], [Customer name]

---

Contact: [Customer success manager]
```

### Industry-Specific Reference Mapping

| Industry | Customer Count | Typical Use Case |
|----------|---------------|-----------------|
| FinServ | 12 | Risk assessment, compliance automation |
| HealthTech | 8 | Patient data workflows, HIPAA compliance |
| SaaS | 24 | Product integration, customer success |
| EdTech | 6 | Student data management, analytics |
| Gov Contractor | 4 | Security compliance (FedRAMP) |

---

## 🎤 COMPETITIVE BATTLECARDS

### vs. Zapier / Integromat
```
CLAIM: "We use Zapier for workflow automation"

OUR RESPONSE:
✓ Zapier is consumer-grade; Forge is enterprise-grade
✓ Zapier = 5+ tools cobbled together; Forge = single platform
✓ Zapier pricing explodes at scale ($500/mo → $5000+/mo)
✓ Zapier has IP concerns (Zapier owns your workflow logic)
✓ Forge offers dedicated support and SLAs
✓ Reference: [Customer] saved 65% switching from Zapier to Forge
```

### vs. AWS Lambda / Custom Build
```
CLAIM: "We're building our own infrastructure"

OUR RESPONSE:
✓ Custom build costs 3× more than Forge licensing
✓ We handle ops burden (scaling, security patches, compliance)
✓ Time-to-market: 6 months engineer time vs. 4 weeks with Forge
✓ Opportunity cost: Your engineers could be building product
✓ Compliance: We handle SOC2, HIPAA, FedRAMP
✓ Reference: [Competitor] abandoned custom build after 18 months
```

### vs. Microsoft / Salesforce Ecosystem
```
CLAIM: "We're standardized on Microsoft / Salesforce"

OUR RESPONSE:
✓ Forge integrates with your existing stack (not lock-in)
✓ Best-of-breed vs. feature bloat
✓ No forced upgrades or license creep
✓ More flexible pricing (pay for what you use)
✓ Faster feature velocity (startup speed, not enterprise inertia)
✓ Reference: [Enterprise] cut Salesforce costs 40% with Forge supplements
```

---

## 📞 SALES CADENCE & CLOSING PLAYBOOK

### Discovery Call Agenda (30 minutes)

```
0:00–2:00   Rapport & context
            "Tell me about your team and current stack"

2:00–8:00   Problem discovery
            - What systems are you currently using?
            - What's broken or painful?
            - How much time is spent on integration/manual work?
            - What's your budget for tooling?

8:00–14:00  Solution exploration
            - "Here's how Forge solves [problem 1]"
            - "Here's how Forge solves [problem 2]"
            - "Here's how we're different from [competitor]"

14:00–22:00 Technical fit assessment
            - Can Forge integrate with their stack?
            - Do we have the compliance certifications they need?
            - Can we scale to their size?

22:00–27:00 Next steps
            - "Let's do a 2-week POC with your team"
            - "I'll send over reference customers in your industry"
            - "Let's set up technical evaluation with our CTO"

27:00–30:00 Close & action items
            - Confirm next call date
            - What questions do they have?
```

### Objection Handling

**"We need to evaluate 3 other vendors"**
- Response: "That's smart. Here's how we compare:
  * [Competitor A]: Cheaper but no enterprise support
  * [Competitor B]: Better UI but scales poorly
  * We're the only ones with [unique capability]
  
  Question: If we can prove [unique capability] saves you $X/year,
  would that be worth a deeper evaluation?"

**"We don't have budget this year"**
- Response: "I understand. Let's plan for next fiscal year.
  Can we do a 4-week evaluation now so you're ready to deploy
  on day 1 of your new budget cycle? That saves 2 months."

**"Our IT security team needs to review this"**
- Response: "Smart. Let me set up a call with our security team.
  We have SOC2 Type II, can do HIPAA BAA, and pass every
  enterprise security audit. Your team will feel good about this."

**"We need to think about it"**
- Response: "Totally. Let me send over:
  1. Case studies from [similar company]
  2. ROI calculator for your size/use case
  3. Risk comparison: staying with legacy vs. moving to Forge
  
  When should we reconnect to discuss?"

### Closing Techniques

**Assumptive Close**
- "Perfect, so I'll draft the contract for a 1-year term at $X/month
  starting [date]. Does that work for you?"

**Alternative Close**
- "We can start with Growth tier at $50K/year, or go straight to
  Strategic at $150K with more features included. Which makes more
  sense for your team?"

**Urgency Close**
- "If we sign by [date], I can get you 10% early-adopter discount
  plus free custom integration work. After that, pricing goes to list."

---

## 📊 DEAL METRICS & FORECASTING

### Pipeline Health

Track these metrics weekly:

```
OPPORTUNITY STAGE DEFINITIONS:

Stage 1: Lead / Early Discovery
├─ Qualification criteria: Company size, budget, need
├─ Activity: Initial call, initial interest
├─ Close probability: 5%
└─ Typical duration: 1–2 weeks

Stage 2: Technical Evaluation
├─ Qualification criteria: POC approved, decision maker identified
├─ Activity: Demo, feature evaluation, competitor comparison
├─ Close probability: 25%
└─ Typical duration: 2–4 weeks

Stage 3: Commercial Discussion
├─ Qualification criteria: Budget confirmed, legal engaged
├─ Activity: Pricing negotiation, contract review
├─ Close probability: 60%
└─ Typical duration: 2–6 weeks

Stage 4: Negotiation / Legal Review
├─ Qualification criteria: Both parties agree on terms
├─ Activity: Legal redlines, SLA negotiation, final approvals
├─ Close probability: 75%
└─ Typical duration: 1–4 weeks

Stage 5: Closed Won / Implementation
├─ Close probability: 100%
├─ Activity: Contract signed, implementation kickoff
└─ Post-sale: Onboarding, training, go-live

PIPELINE REPORT

Metric | Target | This Month | Trend
------|--------|-----------|------
Opportunities in pipeline | 15 | 18 | ↑
Weighted pipeline value | $2.0M | $2.4M | ✓
Close rate (overall) | 25% | 28% | ✓
Average deal size | $120K | $135K | ✓
Sales cycle (avg) | 4 months | 4.2 months | ≈

Win/Loss Rate by Stage:
└─ Stage 2 → Stage 3: 40% advance rate
└─ Stage 3 → Stage 4: 70% advance rate
└─ Stage 4 → Stage 5: 85% close rate
```

---

## ✅ IMPLEMENTATION PLAYBOOK

Once deal is closed, follow this timeline:

### Week 1–2: Kickoff
- [ ] Customer success manager assigned
- [ ] Executive sponsor intro call
- [ ] Technical team kickoff
- [ ] Data migration plan drafted
- [ ] User training schedule confirmed

### Week 3–4: Setup & Customization
- [ ] Customer data ingested
- [ ] Custom features developed (if SOW)
- [ ] API integrations configured
- [ ] User accounts & SSO setup
- [ ] Compliance/security hardening

### Week 5–6: Testing & Training
- [ ] UAT (User Acceptance Testing) period
- [ ] Bug fixes from UAT
- [ ] User training sessions (2–3 cohorts)
- [ ] Executive training (leadership users)
- [ ] Go-live readiness checklist

### Week 7–8: Go-Live & Support
- [ ] Full platform launch
- [ ] 24/7 support during go-live week
- [ ] Daily check-ins (first 5 days)
- [ ] Issue resolution and optimization
- [ ] Success metrics review

### Weeks 9–12: Stabilization & Expansion
- [ ] Weekly business reviews
- [ ] Usage analytics review
- [ ] Feature adoption coaching
- [ ] Roadmap discussion for Year 2
- [ ] Renewal / expansion planning

### Monthly: Ongoing Support
- [ ] Monthly business review (Strategic+ tier)
- [ ] Quarterly strategic review (Partner tier)
- [ ] Feature request evaluation
- [ ] Expansion opportunity identification

---

## 🎁 DEAL SWEETENERS & NEGOTIATION LEVERAGE

When deal is stalling at final stage:

| Sweetener | Cost to Company | Value to Customer |
|-----------|-----------------|-----------------|
| Professional services hours (100 hrs) | $15K | Seen as $30K+ value |
| Free annual upgrade | $2K | Seen as $5K+ value |
| Dedicated success manager (added) | $20K/year | Seen as $40K+ value |
| Custom feature development | $50K+ | Can be $100K+ ROI for customer |
| Annual discount (-10%) | 10% ARR | Seen as big concession |
| Lock-in discount (-15% for 3-year) | 15% × 3 = 45% total | Major incentive to commit |
| Free compliance audit | $5K | Seen as free risk reduction |
| Priority in product roadmap | $0 | Huge intangible value |

**When to use:**
- Use **only** if deal stalls at final stage
- Never lead with discounts; lead with value
- Bundle sweeteners (don't give one at a time)
- Example: "If you commit to 3 years, I can add 200 dev hours +10% discount"

---

## 🚀 YEAR 2 EXPANSION PLAYBOOK

Once customer is live and successful:

### Month 1–3: Stabilization & Adoption
- Ensure users are engaged
- Measure value vs. pre-sale promise
- Capture early wins / success stories
- Identify new departments that could use Forge

### Month 4–6: Expansion Discussion
- Quarterly business review: "How are we delivering value?"
- Identify 2–3 expansion opportunities:
  - "Your marketing team could use Forge for [use case]"
  - "We've released [new feature] that could solve [problem]"
  - "Other customers like you expanded to [department]"
- Build business case for expansion investment

### Month 7–9: Expansion Pilot
- Deploy Forge to new team/department
- Run 6-week pilot with usage goals
- Capture ROI from pilot
- Budget for full deployment

### Month 10–12: Expansion & Renewal
- Expand platform to full team
- Upgrade tier if usage grew (Growth → Strategic)
- Negotiate renewal + expansion bundle
- Lock in multi-year deal with expansion included

**Expansion Revenue Target:** 30–50% uplift from Year 1

---

## 📞 KEY RESOURCES

**Sales Tools:**
- [Pricing calculator spreadsheet]
- [Competitive battlecard deck]
- [ROI calculator template]
- [Reference customer list with contacts]
- [Legal contract templates (above)]

**Training Materials:**
- [Sales onboarding deck]
- [Product walkthrough video]
- [Integration demo library]
- [Customer success stories]

**Escalation Contacts:**
- VP Sales: [Name] [Email]
- Product Lead: [Name] [Email]
- CTO for technical calls: [Name] [Email]
- Legal for contract review: [Name] [Email]

---

## ✨ SUCCESS METRICS

You've executed this playbook successfully when:

- ✅ Enterprise pipeline is 3× quota at all times
- ✅ Average deal size is $100K+ ARR
- ✅ Sales cycle is 4–5 months (not 6+)
- ✅ Close rate is 25%+ (1 in 4 opportunities)
- ✅ Expansion revenue is 30%+ of Year 1 ARR
- ✅ Customer NPS is 50+ (enterprise customers happy)
- ✅ Reference customers willingly take calls
- ✅ Win rate vs. competitors is 60%+
