'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Api = (path: string, opts?: RequestInit, token?: string) => Promise<any>;
type Change = { id: string; previewId: string; fromPlan: string; toPlan: string; status: string; effectiveAt: string; monthlyUsd: number; includedUsd: number; canWithdraw: boolean; retryable: boolean };
type Preview = { previewId: string; fromPlan: string; toPlan: string; effectiveAt: string; expiresAt: string; monthlyUsd: number; includedUsd: number; chargeNowUsd: number; effectiveAfterPayment: boolean };
type Status = { enabled: boolean; hasSubscription: boolean; providerPlan?: string; cancelAtPeriodEnd?: boolean; change: Change | null };
type Props = { user: { id: string; token: string }; api: Api; language: 'en' | 'zh'; accountMatches: boolean; spendingRestricted: boolean; onRefresh: () => void };

export function SubscriptionPlanChangePanel({ user, api, language, accountMatches, spendingRestricted, onRefresh }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [target, setTarget] = useState('pro');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const epoch = useRef(0);
  const en = language === 'en';
  const tr = (english: string, chinese: string) => en ? english : chinese;
  const date = (value: string) => new Date(value).toLocaleString(en ? 'en-US' : 'zh-CN');
  const dollars = (value: number) => new Intl.NumberFormat(en ? 'en-US' : 'zh-CN', { style: 'currency', currency: 'USD' }).format(value);
  const name = (plan: string) => plan[0]?.toUpperCase() + plan.slice(1);
  const active = status?.change && ['preparing', 'scheduled', 'withdrawing', 'review_required'].includes(status.change.status) ? status.change : null;
  const load = useCallback(async () => {
    const revision = epoch.current;
    const result = await api('/billing/plan-change', { signal: AbortSignal.timeout(45000) }, user.token);
    if (revision !== epoch.current) return;
    const data = result?.data;
    if (!data || typeof data.enabled !== 'boolean') throw new Error('PLAN_CHANGE_UNAVAILABLE');
    setStatus(data);
    return data as Status;
  }, [api, user.token]);
  useEffect(() => {
    const revision = ++epoch.current;
    setStatus(null); setPreview(null); setConfirmWithdraw(false); setError(null); setNotice(null); setBusy(false);
    if (accountMatches) void load().catch(() => { if (revision === epoch.current) setError('PLAN_CHANGE_UNAVAILABLE'); });
    return () => { epoch.current++; };
  }, [load, accountMatches, user.id]);
  const run = async (action: 'preview' | 'apply' | 'withdraw', value: string) => {
    if (busy || !accountMatches || (action !== 'withdraw' && (spendingRestricted || !status?.enabled))) return;
    const revision = epoch.current;
    setBusy(true); setError(null); setNotice(null);
    try {
      const profile = await api('/profile', { signal: AbortSignal.timeout(12000) }, user.token);
      if (revision !== epoch.current || profile?.data?.id !== user.id) throw new Error('BILLING_ACCOUNT_MISMATCH');
      const key = action === 'preview' ? 'plan' : action === 'apply' ? 'previewId' : 'changeId';
      const result = await api(`/billing/plan-change/${action}`, { method: 'POST', body: JSON.stringify({ [key]: value }) }, user.token);
      if (revision !== epoch.current) return;
      const data = result?.data;
      if (action === 'preview') {
        if (!data?.previewId || data.chargeNowUsd !== 0 || data.effectiveAfterPayment !== true || !Number.isFinite(data.monthlyUsd)
          || !Number.isFinite(data.includedUsd) || !Number.isFinite(Date.parse(data.effectiveAt))) throw new Error('PLAN_CHANGE_UNAVAILABLE');
        setPreview(data);
      } else {
        setPreview(null); setConfirmWithdraw(false);
        setNotice(action === 'withdraw' ? data?.status === 'applied' ? 'applied' : 'withdrawn' : 'scheduled');
        await load(); onRefresh();
      }
    } catch (failure) {
      if (revision !== epoch.current) return;
      const code = failure instanceof Error ? failure.message : 'PLAN_CHANGE_UNAVAILABLE';
      if (['PLAN_CHANGE_PREVIEW_EXPIRED', 'PLAN_CHANGE_PREVIEW_STALE'].includes(code)) setPreview(null);
      try { await load(); } catch {}
      if (revision === epoch.current) setError(code);
    } finally { if (revision === epoch.current) setBusy(false); }
  };
  if (!accountMatches) return null;
  const copy: Record<string, [string, string]> = {
    PLAN_CHANGE_PREVIEW_EXPIRED: ['This preview expired. Review the change again before confirming.', '预览已过期，请重新核对套餐变更后确认。'],
    PLAN_CHANGE_PREVIEW_STALE: ['Your billing cycle or price changed. Refresh and review the new details.', '账期或价格已变化，请刷新并重新核对。'],
    PLAN_CHANGE_BUSY: ['A change is still being processed. Refresh its status before trying again.', '变更正在处理，请先刷新状态，避免重复操作。'],
    PLAN_CHANGE_ALREADY_PENDING: ['You already have a pending change. Withdraw it before choosing another plan.', '已有待生效的变更，请先撤回再选择其他套餐。'],
    PLAN_CHANGE_PAYMENT_NOT_CONFIRMED: ['Your current paid period needs to be confirmed before changing plans.', '需要先确认当前账期已经付清，才能变更套餐。'],
    PLAN_CHANGE_SUBSCRIPTION_INELIGIBLE: ['Resolve pending payment, cancellation or paused billing before scheduling a change.', '请先处理待确认付款、取消续费或暂停计费状态，再安排变更。'],
    PLAN_CHANGE_RENEWAL_IN_PROGRESS: ['Your subscription is about to renew. Refresh after renewal to schedule the following cycle.', '当前账期即将续费，请在续费完成后安排下一账期变更。'],
    PLAN_CHANGE_WITHDRAWAL_UNCONFIRMED: ['Withdrawal has not been confirmed. Your change is preserved; refresh and retry.', '暂未确认撤回成功，变更记录仍保留，请刷新后重试。'],
    PLAN_CHANGE_CONFIRMATION_PENDING: ['The change has not been confirmed yet. Recover or withdraw the existing request below.', '变更尚未确认，请在下方恢复或撤回原请求。'],
    PLAN_CHANGE_RECONCILIATION_REQUIRED: ['This change needs reconciliation. Contact support before making another change.', '此变更需要对账，请联系支持团队后再操作。'],
    PLAN_CHANGE_EXTERNAL_SCHEDULE: ['This subscription has a separate billing schedule. Contact support to change it.', '此订阅已有其他计费安排，请联系支持团队处理。'],
    PLAN_CHANGE_CUSTOM_BILLING_UNSUPPORTED: ['This subscription has custom billing terms. Contact support to change plans.', '此订阅有自定义计费条款，请联系支持团队变更。'],
    BILLING_ACCOUNT_MISMATCH: ['Your signed-in account changed. Refresh before continuing.', '登录账号已变化，请刷新后继续。'],
    BILLING_ACCOUNT_REVIEW_REQUIRED: ['Purchases are paused during payment review. You can still withdraw a pending change.', '付款核对期间暂停新的购买，但仍可撤回待生效变更。'],
  };
  return <div className="billing-notice" style={{ marginTop: 16 }} aria-label={tr('Next-cycle plan change', '下账期套餐变更')}>
    <h3>{tr('Change your next billing cycle', '调整下一个账期')}</h3>
    <p>{tr('Your current paid allowance keeps its original expiry. New monthly credit is added only after the next invoice is paid. For more credit today, use a top-up.', '当前已付费额度保留原到期时间。下一期账单付清后才发放新套餐额度；本月需要更多额度时，可以单独充值。')}</p>
    {error && <p role="alert" style={{ marginTop: 10 }}>{copy[error]?.[en ? 0 : 1] ?? tr('Plan changes are temporarily unavailable. Refresh or contact support; no change is confirmed.', '套餐变更暂时不可用，请刷新或联系支持团队；尚未确认变更成功。')}</p>}
    {notice && <p role="status" style={{ marginTop: 10 }}>{notice === 'withdrawn' ? tr('Change withdrawn. Your current subscription continues; renewal has not been cancelled.', '变更已撤回，当前订阅继续生效；这不会取消续费。') : notice === 'applied' ? tr('The new cycle had already started. The current plan is preserved; subscription management is available.', '新账期已开始，当前套餐保留，现在可以管理订阅。') : tr('Next-cycle change confirmed. No payment was taken today.', '下账期变更已确认，今天不会扣款。')}</p>}
    {active ? <>
      <p style={{ marginTop: 12 }}><strong>{name(active.fromPlan)} → {name(active.toPlan)}</strong> · {dollars(active.monthlyUsd)} / {tr('month', '月')} · {tr('from', '生效时间')} {date(active.effectiveAt)}</p>
      <p>{active.status === 'preparing' ? tr('Confirmation is incomplete. Recover the original request or withdraw it.', '变更尚未确认，可以恢复原请求或撤回。') : active.status === 'withdrawing' ? tr('Withdrawal is being verified. Retry to check the original request.', '正在核对撤回结果，重试时会核对原请求。') : tr('To cancel renewal, withdraw this pending change first, then use Manage subscription.', '如需取消续费，请先撤回此变更，再使用“管理订阅”。')}</p>
      <div className="forge-billing-actions" style={{ marginTop: 12 }}>
        {confirmWithdraw ? <>
          <p>{tr('Withdraw this change and keep your existing subscription?', '撤回此变更并保留现有订阅？')}</p>
          <button disabled={busy} onClick={() => void run('withdraw', active.id)}>{tr('Confirm withdrawal', '确认撤回')}</button>
          <button disabled={busy} onClick={() => setConfirmWithdraw(false)}>{tr('Keep change', '保留变更')}</button>
        </> : <>
          {active.retryable && status?.enabled && <button disabled={busy || spendingRestricted} onClick={() => void run('apply', active.previewId)}>{tr('Recover change', '恢复变更')}</button>}
          {active.canWithdraw && <button disabled={busy} onClick={() => setConfirmWithdraw(true)}>{tr('Withdraw pending change', '撤回待生效变更')}</button>}
        </>}
      </div>
    </> : preview ? <div style={{ marginTop: 14 }}>
      <p><strong>{name(preview.fromPlan)} → {name(preview.toPlan)}</strong></p>
      <p>{tr(`From ${date(preview.effectiveAt)}, renew at ${dollars(preview.monthlyUsd)} per month until cancelled, with ${dollars(preview.includedUsd)} of Forge credit each paid month. No charge today.`, `自 ${date(preview.effectiveAt)} 起，按每月 ${dollars(preview.monthlyUsd)} 续费，直至取消；每个付费月包含 ${dollars(preview.includedUsd)} Forge 额度。今天不扣款。`)}</p>
      <p>{tr('You can withdraw before the change takes effect. Withdrawing a change does not cancel your subscription.', '生效前可撤回变更。撤回变更不会取消订阅。')}</p>
      <div className="forge-billing-actions" style={{ marginTop: 12 }}>
        <button className="billing-primary" disabled={busy || spendingRestricted} onClick={() => void run('apply', preview.previewId)}>{tr('Confirm next-cycle change', '确认下账期变更')}</button>
        <button disabled={busy} onClick={() => setPreview(null)}>{tr('Back', '返回')}</button>
      </div>
    </div> : status?.enabled && !status.cancelAtPeriodEnd ? <div className="forge-billing-actions" style={{ marginTop: 12 }}>
      <select aria-label={tr('Next billing plan', '下一账期套餐')} value={target} onChange={event => setTarget(event.target.value)} disabled={busy || spendingRestricted}>
        {['starter', 'pro', 'agency'].map(plan => <option key={plan} value={plan} disabled={plan === status.providerPlan}>{name(plan)}</option>)}
      </select>
      <button disabled={busy || spendingRestricted || target === status.providerPlan} onClick={() => void run('preview', target)}>{tr('Review next-cycle change', '预览下账期变更')}</button>
    </div> : <p style={{ marginTop: 10 }}>{status?.cancelAtPeriodEnd ? tr('Renewal is currently cancelled. Manage your subscription to review that setting.', '当前已安排取消续费，请在订阅管理中核对。') : tr('Plan switching is not available yet. Your subscription can still be managed above.', '套餐切换暂未开放，仍可在上方管理现有订阅。')}</p>}
    <div className="forge-billing-actions" style={{ marginTop: 12 }}><button disabled={busy} onClick={() => { setError(null); void load().catch(() => setError('PLAN_CHANGE_UNAVAILABLE')); }}>{tr('Refresh change status', '刷新变更状态')}</button>{busy && <span className="billing-caption" role="status">{tr('Checking with billing…', '正在核对计费信息…')}</span>}</div>
  </div>;
}
