'use client';
import React, { useState, useEffect } from 'react';

interface StakeData {
  balance: number;
  staked: number;
  earned: number;
}

export const StakingPage: React.FC = () => {
  const [stake, setStake] = useState<StakeData | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStake = async () => {
      try {
        const res = await fetch('/api/tokens/balance', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await res.json();
        setStake(data.data);
      } catch (e) {
        console.error('Failed to fetch stake', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStake();
  }, []);

  const handleStake = async () => {
    if (!stakeAmount || !stake) return;
    try {
      const res = await fetch('/api/tokens/stake', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(stakeAmount) })
      });
      if (res.ok) {
        setStake(prev => prev ? {
          ...prev,
          balance: prev.balance - parseFloat(stakeAmount),
          staked: prev.staked + parseFloat(stakeAmount)
        } : null);
        setStakeAmount('');
      }
    } catch (e) {
      console.error('Stake failed', e);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--fg-bg)' }}>
      <h1>💎 Stake FORGE Tokens</h1>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{
          background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
          borderRadius: '12px', padding: '20px'
        }}>
          <p style={{ color: 'var(--fg-text2)', fontSize: '12px', marginBottom: '4px' }}>Available Balance</p>
          <p style={{ fontSize: '24px', fontWeight: '700' }}>{stake?.balance.toLocaleString() || 0}</p>
          <p style={{ color: 'var(--fg-text3)', fontSize: '11px', marginTop: '4px' }}>FORGE tokens</p>
        </div>

        <div style={{
          background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
          borderRadius: '12px', padding: '20px'
        }}>
          <p style={{ color: 'var(--fg-text2)', fontSize: '12px', marginBottom: '4px' }}>Staked</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--fg-green)' }}>{stake?.staked.toLocaleString() || 0}</p>
          <p style={{ color: 'var(--fg-text3)', fontSize: '11px', marginTop: '4px' }}>Locked for 30 days</p>
        </div>

        <div style={{
          background: 'rgba(46,209,138,0.1)', border: '1px solid rgba(46,209,138,0.3)',
          borderRadius: '12px', padding: '20px'
        }}>
          <p style={{ color: 'var(--fg-text2)', fontSize: '12px', marginBottom: '4px' }}>Earned</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--fg-green)' }}>+{stake?.earned.toLocaleString() || 0}</p>
          <p style={{ color: 'var(--fg-text3)', fontSize: '11px', marginTop: '4px' }}>Staking rewards</p>
        </div>
      </div>

      {/* Staking form */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '24px', marginBottom: '28px'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Stake Your Tokens</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="number"
            value={stakeAmount}
            onChange={e => setStakeAmount(e.target.value)}
            placeholder="Amount to stake"
            min="1"
            style={{
              flex: 1, padding: '10px 12px', borderRadius: '8px',
              border: '1px solid var(--fg-border2)', background: 'var(--fg-bg)',
              color: 'var(--fg-text)', fontSize: '14px'
            }}
          />
          <button
            onClick={handleStake}
            className="fg-btn-primary"
          >
            Stake
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--fg-text2)' }}>
          💡 Earn 5% APY on staked tokens. Unlock anytime (30-day delay).
        </p>
      </div>

      {/* Benefits */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '24px'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Why Stake?</h2>
        <ul style={{ fontSize: '14px', color: 'var(--fg-text2)', lineHeight: '1.8' }}>
          <li>✓ Earn 5% APY on your staked tokens</li>
          <li>✓ Get voting rights in governance</li>
          <li>✓ Access premium features</li>
          <li>✓ Support the network</li>
        </ul>
      </div>
    </div>
  );
};
