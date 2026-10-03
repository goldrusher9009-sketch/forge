'use client';
import React from 'react';
import { PaymentReversalReview } from './PaymentReversalReview';

type Fetcher = (path: string, opts?: RequestInit, token?: string) => Promise<any>;
type Props = { token: string; apiFetch: Fetcher };

const card: React.CSSProperties = { background: 'var(--fg-bg3)', border: '1px solid var(--fg-border)', borderRadius: 12, padding: 16, marginBottom: 12 };
const mono: React.CSSProperties = { fontFamily: 'var(--fg-font-mono)', fontSize: 12, color: 'var(--fg-text2)', wordBreak: 'break-all' };
const button = (accent = false): React.CSSProperties => ({ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
  background: accent ? 'var(--fg-orange2)' : 'var(--fg-bg4)', color: accent ? '#111' : 'var(--fg-text)', border: '1px solid var(--fg-border2)' });
const usd = (value: number | null | undefined) => value == null ? '—' : `$${Number(value).toFixed(4)}`;

/** Payment review queue. Every action needs written evidence and is recorded
 * against the signed-in admin; nothing here can charge above a customer's ceiling. */
export function AdminBillingOps({ token, apiFetch }: Props) {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [evidence, setEvidence] = React.useState<Record<string, string>>({});
  const load = React.useCallback(async () => {
    setError('');
    try { const r = await apiFetch('/admin/billing/operations', {}, token); setData(r?.data || null); }
    catch (e: any) { setError(e?.message || 'Failed to load'); }
  }, [apiFetch, token]);
  React.useEffect(() => { load(); }, [load]);
  const act = async (key: string, path: string, body: Record<string, unknown>) => {
    const text = (evidence[key] || '').trim();
    if (text.length < 8) { setError('Write at least a short sentence of evidence before deciding.'); return; }
    setBusy(key); setError('');
    try { await apiFetch(path, { method: 'POST', body: JSON.stringify({ ...body, evidence: text }) }, token); setEvidence(v => ({ ...v, [key]: '' })); await load(); }
    catch (e: any) { setError(e?.message || 'Action failed'); }
    finally { setBusy(''); }
  };
  const field = (key: string, placeholder: string) => (
    <input value={evidence[key] || ''} onChange={e => setEvidence(v => ({ ...v, [key]: e.target.value }))} placeholder={placeholder}
      style={{ flex: 1, minWidth: 220, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--fg-border2)', background: 'var(--fg-bg)', color: 'var(--fg-text)', fontSize: 12 }} />
  );
  if (!data && !error) return <p style={{ color: 'var(--fg-text3)', fontSize: 13 }}>Loading review queue…</p>;
  const holds = data?.holds || [], circuits = data?.circuits || [], reviews = data?.reviewRequests || [], stale = data?.staleUnknownRequests || [], decisions = data?.recentDecisions || [];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={load} style={button()}>↻ Refresh</button>
        <span style={{ fontSize: 13, color: data?.openItems ? 'var(--fg-orange2)' : 'var(--fg-green)' }}>
          {data?.openItems ? `${data.openItems} item${data.openItems === 1 ? '' : 's'} need a decision` : 'Nothing waiting for review'}
        </span>
      </div>
      {error && <div style={{ ...card, borderColor: 'var(--fg-orange2)', color: 'var(--fg-orange2)', fontSize: 13 }}>{error}</div>}
      {notice && <p role="status" style={{...card,fontSize:13,overflowWrap:'anywhere'}}>{notice}</p>}

      <h3 style={{ fontSize: 14, margin: '8px 0' }}>Payment holds ({holds.length})</h3>
      <p style={{ fontSize: 12, color: 'var(--fg-text3)', margin: '0 0 8px' }}>A refund or dispute froze new spending for these accounts. Resolve only after checking the Stripe case.</p>
      {holds.length === 0 && <p style={{ fontSize: 12, color: 'var(--fg-text3)' }}>No active holds.</p>}
      {holds.map((h: any) => (
        <div key={h.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{h.kind.replace('_', ' ')} · user {h.userId}</div>
              <div style={mono}>{h.providerObjectId} · {h.createdAt}</div>
              <div style={mono}>{h.evidence?.eventType} {h.evidence?.amountRefundedCents != null ? `refunded ${(h.evidence.amountRefundedCents / 100).toFixed(2)} ${h.evidence.currency || ''}` : ''}{h.evidence?.disputedAmountCents != null ? `disputed ${(h.evidence.disputedAmountCents / 100).toFixed(2)} ${h.evidence.currency || ''}` : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {field(`hold:${h.id}`, 'Evidence, e.g. "Stripe dispute won on 2026-09-18, case dp_..."')}
            <button disabled={busy === `hold:${h.id}`} onClick={() => act(`hold:${h.id}`, `/admin/billing/holds/${encodeURIComponent(h.id)}/resolve`, {})} style={button()}>Verify won dispute & release</button>
          </div>
          <PaymentReversalReview holdId={h.id} token={token} apiFetch={apiFetch} onComplete={message=>{setNotice(message);void load();}} />
        </div>
      ))}

      <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>Requests awaiting review ({reviews.length})</h3>
      <p style={{ fontSize: 12, color: 'var(--fg-text3)', margin: '0 0 8px' }}>The supplier billed more than the customer's approved ceiling. Charge the ceiling (customer pays what they approved) or waive (Forge absorbs it).</p>
      {reviews.length === 0 && <p style={{ fontSize: 12, color: 'var(--fg-text3)' }}>No requests waiting.</p>}
      {reviews.map((r: any) => (
        <div key={r.requestId} style={card}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.model} · user {r.userId}</div>
          <div style={mono}>{r.requestId} · {r.createdAt}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Approved ceiling {usd(r.reservedUsd)} · supplier cost {usd(r.providerCostUsd)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {field(`req:${r.requestId}`, 'Evidence, e.g. "Supplier price changed; tariff updated"')}
            <button disabled={busy === `req:${r.requestId}`} onClick={() => act(`req:${r.requestId}`, `/admin/billing/requests/${encodeURIComponent(r.requestId)}/review`, { decision: 'charge_ceiling' })} style={button(true)}>Charge ceiling</button>
            <button disabled={busy === `req:${r.requestId}`} onClick={() => act(`req:${r.requestId}`, `/admin/billing/requests/${encodeURIComponent(r.requestId)}/review`, { decision: 'waive' })} style={button()}>Waive</button>
          </div>
        </div>
      ))}

      <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>Paused models ({circuits.length})</h3>
      <p style={{ fontSize: 12, color: 'var(--fg-text3)', margin: '0 0 8px' }}>A model is paused for everyone after an overrun. Resolve its requests first, verify the price, then reopen it.</p>
      {circuits.length === 0 && <p style={{ fontSize: 12, color: 'var(--fg-text3)' }}>All models open.</p>}
      {circuits.map((c: any) => (
        <div key={c.model} style={card}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.model}</div>
          <div style={mono}>{c.reason} · first request {c.requestId} · {c.createdAt}</div>
          <div style={{ fontSize: 12, marginTop: 4, color: c.unresolvedRequests ? 'var(--fg-orange2)' : 'var(--fg-green)' }}>{c.unresolvedRequests ? `${c.unresolvedRequests} request(s) still waiting above` : 'Ready to reopen'}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {field(`circuit:${c.model}`, 'Evidence, e.g. "Catalogue price verified against supplier on 2026-09-18"')}
            <button disabled={busy === `circuit:${c.model}` || !!c.unresolvedRequests} onClick={() => act(`circuit:${c.model}`, '/admin/billing/circuits/clear', { model: c.model })} style={button(true)}>Reopen model</button>
          </div>
        </div>
      ))}

      {stale.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>Stale unknown usage ({stale.length})</h3>
          <p style={{ fontSize: 12, color: 'var(--fg-text3)', margin: '0 0 8px' }}>No supplier receipt for over six hours. Reconcile these from the supplier dashboard via the accounting endpoint.</p>
          {stale.map((r: any) => <div key={r.requestId} style={card}><div style={{ fontSize: 13 }}>{r.model} · user {r.userId}</div><div style={mono}>{r.requestId} · held {usd(r.reservedUsd)} · {r.updatedAt}</div></div>)}
        </>
      )}

      <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>Recent decisions</h3>
      {decisions.length === 0 && <p style={{ fontSize: 12, color: 'var(--fg-text3)' }}>No decisions recorded yet.</p>}
      {decisions.map((d: any) => (
        <div key={d.id} style={{ ...card, padding: '10px 14px' }}>
          <div style={{ fontSize: 12 }}><b>{d.decision}</b> · {d.kind} {d.subject} · by {d.actor} · {d.createdAt}</div>
          <div style={{ ...mono, marginTop: 2 }}>{d.evidence}</div>
        </div>
      ))}
    </div>
  );
}
