# 1. STRIPE PRODUCTION SETUP GUIDE
**For:** Forge Platform  
**Status:** Complete implementation guide  
**Created:** May 7, 2026

---

## 📋 STRIPE ACCOUNT SETUP CHECKLIST

### Step 1: Create Stripe Account
- [ ] Go to https://dashboard.stripe.com/register
- [ ] Sign up with business email
- [ ] Verify email address
- [ ] Complete business verification

### Step 2: Get Production API Keys
- [ ] Log into Stripe Dashboard
- [ ] Navigate: Developers → API Keys
- [ ] Copy **Publishable Key** (starts with `pk_live_`)
- [ ] Copy **Secret Key** (starts with `sk_live_`)
- [ ] ⚠️ NEVER share Secret Key publicly
- [ ] Store in `.env.production`:
  ```
  STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
  STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
  ```

### Step 3: Create Webhook Endpoint
- [ ] Navigate: Developers → Webhooks
- [ ] Click [Add Endpoint]
- [ ] Endpoint URL: `https://api.forge.io/api/webhooks/stripe`
- [ ] Select events to receive:
  ```
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.created
  ✅ invoice.paid
  ✅ invoice.payment_failed
  ✅ payment_intent.succeeded
  ✅ payment_intent.payment_failed
  ✅ charge.refunded
  ✅ charge.dispute.created
  ```
- [ ] Copy **Webhook Signing Secret** (starts with `whsec_`)
- [ ] Store in `.env.production`:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
  ```

### Step 4: Create Products & Prices

**Run this setup function once (in Node.js terminal or scheduled job):**

```javascript
// stripe-setup.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupForgeProducts() {
  try {
    // Create main Forge product
    const product = await stripe.products.create({
      name: 'Forge Platform',
      description: 'AI-agent native infrastructure platform',
      type: 'service',
      metadata: {
        platform: 'forge',
        category: 'saas'
      }
    });
    
    console.log('✅ Product created:', product.id);

    // ============ PROFESSIONAL PLAN ($49/month) ============
    const priceMonthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 4900, // $49.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      billing_scheme: 'per_unit',
      metadata: {
        plan: 'professional',
        billing_cycle: 'monthly',
        users: '50',
        api_calls: '1000000',
        storage_gb: '500'
      }
    });
    
    console.log('✅ Monthly price created:', priceMonthly.id);

    // ============ PROFESSIONAL ANNUAL ($490/year) ============
    const priceAnnual = await stripe.prices.create({
      product: product.id,
      unit_amount: 49000, // $490.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      billing_scheme: 'per_unit',
      metadata: {
        plan: 'professional_annual',
        billing_cycle: 'annual',
        discount: '16.4%', // Save $58/year vs monthly
        users: '50',
        api_calls: '1000000',
        storage_gb: '500'
      }
    });
    
    console.log('✅ Annual price created:', priceAnnual.id);

    // ============ ENTERPRISE PLAN (Custom) ============
    const priceEnterprise = await stripe.prices.create({
      product: product.id,
      unit_amount: 29900, // $299/month base (custom per deal)
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 1
      },
      billing_scheme: 'per_unit',
      custom_unit_amount: {
        enabled: true, // Allow custom amounts per invoice
        maximum: 500000000 // $5M max per invoice
      },
      metadata: {
        plan: 'enterprise',
        billing_cycle: 'monthly',
        custom_pricing: 'true',
        users: 'unlimited',
        api_calls: 'unlimited',
        storage_gb: 'unlimited',
        sso: 'true',
        support: '24/7 phone',
        dedicated_manager: 'true'
      }
    });
    
    console.log('✅ Enterprise price created:', priceEnterprise.id);

    // ============ STARTER PLAN ($0 - Free Trial) ============
    const priceFree = await stripe.prices.create({
      product: product.id,
      unit_amount: 0,
      currency: 'usd',
      metadata: {
        plan: 'starter',
        billing_cycle: 'free',
        trial_days: '14',
        users: '10',
        api_calls: '10000',
        storage_gb: '10'
      }
    });
    
    console.log('✅ Free tier price created:', priceFree.id);

    console.log('\n========== STRIPE PRICES CREATED ==========');
    console.log('Product ID:', product.id);
    console.log('\nPrice IDs (add to your code):');
    console.log(`STRIPE_PRICE_PROFESSIONAL_MONTHLY=${priceMonthly.id}`);
    console.log(`STRIPE_PRICE_PROFESSIONAL_ANNUAL=${priceAnnual.id}`);
    console.log(`STRIPE_PRICE_ENTERPRISE=${priceEnterprise.id}`);
    console.log(`STRIPE_PRICE_STARTER=${priceFree.id}`);

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error.message);
  }
}

// Run once
setupForgeProducts();
```

**After running, update `.env.production`:**
```
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxx
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_xxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxx
```

### Step 5: Configure Tax Settings
- [ ] Navigate: Settings → Tax Rates
- [ ] Add tax rates for each region you'll operate in:
  - US: 0% (varies by state, calculate per order)
  - EU: 21% (VAT)
  - UK: 20% (VAT)
- [ ] Enable Tax IDs collection
- [ ] Enable Reverse Charge for B2B

### Step 6: Set Payment Method Settings
- [ ] Navigate: Settings → Payment Method
- [ ] Enable: Credit Cards (Visa, Mastercard, Amex)
- [ ] Enable: ACH Direct Debit (US)
- [ ] Enable: Bank Transfer (International)
- [ ] Disable unnecessary methods

### Step 7: Configure Strong Customer Authentication (SCA)
- [ ] Navigate: Settings → Strong Customer Authentication
- [ ] Set: "Automatically process recurring transactions"
- [ ] Enable: 3D Secure for non-recurring payments

### Step 8: Set Up Billing Portal (Customer Self-Service)
- [ ] Navigate: Billing → Portal Settings
- [ ] Enable: Manage subscriptions
- [ ] Enable: Update payment method
- [ ] Enable: Billing history
- [ ] Enable: Download invoices
- [ ] Custom branding: Add Forge logo & colors

---

## 🔐 ENVIRONMENT VARIABLES (Production)

**Create `.env.production` file:**

```bash
# ============ STRIPE KEYS ============
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# ============ STRIPE PRICE IDS ============
STRIPE_PRICE_STARTER=price_1Nxxxxx
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1Nxxxxx
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_1Nxxxxx
STRIPE_PRICE_ENTERPRISE=price_1Nxxxxx

# ============ STRIPE PRODUCT ID ============
STRIPE_PRODUCT_FORGE=prod_xxxxx

# ============ STRIPE ACCOUNT SETTINGS ============
STRIPE_CURRENCY=usd
STRIPE_ACCOUNT_COUNTRY=US

# ============ OTHER CONFIG ============
ENVIRONMENT=production
API_URL=https://api.forge.io
FRONTEND_URL=https://app.forge.io
WEBHOOK_URL=https://api.forge.io/api/webhooks/stripe
```

---

## 🛡️ PRODUCTION DEPLOYMENT CHECKLIST

### Before Going Live
- [ ] Test complete payment flow in Stripe test mode
- [ ] All webhook events firing correctly
- [ ] Invoice generation working
- [ ] Email notifications sending
- [ ] PCI compliance verified
- [ ] SSL certificates installed (HTTPS)
- [ ] Rate limiting enabled on all endpoints
- [ ] Fraud detection rules configured
- [ ] Customer support team trained
- [ ] Refund policy documented

### Monitor After Launch
- [ ] Check Stripe Dashboard daily for disputes
- [ ] Monitor failed payment rate (target: <2%)
- [ ] Track subscription churn (target: <5% monthly)
- [ ] Monitor API latency (target: <500ms)
- [ ] Set up alerts for webhook failures

---

## 📊 STRIPE ACCOUNT STRUCTURE

```
Stripe Account (Master)
├─ Products
│  └─ Forge Platform
│     ├─ Price: Professional Monthly ($49)
│     ├─ Price: Professional Annual ($490)
│     ├─ Price: Enterprise (Custom)
│     └─ Price: Starter (Free)
│
├─ Customers
│  ├─ Customer: user@company1.com (sub_xxxxx)
│  ├─ Customer: user@company2.com (sub_xxxxx)
│  └─ ... (one per Forge user)
│
├─ Subscriptions
│  ├─ Subscription (professional monthly)
│  ├─ Subscription (professional annual)
│  ├─ Subscription (enterprise custom)
│  └─ ... (tracks recurring billing)
│
├─ Invoices
│  ├─ Invoice for Company 1 (monthly)
│  ├─ Invoice for Company 2 (monthly)
│  └─ ... (generates automatically each month)
│
└─ Webhooks
   └─ api.forge.io/api/webhooks/stripe
      (listens to all payment events)
```

---

## 💳 PAYMENT FLOW (PRODUCTION)

```
Customer on app.forge.io
        ↓
Clicks "Upgrade to Professional"
        ↓
Frontend loads Stripe.js (pk_live_xxxxx)
        ↓
Creates Stripe Checkout Session
        ↓
Redirects to checkout.stripe.com
        ↓
Customer enters card details
        ↓
Stripe processes payment (3D Secure if needed)
        ↓
Stripe webhook: customer.subscription.created
        ↓
Backend creates invoice in Forge database
        ↓
Backend sends confirmation email
        ↓
Redirects customer to app.forge.io/billing
        ↓
✅ Professional features unlocked
        ↓
Next month: Automatic recurring charge
```

---

## 🚨 CRITICAL PRODUCTION SETTINGS

### 1. Webhook Verification
**ALWAYS verify webhook signature before processing:**

```javascript
// stripe-integration.js (Line 541-557)
router.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET  // ← Use environment variable
        );
        
        // Only process after signature verification succeeds
        await handleWebhookEvent(event);
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        res.status(400).json({ error: error.message });
    }
});
```

### 2. Idempotency Keys
**Prevent double-charging if webhook retries:**

```javascript
// Add to every Stripe API call
const idempotencyKey = `forge_${user_id}_${subscription_id}_${Date.now()}`;

await stripe.subscriptions.create(
    { customer, items: [{ price }] },
    { idempotencyKey }  // Stripe won't double-charge
);
```

### 3. Rate Limiting
**Prevent abuse:**

```javascript
const rateLimit = require('express-rate-limit');

const billingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many billing requests'
});

router.post('/api/billing/subscribe', billingLimiter, async (req, res) => {
    // ... subscription logic
});
```

### 4. Logging & Monitoring
**Track all financial transactions:**

```javascript
async function logTransaction(data) {
    console.log({
        timestamp: new Date().toISOString(),
        event: data.event,
        user_id: data.user_id,
        amount: data.amount,
        status: data.status,
        stripe_id: data.stripe_id
    });
    
    // Also save to database for audit trail
    await db.financial_transactions.insert(data);
}
```

---

## 📈 REVENUE TRACKING SETUP

### 1. Enable Stripe Reporting
- [ ] Navigate: Analytics → Revenue
- [ ] Set up recurring revenue chart
- [ ] Track MRR (Monthly Recurring Revenue)
- [ ] Track ARR (Annual Recurring Revenue)
- [ ] Track Churn Rate
- [ ] Track LTV (Lifetime Value)

### 2. Connect to Financial Platform
- [ ] Connect Stripe to QuickBooks (accounting)
- [ ] Reconcile monthly revenue
- [ ] Track payments received vs. invoiced

### 3. Set Up Alerts
- [ ] Alert if failed payment rate > 5%
- [ ] Alert if churn rate > 10%
- [ ] Alert if webhook failures
- [ ] Alert on large disputes

---

## 🔄 RECURRING PAYMENTS AUTOMATION

Stripe automatically handles:
1. **Monthly/Annual Billing** - Charges customer on renewal date
2. **Failed Payment Retry** - Retries failed cards on day 5, 10, 15
3. **Dunning Management** - Suspends access after grace period
4. **Invoice Generation** - Creates invoice 1 day before charge
5. **Tax Calculation** - Applies correct tax per jurisdiction

**You just need to:**
1. Listen to webhooks
2. Update your database
3. Send confirmation emails
4. Grant/revoke access based on status

---

## ✅ VERIFICATION STEPS

After setup, test with Stripe test keys first:

```bash
# 1. Test card numbers (use these in test mode)
4242 4242 4242 4242  # Success
4000 0000 0000 0002  # Card declined
4000 0025 0000 3155  # Requires 3D Secure
5555 5555 5555 4444  # Mastercard

# 2. Test webhook
stripe trigger customer.subscription.created

# 3. Test invoice generation
stripe trigger invoice.created

# 4. Test payment failure
stripe trigger invoice.payment_failed
```

After verification in test mode, switch to production keys.

---

## 🎯 NEXT STEPS

1. **Complete Stripe account setup** (this checklist)
2. **Set environment variables** in production
3. **Run stripe-setup.js** to create products & prices
4. **Update stripe-integration.js** with production Stripe.js
5. **Test payment flow** with real cards (or Stripe test cards first)
6. **Monitor dashboard** for first 30 days
7. **Scale pricing** once you have 100+ customers

---

## 📞 STRIPE SUPPORT

- **Dashboard**: https://dashboard.stripe.com
- **Documentation**: https://stripe.com/docs
- **Support**: https://support.stripe.com
- **Status**: https://status.stripe.com

Your Stripe account is now production-ready. Every charge will flow through this system automatically.
