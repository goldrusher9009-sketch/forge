const fs = require('fs');
const path = require('path');

const TSX = path.join(__dirname, 'forge-web-studio/app/components/ForgeApp.tsx');
let src = fs.readFileSync(TSX, 'utf8');

// ── NAV ENTRIES ──────────────────────────────────────────────────────────────
const NAV_ANCHOR = `{ id:'vectordb112', icon:'🗂️', label:'Vector DB Designer' },`;
const NAV_NEW = `{ id:'vectordb112', icon:'🗂️', label:'Vector DB Designer' },
        { id:'cohortanalyzer113', icon:'📊', label:'Cohort Analyzer' },
        { id:'funnelbuilder113', icon:'🔽', label:'Funnel Builder' },
        { id:'retentiondash113', icon:'🔄', label:'Retention Dashboard' },
        { id:'abstats113', icon:'🧮', label:'A/B Stats Calculator' },
        { id:'ltvpredictor113', icon:'💎', label:'LTV Predictor' },`;
if (!src.includes(NAV_ANCHOR)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(NAV_ANCHOR, NAV_NEW);

// ── RENDER CASES ─────────────────────────────────────────────────────────────
const RENDER_ANCHOR = `{(mainTab as string) === 'vectordb112' && <ForgeTab_vectordb112 />}`;
const RENDER_NEW = `{(mainTab as string) === 'vectordb112' && <ForgeTab_vectordb112 />}
        {(mainTab as string) === 'cohortanalyzer113' && <ForgeTab_cohortanalyzer113 />}
        {(mainTab as string) === 'funnelbuilder113' && <ForgeTab_funnelbuilder113 />}
        {(mainTab as string) === 'retentiondash113' && <ForgeTab_retentiondash113 />}
        {(mainTab as string) === 'abstats113' && <ForgeTab_abstats113 />}
        {(mainTab as string) === 'ltvpredictor113' && <ForgeTab_ltvpredictor113 />}`;
if (!src.includes(RENDER_ANCHOR)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(RENDER_ANCHOR, RENDER_NEW);

// ── COMPONENT FUNCTIONS ───────────────────────────────────────────────────────
const COMPONENT_ANCHOR = `export default function ForgeApp()`;
const COMPONENTS = `
// ── WAVE 113 ─────────────────────────────────────────────────────────────────

function ForgeTab_cohortanalyzer113() {
  const [product, setProduct] = React.useState('');
  const [cohortType, setCohortType] = React.useState('acquisition');
  const [metric, setMetric] = React.useState('retention');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📊 Cohort Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design cohort analysis frameworks, SQL queries, and interpretation guides for your product metrics.</p>
      <textarea value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Describe your product and data (e.g. SaaS app, PostgreSQL DB with users/events tables, ~50K monthly active users)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={cohortType} onChange={(e:any)=>setCohortType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="acquisition">Acquisition Cohort</option>
          <option value="behavioral">Behavioral Cohort</option>
          <option value="revenue">Revenue Cohort</option>
          <option value="feature-adoption">Feature Adoption</option>
          <option value="churn">Churn Cohort</option>
        </select>
        <select value={metric} onChange={(e:any)=>setMetric(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="retention">Retention Rate</option>
          <option value="revenue">Revenue / LTV</option>
          <option value="engagement">Engagement Score</option>
          <option value="conversion">Conversion Rate</option>
          <option value="churn">Churn Rate</option>
        </select>
      </div>
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/analytics/cohort-analyzer',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,cohortType,metric})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Analyzing...':'📊 Build Cohort Analysis'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_funnelbuilder113() {
  const [product, setProduct] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [goal, setGoal] = React.useState('increase-conversion');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🔽 Funnel Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design conversion funnels, identify drop-off points, and get actionable optimization tactics.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / business (e.g. B2B SaaS with freemium trial)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={steps} onChange={(e:any)=>setSteps(e.target.value)} placeholder="Funnel steps (e.g. Landing page → Sign up → Onboarding → First value moment → Paid conversion)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="increase-conversion">Increase Overall Conversion</option>
        <option value="reduce-drop-off">Reduce Drop-off</option>
        <option value="speed-to-value">Speed to First Value</option>
        <option value="revenue-per-user">Revenue Per User</option>
        <option value="reduce-cac">Reduce CAC</option>
      </select>
      <button disabled={loading||!steps.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/analytics/funnel-builder',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,steps,goal})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!steps.trim()?0.5:1}}>{loading?'Building funnel...':'🔽 Analyze Funnel'}</button>
      {result?.funnel && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.funnel}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_retentiondash113() {
  const [product, setProduct] = React.useState('');
  const [currentRetention, setCurrentRetention] = React.useState('');
  const [churnReasons, setChurnReasons] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🔄 Retention Dashboard</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a retention measurement framework with key metrics, benchmarks, and improvement playbook.</p>
      <textarea value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product description (e.g. Mobile fitness app, 100K users, subscription $9.99/month)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={currentRetention} onChange={(e:any)=>setCurrentRetention(e.target.value)} placeholder="Current retention metrics if known (e.g. D1: 60%, D7: 35%, D30: 18%)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={churnReasons} onChange={(e:any)=>setChurnReasons(e.target.value)} placeholder="Known churn reasons (e.g. too expensive, not enough content, forgot about app)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/analytics/retention-dashboard',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,currentRetention,churnReasons})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Building dashboard...':'🔄 Build Retention Framework'}</button>
      {result?.dashboard && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.dashboard}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_abstats113() {
  const [control, setControl] = React.useState('');
  const [treatment, setTreatment] = React.useState('');
  const [metric, setMetric] = React.useState('conversion-rate');
  const [significance, setSignificance] = React.useState('95');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🧮 A/B Stats Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate statistical significance, sample size, and interpret A/B test results with actionable recommendations.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <div>
          <label style={{display:'block',color:'#9ca3af',fontSize:12,marginBottom:4}}>Control (A) Results</label>
          <input value={control} onChange={(e:any)=>setControl(e.target.value)} placeholder="e.g. 1000 visitors, 50 conversions (5%)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',boxSizing:'border-box' as any}} />
        </div>
        <div>
          <label style={{display:'block',color:'#9ca3af',fontSize:12,marginBottom:4}}>Treatment (B) Results</label>
          <input value={treatment} onChange={(e:any)=>setTreatment(e.target.value)} placeholder="e.g. 1000 visitors, 65 conversions (6.5%)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',boxSizing:'border-box' as any}} />
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={metric} onChange={(e:any)=>setMetric(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="conversion-rate">Conversion Rate</option>
          <option value="revenue-per-user">Revenue Per User</option>
          <option value="click-through-rate">Click-Through Rate</option>
          <option value="retention">Retention Rate</option>
          <option value="engagement">Engagement Score</option>
        </select>
        <select value={significance} onChange={(e:any)=>setSignificance(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="90">90% Confidence</option>
          <option value="95">95% Confidence</option>
          <option value="99">99% Confidence</option>
        </select>
      </div>
      <button disabled={loading||!control.trim()||!treatment.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/analytics/ab-stats',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({control,treatment,metric,significance})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!control.trim()||!treatment.trim()?0.5:1}}>{loading?'Calculating...':'🧮 Calculate Significance'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_ltvpredictor113() {
  const [business, setBusiness] = React.useState('');
  const [metrics, setMetrics] = React.useState('');
  const [model, setModel] = React.useState('subscription');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💎 LTV Predictor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate customer lifetime value, predict future LTV, and find levers to maximize it.</p>
      <textarea value={business} onChange={(e:any)=>setBusiness(e.target.value)} placeholder="Business description (e.g. B2B SaaS, average contract $500/month, 3-year avg customer life)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={metrics} onChange={(e:any)=>setMetrics(e.target.value)} placeholder="Key metrics (e.g. ARPU: $500/mo, churn: 2%/mo, CAC: $2000, gross margin: 75%)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={model} onChange={(e:any)=>setModel(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="subscription">Subscription (SaaS)</option>
        <option value="ecommerce">E-commerce (repeat purchase)</option>
        <option value="marketplace">Marketplace</option>
        <option value="usage-based">Usage-Based</option>
        <option value="freemium">Freemium</option>
      </select>
      <button disabled={loading||!business.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/analytics/ltv-predictor',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({business,metrics,model})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#d97706',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!business.trim()?0.5:1}}>{loading?'Predicting LTV...':'💎 Predict LTV'}</button>
      {result?.prediction && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.prediction}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

`;
if (!src.includes(COMPONENT_ANCHOR)) { console.error('COMPONENT ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(COMPONENT_ANCHOR, COMPONENTS + COMPONENT_ANCHOR);

fs.writeFileSync(TSX, src, 'utf8');
console.log('Wave 113 patched. Lines:', src.split('\n').length);
