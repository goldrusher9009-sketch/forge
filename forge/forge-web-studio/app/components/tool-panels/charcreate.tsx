'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_charcreate() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [role, setRole] = React.useState('protagonist');
          const [genre, setGenre] = React.useState('');
          const [seeds, setSeeds] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#f472b6',marginBottom:4}}>👤 Character Creator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Generate a deeply layered character with wound, want, need, flaw and arc.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={role} onChange={e=>setRole(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['protagonist','antagonist','mentor','love interest','sidekick','anti-hero'].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
                <input value={genre} onChange={e=>setGenre(e.target.value)} placeholder="Genre (e.g. noir thriller)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <input value={seeds} onChange={e=>setSeeds(e.target.value)} placeholder="Personality seeds (e.g. charming but self-destructive, hides vulnerability with humor)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <button onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/character/create`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({role,genre,personality_seeds:seeds})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#ec4899',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Creating...':'Create Character'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{color:'#f472b6',fontWeight:700,fontSize:20}}>{result.name} <span style={{color:'#64748b',fontSize:14,fontWeight:400}}>age {result.age}</span></div>
                  <div style={{color:'#94a3b8',fontSize:13,marginTop:4,marginBottom:12,fontStyle:'italic'}}>{result.appearance}</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    {[['Core Wound',result.core_wound,'#ef4444'],['Fatal Flaw',result.flaw,'#f97316'],['Conscious Want',result.want,'#fbbf24'],['True Need',result.need,'#4ade80'],['Greatest Strength',result.strength,'#60a5fa'],['Character Arc',result.arc,'#a78bfa']].map(([k,v,c])=><div key={k as string} style={{background:'#0f172a',borderRadius:8,padding:'0.75rem'}}><div style={{color:c as string,fontSize:11,fontWeight:600,marginBottom:4}}>{k}</div><div style={{color:'#cbd5e1',fontSize:12}}>{v as string}</div></div>)}
                  </div>
                </div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}>
                  <div style={{color:'#f472b6',fontWeight:600,marginBottom:8}}>Quirks</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(result.quirks||[]).map((q:string,i:number)=><span key={i} style={{background:'#4c1d95',color:'#c4b5fd',borderRadius:20,padding:'3px 12px',fontSize:12}}>{q}</span>)}</div>
                </div>
              </div>)}
            </div>
          );
}

export function ForgeTab_worldbuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [genre, setGenre] = React.useState('fantasy');
          const [premise, setPremise] = React.useState('');
          const [magicLevel, setMagicLevel] = React.useState('low magic');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#34d399',marginBottom:4}}>🌍 World Builder</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Build a rich fictional world with geography, society, history, and story hooks.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={genre} onChange={e=>setGenre(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['fantasy','sci-fi','dystopian','historical','contemporary','horror','steampunk'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <select value={magicLevel} onChange={e=>setMagicLevel(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['no magic','low magic','high magic','hard sci-fi tech','soft sci-fi tech'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <textarea value={premise} onChange={e=>setPremise(e.target.value)} placeholder="Core premise or seed idea for this world..." rows={3} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <button onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/world/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({genre,premise,magic_tech_level:magicLevel})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#10b981',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Building...':'Build World'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#064e3b',border:'1px solid #10b981',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}><div style={{color:'#34d399',fontWeight:700,fontSize:20}}>{result.world_name}</div><div style={{color:'#6ee7b7',fontSize:13,marginTop:4,fontStyle:'italic'}}>{result.tagline}</div></div>
                {[['Geography',result.geography,'#60a5fa'],['Magic/Tech',result.magic_or_tech,'#a78bfa']].map(([k,v,c])=><div key={k as string} style={{background:'#1e293b',borderRadius:8,padding:'1rem',marginBottom:'0.75rem'}}><div style={{color:c as string,fontWeight:600,marginBottom:6}}>{k}</div><div style={{color:'#cbd5e1',fontSize:13}}>{v as string}</div></div>)}
                <div style={{background:'#1e293b',borderRadius:8,padding:'1rem',marginBottom:'0.75rem'}}><div style={{color:'#fbbf24',fontWeight:600,marginBottom:8}}>Society</div><div style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}><span style={{color:'#94a3b8'}}>Structure:</span> {result.society?.structure}</div><div style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}><span style={{color:'#94a3b8'}}>Conflicts:</span> {result.society?.conflicts}</div></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}><div style={{background:'#1e293b',borderRadius:8,padding:'1rem'}}><div style={{color:'#f87171',fontWeight:600,marginBottom:8}}>Unique Elements</div>{(result.unique_elements||[]).map((e:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:12,marginBottom:4}}>✦ {e}</div>)}</div><div style={{background:'#1e293b',borderRadius:8,padding:'1rem'}}><div style={{color:'#fb923c',fontWeight:600,marginBottom:8}}>Story Hooks</div>{(result.story_hooks||[]).map((h:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:12,marginBottom:4}}>→ {h}</div>)}</div></div>
              </div>)}
            </div>
          );
}

export function ForgeTab_dialoguecoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [dialogue, setDialogue] = React.useState('');
          const [context, setContext] = React.useState('');
          const [goal, setGoal] = React.useState('create tension');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#fbbf24',marginBottom:4}}>💬 Dialogue Coach</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Transform flat dialogue into compelling scenes with subtext and emotional punch.</p>
              <textarea value={dialogue} onChange={e=>setDialogue(e.target.value)} placeholder={'Paste your flat dialogue here...\n\n"Did you take the money?" he asked.\n"No," she said.\n"Are you sure?" he asked.'} rows={5} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Scene context (who, where, what\'s at stake)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <select value={goal} onChange={e=>setGoal(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['create tension','show intimacy','reveal character','advance plot','comic relief','emotional confrontation'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!dialogue.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/dialogue/rewrite`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({dialogue,context,goal})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#ca8a04',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Rewriting...':'Rewrite Dialogue'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div style={{color:'#fbbf24',fontWeight:700}}>Rewritten Scene</div><button onClick={()=>{navigator.clipboard.writeText(result.rewritten_dialogue);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{background:'#334155',color:'#e2e8f0',border:'none',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:12}}>{copied?'Copied!':'Copy'}</button></div>
                  <pre style={{color:'#e2e8f0',fontSize:13,whiteSpace:'pre-wrap',fontFamily:'inherit',lineHeight:1.7}}>{result.rewritten_dialogue}</pre>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'1rem'}}><div style={{color:'#4ade80',fontWeight:600,marginBottom:8}}>What Changed</div>{(result.what_changed||[]).map((c:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:12,marginBottom:4}}>✓ {c}</div>)}</div>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'1rem'}}><div style={{color:'#818cf8',fontWeight:600,marginBottom:6}}>Subtext</div><div style={{color:'#cbd5e1',fontSize:12,marginBottom:8}}>{result.subtext}</div><div style={{color:'#94a3b8',fontWeight:600,marginBottom:4,fontSize:11}}>PACING</div><div style={{color:'#cbd5e1',fontSize:11}}>{result.pacing_notes}</div></div>
                </div>
              </div>)}
            </div>
          );
}

export function ForgeTab_bookblurb() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [title, setTitle] = React.useState('');
          const [genre, setGenre] = React.useState('');
          const [protagonist, setProtagonist] = React.useState('');
          const [conflict, setConflict] = React.useState('');
          const [stakes, setStakes] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [activeBlurb, setActiveBlurb] = React.useState(0);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#fb923c',marginBottom:4}}>📖 Book Blurb Writer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>3 back-cover blurbs in different styles + taglines + comp titles.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Book title" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={genre} onChange={e=>setGenre(e.target.value)} placeholder="Genre" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <input value={protagonist} onChange={e=>setProtagonist(e.target.value)} placeholder="Protagonist (who they are and what they want)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <input value={conflict} onChange={e=>setConflict(e.target.value)} placeholder="Central conflict" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <input value={stakes} onChange={e=>setStakes(e.target.value)} placeholder="Stakes (what happens if they fail?)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <button onClick={async()=>{if(!title.trim()||!protagonist.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/blurb/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({title,genre,protagonist,conflict,stakes})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#ea580c',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Writing...':'Write Blurbs'}</button>
              {result&&!result.error&&(<div>
                <div style={{display:'flex',gap:8,marginBottom:'1rem'}}>{(result.blurbs||[]).map((b:any,i:number)=><button key={i} onClick={()=>setActiveBlurb(i)} style={{background:activeBlurb===i?'#ea580c':'#1e293b',color:'#e2e8f0',border:'none',borderRadius:8,padding:'6px 16px',cursor:'pointer',fontSize:12,fontWeight:activeBlurb===i?700:400}}>{b.style}</button>)}</div>
                {result.blurbs?.[activeBlurb]&&<div style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}><pre style={{color:'#e2e8f0',fontSize:14,whiteSpace:'pre-wrap',fontFamily:'Georgia,serif',lineHeight:1.8}}>{result.blurbs[activeBlurb].blurb}</pre></div>}
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'0.75rem'}}><div style={{color:'#fb923c',fontWeight:600,marginBottom:8}}>Taglines</div>{(result.taglines||[]).map((t:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4,fontStyle:'italic'}}>"{t}"</div>)}</div>
                <div style={{background:'#0f172a',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',color:'#94a3b8',fontSize:12}}>📚 Comp titles: {result.comp_titles}</div>
              </div>)}
            </div>
          );
}

export function ForgeTab_perfreview() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [role, setRole] = React.useState('');
          const [achievements, setAchievements] = React.useState('');
          const [growth, setGrowth] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#60a5fa',marginBottom:4}}>📊 Performance Review Writer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Turn your accomplishments into a compelling self-review that positions you for promotions and raises.</p>
              <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Your role / title" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <textarea value={achievements} onChange={e=>setAchievements(e.target.value)} placeholder="Key achievements this period (bullet points OK, be specific with numbers)" rows={4} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <textarea value={growth} onChange={e=>setGrowth(e.target.value)} placeholder="Areas you grew or improved in..." rows={2} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <textarea value={goals} onChange={e=>setGoals(e.target.value)} placeholder="Goals for next period..." rows={2} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
              <button onClick={async()=>{if(!role.trim()||!achievements.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/perf-review/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({role,achievements,areas_for_growth:growth,goals_next_period:goals})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#3b82f6',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Writing...':'Write Performance Review'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}><div style={{color:'#60a5fa',fontWeight:700,marginBottom:8}}>Executive Summary</div><div style={{color:'#e2e8f0',fontSize:13,lineHeight:1.7,fontStyle:'italic'}}>{result.executive_summary}</div></div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}><div style={{color:'#4ade80',fontWeight:700,marginBottom:12}}>Key Achievements</div>{(result.achievements||[]).map((a:any,i:number)=><div key={i} style={{background:'#0f172a',borderRadius:8,padding:'0.75rem',marginBottom:8}}><div style={{color:'#e2e8f0',fontWeight:600,fontSize:13}}>{a.achievement}</div><div style={{color:'#4ade80',fontSize:12,marginTop:4}}>Impact: {a.impact}</div><div style={{color:'#64748b',fontSize:11,marginTop:2}}>Skill: {a.skill_demonstrated}</div></div>)}</div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}><div style={{color:'#fbbf24',fontWeight:700,marginBottom:8}}>Goals Next Period</div>{(result.goals_next_period||[]).map((g:any,i:number)=><div key={i} style={{marginBottom:8}}><div style={{color:'#e2e8f0',fontSize:13,fontWeight:600}}>{g.goal}</div><div style={{color:'#94a3b8',fontSize:12}}>{g.why_it_matters}</div></div>)}</div>
                <div style={{background:'#1e3a5f',border:'1px solid #3b82f6',borderRadius:8,padding:'1rem'}}><div style={{color:'#60a5fa',fontWeight:600,marginBottom:6}}>Closing Statement</div><div style={{color:'#e2e8f0',fontSize:13,lineHeight:1.7}}>{result.closing_statement}</div></div>
              </div>)}
            </div>
          );
}

export function ForgeTab_salaryresearch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [role, setRole] = React.useState('');
          const [yearsExp, setYearsExp] = React.useState('');
          const [location, setLocation] = React.useState('');
          const [industry, setIndustry] = React.useState('tech');
          const [currentSalary, setCurrentSalary] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#4ade80',marginBottom:4}}>💰 Salary Research</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Market rate analysis + negotiation positioning. Verify with current sources (Levels.fyi, Glassdoor).</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Job title / role" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={yearsExp} onChange={e=>setYearsExp(e.target.value)} placeholder="Years of experience" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location (e.g. NYC, remote US)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <select value={industry} onChange={e=>setIndustry(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['tech','finance','healthcare','consulting','startup','enterprise','non-profit'].map(i=><option key={i} value={i}>{i}</option>)}
                </select>
                <input value={currentSalary} onChange={e=>setCurrentSalary(e.target.value)} placeholder="Current salary (optional)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
              </div>
              <button onClick={async()=>{if(!role.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/salary/research`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({role,years_exp:yearsExp,location,industry,current_salary:currentSalary})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#22c55e',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Researching...':'Research Salary'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#14532d',border:'1px solid #22c55e',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{color:'#4ade80',fontWeight:700,marginBottom:12}}>Market Data — {role}</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',textAlign:'center'}}>
                    {[['P25',result.market_data?.p25],['Median',result.market_data?.p50_median],['P75',result.market_data?.p75],['P90',result.market_data?.p90]].map(([k,v])=><div key={k as string}><div style={{color:'#86efac',fontSize:11}}>{k}</div><div style={{color:'#fff',fontWeight:700,fontSize:16}}>{v as string}</div></div>)}
                  </div>
                </div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}>
                  <div style={{color:'#fbbf24',fontWeight:700,marginBottom:8}}>Your Target Range</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',textAlign:'center'}}>
                    {[['Floor',result.your_target_range?.floor,'#94a3b8'],['Target',result.your_target_range?.target,'#4ade80'],['Stretch',result.your_target_range?.stretch,'#fbbf24']].map(([k,v,c])=><div key={k as string}><div style={{color:'#64748b',fontSize:11}}>{k}</div><div style={{color:c as string,fontWeight:700,fontSize:18}}>{v as string}</div></div>)}
                  </div>
                </div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}><div style={{color:'#60a5fa',fontWeight:700,marginBottom:8}}>Negotiation Talking Points</div>{(result.talking_points||[]).map((p:string,i:number)=><div key={i} style={{color:'#cbd5e1',fontSize:13,marginBottom:4}}>→ {p}</div>)}</div>
                <div style={{background:'#0f172a',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',color:'#64748b',fontSize:11}}>{result.disclaimer}</div>
              </div>)}
            </div>
          );
}

export function ForgeTab_offercompare() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [offers, setOffers] = React.useState([{name:'Offer A',base:'',equity:'',bonus:'',pto:'',remote:'',notes:''},{name:'Offer B',base:'',equity:'',bonus:'',pto:'',remote:'',notes:''}]);
          const [priorities, setPriorities] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:750,margin:'0 auto'}}>
              <h2 style={{color:'#f59e0b',marginBottom:4}}>⚖️ Offer Comparison</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Side-by-side analysis with a clear winner recommendation.</p>
              {offers.map((o,i)=><div key={i} style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'0.75rem'}}>
                <div style={{color:'#f59e0b',fontWeight:600,marginBottom:8}}>{o.name}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem'}}>
                  {(['base','equity','bonus','pto','remote','notes'] as const).map(field=><input key={field} value={o[field]} onChange={e=>{const updated=[...offers];updated[i]={...updated[i],[field]:e.target.value};setOffers(updated);}} placeholder={field.charAt(0).toUpperCase()+field.slice(1)} style={{background:'#0f172a',color:'#e2e8f0',border:'1px solid #334155',borderRadius:6,padding:'0.5rem',fontSize:12}}/>)}
                </div>
              </div>)}
              <input value={priorities} onChange={e=>setPriorities(e.target.value)} placeholder="Your priorities (e.g. comp first, then growth, then WLB)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}/>
              <button onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/offer/compare`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({offers,priorities})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#d97706',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Comparing...':'Compare Offers'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:'#14532d',border:'1px solid #22c55e',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}><div style={{color:'#4ade80',fontWeight:700,fontSize:18}}>Winner: {result.winner}</div><div style={{color:'#86efac',fontSize:13,marginTop:4}}>{result.why_winner}</div></div>
                {result.negotiation_opportunities?.length>0&&<div style={{background:'#1e293b',borderRadius:10,padding:'1rem'}}><div style={{color:'#fbbf24',fontWeight:700,marginBottom:8}}>Negotiation Opportunities</div>{result.negotiation_opportunities.map((n:any,i:number)=><div key={i} style={{marginBottom:8}}><div style={{color:'#e2e8f0',fontSize:13}}><span style={{color:'#fbbf24'}}>{n.offer}:</span> Ask for {n.ask_for} (+{n.how_much})</div></div>)}</div>}
              </div>)}
            </div>
          );
}

export function ForgeTab_careerpivot() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [current, setCurrent] = React.useState('');
          const [target, setTarget] = React.useState('');
          const [skills, setSkills] = React.useState('');
          const [timeline, setTimeline] = React.useState('12 months');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [activePhase, setActivePhase] = React.useState('30');
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#818cf8',marginBottom:4}}>🔄 Career Pivot Planner</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>Realistic 90-day action plan to transition into your target career.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Current role/background" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target role/career" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Transferable skills" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <select value={timeline} onChange={e=>setTimeline(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['3 months','6 months','12 months','18 months','2 years'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!current.trim()||!target.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/career-pivot/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({current_role:current,target_role:target,transferable_skills:skills,timeline})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Planning...':'Create Pivot Plan'}</button>
              {result&&!result.error&&(<div>
                <div style={{background:result.feasibility==='high'?'#14532d':result.feasibility==='medium'?'#78350f':'#7f1d1d',border:'1px solid #6366f1',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}>
                  <div style={{color:'#fff',fontWeight:700}}>Feasibility: {result.feasibility?.toUpperCase()}</div>
                  <div style={{color:'#c7d2fe',fontSize:13,marginTop:4}}>{result.feasibility_reason}</div>
                </div>
                <div style={{display:'flex',gap:8,marginBottom:'1rem'}}>{['30','60','90'].map(p=><button key={p} onClick={()=>setActivePhase(p)} style={{background:activePhase===p?'#6366f1':'#1e293b',color:'#e2e8f0',border:'none',borderRadius:8,padding:'6px 16px',cursor:'pointer',fontWeight:activePhase===p?700:400}}>{p}-Day Plan</button>)}</div>
                <div style={{background:'#1e293b',borderRadius:10,padding:'1rem',marginBottom:'1rem'}}>{((result as any)[`${activePhase}_day_plan`]||[]).map((a:string,i:number)=><div key={i} style={{display:'flex',gap:'0.75rem',padding:'0.5rem 0',borderBottom:'1px solid #0f172a'}}><span style={{color:'#6366f1',fontWeight:700,minWidth:24}}>{i+1}</span><span style={{color:'#cbd5e1',fontSize:13}}>{a}</span></div>)}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'1rem'}}><div style={{color:'#4ade80',fontWeight:600,marginBottom:6}}>Portfolio Project</div><div style={{color:'#cbd5e1',fontSize:13}}>{result.portfolio_project}</div></div>
                  <div style={{background:'#1e293b',borderRadius:8,padding:'1rem'}}><div style={{color:'#fbbf24',fontWeight:600,marginBottom:6}}>First Target Role</div><div style={{color:'#cbd5e1',fontSize:13}}>{result.first_job_title}</div><div style={{color:'#64748b',fontSize:12,marginTop:4}}>{result.salary_expectation}</div></div>
                </div>
              </div>)}
            </div>
          );
}

export function ForgeTab_linkedinmsg() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [background, setBackground] = React.useState('');
          const [targetPerson, setTargetPerson] = React.useState('');
          const [targetCompany, setTargetCompany] = React.useState('');
          const [goal, setGoal] = React.useState('informational interview');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(-1);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{color:'#38bdf8',marginBottom:4}}>💼 LinkedIn Message Optimizer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem',fontSize:13}}>3 message styles engineered to get replies from cold LinkedIn outreach.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={background} onChange={e=>setBackground(e.target.value)} placeholder="Your background / role" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={targetPerson} onChange={e=>setTargetPerson(e.target.value)} placeholder="Target person (role/name)" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <input value={targetCompany} onChange={e=>setTargetCompany(e.target.value)} placeholder="Target company" style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}/>
                <select value={goal} onChange={e=>setGoal(e.target.value)} style={{background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:8,padding:'0.75rem'}}>
                  {['informational interview','job referral','partnership','mentorship','sales outreach','networking'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button onClick={async()=>{if(!background.trim()||!targetCompany.trim())return;setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/linkedin/message`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({your_background:background,target_person:targetPerson,target_company:targetCompany,goal})});const d=await r.json();setResult(d);}catch(e){setResult({error:'Failed'});}setLoading(false);}} disabled={loading} style={{background:'#0284c7',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{loading?'Writing...':'Generate Messages'}</button>
              {result&&!result.error&&(<div>
                {(result.messages||[]).map((m:any,i:number)=><div key={i} style={{background:'#1e293b',borderRadius:10,padding:'1.25rem',marginBottom:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><div style={{color:'#38bdf8',fontWeight:700,textTransform:'capitalize'}}>{m.style}</div><button onClick={()=>{navigator.clipboard.writeText(m.message);setCopied(i);setTimeout(()=>setCopied(-1),2000);}} style={{background:'#334155',color:'#e2e8f0',border:'none',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:12}}>{copied===i?'Copied!':'Copy'}</button></div>
                  <div style={{color:'#e2e8f0',fontSize:13,lineHeight:1.7,marginBottom:8,background:'#0f172a',borderRadius:8,padding:'0.75rem'}}>{m.message}</div>
                  <div style={{color:'#64748b',fontSize:11}}>💡 {m.why_it_works}</div>
                </div>)}
                <div style={{background:'#1e293b',borderRadius:8,padding:'0.75rem',marginTop:'0.5rem'}}><div style={{color:'#94a3b8',fontSize:12,fontWeight:600}}>Follow-up Template</div><div style={{color:'#cbd5e1',fontSize:12,marginTop:4}}>{result.follow_up_template}</div></div>
              </div>)}
            </div>
          );
}

export function ForgeTab_competitordive() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cdTarget, setCdTarget] = React.useState('');
          const [cdYours, setCdYours] = React.useState('');
          const [cdResult, setCdResult] = React.useState('');
          const [cdLoading, setCdLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>🔎 Competitor Deep Dive</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Full SWOT, blind spots & battle card vs any competitor.</p>
              <input value={cdTarget} onChange={e=>setCdTarget(e.target.value)} placeholder="Competitor name / URL" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <textarea value={cdYours} onChange={e=>setCdYours(e.target.value)} placeholder="Describe your product / company" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem',resize:'vertical'}}/>
              <button disabled={cdLoading||!cdTarget.trim()||!cdYours.trim()} onClick={async()=>{setCdLoading(true);setCdResult('');try{const r=await fetch(`${API_BASE}/api/competitor/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({competitor:cdTarget,yourProduct:cdYours})});const d=await r.json();setCdResult(d.analysis||d.error||'No result');}catch(e){setCdResult('Error');}setCdLoading(false);}} style={{padding:'0.75rem 2rem',background:'#6366f1',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{cdLoading?'Analyzing…':'Deep Dive'}</button>
              {cdResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{cdResult}</div>}
            </div>
          );
}

export function ForgeTab_pricingstrat() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [psProduct, setPsProduct] = React.useState('');
          const [psContext, setPsContext] = React.useState('');
          const [psResult, setPsResult] = React.useState('');
          const [psLoading, setPsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>💲 Pricing Strategy Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Tiered pricing with psychology, anchoring & positioning.</p>
              <input value={psProduct} onChange={e=>setPsProduct(e.target.value)} placeholder="Product name & description" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <textarea value={psContext} onChange={e=>setPsContext(e.target.value)} placeholder="Market, competitors, target customer (optional)" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem',resize:'vertical'}}/>
              <button disabled={psLoading||!psProduct.trim()} onClick={async()=>{setPsLoading(true);setPsResult('');try{const r=await fetch(`${API_BASE}/api/pricing/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:psProduct,context:psContext})});const d=await r.json();setPsResult(d.pricing||d.error||'No result');}catch(e){setPsResult('Error');}setPsLoading(false);}} style={{padding:'0.75rem 2rem',background:'#10b981',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{psLoading?'Building…':'Build Pricing'}</button>
              {psResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{psResult}</div>}
            </div>
          );
}

export function ForgeTab_custpersona2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cpProduct, setCpProduct] = React.useState('');
          const [cpMarket, setCpMarket] = React.useState('');
          const [cpResult, setCpResult] = React.useState('');
          const [cpLoading, setCpLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>👥 Customer Persona Generator</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Two detailed ICPs with day-in-life, pain points & buying triggers.</p>
              <input value={cpProduct} onChange={e=>setCpProduct(e.target.value)} placeholder="Product or service description" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={cpMarket} onChange={e=>setCpMarket(e.target.value)} placeholder="Target market / industry" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}/>
              <button disabled={cpLoading||!cpProduct.trim()} onClick={async()=>{setCpLoading(true);setCpResult('');try{const r=await fetch(`${API_BASE}/api/persona/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:cpProduct,market:cpMarket})});const d=await r.json();setCpResult(d.personas||d.error||'No result');}catch(e){setCpResult('Error');}setCpLoading(false);}} style={{padding:'0.75rem 2rem',background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{cpLoading?'Generating…':'Generate Personas'}</button>
              {cpResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{cpResult}</div>}
            </div>
          );
}

export function ForgeTab_gtmplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [gtmProduct, setGtmProduct] = React.useState('');
          const [gtmGoal, setGtmGoal] = React.useState('');
          const [gtmResult, setGtmResult] = React.useState('');
          const [gtmLoading, setGtmLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>🚀 GTM Planner</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Pre/launch/post sequence + first 100 customers strategy.</p>
              <input value={gtmProduct} onChange={e=>setGtmProduct(e.target.value)} placeholder="Product name & what it does" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={gtmGoal} onChange={e=>setGtmGoal(e.target.value)} placeholder="Launch goal (e.g. 100 paying users in 30 days)" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}/>
              <button disabled={gtmLoading||!gtmProduct.trim()} onClick={async()=>{setGtmLoading(true);setGtmResult('');try{const r=await fetch(`${API_BASE}/api/gtm/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:gtmProduct,goal:gtmGoal})});const d=await r.json();setGtmResult(d.plan||d.error||'No result');}catch(e){setGtmResult('Error');}setGtmLoading(false);}} style={{padding:'0.75rem 2rem',background:'#8b5cf6',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{gtmLoading?'Planning…':'Build GTM Plan'}</button>
              {gtmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{gtmResult}</div>}
            </div>
          );
}

export function ForgeTab_okrbuilder() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [okrGoal, setOkrGoal] = React.useState('');
          const [okrPeriod, setOkrPeriod] = React.useState('Q3 2025');
          const [okrResult, setOkrResult] = React.useState('');
          const [okrLoading, setOkrLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>🎯 OKR Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Objectives + measurable Key Results with scoring rubric.</p>
              <textarea value={okrGoal} onChange={e=>setOkrGoal(e.target.value)} placeholder="What does your team/company want to achieve this period?" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}}/>
              <input value={okrPeriod} onChange={e=>setOkrPeriod(e.target.value)} placeholder="Period (e.g. Q3 2025)" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}/>
              <button disabled={okrLoading||!okrGoal.trim()} onClick={async()=>{setOkrLoading(true);setOkrResult('');try{const r=await fetch(`${API_BASE}/api/okr/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goal:okrGoal,period:okrPeriod})});const d=await r.json();setOkrResult(d.okrs||d.error||'No result');}catch(e){setOkrResult('Error');}setOkrLoading(false);}} style={{padding:'0.75rem 2rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{okrLoading?'Building…':'Build OKRs'}</button>
              {okrResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{okrResult}</div>}
            </div>
          );
}

export function ForgeTab_viralthread() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [vtTopic, setVtTopic] = React.useState('');
          const [vtAngle, setVtAngle] = React.useState('');
          const [vtPlatform, setVtPlatform] = React.useState('Twitter/X');
          const [vtResult, setVtResult] = React.useState<any>(null);
          const [vtLoading, setVtLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>🧵 Viral Thread Writer</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>10-tweet threads engineered to go viral with hook + CTA.</p>
              <input value={vtTopic} onChange={e=>setVtTopic(e.target.value)} placeholder="Thread topic" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={vtAngle} onChange={e=>setVtAngle(e.target.value)} placeholder="Angle (educational, story, contrarian...)" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <select value={vtPlatform} onChange={e=>setVtPlatform(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}>
                <option>Twitter/X</option><option>LinkedIn</option><option>Threads</option>
              </select>
              <button disabled={vtLoading||!vtTopic.trim()} onClick={async()=>{setVtLoading(true);setVtResult(null);try{const r=await fetch(`${API_BASE}/api/thread/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:vtTopic,angle:vtAngle,platform:vtPlatform})});const d=await r.json();setVtResult(d);}catch(e){setVtResult({error:'Error'});}setVtLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1d9bf0',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{vtLoading?'Writing…':'Write Thread'}</button>
              {vtResult&&!vtResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem'}}>
                <div style={{fontWeight:700,marginBottom:'0.75rem',color:'#1d9bf0'}}>🪝 Hook</div>
                <div style={{marginBottom:'1rem',padding:'0.75rem',background:'#111',borderRadius:6}}>{vtResult.hook}</div>
                <div style={{fontWeight:700,marginBottom:'0.75rem'}}>🧵 Thread</div>
                {(vtResult.thread||[]).map((t:string,i:number)=><div key={i} style={{marginBottom:'0.5rem',padding:'0.75rem',background:'#111',borderRadius:6,fontSize:'0.9rem'}}><span style={{color:'#888',marginRight:'0.5rem'}}>{i+1}/</span>{t}</div>)}
                {vtResult.cta_tweet&&<div style={{marginTop:'0.75rem',padding:'0.75rem',background:'#1d9bf033',borderRadius:6}}><strong>CTA:</strong> {vtResult.cta_tweet}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_captiongen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cgDesc, setCgDesc] = React.useState('');
          const [cgPlatform, setCgPlatform] = React.useState('Instagram');
          const [cgTone, setCgTone] = React.useState('authentic');
          const [cgResult, setCgResult] = React.useState<any>(null);
          const [cgLoading, setCgLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>✍️ Caption Generator</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>3 caption variations tuned for your platform and goal.</p>
              <textarea value={cgDesc} onChange={e=>setCgDesc(e.target.value)} placeholder="Describe your post / what you\'re sharing" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}}/>
              <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
                <select value={cgPlatform} onChange={e=>setCgPlatform(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option>Instagram</option><option>LinkedIn</option><option>TikTok</option><option>Facebook</option><option>Twitter/X</option>
                </select>
                <select value={cgTone} onChange={e=>setCgTone(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option>authentic</option><option>professional</option><option>funny</option><option>inspirational</option><option>educational</option>
                </select>
              </div>
              <button disabled={cgLoading||!cgDesc.trim()} onClick={async()=>{setCgLoading(true);setCgResult(null);try{const r=await fetch(`${API_BASE}/api/caption/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({description:cgDesc,platform:cgPlatform,tone:cgTone})});const d=await r.json();setCgResult(d);}catch(e){setCgResult({error:'Error'});}setCgLoading(false);}} style={{padding:'0.75rem 2rem',background:'#e1306c',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{cgLoading?'Generating…':'Generate Captions'}</button>
              {cgResult&&!cgResult.error&&<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {(cgResult.captions||[]).map((c:any,i:number)=><div key={i} style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1rem'}}><div style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.4rem'}}>Option {i+1} — {c.hook}</div><div style={{whiteSpace:'pre-wrap'}}>{c.caption}</div></div>)}
              </div>}
            </div>
          );
}

export function ForgeTab_contentcal24() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ccNiche, setCcNiche] = React.useState('');
          const [ccPlatforms, setCcPlatforms] = React.useState('Instagram, Twitter, LinkedIn');
          const [ccFreq, setCcFreq] = React.useState('daily');
          const [ccResult, setCcResult] = React.useState<any>(null);
          const [ccLoading, setCcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>📅 Content Calendar Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>30-day content plan with themes, daily ideas & repurposing system.</p>
              <input value={ccNiche} onChange={e=>setCcNiche(e.target.value)} placeholder="Your niche / content topic" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={ccPlatforms} onChange={e=>setCcPlatforms(e.target.value)} placeholder="Platforms (Instagram, Twitter, LinkedIn...)" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <select value={ccFreq} onChange={e=>setCcFreq(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}>
                <option value="daily">Daily</option><option value="3x/week">3x per week</option><option value="5x/week">5x per week</option>
              </select>
              <button disabled={ccLoading||!ccNiche.trim()} onClick={async()=>{setCcLoading(true);setCcResult(null);try{const r=await fetch(`${API_BASE}/api/content-calendar/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({niche:ccNiche,platforms:ccPlatforms,posting_frequency:ccFreq})});const d=await r.json();setCcResult(d);}catch(e){setCcResult({error:'Error'});}setCcLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{ccLoading?'Building…':'Build Calendar'}</button>
              {ccResult&&!ccResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem'}}>
                {ccResult.strategy&&<p style={{marginBottom:'1rem',color:'#ccc'}}>{ccResult.strategy}</p>}
                {ccResult.content_pillars&&<div style={{marginBottom:'1rem'}}><strong>Content Pillars:</strong> {ccResult.content_pillars.join(' · ')}</div>}
                {(ccResult.weekly_themes||[]).map((w:any,i:number)=><div key={i} style={{padding:'0.6rem',background:'#111',borderRadius:6,marginBottom:'0.4rem'}}><strong>Week {w.week}:</strong> {w.theme} — {w.rationale}</div>)}
                {ccResult.repurposing_system&&<div style={{marginTop:'1rem',padding:'0.75rem',background:'#7c3aed22',borderRadius:6,fontSize:'0.9rem'}}><strong>Repurposing:</strong> {ccResult.repurposing_system}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_hashtagstrat() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [htTopic, setHtTopic] = React.useState('');
          const [htPlatform, setHtPlatform] = React.useState('Instagram');
          const [htSize, setHtSize] = React.useState('under 10k followers');
          const [htResult, setHtResult] = React.useState<any>(null);
          const [htLoading, setHtLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>#️⃣ Hashtag Strategy</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Mega/mid/niche hashtag sets + rotation strategy for max reach.</p>
              <input value={htTopic} onChange={e=>setHtTopic(e.target.value)} placeholder="Your content topic / niche" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
                <select value={htPlatform} onChange={e=>setHtPlatform(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option>Instagram</option><option>TikTok</option><option>Twitter/X</option><option>LinkedIn</option>
                </select>
                <select value={htSize} onChange={e=>setHtSize(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option>under 10k followers</option><option>10k-100k followers</option><option>100k+ followers</option>
                </select>
              </div>
              <button disabled={htLoading||!htTopic.trim()} onClick={async()=>{setHtLoading(true);setHtResult(null);try{const r=await fetch(`${API_BASE}/api/hashtags/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:htTopic,platform:htPlatform,account_size:htSize})});const d=await r.json();setHtResult(d);}catch(e){setHtResult({error:'Error'});}setHtLoading(false);}} style={{padding:'0.75rem 2rem',background:'#f97316',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{htLoading?'Generating…':'Generate Hashtags'}</button>
              {htResult&&!htResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem'}}>
                {[['Mega',htResult.mega_hashtags],['Mid',htResult.mid_hashtags],['Niche',htResult.niche_hashtags]].map(([label,tags]:any)=>tags&&<div key={label} style={{marginBottom:'1rem'}}><div style={{fontWeight:600,marginBottom:'0.4rem',color:'#f97316'}}>{label} Hashtags</div><div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>{tags.map((t:string,i:number)=><span key={i} style={{background:'#f9731622',padding:'0.2rem 0.6rem',borderRadius:20,fontSize:'0.85rem'}}>{t}</span>)}</div></div>)}
              </div>}
            </div>
          );
}

export function ForgeTab_biooptimizer() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [boBio, setBoBio] = React.useState('');
          const [boPlatform, setBoPlatform] = React.useState('Instagram');
          const [boProfession, setBoProfession] = React.useState('');
          const [boResult, setBoResult] = React.useState<any>(null);
          const [boLoading, setBoLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>🪪 Bio Optimizer</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Platform-optimized bio with CTAs, keywords & 2 variations.</p>
              <textarea value={boBio} onChange={e=>setBoBio(e.target.value)} placeholder="Your current bio (or leave blank to write from scratch)" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}}/>
              <input value={boProfession} onChange={e=>setBoProfession(e.target.value)} placeholder="Your profession / niche" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <select value={boPlatform} onChange={e=>setBoPlatform(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}>
                <option>Instagram</option><option>Twitter/X</option><option>LinkedIn</option><option>TikTok</option><option>Threads</option>
              </select>
              <button disabled={boLoading||!boProfession.trim()} onClick={async()=>{setBoLoading(true);setBoResult(null);try{const r=await fetch(`${API_BASE}/api/bio/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_bio:boBio,platform:boPlatform,profession:boProfession})});const d=await r.json();setBoResult(d);}catch(e){setBoResult({error:'Error'});}setBoLoading(false);}} style={{padding:'0.75rem 2rem',background:'#06b6d4',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{boLoading?'Optimizing…':'Optimize Bio'}</button>
              {boResult&&!boResult.error&&<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {(boResult.optimized_bios||[]).map((b:any,i:number)=><div key={i} style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1rem'}}><div style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.5rem'}}>Version {i+1}</div><div style={{whiteSpace:'pre-wrap',marginBottom:'0.5rem'}}>{b.bio}</div><div style={{fontSize:'0.8rem',color:'#06b6d4'}}>{b.why}</div></div>)}
                {boResult.cta_options&&<div style={{background:'#06b6d422',borderRadius:8,padding:'0.75rem'}}><strong>CTA Options:</strong> {boResult.cta_options.join(' · ')}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_emailseqbuilder() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [esProduct, setEsProduct] = React.useState('');
          const [esGoal, setEsGoal] = React.useState('convert leads to customers');
          const [esAudience, setEsAudience] = React.useState('');
          const [esNum, setEsNum] = React.useState('5');
          const [esResult, setEsResult] = React.useState<any>(null);
          const [esLoading, setEsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>📧 Email Sequence Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Full nurture sequences with subject lines, body copy & CTAs.</p>
              <input value={esProduct} onChange={e=>setEsProduct(e.target.value)} placeholder="Product or service" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={esAudience} onChange={e=>setEsAudience(e.target.value)} placeholder="Target audience" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
                <input value={esGoal} onChange={e=>setEsGoal(e.target.value)} placeholder="Sequence goal" style={{flex:2,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <select value={esNum} onChange={e=>setEsNum(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['3','5','7','10'].map(n=><option key={n}>{n}</option>)}
                </select>
              </div>
              <button disabled={esLoading||!esProduct.trim()} onClick={async()=>{setEsLoading(true);setEsResult(null);try{const r=await fetch(`${API_BASE}/api/email-sequence/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:esProduct,goal:esGoal,audience:esAudience,num_emails:esNum})});const d=await r.json();setEsResult(d);}catch(e){setEsResult({error:'Error'});}setEsLoading(false);}} style={{padding:'0.75rem 2rem',background:'#6366f1',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{esLoading?'Building…':'Build Sequence'}</button>
              {esResult&&!esResult.error&&<div>{esResult.sequence_overview&&<p style={{color:'#aaa',marginBottom:'1rem'}}>{esResult.sequence_overview}</p>}{(esResult.emails||[]).map((e:any,i:number)=><div key={i} style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1rem',marginBottom:'0.75rem'}}><div style={{fontWeight:700,color:'#6366f1',marginBottom:'0.25rem'}}>Email {e.email_number} — {e.send_day}</div><div style={{fontSize:'0.85rem',color:'#aaa',marginBottom:'0.5rem'}}>📌 {e.subject}</div><div style={{whiteSpace:'pre-wrap',fontSize:'0.9rem',lineHeight:1.6}}>{e.body}</div>{e.cta&&<div style={{marginTop:'0.5rem',color:'#6366f1',fontWeight:600}}>→ {e.cta}</div>}</div>)}</div>}
            </div>
          );
}

export function ForgeTab_subjectlines() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [slTopic, setSlTopic] = React.useState('');
          const [slAudience, setSlAudience] = React.useState('');
          const [slTone, setSlTone] = React.useState('conversational');
          const [slResult, setSlResult] = React.useState<any>(null);
          const [slLoading, setSlLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>✉️ Subject Line Generator</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>10 high-open-rate subject lines with psychology breakdown.</p>
              <input value={slTopic} onChange={e=>setSlTopic(e.target.value)} placeholder="Email topic" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
                <input value={slAudience} onChange={e=>setSlAudience(e.target.value)} placeholder="Audience" style={{flex:2,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <select value={slTone} onChange={e=>setSlTone(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['conversational','professional','urgent','playful','mysterious'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <button disabled={slLoading||!slTopic.trim()} onClick={async()=>{setSlLoading(true);setSlResult(null);try{const r=await fetch(`${API_BASE}/api/subject-lines/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({email_topic:slTopic,audience:slAudience,tone:slTone})});const d=await r.json();setSlResult(d);}catch(e){setSlResult({error:'Error'});}setSlLoading(false);}} style={{padding:'0.75rem 2rem',background:'#10b981',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{slLoading?'Generating…':'Generate Subject Lines'}</button>
              {slResult&&!slResult.error&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                {(slResult.subject_lines||[]).map((s:any,i:number)=><div key={i} style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'0.75rem',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div><div style={{fontWeight:600}}>{s.line}</div><div style={{fontSize:'0.8rem',color:'#888',marginTop:'0.25rem'}}>{s.open_rate_psychology}</div></div>
                  <span style={{fontSize:'0.75rem',background:'#10b98122',padding:'0.2rem 0.5rem',borderRadius:20,whiteSpace:'nowrap',marginLeft:'0.5rem'}}>{s.type}</span>
                </div>)}
                {slResult.ab_test_recommendation&&<div style={{padding:'0.75rem',background:'#10b98122',borderRadius:8,fontSize:'0.9rem'}}><strong>A/B Test:</strong> {slResult.ab_test_recommendation}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_newsletterdraft() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ndTopic, setNdTopic] = React.useState('');
          const [ndAudience, setNdAudience] = React.useState('');
          const [ndFormat, setNdFormat] = React.useState('educational with one main insight');
          const [ndResult, setNdResult] = React.useState<any>(null);
          const [ndLoading, setNdLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>📰 Newsletter Writer</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Full newsletter draft with subject line, body & CTA ready to send.</p>
              <input value={ndTopic} onChange={e=>setNdTopic(e.target.value)} placeholder="Newsletter topic or angle" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={ndAudience} onChange={e=>setNdAudience(e.target.value)} placeholder="Your audience" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <select value={ndFormat} onChange={e=>setNdFormat(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}>
                {['educational with one main insight','personal story + lesson','curated resources + commentary','opinion/hot take','how-to guide'].map(f=><option key={f}>{f}</option>)}
              </select>
              <button disabled={ndLoading||!ndTopic.trim()} onClick={async()=>{setNdLoading(true);setNdResult(null);try{const r=await fetch(`${API_BASE}/api/newsletter/draft`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:ndTopic,audience:ndAudience,format:ndFormat})});const d=await r.json();setNdResult(d);}catch(e){setNdResult({error:'Error'});}setNdLoading(false);}} style={{padding:'0.75rem 2rem',background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{ndLoading?'Drafting…':'Draft Newsletter'}</button>
              {ndResult&&!ndResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.5rem'}}>
                <div style={{marginBottom:'1rem',paddingBottom:'1rem',borderBottom:'1px solid #333'}}><div style={{fontSize:'0.8rem',color:'#888'}}>Subject Line</div><div style={{fontWeight:700,fontSize:'1.1rem'}}>{ndResult.subject_line}</div><div style={{fontSize:'0.85rem',color:'#aaa',marginTop:'0.25rem'}}>{ndResult.preview_text}</div></div>
                <div style={{whiteSpace:'pre-wrap',lineHeight:1.8}}>{ndResult.opening}{'\n\n'}{ndResult.body}</div>
                {ndResult.cta&&<div style={{marginTop:'1rem',padding:'0.75rem',background:'#f59e0b22',borderRadius:6}}><strong>CTA:</strong> {ndResult.cta}</div>}
                {ndResult.p_s&&<div style={{marginTop:'0.5rem',fontSize:'0.9rem',color:'#aaa',fontStyle:'italic'}}>P.S. {ndResult.p_s}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_reengage() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [reBrand, setReBrand] = React.useState('');
          const [rePeriod, setRePeriod] = React.useState('3+ months');
          const [reOffer, setReOffer] = React.useState('');
          const [reResult, setReResult] = React.useState<any>(null);
          const [reLoading, setReLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>🔁 Re-engagement Emails</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>3-email sequence to win back inactive subscribers + sunset strategy.</p>
              <input value={reBrand} onChange={e=>setReBrand(e.target.value)} placeholder="Your brand / newsletter name" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <div style={{display:'flex',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <select value={rePeriod} onChange={e=>setRePeriod(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['1-2 months','3+ months','6+ months','1+ year'].map(p=><option key={p}>{p}</option>)}
                </select>
                <input value={reOffer} onChange={e=>setReOffer(e.target.value)} placeholder="Incentive / offer (optional)" style={{flex:2,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
              </div>
              <button disabled={reLoading||!reBrand.trim()} onClick={async()=>{setReLoading(true);setReResult(null);try{const r=await fetch(`${API_BASE}/api/reengagement/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({brand:reBrand,inactive_period:rePeriod,offer:reOffer})});const d=await r.json();setReResult(d);}catch(e){setReResult({error:'Error'});}setReLoading(false);}} style={{padding:'0.75rem 2rem',background:'#8b5cf6',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{reLoading?'Writing…':'Write Sequence'}</button>
              {reResult&&!reResult.error&&<div>{(reResult.emails||[]).map((e:any,i:number)=><div key={i} style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1rem',marginBottom:'0.75rem'}}><div style={{fontWeight:700,color:'#8b5cf6',marginBottom:'0.25rem'}}>Email {e.number} — {e.send_timing}</div><div style={{fontSize:'0.85rem',marginBottom:'0.5rem',fontWeight:600}}>{e.subject}</div><div style={{whiteSpace:'pre-wrap',fontSize:'0.9rem',lineHeight:1.6}}>{e.body}</div></div>)}{reResult.sunset_advice&&<div style={{padding:'0.75rem',background:'#8b5cf622',borderRadius:8,fontSize:'0.9rem'}}><strong>Sunset advice:</strong> {reResult.sunset_advice}</div>}</div>}
            </div>
          );
}

export function ForgeTab_welcomeseq() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wsBrand, setWsBrand] = React.useState('');
          const [wsLead, setWsLead] = React.useState('');
          const [wsProduct, setWsProduct] = React.useState('');
          const [wsResult, setWsResult] = React.useState<any>(null);
          const [wsLoading, setWsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>👋 Welcome Sequence Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>5-email onboarding sequence that builds trust and drives first purchase.</p>
              <input value={wsBrand} onChange={e=>setWsBrand(e.target.value)} placeholder="Brand / creator name" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={wsLead} onChange={e=>setWsLead(e.target.value)} placeholder="Lead magnet they signed up for" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <input value={wsProduct} onChange={e=>setWsProduct(e.target.value)} placeholder="Your paid product or service" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}/>
              <button disabled={wsLoading||!wsBrand.trim()} onClick={async()=>{setWsLoading(true);setWsResult(null);try{const r=await fetch(`${API_BASE}/api/welcome-sequence/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({brand:wsBrand,lead_magnet:wsLead,product:wsProduct})});const d=await r.json();setWsResult(d);}catch(e){setWsResult({error:'Error'});}setWsLoading(false);}} style={{padding:'0.75rem 2rem',background:'#06b6d4',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{wsLoading?'Building…':'Build Welcome Sequence'}</button>
              {wsResult&&!wsResult.error&&<div>{wsResult.sequence_goal&&<p style={{color:'#aaa',marginBottom:'1rem'}}>{wsResult.sequence_goal}</p>}{(wsResult.emails||[]).map((e:any,i:number)=><div key={i} style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1rem',marginBottom:'0.75rem'}}><div style={{fontWeight:700,color:'#06b6d4',marginBottom:'0.25rem'}}>Email {e.number} — {e.send_timing}</div><div style={{fontSize:'0.8rem',color:'#888',marginBottom:'0.25rem'}}>{e.purpose}</div><div style={{fontSize:'0.85rem',fontWeight:600,marginBottom:'0.5rem'}}>📌 {e.subject}</div><div style={{whiteSpace:'pre-wrap',fontSize:'0.9rem',lineHeight:1.6}}>{e.body}</div></div>)}</div>}
            </div>
          );
}

export function ForgeTab_debtpayoff() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dpDebts, setDpDebts] = React.useState([{name:'',balance:'',rate:'',min_payment:''}]);
          const [dpExtra, setDpExtra] = React.useState('');
          const [dpStrat, setDpStrat] = React.useState('avalanche');
          const [dpResult, setDpResult] = React.useState<any>(null);
          const [dpLoading, setDpLoading] = React.useState(false);
          const addDebt = () => setDpDebts(d=>[...d,{name:'',balance:'',rate:'',min_payment:''}]);
          const updateDebt = (i:number,field:string,v:string) => setDpDebts(d=>d.map((x,idx)=>idx===i?{...x,[field]:v}:x));
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>💳 Debt Payoff Planner</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Avalanche or snowball plan with payoff order, dates & interest saved.</p>
              {dpDebts.map((d,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'0.5rem',marginBottom:'0.5rem'}}>
                <input value={d.name} onChange={e=>updateDebt(i,'name',e.target.value)} placeholder="Debt name" style={{padding:'0.5rem',borderRadius:6,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <input value={d.balance} onChange={e=>updateDebt(i,'balance',e.target.value)} placeholder="Balance $" style={{padding:'0.5rem',borderRadius:6,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <input value={d.rate} onChange={e=>updateDebt(i,'rate',e.target.value)} placeholder="Rate %" style={{padding:'0.5rem',borderRadius:6,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <input value={d.min_payment} onChange={e=>updateDebt(i,'min_payment',e.target.value)} placeholder="Min $" style={{padding:'0.5rem',borderRadius:6,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
              </div>)}
              <button onClick={addDebt} style={{padding:'0.4rem 1rem',background:'#333',color:'#fff',border:'none',borderRadius:6,marginBottom:'1rem',cursor:'pointer'}}>+ Add Debt</button>
              <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem'}}>
                <input value={dpExtra} onChange={e=>setDpExtra(e.target.value)} placeholder="Extra monthly payment $" style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <select value={dpStrat} onChange={e=>setDpStrat(e.target.value)} style={{flex:1,padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  <option value="avalanche">Avalanche (highest rate first)</option>
                  <option value="snowball">Snowball (lowest balance first)</option>
                </select>
              </div>
              <button disabled={dpLoading} onClick={async()=>{setDpLoading(true);setDpResult(null);try{const r=await fetch(`${API_BASE}/api/debt/payoff-plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({debts:dpDebts,monthly_extra:dpExtra,strategy:dpStrat})});const d=await r.json();setDpResult(d);}catch(e){setDpResult({error:'Error'});}setDpLoading(false);}} style={{padding:'0.75rem 2rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{dpLoading?'Planning…':'Build Payoff Plan'}</button>
              {dpResult&&!dpResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
                  {[['Payoff Date',dpResult.payoff_date],['Total Interest','$'+dpResult.total_interest_paid],['Interest Saved','$'+dpResult.interest_saved_vs_minimum]].map(([l,v]:any)=><div key={l} style={{textAlign:'center',padding:'1rem',background:'#111',borderRadius:8}}><div style={{fontSize:'0.8rem',color:'#888'}}>{l}</div><div style={{fontWeight:700,fontSize:'1.1rem',color:'#ef4444'}}>{v}</div></div>)}
                </div>
                <div style={{fontWeight:600,marginBottom:'0.5rem'}}>Payoff Order:</div>
                {(dpResult.payoff_order||[]).map((d:any,i:number)=><div key={i} style={{padding:'0.6rem',background:'#111',borderRadius:6,marginBottom:'0.4rem',display:'flex',justifyContent:'space-between'}}><span>{i+1}. {d.debt_name}</span><span style={{color:'#aaa',fontSize:'0.85rem'}}>{d.payoff_months} months · ${d.total_interest} interest</span></div>)}
                {dpResult.motivation&&<div style={{marginTop:'1rem',padding:'0.75rem',background:'#ef444422',borderRadius:6,fontStyle:'italic'}}>{dpResult.motivation}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_budgetbuilder() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bbIncome, setBbIncome] = React.useState('');
          const [bbFixed, setBbFixed] = React.useState('rent $1200, car $350, insurance $150');
          const [bbVar, setBbVar] = React.useState('groceries $400, dining $200, entertainment $100');
          const [bbGoals, setBbGoals] = React.useState('build emergency fund, invest 15%');
          const [bbResult, setBbResult] = React.useState<any>(null);
          const [bbLoading, setBbLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>📊 Budget Builder</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Zero-based budget with category breakdown, savings rate & 30-day challenge.</p>
              <input value={bbIncome} onChange={e=>setBbIncome(e.target.value)} placeholder="Monthly take-home income ($)" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <textarea value={bbFixed} onChange={e=>setBbFixed(e.target.value)} placeholder="Fixed expenses (rent, car payment...)" rows={2} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}}/>
              <textarea value={bbVar} onChange={e=>setBbVar(e.target.value)} placeholder="Variable expenses (groceries, dining...)" rows={2} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}}/>
              <input value={bbGoals} onChange={e=>setBbGoals(e.target.value)} placeholder="Financial goals" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}/>
              <button disabled={bbLoading||!bbIncome.trim()} onClick={async()=>{setBbLoading(true);setBbResult(null);try{const r=await fetch(`${API_BASE}/api/budget/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({monthly_income:bbIncome,fixed_expenses:bbFixed,variable_expenses:bbVar,goals:bbGoals})});const d=await r.json();setBbResult(d);}catch(e){setBbResult({error:'Error'});}setBbLoading(false);}} style={{padding:'0.75rem 2rem',background:'#10b981',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{bbLoading?'Building…':'Build Budget'}</button>
              {bbResult&&!bbResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',padding:'0.75rem',background:'#111',borderRadius:8}}>
                  <span>Savings Rate: <strong style={{color:'#10b981'}}>{bbResult.savings_rate}</strong></span>
                  <span>Surplus: <strong style={{color:bbResult.surplus_or_deficit>=0?'#10b981':'#ef4444'}}>${bbResult.surplus_or_deficit}</strong></span>
                </div>
                {(bbResult.categories||[]).map((c:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem',borderBottom:'1px solid #222'}}><span>{c.category}</span><div style={{textAlign:'right'}}><span style={{fontWeight:600}}>${c.budgeted}</span><span style={{marginLeft:'0.5rem',fontSize:'0.8rem',color:'#888'}}>{c.percentage}%</span></div></div>)}
                {bbResult['30_day_challenge']&&<div style={{marginTop:'1rem',padding:'0.75rem',background:'#10b98122',borderRadius:6}}><strong>30-Day Challenge:</strong> {bbResult['30_day_challenge']}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_investexplain() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ieTopic, setIeTopic] = React.useState('');
          const [ieLevel, setIeLevel] = React.useState('beginner');
          const [ieResult, setIeResult] = React.useState<any>(null);
          const [ieLoading, setIeLoading] = React.useState(false);
          const topics = ['Index funds','ETFs','401k vs IRA','Roth IRA','Real estate investing','Dividend stocks','Bonds','Options trading','Crypto','Dollar cost averaging','Emergency fund','Net worth'];
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>📈 Investment Explainer</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Any investment concept explained clearly — pros, cons, examples & next steps.</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem',marginBottom:'0.75rem'}}>
                {topics.map(t=><button key={t} onClick={()=>setIeTopic(t)} style={{padding:'0.3rem 0.75rem',background:ieTopic===t?'#6366f1':'#222',color:'#fff',border:'1px solid #333',borderRadius:20,cursor:'pointer',fontSize:'0.85rem'}}>{t}</button>)}
              </div>
              <input value={ieTopic} onChange={e=>setIeTopic(e.target.value)} placeholder="Or type any investment topic..." style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}}/>
              <select value={ieLevel} onChange={e=>setIeLevel(e.target.value)} style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}>
                <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
              </select>
              <button disabled={ieLoading||!ieTopic.trim()} onClick={async()=>{setIeLoading(true);setIeResult(null);try{const r=await fetch(`${API_BASE}/api/investment/explain`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:ieTopic,experience_level:ieLevel})});const d=await r.json();setIeResult(d);}catch(e){setIeResult({error:'Error'});}setIeLoading(false);}} style={{padding:'0.75rem 2rem',background:'#6366f1',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{ieLoading?'Explaining…':'Explain It'}</button>
              {ieResult&&!ieResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem'}}>
                <div style={{padding:'0.75rem',background:'#6366f122',borderRadius:6,marginBottom:'1rem',fontStyle:'italic'}}>{ieResult.eli5}</div>
                <div style={{marginBottom:'1rem',lineHeight:1.7}}>{ieResult.how_it_works}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                  <div style={{padding:'0.75rem',background:'#10b98122',borderRadius:6}}><strong style={{color:'#10b981'}}>✓ Pros</strong>{(ieResult.pros||[]).map((p:string,i:number)=><div key={i} style={{fontSize:'0.9rem',marginTop:'0.3rem'}}>• {p}</div>)}</div>
                  <div style={{padding:'0.75rem',background:'#ef444422',borderRadius:6}}><strong style={{color:'#ef4444'}}>✗ Cons</strong>{(ieResult.cons||[]).map((c:string,i:number)=><div key={i} style={{fontSize:'0.9rem',marginTop:'0.3rem'}}>• {c}</div>)}</div>
                </div>
                {ieResult.next_steps&&<div style={{padding:'0.75rem',background:'#6366f122',borderRadius:6}}><strong>Next Steps:</strong> {ieResult.next_steps}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_firecalc() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fcAge, setFcAge] = React.useState('');
          const [fcIncome, setFcIncome] = React.useState('');
          const [fcExpenses, setFcExpenses] = React.useState('');
          const [fcSavings, setFcSavings] = React.useState('');
          const [fcType, setFcType] = React.useState('regular FIRE');
          const [fcResult, setFcResult] = React.useState<any>(null);
          const [fcLoading, setFcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
              <h2 style={{fontSize:'1.6rem',fontWeight:700,marginBottom:'0.5rem'}}>🔥 FIRE Calculator</h2>
              <p style={{color:'#888',marginBottom:'1.5rem'}}>Your financial independence number, timeline & milestone map.</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <input value={fcAge} onChange={e=>setFcAge(e.target.value)} placeholder="Current age" style={{padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <select value={fcType} onChange={e=>setFcType(e.target.value)} style={{padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                  {['lean FIRE','regular FIRE','fat FIRE','barista FIRE','coast FIRE'].map(t=><option key={t}>{t}</option>)}
                </select>
                <input value={fcIncome} onChange={e=>setFcIncome(e.target.value)} placeholder="Annual income ($)" style={{padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
                <input value={fcExpenses} onChange={e=>setFcExpenses(e.target.value)} placeholder="Annual expenses ($)" style={{padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}/>
              </div>
              <input value={fcSavings} onChange={e=>setFcSavings(e.target.value)} placeholder="Current investments/savings ($)" style={{width:'100%',padding:'0.75rem',borderRadius:8,border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'1rem'}}/>
              <button disabled={fcLoading||!fcAge.trim()||!fcIncome.trim()||!fcExpenses.trim()} onClick={async()=>{setFcLoading(true);setFcResult(null);try{const r=await fetch(`${API_BASE}/api/fire/calculate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({age:fcAge,income:fcIncome,expenses:fcExpenses,savings:fcSavings,fire_type:fcType})});const d=await r.json();setFcResult(d);}catch(e){setFcResult({error:'Error'});}setFcLoading(false);}} style={{padding:'0.75rem 2rem',background:'#f97316',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{fcLoading?'Calculating…':'Calculate FIRE'}</button>
              {fcResult&&!fcResult.error&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:'1.25rem'}}>
                <div style={{textAlign:'center',padding:'1.5rem',background:'#f9731622',borderRadius:8,marginBottom:'1.5rem'}}><div style={{fontSize:'0.9rem',color:'#888'}}>Your FIRE Number</div><div style={{fontSize:'2.5rem',fontWeight:800,color:'#f97316'}}>${(fcResult.fire_number||0).toLocaleString()}</div><div style={{color:'#aaa',fontSize:'0.9rem'}}>Financial Independence at age {fcResult.fire_age} · {fcResult.years_to_fire} years away</div></div>
                <div style={{fontWeight:600,marginBottom:'0.75rem'}}>Milestones</div>
                {(fcResult.milestones||[]).map((m:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem',borderBottom:'1px solid #222'}}><span>{m.milestone}</span><div><span style={{fontWeight:600}}>${(m.amount||0).toLocaleString()}</span><span style={{color:'#888',marginLeft:'0.5rem',fontSize:'0.85rem'}}>{m.estimated_year}</span></div></div>)}
              </div>}
            </div>
          );
}
