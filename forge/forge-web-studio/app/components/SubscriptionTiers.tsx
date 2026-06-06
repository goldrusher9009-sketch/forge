'use client';
import React, { useState, useEffect } from 'react';

interface Tier {
  id: string;
  name: string;
  price: number;
  features: string[];
  users: number;
  isActive: boolean;
}

export const SubscriptionTiers: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTier, setNewTier] = useState({ name: '', price: 0 });

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await fetch('/api/billing/tiers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await res.json();
        setTiers(data.data || []);
      } catch (e) {
        console.error('Failed to fetch tiers', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  const handleCreateTier = async () => {
    if (!newTier.name || newTier.price <= 0) return;
    try {
      await fetch('/api/billing/tiers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTier)
      });
      setNewTier({ name: '', price: 0 });
      window.location.reload();
    } catch (e) {
      console.error('Create tier failed', e);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading tiers...</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--fg-bg)' }}>
      <h1>📊 Subscription Tiers</h1>

      {/* Create tier form */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '24px', marginBottom: '28px'
      }}>
        <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Create New Tier</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
          <input
            type="text"
            value={newTier.name}
            onChange={e => setNewTier({ ...newTier, name: e.target.value })}
            placeholder="Tier name (e.g., Enterprise)"
            style={{
              padding: '10px 12px', borderRadius: '8px',
              border: '1px solid var(--fg-border2)', background: 'var(--fg-bg)',
              color: 'var(--fg-text)'
            }}
          />
          <input
            type="number"
            value={newTier.price}
            onChange={e => setNewTier({ ...newTier, price: parseFloat(e.target.value) })}
            placeholder="Price ($)"
            min="0"
            style={{
              padding: '10px 12px', borderRadius: '8px',
              border: '1px solid var(--fg-border2)', background: 'var(--fg-bg)',
              color: 'var(--fg-text)'
            }}
          />
          <button onClick={handleCreateTier} className="fg-btn-primary">Create</button>
        </div>
      </div>

      {/* Tiers grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {tiers.map(tier => (
          <div
            key={tier.id}
            style={{
              background: 'var(--fg-bg3)', border: tier.isActive ? '2px solid var(--fg-orange)' : '1px solid var(--fg-border2)',
              borderRadius: '12px', padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{tier.name}</h3>
              {tier.isActive && <span style={{ fontSize: '11px', color: 'var(--fg-orange)', fontWeight: '600' }}>ACTIVE</span>}
            </div>
            <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--fg-orange)', marginBottom: '16px' }}>
              ${tier.price}/mo
            </p>
            <p style={{ fontSize: '12px', color: 'var(--fg-text2)', marginBottom: '16px' }}>
              {tier.users} users on this tier
            </p>
            <ul style={{ fontSize: '12px', color: 'var(--fg-text2)', lineHeight: '1.6' }}>
              {tier.features.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
