const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const navAnchor = "{ id:'podcastscript109', icon:'🎙️', label:'Podcast Scriptwriter' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'podcastscript109', icon:'🎙️', label:'Podcast Scriptwriter' },
            { id:'newsletter110', icon:'📰', label:'Newsletter Builder' },
            { id:'adcopy110', icon:'📣', label:'Ad Copy Generator' },
            { id:'abtest110', icon:'🧪', label:'Landing Page A/B Tester' },
            { id:'webinarscript110', icon:'🖥️', label:'Webinar Script' },
            { id:'casestudy110', icon:'📖', label:'Case Study Writer' },`);

const renderAnchor = "        {(mainTab as string) === 'podcastscript109' && <ForgeTab_podcastscript109 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'podcastscript109' && <ForgeTab_podcastscript109 />}

        {/* ── WAVE 110 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'newsletter110' && <ForgeTab_newsletter110 />}
        {(mainTab as string) === 'adcopy110' && <ForgeTab_adcopy110 />}
        {(mainTab as string) === 'abtest110' && <ForgeTab_abtest110 />}
        {(mainTab as string) === 'webinarscript110' && <ForgeTab_webinarscript110 />}
        {(mainTab as string) === 'casestudy110' && <ForgeTab_casestudy110 />}`);

const components = `
function ForgeTab_newsletter110() {
  const [brand, setBrand] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [format, setFormat] = React.useState('educational');
  const [length, setLength] = React.useState('medium');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Newsletter Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a complete newsletter issue — subject lines, hook, body, CTA, and social teasers.</p>
      <input value={brand} onChange={(e:any)=>setBrand(e.target.value)} placeholder="Newsletter name + brand (e.g. 'The Bootstrapper' — weekly tips for indie founders)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Audience description (e.g. SaaS founders, 5k subscribers, mostly in growth stage)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={topic} onChange={(e:any)=>setTopic(e.target.value)} placeholder="This issue's topic / main idea / angle (e.g. Why your pricing page is killing conversions — 3 fixes that work)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={format} onChange={(e:any)=>setFormat(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="educational">Educational / how-to</option><option value="curated">Curated links + commentary</option><option value="story">Personal story / narrative</option><option value="opinion">Opinion / hot take</option><option value="listicle">Numbered list / tips</option><option value="interview">Q&A / interview format</option>
        </select>
        <select value={length} onChange={(e:any)=>setLength(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="short">Short (300-500 words)</option><option value="medium">Medium (600-900 words)</option><option value="long">Long (1000-1500 words)</option>
        </select>
      </div>
      <button disabled={loading||!brand.trim()||!topic.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/content/newsletter',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({brand,topic,audience,format,length})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#f59e0b',color:'#111',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!brand.trim()||!topic.trim()?0.5:1}}>{loading?'Writing Newsletter...':'Write Newsletter Issue'}</button>
      {result?.newsletter && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.newsletter}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_adcopy110() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [platform, setPlatform] = React.useState('meta');
  const [goal, setGoal] = React.useState('conversion');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Ad Copy Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate platform-optimized ad copy variants — headlines, body, CTAs, and hooks for A/B testing.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product + key benefit + price/offer (e.g. Forge AI — 100+ AI tools for founders, $29/mo)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Target audience (e.g. startup founders aged 25-45, interested in productivity and SaaS)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={platform} onChange={(e:any)=>setPlatform(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="meta">Meta (Facebook/Instagram)</option><option value="google">Google Search Ads</option><option value="linkedin">LinkedIn Ads</option><option value="twitter">Twitter/X Ads</option><option value="tiktok">TikTok Ads</option><option value="youtube">YouTube Ads</option><option value="reddit">Reddit Ads</option>
        </select>
        <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="conversion">Conversion / purchase</option><option value="lead-gen">Lead generation</option><option value="trial">Free trial signup</option><option value="awareness">Brand awareness</option><option value="retargeting">Retargeting</option><option value="app-install">App install</option>
        </select>
      </div>
      <button disabled={loading||!product.trim()||!audience.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/marketing/ad-copy',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,audience,platform,goal})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()||!audience.trim()?0.5:1}}>{loading?'Generating Ads...':'Generate Ad Copy'}</button>
      {result?.copy && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.copy}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_abtest110() {
  const [currentCopy, setCurrentCopy] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [goal, setGoal] = React.useState('signup');
  const [element, setElement] = React.useState('full');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Landing Page A/B Tester</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate A/B test variants for your landing page — headline, hero copy, CTA, and value props with testing hypotheses.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product + core value proposition" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="signup">Free signup</option><option value="trial">Trial start</option><option value="purchase">Direct purchase</option><option value="demo">Book a demo</option><option value="lead">Lead capture</option>
        </select>
        <select value={element} onChange={(e:any)=>setElement(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="full">Full page variants</option><option value="headline">Headlines only</option><option value="hero">Hero section</option><option value="cta">CTA copy & button</option><option value="pricing">Pricing section</option><option value="social-proof">Social proof section</option>
        </select>
      </div>
      <textarea value={currentCopy} onChange={(e:any)=>setCurrentCopy(e.target.value)} placeholder="Paste your current landing page copy (or the section you want to test)..." rows={6} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/marketing/ab-variants',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,current_copy:currentCopy,goal,element})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Creating Variants...':'Generate A/B Variants'}</button>
      {result?.variants && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.variants}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_webinarscript110() {
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [duration, setDuration] = React.useState('60');
  const [webinarType, setWebinarType] = React.useState('educational');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Webinar Script</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a complete webinar script with slide notes, engagement prompts, Q&A prep, and a closing pitch.</p>
      <input value={topic} onChange={(e:any)=>setTopic(e.target.value)} placeholder="Webinar title + topic (e.g. '5 Ways AI Will Change Your Sales Process in 2026')" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Target audience (e.g. VP Sales and RevOps leaders at 50-500 person companies)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={webinarType} onChange={(e:any)=>setWebinarType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="educational">Educational / thought leadership</option><option value="product-demo">Product demo</option><option value="sales">Sales / promotional</option><option value="training">Training / onboarding</option><option value="panel">Panel discussion</option>
        </select>
        <select value={duration} onChange={(e:any)=>setDuration(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option>
        </select>
      </div>
      <button disabled={loading||!topic.trim()||!audience.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/content/webinar-script',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({topic,audience,duration,webinar_type:webinarType})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0891b2',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!topic.trim()||!audience.trim()?0.5:1}}>{loading?'Writing Script...':'Write Webinar Script'}</button>
      {result?.script && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.script}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_casestudy110() {
  const [customer, setCustomer] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [results, setResults] = React.useState('');
  const [format, setFormat] = React.useState('long');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Case Study Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a compelling customer case study — problem, solution, results, and quotes — ready for your website and sales team.</p>
      <input value={customer} onChange={(e:any)=>setCustomer(e.target.value)} placeholder="Customer name + description (e.g. Acme Corp — 200-person logistics company)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Your product + what they used it for" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={format} onChange={(e:any)=>setFormat(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="long">Long-form (800-1200 words, website/blog)</option><option value="short">Short-form (300 words, one-pager)</option><option value="pdf">PDF-ready (structured sections)</option><option value="slide">Slide deck summary</option><option value="social">Social proof snippets</option>
      </select>
      <textarea value={results} onChange={(e:any)=>setResults(e.target.value)} placeholder="The story: what problem they had, what they tried, why they chose you, what they implemented, and the results (numbers, quotes, before/after...)" rows={6} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!customer.trim()||!results.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/marketing/case-study',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({customer,product,results,format})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!customer.trim()||!results.trim()?0.5:1}}>{loading?'Writing Case Study...':'Write Case Study'}</button>
      {result?.case_study && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.case_study}</div>}
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
