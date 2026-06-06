'use client';
import React, { useState, useEffect } from 'react';

interface BillingData {
  tier: string;
  status: string;
  tokenUsage: number;
  tokenLimit: number;
  nextBillingDate: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
}

export const BillingPage: React.FC = () => {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const subRes = await fetch('/api/billing/subscription', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const subData = await subRes.json();
        setBilling(subData);

        const invRes = await fetch('/api/billing/invoices', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      } catch (e) {
        console.error('Billing fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const handleUpgrade = async (newTier: string) => {
    try {
      await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier: newTier })
      });
      window.location.reload();
    } catch (e) {
      console.error('Upgrade failed', e);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading billing...</div>;
  }

  const usagePercent = billing ? (billing.tokenUsage / billing.tokenLimit) * 100 : 0;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--fg-bg)' }}>
      <h1>💳 Billing & Subscription</h1>
      
      {/* Current Plan */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '24px', marginBottom: '28px'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Current Plan</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <p style={{ color: 'var(--fg-text2)', fontSize: '12px' }}>Plan Tier</p>
            <p style={{ fontSize: '18px', fontWeight: '600', textTransform: 'uppercase' }}>
              {billing?.tier}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--fg-text2)', fontSize: '12px' }}>Status</p>
            <p style={{ fontSize: '14px', color: 'var(--fg-green)' }}>Active</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--fg-text2)', fontSize: '12px', marginBottom: '8px' }}>Token Usage</p>
            <div style={{
              background: 'var(--fg-bg2)', borderRadius: '6px', height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: usagePercent > 80 ? 'var(--fg-orange)' : 'var(--fg-green)',
                width: `${usagePercent}%`,
                height: '100%',
                transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--fg-text2)', marginTop: '4px' }}>
              {billing?.tokenUsage.toLocaleString()} / {billing?.tokenLimit.toLocaleString()} tokens
            </p>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--fg-text2)', marginTop: '16px' }}>
          Next billing date: {billing?.nextBillingDate}
        </p>
      </div>

      {/* Upgrade Options */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Upgrade Plan</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { tier: 'pro', name: 'Pro', price: '$29/mo', features: ['10K tokens/mo', 'Priority support'] },
            { tier: 'business', name: 'Business', price: '$79/user/mo', features: ['Unlimited tokens', 'Admin console'] }
          ].map(plan => (
            <div
              key={plan.tier}
              style={{
                background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
                borderRadius: '12px', padding: '16px'
              }}
            >
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{plan.name}</h3>
              <p style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>{plan.price}</p>
              <ul style={{ fontSize: '12px', marginBottom: '16px', color: 'var(--fg-text2)' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ marginBottom: '4px' }}>✓ {f}</li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.tier)}
                className="fg-btn-primary"
                style={{ width: '100%' }}
              >
                Upgrade
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Invoice History</h2>
        <div style={{
          background: 'var(--fg-bg3)', borderRadius: '12px', overflow: 'hidden',
          border: '1px solid var(--fg-border2)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--fg-border2)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--fg-border2)' }}>
                  <td style={{ padding: '12px' }}>{inv.date}</td>
                  <td style={{ padding: '12px' }}>${inv.amount.toFixed(2)}</td>
                  <td style={{ padding: '12px', color: inv.status === 'paid' ? 'var(--fg-green)' : 'var(--fg-orange)' }}>
                    {inv.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
