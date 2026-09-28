'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUiLanguage } from '../../lib/ui-language';
import { SubscriptionPlanChangePanel } from './SubscriptionPlanChangePanel';
import { accountMatches, readBillingReturn, readCheckoutState, stripeCheckoutUrl, validTopup, type CheckoutState } from './billing-contract';

type Plan = { monthlyUsd: number; includedUsd: number; trialUsd: number };
type Wallet = {
  availableUsd: number; includedRemainingUsd: number; includedUsedUsd: number;
  prepaidBalanceUsd: number; pendingUsd: number; markupMultiplier: number;
  legacyPlanReviewRequired: boolean; trialOnly: boolean;
  spendingRestricted?: boolean; restrictionReason?: 'payment_review';
  grants: { kind: string; plan: string; allowanceUsd: number; usedUsd: number; pendingUsd: number; expiresAt: string | null }[];
};
type Charge = { requestId: string; model: string; state: string; providerCostUsd: number | null; chargeUsd: number | null; reservedUsd: number; createdAt: string };
type PendingCheckout = { id: string; sessionId: string | null; kind: string; plan: string | null; amountUsd: number | null; status: string; expiresAt: string; refreshRequired: boolean };
type Api = (path: string, opts?: RequestInit, token?: string) => Promise<any>;
type Props = { user: { id: string; email: string; token: string }; api: Api; onAccountSwitch: () => void };
type PaymentView = CheckoutState | 'checking' | 'unverified' | 'cancel' | 'portal_return' | 'unavailable' | null;
const REMEMBERED_CHECKOUT = 'forge_billing_checkout';
const styles = `
.forge-billing{flex:1;overflow:auto;padding:32px 24px;color:var(--fg-text);font-family:var(--fg-font-ui)}
.forge-billing-inner{max-width:1120px;margin:0 auto}.forge-billing h2,.forge-billing h3,.forge-billing p{margin:0}
.forge-billing-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:30px}
.forge-billing-eyebrow{color:var(--fg-orange);font:600 11px var(--fg-font-mono);letter-spacing:2px;margin-bottom:10px!important}
.forge-billing h2{font-size:32px;font-weight:650;letter-spacing:-1px}.forge-billing-sub{font-size:13px;color:var(--fg-text2);line-height:1.65;margin-top:8px!important}
.forge-billing-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.forge-billing button,.forge-billing select,.forge-billing input{font:inherit}
.forge-billing button{border:1px solid var(--fg-border2);background:var(--fg-bg4);color:var(--fg-text);border-radius:9px;padding:9px 14px;font-size:12px;cursor:pointer;transition:background .16s,border-color .16s}
.forge-billing button:hover:not(:disabled){border-color:var(--fg-orange);background:var(--fg-bg5)}.forge-billing button:disabled{opacity:.4;cursor:not-allowed}
.forge-billing button:focus-visible,.forge-billing input:focus-visible,.forge-billing select:focus-visible{outline:2px solid var(--fg-orange);outline-offset:3px}
.forge-billing .billing-primary{background:var(--fg-orange);border-color:var(--fg-orange);color:#fff}.forge-billing .billing-primary:hover:not(:disabled){background:var(--fg-orange2)}
.forge-billing select{background:var(--fg-bg3);color:var(--fg-text);border:1px solid var(--fg-border2);border-radius:9px;padding:9px;font-size:12px}
.billing-notice{padding:18px 20px;border:1px solid var(--fg-border2);border-left:3px solid var(--fg-blue);background:var(--fg-bg3);border-radius:10px;margin-bottom:18px}
.billing-notice[data-tone=warning]{border-left-color:var(--fg-amber)}.billing-notice[data-tone=success]{border-left-color:var(--fg-green)}.billing-notice h3{font-size:14px;margin-bottom:6px}.billing-notice p{color:var(--fg-text2);font-size:13px;line-height:1.65}
.billing-metrics{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:1px;background:var(--fg-border2);border:1px solid var(--fg-border2);border-radius:14px;overflow:hidden;margin-bottom:14px}
.billing-metric{padding:23px 20px;background:var(--fg-bg3)}.billing-metric:first-child{background:linear-gradient(135deg,var(--fg-bg4),var(--fg-bg3))}.billing-metric-label{font-size:11px;color:var(--fg-text2)}
.billing-metric-value{font-family:var(--fg-font-mono);font-size:27px;font-weight:550;letter-spacing:-1px;white-space:nowrap;margin-top:10px!important}.billing-metric:first-child .billing-metric-value{color:var(--fg-green)}
.billing-caption{color:var(--fg-text2);font-size:12px;line-height:1.75}.billing-section{margin-top:32px}.billing-section-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}.billing-section h3{font-size:17px;font-weight:600}
.billing-plans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.billing-plan{border:1px solid var(--fg-border2);border-radius:12px;background:var(--fg-bg3);padding:20px;display:flex;flex-direction:column}.billing-plan[data-current=true]{border-color:var(--fg-orange)}
.billing-plan-top{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:24px;font-size:14px;font-weight:650}.billing-plan-tag{font-size:9px;color:var(--fg-orange);font-weight:600;letter-spacing:.7px;text-transform:uppercase}
.billing-plan-price{font:600 30px var(--fg-font-mono);margin-top:20px!important;letter-spacing:-1px}.billing-plan-price small{font:400 11px var(--fg-font-ui);color:var(--fg-text2);letter-spacing:0}
.billing-plan-credit{color:var(--fg-green);font-size:12px;line-height:1.5;margin-top:10px!important;min-height:36px}.billing-plan ul{padding-left:16px;color:var(--fg-text2);font-size:11px;line-height:1.9;flex:1;margin:15px 0 20px}.billing-plan button{width:100%}
.billing-topup{display:flex;justify-content:space-between;align-items:center;gap:24px;background:var(--fg-bg3);padding:22px;border:1px solid var(--fg-border2);border-radius:12px}.billing-topup h3{margin-bottom:5px}
.billing-topup-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.billing-topup input{background:var(--fg-bg);border:1px solid var(--fg-border2);color:var(--fg-text);padding:10px;border-radius:8px;font-family:var(--fg-font-mono);width:106px;font-size:13px}
.billing-ledger{overflow:auto;border:1px solid var(--fg-border2);border-radius:12px}.billing-ledger table{width:100%;border-collapse:collapse;text-align:left;font-size:12px;min-width:720px}.billing-ledger th{font-size:10px;font-weight:550;letter-spacing:.8px;color:var(--fg-text2);text-transform:uppercase;background:var(--fg-bg3);padding:13px 16px}.billing-ledger td{padding:15px 16px;border-top:1px solid var(--fg-border);vertical-align:top}.billing-ledger td:nth-child(3),.billing-ledger td:nth-child(4){font-family:var(--fg-font-mono);white-space:nowrap}.billing-ledger small{display:block;color:var(--fg-text3);font-size:10px;margin-top:5px}
.billing-state{display:inline-flex;align-items:center;gap:6px;font-size:11px}.billing-state:before{content:'';width:5px;height:5px;border-radius:50%;background:var(--fg-amber)}.billing-state[data-state=settled]:before{background:var(--fg-green)}.billing-state[data-state=released]:before{background:var(--fg-text2)}
.billing-empty{padding:30px;text-align:center;color:var(--fg-text2);font-size:13px}.billing-footer{border-top:1px solid var(--fg-border);padding-top:18px;margin-top:24px;font-size:11px;color:var(--fg-text3);line-height:1.75}
@media(max-width:950px){.billing-plans{grid-template-columns:repeat(2,minmax(0,1fr))}.billing-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.billing-topup{align-items:flex-start;flex-direction:column}.billing-topup-controls{justify-content:flex-start}}
@media(max-width:520px){.forge-billing{padding:22px 14px}.forge-billing-head{flex-direction:column}.forge-billing h2{font-size:27px}.billing-plans{grid-template-columns:1fr}.billing-metric{padding:18px 14px}.billing-metric-value{font-size:22px}.billing-section-head{align-items:flex-start;flex-direction:column}}
`;

export function ManagedBillingPanel({ user, api, onAccountSwitch }: Props) {
  const [language, setLanguage] = useUiLanguage();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [purchasesEnabled, setPurchasesEnabled] = useState(false);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [charges, setCharges] = useState<Charge[]>([]);
  const [orders, setOrders] = useState<PendingCheckout[]>([]);
  const [cancelIntent, setCancelIntent] = useState<string | null>(null);
  const [orderNotice, setOrderNotice] = useState(false);
  const [plan, setPlan] = useState('free');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [identity, setIdentity] = useState<{ id: string; email: string } | null>(null);
  const [expectedAccount, setExpectedAccount] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentView>(null);
  const [pollStopped, setPollStopped] = useState(false);
  const [pollVersion, setPollVersion] = useState(0);
  const [amount, setAmount] = useState('20');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const generation = useRef(0);
  const en = language === 'en';
  const tr = (english: string, chinese: string) => en ? english : chinese;
  const matching = accountMatches(expectedAccount, identity?.id ?? null);
  const mismatch = Boolean(identity && !matching);
  const canBuy = purchasesEnabled && matching && wallet !== null && !wallet.spendingRestricted && !busy && !loading;
  const canManage = matching && hasSubscription && !busy && !loading;
  const money = (value: number | null | undefined, precise = false) => {
    if (value == null || !Number.isFinite(value)) return '—';
    if (value > 0 && value < 0.000001) return '<$0.000001';
    return new Intl.NumberFormat(en ? 'en-US' : 'zh-CN', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: precise ? 6 : 4 }).format(value);
  };

  useEffect(() => {
    const params = readBillingReturn(window.location.search);
    let remembered: { account?: string; sessionId?: string } = {};
    try { remembered = JSON.parse(sessionStorage.getItem(REMEMBERED_CHECKOUT) || '{}'); } catch {}
    const expected = params.account ?? (params.mode ? remembered.account ?? null : null);
    const returnedSession = params.sessionId ?? (params.mode === 'success' ? remembered.sessionId ?? null : null);
    setExpectedAccount(expected);
    setSessionId(returnedSession && /^cs_[A-Za-z0-9_]{1,240}$/.test(returnedSession) ? returnedSession : null);
    if (params.mode === 'portal_return') setPayment('portal_return');
    else if (params.mode === 'cancel') setPayment('cancel');
    else if (params.mode || params.sessionId) setPayment(returnedSession ? 'checking' : 'unverified');
  }, []);

  const refresh = useCallback(async () => {
    const revision = ++generation.current;
    setLoading(true); setError(null);
    try {
      const [profile, credits, subscription, pending] = await Promise.all([
        api('/profile', { signal: AbortSignal.timeout(12000) }, user.token),
        api('/billing/credits', { signal: AbortSignal.timeout(12000) }, user.token),
        api('/billing/subscription', { signal: AbortSignal.timeout(12000) }, user.token),
        api('/billing/checkouts', { signal: AbortSignal.timeout(25000) }, user.token),
      ]);
      if (revision !== generation.current) return;
      const owner = profile?.data;
      if (!owner?.id || typeof owner.id !== 'string') throw new Error('BILLING_ACCOUNT_UNVERIFIED');
      setIdentity({ id: owner.id, email: typeof owner.email === 'string' ? owner.email : '' });
      const data = credits?.data ?? credits;
      if (!data?.billing || !data?.plans) throw new Error('BILLING_POLICY_UNAVAILABLE');
      setWallet(data.billing); setPlans(data.plans); setPurchasesEnabled(data.purchasesEnabled === true);
      setCharges(Array.isArray(data.charges) ? data.charges : []);
      setPlan(data.plan || subscription?.plan || 'free');
      setHasSubscription((subscription?.data ?? subscription)?.hasSubscription === true);
      if (!Array.isArray(pending?.data)) throw new Error('BILLING_POLICY_UNAVAILABLE');
      setOrders(pending.data);
      setUpdatedAt(new Date().toISOString());
    } catch (failure) {
      if (revision !== generation.current) return;
      setWallet(null);
      setPurchasesEnabled(false);
      setError(failure instanceof Error ? failure.message : 'BILLING_UNAVAILABLE');
    } finally { if (revision === generation.current) setLoading(false); }
  }, [api, user.token]);

  useEffect(() => { setIdentity(null); setOrders([]); setCancelIntent(null); setOrderNotice(false); void refresh(); return () => { generation.current++; }; }, [refresh]);

  useEffect(() => {
    if (!sessionId || !matching) return;
    let stopped = false, timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const deadline = Date.now() + 35000;
    let attempts = 0;
    setPollStopped(false);
    const poll = async () => {
      attempts++;
      try {
        const response = await api(`/billing/checkout/${encodeURIComponent(sessionId)}`, { signal: controller.signal }, user.token);
        if (stopped) return;
        const status = readCheckoutState(response);
        setPayment(status ?? 'unverified');
        if (status === 'confirmed') {
          await refresh();
          return;
        }
        if (status === 'expired' || status === 'failed' || status === 'open' || !status) { setPollStopped(true); return; }
      } catch {
        if (stopped) return;
        setPayment('unavailable');
      }
      if (!stopped && attempts < 10 && Date.now() < deadline) timer = setTimeout(poll, 2500);
      else if (!stopped) setPollStopped(true);
    };
    const deadlineTimer = setTimeout(() => { stopped = true; controller.abort(); setPollStopped(true); }, 35000);
    void poll();
    return () => { stopped = true; controller.abort(); clearTimeout(timer); clearTimeout(deadlineTimer); };
  }, [sessionId, matching, user.token, api, pollVersion, refresh]);

  const startCheckout = async (kind: 'topup' | 'subscription', selectedPlan?: string) => {
    if (!canBuy) return;
    const purchase = kind === 'topup' ? validTopup(amount) : null;
    if (kind === 'topup' && purchase === null) { setError('INVALID_TOPUP_AMOUNT'); return; }
    setBusy(kind === 'topup' ? 'topup' : selectedPlan || 'subscription'); setError(null);
    try {
      // Recheck the current authenticated identity immediately before creating a purchase.
      const fresh = await api('/profile', { signal: AbortSignal.timeout(12000) }, user.token);
      if (!accountMatches(expectedAccount, fresh?.data?.id) || fresh?.data?.id !== identity?.id) throw new Error('BILLING_ACCOUNT_MISMATCH');
      const response = await api(kind === 'topup' ? '/billing/topup' : '/billing/upgrade',
        { method: 'POST', body: JSON.stringify(kind === 'topup' ? { amount: purchase } : { plan: selectedPlan }) }, user.token);
      const data = response?.data ?? response;
      const destination = stripeCheckoutUrl(data?.checkoutUrl);
      if (!destination) { await refresh(); throw new Error('BILLING_CHECKOUT_NOT_READY'); }
      try { sessionStorage.setItem(REMEMBERED_CHECKOUT, JSON.stringify({ account: fresh.data.id, sessionId: data.sessionId })); } catch {}
      window.location.assign(destination);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'BILLING_UNAVAILABLE'); }
    finally { setBusy(null); }
  };

  const openPortal = async () => {
    if (!canManage) return;
    setBusy('portal'); setError(null);
    try {
      const fresh = await api('/profile', { signal: AbortSignal.timeout(12000) }, user.token);
      if (!accountMatches(expectedAccount, fresh?.data?.id) || fresh?.data?.id !== identity?.id) throw new Error('BILLING_ACCOUNT_MISMATCH');
      const response = await api('/billing/portal', { method: 'POST' }, user.token);
      const data = response?.data ?? response;
      const destination = stripeCheckoutUrl(data?.checkoutUrl);
      if (!destination || data?.action !== 'manage_subscription') throw new Error('BILLING_PORTAL_NOT_CONFIGURED');
      window.location.assign(destination);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'BILLING_UNAVAILABLE'); }
    finally { setBusy(null); }
  };

  const handleOrder = async (order: PendingCheckout, action: 'resume' | 'cancel') => {
    if (!matching || busy || loading || (action === 'resume' && !canBuy)) return;
    const revision = generation.current;
    setBusy(`${action}:${order.id}`); setError(null); setOrderNotice(false);
    try {
      const fresh = await api('/profile', { signal: AbortSignal.timeout(12000) }, user.token);
      if (revision !== generation.current || !accountMatches(expectedAccount, fresh?.data?.id) || fresh?.data?.id !== identity?.id) throw new Error('BILLING_ACCOUNT_MISMATCH');
      const response = await api(`/billing/checkouts/${encodeURIComponent(order.id)}/${action}`, { method: 'POST' }, user.token);
      if (revision !== generation.current) return;
      const data = response?.data ?? response;
      if (action === 'resume') {
        const destination = stripeCheckoutUrl(data?.checkoutUrl);
        if (!destination) throw new Error('BILLING_CHECKOUT_NOT_READY');
        try { sessionStorage.setItem(REMEMBERED_CHECKOUT, JSON.stringify({ account: fresh.data.id, sessionId: data.sessionId })); } catch {}
        window.location.assign(destination);
      } else {
        if (data?.cancelled !== true) throw new Error('CHECKOUT_CANCELLATION_UNCONFIRMED');
        setCancelIntent(null); setOrderNotice(true);
        setOrders(current => current.filter(item => item.id !== order.id));
        if (sessionId === order.sessionId) { setSessionId(null); setPayment('expired'); }
        await refresh();
      }
    } catch (failure) {
      if (revision !== generation.current) return;
      await refresh();
      setError(failure instanceof Error ? failure.message : 'BILLING_UNAVAILABLE');
    } finally { setBusy(null); }
  };

  const switchAccount = async () => {
    setBusy('account');
    onAccountSwitch();
  };
  const refreshAll = () => { void refresh(); setPollVersion(version => version + 1); };
  const pendingPayment = ['checking', 'creating', 'confirming', 'unavailable', 'unverified'].includes(payment || '');
  const paymentTitle: Record<string, [string, string]> = {
    checking: ['Checking your payment', '正在核对付款'], creating: ['Checkout is being prepared', '正在准备付款页面'],
    confirming: ['Payment confirmation is in progress', '正在确认付款与额度到账'], confirmed: ['Payment confirmed · account updated', '付款已确认 · 账户已更新'],
    open: ['Checkout is still open', '付款尚未完成'], expired: ['Checkout has expired', '付款页面已过期'], failed: ['Payment was not completed', '付款未完成'],
    unverified: ['Payment has not been verified', '付款尚未核实'], unavailable: ['We could not verify the payment yet', '暂时无法核实付款状态'],
    cancel: ['You returned from checkout', '已返回账单页面'], portal_return: ['Subscription details refreshed', '已刷新订阅信息'],
  };
  const errorCopy: Record<string, [string, string]> = {
    INVALID_TOPUP_AMOUNT: ['Enter an amount from $20 to $1,000, with up to two decimal places.', '请输入 20 至 1,000 美元，最多保留两位小数。'],
    BILLING_ACCOUNT_MISMATCH: ['The signed-in account changed. Switch to the Forge account used on your desktop.', '登录账号已变化，请切换到桌面端使用的 Forge 账号。'],
    BILLING_NOT_CONFIGURED: ['Purchases are not available yet. Your existing credits remain available.', '购买功能暂未开放，已有额度仍保留。'],
    BILLING_PURCHASES_PAUSED: ['New purchases are paused while we verify the Forge payment account. Existing credit and subscription management remain available.', '核实 Forge 收款账户期间，暂时无法新购。已有额度和订阅管理仍可使用。'],
    CHECKOUT_ALREADY_PENDING: ['You have a pending checkout. Resume or cancel it in Pending purchases before choosing another option.', '已有待付款订单，请在“待付款订单”中继续付款或取消后重新选择。'],
    CHECKOUT_NOT_CANCELLABLE: ['This order can no longer be cancelled. Check its current payment status before purchasing again.', '此订单已无法取消，请核对当前付款状态后再购买。'],
    CHECKOUT_CANCELLATION_UNCONFIRMED: ['Cancellation could not be confirmed. The order is preserved; refresh and try again.', '暂未确认取消成功，订单仍保留，请刷新后重试。'],
    CHECKOUT_RECONCILIATION_REQUIRED: ['This order needs reconciliation. Contact support before starting another purchase.', '此订单需要对账，请联系支持团队，避免重复购买。'],
    CHECKOUT_EXPIRED: ['This checkout has expired. You can choose a new purchase.', '此付款订单已过期，可以重新选择购买。'],
    CHECKOUT_PAYMENT_CONFIRMING: ['Your previous payment is being confirmed. Refresh its status before starting another purchase.', '上一笔付款正在确认，请先刷新状态，避免重复购买。'],
    BILLING_POLICY_UNAVAILABLE: ['Billing details are unavailable. Refresh before purchasing.', '暂时无法取得账单详情，请刷新后再购买。'],
    BILLING_LEGACY_USAGE_REVIEW_REQUIRED: ['An earlier model request needs billing review. Purchased credits are preserved. Please contact support.', '较早的模型请求需要对账，已购额度仍保留，请联系支持团队。'],
    BILLING_CHECKOUT_NOT_READY: ['No payment has been confirmed. Refresh the account or try opening checkout again.', '尚未确认付款，请刷新账户，或重新打开付款页面。'],
    BILLING_ACCOUNT_REVIEW_REQUIRED: ['Your account needs a payment review. Existing credits are preserved. Please contact support before making another payment.', '账户需要付款核对，已有额度仍保留。请联系支持团队处理，避免重复付款。'],
    PLAN_CHANGE_WITHDRAW_BEFORE_MANAGING: ['Withdraw your pending plan change below before managing renewal.', '请先在下方撤回待生效套餐变更，再管理续费。'],
    PLAN_CHANGE_EXTERNAL_SCHEDULE: ['This subscription has a separate billing schedule. Contact support to manage renewal.', '此订阅有其他计费安排，请联系支持团队管理续费。'],
    BILLING_PORTAL_NOT_CONFIGURED: ['Subscription management is temporarily unavailable. Please contact support if you need to stop renewal.', '订阅管理暂时不可用。如需停止续费，请联系支持团队。'],
    BILLING_PORTAL_CONFIGURATION_INVALID: ['Subscription management is temporarily unavailable. Your plan has not changed. Please contact support if you need to stop renewal.', '订阅管理暂时不可用，套餐未改变。如需停止续费，请联系支持团队。'],
    BILLING_SUBSCRIPTION_NOT_LINKED: ['No subscription is linked to this account. Refresh to see your current status.', '此账号尚未关联订阅，请刷新查看最新状态。'],
    BILLING_SUBSCRIPTION_NOT_ACTIVE: ['This subscription has ended. Refresh to see available plans.', '此订阅已结束，请刷新查看可选套餐。'],
  };
  const chargeLabel: Record<string, [string, string]> = { settled: ['Settled', '已结算'], released: ['Released', '已释放'], pending: ['Reserved', '已预占'], unknown: ['Awaiting receipt', '等待回执'], review_required: ['Under review', '对账中'] };

  return <section className="forge-billing" aria-label={tr('Billing and usage', '账单与用量')}>
    <style>{styles}</style>
    <div className="forge-billing-inner">
      <header className="forge-billing-head">
        <div><p className="forge-billing-eyebrow">FORGE / ACCOUNT</p><h2>{tr('Clarity in every credit.', '每一笔额度，清楚可见。')}</h2><p className="forge-billing-sub">{tr('One Forge account. Your plans, model usage and local work, connected.', '一个 Forge 账号，连接套餐、模型用量与本地工作。')}</p></div>
        <div className="forge-billing-actions"><select aria-label={tr('Billing language', '账单语言')} value={language} onChange={event => { const value = event.target.value === 'zh' ? 'zh' : 'en'; setLanguage(value); }}><option value="en">English</option><option value="zh">中文</option></select><button onClick={refreshAll} disabled={loading}>{loading ? tr('Refreshing…', '刷新中…') : tr('Refresh', '刷新')}</button></div>
      </header>

      {mismatch && <div className="billing-notice" data-tone="warning" role="alert"><h3>{tr('Use the same account as Forge Desktop', '请使用与 Forge Desktop 相同的账号')}</h3><p>{tr('This browser is signed in to a different Forge account. Switch accounts before buying credits or a plan for your desktop.', '浏览器当前登录的 Forge 账号与桌面端不同。请先切换账号，再为桌面端购买额度或套餐。')}</p><button style={{ marginTop: 12 }} onClick={switchAccount} disabled={!!busy}>{tr('Switch account', '切换账号')}</button></div>}
      {!mismatch && identity && <p className="billing-caption" style={{ marginBottom: 16 }}>{tr('Billing account', '购买账号')} · {identity.email}{expectedAccount ? tr(' · Matches your desktop', ' · 已与桌面端匹配') : ''}</p>}
      {hasSubscription && !mismatch && <div className="billing-notice"><h3>{tr('Your subscription, in your control.', '订阅由你掌握。')}</h3><p>{tr('View invoices, update your payment method, or stop renewal. Cancellation takes effect at the end of your paid period; your remaining included credit stays available until then. Billing management remains available during a payment review.', '查看账单、更新付款方式或停止续费。取消在当前付费周期结束时生效，剩余套餐额度在到期前仍可使用。付款核对期间仍可管理订阅。')}</p><button style={{ marginTop: 12 }} disabled={!canManage} onClick={() => void openPortal()}>{busy === 'portal' ? tr('Opening…', '打开中…') : tr('Manage subscription', '管理订阅')}</button></div>}

      {payment && !mismatch && <div className="billing-notice" data-tone={payment === 'confirmed' ? 'success' : pendingPayment || payment === 'failed' ? 'warning' : 'info'} role="status" aria-live="polite">
        <h3>{paymentTitle[payment]?.[en ? 0 : 1]}</h3>
        <p>{payment === 'confirmed' ? tr('Forge has confirmed this payment and applied its entitlement. Refresh your account in Forge Desktop to continue.', 'Forge 已确认付款并发放对应权益。回到 Forge Desktop 刷新账户即可继续使用。') : payment === 'portal_return' ? tr('The account below shows the latest server status. Returning from the payment portal does not by itself confirm a change.', '下方显示服务器最新账户状态；从支付管理页面返回不代表修改已完成。') : payment === 'cancel' ? tr('Your current balance is shown below. A return URL is not a payment receipt.', '下方显示当前余额，返回此页面不代表付款已确认。') : tr('Credits appear after Forge receives and confirms the payment. Please avoid paying again while confirmation is pending.', 'Forge 收到并确认付款后，额度才会到账。确认期间请勿重复付款。')}</p>
        {pollStopped && pendingPayment && <p style={{ marginTop: 8 }}>{tr('Automatic checks have paused. You can check again without making another payment.', '自动核对已暂停。可手动重新核对，无需再次付款。')}</p>}
        {payment !== 'confirmed' && <button style={{ marginTop: 12 }} onClick={refreshAll} disabled={loading}>{tr('Check again', '重新核对')}</button>}
      </div>}
      {error && <div className="billing-notice" data-tone="warning" role="alert"><p>{errorCopy[error]?.[en ? 0 : 1] ?? tr('Billing is temporarily unavailable. Please refresh or try again shortly; no new payment is confirmed here.', '账单服务暂时不可用，请刷新或稍后重试；此处尚未确认新的付款。')}</p></div>}
      {wallet && !purchasesEnabled && <div className="billing-notice" data-tone="warning" role="status"><h3>{tr('New purchases are paused', '新购暂时关闭')}</h3><p>{tr('We are verifying the Forge payment account. You can still view your balance, cancel an unpaid order, and manage an existing subscription.', '我们正在核实 Forge 收款账户。你仍可查看余额、取消未付款订单，以及管理已有订阅。')}</p></div>}

      <div className="billing-metrics" aria-busy={loading}>
        {[[tr('Available to use', '当前可用'), wallet?.availableUsd], [tr('Included credit remaining', '套餐额度剩余'), wallet?.includedRemainingUsd], [tr('Purchased credit balance', '已购充值余额'), wallet?.prepaidBalanceUsd], [tr('Reserved for active requests', '请求预占额度'), wallet?.pendingUsd]].map(([label, value]) => <div className="billing-metric" key={String(label)}><p className="billing-metric-label">{label}</p><p className="billing-metric-value">{money(typeof value === 'number' ? value : null)}</p></div>)}
      </div>
      <p className="billing-caption">{tr('Available credit already excludes reservations. Reserved amounts are temporary holds, not settled charges. Included credits expire with their paid period; purchased credits are kept separately.', '当前可用额度已扣除预占。预占是临时保留，不是最终扣款。套餐额度在对应付费周期结束时到期，充值余额单独保留。')}</p>
      {wallet?.spendingRestricted && <div className="billing-notice" data-tone="warning" style={{ marginTop: 18 }} role="alert"><h3>{tr('Payment review in progress', '正在核对付款')}</h3><p>{tr('Your existing credits are preserved. New model requests and purchases are paused while a payment is reviewed. Please contact support; another payment will not resolve this review.', '已有额度仍保留。付款核对期间，新的模型请求与购买暂时停用。请联系支持团队处理，再次付款不会解除此状态。')}</p></div>}
      {wallet?.legacyPlanReviewRequired && <div className="billing-notice" data-tone="warning" style={{ marginTop: 18 }}><h3>{tr('Your existing plan needs a billing review', '现有套餐需要核对')}</h3><p>{tr('Your purchased credit balance is preserved. Monthly allowances will appear after the paid subscription period is verified; please contact support if a paid allowance is missing.', '您的充值余额仍保留。核实已付费的订阅周期后，月度额度会显示在这里；如已付款但未出现额度，请联系支持团队。')}</p></div>}

      {orderNotice && <div className="billing-notice" data-tone="success" role="status" style={{ marginTop: 18 }}><h3>{tr('Unpaid order cancelled', '未付款订单已取消')}</h3><p>{tr('You can now choose another plan or credit amount.', '现在可以重新选择套餐或充值金额。')}</p></div>}
      {!mismatch && orders.length > 0 && <section className="billing-section" aria-label={tr('Pending purchases', '待付款订单')}>
        <div className="billing-section-head"><h3>{tr('Pending purchases', '待付款订单')}</h3><span className="billing-caption">{tr('Saved to your Forge account', '已保存到你的 Forge 账户')}</span></div>
        {orders.map(order => <article className="billing-notice" key={order.id}>
          <h3>{order.kind === 'subscription' ? `Forge ${order.plan ? order.plan[0].toUpperCase() + order.plan.slice(1) : tr('subscription', '订阅')}` : tr('Prepaid credit', '额度充值')} · {money(order.amountUsd)}</h3>
          <p>{order.status === 'confirming' ? tr('Payment is being confirmed. Please wait before purchasing again.', '正在确认付款，请等待核对完成后再购买。') : order.status === 'creating' ? tr('Checkout needs to be recovered. Continue or cancel to recover the original order safely.', '付款页面需要恢复。继续付款或取消时会先核对原订单。') : tr('Payment is incomplete. Resume this order or cancel it to choose another option.', '此订单尚未付款，可以继续付款，或取消后重新选择。')}</p>
          {order.refreshRequired && <p role="status">{tr('The latest payment status could not be retrieved. Actions will recheck it first.', '暂未取得最新付款状态，操作前会再次核对。')}</p>}
          {order.status !== 'confirming' && <div className="forge-billing-actions" style={{ marginTop: 12 }}>
            {cancelIntent === order.id ? <>
              <p>{tr('Cancel this unpaid order? Its payment link will stop working.', '确认取消此未付款订单？取消后原付款链接将失效。')}</p>
              <button disabled={!matching || !!busy || loading} onClick={() => void handleOrder(order, 'cancel')}>{busy === `cancel:${order.id}` ? tr('Cancelling…', '取消中…') : tr('Confirm cancellation', '确认取消')}</button>
              <button disabled={!!busy} onClick={() => setCancelIntent(null)}>{tr('Keep order', '保留订单')}</button>
            </> : <>
              <button className="billing-primary" disabled={!canBuy} onClick={() => void handleOrder(order, 'resume')}>{busy === `resume:${order.id}` ? tr('Opening…', '打开中…') : tr('Continue payment', '继续付款')}</button>
              <button disabled={!matching || !!busy || loading} onClick={() => setCancelIntent(order.id)}>{tr('Cancel unpaid order', '取消未付款订单')}</button>
            </>}
          </div>}
        </article>)}
      </section>}

      <section className="billing-section">
        <div className="billing-section-head"><h3>{tr('A plan for the way you work', '为你的工作方式选择套餐')}</h3><span className="billing-caption">{tr('USD · billed monthly', '美元计价 · 按月付费')}</span></div>
        <div className="billing-plans">
          {['free', 'starter', 'pro', 'agency'].filter(key => plans[key]).map(key => {
            const policy = plans[key], current = key === plan;
            return <article className="billing-plan" key={key} data-current={current}>
              <div className="billing-plan-top"><span>{key === 'free' ? tr('Free', '免费体验') : key[0].toUpperCase() + key.slice(1)}</span>{current && <span className="billing-plan-tag">{tr('Current plan', '当前套餐')}</span>}</div>
              <p className="billing-plan-price">${policy.monthlyUsd}<small> / {tr('month', '月')}</small></p>
              <p className="billing-plan-credit">{key === 'free' ? tr(`Up to ${money(policy.trialUsd)} one-time trial, subject to availability`, `一次性最高 ${money(policy.trialUsd)} 体验额度，按实际发放为准`) : tr(`${money(policy.includedUsd)} included each paid month`, `每个付费月包含 ${money(policy.includedUsd)} 额度`)}</p>
              <ul><li>{key === 'free' ? tr('Lightweight model choices', '轻量模型可选') : tr('Flagship, balanced and lightweight models', '旗舰、均衡、轻量模型可选')}</li><li>{tr('Local projects and agent tools', '本地项目与 Agent 工具')}</li><li>{tr('Request-level spending history', '逐笔请求费用记录')}</li></ul>
              {!hasSubscription && <button className={key === 'pro' ? 'billing-primary' : ''} disabled={!canBuy || key === 'free' || orders.some(order => order.kind === 'subscription')} onClick={() => void startCheckout('subscription', key)}>{busy === key ? tr('Opening…', '打开中…') : key === 'free' ? tr('Free plan', '免费套餐') : tr('Choose plan', '选择套餐')}</button>}
            </article>;
          })}
        </div>
        {!Object.keys(plans).length && <div className="billing-empty">{loading ? tr('Loading current plans…', '正在加载套餐…') : tr('Refresh to see the current plans.', '请刷新以查看当前套餐。')}</div>}
        {hasSubscription && <SubscriptionPlanChangePanel user={user} api={api} language={language} accountMatches={matching} spendingRestricted={wallet?.spendingRestricted === true} onRefresh={() => { void refresh(); }} />}
      </section>

      <section className="billing-section billing-topup">
        <div><h3>{tr('Keep your next task moving.', '为下一个任务补充额度。')}</h3><p className="billing-caption">{tr('Add prepaid credit from $20. No automatic refill.', '充值最低 20 美元，不会自动续充。')}</p></div>
        <div className="billing-topup-controls"><label htmlFor="forge-topup-amount" className="billing-caption">USD</label><input id="forge-topup-amount" aria-label={tr('Credit purchase amount in USD', '充值金额（美元）')} inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} /><button className="billing-primary" disabled={!canBuy || validTopup(amount) === null || orders.some(order => order.kind === 'topup')} onClick={() => void startCheckout('topup')}>{busy === 'topup' ? tr('Opening…', '打开中…') : tr('Add credit', '充值')}</button></div>
      </section>

      <section className="billing-section">
        <div className="billing-section-head"><h3>{tr('Every request, accounted for.', '每一次请求，都有记录。')}</h3><span className="billing-caption">{tr('Most recent 100 requests', '最近 100 次请求')}</span></div>
        <div className="billing-ledger">{charges.length ? <table><thead><tr>{[tr('Model / request', '模型 / 请求'), tr('Status', '状态'), tr('Provider cost', '供应商成本'), tr('Forge charge', 'Forge 费用'), tr('Time', '时间')].map(title => <th scope="col" key={title}>{title}</th>)}</tr></thead><tbody>{charges.map(charge => <tr key={charge.requestId}><td>{charge.model}<small>{charge.requestId.slice(0, 20)}</small></td><td><span className="billing-state" data-state={charge.state}>{chargeLabel[charge.state]?.[en ? 0 : 1] ?? tr('Pending review', '等待核对')}</span></td><td>{money(charge.providerCostUsd, true)}</td><td>{money(charge.chargeUsd, true)}{charge.chargeUsd == null && <small>{tr('Reserved', '预占')} {money(charge.reservedUsd, true)}</small>}</td><td>{Number.isNaN(Date.parse(charge.createdAt)) ? '—' : new Date(charge.createdAt).toLocaleString(en ? 'en-US' : 'zh-CN')}</td></tr>)}</tbody></table> : <div className="billing-empty">{loading ? tr('Loading request history…', '正在加载请求记录…') : tr('Your model charges will appear here after you start using Forge.', '开始使用 Forge 后，模型请求费用会显示在这里。')}</div>}</div>
      </section>
      <footer className="billing-footer">{wallet && <p>{tr(`Model usage is charged at the actual OpenRouter cost × ${wallet.markupMultiplier}. Cached input, reasoning and long-context pricing follow the provider receipt. Different models use different amounts of credit.`, `模型费用 = OpenRouter 实际成本 × ${wallet.markupMultiplier}。缓存输入、推理与长上下文价格以供应商回执为准，不同模型消耗的额度不同。`)}</p>}<p>{purchasesEnabled ? tr('Your local project files stay in Forge Desktop. Buy or manage your plan here, then refresh your desktop account.', '本地项目文件由 Forge Desktop 管理。在此购买或管理套餐后，回到桌面端刷新账户。') : tr('Your local project files stay in Forge Desktop. Subscription management remains available here.', '本地项目文件由 Forge Desktop 管理，你仍可在此管理已有订阅。')}</p>{updatedAt && <p>{tr('Updated', '更新于')} {new Date(updatedAt).toLocaleTimeString(en ? 'en-US' : 'zh-CN')}</p>}</footer>
    </div>
  </section>;
}
