const fs = require('fs');
const path = require('path');

const TSX = path.join(__dirname, 'forge-web-studio/app/components/ForgeApp.tsx');
let src = fs.readFileSync(TSX, 'utf8');

const NAV_ANCHOR = `{ id:'metatag115', icon:'🏷️', label:'Meta Tag Generator' },`;
const NAV_NEW = `{ id:'metatag115', icon:'🏷️', label:'Meta Tag Generator' },
        { id:'sopwriter116', icon:'📋', label:'SOP Writer' },
        { id:'perfrev116', icon:'⭐', label:'Performance Review' },
        { id:'jobdesc116', icon:'💼', label:'Job Description Builder' },
        { id:'onboarding116', icon:'🚀', label:'Onboarding Checklist' },
        { id:'meetingai116', icon:'📝', label:'Meeting Agenda AI' },`;
if (!src.includes(NAV_ANCHOR)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(NAV_ANCHOR, NAV_NEW);

const RENDER_ANCHOR = `{(mainTab as string) === 'metatag115' && <ForgeTab_metatag115 />}`;
const RENDER_NEW = `{(mainTab as string) === 'metatag115' && <ForgeTab_metatag115 />}
        {(mainTab as string) === 'sopwriter116' && <ForgeTab_sopwriter116 />}
        {(mainTab as string) === 'perfrev116' && <ForgeTab_perfrev116 />}
        {(mainTab as string) === 'jobdesc116' && <ForgeTab_jobdesc116 />}
        {(mainTab as string) === 'onboarding116' && <ForgeTab_onboarding116 />}
        {(mainTab as string) === 'meetingai116' && <ForgeTab_meetingai116 />}`;
if (!src.includes(RENDER_ANCHOR)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(RENDER_ANCHOR, RENDER_NEW);

const COMPONENT_ANCHOR = `export default function ForgeApp()`;
const COMPONENTS = `
// ── WAVE 116 ─────────────────────────────────────────────────────────────────

function ForgeTab_sopwriter116() {
  const [process, setProcess] = React.useState('');
  const [team, setTeam] = React.useState('');
  const [detail, setDetail] = React.useState('standard');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📋 SOP Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate professional Standard Operating Procedures with step-by-step instructions, roles, and decision trees.</p>
      <textarea value={process} onChange={(e:any)=>setProcess(e.target.value)} placeholder="Describe the process to document (e.g. Customer onboarding from contract signed to first success call)" rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <input value={team} onChange={(e:any)=>setTeam(e.target.value)} placeholder="Team / department (e.g. Customer Success, Sales, Engineering, Finance)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={detail} onChange={(e:any)=>setDetail(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="brief">Brief (high-level steps only)</option>
        <option value="standard">Standard (steps + details + owner)</option>
        <option value="detailed">Detailed (steps + substeps + decision tree + RACI)</option>
      </select>
      <button disabled={loading||!process.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ops/sop-writer',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({process,team,detail})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!process.trim()?0.5:1}}>{loading?'Writing SOP...':'📋 Generate SOP'}</button>
      {result?.sop && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.sop}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_perfrev116() {
  const [employee, setEmployee] = React.useState('');
  const [achievements, setAchievements] = React.useState('');
  const [improvements, setImprovements] = React.useState('');
  const [reviewType, setReviewType] = React.useState('annual');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>⭐ Performance Review Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write professional, balanced performance reviews with specific feedback and development goals.</p>
      <input value={employee} onChange={(e:any)=>setEmployee(e.target.value)} placeholder="Employee role and context (e.g. Senior Software Engineer, 2 years on team, worked on payments feature)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={achievements} onChange={(e:any)=>setAchievements(e.target.value)} placeholder="Key achievements and strengths (e.g. Led payments migration, reduced latency 40%, mentored 2 junior devs, always meets deadlines)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <textarea value={improvements} onChange={(e:any)=>setImprovements(e.target.value)} placeholder="Areas for growth (e.g. Communication in cross-team meetings, documentation habits, proactive escalation)" rows={2} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={reviewType} onChange={(e:any)=>setReviewType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="annual">Annual Review</option>
        <option value="mid-year">Mid-Year Check-in</option>
        <option value="90-day">90-Day Review (new hire)</option>
        <option value="pip">Performance Improvement Plan</option>
        <option value="promotion">Promotion Recommendation</option>
      </select>
      <button disabled={loading||!employee.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/hr/performance-review',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({employee,achievements,improvements,reviewType})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!employee.trim()?0.5:1}}>{loading?'Writing review...':'⭐ Generate Review'}</button>
      {result?.review && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.review}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_jobdesc116() {
  const [role, setRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [requirements, setRequirements] = React.useState('');
  const [remote, setRemote] = React.useState('hybrid');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💼 Job Description Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create compelling, inclusive job descriptions that attract top candidates and reduce bias.</p>
      <input value={role} onChange={(e:any)=>setRole(e.target.value)} placeholder="Role title (e.g. Senior Full-Stack Engineer, Head of Growth, Customer Success Manager)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company description (e.g. Early-stage B2B SaaS, 25 people, Series A, building AI tools)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={requirements} onChange={(e:any)=>setRequirements(e.target.value)} placeholder="Key requirements and responsibilities (e.g. 5+ years React/Node, own frontend architecture, lead a team of 3, launch new products)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={remote} onChange={(e:any)=>setRemote(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="remote">Fully Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="onsite">On-site</option>
      </select>
      <button disabled={loading||!role.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/hr/job-description',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({role,company,requirements,remote})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!role.trim()?0.5:1}}>{loading?'Building JD...':'💼 Build Job Description'}</button>
      {result?.jd && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.jd}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_onboarding116() {
  const [role, setRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [tools, setTools] = React.useState('');
  const [duration, setDuration] = React.useState('30-60-90');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🚀 Onboarding Checklist Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create comprehensive onboarding plans that get new hires productive fast and feeling welcomed.</p>
      <input value={role} onChange={(e:any)=>setRole(e.target.value)} placeholder="New hire role (e.g. Senior Backend Engineer, Account Executive, Marketing Manager)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company context (e.g. 30-person startup, fully remote, B2B SaaS)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={tools} onChange={(e:any)=>setTools(e.target.value)} placeholder="Tools and systems (e.g. Slack, GitHub, Notion, Salesforce, Linear)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={duration} onChange={(e:any)=>setDuration(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="first-week">First Week Only</option>
        <option value="30-day">30-Day Plan</option>
        <option value="30-60-90">30-60-90 Day Plan</option>
        <option value="6-month">6-Month Plan</option>
      </select>
      <button disabled={loading||!role.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/hr/onboarding-checklist',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({role,company,tools,duration})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!role.trim()?0.5:1}}>{loading?'Building checklist...':'🚀 Generate Onboarding Plan'}</button>
      {result?.checklist && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.checklist}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_meetingai116() {
  const [meetingType, setMeetingType] = React.useState('');
  const [attendees, setAttendees] = React.useState('');
  const [duration, setDuration] = React.useState('60');
  const [goals, setGoals] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📝 Meeting Agenda AI</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create structured meeting agendas with time blocks, pre-reads, and action item templates.</p>
      <input value={meetingType} onChange={(e:any)=>setMeetingType(e.target.value)} placeholder="Meeting type (e.g. Quarterly business review, Product roadmap planning, 1:1, Investor update)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={attendees} onChange={(e:any)=>setAttendees(e.target.value)} placeholder="Attendees and roles (e.g. CEO, CPO, 3 engineers, 2 investors)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={goals} onChange={(e:any)=>setGoals(e.target.value)} placeholder="Meeting goals and topics to cover (e.g. Review Q2 metrics, decide on Q3 priorities, address investor concerns about burn rate)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={duration} onChange={(e:any)=>setDuration(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="30">30 minutes</option>
        <option value="45">45 minutes</option>
        <option value="60">60 minutes</option>
        <option value="90">90 minutes</option>
        <option value="120">2 hours</option>
        <option value="half-day">Half day (4 hours)</option>
      </select>
      <button disabled={loading||!meetingType.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ops/meeting-agenda',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({meetingType,attendees,duration,goals})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#d97706',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!meetingType.trim()?0.5:1}}>{loading?'Building agenda...':'📝 Generate Agenda'}</button>
      {result?.agenda && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.agenda}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

`;
if (!src.includes(COMPONENT_ANCHOR)) { console.error('COMPONENT ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(COMPONENT_ANCHOR, COMPONENTS + COMPONENT_ANCHOR);

fs.writeFileSync(TSX, src, 'utf8');
console.log('Wave 116 patched. Lines:', src.split('\n').length);
