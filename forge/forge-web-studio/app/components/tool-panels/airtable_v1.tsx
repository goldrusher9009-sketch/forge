'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';
import { utcStamp } from '../../../lib/platform-time';

export function ForgeTab_airtable_v1() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [bases, setBases] = React.useState<any[]>([]);
  const [selectedBase, setSelectedBase] = React.useState<any>(null);
  const [tables, setTables] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/airtable/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); fetch(`${BACKEND}/api/integrations/airtable/bases`, { headers: h }).then(r => r.json()).then(d => setBases(d.bases || [])); }
    });
  }, []);

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/airtable/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); fetch(`${BACKEND}/api/integrations/airtable/bases`, { headers: h }).then(r => r.json()).then(d => setBases(d.bases || [])); } else setConnStatus(d.error || 'Failed');
  };

  const selectBase = async (base: any) => {
    setSelectedBase(base);
    const d = await fetch(`/api/integrations/airtable/tables/${base.id}`, { headers: h }).then(r => r.json());
    setTables(d.tables || []);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🟡 Airtable</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Airtable to browse bases and tables.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#fcb400', color: '#111', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Airtable'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🟡 Airtable</h2>
        <span style={{ background: '#fcb40022', color: '#fcb400', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected · {bases.length} bases</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/airtable/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16, height: 400 }}>
        <div style={{ width: 220, overflowY: 'auto', borderRight: '1px solid #222', paddingRight: 12 }}>
          <div style={{ fontWeight: 600, color: '#aaa', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Bases</div>
          {bases.map(b => <div key={b.id} onClick={() => selectBase(b)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedBase?.id === b.id ? '#1a1a2e' : 'transparent', color: selectedBase?.id === b.id ? '#fcb400' : '#ddd', fontSize: 13, marginBottom: 2 }}>📊 {b.name}</div>)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selectedBase && <p style={{ color: '#555', fontSize: 13 }}>Select a base to view its tables</p>}
          {selectedBase && <>
            <div style={{ fontWeight: 600, color: '#aaa', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>{selectedBase.name} · Tables</div>
            {tables.map(t => <div key={t.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>📋 {t.name}</span>
              <span style={{ color: '#aaa', fontSize: 11 }}>{t.fields?.length} fields</span>
            </div>)}
          </>}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_zendesk_v1() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ subdomain: '', email: '', apiToken: '' });
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'tickets'|'users'>('tickets');
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/zendesk/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [t, u] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/zendesk/tickets`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/zendesk/users`, { headers: h }).then(r => r.json()),
    ]);
    setTickets(t.tickets || []); setUsers(u.users || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/zendesk/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const priorityColor = (p: string) => ({ urgent: '#f55', high: '#ff9500', normal: '#4285f4', low: '#888' }[p] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🎫 Zendesk</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Zendesk to manage support tickets.</p>
      <input value={form.subdomain} onChange={e => setForm(p => ({ ...p, subdomain: e.target.value }))} placeholder="Subdomain (e.g. yourcompany)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Agent Email" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.apiToken} onChange={e => setForm(p => ({ ...p, apiToken: e.target.value }))} placeholder="API Token" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#03363d', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Zendesk'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎫 Zendesk</h2>
        <span style={{ background: '#03363d44', color: '#78e8a0', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/zendesk/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['tickets','users'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#03363d' : '#1a1a1a', color: tab === t ? '#78e8a0' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'tickets' ? '🎫 Tickets' : '👥 Users'}</button>)}
      </div>
      {tab === 'tickets' && tickets.map(t => <div key={t.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: priorityColor(t.priority), fontSize: 10, fontWeight: 700 }}>{t.priority?.toUpperCase()}</span>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{t.subject}</span>
          <span style={{ color: '#aaa', fontSize: 11 }}>#{t.id}</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{t.status} · {t.created_at ? new Date(utcStamp(t.created_at)).toLocaleDateString() : ''}</div>
      </div>)}
      {tab === 'users' && users.map(u => <div key={u.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{u.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{u.email}</span>
        <span style={{ color: u.role === 'admin' ? '#78e8a0' : '#555', fontSize: 11 }}>{u.role}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_asana_v1() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'tasks'|'projects'>('tasks');
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [asanaProjects, setAsanaProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/asana/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [t, p] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/asana/tasks`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/asana/projects`, { headers: h }).then(r => r.json()),
    ]);
    setTasks(t.data || []); setAsanaProjects(p.data || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/asana/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🗂️ Asana</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Asana to view your tasks and projects.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#f06a6a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Asana'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🗂️ Asana</h2>
        <span style={{ background: '#f06a6a22', color: '#f06a6a', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/asana/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['tasks','projects'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#f06a6a' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'tasks' ? '✅ My Tasks' : '📁 Projects'}</button>)}
      </div>
      {tab === 'tasks' && tasks.map(t => <div key={t.gid} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: t.completed ? '#18d26e' : '#aaa', fontSize: 14 }}>{t.completed ? '✅' : '⬜'}</span>
        <span style={{ fontWeight: 600, color: t.completed ? '#555' : '#ddd', flex: 1, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.name}</span>
        {t.due_on && <span style={{ color: '#f06a6a', fontSize: 11 }}>{t.due_on}</span>}
      </div>)}
      {tab === 'projects' && asanaProjects.map(p => <div key={p.gid} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: p.color ? `var(--color-${p.color})` : '#f06a6a', fontSize: 14 }}>📁</span>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{p.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{p.team?.name}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_hubspot_v1() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'contacts'|'deals'|'companies'>('contacts');
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [deals, setDeals] = React.useState<any[]>([]);
  const [companies, setCompanies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/hubspot/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [c, d, co] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/hubspot/contacts`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/hubspot/deals`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/hubspot/companies`, { headers: h }).then(r => r.json()),
    ]);
    setContacts(c.results || []); setDeals(d.results || []); setCompanies(co.results || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/hubspot/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🟠 HubSpot</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect HubSpot CRM to view contacts, deals, and companies.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Private App Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#ff7a59', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect HubSpot'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🟠 HubSpot</h2>
        <span style={{ background: '#ff7a5922', color: '#ff7a59', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/hubspot/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['contacts','deals','companies'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#ff7a59' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'contacts' ? '👤 Contacts' : t === 'deals' ? '💼 Deals' : '🏢 Companies'}</button>)}
      </div>
      {tab === 'contacts' && contacts.map(c => <div key={c.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{[c.properties?.firstname, c.properties?.lastname].filter(Boolean).join(' ') || c.id}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{c.properties?.email}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{c.properties?.company}</span>
      </div>)}
      {tab === 'deals' && deals.map(d => <div key={d.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{d.properties?.dealname}</span>
        <span style={{ color: '#18d26e', fontWeight: 700, fontSize: 12 }}>{d.properties?.amount ? `$${Number(d.properties.amount).toLocaleString()}` : ''}</span>
        <span style={{ color: '#ff7a59', fontSize: 11 }}>{d.properties?.dealstage}</span>
      </div>)}
      {tab === 'companies' && companies.map(c => <div key={c.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{c.properties?.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{c.properties?.domain}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{c.properties?.industry}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_pagerduty() {
  const [connected, setConnected] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'incidents'|'services'|'oncall'>('incidents');
  const [incidents, setIncidents] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [oncall, setOncall] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/pagerduty/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [i, s, o] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/pagerduty/incidents`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/pagerduty/services`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/pagerduty/oncall`, { headers: h }).then(r => r.json()),
    ]);
    setIncidents(i.incidents || []); setServices(s.services || []); setOncall(o.oncalls || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/pagerduty/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const urgencyColor = (u: string) => u === 'high' ? '#f55' : '#ff9500';
  const statusColor = (s: string) => ({ triggered: '#f55', acknowledged: '#ff9500', resolved: '#18d26e' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🚨 PagerDuty</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect PagerDuty to monitor incidents and on-call schedules.</p>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key (v2)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#06AC38', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect PagerDuty'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🚨 PagerDuty</h2>
        <span style={{ background: '#06AC3822', color: '#06AC38', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/pagerduty/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['incidents','services','oncall'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#06AC38' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'incidents' ? '🚨 Incidents' : t === 'services' ? '⚙️ Services' : '📟 On-Call'}</button>)}
      </div>
      {tab === 'incidents' && incidents.map(i => <div key={i.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: statusColor(i.status), fontSize: 11, fontWeight: 700 }}>● {i.status}</span>
          <span style={{ color: urgencyColor(i.urgency), fontSize: 10 }}>{i.urgency?.toUpperCase()}</span>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{i.title}</span>
          <span style={{ color: '#555', fontSize: 11 }}>#{i.incident_number}</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{i.service?.summary} · {i.created_at ? new Date(utcStamp(i.created_at)).toLocaleString() : ''}</div>
      </div>)}
      {tab === 'services' && services.map(s => <div key={s.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: s.status === 'active' ? '#18d26e' : '#888', fontSize: 11 }}>●</span>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{s.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{s.escalation_policy?.summary}</span>
      </div>)}
      {tab === 'oncall' && oncall.map((o, i) => <div key={i} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{o.user?.summary}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{o.escalation_policy?.summary}</span>
        <span style={{ color: '#555', fontSize: 11 }}>L{o.escalation_level}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_sentry() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ authToken: '', org: '' });
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'issues'|'projects'>('issues');
  const [issues, setIssues] = React.useState<any[]>([]);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/sentry/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [i, p] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/sentry/issues`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/sentry/projects`, { headers: h }).then(r => r.json()),
    ]);
    setIssues(Array.isArray(i) ? i : []); setProjects(Array.isArray(p) ? p : []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/sentry/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const levelColor = (l: string) => ({ fatal: '#f55', error: '#ff6b6b', warning: '#ff9500', info: '#4285f4', debug: '#888' }[l] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🛡️ Sentry</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Sentry to track errors and performance issues.</p>
      <input value={form.authToken} onChange={e => setForm(p => ({ ...p, authToken: e.target.value }))} placeholder="Auth Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.org} onChange={e => setForm(p => ({ ...p, org: e.target.value }))} placeholder="Organization Slug" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#362d59', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Sentry'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🛡️ Sentry</h2>
        <span style={{ background: '#362d5922', color: '#a78bfa', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/sentry/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['issues','projects'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#362d59' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'issues' ? '🐛 Issues' : '📦 Projects'}</button>)}
      </div>
      {tab === 'issues' && issues.map(i => <div key={i.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: levelColor(i.level), fontSize: 10, fontWeight: 700 }}>{i.level?.toUpperCase()}</span>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{i.title}</span>
          <span style={{ color: '#a78bfa', fontSize: 11 }}>{i.count} events</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{i.project?.slug} · {i.firstSeen ? new Date(i.firstSeen).toLocaleDateString() : ''}</div>
      </div>)}
      {tab === 'projects' && projects.map(p => <div key={p.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{p.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{p.platform}</span>
        <span style={{ color: p.status === 'active' ? '#18d26e' : '#888', fontSize: 11 }}>● {p.status}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_cloudflare() {
  const [connected, setConnected] = React.useState(false);
  const [apiToken, setApiToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'zones'|'workers'>('zones');
  const [zones, setZones] = React.useState<any[]>([]);
  const [workers, setWorkers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/cloudflare/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [z, w] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/cloudflare/zones`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/cloudflare/workers`, { headers: h }).then(r => r.json()),
    ]);
    setZones(z.result || []); setWorkers(w.result || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/cloudflare/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiToken }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const statusColor = (s: string) => ({ active: '#18d26e', pending: '#ff9500', deactivated: '#888', paused: '#888' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>☁️ Cloudflare</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Cloudflare to manage zones and Workers.</p>
      <input value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="API Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#f6821f', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Cloudflare'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>☁️ Cloudflare</h2>
        <span style={{ background: '#f6821f22', color: '#f6821f', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected · {zones.length} zones</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/cloudflare/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['zones','workers'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#f6821f' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'zones' ? '🌐 Zones' : '⚡ Workers'}</button>)}
      </div>
      {tab === 'zones' && zones.map(z => <div key={z.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: statusColor(z.status), fontSize: 11 }}>●</span>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{z.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{z.plan?.name}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{z.name_servers?.length} NS</span>
      </div>)}
      {tab === 'workers' && workers.map(w => <div key={w.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>⚡ {w.id}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{w.modified_on ? new Date(w.modified_on).toLocaleDateString() : ''}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_vercel() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'projects'|'deployments'>('projects');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [deployments, setDeployments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/vercel/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [p, dep] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/vercel/projects`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/vercel/deployments`, { headers: h }).then(r => r.json()),
    ]);
    setProjects(p.projects || []); setDeployments(dep.deployments || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/vercel/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const deployColor = (s: string) => ({ READY: '#18d26e', ERROR: '#f55', BUILDING: '#ff9500', CANCELED: '#888', QUEUED: '#4285f4' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>▲ Vercel</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Vercel to view projects and deployments.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Vercel'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>▲ Vercel</h2>
        <span style={{ background: '#ffffff22', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected · {projects.length} projects</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/vercel/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['projects','deployments'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#fff' : '#1a1a1a', color: tab === t ? '#000' : '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: tab === t ? 700 : 400 }}>{t === 'projects' ? '📦 Projects' : '🚀 Deployments'}</button>)}
      </div>
      {tab === 'projects' && projects.map(p => <div key={p.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>📦 {p.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{p.framework || 'custom'}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''}</span>
      </div>)}
      {tab === 'deployments' && deployments.map(d => <div key={d.uid} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: deployColor(d.state), fontSize: 11 }}>●</span>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{d.name}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{d.url}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_supabase() {
  const [connected, setConnected] = React.useState(false);
  const [accessToken, setAccessToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'projects'|'orgs'>('projects');
  const [sbProjects, setSbProjects] = React.useState<any[]>([]);
  const [orgs, setOrgs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/supabase/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [p, o] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/supabase/projects`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/supabase/organizations`, { headers: h }).then(r => r.json()),
    ]);
    setSbProjects(Array.isArray(p) ? p : []); setOrgs(Array.isArray(o) ? o : []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/supabase/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const statusColor = (s: string) => ({ ACTIVE_HEALTHY: '#18d26e', ACTIVE_UNHEALTHY: '#f55', INACTIVE: '#888', COMING_UP: '#ff9500' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>⚡ Supabase</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Supabase to view your projects and organizations.</p>
      <input value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Access Token (from supabase.com/dashboard/account/tokens)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#3ecf8e', color: '#111', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Supabase'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>⚡ Supabase</h2>
        <span style={{ background: '#3ecf8e22', color: '#3ecf8e', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected · {sbProjects.length} projects</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/supabase/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['projects','orgs'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#3ecf8e' : '#1a1a1a', color: tab === t ? '#111' : '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: tab === t ? 700 : 400 }}>{t === 'projects' ? '📦 Projects' : '🏢 Organizations'}</button>)}
      </div>
      {tab === 'projects' && sbProjects.map(p => <div key={p.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: statusColor(p.status), fontSize: 11 }}>●</span>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{p.name}</span>
          <span style={{ color: '#aaa', fontSize: 11 }}>{p.region}</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{p.organization_id} · {p.created_at ? new Date(utcStamp(p.created_at)).toLocaleDateString() : ''}</div>
      </div>)}
      {tab === 'orgs' && orgs.map(o => <div key={o.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>🏢 {o.name}</span>
        <span style={{ color: '#3ecf8e', fontSize: 11 }}>{o.billing_email}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_amplitude() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ apiKey: '', secretKey: '' });
  const [status, setStatus] = React.useState('');
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/amplitude/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); fetch(`${BACKEND}/api/integrations/amplitude/events`, { headers: h }).then(r => r.json()).then(d => setEvents(d.data || [])); }
    });
  }, []);

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/amplitude/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); fetch(`${BACKEND}/api/integrations/amplitude/events`, { headers: h }).then(r => r.json()).then(d => setEvents(d.data || [])); } else setStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📈 Amplitude</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Amplitude to view events and user analytics.</p>
      <input value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))} placeholder="API Key" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.secretKey} onChange={e => setForm(p => ({ ...p, secretKey: e.target.value }))} placeholder="Secret Key" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#1e66f5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Amplitude'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📈 Amplitude</h2>
        <span style={{ background: '#1e66f522', color: '#1e66f5', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/amplitude/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ fontWeight: 600, color: '#aaa', fontSize: 12, textTransform: 'uppercase', marginBottom: 10 }}>Events ({events.length})</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {events.slice(0, 40).map((e: string, i: number) => <div key={i} style={{ padding: '8px 12px', background: '#111', borderRadius: 6, fontSize: 12, color: '#ddd' }}>⚡ {e}</div>)}
      </div>
    </div>
  );
}

export function ForgeTab_mixpanel() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ serviceAccountUser: '', serviceAccountSecret: '', projectId: '' });
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'events'|'funnels'>('events');
  const [events, setEvents] = React.useState<any[]>([]);
  const [funnels, setFunnels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/mixpanel/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [e, f] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/mixpanel/events`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/mixpanel/funnels`, { headers: h }).then(r => r.json()),
    ]);
    setEvents(e.events || []); setFunnels(f.results || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/mixpanel/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🔮 Mixpanel</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Mixpanel to browse events and funnels.</p>
      <input value={form.serviceAccountUser} onChange={e => setForm(p => ({ ...p, serviceAccountUser: e.target.value }))} placeholder="Service Account Username" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.serviceAccountSecret} onChange={e => setForm(p => ({ ...p, serviceAccountSecret: e.target.value }))} placeholder="Service Account Secret" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))} placeholder="Project ID" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#7856ff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Mixpanel'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🔮 Mixpanel</h2>
        <span style={{ background: '#7856ff22', color: '#7856ff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/mixpanel/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['events','funnels'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#7856ff' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'events' ? '⚡ Events' : '🔽 Funnels'}</button>)}
      </div>
      {tab === 'events' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {events.slice(0, 40).map((e: string, i: number) => <div key={i} style={{ padding: '8px 12px', background: '#111', borderRadius: 6, fontSize: 12, color: '#ddd' }}>⚡ {e}</div>)}
      </div>}
      {tab === 'funnels' && funnels.map((f: any) => <div key={f.funnel_id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{f.name}</span>
        <span style={{ color: '#7856ff', fontSize: 11 }}>{f.steps?.length} steps</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_segment() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'sources'|'destinations'>('sources');
  const [sources, setSources] = React.useState<any[]>([]);
  const [destinations, setDestinations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/segment/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [s, d] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/segment/sources`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/segment/destinations`, { headers: h }).then(r => r.json()),
    ]);
    setSources(s.data?.sources || []); setDestinations(d.data?.destinations || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/segment/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🔌 Segment</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Segment to view sources and destinations.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Public API Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#52bd94', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Segment'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🔌 Segment</h2>
        <span style={{ background: '#52bd9422', color: '#52bd94', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/segment/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['sources','destinations'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#52bd94' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'sources' ? '📥 Sources' : '📤 Destinations'}</button>)}
      </div>
      {tab === 'sources' && sources.map(s => <div key={s.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{s.name}</span>
        <span style={{ color: s.enabled ? '#18d26e' : '#888', fontSize: 11 }}>● {s.enabled ? 'enabled' : 'disabled'}</span>
      </div>)}
      {tab === 'destinations' && destinations.map(d => <div key={d.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{d.name}</span>
        <span style={{ color: d.enabled ? '#18d26e' : '#888', fontSize: 11 }}>● {d.enabled ? 'enabled' : 'disabled'}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_posthog() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ apiKey: '', projectId: '' });
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'insights'|'events'|'persons'>('insights');
  const [insights, setInsights] = React.useState<any[]>([]);
  const [phEvents, setPhEvents] = React.useState<any[]>([]);
  const [persons, setPersons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/posthog/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [i, e, p] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/posthog/insights`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/posthog/events`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/posthog/persons`, { headers: h }).then(r => r.json()),
    ]);
    setInsights(i.results || []); setPhEvents(e.results || []); setPersons(p.results || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/posthog/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🦔 PostHog</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect PostHog to view insights, events, and users.</p>
      <input value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))} placeholder="Personal API Key (phx_xxx)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))} placeholder="Project ID" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#f9bd2b', color: '#111', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect PostHog'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🦔 PostHog</h2>
        <span style={{ background: '#f9bd2b22', color: '#f9bd2b', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/posthog/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['insights','events','persons'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#f9bd2b' : '#1a1a1a', color: tab === t ? '#111' : '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: tab === t ? 700 : 400 }}>{t === 'insights' ? '💡 Insights' : t === 'events' ? '⚡ Events' : '👤 Persons'}</button>)}
      </div>
      {tab === 'insights' && insights.map(i => <div key={i.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ fontWeight: 600, color: '#ddd' }}>{i.name || i.derived_name || 'Unnamed insight'}</div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{i.filters?.insight}</div>
      </div>)}
      {tab === 'events' && phEvents.map((e, i) => <div key={i} style={{ padding: '8px 12px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#f9bd2b', fontSize: 12 }}>⚡ {e.event}</span>
        <span style={{ color: '#aaa', fontSize: 11, flex: 1 }}>{e.distinct_id}</span>
      </div>)}
      {tab === 'persons' && persons.map((p, i) => <div key={i} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{p.name || p.distinct_ids?.[0]}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{p.properties?.email}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_datadog() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ apiKey: '', appKey: '' });
  const [connStatus, setConnStatus] = React.useState('');
  const [tab, setTab] = React.useState<'monitors'|'metrics'|'logs'>('monitors');
  const [monitors, setMonitors] = React.useState<any[]>([]);
  const [ddMetrics, setDdMetrics] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/datadog/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [m, mt, l] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/datadog/monitors`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/datadog/metrics`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/datadog/logs`, { headers: h }).then(r => r.json()),
    ]);
    setMonitors(Array.isArray(m) ? m : []); setDdMetrics(mt.metrics || []); setLogs(l.data || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/datadog/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setConnStatus(''); loadAll(); } else setConnStatus(d.error || 'Failed');
  };

  const stateColor = (s: string) => ({ Alert: '#f55', Warn: '#ff9500', OK: '#18d26e', 'No Data': '#888' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🐶 Datadog</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Datadog to monitor infrastructure, metrics, and logs.</p>
      <input value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))} placeholder="API Key" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.appKey} onChange={e => setForm(p => ({ ...p, appKey: e.target.value }))} placeholder="Application Key" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {connStatus && <p style={{ color: '#f55', marginBottom: 8 }}>{connStatus}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#632ca6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Datadog'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🐶 Datadog</h2>
        <span style={{ background: '#632ca622', color: '#632ca6', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/datadog/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['monitors','metrics','logs'] as const).map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t ? '#632ca6' : '#1a1a1a', color: tab === t ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t === 'monitors' ? '🔔 Monitors' : t === 'metrics' ? '📊 Metrics' : '📋 Logs'}</button>)}
      </div>
      {tab === 'monitors' && monitors.map(m => <div key={m.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: stateColor(m.overall_state), fontSize: 11 }}>●</span>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{m.name}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{m.type}</span>
      </div>)}
      {tab === 'metrics' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {ddMetrics.slice(0, 40).map((m: string, i: number) => <div key={i} style={{ padding: '8px 12px', background: '#111', borderRadius: 6, fontSize: 12, color: '#ddd' }}>📊 {m}</div>)}
      </div>}
      {tab === 'logs' && logs.map((l: any, i: number) => <div key={i} style={{ padding: '8px 12px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
          <span style={{ color: ({ ERROR: '#f55', WARN: '#ff9500', INFO: '#4285f4', DEBUG: '#888' } as any)[l.attributes?.status] || '#888', fontWeight: 700, fontSize: 10 }}>{l.attributes?.status}</span>
        </div>
        <div style={{ color: '#ddd' }}>{String(l.attributes?.message || '').slice(0, 120)}</div>
      </div>)}
    </div>
  );
}

export function ForgeTab_jira_v1() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [status, setStatus] = React.useState<any>(null);
  const [domain, setDomain] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [apiToken, setApiToken] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [issues, setIssues] = React.useState<any[]>([]);
  const [selProject, setSelProject] = React.useState('');
  const [newSummary, setNewSummary] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');
  const [newType, setNewType] = React.useState('Task');
  const [tab, setTab] = React.useState<'issues'|'create'>('issues');

  React.useEffect(() => {
    fetch(`${API}/api/integrations/jira/status`, {headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>{ setStatus(d); if(d.connected) loadProjects(); });
  }, []);

  async function loadProjects() {
    const r = await fetch(`${API}/api/integrations/jira/projects`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    if(d.projects?.length) { setProjects(d.projects); setSelProject(d.projects[0].key); loadIssues(d.projects[0].key); }
  }

  async function loadIssues(projectKey: string) {
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/jira/issues?projectKey=${projectKey}`, {headers:{Authorization:`Bearer ${tok}`}});
    const d = await r.json();
    setIssues(d.issues||[]);
    setLoading(false);
  }

  async function connect() {
    if(!domain.trim()||!email.trim()||!apiToken.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/jira/connect`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({domain,email,apiToken})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setStatus({connected:true,...d}); loadProjects(); }
    else alert(d.error||'Connection failed');
  }

  async function createIssue() {
    if(!newSummary.trim()||!selProject) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/jira/issue`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({projectKey:selProject,summary:newSummary,description:newDesc,issueType:newType})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setNewSummary(''); setNewDesc(''); loadIssues(selProject); setTab('issues'); alert(`Created: ${d.key}`); }
    else alert(d.error||'Failed');
  }

  const priColor: Record<string,string> = {'Highest':'#ef4444','High':'#f97316','Medium':'#eab308','Low':'#22c55e','Lowest':'#94a3b8'};

  const s: Record<string,React.CSSProperties> = {
    wrap:{padding:24,maxWidth:1000,margin:'0 auto'},
    card:{background:'#1e1e2e',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #2d2d3d'},
    input:{background:'#0d0d14',border:'1px solid #3d3d5c',borderRadius:8,padding:'10px 14px',color:'#e2e8f0',width:'100%',fontSize:14,boxSizing:'border-box' as const},
    btn:{padding:'10px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:14},
    tabs:{display:'flex',gap:8,marginBottom:20},
    tab:{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600},
    issueRow:{background:'#12121e',borderRadius:8,padding:'10px 14px',marginBottom:6,border:'1px solid #2d2d3d',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  };

  if(!status) return <div style={{padding:40,color:'#94a3b8',textAlign:'center'}}>Loading Jira status…</div>;

  if(!status.connected) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={{color:'#f1f5f9',marginBottom:8}}>🔷 Connect Jira</h2>
        <p style={{color:'#94a3b8',fontSize:14,marginBottom:16}}>Connect your Jira Cloud workspace to browse projects, view issues, and create tickets.</p>
        <ol style={{color:'#94a3b8',fontSize:13,marginBottom:20,lineHeight:'1.8'}}>
          <li>Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" style={{color:'#818cf8'}}>id.atlassian.com → API tokens</a> → Create token</li>
          <li>Enter your Jira domain (e.g. <code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>mycompany.atlassian.net</code>)</li>
        </ol>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <input style={s.input} placeholder="yourcompany.atlassian.net" value={domain} onChange={e=>setDomain(e.target.value)} />
          <input style={s.input} placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <div style={{display:'flex',gap:10}}>
            <input style={s.input} placeholder="API token" type="password" value={apiToken} onChange={e=>setApiToken(e.target.value)} />
            <button style={{...s.btn,background:'#6366f1',color:'#fff',whiteSpace:'nowrap'}} onClick={connect} disabled={loading}>{loading?'Connecting…':'Connect Jira'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><span style={{color:'#a78bfa',fontWeight:700,fontSize:18}}>🔷 Jira</span><span style={{color:'#22c55e',fontSize:12,marginLeft:10}}>● {status.display_name||'Connected'} @ {status.domain}</span></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select style={{...s.input,width:'auto',padding:'6px 10px'}} value={selProject} onChange={e=>{setSelProject(e.target.value);loadIssues(e.target.value);}}>
            {projects.map(p=><option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
          <button style={{...s.btn,background:'#374151',color:'#9ca3af',fontSize:12}} onClick={()=>{fetch(`${API}/api/integrations/jira/disconnect`,{method:'DELETE',headers:{Authorization:`Bearer ${tok}`}});setStatus({connected:false});}}>Disconnect</button>
        </div>
      </div>

      <div style={s.tabs}>
        {(['issues','create'] as const).map(t=>(
          <button key={t} style={{...s.tab,background:tab===t?'#6366f1':'#1e1e2e',color:tab===t?'#fff':'#94a3b8',border:'1px solid '+(tab===t?'#6366f1':'#2d2d3d')}} onClick={()=>setTab(t)}>{t==='issues'?'🎯 Issues':'✏️ Create Issue'}</button>
        ))}
      </div>

      {tab==='issues' && (
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{color:'#f1f5f9',margin:0}}>Recent Issues</h3>
            <button style={{...s.btn,background:'#1e1e2e',color:'#6366f1',border:'1px solid #6366f1',fontSize:12}} onClick={()=>loadIssues(selProject)}>↻ Refresh</button>
          </div>
          {loading && <p style={{color:'#64748b'}}>Loading…</p>}
          {issues.map(iss=>(
            <div key={iss.key} style={s.issueRow}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{color:'#6366f1',fontSize:12,fontWeight:700}}>{iss.key}</span>
                  <span style={{background:'#1e3a5f',color:'#93c5fd',borderRadius:4,padding:'1px 6px',fontSize:11}}>{iss.status}</span>
                  <span style={{color:priColor[iss.priority]||'#94a3b8',fontSize:11}}>{iss.priority}</span>
                  <span style={{color:'#64748b',fontSize:11}}>{iss.type}</span>
                </div>
                <div style={{color:'#e2e8f0',fontSize:14}}>{iss.summary}</div>
                {iss.assignee && <div style={{color:'#64748b',fontSize:12,marginTop:4}}>👤 {iss.assignee}</div>}
              </div>
              <a href={iss.url} target="_blank" style={{color:'#6366f1',fontSize:12,whiteSpace:'nowrap'}}>Open ↗</a>
            </div>
          ))}
          {issues.length===0 && !loading && <p style={{color:'#64748b',fontSize:13}}>No issues found for this project.</p>}
        </div>
      )}

      {tab==='create' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:16}}>Create Issue</h3>
          <div style={{marginBottom:12}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Summary *</label>
            <input style={{...s.input,marginTop:6}} placeholder="Issue summary" value={newSummary} onChange={e=>setNewSummary(e.target.value)} />
          </div>
          <div style={{marginBottom:12}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Description</label>
            <textarea style={{...s.input,marginTop:6,minHeight:100,resize:'vertical'} as React.CSSProperties} placeholder="Describe the issue…" value={newDesc} onChange={e=>setNewDesc(e.target.value)} />
          </div>
          <div style={{marginBottom:16}}>
            <label style={{color:'#94a3b8',fontSize:13}}>Issue Type</label>
            <select style={{...s.input,marginTop:6,width:'auto'}} value={newType} onChange={e=>setNewType(e.target.value)}>
              <option>Task</option><option>Bug</option><option>Story</option><option>Epic</option>
            </select>
          </div>
          <button style={{...s.btn,background:'#22c55e',color:'#fff',width:'100%'}} onClick={createIssue} disabled={loading||!newSummary.trim()}>{loading?'Creating…':'Create Issue'}</button>
        </div>
      )}
    </div>
  );
}

export function ForgeTab_stripe() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [status, setStatus] = React.useState<any>(null);
  const [secretKey, setSecretKey] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [overview, setOverview] = React.useState<any>(null);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [subs, setSubs] = React.useState<any[]>([]);
  const [charges, setCharges] = React.useState<any[]>([]);
  const [tab, setTab] = React.useState<'overview'|'customers'|'subscriptions'|'charges'>('overview');

  React.useEffect(() => {
    fetch(`${API}/api/integrations/stripe/status`, {headers:{Authorization:`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>{ setStatus(d); if(d.connected) loadAll(); });
  }, []);

  async function loadAll() {
    setLoading(true);
    const [ov, cu, sb, ch] = await Promise.all([
      fetch(`${API}/api/integrations/stripe/overview`, {headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()),
      fetch(`${API}/api/integrations/stripe/customers`, {headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()),
      fetch(`${API}/api/integrations/stripe/subscriptions`, {headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()),
      fetch(`${API}/api/integrations/stripe/charges`, {headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()),
    ]);
    setOverview(ov); setCustomers(cu.customers||[]); setSubs(sb.subscriptions||[]); setCharges(ch.charges||[]);
    setLoading(false);
  }

  async function connect() {
    if(!secretKey.trim()) return;
    setLoading(true);
    const r = await fetch(`${API}/api/integrations/stripe/connect`, {method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`}, body:JSON.stringify({secretKey})});
    const d = await r.json();
    setLoading(false);
    if(d.ok) { setStatus({connected:true,...d}); loadAll(); }
    else alert(d.error||'Connection failed');
  }

  const fmtMoney = (cents: number, currency = 'usd') => new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100);
  const fmtDate = (ts: number) => new Date(ts*1000).toLocaleDateString();

  const s: Record<string,React.CSSProperties> = {
    wrap:{padding:24,maxWidth:1100,margin:'0 auto'},
    card:{background:'#1e1e2e',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #2d2d3d'},
    input:{background:'#0d0d14',border:'1px solid #3d3d5c',borderRadius:8,padding:'10px 14px',color:'#e2e8f0',width:'100%',fontSize:14,boxSizing:'border-box' as const},
    btn:{padding:'10px 20px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:600,fontSize:14},
    tabs:{display:'flex',gap:8,marginBottom:20},
    tab:{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600},
    statCard:{background:'#12121e',borderRadius:10,padding:20,border:'1px solid #2d2d3d',textAlign:'center' as const},
    row:{background:'#12121e',borderRadius:8,padding:'10px 14px',marginBottom:6,border:'1px solid #2d2d3d',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12},
  };

  if(!status) return <div style={{padding:40,color:'#94a3b8',textAlign:'center'}}>Loading Stripe status…</div>;

  if(!status.connected) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={{color:'#f1f5f9',marginBottom:8}}>💳 Connect Stripe</h2>
        <p style={{color:'#94a3b8',fontSize:14,marginBottom:16}}>Connect your Stripe account to view revenue, customers, subscriptions, and recent charges.</p>
        <ol style={{color:'#94a3b8',fontSize:13,marginBottom:20,lineHeight:'1.8'}}>
          <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" style={{color:'#818cf8'}}>dashboard.stripe.com/apikeys</a></li>
          <li>Copy your <strong style={{color:'#f1f5f9'}}>Secret key</strong> (<code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>sk_live_...</code> or <code style={{background:'#2d2d3d',padding:'1px 4px',borderRadius:3}}>sk_test_...</code>)</li>
        </ol>
        <div style={{display:'flex',gap:10}}>
          <input style={s.input} placeholder="sk_live_xxx or sk_test_xxx" type="password" value={secretKey} onChange={e=>setSecretKey(e.target.value)} />
          <button style={{...s.btn,background:'#6366f1',color:'#fff',whiteSpace:'nowrap'}} onClick={connect} disabled={loading}>{loading?'Connecting…':'Connect Stripe'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><span style={{color:'#a78bfa',fontWeight:700,fontSize:18}}>💳 Stripe</span><span style={{color:'#22c55e',fontSize:12,marginLeft:10}}>● {status.account_name||'Connected'} {status.mode==='test'?'[TEST MODE]':''}</span></div>
        <div style={{display:'flex',gap:8}}>
          <button style={{...s.btn,background:'#1e1e2e',color:'#6366f1',border:'1px solid #6366f1',fontSize:12}} onClick={loadAll}>↻ Refresh</button>
          <button style={{...s.btn,background:'#374151',color:'#9ca3af',fontSize:12}} onClick={()=>{fetch(`${API}/api/integrations/stripe/disconnect`,{method:'DELETE',headers:{Authorization:`Bearer ${tok}`}});setStatus({connected:false});}}>Disconnect</button>
        </div>
      </div>

      <div style={s.tabs}>
        {(['overview','customers','subscriptions','charges'] as const).map(t=>(
          <button key={t} style={{...s.tab,background:tab===t?'#6366f1':'#1e1e2e',color:tab===t?'#fff':'#94a3b8',border:'1px solid '+(tab===t?'#6366f1':'#2d2d3d')}} onClick={()=>setTab(t)}>{t==='overview'?'📊 Overview':t==='customers'?'👥 Customers':t==='subscriptions'?'🔄 Subscriptions':'💰 Charges'}</button>
        ))}
      </div>

      {tab==='overview' && overview && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[
              {label:'MRR',value:fmtMoney(overview.mrr||0),color:'#22c55e'},
              {label:'Total Revenue (30d)',value:fmtMoney(overview.revenue_30d||0),color:'#6366f1'},
              {label:'Active Subs',value:String(overview.active_subs||0),color:'#f59e0b'},
              {label:'Total Customers',value:String(overview.total_customers||0),color:'#3b82f6'},
            ].map(stat=>(
              <div key={stat.label} style={s.statCard}>
                <div style={{color:'#64748b',fontSize:12,marginBottom:8}}>{stat.label}</div>
                <div style={{color:stat.color,fontSize:24,fontWeight:800}}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='customers' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:12}}>Recent Customers</h3>
          {customers.map(c=>(
            <div key={c.id} style={s.row}>
              <div>
                <div style={{color:'#e2e8f0',fontSize:14,fontWeight:600}}>{c.name||'(no name)'}</div>
                <div style={{color:'#64748b',fontSize:12}}>{c.email} · {fmtDate(c.created)}</div>
              </div>
              <div style={{textAlign:'right' as const}}>
                <div style={{color:'#22c55e',fontSize:14,fontWeight:700}}>{fmtMoney(c.balance<0?-c.balance:0)}</div>
                <div style={{color:'#475569',fontSize:11}}>{c.id}</div>
              </div>
            </div>
          ))}
          {customers.length===0 && <p style={{color:'#64748b',fontSize:13}}>No customers yet.</p>}
        </div>
      )}

      {tab==='subscriptions' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:12}}>Active Subscriptions</h3>
          {subs.map(sub=>(
            <div key={sub.id} style={s.row}>
              <div>
                <div style={{color:'#e2e8f0',fontSize:14,fontWeight:600}}>{sub.customer_email||sub.customer_id}</div>
                <div style={{color:'#64748b',fontSize:12}}>{sub.plan} · started {fmtDate(sub.created)}</div>
              </div>
              <div style={{textAlign:'right' as const}}>
                <span style={{background:sub.status==='active'?'#14532d':'#7f1d1d',color:sub.status==='active'?'#4ade80':'#f87171',borderRadius:4,padding:'2px 8px',fontSize:12}}>{sub.status}</span>
                <div style={{color:'#22c55e',fontSize:14,fontWeight:700,marginTop:4}}>{fmtMoney(sub.amount,sub.currency)} / {sub.interval}</div>
              </div>
            </div>
          ))}
          {subs.length===0 && <p style={{color:'#64748b',fontSize:13}}>No subscriptions yet.</p>}
        </div>
      )}

      {tab==='charges' && (
        <div style={s.card}>
          <h3 style={{color:'#f1f5f9',marginBottom:12}}>Recent Charges</h3>
          {charges.map(ch=>(
            <div key={ch.id} style={s.row}>
              <div>
                <div style={{color:'#e2e8f0',fontSize:14,fontWeight:600}}>{ch.description||ch.customer_email||'Charge'}</div>
                <div style={{color:'#64748b',fontSize:12}}>{fmtDate(ch.created)} · {ch.payment_method}</div>
              </div>
              <div style={{textAlign:'right' as const}}>
                <div style={{color:'#22c55e',fontSize:16,fontWeight:700}}>{fmtMoney(ch.amount,ch.currency)}</div>
                <span style={{background:ch.status==='succeeded'?'#14532d':'#7f1d1d',color:ch.status==='succeeded'?'#4ade80':'#f87171',borderRadius:4,padding:'1px 6px',fontSize:11}}>{ch.status}</span>
              </div>
            </div>
          ))}
          {charges.length===0 && <p style={{color:'#64748b',fontSize:13}}>No charges yet.</p>}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_jira() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ email: '', apiToken: '', domain: '' });
  const [status, setStatus] = React.useState('');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [issues, setIssues] = React.useState<any[]>([]);
  const [selectedProject, setSelectedProject] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/jira/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadProjects(); }
    });
  }, []);

  const loadProjects = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/jira/projects`, { headers: h }); const d = await r.json();
    setProjects(d.values || []);
  };

  const loadIssues = async (key?: string) => {
    const proj = key || selectedProject;
    const r = await fetch(`/api/integrations/jira/issues${proj ? `?project=${proj}` : ''}`, { headers: h }); const d = await r.json();
    setIssues(d.issues || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/jira/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadProjects(); loadIssues(); } else setStatus(d.error || 'Failed');
  };

  const prioColor = (p: string) => ({ Highest: '#f55', High: '#ff9500', Medium: '#ffe01b', Low: '#4285f4', Lowest: '#888' }[p] || '#888');
  const stateColor = (c: string) => ({ 'In Progress': '#4285f4', Done: '#18d26e', 'To Do': '#888' }[c] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🔵 Jira</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Jira to browse projects and issues.</p>
      {['email','apiToken','domain'].map(k => <input key={k} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} type={k === 'apiToken' ? 'password' : 'text'} placeholder={k === 'domain' ? 'Domain (yourorg — no .atlassian.net)' : k === 'apiToken' ? 'API Token' : 'Email'} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />)}
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#0052cc', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Jira'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🔵 Jira</h2>
        <span style={{ background: '#0052cc22', color: '#0052cc', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/jira/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Projects</div>
          <div onClick={() => { setSelectedProject(''); loadIssues(''); }} style={{ padding: '7px 10px', borderRadius: 6, cursor: 'pointer', color: !selectedProject ? '#0052cc' : '#aaa', background: !selectedProject ? '#0052cc11' : 'transparent', marginBottom: 4, fontSize: 13 }}>All my issues</div>
          {projects.map(p => <div key={p.id} onClick={() => { setSelectedProject(p.key); loadIssues(p.key); }} style={{ padding: '7px 10px', borderRadius: 6, cursor: 'pointer', color: selectedProject === p.key ? '#0052cc' : '#ddd', background: selectedProject === p.key ? '#0052cc11' : 'transparent', marginBottom: 4, fontSize: 13 }}>
            {p.avatarUrls?.['16x16'] && <img src={p.avatarUrls['16x16']} style={{ width: 14, height: 14, borderRadius: 2, marginRight: 6, verticalAlign: 'middle' }} />}
            {p.name}
          </div>)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Issues ({issues.length})</div>
          {issues.map(i => <div key={i.id} style={{ padding: '10px 12px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#0052cc', fontSize: 11, fontWeight: 700 }}>{i.key}</span>
              <span style={{ flex: 1, color: '#ddd', fontWeight: 500 }}>{i.fields?.summary}</span>
              <span style={{ color: prioColor(i.fields?.priority?.name), fontSize: 10 }}>↑ {i.fields?.priority?.name}</span>
            </div>
            <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>
              <span style={{ color: stateColor(i.fields?.status?.statusCategory?.name) }}>● {i.fields?.status?.name}</span>
              {i.fields?.assignee && <span style={{ marginLeft: 8 }}>👤 {i.fields.assignee.displayName}</span>}
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_slack() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [channels, setChannels] = React.useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [msg, setMsg] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/slack/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadChannels(); }
    });
  }, []);

  const loadChannels = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/slack/channels`, { headers: h }); const d = await r.json();
    setChannels(d.channels || []);
  };

  const openChannel = async (ch: any) => {
    setSelectedChannel(ch);
    const r = await fetch(`/api/integrations/slack/messages?channel=${ch.id}`, { headers: h }); const d = await r.json();
    setMessages((d.messages || []).reverse());
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/slack/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadChannels(); } else setStatus(d.error || 'Failed');
  };

  const send = async () => {
    if (!selectedChannel || !msg.trim()) return;
    setSending(true);
    await fetch(`${BACKEND}/api/integrations/slack/send`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: selectedChannel.id, text: msg }) });
    setSending(false); setMsg(''); openChannel(selectedChannel);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>💬 Slack</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Slack to browse channels and send messages.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Bot/User OAuth Token (xoxb-xxx or xoxp-xxx)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#4a154b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Slack'}</button>
    </div>
  );

  return (
    <div style={{ padding: 0, display: 'flex', height: '100%', minHeight: 500 }}>
      <div style={{ width: 200, borderRight: '1px solid #1a1a1a', padding: '16px 8px', background: '#0d0d0d', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 8 }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>💬 Slack</span>
          <button onClick={() => { fetch(`${BACKEND}/api/integrations/slack/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 10 }}>×</button>
        </div>
        <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', marginBottom: 6 }}>Channels</div>
        {channels.map(ch => <div key={ch.id} onClick={() => openChannel(ch)} style={{ padding: '5px 8px', borderRadius: 4, cursor: 'pointer', background: selectedChannel?.id === ch.id ? '#4a154b33' : 'transparent', color: selectedChannel?.id === ch.id ? '#fff' : '#bbb', fontSize: 13, marginBottom: 2 }}>
          # {ch.name}
        </div>)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        {selectedChannel ? <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a', fontWeight: 700, fontSize: 14, color: '#ddd' }}>#{selectedChannel.name}</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => <div key={i} style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#4285f4', marginRight: 8 }}>{m.username || m.user || 'User'}</span>
              <span style={{ color: '#ddd' }}>{m.text}</span>
              <span style={{ color: '#555', fontSize: 10, marginLeft: 8 }}>{m.ts ? new Date(Number(m.ts) * 1000).toLocaleTimeString() : ''}</span>
            </div>)}
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 8 }}>
            <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={`Message #${selectedChannel.name}`} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
            <button onClick={send} disabled={sending} style={{ background: '#4a154b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 700 }}>Send</button>
          </div>
        </> : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Select a channel</div>}
      </div>
    </div>
  );
}
