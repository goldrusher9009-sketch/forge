'use client';

import React, { useEffect, useRef, useState } from 'react';

export type ApptopiaListing = {
  agentId: string;
  state: 'NOT_IMPORTED' | 'DRAFT' | 'IN_REVIEW' | 'LIVE' | 'REJECTED' | 'RETIRED' | 'SUSPENDED';
  slug: string | null; name: string | null; version: string | null;
  price: { model: string; amountCents: number; currency: string } | null;
  runtime: { version: number; connection: string | null } | null;
  reviewNote: string | null;
  releaseUpdate: { status: string; version: string | null } | null;
  retirement: { serviceEndsAt: string; reason: string } | null;
  sales: { orders: number; grossCents: number; currency: string } | null;
  updatedAt: string | null;
};

const STATE_LABELS: Record<ApptopiaListing['state'], { label: string; hint: string; color: string }> = {
  NOT_IMPORTED: { label: 'Not on Apptopia yet', hint: 'Prepare a product draft below to start.', color: 'var(--fg-text3)' },
  DRAFT: { label: 'Draft on Apptopia', hint: 'Finish pricing and delivery on Apptopia, then submit it for review.', color: 'var(--fg-text2)' },
  IN_REVIEW: { label: 'In review', hint: 'Apptopia is checking the listing. You will see the outcome here.', color: '#f0c674' },
  LIVE: { label: 'Live', hint: 'Buyers can purchase this agent.', color: '#8ce99a' },
  REJECTED: { label: 'Changes requested', hint: 'Review the note, update the draft on Apptopia and resubmit.', color: '#ff9f8a' },
  RETIRED: { label: 'Retired', hint: 'Sales have stopped; existing buyers are served until the service end.', color: 'var(--fg-text3)' },
  SUSPENDED: { label: 'Suspended', hint: 'Apptopia paused this listing. Contact marketplace support.', color: '#ff9f8a' },
};

export function formatListingMoney(amountCents: number, currency: string) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountCents / 100); }
  catch { return `${(amountCents / 100).toFixed(2)} ${currency}`; }
}

export function ApptopiaListingStatus({ listing, storefront, error }: { listing: ApptopiaListing | null | undefined; storefront: string | null; error: string }) {
  if (listing === undefined && !error) return <p style={{ color: 'var(--fg-text3)', marginTop: 14 }}>Checking Apptopia…</p>;
  if (error) return <p role="status" style={{ color: 'var(--fg-text3)', marginTop: 14 }}>{error}</p>;
  if (!listing) return null;
  const meta = STATE_LABELS[listing.state];
  const priceLabel = listing.price ? `${formatListingMoney(listing.price.amountCents, listing.price.currency)}${listing.price.model === 'subscription' || listing.price.model === 'SUBSCRIPTION' ? ' / month' : listing.price.model === 'usage' || listing.price.model === 'USAGE' ? ' per task' : ''}` : null;
  const link = storefront && listing.slug && (listing.state === 'LIVE' || listing.state === 'RETIRED') ? `${storefront}/agents/${listing.slug}` : null;
  return <section aria-label="Apptopia listing status" data-listing-state={listing.state} style={{ marginTop: 14, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--fg-border)', background: 'var(--fg-bg)', display: 'grid', gap: 6 }}>
    <p style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <strong style={{ color: meta.color }}>{meta.label}</strong>
      {listing.name && listing.state !== 'NOT_IMPORTED' && <span style={{ color: 'var(--fg-text2)' }}>{listing.name}{listing.version ? ` · v${listing.version}` : ''}</span>}
      {priceLabel && listing.state !== 'NOT_IMPORTED' && <span style={{ color: 'var(--fg-text2)' }}>{priceLabel}</span>}
    </p>
    <p style={{ color: 'var(--fg-text3)', lineHeight: 1.6 }}>{meta.hint}</p>
    {listing.sales && <p style={{ color: 'var(--fg-text2)' }}>{listing.sales.orders === 0 ? 'No sales yet.' : `${listing.sales.orders} ${listing.sales.orders === 1 ? 'order' : 'orders'} · ${formatListingMoney(listing.sales.grossCents, listing.sales.currency)} gross`}</p>}
    {listing.reviewNote && <p style={{ color: '#ff9f8a', lineHeight: 1.6 }}>Reviewer note: {listing.reviewNote}</p>}
    {listing.releaseUpdate && <p style={{ color: 'var(--fg-text2)' }}>Release update v{listing.releaseUpdate.version || '?'} is {listing.releaseUpdate.status.toLowerCase().replace('_', ' ')}.</p>}
    {listing.retirement && <p style={{ color: 'var(--fg-text2)', lineHeight: 1.6 }}>Service ends {new Date(listing.retirement.serviceEndsAt).toLocaleDateString()} · {listing.retirement.reason}</p>}
    {listing.runtime && <p style={{ color: 'var(--fg-text3)' }}>Runtime: Forge version {listing.runtime.version} · connection {listing.runtime.connection ? listing.runtime.connection.toLowerCase() : 'not activated'}</p>}
    {link && <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--fg-orange2)' }}>Open the storefront page ↗</a>}
  </section>;
}

/** One status request for a whole agent list; children render per agent with the shared answer. */
export function ApptopiaListings({ apiBase, token, agentIds, children }: { apiBase: string; token: string; agentIds: string[]; children: (lookup: (agentId: string) => ApptopiaListing | null, storefront: string | null, loaded: boolean) => React.ReactNode }) {
  const [rows, setRows] = useState<ApptopiaListing[]>([]);
  const [storefront, setStorefront] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const key = agentIds.join(',');
  useEffect(() => {
    if (!key) { setRows([]); setLoaded(true); return; }
    const controller = new AbortController();
    fetch(`${apiBase}/workspace/apptopia-listings?agentIds=${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (response.ok && data?.success) { setRows(data.data.listings || []); setStorefront(data.data.storefront || null); }
        setLoaded(true);
      }).catch(() => { if (!controller.signal.aborted) setLoaded(true); });
    return () => controller.abort();
  }, [apiBase, token, key]);
  return <>{children(id => rows.find(row => row.agentId === id) || null, storefront, loaded)}</>;
}

/** Compact badge for agent lists: state, sales and a storefront link when live. */
export function ApptopiaListingBadge({ listing, storefront }: { listing: ApptopiaListing | null; storefront: string | null }) {
  if (!listing || listing.state === 'NOT_IMPORTED') return null;
  const meta = STATE_LABELS[listing.state];
  const link = storefront && listing.slug && (listing.state === 'LIVE' || listing.state === 'RETIRED') ? `${storefront}/agents/${listing.slug}` : null;
  const sales = listing.sales && listing.sales.orders > 0 ? ` · ${listing.sales.orders} sold · ${formatListingMoney(listing.sales.grossCents, listing.sales.currency)}` : '';
  const body = <span data-listing-state={listing.state} title={listing.reviewNote ? `Reviewer note: ${listing.reviewNote}` : meta.hint} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, border: `1px solid ${meta.color}`, color: meta.color, whiteSpace: 'nowrap' }}>Apptopia: {meta.label}{sales}</span>;
  return link ? <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>{body}</a> : body;
}

export function ApptopiaPublishButton({ agentId, apiBase, token, zh = false }: { agentId: string; apiBase: string; token: string; zh?: boolean }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [destination, setDestination] = useState('');
  const [hosted, setHosted] = useState(false);
  const [releases, setReleases] = useState<Array<{ id: string; version: number }>>([]);
  const [releaseId, setReleaseId] = useState('');
  const [maximumUsdPerRun, setMaximum] = useState('0.10');
  const [dailyBudgetUsd, setDaily] = useState('5.00');
  const [shareReleaseSources, setShareSources] = useState(false);
  const [acceptCreatorCosts, setAcceptCosts] = useState(false);
  const [publications, setPublications] = useState<Array<{ id: string; version: number; revoked: boolean; productId: string | null }>>([]);
  const [listing, setListing] = useState<ApptopiaListing | null | undefined>(undefined);
  const [storefront, setStorefront] = useState<string | null>(null);
  const [listingError, setListingError] = useState('');
  const grantKey = useRef('');
  const invalidate = () => { setDestination(''); grantKey.current = ''; };
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    Promise.all([
      fetch(`${apiBase}/workspace-agents/${encodeURIComponent(agentId)}/lifecycle`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
      fetch(`${apiBase}/workspace/agents/${encodeURIComponent(agentId)}/apptopia-runtime`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }),
    ]).then(async responses => {
      if (responses.some(response => !response.ok)) throw new Error('Could not load published versions and runtime authorizations.');
      const [lifecycle, runtime] = await Promise.all(responses.map(response => response.json()));
      if (controller.signal.aborted) return;
      setReleases(lifecycle.data.releases || []); setPublications(runtime.data || []);
      setReleaseId(previous => previous || lifecycle.data.releases?.[0]?.id || '');
    }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, [open, agentId, apiBase, token]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setListingError('');
    fetch(`${apiBase}/workspace/apptopia-listings?agentIds=${encodeURIComponent(agentId)}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (response.status === 503) { setListing(null); return; }
        if (!response.ok || !data?.success) throw new Error('Apptopia did not answer; the marketplace status is unknown right now.');
        setStorefront(data.data.storefront || null);
        setListing((data.data.listings as ApptopiaListing[]).find(row => row.agentId === agentId) || null);
      }).catch(reason => { if (!controller.signal.aborted) { setListing(null); setListingError(reason.message); } });
    return () => controller.abort();
  }, [open, agentId, apiBase, token, destination]);
  async function revoke(id: string) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`${apiBase}/workspace/apptopia-runtime/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not revoke the runtime authorization.');
      setPublications(rows => rows.map(row => row.id === id ? { ...row, revoked: true } : row)); invalidate();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not revoke authorization.'); }
    finally { setBusy(false); }
  }
  async function prepare() {
    setBusy(true); setError(''); setDestination('');
    try {
      let publicationId: string | undefined;
      if (hosted) {
        grantKey.current ||= crypto.randomUUID();
        const grantResponse = await fetch(`${apiBase}/workspace/agents/${encodeURIComponent(agentId)}/apptopia-runtime`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': grantKey.current },
          body: JSON.stringify({ releaseId, policy: { maximumUsdPerRun: Number(maximumUsdPerRun), dailyBudgetUsd: Number(dailyBudgetUsd), maximumConcurrentRuns: 1, shareReleaseSources, acceptCreatorCosts } }),
        });
        const grant = await grantResponse.json();
        if (!grantResponse.ok || !grant.success) {
          const messages: Record<string, string> = {
            MARKETPLACE_SOURCE_CONSENT_REQUIRED: 'This release uses attached sources. Authorize those specific files for buyer requests to continue.',
            MARKETPLACE_TOOL_ADAPTER_REQUIRED: 'This release uses tools that do not have a marketplace execution adapter yet. Its behavior will not be silently reduced.',
            MARKETPLACE_POLICY_INVALID: 'Choose a per-task cap from $0.01 to $25 and a daily cap from the per-task amount up to $1,000.',
          };
          throw new Error(messages[grant.error] || grant.error || 'Could not authorize runtime.');
        }
        publicationId = grant.data.id;
        setPublications(rows => rows.some(row => row.id === grant.data.id) ? rows : [grant.data, ...rows]);
      }
      const response = await fetch(`${apiBase}/workspace/agents/${encodeURIComponent(agentId)}/apptopia-publish`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ summary, publicationId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error === 'APPTOPIA_PUBLISH_NOT_CONFIGURED' ? 'Marketplace publishing is not configured on this Forge server yet.' : data.error || 'Could not prepare publication.');
      setDestination(data.data.url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not prepare publication.'); }
    finally { setBusy(false); }
  }
  return <div style={{ fontSize: 12 }}>
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ padding: '7px 10px', border: '1px solid var(--fg-border)', borderRadius: 6, color: 'var(--fg-text2)', background: 'var(--fg-bg3)', cursor: 'pointer' }}>{zh ? '发布到 Apptopia ↗' : 'Publish to Apptopia ↗'}</button>
    {open && <div style={{ position: 'fixed', inset: 0, background: '#0009', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 24 }}>
      <div role="dialog" aria-modal="true" aria-label="Publish to Apptopia" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28, borderRadius: 14, background: 'var(--fg-bg3)', border: '1px solid var(--fg-border)', color: 'var(--fg-text)' }}>
        <h3 style={{ fontSize: 20, margin: '0 0 12px' }}>Meet your next customer.</h3>
        <p style={{ color: 'var(--fg-text2)', lineHeight: 1.7 }}>Describe what this agent does. Apptopia opens a private product draft where you choose pricing and delivery before review. Your prompts and credentials are not copied into the marketplace listing.</p>
        <ApptopiaListingStatus listing={listing} storefront={storefront} error={listingError} />
        <label style={{ display: 'block', marginTop: 18 }}>Public description<textarea autoFocus maxLength={280} minLength={20} value={summary} onChange={event => { setSummary(event.target.value); setDestination(''); }} placeholder="What useful result will this agent deliver?" style={{ width: '100%', minHeight: 100, padding: 12, marginTop: 8, borderRadius: 7, background: 'var(--fg-bg)', color: 'var(--fg-text)', border: '1px solid var(--fg-border)' }} /></label>
        <p style={{ color: 'var(--fg-text3)' }}>{summary.trim().length}/280 · at least 20 characters</p>
        <label style={{ display: 'block', margin: '16px 0' }}><input type="checkbox" checked={hosted} disabled={busy} onChange={event => { setHosted(event.target.checked); invalidate(); }} /> Authorize a fixed Forge version to run for buyers</label>
        {hosted && <fieldset disabled={busy} style={{ border: '1px solid var(--fg-border)', padding: 16, borderRadius: 8, display: 'grid', gap: 14 }}>
          <legend>Runtime authorization</legend>
          {releases.length ? <label>Published version <select value={releaseId} onChange={event => { setReleaseId(event.target.value); invalidate(); }} style={{ color: 'var(--fg-text)', background: 'var(--fg-bg)', padding: 8 }}>{releases.map(release => <option key={release.id} value={release.id}>Version {release.version}</option>)}</select></label>
            : <p>Evaluate this agent and publish a version in its release panel first.</p>}
          <label>Maximum Forge charge per task (USD)<input type="number" min="0.01" max="25" step="0.01" value={maximumUsdPerRun} onChange={event => { setMaximum(event.target.value); invalidate(); }} style={{ display: 'block', marginTop: 6, padding: 8, background: 'var(--fg-bg)', color: 'var(--fg-text)' }} /></label>
          <label>Daily budget for this publication (USD, resets at 00:00 UTC)<input type="number" min={maximumUsdPerRun} max="1000" step="0.01" value={dailyBudgetUsd} onChange={event => { setDaily(event.target.value); invalidate(); }} style={{ display: 'block', marginTop: 6, padding: 8, background: 'var(--fg-bg)', color: 'var(--fg-text)' }} /></label>
          <label><input type="checkbox" checked={shareReleaseSources} onChange={event => { setShareSources(event.target.checked); invalidate(); }} /> Allow buyer requests to use the files attached to this published version.</label>
          <label><input type="checkbox" checked={acceptCreatorCosts} onChange={event => { setAcceptCosts(event.target.checked); invalidate(); }} /> I authorize Forge charges to my account within these caps. Unconfirmed costs keep their budget reserved.</label>
          <p style={{ color: 'var(--fg-text2)', lineHeight: 1.6 }}>One task can run at a time for this publication. Personal conversations, Brain memory and unrelated files are excluded. Apptopia must activate the connection and review the product before buyers can use it.</p>
        </fieldset>}
        {publications.some(row => !row.revoked) && <div style={{ marginTop: 16 }}><p>Existing runtime authorizations</p>{publications.filter(row => !row.revoked).map(row => <p key={row.id} style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}><span>Version {row.version} · {row.productId ? 'Linked to a product' : 'Awaiting marketplace activation'}</span><button type="button" disabled={busy} onClick={() => revoke(row.id)} style={{ color: 'var(--fg-orange2)' }}>Revoke</button></p>)}</div>}
        {error && <p role="alert" style={{ color: '#ff9f8a', marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 15 }}><button type="button" onClick={() => { setOpen(false); setDestination(''); }} style={{ color: 'var(--fg-text2)' }}>Close</button>{destination ? <a href={destination} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--fg-orange2)' }}>Continue to Apptopia ↗</a> : <button type="button" disabled={busy || summary.trim().length < 20 || (hosted && (!releaseId || !acceptCreatorCosts))} onClick={prepare} style={{ color: 'var(--fg-orange2)', opacity: busy || summary.trim().length < 20 ? .5 : 1 }}>{busy ? 'Preparing…' : 'Prepare product draft →'}</button>}</div>
      </div>
    </div>}
  </div>;
}
