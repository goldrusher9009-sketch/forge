const fs = require('fs');
const path = require('path');

const TSX = path.join(__dirname, 'forge-web-studio/app/components/ForgeApp.tsx');
let src = fs.readFileSync(TSX, 'utf8');

const NAV_ANCHOR = `{ id:'ltvpredictor113', icon:'💎', label:'LTV Predictor' },`;
const NAV_NEW = `{ id:'ltvpredictor113', icon:'💎', label:'LTV Predictor' },
        { id:'jtbd114', icon:'🎯', label:'Jobs-to-be-Done' },
        { id:'pricingstrat114', icon:'💲', label:'Pricing Strategy' },
        { id:'northstar114', icon:'⭐', label:'North Star Metric' },
        { id:'okrgen114', icon:'🏆', label:'OKR Generator' },
        { id:'persona114', icon:'👤', label:'User Persona Creator' },`;
if (!src.includes(NAV_ANCHOR)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(NAV_ANCHOR, NAV_NEW);

const RENDER_ANCHOR = `{(mainTab as string) === 'ltvpredictor113' && <ForgeTab_ltvpredictor113 />}`;
const RENDER_NEW = `{(mainTab as string) === 'ltvpredictor113' && <ForgeTab_ltvpredictor113 />}
        {(mainTab as string) === 'jtbd114' && <ForgeTab_jtbd114 />}
        {(mainTab as string) === 'pricingstrat114' && <ForgeTab_pricingstrat114 />}
        {(mainTab as string) === 'northstar114' && <ForgeTab_northstar114 />}
        {(mainTab as string) === 'okrgen114' && <ForgeTab_okrgen114 />}
        {(mainTab as string) === 'persona114' && <ForgeTab_persona114 />}`;
if (!src.includes(RENDER_ANCHOR)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(RENDER_ANCHOR, RENDER_NEW);

const COMPONENT_ANCHOR = `export default function ForgeApp()`;
const COMPONENTS = `
// ── WAVE 114 ─────────────────────────────────────────────────────────────────

function ForgeTab_jtbd114() {
  const [product, setProduct] = React.useState('');
  const [customer, setCustomer] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🎯 Jobs-to-be-Done Mapper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Uncover the real "jobs" customers hire your product to do — and find unmet needs worth building for.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product name & description (e.g. Forge — AI tools platform for entrepreneurs)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={customer} onChange={(e:any)=>setCustomer(e.target.value)} placeholder="Target customer description (e.g. Early-stage founders, solo entrepreneurs, small business owners)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/product/jtbd',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,customer})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Mapping jobs...':'🎯 Map Jobs-to-be-Done'}</button>
      {result?.map && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.map}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_pricingstrat114() {
  const [product, setProduct] = React.useState('');
  const [currentPricing, setCurrentPricing] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [goal, setGoal] = React.useState('maximize-revenue');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💲 Pricing Strategy Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design optimal pricing strategy with tiers, psychology, and revenue model analysis.</p>
      <textarea value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product description, target market, value delivered (e.g. SaaS analytics tool for e-commerce stores)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={currentPricing} onChange={(e:any)=>setCurrentPricing(e.target.value)} placeholder="Current pricing if any (e.g. $49/month flat or free)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={competitors} onChange={(e:any)=>setCompetitors(e.target.value)} placeholder="Main competitors and their pricing (e.g. Shopify Analytics $79/mo, Glew $99/mo)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="maximize-revenue">Maximize Revenue</option>
        <option value="maximize-growth">Maximize Growth / Market Share</option>
        <option value="enterprise-upsell">Move Upmarket to Enterprise</option>
        <option value="reduce-churn">Reduce Price-Related Churn</option>
        <option value="freemium-conversion">Improve Freemium Conversion</option>
      </select>
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/product/pricing-strategy',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,currentPricing,competitors,goal})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Building strategy...':'💲 Build Pricing Strategy'}</button>
      {result?.strategy && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.strategy}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_northstar114() {
  const [product, setProduct] = React.useState('');
  const [currentMetrics, setCurrentMetrics] = React.useState('');
  const [stage, setStage] = React.useState('growth');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>⭐ North Star Metric Finder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Identify the single metric that best captures your product's value delivery and aligns your team.</p>
      <textarea value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Describe your product and how it creates value (e.g. Project management tool — teams save 5hrs/week on meetings)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={currentMetrics} onChange={(e:any)=>setCurrentMetrics(e.target.value)} placeholder="Metrics you currently track (e.g. DAU, revenue, tickets closed, projects created)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={stage} onChange={(e:any)=>setStage(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="pre-pmf">Pre-PMF (finding product-market fit)</option>
        <option value="growth">Growth (scaling what works)</option>
        <option value="scale">Scale (optimizing efficiency)</option>
        <option value="mature">Mature (defending market position)</option>
      </select>
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/product/north-star',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,currentMetrics,stage})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#d97706',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Finding north star...':'⭐ Find North Star Metric'}</button>
      {result?.framework && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.framework}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_okrgen114() {
  const [company, setCompany] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [quarter, setQuarter] = React.useState('Q3 2026');
  const [level, setLevel] = React.useState('company');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🏆 OKR Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate ambitious, measurable OKRs with proper key results that drive real outcomes.</p>
      <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company / team description (e.g. B2B SaaS startup, 15 people, $500K ARR)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={goals} onChange={(e:any)=>setGoals(e.target.value)} placeholder="Strategic goals for the quarter (e.g. Grow revenue, improve retention, launch enterprise tier, expand to Europe)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <input value={quarter} onChange={(e:any)=>setQuarter(e.target.value)} placeholder="Quarter (e.g. Q3 2026)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <select value={level} onChange={(e:any)=>setLevel(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="company">Company-Level OKRs</option>
          <option value="product">Product Team OKRs</option>
          <option value="engineering">Engineering Team OKRs</option>
          <option value="marketing">Marketing Team OKRs</option>
          <option value="sales">Sales Team OKRs</option>
        </select>
      </div>
      <button disabled={loading||!goals.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/product/okr-generator',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({company,goals,quarter,level})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!goals.trim()?0.5:1}}>{loading?'Generating OKRs...':'🏆 Generate OKRs'}</button>
      {result?.okrs && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.okrs}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_persona114() {
  const [product, setProduct] = React.useState('');
  const [research, setResearch] = React.useState('');
  const [count, setCount] = React.useState('3');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>👤 User Persona Creator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create rich, research-backed user personas that guide product decisions and marketing copy.</p>
      <textarea value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product description and target market (e.g. Project management tool for design agencies)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <textarea value={research} onChange={(e:any)=>setResearch(e.target.value)} placeholder="Any existing research, customer data, or observations (optional — e.g. 60% are designers, 40% are project managers, top complaint is too many tools)" rows={2} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={count} onChange={(e:any)=>setCount(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="2">2 Personas</option>
        <option value="3">3 Personas</option>
        <option value="4">4 Personas</option>
        <option value="5">5 Personas</option>
      </select>
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/product/user-personas',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,research,count})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Creating personas...':'👤 Create Personas'}</button>
      {result?.personas && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.personas}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

`;
if (!src.includes(COMPONENT_ANCHOR)) { console.error('COMPONENT ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(COMPONENT_ANCHOR, COMPONENTS + COMPONENT_ANCHOR);

fs.writeFileSync(TSX, src, 'utf8');
console.log('Wave 114 patched. Lines:', src.split('\n').length);
