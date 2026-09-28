'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUiLanguage } from '../../lib/ui-language';
import { AgentReleasePanel } from './AgentReleasePanel';
import { AgentAuthoring } from './AgentAuthoring';
import { LibraryUploadQueue } from './LibraryUploadQueue';

type Api = (path: string, options?: RequestInit) => Promise<any>;
type Folder = { id: string; name: string; parent_id: string | null };
type Document = { id: string; filename: string; folder_id: string | null; size: number; mime_type: string; extraction_status: string; text_chars: number };
type Agent = { id: string; name: string; system_prompt: string; model: string; active: number; tools?: string | string[] };
type Model = { id: string; name: string; isDefault: boolean; available: boolean; pricing: { input: number; output: number } };
type Check = { id: string; prompt: string; response: string; model: string; charge_usd: number | null; created_at: string; sources: { id: string; filename: string; excerpt: string }[] };
const emptyDraft = { name: '', system_prompt: '', model: '', tools: [] as string[] };
const agentTools = (agent: Agent): string[] => {
  try { const value = typeof agent.tools === 'string' ? JSON.parse(agent.tools) : agent.tools; return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  catch { return []; }
};
const publishedTools = [
  ['create_artifact','Create downloadable files','生成可下载文件'],
  ['web_search','Search the public web','搜索公开网页'],
  ['web_scrape','Read public webpages','读取公开网页'],
  ['http_request','Read public API data','读取公开 API 数据'],
] as const;
const bytes = (value: number) => value >= 1048576 ? `${(value / 1048576).toFixed(1)} MB` : `${(value / 1024).toFixed(1)} KB`;
const textFile = (name: string, mime: string) => /^text\//.test(mime) || /\.(txt|md|csv|json|js|ts|tsx|jsx|html|css|py|yml|yaml|xml|sql|sh|log)$/i.test(name);
function download(content: BlobPart, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/octet-stream' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PersonalWorkspace({ api, accountKey, initialView = 'library', onAgentsChanged, onBilling, onUseAgent, onUseRelease }: { api: Api; accountKey:string; initialView?: 'library' | 'agents'; onAgentsChanged?: () => void; onBilling?: () => void; onUseAgent?: (id: string, model: string) => void; onUseRelease?: (agentId:string,releaseId:string)=>Promise<void> }) {
  const apiRef = useRef(api); apiRef.current = api;
  const [uiLanguage, setUiLanguage] = useUiLanguage();
  const zh = uiLanguage === 'zh';
  const t = (en: string, cn: string) => zh ? cn : en;
  const [view, setView] = useState<'library' | 'agents'>(initialView);
  const [files, setFiles] = useState<Document[]>([]), [folders, setFolders] = useState<Folder[]>([]), [agents, setAgents] = useState<Agent[]>([]), [models, setModels] = useState<Model[]>([]);
  const [usage, setUsage] = useState({ bytes: 0, limitBytes: 52428800, maxFileBytes: 5242880 });
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null), [query, setQuery] = useState(''), [folderName, setFolderName] = useState('');
  const [selected, setSelected] = useState<string | null>(null), [preview, setPreview] = useState<any>(null), [rename, setRename] = useState(''), [confirmDelete, setConfirmDelete] = useState(false);
  const [agentId, setAgentId] = useState(''), [draft, setDraft] = useState(emptyDraft), [dirty, setDirty] = useState(false);
  const [toolsDirty, setToolsDirty] = useState(false);
  const [sourceFiles, setSourceFiles] = useState<string[]>([]), [sourceFolders, setSourceFolders] = useState<string[]>([]), [checks, setChecks] = useState<Check[]>([]), [prompt, setPrompt] = useState('');
  const loadSequence = useRef(0), agentSequence = useRef(0);
  const packageRef = useRef<HTMLInputElement>(null);

  const request = useCallback(async (path: string, options?: RequestInit) => {
    const result = await apiRef.current(path, options);
    if (result?.success === false) throw new Error(result.error || 'REQUEST_FAILED');
    return result;
  }, []);
  const refresh = useCallback(async () => {
    const sequence = ++loadSequence.current;
    try {
      const [library, people, catalogue] = await Promise.all([request('/library'), request('/workspace-agents'), request('/desktop/models')]);
      if (sequence !== loadSequence.current) return;
      setFiles(library.data.files); setFolders(library.data.folders); setUsage(library.data.usage); setAgents(people.data); setModels(catalogue.data);
      const defaultModel = catalogue.data.find((model: Model) => model.isDefault && model.available) || catalogue.data.find((model: Model) => model.available);
      setDraft(current => current.model ? current : { ...current, model: defaultModel?.id || '' });
    } catch (caught: any) { if (sequence === loadSequence.current) setError(caught.message); }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, [request]);
  useEffect(() => { void refresh(); return () => { loadSequence.current++; agentSequence.current++; }; }, [refresh]);
  useEffect(() => {
    let current = true; setPreview(null); setConfirmDelete(false);
    if (selected) request(`/userfiles/${encodeURIComponent(selected)}`).then(result => { if (current) { setPreview(result.data); setRename(result.data.filename); } }).catch(caught => { if (current) setError(caught.message); });
    return () => { current = false; };
  }, [selected, request]);
  const act = async (label: string, run: () => Promise<void>) => {
    if (busy) return; setBusy(label); setError(''); setNotice('');
    try { await run(); } catch (caught: any) { setError(caught.message || 'REQUEST_FAILED'); } finally { setBusy(''); }
  };
  const json = (method: string, body: any, paid = false): RequestInit => ({ method, headers: { 'Content-Type': 'application/json', ...(paid ? { 'Idempotency-Key': crypto.randomUUID() } : {}) }, body: JSON.stringify(body) });
  const chooseAgent = async (id: string) => {
    const sequence = ++agentSequence.current; setAgentId(id); setChecks([]); setSourceFiles([]); setSourceFolders([]); setError(''); setDirty(true);
    const row = agents.find(agent => agent.id === id);
    setToolsDirty(false); setDraft(row ? { name: row.name, system_prompt: row.system_prompt, model: row.model, tools: agentTools(row) } : { ...emptyDraft, model: models.find(model => model.isDefault)?.id || '' });
    if (!id) return;
    try {
      const [sources, history] = await Promise.all([request(`/workspace-agents/${id}/knowledge`), request(`/workspace-agents/${id}/checks`)]);
      if (sequence !== agentSequence.current) return;
      setSourceFiles(sources.data.fileIds); setSourceFolders(sources.data.folderIds); setChecks(history.data); setDirty(false);
    } catch (caught: any) { if (sequence === agentSequence.current) setError(caught.message); }
  };
  const saveAgent = () => act('save', async () => {
    const {tools,...fields} = draft;
    const result = await request(agentId ? `/workspace-agents/${agentId}` : '/workspace-agents', json(agentId ? 'PATCH' : 'POST', {...fields,...(!agentId || toolsDirty ? {tools} : {})}));
    const id = result.data.id; setAgentId(id);
    await request(`/workspace-agents/${id}/knowledge`, json('PUT', { fileIds: sourceFiles, folderIds: sourceFolders }));
    setDirty(false); setToolsDirty(false); await refresh(); onAgentsChanged?.(); setNotice(t('Agent and attached sources saved. You can now try it.', 'Agent 与绑定资料已保存，可以开始试运行。'));
  });
  const openSavedAgent = async (id: string) => {
    const sequence = ++agentSequence.current;
    const [people, sources, history] = await Promise.all([request('/workspace-agents'), request(`/workspace-agents/${id}/knowledge`), request(`/workspace-agents/${id}/checks`)]);
    if (sequence !== agentSequence.current) return;
    const row = people.data.find((agent: Agent) => agent.id === id);
    if (!row) throw new Error('AGENT_NOT_FOUND');
    setAgents(people.data); setAgentId(id); setToolsDirty(false); setDraft({ name: row.name, system_prompt: row.system_prompt, model: row.model, tools: agentTools(row) });
    setSourceFiles(sources.data.fileIds); setSourceFolders(sources.data.folderIds); setChecks(history.data); setDirty(false); setView('agents'); onAgentsChanged?.();
  };
  const errors: Record<string, string> = {
    AGENT_PACKAGE_TOOL_SETUP_INVALID: t('This package has unsupported or inconsistent tool capabilities. Ask the creator for a compatible original Forge package.', '此安装包的工具能力不受支持或不一致，请向创作者索取兼容的原始 Forge 安装包。'),
    AGENT_PACKAGE_SOURCE_FILES_INVALID: t('This package lists included documents that are missing or inconsistent. Ask the creator for the original compatible package.', '此安装包声明的随包文档缺失或不一致，请向创作者索取兼容的原始安装包。'),
    AGENT_PACKAGE_ZIP_REQUIRED: t('This package includes documents, so import the original ZIP from Apptopia instead of its agent JSON.', '此安装包含有随包文档，请导入从 Apptopia 下载的原始 ZIP，而不是其中的 Agent JSON。'),
    AGENT_PACKAGE_SOURCE_SETUP_INVALID: t('This package has missing or invalid source setup instructions. Ask the creator for the original compatible package.', '此安装包的资料配置说明缺失或无效，请向创作者索取兼容的原始安装包。'),
    AGENT_PACKAGE_INVALID: t('Select the agent JSON inside your downloaded package, up to 64 KB.', '请选择下载包内的 Agent JSON 文件，大小不超过 64 KB。'),
    AGENT_PACKAGE_ZIP_INVALID: t('Select the original Forge ZIP downloaded from Apptopia, without extracting or repacking it. You can also import its agent JSON.', '请选择从 Apptopia 下载的原始 Forge ZIP，无需解压或重新打包。也可以导入包内的 Agent JSON。'),
    AGENT_PACKAGE_ZIP_TOO_LARGE: t('Forge installation ZIPs must be no larger than 1 MB.', 'Forge 安装 ZIP 不能超过 1 MB。'),
    AGENT_PACKAGE_INTEGRITY_FAILED: t('This configuration does not match its package checksum. Download the original package again.', '配置与包内校验值不符，请重新下载原始包。'),
    AGENT_IMPORT_DRAFT_REMOVED: t('The draft previously imported from this package was removed. Create a new agent to start again.', '这个包之前导入的草稿已被删除。如需重新开始，请新建 Agent。'),
    AGENT_DISABLED: t('This agent is disabled. Enable it in your workspace before continuing.', '此 Agent 已停用，请先在工作区启用。'),
    AGENT_IMPORT_UNCONFIRMED: t('Import could not be confirmed. Select the same file again to recover your saved draft without creating a duplicate.', '暂未确认导入结果。再次选择同一文件即可找回已保存的草稿，不会重复创建。'),
    LIBRARY_FILE_TOO_LARGE: t('This file exceeds the 5 MB upload limit.', '文件超过 5 MB 上传上限。'),
    LIBRARY_STORAGE_LIMIT: t('Your library is full. Remove unused files before uploading.', '资料库容量已满，请先移除不再需要的文件。'),
    LIBRARY_FOLDER_NOT_EMPTY: t('Move the files and subfolders out before deleting this folder.', '请先移出文件和子文件夹，再删除此文件夹。'),
    LIBRARY_FOLDER_EXISTS: t('A folder with this name already exists here.', '当前位置已有同名文件夹。'),
    LIBRARY_INVALID_NAME: t('Use a name without slashes or control characters.', '名称不能包含斜杠或控制字符。'),
    LIBRARY_INVALID_SELECTION: t('Attach up to 50 files and 50 folders per agent.', '每个 Agent 最多绑定 50 个文件和 50 个文件夹。'),
    BILLING_INSUFFICIENT_FUNDS: t('Not enough Forge credit for this request. Review billing or select a lighter model.', 'Forge 额度不足，请查看账单或选择轻量模型。'),
    BILLING_PAID_CREDITS_REQUIRED: t('This model requires paid Forge credit.', '此模型需要付费 Forge 额度。'),
    BILLING_ACCOUNT_REVIEW_REQUIRED: t('Payments are under review. Check your billing status.', '付款正在核对，请查看账单状态。'),
    DESKTOP_USAGE_SETTLEMENT_PENDING: t('The request cost is being reconciled. It has not been retried automatically.', '请求费用正在核对，系统没有自动重复发起请求。'),
    AGENT_DRAFT_FORMAT_INVALID: t('The model returned an invalid draft. This request may still have a usage charge; you can edit the draft manually.', '模型返回的草稿格式不正确。本次请求仍可能产生费用，你可以手动编辑草稿。'),
    DESKTOP_MODEL_UNAVAILABLE: t('Select an available Forge model before continuing.', '请先选择可用的 Forge 模型。'),
  };
  const visible = files.filter(file => query ? file.filename.toLowerCase().includes(query.toLowerCase()) : file.folder_id === folderId);
  const breadcrumb: Folder[] = []; let ancestor = folderId;
  while (ancestor && breadcrumb.length < 200) { const row = folders.find(folder => folder.id === ancestor); if (!row || breadcrumb.includes(row)) break; breadcrumb.unshift(row); ancestor = row.parent_id; }
  const status = (file: Document) => file.extraction_status === 'ready' ? t('Ready to read', '可读取') : file.extraction_status === 'ocr' ? t('OCR text - review original', '扫描识别 · 请核对原件') : file.extraction_status === 'partial' ? t('Partial text', '部分文本') : file.extraction_status === 'failed' ? t('Reading failed', '读取失败') : t('Stored only', '仅存储');
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(value => value !== id) : [...list, id];

  return <section className="personal-workspace" aria-label={t('Personal workspace', '个人工作区')}>
    <style>{WORKSPACE_CSS}</style>
    <header className="pw-header"><div><div className="pw-eyebrow">FORGE / PERSONAL WORKSPACE</div><h1>{t('Your knowledge. Your agents.', '你的资料，你的 Agent。')}</h1><p>{t('Give your work a home. Give your agents the context to do it well.', '整理工作资料，让 Agent 带着可靠的上下文开始工作。')}</p></div>
      <select aria-label={t('Language', '语言')} value={zh ? 'zh' : 'en'} onChange={event => setUiLanguage(event.target.value === 'zh' ? 'zh' : 'en')}><option value="en">English</option><option value="zh">中文</option></select></header>
    <nav className="pw-tabs" aria-label={t('Workspace views', '工作区视图')}><button aria-current={view === 'library' ? 'page' : undefined} onClick={() => setView('library')}>{t('Personal library', '个人资料库')} <span>{files.length}</span></button><button aria-current={view === 'agents' ? 'page' : undefined} onClick={() => setView('agents')}>{t('Agent studio', 'Agent 工作台')} <span>{agents.length}</span></button><button className="pw-refresh" disabled={!!busy} onClick={() => void refresh()}>{t('Refresh', '刷新')}</button></nav>
    <input ref={packageRef} type="file" accept=".json,.zip" hidden onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void act('import', async () => {
      const isZip = /\.zip$/i.test(file.name);
      if (file.size > (isZip ? 1048576 : 64000)) throw new Error(isZip ? 'AGENT_PACKAGE_ZIP_TOO_LARGE' : 'AGENT_PACKAGE_INVALID');
      let pack: any;
      if (!isZip) {
        try { pack = JSON.parse(await file.text()); } catch { throw new Error('AGENT_PACKAGE_INVALID'); }
        if (pack?.format !== 'forge.agent' || !/^[a-f0-9]{64}$/.test(pack?.sha256)) throw new Error('AGENT_PACKAGE_INVALID');
      }
      let result: any;
      try {
        result = isZip
          ? await request('/agent-packages/import-zip', { method: 'POST', headers: { 'Content-Type': 'application/zip' }, body: file })
          : await request('/agent-packages/import', { ...json('POST', pack), headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `package-import:${pack.sha256}` } });
        await openSavedAgent(result.data.id);
      } catch (caught: any) {
        throw new Error(caught.message?.startsWith('AGENT_') || caught.message === 'LIBRARY_STORAGE_LIMIT' ? caught.message : 'AGENT_IMPORT_UNCONFIRMED');
      }
      setNotice(result.data.replayed
        ? t('Opened your previously imported agent. Your saved changes are preserved. Review its evaluation before publishing or using it.', '已打开之前导入的 Agent，并保留你的修改。发布或使用前，请检查测评结果。')
        : result.data.importedSourceFiles
          ? t(`Agent imported as a new draft with ${result.data.importedSourceFiles} included document(s) copied into your library and attached. Review them and run your own evaluation before publishing.`, `已将 Agent 导入为新草稿，随包的 ${result.data.importedSourceFiles} 份文档已复制到你的资料库并完成绑定。请检查文档内容，并完成测评后再发布。`)
          : t('Agent imported as a new draft. Bind your sources and run your own evaluation before publishing.', '已将 Agent 导入为新草稿。请绑定自己的资料，并完成测评后再发布。'));
    }); }}/>
    {view === 'agents' && <div className="pw-actions"><button disabled={!!busy || dirty} onClick={() => packageRef.current?.click()}>{t('Import agent package', '导入 Agent 包')}</button><span className="pw-muted">{t('Select your Forge ZIP from Apptopia or an agent JSON. No extraction needed for ZIPs. Tools still require normal permissions.', '选择 Apptopia 下载的 Forge ZIP 或 Agent JSON。ZIP 无需解压，工具仍需按正常权限使用。')}</span></div>}
    {error && <div className="pw-message pw-error" role="alert">{errors[error] || t('The operation could not be completed. Your saved work is preserved. Refresh and try again.', '操作未完成，已保存的工作会保留。请刷新后重试。')} {error.startsWith('BILLING_') && onBilling && <button onClick={onBilling}>{t('View billing', '查看账单')}</button>}</div>}
    {notice && <div className="pw-message" role="status">{notice}</div>}
    {busy && busy!=='upload' && <div className="pw-progress" role="status">{busy === 'draft' || busy === 'test' ? t('Forge is working. Model usage draws from your Forge credit…', 'Forge 正在处理，模型调用将使用你的 Forge 额度…') : t('Saving your changes…', '正在保存更改…')}</div>}
    {loading ? <div className="pw-empty">{t('Opening your workspace…', '正在打开你的工作区…')}</div> : view === 'library' ? <div className="pw-library">
      <aside className="pw-sidebar"><div className="pw-section-label">{t('COLLECTIONS', '文件夹')}</div><button className={!folderId ? 'pw-folder active' : 'pw-folder'} onClick={() => { setFolderId(null); setQuery(''); setSelected(null); }}>▤ {t('My library', '我的资料库')}</button>
        {folders.filter(folder => folder.parent_id === folderId).map(folder => <button className="pw-folder" key={folder.id} onClick={() => { setFolderId(folder.id); setQuery(''); setSelected(null); }}>▱ {folder.name}</button>)}
        <form className="pw-folder-form" onSubmit={event => { event.preventDefault(); void act('folder', async () => { await request('/library/folders', json('POST', { name: folderName, parentId: folderId })); setFolderName(''); await refresh(); }); }}><input aria-label={t('New folder name', '新文件夹名称')} placeholder={t('New folder name', '新文件夹名称')} value={folderName} onChange={event => setFolderName(event.target.value)} maxLength={200}/><button disabled={!!busy || !folderName.trim()}>{t('+ Add folder', '+ 新建文件夹')}</button></form>
        {folderId && <button className="pw-subtle" disabled={!!busy} onClick={() => void act('folder-delete', async () => { await request(`/library/folders/${folderId}`, { method: 'DELETE' }); setFolderId(null); await refresh(); })}>{t('Delete empty folder', '删除空文件夹')}</button>}
        <div className="pw-storage"><span>{t('Personal storage', '个人存储')}</span><strong>{bytes(usage.bytes)} <small>/ {bytes(usage.limitBytes)}</small></strong><progress value={usage.bytes} max={usage.limitBytes}/><p>{t('Only files you attach are available to an agent.', '只有你绑定的资料，才会提供给 Agent。')}</p></div></aside>
      <main className="pw-documents"><div className="pw-breadcrumb"><button onClick={() => { setFolderId(null); setQuery(''); }}>{t('My library', '我的资料库')}</button>{breadcrumb.map(folder => <React.Fragment key={folder.id}><span>/</span><button onClick={() => { setFolderId(folder.id); setQuery(''); }}>{folder.name}</button></React.Fragment>)}</div>
        <div className="pw-toolbar"><input type="search" aria-label={t('Search files', '搜索文件')} placeholder={t('Search your library…', '搜索资料库…')} value={query} onChange={event => setQuery(event.target.value)}/></div>
        <LibraryUploadQueue api={request} accountKey={accountKey} folderId={folderId} destination={folders.find(folder=>folder.id===folderId)?.name||t('My library','我的资料库')} zh={zh} disabled={!!busy && busy!=='upload'} maxFileBytes={usage.maxFileBytes} onSaved={refresh} onBusy={value=>setBusy(value?'upload':'')}/>
        <div className="pw-list-header"><span>{t('DOCUMENT', '资料')}</span><span>{t('READING STATUS', '读取状态')}</span></div>
        {!visible.length && <div className="pw-empty"><strong>{query ? t('No matching documents', '没有匹配的资料') : t('A clear space for your next idea.', '为下一项工作，留一处清晰的空间。')}</strong><p>{t('Upload a brief, a price list, or your own working notes.', '可以从项目说明、价格表或工作笔记开始。')}</p></div>}
        {visible.map(file => <button className={`pw-file ${selected === file.id ? 'selected' : ''}`} key={file.id} onClick={() => setSelected(file.id)}><span className="pw-file-icon">{file.filename.split('.').pop()?.slice(0, 4).toUpperCase()}</span><span className="pw-file-name"><strong>{file.filename}</strong><small>{bytes(file.size)}</small></span><span className={`pw-status ${file.extraction_status === 'ready' ? 'ready' : ''}`}>{status(file)}</span></button>)}
      </main><aside className="pw-preview">{!selected ? <div className="pw-preview-empty"><span>↗</span><h2>{t('Keep the source close.', '让依据，始终可见。')}</h2><p>{t('Open a document to preview its text, move it, or download the original.', '打开资料，预览文本、移动文件，或下载原始文件。')}</p><button onClick={() => setView('agents')}>{t('Connect an agent →', '去绑定 Agent →')}</button></div> : !preview ? <p>{t('Opening document…', '正在打开资料…')}</p> : <><div className="pw-section-label">{t('DOCUMENT DETAILS', '资料详情')}</div><h2>{preview.filename}</h2><p className="pw-muted">{bytes(preview.size)} · {preview.mime_type}</p>
        <label>{t('Name', '名称')}<input value={rename} onChange={event => setRename(event.target.value)} maxLength={200}/></label><button disabled={!!busy || !rename.trim() || rename === preview.filename} onClick={() => void act('rename', async () => { await request(`/userfiles/${preview.id}`, json('PATCH', { filename: rename })); setPreview({ ...preview, filename: rename }); await refresh(); })}>{t('Rename', '重命名')}</button>
        <label>{t('Move to', '移动到')}<select value={preview.folder_id || ''} disabled={!!busy} onChange={event => { const next = event.target.value || null; void act('move', async () => { await request(`/userfiles/${preview.id}`, json('PATCH', { folder_id: next })); setPreview({ ...preview, folder_id: next }); await refresh(); }); }}><option value="">{t('My library', '我的资料库')}</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
        <div className="pw-preview-text">{preview.extracted_text || t('No readable text is available. The original is stored, but agents cannot use it as text evidence.', '暂无可读取文本。原文件已保存，Agent 暂时无法将其作为文本依据。')}</div>
        {preview.extraction_status === 'ocr' && <p className="pw-muted">{t('Includes OCR text, which may contain errors or omissions. Verify amounts, dates and names against the original file.', '包含扫描文字识别结果，可能有错漏。金额、日期和姓名请核对原文件。')}</p>}
        {preview.extraction_status === 'partial' && <p className="pw-muted">{t('The first 50,000 characters are available. Split long documents for full coverage.', '当前可读取前 50,000 字符。建议拆分长文档，以覆盖全部内容。')}</p>}
        <div className="pw-actions"><button onClick={() => { const content = textFile(preview.filename, preview.mime_type) ? preview.content : Uint8Array.from(atob(preview.content), char => char.charCodeAt(0)); download(content, preview.filename); }}>{t('Download original', '下载原文件')}</button><button className="pw-danger" disabled={!!busy} onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return; } void act('delete', async () => { await request(`/userfiles/${preview.id}`, { method: 'DELETE' }); setSelected(null); await refresh(); }); }}>{confirmDelete ? t('Confirm deletion', '确认删除') : t('Delete', '删除')}</button></div>
      </>}</aside></div> : <div className="pw-studio">
      <aside className="pw-sidebar"><div className="pw-section-label">{t('YOUR AGENTS', '你的 AGENT')}</div><button className="pw-primary" disabled={!!busy} onClick={() => void chooseAgent('')}>{t('+ Create an agent', '+ 创建 Agent')}</button>{agents.map(agent => <button className={`pw-folder ${agentId === agent.id ? 'active' : ''}`} disabled={!!busy} key={agent.id} onClick={() => void chooseAgent(agent.id)}>◇ {agent.name}</button>)}<p className="pw-muted">{t('Saved agents are available in the conversation agent selector.', '保存后，可以在对话中的 Agent 选择器中启用。')}</p></aside>
      <main className="pw-agent-editor"><div className="pw-section-label">01 / {t('DESIGN THE JOB', '定义工作')}</div><h2>{agentId ? t('Refine your agent.', '打磨你的 Agent。') : t('Start with a conversation.', '从一句话开始。')}</h2><p className="pw-muted">{t('Describe the job, or ask for a change to the current draft. Review everything before saving.', '描述它的工作，或继续提出修改要求。生成的草稿可以编辑，确认后再保存。')}</p>
        <AgentAuthoring key={agentId || 'new'} api={request} zh={zh} draft={draft} disabled={!!busy} onBusy={working => setBusy(working ? 'draft' : '')} onApply={next => { setDraft(current => ({...current,...next})); setDirty(true); }}/>
        <div className="pw-form-grid"><label>{t('Agent name', 'Agent 名称')}<input disabled={busy === 'draft'} value={draft.name} maxLength={200} onChange={event => { setDraft({ ...draft, name: event.target.value }); setDirty(true); }}/></label><label>{t('Model', '模型')}<select disabled={busy === 'draft'} value={draft.model} onChange={event => { setDraft({ ...draft, model: event.target.value }); setDirty(true); }}>{!models.some(model => model.id === draft.model) && <option value={draft.model}>{t('Select an available model', '选择可用模型')}</option>}{models.map(model => <option key={model.id} value={model.id} disabled={!model.available}>{model.name}{!model.available ? t(' · paid credit', ' · 需付费额度') : ''}</option>)}</select></label></div>
        <label>{t('Working instructions', '工作说明')}<textarea disabled={busy === 'draft'} value={draft.system_prompt} maxLength={16000} rows={8} onChange={event => { setDraft({ ...draft, system_prompt: event.target.value }); setDirty(true); }}/></label>
        <details className="pw-message"><summary>{t('Tools for published tasks', '已发布任务的工具能力')}</summary>
          <p className="pw-muted">{t('Choose what this version may do. Saved changes need a new evaluation and publication; previous versions keep their original tools. Answer checks do not execute these tools.', '选择此版本可以使用的能力。保存后需要重新测评和发布，旧版本保留原有工具。回答测评不会实际执行这些工具。')}</p>
          <div className="pw-source-picker">{publishedTools.map(([name,en,cn]) => <label key={name}><input type="checkbox" disabled={!!busy} checked={draft.tools.includes(name)} onChange={() => {setDraft(current => ({...current,tools:toggle(current.tools,name)}));setToolsDirty(true);setDirty(true);}}/><span>{t(en,cn)}</span></label>)}</div>
          <p className="pw-muted">{t('Document search uses only this version’s attached sources. Receipt lookup stays within its task. Web access is public and read-only; account integrations, workspace memory, subagents and host commands are unavailable.', '文档检索只使用此版本绑定的资料，执行回执只在当前任务内查询。联网能力仅访问公开信息，不支持外部写入、账号集成、工作区记忆、子 Agent 或主机命令。')}</p>
          {draft.tools.filter(name => !publishedTools.some(([known]) => known === name) && !['knowledge_search','tool_result_recall'].includes(name)).map(name => <p key={name}>{t('Unavailable in published chat: ', '已发布对话暂不支持：')}{name} <button disabled={!!busy} onClick={() => {setDraft(current=>({...current,tools:current.tools.filter(item=>item!==name)}));setToolsDirty(true);setDirty(true);}}>{t(`Remove ${name}`, `移除 ${name}`)}</button></p>)}
        </details>
        <div className="pw-section-label">02 / {t('ATTACH THE CONTEXT', '绑定资料')}</div><p className="pw-muted">{t('Folder bindings include their subfolders and future uploads. Other personal files remain outside this agent’s context.', '绑定文件夹后，会包含子文件夹与之后上传的资料。其他个人资料不会自动提供给此 Agent。')}</p>
        <div className="pw-source-picker">{!files.length && !folders.length && <p>{t('Upload your first document in Personal library.', '请先在个人资料库上传资料。')}</p>}{folders.map(folder => <label key={folder.id}><input type="checkbox" checked={sourceFolders.includes(folder.id)} onChange={() => { setSourceFolders(toggle(sourceFolders, folder.id)); setDirty(true); }}/><span>▱ {folder.name}</span><small>{t('Folder', '文件夹')}</small></label>)}{files.map(file => <label key={file.id}><input type="checkbox" checked={sourceFiles.includes(file.id)} onChange={() => { setSourceFiles(toggle(sourceFiles, file.id)); setDirty(true); }}/><span>{file.filename}</span><small>{status(file)}</small></label>)}</div>
        <div className="pw-save-row"><span className="pw-muted">{sourceFolders.length} {t('folders', '个文件夹')} · {sourceFiles.length} {t('files', '个文件')}{dirty ? t(' · Unsaved changes', ' · 尚未保存') : ''}</span><button className="pw-primary" disabled={!!busy || !draft.name.trim() || !draft.system_prompt.trim() || !draft.model} onClick={saveAgent}>{t('Save agent', '保存 Agent')}</button></div>
      </main><aside className="pw-try"><div className="pw-section-label">03 / {t('TRY & DELIVER', '试运行与交付')}</div><h2>{t('Put it to work.', '交给它一项真实任务。')}</h2><p className="pw-muted">{t('This answer check uses your saved instructions and document excerpts. It does not execute tools or certify quality.', '回答试运行会使用已保存的说明和资料片段，不执行工具，也不自动判定质量合格。')}</p><label>{t('A sample task', '测试任务')}<textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={4} maxLength={4000} placeholder={t('What does my price list say about annual billing?', '我的价格表如何规定年付价格？')}/></label>
        {onUseAgent && <button disabled={!!busy || !agentId || dirty} onClick={() => onUseAgent(agentId, draft.model)}>{t('Use in conversation →', '在对话中使用 →')}</button>}
        <button className="pw-primary" disabled={!!busy || !agentId || dirty || !prompt.trim()} onClick={() => void act('test', async () => { const result = await request(`/workspace-agents/${agentId}/test`, json('POST', { prompt }, true)); setChecks(current => [result.data, ...current.filter(check => check.id !== result.data.id)].slice(0, 20)); if (result.knowledge?.unreadableFiles || result.knowledge?.omittedFiles) setNotice(t(`${result.knowledge.unreadableFiles} unreadable files; ${result.knowledge.omittedFiles} readable files were outside this excerpt selection.`, `${result.knowledge.unreadableFiles} 份资料无法读取；${result.knowledge.omittedFiles} 份可读资料未进入本次片段选择。`)); })}>{t('Run answer check', '试运行回答')}</button>
        {(!agentId || dirty) && <p className="pw-muted">{t('Save the agent and its sources before running.', '请先保存 Agent 与资料绑定。')}</p>}
        {checks.map((check, index) => <article className="pw-check" key={check.id}><div className="pw-check-meta"><span>{index === 0 ? t('LATEST CHECK', '最近试运行') : t('PREVIOUS CHECK', '历史试运行')}</span><span>{check.charge_usd == null ? t('Cost pending', '费用待核对') : `$${check.charge_usd.toFixed(6)}`}</span></div><strong>{check.prompt}</strong><div className="pw-answer">{check.response}</div>{check.sources.map(source => <details key={source.id}><summary>{source.filename}</summary><p>{source.excerpt}</p></details>)}<button onClick={() => download(`# ${draft.name}\n\n${check.response}\n\n---\nModel: ${check.model}\nRequest: ${check.id}\nSources:\n${check.sources.map(source => `- ${source.filename} [file:${source.id}]`).join('\n')}`, `${(draft.name || 'Forge-result').replace(/[<>:"/\\|?*]/g, '-')}-result.md`)}>{t('Export result ↓', '导出结果 ↓')}</button></article>)}
      </aside></div>}
    {view === 'agents' && agentId && <AgentReleasePanel key={agentId} agentId={agentId} dirty={dirty || !!busy} zh={zh} api={request} onRestored={() => openSavedAgent(agentId)} onUseRelease={onUseRelease}/>}
  </section>;
}

const WORKSPACE_CSS = `
.personal-workspace{--pw-bg:#111314;--pw-panel:#181b1c;--pw-line:#303537;--pw-text:#f2f0e9;--pw-muted:#a5aaa7;--pw-accent:#d5ed9a;flex:1;min-width:0;overflow:auto;background:var(--pw-bg);color:var(--pw-text);font-family:'Segoe UI Variable Text','Segoe UI',sans-serif;font-size:14px;line-height:1.5;padding:32px 36px 40px}
.personal-workspace *{box-sizing:border-box}.personal-workspace button,.personal-workspace input,.personal-workspace select,.personal-workspace textarea{font:inherit}.personal-workspace button{cursor:pointer;color:inherit;border:1px solid var(--pw-line);background:transparent;border-radius:7px;padding:8px 12px;transition:background .15s,border-color .15s}.personal-workspace button:hover{background:#262c29;border-color:#64715e}.personal-workspace button:disabled{opacity:.42;cursor:not-allowed}.personal-workspace :focus-visible{outline:2px solid var(--pw-accent);outline-offset:3px}.personal-workspace input:not([type=checkbox]),.personal-workspace textarea,.personal-workspace select{width:100%;padding:10px 11px;border:1px solid var(--pw-line);border-radius:7px;background:#101213;color:var(--pw-text)}.personal-workspace textarea{resize:vertical}.personal-workspace input[type=checkbox]{accent-color:var(--pw-accent)}.personal-workspace label{display:grid;gap:7px;color:var(--pw-muted);font-size:12px;margin:14px 0}.personal-workspace h1,.personal-workspace h2{font-family:Georgia,'Noto Serif SC',serif;color:var(--pw-text);font-weight:400;letter-spacing:-.035em}.personal-workspace h1{font-size:clamp(28px,3vw,43px);line-height:1.15;margin:10px 0}.personal-workspace h2{font-size:26px;line-height:1.2;margin:12px 0}.pw-header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}.pw-header p{color:var(--pw-muted);margin:12px 0 24px}.pw-header select{max-width:105px}.pw-eyebrow,.pw-section-label{font-size:10px;letter-spacing:.14em;font-weight:600;color:var(--pw-muted)}.pw-eyebrow{color:var(--pw-accent)}.pw-tabs{display:flex;gap:22px;align-items:center;border-bottom:1px solid var(--pw-line);margin-bottom:25px}.pw-tabs button{border:0;border-bottom:2px solid transparent;border-radius:0;padding:12px 0}.pw-tabs button[aria-current=page]{border-bottom-color:var(--pw-accent);color:var(--pw-accent)}.pw-tabs span{font-size:11px;background:#2b302d;border-radius:4px;padding:2px 5px;margin-left:6px}.pw-tabs .pw-refresh{margin-left:auto;font-size:12px;color:var(--pw-muted)}.pw-library,.pw-studio{display:grid;grid-template-columns:180px minmax(260px,1fr) minmax(250px,310px);min-height:620px;gap:26px}.pw-sidebar{display:flex;flex-direction:column;gap:8px;padding-top:8px}.pw-folder{border:0!important;text-align:left;overflow-wrap:anywhere}.pw-folder.active{background:#242d22!important;color:var(--pw-accent)}.pw-folder-form{display:grid;gap:8px;margin-top:16px}.pw-storage{margin-top:auto;padding-top:30px;color:var(--pw-muted);font-size:12px}.pw-storage strong{display:block;color:var(--pw-text);font-weight:500;margin:8px 0}.pw-storage small{color:var(--pw-muted)}.pw-storage progress{width:100%;height:4px;accent-color:var(--pw-accent)}.pw-storage p{font-size:11px}.pw-breadcrumb{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-bottom:12px}.pw-breadcrumb button{border:0;padding:4px;color:var(--pw-muted);font-size:11px}.pw-toolbar{display:flex;gap:10px}.pw-toolbar input{min-width:0}.personal-workspace .pw-primary{background:var(--pw-accent);color:#182014;border-color:var(--pw-accent);font-weight:600;white-space:nowrap}.personal-workspace .pw-primary:hover{background:#e2f4b6}.pw-drop{display:flex;gap:16px;padding:22px 18px;margin:20px 0;border:1px dashed #444d42;border-radius:10px;background:#1a2018}.pw-drop>span{font-size:30px;color:var(--pw-accent)}.pw-drop strong{font-weight:500;font-size:13px}.pw-drop p{margin:5px 0 0;color:var(--pw-muted);font-size:11px}.pw-list-header{display:flex;justify-content:space-between;font-size:9px;letter-spacing:.08em;color:var(--pw-muted);padding:10px 8px;border-bottom:1px solid var(--pw-line)}.personal-workspace .pw-file{display:flex;width:100%;gap:12px;align-items:center;text-align:left;padding:15px 8px;border:0;border-bottom:1px solid #272c2d;border-radius:0}.pw-file.selected{background:#20291f}.pw-file-icon{width:34px;height:39px;display:grid;place-items:center;border:1px solid #424943;border-radius:4px;font-size:9px;color:var(--pw-accent);flex-shrink:0}.pw-file-name{flex:1;min-width:0}.pw-file-name strong{display:block;font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pw-file-name small{font-size:10px;color:var(--pw-muted)}.pw-status{color:#d4b67f;background:#322c22;padding:4px 7px;border-radius:4px;font-size:9px;white-space:nowrap}.pw-status.ready{color:var(--pw-accent);background:#263021}.pw-preview,.pw-try{background:var(--pw-panel);border:1px solid var(--pw-line);border-radius:12px;padding:22px;min-width:0;align-self:start}.pw-preview h2{overflow-wrap:anywhere}.pw-preview-empty{padding:36px 0}.pw-preview-empty>span{font-size:40px;color:var(--pw-accent)}.pw-preview-empty p,.pw-muted{color:var(--pw-muted);font-size:12px;line-height:1.6}.pw-preview-text{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;font-size:12px;padding:14px;background:#101313;border:1px solid var(--pw-line);border-radius:7px;margin:18px 0}.pw-actions{display:flex;gap:8px;flex-wrap:wrap}.personal-workspace .pw-danger{color:#efa697}.pw-empty{text-align:center;padding:55px 16px;color:var(--pw-muted)}.pw-empty strong{color:var(--pw-text);font-weight:500}.pw-empty p{font-size:12px}.pw-message{padding:12px 15px;border:1px solid #455440;background:#1c281b;border-radius:8px;margin:12px 0 20px;color:#d0e0c4}.pw-message.pw-error{border-color:#684438;background:#2e211e;color:#f1c6b5}.pw-progress{font-size:12px;color:var(--pw-accent);margin-bottom:16px}.pw-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pw-agent-editor{min-width:0}.pw-agent-editor>.pw-section-label{margin-top:24px}.pw-agent-editor>.pw-section-label:first-child{margin-top:8px}.pw-source-picker{max-height:270px;overflow:auto;border:1px solid var(--pw-line);border-radius:8px;padding:8px 12px}.pw-source-picker label{display:flex;align-items:center;gap:10px;padding:7px 0;margin:0}.pw-source-picker label span{color:var(--pw-text);overflow-wrap:anywhere;flex:1}.pw-source-picker label small{font-size:9px;color:var(--pw-muted)}.pw-save-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:22px 0}.pw-check{border-top:1px solid var(--pw-line);margin-top:24px;padding-top:18px}.pw-check-meta{display:flex;justify-content:space-between;gap:8px;font-size:9px;color:var(--pw-accent);margin-bottom:10px}.pw-check>strong{font-size:12px;font-weight:600;overflow-wrap:anywhere}.pw-answer{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.7;margin:16px 0;max-height:430px;overflow:auto}.pw-check details{font-size:11px;color:var(--pw-muted);margin:8px 0}.pw-check summary{cursor:pointer;overflow-wrap:anywhere}.pw-check details p{white-space:pre-wrap;overflow-wrap:anywhere}.pw-check>button{margin-top:10px;font-size:11px}.pw-subtle{font-size:11px!important;color:var(--pw-muted)!important}
@media(max-width:1150px){.personal-workspace{padding:24px}.pw-library,.pw-studio{grid-template-columns:150px minmax(230px,1fr);gap:20px}.pw-preview,.pw-try{grid-column:2}.pw-sidebar{grid-row:span 2}.pw-storage{margin-top:40px}}
@media(max-width:650px){.personal-workspace{padding:18px 14px}.pw-header{gap:10px}.pw-header p{font-size:12px}.pw-header select{max-width:90px}.pw-eyebrow{font-size:8px}.pw-tabs{gap:12px}.pw-tabs button{font-size:12px}.pw-library,.pw-studio{display:flex;flex-direction:column;gap:22px}.pw-sidebar{padding:0}.pw-storage{margin-top:12px}.pw-sidebar .pw-storage p{display:none}.pw-folder-form{grid-template-columns:1fr auto;margin-top:6px}.pw-form-grid{grid-template-columns:1fr}.pw-toolbar button{font-size:11px;padding:8px}.pw-drop{padding:15px}.pw-preview,.pw-try{padding:18px}.pw-save-row{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){.personal-workspace *{transition:none!important}}
`;
