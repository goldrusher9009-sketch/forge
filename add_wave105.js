const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// NAV
const navAnchor = "{ id:'datastory104', icon:'📊', label:'Data Storyteller' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'datastory104', icon:'📊', label:'Data Storyteller' },
            { id:'persona105', icon:'🧑', label:'Customer Persona Builder' },
            { id:'sopwriter105', icon:'📋', label:'SOP Writer' },
            { id:'okrgen105', icon:'🎯', label:'OKR Generator' },
            { id:'retro105', icon:'🔄', label:'Retro Facilitator' },
            { id:'emailseq105', icon:'📨', label:'Email Sequence Builder' },`);

// RENDER
const renderAnchor = "        {(mainTab as string) === 'datastory104' && <ForgeTab_datastory104 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'datastory104' && <ForgeTab_datastory104 />}

        {/* ── WAVE 105 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'persona105' && <ForgeTab_persona105 />}
        {(mainTab as string) === 'sopwriter105' && <ForgeTab_sopwriter105 />}
        {(mainTab as string) === 'okrgen105' && <ForgeTab_okrgen105 />}
        {(mainTab as string) === 'retro105' && <ForgeTab_retro105 />}
        {(mainTab as string) === 'emailseq105' && <ForgeTab_emailseq105 />}`);

const components = `
function ForgeTab_persona105() {
  const [product, setProduct] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [data, setData] = React.useState('');
  const [count, setCount] = React.useState('3');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Customer Persona Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build research-backed customer personas with demographics, psychographics, pain points, buying triggers, and marketing angles.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / service (what it does, core value)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={market} onChange={(e:any)=>setMarket(e.target.value)} placeholder="Target market / industry (e.g. B2B SaaS, DTC e-commerce, local services)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={data} onChange={(e:any)=>setData(e.target.value)} placeholder="Any existing customer data, feedback, or observations (optional — helps make personas more accurate)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={count} onChange={(e:any)=>setCount(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="1">1 primary persona</option><option value="2">2 personas</option><option value="3">3 personas</option><option value="4">4 personas</option>
      </select>
      <button disabled={loading||!product.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/marketing/personas',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,market,existing_data:data,count:parseInt(count)})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()?0.5:1}}>{loading?'Building Personas...':'Build Personas'}</button>
      {result?.personas && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.personas}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_sopwriter105() {
  const [process, setProcess] = React.useState('');
  const [role, setRole] = React.useState('');
  const [tools, setTools] = React.useState('');
  const [format, setFormat] = React.useState('numbered');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>SOP Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn tribal knowledge into clear, repeatable Standard Operating Procedures anyone can follow.</p>
      <textarea value={process} onChange={(e:any)=>setProcess(e.target.value)} placeholder="Describe the process you want to document (as detailed or rough as you have)..." rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={role} onChange={(e:any)=>setRole(e.target.value)} placeholder="Who performs this? (role/title)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={tools} onChange={(e:any)=>setTools(e.target.value)} placeholder="Tools / systems used (e.g. Salesforce, Slack)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <select value={format} onChange={(e:any)=>setFormat(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="numbered">Numbered steps</option><option value="checklist">Checklist</option><option value="flowchart">Decision flowchart (text)</option><option value="swimlane">Swimlane (multi-role)</option><option value="wiki">Wiki-style doc</option>
      </select>
      <button disabled={loading||!process.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ops/sop',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({process,role,tools,format})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0369a1',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!process.trim()?0.5:1}}>{loading?'Writing SOP...':'Generate SOP'}</button>
      {result?.sop && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.sop}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_okrgen105() {
  const [company, setCompany] = React.useState('');
  const [mission, setMission] = React.useState('');
  const [quarter, setQuarter] = React.useState('Q3 2026');
  const [focus, setFocus] = React.useState('');
  const [level, setLevel] = React.useState('company');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>OKR Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate ambitious, measurable OKRs with scoring guides and alignment checks.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company / team name" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={quarter} onChange={(e:any)=>setQuarter(e.target.value)} placeholder="Quarter (e.g. Q3 2026)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <input value={mission} onChange={(e:any)=>setMission(e.target.value)} placeholder="Company mission or annual goal" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={focus} onChange={(e:any)=>setFocus(e.target.value)} placeholder="This quarter's strategic focus (e.g. grow revenue, reduce churn, launch new product)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={level} onChange={(e:any)=>setLevel(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="company">Company-level</option><option value="product">Product team</option><option value="engineering">Engineering team</option><option value="marketing">Marketing team</option><option value="sales">Sales team</option><option value="individual">Individual contributor</option>
      </select>
      <button disabled={loading||!focus.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ops/okrs',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({company,mission,quarter,focus,level})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!focus.trim()?0.5:1}}>{loading?'Generating OKRs...':'Generate OKRs'}</button>
      {result?.okrs && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.okrs}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_retro105() {
  const [sprintGoal, setSprintGoal] = React.useState('');
  const [teamSize, setTeamSize] = React.useState('5');
  const [wentWell, setWentWell] = React.useState('');
  const [issues, setIssues] = React.useState('');
  const [format, setFormat] = React.useState('4ls');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Retro Facilitator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Facilitate sprint retrospectives — generate agenda, discussion prompts, action items, and team health assessment.</p>
      <input value={sprintGoal} onChange={(e:any)=>setSprintGoal(e.target.value)} placeholder="Sprint goal / what was this sprint about?" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={wentWell} onChange={(e:any)=>setWentWell(e.target.value)} placeholder="What went well? (paste notes or describe)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <textarea value={issues} onChange={(e:any)=>setIssues(e.target.value)} placeholder="Issues / blockers / what could improve?" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={format} onChange={(e:any)=>setFormat(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="4ls">4Ls (Liked/Learned/Lacked/Longed For)</option>
          <option value="start-stop-continue">Start / Stop / Continue</option>
          <option value="mad-sad-glad">Mad / Sad / Glad</option>
          <option value="sailboat">Sailboat (anchors vs wind)</option>
          <option value="5whys">5 Whys root cause</option>
        </select>
        <input value={teamSize} onChange={(e:any)=>setTeamSize(e.target.value)} placeholder="Team size" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <button disabled={loading||!sprintGoal.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ops/retro',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({sprint_goal:sprintGoal,team_size:teamSize,went_well:wentWell,issues,format})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0891b2',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!sprintGoal.trim()?0.5:1}}>{loading?'Facilitating...':'Run Retrospective'}</button>
      {result?.retro && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.retro}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_emailseq105() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [seqType, setSeqType] = React.useState('onboarding');
  const [emailCount, setEmailCount] = React.useState('5');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Email Sequence Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Complete email sequences with subject lines, body copy, timing, and CTAs — for onboarding, sales, and nurture.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / service + core value prop" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={audience} onChange={(e:any)=>setAudience(e.target.value)} placeholder="Target audience (who receives this)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={goal} onChange={(e:any)=>setGoal(e.target.value)} placeholder="Conversion goal (e.g. upgrade to paid, book a call, make first purchase)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={seqType} onChange={(e:any)=>setSeqType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="onboarding">Onboarding (new users)</option>
          <option value="nurture">Lead nurture</option>
          <option value="sales">Sales outreach</option>
          <option value="reengagement">Re-engagement / win-back</option>
          <option value="trial">Trial-to-paid conversion</option>
          <option value="launch">Product launch</option>
          <option value="abandoned">Abandoned cart / checkout</option>
        </select>
        <select value={emailCount} onChange={(e:any)=>setEmailCount(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="3">3 emails</option><option value="5">5 emails</option><option value="7">7 emails</option><option value="10">10 emails</option>
        </select>
      </div>
      <button disabled={loading||!product.trim()||!audience.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/email/sequence',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,audience,seq_type:seqType,email_count:parseInt(emailCount),goal})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()||!audience.trim()?0.5:1}}>{loading?'Building Sequence...':'Build Email Sequence'}</button>
      {result?.sequence && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.sequence}</div>}
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
