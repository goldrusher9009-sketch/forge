/**
 * Stripe Payment Integration for Forge
 *
 * Handles:
 * - Customer creation
 * - Subscription management
 * - Webhook processing
 * - Payment method handling
 * - Invoice generation
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Create a Stripe customer for a Forge user
 */
async function createStripeCustomer(forgeUser) {
    try {
        const customer = await stripe.customers.create({
            email: forgeUser.email,
            name: forgeUser.name,
            metadata: {
                forge_user_id: forgeUser.id,
                workspace_id: forgeUser.workspace_id
            }
        });

        return customer;
    } catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
    }
}

/**
 * Create a subscription for a customer
 */
async function createSubscription(stripeCustomerId, priceId, billingCycle = 'monthly') {
    try {
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent']
        });

        return subscription;
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }
}

/**
 * Update subscription (change plan, cancel, etc.)
 */
async function updateSubscription(subscriptionId, updates) {
    try {
        const subscription = await stripe.subscriptions.update(
            subscriptionId,
            updates
        );
        return subscription;
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
}

/**
 * Cancel subscription
 */
async function cancelSubscription(subscriptionId, immediateCancel = false) {
    try {
        const subscription = await stripe.subscriptions.update(
            subscriptionId,
            { cancel_at_period_end: !immediateCancel }
        );
        return subscription;
    } catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }
}

/**
 * Get subscription details
 */
async function getSubscription(subscriptionId) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return subscription;
    } catch (error) {
        console.error('Error retrieving subscription:', error);
        throw error;
    }
}

// ============================================================================
// PAYMENT METHOD MANAGEMENT
// ============================================================================

/**
 * Create a SetupIntent for adding payment methods
 */
async function createSetupIntent(stripeCustomerId) {
    try {
        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method_types: ['card']
        });
        return setupIntent;
    } catch (error) {
        console.error('Error creating setup intent:', error);
        throw error;
    }
}

/**
 * List payment methods for customer
 */
async function listPaymentMethods(stripeCustomerId) {
    try {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: stripeCustomerId,
            type: 'card'
        });
        return paymentMethods.data;
    } catch (error) {
        console.error('Error listing payment methods:', error);
        throw error;
    }
}

/**
 * Set default payment method
 */
async function setDefaultPaymentMethod(stripeCustomerId, paymentMethodId) {
    try {
        const customer = await stripe.customers.update(
            stripeCustomerId,
            { invoice_settings: { default_payment_method: paymentMethodId } }
        );
        return customer;
    } catch (error) {
        console.error('Error setting default payment method:', error);
        throw error;
    }
}

/**
 * Delete payment method
 */
async function deletePaymentMethod(paymentMethodId) {
    try {
        const result = await stripe.paymentMethods.detach(paymentMethodId);
        return result;
    } catch (error) {
        console.error('Error deleting payment method:', error);
        throw error;
    }
}

// ============================================================================
// INVOICING & BILLING
// ============================================================================

/**
 * Create a manual invoice
 */
async function createInvoice(stripeCustomerId, description, amount) {
    try {
        const invoice = await stripe.invoices.create({
            customer: stripeCustomerId,
            collection_method: 'charge_automatically',
            custom_fields: [{ name: 'Service', value: description }]
        });

        // Add line item
        await stripe.invoiceItems.create({
            invoice: invoice.id,
            customer: stripeCustomerId,
            amount: amount * 100, // Convert to cents
            description: description
        });

        // Finalize and send
        const finalInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        const sent = await stripe.invoices.sendInvoice(finalInvoice.id);

        return sent;
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
}

/**
 * Get invoice details
 */
async function getInvoice(invoiceId) {
    try {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        return invoice;
    } catch (error) {
        console.error('Error retrieving invoice:', error);
        throw error;
    }
}

/**
 * List invoices for customer
 */
async function listInvoices(stripeCustomerId, limit = 10) {
    try {
        const invoices = await stripe.invoices.list({
            customer: stripeCustomerId,
            limit: limit
        });
        return invoices.data;
    } catch (error) {
        console.error('Error listing invoices:', error);
        throw error;
    }
}

// ============================================================================
// WEBHOOK PROCESSING
// ============================================================================

/**
 * Handle Stripe webhook events
 */
async function handleWebhookEvent(event) {
    try {
        switch (event.type) {
            case 'customer.subscription.created':
                await onSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await onSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await onSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.paid':
                await onInvoicePaid(event.data.object);
                break;

            case 'invoice.payment_failed':
                await onInvoicePaymentFailed(event.data.object);
                break;

            case 'payment_intent.succeeded':
                await onPaymentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await onPaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
        throw error;
    }
}

/**
 * Subscription created webhook
 */
async function onSubscriptionCreated(subscription) {
    console.log('Subscription created:', subscription.id);

    // Update Forge database
    // UPDATE users SET stripe_subscription_id = ?, subscription_status = 'active' WHERE stripe_customer_id = ?

    // Send welcome email
    // sendEmail(subscription.customer_email, 'welcome', {...})
}

/**
 * Subscription updated webhook
 */
async function onSubscriptionUpdated(subscription) {
    console.log('Subscription updated:', subscription.id);

    // Update Forge database with new plan, status, etc.
    // UPDATE users SET plan = ?, next_billing_date = ? WHERE stripe_subscription_id = ?
}

/**
 * Subscription deleted webhook
 */
async function onSubscriptionDeleted(subscription) {
    console.log('Subscription deleted:', subscription.id);

    // Mark as canceled in database
    // UPDATE users SET subscription_status = 'canceled', plan = 'free' WHERE stripe_subscription_id = ?

    // Send cancellation email
    // sendEmail(subscription.customer_email, 'canceled', {...})
}

/**
 * Invoice paid webhook
 */
async function onInvoicePaid(invoice) {
    console.log('Invoice paid:', invoice.id);

    // Update invoice status in Forge database
    // Record payment in audit log
}

/**
 * Invoice payment failed webhook
 */
async function onInvoicePaymentFailed(invoice) {
    console.log('Invoice payment failed:', invoice.id);

    // Send payment failed email
    // sendEmail(invoice.customer_email, 'payment_failed', {...})

    // Mark subscription for cancellation after grace period
}

/**
 * Payment succeeded webhook
 */
async function onPaymentSucceeded(paymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id);

    // Record in audit log
}

/**
 * Payment failed webhook
 */
async function onPaymentFailed(paymentIntent) {
    console.log('Payment failed:', paymentIntent.id);

    // Send failure notification
    // Try alternative payment method if available
}

// ============================================================================
// PRICING & PLANS
// ============================================================================

/**
 * Forge Pricing Plans (configured in Stripe Dashboard)
 */
const FORGE_PLANS = {
    free: {
        name: 'Free',
        stripe_price_id: 'price_free_monthly',
        cost: 0,
        features: {
            users: 5,
            workspaces: 1,
            storage_gb: 10,
            api_calls_monthly: 10000,
            support: 'community'
        }
    },
    professional: {
        name: 'Professional',
        stripe_price_id: 'price_pro_monthly',
        cost: 49,
        billing_cycle: 'monthly',
        features: {
            users: 50,
            workspaces: 5,
            storage_gb: 500,
            api_calls_monthly: 1000000,
            support: 'email'
        }
    },
    professional_annual: {
        name: 'Professional (Annual)',
        stripe_price_id: 'price_pro_annual',
        cost: 490,
        billing_cycle: 'yearly',
        features: {
            users: 50,
            workspaces: 5,
            storage_gb: 500,
            api_calls_monthly: 1000000,
            support: 'email'
        }
    },
    enterprise: {
        name: 'Enterprise',
        stripe_price_id: 'price_enterprise_monthly',
        cost: 299,
        billing_cycle: 'monthly',
        custom: true,
        features: {
            users: 500,
            workspaces: 100,
            storage_gb: 5000,
            api_calls_monthly: 100000000,
            support: '24/7 phone',
            sso: true,
            custom_branding: true,
            dedicated_account_manager: true
        }
    }
};

// ============================================================================
// SETUP (Run once to create Stripe products/prices)
// ============================================================================

/**
 * Create Stripe products and prices for Forge plans
 * Run this once in setup, or manually create in Stripe dashboard
 */
async function setupStripePrices() {
    try {
        // Create product
        const product = await stripe.products.create({
            name: 'Forge',
            description: 'The all-in-one team collaboration platform'
        });

        // Create monthly price
        const monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: 4900, // $49.00
            currency: 'usd',
            recurring: { interval: 'month' },
            metadata: { plan: 'professional' }
        });

        // Create annual price
        const annualPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: 49000, // $490.00
            currency: 'usd',
            recurring: { interval: 'year' },
            metadata: { plan: 'professional_annual' }
        });

        console.log('Stripe products created:');
        console.log('Product ID:', product.id);
        console.log('Monthly Price ID:', monthlyPrice.id);
        console.log('Annual Price ID:', annualPrice.id);

        return { product, monthlyPrice, annualPrice };
    } catch (error) {
        console.error('Error setting up Stripe prices:', error);
        throw error;
    }
}

// ============================================================================
// EXPRESS ROUTES
// ============================================================================

/**
 * POST /api/billing/subscribe
 * Start a new subscription
 */
router.post('/api/billing/subscribe', async (req, res) => {
    try {
        const { user_id, price_id } = req.body;

        // Get user from database
        // const user = await getUser(user_id);

        // Create or get Stripe customer
        // let stripeCustomer = await getStripeCustomer(user.stripe_customer_id);
        // if (!stripeCustomer) {
        //     stripeCustomer = await createStripeCustomer(user);
        // }

        // Create subscription
        // const subscription = await createSubscription(stripeCustomer.id, price_id);

        // Save to database
        // await updateUser(user_id, { stripe_subscription_id: subscription.id });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/billing/setup-intent
 * Get SetupIntent for adding payment method
 */
router.post('/api/billing/setup-intent', async (req, res) => {
    try {
        const { user_id } = req.body;

        // Get user and Stripe customer ID
        // const user = await getUser(user_id);
        // const setupIntent = await createSetupIntent(user.stripe_customer_id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/billing/invoices
 * Get invoices for user
 */
router.get('/api/billing/invoices', async (req, res) => {
    try {
        const user_id = req.user.id;

        // Get user and Stripe customer ID
        // const user = await getUser(user_id);
        // const invoices = await listInvoices(user.stripe_customer_id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook endpoint
 */
router.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        await handleWebhookEvent(event);

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: error.message });
    }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Functions
    createStripeCustomer,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getSubscription,
    createSetupIntent,
    listPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    createInvoice,
    getInvoice,
    listInvoices,
    handleWebhookEvent,
    setupStripePrices,

    // Constants
    FORGE_PLANS,

    // Routes
    router
};
