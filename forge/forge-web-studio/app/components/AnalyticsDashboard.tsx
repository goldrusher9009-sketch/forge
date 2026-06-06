'use client';
import React, { useState, useEffect } from 'react';

interface Event {
  name: string;
  count: number;
  timestamp: string;
}

interface AnalyticsData {
  totalEvents: number;
  events: Event[];
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/analytics/summary?range=${range}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await res.json();
        setAnalytics(data);
      } catch (e) {
        console.error('Analytics fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [range]);

  if (loading) return <div style={{ padding: '40px' }}>Loading analytics...</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--fg-bg)' }}>
      <h1>📊 Analytics</h1>

      {/* Time Range Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {['7d', '30d', '90d'].map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              padding: '8px 16px', borderRadius: '6px',
              border: r === range ? '2px solid var(--fg-orange)' : '1px solid var(--fg-border2)',
              background: r === range ? 'rgba(255,31,53,0.1)' : 'var(--fg-bg3)',
              color: 'var(--fg-text)', cursor: 'pointer', fontWeight: '500'
            }}
          >
            {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </button>
        ))}
      </div>

      {/* Total Events Card */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '24px', marginBottom: '28px'
      }}>
        <p style={{ color: 'var(--fg-text2)', marginBottom: '8px' }}>Total Events</p>
        <h2 style={{ fontSize: '32px', fontWeight: '700' }}>
          {analytics?.totalEvents.toLocaleString() || 0}
        </h2>
      </div>

      {/* Top Events Table */}
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Top Events</h2>
        <div style={{
          background: 'var(--fg-bg3)', borderRadius: '12px', overflow: 'hidden',
          border: '1px solid var(--fg-border2)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--fg-border2)', background: 'var(--fg-bg2)' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Event</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Count</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.events.slice(0, 10).map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--fg-border2)' }}>
                  <td style={{ padding: '12px' }}>{e.name}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{e.count.toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--fg-text2)' }}>
                    {((e.count / (analytics?.totalEvents || 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={() => {
          const csv = ['Event,Count'];
          analytics?.events.forEach(e => csv.push(`${e.name},${e.count}`));
          const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-${range}.csv`;
          a.click();
        }}
        className="fg-btn-secondary"
        style={{ marginTop: '28px' }}
      >
        📥 Export CSV
      </button>
    </div>
  );
};
