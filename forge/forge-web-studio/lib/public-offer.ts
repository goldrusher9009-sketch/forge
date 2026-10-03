// Reviewed against the managed billing policy on 2026-09-16. The authenticated
// wallet and Stripe Checkout remain authoritative for purchase availability.
export const publicOffer = {
  reviewedAt: '2026-09-16', currency: 'USD', multiplier: 1.25,
  minimumTopupUsd: 20, maximumTrialUsd: 0.10,
  plans: [
    { id: 'starter', name: 'Starter', monthlyUsd: 29, includedUsd: 20 },
    { id: 'pro', name: 'Pro', monthlyUsd: 99, includedUsd: 75 },
    { id: 'agency', name: 'Agency', monthlyUsd: 299, includedUsd: 200 },
  ],
} as const;
