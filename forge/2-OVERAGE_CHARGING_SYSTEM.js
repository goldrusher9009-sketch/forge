/**
 * OVERAGE CHARGING SYSTEM FOR FORGE
 *
 * Handles:
 * - Tracking resource usage (API calls, storage, concurrent users)
 * - Calculating overage charges
 * - Automatic invoice generation for overages
 * - Customer notifications when approaching limits
 * - Monthly overage billing (15% of potential revenue)
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();

// ============================================================================
// OVERAGE PRICING CONFIG
// ============================================================================

const OVERAGE_PRICING = {
  professional: {
    api_calls_monthly: {
      limit: 1_000_000,        // Free limit per month
      price_per_1m: 50,        // $50 per million additional calls
      unit: 'calls'
    },
    storage_gb: {
      limit: 500,              // Free limit in GB
      price_per_gb: 0.50,      // $0.50 per additional GB
      unit: 'gb'
    },
    concurrent_users: {
      limit: 50,               // Free limit concurrent users
      price_per_user: 10,      // $10 per additional concurrent user
      unit: 'users'
    }
  },

  enterprise: {
    api_calls_monthly: {
      limit: 100_000_000,      // Higher limit for enterprise
      price_per_1m: 30,        // Discounted: $30 per million
      unit: 'calls'
    },
    storage_gb: {
      limit: 5000,
      price_per_gb: 0.25,      // Discounted: $0.25 per GB
      unit: 'gb'
    },
    concurrent_users: {
      limit: 500,
      price_per_user: 5,       // Discounted: $5 per user
      unit: 'users'
    }
  }
};

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Record API call usage
 * Called every time user makes an API request
 */
async function recordApiCall(userId, timestamp = new Date()) {
  try {
    const monthStart = new Date(timestamp.getFullYear(), timestamp.getMonth(), 1);

    await db.usage_metrics.insert({
      user_id: userId,
      metric_type: 'api_calls',
      value: 1,
      month_start: monthStart,
      recorded_at: timestamp
    });

    // Increment monthly counter
    await db.monthly_usage.update(
      { user_id, month: monthStart, metric: 'api_calls' },
      { $inc: { count: 1 } }
    );
  } catch (error) {
    console.error('Error recording API call:', error);
  }
}

/**
 * Record storage usage
 * Run daily to calculate current storage
 */
async function recordStorageUsage(userId, storageMb) {
  try {
    const today = new Date().toDateString();

    await db.storage_metrics.updateOne(
      { user_id: userId, date: today },
      {
        $set: {
          storage_mb: storageMb,
          storage_gb: storageMb / 1024,
          updated_at: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error recording storage usage:', error);
  }
}

/**
 * Record concurrent user peak
 * Called when tracking concurrent sessions
 */
async function recordConcurrentUsers(userId, concurrentCount) {
  try {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Track peak concurrent users for the month
    const existing = await db.monthly_usage.findOne({
      user_id: userId,
      month: monthStart,
      metric: 'concurrent_users'
    });

    if (!existing || concurrentCount > existing.peak) {
      await db.monthly_usage.updateOne(
        { user_id: userId, month: monthStart, metric: 'concurrent_users' },
        {
          $set: {
            peak: concurrentCount,
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error('Error recording concurrent users:', error);
  }
}

// ============================================================================
// OVERAGE CALCULATION
// ============================================================================

/**
 * Calculate overages for a user in the current month
 */
async function calculateCurrentMonthOverages(userId) {
  try {
    const user = await db.users.findOne({ id: userId });
    const plan = user.billing_plan;
    const pricing = OVERAGE_PRICING[plan];

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Get current usage
    const usage = await db.monthly_usage.findOne({
      user_id: userId,
      month: monthStart
    });

    const overages = {
      api_calls: 0,
      storage: 0,
      concurrent_users: 0,
      total_amount: 0
    };

    // Calculate API call overages
    if (usage.api_calls_count > pricing.api_calls_monthly.limit) {
      const overage = usage.api_calls_count - pricing.api_calls_monthly.limit;
      const overageMillion = Math.ceil(overage / 1_000_000);
      overages.api_calls = overageMillion * pricing.api_calls_monthly.price_per_1m;
    }

    // Calculate storage overages
    const storageGb = usage.storage_gb || 0;
    if (storageGb > pricing.storage_gb.limit) {
      const overage = storageGb - pricing.storage_gb.limit;
      overages.storage = overage * pricing.storage_gb.price_per_gb;
    }

    // Calculate concurrent user overages
    if (usage.concurrent_users_peak > pricing.concurrent_users.limit) {
      const overage = usage.concurrent_users_peak - pricing.concurrent_users.limit;
      overages.concurrent_users = overage * pricing.concurrent_users.price_per_user;
    }

    overages.total_amount = Math.round(
      (overages.api_calls + overages.storage + overages.concurrent_users) * 100
    ) / 100;

    return overages;
  } catch (error) {
    console.error('Error calculating overages:', error);
    throw error;
  }
}

/**
 * Get usage summary for dashboard display
 */
async function getUserUsageSummary(userId) {
  try {
    const user = await db.users.findOne({ id: userId });
    const plan = user.billing_plan;
    const pricing = OVERAGE_PRICING[plan];

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const usage = await db.monthly_usage.findOne({
      user_id: userId,
      month: monthStart
    });

    return {
      plan,
      period: monthStart.toLocaleDateString(),
      api_calls: {
        used: usage.api_calls_count || 0,
        limit: pricing.api_calls_monthly.limit,
        percentage: ((usage.api_calls_count || 0) / pricing.api_calls_monthly.limit * 100).toFixed(1),
        overage_cost: usage.api_calls_count > pricing.api_calls_monthly.limit
          ? (Math.ceil((usage.api_calls_count - pricing.api_calls_monthly.limit) / 1_000_000)
              * pricing.api_calls_monthly.price_per_1m).toFixed(2)
          : '0.00'
      },
      storage: {
        used: (usage.storage_gb || 0).toFixed(2),
        limit: pricing.storage_gb.limit,
        percentage: ((usage.storage_gb || 0) / pricing.storage_gb.limit * 100).toFixed(1),
        overage_cost: (usage.storage_gb || 0) > pricing.storage_gb.limit
          ? (((usage.storage_gb || 0) - pricing.storage_gb.limit) * pricing.storage_gb.price_per_gb).toFixed(2)
          : '0.00'
      },
      concurrent_users: {
        peak: usage.concurrent_users_peak || 0,
        limit: pricing.concurrent_users.limit,
        percentage: ((usage.concurrent_users_peak || 0) / pricing.concurrent_users.limit * 100).toFixed(1),
        overage_cost: (usage.concurrent_users_peak || 0) > pricing.concurrent_users.limit
          ? (((usage.concurrent_users_peak || 0) - pricing.concurrent_users.limit) * pricing.concurrent_users.price_per_user).toFixed(2)
          : '0.00'
      },
      total_overage_cost: (await calculateCurrentMonthOverages(userId)).total_amount.toFixed(2)
    };
  } catch (error) {
    console.error('Error getting usage summary:', error);
    throw error;
  }
}

// ============================================================================
// OVERAGE NOTIFICATIONS
// ============================================================================

/**
 * Check if user is approaching limits
 * Send warning email if usage > 75% of limit
 */
async function checkAndNotifyApproachingLimits(userId) {
  try {
    const summary = await getUserUsageSummary(userId);
    const user = await db.users.findOne({ id: userId });

    const warnings = [];

    // API calls warning
    if (parseFloat(summary.api_calls.percentage) > 75) {
      warnings.push({
        type: 'api_calls',
        message: `You've used ${summary.api_calls.percentage}% of your monthly API call limit`,
        remaining: summary.api_calls.limit - summary.api_calls.used
      });
    }

    // Storage warning
    if (parseFloat(summary.storage.percentage) > 75) {
      warnings.push({
        type: 'storage',
        message: `You've used ${summary.storage.percentage}% of your storage limit`,
        remaining: (summary.storage.limit - parseFloat(summary.storage.used)).toFixed(2)
      });
    }

    // Concurrent users warning
    if (parseFloat(summary.concurrent_users.percentage) > 75) {
      warnings.push({
        type: 'concurrent_users',
        message: `You've reached ${summary.concurrent_users.percentage}% of concurrent user limit`,
        remaining: summary.concurrent_users.limit - summary.concurrent_users.peak
      });
    }

    // Send email if any warnings
    if (warnings.length > 0) {
      await sendLimitWarningEmail(user.email, warnings, summary);
    }

    return warnings;
  } catch (error) {
    console.error('Error checking limits:', error);
  }
}

async function sendLimitWarningEmail(email, warnings, summary) {
  // TODO: Implement email sending
  console.log(`Sending limit warning email to ${email}:`, warnings);
}

// ============================================================================
// OVERAGE BILLING (Monthly)
// ============================================================================

/**
 * Generate overage invoice at end of month
 * Run this on the last day of each month
 */
async function generateOverageInvoice(userId) {
  try {
    const user = await db.users.findOne({ id: userId });
    const overages = await calculateCurrentMonthOverages(userId);

    // Only create invoice if there are overages
    if (overages.total_amount <= 0) {
      console.log(`No overages for user ${userId}`);
      return null;
    }

    // Create invoice in Forge database
    const invoice = await db.invoices.insertOne({
      user_id: userId,
      invoice_type: 'overage',
      amount: overages.total_amount,
      currency: 'usd',
      status: 'pending',
      details: {
        api_calls: overages.api_calls,
        storage: overages.storage,
        concurrent_users: overages.concurrent_users
      },
      created_at: new Date(),
      due_date: new Date(new Date().setDate(new Date().getDate() + 30))
    });

    // Create line item in Stripe
    await stripe.invoiceItems.create({
      customer: user.stripe_customer_id,
      amount: Math.round(overages.total_amount * 100), // Convert to cents
      currency: 'usd',
      description: `Overage charges for ${new Date().toLocaleDateString()}`,
      metadata: {
        invoice_id: invoice.insertedId,
        api_calls: overages.api_calls.toFixed(2),
        storage: overages.storage.toFixed(2),
        concurrent_users: overages.concurrent_users.toFixed(2)
      }
    });

    // Create Stripe invoice
    const stripeInvoice = await stripe.invoices.create({
      customer: user.stripe_customer_id,
      collection_method: 'charge_automatically',
      description: 'Monthly overage charges',
      auto_advance: true
    });

    // Finalize and send
    const finalInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id);
    await stripe.invoices.sendInvoice(finalInvoice.id);

    // Update Forge invoice with Stripe reference
    await db.invoices.updateOne(
      { _id: invoice.insertedId },
      {
        $set: {
          stripe_invoice_id: stripeInvoice.id,
          status: 'sent'
        }
      }
    );

    console.log(`✅ Overage invoice created for ${user.email}: $${overages.total_amount}`);

    return invoice;
  } catch (error) {
    console.error('Error generating overage invoice:', error);
    throw error;
  }
}

/**
 * Batch generate overage invoices for all users
 * Run this on last day of month as scheduled job
 */
async function generateAllOverageInvoices() {
  try {
    const users = await db.users.find({ billing_plan: { $in: ['professional', 'enterprise'] } }).toArray();
    const results = [];

    for (const user of users) {
      try {
        const invoice = await generateOverageInvoice(user.id);
        results.push({
          user_id: user.id,
          status: 'success',
          invoice
        });
      } catch (error) {
        results.push({
          user_id: user.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('Overage invoice generation complete:', results);
    return results;
  } catch (error) {
    console.error('Error generating all overage invoices:', error);
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/usage/summary
 * Get current month usage summary for dashboard
 */
router.get('/api/usage/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await getUserUsageSummary(userId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/usage/history
 * Get historical usage data
 */
router.get('/api/usage/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 12; // Last 12 months

    const history = await db.monthly_usage
      .find({ user_id: userId })
      .sort({ month: -1 })
      .limit(limit)
      .toArray();

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/usage/api-call
 * Record an API call (internal endpoint)
 */
router.post('/api/usage/api-call', async (req, res) => {
  try {
    const { user_id } = req.body;
    await recordApiCall(user_id);
    res.json({ recorded: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/billing/overages
 * Get current month overage charges
 */
router.get('/api/billing/overages', async (req, res) => {
  try {
    const userId = req.user.id;
    const overages = await calculateCurrentMonthOverages(userId);
    res.json(overages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/generate-overage-invoices
 * Admin endpoint to manually generate overage invoices
 * Normally runs automatically on last day of month
 */
router.post('/api/admin/generate-overage-invoices', async (req, res) => {
  try {
    // TODO: Verify admin authorization
    const results = await generateAllOverageInvoices();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

/**
 * Schedule jobs (add to your job scheduler - node-schedule, bull, etc.)
 *
 * // Check approaching limits daily
 * schedule.scheduleJob('0 9 * * *', async () => {
 *   const users = await db.users.find({}).toArray();
 *   for (const user of users) {
 *     await checkAndNotifyApproachingLimits(user.id);
 *   }
 * });
 *
 * // Generate overage invoices on last day of month
 * schedule.scheduleJob('0 23 28-31 * *', async () => {
 *   await generateAllOverageInvoices();
 * });
 */

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Functions
  recordApiCall,
  recordStorageUsage,
  recordConcurrentUsers,
  calculateCurrentMonthOverages,
  getUserUsageSummary,
  checkAndNotifyApproachingLimits,
  generateOverageInvoice,
  generateAllOverageInvoices,

  // Constants
  OVERAGE_PRICING,

  // Routes
  router
};
