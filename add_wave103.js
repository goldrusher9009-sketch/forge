const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// NAV
const navAnchor = `{ id:'competitortear102', icon:'\u{1F52D}', label:'Competitor Teardown' },`;
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'competitortear102', icon:'\u{1F52D}', label:'Competitor Teardown' },
            { id:'emailsubject103', icon:'\u{1F4E7}', label:'Email Subject Tester' },
            { id:'objectionhandler103', icon:'\u{1F6E1}', label:'Objection Handler' },
            { id:'pitchfeedback103', icon:'\u{1F3A4}', label:'Pitch Deck Feedback' },
            { id:'nichefinder103', icon:'\u{1F3AF}', label:'Niche Finder' },
            { id:'contentrepurpose103', icon:'\u{267B}', label:'Content Repurposer' },`);

// RENDER
const renderAnchor = `        {(mainTab as string) === 'competitortear102' && <ForgeTab_competitortear102 />}`;
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'competitortear102' && <ForgeTab_competitortear102 />}

        {/* ── WAVE 103 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'emailsubject103' && <ForgeTab_emailsubject103 />}
        {(mainTab as string) === 'objectionhandler103' && <ForgeTab_objectionhandler103 />}
        {(mainTab as string) === 'pitchfeedback103' && <ForgeTab_pitchfeedback103 />}
        {(mainTab as string) === 'nichefinder103' && <ForgeTab_nichefinder103 />}
        {(mainTab as string) === 'contentrepurpose103' && <ForgeTab_contentrepurpose103 />}`);

const components = `
function ForgeTab_emailsubject103() {
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [emailType, setEmailType] = React.useState('marketing');
  const [tone, setTone] = React.useState('professional');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Email Subject Line Tester</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 20+ subject line variations, score them for open rate, and get A/B test recommendations.</p>
      <input value={topic} onChange={(e:any)=>setTopic(e.target.value)} placeholder="Email topic / what the email is about" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Target audience (e.g. B2B SaaS founders, e-commerce shoppers)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={emailType} onChange={(e:any)=>setEmailType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="marketing">Marketing / Promo</option><option value="newsletter">Newsletter</option><option value="cold">Cold outreach</option><option value="transactional">Transactional</option><option value="reengagement">Re-engagement</option><option value="sales">Sales follow-up</option>
        </select>
        <select value={tone} onChange={(e:any)=>setTone(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="professional">Professional</option><option value="casual">Casual / Friendly</option><option value="urgent">Urgent / FOMO</option><option value="curious">Curious / Mysterious</option><option value="funny">Funny / Witty</option><option value="bold">Bold / Provocative</option>
        </select>
      </div>
      <button disabled={loading||!topic.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/email/subject-lines',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({topic,audience,email_type:emailType,tone})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!topic.trim()?0.5:1}}>{loading?'Generating...':'Generate Subject Lines'}</button>
      {result?.subjects && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.subjects}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_objectionhandler103() {
  const [objection, setObjection] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [stage, setStage] = React.useState('discovery');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Sales Objection Handler</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get battle-tested responses to any sales objection — with psychology, scripts, and flip techniques.</p>
      <textarea value={objection} onChange={(e:any)=>setObjection(e.target.value)} placeholder="Enter the objection (e.g. too expensive, we already use competitor, need to think about it)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="What are you selling? (brief description)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={stage} onChange={(e:any)=>setStage(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="cold">Cold outreach</option><option value="discovery">Discovery call</option><option value="demo">Demo / presentation</option><option value="proposal">Proposal / pricing</option><option value="closing">Closing</option><option value="followup">Follow-up</option>
      </select>
      <button disabled={loading||!objection.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/sales/handle-objection',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({objection,product,stage})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!objection.trim()?0.5:1}}>{loading?'Loading...':'Handle Objection'}</button>
      {result?.response && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.response}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_pitchfeedback103() {
  const [pitchContent, setPitchContent] = React.useState('');
  const [audience, setAudience] = React.useState('vc');
  const [stage, setStage] = React.useState('seed');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Pitch Deck Feedback</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Brutal, honest pitch deck critique from a VC perspective — slide by slide, with a pass/fail verdict.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={audience} onChange={(e:any)=>setAudience(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="vc">Venture Capital</option><option value="angel">Angel Investors</option><option value="accelerator">Accelerator / YC</option><option value="strategic">Strategic Partners</option><option value="bank">Bank / SBA loan</option>
        </select>
        <select value={stage} onChange={(e:any)=>setStage(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="pre-seed">Pre-seed (idea)</option><option value="seed">Seed ($0-2M)</option><option value="seriesA">Series A ($2M+)</option><option value="growth">Growth</option>
        </select>
      </div>
      <textarea value={pitchContent} onChange={(e:any)=>setPitchContent(e.target.value)} placeholder="Paste your pitch deck content, slide titles, or describe each slide's content..." rows={10} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!pitchContent.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/pitch/feedback',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({pitch_content:pitchContent,audience,stage})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1e40af',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!pitchContent.trim()?0.5:1}}>{loading?'Reviewing...':'Get Pitch Feedback'}</button>
      {result?.feedback && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.feedback}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_nichefinder103() {
  const [skills, setSkills] = React.useState('');
  const [interests, setInterests] = React.useState('');
  const [experience, setExperience] = React.useState('');
  const [goal, setGoal] = React.useState('freelance');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Niche Finder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Find your profitable niche — intersection of skills, passion, and market demand with revenue potential.</p>
      <input value={skills} onChange={(e:any)=>setSkills(e.target.value)} placeholder="Your skills (e.g. Python, marketing, accounting, design)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={interests} onChange={(e:any)=>setInterests(e.target.value)} placeholder="Your interests / passions" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={experience} onChange={(e:any)=>setExperience(e.target.value)} placeholder="Background / industry experience (optional)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="freelance">Freelancing / Consulting</option><option value="saas">Build a SaaS</option><option value="content">Content / Creator</option><option value="agency">Agency</option><option value="product">Physical / Digital product</option><option value="coaching">Coaching / Course</option>
      </select>
      <button disabled={loading||!skills.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/business/niche-finder',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({skills,interests,experience,goal})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0891b2',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!skills.trim()?0.5:1}}>{loading?'Finding Niches...':'Find My Niche'}</button>
      {result?.niches && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.niches}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_contentrepurpose103() {
  const [originalContent, setOriginalContent] = React.useState('');
  const [sourceFormat, setSourceFormat] = React.useState('blog');
  const [targets, setTargets] = React.useState<string[]>(['twitter', 'linkedin', 'email']);
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const targetOptions = ['twitter','linkedin','email','instagram','tiktok','youtube','podcast','newsletter','reddit'];
  const toggleTarget = (t: string) => setTargets((prev: string[]) => prev.includes(t) ? prev.filter((x: string)=>x!==t) : [...prev, t]);
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Content Repurposer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn one piece of content into 5-9 platform-specific formats. One blog post → everywhere.</p>
      <select value={sourceFormat} onChange={(e:any)=>setSourceFormat(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="blog">Blog post</option><option value="podcast">Podcast transcript</option><option value="video">Video / YouTube script</option><option value="tweet">Tweet / thread</option><option value="linkedin">LinkedIn post</option><option value="talk">Talk / presentation</option>
      </select>
      <textarea value={originalContent} onChange={(e:any)=>setOriginalContent(e.target.value)} placeholder="Paste your original content here..." rows={8} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{marginBottom:'1rem'}}>
        <p style={{color:'#9ca3af',fontSize:13,marginBottom:'0.5rem'}}>Repurpose to:</p>
        <div style={{display:'flex',flexWrap:'wrap' as any,gap:'0.5rem'}}>
          {targetOptions.map((t: string)=>(
            <button key={t} onClick={()=>toggleTarget(t)} style={{padding:'0.25rem 0.75rem',borderRadius:20,border:'1px solid',borderColor:targets.includes(t)?'#6366f1':'#374151',background:targets.includes(t)?'#312e81':'transparent',color:targets.includes(t)?'#a5b4fc':'#9ca3af',fontSize:12,cursor:'pointer'}}>{t}</button>
          ))}
        </div>
      </div>
      <button disabled={loading||!originalContent.trim()||targets.length===0} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/content/repurpose',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({original_content:originalContent,source_format:sourceFormat,targets})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!originalContent.trim()||targets.length===0?0.5:1}}>{loading?'Repurposing...':'Repurpose Content'}</button>
      {result?.repurposed && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.repurposed}</div>}
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
