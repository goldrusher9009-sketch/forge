export type CheckoutState = 'confirmed' | 'confirming' | 'open' | 'expired' | 'failed' | 'creating';
export type BillingReturn = { active: boolean; mode: string | null; account: string | null; sessionId: string | null };

/** Return URLs select a view; they never establish a payment or a balance. */
export function readBillingReturn(search: string): BillingReturn {
  const params = new URLSearchParams(search);
  const mode = params.get('billing') || params.get('topup');
  const session = params.get('checkout_session_id');
  return {
    active: params.get('tab') === 'billing' || mode !== null || session !== null,
    mode,
    account: params.get('account'),
    sessionId: session && /^cs_[A-Za-z0-9_]{1,240}$/.test(session) ? session : null,
  };
}

export function readCheckoutState(response: unknown): CheckoutState | null {
  if (!response || typeof response !== 'object') return null;
  const wrapper = response as Record<string, unknown>;
  if (wrapper.success === false) return null;
  const data = (wrapper.data && typeof wrapper.data === 'object' ? wrapper.data : wrapper) as Record<string, unknown>;
  if (data.status === 'confirmed' && data.paid !== true) return null;
  const states: readonly string[] = ['confirmed', 'confirming', 'open', 'expired', 'failed', 'creating'];
  return typeof data.status === 'string' && states.includes(data.status) ? data.status as CheckoutState : null;
}

export function validTopup(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 20 && amount <= 1000 ? amount : null;
}

/** Billing links are supplied by the authenticated backend, never the return URL. */
export function stripeCheckoutUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) return null;
    return url.toString();
  } catch { return null; }
}

export function accountMatches(expected: string | null, actual: string | null): boolean {
  return Boolean(actual && (!expected || expected === actual));
}
