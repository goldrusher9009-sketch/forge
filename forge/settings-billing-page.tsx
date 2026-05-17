'use client';

import React, { useState } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from './design-tokens';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand: string;
  expiryDate: string;
  isDefault: boolean;
}

interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  billingCycle: 'monthly' | 'annual';
  price: number;
  renewalDate: string;
  nextBillingDate: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  downloadUrl: string;
}

interface BillingState {
  subscription: Subscription;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  showAddPaymentModal: boolean;
  showChangePlanModal: boolean;
  selectedPlan: string;
  isSaving: boolean;
}

const BillingPage: React.FC = () => {
  const [state, setState] = useState<BillingState>({
    subscription: {
      plan: 'pro',
      status: 'active',
      billingCycle: 'monthly',
      price: 29,
      renewalDate: '2026-06-04',
      nextBillingDate: '2026-06-04',
    },
    paymentMethods: [
      {
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expiryDate: '12/26',
        isDefault: true,
      },
      {
        id: '2',
        type: 'card',
        last4: '5555',
        brand: 'Mastercard',
        expiryDate: '08/25',
        isDefault: false,
      },
    ],
    invoices: [
      {
        id: 'INV-001',
        date: '2026-05-04',
        amount: 29,
        status: 'paid',
        plan: 'Pro Monthly',
        downloadUrl: '#',
      },
      {
        id: 'INV-002',
        date: '2026-04-04',
        amount: 29,
        status: 'paid',
        plan: 'Pro Monthly',
        downloadUrl: '#',
      },
      {
        id: 'INV-003',
        date: '2026-03-04',
        amount: 29,
        status: 'paid',
        plan: 'Pro Monthly',
        downloadUrl: '#',
      },
    ],
    showAddPaymentModal: false,
    showChangePlanModal: false,
    selectedPlan: 'pro',
    isSaving: false,
  });

  const handleSetDefaultPayment = (id: string) => {
    setState(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(pm => ({
        ...pm,
        isDefault: pm.id === id,
      })),
    }));
  };

  const handleRemovePayment = (id: string) => {
    setState(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter(pm => pm.id !== id),
    }));
  };

  const handleChangePlan = (newPlan: string) => {
    setState(prev => ({
      ...prev,
      isSaving: true,
      selectedPlan: newPlan,
    }));
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          plan: newPlan as any,
        },
        showChangePlanModal: false,
        isSaving: false,
      }));
    }, 800);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return COLORS.gray;
      case 'pro':
        return COLORS.blue;
      case 'enterprise':
        return COLORS.purple;
      default:
        return COLORS.gray;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return COLORS.green;
      case 'cancelled':
        return COLORS.red;
      case 'past_due':
        return COLORS.orange;
      default:
        return COLORS.gray;
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return COLORS.green;
      case 'pending':
        return COLORS.orange;
      case 'failed':
        return COLORS.red;
      default:
        return COLORS.gray;
    }
  };

  return (
    <div style={{ padding: SPACING.lg }}>
      {/* Current Subscription */}
      <div style={{ marginBottom: SPACING.xl }}>
        <h2 style={{ ...TYPOGRAPHY.heading2, marginBottom: SPACING.md }}>
          Current Subscription
        </h2>
        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            padding: SPACING.lg,
            backgroundColor: COLORS.surface,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: SPACING.lg,
              marginBottom: SPACING.lg,
            }}
          >
            <div>
              <p
                style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.xs,
                }}
              >
                Plan
              </p>
              <p style={{ ...TYPOGRAPHY.body, textTransform: 'capitalize' }}>
                {state.subscription.plan}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: SPACING.xs,
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  backgroundColor: getPlanColor(state.subscription.plan),
                  color: COLORS.white,
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {state.subscription.status.toUpperCase()}
              </span>
            </div>

            <div>
              <p
                style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.xs,
                }}
              >
                Billing Cycle
              </p>
              <p
                style={{
                  ...TYPOGRAPHY.body,
                  textTransform: 'capitalize',
                }}
              >
                {state.subscription.billingCycle}
              </p>
            </div>

            <div>
              <p
                style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.xs,
                }}
              >
                Monthly Price
              </p>
              <p style={TYPOGRAPHY.body}>${state.subscription.price}/mo</p>
            </div>

            <div>
              <p
                style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.xs,
                }}
              >
                Next Billing Date
              </p>
              <p style={TYPOGRAPHY.body}>
                {new Date(state.subscription.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <button
              onClick={() =>
                setState(prev => ({ ...prev, showChangePlanModal: true }))
              }
              style={{
                padding: `${SPACING.sm} ${SPACING.md}`,
                backgroundColor: COLORS.blue,
                color: COLORS.white,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                ...TYPOGRAPHY.body,
                fontWeight: '600',
              }}
            >
              Change Plan
            </button>
            <button
              style={{
                padding: `${SPACING.sm} ${SPACING.md}`,
                backgroundColor: COLORS.surface,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                ...TYPOGRAPHY.body,
                fontWeight: '600',
              }}
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: SPACING.xl }}>
        <h2 style={{ ...TYPOGRAPHY.heading2, marginBottom: SPACING.md }}>
          Payment Methods
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: SPACING.md,
            marginBottom: SPACING.md,
          }}
        >
          {state.paymentMethods.map(method => (
            <div
              key={method.id}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                padding: SPACING.md,
                backgroundColor: method.isDefault ? COLORS.blue + '10' : COLORS.surface,
                position: 'relative',
              }}
            >
              {method.isDefault && (
                <span
                  style={{
                    position: 'absolute',
                    top: SPACING.sm,
                    right: SPACING.sm,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    backgroundColor: COLORS.blue,
                    color: COLORS.white,
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  DEFAULT
                </span>
              )}
              <p
                style={{
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                  marginBottom: SPACING.sm,
                }}
              >
                {method.brand} •••• {method.last4}
              </p>
              <p
                style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.md,
                }}
              >
                Expires {method.expiryDate}
              </p>
              <div style={{ display: 'flex', gap: SPACING.sm }}>
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefaultPayment(method.id)}
                    style={{
                      flex: 1,
                      padding: `${SPACING.xs} ${SPACING.sm}`,
                      backgroundColor: COLORS.blue,
                      color: COLORS.white,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleRemovePayment(method.id)}
                  style={{
                    flex: 1,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    backgroundColor: COLORS.red + '20',
                    color: COLORS.red,
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setState(prev => ({ ...prev, showAddPaymentModal: true }))}
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            backgroundColor: COLORS.blue,
            color: COLORS.white,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            ...TYPOGRAPHY.body,
            fontWeight: '600',
          }}
        >
          + Add Payment Method
        </button>
      </div>

      {/* Invoices */}
      <div>
        <h2 style={{ ...TYPOGRAPHY.heading2, marginBottom: SPACING.md }}>
          Billing History
        </h2>
        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: COLORS.surface }}>
                <th
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    padding: SPACING.md,
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  Invoice
                </th>
                <th
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    padding: SPACING.md,
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    padding: SPACING.md,
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  Plan
                </th>
                <th
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    padding: SPACING.md,
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    padding: SPACING.md,
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    padding: SPACING.md,
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {state.invoices.map(invoice => (
                <tr
                  key={invoice.id}
                  style={{
                    borderBottom: `1px solid ${COLORS.border}`,
                    '&:hover': {
                      backgroundColor: COLORS.surface,
                    },
                  }}
                >
                  <td
                    style={{
                      ...TYPOGRAPHY.body,
                      padding: SPACING.md,
                      color: COLORS.blue,
                      fontWeight: '600',
                    }}
                  >
                    {invoice.id}
                  </td>
                  <td
                    style={{
                      ...TYPOGRAPHY.body,
                      padding: SPACING.md,
                    }}
                  >
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td
                    style={{
                      ...TYPOGRAPHY.body,
                      padding: SPACING.md,
                    }}
                  >
                    {invoice.plan}
                  </td>
                  <td
                    style={{
                      ...TYPOGRAPHY.body,
                      padding: SPACING.md,
                      fontWeight: '600',
                    }}
                  >
                    ${invoice.amount}
                  </td>
                  <td
                    style={{
                      padding: SPACING.md,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        padding: `${SPACING.xs} ${SPACING.sm}`,
                        backgroundColor: getInvoiceStatusColor(invoice.status) + '20',
                        color: getInvoiceStatusColor(invoice.status),
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: SPACING.md,
                    }}
                  >
                    <button
                      style={{
                        padding: `${SPACING.xs} ${SPACING.sm}`,
                        backgroundColor: 'transparent',
                        color: COLORS.blue,
                        border: `1px solid ${COLORS.blue}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Plan Modal */}
      {state.showChangePlanModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() =>
            setState(prev => ({ ...prev, showChangePlanModal: false }))
          }
        >
          <div
            style={{
              backgroundColor: COLORS.background,
              borderRadius: '12px',
              padding: SPACING.xl,
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              style={{
                ...TYPOGRAPHY.heading2,
                marginBottom: SPACING.md,
              }}
            >
              Choose Your Plan
            </h2>

            <div
              style={{
                display: 'grid',
                gap: SPACING.md,
                marginBottom: SPACING.lg,
              }}
            >
              {['free', 'pro', 'enterprise'].map(plan => (
                <div
                  key={plan}
                  onClick={() =>
                    setState(prev => ({ ...prev, selectedPlan: plan }))
                  }
                  style={{
                    border: `2px solid ${
                      state.selectedPlan === plan ? COLORS.blue : COLORS.border
                    }`,
                    borderRadius: '8px',
                    padding: SPACING.md,
                    cursor: 'pointer',
                    backgroundColor:
                      state.selectedPlan === plan ? COLORS.blue + '10' : COLORS.surface,
                    transition: 'all 0.2s',
                  }}
                >
                  <p
                    style={{
                      ...TYPOGRAPHY.body,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      marginBottom: SPACING.xs,
                    }}
                  >
                    {plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro - $29/mo' : 'Enterprise - Custom'}
                  </p>
                  <p
                    style={{
                      ...TYPOGRAPHY.caption,
                      color: COLORS.textSecondary,
                    }}
                  >
                    {plan === 'free'
                      ? 'Perfect for getting started'
                      : plan === 'pro'
                      ? 'Everything you need to scale'
                      : 'Dedicated support and custom features'}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: SPACING.sm }}>
              <button
                onClick={() =>
                  setState(prev => ({ ...prev, showChangePlanModal: false }))
                }
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  backgroundColor: COLORS.surface,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleChangePlan(state.selectedPlan)}
                disabled={state.isSaving}
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  backgroundColor: COLORS.blue,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: state.isSaving ? 'not-allowed' : 'pointer',
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                  opacity: state.isSaving ? 0.6 : 1,
                }}
              >
                {state.isSaving ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
