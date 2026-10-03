'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_scenewrite() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [swType, setSwType] = React.useState('');
          const [swSetting, setSwSetting] = React.useState('');
          const [swChars, setSwChars] = React.useState('');
          const [swGoal, setSwGoal] = React.useState('');
          const [swPov, setSwPov] = React.useState('');
          const [swRes, setSwRes] = React.useState<any>(null);
          const [swLoading, setSwLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎬 Scene Writer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={swType} onChange={e=>setSwType(e.target.value)} placeholder="Scene type (e.g. confrontation, reunion, discovery)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={swPov} onChange={e=>setSwPov(e.target.value)} placeholder="POV character or perspective" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={swSetting} onChange={e=>setSwSetting(e.target.value)} placeholder="Setting (time, place, atmosphere)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={swChars} onChange={e=>setSwChars(e.target.value)} placeholder="Characters present (brief descriptions)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={swGoal} onChange={e=>setSwGoal(e.target.value)} placeholder="Scene goal (what must change by the end)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!swType.trim()&&!swGoal.trim())return;setSwLoading(true);setSwRes(null);try{const r=await fetch(`${''}/api/scene/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({scene_type:swType,setting:swSetting,characters_present:swChars,scene_goal:swGoal,pov_character:swPov})});const d=await r.json();setSwRes(d);}catch(e){console.error(e);}finally{setSwLoading(false);}}} disabled={swLoading||(!swType.trim()&&!swGoal.trim())} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {swLoading?'Writing...':'Write This Scene 🎬'}
                </button>
              </div>
              {swRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {swRes.scene_draft&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{display:'block',marginBottom:'0.75rem'}}>📝 Scene Draft:</strong><div style={{whiteSpace:'pre-wrap',lineHeight:'1.7'}}>{swRes.scene_draft}</div></div>}
                {swRes.emotional_arc&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🌊 Emotional Arc:</strong><div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.5rem',flexWrap:'wrap'}}><span style={{padding:'0.25rem 0.75rem',borderRadius:'4px',background:'var(--bg-primary)'}}>{swRes.emotional_arc.opens}</span><span>→</span><span style={{padding:'0.25rem 0.75rem',borderRadius:'4px',background:'var(--accent)',color:'white',fontSize:'0.85rem'}}>{swRes.emotional_arc.shifts}</span><span>→</span><span style={{padding:'0.25rem 0.75rem',borderRadius:'4px',background:'var(--bg-primary)'}}>{swRes.emotional_arc.closes}</span></div></div>}
                {swRes.what_changed&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🔄 What Changed: </strong>{swRes.what_changed}</div>}
                {Array.isArray(swRes.craft_choices)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🛠️ Craft Choices:</strong>{swRes.craft_choices.map((c:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>{c.choice}: </strong>{c.why}</div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_biohackopt() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bhGoal, setBhGoal] = React.useState('');
          const [bhRoutine, setBhRoutine] = React.useState('');
          const [bhMarkers, setBhMarkers] = React.useState('');
          const [bhIssue, setBhIssue] = React.useState('');
          const [bhRes, setBhRes] = React.useState<any>(null);
          const [bhLoading, setBhLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🧬 Biohack Optimizer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={bhGoal} onChange={e=>setBhGoal(e.target.value)} placeholder="Primary goal (e.g. more energy, longevity, cognitive performance, fat loss)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <textarea value={bhRoutine} onChange={e=>setBhRoutine(e.target.value)} placeholder="Current routine (sleep, diet, exercise, supplements, anything relevant)" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={bhMarkers} onChange={e=>setBhMarkers(e.target.value)} placeholder="Known bio markers (e.g. HRV 45, sleep score 72, VO2max 38, blood glucose normal)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={bhIssue} onChange={e=>setBhIssue(e.target.value)} placeholder="Biggest issue (e.g. afternoon energy crash, poor sleep, brain fog)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!bhGoal.trim())return;setBhLoading(true);setBhRes(null);try{const r=await fetch(`${''}/api/biohack/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goal:bhGoal,current_routine:bhRoutine,bio_markers:bhMarkers,biggest_issue:bhIssue})});const d=await r.json();setBhRes(d);}catch(e){console.error(e);}finally{setBhLoading(false);}}} disabled={bhLoading||!bhGoal.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {bhLoading?'Optimizing...':'Build My Protocol 🧬'}
                </button>
              </div>
              {bhRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {bhRes.optimization_philosophy&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic'}}>{bhRes.optimization_philosophy}</div>}
                {Array.isArray(bhRes.quick_wins)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚡ Quick Wins:</strong>{bhRes.quick_wins.map((w:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{w.intervention}</strong><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.8rem'}}>{w.timeline}</span></div><div style={{fontSize:'0.85rem',opacity:0.7}}>{w.mechanism}</div><div style={{fontSize:'0.75rem',marginTop:'0.25rem',opacity:0.5}}>Evidence: {w.evidence_level}</div></div>)}</div>}
                {Array.isArray(bhRes.morning_protocol)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🌅 Morning Protocol:</strong>{bhRes.morning_protocol.map((p:any,i:number)=><div key={i} style={{display:'flex',gap:'1rem',marginTop:'0.5rem'}}><strong style={{minWidth:'60px',opacity:0.6}}>{p.time}</strong><div><div>{p.action}</div><div style={{opacity:0.6,fontSize:'0.8rem'}}>{p.why}</div></div></div>)}</div>}
                {Array.isArray(bhRes.evening_protocol)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🌙 Evening Protocol:</strong>{bhRes.evening_protocol.map((p:any,i:number)=><div key={i} style={{display:'flex',gap:'1rem',marginTop:'0.5rem'}}><strong style={{minWidth:'60px',opacity:0.6}}>{p.time}</strong><div><div>{p.action}</div><div style={{opacity:0.6,fontSize:'0.8rem'}}>{p.why}</div></div></div>)}</div>}
                {Array.isArray(bhRes.metrics_to_track)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📊 Metrics to Track:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{bhRes.metrics_to_track.map((m:any,i:number)=><div key={i} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{fontWeight:600}}>{m.metric}</div><div style={{fontSize:'0.8rem',opacity:0.7}}>{m.tool} · {m.frequency}</div><div style={{fontSize:'0.8rem',color:'var(--accent)'}}>Target: {m.target}</div></div>)}</div></div>}
                {bhRes.expected_results&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🎯 Expected Results: </strong>{bhRes.expected_results}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_vo2train() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [vtFit, setVtFit] = React.useState('');
          const [vtVo2, setVtVo2] = React.useState('');
          const [vtGoal, setVtGoal] = React.useState('');
          const [vtHours, setVtHours] = React.useState('');
          const [vtActivity, setVtActivity] = React.useState('');
          const [vtRes, setVtRes] = React.useState<any>(null);
          const [vtLoading, setVtLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🫁 VO2Max Trainer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={vtFit} onChange={e=>setVtFit(e.target.value)} placeholder="Current fitness (beginner/moderate/athletic)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={vtVo2} onChange={e=>setVtVo2(e.target.value)} placeholder="VO2max if known (e.g. 42 mL/kg/min)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={vtGoal} onChange={e=>setVtGoal(e.target.value)} placeholder="Goal (e.g. run 5K, longevity, athletic performance)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={vtHours} onChange={e=>setVtHours(e.target.value)} placeholder="Hours/week for training" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={vtActivity} onChange={e=>setVtActivity(e.target.value)} placeholder="Preferred activity (running, cycling, rowing...)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <button onClick={async()=>{if(!vtFit.trim())return;setVtLoading(true);setVtRes(null);try{const r=await fetch(`${''}/api/vo2max/train`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_fitness:vtFit,vo2max_estimate:vtVo2,goal:vtGoal,weekly_hours:vtHours,preferred_activity:vtActivity})});const d=await r.json();setVtRes(d);}catch(e){console.error(e);}finally{setVtLoading(false);}}} disabled={vtLoading||!vtFit.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {vtLoading?'Designing...':'Build My VO2Max Program 🫁'}
                </button>
              </div>
              {vtRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {vtRes.current_assessment&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}>{vtRes.current_assessment}<div style={{marginTop:'0.5rem',opacity:0.7}}>Target: <strong>{vtRes.target_vo2max}</strong></div></div>}
                {Array.isArray(vtRes.training_zones)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🎯 Training Zones:</strong>{vtRes.training_zones.map((z:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><strong>{z.zone}</strong><div style={{opacity:0.7,fontSize:'0.85rem'}}>{z.feel}</div></div><div style={{textAlign:'right'}}><div style={{fontWeight:600}}>{z.heart_rate}</div><div style={{opacity:0.6,fontSize:'0.8rem'}}>{z.purpose}</div></div></div>)}</div>}
                {Array.isArray(vtRes.weekly_plan)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📅 Weekly Plan:</strong>{vtRes.weekly_plan.map((s:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>{s.session}</strong><span style={{opacity:0.6,fontSize:'0.85rem'}}>{s.duration} · Zone {s.zone}</span></div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{s.details}</div></div>)}</div>}
                {vtRes.progression&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📈 Progression:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(vtRes.progression).map(([k,v])=><div key={k} style={{padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.75rem'}}>{k.replace('_',' ').toUpperCase()}</div><div style={{fontSize:'0.9rem',marginTop:'0.25rem'}}>{v as string}</div></div>)}</div></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_coldtherapy() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ctExp, setCtExp] = React.useState('');
          const [ctGoals, setCtGoals] = React.useState('');
          const [ctAccess, setCtAccess] = React.useState('');
          const [ctSched, setCtSched] = React.useState('');
          const [ctRes, setCtRes] = React.useState<any>(null);
          const [ctLoading, setCtLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🧊 Cold Therapy Coach</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={ctExp} onChange={e=>setCtExp(e.target.value)} placeholder="Experience level (never tried, occasional cold showers, regular practitioner)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ctGoals} onChange={e=>setCtGoals(e.target.value)} placeholder="Goals (e.g. inflammation, mood, athletic recovery, mental resilience)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={ctAccess} onChange={e=>setCtAccess(e.target.value)} placeholder="Access (cold shower, ice bath, plunge pool, lake)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={ctSched} onChange={e=>setCtSched(e.target.value)} placeholder="Frequency preference (daily, 3x/week...)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <button onClick={async()=>{if(!ctExp.trim())return;setCtLoading(true);setCtRes(null);try{const r=await fetch(`${''}/api/cold/therapy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({experience_level:ctExp,goals:ctGoals,access:ctAccess,schedule:ctSched})});const d=await r.json();setCtRes(d);}catch(e){console.error(e);}finally{setCtLoading(false);}}} disabled={ctLoading||!ctExp.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ctLoading?'Designing...':'Build My Cold Protocol 🧊'}
                </button>
              </div>
              {ctRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {ctRes.protocol_overview&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}>{ctRes.protocol_overview}</div>}
                {Array.isArray(ctRes.week_by_week)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📅 Progressive Protocol:</strong>{ctRes.week_by_week.map((w:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><strong>{w.week}</strong><div style={{opacity:0.7,fontSize:'0.85rem'}}>{w.technique}</div></div><div style={{textAlign:'right'}}><div style={{fontWeight:600}}>{w.duration_seconds}s</div><div style={{opacity:0.6,fontSize:'0.8rem'}}>{w.temp}</div></div></div>)}</div>}
                {ctRes.breathing_protocol&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💨 Breathing Protocol:</strong><div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(ctRes.breathing_protocol).map(([k,v])=><div key={k}><strong style={{textTransform:'capitalize',opacity:0.7}}>{k}: </strong>{v as string}</div>)}</div></div>}
                {Array.isArray(ctRes.contraindications)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid #ef4444'}}><strong style={{color:'#ef4444'}}>⚠️ Contraindications:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{ctRes.contraindications.map((c:string,i:number)=><li key={i}>{c}</li>)}</ul></div>}
                {ctRes.science_summary&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🔬 The Science: </strong>{ctRes.science_summary}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_suppstack() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ssGoals, setSsGoals] = React.useState('');
          const [ssCurrent, setSsCurrent] = React.useState('');
          const [ssBudget, setSsBudget] = React.useState('');
          const [ssHealth, setSsHealth] = React.useState('');
          const [ssRes, setSsRes] = React.useState<any>(null);
          const [ssLoading, setSsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💊 Supplement Stack Builder</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={ssGoals} onChange={e=>setSsGoals(e.target.value)} placeholder="Goals (e.g. cognitive performance, muscle growth, longevity, sleep, energy)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ssCurrent} onChange={e=>setSsCurrent(e.target.value)} placeholder="Current supplements (or 'none')" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={ssBudget} onChange={e=>setSsBudget(e.target.value)} placeholder="Monthly budget (e.g. $50, $150, flexible)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={ssHealth} onChange={e=>setSsHealth(e.target.value)} placeholder="Health conditions or medications (important for safety)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <div style={{padding:'0.75rem',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',fontSize:'0.85rem',opacity:0.9}}>⚠️ For informational purposes only. Always consult a healthcare provider before starting supplements.</div>
                <button onClick={async()=>{if(!ssGoals.trim())return;setSsLoading(true);setSsRes(null);try{const r=await fetch(`${''}/api/supplement/stack`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goals:ssGoals,current_supplements:ssCurrent,budget:ssBudget,health_conditions:ssHealth})});const d=await r.json();setSsRes(d);}catch(e){console.error(e);}finally{setSsLoading(false);}}} disabled={ssLoading||!ssGoals.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ssLoading?'Building stack...':'Build My Supplement Stack 💊'}
                </button>
              </div>
              {ssRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {ssRes.stack_philosophy&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic'}}>{ssRes.stack_philosophy}</div>}
                {Array.isArray(ssRes.foundational)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🏗️ Foundational Stack:</strong>{ssRes.foundational.map((s:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{s.supplement}</strong><span style={{opacity:0.6,fontSize:'0.85rem'}}>{s.cost_monthly}</span></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',fontSize:'0.8rem',opacity:0.7}}><span>Dose: {s.dose}</span><span>When: {s.timing}</span><span>Evidence: {s.evidence}</span></div><div style={{fontSize:'0.85rem',marginTop:'0.5rem'}}>{s.purpose}</div></div>)}</div>}
                {Array.isArray(ssRes.cut_from_current)&&ssRes.cut_from_current.length>0&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong style={{color:'#ef4444'}}>✂️ Cut These:</strong>{ssRes.cut_from_current.map((c:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>{c.supplement}: </strong>{c.reason} <span style={{color:'#22c55e'}}>Save {c.save}</span></div>)}</div>}
                {ssRes.total_cost_estimate&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between'}}><strong>💰 Total Monthly Cost</strong><span style={{fontWeight:700,color:'var(--accent)'}}>{ssRes.total_cost_estimate}</span></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_sleeparch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [saHours, setSaHours] = React.useState('');
          const [saIssues, setSaIssues] = React.useState('');
          const [saWake, setSaWake] = React.useState('');
          const [saGoal, setSaGoal] = React.useState('');
          const [saEnv, setSaEnv] = React.useState('');
          const [saRes, setSaRes] = React.useState<any>(null);
          const [saLoading, setSaLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>😴 Sleep Architect</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={saHours} onChange={e=>setSaHours(e.target.value)} placeholder="Current sleep hours (e.g. 6, 7-8)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={saWake} onChange={e=>setSaWake(e.target.value)} placeholder="Desired wake time (e.g. 6:00 AM)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={saIssues} onChange={e=>setSaIssues(e.target.value)} placeholder="Sleep issues (e.g. trouble falling asleep, waking at 3am, not rested, snoring)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={saGoal} onChange={e=>setSaGoal(e.target.value)} placeholder="Sleep goal (e.g. improve energy, better deep sleep, stop needing alarm)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={saEnv} onChange={e=>setSaEnv(e.target.value)} placeholder="Sleep environment (e.g. city noise, partner snores, hot room, bright street)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!saHours.trim())return;setSaLoading(true);setSaRes(null);try{const r=await fetch(`${''}/api/sleep/architect`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_sleep_hours:saHours,sleep_issues:saIssues,wake_time:saWake,sleep_goal:saGoal,environment:saEnv})});const d=await r.json();setSaRes(d);}catch(e){console.error(e);}finally{setSaLoading(false);}}} disabled={saLoading||!saHours.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {saLoading?'Designing...':'Architect My Sleep 😴'}
                </button>
              </div>
              {saRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {saRes.sleep_diagnosis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}>{saRes.sleep_diagnosis}</div>}
                {saRes.target_schedule&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',textAlign:'center'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem'}}>{Object.entries(saRes.target_schedule).map(([k,v])=><div key={k}><div style={{opacity:0.6,fontSize:'0.75rem',textTransform:'uppercase'}}>{k.replace(/_/g,' ')}</div><div style={{fontWeight:700,fontSize:'1.1rem',marginTop:'0.25rem'}}>{v as string}</div></div>)}</div></div>}
                {Array.isArray(saRes.wind_down_protocol)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🌙 Wind-Down Protocol:</strong>{saRes.wind_down_protocol.map((p:any,i:number)=><div key={i} style={{display:'flex',gap:'1rem',marginTop:'0.5rem'}}><strong style={{minWidth:'80px',opacity:0.6}}>{p.time_before_bed}</strong><div><div>{p.action}</div><div style={{opacity:0.6,fontSize:'0.8rem'}}>{p.why}</div></div></div>)}</div>}
                {Array.isArray(saRes.environment_optimization)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏠 Environment:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{saRes.environment_optimization.map((e:any,i:number)=><div key={i} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{fontWeight:600}}>{e.factor}</div><div style={{fontSize:'0.8rem',color:'var(--accent)'}}>{e.target}</div><div style={{fontSize:'0.75rem',opacity:0.6}}>{e.tool}</div></div>)}</div></div>}
                {saRes.expected_improvement&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid #22c55e'}}><strong style={{color:'#22c55e'}}>✨ Expected: </strong>{saRes.expected_improvement}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_pricingstrategy() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [psProduct, setPsProduct] = React.useState('');
          const [psMarket, setPsMarket] = React.useState('');
          const [psComp, setPsComp] = React.useState('');
          const [psCosts, setPsCosts] = React.useState('');
          const [psPrice, setPsPrice] = React.useState('');
          const [psRes, setPsRes] = React.useState<any>(null);
          const [psLoading, setPsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💰 Pricing Strategist</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={psProduct} onChange={e=>setPsProduct(e.target.value)} placeholder="Describe your product/service (what it does, who buys it, key value prop)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={psMarket} onChange={e=>setPsMarket(e.target.value)} placeholder="Target market (e.g. SMB SaaS, enterprise, consumer)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={psPrice} onChange={e=>setPsPrice(e.target.value)} placeholder="Current price (if any)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={psComp} onChange={e=>setPsComp(e.target.value)} placeholder="Competitors and their pricing" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={psCosts} onChange={e=>setPsCosts(e.target.value)} placeholder="Unit costs (COGS, hosting, support per customer)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!psProduct.trim())return;setPsLoading(true);setPsRes(null);try{const r=await fetch(`${''}/api/pricing/strategy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:psProduct,market:psMarket,competitors:psComp,unit_costs:psCosts,current_price:psPrice})});const d=await r.json();setPsRes(d);}catch(e){console.error(e);}finally{setPsLoading(false);}}} disabled={psLoading||!psProduct.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {psLoading?'Analyzing...':'Design My Pricing Strategy 💰'}
                </button>
              </div>
              {psRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {psRes.pricing_diagnosis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}>{psRes.pricing_diagnosis}</div>}
                {psRes.recommended_model&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{fontSize:'1.1rem'}}>✨ Recommended: {psRes.recommended_model.model}</strong><p style={{marginTop:'0.5rem',opacity:0.8}}>{psRes.recommended_model.rationale}</p></div>}
                {Array.isArray(psRes.price_anchors)&&<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}><strong>🎯 Price Tiers:</strong>{psRes.price_anchors.map((t:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{t.tier}</strong><span style={{fontWeight:700,color:'var(--accent)',fontSize:'1.1rem'}}>{t.price}</span></div><div style={{opacity:0.7,fontSize:'0.85rem',marginBottom:'0.5rem'}}>{t.target_customer}</div>{Array.isArray(t.features)&&<ul style={{margin:0,paddingLeft:'1.25rem',fontSize:'0.85rem'}}>{t.features.map((f:string,j:number)=><li key={j}>{f}</li>)}</ul>}</div>)}</div>}
                {Array.isArray(psRes.psychological_tactics)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🧠 Psychological Tactics:</strong>{psRes.psychological_tactics.map((t:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>{t.tactic}</strong><span style={{color:'#22c55e',fontSize:'0.85rem'}}>{t.expected_lift}</span></div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{t.implementation}</div></div>)}</div>}
                {psRes.experiment_to_run&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid #22c55e'}}><strong>🧪 Run This Experiment: </strong>{psRes.experiment_to_run}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_churnanalyze() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [caProduct, setCaProduct] = React.useState('');
          const [caChurn, setCaChurn] = React.useState('');
          const [caSegs, setCaSegs] = React.useState('');
          const [caReasons, setCaReasons] = React.useState('');
          const [caComp, setCaComp] = React.useState('');
          const [caRes, setCaRes] = React.useState<any>(null);
          const [caLoading, setCaLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📉 Churn Analyzer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={caProduct} onChange={e=>setCaProduct(e.target.value)} placeholder="Your product/service" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={caChurn} onChange={e=>setCaChurn(e.target.value)} placeholder="Monthly churn rate (e.g. 5%, 10%)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={caComp} onChange={e=>setCaComp(e.target.value)} placeholder="Competitor they leave for" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={caSegs} onChange={e=>setCaSegs(e.target.value)} placeholder="User segments (e.g. free tier, power users, enterprise, new signups)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={caReasons} onChange={e=>setCaReasons(e.target.value)} placeholder="Known exit reasons (e.g. price, missing feature, found alternative, not using it)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!caProduct.trim())return;setCaLoading(true);setCaRes(null);try{const r=await fetch(`${''}/api/churn/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:caProduct,churn_rate:caChurn,user_segments:caSegs,exit_reasons:caReasons,biggest_competitor:caComp})});const d=await r.json();setCaRes(d);}catch(e){console.error(e);}finally{setCaLoading(false);}}} disabled={caLoading||!caProduct.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {caLoading?'Analyzing...':'Analyze My Churn 📉'}
                </button>
              </div>
              {caRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {caRes.churn_diagnosis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid #ef4444'}}>{caRes.churn_diagnosis}</div>}
                {Array.isArray(caRes.churn_risk_segments)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚠️ Risk Segments:</strong>{caRes.churn_risk_segments.map((s:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{s.segment}</strong><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:s.risk_level==='high'?'rgba(239,68,68,0.2)':s.risk_level==='medium'?'rgba(234,179,8,0.2)':'rgba(34,197,94,0.2)',fontSize:'0.8rem'}}>{s.risk_level?.toUpperCase()}</span></div>{Array.isArray(s.signals)&&<div style={{fontSize:'0.85rem',opacity:0.7}}>Signals: {s.signals.join(', ')}</div>}</div>)}</div>}
                {Array.isArray(caRes.retention_playbook)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🛡️ Retention Playbook:</strong>{caRes.retention_playbook.map((p:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>{p.stage}</strong><span style={{color:'#22c55e',fontSize:'0.85rem'}}>{p.expected_impact}</span></div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{p.intervention} <em>(trigger: {p.trigger})</em></div></div>)}</div>}
                {caRes.if_you_fix_one_thing&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🎯 If You Fix One Thing: </strong>{caRes.if_you_fix_one_thing}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_growthhack() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ghProduct, setGhProduct] = React.useState('');
          const [ghStage, setGhStage] = React.useState('');
          const [ghRate, setGhRate] = React.useState('');
          const [ghBudget, setGhBudget] = React.useState('');
          const [ghChannels, setGhChannels] = React.useState('');
          const [ghRes, setGhRes] = React.useState<any>(null);
          const [ghLoading, setGhLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🚀 Growth Hacker</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={ghProduct} onChange={e=>setGhProduct(e.target.value)} placeholder="Your product (what it does, who it\'s for, current state)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={ghStage} onChange={e=>setGhStage(e.target.value)} placeholder="Stage (idea, pre-launch, early, growth, scale)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={ghRate} onChange={e=>setGhRate(e.target.value)} placeholder="Current growth rate (users/MRR)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={ghBudget} onChange={e=>setGhBudget(e.target.value)} placeholder="Monthly growth budget" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={ghChannels} onChange={e=>setGhChannels(e.target.value)} placeholder="Channels you\'ve tried" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <button onClick={async()=>{if(!ghProduct.trim())return;setGhLoading(true);setGhRes(null);try{const r=await fetch(`${''}/api/growth/hack`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:ghProduct,stage:ghStage,current_growth_rate:ghRate,budget:ghBudget,channel_history:ghChannels})});const d=await r.json();setGhRes(d);}catch(e){console.error(e);}finally{setGhLoading(false);}}} disabled={ghLoading||!ghProduct.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ghLoading?'Hacking...':'Build My Growth Engine 🚀'}
                </button>
              </div>
              {ghRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {ghRes.growth_diagnosis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}>{ghRes.growth_diagnosis}</div>}
                {Array.isArray(ghRes.highest_leverage_moves)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚡ Highest Leverage Moves:</strong>{ghRes.highest_leverage_moves.map((m:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{m.move}</strong><span style={{color:'#22c55e',fontWeight:600}}>{m.potential}</span></div><div style={{fontSize:'0.85rem',opacity:0.7,marginBottom:'0.25rem'}}>{m.mechanism}</div><div style={{display:'flex',gap:'1rem',fontSize:'0.8rem',opacity:0.6}}><span>Cost: {m.cost}</span><span>Timeline: {m.timeline}</span></div></div>)}</div>}
                {Array.isArray(ghRes.viral_loops)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🔄 Viral Loops to Build:</strong>{ghRes.viral_loops.map((l:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600,marginBottom:'0.25rem'}}>{l.loop}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{l.how_to_build}</div><div style={{color:'var(--accent)',fontSize:'0.8rem',marginTop:'0.25rem'}}>Target K-factor: {l.k_factor_target}</div></div>)}</div>}
                {ghRes.unfair_advantage_to_exploit&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🏆 Unfair Advantage: </strong>{ghRes.unfair_advantage_to_exploit}</div>}
                {Array.isArray(ghRes.kill_immediately)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid #ef4444'}}><strong style={{color:'#ef4444'}}>🗑️ Kill Immediately:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{ghRes.kill_immediately.map((k:string,i:number)=><li key={i}>{k}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_investpitch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ipStartup, setIpStartup] = React.useState('');
          const [ipStage, setIpStage] = React.useState('');
          const [ipAsk, setIpAsk] = React.useState('');
          const [ipTraction, setIpTraction] = React.useState('');
          const [ipInvestors, setIpInvestors] = React.useState('');
          const [ipRes, setIpRes] = React.useState<any>(null);
          const [ipLoading, setIpLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💼 Investor Pitcher</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={ipStartup} onChange={e=>setIpStartup(e.target.value)} placeholder="Your startup (what you do, the problem, your solution)" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={ipStage} onChange={e=>setIpStage(e.target.value)} placeholder="Stage (pre-seed, seed, Series A...)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={ipAsk} onChange={e=>setIpAsk(e.target.value)} placeholder="Funding ask (e.g. $500K, $2M)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={ipTraction} onChange={e=>setIpTraction(e.target.value)} placeholder="Traction (users, revenue, growth rate, key metrics)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ipInvestors} onChange={e=>setIpInvestors(e.target.value)} placeholder="Target investors (e.g. B2B SaaS VCs, angels, strategic)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!ipStartup.trim())return;setIpLoading(true);setIpRes(null);try{const r=await fetch(`${''}/api/investor/pitch`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({startup:ipStartup,stage:ipStage,funding_ask:ipAsk,traction:ipTraction,target_investors:ipInvestors})});const d=await r.json();setIpRes(d);}catch(e){console.error(e);}finally{setIpLoading(false);}}} disabled={ipLoading||!ipStartup.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ipLoading?'Crafting pitch...':'Build My Investor Pitch 💼'}
                </button>
              </div>
              {ipRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {ipRes.one_line_pitch&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontSize:'1.1rem',fontWeight:600,fontStyle:'italic'}}>"{ipRes.one_line_pitch}"</div>}
                {['problem_framing','solution_narrative','why_now','why_us'].map(k=>ipRes[k]&&<div key={k} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong style={{textTransform:'capitalize'}}>{k.replace(/_/g,' ')}: </strong>{ipRes[k]}</div>)}
                {ipRes.market_sizing&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📊 Market Sizing:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{['tam','sam','som'].map(k=><div key={k} style={{padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.75rem'}}>{k.toUpperCase()}</div><div style={{fontWeight:700,marginTop:'0.25rem'}}>{ipRes.market_sizing[k]}</div></div>)}</div></div>}
                {Array.isArray(ipRes.investor_objections)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🎯 Handle These Objections:</strong>{ipRes.investor_objections.map((o:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600,opacity:0.8,fontSize:'0.9rem'}}>"{o.objection}"</div><div style={{marginTop:'0.5rem',fontSize:'0.9rem'}}>{o.answer}</div></div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_moatbuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mbBiz, setMbBiz] = React.useState('');
          const [mbInd, setMbInd] = React.useState('');
          const [mbAdv, setMbAdv] = React.useState('');
          const [mbComp, setMbComp] = React.useState('');
          const [mbRes, setMbRes] = React.useState<any>(null);
          const [mbLoading, setMbLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🏰 Competitive Moat Builder</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={mbBiz} onChange={e=>setMbBiz(e.target.value)} placeholder="Your business (what you do, how you make money, who your customers are)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={mbInd} onChange={e=>setMbInd(e.target.value)} placeholder="Industry (e.g. SaaS, e-commerce, services)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={mbComp} onChange={e=>setMbComp(e.target.value)} placeholder="Main competitors" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={mbAdv} onChange={e=>setMbAdv(e.target.value)} placeholder="Current advantages (what do you do better?)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!mbBiz.trim())return;setMbLoading(true);setMbRes(null);try{const r=await fetch(`${''}/api/moat/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({business:mbBiz,industry:mbInd,current_advantages:mbAdv,competitors:mbComp})});const d=await r.json();setMbRes(d);}catch(e){console.error(e);}finally{setMbLoading(false);}}} disabled={mbLoading||!mbBiz.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {mbLoading?'Analyzing...':'Build My Moat 🏰'}
                </button>
              </div>
              {mbRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {mbRes.moat_assessment&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>Current Moat: {mbRes.moat_assessment.current_moat}</strong><span style={{padding:'0.25rem 0.75rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.9rem'}}>{mbRes.moat_assessment.strength}</span></div><div style={{opacity:0.7,fontSize:'0.9rem'}}>Durability: {mbRes.moat_assessment.durability_years}</div></div>}
                {mbRes.defensibility_score&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📈 Defensibility Score:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(mbRes.defensibility_score).map(([k,v])=><div key={k} style={{padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.75rem'}}>{k.toUpperCase()}</div><div style={{fontWeight:700,fontSize:'1.1rem',marginTop:'0.25rem',color:'var(--accent)'}}>{v as string}</div></div>)}</div></div>}
                {mbRes.top_moat_to_build&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🎯 Build This Moat: {mbRes.top_moat_to_build.moat}</strong><p style={{marginTop:'0.5rem',opacity:0.8}}>{mbRes.top_moat_to_build.why}</p>{Array.isArray(mbRes.top_moat_to_build.blueprint)&&<ol style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{mbRes.top_moat_to_build.blueprint.map((s:string,i:number)=><li key={i}>{s}</li>)}</ol>}</div>}
                {mbRes.one_year_moat_sprint&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🏃 1-Year Sprint: </strong>{mbRes.one_year_moat_sprint}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_contractdraft2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [contractType, setContractType] = React.useState('');
          const [partyA, setPartyA] = React.useState('');
          const [partyB, setPartyB] = React.useState('');
          const [keyTerms, setKeyTerms] = React.useState('');
          const [jurisdiction, setJurisdiction] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>📄 Contract Drafter</h2>
              <select value={contractType} onChange={e=>setContractType(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value=''>Select Contract Type</option>
                <option value='Freelance Services Agreement'>Freelance Services Agreement</option>
                <option value='NDA (Non-Disclosure Agreement)'>NDA</option>
                <option value='Employment Contract'>Employment Contract</option>
                <option value='Partnership Agreement'>Partnership Agreement</option>
                <option value='SaaS Subscription Agreement'>SaaS Subscription Agreement</option>
                <option value='Consulting Agreement'>Consulting Agreement</option>
                <option value='License Agreement'>License Agreement</option>
              </select>
              <input placeholder="Party A (your name/company)" value={partyA} onChange={e=>setPartyA(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Party B (other party)" value={partyB} onChange={e=>setPartyB(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Key terms (payment, scope, duration...)" value={keyTerms} onChange={e=>setKeyTerms(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Jurisdiction (e.g. California, US)" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!contractType||!partyA||!partyB)return;setLoading(true);try{const r=await fetch(`${''}/api/contract/draft`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({contract_type:contractType,party_a:partyA,party_b:partyB,key_terms:keyTerms,jurisdiction})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Drafting...':'Draft Contract'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <h3 style={{color:'#a78bfa',marginBottom:'1rem'}}>{result.contract_title}</h3>
                <div style={{marginBottom:'1rem'}}><strong>Parties:</strong> {result.parties?.party_a} ↔ {result.parties?.party_b}</div>
                <div style={{marginBottom:'1rem'}}><strong>Recitals:</strong> <p style={{color:'#aaa',fontSize:'0.9rem'}}>{result.recitals}</p></div>
                <div style={{marginBottom:'1rem'}}><strong>Key Clauses:</strong>
                  {result.key_clauses?.map((c:any,i:number)=><div key={i} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #6366f1'}}><strong>{c.clause_name}</strong><p style={{color:'#aaa',fontSize:'0.9rem',margin:'0.25rem 0'}}>{c.content}</p><em style={{color:'#666',fontSize:'0.8rem'}}>{c.why_important}</em></div>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  {[['Payment Terms',result.payment_terms],['Term & Termination',result.term_and_termination],['IP Ownership',result.ip_ownership],['Confidentiality',result.confidentiality],['Liability Limit',result.liability_limitation],['Dispute Resolution',result.dispute_resolution]].map(([k,v])=><div key={k} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{fontSize:'0.8rem',color:'#888'}}>{k}</strong><p style={{color:'#fff',fontSize:'0.9rem',margin:'0.25rem 0'}}>{v}</p></div>)}
                </div>
                {result.red_flags_to_watch?.length>0&&<div style={{background:'#2d1515',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#f87171'}}>⚠️ Watch Out For:</strong>{result.red_flags_to_watch.map((f:string,i:number)=><li key={i} style={{color:'#fca5a5',fontSize:'0.9rem'}}>{f}</li>)}</div>}
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Next Steps:</strong>{result.next_steps?.map((s:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{s}</li>)}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_termsdecode2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tosText, setTosText] = React.useState('');
          const [serviceName, setServiceName] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>📜 Terms of Service Decoder</h2>
              <input placeholder="Service/App name" value={serviceName} onChange={e=>setServiceName(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <textarea placeholder="Paste Terms of Service text here..." value={tosText} onChange={e=>setTosText(e.target.value)} rows={8} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <button onClick={async()=>{if(!tosText)return;setLoading(true);try{const r=await fetch(`${''}/api/terms/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({tos_text:tosText,service_name:serviceName})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#f59e0b,#ef4444)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Decoding...':'Decode Terms'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#1a1a2a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',border:'1px solid #6366f1'}}><strong style={{color:'#a78bfa'}}>TL;DR:</strong><p style={{color:'#e0e0e0',margin:'0.5rem 0'}}>{result.tldr}</p><div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginTop:'0.5rem'}}><span style={{fontSize:'0.8rem',color:'#888'}}>Trust Score:</span><strong style={{color:result.trust_score?.includes('Low')?'#f87171':result.trust_score?.includes('High')?'#4ade80':'#fbbf24'}}>{result.trust_score}</strong><span style={{fontSize:'0.8rem',color:'#888',marginLeft:'0.5rem'}}>Verdict: {result.overall_verdict}</span></div></div>
                {result.danger_zones?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>⚠️ Danger Zones:</strong>{result.danger_zones.map((d:any,i:number)=><div key={i} style={{background:'#2d1515',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:`3px solid ${d.severity==='High'?'#ef4444':'#f59e0b'}`}}><strong style={{color:'#fca5a5'}}>{d.what}</strong><p style={{color:'#fca5a5',fontSize:'0.9rem',margin:'0.25rem 0'}}>{d.why_it_matters}</p></div>)}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                  {[['Data They Collect',result.data_they_collect],['Data They Share',result.data_they_share]].map(([k,v]:any)=>Array.isArray(v)&&v.length>0&&<div key={k} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{fontSize:'0.85rem',color:'#888'}}>{k}</strong>{v.map((item:string,i:number)=><li key={i} style={{color:'#fca5a5',fontSize:'0.85rem'}}>{item}</li>)}</div>)}
                </div>
                {result.surprising_clauses?.length>0&&<div style={{background:'#2a1a2a',borderRadius:'8px',padding:'0.75rem',marginTop:'0.75rem'}}><strong style={{color:'#c084fc'}}>😮 Surprising Clauses:</strong>{result.surprising_clauses.map((c:string,i:number)=><li key={i} style={{color:'#d8b4fe',fontSize:'0.9rem'}}>{c}</li>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_compliancecheck2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bizType, setBizType] = React.useState('');
          const [jurisdiction, setJurisdiction] = React.useState('');
          const [activity, setActivity] = React.useState('');
          const [employees, setEmployees] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>✅ Compliance Checker</h2>
              <input placeholder="Business type (e.g. SaaS, Restaurant, Freelancer)" value={bizType} onChange={e=>setBizType(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Jurisdiction (e.g. California, EU, UK)" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Main activity/product (e.g. collecting user data, selling food)" value={activity} onChange={e=>setActivity(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Number of employees (optional)" value={employees} onChange={e=>setEmployees(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!bizType||!activity)return;setLoading(true);try{const r=await fetch(`${''}/api/compliance/check`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({business_type:bizType,jurisdiction,activity,employees})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Checking...':'Check Compliance'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <p style={{color:'#e0e0e0',marginBottom:'1rem'}}>{result.compliance_overview}</p>
                {result.required_licenses?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>📋 Required Licenses:</strong>{result.required_licenses.map((l:any,i:number)=><div key={i} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><strong>{l.license}</strong><p style={{color:'#888',fontSize:'0.85rem',margin:'0.2rem 0'}}>{l.authority}</p></div><span style={{background:l.urgency==='High'?'#991b1b':'#1e3a1e',borderRadius:'4px',padding:'0.2rem 0.5rem',fontSize:'0.75rem',color:l.urgency==='High'?'#fca5a5':'#86efac'}}>{l.urgency}</span></div>)}
                </div>}
                {result.potential_violations?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>🚨 Potential Violations:</strong>{result.potential_violations.map((v:any,i:number)=><div key={i} style={{background:'#2d1515',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><strong style={{color:'#fca5a5'}}>{v.issue}</strong><p style={{color:'#fca5a5',fontSize:'0.85rem'}}>Penalty: {v.penalty}</p><p style={{color:'#86efac',fontSize:'0.85rem'}}>Fix: {v.how_to_fix}</p></div>)}</div>}
                {result.immediate_actions?.length>0&&<div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>⚡ Immediate Actions:</strong>{result.immediate_actions.map((a:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{a}</li>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_disputeletter2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [disputeType, setDisputeType] = React.useState('');
          const [situation, setSituation] = React.useState('');
          const [desiredOutcome, setDesiredOutcome] = React.useState('');
          const [recipient, setRecipient] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>⚖️ Dispute Letter Pro</h2>
              <select value={disputeType} onChange={e=>setDisputeType(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value=''>Select Dispute Type</option>
                <option value='Billing dispute'>Billing Dispute</option>
                <option value='Service failure'>Service Failure</option>
                <option value='Product defect/return'>Product Defect / Return</option>
                <option value='Contract breach'>Contract Breach</option>
                <option value='Landlord dispute'>Landlord Dispute</option>
                <option value='Credit report error'>Credit Report Error</option>
                <option value='Employment dispute'>Employment Dispute</option>
                <option value='Insurance claim denial'>Insurance Claim Denial</option>
              </select>
              <input placeholder="Recipient (company/person name)" value={recipient} onChange={e=>setRecipient(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <textarea placeholder="Describe your situation in detail..." value={situation} onChange={e=>setSituation(e.target.value)} rows={5} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="Desired outcome (refund, repair, apology...)" value={desiredOutcome} onChange={e=>setDesiredOutcome(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!disputeType||!situation)return;setLoading(true);try{const r=await fetch(`${''}/api/dispute/letter`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({dispute_type:disputeType,situation,desired_outcome:desiredOutcome,recipient})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#7c3aed,#db2777)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Writing...':'Generate Dispute Letter'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                  <span style={{background:'#1a1a2a',borderRadius:'6px',padding:'0.4rem 0.75rem',fontSize:'0.85rem'}}>📨 Send via: {result.send_via}</span>
                  <span style={{background:'#1a2a1a',borderRadius:'6px',padding:'0.4rem 0.75rem',fontSize:'0.85rem',color:'#4ade80'}}>Success: {result.success_probability}</span>
                </div>
                <div style={{background:'#0a0a1a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',border:'1px solid #2d2d5a',fontFamily:'monospace',fontSize:'0.9rem',whiteSpace:'pre-wrap',color:'#e0e0e0'}}>
                  <strong style={{color:'#a78bfa',display:'block',marginBottom:'0.5rem'}}>Subject: {result.subject_line}</strong>
                  {result.letter_draft}
                </div>
                {result.escalation_path?.length>0&&<div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#fbbf24'}}>Escalation Path:</strong>{result.escalation_path.map((s:string,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.9rem'}}>{s}</li>)}</div>}
                {result.supporting_docs_needed?.length>0&&<div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#60a5fa'}}>Documents to Include:</strong>{result.supporting_docs_needed.map((d:string,i:number)=><li key={i} style={{color:'#93c5fd',fontSize:'0.9rem'}}>{d}</li>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_homevaluate() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [address, setAddress] = React.useState('');
          const [bedrooms, setBedrooms] = React.useState('');
          const [bathrooms, setBathrooms] = React.useState('');
          const [sqft, setSqft] = React.useState('');
          const [yearBuilt, setYearBuilt] = React.useState('');
          const [condition, setCondition] = React.useState('average');
          const [renovations, setRenovations] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>🏠 Home Valuator</h2>
              <input placeholder="Address or neighborhood (e.g. 123 Oak St, Austin TX)" value={address} onChange={e=>setAddress(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Bedrooms" value={bedrooms} onChange={e=>setBedrooms(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Bathrooms" value={bathrooms} onChange={e=>setBathrooms(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Sq Ft" value={sqft} onChange={e=>setSqft(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Year Built" value={yearBuilt} onChange={e=>setYearBuilt(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <select value={condition} onChange={e=>setCondition(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option value='excellent'>Excellent</option>
                  <option value='good'>Good</option>
                  <option value='average'>Average</option>
                  <option value='fair'>Fair</option>
                  <option value='poor'>Poor</option>
                </select>
              </div>
              <input placeholder="Recent renovations (e.g. new kitchen 2023, roof 2020)" value={renovations} onChange={e=>setRenovations(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!address)return;setLoading(true);try{const r=await fetch(`${''}/api/home/valuate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({address,bedrooms,bathrooms,sqft,year_built:yearBuilt,condition,recent_renovations:renovations})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#f59e0b,#10b981)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Valuating...':'Estimate Home Value'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1.5rem',background:'linear-gradient(135deg,#1a2a1a,#0a1a0a)',borderRadius:'12px',padding:'1.5rem',border:'1px solid #166534'}}>
                  <div style={{fontSize:'0.85rem',color:'#888',marginBottom:'0.5rem'}}>Estimated Value</div>
                  <div style={{fontSize:'2.5rem',fontWeight:800,color:'#4ade80'}}>{result.estimated_value}</div>
                  <div style={{color:'#888',fontSize:'0.9rem'}}>Range: {result.value_range?.low} – {result.value_range?.high}</div>
                  <div style={{color:'#888',fontSize:'0.85rem'}}>{result.price_per_sqft}/sqft · {result.market_position}</div>
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>💰 Renovation ROI:</strong>
                  {result.renovation_roi?.map((r:any,i:number)=><div key={i} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',display:'flex',justifyContent:'space-between'}}><div><strong>{r.project}</strong><span style={{color:'#888',fontSize:'0.85rem',marginLeft:'0.5rem'}}>{r.cost}</span></div><div style={{textAlign:'right'}}><div style={{color:'#4ade80',fontWeight:700}}>{r.added_value}</div><div style={{color:'#888',fontSize:'0.8rem'}}>ROI: {r.roi}</div></div></div>)}
                </div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong>Market Trend:</strong> <span style={{color:'#e0e0e0'}}>{result.market_trend}</span></div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong>Best Time to Sell:</strong> <span style={{color:'#e0e0e0'}}>{result.best_time_to_sell}</span></div>
              </div>}
            </div>
          );
}

export function ForgeTab_mortgagecalc() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [homePrice, setHomePrice] = React.useState('');
          const [downPayment, setDownPayment] = React.useState('');
          const [interestRate, setInterestRate] = React.useState('');
          const [loanTerm, setLoanTerm] = React.useState('30');
          const [annualIncome, setAnnualIncome] = React.useState('');
          const [monthlyDebts, setMonthlyDebts] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>🏦 Mortgage Calculator</h2>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Home Price (e.g. 450000)" value={homePrice} onChange={e=>setHomePrice(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Down Payment (e.g. 90000)" value={downPayment} onChange={e=>setDownPayment(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Interest Rate (e.g. 6.5)" value={interestRate} onChange={e=>setInterestRate(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <select value={loanTerm} onChange={e=>setLoanTerm(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option value='30'>30-year loan</option>
                  <option value='20'>20-year loan</option>
                  <option value='15'>15-year loan</option>
                  <option value='10'>10-year loan</option>
                </select>
                <input placeholder="Annual Income (optional)" value={annualIncome} onChange={e=>setAnnualIncome(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Monthly Debts (optional)" value={monthlyDebts} onChange={e=>setMonthlyDebts(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <button onClick={async()=>{if(!homePrice||!downPayment||!interestRate)return;setLoading(true);try{const r=await fetch(`${''}/api/mortgage/calculate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({home_price:homePrice,down_payment:downPayment,interest_rate:interestRate,loan_term:loanTerm,annual_income:annualIncome,monthly_debts:monthlyDebts})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Calculating...':'Calculate Mortgage'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1.5rem',background:'#0a0a2a',borderRadius:'12px',padding:'1.5rem',border:'1px solid #1e3a8a'}}>
                  <div style={{fontSize:'0.85rem',color:'#888'}}>Monthly Payment</div>
                  <div style={{fontSize:'2.5rem',fontWeight:800,color:'#60a5fa'}}>{result.monthly_payment}</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem',marginTop:'1rem'}}>
                    {[['Principal',result.payment_breakdown?.principal,'#a78bfa'],['Interest',result.payment_breakdown?.interest,'#f87171'],['Taxes',result.payment_breakdown?.taxes_est,'#fbbf24'],['Insurance',result.payment_breakdown?.insurance_est,'#34d399']].map(([k,v,c])=><div key={k} style={{background:'#1a1a2a',borderRadius:'6px',padding:'0.5rem'}}><div style={{fontSize:'0.7rem',color:'#888'}}>{k}</div><div style={{color:c as string,fontWeight:600,fontSize:'0.9rem'}}>{v}</div></div>)}
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  {[['Total Interest',result.total_interest_paid],['Total Cost',result.total_cost_of_home],['Closing Costs',result.closing_costs_estimate],['PMI Required',result.pmi_required]].map(([k,v])=><div key={k} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><div style={{fontSize:'0.8rem',color:'#888'}}>{k}</div><div style={{fontWeight:600}}>{v}</div></div>)}
                </div>
                {result.affordability_check&&<div style={{background:result.affordability_check.status==='Good'?'#1a2a1a':'#2d1515',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong>Affordability:</strong> DTI {result.affordability_check.dti_ratio} — {result.affordability_check.status}<p style={{color:'#aaa',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.affordability_check.recommendation}</p></div>}
                {result.first_time_buyer_programs?.length>0&&<div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>First-Time Buyer Programs:</strong>{result.first_time_buyer_programs.map((p:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{p}</li>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_neighborscout2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [location, setLocation] = React.useState('');
          const [familySize, setFamilySize] = React.useState('');
          const [priorities, setPriorities] = React.useState('');
          const [budget, setBudget] = React.useState('');
          const [lifestyle, setLifestyle] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>🗺️ Neighborhood Scout</h2>
              <input placeholder="Neighborhood or city (e.g. Brooklyn NY, South Austin TX)" value={location} onChange={e=>setLocation(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Family size (e.g. couple, family of 4)" value={familySize} onChange={e=>setFamilySize(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Priorities (e.g. top schools, walkability, nightlife)" value={priorities} onChange={e=>setPriorities(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Budget range (e.g. $400k-$600k)" value={budget} onChange={e=>setBudget(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Lifestyle (e.g. outdoorsy, urban, quiet suburban)" value={lifestyle} onChange={e=>setLifestyle(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!location)return;setLoading(true);try{const r=await fetch(`${''}/api/neighborhood/scout`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({location,family_size:familySize,priorities,budget,lifestyle})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#0891b2,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Scouting...':'Scout Neighborhood'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1rem',background:'#0a1a1a',borderRadius:'12px',padding:'1rem',border:'1px solid #0e7490'}}>
                  <div style={{fontSize:'0.85rem',color:'#888'}}>Neighborhood Score</div>
                  <div style={{fontSize:'3rem',fontWeight:800,color:'#22d3ee'}}>{result.neighborhood_score}</div>
                  <p style={{color:'#aaa',fontSize:'0.9rem'}}>{result.overview}</p>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'1rem'}}>
                  {result.category_scores?.map((c:any,i:number)=><div key={i} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><div style={{fontSize:'0.8rem',color:'#888'}}>{c.category}</div><div style={{fontWeight:700,color:'#22d3ee'}}>{c.score}</div><div style={{fontSize:'0.8rem',color:'#666'}}>{c.notes}</div></div>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Pros:</strong>{result.pros?.map((p:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{p}</li>)}</div>
                  <div style={{background:'#2d1515',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171'}}>Cons:</strong>{result.cons?.map((c:string,i:number)=><li key={i} style={{color:'#fca5a5',fontSize:'0.85rem'}}>{c}</li>)}</div>
                </div>
                {result.local_insider_tips?.length>0&&<div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24'}}>🔑 Insider Tips:</strong>{result.local_insider_tips.map((t:string,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.9rem'}}>{t}</li>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_renovationplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [propType, setPropType] = React.useState('house');
          const [project, setProject] = React.useState('');
          const [budget, setBudget] = React.useState('');
          const [timeline, setTimeline] = React.useState('');
          const [diySkill, setDiySkill] = React.useState('beginner');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>🔨 Renovation Planner</h2>
              <select value={propType} onChange={e=>setPropType(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='house'>House</option>
                <option value='condo'>Condo</option>
                <option value='apartment'>Apartment</option>
                <option value='commercial'>Commercial</option>
              </select>
              <input placeholder="Project description (e.g. kitchen remodel, bathroom addition)" value={project} onChange={e=>setProject(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Budget (e.g. $30,000)" value={budget} onChange={e=>setBudget(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Timeline (e.g. 3 months)" value={timeline} onChange={e=>setTimeline(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <select value={diySkill} onChange={e=>setDiySkill(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='beginner'>DIY: Beginner</option>
                <option value='intermediate'>DIY: Intermediate</option>
                <option value='advanced'>DIY: Advanced</option>
                <option value='none'>Hire Everything Out</option>
              </select>
              <button onClick={async()=>{if(!project||!budget)return;setLoading(true);try{const r=await fetch(`${''}/api/renovation/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({property_type:propType,project,budget,timeline,diy_skill:diySkill})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#d97706,#dc2626)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Planning...':'Create Renovation Plan'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{result.project_summary}</strong><span style={{color:'#fbbf24',fontWeight:700}}>{result.total_estimate}</span></div><span style={{color:'#4ade80',fontSize:'0.85rem'}}>Est. ROI: {result.roi_estimate}</span></div>
                <div style={{marginBottom:'1rem'}}><strong>📋 Cost Breakdown:</strong>{result.cost_breakdown?.map((c:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid #222'}}><span style={{color:'#e0e0e0'}}>{c.item}</span><div style={{textAlign:'right'}}><span style={{color:'#fbbf24',fontWeight:600}}>{c.cost}</span>{c.notes&&<div style={{color:'#666',fontSize:'0.8rem'}}>{c.notes}</div>}</div></div>)}</div>
                <div style={{marginBottom:'1rem'}}><strong>📅 Timeline:</strong>{result.timeline_phases?.map((p:any,i:number)=><div key={i} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #d97706'}}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{p.phase}</strong><span style={{color:'#888',fontSize:'0.85rem'}}>{p.duration}</span></div>{p.tasks?.map((t:string,j:number)=><li key={j} style={{color:'#aaa',fontSize:'0.85rem'}}>{t}</li>)}</div>)}</div>
                {result.money_saving_tips?.length>0&&<div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>💰 Money Saving Tips:</strong>{result.money_saving_tips.map((t:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{t}</li>)}</div>}
              </div>}
            </div>
          );
}
