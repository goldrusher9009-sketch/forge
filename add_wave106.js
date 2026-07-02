const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const navAnchor = "{ id:'emailseq105', icon:'📨', label:'Email Sequence Builder' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'emailseq105', icon:'📨', label:'Email Sequence Builder' },
            { id:'churnpredict106', icon:'⚠️', label:'Churn Predictor' },
            { id:'phlaunch106', icon:'🚀', label:'Product Hunt Launch Kit' },
            { id:'affiliateprog106', icon:'🤝', label:'Affiliate Program Builder' },
            { id:'referralprog106', icon:'🎁', label:'Referral Program Designer' },
            { id:'partnershippitch106', icon:'🏢', label:'Partnership Pitch' },`);

const renderAnchor = "        {(mainTab as string) === 'emailseq105' && <ForgeTab_emailseq105 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'emailseq105' && <ForgeTab_emailseq105 />}

        {/* ── WAVE 106 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'churnpredict106' && <ForgeTab_churnpredict106 />}
        {(mainTab as string) === 'phlaunch106' && <ForgeTab_phlaunch106 />}
        {(mainTab as string) === 'affiliateprog106' && <ForgeTab_affiliateprog106 />}
        {(mainTab as string) === 'referralprog106' && <ForgeTab_referralprog106 />}
        {(mainTab as string) === 'partnershipitch106' && <ForgeTab_partnershipitch106 />}`);

const components = `
function ForgeTab_churnpredict106() {
  const [signals, setSignals] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [segment, setSegment] = React.useState('all');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Churn Predictor & Retention Playbook</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze churn signals and get a prioritized retention playbook to save at-risk customers.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product type (e.g. B2B SaaS, subscription box, mobile app)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={segment} onChange={(e:any)=>setSegment(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="all">All customers</option><option value="new">New users (0-30 days)</option><option value="mid">Mid-lifecycle (30-180 days)</option><option value="long">Long-term (180+ days)</option><option value="enterprise">Enterprise accounts</option><option value="freemium">Freemium users</option>
      </select>
      <textarea value={signals} onChange={(e:any)=>setSignals(e.target.value)} placeholder="Describe churn signals you're seeing (e.g. login frequency dropped, support tickets up, NPS declined, feature usage falling, payment failures, complaints about pricing...)" rows={6} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!signals.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/retention/churn-analysis',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({signals,product,segment})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!signals.trim()?0.5:1}}>{loading?'Analyzing...':'Analyze & Build Retention Plan'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_phlaunch106() {
  const [product, setProduct] = React.useState('');
  const [tagline, setTagline] = React.useState('');
  const [targetHunters, setTargetHunters] = React.useState('');
  const [launchDate, setLaunchDate] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Product Hunt Launch Kit</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Complete Product Hunt launch package — taglines, description, gallery copy, maker comment, and 30-day pre-launch plan.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product name + what it does" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={tagline} onChange={(e:any)=>setTagline(e.target.value)} placeholder="Current tagline idea (or leave blank to generate)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={targetHunters} onChange={(e:any)=>setTargetHunters(e.target.value)} placeholder="Target hunters / communities (e.g. indie hackers, no-code, AI tools)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={launchDate} onChange={(e:any)=>setLaunchDate(e.target.value)} placeholder="Planned launch date (e.g. July 15, 2026)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/marketing/ph-launch',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,tagline,target_hunters:targetHunters,launch_date:launchDate})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#da552f',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Building Kit...':'Build Launch Kit'}</button>
      {result?.kit && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.kit}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_affiliateprog106() {
  const [product, setProduct] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [margin, setMargin] = React.useState('');
  const [targetAffiliates, setTargetAffiliates] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Affiliate Program Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a profitable affiliate program — commission structure, tiers, recruitment pitch, legal terms, and launch plan.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / service description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={price} onChange={(e:any)=>setPrice(e.target.value)} placeholder="Product price (e.g. $99/mo, $499 one-time)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={margin} onChange={(e:any)=>setMargin(e.target.value)} placeholder="Gross margin % (e.g. 70%)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <input value={targetAffiliates} onChange={(e:any)=>setTargetAffiliates(e.target.value)} placeholder="Ideal affiliates (e.g. YouTubers, bloggers, agencies, influencers in X niche)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/growth/affiliate-program',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,price,margin,target_affiliates:targetAffiliates})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Building Program...':'Design Affiliate Program'}</button>
      {result?.program && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.program}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_referralprog106() {
  const [product, setProduct] = React.useState('');
  const [ltv, setLtv] = React.useState('');
  const [rewardType, setRewardType] = React.useState('two-sided');
  const [mechanic, setMechanic] = React.useState('discount');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Referral Program Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a viral referral loop — reward structure, messaging, invite flows, and anti-fraud guardrails.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product + who your users are" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={ltv} onChange={(e:any)=>setLtv(e.target.value)} placeholder="Customer LTV (e.g. $500/year, $200 one-time)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={rewardType} onChange={(e:any)=>setRewardType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="two-sided">Two-sided (both get reward)</option><option value="referrer-only">Referrer only</option><option value="referee-only">New user only</option><option value="milestone">Milestone-based</option>
        </select>
        <select value={mechanic} onChange={(e:any)=>setMechanic(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="discount">Discount / credit</option><option value="cash">Cash reward</option><option value="free-month">Free month</option><option value="feature-unlock">Feature unlock</option><option value="swag">Swag / gift</option>
        </select>
      </div>
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/growth/referral-program',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,ltv,reward_type:rewardType,mechanic})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Designing...':'Design Referral Program'}</button>
      {result?.program && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.program}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_partnershipitch106() {
  const [yourCompany, setYourCompany] = React.useState('');
  const [partnerCompany, setPartnerCompany] = React.useState('');
  const [partnerType, setPartnerType] = React.useState('integration');
  const [value, setValue] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Partnership Pitch</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Craft a compelling partnership proposal that leads with their benefit and closes with a clear ask.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={yourCompany} onChange={(e:any)=>setYourCompany(e.target.value)} placeholder="Your company + what you do" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={partnerCompany} onChange={(e:any)=>setPartnerCompany(e.target.value)} placeholder="Target partner + what they do" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <select value={partnerType} onChange={(e:any)=>setPartnerType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="integration">Technical integration</option><option value="reseller">Reseller / channel</option><option value="co-marketing">Co-marketing / co-sell</option><option value="distribution">Distribution deal</option><option value="white-label">White label</option><option value="strategic">Strategic alliance</option>
      </select>
      <textarea value={value} onChange={(e:any)=>setValue(e.target.value)} placeholder="What value does this create for THEM (their customers, revenue, product)?" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!yourCompany.trim()||!partnerCompany.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/business/partnership-pitch',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({your_company:yourCompany,partner_company:partnerCompany,partner_type:partnerType,value_for_them:value})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1e40af',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!yourCompany.trim()||!partnerCompany.trim()?0.5:1}}>{loading?'Writing Pitch...':'Generate Partnership Pitch'}</button>
      {result?.pitch && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.pitch}</div>}
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
