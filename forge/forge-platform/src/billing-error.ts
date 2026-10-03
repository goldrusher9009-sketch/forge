export class BillingCheckoutError extends Error {
  constructor(public code: string, public status: number, public retryable = false) { super(code); }
}
