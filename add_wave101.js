const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// NAV anchor
const navAnchor = `{ id:'granttool100', icon:'\u{1F3C6}', label:'Grant Proposal Writer' },`;
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'granttool100', icon:'\u{1F3C6}', label:'Grant Proposal Writer' },
            { id:'threadwriter101', icon:'\u{1F9F5}', label:'Thread Writer' },
            { id:'uxaudit101', icon:'\u{1F4A1}', label:'UX Audit' },
            { id:'pricingtier101', icon:'\u{1F4B2}', label:'Pricing Tier Designer' },
            { id:'onboardflow101', icon:'\u{1F6AA}', label:'Onboarding Flow Builder' },
            { id:'pressrelease101', icon:'\u{1F4F0}', label:'Press Release Writer' },`);

// RENDER anchor
const renderAnchor = `        {(mainTab as string) === 'granttool100' && <ForgeTab_granttool100 />}`;
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'granttool100' && <ForgeTab_granttool100 />}

        {/* ── WAVE 101 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'threadwriter101' && <ForgeTab_threadwriter101 />}
        {(mainTab as string) === 'uxaudit101' && <ForgeTab_uxaudit101 />}
        {(mainTab as string) === 'pricingtier101' && <ForgeTab_pricingtier101 />}
        {(mainTab as string) === 'onboardflow101' && <ForgeTab_onboardflow101 />}
        {(mainTab as string) === 'pressrelease101' && <ForgeTab_pressrelease101 />}`);

// COMPONENTS
const components = `
function ForgeTab_threadwriter101() {
  const [topic, setTopic] = React.useState('');
  const [platform, setPlatform] = React.useState('twitter');
  const [angle, setAngle] = React.useState('educational');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Thread Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Viral Twitter/X and LinkedIn threads with hooks, numbered tweets, and engagement triggers.</p>
      <input value={topic} onChange={(e:any)=>setTopic(e.target.value)} placeholder="Thread topic (e.g. 10 lessons from building a $1M SaaS)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Target audience" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={platform} onChange={(e:any)=>setPlatform(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="twitter">Twitter / X</option><option value="linkedin">LinkedIn</option><option value="both">Both</option>
        </select>
        <select value={angle} onChange={(e:any)=>setAngle(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="educational">Educational (lessons)</option><option value="storytelling">Storytelling (journey)</option><option value="listicle">Listicle (tips/tools)</option><option value="controversial">Controversial take</option><option value="case-study">Case study</option>
        </select>
      </div>
      <button disabled={loading||!topic.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/social/thread',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({topic,platform,angle,audience})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1d9bf0',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!topic.trim()?0.5:1}}>{loading?'Writing Thread...':'Generate Thread'}</button>
      {result?.thread && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.thread}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_uxaudit101() {
  const [productType, setProductType] = React.useState('web-app');
  const [description, setDescription] = React.useState('');
  const [userGoal, setUserGoal] = React.useState('');
  const [knownIssues, setKnownIssues] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>UX Audit</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Heuristic UX audit checklist, conversion killers, and prioritized fixes for any digital product.</p>
      <select value={productType} onChange={(e:any)=>setProductType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="web-app">Web App / SaaS</option><option value="landing">Landing Page</option><option value="mobile">Mobile App</option><option value="ecommerce">E-commerce</option><option value="onboarding">Onboarding Flow</option>
      </select>
      <textarea value={description} onChange={(e:any)=>setDescription(e.target.value)} placeholder="Describe your product / screen / flow (what it does, what users see)" rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={userGoal} onChange={(e:any)=>setUserGoal(e.target.value)} placeholder="Primary user goal (e.g. sign up, complete checkout, activate feature)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={knownIssues} onChange={(e:any)=>setKnownIssues(e.target.value)} placeholder="Known issues / complaints (optional)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!description.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ux/audit',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product_type:productType,description,user_goal:userGoal,known_issues:knownIssues})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!description.trim()?0.5:1}}>{loading?'Auditing...':'Run UX Audit'}</button>
      {result?.audit && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.audit}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_pricingtier101() {
  const [product, setProduct] = React.useState('');
  const [targetMarket, setTargetMarket] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [model, setModel] = React.useState('subscription');
  const [currentPrice, setCurrentPrice] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Pricing Tier Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design SaaS pricing tiers with tier names, feature differentiation, price anchoring, and upgrade triggers.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product description (what it does)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={targetMarket} onChange={(e:any)=>setTargetMarket(e.target.value)} placeholder="Target market (e.g. freelancers, SMBs, enterprise)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={competitors} onChange={(e:any)=>setCompetitors(e.target.value)} placeholder="Main competitors + their pricing (optional)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={model} onChange={(e:any)=>setModel(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="subscription">Monthly Subscription</option><option value="annual">Annual Plans</option><option value="usage">Usage-based</option><option value="freemium">Freemium</option><option value="lifetime">Lifetime Deal</option>
        </select>
        <input value={currentPrice} onChange={(e:any)=>setCurrentPrice(e.target.value)} placeholder="Current price (if any)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <button disabled={loading||!product.trim()||!targetMarket.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/pricing/tiers',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,target_market:targetMarket,competitors,model,current_price:currentPrice})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()||!targetMarket.trim()?0.5:1}}>{loading?'Designing...':'Design Pricing Tiers'}</button>
      {result?.pricing && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.pricing}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_onboardflow101() {
  const [product, setProduct] = React.useState('');
  const [userType, setUserType] = React.useState('');
  const [aha, setAha] = React.useState('');
  const [currentDropoff, setCurrentDropoff] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Onboarding Flow Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design step-by-step onboarding flows that drive activation, reduce churn, and hit the aha moment fast.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product (what it does, core value)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={userType} onChange={(e:any)=>setUserType(e.target.value)} placeholder="Primary user type (e.g. non-technical marketers)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={aha} onChange={(e:any)=>setAha(e.target.value)} placeholder="Aha moment (when user first gets value, e.g. sends first campaign)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={currentDropoff} onChange={(e:any)=>setCurrentDropoff(e.target.value)} placeholder="Where users currently drop off (optional)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/product/onboarding-flow',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,user_type:userType,aha_moment:aha,drop_off:currentDropoff})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#f59e0b',color:'#000',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Building Flow...':'Build Onboarding Flow'}</button>
      {result?.flow && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.flow}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_pressrelease101() {
  const [headline, setHeadline] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [announcement, setAnnouncement] = React.useState('');
  const [quote, setQuote] = React.useState('');
  const [releaseType, setReleaseType] = React.useState('product-launch');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Press Release Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>AP-style press releases journalists actually open — with headline options, dateline, and media contact block.</p>
      <select value={releaseType} onChange={(e:any)=>setReleaseType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="product-launch">Product Launch</option><option value="funding">Funding Announcement</option><option value="partnership">Partnership</option><option value="award">Award / Recognition</option><option value="hiring">Executive Hire</option><option value="milestone">Company Milestone</option>
      </select>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company name" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={headline} onChange={(e:any)=>setHeadline(e.target.value)} placeholder="Headline idea (optional)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <textarea value={announcement} onChange={(e:any)=>setAnnouncement(e.target.value)} placeholder="What are you announcing? Key facts, numbers, context..." rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <textarea value={quote} onChange={(e:any)=>setQuote(e.target.value)} placeholder="Executive quote (name + title + quote, or leave blank to generate)" rows={2} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!company.trim()||!announcement.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/pr/press-release',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({headline,company,announcement,quote,release_type:releaseType})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#111827',color:'#fff',border:'1px solid #6b7280',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!company.trim()||!announcement.trim()?0.5:1}}>{loading?'Writing...':'Generate Press Release'}</button>
      {result?.release && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.release}</div>}
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
