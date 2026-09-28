'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_bizmodelai() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [idea, setIdea] = React.useState(''); const [customers, setCustomers] = React.useState(''); const [vp, setVp] = React.useState(''); const [resources, setResources] = React.useState(''); const [res, setRes] = React.useState<any>(null); const [loading, setLoading] = React.useState(false);
          return (<div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}><h2>🏗️ Business Model Designer</h2><p style={{color:'#aaa'}}>Build a complete business model canvas with unit economics and moat analysis.</p><textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Business idea or concept..." rows={3} style={{width:'100%',padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px',marginBottom:'0.75rem'}}/><input value={customers} onChange={e=>setCustomers(e.target.value)} placeholder="Target customers" style={{width:'100%',padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px',marginBottom:'0.75rem'}}/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}><input value={vp} onChange={e=>setVp(e.target.value)} placeholder="Value proposition" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/><input value={resources} onChange={e=>setResources(e.target.value)} placeholder="Key resources available" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/></div><button onClick={async()=>{if(!idea)return;setLoading(true);try{const r=await fetch(`${''}/api/bizmodel/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({idea,customers,value_prop:vp,resources})});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoading(false);}} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Designing...':'Design Business Model'}</button>{res&&(<div><div style={{background:'#1a1a1a',border:'1px solid #7c3aed',borderRadius:'8px',padding:'1.5rem',marginBottom:'1rem'}}><h3 style={{color:'#7c3aed'}}>Value Proposition</h3><p style={{color:'#e2e8f0'}}>{res.value_proposition}</p></div>{res.revenue_streams&&(<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',marginBottom:'1rem'}}><h4>Revenue Streams</h4>{res.revenue_streams.map((s:any,i:number)=>(<div key={i} style={{background:'#111',borderRadius:'6px',padding:'0.75rem',marginBottom:'0.5rem'}}><div style={{display:'flex',justifyContent:'space-between'}}><strong style={{color:'#7c3aed'}}>{s.type}</strong><span style={{color:'#22c55e'}}>{s.pricing_hint}</span></div><p style={{color:'#aaa',fontSize:'0.85rem',margin:'0.25rem 0 0'}}>{s.description}</p></div>))}</div>)}{res.unit_economics_estimate&&(<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',marginBottom:'1rem'}}><h4>Unit Economics</h4><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>{Object.entries(res.unit_economics_estimate).map(([k,v]:any,i:number)=>(<div key={i} style={{background:'#111',borderRadius:'6px',padding:'0.75rem',textAlign:'center'}}><div style={{color:'#aaa',fontSize:'0.75rem'}}>{k.replace(/_/g,' ').toUpperCase()}</div><div style={{color:'#fff',fontWeight:'bold',marginTop:'0.25rem'}}>{v}</div></div>))}</div></div>)}{res.moat&&(<div style={{background:'#7c3aed',borderRadius:'8px',padding:'1.25rem'}}><strong style={{color:'#fff'}}>Moat:</strong> <span style={{color:'#e9d5ff'}}>{res.moat}</span></div>)}</div>)}</div>);
}

export function ForgeTab_pricingmodel() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState(''); const [market, setMarket] = React.useState('B2B SaaS'); const [comps, setComps] = React.useState(''); const [costs, setCosts] = React.useState(''); const [goals, setGoals] = React.useState('growth'); const [res, setRes] = React.useState<any>(null); const [loading, setLoading] = React.useState(false);
          return (<div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}><h2>💰 Pricing Model Builder</h2><p style={{color:'#aaa'}}>Build a complete pricing strategy with tiers, psychology, and optimization levers.</p><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/service description" style={{width:'100%',padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px',marginBottom:'0.75rem'}}/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}><input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Market type" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/><input value={comps} onChange={e=>setComps(e.target.value)} placeholder="Competitor pricing (optional)" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}><input value={costs} onChange={e=>setCosts(e.target.value)} placeholder="Cost structure (optional)" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/><select value={goals} onChange={e=>setGoals(e.target.value)} style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}><option>growth</option><option>profitability</option><option>market share</option><option>enterprise deals</option></select></div><button onClick={async()=>{if(!product)return;setLoading(true);try{const r=await fetch(`${''}/api/pricing/model`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product,market,competitors:comps,costs,goals})});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoading(false);}} style={{background:'#059669',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building...':'Build Pricing Model'}</button>{res&&(<div><div style={{background:'#1a1a1a',border:'1px solid #059669',borderRadius:'8px',padding:'1.5rem',marginBottom:'1rem'}}><h3 style={{color:'#059669'}}>Recommended Model</h3><p style={{color:'#e2e8f0'}}>{res.recommended_model}</p></div>{res.price_points&&(<div style={{marginBottom:'1rem'}}><h4>Pricing Tiers</h4><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.75rem'}}>{res.price_points.map((tier:any,i:number)=>(<div key={i} style={{background:'#1a1a1a',border:'1px solid #059669',borderRadius:'8px',padding:'1rem',textAlign:'center'}}><div style={{color:'#059669',fontWeight:'bold'}}>{tier.tier}</div><div style={{color:'#fff',fontSize:'1.3rem',fontWeight:'bold',margin:'0.5rem 0'}}>{tier.price}</div><div style={{color:'#aaa',fontSize:'0.8rem'}}>{tier.target_user}</div></div>))}</div></div>)}{res.pricing_test&&(<div style={{background:'#059669',color:'#fff',borderRadius:'8px',padding:'1.25rem'}}><strong>First A/B Test:</strong> {res.pricing_test}</div>)}</div>)}</div>);
}

export function ForgeTab_partnerpropose() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [yours, setYours] = React.useState(''); const [theirs, setTheirs] = React.useState(''); const [type, setType] = React.useState('strategic alliance'); const [benefits, setBenefits] = React.useState(''); const [res, setRes] = React.useState<any>(null); const [loading, setLoading] = React.useState(false);
          return (<div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}><h2>🤝 Partnership Proposal Generator</h2><p style={{color:'#aaa'}}>Draft a compelling partnership proposal with structure and email opener.</p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}><input value={yours} onChange={e=>setYours(e.target.value)} placeholder="Your company/product" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/><input value={theirs} onChange={e=>setTheirs(e.target.value)} placeholder="Prospective partner" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}><select value={type} onChange={e=>setType(e.target.value)} style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}><option>strategic alliance</option><option>co-marketing</option><option>technology integration</option><option>revenue share</option><option>distribution deal</option></select><input value={benefits} onChange={e=>setBenefits(e.target.value)} placeholder="Mutual benefits (optional)" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/></div><button onClick={async()=>{if(!yours||!theirs)return;setLoading(true);try{const r=await fetch(`${''}/api/partnership/propose`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({your_company:yours,partner_company:theirs,partnership_type:type,mutual_benefits:benefits})});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoading(false);}} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Drafting...':'Generate Proposal'}</button>{res&&(<div><div style={{background:'#1a1a1a',border:'1px solid #2563eb',borderRadius:'8px',padding:'1.5rem',marginBottom:'1rem'}}><h3 style={{color:'#2563eb'}}>Executive Summary</h3><p style={{color:'#e2e8f0',fontSize:'1.05rem'}}>{res.executive_summary}</p></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}><div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.25rem'}}><h4>Their Problem</h4><p style={{color:'#ccc',fontSize:'0.9rem'}}>{res.their_problem}</p></div><div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.25rem'}}><h4>Your Value</h4><p style={{color:'#ccc',fontSize:'0.9rem'}}>{res.your_value}</p></div></div>{res.email_opener&&(<div style={{background:'#0d0d0d',border:'1px solid #2563eb',borderRadius:'8px',padding:'1.5rem'}}><h4 style={{color:'#2563eb'}}>📧 Opening Email</h4><p style={{color:'#e2e8f0',lineHeight:'1.7',whiteSpace:'pre-wrap'}}>{res.email_opener}</p></div>)}</div>)}</div>);
}

export function ForgeTab_exitplanner() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bizType, setBizType] = React.useState(''); const [revenue, setRevenue] = React.useState(''); const [timeline, setTimeline] = React.useState('3-5 years'); const [preferred, setPreferred] = React.useState('open to options'); const [res, setRes] = React.useState<any>(null); const [loading, setLoading] = React.useState(false);
          return (<div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}><h2>🚪 Exit Strategy Planner</h2><p style={{color:'#aaa'}}>Plan your business exit — acquisition, IPO, merger, or MBO with preparation roadmap.</p><input value={bizType} onChange={e=>setBizType(e.target.value)} placeholder="Business type (e.g. B2B SaaS, e-commerce, agency, marketplace)" style={{width:'100%',padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px',marginBottom:'0.75rem'}}/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}><input value={revenue} onChange={e=>setRevenue(e.target.value)} placeholder="Current ARR/revenue" style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}/><select value={timeline} onChange={e=>setTimeline(e.target.value)} style={{padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px'}}><option>1-2 years</option><option>3-5 years</option><option>5-7 years</option><option>10+ years</option></select></div><select value={preferred} onChange={e=>setPreferred(e.target.value)} style={{width:'100%',padding:'0.75rem',background:'#1a1a1a',border:'1px solid #333',color:'#fff',borderRadius:'8px',marginBottom:'0.75rem'}}><option>open to options</option><option>acquisition</option><option>IPO</option><option>management buyout</option><option>merger</option><option>acquihire</option></select><button onClick={async()=>{if(!bizType)return;setLoading(true);try{const r=await fetch(`${''}/api/exit/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({business_type:bizType,revenue,timeline,preferred_exit:preferred})});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoading(false);}} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Planning...':'Plan Exit Strategy'}</button>{res&&(<div><div style={{background:'#dc2626',color:'#fff',borderRadius:'8px',padding:'1.25rem',marginBottom:'1rem'}}><strong>Recommended Exit:</strong> {res.recommended_exit}</div>{res.exit_options&&(<div style={{marginBottom:'1rem'}}><h4>Exit Options</h4>{res.exit_options.map((opt:any,i:number)=>(<div key={i} style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.25rem',marginBottom:'0.5rem'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong style={{color:'#e2e8f0'}}>{opt.type}</strong><div><span style={{background:opt.feasibility==='high'?'#22c55e':opt.feasibility==='medium'?'#f59e0b':'#6b7280',color:'#fff',padding:'0.15rem 0.5rem',borderRadius:'4px',fontSize:'0.75rem',marginRight:'0.5rem'}}>{opt.feasibility}</span><span style={{color:'#aaa',fontSize:'0.85rem'}}>{opt.valuation_multiple}</span></div></div><p style={{color:'#888',fontSize:'0.85rem',margin:0}}>{opt.timeline}</p></div>))}</div>)}{res.red_flags_to_fix&&(<div style={{background:'#1a1a1a',border:'1px solid #ef4444',borderRadius:'8px',padding:'1.5rem'}}><h4 style={{color:'#ef4444'}}>🚩 Red Flags to Fix</h4>{res.red_flags_to_fix.map((flag:string,i:number)=>(<p key={i} style={{color:'#ccc',margin:'0.25rem 0',fontSize:'0.9rem'}}>• {flag}</p>))}</div>)}</div>)}</div>);
}

export function ForgeTab_labinterpreter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [results, setResults] = React.useState('');
          const [age, setAge] = React.useState('');
          const [sex, setSex] = React.useState('');
          const [symptoms, setSymptoms] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/lab/interpret`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ results, age, sex, symptoms }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🧪 Lab Results Interpreter</h2>
              <p style={{color:'var(--text-muted)'}}>Understand your bloodwork in plain English. Educational use only.</p>
              <textarea placeholder="Paste your lab results here..." value={results} onChange={e=>setResults(e.target.value)} style={{width:'100%',height:'120px',marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <input placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
                <select value={sex} onChange={e=>setSex(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  <option value="">Select sex</option>
                  <option>Male</option><option>Female</option>
                </select>
              </div>
              <input placeholder="Symptoms or concerns (optional)" value={symptoms} onChange={e=>setSymptoms(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!results.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Interpreting...':'Interpret Results'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'#fff3cd',padding:'1rem',borderRadius:'8px',marginBottom:'1rem',color:'#856404'}}>⚠️ {out.disclaimer}</div>
                  <div style={{background:'var(--bg-secondary)',padding:'1.5rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>Summary:</strong> {out.summary}</div>
                  {out.markers?.map((m:any,i:number) => (
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem',borderLeft:`4px solid ${m.status==='optimal'?'#28a745':m.status==='normal'?'#17a2b8':m.status==='borderline'?'#ffc107':'#dc3545'}`}}>
                      <strong>{m.name}</strong>: {m.value} (normal: {m.normal_range}) — <span style={{color:m.status==='optimal'||m.status==='normal'?'#28a745':'#dc3545'}}>{m.status}</span>
                      <p style={{margin:'0.25rem 0 0',color:'var(--text-muted)',fontSize:'0.9rem'}}>{m.plain_english}</p>
                    </div>
                  ))}
                  {out.questions_for_doctor?.length > 0 && (
                    <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginTop:'1rem'}}>
                      <strong>Questions for your doctor:</strong>
                      <ul style={{margin:'0.5rem 0 0',paddingLeft:'1.5rem'}}>{out.questions_for_doctor.map((q:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{q}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_supplementstack() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goals, setGoals] = React.useState('');
          const [concerns, setConcerns] = React.useState('');
          const [meds, setMeds] = React.useState('');
          const [budget, setBudget] = React.useState('$100/month');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/supplement/stack`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ goals, health_concerns: concerns, medications: meds, budget }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>💊 Supplement Stack Builder</h2>
              <p style={{color:'var(--text-muted)'}}>Evidence-based supplement protocol tailored to your goals.</p>
              <textarea placeholder="Health goals (e.g. energy, sleep, muscle, focus, longevity...)" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',height:'80px',marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}} />
              <input placeholder="Health concerns (optional)" value={concerns} onChange={e=>setConcerns(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Current medications (important for safety)" value={meds} onChange={e=>setMeds(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Monthly budget" value={budget} onChange={e=>setBudget(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!goals.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Building Stack...':'Build My Stack'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  {[{label:'🟢 Tier 1 — Essentials',data:out.tier1_essentials},{label:'🟡 Tier 2 — Beneficial',data:out.tier2_beneficial},{label:'⚪ Tier 3 — Optional',data:out.tier3_optional}].map(({label,data})=>data?.length>0&&(
                    <div key={label} style={{marginBottom:'1.5rem'}}>
                      <h4 style={{marginBottom:'0.5rem'}}>{label}</h4>
                      {data.map((s:any,i:number)=>(
                        <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem',display:'flex',justifyContent:'space-between',alignItems:'start'}}>
                          <div><strong>{s.supplement}</strong> — {s.dose}<br/><span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{s.why}</span></div>
                          <span style={{fontSize:'0.85rem',color:'var(--text-muted)',whiteSpace:'nowrap',marginLeft:'1rem'}}>{s.monthly_cost}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {out.morning_protocol && <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem'}}><strong>🌅 Morning:</strong> {out.morning_protocol}</div>}
                  {out.evening_protocol && <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px'}}><strong>🌙 Evening:</strong> {out.evening_protocol}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_recoveryplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [sport, setSport] = React.useState('');
          const [load, setLoad] = React.useState('moderate');
          const [injuries, setInjuries] = React.useState('');
          const [goals, setGoals] = React.useState('faster recovery');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/recovery/plan`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ sport_activity: sport, training_load: load, injury_history: injuries, recovery_goals: goals }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>⚡ Athletic Recovery Plan</h2>
              <input placeholder="Sport / activity (e.g. running, CrossFit, cycling...)" value={sport} onChange={e=>setSport(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <select value={load} onChange={e=>setLoad(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}}>
                <option value="low">Low training load</option>
                <option value="moderate">Moderate training load</option>
                <option value="high">High training load</option>
                <option value="elite">Elite/competition prep</option>
              </select>
              <input placeholder="Injury history (optional)" value={injuries} onChange={e=>setInjuries(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Recovery goals" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!sport.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Building Plan...':'Build Recovery Plan'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}>{out.recovery_assessment}</div>
                  {out.immediate_24h?.length>0&&<div style={{marginBottom:'1rem'}}><h4>⚡ Next 24 Hours</h4>{out.immediate_24h.map((i:any,idx:number)=><div key={idx} style={{background:'var(--bg-secondary)',padding:'0.75rem',borderRadius:'8px',marginBottom:'0.5rem'}}><strong>{i.intervention}</strong> ({i.timing}) — {i.benefit}</div>)}</div>}
                  {out.sleep_optimization&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}><h4 style={{margin:'0 0 0.5rem'}}>😴 Sleep Protocol</h4><p style={{margin:0}}>{out.sleep_optimization.pre_sleep}</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_longevityprotocol() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [age, setAge] = React.useState('');
          const [health, setHealth] = React.useState('');
          const [priorities, setPriorities] = React.useState('healthspan over lifespan');
          const [lifestyle, setLifestyle] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/longevity/protocol`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ age, current_health: health, priorities, lifestyle }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🔬 Longevity Protocol Builder</h2>
              <p style={{color:'var(--text-muted)'}}>Science-based protocol for extending healthspan.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <input placeholder="Your age" value={age} onChange={e=>setAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
                <input placeholder="Current health status" value={health} onChange={e=>setHealth(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
              </div>
              <input placeholder="Priorities (e.g. healthspan, cognitive longevity, metabolic health)" value={priorities} onChange={e=>setPriorities(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Current lifestyle" value={lifestyle} onChange={e=>setLifestyle(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!age.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Building Protocol...':'Build Longevity Protocol'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  {out.pillars?.map((p:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.75rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                        <strong>{p.pillar}</strong>
                        <span style={{background:'var(--accent)',color:'white',padding:'0.2rem 0.5rem',borderRadius:'4px',fontSize:'0.8rem'}}>Grade: {p.current_grade} → {p.target}</span>
                      </div>
                      <ul style={{margin:0,paddingLeft:'1.5rem'}}>{p.interventions?.map((item:string,j:number)=><li key={j} style={{fontSize:'0.9rem'}}>{item}</li>)}</ul>
                    </div>
                  ))}
                  {out.quick_wins?.length>0&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginTop:'1rem'}}><strong>⚡ Quick Wins:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.5rem'}}>{out.quick_wins.map((q:string,i:number)=><li key={i}>{q}</li>)}</ul></div>}
                  {out['5_year_protocol']&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginTop:'1rem'}}><strong>5-Year Strategy:</strong> {out['5_year_protocol']}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_mentalperf() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [workType, setWorkType] = React.useState('');
          const [challenges, setChallenges] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [schedule, setSchedule] = React.useState('9-5');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/mental/performance`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ work_type: workType, current_challenges: challenges, goals, schedule }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🧠 Mental Performance Protocol</h2>
              <input placeholder="Work type (e.g. software engineer, writer, executive...)" value={workType} onChange={e=>setWorkType(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Current challenges (e.g. brain fog, lack of focus, decision fatigue)" value={challenges} onChange={e=>setChallenges(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Performance goals" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Typical schedule" value={schedule} onChange={e=>setSchedule(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!workType.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Building Protocol...':'Optimize Mental Performance'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  {out.cognitive_baseline&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}>{out.cognitive_baseline}</div>}
                  {out.focus_protocol&&(
                    <div style={{background:'var(--bg-secondary)',padding:'1.5rem',borderRadius:'8px',marginBottom:'1rem'}}>
                      <h4 style={{margin:'0 0 1rem'}}>🎯 Focus Protocol</h4>
                      <div><strong>Pre-work ritual:</strong> {out.focus_protocol.pre_work_ritual}</div>
                      <div style={{marginTop:'0.5rem'}}><strong>Session length:</strong> {out.focus_protocol.session_length}</div>
                      <div style={{marginTop:'0.5rem'}}><strong>Environment:</strong> {out.focus_protocol.environment}</div>
                    </div>
                  )}
                  {out.nootropic_toolkit?.map((n:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem'}}>
                      <strong>{n.tool}</strong> — {n.dose_timing}<br/>
                      <span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{n.cognitive_benefit}</span>
                    </div>
                  ))}
                  {out.flow_state_triggers?.length>0&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginTop:'1rem'}}><strong>⚡ Flow State Triggers:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.5rem'}}>{out.flow_state_triggers.map((f:string,i:number)=><li key={i}>{f}</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_taxstrat62() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [incomeType, setIncomeType] = React.useState('W-2 employee');
          const [income, setIncome] = React.useState('');
          const [filing, setFiling] = React.useState('single');
          const [situation, setSituation] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/tax/strategy`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ income_type: incomeType, annual_income: income, filing_status: filing, situation }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🏦 Tax Strategy Builder</h2>
              <p style={{color:'var(--text-muted)'}}>Educational tax optimization. Consult a CPA for personalized advice.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <select value={incomeType} onChange={e=>setIncomeType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  <option>W-2 employee</option><option>Self-employed / freelancer</option><option>Business owner (S-corp)</option><option>Business owner (LLC)</option><option>Investor (capital gains)</option><option>Real estate investor</option><option>Mixed income</option>
                </select>
                <select value={filing} onChange={e=>setFiling(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  <option value="single">Single</option><option value="married_joint">Married Filing Jointly</option><option value="married_separate">Married Filing Separately</option><option value="head_household">Head of Household</option>
                </select>
              </div>
              <input placeholder="Annual income (approximate)" value={income} onChange={e=>setIncome(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <textarea placeholder="Situation (home office, dependents, investments, business expenses, retirement goals...)" value={situation} onChange={e=>setSituation(e.target.value)} style={{width:'100%',height:'80px',marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}} />
              <button onClick={run} disabled={loading||!income.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Building Strategy...':'Build Tax Strategy'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  {out.immediate_actions?.map((a:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem',display:'flex',justifyContent:'space-between',alignItems:'start'}}>
                      <div><strong>{a.action}</strong><br/><span style={{color:'var(--text-muted)',fontSize:'0.9rem'}}>{a.deadline}</span></div>
                      <div style={{textAlign:'right',marginLeft:'1rem'}}><div style={{color:'#28a745',fontWeight:700}}>{a.potential_savings}</div><div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{a.effort} effort</div></div>
                    </div>
                  ))}
                  {out.deductions_checklist?.length>0&&(
                    <div style={{marginTop:'1rem'}}><h4>✅ Deductions Checklist</h4>
                    {out.deductions_checklist.map((d:any,i:number)=><div key={i} style={{background:'var(--bg-secondary)',padding:'0.75rem',borderRadius:'8px',marginBottom:'0.5rem',display:'flex',justifyContent:'space-between'}}><div><strong>{d.deduction}</strong> — {d.qualifies}<br/><span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{d.what_you_need}</span></div><span style={{color:'#28a745',fontWeight:600,marginLeft:'1rem'}}>{d.estimated_value}</span></div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_estateplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [age, setAge] = React.useState('');
          const [assets, setAssets] = React.useState('');
          const [dependents, setDependents] = React.useState('');
          const [wishes, setWishes] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/estate/plan`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ age, assets, dependents, wishes }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🏠 Estate Planning Guide</h2>
              <input placeholder="Your age" value={age} onChange={e=>setAge(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Assets overview (home, retirement, savings, business...)" value={assets} onChange={e=>setAssets(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Dependents (spouse, children, ages)" value={dependents} onChange={e=>setDependents(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Wishes (who inherits, charities, special bequests)" value={wishes} onChange={e=>setWishes(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!age.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Planning...':'Build Estate Plan'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:out.urgency==='immediate'?'#f8d7da':out.urgency==='soon'?'#fff3cd':'#d4edda',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}>Urgency: <strong>{out.urgency}</strong></div>
                  {out.documents_needed?.map((d:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>{d.document}</strong><span style={{fontSize:'0.8rem',color:d.priority==='must-have'?'#dc3545':'var(--text-muted)'}}>{d.priority} • {d.estimated_cost}</span></div>
                      <p style={{margin:0,fontSize:'0.9rem',color:'var(--text-muted)'}}>{d.what_it_does}</p>
                      <p style={{margin:'0.25rem 0 0',fontSize:'0.85rem',color:'#dc3545'}}>Without it: {d.without_it}</p>
                    </div>
                  ))}
                  {out.first_3_steps&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginTop:'1rem'}}><strong>First 3 Steps:</strong><ol style={{margin:'0.5rem 0 0',paddingLeft:'1.5rem'}}>{out.first_3_steps.map((s:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{s}</li>)}</ol></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_investanalyze() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [portfolio, setPortfolio] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [timeline, setTimeline] = React.useState('long-term 20+ years');
          const [risk, setRisk] = React.useState('moderate');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/investment/analyze`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ portfolio, goals, timeline, risk_tolerance: risk }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>📈 Investment Portfolio Analyzer</h2>
              <p style={{color:'var(--text-muted)'}}>Educational portfolio analysis. Not financial advice.</p>
              <textarea placeholder="Describe your portfolio (e.g. 60% US stocks ETF, 20% bonds, 10% international, 10% real estate)" value={portfolio} onChange={e=>setPortfolio(e.target.value)} style={{width:'100%',height:'100px',marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}} />
              <input placeholder="Investment goals (retirement, house purchase, passive income...)" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <input placeholder="Investment timeline" value={timeline} onChange={e=>setTimeline(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
                <select value={risk} onChange={e=>setRisk(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  <option value="conservative">Conservative</option><option value="moderate">Moderate</option><option value="aggressive">Aggressive</option>
                </select>
              </div>
              <button onClick={run} disabled={loading||!portfolio.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Analyzing...':'Analyze Portfolio'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.5rem'}}>
                    {[['Grade',out.portfolio_grade],['Diversification',`${out.diversification_score}/10`],['Risk Level',out.risk_assessment?.volatility]].map(([label,val])=>(
                      <div key={label as string} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',textAlign:'center'}}><div style={{fontSize:'0.8rem',opacity:0.7}}>{label}</div><div style={{fontSize:'1.5rem',fontWeight:700}}>{val}</div></div>
                    ))}
                  </div>
                  {out.recommendations?.map((r:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between'}}><strong>{r.action}: {r.specific}</strong><span style={{fontSize:'0.8rem',background:r.priority==='high'?'#dc3545':'#6c757d',color:'white',padding:'0.2rem 0.5rem',borderRadius:'4px'}}>{r.priority}</span></div>
                      <p style={{margin:'0.25rem 0 0',fontSize:'0.9rem',color:'var(--text-muted)'}}>{r.reasoning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_insuranceaudit() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [coverage, setCoverage] = React.useState('');
          const [stage, setStage] = React.useState('working adult');
          const [assets, setAssets] = React.useState('');
          const [dependents, setDependents] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/insurance/audit`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ coverage, life_stage: stage, assets, dependents }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🛡️ Insurance Coverage Auditor</h2>
              <textarea placeholder="Current insurance coverage (health plan, life policy, auto, home/renters, disability...)" value={coverage} onChange={e=>setCoverage(e.target.value)} style={{width:'100%',height:'80px',marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <select value={stage} onChange={e=>setStage(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  <option>single young adult</option><option>working adult</option><option>married no kids</option><option>married with kids</option><option>pre-retirement</option><option>retired</option><option>business owner</option>
                </select>
                <input placeholder="Assets (home value, car, savings)" value={assets} onChange={e=>setAssets(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
              </div>
              <input placeholder="Dependents (spouse, children, aging parents)" value={dependents} onChange={e=>setDependents(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Auditing...':'Audit My Coverage'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem',textAlign:'center'}}><strong>Coverage Grade: </strong><span style={{fontSize:'1.5rem',fontWeight:700}}>{out.total_coverage_grade}</span></div>
                  {out.coverage_scorecard?.map((c:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem',borderLeft:`4px solid ${c.status==='have'?'#28a745':c.status==='missing'?'#dc3545':'#ffc107'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <strong>{c.type}</strong>
                        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
                          <span style={{fontSize:'0.8rem',background:c.priority==='critical'?'#dc3545':c.priority==='important'?'#ffc107':'#6c757d',color:'white',padding:'0.2rem 0.5rem',borderRadius:'4px'}}>{c.priority}</span>
                          <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{c.annual_cost_estimate}/yr</span>
                        </div>
                      </div>
                      <p style={{margin:'0.25rem 0 0',fontSize:'0.9rem',color:'var(--text-muted)'}}>{c.recommendation}</p>
                    </div>
                  ))}
                  {out.biggest_gaps?.map((g:any,i:number)=><div key={i} style={{background:'#f8d7da',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem',marginTop:'0.5rem'}}><strong>⚠️ {g.gap}</strong><p style={{margin:'0.25rem 0',fontSize:'0.9rem'}}>{g.worst_case_scenario}</p><p style={{margin:0,color:'#28a745',fontWeight:600}}>Fix: {g.fix}</p></div>)}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_deepworkplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [workType, setWorkType] = React.useState('');
          const [schedule, setSchedule] = React.useState('');
          const [blockers, setBlockers] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/deepwork/plan`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ work_type: workType, current_schedule: schedule, biggest_blockers: blockers, output_goals: goals }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🎯 Deep Work Planner</h2>
              <p style={{color:'var(--text-muted)'}}>Design a personalized deep work system based on your situation.</p>
              <input placeholder="Work type (software engineer, writer, researcher, PM...)" value={workType} onChange={e=>setWorkType(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Current schedule (9-5 open office, remote, async-first...)" value={schedule} onChange={e=>setSchedule(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Biggest blockers (Slack, meetings, interruptions, phone...)" value={blockers} onChange={e=>setBlockers(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Output goals (ship faster, write more, think deeply)" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!workType.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Designing System...':'Design My Deep Work System'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>Diagnosis:</strong> {out.diagnosis}</div>
                  {out.ideal_schedule?.map((b:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem',borderLeft:`4px solid ${b.type==='deep'?'var(--accent)':b.type==='recovery'?'#28a745':'#6c757d'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between'}}><strong>{b.block}</strong><span style={{fontSize:'0.8rem',background:'var(--accent)',color:'white',padding:'0.2rem 0.5rem',borderRadius:'4px'}}>{b.type}</span></div>
                      <p style={{margin:'0.25rem 0 0',fontSize:'0.9rem'}}>{b.activity}</p>
                    </div>
                  ))}
                  {out.protection_scripts?.length>0&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginTop:'1rem'}}><strong>Protection Scripts:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.5rem'}}>{out.protection_scripts.map((s:string,i:number)=><li key={i} style={{marginBottom:'0.5rem',fontStyle:'italic'}}>"{s}"</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_meetingopt() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [load, setLoad] = React.useState('');
          const [types, setTypes] = React.useState('');
          const [goals, setGoals] = React.useState('fewer, better meetings');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/meeting/optimize`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ meeting_load: load, meeting_types: types, goals }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>📅 Meeting Optimizer</h2>
              <input placeholder="Current meeting load (e.g. 6 hours/day, back-to-back)" value={load} onChange={e=>setLoad(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Types of meetings (standups, 1:1s, all-hands, planning...)" value={types} onChange={e=>setTypes(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Goals" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!load.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Optimizing...':'Optimize My Meetings'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}>{out.meeting_audit}</div>
                  {out.meetings_to_eliminate?.length>0&&<div style={{marginBottom:'1rem'}}><h4 style={{color:'#dc3545'}}>🗑️ Meetings to Kill</h4>{out.meetings_to_eliminate.map((m:any,i:number)=><div key={i} style={{background:'#f8d7da',padding:'0.75rem',borderRadius:'8px',marginBottom:'0.5rem'}}><strong>{m.meeting_type}</strong>: {m.why}<br/><span style={{color:'#28a745'}}>→ Replace with: {m.replacement}</span></div>)}</div>}
                  {out.async_alternatives?.length>0&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>Async Alternatives:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.5rem'}}>{out.async_alternatives.map((a:string,i:number)=><li key={i}>{a}</li>)}</ul></div>}
                  {out.meeting_templates?.map((t:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem'}}>
                      <strong>{t.purpose}</strong> — {t.duration}<br/>
                      <span style={{fontSize:'0.9rem',color:'var(--text-muted)'}}>Agenda: {t.agenda}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_careermap() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
          const [exp, setExp] = React.useState('');
          const [skills, setSkills] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [timeline, setTimeline] = React.useState('5 years');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/career/trajectory`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ current_role: role, experience: exp, skills, goals, timeline }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>🗺️ Career Trajectory Mapper</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <input placeholder="Current role" value={role} onChange={e=>setRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
                <input placeholder="Years of experience" value={exp} onChange={e=>setExp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
              </div>
              <input placeholder="Key skills" value={skills} onChange={e=>setSkills(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Career goals (senior engineer, VP, founder, pivot to...)" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Timeline" value={timeline} onChange={e=>setTimeline(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!role.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Mapping Career...':'Map My Career'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}>{out.current_assessment}</div>
                  {out.trajectory_paths?.map((p:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1.5rem',borderRadius:'8px',marginBottom:'1rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.75rem'}}><h4 style={{margin:0}}>{p.path}</h4><span style={{fontSize:'0.85rem',background:p.probability==='high'?'#28a745':p.probability==='medium'?'#ffc107':'#6c757d',color:'white',padding:'0.3rem 0.75rem',borderRadius:'4px'}}>{p.probability} probability</span></div>
                      {p.milestones?.map((m:any,j:number)=><div key={j} style={{borderLeft:'2px solid var(--accent)',paddingLeft:'1rem',marginBottom:'0.5rem'}}><strong>{m.timeframe}:</strong> {m.milestone}<br/><span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{m.how}</span></div>)}
                    </div>
                  ))}
                  {out.quick_wins_next_90_days?.length>0&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px'}}><strong>⚡ Next 90 Days:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.5rem'}}>{out.quick_wins_next_90_days.map((w:string,i:number)=><li key={i}>{w}</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_promotioncase() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [current, setCurrent] = React.useState('');
          const [target, setTarget] = React.useState('');
          const [accomplishments, setAccomplishments] = React.useState('');
          const [context, setContext] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/promotion/case`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ current_role: current, target_role: target, accomplishments, company_context: context }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>⬆️ Promotion Case Builder</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                <input placeholder="Current role" value={current} onChange={e=>setCurrent(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
                <input placeholder="Target role" value={target} onChange={e=>setTarget(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}} />
              </div>
              <textarea placeholder="Key accomplishments (be specific with metrics: shipped X, grew Y by Z%, led team of N)" value={accomplishments} onChange={e=>setAccomplishments(e.target.value)} style={{width:'100%',height:'120px',marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}} />
              <input placeholder="Company context (startup, big tech, team size, recent priorities)" value={context} onChange={e=>setContext(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!current.trim()||!accomplishments.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Building Case...':'Build Promotion Case'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'var(--bg-secondary)',padding:'1.5rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>Executive Summary:</strong><p style={{margin:'0.5rem 0 0'}}>{out.executive_summary}</p></div>
                  {out.impact_stories?.map((s:any,i:number)=>(
                    <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'0.5rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>Impact Story {i+1}</strong><span style={{fontSize:'0.8rem',background:'var(--accent)',color:'white',padding:'0.2rem 0.5rem',borderRadius:'4px'}}>{s.competency}</span></div>
                      <p style={{margin:'0.25rem 0',fontSize:'0.9rem'}}><strong>Situation:</strong> {s.situation}</p>
                      <p style={{margin:'0.25rem 0',fontSize:'0.9rem'}}><strong>Result:</strong> {s.result}</p>
                    </div>
                  ))}
                  {out.manager_ask&&<div style={{background:'#d4edda',padding:'1rem',borderRadius:'8px',marginTop:'1rem'}}><strong>What to say to your manager:</strong><p style={{margin:'0.5rem 0 0',fontStyle:'italic'}}>"{out.manager_ask}"</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_linkedinrewrite() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [profile, setProfile] = React.useState('');
          const [targetRole, setTargetRole] = React.useState('');
          const [audience, setAudience] = React.useState('recruiters and hiring managers');
          const [achievements, setAchievements] = React.useState('');
          const [out, setOut] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const run = async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/linkedin/rewrite`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ current_profile: profile, target_role: targetRole, ideal_audience: audience, achievements }) });
              setOut(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'800px'}}>
              <h2>💼 LinkedIn Profile Rewriter</h2>
              <textarea placeholder="Current LinkedIn headline + about section (paste what you have)" value={profile} onChange={e=>setProfile(e.target.value)} style={{width:'100%',height:'120px',marginBottom:'1rem',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}} />
              <input placeholder="Target role you want" value={targetRole} onChange={e=>setTargetRole(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <input placeholder="Key achievements (optional but makes it much better)" value={achievements} onChange={e=>setAchievements(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',marginBottom:'1rem'}} />
              <button onClick={run} disabled={loading||!profile.trim()} style={{padding:'0.75rem 2rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600}}>
                {loading?'Rewriting...':'Rewrite My Profile'}
              </button>
              {out && (
                <div style={{marginTop:'2rem'}}>
                  <div style={{background:'var(--bg-secondary)',padding:'1.5rem',borderRadius:'8px',marginBottom:'1rem'}}>
                    <strong>✨ New Headline:</strong>
                    <p style={{fontSize:'1.1rem',fontWeight:600,margin:'0.5rem 0'}}>{out.headline}</p>
                    {out.headline_alternatives?.map((h:string,i:number)=><p key={i} style={{fontSize:'0.95rem',color:'var(--text-muted)',margin:'0.25rem 0'}}>Alt {i+1}: {h}</p>)}
                  </div>
                  {out.about_section&&<div style={{background:'var(--bg-secondary)',padding:'1.5rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>About Section:</strong><p style={{margin:'0.5rem 0 0',whiteSpace:'pre-line'}}>{out.about_section}</p></div>}
                  {out.skills_to_add?.length>0&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>Skills to Add:</strong><div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.5rem'}}>{out.skills_to_add.map((s:string,i:number)=><span key={i} style={{background:'var(--accent)',color:'white',padding:'0.25rem 0.75rem',borderRadius:'20px',fontSize:'0.85rem'}}>{s}</span>)}</div></div>}
                  {out.connection_request_template&&<div style={{background:'var(--bg-secondary)',padding:'1rem',borderRadius:'8px'}}><strong>Connection Request Template:</strong><p style={{margin:'0.5rem 0 0',fontStyle:'italic'}}>"{out.connection_request_template}"</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_difficultconvo() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dc, setDc] = React.useState({situation:'',relationship:'',desired_outcome:'',your_concerns:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🗣️ Difficult Conversation Planner</h2>
            {(['situation','relationship','desired_outcome','your_concerns'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={dc[k]} onChange={e=>setDc(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/conversation/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(dc)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Planning...':'Plan Conversation'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Opening</h3><p style={{fontStyle:'italic',color:'#a0a0d0'}}>"{res.opening}"</p><h3>Structure</h3>{(res.structure||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:12,padding:12,background:'#12122a',borderRadius:6}}><strong>{s.phase}</strong><p>{s.purpose}</p><p style={{color:'#6c63ff'}}>"{s.example_language}"</p></div>)}<h3>Closing</h3><p>{res.closing}</p><h3>If It Goes Badly</h3><p style={{color:'#ff6b6b'}}>{res.if_it_goes_badly}</p><h3>Phrases to Avoid</h3>{(res.phrases_to_avoid||[]).map((p:string,i:number)=><span key={i} style={{display:'inline-block',margin:4,padding:'4px 10px',background:'#3a1a1a',borderRadius:12,color:'#ff9999'}}>❌ {p}</span>)}</div>}
          </div>);
}

export function ForgeTab_feedbackcraft() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fb, setFb] = React.useState({situation:'',person_role:'',behavior_observed:'',impact:'',desired_change:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>💬 Feedback Giver</h2>
            {(['situation','person_role','behavior_observed','impact','desired_change'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={fb[k]} onChange={e=>setFb(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/feedback/craft`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(fb)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Crafting...':'Craft Feedback'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Ready-to-Say Feedback</h3><p style={{fontStyle:'italic',color:'#a0e0a0',padding:12,background:'#0a2a0a',borderRadius:6}}>"{res.written_version}"</p><h3>SBI Framework</h3><p><strong>Situation:</strong> {res.sbi_feedback?.situation}</p><p><strong>Behavior:</strong> {res.sbi_feedback?.behavior}</p><p><strong>Impact:</strong> {res.sbi_feedback?.impact}</p><h3>Follow-up Question</h3><p style={{color:'#6c63ff'}}>"{res.follow_up_question}"</p><h3>If They Get Defensive</h3><p>{res.if_they_get_defensive}</p></div>}
          </div>);
}

export function ForgeTab_persuasionscript() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ps, setPs] = React.useState({goal:'',audience:'',current_resistance:'',context:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🎭 Persuasion Coach</h2>
            {(['goal','audience','current_resistance','context'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={ps[k]} onChange={e=>setPs(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/persuasion/script`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ps)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Building...':'Build Script'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Core Message</h3><p style={{fontWeight:'bold',color:'#ffe066'}}>{res.core_message}</p><h3>Full Script</h3><pre style={{whiteSpace:'pre-wrap',background:'#12122a',padding:12,borderRadius:6,color:'#c0c0f0'}}>{res.script}</pre><h3>Objection Handling</h3>{(res.objection_pre_emption||[]).map((o:any,i:number)=><div key={i} style={{marginBottom:8,padding:10,background:'#12122a',borderRadius:6}}><p style={{color:'#ff9999'}}>❓ {o.objection}</p><p style={{color:'#99ff99'}}>✅ {o.response}</p></div>)}<h3>Call to Action</h3><p style={{color:'#6c63ff',fontWeight:'bold'}}>{res.call_to_action}</p></div>}
          </div>);
}

export function ForgeTab_relaudit() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ra, setRa] = React.useState({relationship_type:'',description:'',concerns:'',goals:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🔍 Relationship Auditor</h2>
            {(['relationship_type','description','concerns','goals'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={ra[k]} onChange={e=>setRa(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/relationship/audit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ra)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Auditing...':'Audit Relationship'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Health Score: {res.health_score}</h3><h3>Energy Audit</h3><p>{res.energy_audit}</p><h3>Patterns to Address</h3>{(res.patterns_to_address||[]).map((p:any,i:number)=><div key={i} style={{marginBottom:8,padding:10,background:'#12122a',borderRadius:6}}><strong>{p.pattern}</strong><p>{p.impact}</p><p style={{color:'#6c63ff'}}>→ {p.shift}</p></div>)}<h3>Conversation to Have</h3><p style={{color:'#ffe066',fontStyle:'italic'}}>"{res.conversation_to_have}"</p><h3>6-Month Vision</h3><p>{res.six_month_vision||res['6_month_vision']}</p></div>}
          </div>);
}

export function ForgeTab_personalceo() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pc, setPc] = React.useState({time_period:'last quarter',wins:'',losses:'',goals:'',life_areas:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>👑 Personal CEO Review</h2>
            {(['time_period','wins','losses','goals','life_areas'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={pc[k]} onChange={e=>setPc(p=>({...p,[k]:e.target.value}))} rows={k==='wins'||k==='losses'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/personal/ceo`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(pc)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Reviewing...':'Run CEO Review'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Executive Summary</h3><p>{res.executive_summary}</p><h3>Metrics Dashboard</h3>{(res.metrics_dashboard||[]).map((m:any,i:number)=><div key={i} style={{marginBottom:8,padding:10,background:'#12122a',borderRadius:6,display:'flex',gap:16,alignItems:'center'}}><span style={{fontSize:20}}>{m.trend==='up'?'📈':m.trend==='down'?'📉':'➡️'}</span><div><strong>{m.life_area}</strong> — {m.score}/10<p style={{margin:0,fontSize:12,color:'#888'}}>{m.highlight}</p></div></div>)}<h3>One Decision to Make</h3><p style={{color:'#ffe066',fontWeight:'bold',padding:12,background:'#1a1a0a',borderRadius:6}}>{res.one_decision_to_make}</p><h3>Personal Board Advice</h3><p style={{fontStyle:'italic',color:'#a0d0ff'}}>"{res.personal_board_advice}"</p><h3>Next Quarter Priorities</h3>{(res.next_quarter_priorities||[]).map((p:string,i:number)=><p key={i}>#{i+1}: {p}</p>)}</div>}
          </div>);
}

export function ForgeTab_paperdecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pd, setPd] = React.useState({title:'',abstract:'',field:'',questions:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🔬 Paper Decoder</h2>
            {(['title','abstract','field','questions'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k}</label><textarea value={pd[k]} onChange={e=>setPd(p=>({...p,[k]:e.target.value}))} rows={k==='abstract'?5:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/paper/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(pd)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Decoding...':'Decode Paper'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>ELI5</h3><p style={{padding:12,background:'#0a2a1a',borderRadius:6,color:'#a0f0a0'}}>{res.eli5}</p><h3>Key Finding</h3><p style={{fontWeight:'bold',color:'#ffe066'}}>{res.key_finding}</p><h3>Why It Matters</h3><p>{res.why_it_matters}</p><h3>Confidence Level</h3><p style={{color:'#6c63ff'}}>{res.confidence_level}</p><h3>Limitations</h3>{(res.limitations||[]).map((l:string,i:number)=><p key={i}>⚠️ {l}</p>)}<h3>Glossary</h3>{(res.glossary||[]).map((g:any,i:number)=><p key={i}><strong>{g.term}</strong>: {g.meaning}</p>)}</div>}
          </div>);
}

export function ForgeTab_hypothesisbuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [hb, setHb] = React.useState({observation:'',field:'',prior_knowledge:'',constraints:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>💡 Hypothesis Builder</h2>
            {(['observation','field','prior_knowledge','constraints'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={hb[k]} onChange={e=>setHb(p=>({...p,[k]:e.target.value}))} rows={k==='observation'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/hypothesis/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(hb)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Building...':'Build Hypothesis'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Primary Hypothesis</h3><p style={{padding:12,background:'#12122a',borderRadius:6,color:'#ffe066',fontStyle:'italic'}}>"{res.primary_hypothesis?.statement}"</p><p style={{color:'#888'}}>Null: {res.primary_hypothesis?.null_hypothesis}</p><h3>Variables</h3><p>📌 Independent: {res.variables?.independent}</p><p>📊 Dependent: {res.variables?.dependent}</p><p>🔒 Control: {res.variables?.control}</p><h3>Falsification</h3><p style={{color:'#ff9999'}}>{res.falsification}</p><h3>Alternative Hypotheses</h3>{(res.alternative_hypotheses||[]).map((a:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><p>{a.statement}</p><p style={{color:'#888',fontSize:12}}>{a.why_plausible}</p></div>)}</div>}
          </div>);
}

export function ForgeTab_experimentdesign() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ed, setEd] = React.useState({hypothesis:'',resources:'',timeline:'',constraints:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>⚗️ Experiment Designer</h2>
            {(['hypothesis','resources','timeline','constraints'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k}</label><textarea value={ed[k]} onChange={e=>setEd(p=>({...p,[k]:e.target.value}))} rows={k==='hypothesis'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/experiment/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ed)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Designing...':'Design Experiment'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Design Type: {res.design_type}</h3><h3>Sample</h3><p>N = {res.sample?.size}</p><p>{res.sample?.selection}</p><h3>Procedure</h3>{(res.procedure||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>Step {i+1}: {s.step}</strong><p>{s.action}</p><p style={{color:'#888',fontSize:12}}>⏱ {s.duration}</p></div>)}<h3>Statistical Plan</h3><p>{res.statistical_plan}</p><h3>Timeline</h3><p>{res.expected_timeline}</p></div>}
          </div>);
}

export function ForgeTab_litmap() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lm, setLm] = React.useState({topic:'',field:'',depth:'',angle:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🗺️ Literature Mapper</h2>
            {(['topic','field','depth','angle'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k}</label><textarea value={lm[k]} onChange={e=>setLm(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/literature/map`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(lm)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Mapping...':'Map Literature'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Field Overview</h3><p>{res.field_overview}</p><h3>Key Findings</h3>{(res.key_findings||[]).map((f:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><p>{f.finding}</p><p style={{color:'#888',fontSize:12}}>{f.evidence} · {f.year_range}</p></div>)}<h3>Major Debates</h3>{(res.major_debates||[]).map((d:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>{d.debate}</strong><p>A: {d.side_a}</p><p>B: {d.side_b}</p><p style={{color:'#6c63ff'}}>→ {d.current_lean}</p></div>)}<h3>Research Gaps</h3>{(res.research_gaps||[]).map((g:string,i:number)=><p key={i}>🔭 {g}</p>)}</div>}
          </div>);
}

export function ForgeTab_grantwrite() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [gw, setGw] = React.useState({project_title:'',research_question:'',significance:'',methodology:'',team:'',budget_range:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>📋 Grant Writer</h2>
            {(['project_title','research_question','significance','methodology','team','budget_range'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={gw[k]} onChange={e=>setGw(p=>({...p,[k]:e.target.value}))} rows={k==='significance'||k==='methodology'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/grant/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(gw)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Writing...':'Write Grant'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Hook Sentence</h3><p style={{fontWeight:'bold',color:'#ffe066',fontStyle:'italic'}}>"{res.hook_sentence}"</p><h3>Specific Aims</h3><p style={{whiteSpace:'pre-wrap'}}>{res.specific_aims}</p><h3>Significance</h3><p>{res.significance}</p><h3>Innovation</h3><p>{res.innovation}</p><h3>Weaknesses to Pre-empt</h3>{(res.weaknesses_to_preempt||[]).map((w:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><p style={{color:'#ff9999'}}>⚠️ {w.weakness}</p><p style={{color:'#99ff99'}}>✅ {w.response}</p></div>)}<h3>Budget Justification</h3><p>{res.budget_justification}</p></div>}
          </div>);
}

export function ForgeTab_rightsexplain() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [re, setRe] = React.useState({situation:'',jurisdiction:'',question:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>⚖️ Rights Explainer</h2><p style={{color:'#888',fontSize:13}}>General education only — not legal advice.</p>
            {(['situation','jurisdiction','question'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k}</label><textarea value={re[k]} onChange={e=>setRe(p=>({...p,[k]:e.target.value}))} rows={k==='situation'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/rights/explain`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(re)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Researching...':'Explain My Rights'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><div style={{padding:10,background:'#2a1a0a',borderRadius:6,marginBottom:12,color:'#ffa07a',fontSize:13}}>{res.disclaimer}</div><h3>Short Answer</h3><p style={{color:'#a0f0a0'}}>{res.short_answer}</p><h3>Your Rights</h3>{(res.relevant_rights||[]).map((r:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#12122a',borderRadius:6}}><strong>{r.right}</strong><p>{r.explanation}</p><p style={{color:'#888',fontSize:12}}>When: {r.when_it_applies}</p></div>)}<h3>What You Can Do</h3>{(res.what_you_can_do||[]).map((s:string,i:number)=><p key={i}>✅ {s}</p>)}<h3>When to Get a Lawyer</h3><p style={{color:'#ff9999'}}>{res.when_to_get_a_lawyer}</p></div>}
          </div>);
}

export function ForgeTab_contractdraft() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cd, setCd] = React.useState({contract_type:'',party_a:'',party_b:'',key_terms:'',jurisdiction:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>📝 Contract Drafter</h2><p style={{color:'#888',fontSize:13}}>Template only — have a lawyer review before signing.</p>
            {(['contract_type','party_a','party_b','key_terms','jurisdiction'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={cd[k]} onChange={e=>setCd(p=>({...p,[k]:e.target.value}))} rows={k==='key_terms'?4:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/contract/draft`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(cd)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Drafting...':'Draft Contract'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Contract</h3><pre style={{whiteSpace:'pre-wrap',background:'#12122a',padding:16,borderRadius:6,color:'#e0e0e0',fontSize:13}}>{res.contract_text}</pre><h3>Red Flags</h3>{(res.red_flags||[]).map((f:string,i:number)=><p key={i} style={{color:'#ff9999'}}>🚩 {f}</p>)}<h3>Execution Checklist</h3>{(res.execution_checklist||[]).map((s:string,i:number)=><p key={i}>☐ {s}</p>)}</div>}
          </div>);
}
