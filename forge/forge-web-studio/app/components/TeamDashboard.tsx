'use client';
import React, { useState, useEffect } from 'react';

interface Member {
  id: string;
  email: string;
  role: string;
  joinedDate: string;
}

export const TeamDashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch('/api/orgs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await res.json();
        setMembers(data.members || []);
      } catch (e) {
        console.error('Failed to fetch members', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await fetch('/api/orgs/1/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      setInviteEmail('');
      setMembers([...members, { id: Date.now().toString(), email: inviteEmail, role: inviteRole, joinedDate: new Date().toISOString() }]);
    } catch (e) {
      console.error('Invite failed', e);
    }
  };

  const handleRevoke = async (memberId: string) => {
    try {
      await fetch(`/api/orgs/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      setMembers(members.filter(m => m.id !== memberId));
    } catch (e) {
      console.error('Revoke failed', e);
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading team...</div>;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--fg-bg)' }}>
      <h1>👥 Team Management</h1>

      {/* Invite Form */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '24px', marginBottom: '28px'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Invite Team Member</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: '12px' }}>
          <input
            type="email"
            placeholder="user@company.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            style={{
              padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--fg-border2)',
              background: 'var(--fg-bg)', color: 'var(--fg-text)', fontSize: '14px'
            }}
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            style={{
              padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--fg-border2)',
              background: 'var(--fg-bg)', color: 'var(--fg-text)', fontSize: '14px'
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleInvite} className="fg-btn-primary">
            Invite
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div style={{
        background: 'var(--fg-bg3)', borderRadius: '12px', overflow: 'hidden',
        border: '1px solid var(--fg-border2)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--fg-border2)', background: 'var(--fg-bg2)' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Joined</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--fg-border2)' }}>
                <td style={{ padding: '12px' }}>{m.email}</td>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{m.role}</td>
                <td style={{ padding: '12px', color: 'var(--fg-text2)', fontSize: '13px' }}>
                  {new Date(m.joinedDate).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleRevoke(m.id)}
                    style={{
                      background: 'rgba(255,31,53,0.1)', color: 'var(--fg-orange)',
                      border: 'none', padding: '4px 8px', borderRadius: '4px',
                      fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
