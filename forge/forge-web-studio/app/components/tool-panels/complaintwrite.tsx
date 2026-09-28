'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_complaintwrite() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cw, setCw] = React.useState({issue:'',company:'',what_happened:'',desired_outcome:'',attempts_so_far:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>📣 Complaint Writer</h2>
            {(['issue','company','what_happened','desired_outcome','attempts_so_far'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={cw[k]} onChange={e=>setCw(p=>({...p,[k]:e.target.value}))} rows={k==='what_happened'?4:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/complaint/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(cw)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Writing...':'Write Complaint'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Formal Letter</h3><pre style={{whiteSpace:'pre-wrap',background:'#12122a',padding:16,borderRadius:6,color:'#e0e0e0',fontSize:13}}>{res.formal_letter}</pre><h3>Escalation Path</h3>{(res.escalation_path||[]).map((e:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>Step {i+1}: {e.step}</strong><p>Contact: {e.who} via {e.how}</p></div>)}<h3>Regulatory Bodies</h3>{(res.regulatory_bodies||[]).map((b:string,i:number)=><p key={i}>🏛 {b}</p>)}</div>}
          </div>);
}

export function ForgeTab_policydecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pd, setPd] = React.useState({policy_type:'',your_concerns:'',policy_text:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🔍 Policy Decoder</h2>
            {(['policy_type','your_concerns','policy_text'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={pd[k]} onChange={e=>setPd(p=>({...p,[k]:e.target.value}))} rows={k==='policy_text'?8:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/policy/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(pd)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Decoding...':'Decode Policy'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>TL;DR</h3><p style={{padding:12,background:'#0a2a1a',borderRadius:6,color:'#a0f0a0'}}>{res.tldr}</p><h3>Red Flags</h3>{(res.red_flags||[]).map((f:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#2a0a0a',borderRadius:6}}><p style={{color:'#ff9999'}}>🚩 {f.clause}</p><p style={{fontSize:12}}>Risk: {f.risk} · Severity: <span style={{color:f.severity==='high'?'#ff4444':f.severity==='medium'?'#ffaa44':'#44ff44'}}>{f.severity}</span></p></div>)}<h3>Opt-Outs</h3>{(res.opt_outs||[]).map((o:string,i:number)=><p key={i}>✅ {o}</p>)}<h3>Arbitration Clauses</h3><p style={{color:'#ff9999'}}>{res.arbitration_clauses}</p></div>}
          </div>);
}

export function ForgeTab_smallclaimscoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [sc, setSc] = React.useState({dispute:'',amount:'',defendant:'',jurisdiction:'',evidence:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🏛️ Small Claims Coach</h2><p style={{color:'#888',fontSize:13}}>General guidance only — not legal advice.</p>
            {(['dispute','amount','defendant','jurisdiction','evidence'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k}</label><textarea value={sc[k]} onChange={e=>setSc(p=>({...p,[k]:e.target.value}))} rows={k==='dispute'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/smallclaims/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(sc)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Coaching...':'Coach Me'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Case Strength: <span style={{color:res.case_strength?.includes('strong')?'#44ff44':res.case_strength?.includes('weak')?'#ff4444':'#ffaa44'}}>{res.case_strength?.split('—')[0]}</span></h3><h3>Legal Theory</h3><p>{res.legal_theory}</p><h3>Filing Steps</h3>{(res.filing_steps||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>Step {i+1}: {s.step}</strong><p>{s.action}</p>{s.tip&&<p style={{color:'#6c63ff',fontSize:12}}>💡 {s.tip}</p>}</div>)}<h3>What to Say to the Judge</h3><p style={{fontStyle:'italic',padding:12,background:'#12122a',borderRadius:6}}>{res.what_to_say}</p><h3>Day of Court Tips</h3>{(res.day_of_court_tips||[]).map((t:string,i:number)=><p key={i}>📌 {t}</p>)}</div>}
          </div>);
}

export function ForgeTab_parentingcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pc, setPc] = React.useState({child_age:'',situation:'',parenting_style:'',what_tried:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>👨‍👩‍👧 Parenting Coach</h2>
            {(['child_age','situation','parenting_style','what_tried'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={pc[k]} onChange={e=>setPc(p=>({...p,[k]:e.target.value}))} rows={k==='situation'?4:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/parenting/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(pc)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Coaching...':'Get Guidance'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>What\'s Happening</h3><p style={{color:'#a0d0ff'}}>{res.what_is_happening}</p><h3>Right Now</h3><p style={{padding:12,background:'#0a2a0a',borderRadius:6,color:'#a0f0a0'}}>{res.immediate_strategy}</p><h3>Scripts</h3>{(res.scripts||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:12,padding:12,background:'#12122a',borderRadius:6}}><p style={{color:'#ffe066'}}>Say: "{s.say_this}"</p><p style={{color:'#ff9999'}}>Avoid: "{s.avoid_saying}"</p><p style={{color:'#888',fontSize:12}}>Why: {s.why}</p></div>)}<h3>Long-Term Approach</h3><p>{res.long_term_approach}</p><h3>Self-Care Reminder</h3><p style={{color:'#a0d0ff',fontStyle:'italic'}}>💙 {res.self_care_reminder}</p></div>}
          </div>);
}

export function ForgeTab_lessonplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lp, setLp] = React.useState({subject:'',grade_level:'',duration:'',learning_objectives:'',student_needs:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>📚 Lesson Planner</h2>
            {(['subject','grade_level','duration','learning_objectives','student_needs'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={lp[k]} onChange={e=>setLp(p=>({...p,[k]:e.target.value}))} rows={k==='learning_objectives'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/lesson/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(lp)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Planning...':'Create Lesson Plan'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Overview</h3><p>{res.overview}</p><h3>Warm-Up ({res.warm_up?.duration})</h3><p>{res.warm_up?.activity}</p><h3>Instruction</h3>{(res.instruction||[]).map((ph:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#12122a',borderRadius:6}}><strong>{ph.phase} — {ph.duration}</strong><p>Teacher: {ph.teacher_actions}</p><p>Students: {ph.student_actions}</p></div>)}<h3>Practice</h3><p>{res.practice?.activity}</p><p style={{color:'#888',fontSize:12}}>Struggling: {res.practice?.differentiation?.struggling}</p><p style={{color:'#888',fontSize:12}}>Advanced: {res.practice?.differentiation?.advanced}</p><h3>Assessment</h3><p>{res.assessment}</p></div>}
          </div>);
}

export function ForgeTab_collegeadvise() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ca, setCa] = React.useState({gpa:'',test_scores:'',activities:'',interests:'',budget:'',dream_schools:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🎓 College Advisor</h2>
            {(['gpa','test_scores','activities','interests','budget','dream_schools'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={ca[k]} onChange={e=>setCa(p=>({...p,[k]:e.target.value}))} rows={k==='activities'||k==='interests'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/college/advise`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ca)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Advising...':'Get College Advice'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Profile Assessment</h3><p>{res.profile_assessment}</p><h3>School List</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>{(['reach','match','safety'] as const).map(t=><div key={t} style={{padding:10,background:'#12122a',borderRadius:6}}><strong style={{color:t==='reach'?'#ff9999':t==='match'?'#ffe066':'#99ff99'}}>{t.toUpperCase()}</strong>{(res.school_categories?.[t]||[]).map((s:string,i:number)=><p key={i} style={{fontSize:12,margin:'4px 0'}}>{s}</p>)}</div>)}</div><h3>Essay Angles</h3>{(res.essay_angles||[]).map((e:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>{e.prompt}</strong><p style={{color:'#6c63ff'}}>{e.angle}</p></div>)}<h3>Financial Aid Tips</h3>{(res.financial_aid_tips||[]).map((t:string,i:number)=><p key={i}>💰 {t}</p>)}</div>}
          </div>);
}

export function ForgeTab_behaviordecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bd, setBd] = React.useState({child_age:'',behavior:'',when_it_happens:'',frequency:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🧠 Behavior Decoder</h2>
            {(['child_age','behavior','when_it_happens','frequency'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={bd[k]} onChange={e=>setBd(p=>({...p,[k]:e.target.value}))} rows={k==='behavior'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/behavior/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(bd)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Decoding...':'Decode Behavior'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Why This Is Happening</h3><p style={{color:'#a0d0ff'}}>{res.developmental_explanation}</p><h3>Underlying Need</h3><p style={{fontWeight:'bold',color:'#ffe066'}}>{res.underlying_need}</p><h3>Response Strategies</h3>{(res.response_strategies||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#12122a',borderRadius:6}}><strong>{s.strategy}</strong><p>{s.how}</p><p style={{color:'#888',fontSize:12}}>{s.why}</p></div>)}<h3>What NOT to Do</h3>{(res.what_not_to_do||[]).map((w:any,i:number)=><div key={i} style={{marginBottom:8}}><p style={{color:'#ff9999'}}>❌ {w.mistake}</p><p style={{fontSize:12,color:'#888'}}>{w.why_it_backfires}</p></div>)}</div>}
          </div>);
}

export function ForgeTab_learningstyle() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ls, setLs] = React.useState({learner_age:'',strengths:'',struggles:'',interests:'',school_performance:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🎨 Learning Style Map</h2>
            {(['learner_age','strengths','struggles','interests','school_performance'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={ls[k]} onChange={e=>setLs(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/learning/style`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ls)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#6c63ff',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Mapping...':'Map Learning Style'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Learning Profile</h3><p>{res.learning_profile}</p><h3>Dominant Styles</h3>{(res.dominant_styles||[]).map((s:any,i:number)=><div key={i} style={{display:'inline-block',margin:4,padding:'6px 12px',background:'#2a1a4a',borderRadius:20}}><strong>{s.style}</strong> {s.percentage}</div>)}<h3>Study Strategies</h3>{(res.study_strategies||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#12122a',borderRadius:6}}><strong>{s.strategy}</strong><p>{s.how_to}</p><p style={{color:'#888',fontSize:12}}>{s.when_to_use}</p></div>)}<h3>Memory Techniques</h3>{(res.memory_techniques||[]).map((t:string,i:number)=><p key={i}>🧠 {t}</p>)}</div>}
          </div>);
}

export function ForgeTab_carbonaudit() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ca, setCa] = React.useState({diet:'',transportation:'',home_energy:'',shopping_habits:'',travel:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🌍 Carbon Auditor</h2>
            {(['diet','transportation','home_energy','shopping_habits','travel'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={ca[k]} onChange={e=>setCa(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/carbon/audit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ca)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#2d8a4e',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Auditing...':'Audit My Footprint'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Estimated Footprint: <span style={{color:'#ffe066'}}>{res.estimated_footprint}</span></h3><h3>Breakdown</h3>{(res.breakdown||[]).map((b:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6,display:'flex',justifyContent:'space-between'}}><span>{b.category}</span><span style={{color:'#ff9999'}}>{b.tons_co2} tons ({b.percentage})</span></div>)}<h3>Biggest Wins</h3>{(res.biggest_wins||[]).map((w:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#0a2a1a',borderRadius:6}}><strong style={{color:'#a0f0a0'}}>{w.action}</strong><p>💨 Save {w.co2_saved} | 💰 {w.cost_impact} | Difficulty: {w.difficulty}</p></div>)}<h3>30-Day Challenge</h3><p style={{padding:12,background:'#12122a',borderRadius:6,color:'#6cf'}}>{res['30_day_challenge']}</p></div>}
          </div>);
}

export function ForgeTab_ecohabits() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [eh, setEh] = React.useState({current_habits:'',lifestyle:'',motivation:'',barriers:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🌱 Eco Habit Builder</h2>
            {(['current_habits','lifestyle','motivation','barriers'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={eh[k]} onChange={e=>setEh(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/eco/habits`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(eh)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#2d8a4e',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Building...':'Build Eco Habits'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Habit Stack</h3>{(res.habit_stack||[]).map((h:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#0a2a1a',borderRadius:6}}><strong style={{color:'#a0f0a0'}}>{h.eco_habit}</strong><p>Attach to: {h.attach_to}</p><p style={{fontSize:12,color:'#888'}}>⏱ {h.time_required} · Start with: {h.starter_version}</p></div>)}<h3>Shopping Swaps</h3>{(res.shopping_swaps||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:6,display:'flex',gap:12,alignItems:'center'}}><span style={{color:'#ff9999'}}>❌ {s.replace}</span><span>→</span><span style={{color:'#a0f0a0'}}>✅ {s.with}</span></div>)}<h3>Weekly Schedule</h3><p style={{whiteSpace:'pre-wrap',background:'#12122a',padding:12,borderRadius:6}}>{res.weekly_schedule}</p></div>}
          </div>);
}

export function ForgeTab_sustainplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [sp, setSp] = React.useState({entity_type:'',size:'',current_practices:'',goals:'',budget:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>♻️ Sustainability Planner</h2>
            {(['entity_type','size','current_practices','goals','budget'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={sp[k]} onChange={e=>setSp(p=>({...p,[k]:e.target.value}))} rows={k==='current_practices'||k==='goals'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/sustainability/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(sp)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#2d8a4e',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Planning...':'Build Sustainability Plan'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Baseline</h3><p>{res.baseline_assessment}</p><h3>Priority Actions</h3>{(res.priority_actions||[]).map((a:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#0a2a1a',borderRadius:6}}><strong>{a.action}</strong><p>Timeline: {a.timeline} · Cost: {a.cost} · ROI: {a.roi}</p><p style={{color:'#a0f0a0',fontSize:12}}>{a.impact}</p></div>)}<h3>Quick Wins</h3>{(res.quick_wins||[]).map((q:string,i:number)=><p key={i}>⚡ {q}</p>)}<h3>Certification Path</h3><p>{res.certification_path}</p></div>}
          </div>);
}

export function ForgeTab_climateexplain() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ce, setCe] = React.useState({topic:'',audience:'',depth:'',angle:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🌡️ Climate Explainer</h2>
            {(['topic','audience','depth','angle'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k}</label><textarea value={ce[k]} onChange={e=>setCe(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/climate/explain`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ce)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#2d8a4e',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Explaining...':'Explain Topic'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Core Explanation</h3><p>{res.core_explanation}</p><h3>The Science</h3><p style={{color:'#a0d0ff'}}>{res.the_science}</p><h3>Scale Context</h3><p style={{color:'#ffe066'}}>{res.scale_context}</p><h3>Common Misconceptions</h3>{(res.common_misconceptions||[]).map((m:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><p style={{color:'#ff9999'}}>Myth: {m.myth}</p><p style={{color:'#a0f0a0'}}>Reality: {m.reality}</p></div>)}<h3>Reasons for Hope</h3><p style={{color:'#a0f0a0'}}>{res.what_optimists_say}</p></div>}
          </div>);
}

export function ForgeTab_greenhome() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [gh, setGh] = React.useState({home_type:'',ownership:'',location:'',budget:'',priorities:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🏡 Green Home Advisor</h2>
            {(['home_type','ownership','location','budget','priorities'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={gh[k]} onChange={e=>setGh(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/home/green`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(gh)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#2d8a4e',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Advising...':'Green My Home'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Upgrades by ROI</h3>{(res.upgrades_by_roi||[]).map((u:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#0a2a1a',borderRadius:6}}><strong>{u.upgrade}</strong><p>Cost: {u.cost} · Save: {u.annual_savings}/yr · Payback: {u.payback_period}</p>{u.incentives&&<p style={{color:'#6cf',fontSize:12}}>💰 {u.incentives}</p>}</div>)}<h3>Free Actions This Week</h3>{(res.free_actions||[]).map((a:string,i:number)=><p key={i}>✅ {a}</p>)}<h3>Solar Assessment</h3><p>{res.solar_assessment}</p><h3>Renter Options</h3><p>{res.renter_options}</p></div>}
          </div>);
}

export function ForgeTab_flavorprofile() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fp, setFp] = React.useState({favorite_foods:'',disliked_foods:'',dietary_restrictions:'',cuisine_preferences:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>👅 Flavor Profiler</h2>
            {(['favorite_foods','disliked_foods','dietary_restrictions','cuisine_preferences'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={fp[k]} onChange={e=>setFp(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/flavor/profile`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(fp)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#e07a3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Profiling...':'Build My Flavor Profile'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Your Flavor Profile</h3><div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>{(res.flavor_profile?.dominant_preferences||[]).map((p:string,i:number)=><span key={i} style={{padding:'4px 12px',background:'#e07a3a33',borderRadius:20,border:'1px solid #e07a3a'}}>{p}</span>)}</div><p style={{color:'#a0d0ff'}}>{res.taste_science}</p><h3>Cuisines to Explore</h3>{(res.cuisines_to_explore||[]).map((c:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>{c.cuisine}</strong><p>{c.why}</p><p style={{color:'#ffe066',fontSize:12}}>Start with: {c.gateway_dish}</p></div>)}<h3>Ingredients You\'d Love</h3><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{(res.ingredient_loves||[]).map((i:string,idx:number)=><span key={idx} style={{padding:'4px 10px',background:'#12122a',borderRadius:12}}>🌿 {i}</span>)}</div></div>}
          </div>);
}

export function ForgeTab_mealplanv2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mp, setMp] = React.useState({goals:'',dietary_restrictions:'',household_size:'',budget_per_week:'',cooking_time:'',skill_level:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
          return (<div style={{padding:24}}><h2>🍽️ Meal Planner</h2>
            {(['goals','dietary_restrictions','household_size','budget_per_week','cooking_time','skill_level'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={mp[k]} onChange={e=>setMp(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/meal/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(mp)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#e07a3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Planning...':'Build Meal Plan'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Weekly Plan</h3>{days.map(day=><div key={day} style={{marginBottom:8,padding:10,background:'#12122a',borderRadius:6}}><strong style={{textTransform:'capitalize'}}>{day}</strong><p style={{fontSize:13,margin:'4px 0'}}>🌅 {res.weekly_plan?.[day]?.breakfast} · 🌞 {res.weekly_plan?.[day]?.lunch} · 🌙 {res.weekly_plan?.[day]?.dinner}</p></div>)}<h3>Shopping List</h3>{(res.shopping_list||[]).map((cat:any,i:number)=><div key={i} style={{marginBottom:8}}><strong style={{color:'#e07a3a'}}>{cat.category}</strong><p style={{fontSize:13}}>{(cat.items||[]).join(', ')}</p></div>)}<h3>Prep Strategy</h3><p>{res.prep_strategy}</p><p style={{color:'#ffe066'}}>Est. Cost: {res.estimated_cost}</p></div>}
          </div>);
}

export function ForgeTab_recipeinvent() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ri, setRi] = React.useState({ingredients:'',cuisine_style:'',meal_type:'',dietary_restrictions:'',skill_level:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>👨‍🍳 Recipe Inventor</h2>
            {(['ingredients','cuisine_style','meal_type','dietary_restrictions','skill_level'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={ri[k]} onChange={e=>setRi(p=>({...p,[k]:e.target.value}))} rows={k==='ingredients'?4:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/recipe/invent`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ri)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#e07a3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Inventing...':'Invent Recipe'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>{res.recipe_name}</h3><p style={{color:'#a0d0ff',fontStyle:'italic'}}>{res.description}</p><p style={{color:'#888',fontSize:13}}>Serves {res.serves} · Prep {res.time?.prep}m · Cook {res.time?.cook}m · {res.difficulty}</p><h3>Ingredients</h3>{(res.ingredients||[]).map((i:any,idx:number)=><p key={idx} style={{margin:'4px 0'}}>{i.amount} {i.unit} <strong>{i.ingredient}</strong>{i.notes?` — ${i.notes}`:''}</p>)}<h3>Instructions</h3>{(res.instructions||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>Step {s.step}</strong><p>{s.action}</p>{s.technique_tip&&<p style={{color:'#e07a3a',fontSize:12}}>💡 {s.technique_tip}</p>}</div>)}<p style={{color:'#888',fontSize:12}}>Storage: {res.storage}</p></div>}
          </div>);
}

export function ForgeTab_winepair() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wp, setWp] = React.useState({dish:'',occasion:'',budget:'',preferences:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🍷 Wine Pairer</h2>
            {(['dish','occasion','budget','preferences'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k}</label><textarea value={wp[k]} onChange={e=>setWp(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/wine/pair`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(wp)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#8b0000',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Pairing...':'Find Pairing'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Primary Pairing: {res.primary_pairing?.wine}</h3><p>{res.primary_pairing?.why}</p><p style={{color:'#ffe066'}}>Flavor bridge: {res.primary_pairing?.flavor_bridge}</p><p style={{color:'#888',fontSize:13}}>Serve at {res.primary_pairing?.serving_temp} in a {res.primary_pairing?.glass_type}</p><h3>Alternatives</h3>{(res.alternatives||[]).map((a:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>{a.wine}</strong><p style={{fontSize:13}}>{a.why}</p></div>)}<h3>Budget Picks</h3>{(res.budget_picks||[]).map((b:string,i:number)=><p key={i}>💰 {b}</p>)}<h3>What to Avoid</h3><p style={{color:'#ff9999'}}>{res.what_to_avoid}</p></div>}
          </div>);
}

export function ForgeTab_cookingcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cc, setCc] = React.useState({skill_level:'',technique_to_learn:'',dish_goal:'',equipment:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🔥 Cooking Coach</h2>
            {(['skill_level','technique_to_learn','dish_goal','equipment'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={cc[k]} onChange={e=>setCc(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/cooking/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(cc)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#e07a3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Teaching...':'Teach Me'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>The Technique</h3><p>{res.technique_explained}</p><h3>The Science</h3><p style={{color:'#a0d0ff'}}>{res.the_science}</p><h3>Step by Step</h3>{(res.step_by_step||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#12122a',borderRadius:6}}><strong>Step {i+1}: {s.step}</strong><p>👁 Look for: {s.visual_cue}</p><p style={{color:'#ff9999',fontSize:12}}>Common mistake: {s.common_mistake}</p><p style={{color:'#a0f0a0',fontSize:12}}>Fix: {s.fix}</p></div>)}<h3>Chef Secrets</h3>{(res.chef_secrets||[]).map((s:string,i:number)=><p key={i}>⭐ {s}</p>)}<h3>Troubleshooting</h3>{(res.troubleshooting||[]).map((t:any,i:number)=><div key={i} style={{marginBottom:6}}><p style={{color:'#ff9999'}}>Problem: {t.problem}</p><p style={{color:'#a0f0a0',fontSize:12}}>Solution: {t.solution}</p></div>)}</div>}
          </div>);
}

export function ForgeTab_trainingplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tp, setTp] = React.useState({sport:'',goal:'',current_level:'',available_days:'',equipment:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🏋️ Training Planner</h2>
            {(['sport','goal','current_level','available_days','equipment'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={tp[k]} onChange={e=>setTp(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/training/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(tp)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#1a6b3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Building...':'Build Training Plan'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Program Overview</h3><p>{res.program_overview}</p><h3>Phases</h3>{(res.phases||[]).map((ph:any,i:number)=><div key={i} style={{marginBottom:6,padding:8,background:'#12122a',borderRadius:6}}><strong>{ph.phase}</strong> — {ph.duration}<p style={{fontSize:12,color:'#888'}}>{ph.focus} · Intensity: {ph.intensity}</p></div>)}<h3>Weekly Schedule</h3>{(res.weekly_schedule||[]).map((d:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#12122a',borderRadius:6}}><strong style={{color:'#a0f0a0'}}>{d.day} — {d.session_type}</strong><p style={{fontSize:12,color:'#888'}}>{d.duration} · {d.session_notes}</p>{(d.exercises||[]).map((e:any,j:number)=><p key={j} style={{fontSize:12,margin:'2px 0'}}>• {e.exercise} {e.sets}×{e.reps} rest:{e.rest}</p>)}</div>)}<h3>Recovery Protocol</h3><p>{res.recovery_protocol}</p></div>}
          </div>);
}

export function ForgeTab_sportanalyze() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [sa, setSa] = React.useState({sport:'',position:'',strengths:'',weaknesses:'',game_situation:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>⚽ Sport Analyzer</h2>
            {(['sport','position','strengths','weaknesses','game_situation'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={sa[k]} onChange={e=>setSa(p=>({...p,[k]:e.target.value}))} rows={k==='strengths'||k==='weaknesses'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/sport/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(sa)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#1a6b3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Analyzing...':'Analyze My Game'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Assessment</h3><p>{res.performance_assessment}</p><h3>Technical Skills</h3>{(res.technical_skills||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:10,padding:10,background:'#12122a',borderRadius:6}}><strong>{s.skill}</strong><p style={{color:'#888',fontSize:12}}>{s.current}</p><p style={{color:'#a0f0a0'}}>Drill: {s.drill_to_improve}</p><p style={{color:'#ffe066',fontSize:12}}>Cue: {s.focus_cue}</p></div>)}<h3>Tactical Improvements</h3>{(res.tactical_improvements||[]).map((t:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><strong>{t.situation}</strong><p style={{color:'#ff9999',fontSize:12}}>Currently: {t.current_tendency}</p><p style={{color:'#a0f0a0',fontSize:12}}>Better: {t.better_approach}</p></div>)}</div>}
          </div>);
}

export function ForgeTab_injuryadv() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ia, setIa] = React.useState({injury_type:'',sport:'',pain_location:'',when_it_hurts:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🩹 Injury Advisor</h2><p style={{color:'#ff9999',fontSize:13}}>⚠️ General info only — always consult a medical professional for injuries.</p>
            {(['injury_type','sport','pain_location','when_it_hurts'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={ia[k]} onChange={e=>setIa(p=>({...p,[k]:e.target.value}))} rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/injury/advise`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(ia)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#8b2a2a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Researching...':'Get Info'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><div style={{padding:10,background:'#2a1a0a',borderRadius:6,marginBottom:12,color:'#ffa07a',fontSize:13}}>{res.disclaimer}</div><h3>Acute Response</h3><p style={{padding:12,background:'#12122a',borderRadius:6}}>{res.acute_response}</p><h3>When to See a Doctor NOW</h3><p style={{color:'#ff9999'}}>{res.when_to_see_doctor}</p><h3>Prevention Exercises</h3>{(res.prevention_exercises||[]).map((e:any,i:number)=><div key={i} style={{marginBottom:6,padding:6,background:'#12122a',borderRadius:4}}><strong>{e.exercise}</strong> — {e.sets}×{e.reps}<p style={{fontSize:12,color:'#888'}}>{e.purpose}</p></div>)}</div>}
          </div>);
}

export function ForgeTab_mentalgame() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mg, setMg] = React.useState({sport:'',mental_challenge:'',situation:'',level:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🧠 Mental Game Coach</h2>
            {(['sport','mental_challenge','situation','level'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={mg[k]} onChange={e=>setMg(p=>({...p,[k]:e.target.value}))} rows={k==='mental_challenge'?3:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/mental/game`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(mg)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#1a6b3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Coaching...':'Coach My Mental Game'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Analysis</h3><p>{res.psychological_analysis}</p><h3>Visualization Script</h3><p style={{fontStyle:'italic',padding:12,background:'#12122a',borderRadius:6,color:'#a0d0ff'}}>{res.visualization_script}</p><h3>Self-Talk Scripts</h3>{(res.self_talk_scripts||[]).map((s:any,i:number)=><div key={i} style={{marginBottom:8,padding:8,background:'#12122a',borderRadius:6}}><p style={{color:'#ff9999',fontSize:12}}>❌ "{s.negative_thought}"</p><p style={{color:'#a0f0a0'}}>✅ "{s.positive_replacement}"</p></div>)}<h3>Flow State Triggers</h3>{(res.flow_state_triggers||[]).map((t:string,i:number)=><p key={i}>⚡ {t}</p>)}<h3>Pressure Reframe</h3><p style={{color:'#ffe066'}}>{res.pressure_reframe}</p></div>}
          </div>);
}

export function ForgeTab_fantasyadv() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fa, setFa] = React.useState({sport:'',league_type:'',roster:'',situation:''});
          const [res, setRes] = React.useState<any>(null); const [load, setLoad] = React.useState(false);
          return (<div style={{padding:24}}><h2>🏆 Fantasy Advisor</h2>
            {(['sport','league_type','roster','situation'] as const).map(k=><div key={k} style={{marginBottom:12}}><label style={{display:'block',marginBottom:4,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</label><textarea value={fa[k]} onChange={e=>setFa(p=>({...p,[k]:e.target.value}))} rows={k==='roster'?4:2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:6,padding:8}}/></div>)}
            <button onClick={async()=>{setLoad(true);try{const r=await fetch(`${API_BASE}/api/fantasy/advise`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify(fa)});const d=await r.json();setRes(d);}catch(e){console.error(e);}setLoad(false);}} style={{background:'#1a6b3a',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',cursor:'pointer'}}>{load?'Analyzing...':'Get Fantasy Advice'}</button>
            {res&&<div style={{marginTop:20,background:'#1a1a2e',borderRadius:8,padding:16}}><h3>Recommendation</h3><p style={{fontWeight:'bold',color:'#ffe066',padding:12,background:'#12122a',borderRadius:6}}>{res.recommendation}</p><h3>Reasoning</h3><p>{res.reasoning}</p><p>Risk: <span style={{color:res.risk_level==='high'?'#ff4444':res.risk_level==='medium'?'#ffaa44':'#44ff44'}}>{res.risk_level}</span></p><h3>Upside / Downside</h3><p style={{color:'#a0f0a0'}}>✅ {res.upside}</p><p style={{color:'#ff9999'}}>⚠️ {res.downside}</p><h3>Waiver Targets</h3>{(res.waiver_targets||[]).map((w:string,i:number)=><p key={i}>🎯 {w}</p>)}<h3>Avoid This Week</h3>{(res.avoid_this_week||[]).map((a:string,i:number)=><p key={i} style={{color:'#ff9999'}}>❌ {a}</p>)}</div>}
          </div>);
}

export function ForgeTab_lyricwrite() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lyricTheme, setLyricTheme] = React.useState('');
          const [lyricGenre, setLyricGenre] = React.useState('pop');
          const [lyricMood, setLyricMood] = React.useState('emotional');
          const [lyricRes, setLyricRes] = React.useState<any>(null);
          const [lyricLoading, setLyricLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎵 Lyric Writer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={lyricTheme} onChange={e=>setLyricTheme(e.target.value)} placeholder="Song theme or concept (e.g. late night city drives, letting go of the past)..." rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={lyricGenre} onChange={e=>setLyricGenre(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['pop','rock','r&b','hip-hop','country','indie','folk','electronic','jazz','gospel'].map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                  <select value={lyricMood} onChange={e=>setLyricMood(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['emotional','upbeat','melancholic','defiant','romantic','hopeful','raw','playful'].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button onClick={async()=>{if(!lyricTheme.trim())return;setLyricLoading(true);setLyricRes(null);try{const r=await fetch(`${''}/api/lyrics/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({theme:lyricTheme,genre:lyricGenre,mood:lyricMood})});const d=await r.json();setLyricRes(d);}catch(e){console.error(e);}finally{setLyricLoading(false);}}} disabled={lyricLoading||!lyricTheme.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {lyricLoading?'Writing...':'Write Lyrics ✨'}
                </button>
              </div>
              {lyricRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.5rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
                  <h3 style={{fontWeight:700,fontSize:'1.2rem',marginBottom:'0.5rem'}}>🎵 "{lyricRes.song_title}"</h3>
                  <p style={{opacity:0.7,marginBottom:'1rem'}}>Structure: {lyricRes.structure} | Rhyme: {lyricRes.rhyme_scheme}</p>
                  {Object.entries(lyricRes.lyrics||{}).map(([section,text])=>(
                    <div key={section} style={{marginBottom:'1rem'}}>
                      <div style={{fontWeight:600,textTransform:'uppercase',fontSize:'0.75rem',opacity:0.6,marginBottom:'0.25rem'}}>{section}</div>
                      <div style={{whiteSpace:'pre-line',lineHeight:1.8}}>{text as string}</div>
                    </div>
                  ))}
                </div>
                {lyricRes.hook_analysis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎯 Hook: </strong>{lyricRes.hook_analysis}</div>}
                {lyricRes.production_notes&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎹 Production: </strong>{lyricRes.production_notes}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_musictheory() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [theoryConc, setTheoryConc] = React.useState('');
          const [theoryLevel, setTheoryLevel] = React.useState('intermediate');
          const [theoryInstr, setTheoryInstr] = React.useState('');
          const [theoryRes, setTheoryRes] = React.useState<any>(null);
          const [theoryLoading, setTheoryLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎼 Music Theory Explainer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={theoryConc} onChange={e=>setTheoryConc(e.target.value)} placeholder="Concept to explain (e.g. circle of fifths, modes, chord progressions, counterpoint)..." style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={theoryLevel} onChange={e=>setTheoryLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['beginner','intermediate','advanced'].map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                  <input value={theoryInstr} onChange={e=>setTheoryInstr(e.target.value)} placeholder="Your instrument (optional)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <button onClick={async()=>{if(!theoryConc.trim())return;setTheoryLoading(true);setTheoryRes(null);try{const r=await fetch(`${''}/api/music/theory`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({concept:theoryConc,skill_level:theoryLevel,instrument:theoryInstr})});const d=await r.json();setTheoryRes(d);}catch(e){console.error(e);}finally{setTheoryLoading(false);}}} disabled={theoryLoading||!theoryConc.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {theoryLoading?'Explaining...':'Explain This Concept 🎓'}
                </button>
              </div>
              {theoryRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.5rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
                  <h3 style={{fontWeight:700,marginBottom:'0.75rem'}}>{theoryRes.concept_explained}</h3>
                  <p style={{opacity:0.8,marginBottom:'1rem'}}>{theoryRes.why_it_matters}</p>
                  <div style={{background:'var(--bg-primary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>The Fundamentals:</strong><br/>{theoryRes.the_fundamentals}</div>
                  {theoryRes.on_your_instrument&&<div style={{background:'var(--bg-primary)',padding:'1rem',borderRadius:'8px',marginBottom:'1rem'}}><strong>On Your Instrument:</strong><br/>{theoryRes.on_your_instrument}</div>}
                  {Array.isArray(theoryRes.exercises)&&<div><strong style={{display:'block',marginBottom:'0.5rem'}}>Exercises:</strong>{theoryRes.exercises.map((ex:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-primary)',marginBottom:'0.5rem'}}><strong>{ex.exercise}</strong> ({ex.duration})<br/><span style={{opacity:0.7}}>{ex.purpose}</span></div>)}</div>}
                </div>
                {Array.isArray(theoryRes.examples_in_songs)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎵 In Songs:</strong>{theoryRes.examples_in_songs.map((ex:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}>• <strong>{ex.song}</strong>: {ex.how_it_uses_concept}</div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_playlistcurate() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [plMood, setPlMood] = React.useState('');
          const [plActivity, setPlActivity] = React.useState('');
          const [plEnergy, setPlEnergy] = React.useState('medium');
          const [plRes, setPlRes] = React.useState<any>(null);
          const [plLoading, setPlLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎧 Playlist Curator</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={plMood} onChange={e=>setPlMood(e.target.value)} placeholder="Describe your mood (e.g. nostalgic, focused, heartbroken, celebratory)..." style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={plActivity} onChange={e=>setPlActivity(e.target.value)} placeholder="Activity (e.g. working out, studying, road trip, dinner party, coding)..." style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <select value={plEnergy} onChange={e=>setPlEnergy(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['low','medium','high','variable'].map(e=><option key={e} value={e}>{e} energy</option>)}
                </select>
                <button onClick={async()=>{if(!plMood.trim())return;setPlLoading(true);setPlRes(null);try{const r=await fetch(`${''}/api/playlist/curate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({mood:plMood,activity:plActivity,energy_level:plEnergy})});const d=await r.json();setPlRes(d);}catch(e){console.error(e);}finally{setPlLoading(false);}}} disabled={plLoading||!plMood.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {plLoading?'Curating...':'Curate My Playlist 🎶'}
                </button>
              </div>
              {plRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.5rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
                  <h3 style={{fontWeight:700,fontSize:'1.2rem',marginBottom:'0.25rem'}}>{plRes.playlist_name}</h3>
                  <p style={{opacity:0.7,marginBottom:'1rem'}}>{plRes.vibe_description}</p>
                  {Array.isArray(plRes.tracks)&&plRes.tracks.map((t:any,i:number)=>(
                    <div key={i} style={{display:'flex',gap:'1rem',padding:'0.75rem',borderRadius:'8px',background:'var(--bg-primary)',marginBottom:'0.5rem',alignItems:'flex-start'}}>
                      <div style={{minWidth:'1.5rem',fontWeight:700,opacity:0.5}}>{i+1}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600}}>{t.artist} — {t.song}</div>
                        <div style={{fontSize:'0.85rem',opacity:0.7}}>{t.why}</div>
                        {t.transition_note&&i>0&&<div style={{fontSize:'0.8rem',opacity:0.5,marginTop:'0.25rem',fontStyle:'italic'}}>{t.transition_note}</div>}
                      </div>
                      <div style={{fontSize:'0.75rem',padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--bg-secondary)',opacity:0.8}}>{t.energy}</div>
                    </div>
                  ))}
                </div>
                {plRes.arc&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🌊 Journey: </strong>{plRes.arc}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_practicesched() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [psInstr, setPsInstr] = React.useState('');
          const [psLevel, setPsLevel] = React.useState('intermediate');
          const [psGoals, setPsGoals] = React.useState('');
          const [psTime, setPsTime] = React.useState('30 minutes');
          const [psRes, setPsRes] = React.useState<any>(null);
          const [psLoading, setPsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎸 Practice Scheduler</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={psInstr} onChange={e=>setPsInstr(e.target.value)} placeholder="Instrument (e.g. guitar, piano, drums, violin, voice)..." style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={psLevel} onChange={e=>setPsLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['beginner','intermediate','advanced','professional'].map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={psTime} onChange={e=>setPsTime(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['15 minutes','30 minutes','45 minutes','1 hour','90 minutes','2 hours'].map(t=><option key={t} value={t}>{t}/day</option>)}
                  </select>
                </div>
                <input value={psGoals} onChange={e=>setPsGoals(e.target.value)} placeholder="Goals (e.g. learn jazz improvisation, prepare for audition, write original songs)..." style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!psInstr.trim())return;setPsLoading(true);setPsRes(null);try{const r=await fetch(`${''}/api/practice/schedule`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({instrument:psInstr,skill_level:psLevel,goals:psGoals,available_time:psTime})});const d=await r.json();setPsRes(d);}catch(e){console.error(e);}finally{setPsLoading(false);}}} disabled={psLoading||!psInstr.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {psLoading?'Scheduling...':'Build My Practice Plan 📋'}
                </button>
              </div>
              {psRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎯 Philosophy: </strong>{psRes.practice_philosophy}</div>
                {psRes.warm_up_routine&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔥 Warm-Up: </strong>{psRes.warm_up_routine}</div>}
                {Array.isArray(psRes.daily_schedule)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>{psRes.daily_schedule.map((b:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700,marginBottom:'0.25rem'}}>{b.block} <span style={{fontWeight:400,opacity:0.7}}>({b.duration})</span></div><div style={{marginBottom:'0.5rem'}}>{b.focus}</div>{Array.isArray(b.specific_exercises)&&<ul style={{margin:0,paddingLeft:'1.25rem',opacity:0.8}}>{b.specific_exercises.map((ex:string,j:number)=><li key={j}>{ex}</li>)}</ul>}</div>)}</div>}
                {Array.isArray(psRes.goal_milestones)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🏁 Milestones:</strong>{psRes.goal_milestones.map((m:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>{m.goal}</strong> — {m.timeline}<br/><span style={{opacity:0.7,fontSize:'0.9rem'}}>{m.how_to_know}</span></div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_musicpitch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mpArtist, setMpArtist] = React.useState('');
          const [mpGenre, setMpGenre] = React.useState('');
          const [mpSound, setMpSound] = React.useState('');
          const [mpTarget, setMpTarget] = React.useState('record label');
          const [mpRes, setMpRes] = React.useState<any>(null);
          const [mpLoading, setMpLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📻 Music Pitch Writer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={mpArtist} onChange={e=>setMpArtist(e.target.value)} placeholder="Artist or band name..." style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={mpGenre} onChange={e=>setMpGenre(e.target.value)} placeholder="Genre (e.g. indie pop, trap soul, folk-rock)..." style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <textarea value={mpSound} onChange={e=>setMpSound(e.target.value)} placeholder="Describe your sound, influences, and what makes you unique..." rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <select value={mpTarget} onChange={e=>setMpTarget(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['record label','playlist curator','music venue','music press/blog','sync licensing','brand partnership','music festival'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={async()=>{if(!mpArtist.trim()||!mpGenre.trim())return;setMpLoading(true);setMpRes(null);try{const r=await fetch(`${''}/api/music/pitch`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({artist_name:mpArtist,genre:mpGenre,sound_description:mpSound,target:mpTarget})});const d=await r.json();setMpRes(d);}catch(e){console.error(e);}finally{setMpLoading(false);}}} disabled={mpLoading||!mpArtist.trim()||!mpGenre.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {mpLoading?'Writing...':'Write My Pitch 🚀'}
                </button>
              </div>
              {mpRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.5rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
                  <p style={{fontSize:'1.1rem',fontStyle:'italic',fontWeight:600,marginBottom:'1rem'}}>"{mpRes.one_liner}"</p>
                  <div style={{whiteSpace:'pre-wrap',lineHeight:1.7}}>{mpRes.bio}</div>
                </div>
                {mpRes.pitch_email&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📧 Pitch Email:</strong><pre style={{whiteSpace:'pre-wrap',marginTop:'0.5rem',fontFamily:'inherit',fontSize:'0.9rem'}}>{mpRes.pitch_email}</pre></div>}
                {mpRes.comparable_artists&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎵 Sounds Like: </strong>{mpRes.comparable_artists}</div>}
                {mpRes.what_makes_them_different&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚡ Differentiator: </strong>{mpRes.what_makes_them_different}</div>}
                {mpRes.follow_up_template&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>↩️ Follow-Up: </strong>{mpRes.follow_up_template}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_homebuy() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [hbBudget, setHbBudget] = React.useState('');
          const [hbLocation, setHbLocation] = React.useState('');
          const [hbSituation, setHbSituation] = React.useState('first-time buyer');
          const [hbTimeline, setHbTimeline] = React.useState('6 months');
          const [hbRes, setHbRes] = React.useState<any>(null);
          const [hbLoading, setHbLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🏡 Home Buyer Guide</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={hbBudget} onChange={e=>setHbBudget(e.target.value)} placeholder="Budget (e.g. $400,000)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={hbLocation} onChange={e=>setHbLocation(e.target.value)} placeholder="Location / market" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={hbSituation} onChange={e=>setHbSituation(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['first-time buyer','repeat buyer','downsizing','investment property','relocating'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={hbTimeline} onChange={e=>setHbTimeline(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['3 months','6 months','1 year','2+ years','just exploring'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={async()=>{if(!hbBudget.trim()||!hbLocation.trim())return;setHbLoading(true);setHbRes(null);try{const r=await fetch(`${''}/api/home/buy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({budget:hbBudget,location:hbLocation,situation:hbSituation,timeline:hbTimeline})});const d=await r.json();setHbRes(d);}catch(e){console.error(e);}finally{setHbLoading(false);}}} disabled={hbLoading||!hbBudget.trim()||!hbLocation.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {hbLoading?'Analyzing...':'Build My Buying Guide 🏠'}
                </button>
              </div>
              {hbRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📊 Readiness: </strong>{hbRes.readiness_assessment}</div>
                {hbRes.budget_breakdown&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💰 Budget Breakdown:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(hbRes.budget_breakdown).map(([k,v])=><div key={k} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{fontSize:'0.75rem',opacity:0.6}}>{k.replace(/_/g,' ')}</div><div style={{fontWeight:600}}>{v as string}</div></div>)}</div></div>}
                {Array.isArray(hbRes.step_by_step_process)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📋 Process:</strong>{hbRes.step_by_step_process.map((s:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',gap:'0.75rem'}}><div style={{minWidth:'1.5rem',fontWeight:700,opacity:0.5}}>{i+1}</div><div><div style={{fontWeight:600}}>{s.step} <span style={{opacity:0.6,fontWeight:400,fontSize:'0.85rem'}}>({s.timing})</span></div><div style={{opacity:0.7,fontSize:'0.9rem'}}>{s.why_it_matters}</div></div></div>)}</div>}
                {Array.isArray(hbRes.red_flags_to_watch)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚩 Red Flags:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{hbRes.red_flags_to_watch.map((f:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{f}</li>)}</ul></div>}
                {Array.isArray(hbRes.biggest_mistakes)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚠️ Biggest Mistakes:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{hbRes.biggest_mistakes.map((m:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{m}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_rentanalyze() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [raLocation, setRaLocation] = React.useState('');
          const [raRent, setRaRent] = React.useState('');
          const [raDetails, setRaDetails] = React.useState('');
          const [raRes, setRaRes] = React.useState<any>(null);
          const [raLoading, setRaLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🏢 Rent Analyzer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={raLocation} onChange={e=>setRaLocation(e.target.value)} placeholder="City / neighborhood" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={raRent} onChange={e=>setRaRent(e.target.value)} placeholder="Monthly rent (e.g. $2,400)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <textarea value={raDetails} onChange={e=>setRaDetails(e.target.value)} placeholder="Apartment details (bedrooms, size, amenities, included utilities, etc.)" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <button onClick={async()=>{if(!raLocation.trim()||!raRent.trim())return;setRaLoading(true);setRaRes(null);try{const r=await fetch(`${''}/api/rent/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({location:raLocation,rent_amount:raRent,apartment_details:raDetails})});const d=await r.json();setRaRes(d);}catch(e){console.error(e);}finally{setRaLoading(false);}}} disabled={raLoading||!raLocation.trim()||!raRent.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {raLoading?'Analyzing...':'Analyze This Rent 🔍'}
                </button>
              </div>
              {raRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{fontSize:'1.1rem'}}>Verdict: </strong>{raRes.verdict}</div>
                {raRes.market_context&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📈 Market Context: </strong>{raRes.market_context}</div>}
                {raRes.negotiation_script&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💬 Negotiation Script:</strong><p style={{marginTop:'0.5rem',fontStyle:'italic'}}>{raRes.negotiation_script}</p></div>}
                {Array.isArray(raRes.lease_clauses_to_watch)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📄 Lease Clauses to Watch:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{raRes.lease_clauses_to_watch.map((c:string,i:number)=><li key={i}>{c}</li>)}</ul></div>}
                {raRes.walkaway_threshold&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚶 Walk Away If: </strong>{raRes.walkaway_threshold}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_mortgageexp() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mgPrice, setMgPrice] = React.useState('');
          const [mgDown, setMgDown] = React.useState('');
          const [mgCredit, setMgCredit] = React.useState('good (700+)');
          const [mgQ, setMgQ] = React.useState('');
          const [mgRes, setMgRes] = React.useState<any>(null);
          const [mgLoading, setMgLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🏦 Mortgage Explainer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={mgPrice} onChange={e=>setMgPrice(e.target.value)} placeholder="Home price (e.g. $500,000)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={mgDown} onChange={e=>setMgDown(e.target.value)} placeholder="Down payment (e.g. $100,000 or 20%)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <select value={mgCredit} onChange={e=>setMgCredit(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['excellent (760+)','good (700+)','fair (650-699)','poor (below 650)'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <input value={mgQ} onChange={e=>setMgQ(e.target.value)} placeholder="Specific questions (e.g. should I do ARM or fixed? what\'s PMI?)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!mgPrice.trim())return;setMgLoading(true);setMgRes(null);try{const r=await fetch(`${''}/api/mortgage/explain`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({home_price:mgPrice,down_payment:mgDown,credit_score:mgCredit,questions:mgQ})});const d=await r.json();setMgRes(d);}catch(e){console.error(e);}finally{setMgLoading(false);}}} disabled={mgLoading||!mgPrice.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {mgLoading?'Explaining...':'Explain My Mortgage Options 📖'}
                </button>
              </div>
              {mgRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {Array.isArray(mgRes.loan_options)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🏛️ Loan Options:</strong>{mgRes.loan_options.map((l:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700}}>{l.type} <span style={{fontWeight:400,opacity:0.7}}>~{l.rate_estimate}</span></div><div style={{fontSize:'0.9rem',opacity:0.7,marginBottom:'0.25rem'}}>{l.best_for}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',fontSize:'0.85rem'}}><div><strong style={{color:'#22c55e'}}>✓ </strong>{Array.isArray(l.pros)?l.pros.join(' · '):l.pros}</div><div><strong style={{color:'#ef4444'}}>✗ </strong>{Array.isArray(l.cons)?l.cons.join(' · '):l.cons}</div></div></div>)}</div>}
                {mgRes.monthly_payment_breakdown&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💳 Monthly Payment:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(mgRes.monthly_payment_breakdown).map(([k,v])=><div key={k} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{fontSize:'0.75rem',opacity:0.6}}>{k.replace(/_/g,' ')}</div><div style={{fontWeight:600}}>{v as string}</div></div>)}</div></div>}
                {mgRes.questions_answered&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>❓ Your Questions Answered:</strong><p style={{marginTop:'0.5rem'}}>{mgRes.questions_answered}</p></div>}
                {Array.isArray(mgRes.key_terms_explained)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📚 Key Terms:</strong>{mgRes.key_terms_explained.map((t:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><strong>{t.term}:</strong> {t.plain_english}</div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_neighborscout() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [nsArea, setNsArea] = React.useState('');
          const [nsPriorities, setNsPriorities] = React.useState('');
          const [nsLifestyle, setNsLifestyle] = React.useState('');
          const [nsRes, setNsRes] = React.useState<any>(null);
          const [nsLoading, setNsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🗺️ Neighborhood Scout</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={nsArea} onChange={e=>setNsArea(e.target.value)} placeholder="Neighborhood or area (e.g. Capitol Hill, Seattle WA)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={nsPriorities} onChange={e=>setNsPriorities(e.target.value)} placeholder="Priorities (e.g. walkability, top schools, quiet streets, nightlife)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={nsLifestyle} onChange={e=>setNsLifestyle(e.target.value)} placeholder="Your lifestyle (e.g. young professional, family with kids, retiree, remote worker)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!nsArea.trim())return;setNsLoading(true);setNsRes(null);try{const r=await fetch(`${''}/api/neighborhood/scout`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({neighborhood:nsArea,priorities:nsPriorities,lifestyle:nsLifestyle})});const d=await r.json();setNsRes(d);}catch(e){console.error(e);}finally{setNsLoading(false);}}} disabled={nsLoading||!nsArea.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {nsLoading?'Scouting...':'Scout This Neighborhood 🔭'}
                </button>
              </div>
              {nsRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><p style={{marginBottom:'0.75rem'}}>{nsRes.neighborhood_profile}</p><p style={{opacity:0.7,fontSize:'0.9rem',marginBottom:'0.75rem'}}><strong>Who Lives Here:</strong> {nsRes.who_lives_here}</p><p style={{opacity:0.7,fontSize:'0.9rem'}}><strong>Trajectory:</strong> {nsRes.trajectory}</p></div>
                {nsRes.scores&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem'}}>{Object.entries(nsRes.scores).map(([k,v])=><div key={k} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><div style={{fontSize:'0.75rem',opacity:0.6,marginBottom:'0.25rem'}}>{k}</div><div style={{fontSize:'0.85rem'}}>{v as string}</div></div>)}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  {Array.isArray(nsRes.pros)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong style={{color:'#22c55e'}}>✓ Pros</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{nsRes.pros.map((p:string,i:number)=><li key={i}>{p}</li>)}</ul></div>}
                  {Array.isArray(nsRes.cons)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong style={{color:'#ef4444'}}>✗ Cons</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{nsRes.cons.map((c:string,i:number)=><li key={i}>{c}</li>)}</ul></div>}
                </div>
                {Array.isArray(nsRes.comparable_neighborhoods)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔀 Also Consider: </strong>{nsRes.comparable_neighborhoods.join(', ')}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_homerenovate() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [hrProject, setHrProject] = React.useState('');
          const [hrBudget, setHrBudget] = React.useState('');
          const [hrDiy, setHrDiy] = React.useState('intermediate');
          const [hrGoals, setHrGoals] = React.useState('improve function and value');
          const [hrRes, setHrRes] = React.useState<any>(null);
          const [hrLoading, setHrLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🔨 Renovation Planner</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={hrProject} onChange={e=>setHrProject(e.target.value)} placeholder="Project description (e.g. kitchen remodel, bathroom gut, deck addition, basement finish)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={hrBudget} onChange={e=>setHrBudget(e.target.value)} placeholder="Budget (e.g. $25,000)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <select value={hrDiy} onChange={e=>setHrDiy(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['none (hire everything)','beginner','intermediate','advanced','professional'].map(d=><option key={d} value={d}>{d} DIY</option>)}
                  </select>
                </div>
                <button onClick={async()=>{if(!hrProject.trim()||!hrBudget.trim())return;setHrLoading(true);setHrRes(null);try{const r=await fetch(`${''}/api/home/renovate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({project:hrProject,budget:hrBudget,diy_skill:hrDiy,goals:hrGoals})});const d=await r.json();setHrRes(d);}catch(e){console.error(e);}finally{setHrLoading(false);}}} disabled={hrLoading||!hrProject.trim()||!hrBudget.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {hrLoading?'Planning...':'Plan My Renovation 📐'}
                </button>
              </div>
              {hrRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏗️ Overview: </strong>{hrRes.project_overview}</div>
                {hrRes.roi_estimate&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📈 ROI: </strong>{hrRes.roi_estimate}</div>}
                {Array.isArray(hrRes.budget_breakdown)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💰 Budget Breakdown:</strong><div style={{display:'flex',flexDirection:'column',gap:'0.25rem',marginTop:'0.5rem'}}>{hrRes.budget_breakdown.map((b:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem',borderRadius:'4px',background:'var(--bg-primary)'}}><span>{b.category}</span><span style={{fontWeight:600}}>{b.estimated_cost}</span></div>)}</div></div>}
                {Array.isArray(hrRes.phase_plan)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📅 Phase Plan:</strong>{hrRes.phase_plan.map((p:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700}}>{p.phase} <span style={{fontWeight:400,opacity:0.6}}>({p.timeline})</span></div>{Array.isArray(p.tasks)&&<ul style={{margin:'0.25rem 0 0',paddingLeft:'1.25rem',fontSize:'0.9rem'}}>{p.tasks.map((t:string,j:number)=><li key={j}>{t}</li>)}</ul>}</div>)}</div>}
                {hrRes.contingency_advice&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛡️ Contingency: </strong>{hrRes.contingency_advice}</div>}
              </div>}
            </div>
          );
}
