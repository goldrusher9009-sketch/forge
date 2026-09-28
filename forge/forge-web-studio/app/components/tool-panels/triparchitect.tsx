'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_triparchitect() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [taDestination, setTaDestination] = React.useState('');
          const [taDuration, setTaDuration] = React.useState('7 days');
          const [taStyle, setTaStyle] = React.useState('balanced mix of culture and relaxation');
          const [taInterests, setTaInterests] = React.useState('');
          const [taRes, setTaRes] = React.useState<any>(null);
          const [taLoading, setTaLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>✈️ Trip Architect</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={taDestination} onChange={e=>setTaDestination(e.target.value)} placeholder="Destination (e.g. Tokyo, Japan | Tuscany, Italy | Thailand)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={taDuration} onChange={e=>setTaDuration(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['3 days','5 days','7 days','10 days','2 weeks','3 weeks','1 month'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={taStyle} onChange={e=>setTaStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['balanced mix of culture and relaxation','deep cultural immersion','beach and relaxation','adventure and outdoors','food and culinary focus','luxury travel','budget backpacker','digital nomad'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <input value={taInterests} onChange={e=>setTaInterests(e.target.value)} placeholder="Specific interests (e.g. ancient temples, street food, hiking, nightlife, museums)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!taDestination.trim())return;setTaLoading(true);setTaRes(null);try{const r=await fetch(`${''}/api/trip/architect`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({destination:taDestination,duration:taDuration,travel_style:taStyle,interests:taInterests})});const d=await r.json();setTaRes(d);}catch(e){console.error(e);}finally{setTaLoading(false);}}} disabled={taLoading||!taDestination.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {taLoading?'Designing...':'Design My Itinerary 🗺️'}
                </button>
              </div>
              {taRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>✨ Trip Overview: </strong>{taRes.trip_overview}<br/><span style={{opacity:0.7,fontSize:'0.9rem'}}>Best time: {taRes.best_time_to_visit}</span></div>
                {Array.isArray(taRes.itinerary)&&taRes.itinerary.map((day:any,i:number)=>(
                  <div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{day.day} — {day.theme}</strong><span style={{opacity:0.6,fontSize:'0.85rem'}}>{day.estimated_cost}</span></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',fontSize:'0.85rem'}}>
                      <div><strong>AM:</strong> {day.morning}</div>
                      <div><strong>PM:</strong> {day.afternoon}</div>
                      <div><strong>Eve:</strong> {day.evening}</div>
                    </div>
                    {day.accommodation_area&&<div style={{marginTop:'0.5rem',opacity:0.6,fontSize:'0.8rem'}}>🏨 Stay: {day.accommodation_area}</div>}
                  </div>
                ))}
                {Array.isArray(taRes.hidden_gems)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💎 Hidden Gems:</strong>{taRes.hidden_gems.map((g:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}>• <strong>{g.place}:</strong> {g.what_makes_it_special}</div>)}</div>}
                {Array.isArray(taRes.cultural_etiquette)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🙏 Cultural Etiquette:</strong><ul style={{margin:'0.25rem 0 0',paddingLeft:'1.25rem'}}>{taRes.cultural_etiquette.map((e:string,i:number)=><li key={i}>{e}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_packingopt() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pkDest, setPkDest] = React.useState('');
          const [pkDur, setPkDur] = React.useState('7 days');
          const [pkLuggage, setPkLuggage] = React.useState('carry-on only');
          const [pkActivities, setPkActivities] = React.useState('');
          const [pkRes, setPkRes] = React.useState<any>(null);
          const [pkLoading, setPkLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🧳 Packing Optimizer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={pkDest} onChange={e=>setPkDest(e.target.value)} placeholder="Destination and season (e.g. Bali, Indonesia — hot/humid)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={pkDur} onChange={e=>setPkDur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['3 days','5 days','7 days','10 days','2 weeks','1 month'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={pkLuggage} onChange={e=>setPkLuggage(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['carry-on only','1 checked bag','2 checked bags','backpack only'].map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <input value={pkActivities} onChange={e=>setPkActivities(e.target.value)} placeholder="Activities (e.g. hiking, beach, business meetings, fine dining, clubbing)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!pkDest.trim())return;setPkLoading(true);setPkRes(null);try{const r=await fetch(`${''}/api/packing/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({destination:pkDest,duration:pkDur,luggage_type:pkLuggage,activities:pkActivities})});const d=await r.json();setPkRes(d);}catch(e){console.error(e);}finally{setPkLoading(false);}}} disabled={pkLoading||!pkDest.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {pkLoading?'Optimizing...':'Build My Packing List 📝'}
                </button>
              </div>
              {pkRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎯 Strategy: </strong>{pkRes.packing_philosophy}</div>
                {Array.isArray(pkRes.clothing)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>👕 Clothing:</strong><div style={{display:'flex',flexDirection:'column',gap:'0.25rem',marginTop:'0.5rem'}}>{pkRes.clothing.map((c:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.4rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.9rem'}}><span>{c.item}</span><span style={{opacity:0.6}}>×{c.quantity}</span></div>)}</div></div>}
                {Array.isArray(pkRes.space_savers)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📦 Space Savers:</strong><ul style={{margin:'0.25rem 0 0',paddingLeft:'1.25rem'}}>{pkRes.space_savers.map((s:string,i:number)=><li key={i}>{s}</li>)}</ul></div>}
                {Array.isArray(pkRes.leave_behind)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚫 Leave Behind:</strong><ul style={{margin:'0.25rem 0 0',paddingLeft:'1.25rem'}}>{pkRes.leave_behind.map((l:string,i:number)=><li key={i}>{l}</li>)}</ul></div>}
                {pkRes.one_bag_challenge&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎒 One-Bag Challenge: </strong>{pkRes.one_bag_challenge}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_localintel() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [liCity, setLiCity] = React.useState('');
          const [liInterests, setLiInterests] = React.useState('');
          const [liBudget, setLiBudget] = React.useState('mid-range');
          const [liRes, setLiRes] = React.useState<any>(null);
          const [liLoading, setLiLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🗺️ Local Intel</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={liCity} onChange={e=>setLiCity(e.target.value)} placeholder="City (e.g. Lisbon, Portugal | Medellín, Colombia | Osaka, Japan)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={liInterests} onChange={e=>setLiInterests(e.target.value)} placeholder="Your interests (e.g. street food, art, nightlife, nature, history)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <select value={liBudget} onChange={e=>setLiBudget(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['budget backpacker','mid-range','splurge/luxury'].map(b=><option key={b} value={b}>{b}</option>)}
                </select>
                <button onClick={async()=>{if(!liCity.trim())return;setLiLoading(true);setLiRes(null);try{const r=await fetch(`${''}/api/local/intel`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({city:liCity,interests:liInterests,budget_level:liBudget})});const d=await r.json();setLiRes(d);}catch(e){console.error(e);}finally{setLiLoading(false);}}} disabled={liLoading||!liCity.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {liLoading?'Getting intel...':'Get Local Intel 🕵️'}
                </button>
              </div>
              {liRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {Array.isArray(liRes.tourist_traps_to_skip)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚫 Skip These Tourist Traps:</strong>{liRes.tourist_traps_to_skip.map((t:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong>{t.trap}</strong> → {t.skip_for}</div>)}</div>}
                {Array.isArray(liRes.local_secrets)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔑 Local Secrets:</strong>{liRes.local_secrets.map((s:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong>{s.secret}</strong><br/><span style={{opacity:0.7,fontSize:'0.85rem'}}>{s.why_tourists_miss_it}</span></div>)}</div>}
                {Array.isArray(liRes.best_neighborhoods)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏘️ Best Neighborhoods:</strong>{liRes.best_neighborhoods.map((n:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><strong>{n.name}</strong> — {n.vibe}<br/><span style={{opacity:0.7,fontSize:'0.85rem'}}>Best for: {n.best_for}</span></div>)}</div>}
                {Array.isArray(liRes.phrases_to_know)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💬 Key Phrases:</strong>{liRes.phrases_to_know.map((p:any,i:number)=><div key={i} style={{marginTop:'0.5rem',display:'flex',gap:'1rem',alignItems:'baseline'}}><strong style={{minWidth:'120px'}}>{p.phrase}</strong><span style={{opacity:0.7,fontSize:'0.85rem'}}>{p.pronunciation} — {p.when_to_use}</span></div>)}</div>}
                {liRes.safety_intel&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛡️ Safety: </strong>{liRes.safety_intel}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_travelbudget() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tbDest, setTbDest] = React.useState('');
          const [tbDur, setTbDur] = React.useState('7 days');
          const [tbStyle, setTbStyle] = React.useState('mid-range backpacker');
          const [tbBudget, setTbBudget] = React.useState('');
          const [tbRes, setTbRes] = React.useState<any>(null);
          const [tbLoading, setTbLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💱 Travel Budgeter</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={tbDest} onChange={e=>setTbDest(e.target.value)} placeholder="Destination (e.g. Vietnam | Portugal | New Zealand)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={tbDur} onChange={e=>setTbDur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['3 days','5 days','7 days','10 days','2 weeks','3 weeks','1 month'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={tbStyle} onChange={e=>setTbStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['budget backpacker','mid-range backpacker','mid-range comfort','luxury'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <input value={tbBudget} onChange={e=>setTbBudget(e.target.value)} placeholder="Total budget (optional, e.g. $3,000)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!tbDest.trim())return;setTbLoading(true);setTbRes(null);try{const r=await fetch(`${''}/api/travel/budget`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({destination:tbDest,duration:tbDur,travel_style:tbStyle,total_budget:tbBudget})});const d=await r.json();setTbRes(d);}catch(e){console.error(e);}finally{setTbLoading(false);}}} disabled={tbLoading||!tbDest.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {tbLoading?'Calculating...':'Build My Travel Budget 💰'}
                </button>
              </div>
              {tbRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📊 Assessment: </strong>{tbRes.budget_summary}</div>
                {tbRes.total_estimated_range&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem'}}>{Object.entries(tbRes.total_estimated_range).map(([tier,val])=><div key={tier} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><div style={{fontSize:'0.75rem',opacity:0.6,textTransform:'uppercase'}}>{tier}</div><div style={{fontWeight:700,fontSize:'1.1rem',marginTop:'0.25rem'}}>{val as string}</div></div>)}</div>}
                {Array.isArray(tbRes.cost_breakdown)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💳 Breakdown:</strong>{tbRes.cost_breakdown.map((c:any,i:number)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem',borderRadius:'4px',background:'var(--bg-primary)',marginTop:'0.25rem'}}><span>{c.category}</span><span style={{fontWeight:600}}>{c.daily_estimate}/day</span></div>)}</div>}
                {Array.isArray(tbRes.money_saving_hacks)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💡 Money Hacks:</strong><ul style={{margin:'0.25rem 0 0',paddingLeft:'1.25rem'}}>{tbRes.money_saving_hacks.map((h:string,i:number)=><li key={i}>{h}</li>)}</ul></div>}
                {tbRes.currency_tips&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💵 Currency Tips: </strong>{tbRes.currency_tips}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_solotravel() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [stDest, setStDest] = React.useState('');
          const [stLevel, setStLevel] = React.useState('first solo trip');
          const [stConcerns, setStConcerns] = React.useState('');
          const [stType, setStType] = React.useState('introvert');
          const [stRes, setStRes] = React.useState<any>(null);
          const [stLoading, setStLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎒 Solo Travel Coach</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={stDest} onChange={e=>setStDest(e.target.value)} placeholder="Where are you going solo? (e.g. Southeast Asia | Iceland | Colombia)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={stLevel} onChange={e=>setStLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['first solo trip','a few solo trips','experienced solo traveler'].map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={stType} onChange={e=>setStType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['introvert','extrovert','ambivert'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <input value={stConcerns} onChange={e=>setStConcerns(e.target.value)} placeholder="Biggest concerns (e.g. safety, loneliness, getting lost, meeting people)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!stDest.trim())return;setStLoading(true);setStRes(null);try{const r=await fetch(`${''}/api/solo/travel`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({destination:stDest,experience_level:stLevel,concerns:stConcerns,traveler_type:stType})});const d=await r.json();setStRes(d);}catch(e){console.error(e);}finally{setStLoading(false);}}} disabled={stLoading||!stDest.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {stLoading?'Coaching...':'Coach Me For Solo Travel 🚀'}
                </button>
              </div>
              {stRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🌟 Why Solo Travel: </strong>{stRes.solo_advantage}</div>
                {stRes.first_day_blueprint&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📅 First 24 Hours: </strong>{stRes.first_day_blueprint}</div>}
                {Array.isArray(stRes.safety_playbook)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛡️ Safety Playbook:</strong>{stRes.safety_playbook.map((s:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong>{s.situation}:</strong> {s.action}<br/><span style={{opacity:0.7,fontSize:'0.85rem',fontStyle:'italic'}}>{s.mindset}</span></div>)}</div>}
                {Array.isArray(stRes.meeting_people)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>👋 Meeting People:</strong>{stRes.meeting_people.map((m:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><strong>{m.method}</strong> — {m.how_to}</div>)}</div>}
                {Array.isArray(stRes.handling_loneliness)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💙 Handling Loneliness:</strong><ul style={{margin:'0.25rem 0 0',paddingLeft:'1.25rem'}}>{stRes.handling_loneliness.map((h:string,i:number)=><li key={i}>{h}</li>)}</ul></div>}
                {stRes.emergency_protocol&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🆘 If Something Goes Wrong: </strong>{stRes.emergency_protocol}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_griefcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [gcLoss, setGcLoss] = React.useState('');
          const [gcTime, setGcTime] = React.useState('');
          const [gcState, setGcState] = React.useState('');
          const [gcRes, setGcRes] = React.useState<any>(null);
          const [gcLoading, setGcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>💙 Grief Coach</h2>
              <p style={{opacity:0.7,marginBottom:'1.5rem',fontSize:'0.9rem'}}>Educational and supportive guidance. Not a replacement for therapy or professional grief support.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={gcLoss} onChange={e=>setGcLoss(e.target.value)} placeholder="Type of loss (e.g. death of parent, end of relationship, job loss, miscarriage)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={gcTime} onChange={e=>setGcTime(e.target.value)} placeholder="How long ago (e.g. 2 weeks, 6 months, 3 years)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={gcState} onChange={e=>setGcState(e.target.value)} placeholder="How you\'re feeling right now" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <button onClick={async()=>{if(!gcLoss.trim())return;setGcLoading(true);setGcRes(null);try{const r=await fetch(`${''}/api/grief/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({loss_type:gcLoss,time_since:gcTime,current_state:gcState})});const d=await r.json();setGcRes(d);}catch(e){console.error(e);}finally{setGcLoading(false);}}} disabled={gcLoading||!gcLoss.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {gcLoading?'Gathering support...':'Get Grief Support 💙'}
                </button>
              </div>
              {gcRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.5rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid #60a5fa'}}><p style={{lineHeight:1.8}}>{gcRes.validation}</p></div>
                {gcRes.what_youre_experiencing&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>What You\'re Experiencing:</strong><p style={{marginTop:'0.5rem',lineHeight:1.7}}>{gcRes.what_youre_experiencing}</p></div>}
                {Array.isArray(gcRes.coping_tools)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🛠️ Coping Tools:</strong>{gcRes.coping_tools.map((t:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700,marginBottom:'0.25rem'}}>{t.tool} <span style={{fontWeight:400,opacity:0.6,fontSize:'0.85rem'}}>{t.when_to_use}</span></div><div style={{fontSize:'0.9rem',lineHeight:1.6}}>{t.how_to}</div></div>)}</div>}
                {Array.isArray(gcRes.things_that_help)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>✅ Things That Help:</strong><ul style={{margin:'0.25rem 0 0',paddingLeft:'1.25rem'}}>{gcRes.things_that_help.map((h:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{h}</li>)}</ul></div>}
                {gcRes.one_small_step&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>One Small Step Today: </strong>{gcRes.one_small_step}</div>}
                {gcRes.when_to_seek_professional_help&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',opacity:0.9}}><strong>🏥 Professional Support: </strong>{gcRes.when_to_seek_professional_help}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_angermanage() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [amTrigger, setAmTrigger] = React.useState('');
          const [amStyle, setAmStyle] = React.useState('');
          const [amImpact, setAmImpact] = React.useState('');
          const [amRes, setAmRes] = React.useState<any>(null);
          const [amLoading, setAmLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🌋 Anger Manager</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={amTrigger} onChange={e=>setAmTrigger(e.target.value)} placeholder="What triggers your anger? Describe patterns (e.g. criticism from partner, traffic, feeling disrespected at work)" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={amStyle} onChange={e=>setAmStyle(e.target.value)} placeholder="How anger shows up (e.g. explosive outbursts, silent treatment, passive aggression)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={amImpact} onChange={e=>setAmImpact(e.target.value)} placeholder="Impact on your life (e.g. damaging relationships, work problems, regret after)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!amTrigger.trim())return;setAmLoading(true);setAmRes(null);try{const r=await fetch(`${''}/api/anger/manage`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({trigger_pattern:amTrigger,anger_style:amStyle,impact:amImpact})});const d=await r.json();setAmRes(d);}catch(e){console.error(e);}finally{setAmLoading(false);}}} disabled={amLoading||!amTrigger.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {amLoading?'Analyzing...':'Get Anger Tools 🧰'}
                </button>
              </div>
              {amRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔄 Reframe: </strong>{amRes.anger_reframe}</div>
                {amRes.the_neuroscience&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🧠 The Science: </strong>{amRes.the_neuroscience}</div>}
                {Array.isArray(amRes.in_the_moment_toolkit)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚡ In-The-Moment Toolkit:</strong>{amRes.in_the_moment_toolkit.map((t:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700,marginBottom:'0.5rem'}}>{t.technique} <span style={{fontWeight:400,opacity:0.6,fontSize:'0.85rem'}}>({t.time_needed})</span></div>{Array.isArray(t.steps)&&<ol style={{margin:0,paddingLeft:'1.25rem',fontSize:'0.9rem'}}>{t.steps.map((s:string,j:number)=><li key={j}>{s}</li>)}</ol>}</div>)}</div>}
                {Array.isArray(amRes.communication_scripts)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💬 Better Scripts:</strong>{amRes.communication_scripts.map((s:any,i:number)=><div key={i} style={{marginTop:'0.75rem',padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{fontSize:'0.8rem',opacity:0.6,marginBottom:'0.25rem'}}>{s.situation}</div><div style={{color:'#ef4444',fontSize:'0.85rem',marginBottom:'0.25rem'}}>❌ "{s.reactive_response}"</div><div style={{color:'#22c55e',fontSize:'0.85rem'}}>✓ "{s.constructive_response}"</div></div>)}</div>}
                {amRes.pattern_interrupt&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛑 Pattern Interrupt: </strong>{amRes.pattern_interrupt}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_traumaedu() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [teType, setTeType] = React.useState('');
          const [teSymptoms, setTeSymptoms] = React.useState('');
          const [teGoals, setTeGoals] = React.useState('');
          const [teRes, setTeRes] = React.useState<any>(null);
          const [teLoading, setTeLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🧠 Trauma Educator</h2>
              <p style={{opacity:0.7,marginBottom:'1.5rem',fontSize:'0.9rem'}}>Educational psychoeducation about trauma. Deep healing requires a trauma-informed therapist.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={teType} onChange={e=>setTeType(e.target.value)} placeholder="Trauma context (e.g. childhood neglect, abusive relationship, accident, loss)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={teSymptoms} onChange={e=>setTeSymptoms(e.target.value)} placeholder="Symptoms you notice (e.g. hypervigilance, numbness, flashbacks, avoidance)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={teGoals} onChange={e=>setTeGoals(e.target.value)} placeholder="Learning goals (e.g. understand why I react this way, how to start healing)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!teType.trim())return;setTeLoading(true);setTeRes(null);try{const r=await fetch(`${''}/api/trauma/educate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({trauma_type:teType,symptoms_experiencing:teSymptoms,learning_goals:teGoals})});const d=await r.json();setTeRes(d);}catch(e){console.error(e);}finally{setTeLoading(false);}}} disabled={teLoading||!teType.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {teLoading?'Loading...':'Get Trauma Education 📚'}
                </button>
              </div>
              {teRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.5rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><p style={{lineHeight:1.8}}>{teRes.you_are_not_broken}</p></div>
                {teRes.what_trauma_does_to_the_brain&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🧠 What Trauma Does to the Brain:</strong><p style={{marginTop:'0.5rem',lineHeight:1.7}}>{teRes.what_trauma_does_to_the_brain}</p></div>}
                {teRes.why_symptoms_make_sense&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💡 Why Your Symptoms Make Sense:</strong><p style={{marginTop:'0.5rem',lineHeight:1.7}}>{teRes.why_symptoms_make_sense}</p></div>}
                {Array.isArray(teRes.grounding_techniques)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚓ Grounding Techniques:</strong>{teRes.grounding_techniques.map((g:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700,marginBottom:'0.5rem'}}>{g.technique}</div>{Array.isArray(g.steps)&&<ol style={{margin:0,paddingLeft:'1.25rem',fontSize:'0.9rem'}}>{g.steps.map((s:string,j:number)=><li key={j}>{s}</li>)}</ol>}</div>)}</div>}
                {Array.isArray(teRes.trauma_informed_therapies)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏥 Evidence-Based Therapies:</strong>{teRes.trauma_informed_therapies.map((t:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><strong>{t.therapy}</strong>: {t.how_it_works} <span style={{opacity:0.7,fontSize:'0.85rem'}}>— Good for: {t.good_for}</span></div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_mindsetcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mcBelief, setMcBelief] = React.useState('');
          const [mcArea, setMcArea] = React.useState('');
          const [mcDesired, setMcDesired] = React.useState('');
          const [mcRes, setMcRes] = React.useState<any>(null);
          const [mcLoading, setMcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🔮 Mindset Coach</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={mcBelief} onChange={e=>setMcBelief(e.target.value)} placeholder="Limiting belief or pattern (e.g. 'I\'m not smart enough', 'I always self-sabotage', 'I don\'t deserve success')" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={mcArea} onChange={e=>setMcArea(e.target.value)} placeholder="Life area most affected (e.g. career, relationships, finances, health)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={mcDesired} onChange={e=>setMcDesired(e.target.value)} placeholder="Desired mindset shift (e.g. confident, abundant, worthy, capable)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!mcBelief.trim())return;setMcLoading(true);setMcRes(null);try{const r=await fetch(`${''}/api/mindset/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({limiting_belief:mcBelief,life_area:mcArea,desired_shift:mcDesired})});const d=await r.json();setMcRes(d);}catch(e){console.error(e);}finally{setMcLoading(false);}}} disabled={mcLoading||!mcBelief.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {mcLoading?'Coaching...':'Shift My Mindset 🚀'}
                </button>
              </div>
              {mcRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {mcRes.belief_anatomy&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔍 Belief Anatomy: </strong>{mcRes.belief_anatomy}</div>}
                {mcRes.evidence_audit&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📊 Evidence Audit:</strong><div style={{marginTop:'0.5rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}><div style={{padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)',borderLeft:'3px solid #ef4444'}}><div style={{fontSize:'0.75rem',opacity:0.6}}>SEEMS TRUE</div><div style={{fontSize:'0.9rem',marginTop:'0.25rem'}}>{mcRes.evidence_audit.supporting_evidence}</div></div><div style={{padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)',borderLeft:'3px solid #22c55e'}}><div style={{fontSize:'0.75rem',opacity:0.6}}>ACTUALLY</div><div style={{fontSize:'0.9rem',marginTop:'0.25rem'}}>{mcRes.evidence_audit.counter_evidence}</div></div></div><div style={{marginTop:'0.5rem',padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)',fontWeight:600}}>{mcRes.evidence_audit.conclusion}</div></div>}
                {Array.isArray(mcRes.new_belief_options)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>✨ New Belief Options:</strong>{mcRes.new_belief_options.map((b:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600,fontSize:'1rem',marginBottom:'0.25rem'}}>{b.belief}</div><div style={{opacity:0.7,fontSize:'0.85rem',marginBottom:'0.5rem'}}>{b.why_it_works}</div><div style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)',fontStyle:'italic',fontSize:'0.9rem'}}>💭 "{b.affirmation}"</div></div>)}</div>}
                {mcRes['30_day_experiment']&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🗓️ 30-Day Experiment: </strong>{mcRes['30_day_experiment']}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_innerchild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [icPattern, setIcPattern] = React.useState('');
          const [icTrigger, setIcTrigger] = React.useState('');
          const [icIntention, setIcIntention] = React.useState('');
          const [icRes, setIcRes] = React.useState<any>(null);
          const [icLoading, setIcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🌱 Inner Child Work</h2>
              <p style={{opacity:0.7,marginBottom:'1.5rem',fontSize:'0.9rem'}}>Educational exercises for self-understanding. Deep inner child work is best done with a therapist.</p>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={icPattern} onChange={e=>setIcPattern(e.target.value)} placeholder="Pattern from childhood you recognize (e.g. learned to suppress emotions, felt like a burden, had to be perfect to be loved)" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={icTrigger} onChange={e=>setIcTrigger(e.target.value)} placeholder="Current triggers that connect to this (e.g. rejection, criticism, feeling invisible, being controlled)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={icIntention} onChange={e=>setIcIntention(e.target.value)} placeholder="Healing intention (e.g. be more compassionate to myself, understand my patterns)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!icPattern.trim())return;setIcLoading(true);setIcRes(null);try{const r=await fetch(`${''}/api/inner/child`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({childhood_pattern:icPattern,current_trigger:icTrigger,healing_intention:icIntention})});const d=await r.json();setIcRes(d);}catch(e){console.error(e);}finally{setIcLoading(false);}}} disabled={icLoading||!icPattern.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {icLoading?'Loading...':'Begin Inner Child Work 🌱'}
                </button>
              </div>
              {icRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.5rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid #a78bfa'}}><p style={{lineHeight:1.8}}>{icRes.inner_child_concept}</p></div>
                {icRes.connection_to_present&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔗 Connection to Now:</strong><p style={{marginTop:'0.5rem',lineHeight:1.7}}>{icRes.connection_to_present}</p></div>}
                {icRes.what_your_inner_child_needs&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💝 What Your Inner Child Needs:</strong><p style={{marginTop:'0.5rem'}}>{icRes.what_your_inner_child_needs}</p></div>}
                {Array.isArray(icRes.exercises)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🌿 Exercises:</strong>{icRes.exercises.map((ex:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700,marginBottom:'0.25rem'}}>{ex.exercise}</div><div style={{opacity:0.7,fontSize:'0.85rem',marginBottom:'0.5rem'}}>{ex.intention}</div>{Array.isArray(ex.instructions)&&<ol style={{margin:0,paddingLeft:'1.25rem',fontSize:'0.9rem'}}>{ex.instructions.map((s:string,j:number)=><li key={j}>{s}</li>)}</ol>}{ex.what_might_come_up&&<div style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.85rem',opacity:0.8}}>⚠️ {ex.what_might_come_up}</div>}</div>)}</div>}
                {Array.isArray(icRes.self_talk_shift)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💬 Reparenting Your Self-Talk:</strong>{icRes.self_talk_shift.map((s:any,i:number)=><div key={i} style={{marginTop:'0.75rem',padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{color:'#ef4444',fontSize:'0.85rem',marginBottom:'0.25rem'}}>Inner critic: "{s.old_self_talk}"</div><div style={{color:'#22c55e',fontSize:'0.85rem'}}>Loving parent: "{s.reparenting_response}"</div></div>)}</div>}
                {icRes.daily_practice&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🌅 Daily Practice: </strong>{icRes.daily_practice}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_startupvalidate() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [svIdea, setSvIdea] = React.useState('');
          const [svMarket, setSvMarket] = React.useState('');
          const [svProblem, setSvProblem] = React.useState('');
          const [svSolution, setSvSolution] = React.useState('');
          const [svRes, setSvRes] = React.useState<any>(null);
          const [svLoading, setSvLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🚀 Startup Validator</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={svIdea} onChange={e=>setSvIdea(e.target.value)} placeholder="Your startup idea (be specific)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={svMarket} onChange={e=>setSvMarket(e.target.value)} placeholder="Target market (who specifically)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <textarea value={svProblem} onChange={e=>setSvProblem(e.target.value)} placeholder="Problem being solved (describe the pain in detail)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <textarea value={svSolution} onChange={e=>setSvSolution(e.target.value)} placeholder="Your solution / how it works" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <button onClick={async()=>{if(!svIdea.trim())return;setSvLoading(true);setSvRes(null);try{const r=await fetch(`${''}/api/startup/validate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({idea:svIdea,target_market:svMarket,problem:svProblem,solution:svSolution})});const d=await r.json();setSvRes(d);}catch(e){console.error(e);}finally{setSvLoading(false);}}} disabled={svLoading||!svIdea.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {svLoading?'Validating...':'Validate My Idea 🔍'}
                </button>
              </div>
              {svRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{fontSize:'1.1rem'}}>Verdict: </strong>{svRes.verdict}</div>
                {svRes.market_size&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📏 Market Size:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(svRes.market_size).map(([k,v])=><div key={k} style={{padding:'0.75rem',borderRadius:'6px',background:'var(--bg-primary)',textAlign:'center'}}><div style={{fontSize:'0.7rem',opacity:0.6}}>{k.toUpperCase()}</div><div style={{fontWeight:600,marginTop:'0.25rem',fontSize:'0.9rem'}}>{v as string}</div></div>)}</div></div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  {Array.isArray(svRes.green_lights)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong style={{color:'#22c55e'}}>✅ Green Lights</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{svRes.green_lights.map((g:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{g}</li>)}</ul></div>}
                  {Array.isArray(svRes.red_flags)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong style={{color:'#ef4444'}}>🚩 Red Flags</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{svRes.red_flags.map((r:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{r}</li>)}</ul></div>}
                </div>
                {Array.isArray(svRes.critical_assumptions)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎯 Critical Assumptions to Test:</strong>{svRes.critical_assumptions.map((a:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong>{a.assumption}</strong><br/><span style={{opacity:0.7,fontSize:'0.85rem'}}>Test by: {a.how_to_test}</span></div>)}</div>}
                {Array.isArray(svRes.next_3_actions)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏃 Next 3 Actions:</strong><ol style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{svRes.next_3_actions.map((a:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{a}</li>)}</ol></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_pitchdeckbuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pdName, setPdName] = React.useState('');
          const [pdIndustry, setPdIndustry] = React.useState('');
          const [pdProblem, setPdProblem] = React.useState('');
          const [pdSolution, setPdSolution] = React.useState('');
          const [pdAsk, setPdAsk] = React.useState('seed round');
          const [pdRes, setPdRes] = React.useState<any>(null);
          const [pdLoading, setPdLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📊 Pitch Deck Builder</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={pdName} onChange={e=>setPdName(e.target.value)} placeholder="Company name" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={pdIndustry} onChange={e=>setPdIndustry(e.target.value)} placeholder="Industry / space" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={pdProblem} onChange={e=>setPdProblem(e.target.value)} placeholder="Problem you solve" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pdSolution} onChange={e=>setPdSolution(e.target.value)} placeholder="Your solution" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <select value={pdAsk} onChange={e=>setPdAsk(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['pre-seed round','seed round','Series A','Series B','bridge round','strategic partner'].map(a=><option key={a} value={a}>{a}</option>)}
                </select>
                <button onClick={async()=>{if(!pdName.trim()||!pdProblem.trim())return;setPdLoading(true);setPdRes(null);try{const r=await fetch(`${''}/api/pitchdeck/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({company_name:pdName,industry:pdIndustry,problem:pdProblem,solution:pdSolution,ask:pdAsk})});const d=await r.json();setPdRes(d);}catch(e){console.error(e);}finally{setPdLoading(false);}}} disabled={pdLoading||!pdName.trim()||!pdProblem.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {pdLoading?'Building...':'Build My Pitch Deck 🎯'}
                </button>
              </div>
              {pdRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {pdRes.opening_hook&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🎣 Opening Hook: </strong>{pdRes.opening_hook}</div>}
                {Array.isArray(pdRes.deck_structure)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📑 Slide-by-Slide:</strong>{pdRes.deck_structure.map((s:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',gap:'0.75rem',marginBottom:'0.5rem'}}><div style={{minWidth:'1.5rem',fontWeight:700,opacity:0.5}}>{i+1}</div><div style={{fontWeight:700}}>{s.slide}</div></div><div style={{fontStyle:'italic',marginBottom:'0.5rem',paddingLeft:'2.25rem'}}>"{s.headline}"</div><div style={{opacity:0.8,fontSize:'0.9rem',paddingLeft:'2.25rem'}}>{s.content}</div>{s.storytelling_tip&&<div style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.85rem',opacity:0.8,paddingLeft:'2.25rem'}}>💡 {s.storytelling_tip}</div>}</div>)}</div>}
                {pdRes.one_pager_version&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📄 One-Pager Version:</strong><p style={{marginTop:'0.5rem',lineHeight:1.7}}>{pdRes.one_pager_version}</p></div>}
                {Array.isArray(pdRes.common_mistakes)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚠️ Common Mistakes to Avoid:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{pdRes.common_mistakes.map((m:string,i:number)=><li key={i}>{m}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_investoremail() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ieStartup, setIeStartup] = React.useState('');
          const [ieStage, setIeStage] = React.useState('');
          const [ieTraction, setIeTraction] = React.useState('');
          const [ieAsk, setIeAsk] = React.useState('intro call');
          const [ieRes, setIeRes] = React.useState<any>(null);
          const [ieLoading, setIeLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📧 Investor Email Writer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={ieStartup} onChange={e=>setIeStartup(e.target.value)} placeholder="Startup name and one-line description" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ieStage} onChange={e=>setIeStage(e.target.value)} placeholder="Stage (e.g. pre-seed, seed, $50K ARR, 500 users)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ieTraction} onChange={e=>setIeTraction(e.target.value)} placeholder="Key traction / metrics (be specific)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <select value={ieAsk} onChange={e=>setIeAsk(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['intro call','review deck','invest in round','intro to their network','advice/mentorship'].map(a=><option key={a} value={a}>{a}</option>)}
                </select>
                <button onClick={async()=>{if(!ieStartup.trim())return;setIeLoading(true);setIeRes(null);try{const r=await fetch(`${''}/api/investor/email`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({startup_name:ieStartup,stage:ieStage,traction:ieTraction,ask:ieAsk})});const d=await r.json();setIeRes(d);}catch(e){console.error(e);}finally{setIeLoading(false);}}} disabled={ieLoading||!ieStartup.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ieLoading?'Writing...':'Write Investor Email ✉️'}
                </button>
              </div>
              {ieRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {Array.isArray(ieRes.subject_lines)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📌 Subject Lines:</strong>{ieRes.subject_lines.map((s:string,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)',fontWeight:i===0?600:400}}>{i+1}. {s}</div>)}</div>}
                {Array.isArray(ieRes.email_versions)&&ieRes.email_versions.map((v:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📬 {v.version}:</strong><pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',fontSize:'0.9rem',marginTop:'0.5rem',lineHeight:1.7}}>{v.content}</pre></div>)}
                {Array.isArray(ieRes.follow_up_sequence)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔄 Follow-up Sequence:</strong>{ieRes.follow_up_sequence.map((f:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong>Day {f.day}:</strong> {f.message}</div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_mvpdesign() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mvIdea, setMvIdea] = React.useState('');
          const [mvUser, setMvUser] = React.useState('');
          const [mvProblem, setMvProblem] = React.useState('');
          const [mvTimeline, setMvTimeline] = React.useState('8 weeks');
          const [mvRes, setMvRes] = React.useState<any>(null);
          const [mvLoading, setMvLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🔧 MVP Designer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={mvIdea} onChange={e=>setMvIdea(e.target.value)} placeholder="Product idea" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={mvUser} onChange={e=>setMvUser(e.target.value)} placeholder="Target user (be specific)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={mvProblem} onChange={e=>setMvProblem(e.target.value)} placeholder="Core problem to solve / hypothesis to test" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <select value={mvTimeline} onChange={e=>setMvTimeline(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['2 weeks','4 weeks','6 weeks','8 weeks','12 weeks'].map(t=><option key={t} value={t}>{t} timeline</option>)}
                </select>
                <button onClick={async()=>{if(!mvIdea.trim())return;setMvLoading(true);setMvRes(null);try{const r=await fetch(`${''}/api/mvp/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({idea:mvIdea,target_user:mvUser,core_problem:mvProblem,timeline:mvTimeline})});const d=await r.json();setMvRes(d);}catch(e){console.error(e);}finally{setMvLoading(false);}}} disabled={mvLoading||!mvIdea.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {mvLoading?'Designing...':'Design My MVP 🏗️'}
                </button>
              </div>
              {mvRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🎯 MVP Hypothesis: </strong>{mvRes.mvp_philosophy}</div>
                <div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏗️ What to Build: </strong>{mvRes.what_to_build}</div>
                {Array.isArray(mvRes.what_not_to_build)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚫 Cut These:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{mvRes.what_not_to_build.map((w:string,i:number)=><li key={i}>{w}</li>)}</ul></div>}
                {Array.isArray(mvRes.feature_list)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>✅ MVP Features:</strong>{mvRes.feature_list.map((f:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><div style={{fontWeight:600}}>{f.feature}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{f.validates}</div></div><div style={{display:'flex',gap:'0.5rem',alignItems:'flex-start'}}><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.75rem'}}>{f.effort}</span></div></div>)}</div>}
                {Array.isArray(mvRes.week_by_week_plan)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📅 Week-by-Week:</strong>{mvRes.week_by_week_plan.map((w:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong>Week {w.week}:</strong> {w.goals} <span style={{opacity:0.6,fontSize:'0.85rem'}}>→ {w.milestone}</span></div>)}</div>}
                {mvRes.kill_criteria&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💀 Kill Criteria: </strong>{mvRes.kill_criteria}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_cofoundermatch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cfSkills, setCfSkills] = React.useState('');
          const [cfStartup, setCfStartup] = React.useState('');
          const [cfIdeal, setCfIdeal] = React.useState('');
          const [cfRes, setCfRes] = React.useState<any>(null);
          const [cfLoading, setCfLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🤝 Co-founder Matcher</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={cfSkills} onChange={e=>setCfSkills(e.target.value)} placeholder="Your skills and background (e.g. engineer, 5 yrs backend, no biz experience)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={cfStartup} onChange={e=>setCfStartup(e.target.value)} placeholder="Startup type (e.g. B2B SaaS, consumer app, marketplace, hardware)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={cfIdeal} onChange={e=>setCfIdeal(e.target.value)} placeholder="Ideal co-founder traits (skills, personality, background)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!cfSkills.trim()||!cfStartup.trim())return;setCfLoading(true);setCfRes(null);try{const r=await fetch(`${''}/api/cofounder/match`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({your_skills:cfSkills,startup_type:cfStartup,ideal_cofounder:cfIdeal})});const d=await r.json();setCfRes(d);}catch(e){console.error(e);}finally{setCfLoading(false);}}} disabled={cfLoading||!cfSkills.trim()||!cfStartup.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {cfLoading?'Analyzing...':'Find My Co-founder Profile 🔍'}
                </button>
              </div>
              {cfRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {cfRes.cofounder_fit_analysis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔍 Fit Analysis: </strong>{cfRes.cofounder_fit_analysis}</div>}
                {cfRes.ideal_cofounder_profile&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>👤 Ideal Profile:</strong><div style={{marginTop:'0.75rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}><div><strong>Must-have skills: </strong>{Array.isArray(cfRes.ideal_cofounder_profile.must_have_skills)?cfRes.ideal_cofounder_profile.must_have_skills.join(', '):cfRes.ideal_cofounder_profile.must_have_skills}</div><div><strong>Personality: </strong>{Array.isArray(cfRes.ideal_cofounder_profile.personality_traits)?cfRes.ideal_cofounder_profile.personality_traits.join(', '):cfRes.ideal_cofounder_profile.personality_traits}</div><div><strong>Background: </strong>{cfRes.ideal_cofounder_profile.background}</div>{Array.isArray(cfRes.ideal_cofounder_profile.red_flags)&&<div style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong style={{color:'#ef4444'}}>Red flags: </strong>{cfRes.ideal_cofounder_profile.red_flags.join(' · ')}</div>}</div></div>}
                {Array.isArray(cfRes.where_to_find)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📍 Where to Find:</strong>{cfRes.where_to_find.map((w:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><strong>{w.source}:</strong> {w.approach}</div>)}</div>}
                {Array.isArray(cfRes.trial_project_ideas)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🧪 Trial Projects:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{cfRes.trial_project_ideas.map((p:string,i:number)=><li key={i}>{p}</li>)}</ul></div>}
                {cfRes.equity_conversation&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💰 Equity Talk: </strong>{cfRes.equity_conversation}</div>}
                {cfRes.solo_vs_cofounder&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚖️ Solo vs Co-founder: </strong>{cfRes.solo_vs_cofounder}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_parentadvise() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [paAge, setPaAge] = React.useState('');
          const [paChallenge, setPaChallenge] = React.useState('');
          const [paContext, setPaContext] = React.useState('');
          const [paRes, setPaRes] = React.useState<any>(null);
          const [paLoading, setPaLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>👶 Parenting Advisor</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={paAge} onChange={e=>setPaAge(e.target.value)} placeholder="Child\'s age (e.g. 3 years, 8 months, 14 years)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <textarea value={paChallenge} onChange={e=>setPaChallenge(e.target.value)} placeholder="What challenge are you facing? (e.g. tantrums, sleep issues, screen time, defiance)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <textarea value={paContext} onChange={e=>setPaContext(e.target.value)} placeholder="Additional context (what you\'ve tried, family situation, anything relevant)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <button onClick={async()=>{if(!paAge.trim()||!paChallenge.trim())return;setPaLoading(true);setPaRes(null);try{const r=await fetch(`${''}/api/parenting/advise`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({child_age:paAge,challenge:paChallenge,context:paContext})});const d=await r.json();setPaRes(d);}catch(e){console.error(e);}finally{setPaLoading(false);}}} disabled={paLoading||!paAge.trim()||!paChallenge.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {paLoading?'Getting advice...':'Get Parenting Advice 💡'}
                </button>
              </div>
              {paRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {paRes.empathy_statement&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic'}}>{paRes.empathy_statement}</div>}
                {paRes.developmental_context&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🧠 Why This Happens:</strong><p style={{marginTop:'0.5rem',lineHeight:1.7}}>{paRes.developmental_context}</p></div>}
                {Array.isArray(paRes.strategies)&&<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}><strong>🎯 Strategies:</strong>{paRes.strategies.map((s:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600,marginBottom:'0.5rem'}}>✅ {s.strategy}</div><div style={{marginBottom:'0.5rem'}}>{s.how_to}</div>{s.what_to_say&&<div style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)',fontStyle:'italic',fontSize:'0.9rem'}}>💬 "{s.what_to_say}"</div>}</div>)}</div>}
                {Array.isArray(paRes.what_not_to_do)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong style={{color:'#ef4444'}}>🚫 What Not to Do:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{paRes.what_not_to_do.map((w:string,i:number)=><li key={i}>{w}</li>)}</ul></div>}
                {paRes.self_care_reminder&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>💜 Self-care reminder: </strong>{paRes.self_care_reminder}</div>}
                {paRes.when_to_seek_help&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏥 When to Seek Help: </strong>{paRes.when_to_seek_help}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_familymeeting() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fmSize, setFmSize] = React.useState('');
          const [fmTopics, setFmTopics] = React.useState('');
          const [fmAges, setFmAges] = React.useState('');
          const [fmRes, setFmRes] = React.useState<any>(null);
          const [fmLoading, setFmLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🏠 Family Meeting Planner</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={fmSize} onChange={e=>setFmSize(e.target.value)} placeholder="Family size (e.g. 4 people, 2 adults + 2 kids)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={fmAges} onChange={e=>setFmAges(e.target.value)} placeholder="Kids' ages (e.g. 6, 9, 14)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <textarea value={fmTopics} onChange={e=>setFmTopics(e.target.value)} placeholder="Topics to discuss (e.g. screen time rules, chores, weekend plans, family conflict)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <button onClick={async()=>{if(!fmSize.trim()||!fmTopics.trim())return;setFmLoading(true);setFmRes(null);try{const r=await fetch(`${''}/api/family/meeting`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({family_size:fmSize,topics:fmTopics,kids_ages:fmAges})});const d=await r.json();setFmRes(d);}catch(e){console.error(e);}finally{setFmLoading(false);}}} disabled={fmLoading||!fmSize.trim()||!fmTopics.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {fmLoading?'Planning...':'Plan Family Meeting 📅'}
                </button>
              </div>
              {fmRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  {fmRes.meeting_duration&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.8rem'}}>DURATION</div><div style={{fontWeight:700,marginTop:'0.25rem'}}>{fmRes.meeting_duration}</div></div>}
                  {fmRes.best_time_to_hold&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.8rem'}}>BEST TIME</div><div style={{fontWeight:700,marginTop:'0.25rem'}}>{fmRes.best_time_to_hold}</div></div>}
                </div>
                {Array.isArray(fmRes.ground_rules)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📜 Ground Rules:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{fmRes.ground_rules.map((r:string,i:number)=><li key={i}>{r}</li>)}</ul></div>}
                {Array.isArray(fmRes.agenda)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📋 Agenda:</strong>{fmRes.agenda.map((a:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{a.item}</strong><span style={{opacity:0.6,fontSize:'0.85rem'}}>{a.time_allotted}</span></div><div style={{opacity:0.8,marginBottom:'0.5rem'}}>{a.how_to_facilitate}</div>{a.age_appropriate_tip&&<div style={{padding:'0.375rem 0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.8rem',opacity:0.7}}>👧 {a.age_appropriate_tip}</div>}</div>)}</div>}
                {fmRes.closing_ritual&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎉 Closing Ritual: </strong>{fmRes.closing_ritual}</div>}
                {fmRes.follow_up&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔄 Follow Up: </strong>{fmRes.follow_up}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_chorechart() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ccKids, setCcKids] = React.useState('');
          const [ccAges, setCcAges] = React.useState('');
          const [ccHousehold, setCcHousehold] = React.useState('');
          const [ccRes, setCcRes] = React.useState<any>(null);
          const [ccLoading, setCcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📋 Chore Chart Builder</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={ccKids} onChange={e=>setCcKids(e.target.value)} placeholder="Kids' names (e.g. Emma, Jake, Lily)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ccAges} onChange={e=>setCcAges(e.target.value)} placeholder="Their ages (e.g. 7, 10, 13)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ccHousehold} onChange={e=>setCcHousehold(e.target.value)} placeholder="Household type (e.g. 3-bedroom house, apartment, pets yes/no)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!ccKids.trim()||!ccAges.trim())return;setCcLoading(true);setCcRes(null);try{const r=await fetch(`${''}/api/chore/chart`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({kids:ccKids,ages:ccAges,household_size:ccHousehold})});const d=await r.json();setCcRes(d);}catch(e){console.error(e);}finally{setCcLoading(false);}}} disabled={ccLoading||!ccKids.trim()||!ccAges.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ccLoading?'Building...':'Build Chore Chart 🧹'}
                </button>
              </div>
              {ccRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {ccRes.philosophy&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',fontStyle:'italic'}}>{ccRes.philosophy}</div>}
                {Array.isArray(ccRes.chore_chart)&&<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>{ccRes.chore_chart.map((c:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong style={{fontSize:'1.05rem'}}>👦 {c.child}</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginTop:'0.75rem'}}><div><div style={{fontWeight:600,opacity:0.7,fontSize:'0.8rem',marginBottom:'0.25rem'}}>DAILY</div>{Array.isArray(c.daily_chores)&&c.daily_chores.map((ch:string,j:number)=><div key={j} style={{padding:'0.25rem 0',opacity:0.9}}>• {ch}</div>)}</div><div><div style={{fontWeight:600,opacity:0.7,fontSize:'0.8rem',marginBottom:'0.25rem'}}>WEEKLY</div>{Array.isArray(c.weekly_chores)&&c.weekly_chores.map((ch:string,j:number)=><div key={j} style={{padding:'0.25rem 0',opacity:0.9}}>• {ch}</div>)}</div></div>{Array.isArray(c.skills_developed)&&<div style={{marginTop:'0.5rem',fontSize:'0.8rem',opacity:0.6}}>Skills: {c.skills_developed.join(', ')}</div>}</div>)}</div>}
                {ccRes.reward_system&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏆 Reward System ({ccRes.reward_system.type}):</strong><p style={{marginTop:'0.5rem'}}>{ccRes.reward_system.how_it_works}</p>{ccRes.reward_system.pitfalls&&<p style={{opacity:0.7,fontSize:'0.85rem',marginTop:'0.25rem'}}>⚠️ Avoid: {ccRes.reward_system.pitfalls}</p>}</div>}
                {ccRes.introduction_script&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💬 How to Introduce It:</strong><p style={{marginTop:'0.5rem',fontStyle:'italic'}}>{ccRes.introduction_script}</p></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_bedtimestory() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bsName, setBsName] = React.useState('');
          const [bsAge, setBsAge] = React.useState('');
          const [bsTheme, setBsTheme] = React.useState('');
          const [bsLength, setBsLength] = React.useState('medium');
          const [bsRes, setBsRes] = React.useState<any>(null);
          const [bsLoading, setBsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🌙 Bedtime Story Generator</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={bsName} onChange={e=>setBsName(e.target.value)} placeholder="Child\'s name" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={bsAge} onChange={e=>setBsAge(e.target.value)} placeholder="Age (e.g. 4, 7, 10)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={bsTheme} onChange={e=>setBsTheme(e.target.value)} placeholder="Theme/elements (e.g. dragons, space, unicorns, being brave, making friends)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <select value={bsLength} onChange={e=>setBsLength(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  <option value="short">Short (2-3 minutes)</option>
                  <option value="medium">Medium (5-7 minutes)</option>
                  <option value="long">Long (10+ minutes)</option>
                </select>
                <button onClick={async()=>{if(!bsName.trim()||!bsTheme.trim())return;setBsLoading(true);setBsRes(null);try{const r=await fetch(`${''}/api/bedtime/story`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({child_name:bsName,age:bsAge,theme:bsTheme,length:bsLength})});const d=await r.json();setBsRes(d);}catch(e){console.error(e);}finally{setBsLoading(false);}}} disabled={bsLoading||!bsName.trim()||!bsTheme.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {bsLoading?'Writing story...':'Write Bedtime Story ✨'}
                </button>
              </div>
              {bsRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {bsRes.title&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',textAlign:'center'}}><div style={{fontSize:'1.4rem',fontWeight:700}}>🌙 {bsRes.title}</div></div>}
                {bsRes.story&&<div style={{padding:'1.5rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',lineHeight:1.9,fontSize:'1.05rem'}}>{bsRes.story.split('\n\n').map((p:string,i:number)=><p key={i} style={{marginBottom:'1rem'}}>{p}</p>)}</div>}
                {bsRes.moral&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center',fontStyle:'italic'}}><strong>✨ Moral of the story: </strong>{bsRes.moral}</div>}
                {Array.isArray(bsRes.reading_tips)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📖 Reading Tips:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{bsRes.reading_tips.map((t:string,i:number)=><li key={i}>{t}</li>)}</ul></div>}
                {bsRes.sequel_hook&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🎭 Tomorrow night... </strong>{bsRes.sequel_hook}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_collegeprep() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cpGrade, setCpGrade] = React.useState('');
          const [cpInterests, setCpInterests] = React.useState('');
          const [cpSchools, setCpSchools] = React.useState('');
          const [cpBudget, setCpBudget] = React.useState('');
          const [cpRes, setCpRes] = React.useState<any>(null);
          const [cpLoading, setCpLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎓 College Prep Coach</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <select value={cpGrade} onChange={e=>setCpGrade(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  <option value="">Select grade...</option>
                  {['8th grade','9th grade (Freshman)','10th grade (Sophomore)','11th grade (Junior)','12th grade (Senior)'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <input value={cpInterests} onChange={e=>setCpInterests(e.target.value)} placeholder="Student\'s interests, passions, strengths (be specific)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={cpSchools} onChange={e=>setCpSchools(e.target.value)} placeholder="Dream schools or types (e.g. MIT, liberal arts colleges, in-state schools)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={cpBudget} onChange={e=>setCpBudget(e.target.value)} placeholder="Budget considerations (e.g. need full scholarship, middle income, no constraints)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!cpGrade||!cpInterests.trim())return;setCpLoading(true);setCpRes(null);try{const r=await fetch(`${''}/api/college/prep`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({student_grade:cpGrade,interests:cpInterests,dream_schools:cpSchools,budget:cpBudget})});const d=await r.json();setCpRes(d);}catch(e){console.error(e);}finally{setCpLoading(false);}}} disabled={cpLoading||!cpGrade||!cpInterests.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {cpLoading?'Building plan...':'Build College Prep Plan 🎯'}
                </button>
              </div>
              {cpRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {cpRes.timeline_overview&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🗺️ Overview: </strong>{cpRes.timeline_overview}</div>}
                {Array.isArray(cpRes.this_year_priorities)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🎯 This Year\'s Priorities:</strong>{cpRes.this_year_priorities.map((p:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600,marginBottom:'0.25rem'}}>{p.priority}</div><div style={{opacity:0.7,marginBottom:'0.5rem',fontSize:'0.85rem'}}>{p.why}</div>{Array.isArray(p.actions)&&p.actions.map((a:string,j:number)=><div key={j} style={{padding:'0.25rem 0',paddingLeft:'1rem'}}>→ {a}</div>)}</div>)}</div>}
                {cpRes.extracurricular_strategy&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏃 Extracurriculars:</strong><p style={{marginTop:'0.5rem',opacity:0.8}}>{cpRes.extracurricular_strategy.philosophy}</p>{Array.isArray(cpRes.extracurricular_strategy.recommendations)&&<ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{cpRes.extracurricular_strategy.recommendations.map((r:string,i:number)=><li key={i}>{r}</li>)}</ul>}</div>}
                {cpRes.test_prep_plan&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📝 Test Prep:</strong><div style={{marginTop:'0.5rem'}}>{cpRes.test_prep_plan.sat_act}</div>{Array.isArray(cpRes.test_prep_plan.ap_courses)&&<div style={{marginTop:'0.5rem',opacity:0.8}}>Suggested APs: {cpRes.test_prep_plan.ap_courses.join(', ')}</div>}</div>}
                {Array.isArray(cpRes.essay_themes)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>✍️ Essay Themes to Explore:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{cpRes.essay_themes.map((t:string,i:number)=><li key={i}>{t}</li>)}</ul></div>}
                {Array.isArray(cpRes.financial_aid_tips)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💰 Financial Aid Tips:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{cpRes.financial_aid_tips.map((t:string,i:number)=><li key={i}>{t}</li>)}</ul></div>}
                {cpRes.parent_role&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>👨‍👩‍👧 Parent Role: </strong>{cpRes.parent_role}</div>}
              </div>}
            </div>
          );
}
