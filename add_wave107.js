const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const navAnchor = "{ id:'partnershippitch106', icon:'🏢', label:'Partnership Pitch' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'partnershippitch106', icon:'🏢', label:'Partnership Pitch' },
            { id:'grantwriter107', icon:'📝', label:'Grant Writer' },
            { id:'boarddeck107', icon:'📊', label:'Board Deck Builder' },
            { id:'hiringfunnel107', icon:'🧲', label:'Hiring Funnel Optimizer' },
            { id:'gtmplanner107', icon:'🗺️', label:'Go-to-Market Planner' },
            { id:'moatanalyzer107', icon:'🏰', label:'Competitive Moat Analyzer' },`);

const renderAnchor = "        {(mainTab as string) === 'partnershipitch106' && <ForgeTab_partnershipitch106 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'partnershipitch106' && <ForgeTab_partnershipitch106 />}

        {/* ── WAVE 107 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'grantwriter107' && <ForgeTab_grantwriter107 />}
        {(mainTab as string) === 'boarddeck107' && <ForgeTab_boarddeck107 />}
        {(mainTab as string) === 'hiringfunnel107' && <ForgeTab_hiringfunnel107 />}
        {(mainTab as string) === 'gtmplanner107' && <ForgeTab_gtmplanner107 />}
        {(mainTab as string) === 'moatanalyzer107' && <ForgeTab_moatanalyzer107 />}`);

const components = `
function ForgeTab_grantwriter107() {
  const [org, setOrg] = React.useState('');
  const [grantType, setGrantType] = React.useState('government');
  const [amount, setAmount] = React.useState('');
  const [mission, setMission] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Grant Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate compelling grant proposals with executive summary, needs statement, project narrative, budget justification, and evaluation plan.</p>
      <input value={org} onChange={(e:any)=>setOrg(e.target.value)} placeholder="Organization name + description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={grantType} onChange={(e:any)=>setGrantType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="government">Government / Federal</option><option value="foundation">Foundation grant</option><option value="corporate">Corporate CSR</option><option value="research">Research / SBIR</option><option value="arts">Arts / culture</option><option value="education">Education</option>
        </select>
        <input value={amount} onChange={(e:any)=>setAmount(e.target.value)} placeholder="Grant amount requested (e.g. $50,000)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <textarea value={mission} onChange={(e:any)=>setMission(e.target.value)} placeholder="Project description: what you'll do, who it serves, the problem it solves, measurable outcomes you expect..." rows={6} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!org.trim()||!mission.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/writing/grant',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({org,grant_type:grantType,amount,mission})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#15803d',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!org.trim()||!mission.trim()?0.5:1}}>{loading?'Writing Grant...':'Generate Grant Proposal'}</button>
      {result?.proposal && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.proposal}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_boarddeck107() {
  const [company, setCompany] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [metrics, setMetrics] = React.useState('');
  const [deckType, setDeckType] = React.useState('quarterly');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Board Deck Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete board presentation — slide-by-slide structure, narrative, talking points, and appendix.</p>
      <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company name + stage (e.g. Series A SaaS, 3 years old)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={deckType} onChange={(e:any)=>setDeckType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="quarterly">Quarterly board update</option><option value="annual">Annual strategic review</option><option value="fundraise">Fundraise / approval</option><option value="crisis">Crisis / pivot discussion</option><option value="annual-plan">Annual plan presentation</option>
        </select>
        <input value={period} onChange={(e:any)=>setPeriod(e.target.value)} placeholder="Period (e.g. Q2 2026, FY2025)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <textarea value={metrics} onChange={(e:any)=>setMetrics(e.target.value)} placeholder="Key metrics and highlights to include (ARR, growth rate, burn, headcount, product wins, risks, asks...)" rows={6} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!company.trim()||!metrics.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/exec/board-deck',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({company,period,metrics,deck_type:deckType})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1e3a8a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!company.trim()||!metrics.trim()?0.5:1}}>{loading?'Building Deck...':'Build Board Deck'}</button>
      {result?.deck && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.deck}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_hiringfunnel107() {
  const [role, setRole] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [painPoints, setPainPoints] = React.useState('');
  const [volume, setVolume] = React.useState('high');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Hiring Funnel Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Diagnose your recruiting funnel and get a prioritized fix plan to reduce time-to-hire and improve offer acceptance rates.</p>
      <input value={role} onChange={(e:any)=>setRole(e.target.value)} placeholder="Role(s) you're hiring for (e.g. Senior SWE, Account Executive, Data Scientist)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={stage} onChange={(e:any)=>setStage(e.target.value)} placeholder="Company stage + size (e.g. Series A, 30 employees)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={volume} onChange={(e:any)=>setVolume(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="low">Low volume ({"<"}5 hires/quarter)</option><option value="medium">Medium volume (5-20 hires/quarter)</option><option value="high">High volume (20+ hires/quarter)</option>
      </select>
      <textarea value={painPoints} onChange={(e:any)=>setPainPoints(e.target.value)} placeholder="Describe your hiring pain points (e.g. too few qualified applicants, candidates dropping off after technical screen, slow response times, low offer acceptance, poor sourcing...)" rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!role.trim()||!painPoints.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/hr/hiring-funnel',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({role,stage,volume,pain_points:painPoints})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!role.trim()||!painPoints.trim()?0.5:1}}>{loading?'Analyzing...':'Optimize Hiring Funnel'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_gtmplanner107() {
  const [product, setProduct] = React.useState('');
  const [icp, setIcp] = React.useState('');
  const [stage, setStage] = React.useState('pre-launch');
  const [budget, setBudget] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Go-to-Market Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete GTM strategy — channels, positioning, sales motion, 90-day launch plan, and success metrics.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product + key differentiator" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={icp} onChange={(e:any)=>setIcp(e.target.value)} placeholder="Ideal Customer Profile (job title, company type, pain, budget)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={stage} onChange={(e:any)=>setStage(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="pre-launch">Pre-launch</option><option value="early-traction">Early traction (1-50 customers)</option><option value="growth">Growth (scaling)</option><option value="new-market">Entering new market</option><option value="new-segment">Expanding to new segment</option>
        </select>
        <input value={budget} onChange={(e:any)=>setBudget(e.target.value)} placeholder="GTM budget (e.g. $50k/month, $500k/year)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <button disabled={loading||!product.trim()||!icp.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/strategy/gtm-plan',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,icp,stage,budget})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0891b2',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()||!icp.trim()?0.5:1}}>{loading?'Planning GTM...':'Build GTM Plan'}</button>
      {result?.plan && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.plan}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_moatanalyzer107() {
  const [company, setCompany] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [strengths, setStrengths] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Competitive Moat Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Identify, score, and strengthen your competitive moat across switching costs, network effects, data, brand, and scale advantages.</p>
      <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Your company + product description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={competitors} onChange={(e:any)=>setCompetitors(e.target.value)} placeholder="Main competitors (e.g. Salesforce, HubSpot, Pipedrive)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={strengths} onChange={(e:any)=>setStrengths(e.target.value)} placeholder="Describe what you believe your current advantages are (technology, data, integrations, customers, team, IP, partnerships, distribution...)" rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!company.trim()||!competitors.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/strategy/moat-analysis',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({company,competitors,strengths})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#92400e',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!company.trim()||!competitors.trim()?0.5:1}}>{loading?'Analyzing Moat...':'Analyze Competitive Moat'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
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
