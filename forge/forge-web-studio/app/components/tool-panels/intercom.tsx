'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';
import { utcStamp } from '../../../lib/platform-time';

export function ForgeTab_intercom() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'conversations'|'contacts'>('conversations');
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<any>(null);
  const [reply, setReply] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/intercom/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [c, ct] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/intercom/conversations`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/intercom/contacts`, { headers: h }).then(r => r.json()),
    ]);
    setConversations(c.conversations || []); setContacts(ct.data || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/intercom/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    await fetch(`${BACKEND}/api/integrations/intercom/reply`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: selected.id, body: reply }) });
    setSending(false); setReply(''); loadAll();
  };

  const stateColor = (s: string) => ({ open: '#18d26e', closed: '#888', snoozed: '#ff9500' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>💬 Intercom</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Intercom to manage customer conversations and contacts.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#1f8ded', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Intercom'}</button>
    </div>
  );

  const tabs = [{ id: 'conversations', label: '💬 Conversations' }, { id: 'contacts', label: '👤 Contacts' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>💬 Intercom</h2>
        <span style={{ background: '#1f8ded22', color: '#1f8ded', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/intercom/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#1f8ded' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'conversations' && <div>
        {conversations.map(c => <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)} style={{ padding: '10px 12px', background: selected?.id === c.id ? '#1f8ded11' : '#111', borderRadius: 6, marginBottom: 4, cursor: 'pointer', fontSize: 13, border: `1px solid ${selected?.id === c.id ? '#1f8ded44' : 'transparent'}` }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: stateColor(c.state), fontSize: 11 }}>● {c.state}</span>
            <span style={{ flex: 1, color: '#ddd', fontWeight: 500 }}>{c.source?.subject || c.id}</span>
            <span style={{ color: '#555', fontSize: 11 }}>{c.updated_at ? new Date(utcStamp(c.updated_at * 1000)).toLocaleDateString() : ''}</span>
          </div>
          {c.source?.body && <div style={{ color: '#888', fontSize: 11, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: c.source.body }} />}
        </div>)}
        {selected && <div style={{ marginTop: 12, padding: 14, background: '#0d0d0d', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, color: '#aaa', fontSize: 12, marginBottom: 8 }}>Reply</div>
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
          <button onClick={sendReply} disabled={sending} style={{ marginTop: 8, background: '#1f8ded', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontWeight: 700 }}>Send Reply</button>
        </div>}
      </div>}
      {tab === 'contacts' && contacts.map((c: any) => <div key={c.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        {c.avatar?.image_url && <img src={c.avatar.image_url} style={{ width: 28, height: 28, borderRadius: '50%' }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: '#ddd' }}>{c.name || c.email}</div>
          {c.name && <div style={{ color: '#aaa', fontSize: 11 }}>{c.email}</div>}
        </div>
        <span style={{ color: '#1f8ded', fontSize: 11 }}>{c.last_seen_at ? new Date(c.last_seen_at * 1000).toLocaleDateString() : ''}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_pipedrive() {
  const [connected, setConnected] = React.useState(false);
  const [apiToken, setApiToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'deals'|'persons'>('deals');
  const [deals, setDeals] = React.useState<any[]>([]);
  const [persons, setPersons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/pipedrive/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [d, p] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/pipedrive/deals`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/pipedrive/persons`, { headers: h }).then(r => r.json()),
    ]);
    setDeals(d.data || []); setPersons(p.data || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/pipedrive/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiToken }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const stageColor = (s: string) => ({ won: '#18d26e', lost: '#f55', open: '#4285f4' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🔧 Pipedrive</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Pipedrive to browse deals and contacts.</p>
      <input value={apiToken} onChange={e => setApiToken(e.target.value)} placeholder="API Token (from Settings → Personal Preferences)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#17a76c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Pipedrive'}</button>
    </div>
  );

  const tabs = [{ id: 'deals', label: '💰 Deals' }, { id: 'persons', label: '👤 People' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🔧 Pipedrive</h2>
        <span style={{ background: '#17a76c22', color: '#17a76c', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/pipedrive/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#17a76c' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'deals' && deals.map(d => <div key={d.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{d.title}</span>
        <span style={{ color: '#17a76c', fontWeight: 700 }}>{d.value ? `${d.currency} ${Number(d.value).toLocaleString()}` : '—'}</span>
        <span style={{ color: stageColor(d.status), fontSize: 11 }}>● {d.status}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{d.close_time ? new Date(d.close_time).toLocaleDateString() : ''}</span>
      </div>)}
      {tab === 'persons' && persons.map(p => <div key={p.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{p.name}</span>
        <span style={{ color: '#aaa', fontSize: 12 }}>{p.email?.[0]?.value}</span>
        <span style={{ color: '#17a76c', fontSize: 12 }}>{p.open_deals_count} open deals</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_typeform() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [forms, setForms] = React.useState<any[]>([]);
  const [selectedForm, setSelectedForm] = React.useState<any>(null);
  const [responses, setResponses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/typeform/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadForms(); }
    });
  }, []);

  const loadForms = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/typeform/forms`, { headers: h }); const d = await r.json();
    setForms(d.items || []);
  };

  const loadResponses = async (form: any) => {
    setSelectedForm(form);
    const r = await fetch(`/api/integrations/typeform/responses?formId=${form.id}`, { headers: h }); const d = await r.json();
    setResponses(d.items || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/typeform/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadForms(); } else setStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📋 Typeform</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Typeform to browse forms and responses.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#262627', color: '#fff', border: '1px solid #555', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Typeform'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📋 Typeform</h2>
        <span style={{ background: '#ffffff22', color: '#ccc', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/typeform/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Forms ({forms.length})</div>
          {forms.map(f => <div key={f.id} onClick={() => loadResponses(f)} style={{ padding: '9px 11px', borderRadius: 6, cursor: 'pointer', background: selectedForm?.id === f.id ? '#ffffff11' : 'transparent', color: selectedForm?.id === f.id ? '#fff' : '#ccc', marginBottom: 4, fontSize: 13, border: `1px solid ${selectedForm?.id === f.id ? '#555' : 'transparent'}` }}>
            <div style={{ fontWeight: 600 }}>{f.title}</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{f.settings?.is_public ? '🌐 Public' : '🔒 Private'}</div>
          </div>)}
        </div>
        <div style={{ flex: 1 }}>
          {selectedForm && <>
            <div style={{ fontWeight: 600, marginBottom: 10, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Responses ({responses.length})</div>
            {responses.map(r => <div key={r.response_id} style={{ padding: '10px 12px', background: '#111', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 8, color: '#555', fontSize: 11, marginBottom: 6 }}>
                <span>{new Date(r.submitted_at).toLocaleDateString()}</span>
                <span>{r.metadata?.network_id}</span>
              </div>
              {(r.answers || []).slice(0, 3).map((a: any, i: number) => <div key={i} style={{ color: '#ddd', marginBottom: 3 }}>
                <span style={{ color: '#888', marginRight: 6 }}>{a.field?.ref || a.type}:</span>
                {a.text || a.choice?.label || a.number || a.boolean?.toString() || a.email || '—'}
              </div>)}
            </div>)}
          </>}
          {!selectedForm && <div style={{ color: '#555', fontSize: 14, marginTop: 30 }}>Select a form to see responses</div>}
        </div>
      </div>
    </div>
  );
}

export function ForgeTab_salesforce() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ instanceUrl: '', accessToken: '' });
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'accounts'|'opportunities'|'leads'>('opportunities');
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [opps, setOpps] = React.useState<any[]>([]);
  const [leads, setLeads] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/salesforce/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [a, o, l] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/salesforce/accounts`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/salesforce/opportunities`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/salesforce/leads`, { headers: h }).then(r => r.json()),
    ]);
    setAccounts(a.records || []); setOpps(o.records || []); setLeads(l.records || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/salesforce/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const stageColor = (s: string) => ({ 'Closed Won': '#18d26e', 'Closed Lost': '#f55', 'Prospecting': '#4285f4', 'Proposal/Price Quote': '#ff9500' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>☁️ Salesforce</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Salesforce to browse accounts, opportunities, and leads.</p>
      <input value={form.instanceUrl} onChange={e => setForm(p => ({ ...p, instanceUrl: e.target.value }))} placeholder="Instance URL (https://yourorg.my.salesforce.com)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.accessToken} onChange={e => setForm(p => ({ ...p, accessToken: e.target.value }))} placeholder="Access Token" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#00a1e0', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Salesforce'}</button>
    </div>
  );

  const tabs = [{ id: 'opportunities', label: '💰 Opportunities' }, { id: 'accounts', label: '🏢 Accounts' }, { id: 'leads', label: '🎯 Leads' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>☁️ Salesforce</h2>
        <span style={{ background: '#00a1e022', color: '#00a1e0', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/salesforce/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#00a1e0' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'opportunities' && opps.map(o => <div key={o.Id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{o.Name}</span>
        <span style={{ color: '#18d26e', fontWeight: 700 }}>{o.Amount ? `$${Number(o.Amount).toLocaleString()}` : '-'}</span>
        <span style={{ color: stageColor(o.StageName), fontSize: 11 }}>● {o.StageName}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{o.CloseDate}</span>
      </div>)}
      {tab === 'accounts' && accounts.map(a => <div key={a.Id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{a.Name}</span>
        <span style={{ color: '#aaa', fontSize: 12 }}>{a.Industry || '—'}</span>
        <span style={{ color: '#00a1e0', fontSize: 12 }}>{a.AnnualRevenue ? `$${Number(a.AnnualRevenue).toLocaleString()}` : ''}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{a.BillingCity}</span>
      </div>)}
      {tab === 'leads' && leads.map(l => <div key={l.Id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd' }}>{l.FirstName} {l.LastName}</span>
        <span style={{ color: '#aaa', fontSize: 12 }}>{l.Company}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{l.Email}</span>
        <span style={{ color: l.Status === 'Converted' ? '#18d26e' : '#888', fontSize: 11, marginLeft: 'auto' }}>● {l.Status}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_mailchimp() {
  const [connected, setConnected] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'campaigns'|'lists'>('campaigns');
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [lists, setLists] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/mailchimp/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [c, l] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/mailchimp/campaigns`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/mailchimp/lists`, { headers: h }).then(r => r.json()),
    ]);
    setCampaigns(c.campaigns || []); setLists(l.lists || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/mailchimp/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const statusColor = (s: string) => ({ sent: '#18d26e', sending: '#4285f4', schedule: '#ff9500', draft: '#888', paused: '#f55' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🐵 Mailchimp</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Mailchimp to manage campaigns and audiences.</p>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key (xxx-us1)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#ffe01b', color: '#241c15', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Mailchimp'}</button>
    </div>
  );

  const tabs = [{ id: 'campaigns', label: '📧 Campaigns' }, { id: 'lists', label: '👥 Audiences' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🐵 Mailchimp</h2>
        <span style={{ background: '#ffe01b33', color: '#ffe01b', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/mailchimp/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#ffe01b' : '#1a1a1a', color: tab === t.id ? '#241c15' : '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</button>)}
      </div>
      {tab === 'campaigns' && campaigns.map(c => <div key={c.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{c.settings?.subject_line || c.settings?.title || c.id}</span>
          <span style={{ color: statusColor(c.status), fontSize: 11 }}>● {c.status}</span>
        </div>
        {c.report_summary && <div style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>Opens: {c.report_summary.open_rate ? `${(c.report_summary.open_rate * 100).toFixed(1)}%` : '-'} · Clicks: {c.report_summary.click_rate ? `${(c.report_summary.click_rate * 100).toFixed(1)}%` : '-'} · Recipients: {c.recipients?.recipient_count}</div>}
      </div>)}
      {tab === 'lists' && lists.map(l => <div key={l.id} style={{ padding: '12px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{l.name}</span>
        <span style={{ color: '#ffe01b', fontWeight: 700, fontSize: 16 }}>{l.stats?.member_count?.toLocaleString()}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>subscribers</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_notion() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'pages'|'databases'>('pages');
  const [pages, setPages] = React.useState<any[]>([]);
  const [databases, setDatabases] = React.useState<any[]>([]);
  const [newTitle, setNewTitle] = React.useState('');
  const [parentId, setParentId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/notion/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [p, db] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/notion/pages`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/notion/databases`, { headers: h }).then(r => r.json()),
    ]);
    setPages(p.results || []); setDatabases(db.results || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/notion/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const createPage = async () => {
    if (!newTitle || !parentId) return;
    await fetch(`${BACKEND}/api/integrations/notion/create-page`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId, title: newTitle }) });
    setNewTitle(''); loadAll();
  };

  const getTitle = (p: any) => {
    const t = p.properties?.title?.title?.[0]?.plain_text || p.properties?.Name?.title?.[0]?.plain_text;
    return t || p.id;
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📓 Notion</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Notion to browse pages and databases.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Integration Token (secret_xxx)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#fff', color: '#111', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Notion'}</button>
    </div>
  );

  const tabs = [{ id: 'pages', label: '📄 Pages' }, { id: 'databases', label: '🗃️ Databases' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📓 Notion</h2>
        <span style={{ background: '#ffffff22', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/notion/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#fff' : '#1a1a1a', color: tab === t.id ? '#111' : '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={parentId} onChange={e => setParentId(e.target.value)} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 12, flex: 1 }}>
          <option value="">Parent page...</option>
          {pages.map(p => <option key={p.id} value={p.id}>{getTitle(p)}</option>)}
        </select>
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="New page title" style={{ flex: 2, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 12 }} />
        <button onClick={createPage} style={{ background: '#fff', color: '#111', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>+ Create</button>
      </div>
      {tab === 'pages' && pages.map(p => <div key={p.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: '#ddd', flex: 1 }}>📄 {getTitle(p)}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{p.last_edited_time ? new Date(p.last_edited_time).toLocaleDateString() : ''}</span>
        <a href={p.url} target="_blank" rel="noreferrer" style={{ color: '#aaa', fontSize: 11, textDecoration: 'none' }}>↗</a>
      </div>)}
      {tab === 'databases' && databases.map(db => <div key={db.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: '#ddd', flex: 1 }}>🗃️ {getTitle(db)}</span>
        <span style={{ color: '#555', fontSize: 11 }}>{Object.keys(db.properties || {}).length} props</span>
        <a href={db.url} target="_blank" rel="noreferrer" style={{ color: '#aaa', fontSize: 11, textDecoration: 'none' }}>↗</a>
      </div>)}
    </div>
  );
}

export function ForgeTab_linear() {
  const [connected, setConnected] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'issues'|'teams'>('issues');
  const [issues, setIssues] = React.useState<any[]>([]);
  const [teams, setTeams] = React.useState<any[]>([]);
  const [form, setForm] = React.useState({ teamId: '', title: '', description: '', priority: '0' });
  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/linear/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [i, t] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/linear/issues`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/linear/teams`, { headers: h }).then(r => r.json()),
    ]);
    setIssues(i.data?.issues?.nodes || []); setTeams(t.data?.teams?.nodes || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/linear/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const createIssue = async () => {
    if (!form.teamId || !form.title) return;
    await fetch(`${BACKEND}/api/integrations/linear/create-issue`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowForm(false); setForm(p => ({ ...p, title: '', description: '' })); loadAll();
  };

  const prioLabel = (p: number) => ['No Priority', 'Urgent', 'High', 'Medium', 'Low'][p] || '—';
  const prioColor = (p: number) => ['#555', '#f55', '#ff9500', '#4285f4', '#18d26e'][p] || '#555';

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📐 Linear</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Linear to browse issues, teams, and create tasks.</p>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key (lin_api_xxx)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Linear'}</button>
    </div>
  );

  const tabs = [{ id: 'issues', label: '🐛 Issues' }, { id: 'teams', label: '👥 Teams' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📐 Linear</h2>
        <span style={{ background: '#5e6ad222', color: '#5e6ad2', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => setShowForm(p => !p)} style={{ background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Issue</button>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/linear/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      {showForm && <div style={{ padding: 14, background: '#111', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={form.teamId} onChange={e => setForm(p => ({ ...p, teamId: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 12 }}>
          <option value="">Team...</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Issue title" style={{ flex: 2, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 12 }} />
        <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 12 }}>
          {['No Priority','Urgent','High','Medium','Low'].map((l,i) => <option key={i} value={String(i)}>{l}</option>)}
        </select>
        <button onClick={createIssue} style={{ background: '#5e6ad2', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Create</button>
      </div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#5e6ad2' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'issues' && issues.map(i => <div key={i.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: i.state?.color || '#888', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{i.title}</span>
          <span style={{ color: prioColor(i.priority), fontSize: 11 }}>{prioLabel(i.priority)}</span>
        </div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 4, paddingLeft: 16 }}>{i.team?.name} · {i.assignee?.name || 'Unassigned'} · {i.state?.name}</div>
      </div>)}
      {tab === 'teams' && teams.map(t => <div key={t.id} style={{ padding: '12px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: '#5e6ad2', fontSize: 12, background: '#5e6ad222', padding: '2px 8px', borderRadius: 4 }}>{t.key}</span>
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{t.name}</span>
        <span style={{ color: '#aaa', fontSize: 12 }}>{t.issueCount} issues</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_github() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'repos'|'issues'|'prs'>('repos');
  const [repos, setRepos] = React.useState<any[]>([]);
  const [issues, setIssues] = React.useState<any[]>([]);
  const [prs, setPrs] = React.useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/github/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadRepos(); }
    });
  }, []);

  const loadRepos = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/github/repos`, { headers: h }); const d = await r.json();
    setRepos(Array.isArray(d) ? d : []);
  };

  const selectRepo = async (repo: any) => {
    setSelectedRepo(repo);
    const [i, p] = await Promise.all([
      fetch(`/api/integrations/github/issues?owner=${repo.owner.login}&repo=${repo.name}`, { headers: h }).then(r => r.json()),
      fetch(`/api/integrations/github/prs?owner=${repo.owner.login}&repo=${repo.name}`, { headers: h }).then(r => r.json()),
    ]);
    setIssues(Array.isArray(i) ? i : []); setPrs(Array.isArray(p) ? p : []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/github/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadRepos(); } else setStatus(d.error || 'Failed');
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🐙 GitHub</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect GitHub to browse repos, issues, and pull requests.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token (ghp_xxx)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#238636', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect GitHub'}</button>
    </div>
  );

  const tabs = [{ id: 'repos', label: '📁 Repos' }, { id: 'issues', label: '🐛 Issues' }, { id: 'prs', label: '🔀 Pull Requests' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🐙 GitHub</h2>
        <span style={{ background: '#23863622', color: '#238636', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/github/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#238636' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'repos' && <div>{repos.map(r => <div key={r.id} onClick={() => { setSelectedRepo(r); selectRepo(r); setTab('issues'); }} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#4285f4', flex: 1 }}>{r.full_name}</span>
        {r.language && <span style={{ color: '#aaa', fontSize: 11 }}>{r.language}</span>}
        <span style={{ color: '#666', fontSize: 11 }}>⭐ {r.stargazers_count}</span>
        <span style={{ color: r.private ? '#ff9500' : '#18d26e', fontSize: 10 }}>● {r.private ? 'private' : 'public'}</span>
      </div>)}</div>}
      {tab === 'issues' && <div>
        {selectedRepo && <div style={{ marginBottom: 10, color: '#aaa', fontSize: 12 }}>Showing issues for <span style={{ color: '#4285f4' }}>{selectedRepo.full_name}</span> — or <button onClick={() => setTab('repos')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>pick a repo</button></div>}
        {issues.map(i => <div key={i.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#18d26e', fontWeight: 700, fontSize: 11 }}>#{i.number}</span>
            <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{i.title}</span>
            <a href={i.html_url} target="_blank" rel="noreferrer" style={{ color: '#aaa', fontSize: 11, textDecoration: 'none' }}>↗</a>
          </div>
          {i.labels?.length > 0 && <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>{i.labels.map((l: any) => <span key={l.id} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: `#${l.color}33`, color: `#${l.color}` }}>{l.name}</span>)}</div>}
        </div>)}
      </div>}
      {tab === 'prs' && <div>
        {selectedRepo && <div style={{ marginBottom: 10, color: '#aaa', fontSize: 12 }}>PRs for <span style={{ color: '#4285f4' }}>{selectedRepo.full_name}</span></div>}
        {prs.map(pr => <div key={pr.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#a371f7', fontWeight: 700, fontSize: 11 }}>#{pr.number}</span>
            <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{pr.title}</span>
            <span style={{ color: '#aaa', fontSize: 11 }}>{pr.user?.login}</span>
            <a href={pr.html_url} target="_blank" rel="noreferrer" style={{ color: '#aaa', fontSize: 11, textDecoration: 'none' }}>↗</a>
          </div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>{pr.head?.ref} → {pr.base?.ref} · +{pr.additions} -{pr.deletions}</div>
        </div>)}
      </div>}
    </div>
  );
}

export function ForgeTab_twilio() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ accountSid: '', authToken: '' });
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'messages'|'calls'|'numbers'>('messages');
  const [messages, setMessages] = React.useState<any[]>([]);
  const [calls, setCalls] = React.useState<any[]>([]);
  const [numbers, setNumbers] = React.useState<any[]>([]);
  const [sms, setSms] = React.useState({ to: '', from: '', body: '' });
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/twilio/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [m, c, n] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/twilio/messages`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/twilio/calls`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/twilio/numbers`, { headers: h }).then(r => r.json()),
    ]);
    setMessages(m.messages || []); setCalls(c.calls || []); setNumbers(n.incoming_phone_numbers || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/twilio/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const sendSms = async () => {
    if (!sms.to || !sms.from || !sms.body) return;
    setSending(true);
    await fetch(`${BACKEND}/api/integrations/twilio/send`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(sms) });
    setSending(false); setSms(p => ({ ...p, body: '' })); loadAll();
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📱 Twilio</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Twilio to send SMS, view messages and call logs.</p>
      <input value={form.accountSid} onChange={e => setForm(p => ({ ...p, accountSid: e.target.value }))} placeholder="Account SID (ACxxx...)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.authToken} onChange={e => setForm(p => ({ ...p, authToken: e.target.value }))} placeholder="Auth Token" type="password" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#f22f46', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Twilio'}</button>
    </div>
  );

  const tabs = [{ id: 'messages', label: '💬 Messages' }, { id: 'calls', label: '📞 Calls' }, { id: 'numbers', label: '🔢 Numbers' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📱 Twilio</h2>
        <span style={{ background: '#f22f4622', color: '#f22f46', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/twilio/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      {numbers.length > 0 && <div style={{ marginBottom: 16, padding: 12, background: '#111', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12 }}>SEND SMS</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={sms.from} onChange={e => setSms(p => ({ ...p, from: e.target.value }))} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 13 }}>
            <option value="">From...</option>
            {numbers.map(n => <option key={n.sid} value={n.phone_number}>{n.phone_number}</option>)}
          </select>
          <input value={sms.to} onChange={e => setSms(p => ({ ...p, to: e.target.value }))} placeholder="To (+1...)" style={{ width: 130, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 13 }} />
          <input value={sms.body} onChange={e => setSms(p => ({ ...p, body: e.target.value }))} placeholder="Message..." style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#0a0a0a', color: '#ddd', fontSize: 13 }} />
          <button onClick={sendSms} disabled={sending} style={{ background: '#f22f46', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Send</button>
        </div>
      </div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#f22f46' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'messages' && messages.map(m => <div key={m.sid} style={{ padding: '10px 12px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 8, color: '#aaa', fontSize: 11, marginBottom: 4 }}><span>{m.from}</span><span>→</span><span>{m.to}</span><span style={{ marginLeft: 'auto' }}>{new Date(m.date_created).toLocaleDateString()}</span></div>
        <div style={{ color: '#ddd' }}>{m.body}</div>
      </div>)}
      {tab === 'calls' && calls.map(c => <div key={c.sid} style={{ padding: '10px 12px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ color: c.status === 'completed' ? '#18d26e' : '#888' }}>●</span>
        <span style={{ color: '#ddd' }}>{c.from} → {c.to}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{c.duration}s</span>
        <span style={{ color: '#666', fontSize: 11, marginLeft: 'auto' }}>{new Date(c.start_time).toLocaleDateString()}</span>
      </div>)}
      {tab === 'numbers' && numbers.map(n => <div key={n.sid} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: '#f22f46', fontSize: 15 }}>{n.phone_number}</span>
        <span style={{ color: '#aaa', fontSize: 12 }}>{n.friendly_name}</span>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto' }}>{n.capabilities?.sms ? '💬' : ''} {n.capabilities?.voice ? '📞' : ''}</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_sendgrid() {
  const [connected, setConnected] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'stats'|'send'|'templates'|'contacts'>('stats');
  const [stats, setStats] = React.useState<any[]>([]);
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [contacts, setContacts] = React.useState<any>(null);
  const [email, setEmail] = React.useState({ to: '', from: '', subject: '', html: '' });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [sendUnconfirmed, setSendUnconfirmed] = React.useState(false);
  const sendInFlight = React.useRef(false);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/sendgrid/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadStats(); }
    });
  }, []);

  const loadStats = async () => {
    const [s, t, c] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/sendgrid/stats`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/sendgrid/templates`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/sendgrid/contacts`, { headers: h }).then(r => r.json()),
    ]);
    setStats(Array.isArray(s) ? s : []); setTemplates(t.result || t.templates || []); setContacts(c);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/sendgrid/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadStats(); } else setStatus(d.error || 'Failed');
  };

  const sendEmail = async () => {
    if (sendInFlight.current || sendUnconfirmed || !email.to || !email.from || !email.subject) return;
    sendInFlight.current = true;
    setSending(true); setSent(false); setStatus('');
    try {
      const r = await fetch(`${BACKEND}/api/integrations/sendgrid/send`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(email) });
      const result = await r.json().catch(() => null);
      if (!r.ok || result?.accepted !== true) {
        const rejected = result?.code === 'SENDGRID_SEND_REJECTED' || result?.code === 'SENDGRID_INPUT_INVALID';
        setSendUnconfirmed(!rejected);
        setStatus(rejected ? result.error : 'Send result is unconfirmed. Check SendGrid before sending again.');
        return;
      }
      setSent(true); setStatus('Email service accepted the message. Delivery is not yet confirmed.');
    } catch {
      setSendUnconfirmed(true); setStatus('Send result is unconfirmed. Check SendGrid before sending again.');
    } finally { sendInFlight.current = false; setSending(false); }
  };

  // compute 30d totals
  const totals = stats.reduce((acc, day) => {
    const s = day.stats?.[0]?.metrics || {};
    return { delivered: acc.delivered + (s.delivered || 0), opens: acc.opens + (s.opens || 0), clicks: acc.clicks + (s.clicks || 0), bounces: acc.bounces + (s.bounces || 0) };
  }, { delivered: 0, opens: 0, clicks: 0, bounces: 0 });

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>✉️ SendGrid</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect SendGrid to send emails, view stats, and manage templates.</p>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key (SG.xxx...)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#1a82e2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect SendGrid'}</button>
    </div>
  );

  const tabs = [{ id: 'stats', label: '📊 Stats' }, { id: 'send', label: '✉️ Send' }, { id: 'templates', label: '📋 Templates' }, { id: 'contacts', label: '👤 Contacts' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>✉️ SendGrid</h2>
        <span style={{ background: '#1a82e222', color: '#1a82e2', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/sendgrid/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#1a82e2' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'stats' && <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[['Delivered', totals.delivered, '#18d26e'], ['Opens', totals.opens, '#4285f4'], ['Clicks', totals.clicks, '#ff9500'], ['Bounces', totals.bounces, '#f55']].map(([l, v, c]) => (
            <div key={l as string} style={{ background: '#111', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>{l} (30d)</div>
              <div style={{ color: c as string, fontSize: 22, fontWeight: 700 }}>{Number(v).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>}
      {tab === 'send' && <div style={{ maxWidth: 480 }}>
        {['to','from','subject'].map(k => <input key={k} value={(email as any)[k]} onChange={e => setEmail(p => ({ ...p, [k]: e.target.value }))} placeholder={k.charAt(0).toUpperCase() + k.slice(1)} style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box', fontSize: 13 }} />)}
        <textarea value={email.html} onChange={e => setEmail(p => ({ ...p, html: e.target.value }))} placeholder="HTML body..." rows={6} style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 10, boxSizing: 'border-box', fontSize: 13, resize: 'vertical' }} />
        {status && <p role="status" style={{ color: sent ? '#7cbd87' : '#f8a68e' }}>{status}</p>}
        <button onClick={sendEmail} disabled={sending || sendUnconfirmed} style={{ background: '#1a82e2', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 20px', cursor: 'pointer', fontWeight: 700 }}>{sent ? '✓ Accepted' : sending ? 'Submitting...' : 'Send Email'}</button>
      </div>}
      {tab === 'templates' && <div>{templates.map(t => <div key={t.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 600, color: '#ddd', fontSize: 13 }}>{t.name}</span>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto' }}>v{t.versions?.length || 0} version{t.versions?.length !== 1 ? 's' : ''}</span>
      </div>)}</div>}
      {tab === 'contacts' && contacts && <div style={{ padding: '14px 16px', background: '#111', borderRadius: 8 }}>
        <div style={{ color: '#aaa', fontSize: 13 }}>Total contacts: <span style={{ color: '#1a82e2', fontWeight: 700, fontSize: 18 }}>{(contacts.contact_count || 0).toLocaleString()}</span></div>
      </div>}
    </div>
  );
}

export function ForgeTab_shopify() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ shop: '', accessToken: '' });
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'overview'|'orders'|'products'|'customers'>('overview');
  const [overview, setOverview] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/shopify/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadAll(); }
    });
  }, []);

  const loadAll = async () => {
    const [o, ord, p, c] = await Promise.all([
      fetch(`${BACKEND}/api/integrations/shopify/overview`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/shopify/orders`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/shopify/products`, { headers: h }).then(r => r.json()),
      fetch(`${BACKEND}/api/integrations/shopify/customers`, { headers: h }).then(r => r.json()),
    ]);
    setOverview(o); setOrders(ord.orders || []); setProducts(p.products || []); setCustomers(c.customers || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/shopify/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadAll(); } else setStatus(d.error || 'Failed');
  };

  const statusBadge = (s: string) => ({ paid: '#18d26e', pending: '#ff9500', refunded: '#f55', voided: '#888' }[s] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🛍️ Shopify</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect your Shopify store to browse orders, products, and customers.</p>
      <input value={form.shop} onChange={e => setForm(p => ({ ...p, shop: e.target.value }))} placeholder="Store domain (mystore.myshopify.com)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={form.accessToken} onChange={e => setForm(p => ({ ...p, accessToken: e.target.value }))} placeholder="Admin API access token (shpat_xxx)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#96bf48', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Shopify'}</button>
    </div>
  );

  const tabs = [{ id: 'overview', label: '📊 Overview' }, { id: 'orders', label: '📦 Orders' }, { id: 'products', label: '🏷️ Products' }, { id: 'customers', label: '👤 Customers' }] as const;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🛍️ Shopify</h2>
        <span style={{ background: '#96bf4822', color: '#96bf48', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/shopify/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: tab === t.id ? '#96bf48' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{t.label}</button>)}
      </div>
      {tab === 'overview' && overview && <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          {[['Products', overview.productCount, '#96bf48'], ['Customers', overview.customerCount, '#4285f4'], ['Recent Orders', overview.recentOrders?.length, '#ff9500']].map(([l, v, c]) => (
            <div key={l as string} style={{ background: '#111', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ color: '#888', fontSize: 12 }}>{l}</div>
              <div style={{ color: c as string, fontSize: 26, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontWeight: 600, color: '#aaa', fontSize: 12, marginBottom: 8, textTransform: 'uppercase' }}>Recent Orders</div>
        {(overview.recentOrders || []).slice(0, 5).map((o: any) => <div key={o.id} style={{ padding: '8px 12px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: '#ddd' }}>{o.name}</span>
          <span style={{ color: '#96bf48', fontWeight: 700 }}>${Number(o.total_price).toFixed(2)}</span>
          <span style={{ color: statusBadge(o.financial_status), fontSize: 11 }}>● {o.financial_status}</span>
          <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto' }}>{o.customer?.first_name} {o.customer?.last_name}</span>
        </div>)}
      </div>}
      {tab === 'orders' && orders.map(o => <div key={o.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 700, color: '#ddd' }}>{o.name}</span>
        <span style={{ color: '#96bf48', fontWeight: 700 }}>${Number(o.total_price).toFixed(2)}</span>
        <span style={{ color: statusBadge(o.financial_status), fontSize: 11 }}>● {o.financial_status}</span>
        <span style={{ color: '#666', fontSize: 11 }}>{o.fulfillment_status || 'unfulfilled'}</span>
        <span style={{ color: '#555', fontSize: 11, marginLeft: 'auto' }}>{new Date(utcStamp(o.created_at)).toLocaleDateString()}</span>
      </div>)}
      {tab === 'products' && products.map(p => <div key={p.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        {p.image?.src && <img src={p.image.src} style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} />}
        <span style={{ fontWeight: 600, color: '#ddd', flex: 1 }}>{p.title}</span>
        <span style={{ color: '#aaa', fontSize: 11 }}>{p.variants?.length} variant{p.variants?.length !== 1 ? 's' : ''}</span>
        <span style={{ color: p.status === 'active' ? '#18d26e' : '#888', fontSize: 11 }}>● {p.status}</span>
      </div>)}
      {tab === 'customers' && customers.map(c => <div key={c.id} style={{ padding: '10px 14px', background: '#111', borderRadius: 6, marginBottom: 4, display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: '#ddd' }}>{c.first_name} {c.last_name}</span>
        <span style={{ color: '#aaa', fontSize: 12 }}>{c.email}</span>
        <span style={{ color: '#96bf48', fontSize: 12, marginLeft: 'auto' }}>${Number(c.total_spent).toFixed(2)} · {c.orders_count} orders</span>
      </div>)}
    </div>
  );
}

export function ForgeTab_webflow() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sites, setSites] = React.useState<any[]>([]);
  const [selectedSite, setSelectedSite] = React.useState<any>(null);
  const [collections, setCollections] = React.useState<any[]>([]);
  const [selectedCol, setSelectedCol] = React.useState<any>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [publishing, setPublishing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const h = { Authorization: `Bearer ${localStorage.getItem('forge_token')}` };

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/webflow/status`, { headers: h }).then(r => r.json()).then(d => {
      if (d.connected) { setConnected(true); loadSites(); }
    });
  }, []);

  const loadSites = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/webflow/sites`, { headers: h }); const d = await r.json();
    setSites(d.sites || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/webflow/connect`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json(); setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadSites(); } else setStatus(d.error || 'Failed');
  };

  const loadCollections = async (site: any) => {
    setSelectedSite(site); setCollections([]); setItems([]);
    const r = await fetch(`/api/integrations/webflow/collections/${site.id}`, { headers: h }); const d = await r.json();
    setCollections(d.collections || []);
  };

  const loadItems = async (col: any) => {
    setSelectedCol(col);
    const r = await fetch(`/api/integrations/webflow/items/${col.id}`, { headers: h }); const d = await r.json();
    setItems(d.items || []);
  };

  const publish = async () => {
    if (!selectedSite) return;
    setPublishing(true);
    await fetch(`/api/integrations/webflow/publish/${selectedSite.id}`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ domains: selectedSite.customDomains?.map((d: any) => d.url) || [] }) });
    setPublishing(false);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🌐 Webflow</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Webflow to browse sites, collections, and publish content.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="API Token (from Webflow → Account → Integrations)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#4353ff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Webflow'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🌐 Webflow</h2>
        <span style={{ background: '#4353ff22', color: '#4353ff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={() => { fetch(`${BACKEND}/api/integrations/webflow/disconnect`, { method: 'DELETE', headers: h }); setConnected(false); }} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Sites</div>
          {sites.map(s => <div key={s.id} onClick={() => loadCollections(s)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedSite?.id === s.id ? '#4353ff22' : 'transparent', color: selectedSite?.id === s.id ? '#4353ff' : '#ddd', marginBottom: 4, fontSize: 13 }}>
            🌐 {s.displayName || s.name}
          </div>)}
        </div>
        {collections.length > 0 && <div style={{ width: 170, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Collections</div>
          {collections.map(c => <div key={c.id} onClick={() => loadItems(c)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedCol?.id === c.id ? '#4353ff22' : 'transparent', color: selectedCol?.id === c.id ? '#4353ff' : '#ddd', marginBottom: 4, fontSize: 13 }}>{c.displayName || c.name}</div>)}
        </div>}
        {selectedSite && <div style={{ flex: 1 }}>
          {selectedCol && <div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Items ({items.length})</div>
            {items.map(item => <div key={item.id} style={{ padding: '8px 12px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13, color: '#ddd', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1 }}>{item.fieldData?.name || item.fieldData?.title || item.id}</span>
              <span style={{ color: item.isDraft ? '#888' : '#18d26e', fontSize: 11 }}>● {item.isDraft ? 'draft' : 'published'}</span>
            </div>)}
          </div>}
          <button onClick={publish} disabled={publishing} style={{ marginTop: 16, background: '#4353ff', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 700 }}>{publishing ? 'Publishing...' : '🚀 Publish Site'}</button>
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_gsheets() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [files, setFiles] = React.useState<any[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<any>(null);
  const [sheets, setSheets] = React.useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState('');
  const [rows, setRows] = React.useState<any[][]>([]);
  const [newRow, setNewRow] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/gsheets/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); loadFiles(); } });
  }, []);

  const loadFiles = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/gsheets/files`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setFiles(d.files || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/gsheets/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadFiles(); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/gsheets/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setFiles([]); setSheets([]); setRows([]);
  };

  const loadSheets = async (file: any) => {
    setSelectedFile(file); setSheets([]); setRows([]);
    const r = await fetch(`/api/integrations/gsheets/sheets/${file.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setSheets((d.sheets || []).map((s: any) => s.properties));
  };

  const loadData = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    const r = await fetch(`/api/integrations/gsheets/data/${selectedFile.id}/${encodeURIComponent(sheetName + '!A1:Z100')}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setRows(d.values || []);
  };

  const appendRow = async () => {
    if (!newRow || !selectedFile || !selectedSheet) return;
    const values = [newRow.split(',').map(v => v.trim())];
    await fetch(`/api/integrations/gsheets/append/${selectedFile.id}/${encodeURIComponent(selectedSheet + '!A1')}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values }) });
    setNewRow('');
    loadData(selectedSheet);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 520 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📊 Google Sheets</h2>
      <p style={{ color: '#aaa', marginBottom: 16 }}>Paste a Google OAuth access token. Get one at <a href="https://developers.google.com/oauthplayground" target="_blank" style={{ color: '#4285f4' }}>OAuth Playground</a> with scope <code style={{ background: '#222', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly</code>.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="ya29.xxxxx (OAuth access token)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#4285f4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Google Sheets'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📊 Google Sheets</h2>
        <span style={{ background: '#4285f422', color: '#4285f4', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Spreadsheets</div>
          {files.map(f => <div key={f.id} onClick={() => loadSheets(f)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedFile?.id === f.id ? '#4285f422' : 'transparent', color: selectedFile?.id === f.id ? '#4285f4' : '#ddd', marginBottom: 4, fontSize: 13 }}>{f.name}</div>)}
        </div>
        {sheets.length > 0 && <div style={{ width: 140, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Sheets</div>
          {sheets.map(s => <div key={s.sheetId} onClick={() => loadData(s.title)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedSheet === s.title ? '#4285f422' : 'transparent', color: selectedSheet === s.title ? '#4285f4' : '#ddd', marginBottom: 4, fontSize: 13 }}>{s.title}</div>)}
        </div>}
        {rows.length > 0 && <div style={{ flex: 1, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input value={newRow} onChange={e => setNewRow(e.target.value)} placeholder="Append row (comma-separated values)" style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
            <button onClick={appendRow} style={{ background: '#4285f4', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Append</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr>{(rows[0] || []).map((h, i) => <th key={i} style={{ padding: '6px 10px', background: '#1a1a1a', textAlign: 'left', color: '#aaa', fontWeight: 600, border: '1px solid #222', maxWidth: 150 }}>{h}</th>)}</tr></thead>
            <tbody>{rows.slice(1).map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: '5px 10px', border: '1px solid #1a1a1a', color: '#ddd', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_figma() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [teamId, setTeamId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProj, setSelectedProj] = React.useState('');
  const [files, setFiles] = React.useState<any[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<any>(null);
  const [fileData, setFileData] = React.useState<any>(null);
  const [comments, setComments] = React.useState<any[]>([]);
  const [view, setView] = React.useState<'structure'|'comments'>('structure');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/figma/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) setConnected(true); });
  }, []);

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/figma/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/figma/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setProjects([]); setFiles([]);
  };

  const loadProjects = async () => {
    if (!teamId) return;
    const r = await fetch(`/api/integrations/figma/projects/${teamId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setProjects(d.projects || []);
  };

  const loadFiles = async (projId: string) => {
    setSelectedProj(projId);
    const r = await fetch(`/api/integrations/figma/files/${projId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setFiles(d.files || []);
  };

  const loadFile = async (file: any) => {
    setSelectedFile(file); setFileData(null); setComments([]);
    const [fd, cd] = await Promise.all([
      fetch(`/api/integrations/figma/file/${file.key}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } }).then(r => r.json()),
      fetch(`/api/integrations/figma/comments/${file.key}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } }).then(r => r.json()),
    ]);
    setFileData(fd); setComments(cd.comments || []);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🎨 Figma</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Figma with a Personal Access Token to browse projects and files.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#a259ff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Figma'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎨 Figma</h2>
        <span style={{ background: '#a259ff22', color: '#a259ff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      {!projects.length && <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={teamId} onChange={e => setTeamId(e.target.value)} placeholder="Team ID (from figma.com/files/team/XXXXXXX)" style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
        <button onClick={loadProjects} style={{ background: '#a259ff', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }}>Load Projects</button>
      </div>}
      <div style={{ display: 'flex', gap: 16 }}>
        {projects.length > 0 && <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Projects</div>
          {projects.map(p => <div key={p.id} onClick={() => loadFiles(p.id)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedProj === p.id ? '#a259ff22' : 'transparent', color: selectedProj === p.id ? '#a259ff' : '#ddd', marginBottom: 4, fontSize: 13 }}>{p.name}</div>)}
        </div>}
        {files.length > 0 && <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Files</div>
          {files.map(f => <div key={f.key} onClick={() => loadFile(f)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedFile?.key === f.key ? '#a259ff22' : 'transparent', color: selectedFile?.key === f.key ? '#a259ff' : '#ddd', marginBottom: 4, fontSize: 13 }}>{f.name}</div>)}
        </div>}
        {selectedFile && fileData && <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['structure','comments'] as const).map(v => <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: view === v ? '#a259ff' : '#1a1a1a', color: view === v ? '#fff' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{v === 'structure' ? '🗂 Structure' : `💬 Comments (${comments.length})`}</button>)}
            <a href={`https://www.figma.com/file/${selectedFile.key}`} target="_blank" style={{ marginLeft: 'auto', color: '#a259ff', fontSize: 12, textDecoration: 'none' }}>Open in Figma →</a>
          </div>
          {view === 'structure' && <div>
            {(fileData.document?.children || []).map((page: any) => <div key={page.id} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#ddd', marginBottom: 6 }}>📄 {page.name}</div>
              {(page.children || []).slice(0, 8).map((frame: any) => <div key={frame.id} style={{ padding: '6px 10px', background: '#111', borderRadius: 5, marginBottom: 3, fontSize: 12, color: '#bbb' }}>▸ {frame.name} <span style={{ color: '#555' }}>({frame.type})</span></div>)}
            </div>)}
          </div>}
          {view === 'comments' && <div>{comments.map(c => <div key={c.id} style={{ padding: '10px 12px', background: '#111', borderRadius: 6, marginBottom: 6 }}>
            <div style={{ fontWeight: 600, color: '#a259ff', fontSize: 12 }}>{c.user?.handle}</div>
            <div style={{ color: '#ddd', fontSize: 13, marginTop: 2 }}>{c.message}</div>
            <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>{new Date(utcStamp(c.created_at)).toLocaleDateString()}</div>
          </div>)}</div>}
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_zendesk() {
  const [connected, setConnected] = React.useState(false);
  const [form, setForm] = React.useState({ subdomain: '', email: '', apiToken: '' });
  const [status, setStatus] = React.useState('');
  const [subdomain, setSubdomain] = React.useState('');
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [ticketStatus, setTicketStatus] = React.useState('open');
  const [selected, setSelected] = React.useState<any>(null);
  const [reply, setReply] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [aiDraft, setAiDraft] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/zendesk/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); setSubdomain(d.subdomain || ''); loadTickets('open'); } });
  }, []);

  const loadTickets = async (s: string) => {
    setTicketStatus(s);
    const r = await fetch(`/api/integrations/zendesk/tickets?status=${s}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setTickets(d.tickets || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/zendesk/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setSubdomain(form.subdomain); setStatus(''); loadTickets('open'); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/zendesk/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setTickets([]);
  };

  const sendReply = async () => {
    if (!reply || !selected) return;
    setSending(true);
    await fetch(`/api/integrations/zendesk/reply/${selected.id}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ body: reply, status: 'open' }) });
    setSending(false); setReply(''); loadTickets(ticketStatus);
  };

  const draftAI = async () => {
    if (!selected) return;
    setAiDraft('Drafting...');
    try {
      const r = await fetch(`${BACKEND}/api/chat`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: `Draft a professional, empathetic support reply to this Zendesk ticket:\nSubject: ${selected.subject}\nStatus: ${selected.status}\nPriority: ${selected.priority}\n\nWrite a complete reply in 3-4 sentences.` }] }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setAiDraft(d?.message || d?.error || `Draft failed (HTTP ${r.status})`); return; }
      const text = d?.data?.response || d?.choices?.[0]?.message?.content || '';
      if (!text) { setAiDraft('The model returned nothing. Try again.'); return; }
      setAiDraft(text);
      setReply(text);
    } catch {
      setAiDraft('Draft failed. Check your connection and try again.');
    }
  };

  const priorityColor = (p: string) => ({ urgent: '#f55', high: '#f90', normal: '#18d26e', low: '#888' }[p] || '#888');

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🎫 Zendesk</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Zendesk Support to manage tickets with AI-assisted replies.</p>
      {(['subdomain','email','apiToken'] as const).map(k => <input key={k} value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={k === 'subdomain' ? 'Subdomain (yourco)' : k === 'email' ? 'Email' : 'API Token'} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />)}
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#03363d', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Zendesk'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎫 Zendesk</h2>
        <span style={{ background: '#03363d44', color: '#1db954', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected · {subdomain}</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['open','pending','solved','closed'].map(s => <button key={s} onClick={() => loadTickets(s)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: ticketStatus === s ? '#03363d' : '#1a1a1a', color: ticketStatus === s ? '#1db954' : '#aaa', cursor: 'pointer', fontSize: 12 }}>{s}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 230px)' }}>
        <div style={{ width: 280, overflowY: 'auto', flexShrink: 0 }}>
          {tickets.map(t => <div key={t.id} onClick={() => setSelected(t)} style={{ padding: '10px 12px', borderRadius: 6, cursor: 'pointer', background: selected?.id === t.id ? '#03363d33' : '#111', marginBottom: 4, border: selected?.id === t.id ? '1px solid #1db954' : '1px solid transparent' }}>
            <div style={{ fontWeight: 600, color: '#ddd', fontSize: 13, marginBottom: 2 }}>#{t.id} {t.subject?.slice(0, 40)}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ color: priorityColor(t.priority), fontSize: 11 }}>● {t.priority || 'normal'}</span>
              <span style={{ color: '#666', fontSize: 11 }}>{new Date(utcStamp(t.created_at)).toLocaleDateString()}</span>
            </div>
          </div>)}
        </div>
        {selected && <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 8 }}>#{selected.id} — {selected.subject}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ color: priorityColor(selected.priority), fontSize: 12 }}>Priority: {selected.priority}</span>
            <span style={{ color: '#aaa', fontSize: 12 }}>Status: {selected.status}</span>
            <a href={`https://${subdomain}.zendesk.com/agent/tickets/${selected.id}`} target="_blank" style={{ color: '#1db954', fontSize: 12, marginLeft: 'auto', textDecoration: 'none' }}>Open in Zendesk →</a>
          </div>
          <div style={{ background: '#111', borderRadius: 8, padding: 14, marginBottom: 12, flex: 1, overflowY: 'auto', color: '#ccc', fontSize: 13 }}>{selected.description}</div>
          <button onClick={draftAI} style={{ alignSelf: 'flex-start', background: '#18d26e22', color: '#18d26e', border: '1px solid #18d26e44', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, marginBottom: 8 }}>✨ AI Draft Reply</button>
          <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Write reply..." rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
          <button onClick={sendReply} disabled={sending} style={{ alignSelf: 'flex-end', background: '#03363d', color: '#1db954', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>{sending ? 'Sending...' : 'Send Reply'}</button>
        </div>}
      </div>
    </div>
  );
}
