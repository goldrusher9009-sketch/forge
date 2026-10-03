'use client';

import { useState } from 'react';
type Api = (path: string, options?: RequestInit) => Promise<any>;
const toolLabels: Record<string,[string,string]> = {
  create_artifact:['Create downloadable files','生成可下载文件'],web_search:['Search the public web','搜索公开网页'],web_scrape:['Read public webpages','读取公开网页'],
  http_request:['Read public API data','读取公开 API 数据'],knowledge_search:['Search attached documents','检索绑定资料'],tool_result_recall:['Read this task’s tool receipts','查询当前任务的执行回执'],
};
export function PortableAgentOffer({ agentId, releaseId, version, api, zh }: { agentId: string; releaseId: string; version: number; api: Api; zh: boolean }) {
  const t = (en: string, cn: string) => zh ? cn : en;
  const [configuration, setConfiguration] = useState<any>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [summary, setSummary] = useState(''), [outcome, setOutcome] = useState(''), [instructions, setInstructions] = useState('');
  const [price, setPrice] = useState('10'), [days, setDays] = useState('365'), [scope, setScope] = useState('individual');
  const [licenseSummary, setLicenseSummary] = useState(''), [license, setLicense] = useState(''), [supportEmail, setSupportEmail] = useState('');
  const [share, setShare] = useState(false), [rights, setRights] = useState(false), [handoff, setHandoff] = useState('');
  const [sourceInstructions, setSourceInstructions] = useState(''), [sourceConsent, setSourceConsent] = useState(false);
  const [toolConsent,setToolConsent] = useState(false);
  const [includeSources,setIncludeSources] = useState(false), [sourceRights,setSourceRights] = useState(false);
  const base = `/workspace-agents/${encodeURIComponent(agentId)}/releases/${encodeURIComponent(releaseId)}`;
  const usesSources = configuration?.knowledge.requiresRebinding === true;
  const requiresSources = usesSources && !includeSources;
  const tools: string[] = configuration?.configuration.tools || [];
  const unsupported = tools.some(name => !Object.prototype.hasOwnProperty.call(toolLabels,name));
  const messages: Record<string, string> = {
    MARKETPLACE_PACKAGE_TOOL_CONSENT_REQUIRED: t('Review the declared tool capabilities and confirm their delivery requirements before continuing.', '请检查声明的工具能力，并确认交付要求后继续。'),
    MARKETPLACE_PACKAGE_SOURCE_SETUP_CONSENT_REQUIRED: t('Explain the documents buyers must provide and confirm this requirement before continuing.', '请说明买家需要提供的资料，并确认这项交付要求。'),
    MARKETPLACE_PACKAGE_SOURCE_FILES_CONSENT_REQUIRED: t('Confirm that you own the rights to include and license these documents before continuing.', '请确认你拥有随包交付并授权这些文档的权利后继续。'),
    MARKETPLACE_PACKAGE_SOURCE_FILES_UNAVAILABLE: t('This version has no attached documents to include.', '此版本没有可随包交付的绑定文档。'),
    AGENT_RELEASE_SOURCES_UNSUPPORTED: t('Only readable text documents (TXT, Markdown, CSV, JSON and similar) can be included. Remove other files from this version’s sources or let buyers provide their own.', '只有可读取的文本文档（TXT、Markdown、CSV、JSON 等）可以随包交付。请移除此版本资料中的其他文件，或改为让买家自备资料。'),
    AGENT_RELEASE_SOURCES_TOO_LARGE: t('Included documents are limited to 12 files, 128 KB each and 400 KB in total.', '随包文档最多 12 个，单个不超过 128 KB，总计不超过 400 KB。'),
    AGENT_RELEASE_SOURCES_CHANGED: t('The documents attached to this version were changed or removed. Restore them or publish a new version.', '此版本绑定的文档已被修改或删除。请恢复文档或发布新版本。'),
    MARKETPLACE_PACKAGE_TOOLS_UNSUPPORTED: t('This release uses tools that are not included in a portable package.', '此版本使用的额外工具尚不能随便携包交付。'),
    MARKETPLACE_PACKAGE_NOT_CONFIGURED: t('The Forge-to-Apptopia connection has not been configured by the operator.', '运营方尚未配置 Forge 与 Apptopia 的发布连接。'),
    MARKETPLACE_PACKAGE_TERMS_INVALID: t('Complete the price, download period, support address, license and installation instructions.', '请完整填写价格、下载期限、支持邮箱、许可证和安装说明。'),
  };
  const action = async (fn: () => Promise<void>) => {
    if (busy) return; setBusy(true); setError('');
    try { await fn(); } catch (e: any) { setError(messages[e.message] || t('The package could not be prepared. Retry the same offer to recover it without creating a second copy.', '安装包未能准备完成。可使用相同内容重试，恢复原来的包，不会重复创建。')); }
    finally { setBusy(false); }
  };
  return <details className="ar-answer" onToggle={event => {
    if (event.currentTarget.open && !configuration && !busy) void action(async () => setConfiguration((await api(`${base}/package`)).data));
  }}><summary>{t(`Sell version ${version} as a portable agent`, `将版本 ${version} 作为便携 Agent 售卖`)}</summary>
    <style>{`.ar-portable-consent{display:flex!important;align-items:flex-start;gap:10px;line-height:1.7}.ar-portable-consent input{width:auto!important;flex:none;margin:4px 0!important}.ar-portable-next{display:inline-flex;padding:12px 16px;margin:8px 0 12px;border-radius:6px;background:var(--pw-accent);color:#14200e!important;text-decoration:none;font-weight:600}`}</style>
    <p className="pw-muted">{t('Buyers receive this fixed configuration and use their own Forge account and model budget. The package price is paid once. Future versions are separate.', '买家获得此固定版本的配置，使用自己的 Forge 账号并承担模型费用。安装包一次付费，未来版本另行约定。')}</p>
    {configuration && <details><summary>{t('Review the exact configuration being shared', '检查即将分享的完整配置')}</summary><p>{configuration.configuration.name} · {configuration.configuration.model}</p><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 260, overflow: 'auto' }}>{configuration.configuration.system_prompt}</pre></details>}
    {unsupported && <p role="alert" className="pw-error">{messages.MARKETPLACE_PACKAGE_TOOLS_UNSUPPORTED}</p>}
    {!!tools.length && !unsupported && <section className="pw-message" aria-label={t('Included tool capabilities','随包交付的工具能力')}><strong>{t('Included tool capabilities','随包交付的工具能力')}</strong><ul>{tools.map(name=><li key={name}>{t(...toolLabels[name])}</li>)}</ul><p>{t('Buyers need a compatible Forge Pi runtime. Tools run only in a task using their published version. Files belong to the buyer’s task; web access is public and read-only. No seller credentials, custom tool code or account integrations are transferred. An answer evaluation does not prove tool execution.', '买家需要兼容的 Forge Pi 执行环境。工具只在使用已发布版本的任务中运行。文件保存在买家任务内，联网仅访问公开信息且不写入外部系统。卖家凭据、自定义工具代码和账号集成不会交付。回答测评不能证明工具已执行成功。')}</p></section>}
    {usesSources && <section className="pw-message" aria-label={t('Source documents', '资料文档')}><strong>{t('This version uses source documents', '此版本依赖资料文档')}</strong>
      <label className="ar-portable-consent"><input type="radio" name={`sources-${releaseId}`} disabled={busy || !configuration || !!unsupported} checked={!includeSources} onChange={() => { setIncludeSources(false); setSourceRights(false); }}/>{t('Buyers provide their own documents. Your files are not included; you describe what they must supply.', '买家自备资料。你的文件不随包交付，由你说明买家需要提供什么。')}</label>
      <label className="ar-portable-consent"><input type="radio" name={`sources-${releaseId}`} disabled={busy || !configuration || !!unsupported} checked={includeSources} onChange={() => { setIncludeSources(true); setSourceConsent(false); }}/>{t('Include this version’s text documents in the package. Buyers receive copies in their own Forge library, licensed under your package license (up to 12 text files, 400 KB total).', '将此版本的文本文档随包交付。买家在自己的 Forge 资料库中获得副本，按你的许可证授权使用（最多 12 个文本文件，总计 400 KB）。')}</label>
      {!includeSources && <p>{t('The requirement is shown before purchase and saved in the imported agent.', '资料要求会在购买前展示，并保存在买家导入的 Agent 中。')}</p>}
    </section>}
    <fieldset disabled={busy || !configuration || !!unsupported} onChange={() => { setHandoff(''); setShare(false); setRights(false); setSourceConsent(false); setToolConsent(false); setSourceRights(false); }}>
      <label>{t('Buyer outcome', '买家能获得的结果')}<input maxLength={180} value={outcome} onChange={e => setOutcome(e.target.value)}/></label>
      <label>{t('Public summary', '商品简介')}<textarea maxLength={280} value={summary} onChange={e => setSummary(e.target.value)}/></label>
      <label>{t('Creator price (USD)', '创作者售价（美元）')}<input type="number" min="1" max="100000" step="0.01" value={price} onChange={e => setPrice(e.target.value)}/></label>
      <p className="pw-muted">{t('Apptopia shows its platform fee and the final buyer total before checkout.', 'Apptopia 会在购买前展示平台费用和买家最终总价。')}</p>
      <label>{t('Download access days after payment', '付款后可下载天数')}<input type="number" min="1" max="3650" value={days} onChange={e => setDays(e.target.value)}/></label>
      <label>{t('License for', '授权对象')}<select value={scope} onChange={e => setScope(e.target.value)}><option value="individual">{t('Individual', '个人')}</option><option value="organization">{t('Organization', '组织')}</option></select></label>
      <label>{t('License summary', '授权摘要')}<textarea minLength={30} maxLength={2000} value={licenseSummary} onChange={e => setLicenseSummary(e.target.value)}/></label>
      <label>{t('Full license included with the package', '随安装包交付的完整许可证')}<textarea rows={6} minLength={80} maxLength={16000} value={license} onChange={e => setLicense(e.target.value)}/></label>
      <label>{t('Installation check: input, steps and expected result', '安装检查：输入、步骤和预期结果')}<textarea rows={4} minLength={40} maxLength={8000} value={instructions} onChange={e => setInstructions(e.target.value)}/></label>
      {requiresSources && <label>{t('Documents the buyer must provide', '买家必须提供的资料')}<textarea rows={4} minLength={80} maxLength={4000} value={sourceInstructions} onChange={e => setSourceInstructions(e.target.value)} placeholder={t('Describe the document contents, usable formats and an example check using the buyer’s own data. Do not include private document names or contents.', '说明资料应包含的内容、可用格式，以及如何用买家自己的数据检查结果。不要填写私人文件名或文件内容。')}/></label>}
      <label>{t('Buyer support email', '买家支持邮箱')}<input type="email" maxLength={254} value={supportEmail} onChange={e => setSupportEmail(e.target.value)}/></label>
    </fieldset>
    <label className="ar-portable-consent"><input type="checkbox" disabled={busy || !configuration || !!unsupported} checked={share} onChange={e => setShare(e.target.checked)}/>{t('I reviewed the exported prompt and model configuration and authorize sharing this exact version with Apptopia and its buyers.', '我已检查导出的提示词和模型配置，同意将此准确版本分享给 Apptopia 及买家。')}</label>
    <label className="ar-portable-consent"><input type="checkbox" disabled={busy || !configuration || !!unsupported} checked={rights} onChange={e => setRights(e.target.checked)}/>{t('I have the right to sell this configuration under the included license, including perpetual use of the purchased version.', '我有权按附带许可证售卖此配置，授权买家永久使用所购版本。')}</label>
    {requiresSources && <label className="ar-portable-consent"><input type="checkbox" disabled={busy || !configuration || !!unsupported} checked={sourceConsent} onChange={e => setSourceConsent(e.target.checked)}/>{t('I confirm this is a configuration that requires buyer-provided documents. My original documents are not part of the sale, and the buyer must bind suitable sources and evaluate the imported agent.', '我确认售卖的是需要买家自备资料的配置，原始文档不在售卖范围内。买家需要绑定合适的资料，并重新测评导入的 Agent。')}</label>}
    {includeSources && <label className="ar-portable-consent"><input type="checkbox" disabled={busy || !configuration || !!unsupported} checked={sourceRights} onChange={e => setSourceRights(e.target.checked)}/>{t('I own or hold the rights to these documents, they contain no credentials or personal data I am not allowed to share, and I license copies to buyers under the included license.', '我拥有这些文档的权利（或已获授权），其中不含凭据或不可分享的个人数据，并按附带许可证向买家授权副本。')}</label>}
    {!!tools.length && <label className="ar-portable-consent"><input type="checkbox" disabled={busy || !configuration || unsupported} checked={toolConsent} onChange={e=>setToolConsent(e.target.checked)}/>{t('I reviewed these built-in capabilities and described an installation check that verifies actual tool outputs. Buyers must use a compatible Forge Pi runtime under their own account.', '我已检查这些内置能力，并提供了验证实际工具输出的安装步骤。买家需要在自己的账号下使用兼容的 Forge Pi 执行环境。')}</label>}
    {error && <p role="alert" className="pw-error">{error}</p>}
    <button className="pw-primary" disabled={busy || !share || !rights || !!unsupported || (!!tools.length && !toolConsent) || (includeSources && !sourceRights) || (requiresSources && (!sourceConsent || sourceInstructions.trim().length < 80))} onClick={() => void action(async () => {
      const result = await api(`${base}/apptopia-package`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary, outcome, amountCents: Math.round(Number(price) * 100), downloadDays: Number(days), licenseScope: scope, licenseSummary, license, instructions, supportEmail, acceptConfigurationSharing: share, acceptRedistributionRights: rights, ...(tools.length ? {acceptToolCapabilities:toolConsent} : {}), ...(includeSources ? {includeSourceFiles:true,acceptSourceFileRedistribution:sourceRights} : {}), ...(requiresSources ? {buyerSourceInstructions:sourceInstructions,acceptBuyerSourceSetup:sourceConsent} : {}) }) });
      setHandoff(result.data.url);
    })}>{busy ? t('Preparing…', '准备中…') : t('Prepare package for Apptopia', '准备 Apptopia 商品包')}</button>
    {handoff && <p role="status"><a className="ar-portable-next" href={handoff}>{t('Continue to Apptopia →', '前往 Apptopia 继续上架 →')}</a><br/>{t('Your package and offer are ready to import. Independent installation and license review is required before buyers can purchase.', '安装包和商品条款已准备好导入。完成独立安装与授权审核后，买家才能购买。')}</p>}
  </details>;
}
