# Stripe Setup Guide for Forge

## Overview
Complete guide to integrate Stripe payment processing for Forge subscription billing.

## Phase 1: Stripe Account Setup

### 1.1 Create Stripe Account
- Go to [stripe.com](https://stripe.com)
- Sign up with your business email
- Verify email
- Add business details
- Activate account

### 1.2 Get API Keys
Navigate: **Settings → API Keys**

- **Publishable Key**: `pk_live_...` (for frontend)
- **Secret Key**: `sk_live_...` (for backend)
- **Webhook Signing Secret**: `whsec_...` (for webhooks)

**Store securely in environment variables:**
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Phase 2: Create Products & Pricing

### 2.1 Create Forge Product (Dashboard)

1. **Products → Add Product**
   - Name: `Forge`
   - Description: `The all-in-one team collaboration platform`
   - Image: Upload Forge logo
   - Tax code: `txcd_20030000` (Software as a Service)

2. **Save Product**
   - Note Product ID: `prod_...`

### 2.2 Create Pricing Plans

#### Plan 1: Professional (Monthly)
- **Product**: Forge
- **Price Name**: `Professional - Monthly`
- **Billing period**: Monthly
- **Unit price**: $49.00
- **Currency**: USD
- **Recurring**: Yes, Monthly
- **Metadata**: `{"plan": "professional", "billing_cycle": "monthly"}`

**Price ID**: `price_pro_monthly`

#### Plan 2: Professional (Annual)
- **Product**: Forge
- **Price Name**: `Professional - Annual`
- **Billing period**: Yearly
- **Unit price**: $490.00 (2 months free)
- **Currency**: USD
- **Recurring**: Yes, Yearly
- **Metadata**: `{"plan": "professional", "billing_cycle": "annual"}`

**Price ID**: `price_pro_annual`

#### Plan 3: Enterprise (Custom)
- **Product**: Forge
- **Price Name**: `Enterprise`
- **Billing period**: Monthly
- **Unit price**: $299.00
- **Currency**: USD
- **Recurring**: Yes, Monthly
- **Metadata**: `{"plan": "enterprise", "billing_cycle": "monthly"}`

**Price ID**: `price_enterprise`

### 2.3 Plan Details in Forge Dashboard

Once created in Stripe, update your Forge database with these details:

```sql
INSERT INTO billing_plans (name, stripe_price_id, cost, features, active) VALUES
('Professional Monthly', 'price_pro_monthly', 49.00, '{"users": 50, "storage": 500}', true),
('Professional Annual', 'price_pro_annual', 490.00, '{"users": 50, "storage": 500}', true),
('Enterprise', 'price_enterprise', 299.00, '{"users": 500, "storage": 5000}', true);
```

## Phase 3: Set Up Webhooks

### 3.1 Register Webhook Endpoint

1. **Settings → Webhooks**
2. **Add endpoint**
   - URL: `https://api.forge.app/api/webhooks/stripe`
   - Version: Latest API version
   - Events to receive:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

3. **Copy Signing Secret** → Store as `STRIPE_WEBHOOK_SECRET`

### 3.2 Webhook Processing

Your `/api/webhooks/stripe` endpoint receives JSON:

```json
{
  "id": "evt_1234",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_1234",
      "customer": "cus_1234",
      "status": "active",
      "items": {...}
    }
  }
}
```

**Webhook handler flow:**
1. Verify signature using `STRIPE_WEBHOOK_SECRET`
2. Parse event type
3. Update Forge database
4. Send confirmation email to customer
5. Return `{received: true}`

## Phase 4: Frontend Integration

### 4.1 Install Stripe.js

```bash
npm install @stripe/stripe-js
```

### 4.2 Create Payment Form Component

```javascript
import React from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function PaymentForm() {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: elements.getElement(CardElement)
        });

        if (error) {
            console.error(error);
        } else {
            // Send paymentMethod.id to backend
            const response = await fetch('/api/billing/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_method_id: paymentMethod.id,
                    price_id: 'price_pro_monthly'
                })
            });
            console.log(response);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement />
            <button type="submit">Subscribe ($49/mo)</button>
        </form>
    );
}

export function App() {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm />
        </Elements>
    );
}
```

### 4.3 Subscription Modal

Add to onboarding flow after user selects plan:

```javascript
<Modal title="Add Payment Method">
    <Elements stripe={stripePromise}>
        <PaymentForm onSuccess={completeOnboarding} />
    </Elements>
</Modal>
```

## Phase 5: Backend Setup

### 5.1 Environment Variables

```bash
# .env
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5.2 Initialize Stripe in Backend

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### 5.3 Implement Payment Endpoints

See `stripe-integration.js` for complete implementation.

**Key endpoints:**
- `POST /api/billing/subscribe` - Create subscription
- `POST /api/billing/setup-intent` - Add payment method
- `GET /api/billing/invoices` - Get customer invoices
- `POST /api/webhooks/stripe` - Receive webhook events

### 5.4 Database Schema

```sql
CREATE TABLE stripe_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_price_id VARCHAR(255),
    status ENUM('active', 'trialing', 'past_due', 'canceled'),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    amount_paid INT,
    amount_due INT,
    status VARCHAR(50),
    pdf_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    brand VARCHAR(50),
    last_four VARCHAR(4),
    exp_month INT,
    exp_year INT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Phase 6: Testing

### 6.1 Test Payment Cards

Use Stripe test cards (only in test mode):

| Card | Number | Exp | CVC |
|------|--------|-----|-----|
| Visa | 4242 4242 4242 4242 | 12/25 | 123 |
| Visa (Decline) | 4000 0000 0000 0002 | 12/25 | 123 |
| Amex | 3782 822463 10005 | 12/25 | 1234 |
| Mastercard | 5555 5555 5555 4444 | 12/25 | 123 |

### 6.2 Test Flows

1. **Successful Payment**
   - Use 4242 4242 4242 4242
   - Verify subscription created in Stripe dashboard
   - Check webhook in Logs

2. **Failed Payment**
   - Use 4000 0000 0000 0002
   - Verify error handling
   - Check webhook for failure event

3. **Subscription Lifecycle**
   - Create subscription
   - Update subscription (change plan)
   - Cancel subscription
   - Verify all webhooks received

### 6.3 Manual Webhook Testing

```bash
# Trigger a test webhook
curl -X POST https://api.forge.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: SIGNATURE" \
  -d '{"type": "customer.subscription.created", ...}'
```

Or use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger customer.subscription.created
```

## Phase 7: Billing Dashboard

### 7.1 Display Invoices

```javascript
// GET /api/billing/invoices
async function getInvoices(req, res) {
    const user = req.user;
    const invoices = await stripe.invoices.list({
        customer: user.stripe_customer_id,
        limit: 12
    });

    res.json({
        invoices: invoices.data.map(inv => ({
            id: inv.id,
            date: inv.created,
            amount: inv.total / 100,
            status: inv.status,
            pdf: inv.invoice_pdf
        }))
    });
}
```

### 7.2 Display Subscription Details

```javascript
// Show current plan, next billing date, etc.
async function getSubscription(req, res) {
    const user = req.user;
    const subscription = await stripe.subscriptions.retrieve(
        user.stripe_subscription_id
    );

    res.json({
        plan: subscription.items.data[0].price.nickname,
        status: subscription.status,
        nextBillingDate: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
}
```

## Phase 8: Compliance & Security

### 8.1 PCI Compliance
- Never handle raw card data
- Use Stripe Elements (PCI Level 1 compliant)
- Always transmit over HTTPS
- Store only Stripe token IDs, never card numbers

### 8.2 Webhook Security
```javascript
// Always verify signature
const sig = req.headers['stripe-signature'];
try {
    const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
    );
} catch (error) {
    return res.status(400).send('Webhook error: ' + error.message);
}
```

### 8.3 Data Protection
- Encrypt Stripe customer IDs in database
- Implement audit logging for all transactions
- Follow GDPR/CCPA requirements for payment data
- Implement rate limiting on billing endpoints

## Phase 9: Error Handling

### Common Errors & Recovery

```javascript
// Insufficient funds
if (error.code === 'card_declined') {
    // Show UI: "Your card was declined. Try another card."
    // Offer alternative payment methods
}

// Invalid card
if (error.code === 'incorrect_cvc') {
    // Show UI: "Incorrect CVC. Please try again."
}

// Subscription already exists
if (error.message.includes('already subscribed')) {
    // Upgrade existing subscription instead
}

// Payment method expired
if (error.code === 'expired_card') {
    // Prompt user to update payment method
}
```

## Phase 10: Go-Live Checklist

- [ ] Stripe account created and verified
- [ ] Products and prices created in Stripe
- [ ] API keys stored in environment variables
- [ ] Webhook endpoint registered and tested
- [ ] Frontend payment form integrated
- [ ] Backend payment endpoints implemented
- [ ] Database schema created
- [ ] Test mode verified with test cards
- [ ] Production keys configured
- [ ] Email notifications set up
- [ ] Subscription dashboard built
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Documentation written for support team

## Monitoring & Alerts

### 8.1 Set Up Alerts in Stripe Dashboard

1. **Settings → Alerts**
2. Enable:
   - Payment failed alerts
   - High chargeback rate
   - Low balance warnings
   - API errors

### 8.2 Monitor in Application

- Track failed payment attempt rate
- Monitor webhook delivery latency
- Alert on subscription cancellations
- Track churn by plan

## Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Dashboard**: https://dashboard.stripe.com
- **API Reference**: https://stripe.com/docs/api
- **Support**: support@stripe.com

---

**Estimated Setup Time**: 2-3 hours
**Status**: Ready for implementation
