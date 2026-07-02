const fs = require('fs');
const path = require('path');

const TSX = path.join(__dirname, 'forge-web-studio/app/components/ForgeApp.tsx');
let src = fs.readFileSync(TSX, 'utf8');

const NAV_ANCHOR = `{ id:'persona114', icon:'👤', label:'User Persona Creator' },`;
const NAV_NEW = `{ id:'persona114', icon:'👤', label:'User Persona Creator' },
        { id:'seooptimizer115', icon:'🔍', label:'SEO Content Optimizer' },
        { id:'headlineanalyzer115', icon:'📰', label:'Headline Analyzer' },
        { id:'contentcal115', icon:'📅', label:'Content Calendar' },
        { id:'backlinkstrat115', icon:'🔗', label:'Backlink Strategy' },
        { id:'metatag115', icon:'🏷️', label:'Meta Tag Generator' },`;
if (!src.includes(NAV_ANCHOR)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(NAV_ANCHOR, NAV_NEW);

const RENDER_ANCHOR = `{(mainTab as string) === 'persona114' && <ForgeTab_persona114 />}`;
const RENDER_NEW = `{(mainTab as string) === 'persona114' && <ForgeTab_persona114 />}
        {(mainTab as string) === 'seooptimizer115' && <ForgeTab_seooptimizer115 />}
        {(mainTab as string) === 'headlineanalyzer115' && <ForgeTab_headlineanalyzer115 />}
        {(mainTab as string) === 'contentcal115' && <ForgeTab_contentcal115 />}
        {(mainTab as string) === 'backlinkstrat115' && <ForgeTab_backlinkstrat115 />}
        {(mainTab as string) === 'metatag115' && <ForgeTab_metatag115 />}`;
if (!src.includes(RENDER_ANCHOR)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(RENDER_ANCHOR, RENDER_NEW);

const COMPONENT_ANCHOR = `export default function ForgeApp()`;
const COMPONENTS = `
// ── WAVE 115 ─────────────────────────────────────────────────────────────────

function ForgeTab_seooptimizer115() {
  const [content, setContent] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [contentType, setContentType] = React.useState('blog-post');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🔍 SEO Content Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Optimize your content for search — get keyword density, structure fixes, and ranking improvements.</p>
      <input value={keyword} onChange={(e:any)=>setKeyword(e.target.value)} placeholder="Target keyword (e.g. project management software for startups)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={contentType} onChange={(e:any)=>setContentType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="blog-post">Blog Post / Article</option>
        <option value="landing-page">Landing Page</option>
        <option value="product-page">Product Page</option>
        <option value="category-page">Category Page</option>
        <option value="pillar-page">Pillar / Hub Page</option>
      </select>
      <textarea value={content} onChange={(e:any)=>setContent(e.target.value)} placeholder="Paste your content here (title, headings, body text)..." rows={8} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!content.trim()||!keyword.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/seo/content-optimizer',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({content,keyword,contentType})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!content.trim()||!keyword.trim()?0.5:1}}>{loading?'Optimizing...':'🔍 Optimize for SEO'}</button>
      {result?.report && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.report}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_headlineanalyzer115() {
  const [headlines, setHeadlines] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [goal, setGoal] = React.useState('click-through');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📰 Headline Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Score headlines for CTR, emotional impact, and SEO — plus generate 10 alternatives.</p>
      <textarea value={headlines} onChange={(e:any)=>setHeadlines(e.target.value)} placeholder="Enter 1-5 headlines to analyze (one per line)&#10;e.g. How to Double Your SaaS Revenue in 90 Days" rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Target audience (e.g. SaaS founders, B2B marketers)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="click-through">Blog / SEO Click-Through</option>
        <option value="email-open">Email Open Rate</option>
        <option value="social-share">Social Media Shares</option>
        <option value="ad-ctr">Ad CTR</option>
        <option value="conversion">Landing Page Conversion</option>
      </select>
      <button disabled={loading||!headlines.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/content/headline-analyzer',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({headlines,audience,goal})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!headlines.trim()?0.5:1}}>{loading?'Analyzing...':'📰 Analyze Headlines'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_contentcal115() {
  const [business, setBusiness] = React.useState('');
  const [channels, setChannels] = React.useState('');
  const [frequency, setFrequency] = React.useState('weekly');
  const [theme, setTheme] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📅 Content Calendar Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a 30-day content calendar with topics, formats, and publishing schedule.</p>
      <textarea value={business} onChange={(e:any)=>setBusiness(e.target.value)} placeholder="Business description and content goals (e.g. B2B SaaS for HR teams, goal: drive demo requests)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={channels} onChange={(e:any)=>setChannels(e.target.value)} placeholder="Publishing channels (e.g. LinkedIn, blog, email newsletter, Twitter)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={theme} onChange={(e:any)=>setTheme(e.target.value)} placeholder="Monthly theme or campaign (optional, e.g. Back-to-school, Q3 growth push)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={frequency} onChange={(e:any)=>setFrequency(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="daily">Daily publishing</option>
        <option value="3x-week">3x per week</option>
        <option value="weekly">Weekly</option>
        <option value="2x-month">2x per month</option>
      </select>
      <button disabled={loading||!business.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/content/calendar',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({business,channels,frequency,theme})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!business.trim()?0.5:1}}>{loading?'Building calendar...':'📅 Build Content Calendar'}</button>
      {result?.calendar && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.calendar}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_backlinkstrat115() {
  const [website, setWebsite] = React.useState('');
  const [niche, setNiche] = React.useState('');
  const [currentDA, setCurrentDA] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🔗 Backlink Strategy Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get a customized link-building strategy with outreach templates and prospect sources.</p>
      <input value={website} onChange={(e:any)=>setWebsite(e.target.value)} placeholder="Website URL or description (e.g. forge-platform.com — AI tools for entrepreneurs)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={niche} onChange={(e:any)=>setNiche(e.target.value)} placeholder="Niche / industry (e.g. SaaS, e-commerce, B2B software, health & wellness)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={currentDA} onChange={(e:any)=>setCurrentDA(e.target.value)} placeholder="Current Domain Authority if known (e.g. DA 25, or 'new site')" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!website.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/seo/backlink-strategy',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({website,niche,currentDA})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!website.trim()?0.5:1}}>{loading?'Building strategy...':'🔗 Build Link Strategy'}</button>
      {result?.strategy && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.strategy}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_metatag115() {
  const [pageTitle, setPageTitle] = React.useState('');
  const [pageContent, setPageContent] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [pageType, setPageType] = React.useState('website');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🏷️ Meta Tag Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate optimized title tags, meta descriptions, and Open Graph tags for any page.</p>
      <input value={pageTitle} onChange={(e:any)=>setPageTitle(e.target.value)} placeholder="Page title or topic (e.g. Project Management Software for Remote Teams)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={keyword} onChange={(e:any)=>setKeyword(e.target.value)} placeholder="Target keyword (e.g. remote team project management)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={pageContent} onChange={(e:any)=>setPageContent(e.target.value)} placeholder="Brief page description (what is this page about, key benefits, target audience)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={pageType} onChange={(e:any)=>setPageType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="website">Website / Homepage</option>
        <option value="article">Blog Article</option>
        <option value="product">Product Page</option>
        <option value="service">Service Page</option>
        <option value="landing-page">Landing Page</option>
      </select>
      <button disabled={loading||!pageTitle.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/seo/meta-tags',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({pageTitle,pageContent,keyword,pageType})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#d97706',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!pageTitle.trim()?0.5:1}}>{loading?'Generating tags...':'🏷️ Generate Meta Tags'}</button>
      {result?.tags && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any,fontFamily:'monospace'}}>{result.tags}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

`;
if (!src.includes(COMPONENT_ANCHOR)) { console.error('COMPONENT ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(COMPONENT_ANCHOR, COMPONENTS + COMPONENT_ANCHOR);

fs.writeFileSync(TSX, src, 'utf8');
console.log('Wave 115 patched. Lines:', src.split('\n').length);
