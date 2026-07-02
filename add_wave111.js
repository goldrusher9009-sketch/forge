const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const navAnchor = "{ id:'casestudy110', icon:'📖', label:'Case Study Writer' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'casestudy110', icon:'📖', label:'Case Study Writer' },
            { id:'techdoc111', icon:'📘', label:'Technical Doc Writer' },
            { id:'changelog111', icon:'📋', label:'API Changelog' },
            { id:'featureflag111', icon:'🚩', label:'Feature Flag Planner' },
            { id:'loadtest111', icon:'⚡', label:'Load Test Designer' },
            { id:'threatmodel111', icon:'🛡️', label:'Threat Modeler' },`);

const renderAnchor = "        {(mainTab as string) === 'casestudy110' && <ForgeTab_casestudy110 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'casestudy110' && <ForgeTab_casestudy110 />}

        {/* ── WAVE 111 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'techdoc111' && <ForgeTab_techdoc111 />}
        {(mainTab as string) === 'changelog111' && <ForgeTab_changelog111 />}
        {(mainTab as string) === 'featureflag111' && <ForgeTab_featureflag111 />}
        {(mainTab as string) === 'loadtest111' && <ForgeTab_loadtest111 />}
        {(mainTab as string) === 'threatmodel111' && <ForgeTab_threatmodel111 />}`);

const components = `
function ForgeTab_techdoc111() {
  const [feature, setFeature] = React.useState('');
  const [docType, setDocType] = React.useState('api-reference');
  const [audience, setAudience] = React.useState('developers');
  const [techStack, setTechStack] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Technical Doc Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate professional technical documentation — API references, READMEs, runbooks, and architecture guides.</p>
      <textarea value={feature} onChange={(e:any)=>setFeature(e.target.value)} placeholder="Describe what you're documenting (e.g. REST API endpoint for user authentication, or a Node.js SDK for payments, or a deployment runbook for Railway...)" rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={docType} onChange={(e:any)=>setDocType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="api-reference">API Reference</option><option value="readme">README</option><option value="runbook">Operational Runbook</option><option value="architecture">Architecture Decision Record</option><option value="quickstart">Quick Start Guide</option><option value="integration">Integration Guide</option><option value="sdk">SDK Documentation</option><option value="troubleshoot">Troubleshooting Guide</option>
        </select>
        <select value={audience} onChange={(e:any)=>setAudience(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="developers">Developers (external)</option><option value="internal">Internal engineering team</option><option value="ops">Ops / DevOps / SRE</option><option value="non-technical">Non-technical stakeholders</option><option value="enterprise">Enterprise architects</option>
        </select>
      </div>
      <input value={techStack} onChange={(e:any)=>setTechStack(e.target.value)} placeholder="Tech stack (e.g. Node.js, TypeScript, PostgreSQL, Docker, AWS)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!feature.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/dev/tech-doc',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({feature,doc_type:docType,audience,tech_stack:techStack})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#374151',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!feature.trim()?0.5:1}}>{loading?'Writing Docs...':'Generate Documentation'}</button>
      {result?.doc && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:12,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any,fontFamily:'monospace'}}>{result.doc}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_changelog111() {
  const [commits, setCommits] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [version, setVersion] = React.useState('');
  const [audience, setAudience] = React.useState('developers');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>API Changelog Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Transform raw git commits or PR notes into a clean, human-readable changelog for developers or end users.</p>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / API name (e.g. Forge API v3)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={version} onChange={(e:any)=>setVersion(e.target.value)} placeholder="Version (e.g. v2.5.0)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <select value={audience} onChange={(e:any)=>setAudience(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="developers">Developers / API consumers</option><option value="end-users">End users (non-technical)</option><option value="internal">Internal team</option><option value="investors">Investors / board</option>
      </select>
      <textarea value={commits} onChange={(e:any)=>setCommits(e.target.value)} placeholder="Paste your git commits, PR titles, or rough notes about what changed in this release..." rows={8} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!commits.trim()||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/dev/changelog',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({commits,product,version,audience})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0891b2',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!commits.trim()||!product.trim()?0.5:1}}>{loading?'Generating...':'Generate Changelog'}</button>
      {result?.changelog && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:500,overflowY:'auto' as any,fontFamily:'monospace'}}>{result.changelog}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_featureflag111() {
  const [feature, setFeature] = React.useState('');
  const [rolloutType, setRolloutType] = React.useState('percentage');
  const [platform, setPlatform] = React.useState('');
  const [risks, setRisks] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Feature Flag Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a safe feature rollout plan with flag configuration, kill switch, monitoring, and rollback criteria.</p>
      <input value={feature} onChange={(e:any)=>setFeature(e.target.value)} placeholder="Feature being released (e.g. New checkout flow with Stripe, AI-powered search rewrite)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={rolloutType} onChange={(e:any)=>setRolloutType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="percentage">Percentage rollout</option><option value="cohort">User cohort / segment</option><option value="beta">Beta users only</option><option value="canary">Canary (1% then scale)</option><option value="kill-switch">Kill switch only</option><option value="a/b-test">A/B test</option>
        </select>
        <input value={platform} onChange={(e:any)=>setPlatform(e.target.value)} placeholder="Platform (e.g. LaunchDarkly, Unleash, Statsig, custom)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <textarea value={risks} onChange={(e:any)=>setRisks(e.target.value)} placeholder="Known risks or concerns with this feature (e.g. touches payment flow, high DB load, replaces legacy system used by enterprise clients...)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!feature.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/dev/feature-flag',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({feature,rollout_type:rolloutType,platform,risks})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!feature.trim()?0.5:1}}>{loading?'Planning Rollout...':'Plan Feature Flag Rollout'}</button>
      {result?.plan && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.plan}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_loadtest111() {
  const [system, setSystem] = React.useState('');
  const [endpoints, setEndpoints] = React.useState('');
  const [expectedLoad, setExpectedLoad] = React.useState('');
  const [tool, setTool] = React.useState('k6');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Load Test Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a comprehensive load testing strategy with test scenarios, scripts, thresholds, and analysis framework.</p>
      <input value={system} onChange={(e:any)=>setSystem(e.target.value)} placeholder="System / service description (e.g. Node.js REST API on Railway, 2 instances, PostgreSQL, 5k daily users)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={endpoints} onChange={(e:any)=>setEndpoints(e.target.value)} placeholder="Critical endpoints to test (e.g. POST /api/auth/login, GET /api/projects, POST /api/llm/chat)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <input value={expectedLoad} onChange={(e:any)=>setExpectedLoad(e.target.value)} placeholder="Expected peak load (e.g. 500 concurrent users, 10k req/min)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <select value={tool} onChange={(e:any)=>setTool(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="k6">k6</option><option value="locust">Locust (Python)</option><option value="jmeter">JMeter</option><option value="artillery">Artillery</option><option value="gatling">Gatling</option><option value="vegeta">Vegeta</option>
        </select>
      </div>
      <button disabled={loading||!system.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/dev/load-test',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({system,endpoints,expected_load:expectedLoad,tool})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!system.trim()?0.5:1}}>{loading?'Designing Test...':'Design Load Tests'}</button>
      {result?.plan && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:12,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any,fontFamily:'monospace'}}>{result.plan}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_threatmodel111() {
  const [system, setSystem] = React.useState('');
  const [architecture, setArchitecture] = React.useState('');
  const [dataTypes, setDataTypes] = React.useState('');
  const [framework, setFramework] = React.useState('STRIDE');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Security Threat Modeler</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Identify security threats, attack vectors, and prioritized mitigations for your system using STRIDE or PASTA framework.</p>
      <input value={system} onChange={(e:any)=>setSystem(e.target.value)} placeholder="System name + description (e.g. SaaS web app with user auth, file uploads, and payment processing)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={architecture} onChange={(e:any)=>setArchitecture(e.target.value)} placeholder="Architecture description (e.g. Next.js frontend on Vercel, Node.js API on Railway, SQLite DB, Stripe webhooks, S3 file storage, JWT auth...)" rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <input value={dataTypes} onChange={(e:any)=>setDataTypes(e.target.value)} placeholder="Sensitive data types (e.g. PII, credit cards, API keys, health data)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <select value={framework} onChange={(e:any)=>setFramework(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="STRIDE">STRIDE</option><option value="PASTA">PASTA</option><option value="LINDDUN">LINDDUN (privacy)</option><option value="DREAD">DREAD scoring</option><option value="OWASP">OWASP Top 10</option>
        </select>
      </div>
      <button disabled={loading||!system.trim()||!architecture.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/dev/threat-model',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({system,architecture,data_types:dataTypes,framework})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!system.trim()||!architecture.trim()?0.5:1}}>{loading?'Modeling Threats...':'Generate Threat Model'}</button>
      {result?.model && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.model}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

`;

const exportAnchor = '\nexport default function ForgeApp';
const idx = content.lastIndexOf(exportAnchor);
if (idx === -1) { console.error('EXPORT DEFAULT NOT FOUND'); process.exit(1); }
content = content.slice(0, idx) + components + content.slice(idx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done. Lines:', content.split('\n').length);
