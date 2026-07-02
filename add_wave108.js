const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const navAnchor = "{ id:'moatanalyzer107', icon:'🏰', label:'Competitive Moat Analyzer' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'moatanalyzer107', icon:'🏰', label:'Competitive Moat Analyzer' },
            { id:'pitchscorer108', icon:'🎯', label:'Pitch Deck Scorer' },
            { id:'revenuemodel108', icon:'💰', label:'Revenue Model Builder' },
            { id:'journeymapper108', icon:'🗺️', label:'Customer Journey Mapper' },
            { id:'crisiscomms108', icon:'🚨', label:'Crisis Comms Writer' },
            { id:'duediligence108', icon:'🔍', label:'Due Diligence Checklist' },`);

const renderAnchor = "        {(mainTab as string) === 'moatanalyzer107' && <ForgeTab_moatanalyzer107 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'moatanalyzer107' && <ForgeTab_moatanalyzer107 />}

        {/* ── WAVE 108 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'pitchscorer108' && <ForgeTab_pitchscorer108 />}
        {(mainTab as string) === 'revenuemodel108' && <ForgeTab_revenuemodel108 />}
        {(mainTab as string) === 'journeymapper108' && <ForgeTab_journeymapper108 />}
        {(mainTab as string) === 'crisiscomms108' && <ForgeTab_crisiscomms108 />}
        {(mainTab as string) === 'duediligence108' && <ForgeTab_duediligence108 />}`);

const components = `
function ForgeTab_pitchscorer108() {
  const [pitch, setPitch] = React.useState('');
  const [stage, setStage] = React.useState('seed');
  const [investorType, setInvestorType] = React.useState('vc');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Pitch Deck Scorer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get VC-level feedback on your pitch — scored slide-by-slide with specific rewrites and a fundability verdict.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={stage} onChange={(e:any)=>setStage(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="pre-seed">Pre-seed</option><option value="seed">Seed</option><option value="series-a">Series A</option><option value="series-b">Series B+</option><option value="growth">Growth</option>
        </select>
        <select value={investorType} onChange={(e:any)=>setInvestorType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="vc">VC fund</option><option value="angel">Angel investor</option><option value="corporate">Corporate VC</option><option value="accelerator">Accelerator (YC/a16z)</option><option value="pe">Private equity</option>
        </select>
      </div>
      <textarea value={pitch} onChange={(e:any)=>setPitch(e.target.value)} placeholder="Paste your pitch deck content — slide by slide (Problem, Solution, Market, Product, Traction, Team, Business Model, Competition, Ask...)" rows={10} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!pitch.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/investor/score-pitch',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({pitch,stage,investor_type:investorType})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!pitch.trim()?0.5:1}}>{loading?'Scoring Pitch...':'Score My Pitch Deck'}</button>
      {result?.feedback && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.feedback}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_revenuemodel108() {
  const [product, setProduct] = React.useState('');
  const [modelType, setModelType] = React.useState('saas');
  const [inputs, setInputs] = React.useState('');
  const [horizon, setHorizon] = React.useState('3year');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Revenue Model Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a structured revenue model with assumptions, projections, unit economics, and scenario analysis.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / service description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={modelType} onChange={(e:any)=>setModelType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="saas">SaaS / Subscription</option><option value="marketplace">Marketplace</option><option value="transactional">Transactional / usage</option><option value="freemium">Freemium</option><option value="services">Professional services</option><option value="ecommerce">E-commerce</option><option value="hybrid">Hybrid model</option>
        </select>
        <select value={horizon} onChange={(e:any)=>setHorizon(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="1year">1-year model</option><option value="3year">3-year model</option><option value="5year">5-year model</option>
        </select>
      </div>
      <textarea value={inputs} onChange={(e:any)=>setInputs(e.target.value)} placeholder="Key inputs / assumptions (e.g. current MRR $10k, growth rate 15%/mo, ACV $5k, churn 3%/mo, CAC $800, sales cycle 30 days, team of 5...)" rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/finance/revenue-model',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,model_type:modelType,inputs,horizon})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Building Model...':'Build Revenue Model'}</button>
      {result?.model && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.model}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_journeymapper108() {
  const [product, setProduct] = React.useState('');
  const [persona, setPersona] = React.useState('');
  const [stage, setStage] = React.useState('full');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Customer Journey Mapper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Map the complete customer journey — touchpoints, emotions, pain points, and improvement opportunities at each stage.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / service description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={persona} onChange={(e:any)=>setPersona(e.target.value)} placeholder="Customer persona (e.g. VP of Sales at a 50-person SaaS company)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={stage} onChange={(e:any)=>setStage(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="full">Full lifecycle (Awareness → Advocacy)</option><option value="acquisition">Acquisition only</option><option value="onboarding">Onboarding / activation</option><option value="retention">Retention / expansion</option><option value="churned">Post-churn win-back</option>
      </select>
      <button disabled={loading||!product.trim()||!persona.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/cx/journey-map',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,persona,stage})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0891b2',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()||!persona.trim()?0.5:1}}>{loading?'Mapping Journey...':'Map Customer Journey'}</button>
      {result?.map && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.map}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_crisiscomms108() {
  const [company, setCompany] = React.useState('');
  const [crisis, setCrisis] = React.useState('');
  const [crisisType, setCrisisType] = React.useState('product');
  const [audiences, setAudiences] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Crisis Comms Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write crisis communications for every audience — customers, press, employees, investors — with holding statements, FAQs, and a response timeline.</p>
      <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company name + brief description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={crisisType} onChange={(e:any)=>setCrisisType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="product">Product outage / bug</option><option value="data">Data breach / security incident</option><option value="pr">PR / reputational crisis</option><option value="financial">Financial difficulty</option><option value="personnel">Executive departure / misconduct</option><option value="legal">Legal / regulatory action</option><option value="layoff">Layoffs / restructuring</option>
      </select>
      <textarea value={crisis} onChange={(e:any)=>setCrisis(e.target.value)} placeholder="Describe the crisis — what happened, when, scope of impact, what you know vs. don't know yet, actions already taken..." rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={audiences} onChange={(e:any)=>setAudiences(e.target.value)} placeholder="Key audiences (leave blank for all: customers, press, employees, investors, social)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!company.trim()||!crisis.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/comms/crisis',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({company,crisis,crisis_type:crisisType,audiences})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!company.trim()||!crisis.trim()?0.5:1}}>{loading?'Writing Comms...':'Generate Crisis Comms'}</button>
      {result?.comms && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.comms}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_duediligence108() {
  const [dealType, setDealType] = React.useState('startup-investment');
  const [company, setCompany] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Due Diligence Checklist</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a comprehensive due diligence checklist with red flags, document requests, and key questions for any deal type.</p>
      <select value={dealType} onChange={(e:any)=>setDealType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="startup-investment">Startup investment (VC / angel)</option><option value="acquisition">Company acquisition (M&A)</option><option value="partnership">Strategic partnership</option><option value="vendor">Vendor / supplier evaluation</option><option value="hiring">Executive hire</option><option value="real-estate">Real estate / commercial property</option>
      </select>
      <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company / deal name + brief description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={context} onChange={(e:any)=>setContext(e.target.value)} placeholder="Deal context — size, stage, sector, known concerns, timeline, your role (investor, acquirer, partner...)..." rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!company.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/finance/due-diligence',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({deal_type:dealType,company,context})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1e40af',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!company.trim()?0.5:1}}>{loading?'Building Checklist...':'Generate DD Checklist'}</button>
      {result?.checklist && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.checklist}</div>}
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
