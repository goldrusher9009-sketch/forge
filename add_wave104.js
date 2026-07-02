const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// NAV
const navAnchor = "{ id:'contentrepurpose103', icon:'♻', label:'Content Repurposer' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'contentrepurpose103', icon:'♻', label:'Content Repurposer' },
            { id:'salesscript104', icon:'\u{1F4DE}', label:'Sales Script Generator' },
            { id:'landingcopy104', icon:'\u{1F680}', label:'Landing Page Copywriter' },
            { id:'investorupdate104', icon:'\u{1F4C8}', label:'Investor Update Writer' },
            { id:'bugreport104', icon:'\u{1F41E}', label:'Bug Report Generator' },
            { id:'datastory104', icon:'\u{1F4CA}', label:'Data Storyteller' },`);

// RENDER
const renderAnchor = "        {(mainTab as string) === 'contentrepurpose103' && <ForgeTab_contentrepurpose103 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'contentrepurpose103' && <ForgeTab_contentrepurpose103 />}

        {/* ── WAVE 104 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'salesscript104' && <ForgeTab_salesscript104 />}
        {(mainTab as string) === 'landingcopy104' && <ForgeTab_landingcopy104 />}
        {(mainTab as string) === 'investorupdate104' && <ForgeTab_investorupdate104 />}
        {(mainTab as string) === 'bugreport104' && <ForgeTab_bugreport104 />}
        {(mainTab as string) === 'datastory104' && <ForgeTab_datastory104 />}`);

const components = `
function ForgeTab_salesscript104() {
  const [product, setProduct] = React.useState('');
  const [targetRole, setTargetRole] = React.useState('');
  const [callType, setCallType] = React.useState('cold');
  const [painPoint, setPainPoint] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Sales Script Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Word-for-word sales scripts with talk tracks, transitions, objection handling, and closing lines.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="What you're selling (product/service + core value prop)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={targetRole} onChange={(e:any)=>setTargetRole(e.target.value)} placeholder="Target prospect role (e.g. VP of Marketing at Series B SaaS)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={painPoint} onChange={(e:any)=>setPainPoint(e.target.value)} placeholder="Main pain point you solve" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={callType} onChange={(e:any)=>setCallType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="cold">Cold call (first contact)</option>
        <option value="discovery">Discovery call (booked meeting)</option>
        <option value="demo">Demo call (showing product)</option>
        <option value="followup">Follow-up call (after demo)</option>
        <option value="closing">Closing call (proposal stage)</option>
        <option value="voicemail">Voicemail script</option>
      </select>
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/sales/script',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,target_role:targetRole,call_type:callType,pain_point:painPoint})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0ea5e9',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Writing Script...':'Generate Sales Script'}</button>
      {result?.script && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.script}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_landingcopy104() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [mainBenefit, setMainBenefit] = React.useState('');
  const [section, setSection] = React.useState('full');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Landing Page Copywriter</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>High-converting landing page copy — hero, features, social proof, FAQ, and CTA sections.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / service name + what it does" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Target audience (be specific)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={mainBenefit} onChange={(e:any)=>setMainBenefit(e.target.value)} placeholder="Core benefit / transformation (e.g. 10x your outreach reply rate)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={section} onChange={(e:any)=>setSection(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="full">Full landing page</option>
        <option value="hero">Hero section only</option>
        <option value="features">Features / Benefits section</option>
        <option value="faq">FAQ section</option>
        <option value="cta">CTA section</option>
        <option value="pricing">Pricing section copy</option>
      </select>
      <button disabled={loading||!product.trim()||!audience.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/copy/landing-page',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,audience,main_benefit:mainBenefit,section})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#f59e0b',color:'#000',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()||!audience.trim()?0.5:1}}>{loading?'Writing Copy...':'Generate Landing Page Copy'}</button>
      {result?.copy && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.copy}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_investorupdate104() {
  const [companyName, setCompanyName] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [metrics, setMetrics] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [asks, setAsks] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Investor Update Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Professional monthly/quarterly investor updates that build trust, tell a story, and get help from your investors.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={companyName} onChange={(e:any)=>setCompanyName(e.target.value)} placeholder="Company name" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={period} onChange={(e:any)=>setPeriod(e.target.value)} placeholder="Period (e.g. June 2026, Q2 2026)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <textarea value={metrics} onChange={(e:any)=>setMetrics(e.target.value)} placeholder="Key metrics this period (MRR, ARR, users, growth %, burn rate, runway, etc.)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <textarea value={highlights} onChange={(e:any)=>setHighlights(e.target.value)} placeholder="Key wins, milestones, challenges this period" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <textarea value={asks} onChange={(e:any)=>setAsks(e.target.value)} placeholder="What you need from investors (intros, advice, hiring help, etc.)" rows={2} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!companyName.trim()||!metrics.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/investor/update',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({company_name:companyName,period,metrics,highlights,asks})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1d4ed8',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!companyName.trim()||!metrics.trim()?0.5:1}}>{loading?'Writing Update...':'Generate Investor Update'}</button>
      {result?.update && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.update}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_bugreport104() {
  const [bugDescription, setBugDescription] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [expected, setExpected] = React.useState('');
  const [actual, setActual] = React.useState('');
  const [stack, setStack] = React.useState('');
  const [platform, setPlatform] = React.useState('web');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Bug Report Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn rough bug notes into professional, developer-ready bug reports with root cause analysis.</p>
      <textarea value={bugDescription} onChange={(e:any)=>setBugDescription(e.target.value)} placeholder="Describe the bug in plain language..." rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <textarea value={steps} onChange={(e:any)=>setSteps(e.target.value)} placeholder="Steps to reproduce (optional)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={expected} onChange={(e:any)=>setExpected(e.target.value)} placeholder="Expected behavior" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={actual} onChange={(e:any)=>setActual(e.target.value)} placeholder="Actual behavior" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <textarea value={stack} onChange={(e:any)=>setStack(e.target.value)} placeholder="Error message / stack trace (optional)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:12,fontFamily:'monospace',resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={platform} onChange={(e:any)=>setPlatform(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="web">Web app</option><option value="mobile-ios">iOS</option><option value="mobile-android">Android</option><option value="api">API / Backend</option><option value="desktop">Desktop app</option>
      </select>
      <button disabled={loading||!bugDescription.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/dev/bug-report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({bug_description:bugDescription,steps,expected,actual,stack_trace:stack,platform})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!bugDescription.trim()?0.5:1}}>{loading?'Generating Report...':'Generate Bug Report'}</button>
      {result?.report && <div style={{marginTop:'1.5rem',background:'#0f172a',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,fontFamily:'monospace',color:'#e2e8f0',maxHeight:600,overflowY:'auto' as any}}>{result.report}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_datastory104() {
  const [data, setData] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [goal, setGoal] = React.useState('insight');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Data Storyteller</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn raw numbers and metrics into compelling narratives that drive decisions and inspire action.</p>
      <textarea value={data} onChange={(e:any)=>setData(e.target.value)} placeholder="Paste your data, metrics, or numbers here (tables, CSV snippets, KPIs, anything)" rows={6} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Audience (e.g. board, investors, marketing team)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={context} onChange={(e:any)=>setContext(e.target.value)} placeholder="Business context / what happened" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="insight">Surface key insights</option>
        <option value="decision">Drive a specific decision</option>
        <option value="report">Executive report narrative</option>
        <option value="board">Board presentation</option>
        <option value="blog">Public blog post / case study</option>
      </select>
      <button disabled={loading||!data.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/data/storytell',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data,audience,goal,context})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!data.trim()?0.5:1}}>{loading?'Crafting Story...':'Tell the Story'}</button>
      {result?.story && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.story}</div>}
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
