'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_landlordadvise() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('landlord');
          const [situation, setSituation] = React.useState('');
          const [propType, setPropType] = React.useState('residential');
          const [jurisdiction, setJurisdiction] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>🔑 Landlord / Tenant Advisor</h2>
              <select value={role} onChange={e=>setRole(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='landlord'>I am the Landlord</option>
                <option value='tenant'>I am the Tenant</option>
              </select>
              <select value={propType} onChange={e=>setPropType(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='residential'>Residential (house/apt)</option>
                <option value='commercial'>Commercial</option>
                <option value='vacation rental'>Vacation Rental</option>
              </select>
              <input placeholder="Jurisdiction (e.g. New York, California, Texas)" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <textarea placeholder="Describe your situation (e.g. tenant hasn\'t paid rent for 2 months, landlord won\'t fix heater, security deposit dispute...)" value={situation} onChange={e=>setSituation(e.target.value)} rows={5} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <button onClick={async()=>{if(!situation)return;setLoading(true);try{const r=await fetch(`${''}/api/landlord/advise`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({role,situation,property_type:propType,jurisdiction})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#7c3aed,#0891b2)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Advising...':'Get Advice'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#1a1a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Assessment:</strong><p style={{color:'#e0e0e0',margin:'0.25rem 0'}}>{result.situation_assessment}</p><div style={{marginTop:'0.5rem',color:'#888',fontSize:'0.9rem'}}>Verdict: {result.verdict}</div></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Your Rights:</strong>{result.your_rights?.map((r:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{r}</li>)}</div>
                  <div style={{background:'#1a1a2a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#60a5fa'}}>Your Obligations:</strong>{result.your_obligations?.map((o:string,i:number)=><li key={i} style={{color:'#93c5fd',fontSize:'0.85rem'}}>{o}</li>)}</div>
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>Recommended Actions:</strong>{result.recommended_actions?.map((a:any,i:number)=><div key={i} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #f59e0b'}}><div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}><span style={{background:'#92400e',borderRadius:'4px',padding:'0.1rem 0.4rem',fontSize:'0.75rem'}}>{a.timeline}</span><strong>{a.action}</strong></div><p style={{color:'#aaa',fontSize:'0.85rem',margin:'0.25rem 0'}}>{a.why}</p></div>)}</div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong>Communication Script:</strong><p style={{color:'#aaa',fontStyle:'italic',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.communication_script}</p></div>
              </div>}
            </div>
          );
}

export function ForgeTab_emotiondecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [feelings, setFeelings] = React.useState('');
          const [intensity, setIntensity] = React.useState('5');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💭 Emotion Decoder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Understand what you\'re feeling and why — with compassion.</p>
              <textarea placeholder="Describe your situation..." value={situation} onChange={e=>setSituation(e.target.value)} rows={4} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="How would you describe your feelings? (e.g. anxious, numb, angry, sad)" value={feelings} onChange={e=>setFeelings(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{marginBottom:'0.75rem'}}><label style={{color:'#888',fontSize:'0.85rem'}}>Intensity: {intensity}/10</label><input type="range" min="1" max="10" value={intensity} onChange={e=>setIntensity(e.target.value)} style={{width:'100%',marginTop:'0.25rem'}} /></div>
              <button onClick={async()=>{if(!situation)return;setLoading(true);try{const r=await fetch(`${''}/api/emotion/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation,feelings,intensity})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#7c3aed,#db2777)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Decoding...':'Decode My Emotions'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',background:'#1a0a2a',borderRadius:'12px',padding:'1.5rem',marginBottom:'1rem',border:'1px solid #4c1d95'}}>
                  <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>💜</div>
                  <div style={{fontSize:'1.5rem',fontWeight:700,color:'#c084fc'}}>{result.primary_emotion}</div>
                  <div style={{display:'flex',gap:'0.5rem',justifyContent:'center',flexWrap:'wrap',marginTop:'0.5rem'}}>
                    {result.secondary_emotions?.map((e:string,i:number)=><span key={i} style={{background:'#2e1065',borderRadius:'12px',padding:'0.2rem 0.6rem',fontSize:'0.8rem',color:'#a78bfa'}}>{e}</span>)}
                  </div>
                </div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#a78bfa'}}>What it\'s telling you:</strong><p style={{color:'#e0e0e0',margin:'0.25rem 0'}}>{result.what_the_emotion_is_telling_you}</p></div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong>Unmet Needs:</strong>{result.unmet_needs?.map((n:string,i:number)=><li key={i} style={{color:'#fbbf24',fontSize:'0.9rem'}}>{n}</li>)}</div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#4ade80'}}>Immediate Relief:</strong>{result.immediate_relief?.map((r:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{r}</li>)}</div>
                <div style={{background:'#0a1a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem',borderLeft:'3px solid #60a5fa'}}><strong style={{color:'#60a5fa'}}>Journaling Prompts:</strong>{result.journaling_prompts?.map((p:string,i:number)=><li key={i} style={{color:'#93c5fd',fontSize:'0.9rem'}}>{p}</li>)}</div>
                <div style={{background:'#1a0a0a',borderRadius:'8px',padding:'0.75rem',borderLeft:'3px solid #f9a8d4',fontStyle:'italic'}}><strong style={{color:'#f9a8d4'}}>Self-Compassion Message:</strong><p style={{color:'#fbcfe8',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.self_compassion_message}</p></div>
              </div>}
            </div>
          );
}

export function ForgeTab_copingtoolkit() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [challenge, setChallenge] = React.useState('');
          const [severity, setSeverity] = React.useState('5');
          const [preferences, setPreferences] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🧰 Coping Toolkit Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Get a personalized toolkit of strategies for what you\'re going through.</p>
              <textarea placeholder="What challenge are you facing? (e.g. anxiety, grief, burnout, loneliness)" value={challenge} onChange={e=>setChallenge(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <div style={{marginBottom:'0.75rem'}}><label style={{color:'#888',fontSize:'0.85rem'}}>Severity: {severity}/10</label><input type="range" min="1" max="10" value={severity} onChange={e=>setSeverity(e.target.value)} style={{width:'100%',marginTop:'0.25rem'}} /></div>
              <input placeholder="Preferences (e.g. no meditation, prefer movement, limited time)" value={preferences} onChange={e=>setPreferences(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!challenge)return;setLoading(true);try{const r=await fetch(`${''}/api/coping/toolkit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({challenge,severity,preferences})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#0891b2,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building...':'Build My Toolkit'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <p style={{color:'#aaa',marginBottom:'1rem'}}>{result.challenge_assessment}</p>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#22d3ee'}}>⚡ Immediate Tools:</strong>{result.immediate_tools?.map((t:any,i:number)=><div key={i} style={{background:'#0a1a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',border:'1px solid #0e7490'}}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{t.name}</strong><span style={{color:'#888',fontSize:'0.8rem'}}>{t.time_needed}</span></div><p style={{color:'#aaa',fontSize:'0.9rem',margin:'0.25rem 0'}}>{t.how_to}</p><em style={{color:'#0891b2',fontSize:'0.8rem'}}>Best when: {t.best_when}</em></div>)}</div>
                {result.grounding_techniques?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>🌱 Grounding Techniques:</strong>{result.grounding_techniques.map((g:any,i:number)=><div key={i} style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><strong>{g.name}</strong>{g.steps?.map((s:string,j:number)=><li key={j} style={{color:'#d8b4fe',fontSize:'0.85rem'}}>{s}</li>)}</div>)}</div>}
                {result.breathing_exercise&&<div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}><strong style={{color:'#4ade80'}}>🫁 {result.breathing_exercise.name}</strong>{result.breathing_exercise.steps?.map((s:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{s}</li>)}<em style={{color:'#888',fontSize:'0.8rem'}}>Duration: {result.breathing_exercise.duration}</em></div>}
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong>Long-Term Practices:</strong>{result.long_term_practices?.map((p:any,i:number)=><div key={i} style={{padding:'0.5rem 0',borderBottom:'1px solid #222'}}><strong style={{fontSize:'0.9rem'}}>{p.practice}</strong><p style={{color:'#888',fontSize:'0.85rem',margin:'0.1rem 0'}}>{p.why_it_helps}</p></div>)}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_innercritic() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [thought, setThought] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🪞 Inner Critic Coach</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Challenge self-critical thoughts with compassion and evidence.</p>
              <textarea placeholder="What is your inner critic saying? (e.g. 'I\'m a failure', 'Nobody likes me', 'I\'ll never be good enough')" value={thought} onChange={e=>setThought(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="Context (optional — what triggered this thought?)" value={context} onChange={e=>setContext(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!thought)return;setLoading(true);try{const r=await fetch(`${''}/api/inner/critic`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({thought,context})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#be185d,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Reframing...':'Challenge This Thought'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#2d1515',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>Critic Type:</strong> {result.critic_type} · <strong style={{color:'#f87171'}}>Pattern:</strong> {result.thought_pattern}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171',fontSize:'0.85rem'}}>Evidence For:</strong>{result.evidence_for?.map((e:string,i:number)=><li key={i} style={{color:'#fca5a5',fontSize:'0.85rem'}}>{e}</li>)}</div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Evidence Against:</strong>{result.evidence_against?.map((e:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{e}</li>)}</div>
                </div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',border:'1px solid #166534'}}><strong style={{color:'#4ade80'}}>Compassionate Reframe:</strong><p style={{color:'#e0e0e0',margin:'0.5rem 0',fontSize:'1rem',lineHeight:'1.6'}}>{result.compassionate_reframe}</p></div>
                <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem',borderLeft:'3px solid #4ade80'}}><strong style={{color:'#86efac'}}>What a good friend would say:</strong><p style={{color:'#e0e0e0',fontStyle:'italic',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.what_a_good_friend_would_say}</p></div>
                <div style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#c084fc'}}>Healthier Belief:</strong><p style={{color:'#d8b4fe',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.healthier_belief}</p></div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',textAlign:'center'}}><strong style={{color:'#fbbf24'}}>Mantra: </strong><em style={{color:'#fde68a',fontSize:'1rem'}}>"{result.mantra}"</em></div>
              </div>}
            </div>
          );
}

export function ForgeTab_attachcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pattern, setPattern] = React.useState('');
          const [relType, setRelType] = React.useState('romantic');
          const [behaviors, setBehaviors] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💞 Attachment Style Coach</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Understand your attachment patterns and heal toward secure connection.</p>
              <select value={pattern} onChange={e=>setPattern(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value=''>Select your attachment style (or best guess)</option>
                <option value='anxious'>Anxious / Preoccupied</option>
                <option value='avoidant'>Avoidant / Dismissive</option>
                <option value='disorganized'>Disorganized / Fearful</option>
                <option value='secure'>Secure (want to maintain)</option>
                <option value='not sure'>Not Sure</option>
              </select>
              <select value={relType} onChange={e=>setRelType(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='romantic'>Romantic Relationships</option>
                <option value='friendships'>Friendships</option>
                <option value='family'>Family</option>
                <option value='work'>Work/Professional</option>
              </select>
              <textarea placeholder="Describe behaviors you\'ve noticed (e.g. I get clingy, I pull away when someone gets close, I fear abandonment...)" value={behaviors} onChange={e=>setBehaviors(e.target.value)} rows={4} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <button onClick={async()=>{if(!pattern)return;setLoading(true);try{const r=await fetch(`${''}/api/attachment/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({pattern,relationship_type:relType,behaviors})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#db2777,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Coaching...':'Get Attachment Coaching'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',background:'#1a0a1a',borderRadius:'12px',padding:'1rem',marginBottom:'1rem'}}><div style={{fontSize:'1.25rem',fontWeight:700,color:'#f9a8d4'}}>{result.attachment_style}</div><p style={{color:'#aaa',fontSize:'0.9rem'}}>{result.style_description}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#2d1515',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171',fontSize:'0.85rem'}}>Core Wounds:</strong>{result.core_wounds?.map((w:string,i:number)=><li key={i} style={{color:'#fca5a5',fontSize:'0.85rem'}}>{w}</li>)}</div>
                  <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Secure Traits to Build:</strong>{result.secure_attachment_traits?.map((t:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{t}</li>)}</div>
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Healing Practices:</strong>{result.healing_practices?.map((p:any,i:number)=><div key={i} style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{p.practice}</strong><span style={{color:'#888',fontSize:'0.8rem'}}>{p.timeline}</span></div><p style={{color:'#d8b4fe',fontSize:'0.85rem',margin:'0.25rem 0'}}>{p.how_to}</p></div>)}</div>
                {result.communication_scripts?.length>0&&<div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong>Communication Scripts:</strong>{result.communication_scripts.map((s:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><em style={{color:'#888',fontSize:'0.85rem'}}>{s.situation}:</em><p style={{color:'#e0e0e0',fontSize:'0.9rem',fontStyle:'italic'}}>"{s.script}"</p></div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_resiliencebuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [setback, setSetback] = React.useState('');
          const [currentState, setCurrentState] = React.useState('');
          const [strengths, setStrengths] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💪 Resilience Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Rebuild after hardship with a personalized resilience roadmap.</p>
              <textarea placeholder="What setback are you recovering from? (e.g. job loss, breakup, health crisis, failure)" value={setback} onChange={e=>setSetback(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="Current emotional state (e.g. devastated, numb, slowly recovering)" value={currentState} onChange={e=>setCurrentState(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Known strengths (optional — e.g. I\'m adaptable, I have good friends)" value={strengths} onChange={e=>setStrengths(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!setback)return;setLoading(true);try{const r=await fetch(`${''}/api/resilience/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({setback,current_state:currentState,strengths})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#059669,#1d4ed8)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building...':'Build My Resilience Plan'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#0a1a1a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',borderLeft:'3px solid #22d3ee',fontStyle:'italic'}}><p style={{color:'#e0e0e0',margin:0}}>{result.validation}</p></div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>Strengths Inventory:</strong><div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.5rem'}}>{result.strengths_inventory?.map((s:string,i:number)=><span key={i} style={{background:'#1a2a0a',borderRadius:'12px',padding:'0.25rem 0.75rem',fontSize:'0.85rem',color:'#86efac',border:'1px solid #166534'}}>{s}</span>)}</div></div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>Rebuilding Roadmap:</strong>{result.rebuilding_roadmap?.map((w:any,i:number)=><div key={i} style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #1d4ed8'}}><strong style={{color:'#60a5fa'}}>{w.week}: </strong><span>{w.focus}</span>{w.actions?.map((a:string,j:number)=><li key={j} style={{color:'#93c5fd',fontSize:'0.85rem'}}>{a}</li>)}</div>)}</div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#4ade80'}}>Growth Opportunities:</strong>{result.growth_opportunities?.map((g:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{g}</li>)}</div>
                <div style={{background:'#1a0a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem',border:'1px solid #4c1d95'}}><strong style={{color:'#c084fc'}}>Letter From Your Future Self:</strong><p style={{color:'#d8b4fe',fontStyle:'italic',fontSize:'0.9rem',margin:'0.5rem 0'}}>{result.letter_from_future_self}</p></div>
                <div style={{textAlign:'center',background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24'}}>Your Mantra: </strong><em style={{color:'#fde68a'}}>"{result.mantra}"</em></div>
              </div>}
            </div>
          );
}

export function ForgeTab_storyworld() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [genre, setGenre] = React.useState('');
          const [premise, setPremise] = React.useState('');
          const [style, setStyle] = React.useState('cinematic');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📖 Story World Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Generate a complete story world with characters, plot, and your first chapter.</p>
              <select value={genre} onChange={e=>setGenre(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value=''>Select Genre</option>
                {['Fantasy','Science Fiction','Thriller','Romance','Horror','Mystery','Literary Fiction','Historical Fiction','Dystopian','Adventure'].map(g=><option key={g} value={g}>{g}</option>)}
              </select>
              <textarea placeholder="Your premise or story idea (e.g. 'A lighthouse keeper discovers their lighthouse is a prison for ancient sea gods')" value={premise} onChange={e=>setPremise(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <select value={style} onChange={e=>setStyle(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                {['cinematic','literary','fast-paced thriller','dark and atmospheric','whimsical','gritty realism'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={async()=>{if(!genre||!premise)return;setLoading(true);try{const r=await fetch(`${''}/api/story/world`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({genre,premise,style})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#7c3aed,#1d4ed8)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building World...':'Build My Story World'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1.5rem'}}><div style={{fontSize:'1.75rem',fontWeight:700,color:'#c084fc'}}>{result.title}</div><div style={{color:'#888',fontStyle:'italic'}}>{result.tagline}</div></div>
                <div style={{background:'#1a0a2a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',borderLeft:'4px solid #7c3aed'}}><strong>Opening Hook:</strong><p style={{color:'#e0e0e0',fontStyle:'italic',fontSize:'0.95rem'}}>{result.opening_hook}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Protagonist</strong><div style={{color:'#86efac',fontSize:'0.9rem',marginTop:'0.25rem'}}><strong>{result.protagonist?.name}</strong>, {result.protagonist?.age}</div><p style={{color:'#aaa',fontSize:'0.85rem'}}>{result.protagonist?.motivation}</p><em style={{color:'#f87171',fontSize:'0.8rem'}}>Flaw: {result.protagonist?.flaw}</em></div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171'}}>Antagonist</strong><div style={{color:'#fca5a5',fontSize:'0.9rem',marginTop:'0.25rem'}}><strong>{result.antagonist?.name}</strong></div><p style={{color:'#aaa',fontSize:'0.85rem'}}>{result.antagonist?.motivation}</p></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  {[{label:'Act 1',content:result.act_1_setup,color:'#60a5fa'},{label:'Act 2',content:result.act_2_conflict,color:'#fbbf24'},{label:'Act 3',content:result.act_3_resolution,color:'#4ade80'}].map(a=><div key={a.label} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:a.color,fontSize:'0.85rem'}}>{a.label}</strong><p style={{color:'#aaa',fontSize:'0.8rem',margin:'0.25rem 0'}}>{a.content}</p></div>)}
                </div>
                <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',border:'1px solid #166534'}}><strong style={{color:'#4ade80'}}>First Chapter Opening:</strong><p style={{color:'#e0e0e0',fontSize:'0.9rem',lineHeight:'1.7',marginTop:'0.5rem',whiteSpace:'pre-wrap'}}>{result.first_chapter_opening}</p></div>
                <div style={{display:'flex',gap:'1rem',fontSize:'0.9rem'}}><span style={{color:'#c084fc'}}>Theme: {result.theme}</span><span style={{color:'#f9a8d4'}}>Core: {result.emotional_core}</span></div>
              </div>}
            </div>
          );
}

export function ForgeTab_lyriccraft() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [theme, setTheme] = React.useState('');
          const [mood, setMood] = React.useState('');
          const [style, setStyle] = React.useState('');
          const [story, setStory] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🎵 Lyric Crafter</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Write complete, professional song lyrics tailored to your vision.</p>
              <input placeholder="Theme (e.g. heartbreak, triumph, nostalgia, revenge, finding yourself)" value={theme} onChange={e=>setTheme(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Mood (e.g. melancholic, anthemic, playful, dark, hopeful)" value={mood} onChange={e=>setMood(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <select value={style} onChange={e=>setStyle(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value=''>Select Genre/Style</option>
                {['Pop','R&B/Soul','Hip-Hop','Country','Rock','Indie Folk','EDM/Dance','Alternative','Gospel','Latin Pop'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <textarea placeholder="Personal story or specific details to draw from (optional)" value={story} onChange={e=>setStory(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <button onClick={async()=>{if(!theme||!mood||!style)return;setLoading(true);try{const r=await fetch(`${''}/api/lyric/craft`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({theme,mood,style,personal_story:story})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#be185d,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Crafting Lyrics...':'Craft My Lyrics'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1rem'}}><div style={{fontSize:'1.4rem',fontWeight:700,color:'#f9a8d4'}}>"{result.song_title}"</div><div style={{color:'#888',fontSize:'0.85rem'}}>{result.genre_style} · {result.tempo_feel}</div></div>
                {[{label:'Verse 1',content:result.verse_1,color:'#60a5fa'},{label:'Pre-Chorus',content:result.pre_chorus,color:'#a78bfa'},{label:'Chorus',content:result.chorus,color:'#f9a8d4'},{label:'Verse 2',content:result.verse_2,color:'#60a5fa'},{label:'Bridge',content:result.bridge,color:'#fbbf24'},{label:'Outro',content:result.outro,color:'#4ade80'}].map(s=>s.content&&<div key={s.label} style={{background:'#1a1a1a',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem',borderLeft:`3px solid ${s.color}`}}><strong style={{color:s.color,fontSize:'0.85rem',textTransform:'uppercase'}}>{s.label}</strong><pre style={{color:'#e0e0e0',fontSize:'0.95rem',fontFamily:'inherit',whiteSpace:'pre-wrap',margin:'0.5rem 0'}}>{s.content}</pre></div>)}
                {result.alternative_chorus&&<div style={{background:'#0a1a2a',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem',border:'1px dashed #1d4ed8'}}><strong style={{color:'#60a5fa',fontSize:'0.85rem'}}>ALTERNATIVE CHORUS</strong><pre style={{color:'#93c5fd',fontSize:'0.95rem',fontFamily:'inherit',whiteSpace:'pre-wrap',margin:'0.5rem 0'}}>{result.alternative_chorus}</pre></div>}
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',fontSize:'0.85rem',color:'#888'}}><strong>Behind the Lyrics: </strong>{result.behind_the_lyrics}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_charforge() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [archetype, setArchetype] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🧙 Character Forge</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Forge deeply complex, unforgettable characters with rich inner lives.</p>
              <select value={archetype} onChange={e=>setArchetype(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value=''>Select Character Archetype</option>
                {['The Hero','The Anti-Hero','The Villain','The Mentor','The Trickster','The Outcast','The Reluctant Leader','The Fallen Angel','The Survivor','The Revolutionary','The Scholar','The Broken Healer'].map(a=><option key={a} value={a}>{a}</option>)}
              </select>
              <textarea placeholder="Story context (e.g. 'Set in a dystopian 2150 where memories are currency')" value={context} onChange={e=>setContext(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <button onClick={async()=>{if(!archetype||!context)return;setLoading(true);try{const r=await fetch(`${''}/api/character/forge`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({archetype,story_context:context})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#92400e,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Forging Character...':'Forge This Character'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1.5rem',background:'#1a0a0a',borderRadius:'12px',padding:'1.5rem',border:'1px solid #4c1d95'}}><div style={{fontSize:'1.75rem',fontWeight:700,color:'#c084fc'}}>{result.name}</div><div style={{color:'#888'}}>{result.age} · {result.archetype}</div><p style={{color:'#aaa',fontStyle:'italic',fontSize:'0.9rem',marginTop:'0.5rem'}}>{result.appearance}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  {[{l:'Core Wound',v:result.core_wound,c:'#f87171'},{l:'Greatest Fear',v:result.greatest_fear,c:'#fb923c'},{l:'Deepest Desire',v:result.deepest_desire,c:'#4ade80'},{l:'Fatal Flaw',v:result.fatal_flaw,c:'#f9a8d4'},{l:'Hidden Strength',v:result.hidden_strength,c:'#60a5fa'},{l:'Moral Code',v:result.moral_code,c:'#a78bfa'}].map(i=><div key={i.l} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:i.c,fontSize:'0.8rem'}}>{i.l}:</strong><p style={{color:'#e0e0e0',fontSize:'0.85rem',margin:'0.25rem 0'}}>{i.v}</p></div>)}
                </div>
                <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem',border:'1px solid #166534'}}><strong style={{color:'#4ade80'}}>Dialogue Sample — Their Voice:</strong><p style={{color:'#e0e0e0',fontStyle:'italic',lineHeight:'1.6',marginTop:'0.5rem',whiteSpace:'pre-wrap'}}>{result.dialogue_sample}</p></div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#fbbf24'}}>What Makes Them Unforgettable:</strong><p style={{color:'#e0e0e0',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.what_makes_them_unforgettable}</p></div>
                <div style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',fontSize:'0.85rem',color:'#888'}}><strong style={{color:'#a78bfa'}}>Character Arc: </strong>{result.character_arc}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_plottwistai() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [story, setStory] = React.useState('');
          const [genre, setGenre] = React.useState('');
          const [tone, setTone] = React.useState('dramatic');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🌀 Plot Twist Engine</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Generate 5 shocking, earned plot twists your readers will never see coming.</p>
              <textarea placeholder="Your story so far... (characters, situation, what readers know)" value={story} onChange={e=>setStory(e.target.value)} rows={5} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={genre} onChange={e=>setGenre(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option value=''>Genre</option>
                  {['Thriller','Mystery','Fantasy','Sci-Fi','Horror','Romance','Drama'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <select value={tone} onChange={e=>setTone(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['dramatic','dark','tragic','hopeful','shocking','emotional','comedic'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!story||!genre)return;setLoading(true);try{const r=await fetch(`${''}/api/plot/twist`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({story_so_far:story,genre,tone})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Generating Twists...':'Generate Plot Twists'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#0a1a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem',borderLeft:'3px solid #60a5fa'}}><strong style={{color:'#60a5fa'}}>Best Twist: </strong>{result.best_twist_recommendation}</div>
                {result.twists?.map((t:any,i:number)=><div key={i} style={{background:'#1a1a1a',borderRadius:'12px',padding:'1rem',marginBottom:'0.75rem',borderLeft:`4px solid hsl(${i*60},70%,60%)`}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}><span style={{background:'#333',borderRadius:'50%',width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.8rem',fontWeight:700}}>{i+1}</span><strong style={{fontSize:'1rem'}}>{t.twist_name}</strong></div>
                  <p style={{color:'#e0e0e0',fontSize:'0.9rem',marginBottom:'0.5rem'}}>{t.the_reveal}</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',fontSize:'0.85rem'}}>
                    <div style={{background:'#0a1a0a',borderRadius:'6px',padding:'0.5rem'}}><strong style={{color:'#4ade80',fontSize:'0.8rem'}}>Clues Already There:</strong><p style={{color:'#86efac',margin:'0.1rem 0'}}>{t.setup_clues_already_present}</p></div>
                    <div style={{background:'#1a0a0a',borderRadius:'6px',padding:'0.5rem'}}><strong style={{color:'#f87171',fontSize:'0.8rem'}}>Emotional Impact:</strong><p style={{color:'#fca5a5',margin:'0.1rem 0'}}>{t.emotional_impact}</p></div>
                  </div>
                </div>)}
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',fontSize:'0.85rem',color:'#aaa'}}><strong>How to Foreshadow: </strong>{result.how_to_foreshadow}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_worldbuildai() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [setting, setSetting] = React.useState('');
          const [era, setEra] = React.useState('');
          const [worldType, setWorldType] = React.useState('fantasy');
          const [tone, setTone] = React.useState('epic');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🌍 World Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Build rich, Tolkien-level fictional worlds with deep lore and story hooks.</p>
              <input placeholder="Setting description (e.g. 'A planet where the sun never sets, covered in eternal twilight forests')" value={setting} onChange={e=>setSetting(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Era (e.g. Ancient, Medieval, Far Future, Post-Apocalyptic)" value={era} onChange={e=>setEra(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <select value={worldType} onChange={e=>setWorldType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['fantasy','sci-fi','dystopian','post-apocalyptic','steampunk','urban fantasy','solarpunk','cosmic horror'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <select value={tone} onChange={e=>setTone(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['epic','dark and gritty','whimsical','hopeful','mysterious','cosmic','romantic'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!setting||!era)return;setLoading(true);try{const r=await fetch(`${''}/api/world/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({setting,era,world_type:worldType,tone})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#065f46,#1d4ed8)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building World...':'Build This World'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{textAlign:'center',marginBottom:'1.5rem'}}><div style={{fontSize:'1.75rem',fontWeight:700,color:'#4ade80'}}>{result.world_name}</div><div style={{color:'#888',fontStyle:'italic'}}>{result.tagline}</div></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Geography</strong><p style={{color:'#86efac',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.geography?.notable_locations}</p></div>
                  <div style={{background:'#1a0a0a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171'}}>History</strong><p style={{color:'#fca5a5',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.history?.founding_myth}</p></div>
                </div>
                {result.magic_or_technology_system&&<div style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#a78bfa'}}>✨ {result.magic_or_technology_system.name}</strong><p style={{color:'#d8b4fe',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.magic_or_technology_system.rules}</p><em style={{color:'#888',fontSize:'0.8rem'}}>Limits: {result.magic_or_technology_system.limitations}</em></div>}
                {result.societies?.length>0&&<div style={{marginBottom:'0.75rem'}}><strong style={{color:'#fbbf24'}}>Societies:</strong>{result.societies.map((s:any,i:number)=><div key={i} style={{background:'#1a1a0a',borderRadius:'6px',padding:'0.5rem',margin:'0.25rem 0'}}><strong>{s.name}</strong>: {s.culture} · <em style={{color:'#888',fontSize:'0.8rem'}}>{s.conflicts}</em></div>)}</div>}
                <div style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#60a5fa'}}>🔮 Hidden Secrets:</strong><p style={{color:'#93c5fd',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.hidden_secrets}</p></div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24'}}>Story Hooks:</strong>{result.story_hooks?.map((h:string,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.85rem'}}>{h}</li>)}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_promotionmap() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [currentRole, setCurrentRole] = React.useState('');
          const [targetRole, setTargetRole] = React.useState('');
          const [timeline, setTimeline] = React.useState('12 months');
          const [industry, setIndustry] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📈 Promotion Roadmap</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Get a data-driven roadmap to your next promotion with concrete actions.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Current role (e.g. Senior Engineer)" value={currentRole} onChange={e=>setCurrentRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Target role (e.g. Engineering Manager)" value={targetRole} onChange={e=>setTargetRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={timeline} onChange={e=>setTimeline(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['6 months','12 months','18 months','2 years','3 years'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <input placeholder="Industry (e.g. Tech, Finance, Healthcare)" value={industry} onChange={e=>setIndustry(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <button onClick={async()=>{if(!currentRole||!targetRole)return;setLoading(true);try{const r=await fetch(`${''}/api/promotion/roadmap`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_role:currentRole,target_role:targetRole,timeline,industry})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building Roadmap...':'Build My Promotion Roadmap'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem',marginBottom:'1rem'}}>
                  {[{l:'Skills Gap',v:result.gap_analysis?.skills_gap,c:'#f87171'},{l:'Experience Gap',v:result.gap_analysis?.experience_gap,c:'#fb923c'},{l:'Visibility Gap',v:result.gap_analysis?.visibility_gap,c:'#fbbf24'},{l:'Relationship Gap',v:result.gap_analysis?.relationship_gap,c:'#a78bfa'}].map(g=><div key={g.l} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',textAlign:'center'}}><div style={{color:g.c,fontSize:'0.75rem',fontWeight:600}}>{g.l}</div><div style={{color:'#e0e0e0',fontSize:'0.8rem',marginTop:'0.25rem'}}>{g.v}</div></div>)}
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>90-Day Plan:</strong>{result['90_day_plan']?.map((p:any,i:number)=><div key={i} style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #1d4ed8'}}><strong style={{color:'#60a5fa'}}>{p.week_range}: </strong>{p.focus}{p.actions?.map((a:string,j:number)=><li key={j} style={{color:'#93c5fd',fontSize:'0.85rem'}}>{a}</li>)}</div>)}</div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#4ade80'}}>⚡ Quick Wins Now:</strong>{result.quick_wins?.map((w:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{w}</li>)}</div>
                <div style={{background:'#1a0a2a',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem'}}><strong style={{color:'#c084fc'}}>Promotion Conversation Script:</strong><p style={{color:'#d8b4fe',fontSize:'0.9rem',fontStyle:'italic',margin:'0.5rem 0',whiteSpace:'pre-wrap'}}>{result.promotion_conversation_script}</p></div>
              </div>}
            </div>
          );
}

export function ForgeTab_salarybench() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
          const [location, setLocation] = React.useState('');
          const [years, setYears] = React.useState('');
          const [skills, setSkills] = React.useState('');
          const [companySize, setCompanySize] = React.useState('mid-size');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💰 Salary Benchmark</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Know exactly what you\'re worth and how to negotiate for it.</p>
              <input placeholder="Job title (e.g. Product Manager)" value={role} onChange={e=>setRole(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Location (e.g. San Francisco, CA)" value={location} onChange={e=>setLocation(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Years of experience" type="number" value={years} onChange={e=>setYears(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <input placeholder="Key skills (e.g. Python, ML, leadership, enterprise sales)" value={skills} onChange={e=>setSkills(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <select value={companySize} onChange={e=>setCompanySize(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='startup'>Startup (1-50)</option><option value='small'>Small (51-200)</option><option value='mid-size'>Mid-size (201-1000)</option><option value='large'>Large (1001-5000)</option><option value='enterprise'>Enterprise (5000+)</option>
              </select>
              <button onClick={async()=>{if(!role||!location||!years)return;setLoading(true);try{const r=await fetch(`${''}/api/salary/benchmark`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({role,location,experience_years:years,skills,company_size:companySize})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#059669,#1d4ed8)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Benchmarking...':'Get My Market Value'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem',marginBottom:'1rem',textAlign:'center'}}>
                  {[{l:'25th %ile',v:result.market_analysis?.p25_salary,c:'#f87171'},{l:'Median',v:result.market_analysis?.p50_salary,c:'#fbbf24'},{l:'75th %ile',v:result.market_analysis?.p75_salary,c:'#4ade80'},{l:'90th %ile',v:result.market_analysis?.p90_salary,c:'#60a5fa'}].map(m=><div key={m.l} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><div style={{color:m.c,fontSize:'0.7rem'}}>{m.l}</div><div style={{fontSize:'1.1rem',fontWeight:700,color:m.c}}>{m.v}</div></div>)}
                </div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}><strong style={{color:'#4ade80'}}>Negotiation Power: </strong>{result.negotiation_power_score}/10 · <strong>Ask: </strong>{result.negotiation_strategy?.opening_ask} · <strong>Target: </strong>{result.negotiation_strategy?.target}</div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>Talking Points:</strong>{result.talking_points?.map((t:string,i:number)=><li key={i} style={{color:'#93c5fd',fontSize:'0.9rem'}}>{t}</li>)}</div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>Benefits to Negotiate:</strong>{result.benefits_to_negotiate?.map((b:any,i:number)=><div key={i} style={{background:'#1a1a0a',borderRadius:'6px',padding:'0.5rem',margin:'0.25rem 0'}}><strong>{b.benefit}</strong> (~{b.typical_value}): {b.negotiation_tip}</div>)}</div>
                <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'1rem',borderLeft:'3px solid #4ade80'}}><strong style={{color:'#4ade80'}}>Script for Asking:</strong><p style={{color:'#86efac',fontStyle:'italic',fontSize:'0.9rem',margin:'0.5rem 0'}}>{result.script_for_asking}</p></div>
              </div>}
            </div>
          );
}

export function ForgeTab_execpresence() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [approach, setApproach] = React.useState('');
          const [goal, setGoal] = React.useState('');
          const [level, setLevel] = React.useState('director');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>👔 Executive Presence Coach</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Command any room with gravitas, clarity, and authentic authority.</p>
              <textarea placeholder="Situation (e.g. 'Presenting to board of directors', 'Leading a difficult team meeting', 'Giving feedback to a senior executive')" value={situation} onChange={e=>setSituation(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <textarea placeholder="Your current approach (how you typically show up in this situation)" value={approach} onChange={e=>setApproach(e.target.value)} rows={2} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Goal (e.g. 'Be seen as VP-ready')" value={goal} onChange={e=>setGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <select value={level} onChange={e=>setLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['individual contributor','manager','director','vp','c-suite'].map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!situation||!approach)return;setLoading(true);try{const r=await fetch(`${''}/api/executive/presence`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation,current_approach:approach,goal,level})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#1e3a5f,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Coaching...':'Coach My Executive Presence'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.5rem',marginBottom:'1rem',textAlign:'center'}}>
                  {[{l:'Gravity',v:result.presence_assessment?.gravity_score},{l:'Clarity',v:result.presence_assessment?.clarity_score},{l:'Authority',v:result.presence_assessment?.authority_score},{l:'Authentic',v:result.presence_assessment?.authenticity_score}].map(s=><div key={s.l} style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><div style={{color:'#888',fontSize:'0.75rem'}}>{s.l}</div><div style={{fontSize:'1.5rem',fontWeight:700,color:Number(s.v)>=7?'#4ade80':Number(s.v)>=5?'#fbbf24':'#f87171'}}>{s.v}</div></div>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171',fontSize:'0.85rem'}}>Currently Projecting:</strong><p style={{color:'#fca5a5',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.what_youre_projecting_now}</p></div>
                  <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Want to Project:</strong><p style={{color:'#86efac',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.what_you_want_to_project}</p></div>
                </div>
                <div style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem',borderLeft:'3px solid #7c3aed'}}><strong style={{color:'#a78bfa'}}>Mindset Reframe:</strong><p style={{color:'#d8b4fe',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.reframe_your_mindset}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#60a5fa',fontSize:'0.85rem'}}>Power Phrases:</strong>{result.key_phrases_to_use?.map((p:string,i:number)=><li key={i} style={{color:'#93c5fd',fontSize:'0.85rem'}}>"{p}"</li>)}</div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171',fontSize:'0.85rem'}}>Avoid These:</strong>{result.phrases_to_avoid?.map((p:string,i:number)=><li key={i} style={{color:'#fca5a5',fontSize:'0.85rem'}}>"{p}"</li>)}</div>
                </div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#4ade80'}}>Body Language:</strong>{result.body_language_adjustments?.map((b:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{b}</li>)}</div>
                <div style={{background:'#1a1a0a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24'}}>Pre-Situation Ritual:</strong><p style={{color:'#fde68a',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.pre_situation_ritual}</p></div>
              </div>}
            </div>
          );
}

export function ForgeTab_offerneg() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [offer, setOffer] = React.useState('');
          const [competing, setCompeting] = React.useState('');
          const [priorities, setPriorities] = React.useState('');
          const [risk, setRisk] = React.useState('medium');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🤝 Offer Negotiator</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Maximize your offer with expert negotiation strategy and word-for-word scripts.</p>
              <textarea placeholder="Offer details (salary, bonus, equity, benefits, role, company...)" value={offer} onChange={e=>setOffer(e.target.value)} rows={4} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="Competing offers (optional — e.g. '$180k from Company B')" value={competing} onChange={e=>setCompeting(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Your priorities (e.g. 'salary first, then equity, flexible work')" value={priorities} onChange={e=>setPriorities(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <select value={risk} onChange={e=>setRisk(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='low'>Low risk tolerance (just want the offer)</option><option value='medium'>Medium (willing to push moderately)</option><option value='high'>High (want to maximize everything)</option>
              </select>
              <button onClick={async()=>{if(!offer||!priorities)return;setLoading(true);try{const r=await fetch(`${''}/api/offer/negotiate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({offer_details:offer,competing_offers:competing,priorities,risk_tolerance:risk})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#059669,#1d4ed8)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building Strategy...':'Build My Negotiation Strategy'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem',background:'#1a1a1a',borderRadius:'8px',padding:'1rem'}}>
                  <div style={{fontSize:'3rem',fontWeight:700,color:result.offer_grade==='A'?'#4ade80':result.offer_grade==='B'?'#60a5fa':result.offer_grade==='C'?'#fbbf24':'#f87171'}}>{result.offer_grade}</div>
                  <div><strong>Total Upside: </strong><span style={{color:'#4ade80'}}>{result.negotiation_potential?.total_upside}</span></div>
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>Negotiation Sequence:</strong>{result.negotiation_sequence?.map((s:any,i:number)=><div key={i} style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #1d4ed8'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>{s.item}</strong><span style={{color:'#888',fontSize:'0.85rem'}}>{s.current} → <span style={{color:'#4ade80'}}>{s.target}</span></span></div><p style={{color:'#93c5fd',fontSize:'0.85rem',fontStyle:'italic',margin:0}}>"{s.script}"</p></div>)}</div>
                {result.email_scripts&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Email Scripts:</strong>{Object.entries(result.email_scripts).map(([k,v]:any)=><div key={k} style={{background:'#1a0a2a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><strong style={{color:'#c084fc',fontSize:'0.85rem',textTransform:'capitalize'}}>{k.replace(/_/g,' ')}:</strong><p style={{color:'#d8b4fe',fontSize:'0.85rem',margin:'0.25rem 0',whiteSpace:'pre-wrap'}}>{v}</p></div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_careerbrand() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [background, setBackground] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [audience, setAudience] = React.useState('');
          const [diff, setDiff] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>⭐ Career Brand Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Build a magnetic personal brand that attracts opportunities and commands respect.</p>
              <textarea placeholder="Your background (role, experience, key achievements, industries)" value={background} onChange={e=>setBackground(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <input placeholder="Career goals (e.g. 'Get a CTO role at a Series B startup')" value={goals} onChange={e=>setGoals(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Target audience (e.g. 'VCs, startup founders, tech leaders')" value={audience} onChange={e=>setAudience(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="What makes you different (e.g. '10x engineer who also closes enterprise deals')" value={diff} onChange={e=>setDiff(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <button onClick={async()=>{if(!background||!goals)return;setLoading(true);try{const r=await fetch(`${''}/api/career/brand`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({background,goals,target_audience:audience,differentiators:diff})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#7c3aed,#db2777)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Building Brand...':'Build My Career Brand'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#1a0a2a',borderRadius:'12px',padding:'1.5rem',marginBottom:'1rem',textAlign:'center',border:'1px solid #4c1d95'}}>
                  <div style={{color:'#c084fc',fontWeight:700,fontSize:'1.1rem',marginBottom:'0.5rem'}}>{result.linkedin_headline}</div>
                  <p style={{color:'#d8b4fe',fontStyle:'italic',fontSize:'0.9rem',margin:'0.5rem 0'}}>{result.brand_statement}</p>
                </div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>LinkedIn About:</strong><p style={{color:'#e0e0e0',fontSize:'0.9rem',lineHeight:'1.6',marginTop:'0.5rem',whiteSpace:'pre-wrap'}}>{result.linkedin_about_section}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'1rem'}}>
                  {result.brand_pillars?.map((p:any,i:number)=><div key={i} style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',textAlign:'center',border:'1px solid #1d4ed8'}}><div style={{color:'#60a5fa',fontSize:'0.8rem',fontWeight:700,textTransform:'uppercase'}}>{p.name||p}</div></div>)}
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>Content Themes:</strong>{result.content_themes?.map((t:string,i:number)=><span key={i} style={{display:'inline-block',background:'#1a1a0a',borderRadius:'12px',padding:'0.25rem 0.75rem',margin:'0.25rem',fontSize:'0.85rem',color:'#fde68a'}}>{t}</span>)}</div>
                <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#4ade80'}}>Visibility Strategy:</strong>{result.visibility_strategy?.slice(0,5).map((s:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{s}</li>)}</div>
                <div style={{background:'#1a1a0a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24'}}>90-Day Launch Plan:</strong>{result['90_day_brand_launch_plan']?.map((w:any,i:number)=><div key={i} style={{padding:'0.25rem 0',borderBottom:'1px solid #222'}}><strong style={{color:'#fbbf24',fontSize:'0.85rem'}}>{w.week}: </strong><span style={{color:'#aaa',fontSize:'0.85rem'}}>{w.focus}</span></div>)}</div>
              </div>}
            </div>
          );
}

export function ForgeTab_conceptdecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [concept, setConcept] = React.useState('');
          const [level, setLevel] = React.useState('intermediate');
          const [ctx, setCtx] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🔬 Concept Decoder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Understand any complex concept perfectly — from quantum physics to Keynesian economics.</p>
              <input placeholder="Concept to decode (e.g. 'Quantum entanglement', 'Black-Scholes model', 'Keynesian multiplier')" value={concept} onChange={e=>setConcept(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={level} onChange={e=>setLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option value='eli5'>ELI5 (5-year-old)</option><option value='beginner'>Beginner</option><option value='intermediate'>Intermediate</option><option value='expert'>Expert</option>
                </select>
                <input placeholder="Context (e.g. 'studying for physics exam', 'investor')" value={ctx} onChange={e=>setCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <button onClick={async()=>{if(!concept)return;setLoading(true);try{const r=await fetch(`${''}/api/concept/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({concept,level,context:ctx})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#0891b2,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Decoding...':'Decode This Concept'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#0a1a2a',borderRadius:'12px',padding:'1.5rem',marginBottom:'1rem',borderLeft:'4px solid #0891b2'}}><div style={{fontSize:'1.3rem',fontWeight:700,color:'#22d3ee',marginBottom:'0.5rem'}}>{result.concept_name}</div><p style={{color:'#e0e0e0',fontStyle:'italic',fontSize:'1rem',margin:'0'}}>{result.one_sentence_summary}</p></div>
                <div style={{background:'#1a1a0a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',borderLeft:'3px solid #fbbf24'}}><strong style={{color:'#fbbf24'}}>💡 Analogy:</strong><p style={{color:'#fde68a',fontSize:'0.95rem',margin:'0.25rem 0'}}>{result.analogy}</p></div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem'}}><strong style={{color:'#4ade80'}}>Core Insight:</strong><p style={{color:'#86efac',fontSize:'0.95rem',margin:'0.25rem 0'}}>{result.core_insight}</p></div>
                {result.explanation_by_level&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#a78bfa'}}>Explanation at Your Level:</strong><p style={{color:'#e0e0e0',fontSize:'0.9rem',lineHeight:'1.6',marginTop:'0.5rem'}}>{result.explanation_by_level[level] || result.explanation_by_level.detailed}</p></div>}
                {result.how_it_works_step_by_step?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>How It Works:</strong>{result.how_it_works_step_by_step.map((s:string,i:number)=><div key={i} style={{display:'flex',gap:'0.75rem',padding:'0.5rem 0',borderBottom:'1px solid #1a1a1a'}}><span style={{color:'#60a5fa',fontWeight:700,minWidth:'20px'}}>{i+1}.</span><span style={{color:'#e0e0e0',fontSize:'0.9rem'}}>{s}</span></div>)}</div>}
                {result.common_misconceptions?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>Common Misconceptions:</strong>{result.common_misconceptions.map((m:any,i:number)=><div key={i} style={{background:'#1a0a0a',borderRadius:'6px',padding:'0.5rem',margin:'0.25rem 0'}}><span style={{color:'#f87171'}}>✗ {m.myth}</span><br/><span style={{color:'#4ade80'}}>✓ {m.truth}</span></div>)}</div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}><div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#c084fc',fontSize:'0.85rem'}}>Related Concepts:</strong>{result.related_concepts?.map((c:string,i:number)=><li key={i} style={{color:'#d8b4fe',fontSize:'0.85rem'}}>{c}</li>)}</div><div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24',fontSize:'0.85rem'}}>Test Yourself:</strong>{result.test_your_understanding?.map((q:any,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.8rem'}}>{q.question||q}</li>)}</div></div>
              </div>}
            </div>
          );
}

export function ForgeTab_researchsynth() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
          const [purpose, setPurpose] = React.useState('');
          const [depth, setDepth] = React.useState('thorough');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>📚 Research Synthesizer</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Get a comprehensive synthesis of any research topic in minutes.</p>
              <input placeholder="Research topic (e.g. 'Impact of sleep on cognitive performance', 'Climate tipping points')" value={topic} onChange={e=>setTopic(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Purpose (e.g. 'academic paper', 'investing decision', 'general curiosity')" value={purpose} onChange={e=>setPurpose(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <select value={depth} onChange={e=>setDepth(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option value='overview'>Quick overview</option><option value='thorough'>Thorough</option><option value='deep'>Deep dive</option>
                </select>
              </div>
              <button onClick={async()=>{if(!topic)return;setLoading(true);try{const r=await fetch(`${''}/api/research/synthesize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic,purpose,depth})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#1d4ed8,#059669)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Synthesizing Research...':'Synthesize Research'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#0a1a0a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',borderLeft:'4px solid #4ade80'}}><strong style={{color:'#4ade80'}}>Executive Summary</strong><p style={{color:'#e0e0e0',fontSize:'0.9rem',lineHeight:'1.6',marginTop:'0.5rem'}}>{result.executive_summary}</p></div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>Key Findings:</strong>{result.key_findings?.map((f:any,i:number)=><div key={i} style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #1d4ed8'}}><strong>{f.finding}</strong><p style={{color:'#93c5fd',fontSize:'0.85rem',margin:'0.25rem 0'}}>{f.evidence}</p><em style={{color:'#60a5fa',fontSize:'0.8rem'}}>Significance: {f.significance}</em></div>)}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Consensus View:</strong><p style={{color:'#86efac',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.consensus_view}</p></div>
                  <div style={{background:'#2a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171',fontSize:'0.85rem'}}>Areas of Debate:</strong><p style={{color:'#fca5a5',fontSize:'0.85rem',margin:'0.25rem 0'}}>{result.areas_of_debate}</p></div>
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#fbbf24'}}>Practical Implications:</strong>{result.practical_implications?.map((p:string,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.9rem'}}>{p}</li>)}</div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#c084fc'}}>What We Still Don\'t Know:</strong><p style={{color:'#d8b4fe',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.what_we_still_dont_know}</p></div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#888',fontSize:'0.85rem'}}>Bottom Line: </strong><span style={{color:'#e0e0e0',fontSize:'0.9rem'}}>{result.bottom_line}</span></div>
              </div>}
            </div>
          );
}

export function ForgeTab_debateprep60() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
          const [position, setPosition] = React.useState('');
          const [format, setFormat] = React.useState('open discussion');
          const [oppArgs, setOppArgs] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🎙️ Debate Preparation</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Win any argument with championship-level preparation and battle-tested scripts.</p>
              <input placeholder="Debate topic (e.g. 'AI will cause mass unemployment', 'Remote work increases productivity')" value={topic} onChange={e=>setTopic(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <input placeholder="Your position (e.g. 'FOR — AI will create more jobs than it destroys')" value={position} onChange={e=>setPosition(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={format} onChange={e=>setFormat(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['open discussion','formal debate','oxford style','panel discussion','social media argument'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
                <input placeholder="Likely opponent arguments (optional)" value={oppArgs} onChange={e=>setOppArgs(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <button onClick={async()=>{if(!topic||!position)return;setLoading(true);try{const r=await fetch(`${''}/api/debate/prep`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic,your_position:position,debate_format:format,opponent_likely_args:oppArgs})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#dc2626,#7c3aed)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Preparing...':'Prep My Debate'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{background:'#1a0a0a',borderRadius:'8px',padding:'1rem',marginBottom:'1rem',borderLeft:'4px solid #dc2626'}}><strong style={{color:'#f87171'}}>Position Statement:</strong><p style={{color:'#fca5a5',fontStyle:'italic',margin:'0.25rem 0'}}>{result.your_position_statement}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24',fontSize:'0.85rem'}}>Opening Statement:</strong><p style={{color:'#fde68a',fontSize:'0.85rem',fontStyle:'italic',margin:'0.25rem 0',whiteSpace:'pre-wrap'}}>{result.opening_statement}</p></div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80',fontSize:'0.85rem'}}>Closing Statement:</strong><p style={{color:'#86efac',fontSize:'0.85rem',fontStyle:'italic',margin:'0.25rem 0',whiteSpace:'pre-wrap'}}>{result.closing_statement}</p></div>
                </div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#60a5fa'}}>Core Arguments:</strong>{result.core_arguments?.map((a:any,i:number)=><div key={i} style={{background:'#0a0a1a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0',borderLeft:'3px solid #1d4ed8'}}><strong>{a.argument}</strong><p style={{color:'#93c5fd',fontSize:'0.85rem',margin:'0.25rem 0'}}>{a.evidence}</p></div>)}</div>
                <div style={{marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>Rebuttals:</strong>{result.rebuttals?.map((r:any,i:number)=><div key={i} style={{background:'#1a0a0a',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><em style={{color:'#f87171',fontSize:'0.85rem'}}>They say: "{r.opponent_argument}"</em><p style={{color:'#fca5a5',fontSize:'0.85rem',margin:'0.25rem 0'}}>You say: {r.your_rebuttal}</p></div>)}</div>
                <div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>🏆 Winning Mindset:</strong><p style={{color:'#86efac',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.winning_mindset}</p></div>
              </div>}
            </div>
          );
}

export function ForgeTab_criticalthink() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [claim, setClaim] = React.useState('');
          const [source, setSource] = React.useState('');
          const [ctx, setCtx] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🧠 Critical Thinker</h2>
              <p style={{color:'#888',marginBottom:'1.5rem',fontSize:'0.9rem'}}>Rigorously analyze any claim — detect fallacies, challenge assumptions, find the truth.</p>
              <textarea placeholder="Claim to analyze (e.g. 'Eating breakfast is essential for metabolism', 'Social media causes depression in teens')" value={claim} onChange={e=>setClaim(e.target.value)} rows={3} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input placeholder="Source (e.g. 'news article', 'my boss', 'study')" value={source} onChange={e=>setSource(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
                <input placeholder="Context (optional)" value={ctx} onChange={e=>setCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              </div>
              <button onClick={async()=>{if(!claim)return;setLoading(true);try{const r=await fetch(`${''}/api/critical/think`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({claim,source,context:ctx})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#374151,#1d4ed8)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Analyzing...':'Analyze This Claim'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem',background:'#1a1a1a',borderRadius:'8px',padding:'1rem'}}>
                  <div style={{textAlign:'center'}}><div style={{fontSize:'0.75rem',color:'#888'}}>Credibility</div><div style={{fontSize:'2rem',fontWeight:700,color:Number(result.credibility_score)>=7?'#4ade80':Number(result.credibility_score)>=4?'#fbbf24':'#f87171'}}>{result.credibility_score}/10</div></div>
                  <div style={{flex:1}}><strong>Verdict: </strong><span style={{color:'#e0e0e0'}}>{result.verdict}</span></div>
                </div>
                {result.logical_fallacies_detected?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>⚠️ Logical Fallacies Detected:</strong>{result.logical_fallacies_detected.map((f:any,i:number)=><div key={i} style={{background:'#1a0a0a',borderRadius:'6px',padding:'0.5rem',margin:'0.25rem 0'}}><strong style={{color:'#f87171'}}>{f.fallacy}</strong><p style={{color:'#fca5a5',fontSize:'0.85rem',margin:'0.1rem 0'}}>{f.explanation}</p></div>)}</div>}
                <div style={{background:'#0a1a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem',borderLeft:'3px solid #60a5fa'}}><strong style={{color:'#60a5fa'}}>Steelman (strongest version):</strong><p style={{color:'#93c5fd',fontSize:'0.9rem',margin:'0.25rem 0'}}>{result.steelman}</p></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#f87171',fontSize:'0.85rem'}}>Counter Arguments:</strong>{result.counter_arguments?.map((c:string,i:number)=><li key={i} style={{color:'#fca5a5',fontSize:'0.85rem'}}>{c}</li>)}</div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#fbbf24',fontSize:'0.85rem'}}>Hidden Assumptions:</strong>{result.hidden_assumptions?.map((a:string,i:number)=><li key={i} style={{color:'#fde68a',fontSize:'0.85rem'}}>{a}</li>)}</div>
                </div>
                <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Questions to Ask:</strong>{result.what_questions_to_ask?.map((q:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.85rem'}}>{q}</li>)}</div>
              </div>}
            </div>
          );
}
