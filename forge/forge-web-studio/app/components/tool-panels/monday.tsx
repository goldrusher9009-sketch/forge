'use client';
import React from 'react';
import { AuthenticatedEventSource } from '../../../lib/authenticated-event-source';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';
import { utcStamp } from '../../../lib/platform-time';

export function ForgeTab_monday() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [boards, setBoards] = React.useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = React.useState<any>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [newItem, setNewItem] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/monday/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); loadBoards(); } });
  }, []);

  const loadBoards = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/monday/boards`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setBoards(d.data?.boards || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/monday/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadBoards(); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/monday/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setBoards([]); setItems([]);
  };

  const loadItems = async (board: any) => {
    setSelectedBoard(board); setItems([]);
    const r = await fetch(`/api/integrations/monday/items/${board.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    const b = d.data?.boards?.[0];
    setItems(b?.items_page?.items || []);
  };

  const addItem = async () => {
    if (!newItem || !selectedBoard) return;
    await fetch(`${BACKEND}/api/integrations/monday/item`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ boardId: selectedBoard.id, itemName: newItem }) });
    setNewItem('');
    loadItems(selectedBoard);
  };

  const stateColor = (s: string) => s === 'active' ? '#18d26e' : s === 'done' ? '#4285f4' : '#888';

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📅 Monday.com</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Monday.com to browse boards and manage work items.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="API Token (from monday.com → Profile → API)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#ff3d57', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Monday.com'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📅 Monday.com</h2>
        <span style={{ background: '#ff3d5722', color: '#ff3d57', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Boards</div>
          {boards.map(b => <div key={b.id} onClick={() => loadItems(b)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedBoard?.id === b.id ? '#ff3d5722' : 'transparent', color: selectedBoard?.id === b.id ? '#ff3d57' : '#ddd', marginBottom: 4, fontSize: 13 }}>{b.name}</div>)}
        </div>
        {selectedBoard && <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="New item name..." style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
            <button onClick={addItem} style={{ background: '#ff3d57', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Add</button>
          </div>
          {items.map(item => <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111', borderRadius: 6, marginBottom: 4 }}>
            <span style={{ color: stateColor(item.state), fontSize: 11 }}>●</span>
            <span style={{ color: '#ddd', fontSize: 13, flex: 1 }}>{item.name}</span>
            <span style={{ color: '#555', fontSize: 11 }}>{item.state}</span>
          </div>)}
          {items.length === 0 && <div style={{ color: '#666', fontSize: 13 }}>No items. Add one above.</div>}
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_airtable() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [bases, setBases] = React.useState<any[]>([]);
  const [selectedBase, setSelectedBase] = React.useState('');
  const [tables, setTables] = React.useState<any[]>([]);
  const [selectedTable, setSelectedTable] = React.useState('');
  const [records, setRecords] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/airtable/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); loadBases(); } });
  }, []);

  const loadBases = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/airtable/bases`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setBases(d.bases || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/airtable/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadBases(); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/airtable/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setBases([]); setTables([]); setRecords([]);
  };

  const loadTables = async (baseId: string) => {
    setSelectedBase(baseId); setTables([]); setRecords([]);
    const r = await fetch(`/api/integrations/airtable/tables/${baseId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setTables(d.tables || []);
  };

  const loadRecords = async (tableId: string) => {
    setSelectedTable(tableId); setRecords([]);
    const r = await fetch(`/api/integrations/airtable/records/${selectedBase}/${tableId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setRecords(d.records || []);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🗃️ Airtable</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect your Airtable workspace to browse bases, tables, and records.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token (patXXX...)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#18d26e', color: '#000', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Airtable'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🗃️ Airtable</h2>
        <span style={{ background: '#18d26e22', color: '#18d26e', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Bases</div>
          {bases.map(b => <div key={b.id} onClick={() => loadTables(b.id)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedBase === b.id ? '#18d26e22' : 'transparent', color: selectedBase === b.id ? '#18d26e' : '#ddd', marginBottom: 4 }}>{b.name}</div>)}
        </div>
        {tables.length > 0 && <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Tables</div>
          {tables.map(t => <div key={t.id} onClick={() => loadRecords(t.id)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedTable === t.id ? '#18d26e22' : 'transparent', color: selectedTable === t.id ? '#18d26e' : '#ddd', marginBottom: 4 }}>{t.name}</div>)}
        </div>}
        {records.length > 0 && <div style={{ flex: 1, overflowX: 'auto' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Records ({records.length})</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{Object.keys(records[0]?.fields || {}).slice(0, 6).map(k => <th key={k} style={{ padding: '6px 10px', background: '#1a1a1a', textAlign: 'left', color: '#aaa', fontWeight: 600, border: '1px solid #222' }}>{k}</th>)}</tr></thead>
            <tbody>{records.map(r => <tr key={r.id}>{Object.values(r.fields || {}).slice(0, 6).map((v: any, i) => <td key={i} style={{ padding: '6px 10px', border: '1px solid #1a1a1a', color: '#ddd', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v ?? '')}</td>)}</tr>)}</tbody>
          </table>
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_hubspot() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [tab, setTab] = React.useState<'contacts'|'deals'|'companies'>('contacts');
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/hubspot/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); loadTab('contacts'); } });
  }, []);

  const loadTab = async (t: 'contacts'|'deals'|'companies') => {
    setTab(t); setLoading(true);
    const r = await fetch(`/api/integrations/hubspot/${t}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setData(d.results || []);
    setLoading(false);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/hubspot/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadTab('contacts'); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/hubspot/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setData([]);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🧲 HubSpot</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect your HubSpot CRM to view contacts, deals, and companies.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Private App Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#ff7a59', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect HubSpot'}</button>
    </div>
  );

  const tabs = [{ id: 'contacts', label: '👤 Contacts' }, { id: 'deals', label: '💼 Deals' }, { id: 'companies', label: '🏢 Companies' }] as const;

  const renderRow = (item: any) => {
    const p = item.properties || {};
    if (tab === 'contacts') return <>{p.firstname} {p.lastname} — {p.email || '—'}</>;
    if (tab === 'deals') return <>{p.dealname} — ${Number(p.amount||0).toLocaleString()} · {p.dealstage}</>;
    return <>{p.name} — {p.domain || '—'} · {p.industry || '—'}</>;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🧲 HubSpot</h2>
        <span style={{ background: '#ff7a5922', color: '#ff7a59', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => <button key={t.id} onClick={() => loadTab(t.id)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: tab === t.id ? '#ff7a59' : '#1a1a1a', color: tab === t.id ? '#fff' : '#aaa', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</button>)}
      </div>
      {loading ? <div style={{ color: '#aaa' }}>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((item, i) => <div key={i} style={{ padding: '10px 14px', background: '#111', borderRadius: 8, color: '#ddd', fontSize: 14 }}>{renderRow(item)}</div>)}
          {data.length === 0 && <div style={{ color: '#666' }}>No {tab} found.</div>}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_asana() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [workspaces, setWorkspaces] = React.useState<any[]>([]);
  const [selectedWs, setSelectedWs] = React.useState('');
  const [projects, setProjects] = React.useState<any[]>([]);
  const [selectedProj, setSelectedProj] = React.useState('');
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [newTask, setNewTask] = React.useState({ name: '', notes: '', due_on: '' });
  const [creating, setCreating] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/asana/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); loadWorkspaces(); } });
  }, []);

  const loadWorkspaces = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/asana/workspaces`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setWorkspaces(d.data || []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/asana/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadWorkspaces(); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/asana/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setWorkspaces([]); setProjects([]); setTasks([]);
  };

  const loadProjects = async (wsId: string) => {
    setSelectedWs(wsId); setProjects([]); setTasks([]);
    const r = await fetch(`/api/integrations/asana/projects/${wsId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setProjects(d.data || []);
  };

  const loadTasks = async (projId: string) => {
    setSelectedProj(projId); setTasks([]);
    const r = await fetch(`/api/integrations/asana/tasks/${projId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setTasks(d.data || []);
  };

  const createTask = async () => {
    if (!newTask.name || !selectedProj) return;
    setCreating(true);
    await fetch(`${BACKEND}/api/integrations/asana/tasks`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTask, projectId: selectedProj }) });
    setCreating(false);
    setNewTask({ name: '', notes: '', due_on: '' });
    loadTasks(selectedProj);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📋 Asana</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Asana to browse workspaces, projects, and tasks.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Personal Access Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#f06a6a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Asana'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📋 Asana</h2>
        <span style={{ background: '#f06a6a22', color: '#f06a6a', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Workspaces</div>
          {workspaces.map(w => <div key={w.gid} onClick={() => loadProjects(w.gid)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedWs === w.gid ? '#f06a6a22' : 'transparent', color: selectedWs === w.gid ? '#f06a6a' : '#ddd', marginBottom: 4, fontSize: 13 }}>{w.name}</div>)}
        </div>
        {projects.length > 0 && <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Projects</div>
          {projects.map(p => <div key={p.gid} onClick={() => loadTasks(p.gid)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedProj === p.gid ? '#f06a6a22' : 'transparent', color: selectedProj === p.gid ? '#f06a6a' : '#ddd', marginBottom: 4, fontSize: 13 }}>{p.name}</div>)}
        </div>}
        {selectedProj && <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Tasks</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} placeholder="New task name" style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
            <input type="date" value={newTask.due_on} onChange={e => setNewTask(p => ({ ...p, due_on: e.target.value }))} style={{ width: 130, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
            <button onClick={createTask} disabled={creating} style={{ background: '#f06a6a', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Add</button>
          </div>
          {tasks.map(t => <div key={t.gid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#111', borderRadius: 6, marginBottom: 4, fontSize: 13 }}>
            <span style={{ color: t.completed ? '#18d26e' : '#555' }}>{t.completed ? '✅' : '○'}</span>
            <span style={{ color: t.completed ? '#666' : '#ddd', textDecoration: t.completed ? 'line-through' : 'none', flex: 1 }}>{t.name}</span>
            {t.due_on && <span style={{ color: '#888', fontSize: 11 }}>{t.due_on}</span>}
          </div>)}
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_discord() {
  const [connected, setConnected] = React.useState(false);
  const [token, setToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [guilds, setGuilds] = React.useState<any[]>([]);
  const [selectedGuild, setSelectedGuild] = React.useState('');
  const [channels, setChannels] = React.useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);
  const [sendMsg, setSendMsg] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/discord/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); loadGuilds(); } });
  }, []);

  const loadGuilds = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/discord/guilds`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setGuilds(Array.isArray(d) ? d : []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/discord/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadGuilds(); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/discord/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setGuilds([]); setChannels([]); setMessages([]);
  };

  const loadChannels = async (guildId: string) => {
    setSelectedGuild(guildId); setChannels([]); setMessages([]);
    const r = await fetch(`/api/integrations/discord/channels/${guildId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setChannels((Array.isArray(d) ? d : []).filter((c: any) => c.type === 0));
  };

  const loadMessages = async (channelId: string) => {
    setSelectedChannel(channelId);
    const r = await fetch(`/api/integrations/discord/messages/${channelId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setMessages(Array.isArray(d) ? d : []);
  };

  const send = async () => {
    if (!sendMsg || !selectedChannel) return;
    await fetch(`${BACKEND}/api/integrations/discord/send`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ channelId: selectedChannel, content: sendMsg }) });
    setSendMsg('');
    loadMessages(selectedChannel);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🎮 Discord</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect a Discord Bot Token to browse servers, channels, and messages.</p>
      <input value={token} onChange={e => setToken(e.target.value)} placeholder="Bot Token (MTxxxxxx...)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#5865f2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Discord'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🎮 Discord</h2>
        <span style={{ background: '#5865f222', color: '#5865f2', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
        <div style={{ width: 160, borderRight: '1px solid #222', paddingRight: 12, overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 11, textTransform: 'uppercase' }}>Servers</div>
          {guilds.map(g => <div key={g.id} onClick={() => loadChannels(g.id)} style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: selectedGuild === g.id ? '#5865f222' : 'transparent', color: selectedGuild === g.id ? '#5865f2' : '#ddd', marginBottom: 2, fontSize: 12 }}>{g.name}</div>)}
        </div>
        {channels.length > 0 && <div style={{ width: 150, borderRight: '1px solid #222', padding: '0 12px', overflowY: 'auto' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 11, textTransform: 'uppercase' }}>Channels</div>
          {channels.map(c => <div key={c.id} onClick={() => loadMessages(c.id)} style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: selectedChannel === c.id ? '#5865f222' : 'transparent', color: selectedChannel === c.id ? '#5865f2' : '#ddd', marginBottom: 2, fontSize: 12 }}># {c.name}</div>)}
        </div>}
        {selectedChannel && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 16 }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: 6 }}>
            {messages.map(m => <div key={m.id} style={{ padding: '6px 10px', background: '#111', borderRadius: 6 }}>
              <span style={{ fontWeight: 600, color: '#5865f2', fontSize: 12 }}>{m.author?.username}</span>
              <span style={{ color: '#888', fontSize: 11, marginLeft: 8 }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
              <div style={{ color: '#ddd', fontSize: 13, marginTop: 2 }}>{m.content}</div>
            </div>)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={sendMsg} onChange={e => setSendMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Message..." style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
            <button onClick={send} style={{ background: '#5865f2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Send</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_trello() {
  const [connected, setConnected] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [trelloToken, setTrelloToken] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [boards, setBoards] = React.useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = React.useState('');
  const [lists, setLists] = React.useState<any[]>([]);
  const [selectedList, setSelectedList] = React.useState('');
  const [cards, setCards] = React.useState<any[]>([]);
  const [newCard, setNewCard] = React.useState({ name: '', desc: '' });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch(`${BACKEND}/api/integrations/trello/status`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } })
      .then(r => r.json()).then(d => { if (d.connected) { setConnected(true); loadBoards(); } });
  }, []);

  const loadBoards = async () => {
    const r = await fetch(`${BACKEND}/api/integrations/trello/boards`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setBoards(Array.isArray(d) ? d.filter((b: any) => !b.closed) : []);
  };

  const connect = async () => {
    setLoading(true);
    const r = await fetch(`${BACKEND}/api/integrations/trello/connect`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, token: trelloToken }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { setConnected(true); setStatus(''); loadBoards(); } else setStatus(d.error || 'Failed');
  };

  const disconnect = async () => {
    await fetch(`${BACKEND}/api/integrations/trello/disconnect`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    setConnected(false); setBoards([]); setLists([]); setCards([]);
  };

  const loadLists = async (boardId: string) => {
    setSelectedBoard(boardId); setLists([]); setCards([]);
    const r = await fetch(`/api/integrations/trello/lists/${boardId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setLists(Array.isArray(d) ? d : []);
  };

  const loadCards = async (listId: string) => {
    setSelectedList(listId);
    const r = await fetch(`/api/integrations/trello/cards/${listId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}` } });
    const d = await r.json();
    setCards(Array.isArray(d) ? d : []);
  };

  const addCard = async () => {
    if (!newCard.name || !selectedList) return;
    await fetch(`${BACKEND}/api/integrations/trello/cards`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('forge_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newCard, idList: selectedList }) });
    setNewCard({ name: '', desc: '' });
    loadCards(selectedList);
  };

  if (!connected) return (
    <div style={{ padding: 32, maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>📌 Trello</h2>
      <p style={{ color: '#aaa', marginBottom: 24 }}>Connect Trello to browse boards, lists, and cards.</p>
      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key (from trello.com/app-key)" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 8, boxSizing: 'border-box' }} />
      <input value={trelloToken} onChange={e => setTrelloToken(e.target.value)} placeholder="Token" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
      {status && <p style={{ color: '#f55', marginBottom: 8 }}>{status}</p>}
      <button onClick={connect} disabled={loading} style={{ background: '#0052cc', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Connecting...' : 'Connect Trello'}</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📌 Trello</h2>
        <span style={{ background: '#0052cc22', color: '#0088ff', padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>Connected</span>
        <button onClick={disconnect} style={{ marginLeft: 'auto', background: '#333', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Disconnect</button>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Boards</div>
          {boards.map(b => <div key={b.id} onClick={() => loadLists(b.id)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedBoard === b.id ? '#0052cc22' : 'transparent', color: selectedBoard === b.id ? '#0088ff' : '#ddd', marginBottom: 4, fontSize: 13 }}>{b.name}</div>)}
        </div>
        {lists.length > 0 && <div style={{ width: 160, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Lists</div>
          {lists.map(l => <div key={l.id} onClick={() => loadCards(l.id)} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: selectedList === l.id ? '#0052cc22' : 'transparent', color: selectedList === l.id ? '#0088ff' : '#ddd', marginBottom: 4, fontSize: 13 }}>{l.name}</div>)}
        </div>}
        {selectedList && <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: '#aaa', fontSize: 12, textTransform: 'uppercase' }}>Cards</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={newCard.name} onChange={e => setNewCard(p => ({ ...p, name: e.target.value }))} placeholder="New card name" style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff', fontSize: 13 }} />
            <button onClick={addCard} style={{ background: '#0052cc', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Add</button>
          </div>
          {cards.map(c => <div key={c.id} style={{ padding: '10px 12px', background: '#111', borderRadius: 6, marginBottom: 6 }}>
            <div style={{ fontWeight: 600, color: '#ddd', fontSize: 13 }}>{c.name}</div>
            {c.due && <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Due: {new Date(c.due).toLocaleDateString()} {c.dueComplete ? '✅' : ''}</div>}
            {c.desc && <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{c.desc.slice(0, 80)}</div>}
          </div>)}
        </div>}
      </div>
    </div>
  );
}

export function ForgeTab_hermes() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [goal, setGoal] = React.useState('');
          const [runId, setRunId] = React.useState<string|null>(null);
          const [steps, setSteps] = React.useState<any[]>([]);
          const [status, setStatus] = React.useState<'idle'|'running'|'done'|'error'|'cancelled'>('idle');
          const [summary, setSummary] = React.useState('');
          const [files, setFiles] = React.useState<string[]>([]);
          const [runs, setRuns] = React.useState<any[]>([]);
          const [totalTokens, setTotalTokens] = React.useState(0);
          const [thinking, setThinking] = React.useState('');
          const [viewRun, setViewRun] = React.useState<any>(null);
          const stepsRef = React.useRef<HTMLDivElement>(null);
          const esRef = React.useRef<AuthenticatedEventSource|null>(null);

          React.useEffect(() => {
            fetch(`${API}/api/hermes/runs`, { headers: { Authorization: `Bearer ${tok}` } })
              .then(r => r.json()).then(d => setRuns(d.runs || [])).catch(() => {});
          }, [status]);

          React.useEffect(() => {
            if (stepsRef.current) stepsRef.current.scrollTop = stepsRef.current.scrollHeight;
          }, [steps]);

          const startRun = async () => {
            if (!goal.trim() || status === 'running') return;
            setSteps([]); setSummary(''); setFiles([]); setTotalTokens(0); setThinking('');
            setStatus('running');
            const r = await fetch(`${API}/api/hermes/run`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ goal }),
            });
            const d = await r.json();
            if (d.error) { setStatus('error'); setSummary(d.error); return; }
            setRunId(d.id);
            // Open SSE stream
            if (esRef.current) esRef.current.close();
            const es = new AuthenticatedEventSource(`${API}/api/hermes/stream/${d.id}`, tok || '');
            esRef.current = es;
            es.addEventListener('step', (e: any) => {
              const s = JSON.parse(e.data);
              setSteps(prev => [...prev, s]);
              setThinking('');
            });
            es.addEventListener('thinking', (e: any) => {
              const d2 = JSON.parse(e.data);
              setThinking(d2.message || '');
            });
            es.addEventListener('done', (e: any) => {
              const d2 = JSON.parse(e.data);
              setStatus(d2.status || 'done');
              setSummary(d2.summary || '');
              setFiles(d2.files || []);
              setTotalTokens(d2.total_tokens || 0);
              setThinking('');
              es.close();
            });
            es.onerror = () => { setStatus('error'); setSummary('Connection lost.'); es.close(); };
          };

          const cancel = async () => {
            if (!runId) return;
            await fetch(`${API}/api/hermes/cancel/${runId}`, { method: 'POST', headers: { Authorization: `Bearer ${tok}` } });
            esRef.current?.close();
            setStatus('cancelled');
          };

          const loadRun = async (id: string) => {
            const r = await fetch(`${API}/api/hermes/run/${id}`, { headers: { Authorization: `Bearer ${tok}` } });
            const d = await r.json();
            setViewRun(d);
          };

          const STEP_ICONS: Record<string,string> = { plan:'🧠', tool_call:'🔧', tool_result:'📋', reflect:'💭', done:'✅', error:'❌' };
          const TOOL_ICONS: Record<string,string> = { web_search:'🔍', write_file:'📝', read_file:'📖', save_to_brain:'🧠', send_approval:'✋', run_agent:'🤖', http_get:'🌐', calculate:'🔢', list_files:'📁', done:'✅' };

          const EXAMPLE_GOALS = [
            'Research my top 3 competitors, summarise their pricing and weaknesses, and write a 500-word positioning strategy',
            'Write a cold email sequence (5 emails) for a B2B SaaS targeting HR directors at mid-size companies',
            'Create a 7-day social media content plan for a restaurant with daily captions and hashtags',
            'Write a detailed SEO blog post about AI tools for small businesses (1000 words)',
            'Draft a client proposal for a web design project: scope, timeline, pricing, T&Cs',
            'Build a weekly report template with KPI sections for a SaaS company',
          ];

          return (
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--fg-bg)', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid var(--fg-border)', background:'var(--fg-bg2)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#ff1f35,#ff6b35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⚡</div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--fg-text)' }}>Hermes Agent</div>
                  <div style={{ fontSize:12, color:'var(--fg-text3)' }}>Autonomous AI — plans, executes tools, reflects, loops until done</div>
                </div>
                {status === 'running' && (
                  <button onClick={cancel} style={{ marginLeft:'auto', padding:'6px 14px', borderRadius:8, border:'1px solid #ef4444', background:'rgba(239,68,68,0.1)', color:'#ef4444', cursor:'pointer', fontSize:12, fontWeight:700 }}>⏹ Cancel</button>
                )}
              </div>
              {/* Goal input */}
              <div style={{ display:'flex', gap:10 }}>
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) startRun(); }}
                  placeholder="Give Hermes a goal — it will plan and execute non-stop until complete…"
                  disabled={status === 'running'}
                  rows={2}
                  style={{ flex:1, padding:'10px 14px', borderRadius:10, border:'1px solid var(--fg-border)', background:'var(--fg-bg)', color:'var(--fg-text)', fontSize:13, resize:'none', fontFamily:'inherit', opacity: status==='running' ? 0.6 : 1 }}
                />
                <button
                  onClick={startRun}
                  disabled={status === 'running' || !goal.trim()}
                  style={{ padding:'0 20px', borderRadius:10, border:'none', background: status==='running' ? '#666' : 'linear-gradient(135deg,#ff1f35,#ff6b35)', color:'#fff', fontSize:13, fontWeight:800, cursor: status==='running' ? 'not-allowed' : 'pointer', whiteSpace:'nowrap', minWidth:100 }}
                >
                  {status === 'running' ? '⚡ Running…' : '⚡ Run'}
                </button>
              </div>
              {/* Example goals */}
              {status === 'idle' && (
                <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {EXAMPLE_GOALS.map(g => (
                    <button key={g} onClick={() => setGoal(g)} style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--fg-border)', background:'var(--fg-bg3)', color:'var(--fg-text3)', fontSize:11, cursor:'pointer' }}>
                      {g.slice(0,50)}…
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
              {/* Steps feed */}
              <div ref={stepsRef} style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
                {steps.length === 0 && status === 'idle' && (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--fg-text3)' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>⚡</div>
                    <div style={{ fontSize:16, fontWeight:700, color:'var(--fg-text2)', marginBottom:8 }}>Hermes is ready</div>
                    <div style={{ fontSize:13 }}>Give it a goal above. It will plan, use tools, and work non-stop until done — no hand-holding needed.</div>
                  </div>
                )}
                {thinking && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(255,31,53,0.06)', border:'1px solid rgba(255,31,53,0.15)', marginBottom:10 }}>
                    <span style={{ fontSize:16, animation:'spin 1s linear infinite' }}>⚙️</span>
                    <span style={{ fontSize:13, color:'var(--fg-text2)', fontStyle:'italic' }}>{thinking}</span>
                  </div>
                )}
                {steps.map((s, i) => (
                  <div key={i} style={{ marginBottom:10, borderRadius:10, border:'1px solid var(--fg-border)', overflow:'hidden', background:'var(--fg-bg2)' }}>
                    {/* Step header */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'var(--fg-bg3)', borderBottom:'1px solid var(--fg-border)' }}>
                      <span style={{ fontSize:14 }}>{s.type === 'tool_call' && s.tool ? (TOOL_ICONS[s.tool] || '🔧') : (STEP_ICONS[s.type] || '•')}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--fg-text2)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                        {s.type === 'tool_call' ? `→ ${s.tool}` : s.type === 'tool_result' ? `← ${s.tool}` : s.type}
                      </span>
                      <span style={{ marginLeft:'auto', fontSize:10, color:'var(--fg-text3)' }}>step {s.step}{s.elapsed_ms ? ` · ${(s.elapsed_ms/1000).toFixed(1)}s` : ''}</span>
                    </div>
                    {/* Step body */}
                    <div style={{ padding:'10px 14px' }}>
                      {s.type === 'tool_call' && s.tool_input && (
                        <div style={{ marginBottom:6 }}>
                          {Object.entries(s.tool_input).map(([k,v]) => (
                            <div key={k} style={{ fontSize:12, color:'var(--fg-text3)', marginBottom:2 }}>
                              <span style={{ fontWeight:600, color:'var(--fg-text2)' }}>{k}:</span> {String(v).slice(0,200)}{String(v).length > 200 ? '…' : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      {s.type === 'tool_result' && (
                        <div style={{ fontSize:12, color:'var(--fg-text)', whiteSpace:'pre-wrap', lineHeight:1.6, maxHeight:200, overflowY:'auto' }}>{String(s.tool_output || s.content).slice(0,1000)}</div>
                      )}
                      {(s.type === 'reflect' || s.type === 'plan') && (
                        <div style={{ fontSize:12, color:'var(--fg-text2)', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{s.content.slice(0,600)}</div>
                      )}
                      {s.type === 'done' && (
                        <div style={{ fontSize:13, color:'#10b981', fontWeight:600 }}>{s.content}</div>
                      )}
                      {s.type === 'error' && (
                        <div style={{ fontSize:12, color:'#ef4444' }}>{s.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Final summary */}
                {status !== 'idle' && status !== 'running' && summary && (
                  <div style={{ borderRadius:12, border:`1px solid ${status==='done'?'#10b981':'#ef4444'}`, background: status==='done'?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)', padding:'16px 18px', marginTop:10 }}>
                    <div style={{ fontSize:13, fontWeight:800, color: status==='done'?'#10b981':'#ef4444', marginBottom:8 }}>
                      {status==='done' ? '✅ Complete' : status==='cancelled' ? '⏹ Cancelled' : '❌ Error'} · {totalTokens.toLocaleString()} tokens
                    </div>
                    <div style={{ fontSize:13, color:'var(--fg-text)', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{summary}</div>
                    {files.length > 0 && (
                      <div style={{ marginTop:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Files produced</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {files.map(f => (
                            <a key={f} href={`${API}/api/hermes/file/${runId}/${encodeURIComponent(f)}`} target="_blank" rel="noreferrer"
                              style={{ padding:'5px 12px', borderRadius:8, background:'var(--fg-bg3)', border:'1px solid var(--fg-border)', color:'var(--fg-text2)', fontSize:12, textDecoration:'none', cursor:'pointer' }}>
                              📄 {f}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right panel — run history */}
              <div style={{ width:260, borderLeft:'1px solid var(--fg-border)', overflowY:'auto', background:'var(--fg-bg2)' }}>
                <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--fg-border)', fontSize:11, fontWeight:700, color:'var(--fg-text3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Run History</div>
                {runs.length === 0 && <div style={{ padding:'20px 14px', fontSize:12, color:'var(--fg-text3)' }}>No runs yet.</div>}
                {runs.map(r => (
                  <div key={r.id} onClick={() => loadRun(r.id)} style={{ padding:'10px 14px', borderBottom:'1px solid var(--fg-border)', cursor:'pointer', background: viewRun?.id === r.id ? 'var(--fg-bg3)' : 'transparent' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:10 }}>{r.status==='done'?'✅':r.status==='error'?'❌':r.status==='cancelled'?'⏹':'⚡'}</span>
                      <span style={{ fontSize:10, fontWeight:700, color: r.status==='done'?'#10b981':r.status==='error'?'#ef4444':'var(--fg-orange)', textTransform:'uppercase' }}>{r.status}</span>
                      <span style={{ marginLeft:'auto', fontSize:9, color:'var(--fg-text3)' }}>{r.started_at?.slice(5,16)}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--fg-text)', lineHeight:1.4 }}>{r.goal.slice(0,80)}{r.goal.length>80?'…':''}</div>
                    {r.total_tokens > 0 && <div style={{ fontSize:10, color:'var(--fg-text3)', marginTop:3 }}>{r.total_tokens.toLocaleString()} tokens</div>}
                  </div>
                ))}
                {/* Run detail panel */}
                {viewRun && (
                  <div style={{ padding:'12px 14px', borderTop:'2px solid var(--fg-border)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:'var(--fg-text)' }}>Run Detail</span>
                      <button onClick={() => setViewRun(null)} style={{ fontSize:10, background:'none', border:'none', cursor:'pointer', color:'var(--fg-text3)' }}>✕</button>
                    </div>
                    <div style={{ fontSize:12, color:'var(--fg-text2)', marginBottom:8, lineHeight:1.5 }}>{viewRun.goal.slice(0,120)}</div>
                    {viewRun.final_summary && <div style={{ fontSize:11, color:'var(--fg-text3)', lineHeight:1.5, marginBottom:8 }}>{viewRun.final_summary.slice(0,200)}</div>}
                    {Object.keys(viewRun.files || {}).length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {Object.keys(viewRun.files).map(f => (
                          <a key={f} href={`${API}/api/hermes/file/${viewRun.id}/${encodeURIComponent(f)}`} target="_blank" rel="noreferrer"
                            style={{ fontSize:11, color:'var(--fg-orange)', textDecoration:'none' }}>📄 {f}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
}

export function ForgeTab_forgedeepresearch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [topic, setTopic] = React.useState('');
          const [depth, setDepth] = React.useState('standard');
          const [running, setRunning] = React.useState(false);
          const [phase, setPhase] = React.useState('');
          const [questions, setQuestions] = React.useState<string[]>([]);
          const [answers, setAnswers] = React.useState<{q:string,a:string}[]>([]);
          const [progress, setProgress] = React.useState(0);
          const [total, setTotal] = React.useState(0);
          const [report, setReport] = React.useState('');
          const [sessions, setSessions] = React.useState<any[]>([]);
          const [activeSession, setActiveSession] = React.useState<string|null>(null);
          const esRef = React.useRef<AuthenticatedEventSource|null>(null);
          React.useEffect(()=>{fetch(`${API}/api/deep-research/sessions`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setSessions(d.sessions||[])).catch(()=>{});},[]);
          const startResearch = async()=>{
            if(!topic.trim()) return;
            setRunning(true); setPhase('Starting…'); setQuestions([]); setAnswers([]); setProgress(0); setReport('');
            const r=await fetch(`${API}/api/deep-research/run`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({topic,depth})});
            const {sessionId}=await r.json();
            setActiveSession(sessionId);
            const es=new AuthenticatedEventSource(`${API}/api/deep-research/stream/${sessionId}`, tok || '');
            esRef.current=es;
            es.addEventListener('thinking',((e:MessageEvent)=>{setPhase(JSON.parse(e.data).message);}) as EventListener);
            es.addEventListener('questions',((e:MessageEvent)=>{setQuestions(JSON.parse(e.data).questions);setTotal(JSON.parse(e.data).questions.length);}) as EventListener);
            es.addEventListener('progress',((e:MessageEvent)=>{const d=JSON.parse(e.data);setProgress(d.index+1);setPhase(`Researching ${d.index+1}/${d.total}…`);}) as EventListener);
            es.addEventListener('answer',((e:MessageEvent)=>{const d=JSON.parse(e.data);setAnswers(p=>[...p,{q:d.question,a:d.answer}]);}) as EventListener);
            es.addEventListener('complete',((e:MessageEvent)=>{const d=JSON.parse(e.data);setReport(d.report);setRunning(false);setPhase('Done');es.close();setSessions(p=>[{id:sessionId,topic,depth,status:'done',created_at:new Date().toISOString()},...p]);}) as EventListener);
            es.addEventListener('error',((e:MessageEvent)=>{try{setPhase('Error: '+JSON.parse(e.data).error);}catch{}setRunning(false);es.close();}) as EventListener);
          };
          const loadSession=async(id:string)=>{
            const r=await fetch(`${API}/api/deep-research/session/${id}`,{headers:{'Authorization':`Bearer ${tok}`}});
            const d=await r.json(); setTopic(d.topic||''); setReport(d.report||''); setQuestions(JSON.parse(d.questions||'[]'));
          };
          return(<div style={{padding:'24px',maxWidth:'1100px',margin:'0 auto',fontFamily:'system-ui'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'20px'}}>
              <span style={{fontSize:'28px'}}>🔬</span>
              <div><div style={{fontSize:'22px',fontWeight:700}}>Deep Research</div><div style={{color:'#888',fontSize:'13px'}}>Multi-step AI research synthesis with live progress</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:'20px'}}>
              <div>
                <div style={{background:'#1a1a2e',borderRadius:'12px',padding:'16px',border:'1px solid #333',marginBottom:'12px'}}>
                  <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Research topic…" style={{width:'100%',background:'#0d0d1a',color:'#fff',border:'1px solid #444',borderRadius:'8px',padding:'10px',fontSize:'14px',marginBottom:'10px',boxSizing:'border-box'}} onKeyDown={e=>{if(e.key==='Enter'&&!running) startResearch();}}/>
                  <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
                    {['quick','standard','deep'].map(d=><button key={d} onClick={()=>setDepth(d)} style={{flex:1,padding:'6px',borderRadius:'6px',border:'none',background:depth===d?'#6366f1':'#2a2a3e',color:'#fff',cursor:'pointer',fontSize:'12px',textTransform:'capitalize'}}>{d}</button>)}
                  </div>
                  <button onClick={startResearch} disabled={running||!topic.trim()} style={{width:'100%',background:running?'#555':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'8px',padding:'10px',fontWeight:700,cursor:'pointer',fontSize:'14px'}}>{running?phase:'🔬 Start Research'}</button>
                  {running&&total>0&&<div style={{marginTop:'10px'}}><div style={{background:'#0d0d1a',borderRadius:'6px',height:'6px',overflow:'hidden'}}><div style={{background:'#6366f1',height:'100%',width:`${(progress/total)*100}%`,transition:'width 0.5s'}}/></div><div style={{color:'#888',fontSize:'11px',marginTop:'4px',textAlign:'center'}}>{progress}/{total} questions</div></div>}
                </div>
                <div style={{background:'#1a1a2e',borderRadius:'12px',padding:'16px',border:'1px solid #333'}}>
                  <div style={{fontWeight:600,marginBottom:'10px',color:'#aaa',fontSize:'13px'}}>HISTORY</div>
                  {sessions.length===0&&<div style={{color:'#555',fontSize:'13px'}}>No sessions yet</div>}
                  {sessions.map((s:any)=><div key={s.id} onClick={()=>loadSession(s.id)} style={{padding:'8px',background:'#0d0d1a',borderRadius:'6px',marginBottom:'6px',cursor:'pointer',fontSize:'12px',border:'1px solid #2a2a3e'}}>
                    <div style={{fontWeight:600,marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.topic}</div>
                    <div style={{color:'#888'}}>{s.depth} · {new Date(utcStamp(s.created_at)).toLocaleDateString()}</div>
                  </div>)}
                </div>
              </div>
              <div>
                {questions.length>0&&!report&&<div style={{background:'#1a1a2e',borderRadius:'12px',padding:'16px',border:'1px solid #333',marginBottom:'16px'}}>
                  <div style={{fontWeight:600,marginBottom:'10px',color:'#aaa',fontSize:'13px'}}>RESEARCH QUESTIONS</div>
                  {questions.map((q,i)=><div key={i} style={{display:'flex',gap:'10px',marginBottom:'6px',alignItems:'flex-start'}}>
                    <span style={{background:answers.length>i?'#10b981':'#333',color:'#fff',borderRadius:'50%',width:'20px',height:'20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',flexShrink:0}}>{i+1}</span>
                    <div style={{fontSize:'13px',color:answers.length>i?'#ddd':'#888'}}>{q}</div>
                  </div>)}
                </div>}
                {report?<div style={{background:'#1a1a2e',borderRadius:'12px',padding:'20px',border:'1px solid #333',whiteSpace:'pre-wrap',fontSize:'14px',lineHeight:'1.7',color:'#e0e0e0',maxHeight:'70vh',overflowY:'auto'}}>
                  {report}
                  <div style={{marginTop:'16px',display:'flex',gap:'8px'}}>
                    <button onClick={()=>{const b=new Blob([report],{type:'text/markdown'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`research-${topic.slice(0,30)}.md`;a.click();}} style={{padding:'8px 16px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>⬇️ Download</button>
                    <button onClick={()=>navigator.clipboard.writeText(report)} style={{padding:'8px 16px',background:'#2a2a3e',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>📋 Copy</button>
                  </div>
                </div>:<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'300px',color:'#555'}}>
                  {!running&&<><div style={{fontSize:'48px',marginBottom:'12px'}}>🔬</div><div>Enter a topic and click Start Research</div></>}
                  {running&&<><div style={{fontSize:'48px',marginBottom:'12px',animation:'spin 2s linear infinite'}}>⚙️</div><div style={{color:'#8b5cf6'}}>{phase}</div></>}
                </div>}
              </div>
            </div>
          </div>);
}

export function ForgeTab_studymode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [topic, setTopic] = React.useState('');
          const [mode, setMode] = React.useState('flashcards');
          const [loading, setLoading] = React.useState(false);
          const [data, setData] = React.useState<any>(null);
          const [cardIdx, setCardIdx] = React.useState(0);
          const [flipped, setFlipped] = React.useState(false);
          const [quizIdx, setQuizIdx] = React.useState(0);
          const [selected, setSelected] = React.useState<number|null>(null);
          const [score, setScore] = React.useState(0);
          const [quizDone, setQuizDone] = React.useState(false);
          const generate=async()=>{
            if(!topic.trim()) return; setLoading(true); setData(null); setCardIdx(0); setFlipped(false); setQuizIdx(0); setSelected(null); setScore(0); setQuizDone(false);
            const r=await fetch(`${API}/api/study/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({topic,mode})});
            const d=await r.json(); setData(d.data); setLoading(false);
          };
          const MODES=[{id:'flashcards',icon:'🃏',label:'Flashcards'},{id:'quiz',icon:'❓',label:'Quiz'},{id:'summary',icon:'📝',label:'Summary'},{id:'mindmap',icon:'🗺️',label:'Mind Map'}];
          return(<div style={{padding:'24px',maxWidth:'900px',margin:'0 auto',fontFamily:'system-ui'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'20px'}}>
              <span style={{fontSize:'28px'}}>📚</span>
              <div><div style={{fontSize:'22px',fontWeight:700}}>Study Mode</div><div style={{color:'#888',fontSize:'13px'}}>Flashcards, Quiz, Summary & Mind Map — AI-generated from any topic</div></div>
            </div>
            <div style={{display:'flex',gap:'10px',marginBottom:'16px'}}>
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic to study…" style={{flex:1,background:'#1a1a2e',color:'#fff',border:'1px solid #444',borderRadius:'8px',padding:'10px',fontSize:'14px'}} onKeyDown={e=>{if(e.key==='Enter') generate();}}/>
              <button onClick={generate} disabled={loading||!topic.trim()} style={{padding:'10px 20px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{loading?'Generating…':'Generate'}</button>
            </div>
            <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
              {MODES.map(m=><button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:'10px',background:mode===m.id?'#6366f1':'#1a1a2e',color:'#fff',border:'1px solid '+(mode===m.id?'#6366f1':'#333'),borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:mode===m.id?700:400}}>{m.icon} {m.label}</button>)}
            </div>
            {data&&mode==='flashcards'&&data.cards&&<div>
              <div style={{background:'#1a1a2e',borderRadius:'16px',padding:'40px',textAlign:'center',border:'1px solid #333',minHeight:'200px',cursor:'pointer',position:'relative'}} onClick={()=>setFlipped(p=>!p)}>
                <div style={{fontSize:'13px',color:'#888',marginBottom:'20px'}}>Card {cardIdx+1} of {data.cards.length} · Click to flip</div>
                <div style={{fontSize:'18px',fontWeight:600,lineHeight:'1.6'}}>{flipped?data.cards[cardIdx]?.back:data.cards[cardIdx]?.front}</div>
                <div style={{position:'absolute',top:'12px',right:'12px',background:flipped?'#8b5cf6':'#333',color:'#fff',borderRadius:'20px',padding:'4px 10px',fontSize:'11px'}}>{flipped?'Answer':'Question'}</div>
              </div>
              <div style={{display:'flex',gap:'12px',justifyContent:'center',marginTop:'16px'}}>
                <button onClick={()=>{setCardIdx(p=>Math.max(0,p-1));setFlipped(false);}} style={{padding:'10px 24px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'8px',cursor:'pointer'}}>← Prev</button>
                <button onClick={()=>{setCardIdx(p=>Math.min(data.cards.length-1,p+1));setFlipped(false);}} style={{padding:'10px 24px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>Next →</button>
              </div>
            </div>}
            {data&&mode==='quiz'&&data.questions&&!quizDone&&<div>
              <div style={{background:'#1a1a2e',borderRadius:'12px',padding:'24px',border:'1px solid #333'}}>
                <div style={{color:'#888',fontSize:'12px',marginBottom:'8px'}}>Question {quizIdx+1} of {data.questions.length} · Score: {score}</div>
                <div style={{fontSize:'17px',fontWeight:600,marginBottom:'20px'}}>{data.questions[quizIdx]?.question}</div>
                {data.questions[quizIdx]?.options?.map((opt:string,i:number)=><button key={i} onClick={()=>{if(selected!==null) return; setSelected(i); if(i===data.questions[quizIdx].correct) setScore(p=>p+1);}} style={{display:'block',width:'100%',textAlign:'left',padding:'12px 16px',marginBottom:'8px',borderRadius:'8px',border:'1px solid '+(selected===null?'#333':i===data.questions[quizIdx].correct?'#10b981':selected===i?'#ef4444':'#333'),background:selected===null?'#0d0d1a':i===data.questions[quizIdx].correct?'rgba(16,185,129,0.15)':selected===i?'rgba(239,68,68,0.15)':'#0d0d1a',color:'#fff',cursor:selected===null?'pointer':'default',fontSize:'14px'}}>{opt}</button>)}
                {selected!==null&&<div><div style={{background:'#0d0d1a',borderRadius:'8px',padding:'12px',marginTop:'8px',color:'#10b981',fontSize:'13px'}}>💡 {data.questions[quizIdx]?.explanation}</div><button onClick={()=>{if(quizIdx+1>=data.questions.length) setQuizDone(true); else {setQuizIdx(p=>p+1);setSelected(null);}}} style={{marginTop:'12px',padding:'10px 24px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700}}>{quizIdx+1>=data.questions.length?'See Results':'Next Question →'}</button></div>}
              </div>
            </div>}
            {quizDone&&<div style={{textAlign:'center',padding:'40px',background:'#1a1a2e',borderRadius:'12px',border:'1px solid #333'}}><div style={{fontSize:'48px',marginBottom:'12px'}}>🎓</div><div style={{fontSize:'24px',fontWeight:700,marginBottom:'8px'}}>Quiz Complete!</div><div style={{color:'#888',fontSize:'16px',marginBottom:'20px'}}>Score: {score}/{data.questions.length} ({Math.round(score/data.questions.length*100)}%)</div><button onClick={()=>{setQuizIdx(0);setSelected(null);setScore(0);setQuizDone(false);}} style={{padding:'10px 24px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:700}}>Try Again</button></div>}
            {data&&mode==='summary'&&data.overview&&<div style={{background:'#1a1a2e',borderRadius:'12px',padding:'24px',border:'1px solid #333'}}>
              <h2 style={{margin:'0 0 12px',color:'#c4b5fd'}}>{data.title}</h2>
              <p style={{color:'#ddd',lineHeight:'1.7',marginBottom:'20px'}}>{data.overview}</p>
              <h3 style={{color:'#aaa',margin:'0 0 12px',fontSize:'14px',textTransform:'uppercase',letterSpacing:'1px'}}>Key Concepts</h3>
              {(data.key_concepts||[]).map((c:any,i:number)=><div key={i} style={{background:'#0d0d1a',borderRadius:'8px',padding:'12px',marginBottom:'8px'}}><span style={{color:'#a78bfa',fontWeight:700}}>{c.term}: </span><span style={{color:'#ddd',fontSize:'13px'}}>{c.definition}</span></div>)}
              {data.bullet_points&&<div style={{marginTop:'20px'}}><h3 style={{color:'#aaa',margin:'0 0 12px',fontSize:'14px',textTransform:'uppercase',letterSpacing:'1px'}}>Key Points</h3>{(data.bullet_points||[]).map((b:string,i:number)=><div key={i} style={{padding:'6px 0',borderBottom:'1px solid #1f1f2e',color:'#ddd',fontSize:'14px'}}>• {b}</div>)}</div>}
              {data.remember&&<div style={{marginTop:'20px',background:'rgba(99,102,241,0.1)',borderRadius:'8px',padding:'16px',border:'1px solid rgba(99,102,241,0.3)'}}><h3 style={{color:'#a78bfa',margin:'0 0 10px',fontSize:'14px'}}>💡 Remember</h3>{(data.remember||[]).map((r:string,i:number)=><div key={i} style={{color:'#ddd',fontSize:'13px',marginBottom:'4px'}}>✓ {r}</div>)}</div>}
            </div>}
            {data&&mode==='mindmap'&&data.branches&&<div style={{background:'#1a1a2e',borderRadius:'12px',padding:'24px',border:'1px solid #333'}}>
              <div style={{textAlign:'center',marginBottom:'20px',fontSize:'18px',fontWeight:700,color:'#c4b5fd'}}>{data.center}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'12px'}}>
                {(data.branches||[]).map((b:any,i:number)=><div key={i} style={{background:'#0d0d1a',borderRadius:'10px',padding:'14px',border:`2px solid ${b.color||'#6366f1'}`}}>
                  <div style={{fontWeight:700,marginBottom:'8px',color:b.color||'#c4b5fd',fontSize:'14px'}}>{b.label}</div>
                  {(b.children||[]).map((c:string,j:number)=><div key={j} style={{fontSize:'12px',color:'#aaa',padding:'3px 0',borderBottom:'1px solid #1f1f2e'}}>• {c}</div>)}
                </div>)}
              </div>
            </div>}
            {!data&&!loading&&<div style={{textAlign:'center',padding:'60px',color:'#555'}}><div style={{fontSize:'48px',marginBottom:'12px'}}>📚</div><div>Enter a topic and choose a study mode</div></div>}
          </div>);
}

export function ForgeTab_voicemode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [listening, setListening] = React.useState(false);
          const [speaking, setSpeaking] = React.useState(false);
          const [transcript, setTranscript] = React.useState('');
          const [conversation, setConversation] = React.useState<{role:string,text:string}[]>([]);
          const [status, setStatus] = React.useState('Ready to talk');
          const [error, setError] = React.useState('');
          const recogRef = React.useRef<any>(null);
          const convRef = React.useRef<HTMLDivElement>(null);
          React.useEffect(()=>{if(convRef.current) convRef.current.scrollTop=convRef.current.scrollHeight;},[conversation]);
          const speak=(text:string)=>{
            window.speechSynthesis.cancel();
            const u=new SpeechSynthesisUtterance(text);
            u.rate=1.05; u.pitch=1; u.volume=1;
            const voices=window.speechSynthesis.getVoices();
            const pref=voices.find(v=>v.name.includes('Google')||v.name.includes('Samantha')||v.lang==='en-US');
            if(pref) u.voice=pref;
            setSpeaking(true); u.onend=()=>setSpeaking(false); u.onerror=()=>setSpeaking(false);
            window.speechSynthesis.speak(u);
          };
          const sendVoiceMessage=async(text:string)=>{
            if(!text.trim()) return;
            setConversation(p=>[...p,{role:'user',text}]);
            setStatus('Thinking…'); setListening(false);
            try{
              const msgs=[...conversation,{role:'user',text}].map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}));
              msgs.unshift({role:'user',content:`[System: You are Forge Voice Assistant. Be concise — responses will be spoken aloud. Keep answers to 2-3 sentences max unless asked for detail.]\n\nUser: ${text}`});
              const r=await fetch(`${API}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({messages:msgs.slice(-10),stream:false})});
              const d=await r.json();
              const reply=d.content||d.message||'Sorry, I could not get a response.';
              setConversation(p=>[...p,{role:'assistant',text:reply}]);
              setStatus('Speaking…'); speak(reply);
            }catch(e:any){setError(e.message);setStatus('Error');}
          };
          const startListening=()=>{
            if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){setError('Voice not supported in this browser. Use Chrome.');return;}
            const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
            const r=new SR(); r.lang='en-US'; r.interimResults=true; r.maxAlternatives=1;
            r.onstart=()=>{setListening(true);setStatus('Listening…');setTranscript('');};
            r.onresult=(e:any)=>{const t=Array.from(e.results).map((r:any)=>r[0].transcript).join('');setTranscript(t);};
            r.onend=()=>{setListening(false);if(transcript) sendVoiceMessage(transcript); else setStatus('Ready to talk');};
            r.onerror=(e:any)=>{setListening(false);setError(e.error);setStatus('Error');};
            recogRef.current=r; r.start();
          };
          const stopListening=()=>{if(recogRef.current){recogRef.current.stop();}};
          return(<div style={{padding:'24px',maxWidth:'700px',margin:'0 auto',fontFamily:'system-ui',display:'flex',flexDirection:'column',height:'85vh'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'20px'}}>
              <span style={{fontSize:'28px'}}>🎙️</span>
              <div><div style={{fontSize:'22px',fontWeight:700}}>Voice Mode</div><div style={{color:'#888',fontSize:'13px'}}>Speak to Forge — real-time voice conversation</div></div>
            </div>
            {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid #ef4444',borderRadius:'8px',padding:'12px',marginBottom:'12px',color:'#ef4444',fontSize:'13px'}}>{error} <button onClick={()=>setError('')} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',float:'right'}}>✕</button></div>}
            <div ref={convRef} style={{flex:1,overflowY:'auto',background:'#0d0d1a',borderRadius:'12px',padding:'16px',marginBottom:'16px',border:'1px solid #333'}}>
              {conversation.length===0&&<div style={{textAlign:'center',color:'#555',padding:'60px 0'}}><div style={{fontSize:'48px',marginBottom:'12px'}}>🎙️</div><div>Press the mic button and start speaking</div></div>}
              {conversation.map((m,i)=><div key={i} style={{marginBottom:'12px',display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'75%',padding:'10px 14px',borderRadius:'12px',background:m.role==='user'?'#6366f1':'#1a1a2e',border:'1px solid '+(m.role==='user'?'#6366f1':'#333'),fontSize:'14px',lineHeight:'1.5'}}>{m.text}</div>
              </div>)}
            </div>
            {transcript&&listening&&<div style={{background:'#1a1a2e',borderRadius:'8px',padding:'10px',marginBottom:'12px',color:'#888',fontSize:'13px',fontStyle:'italic'}}>{transcript}…</div>}
            <div style={{textAlign:'center'}}>
              <div style={{color:'#888',fontSize:'12px',marginBottom:'12px'}}>{status}</div>
              <button onClick={listening?stopListening:startListening} disabled={speaking} style={{width:'80px',height:'80px',borderRadius:'50%',background:listening?'#ef4444':speaking?'#555':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',cursor:speaking?'default':'pointer',fontSize:'28px',boxShadow:listening?'0 0 30px rgba(239,68,68,0.5)':'0 0 20px rgba(99,102,241,0.4)',transition:'all 0.3s'}}>{listening?'⏹':'🎙️'}</button>
              {(conversation.length>0)&&<div style={{marginTop:'12px',display:'flex',gap:'8px',justifyContent:'center'}}>
                <button onClick={()=>window.speechSynthesis.cancel()} style={{padding:'6px 14px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>⏹ Stop</button>
                <button onClick={()=>{setConversation([]);setTranscript('');}} style={{padding:'6px 14px',background:'#1a1a2e',color:'#fff',border:'1px solid #333',borderRadius:'6px',cursor:'pointer',fontSize:'12px'}}>🗑 Clear</button>
              </div>}
            </div>
          </div>);
}

export function ForgeTab_forgecanvas() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [prompt, setPrompt] = React.useState('');
          const [docType, setDocType] = React.useState('document');
          const [content, setContent] = React.useState('');
          const [editInstr, setEditInstr] = React.useState('');
          const [loading, setLoading] = React.useState(false);
          const [canvasId, setCanvasId] = React.useState<string|null>(null);
          const [version, setVersion] = React.useState(1);
          const [canvases, setCanvases] = React.useState<any[]>([]);
          const [title, setTitle] = React.useState('');
          React.useEffect(()=>{fetch(`${API}/api/canvas/list`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setCanvases(d.canvases||[])).catch(()=>{});},[]);
          const create=async()=>{
            if(!prompt.trim()) return; setLoading(true);
            const r=await fetch(`${API}/api/canvas/create`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({prompt,type:docType})});
            const d=await r.json(); setContent(d.content||''); setCanvasId(d.id); setVersion(d.version||1); setTitle(d.title||''); setLoading(false);
            setCanvases(p=>[{id:d.id,title:d.title,type:d.type,version:d.version,updated_at:new Date().toISOString()},...p]);
          };
          const edit=async()=>{
            if(!editInstr.trim()||!canvasId) return; setLoading(true);
            const r=await fetch(`${API}/api/canvas/edit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({id:canvasId,instruction:editInstr,content})});
            const d=await r.json(); setContent(d.content||content); setVersion(d.version||version); setEditInstr(''); setLoading(false);
          };
          const TYPES=[{id:'document',icon:'📄'},{id:'code',icon:'💻'},{id:'webpage',icon:'🌐'},{id:'email',icon:'✉️'},{id:'report',icon:'📊'}];
          return(<div style={{padding:'16px',maxWidth:'1200px',margin:'0 auto',fontFamily:'system-ui',display:'grid',gridTemplateColumns:'260px 1fr',gap:'16px',height:'90vh'}}>
            <div>
              <div style={{background:'#1a1a2e',borderRadius:'12px',padding:'14px',border:'1px solid #333',marginBottom:'12px'}}>
                <div style={{fontWeight:700,fontSize:'16px',marginBottom:'12px'}}>🖼️ Forge Canvas</div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
                  {TYPES.map(t=><button key={t.id} onClick={()=>setDocType(t.id)} title={t.id} style={{padding:'6px 10px',background:docType===t.id?'#6366f1':'#0d0d1a',border:'1px solid '+(docType===t.id?'#6366f1':'#333'),borderRadius:'6px',color:'#fff',cursor:'pointer',fontSize:'16px'}}>{t.icon}</button>)}
                </div>
                <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe what to create…" style={{width:'100%',background:'#0d0d1a',color:'#fff',border:'1px solid #444',borderRadius:'6px',padding:'8px',fontSize:'13px',marginBottom:'8px',boxSizing:'border-box'}} onKeyDown={e=>{if(e.key==='Enter') create();}}/>
                <button onClick={create} disabled={loading||!prompt.trim()} style={{width:'100%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'6px',padding:'8px',fontWeight:700,cursor:'pointer',fontSize:'13px'}}>{loading?'Creating…':'✨ Create'}</button>
              </div>
              <div style={{background:'#1a1a2e',borderRadius:'12px',padding:'14px',border:'1px solid #333'}}>
                <div style={{fontWeight:600,fontSize:'12px',color:'#aaa',marginBottom:'8px'}}>CANVASES</div>
                {canvases.map((c:any)=><div key={c.id} onClick={async()=>{const r=await fetch(`${API}/api/canvas/${c.id}`,{headers:{'Authorization':`Bearer ${tok}`}});const d=await r.json();setContent(d.content||'');setCanvasId(d.id);setVersion(d.version||1);setTitle(d.title||'');setPrompt(d.title||'');}} style={{padding:'8px',background:'#0d0d1a',borderRadius:'6px',marginBottom:'6px',cursor:'pointer',border:'1px solid #2a2a3e'}}>
                  <div style={{fontSize:'12px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.title}</div>
                  <div style={{fontSize:'11px',color:'#888'}}>v{c.version} · {c.type}</div>
                </div>)}
                {canvases.length===0&&<div style={{color:'#555',fontSize:'12px'}}>No canvases yet</div>}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',background:'#0d0d1a',borderRadius:'12px',border:'1px solid #333',overflow:'hidden'}}>
              <div style={{padding:'12px 16px',borderBottom:'1px solid #1f1f2e',display:'flex',alignItems:'center',gap:'12px',background:'#1a1a2e'}}>
                <span style={{fontWeight:600,fontSize:'14px',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title||'Untitled'}</span>
                {canvasId&&<span style={{fontSize:'11px',color:'#888'}}>v{version}</span>}
                {content&&<><button onClick={()=>navigator.clipboard.writeText(content)} style={{padding:'5px 10px',background:'#2a2a3e',color:'#fff',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>📋 Copy</button><button onClick={()=>{const b=new Blob([content],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${title||'canvas'}.txt`;a.click();}} style={{padding:'5px 10px',background:'#2a2a3e',color:'#fff',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px'}}>⬇️ Export</button></>}
              </div>
              <textarea value={content} onChange={e=>setContent(e.target.value)} style={{flex:1,background:'transparent',color:'#e0e0e0',border:'none',padding:'20px',fontSize:'14px',lineHeight:'1.8',fontFamily:'system-ui',resize:'none',outline:'none'}} placeholder="Canvas is empty — create something above…"/>
              {canvasId&&<div style={{padding:'12px 16px',borderTop:'1px solid #1f1f2e',display:'flex',gap:'8px',background:'#1a1a2e'}}>
                <input value={editInstr} onChange={e=>setEditInstr(e.target.value)} placeholder="Edit instruction (e.g. 'make it more formal', 'add a conclusion')" style={{flex:1,background:'#0d0d1a',color:'#fff',border:'1px solid #333',borderRadius:'6px',padding:'8px',fontSize:'13px'}} onKeyDown={e=>{if(e.key==='Enter') edit();}}/>
                <button onClick={edit} disabled={loading||!editInstr.trim()} style={{padding:'8px 16px',background:'#6366f1',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:700,fontSize:'13px'}}>{loading?'…':'✏️ Edit'}</button>
              </div>}
            </div>
          </div>);
}

export function ForgeTab_forgeshop() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [query, setQuery] = React.useState('');
          const [budget, setBudget] = React.useState('');
          const [category, setCategory] = React.useState('General');
          const [loading, setLoading] = React.useState(false);
          const [results, setResults] = React.useState<any>(null);
          const CATS=['General','Electronics','Home & Kitchen','Fashion','Sports','Books','Tools','Health','Beauty','Toys'];
          const search=async()=>{
            if(!query.trim()) return; setLoading(true); setResults(null);
            const r=await fetch(`${API}/api/shop/search`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({query,budget:budget||undefined,category})});
            const d=await r.json(); setResults(d); setLoading(false);
          };
          return(<div style={{padding:'24px',maxWidth:'1000px',margin:'0 auto',fontFamily:'system-ui'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'20px'}}>
              <span style={{fontSize:'28px'}}>🛒</span>
              <div><div style={{fontSize:'22px',fontWeight:700}}>Smart Shopping</div><div style={{color:'#888',fontSize:'13px'}}>AI-powered product finder & comparison</div></div>
            </div>
            <div style={{background:'#1a1a2e',borderRadius:'12px',padding:'20px',border:'1px solid #333',marginBottom:'20px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:'10px',alignItems:'end'}}>
                <div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="What are you looking for? (e.g. noise cancelling headphones under $200)" style={{width:'100%',background:'#0d0d1a',color:'#fff',border:'1px solid #444',borderRadius:'8px',padding:'10px',fontSize:'14px',boxSizing:'border-box'}} onKeyDown={e=>{if(e.key==='Enter') search();}}/></div>
                <div><input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Budget $" style={{width:'100px',background:'#0d0d1a',color:'#fff',border:'1px solid #444',borderRadius:'8px',padding:'10px',fontSize:'14px'}}/></div>
                <div><select value={category} onChange={e=>setCategory(e.target.value)} style={{background:'#0d0d1a',color:'#fff',border:'1px solid #444',borderRadius:'8px',padding:'10px',fontSize:'14px'}}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
                <button onClick={search} disabled={loading||!query.trim()} style={{padding:'10px 20px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{loading?'Searching…':'🔍 Find'}</button>
              </div>
            </div>
            {results&&<div>
              {results.verdict&&<div style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.3)',borderRadius:'10px',padding:'14px 18px',marginBottom:'16px',color:'#c4b5fd',fontSize:'14px'}}>🏆 {results.verdict}</div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'14px',marginBottom:'20px'}}>
                {(results.products||[]).map((p:any,i:number)=><div key={i} style={{background:'#1a1a2e',borderRadius:'12px',padding:'16px',border:`1px solid ${p.best_pick?'#6366f1':'#333'}`,position:'relative'}}>
                  {p.best_pick&&<div style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',background:'#6366f1',color:'#fff',borderRadius:'20px',padding:'3px 12px',fontSize:'11px',fontWeight:700,whiteSpace:'nowrap'}}>⭐ Best Pick</div>}
                  <div style={{fontWeight:700,fontSize:'15px',marginBottom:'6px'}}>{p.name}</div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
                    <span style={{color:'#10b981',fontWeight:700,fontSize:'16px'}}>{p.price_estimate}</span>
                    <span style={{color:'#f59e0b'}}>{'★'.repeat(Math.floor(p.rating||4))} {p.rating}</span>
                  </div>
                  <div style={{fontSize:'12px',color:'#aaa',marginBottom:'8px'}}>{p.why_fits}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                    <div><div style={{fontSize:'11px',color:'#10b981',fontWeight:600,marginBottom:'3px'}}>PROS</div>{(p.pros||[]).map((x:string,j:number)=><div key={j} style={{fontSize:'11px',color:'#aaa'}}>✓ {x}</div>)}</div>
                    <div><div style={{fontSize:'11px',color:'#ef4444',fontWeight:600,marginBottom:'3px'}}>CONS</div>{(p.cons||[]).map((x:string,j:number)=><div key={j} style={{fontSize:'11px',color:'#aaa'}}>✗ {x}</div>)}</div>
                  </div>
                </div>)}
              </div>
              {results.buying_guide&&<div style={{background:'#1a1a2e',borderRadius:'10px',padding:'16px',border:'1px solid #333',color:'#ddd',fontSize:'14px',lineHeight:'1.7'}}><strong style={{color:'#a78bfa'}}>📖 Buying Guide: </strong>{results.buying_guide}</div>}
            </div>}
            {!results&&!loading&&<div style={{textAlign:'center',padding:'60px',color:'#555'}}><div style={{fontSize:'48px',marginBottom:'12px'}}>🛒</div><div>Describe what you\'re looking for and we\'ll find the best options</div></div>}
          </div>);
}

export function ForgeTab_forgememory() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [memories, setMemories] = React.useState<any[]>([]);
          const [key, setKey] = React.useState('');
          const [value, setValue] = React.useState('');
          const [cat, setCat] = React.useState('facts');
          const [loading, setLoading] = React.useState(false);
          const [editId, setEditId] = React.useState<string|null>(null);
          const CATS=['facts','preferences','skills','goals','context','work','personal'];
          const CAT_COLORS:Record<string,string>={facts:'#6366f1',preferences:'#f59e0b',skills:'#10b981',goals:'#8b5cf6',context:'#06b6d4',work:'#ef4444',personal:'#ec4899'};
          React.useEffect(()=>{ fetch(`${API}/api/memory`,{headers:{'Authorization':`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setMemories(d.memories||[])).catch(()=>{});},[]);
          const addMemory=async()=>{
            if(!key.trim()||!value.trim()) return; setLoading(true);
            const r=await fetch(`${API}/api/memory`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({key,value,category:cat})});
            const d=await r.json(); setMemories(p=>[d,...p]); setKey(''); setValue(''); setLoading(false);
          };
          const deleteMemory=async(id:string)=>{
            await fetch(`${API}/api/memory/${id}`,{method:'DELETE',headers:{'Authorization':`Bearer ${tok}`}});
            setMemories(p=>p.filter(m=>m.id!==id));
          };
          const grouped=CATS.reduce((acc:any,c)=>{acc[c]=memories.filter(m=>m.category===c);return acc;},{});
          return(<div style={{padding:'24px',maxWidth:'900px',margin:'0 auto',fontFamily:'system-ui'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'20px'}}>
              <span style={{fontSize:'28px'}}>🧠</span>
              <div><div style={{fontSize:'22px',fontWeight:700}}>Memory</div><div style={{color:'#888',fontSize:'13px'}}>Persistent context that Forge remembers across all conversations</div></div>
            </div>
            <div style={{background:'#1a1a2e',borderRadius:'12px',padding:'20px',border:'1px solid #333',marginBottom:'24px'}}>
              <div style={{fontSize:'14px',fontWeight:600,marginBottom:'12px'}}>Add Memory</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr auto',gap:'10px',alignItems:'end',marginBottom:'10px'}}>
                <input value={key} onChange={e=>setKey(e.target.value)} placeholder="Key (e.g. 'My name')" style={{background:'#0d0d1a',color:'#fff',border:'1px solid #444',borderRadius:'6px',padding:'8px',fontSize:'13px'}}/>
                <input value={value} onChange={e=>setValue(e.target.value)} placeholder="Value (e.g. 'Alex, a software engineer in San Francisco')" style={{background:'#0d0d1a',color:'#fff',border:'1px solid #444',borderRadius:'6px',padding:'8px',fontSize:'13px'}} onKeyDown={e=>{if(e.key==='Enter') addMemory();}}/>
                <button onClick={addMemory} disabled={loading||!key.trim()||!value.trim()} style={{padding:'8px 16px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontWeight:700,whiteSpace:'nowrap'}}>+ Add</button>
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:'4px 10px',background:cat===c?CAT_COLORS[c]:'#0d0d1a',color:'#fff',border:`1px solid ${cat===c?CAT_COLORS[c]:'#333'}`,borderRadius:'20px',cursor:'pointer',fontSize:'11px',textTransform:'capitalize'}}>{c}</button>)}
              </div>
            </div>
            <div style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',fontSize:'13px',color:'#a78bfa'}}>
              💡 <strong>{memories.length} memories</strong> stored — Forge injects this context into every conversation automatically.
            </div>
            {CATS.map(c=>grouped[c]?.length>0&&<div key={c} style={{marginBottom:'20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <div style={{width:'10px',height:'10px',borderRadius:'50%',background:CAT_COLORS[c]}}/>
                <div style={{fontSize:'13px',fontWeight:700,textTransform:'capitalize',color:CAT_COLORS[c]}}>{c} ({grouped[c].length})</div>
              </div>
              <div style={{display:'grid',gap:'8px'}}>
                {grouped[c].map((m:any)=><div key={m.id} style={{background:'#1a1a2e',borderRadius:'8px',padding:'12px 16px',border:'1px solid #2a2a3e',display:'grid',gridTemplateColumns:'1fr auto',gap:'12px',alignItems:'center'}}>
                  <div><span style={{color:CAT_COLORS[m.category]||'#6366f1',fontWeight:600,fontSize:'13px'}}>{m.key}: </span><span style={{color:'#ddd',fontSize:'13px'}}>{m.value}</span></div>
                  <button onClick={()=>deleteMemory(m.id)} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:'16px',padding:'0 4px'}} title="Delete">✕</button>
                </div>)}
              </div>
            </div>)}
            {memories.length===0&&<div style={{textAlign:'center',padding:'60px',color:'#555'}}><div style={{fontSize:'48px',marginBottom:'12px'}}>🧠</div><div>No memories yet. Add context about yourself to personalize Forge.</div></div>}
          </div>);
}

export function ForgeTab_toolhistory() {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('');
  React.useEffect(() => {
    fetch(`${BACKEND}/api/tool-history?limit=100`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const filtered = filter ? history.filter(h => h.tool_name.toLowerCase().includes(filter.toLowerCase())) : history;
  const clearAll = async () => { await fetch(`${BACKEND}/api/tool-history`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } }); setHistory([]); };
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 28 }}>📜</span>
        <div><div style={{ fontSize: 22, fontWeight: 700 }}>Tool History</div><div style={{ color: '#888', fontSize: 13 }}>Every tool run, saved automatically</div></div>
        <button onClick={clearAll} style={{ marginLeft: 'auto', padding: '6px 14px', background: '#ef444422', border: '1px solid #ef444444', borderRadius: 8, color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Clear All</button>
      </div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by tool name…" style={{ width: '100%', padding: '10px 14px', background: '#1a1a2e', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }} />
      {loading && <div style={{ textAlign: 'center', color: '#555', padding: 40 }}>Loading…</div>}
      {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', color: '#555', padding: 60 }}><div style={{ fontSize: 48, marginBottom: 12 }}>📜</div><div>No tool runs yet. Use any tool and it will appear here.</div></div>}
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((h: any) => (
          <div key={h.id} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: '#6366f1', fontSize: 14 }}>{h.tool_name}</span>
              <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>{new Date(utcStamp(h.created_at)).toLocaleString()}</span>
            </div>
            {h.output && <div style={{ fontSize: 12, color: '#aaa', background: '#0d0d1a', borderRadius: 8, padding: '8px 12px', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'hidden' }}>{h.output.slice(0, 300)}{h.output.length > 300 ? '…' : ''}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
