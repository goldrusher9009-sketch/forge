'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_teachassist() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [subject, setSubject] = React.useState('');
          const [studentLevel, setStudentLevel] = React.useState('middle school');
          const [goal, setGoal] = React.useState('');
          const [style, setStyle] = React.useState('interactive');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🎓 Teaching Assistant</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Generate complete, differentiated lesson plans with activities, assessments, and teacher tips.</p>
              <input placeholder="Subject (e.g. 'Photosynthesis', 'The Civil War', 'Quadratic equations')" value={subject} onChange={e=>setSubject(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Learning goal (e.g. 'Students can explain the water cycle with 80% accuracy')" value={goal} onChange={e=>setGoal(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={studentLevel} onChange={e=>setStudentLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['elementary','middle school','high school','college','adult learners','professional training'].map(l=><option key={l} value={l}>{l}</option>)}
                </select>
                <select value={style} onChange={e=>setStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['interactive','lecture-based','project-based','Socratic','flipped classroom','gamified'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!subject||!goal)return;setLoading(true);try{const r=await fetch(`${''}/api/teaching/assist`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({subject,student_level:studentLevel,learning_goal:goal,teaching_style:style})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#7c3aed,#059669)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building Lesson...':'Generate Lesson Plan'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1rem',background:'#1a0a2a',borderRadius:'8px',padding:'1rem'}}><div style={{fontSize:'1.25rem',fontWeight:700,color:'#c084fc'}}>{result.lesson_title}</div></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Objectives:</strong>{result.objectives?.map((o:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{o}</li>)}</div>
                  <div style={{background:'#0a1a2a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#60a5fa',fontSize:'0.85rem'}}>Hook Activity:</strong><p style={{color:'#93c5fd',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.hook_activity}</p></div>
                </div>
                {result.direct_instruction&&<div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#fbbf24'}}>Direct Instruction:</strong><p style={{color:'#fde68a',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.direct_instruction.content_outline}</p><p style={{color:'#888',fontSize:'0.8rem'}}>Key vocab: {result.direct_instruction.key_vocabulary}</p></div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  {result.differentiation&&<div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#a78bfa',fontSize:'0.85rem'}}>Differentiation:</strong><p style={{color:'#f87171',fontSize:'0.8rem'}}>Struggling: {result.differentiation.for_struggling}</p><p style={{color:'#4ade80',fontSize:'0.8rem'}}>Advanced: {result.differentiation.for_advanced}</p></div>}
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f9a8d4',fontSize:'0.85rem'}}>Assessment Questions:</strong>{result.assessment_questions?.slice(0,3).map((q:any,i:number)=><li key={i} style={{color:'#fbcfe8',fontSize:'0.8rem'}}>{q.question||q}</li>)}</div>
                </div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Teacher Tips:</strong>{result.teacher_tips?.map((t:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{t}</li>)}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_convhack() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
          const [context, setContext] = React.useState('');
          const [relationship, setRelationship] = React.useState('');
          const [challenge, setChallenge] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💬 Conversation Hacker</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Master any conversation with a strategic script, rapport builders, and flow map.</p>
              <input placeholder="Conversation goal (e.g. 'Get my manager to support my idea', 'Make a great first impression at a party')" value={goal} onChange={e=>setGoal(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Context (e.g. 'work meeting', 'first date', 'networking event', 'family dinner')" value={context} onChange={e=>setContext(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Relationship (e.g. 'boss', 'stranger', 'old friend')" value={relationship} onChange={e=>setRelationship(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Challenge (e.g. 'they seem uninterested', 'I freeze up')" value={challenge} onChange={e=>setChallenge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <button onClick={async()=>{if(!goal||!context)return;setLoading(true);try{const r=await fetch(`${''}/api/conversation/hack`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goal,context,relationship,challenge})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#0891b2,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Strategizing...':'Hack This Conversation'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#0a1a2a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',borderLeft:'4px solid #0891b2'}}><strong style={{color:'#22d3ee'}}>Strategy:</strong><p style={{color:'#e0e0e0',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.conversation_strategy}</p></div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#4ade80'}}>Opening Lines:</strong>{result.opening_lines?.map((l:string,i:number)=><div key={i} style={{background:'#1a2a1a',borderRadius:'6px',padding:'0.5rem',margin:'0.25rem 0',fontStyle:'italic',color:'#86efac',fontSize:'0.9rem'}}>"{l}"</div>)}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#a78bfa',fontSize:'0.85rem'}}>Key Questions:</strong>{result.key_questions_to_ask?.map((q:any,i:number)=><li key={i} style={{color:'#d8b4fe',fontSize:'0.85rem'}}>{q.question||q}</li>)}</div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24',fontSize:'0.85rem'}}>Rapport Builders:</strong>{result.rapport_builders?.map((r:string,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.85rem'}}>{r}</li>)}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>✓ Words that Build Rapport:</strong>{result.word_choices_that_build_rapport?.map((w:string,i:number)=><span key={i} style={{display:'inline-block',background:'#1a2a1a',borderRadius:'8px',padding:'0.1rem 0.5rem',margin:'0.1rem',color:'#86efac',fontSize:'0.8rem'}}>{w}</span>)}</div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171',fontSize:'0.85rem'}}>✗ Words to Avoid:</strong>{result.word_choices_to_avoid?.map((w:string,i:number)=><span key={i} style={{display:'inline-block',background:'#2a1a1a',borderRadius:'8px',padding:'0.1rem 0.5rem',margin:'0.1rem',color:'#fca5a5',fontSize:'0.8rem'}}>{w}</span>)}</div>
                </div>
                {result.closing_the_conversation&&<div style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#c084fc'}}>Graceful Exits:</strong>{result.closing_the_conversation.graceful_exits?.map((e:string,i:number)=><li key={i} style={{color:'#d8b4fe',fontSize:'0.85rem',fontStyle:'italic'}}>"{e}"</li>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_charismav2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [scenario, setScenario] = React.useState('');
          const [approach, setApproach] = React.useState('');
          const [outcome, setOutcome] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>✨ Charisma Coach</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Develop magnetic presence, natural humor, and authentic charm.</p>
              <textarea placeholder="Scenario (e.g. 'I\'m quiet at parties and struggle to connect', 'I want to be more engaging in presentations')" value={scenario} onChange={e=>setScenario(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="Current approach (what you typically do)" value={approach} onChange={e=>setApproach(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Desired outcome (e.g. 'Be the person people gravitate toward')" value={outcome} onChange={e=>setOutcome(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!scenario)return;setLoading(true);try{const r=await fetch(`${''}/api/charisma/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({scenario,current_approach:approach,desired_outcome:outcome})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#db2777,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Coaching...':'Coach My Charisma'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem',marginBottom:'1rem',textAlign:'center'}}>
                  {[{l:'Presence',v:result.charisma_assessment?.presence_score},{l:'Warmth',v:result.charisma_assessment?.warmth_score},{l:'Energy',v:result.charisma_assessment?.energy_score},{l:'Authentic',v:result.charisma_assessment?.authenticity_score}].map(s=><div key={s.l} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.5rem'}}><div style={{color:'#888',fontSize:'0.7rem'}}>{s.l}</div><div style={{fontSize:'1.5rem',fontWeight:700,color:'#f9a8d4'}}>{s.v}</div></div>)}
                </div>
                <div style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem',borderLeft:'3px solid #db2777'}}><strong style={{color:'#f9a8d4'}}>What Charismatic People Do Differently:</strong><p style={{color:'#fbcfe8',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.what_charismatic_people_do_differently}</p></div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Your Coaching (Tailored):</strong>{result.your_specific_coaching?.map((t:string,i:number)=><div key={i} style={{background:'#1a0a2a',borderRadius:'6px',padding:'0.5rem',margin:'0.25rem 0',display:'flex',gap:'0.5rem'}}><span style={{color:'#c084fc',fontWeight:700}}>{i+1}.</span><span style={{color:'#d8b4fe',fontSize:'0.9rem'}}>{t}</span></div>)}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24',fontSize:'0.85rem'}}>Humor Tips:</strong>{result.humor_integration?.map((h:string,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.85rem'}}>{h}</li>)}</div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Making People Feel Seen:</strong>{result.making_people_feel_seen?.map((t:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{t}</li>)}</div>
                </div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#4ade80'}}>Daily Practice Exercises:</strong>{result.practice_exercises?.map((e:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{e}</li>)}</div>
                <div style={{textAlign:'center',background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f9a8d4'}}>Your Charisma Mantra: </strong><em style={{color:'#fbcfe8',fontSize:'1rem'}}>"{result.charisma_mantra}"</em></div>
              </div>}
            </div>
          );
}

export function ForgeTab_netwrkstrat() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
          const [industry, setIndustry] = React.useState('');
          const [network, setNetwork] = React.useState('');
          const [time, setTime] = React.useState('3 hours/week');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🌐 Networking Strategist</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Build a powerful network strategically with templates, tactics, and a 30-day plan.</p>
              <input placeholder="Networking goal (e.g. 'Find a co-founder', 'Get introductions to VCs', 'Land a senior role')" value={goal} onChange={e=>setGoal(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Industry" value={industry} onChange={e=>setIndustry(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Current network size/quality" value={network} onChange={e=>setNetwork(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <select value={time} onChange={e=>setTime(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['1 hour/week','3 hours/week','5 hours/week','10+ hours/week'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!goal||!industry)return;setLoading(true);try{const r=await fetch(`${''}/api/networking/strategy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goal,industry,current_network:network,time_available:time})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building Strategy...':'Build My Network Strategy'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>Target People:</strong>{result.target_people?.map((t:any,i:number)=><div key={i} style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><strong>{t.type}</strong> ({t.how_many})<br/><span style={{color:'#93c5fd',fontSize:'0.85rem'}}>{t.why}</span></div><span style={{color:'#4ade80',fontSize:'0.85rem'}}>{t.where_to_find}</span></div>)}</div>
                {result.outreach_templates&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Outreach Templates:</strong>{Object.entries(result.outreach_templates).map(([k,v]:any)=><div key={k} style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><strong style={{color:'#c084fc',fontSize:'0.85rem',textTransform:'capitalize'}}>{k.replace(/_/g,' ')}:</strong><p style={{color:'#d8b4fe',fontSize:'0.85rem',fontStyle:'italic',margin:'0.25rem 0',whiteSpace:'pre-wrap'}}>{v}</p></div>)}</div>}
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#4ade80'}}>Giving Before Getting:</strong>{result.giving_before_getting?.map((g:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{g}</li>)}</div>
                <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#4ade80'}}>30-Day Action Plan:</strong>{result['30_day_action_plan']?.map((w:any,i:number)=><div key={i} style={{padding:'0.5rem 0',borderBottom:'1px solid #1a2a1a'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>{w.week}: </strong>{w.actions?.join(' · ')}</div>)}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_conflictmed() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [conflict, setConflict] = React.useState('');
          const [role, setRole] = React.useState('');
          const [importance, setImportance] = React.useState('high');
          const [resolution, setResolution] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>⚖️ Conflict Mediator</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Resolve any conflict with professional mediation strategy and word-for-word scripts.</p>
              <textarea placeholder="Describe the conflict (what happened, background, current state)" value={conflict} onChange={e=>setConflict(e.target.value)} rows={4} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="Your role (e.g. 'the one who feels wronged', 'manager trying to mediate', 'one of two parties')" value={role} onChange={e=>setRole(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={importance} onChange={e=>setImportance(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option value='critical'>Critical relationship (must preserve)</option><option value='high'>High importance</option><option value='medium'>Medium importance</option><option value='low'>Low importance (okay to lose)</option>
                </select>
                <input placeholder="Desired resolution (e.g. 'Restore working relationship')" value={resolution} onChange={e=>setResolution(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <button onClick={async()=>{if(!conflict||!role)return;setLoading(true);try{const r=await fetch(`${''}/api/conflict/mediate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({conflict_description:conflict,your_role:role,relationship_importance:importance,desired_resolution:resolution})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#b45309,#1d4ed8)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Mediating...':'Get Mediation Strategy'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#60a5fa',fontSize:'0.85rem'}}>Core Issue:</strong><p style={{color:'#93c5fd',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.conflict_analysis?.core_issue}</p></div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Approach:</strong><p style={{color:'#86efac',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.mediation_approach}</p></div>
                </div>
                {result.scripts&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Scripts:</strong>{Object.entries(result.scripts).map(([k,v]:any)=><div key={k} style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><strong style={{color:'#c084fc',fontSize:'0.85rem',textTransform:'capitalize'}}>{k.replace(/_/g,' ')}:</strong><p style={{color:'#d8b4fe',fontSize:'0.9rem',fontStyle:'italic',margin:'0.25rem 0',whiteSpace:'pre-wrap'}}>{v}</p></div>)}</div>}
                {result.negotiation_phase?.proposing_solutions&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>Solution Options:</strong>{result.negotiation_phase.proposing_solutions.map((s:any,i:number)=><div key={i} style={{background:'#1a1a0a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><strong style={{color:'#fbbf24'}}>{s.option||`Option ${i+1}`}: </strong><span style={{color:'#fde68a',fontSize:'0.9rem'}}>{s.description||s}</span></div>)}</div>}
                <div style={{background:'#1a0a0a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171'}}>When to Walk Away:</strong><p style={{color:'#fca5a5',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.when_to_walk_away}</p></div>
              </div>}
            </div>
          );
}

export function ForgeTab_influencebuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [objective, setObjective] = React.useState('');
          const [audience, setAudience] = React.useState('');
          const [currentInfluence, setCurrentInfluence] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🎯 Influence Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Ethically increase your influence with proven persuasion psychology and tailored scripts.</p>
              <input placeholder="What you want to influence (e.g. 'Get team buy-in on my project', 'Change my community\'s opinion on an issue')" value={objective} onChange={e=>setObjective(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Target audience (e.g. 'skeptical engineers', 'conservative board members', 'new customers')" value={audience} onChange={e=>setAudience(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Current influence level with this audience (e.g. 'they respect me but are resistant', 'unknown to them')" value={currentInfluence} onChange={e=>setCurrentInfluence(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!objective||!audience)return;setLoading(true);try{const r=await fetch(`${''}/api/influence/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({objective,audience,current_influence:currentInfluence})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#7c3aed,#dc2626)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building Plan...':'Build My Influence Plan'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#0a0a1a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Audience Psychology:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}><div><strong style={{color:'#60a5fa',fontSize:'0.8rem'}}>Motivations:</strong><p style={{color:'#93c5fd',fontSize:'0.85rem',margin:'0.1rem 0'}}>{result.audience_psychology?.motivations}</p></div><div><strong style={{color:'#f87171',fontSize:'0.8rem'}}>Fears:</strong><p style={{color:'#fca5a5',fontSize:'0.85rem',margin:'0.1rem 0'}}>{result.audience_psychology?.fears}</p></div></div></div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#4ade80'}}>Credibility Builders:</strong>{result.credibility_builders?.map((c:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{c}</li>)}</div>
                {result.persuasion_scripts?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>Persuasion Scripts:</strong>{result.persuasion_scripts.map((s:any,i:number)=><div key={i} style={{background:'#1a1a0a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><strong style={{color:'#fbbf24',fontSize:'0.85rem'}}>{s.scenario}:</strong><p style={{color:'#fde68a',fontSize:'0.9rem',fontStyle:'italic',margin:'0.25rem 0',whiteSpace:'pre-wrap'}}>{s.script}</p></div>)}</div>}
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>Objection Handling:</strong>{result.objection_handling?.map((o:any,i:number)=><div key={i} style={{background:'#1a0a0a',borderRadius:'6px',padding:'0.5rem',margin:'0.25rem 0'}}><em style={{color:'#f87171',fontSize:'0.85rem'}}>{o.objection||o}</em>{o.response&&<p style={{color:'#fca5a5',fontSize:'0.85rem',margin:'0.1rem 0'}}>{o.response}</p>}</div>)}</div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Ethics Check:</strong>{result.ethics_check?.map((q:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{q}</li>)}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_passiveincome() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [capital, setCapital] = React.useState('');
          const [skills, setSkills] = React.useState('');
          const [timePerWeek, setTimePerWeek] = React.useState('');
          const [risk, setRisk] = React.useState('moderate');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>💰 Passive Income Planner</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Build your personalized passive income strategy</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={capital} onChange={e=>setCapital(e.target.value)} placeholder="Available capital (e.g. $5,000, $50,000)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Your skills (e.g. writing, coding, design, finance)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={timePerWeek} onChange={e=>setTimePerWeek(e.target.value)} placeholder="Time available per week (e.g. 5, 10, 20 hours)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <select value={risk} onChange={e=>setRisk(e.target.value)} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}}>
                  <option value="low">Low Risk</option>
                  <option value="moderate">Moderate Risk</option>
                  <option value="high">High Risk / High Reward</option>
                </select>
              </div>
              <button onClick={async()=>{if(!capital||!skills||!timePerWeek)return;setLoading(true);try{const r=await fetch(`${''}/api/passive/income`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({available_capital:capital,skills,time_per_week:timePerWeek,risk_tolerance:risk})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Building Plan...':'Build My Passive Income Plan'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  <h3 style={{color:'#f59e0b',marginBottom:'1rem'}}>💰 Your Income Streams</h3>
                  {result.income_streams?.map((s:any,i:number)=>(
                    <div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'1rem',marginBottom:'0.75rem',borderLeft:'3px solid #f59e0b'}}>
                      <div style={{fontWeight:'bold',color:'white'}}>{s.name} <span style={{color:'#10b981',fontSize:'0.875rem'}}>({s.type})</span></div>
                      <div style={{color:'#9ca3af',fontSize:'0.875rem',margin:'0.5rem 0'}}>💵 {s.monthly_income_potential}/mo • ⏱ {s.time_to_first_dollar} • 💪 {s.effort_level}</div>
                      <div style={{color:'#d1d5db',fontSize:'0.875rem'}}>{s.how_to_start}</div>
                    </div>
                  ))}
                  {result.recommended_stack&&<div style={{marginTop:'1rem',padding:'1rem',background:'rgba(245,158,11,0.1)',borderRadius:'0.5rem'}}><span style={{color:'#f59e0b',fontWeight:'bold'}}>Recommended Stack: </span><span style={{color:'white'}}>{result.recommended_stack}</span></div>}
                  {result.total_income_potential_12_months&&<div style={{marginTop:'0.75rem',padding:'0.75rem',background:'rgba(16,185,129,0.1)',borderRadius:'0.5rem',textAlign:'center',fontSize:'1.125rem',fontWeight:'bold',color:'#10b981'}}>12-Month Potential: {result.total_income_potential_12_months}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_taxstrategy() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [incomeType, setIncomeType] = React.useState('');
          const [annualIncome, setAnnualIncome] = React.useState('');
          const [situation, setSituation] = React.useState('');
          const [country, setCountry] = React.useState('US');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🧾 Tax Strategist</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Educational tax optimization strategies (not financial advice)</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={incomeType} onChange={e=>setIncomeType(e.target.value)} placeholder="Income type (e.g. W2 employee, self-employed, investor)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={annualIncome} onChange={e=>setAnnualIncome(e.target.value)} placeholder="Annual income (e.g. $75,000, $200,000)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="Your situation (married? kids? own a home? side business?)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!incomeType||!annualIncome)return;setLoading(true);try{const r=await fetch(`${''}/api/tax/strategy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({income_type:incomeType,annual_income:annualIncome,situation,country})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Analyzing...':'Get Tax Strategy'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.disclaimer&&<div style={{background:'rgba(245,158,11,0.1)',border:'1px solid #f59e0b',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'1rem',color:'#fbbf24',fontSize:'0.875rem'}}>{result.disclaimer}</div>}
                  <h3 style={{color:'#3b82f6',marginBottom:'1rem'}}>💡 Missed Deductions</h3>
                  {result.commonly_missed_deductions?.map((d:any,i:number)=>(
                    <div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'0.5rem'}}>
                      <div style={{fontWeight:'bold',color:'white'}}>{d.deduction}</div>
                      <div style={{color:'#9ca3af',fontSize:'0.875rem'}}>{d.who_qualifies} • <span style={{color:'#10b981'}}>{d.estimated_savings}</span></div>
                    </div>
                  ))}
                  {result.estimated_tax_savings_range&&<div style={{marginTop:'1rem',padding:'0.75rem',background:'rgba(59,130,246,0.1)',borderRadius:'0.5rem',textAlign:'center',color:'#3b82f6',fontWeight:'bold'}}>Potential Savings: {result.estimated_tax_savings_range}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_investthesis() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [asset, setAsset] = React.useState('');
          const [horizon, setHorizon] = React.useState('');
          const [bullCase, setBullCase] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>📈 Investment Thesis Builder</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Build a structured investment thesis (educational only)</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={asset} onChange={e=>setAsset(e.target.value)} placeholder="Asset or company (e.g. Tesla, Bitcoin, S&P 500 index, real estate)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={horizon} onChange={e=>setHorizon(e.target.value)} placeholder="Investment horizon (e.g. 2 years, 5 years, 10+ years)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <textarea value={bullCase} onChange={e=>setBullCase(e.target.value)} placeholder="Your bull case belief (why do you think this could go up?)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
              </div>
              <button onClick={async()=>{if(!asset||!horizon)return;setLoading(true);try{const r=await fetch(`${''}/api/investment/thesis`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({asset_or_company:asset,investment_horizon:horizon,bull_case_belief:bullCase})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Building Thesis...':'Build Investment Thesis'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.disclaimer&&<div style={{background:'rgba(245,158,11,0.1)',border:'1px solid #f59e0b',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'1rem',color:'#fbbf24',fontSize:'0.875rem'}}>{result.disclaimer}</div>}
                  <div style={{display:'grid',gap:'1rem'}}>
                    {result.bull_case&&<div style={{background:'rgba(16,185,129,0.1)',borderRadius:'0.5rem',padding:'1rem'}}><h4 style={{color:'#10b981',marginBottom:'0.5rem'}}>🐂 Bull Case</h4>{result.bull_case.catalysts?.map((c:string,i:number)=><div key={i} style={{color:'#d1d5db',fontSize:'0.875rem'}}>• {c}</div>)}</div>}
                    {result.bear_case&&<div style={{background:'rgba(239,68,68,0.1)',borderRadius:'0.5rem',padding:'1rem'}}><h4 style={{color:'#ef4444',marginBottom:'0.5rem'}}>🐻 Bear Case / Risks</h4>{result.bear_case.key_risks?.map((r:string,i:number)=><div key={i} style={{color:'#d1d5db',fontSize:'0.875rem'}}>• {r}</div>)}</div>}
                    {result.conviction_score&&<div style={{textAlign:'center',padding:'1rem',background:'rgba(59,130,246,0.1)',borderRadius:'0.5rem'}}><div style={{fontSize:'2rem',fontWeight:'bold',color:'#3b82f6'}}>{result.conviction_score}/10</div><div style={{color:'#9ca3af',fontSize:'0.875rem'}}>Conviction Score</div></div>}
                  </div>
                </div>
              )}
            </div>
          );
}

export function ForgeTab_wealthgap() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [netWorth, setNetWorth] = React.useState('');
          const [income, setIncome] = React.useState('');
          const [age, setAge] = React.useState('');
          const [goal, setGoal] = React.useState('');
          const [timeline, setTimeline] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🏦 Wealth Gap Analyzer</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Understand your wealth gap and how to close it</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={netWorth} onChange={e=>setNetWorth(e.target.value)} placeholder="Current net worth (e.g. $50,000, -$20,000)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={income} onChange={e=>setIncome(e.target.value)} placeholder="Annual income (e.g. $80,000)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={age} onChange={e=>setAge(e.target.value)} placeholder="Your age" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Wealth goal (e.g. $2,000,000 by retirement, financial independence)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={timeline} onChange={e=>setTimeline(e.target.value)} placeholder="Timeline (e.g. 20 years, by age 50)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!netWorth||!income||!goal)return;setLoading(true);try{const r=await fetch(`${''}/api/wealth/gap`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_net_worth:netWorth,income,age,wealth_goal:goal,timeline})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Analyzing Gap...':'Analyze My Wealth Gap'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.gap_amount&&<div style={{textAlign:'center',marginBottom:'1.5rem',padding:'1rem',background:'rgba(139,92,246,0.1)',borderRadius:'0.5rem'}}><div style={{fontSize:'1.5rem',fontWeight:'bold',color:'#8b5cf6'}}>{result.gap_amount}</div><div style={{color:'#9ca3af'}}>Wealth Gap to Bridge</div><div style={{color:'#6b7280',fontSize:'0.875rem',marginTop:'0.25rem'}}>{result.gap_assessment}</div></div>}
                  <h4 style={{color:'#8b5cf6',marginBottom:'0.75rem'}}>🚀 Acceleration Moves</h4>
                  {result.acceleration_moves?.map((m:string,i:number)=><div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'0.5rem',color:'#d1d5db',fontSize:'0.875rem'}}>• {m}</div>)}
                  {result.milestones&&result.milestones.length>0&&<div style={{marginTop:'1rem'}}><h4 style={{color:'#8b5cf6',marginBottom:'0.75rem'}}>📍 Milestones</h4>{result.milestones.slice(0,4).map((m:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem',background:'#111827',borderRadius:'0.5rem',marginBottom:'0.5rem'}}><span style={{color:'#9ca3af'}}>{m.year}</span><span style={{color:'#10b981'}}>{m.target_net_worth}</span></div>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_moneymind() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [belief, setBelief] = React.useState('');
          const [story, setStory] = React.useState('');
          const [patterns, setPatterns] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🧠 Money Mindset Coach</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Transform your limiting money beliefs</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={belief} onChange={e=>setBelief(e.target.value)} placeholder={`Limiting belief (e.g. "I'm bad with money", "Rich people are greedy")`} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <textarea value={story} onChange={e=>setStory(e.target.value)} placeholder="Your money story (how did you grow up around money?)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <textarea value={patterns} onChange={e=>setPatterns(e.target.value)} placeholder="Current patterns (e.g. overspend, avoid looking at accounts, never invest)" rows={2} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
              </div>
              <button onClick={async()=>{if(!belief)return;setLoading(true);try{const r=await fetch(`${''}/api/money/mindset`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({limiting_belief:belief,money_story:story,current_patterns:patterns})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#ec4899,#be185d)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Coaching...':'Transform My Money Mindset'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.the_truth&&<div style={{background:'rgba(236,72,153,0.1)',borderRadius:'0.5rem',padding:'1rem',marginBottom:'1rem'}}><h4 style={{color:'#ec4899',marginBottom:'0.5rem'}}>✨ The Truth</h4><div style={{color:'white',fontWeight:'500',marginBottom:'0.5rem'}}>{result.the_truth.reframe}</div><div style={{color:'#9ca3af',fontSize:'0.875rem'}}>{result.the_truth.new_belief}</div></div>}
                  {result.affirmations&&<div style={{marginBottom:'1rem'}}><h4 style={{color:'#ec4899',marginBottom:'0.75rem'}}>💪 Your Affirmations</h4>{result.affirmations.map((a:string,i:number)=><div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'0.5rem',color:'#d1d5db',fontStyle:'italic'}}>"{a}"</div>)}</div>}
                  {result.your_new_money_story&&<div style={{background:'rgba(236,72,153,0.05)',border:'1px solid rgba(236,72,153,0.3)',borderRadius:'0.5rem',padding:'1rem'}}><h4 style={{color:'#ec4899',marginBottom:'0.5rem'}}>📖 Your New Money Story</h4><p style={{color:'#d1d5db',lineHeight:'1.6'}}>{result.your_new_money_story}</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_flowoptimize() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [activity, setActivity] = React.useState('');
          const [blockers, setBlockers] = React.useState('');
          const [availableTime, setAvailableTime] = React.useState('');
          const [environment, setEnvironment] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🌊 Flow State Optimizer</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Enter deep flow states on demand</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={activity} onChange={e=>setActivity(e.target.value)} placeholder="What activity needs flow? (e.g. writing, coding, design, studying)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={blockers} onChange={e=>setBlockers(e.target.value)} placeholder="Current blockers (e.g. distractions, anxiety, procrastination)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={availableTime} onChange={e=>setAvailableTime(e.target.value)} placeholder="Available time block (e.g. 2 hours, 4 hours)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={environment} onChange={e=>setEnvironment(e.target.value)} placeholder="Environment (e.g. home office, cafe, open office)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!activity)return;setLoading(true);try{const r=await fetch(`${''}/api/flow/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({activity,current_blockers:blockers,available_time:availableTime,environment})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#06b6d4,#0891b2)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Optimizing...':'Build My Flow Protocol'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  <h3 style={{color:'#06b6d4',marginBottom:'1rem'}}>🌊 Pre-Flow Ritual</h3>
                  {result.pre_flow_ritual?.map((s:any,i:number)=>(
                    <div key={i} style={{display:'flex',gap:'1rem',alignItems:'flex-start',background:'#111827',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'0.5rem'}}>
                      <span style={{color:'#06b6d4',fontWeight:'bold',minWidth:'1.5rem'}}>{i+1}.</span>
                      <div><div style={{color:'white',fontWeight:'500'}}>{s.step} <span style={{color:'#9ca3af',fontWeight:'normal',fontSize:'0.875rem'}}>({s.duration})</span></div><div style={{color:'#6b7280',fontSize:'0.875rem'}}>{s.purpose}</div></div>
                    </div>
                  ))}
                  {result.flow_session_structure&&<div style={{marginTop:'1rem',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem'}}>{Object.entries(result.flow_session_structure).map(([k,v]:any)=><div key={k} style={{background:'rgba(6,182,212,0.1)',borderRadius:'0.5rem',padding:'0.75rem',textAlign:'center'}}><div style={{color:'#06b6d4',fontWeight:'bold'}}>{v}</div><div style={{color:'#9ca3af',fontSize:'0.75rem'}}>{k.replace(/_/g,' ')}</div></div>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_cogenhance() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
          const [limitations, setLimitations] = React.useState('');
          const [lifestyle, setLifestyle] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🧬 Cognitive Enhancer</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Evidence-based protocol to upgrade your brain</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Performance goal (e.g. sharper focus, better memory, faster thinking)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={limitations} onChange={e=>setLimitations(e.target.value)} placeholder="Current limitations (e.g. brain fog, poor sleep, ADHD tendencies)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <textarea value={lifestyle} onChange={e=>setLifestyle(e.target.value)} placeholder="Current lifestyle (sleep, exercise, diet, stress levels)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
              </div>
              <button onClick={async()=>{if(!goal)return;setLoading(true);try{const r=await fetch(`${''}/api/cognitive/enhance`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({performance_goal:goal,current_limitations:limitations,lifestyle})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#a855f7,#7c3aed)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Building Protocol...':'Build Cognitive Protocol'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  <h3 style={{color:'#a855f7',marginBottom:'1rem'}}>🔬 Evidence-Based Interventions</h3>
                  {result.evidence_based_interventions?.map((i:any,idx:number)=>(
                    <div key={idx} style={{background:'#111827',borderRadius:'0.5rem',padding:'1rem',marginBottom:'0.75rem',borderLeft:`3px solid ${i.evidence_level==='High'?'#10b981':i.evidence_level==='Moderate'?'#f59e0b':'#6b7280'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}><span style={{fontWeight:'bold',color:'white'}}>{i.intervention}</span><span style={{fontSize:'0.75rem',padding:'0.2rem 0.5rem',background:'rgba(168,85,247,0.2)',color:'#a855f7',borderRadius:'9999px'}}>{i.evidence_level}</span></div>
                      <div style={{color:'#9ca3af',fontSize:'0.875rem',marginBottom:'0.25rem'}}>{i.mechanism}</div>
                      <div style={{color:'#10b981',fontSize:'0.875rem'}}>{i.expected_benefit} · {i.timeframe}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_mentalmodels() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [problem, setProblem] = React.useState('');
          const [domain, setDomain] = React.useState('');
          const [goal, setGoal] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🗺️ Mental Models Builder</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Apply Munger-style mental models to any problem</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={problem} onChange={e=>setProblem(e.target.value)} placeholder="Problem or situation (describe it in detail)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="Domain (e.g. business, personal, career, investing, relationships)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="What\'s your goal here?" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!problem)return;setLoading(true);try{const r=await fetch(`${''}/api/mental/models`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({problem_or_situation:problem,domain,goal})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Applying Models...':'Apply Mental Models'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  <h3 style={{color:'#f97316',marginBottom:'1rem'}}>🧠 Mental Models Applied</h3>
                  {result.mental_models_applied?.map((m:any,i:number)=>(
                    <div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'1rem',marginBottom:'0.75rem'}}>
                      <div style={{fontWeight:'bold',color:'#f97316'}}>{m.model_name} <span style={{color:'#6b7280',fontSize:'0.8rem',fontWeight:'normal'}}>({m.origin_discipline})</span></div>
                      <div style={{color:'#9ca3af',fontSize:'0.875rem',margin:'0.25rem 0'}}>{m.core_principle}</div>
                      <div style={{color:'white',fontSize:'0.875rem',margin:'0.5rem 0'}}><strong>Applied:</strong> {m.how_it_applies_here}</div>
                      <div style={{color:'#10b981',fontSize:'0.875rem'}}><strong>Action:</strong> {m.action_implication}</div>
                    </div>
                  ))}
                  {result.synthesis?.recommended_action&&<div style={{marginTop:'1rem',padding:'1rem',background:'rgba(249,115,22,0.1)',borderRadius:'0.5rem'}}><strong style={{color:'#f97316'}}>Recommended Action:</strong><p style={{color:'white',margin:'0.5rem 0 0'}}>{result.synthesis.recommended_action}</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_decisionspeed() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [decision, setDecision] = React.useState('');
          const [stakes, setStakes] = React.useState('moderate');
          const [timePressure, setTimePressure] = React.useState('');
          const [info, setInfo] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>⚡ Decision Speed Trainer</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Make faster, better decisions with confidence</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={decision} onChange={e=>setDecision(e.target.value)} placeholder="What decision are you facing?" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <select value={stakes} onChange={e=>setStakes(e.target.value)} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}}>
                  <option value="low">Low Stakes</option>
                  <option value="moderate">Moderate Stakes</option>
                  <option value="high">High Stakes</option>
                  <option value="critical">Critical / Life-Changing</option>
                </select>
                <input value={timePressure} onChange={e=>setTimePressure(e.target.value)} placeholder="Time pressure (e.g. must decide today, 1 week, no deadline)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <textarea value={info} onChange={e=>setInfo(e.target.value)} placeholder="What info do you have? What\'s uncertain?" rows={2} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
              </div>
              <button onClick={async()=>{if(!decision)return;setLoading(true);try{const r=await fetch(`${''}/api/decision/speed`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({decision,stakes,time_pressure:timePressure,available_info:info})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#eab308,#ca8a04)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Deciding...':'Get Decision Framework'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.recommended_decision&&<div style={{textAlign:'center',marginBottom:'1.5rem',padding:'1.5rem',background:'rgba(234,179,8,0.1)',borderRadius:'0.75rem',border:'2px solid rgba(234,179,8,0.3)'}}><div style={{color:'#eab308',fontWeight:'bold',fontSize:'1.125rem',marginBottom:'0.5rem'}}>✅ Recommended Decision</div><div style={{color:'white',fontSize:'1rem'}}>{result.recommended_decision}</div><div style={{color:'#9ca3af',fontSize:'0.875rem',marginTop:'0.5rem'}}>Confidence: {result.confidence_level}</div></div>}
                  {result['10_10_10_analysis']&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'1rem'}}>{Object.entries(result['10_10_10_analysis']).map(([k,v]:any)=><div key={k} style={{background:'#111827',borderRadius:'0.5rem',padding:'0.75rem',textAlign:'center'}}><div style={{color:'#eab308',fontWeight:'bold',fontSize:'0.875rem'}}>{k}</div><div style={{color:'#d1d5db',fontSize:'0.8rem',marginTop:'0.5rem'}}>{v}</div></div>)}</div>}
                  {result.what_to_do_next_5_minutes&&<div style={{marginTop:'0.75rem'}}><h4 style={{color:'#eab308',marginBottom:'0.5rem'}}>⚡ Next 5 Minutes:</h4>{result.what_to_do_next_5_minutes.map((a:string,i:number)=><div key={i} style={{color:'#d1d5db',padding:'0.5rem',background:'#111827',borderRadius:'0.5rem',marginBottom:'0.375rem',fontSize:'0.875rem'}}>{i+1}. {a}</div>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_perfreview63() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [period, setPeriod] = React.useState('');
          const [wins, setWins] = React.useState('');
          const [losses, setLosses] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [learnings, setLearnings] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>📊 Performance Reviewer</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Deep performance review to accelerate growth</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Period (e.g. Last week, Q1 2024, Last 3 months)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <textarea value={wins} onChange={e=>setWins(e.target.value)} placeholder="Wins & achievements (list them)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <textarea value={losses} onChange={e=>setLosses(e.target.value)} placeholder="Losses, failures & challenges" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <textarea value={goals} onChange={e=>setGoals(e.target.value)} placeholder="Goals you set for this period" rows={2} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <textarea value={learnings} onChange={e=>setLearnings(e.target.value)} placeholder="Key things you learned" rows={2} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
              </div>
              <button onClick={async()=>{if(!period||!wins)return;setLoading(true);try{const r=await fetch(`${''}/api/performance/review`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({period,wins,losses,goals_set:goals,key_learnings:learnings})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#14b8a6,#0d9488)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Reviewing...':'Run Performance Review'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  <div style={{textAlign:'center',marginBottom:'1.5rem'}}><div style={{fontSize:'3rem',fontWeight:'bold',color:'#14b8a6'}}>{result.performance_score}/10</div><div style={{color:'#9ca3af'}}>Performance Score</div><p style={{color:'#d1d5db',marginTop:'0.5rem',fontSize:'0.875rem'}}>{result.performance_summary}</p></div>
                  {result.blind_spots&&<div style={{marginBottom:'1rem',padding:'1rem',background:'rgba(245,158,11,0.1)',borderRadius:'0.5rem'}}><h4 style={{color:'#f59e0b',marginBottom:'0.5rem'}}>🔍 Blind Spots</h4>{result.blind_spots.map((b:string,i:number)=><div key={i} style={{color:'#d1d5db',fontSize:'0.875rem',padding:'0.25rem 0'}}>• {b}</div>)}</div>}
                  {result.one_thing_that_will_change_everything&&<div style={{padding:'1rem',background:'rgba(20,184,166,0.1)',border:'2px solid rgba(20,184,166,0.3)',borderRadius:'0.5rem'}}><h4 style={{color:'#14b8a6',marginBottom:'0.5rem'}}>🚀 The One Thing</h4><p style={{color:'white'}}>{result.one_thing_that_will_change_everything}</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_attractbuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [person, setPerson] = React.useState('');
          const [approach, setApproach] = React.useState('');
          const [want, setWant] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>💘 Attraction Builder</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Ethical strategies to build genuine connection and attraction</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="Describe the situation (how you met, where things stand)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <textarea value={person} onChange={e=>setPerson(e.target.value)} placeholder="About them (personality, interests, what you know)" rows={2} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <input value={approach} onChange={e=>setApproach(e.target.value)} placeholder="Your current approach (what have you been doing?)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={want} onChange={e=>setWant(e.target.value)} placeholder="What do you want? (date, relationship, friendship)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!situation)return;setLoading(true);try{const r=await fetch(`${''}/api/attraction/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation,target_person:person,your_current_approach:approach,what_you_want:want})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#f43f5e,#e11d48)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Analyzing...':'Get Attraction Strategy'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.situation_read&&<div style={{background:'rgba(244,63,94,0.1)',borderRadius:'0.5rem',padding:'1rem',marginBottom:'1rem'}}><h4 style={{color:'#f43f5e',marginBottom:'0.5rem'}}>🔍 Situation Read</h4><p style={{color:'#d1d5db'}}>{result.situation_read}</p></div>}
                  <h4 style={{color:'#f43f5e',marginBottom:'0.75rem'}}>✨ Attraction Builders</h4>
                  {result.attraction_builders?.map((a:any,i:number)=>(
                    <div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'1rem',marginBottom:'0.75rem'}}>
                      <div style={{fontWeight:'bold',color:'white',marginBottom:'0.25rem'}}>{a.action}</div>
                      <div style={{color:'#9ca3af',fontSize:'0.875rem',marginBottom:'0.5rem'}}>{a.why_it_works}</div>
                      <div style={{color:'#f43f5e',fontSize:'0.875rem'}}>{a.how_to_execute}</div>
                    </div>
                  ))}
                  {result.next_move&&<div style={{marginTop:'1rem',padding:'1rem',background:'rgba(244,63,94,0.15)',border:'1px solid rgba(244,63,94,0.3)',borderRadius:'0.5rem'}}><h4 style={{color:'#f43f5e',marginBottom:'0.5rem'}}>⚡ Next Move</h4><div style={{color:'white'}}><strong>What:</strong> {result.next_move.what}</div><div style={{color:'#9ca3af',fontSize:'0.875rem',marginTop:'0.25rem'}}><strong>When:</strong> {result.next_move.when} · <strong>Expected:</strong> {result.next_move.expected_response}</div></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_relaudit64() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [type, setType] = React.useState('');
          const [duration, setDuration] = React.useState('');
          const [issues, setIssues] = React.useState('');
          const [question, setQuestion] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🔍 Relationship Auditor</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Brutally honest, compassionate relationship analysis</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={type} onChange={e=>setType(e.target.value)} placeholder="Relationship type (romantic partner, marriage, situationship...)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duration (e.g. 6 months, 3 years)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <textarea value={issues} onChange={e=>setIssues(e.target.value)} placeholder="Current issues and challenges (be honest)" rows={4} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What do you most want to know?" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!type||!issues)return;setLoading(true);try{const r=await fetch(`${''}/api/relationship/audit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({relationship_type:type,duration,current_issues:issues,what_you_want_to_know:question})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Auditing...':'Audit My Relationship'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  <div style={{textAlign:'center',marginBottom:'1.5rem'}}><div style={{fontSize:'3rem',fontWeight:'bold',color:result.relationship_health_score>=7?'#10b981':result.relationship_health_score>=4?'#f59e0b':'#ef4444'}}>{result.relationship_health_score}/10</div><div style={{color:'#9ca3af'}}>Relationship Health Score</div><p style={{color:'#d1d5db',marginTop:'0.5rem',fontSize:'0.875rem'}}>{result.overall_assessment}</p></div>
                  {result.honest_verdict&&<div style={{padding:'1rem',background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.3)',borderRadius:'0.5rem',marginBottom:'1rem'}}><h4 style={{color:'#8b5cf6',marginBottom:'0.5rem'}}>💜 Honest Verdict</h4><p style={{color:'#d1d5db'}}>{result.honest_verdict}</p></div>}
                  {result.action_plan&&<div><h4 style={{color:'#8b5cf6',marginBottom:'0.75rem'}}>🗺️ Action Plan</h4>{result.action_plan.map((a:any,i:number)=><div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'0.5rem'}}><div style={{fontWeight:'bold',color:'white'}}>{a.action}</div><div style={{color:'#9ca3af',fontSize:'0.875rem'}}>{a.timeline} · {a.expected_outcome}</div></div>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_firstdate() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [aboutThem, setAboutThem] = React.useState('');
          const [city, setCity] = React.useState('');
          const [budget, setBudget] = React.useState('');
          const [vibe, setVibe] = React.useState('');
          const [interests, setInterests] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>🌹 First Date Planner</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Plan the perfect first date tailored to them</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={aboutThem} onChange={e=>setAboutThem(e.target.value)} placeholder="About them (personality, what you know, how they dress, job)" rows={2} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Your city (e.g. New York, Austin, London)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Budget (e.g. $30, $100, no limit)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={vibe} onChange={e=>setVibe(e.target.value)} placeholder="Vibe you want (casual & fun, romantic, adventurous, intellectual)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={interests} onChange={e=>setInterests(e.target.value)} placeholder="Shared interests (if any)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!aboutThem||!city)return;setLoading(true);try{const r=await fetch(`${''}/api/first/date`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({about_them:aboutThem,your_city:city,budget,vibe,shared_interests:interests})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#ec4899,#be185d)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Planning...':'Plan My Perfect Date'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  <h3 style={{color:'#ec4899',marginBottom:'1rem'}}>🌹 Date Plans</h3>
                  {result.date_plans?.map((p:any,i:number)=>(
                    <div key={i} style={{background:'#111827',borderRadius:'0.75rem',padding:'1.25rem',marginBottom:'1rem',border:'1px solid rgba(236,72,153,0.2)'}}>
                      <div style={{fontWeight:'bold',color:'white',fontSize:'1rem',marginBottom:'0.25rem'}}>Option {i+1}: {p.plan_name}</div>
                      <div style={{color:'#9ca3af',fontSize:'0.875rem',marginBottom:'0.75rem'}}>{p.description} · {p.estimated_cost}</div>
                      {p.schedule?.map((s:any,j:number)=><div key={j} style={{display:'flex',gap:'0.75rem',marginBottom:'0.5rem'}}><span style={{color:'#ec4899',minWidth:'3.5rem',fontSize:'0.875rem'}}>{s.time}</span><div><div style={{color:'white',fontSize:'0.875rem'}}>{s.activity}</div><div style={{color:'#6b7280',fontSize:'0.75rem'}}>{s.why_this_moment_matters}</div></div></div>)}
                    </div>
                  ))}
                  {result.follow_up_text_template&&<div style={{marginTop:'1rem',padding:'1rem',background:'rgba(236,72,153,0.1)',borderRadius:'0.5rem'}}><h4 style={{color:'#ec4899',marginBottom:'0.5rem'}}>📱 Follow-up Text</h4><p style={{color:'#d1d5db',fontStyle:'italic'}}>"{result.follow_up_text_template}"</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_textcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [convo, setConvo] = React.useState('');
          const [context, setContext] = React.useState('');
          const [goal, setGoal] = React.useState('');
          const [theirVibe, setTheirVibe] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>💬 Texting Coach</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Master the art of texting to build attraction</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={convo} onChange={e=>setConvo(e.target.value)} placeholder="Paste the conversation history (most recent messages)" rows={5} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical',fontFamily:'monospace',fontSize:'0.875rem'}} />
                <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Context (how you know them, how long you\'ve been texting)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Your goal (ask them out, keep it going, re-engage after silence)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={theirVibe} onChange={e=>setTheirVibe(e.target.value)} placeholder="Their texting vibe (slow replies, uses emojis, formal, playful)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!convo)return;setLoading(true);try{const r=await fetch(`${''}/api/texting/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({conversation_history:convo,context,goal,their_vibe:theirVibe})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Analyzing...':'Coach My Texting'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.conversation_analysis&&<div style={{textAlign:'center',marginBottom:'1.5rem',padding:'1rem',background:'rgba(59,130,246,0.1)',borderRadius:'0.5rem'}}><div style={{fontSize:'2rem',fontWeight:'bold',color:'#3b82f6'}}>{result.conversation_analysis.their_interest_level}/10</div><div style={{color:'#9ca3af'}}>Their Interest Level</div><div style={{color:'#d1d5db',fontSize:'0.875rem',marginTop:'0.5rem'}}>{result.conversation_analysis.what_theyre_signaling}</div></div>}
                  <h4 style={{color:'#3b82f6',marginBottom:'0.75rem'}}>📱 Next Message Options</h4>
                  {result.next_message_options?.map((m:any,i:number)=>(
                    <div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'1rem',marginBottom:'0.75rem',cursor:'pointer'}} onClick={()=>navigator.clipboard?.writeText(m.message)}>
                      <div style={{color:'white',fontStyle:'italic',marginBottom:'0.5rem'}}>"{m.message}"</div>
                      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}><span style={{background:'rgba(59,130,246,0.2)',color:'#3b82f6',padding:'0.2rem 0.5rem',borderRadius:'9999px',fontSize:'0.75rem'}}>{m.tone}</span><span style={{color:'#9ca3af',fontSize:'0.75rem'}}>{m.why_it_works}</span></div>
                    </div>
                  ))}
                  <div style={{color:'#6b7280',fontSize:'0.75rem',textAlign:'center'}}>Click any message to copy</div>
                </div>
              )}
            </div>
          );
}

export function ForgeTab_breakupanalyze() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [relationship, setRelationship] = React.useState('');
          const [howEnded, setHowEnded] = React.useState('');
          const [feelings, setFeelings] = React.useState('');
          const [whatWant, setWhatWant] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:'1rem'}}>💔 Breakup Analyzer</h2>
              <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Process your breakup, heal faster, grow stronger</p>
              <div style={{display:'grid',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={relationship} onChange={e=>setRelationship(e.target.value)} placeholder="Tell me about the relationship (how long, what it was like)" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <textarea value={howEnded} onChange={e=>setHowEnded(e.target.value)} placeholder="How did it end? What happened?" rows={3} style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white',resize:'vertical'}} />
                <input value={feelings} onChange={e=>setFeelings(e.target.value)} placeholder="How are you feeling right now?" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
                <input value={whatWant} onChange={e=>setWhatWant(e.target.value)} placeholder="What do you want? (move on, get them back, understand what happened)" style={{padding:'0.75rem',borderRadius:'0.5rem',border:'1px solid #d1d5db',background:'#1f2937',color:'white'}} />
              </div>
              <button onClick={async()=>{if(!relationship||!howEnded)return;setLoading(true);try{const r=await fetch(`${''}/api/breakup/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({relationship_summary:relationship,how_it_ended:howEnded,how_you_feel:feelings,what_you_want:whatWant})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#6b7280,#374151)',color:'white',border:'none',borderRadius:'0.5rem',cursor:'pointer',fontWeight:'600',marginBottom:'1.5rem'}}>
                {loading?'Processing...':'Analyze My Breakup'}
              </button>
              {result&&!result.error&&(
                <div style={{background:'#1f2937',borderRadius:'0.75rem',padding:'1.5rem'}}>
                  {result.validation&&<div style={{background:'rgba(107,114,128,0.2)',borderRadius:'0.5rem',padding:'1rem',marginBottom:'1rem'}}><p style={{color:'#d1d5db',fontStyle:'italic'}}>{result.validation}</p></div>}
                  {result.what_actually_happened&&<div style={{background:'rgba(59,130,246,0.1)',borderRadius:'0.5rem',padding:'1rem',marginBottom:'1rem'}}><h4 style={{color:'#3b82f6',marginBottom:'0.5rem'}}>🔎 What Actually Happened</h4><p style={{color:'#d1d5db'}}>{result.what_actually_happened}</p></div>}
                  {result.healing_timeline&&<div style={{marginBottom:'1rem'}}><h4 style={{color:'#10b981',marginBottom:'0.75rem'}}>🌱 8-Week Healing Timeline</h4>{result.healing_timeline.slice(0,4).map((w:any,i:number)=><div key={i} style={{background:'#111827',borderRadius:'0.5rem',padding:'0.75rem',marginBottom:'0.5rem'}}><div style={{fontWeight:'bold',color:'#10b981',fontSize:'0.875rem'}}>Week {w.week}</div><div style={{color:'#9ca3af',fontSize:'0.875rem'}}>{w.what_to_expect}</div><div style={{color:'#d1d5db',fontSize:'0.875rem'}}>{w.what_to_do}</div></div>)}</div>}
                  {result.letter_to_your_past_self&&<div style={{padding:'1rem',background:'rgba(107,114,128,0.1)',border:'1px solid rgba(107,114,128,0.3)',borderRadius:'0.5rem'}}><h4 style={{color:'#9ca3af',marginBottom:'0.5rem'}}>📝 Letter to Your Past Self</h4><p style={{color:'#d1d5db',lineHeight:'1.6',fontStyle:'italic'}}>{result.letter_to_your_past_self}</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_prodnamer() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [prodDesc, setProdDesc] = React.useState('');
  const [prodNiche, setProdNiche] = React.useState('');
  const [nameResult, setNameResult] = React.useState('');
  const [loadingName, setLoadingName] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🏷️ Product Namer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate creative, memorable product names using AI.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Product Description</label>
        <textarea value={prodDesc} onChange={e=>setProdDesc(e.target.value)} placeholder="Describe your product, its benefits, target audience..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:100,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Niche/Industry</label>
        <input value={prodNiche} onChange={e=>setProdNiche(e.target.value)} placeholder="e.g. SaaS, wellness, fintech..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!prodDesc)return;setLoadingName(true);setNameResult('');try{const r=await fetch(`${''}/api/product/name`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({description:prodDesc,niche:prodNiche})});const d=await r.json();setNameResult(d.names||d.result||JSON.stringify(d));}catch(e){setNameResult('Error generating names');}setLoadingName(false);}} disabled={loadingName||!prodDesc} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingName||!prodDesc?0.6:1}}>
          {loadingName?'Generating...':'Generate Names'}
        </button>
      </div>
      {nameResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{nameResult}</div>}
    </div>
  );
}

export function ForgeTab_brandvoice65() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bvBrand, setBvBrand] = React.useState('');
  const [bvAudience, setBvAudience] = React.useState('');
  const [bvTone, setBvTone] = React.useState('');
  const [bvResult, setBvResult] = React.useState('');
  const [loadingBv, setLoadingBv] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🎙️ Brand Voice Creator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Define your brand\'s unique voice and communication style.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Brand Name & Mission</label>
        <input value={bvBrand} onChange={e=>setBvBrand(e.target.value)} placeholder="e.g. Acme — we simplify complex software for teams" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Target Audience</label>
        <input value={bvAudience} onChange={e=>setBvAudience(e.target.value)} placeholder="e.g. startup founders, 25-40, tech-savvy" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Desired Tone</label>
        <input value={bvTone} onChange={e=>setBvTone(e.target.value)} placeholder="e.g. bold, witty, authoritative, friendly" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!bvBrand)return;setLoadingBv(true);setBvResult('');try{const r=await fetch(`${''}/api/brand/voice`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({brand:bvBrand,audience:bvAudience,tone:bvTone})});const d=await r.json();setBvResult(d.voice||d.result||JSON.stringify(d));}catch(e){setBvResult('Error creating brand voice');}setLoadingBv(false);}} disabled={loadingBv||!bvBrand} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingBv||!bvBrand?0.6:1}}>
          {loadingBv?'Creating...':'Create Brand Voice'}
        </button>
      </div>
      {bvResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{bvResult}</div>}
    </div>
  );
}
