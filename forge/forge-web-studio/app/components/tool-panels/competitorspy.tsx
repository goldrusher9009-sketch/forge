'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_competitorspy() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [company, setCompany] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/competitor/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const THREAT_COLOR:Record<string,string>={low:'#22c55e',medium:'#f59e0b',high:'#ef4444'};
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:900,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>🕵️ Competitor Spy</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Enter any company name. Get a full competitive intelligence report.</div>
              <div style={{display:'flex',gap:10,marginBottom:20}}>
                <input value={company} onChange={e=>setCompany(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&company.trim()&&!loading) document.getElementById('spy-btn')?.click();}} placeholder="Company name (e.g. Notion, Linear, Vercel…)" style={{flex:1,padding:'12px 16px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:14}} />
                <button id="spy-btn" disabled={loading||!company.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/competitor/analyze`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({company})});const d=await r.json();setResult(d);saveToolHistory('competitorspy','Competitor Spy',{company},d.verdict||d.overview||'');}catch(e:any){alert(e.message);}setLoading(false);}} style={{padding:'12px 24px',background:'#ef4444',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!company.trim()?0.5:1}}>{loading?'Analyzing…':'🕵️ Spy'}</button>
              </div>
              {result && <div>
                <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
                  <div style={{fontSize:18,fontWeight:700,color:'var(--fg-text)'}}>{result.company}</div>
                  <span style={{padding:'4px 12px',background:THREAT_COLOR[result.threat_level]+'22',border:`1px solid ${THREAT_COLOR[result.threat_level]}44`,borderRadius:16,fontSize:12,color:THREAT_COLOR[result.threat_level]}}>Threat: {result.threat_level}</span>
                  <button onClick={()=>{setResult(null);setCompany('');}} style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text2)',cursor:'pointer',marginLeft:'auto'}}>← New</button>
                </div>
                <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:14,marginBottom:14}}>
                  <div style={{fontSize:13,color:'var(--fg-text)',lineHeight:1.6,marginBottom:8}}>{result.overview}</div>
                  <div style={{display:'flex',gap:12,fontSize:12,color:'var(--fg-text3)',flexWrap:'wrap'}}>
                    <span>💰 {result.business_model}</span>
                    <span>🎯 {result.target_market}</span>
                    <span>💲 {result.pricing}</span>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
                  {[{title:'✅ Strengths',items:result.strengths,color:'#22c55e'},{title:'⚠️ Weaknesses',items:result.weaknesses,color:'#f59e0b'},{title:'🏹 How to Beat Them',items:result.opportunities_against_them,color:'#60a5fa'}].map(s=>(
                    <div key={s.title} style={{background:'var(--fg-bg2)',border:`1px solid ${s.color}33`,borderRadius:10,padding:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:8}}>{s.title}</div>
                      {(s.items||[]).map((item:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:4}}>• {item}</div>)}
                    </div>
                  ))}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {result.products?.length>0 && <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:6}}>📦 Products</div>
                    {result.products.map((p:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {p}</div>)}
                  </div>}
                  {result.recent_moves?.length>0 && <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:6}}>📰 Recent Moves</div>
                    {result.recent_moves.map((m:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {m}</div>)}
                  </div>}
                </div>
                {result.verdict && <div style={{marginTop:12,background:'linear-gradient(135deg,#7c3aed22,#ef444422)',border:'1px solid #7c3aed33',borderRadius:10,padding:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#a78bfa',marginBottom:6}}>🏆 VERDICT</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.6}}>{result.verdict}</div>
                </div>}
              </div>}
              {history.length>0 && !result && <div style={{marginTop:20}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Recent Reports</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {history.map((h:any)=><button key={h.id} onClick={()=>setCompany(h.company)} style={{padding:'6px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:20,fontSize:12,color:'var(--fg-text2)',cursor:'pointer'}}>🕵️ {h.company}</button>)}
                </div>
              </div>}
            </div>
          </div>);
}

export function ForgeTab_ailawyer() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [doc, setDoc] = React.useState('');
          const [docType, setDocType] = React.useState('contract');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          React.useEffect(()=>{fetch(`${API}/api/legal/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const RISK_COLOR:Record<string,string>={low:'#22c55e',medium:'#f59e0b',high:'#ef4444'};
          const DOC_TYPES=['contract','nda','lease','employment','terms-of-service','privacy-policy','partnership','loan','other'];
          const VERDICT_STYLE:Record<string,any>={sign:{bg:'#22c55e22',border:'#22c55e44',color:'#4ade80'},negotiate:{bg:'#f59e0b22',border:'#f59e0b44',color:'#fbbf24'},'walk-away':{bg:'#ef444422',border:'#ef444444',color:'#f87171'}};
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:900,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>⚖️ AI Lawyer</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:4}}>Paste any legal document for plain-English analysis. Red flags, missing protections, verdict.</div>
              <div style={{fontSize:11,color:'#f59e0b',marginBottom:20,padding:'6px 12px',background:'#f59e0b11',border:'1px solid #f59e0b33',borderRadius:8}}>⚠️ For informational purposes only — not legal advice. Consult a licensed attorney for binding decisions.</div>
              {!result ? (<>
                <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                  {DOC_TYPES.map(t=><button key={t} onClick={()=>setDocType(t)} style={{padding:'5px 12px',background:docType===t?'var(--fg-orange)':'var(--fg-bg2)',border:`1px solid ${docType===t?'var(--fg-orange)':'var(--fg-border)'}`,borderRadius:16,color:docType===t?'#fff':'var(--fg-text2)',fontSize:11,cursor:'pointer'}}>{t}</button>)}
                </div>
                <textarea value={doc} onChange={e=>setDoc(e.target.value)} placeholder="Paste your legal document here…" rows={12} style={{width:'100%',padding:'12px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,resize:'vertical',boxSizing:'border-box',marginBottom:12}} />
                <button disabled={loading||!doc.trim()} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/legal/review`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({document:doc,doc_type:docType})});const d=await r.json();setResult(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'#7c3aed',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!doc.trim()?0.5:1}}>{loading?'Analyzing…':'⚖️ Review Document'}</button>
              </>) : (<div>
                <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{padding:'6px 16px',background:RISK_COLOR[result.risk_level]+'22',border:`1px solid ${RISK_COLOR[result.risk_level]}44`,borderRadius:20,fontSize:13,fontWeight:700,color:RISK_COLOR[result.risk_level]}}>Risk: {result.risk_level?.toUpperCase()}</span>
                  {result.verdict && <span style={{padding:'6px 16px',background:VERDICT_STYLE[result.verdict]?.bg,border:`1px solid ${VERDICT_STYLE[result.verdict]?.border}`,borderRadius:20,fontSize:13,fontWeight:700,color:VERDICT_STYLE[result.verdict]?.color}}>Verdict: {result.verdict?.toUpperCase()}</span>}
                  <button onClick={()=>setResult(null)} style={{padding:'5px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text2)',cursor:'pointer',marginLeft:'auto'}}>← New</button>
                </div>
                <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:14,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:6,textTransform:'uppercase'}}>Summary</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.6}}>{result.summary}</div>
                </div>
                {result.red_flags?.length>0 && <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#f87171',marginBottom:8}}>🚨 Red Flags ({result.red_flags.length})</div>
                  {result.red_flags.map((f:any,i:number)=><div key={i} style={{background:'#ef444411',border:'1px solid #ef444433',borderRadius:8,padding:12,marginBottom:6}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:10,padding:'2px 8px',background:RISK_COLOR[f.severity]+'33',border:`1px solid ${RISK_COLOR[f.severity]}44`,borderRadius:10,color:RISK_COLOR[f.severity],fontWeight:700}}>{f.severity}</span>
                      <span style={{fontSize:12,color:'var(--fg-text)',fontStyle:'italic'}}>"{f.clause?.slice(0,100)}"</span>
                    </div>
                    <div style={{fontSize:13,color:'#f87171',fontWeight:500}}>{f.issue}</div>
                    <div style={{fontSize:12,color:'var(--fg-text3)',marginTop:2}}>{f.plain_english}</div>
                  </div>)}
                </div>}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                  {result.good_clauses?.length>0 && <div style={{background:'#22c55e11',border:'1px solid #22c55e33',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#4ade80',marginBottom:6}}>✅ Protective Clauses</div>
                    {result.good_clauses.map((c:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {c}</div>)}
                  </div>}
                  {result.missing_protections?.length>0 && <div style={{background:'#f59e0b11',border:'1px solid #f59e0b33',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#fbbf24',marginBottom:6}}>⚠️ Missing Protections</div>
                    {result.missing_protections.map((m:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {m}</div>)}
                  </div>}
                </div>
                {result.questions_to_ask?.length>0 && <div style={{background:'var(--fg-bg2)',border:'1px solid #60a5fa44',borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#60a5fa',marginBottom:6}}>❓ Questions to Ask</div>
                  {result.questions_to_ask.map((q:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:4}}>• {q}</div>)}
                </div>}
              </div>)}
              {history.length>0 && !result && <div style={{marginTop:20}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Past Reviews</div>
                {history.map((h:any)=><div key={h.id} style={{display:'flex',gap:10,padding:'8px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,fontSize:12,color:'var(--fg-text2)'}}>
                  <span style={{color:RISK_COLOR[h.risk_level]||'var(--fg-text3)',fontWeight:700}}>{h.risk_level}</span>
                  <span>{h.doc_type}</span>
                  <span style={{marginLeft:'auto',color:'var(--fg-text3)'}}>{h.created_at?.slice(0,10)}</span>
                </div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_financeadvisor() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [situation, setSituation] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          const EXAMPLES = ['I make $80k/year, have $12k in credit card debt at 22%, and $0 saved. What do I do?','I have $50k to invest and I\'m 30 years old. Where should I put it?','Should I pay off my student loans or invest in my 401k?','I want to buy a house in 2 years. How do I save for a down payment?'];
          React.useEffect(()=>{fetch(`${API}/api/finance/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:800,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>💰 Finance Advisor</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:4}}>Describe your financial situation. Get a personalized action plan.</div>
              <div style={{fontSize:11,color:'#60a5fa',marginBottom:20,padding:'6px 12px',background:'#60a5fa11',border:'1px solid #60a5fa33',borderRadius:8}}>ℹ️ Educational only — not professional financial advice. Consult a licensed advisor for major decisions.</div>
              {!result ? (<>
                <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
                  {EXAMPLES.map((e,i)=><button key={i} onClick={()=>setSituation(e)} style={{padding:'5px 10px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text3)',fontSize:11,cursor:'pointer',textAlign:'left'}}>{e.slice(0,40)}…</button>)}
                </div>
                <textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="Describe your financial situation in detail — income, debts, savings, goals…" rows={6} style={{width:'100%',padding:'12px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,resize:'vertical',boxSizing:'border-box',marginBottom:12}} />
                <button disabled={loading||!situation.trim()} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/finance/advise`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({situation})});const d=await r.json();setResult(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'#22c55e',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!situation.trim()?0.5:1}}>{loading?'Analyzing…':'💰 Get Advice'}</button>
              </>) : (<div>
                <div style={{display:'flex',gap:8,marginBottom:16}}>
                  <button onClick={()=>setResult(null)} style={{padding:'5px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text2)',cursor:'pointer'}}>← New</button>
                </div>
                <div style={{background:'var(--fg-bg2)',border:'1px solid #22c55e44',borderRadius:10,padding:14,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#4ade80',marginBottom:6,textTransform:'uppercase'}}>Assessment</div>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.6}}>{result.assessment}</div>
                </div>
                <div style={{display:'flex',gap:12,marginBottom:14,flexWrap:'wrap'}}>
                  {[{label:'Savings Rate',val:result.savings_rate_recommendation},{label:'Emergency Fund',val:result.emergency_fund_target}].map(m=><div key={m.label} style={{padding:'10px 16px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,textAlign:'center'}}>
                    <div style={{fontSize:11,color:'var(--fg-text3)',marginBottom:3}}>{m.label}</div>
                    <div style={{fontSize:16,fontWeight:700,color:'#22c55e'}}>{m.val}</div>
                  </div>)}
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text2)',marginBottom:10}}>📋 Action Plan (Priority Order)</div>
                  {(result.action_plan||[]).map((a:any,i:number)=><div key={i} style={{display:'flex',gap:12,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:6}}>
                    <span style={{fontSize:18,fontWeight:900,color:'#22c55e',minWidth:24}}>{a.priority}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--fg-text)'}}>{a.action}</div>
                      <div style={{fontSize:12,color:'var(--fg-text3)',marginTop:2}}>{a.why}</div>
                    </div>
                    <div style={{textAlign:'right',minWidth:80}}>
                      <div style={{fontSize:11,color:'#60a5fa'}}>{a.timeline}</div>
                      <div style={{fontSize:11,color:'#22c55e'}}>{a.estimated_impact}</div>
                    </div>
                  </div>)}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  {result.quick_wins?.length>0 && <div style={{background:'var(--fg-bg2)',border:'1px solid #22c55e33',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#4ade80',marginBottom:6}}>⚡ Quick Wins This Week</div>
                    {result.quick_wins.map((w:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {w}</div>)}
                  </div>}
                  {result.mistakes_to_avoid?.length>0 && <div style={{background:'var(--fg-bg2)',border:'1px solid #ef444433',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#f87171',marginBottom:6}}>🚫 Mistakes to Avoid</div>
                    {result.mistakes_to_avoid.map((m:string,i:number)=><div key={i} style={{fontSize:12,color:'var(--fg-text)',marginBottom:3}}>• {m}</div>)}
                  </div>}
                </div>
              </div>)}
            </div>
          </div>);
}

export function ForgeTab_languagetutor() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [language, setLanguage] = React.useState('Spanish');
          const [level, setLevel] = React.useState('beginner');
          const [topic, setTopic] = React.useState('');
          const [lesson, setLesson] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          const [translateText, setTranslateText] = React.useState('');
          const [translateTo, setTranslateTo] = React.useState('');
          const [translation, setTranslation] = React.useState<any>(null);
          const [tab, setTab] = React.useState<'lesson'|'translate'>('lesson');
          const [flipped, setFlipped] = React.useState<Record<number,boolean>>({});
          React.useEffect(()=>{fetch(`${API}/api/language/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const LANGS=['Spanish','French','Japanese','Mandarin','German','Portuguese','Italian','Korean','Arabic','Russian','Hindi','Dutch'];
          const LEVELS=['beginner','elementary','intermediate','upper-intermediate','advanced'];
          const TOPICS=['greetings','numbers','food & dining','travel','business','family','weather','shopping','health','directions','hobbies','emotions'];
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:800,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>🌍 Language Tutor</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Learn any language with AI-powered lessons, vocabulary, and instant translation.</div>
              <div style={{display:'flex',gap:4,marginBottom:20,background:'var(--fg-bg2)',borderRadius:10,padding:4}}>
                {(['lesson','translate'] as const).map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'8px',background:tab===t?'var(--fg-orange)':'transparent',border:'none',borderRadius:8,color:tab===t?'#fff':'var(--fg-text2)',fontSize:13,fontWeight:600,cursor:'pointer'}}>{t==='lesson'?'📚 Lesson':'🔄 Translate'}</button>)}
              </div>
              {tab==='lesson' && (<>
                <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
                  {LANGS.map(l=><button key={l} onClick={()=>setLanguage(l)} style={{padding:'4px 12px',background:language===l?'#3b82f6':'var(--fg-bg2)',border:`1px solid ${language===l?'#3b82f6':'var(--fg-border)'}`,borderRadius:16,color:language===l?'#fff':'var(--fg-text2)',fontSize:11,cursor:'pointer'}}>{l}</button>)}
                </div>
                <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
                  {LEVELS.map(l=><button key={l} onClick={()=>setLevel(l)} style={{padding:'4px 12px',background:level===l?'#7c3aed':'var(--fg-bg2)',border:`1px solid ${level===l?'#7c3aed':'var(--fg-border)'}`,borderRadius:16,color:level===l?'#fff':'var(--fg-text2)',fontSize:11,cursor:'pointer'}}>{l}</button>)}
                </div>
                <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                  {TOPICS.map(t=><button key={t} onClick={()=>setTopic(t)} style={{padding:'4px 10px',background:topic===t?'var(--fg-orange)':'var(--fg-bg2)',border:`1px solid ${topic===t?'var(--fg-orange)':'var(--fg-border)'}`,borderRadius:12,color:topic===t?'#fff':'var(--fg-text2)',fontSize:11,cursor:'pointer'}}>{t}</button>)}
                </div>
                <div style={{display:'flex',gap:8,marginBottom:16}}>
                  <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Or enter custom topic…" style={{flex:1,padding:'8px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text)',fontSize:13}} />
                  <button disabled={loading||!topic.trim()} onClick={async()=>{setLoading(true);setLesson(null);setFlipped({});try{const r=await fetch(`${API}/api/language/lesson`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({language,level,topic})});const d=await r.json();setLesson(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{padding:'8px 20px',background:'#3b82f6',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',opacity:loading||!topic.trim()?0.5:1}}>{loading?'Loading…':'📚 Start Lesson'}</button>
                </div>
                {lesson && <div>
                  <div style={{background:'var(--fg-bg2)',border:'1px solid #3b82f644',borderRadius:10,padding:14,marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#60a5fa',marginBottom:6}}>{lesson.language} · {lesson.level} · {lesson.topic}</div>
                    <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.6}}>{lesson.intro}</div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text2)',marginBottom:10}}>📖 Vocabulary</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
                      {(lesson.vocabulary||[]).map((v:any,i:number)=><div key={i} onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))} style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12,cursor:'pointer',minHeight:80,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                        {!flipped[i] ? (<>
                          <div style={{fontSize:16,fontWeight:700,color:'var(--fg-text)'}}>{v.word}</div>
                          <div style={{fontSize:11,color:'#60a5fa'}}>{v.pronunciation}</div>
                        </>) : (<>
                          <div style={{fontSize:13,color:'#22c55e',fontWeight:600}}>{v.meaning}</div>
                          <div style={{fontSize:11,color:'var(--fg-text3)',marginTop:4,fontStyle:'italic'}}>{v.example}</div>
                        </>)}
                      </div>)}
                    </div>
                    <div style={{fontSize:11,color:'var(--fg-text3)',marginTop:6}}>Click cards to flip</div>
                  </div>
                  {lesson.grammar_point && <div style={{background:'var(--fg-bg2)',border:'1px solid #7c3aed44',borderRadius:10,padding:12,marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#a78bfa',marginBottom:6}}>📐 Grammar: {lesson.grammar_point.rule}</div>
                    <div style={{fontSize:13,color:'var(--fg-text)',marginBottom:8}}>{lesson.grammar_point.explanation}</div>
                    {(lesson.grammar_point.examples||[]).map((ex:string,i:number)=><div key={i} style={{fontSize:13,color:'var(--fg-text2)',marginBottom:2,paddingLeft:8,borderLeft:'2px solid #7c3aed44'}}>• {ex}</div>)}
                  </div>}
                  {lesson.cultural_note && <div style={{background:'#f59e0b11',border:'1px solid #f59e0b33',borderRadius:10,padding:12,marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#fbbf24',marginBottom:4}}>🌏 Cultural Note</div>
                    <div style={{fontSize:13,color:'var(--fg-text)'}}>{lesson.cultural_note}</div>
                  </div>}
                  {lesson.homework && <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:4}}>📝 Homework</div>
                    <div style={{fontSize:13,color:'var(--fg-text)'}}>{lesson.homework}</div>
                    {lesson.next_lesson && <button onClick={()=>setTopic(lesson.next_lesson)} style={{marginTop:8,padding:'5px 12px',background:'var(--fg-orange)',border:'none',borderRadius:8,color:'#fff',fontSize:11,cursor:'pointer'}}>Next: {lesson.next_lesson} →</button>}
                  </div>}
                </div>}
              </>)}
              {tab==='translate' && (<>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <input value={translateText} onChange={e=>setTranslateText(e.target.value)} placeholder="Text to translate…" style={{flex:1,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text)',fontSize:13}} />
                  <input value={translateTo} onChange={e=>setTranslateTo(e.target.value)} placeholder="To language…" style={{width:140,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text)',fontSize:13}} />
                  <button disabled={!translateText.trim()||!translateTo.trim()} onClick={async()=>{const r=await fetch(`${API}/api/language/translate`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({text:translateText,to:translateTo})});setTranslation(await r.json());}} style={{padding:'10px 16px',background:'#3b82f6',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>Translate</button>
                </div>
                {translation && <div style={{background:'var(--fg-bg2)',border:'1px solid #3b82f644',borderRadius:10,padding:16}}>
                  <div style={{fontSize:20,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>{translation.translation}</div>
                  {translation.pronunciation && <div style={{fontSize:13,color:'#60a5fa',marginBottom:8}}>/{translation.pronunciation}/</div>}
                  <div style={{fontSize:12,color:'var(--fg-text3)',marginBottom:6}}>Formality: {translation.formality}</div>
                  {translation.alternatives?.length>0 && <div style={{fontSize:12,color:'var(--fg-text2)'}}><span style={{color:'var(--fg-text3)'}}>Alternatives: </span>{translation.alternatives.join(' · ')}</div>}
                  {translation.notes && <div style={{fontSize:12,color:'var(--fg-text3)',marginTop:6,fontStyle:'italic'}}>{translation.notes}</div>}
                </div>}
              </>)}
            </div>
          </div>);
}

export function ForgeTab_flashcardgen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [topic, setTopic] = React.useState('');
          const [count, setCount] = React.useState(10);
          const [difficulty, setDifficulty] = React.useState('medium');
          const [cards, setCards] = React.useState<any[]>([]);
          const [studyMode, setStudyMode] = React.useState(false);
          const [idx, setIdx] = React.useState(0);
          const [flipped, setFlipped] = React.useState(false);
          const [known, setKnown] = React.useState<Set<number>>(new Set());
          const [loading, setLoading] = React.useState(false);
          const [sets, setSets] = React.useState<any[]>([]);
          const [setTopic2, setSetTopic] = React.useState('');
          React.useEffect(()=>{fetch(`${API}/api/flashcards/sets`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setSets(d.sets||[])).catch(()=>{});}, []);
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:700,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>🃏 Flashcard Generator</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Generate study flashcards on any topic. Flip to reveal, track what you know.</div>
              {!studyMode ? (<>
                <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                  <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic (e.g. 'React hooks', 'WW2 dates', 'Spanish verbs')" style={{flex:1,padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13}} />
                  <select value={count} onChange={e=>setCount(Number(e.target.value))} style={{padding:'8px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text)',fontSize:12}}>
                    {[5,10,15,20,25].map(n=><option key={n} value={n}>{n} cards</option>)}
                  </select>
                  {(['easy','medium','hard'] as const).map(d=><button key={d} onClick={()=>setDifficulty(d)} style={{padding:'8px 14px',background:difficulty===d?'var(--fg-orange)':'var(--fg-bg2)',border:`1px solid ${difficulty===d?'var(--fg-orange)':'var(--fg-border)'}`,borderRadius:8,color:difficulty===d?'#fff':'var(--fg-text2)',fontSize:12,cursor:'pointer'}}>{d}</button>)}
                </div>
                <button disabled={loading||!topic.trim()} onClick={async()=>{setLoading(true);try{const r=await fetch(`${API}/api/flashcards/generate`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({topic,count,difficulty})});const d=await r.json();setCards(d.cards||[]);setSetTopic(d.topic);setSets(s=>[{id:d.id,topic:d.topic,created_at:new Date().toISOString()},...s.slice(0,19)]);}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'var(--fg-orange)',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!topic.trim()?0.5:1,marginBottom:16}}>{loading?'Generating…':'🃏 Generate Cards'}</button>
                {cards.length>0 && <div>
                  <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
                    <div style={{fontSize:13,color:'var(--fg-text2)'}}>{cards.length} cards on <strong>{setTopic2}</strong></div>
                    <button onClick={()=>{setStudyMode(true);setIdx(0);setFlipped(false);setKnown(new Set());}} style={{marginLeft:'auto',padding:'8px 18px',background:'#3b82f6',border:'none',borderRadius:8,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>▶ Study Mode</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
                    {cards.map((c:any,i:number)=><div key={i} style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,padding:10}}>
                      <div style={{fontSize:12,fontWeight:600,color:'var(--fg-text)',marginBottom:4}}>{c.front}</div>
                      <div style={{fontSize:11,color:'var(--fg-text3)'}}>{c.back?.slice(0,60)}</div>
                    </div>)}
                  </div>
                </div>}
                {sets.length>0 && <div style={{marginTop:20}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Saved Sets</div>
                  {sets.map((s:any)=><div key={s.id} onClick={async()=>{const r=await fetch(`${API}/api/flashcards/${s.id}`,{headers:{Authorization:`Bearer ${tok}`}});const d=await r.json();setCards(d.cards||[]);setSetTopic(d.topic);}} style={{padding:'8px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,fontSize:13,color:'var(--fg-text2)',cursor:'pointer'}}>🃏 {s.topic} <span style={{color:'var(--fg-text3)',fontSize:11}}>{s.created_at?.slice(0,10)}</span></div>)}
                </div>}
              </>) : (<div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div style={{fontSize:13,color:'var(--fg-text3)'}}>{idx+1} / {cards.length} · ✅ {known.size} known</div>
                  <button onClick={()=>setStudyMode(false)} style={{padding:'5px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,color:'var(--fg-text2)',fontSize:12,cursor:'pointer'}}>← Exit</button>
                </div>
                <div onClick={()=>setFlipped(f=>!f)} style={{background:'var(--fg-bg2)',border:'2px solid var(--fg-border)',borderRadius:16,padding:40,minHeight:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:20,textAlign:'center',transition:'all 0.2s'}}>
                  {!flipped ? (<>
                    <div style={{fontSize:11,color:'var(--fg-text3)',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.1em'}}>Question</div>
                    <div style={{fontSize:20,fontWeight:700,color:'var(--fg-text)'}}>{cards[idx]?.front}</div>
                    {cards[idx]?.hint && <div style={{fontSize:12,color:'#f59e0b',marginTop:12}}>💡 {cards[idx].hint}</div>}
                    <div style={{fontSize:11,color:'var(--fg-text3)',marginTop:16}}>Click to reveal</div>
                  </>) : (<>
                    <div style={{fontSize:11,color:'#22c55e',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.1em'}}>Answer</div>
                    <div style={{fontSize:18,fontWeight:600,color:'var(--fg-text)'}}>{cards[idx]?.back}</div>
                  </>)}
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                  <button onClick={()=>{setKnown(k=>{const n=new Set(k);n.delete(idx);return n;});setFlipped(false);setIdx(i=>(i+1)%cards.length);}} style={{flex:1,padding:'12px',background:'#ef444422',border:'1px solid #ef444444',borderRadius:10,color:'#f87171',fontSize:13,fontWeight:600,cursor:'pointer'}}>❌ Still Learning</button>
                  <button onClick={()=>{setKnown(k=>new Set([...k,idx]));setFlipped(false);setIdx(i=>(i+1)%cards.length);}} style={{flex:1,padding:'12px',background:'#22c55e22',border:'1px solid #22c55e44',borderRadius:10,color:'#4ade80',fontSize:13,fontWeight:600,cursor:'pointer'}}>✅ Got It</button>
                </div>
                {known.size===cards.length && <div style={{marginTop:16,textAlign:'center',padding:20,background:'linear-gradient(135deg,#22c55e22,#3b82f622)',borderRadius:12,border:'1px solid #22c55e44'}}>
                  <div style={{fontSize:24,marginBottom:8}}>🏆 Set Complete!</div>
                  <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:12}}>You know all {cards.length} cards!</div>
                  <button onClick={()=>{setKnown(new Set());setIdx(0);setFlipped(false);}} style={{padding:'8px 16px',background:'var(--fg-orange)',border:'none',borderRadius:8,color:'#fff',fontSize:13,cursor:'pointer'}}>🔄 Study Again</button>
                </div>}
              </div>)}
            </div>
          </div>);
}

export function ForgeTab_linkedinopt() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const [topic, setTopic] = React.useState('');
          const [angle, setAngle] = React.useState('thought-leadership');
          const [about, setAbout] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [history, setHistory] = React.useState<any[]>([]);
          const [copied, setCopied] = React.useState(false);
          React.useEffect(()=>{fetch(`${API}/api/linkedin/history`,{headers:{Authorization:`Bearer ${tok}`}}).then(r=>r.json()).then(d=>setHistory(d.history||[])).catch(()=>{});}, []);
          const ANGLES = [{id:'thought-leadership',emoji:'🧠',label:'Thought Leadership'},{id:'personal-story',emoji:'❤️',label:'Personal Story'},{id:'contrarian',emoji:'🔥',label:'Contrarian'},{id:'how-to',emoji:'📚',label:'How-To'},{id:'list',emoji:'📋',label:'List Post'},{id:'humble-brag',emoji:'🎉',label:'Humble Brag'},{id:'question',emoji:'❓',label:'Question/Poll'},{id:'hot-take',emoji:'⚡',label:'Hot Take'}];
          const ENG_COLOR:Record<string,string>={low:'#94a3b8',medium:'#60a5fa',high:'#22c55e',viral:'#f59e0b'};
          return (<div style={{flex:1,overflowY:'auto',padding:24}}>
            <div style={{maxWidth:700,margin:'0 auto'}}>
              <div style={{fontSize:22,fontWeight:700,color:'var(--fg-text)',marginBottom:4}}>💼 LinkedIn Post Optimizer</div>
              <div style={{fontSize:13,color:'var(--fg-text3)',marginBottom:20}}>Generate viral LinkedIn posts with hooks, hashtags, and engagement predictions.</div>
              {!result ? (<>
                <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                  {ANGLES.map(a=><button key={a.id} onClick={()=>setAngle(a.id)} style={{padding:'6px 12px',background:angle===a.id?'#0077b5':'var(--fg-bg2)',border:`1px solid ${angle===a.id?'#0077b5':'var(--fg-border)'}`,borderRadius:20,color:angle===a.id?'#fff':'var(--fg-text2)',fontSize:11,cursor:'pointer'}}>{a.emoji} {a.label}</button>)}
                </div>
                <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="What\'s the post about? (e.g. 'lessons from my startup failure', 'why remote work is the future')" rows={3} style={{width:'100%',padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,resize:'none',boxSizing:'border-box',marginBottom:10}} />
                <input value={about} onChange={e=>setAbout(e.target.value)} placeholder="About you (optional — e.g. 'founder of a SaaS startup, 10 years in tech')" style={{width:'100%',padding:'10px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,color:'var(--fg-text)',fontSize:13,boxSizing:'border-box',marginBottom:14}} />
                <button disabled={loading||!topic.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(`${API}/api/linkedin/generate`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${tok}`},body:JSON.stringify({topic,angle,about})});const d=await r.json();setResult(d);}catch(e:any){alert(e.message);}setLoading(false);}} style={{width:'100%',padding:'12px',background:'#0077b5',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||!topic.trim()?0.5:1}}>{loading?'Writing…':'💼 Generate Post'}</button>
              </>) : (<div>
                <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
                  <span style={{padding:'4px 12px',background:ENG_COLOR[result.predicted_engagement]+'22',border:`1px solid ${ENG_COLOR[result.predicted_engagement]}44`,borderRadius:16,fontSize:12,color:ENG_COLOR[result.predicted_engagement]}}>Engagement: {result.predicted_engagement}</span>
                  <span style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text3)'}}>{result.character_count} chars</span>
                  <span style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text3)'}}>📅 {result.best_time_to_post}</span>
                  <button onClick={()=>setResult(null)} style={{padding:'4px 12px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:16,fontSize:12,color:'var(--fg-text2)',cursor:'pointer',marginLeft:'auto'}}>← New</button>
                </div>
                <div style={{background:'var(--fg-bg2)',border:'1px solid #0077b544',borderRadius:12,padding:20,marginBottom:14,position:'relative'}}>
                  <div style={{fontSize:14,color:'var(--fg-text)',lineHeight:1.8,whiteSpace:'pre-wrap'}}>{result.post}</div>
                  <button onClick={()=>{navigator.clipboard.writeText(result.post+'\n\n'+result.hashtags?.join(' '));setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{position:'absolute',top:12,right:12,padding:'5px 12px',background:copied?'#22c55e':'var(--fg-bg3)',border:'1px solid var(--fg-border)',borderRadius:8,color:copied?'#fff':'var(--fg-text3)',fontSize:11,cursor:'pointer'}}>{copied?'✓ Copied':'📋 Copy'}</button>
                </div>
                {result.hashtags?.length>0 && <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
                  {result.hashtags.map((h:string)=><span key={h} style={{padding:'3px 10px',background:'#0077b511',border:'1px solid #0077b533',borderRadius:16,fontSize:12,color:'#60a5fa'}}>{h}</span>)}
                </div>}
                {result.hooks?.length>0 && <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:14,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase'}}>🎣 Alternative Hooks to A/B Test</div>
                  {result.hooks.map((h:string,i:number)=><div key={i} style={{padding:'8px 12px',background:'var(--fg-bg3)',borderRadius:6,marginBottom:6,fontSize:13,color:'var(--fg-text)',cursor:'pointer'}} onClick={()=>navigator.clipboard.writeText(h)}>"{h}"</div>)}
                </div>}
                <div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--fg-text3)',marginBottom:4,textTransform:'uppercase'}}>Why It Works</div>
                  <div style={{fontSize:13,color:'var(--fg-text)',lineHeight:1.6}}>{result.why_it_works}</div>
                </div>
              </div>)}
              {history.length>0 && !result && <div style={{marginTop:20}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--fg-text3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.08em'}}>Past Posts</div>
                {history.map((h:any)=><div key={h.id} style={{padding:'8px 14px',background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:8,marginBottom:4,fontSize:13,color:'var(--fg-text2)',cursor:'pointer'}} onClick={()=>setTopic(h.topic)}>{h.topic?.slice(0,70)} <span style={{fontSize:11,color:'var(--fg-text3)'}}>· {h.angle} · {h.created_at?.slice(0,10)}</span></div>)}
              </div>}
            </div>
          </div>);
}

export function ForgeTab_speechwriter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [occasion, setOccasion] = React.useState('');
          const [tone, setTone] = React.useState('heartfelt');
          const [mins, setMins] = React.useState(5);
          const [about, setAbout] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!occasion || !about) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/speech/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({occasion,tone,duration_mins:mins,about}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🎤 Speech Writer</h2>
              <p className="text-sm text-gray-500 mb-6">AI-written speeches for any occasion</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Occasion</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Best man speech, graduation" value={occasion} onChange={e=>setOccasion(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Tone</label><select className="w-full border rounded px-3 py-2 text-sm" value={tone} onChange={e=>setTone(e.target.value)}><option value="heartfelt">Heartfelt</option><option value="funny">Funny</option><option value="professional">Professional</option><option value="inspirational">Inspirational</option><option value="roast">Roast</option></select></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Length: {mins} min (~{mins*130} words)</label><input type="range" min={1} max={20} value={mins} onChange={e=>setMins(+e.target.value)} className="w-full" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">About / Context</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={4} placeholder="Tell me about the person, relationship, key memories, inside jokes..." value={about} onChange={e=>setAbout(e.target.value)} /></div>
              <button onClick={generate} disabled={loading||!occasion||!about} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">{loading ? 'Writing...' : 'Write Speech'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-5 border"><p className="text-xs text-gray-500 mb-2 font-semibold">📝 YOUR SPEECH ({result.word_count} words)</p><pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.speech}</pre></div>
                  {result.opening_hook && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="font-semibold text-sm mb-1">✨ Opening Hook</p><p className="text-sm italic">"{result.opening_hook}"</p></div>}
                  {result.tips?.length > 0 && <div className="bg-blue-50 rounded-lg p-4"><p className="font-semibold text-sm mb-2">🎯 Delivery Tips</p><ul className="text-sm space-y-1">{result.tips.map((t:string,i:number)=><li key={i} className="flex gap-2"><span>•</span><span>{t}</span></li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_pricenegotiator() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [item, setItem] = React.useState('');
          const [currentPrice, setCurrentPrice] = React.useState('');
          const [targetPrice, setTargetPrice] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [tab, setTab] = React.useState<'script'|'tactics'>('script');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const negotiate = async () => {
            if (!item || !currentPrice) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/negotiate/price`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({item,current_price:currentPrice,target_price:targetPrice,context}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💬 Price Negotiator</h2>
              <p className="text-sm text-gray-500 mb-6">Get a word-for-word negotiation script + tactics</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Item / Service</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Used car, rent, salary..." value={item} onChange={e=>setItem(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Current Price</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="$45,000" value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Target Price</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="$39,000" value={targetPrice} onChange={e=>setTargetPrice(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Context (optional)</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. dealership, been on market 60 days, has minor dent" value={context} onChange={e=>setContext(e.target.value)} /></div>
              <button onClick={negotiate} disabled={loading||!item||!currentPrice} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{loading ? 'Building script...' : 'Get Negotiation Script'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="flex gap-4 mb-4 border-b">
                    {(['script','tactics'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`pb-2 px-1 text-sm font-medium border-b-2 capitalize ${tab===t?'border-green-600 text-green-600':'border-transparent text-gray-500'}`}>{t}</button>)}
                  </div>
                  {tab==='script' && (
                    <div className="space-y-3">
                      {result.opening_line && <div className="bg-green-50 border border-green-200 rounded-lg p-4"><p className="font-semibold text-sm mb-1">👋 Opening Line</p><p className="text-sm italic">"{result.opening_line}"</p></div>}
                      <div className="bg-gray-50 rounded-xl p-5 border"><p className="text-xs text-gray-500 mb-2 font-semibold">📜 FULL SCRIPT</p><pre className="whitespace-pre-wrap text-sm">{result.script}</pre></div>
                      {result.expected_savings && <div className="flex gap-4"><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex-1 text-center"><p className="text-xs text-gray-500">Expected Savings</p><p className="font-bold">{result.expected_savings}</p></div><div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex-1 text-center"><p className="text-xs text-gray-500">Success Probability</p><p className="font-bold capitalize">{result.success_probability}</p></div></div>}
                    </div>
                  )}
                  {tab==='tactics' && (
                    <div className="space-y-4">
                      {result.tactics?.length>0 && <div><p className="font-semibold mb-2 text-sm">🎯 Tactics</p><ul className="space-y-1">{result.tactics.map((t:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-green-600 font-bold">{i+1}.</span>{t}</li>)}</ul></div>}
                      {result.leverage_points?.length>0 && <div><p className="font-semibold mb-2 text-sm">💪 Leverage Points</p><ul className="space-y-1">{result.leverage_points.map((t:string,i:number)=><li key={i} className="text-sm flex gap-2"><span>•</span>{t}</li>)}</ul></div>}
                      {result.fallbacks?.length>0 && <div><p className="font-semibold mb-2 text-sm">🔄 Fallbacks (if they say no)</p><ul className="space-y-1">{result.fallbacks.map((t:string,i:number)=><li key={i} className="text-sm flex gap-2 text-orange-700"><span>→</span>{t}</li>)}</ul></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_emailroastv2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [emailText, setEmailText] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [view, setView] = React.useState<'roast'|'rewrite'>('roast');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const roast = async () => {
            if (!emailText.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/email/roast`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({email:emailText}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const gradeColor = (g:string) => ({'A':'text-green-600','B':'text-blue-600','C':'text-yellow-600','D':'text-orange-600','F':'text-red-600'})[g]||'text-gray-600';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🔥 Email Roast</h2>
              <p className="text-sm text-gray-500 mb-6">Brutal critique + perfect rewrite of your email</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Paste your email</label><textarea className="w-full border rounded px-3 py-2 text-sm font-mono" rows={8} placeholder="Paste the email you want to improve..." value={emailText} onChange={e=>setEmailText(e.target.value)} /></div>
              <button onClick={roast} disabled={loading||!emailText.trim()} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50">{loading ? 'Roasting...' : '🔥 Roast This Email'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gray-100 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Grade</p><p className={`text-3xl font-black ${gradeColor(result.grade)}`}>{result.grade}</p><p className="text-xs text-gray-500">{result.score}/100</p></div>
                    <div className="flex gap-2"><button onClick={()=>setView('roast')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view==='roast'?'bg-red-500 text-white':'bg-gray-100'}`}>🔥 Roast</button><button onClick={()=>setView('rewrite')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view==='rewrite'?'bg-green-500 text-white':'bg-gray-100'}`}>✨ Rewrite</button></div>
                  </div>
                  {view==='roast' && (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="font-semibold text-sm mb-2">🔥 The Roast</p><p className="text-sm italic">{result.roast}</p></div>
                      {result.issues?.length>0 && <div className="bg-orange-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">❌ Problems Found</p><ul className="space-y-1">{result.issues.map((i:string,idx:number)=><li key={idx} className="text-sm flex gap-2 text-red-700"><span>•</span>{i}</li>)}</ul></div>}
                    </div>
                  )}
                  {view==='rewrite' && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="font-semibold text-sm mb-2">✨ Perfect Version</p><pre className="whitespace-pre-wrap text-sm">{result.rewrite}</pre></div>
                      {result.improvements?.length>0 && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">✅ What Was Fixed</p><ul className="space-y-1">{result.improvements.map((i:string,idx:number)=><li key={idx} className="text-sm flex gap-2 text-blue-700"><span>✓</span>{i}</li>)}</ul></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_startupnamer() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [desc, setDesc] = React.useState('');
          const [style, setStyle] = React.useState('modern');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!desc.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/startup/names`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({description:desc,style}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const vibeColor = (v:string) => ({'modern':'bg-blue-100 text-blue-700','classic':'bg-amber-100 text-amber-700','techy':'bg-purple-100 text-purple-700','playful':'bg-pink-100 text-pink-700','premium':'bg-gray-100 text-gray-700'})[v]||'bg-gray-100 text-gray-600';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🚀 Startup Namer</h2>
              <p className="text-sm text-gray-500 mb-6">World-class brand names with domain availability and taglines</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What does your startup do?</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="e.g. AI-powered tool that helps freelancers invoice clients and track payments automatically" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Naming Style</label><div className="flex gap-2 flex-wrap">{['modern','classic','techy','playful','premium'].map(s=><button key={s} onClick={()=>setStyle(s)} className={`px-3 py-1 rounded-full text-sm capitalize ${style===s?'bg-indigo-600 text-white':'bg-gray-100 text-gray-600'}`}>{s}</button>)}</div></div>
              <button onClick={generate} disabled={loading||!desc.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Generating names...' : '🚀 Generate Names'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  {result.names?.map((n:any,i:number)=>(
                    <div key={i} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3"><h3 className="text-xl font-bold">{n.name}</h3><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${vibeColor(n.vibe)}`}>{n.vibe}</span></div>
                        <div className="text-right"><span className="text-xs text-gray-500">Score</span><p className="font-bold text-lg">{n.score}/100</p></div>
                      </div>
                      {n.tagline && <p className="text-sm text-gray-500 italic mb-2">"{n.tagline}"</p>}
                      <p className="text-sm mb-2">{n.why_it_works}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500"><span>🌐 {n.domain}</span>{n.meaning && <span>💡 {n.meaning}</span>}</div>
                    </div>
                  ))}
                  {result.naming_rationale && <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600"><strong>Approach:</strong> {result.naming_rationale}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_coverlettergen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [jobTitle, setJobTitle] = React.useState('');
          const [company, setCompany] = React.useState('');
          const [jobDesc, setJobDesc] = React.useState('');
          const [resumeSummary, setResumeSummary] = React.useState('');
          const [tone, setTone] = React.useState('professional');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!jobTitle || !company) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/cover-letter/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({job_title:jobTitle,company,job_description:jobDesc,resume_summary:resumeSummary,tone}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const copy = () => { navigator.clipboard.writeText(result.letter); setCopied(true); setTimeout(()=>setCopied(false),2000); };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">📝 Cover Letter Generator</h2>
              <p className="text-sm text-gray-500 mb-6">AI-crafted cover letters tailored to the job</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Job Title *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Senior Product Manager" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Company *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Acme Corp" value={company} onChange={e=>setCompany(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Job Description (paste key parts)</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="Paste job requirements, responsibilities..." value={jobDesc} onChange={e=>setJobDesc(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Your Background (brief summary)</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="5 years PM at SaaS companies, led teams of 10, shipped 3 major products..." value={resumeSummary} onChange={e=>setResumeSummary(e.target.value)} /></div>
              <div className="mb-4 flex gap-2">{['professional','enthusiastic','concise','creative'].map(t=><button key={t} onClick={()=>setTone(t)} className={`px-3 py-1 rounded-full text-sm capitalize ${tone===t?'bg-blue-600 text-white':'bg-gray-100 text-gray-600'}`}>{t}</button>)}</div>
              <button onClick={generate} disabled={loading||!jobTitle||!company} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Writing...' : 'Generate Cover Letter'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  {result.subject_line && <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm"><span className="font-semibold">Subject: </span>{result.subject_line}</div>}
                  <div className="bg-white border rounded-xl p-5 relative"><button onClick={copy} className="absolute top-3 right-3 text-xs bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">{copied ? '✓ Copied' : 'Copy'}</button><pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.letter}</pre></div>
                  {result.key_highlights?.length>0 && <div className="bg-green-50 rounded-lg p-4"><p className="font-semibold text-sm mb-2">✨ Key Highlights Used</p><ul className="space-y-1">{result.key_highlights.map((h:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-green-600">✓</span>{h}</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_interviewcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
          const [company, setCompany] = React.useState('');
          const [level, setLevel] = React.useState('mid');
          const [focus, setFocus] = React.useState('behavioral');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [activeQ, setActiveQ] = React.useState(0);
          const [userAnswer, setUserAnswer] = React.useState('');
          const [feedback, setFeedback] = React.useState<any>(null);
          const [fbLoading, setFbLoading] = React.useState(false);
          const [mode, setMode] = React.useState<'questions'|'practice'>('questions');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!role) return;
            setLoading(true); setResult(null); setActiveQ(0); setFeedback(null);
            try {
              const r = await fetch(`${API}/api/interview/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({role,company,level,focus}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const getFeedback = async () => {
            if (!userAnswer.trim() || !result?.questions?.[activeQ]) return;
            setFbLoading(true); setFeedback(null);
            try {
              const r = await fetch(`${API}/api/interview/answer-feedback`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({question:result.questions[activeQ].question,answer:userAnswer}) });
              setFeedback(await r.json());
            } finally { setFbLoading(false); }
          };
          const diffColor = (d:string) => ({'easy':'bg-green-100 text-green-700','medium':'bg-yellow-100 text-yellow-700','hard':'bg-red-100 text-red-700'})[d]||'bg-gray-100 text-gray-600';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🎯 Interview Coach</h2>
              <p className="text-sm text-gray-500 mb-6">Practice interviews with AI feedback on your answers</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Role *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Software Engineer" value={role} onChange={e=>setRole(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Company</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Google" value={company} onChange={e=>setCompany(e.target.value)} /></div>
              </div>
              <div className="flex gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Level</label><select className="border rounded px-3 py-2 text-sm" value={level} onChange={e=>setLevel(e.target.value)}><option value="junior">Junior</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="staff">Staff/Principal</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Focus</label><select className="border rounded px-3 py-2 text-sm" value={focus} onChange={e=>setFocus(e.target.value)}><option value="behavioral">Behavioral</option><option value="technical">Technical</option><option value="mixed">Mixed</option><option value="system-design">System Design</option></select></div>
              </div>
              <button onClick={generate} disabled={loading||!role} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Generating...' : 'Generate Questions'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="flex gap-3 mb-4"><button onClick={()=>setMode('questions')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${mode==='questions'?'bg-indigo-600 text-white':'bg-gray-100'}`}>📋 Questions</button><button onClick={()=>setMode('practice')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${mode==='practice'?'bg-indigo-600 text-white':'bg-gray-100'}`}>🎤 Practice Mode</button></div>
                  {mode==='questions' && (
                    <div className="space-y-4">
                      {result.questions?.map((q:any,i:number)=>(
                        <div key={i} className="border rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-gray-400">Q{i+1}</span><span className={`px-2 py-0.5 rounded-full text-xs ${diffColor(q.difficulty)}`}>{q.difficulty}</span><span className="text-xs text-gray-400">{q.type}</span></div>
                          <p className="font-medium mb-2">{q.question}</p>
                          <p className="text-xs text-gray-500 mb-2">💡 <em>They want: {q.what_they_want}</em></p>
                          {q.sample_answer && <details className="text-sm"><summary className="cursor-pointer text-blue-600 text-xs">Show sample answer</summary><div className="mt-2 bg-blue-50 rounded p-3 text-sm">{q.sample_answer}</div></details>}
                        </div>
                      ))}
                      {result.questions_to_ask?.length>0 && <div className="bg-purple-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">❓ Questions to Ask Them</p><ul className="space-y-1">{result.questions_to_ask.map((q:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-purple-600">→</span>{q}</li>)}</ul></div>}
                    </div>
                  )}
                  {mode==='practice' && result.questions?.length>0 && (
                    <div>
                      <div className="flex gap-2 mb-4 flex-wrap">{result.questions.map((_:any,i:number)=><button key={i} onClick={()=>{setActiveQ(i);setUserAnswer('');setFeedback(null);}} className={`w-8 h-8 rounded-full text-sm font-medium ${activeQ===i?'bg-indigo-600 text-white':'bg-gray-100'}`}>{i+1}</button>)}</div>
                      <div className="bg-indigo-50 rounded-xl p-4 mb-4"><p className="font-medium">{result.questions[activeQ]?.question}</p></div>
                      <textarea className="w-full border rounded px-3 py-2 text-sm mb-3" rows={5} placeholder="Type your answer here..." value={userAnswer} onChange={e=>setUserAnswer(e.target.value)} />
                      <button onClick={getFeedback} disabled={fbLoading||!userAnswer.trim()} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{fbLoading ? 'Analyzing...' : 'Get AI Feedback'}</button>
                      {feedback && !feedback.error && (
                        <div className="mt-4 space-y-3">
                          <div className="flex gap-3"><div className="bg-gray-100 rounded-xl p-3 text-center min-w-16"><p className="text-xs text-gray-500">Score</p><p className="text-2xl font-black">{feedback.score}</p></div><div className="bg-gray-100 rounded-xl p-3 text-center min-w-16"><p className="text-xs text-gray-500">Grade</p><p className="text-2xl font-black">{feedback.grade}</p></div><div className="flex-1 bg-green-50 rounded-xl p-3"><p className="font-semibold text-xs mb-1">Strengths</p><ul>{feedback.strengths?.map((s:string,i:number)=><li key={i} className="text-xs text-green-700">✓ {s}</li>)}</ul></div><div className="flex-1 bg-orange-50 rounded-xl p-3"><p className="font-semibold text-xs mb-1">Improve</p><ul>{feedback.improvements?.map((s:string,i:number)=><li key={i} className="text-xs text-orange-700">• {s}</li>)}</ul></div></div>
                          {feedback.stronger_version && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">💡 Stronger Version</p><p className="text-sm italic">{feedback.stronger_version}</p></div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_colddmwriter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [platform, setPlatform] = React.useState('linkedin');
          const [targetName, setTargetName] = React.useState('');
          const [targetRole, setTargetRole] = React.useState('');
          const [goal, setGoal] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const write = async () => {
            if (!targetName || !goal) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/cold-dm/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({platform,target_name:targetName,target_role:targetRole,your_goal:goal,context}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">📨 Cold DM Writer</h2>
              <p className="text-sm text-gray-500 mb-6">High-converting cold messages for any platform</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Platform</label><div className="flex gap-2">{['linkedin','twitter','email','instagram'].map(p=><button key={p} onClick={()=>setPlatform(p)} className={`px-3 py-1 rounded-full text-sm capitalize ${platform===p?'bg-blue-600 text-white':'bg-gray-100'}`}>{p}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Their Name *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Sarah Chen" value={targetName} onChange={e=>setTargetName(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Their Role</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Head of Growth at Stripe" value={targetRole} onChange={e=>setTargetRole(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Your Goal *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Get a 30-min call to learn about their growth strategy" value={goal} onChange={e=>setGoal(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Context / Hook (optional)</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. saw their talk at SaaStr, read their article on PLG..." value={context} onChange={e=>setContext(e.target.value)} /></div>
              <button onClick={write} disabled={loading||!targetName||!goal} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Writing...' : 'Write DM'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  {result.subject && <div className="bg-gray-100 rounded px-4 py-2 text-sm"><span className="font-semibold">Subject: </span>{result.subject}</div>}
                  <div className="bg-gray-50 rounded-xl p-5 border relative">
                    <div className="flex justify-between items-start mb-2"><p className="text-xs text-gray-500 font-semibold">MESSAGE ({result.character_count} chars)</p><button onClick={()=>{navigator.clipboard.writeText(result.dm);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="text-xs bg-white border px-3 py-1 rounded-full">{copied?'✓ Copied':'Copy'}</button></div>
                    <p className="text-sm whitespace-pre-wrap">{result.dm}</p>
                  </div>
                  {result.why_it_works && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>Why it works: </strong>{result.why_it_works}</div>}
                  {result.variations?.length>0 && <div className="space-y-2"><p className="font-semibold text-sm">🔄 Variations</p>{result.variations.map((v:string,i:number)=><div key={i} className="bg-gray-50 rounded-lg p-3 text-sm border">{v}</div>)}</div>}
                  {result.follow_up && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm"><strong>📅 Follow-up: </strong>{result.follow_up}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_fitnessplanner() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
          const [level, setLevel] = React.useState('beginner');
          const [days, setDays] = React.useState(3);
          const [equipment, setEquipment] = React.useState('none');
          const [notes, setNotes] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [activeDay, setActiveDay] = React.useState(0);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!goal) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/fitness/plan`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({goal,level,days_per_week:days,equipment,notes}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💪 Fitness Planner</h2>
              <p className="text-sm text-gray-500 mb-6">Personalized workout plans with week-by-week progression</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Your Goal *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Lose 15 lbs, build muscle, run a 5K, get stronger..." value={goal} onChange={e=>setGoal(e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Level</label><select className="w-full border rounded px-3 py-2 text-sm" value={level} onChange={e=>setLevel(e.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Days/Week: {days}</label><input type="range" min={2} max={6} value={days} onChange={e=>setDays(+e.target.value)} className="w-full mt-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Equipment</label><select className="w-full border rounded px-3 py-2 text-sm" value={equipment} onChange={e=>setEquipment(e.target.value)}><option value="none">None (bodyweight)</option><option value="dumbbells">Dumbbells</option><option value="gym">Full Gym</option><option value="bands">Resistance Bands</option></select></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Notes (injuries, preferences)</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Bad knee, prefer mornings, hate running..." value={notes} onChange={e=>setNotes(e.target.value)} /></div>
              <button onClick={generate} disabled={loading||!goal} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50">{loading ? 'Building plan...' : 'Generate My Plan'}</button>
              {result && result.plan && (
                <div className="mt-6 space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4"><p className="font-semibold mb-1">📋 Overview</p><p className="text-sm">{result.plan.overview}</p></div>
                  {result.plan.weekly_schedule?.length>0 && (
                    <div>
                      <div className="flex gap-2 mb-3 flex-wrap">{result.plan.weekly_schedule.map((d:any,i:number)=><button key={i} onClick={()=>setActiveDay(i)} className={`px-3 py-1 rounded-lg text-sm ${activeDay===i?'bg-orange-500 text-white':'bg-gray-100'}`}>{d.day}</button>)}</div>
                      <div className="border rounded-xl overflow-hidden">
                        <div className="bg-orange-500 text-white px-4 py-2"><p className="font-semibold">{result.plan.weekly_schedule[activeDay]?.focus}</p></div>
                        <div className="divide-y">
                          {result.plan.weekly_schedule[activeDay]?.workout?.map((e:any,i:number)=>(
                            <div key={i} className="px-4 py-3 flex items-center justify-between">
                              <div><p className="font-medium text-sm">{e.exercise}</p>{e.notes && <p className="text-xs text-gray-500">{e.notes}</p>}</div>
                              <div className="text-right text-sm"><p>{e.sets} × {e.reps}</p><p className="text-xs text-gray-500">Rest {e.rest}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {result.expected_results && <div className="grid grid-cols-3 gap-3">{Object.entries(result.expected_results).map(([k,v]:any)=><div key={k} className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xs text-gray-500 font-semibold">{k.replace('week','Week ')}</p><p className="text-sm">{v}</p></div>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_recipegen2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ingredients, setIngredients] = React.useState('');
          const [dietary, setDietary] = React.useState('');
          const [cuisine, setCuisine] = React.useState('');
          const [servings, setServings] = React.useState(4);
          const [time, setTime] = React.useState(30);
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!ingredients.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/recipe/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({ingredients,dietary,cuisine,servings,time_available:time}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const diffColor = (d:string) => ({'easy':'text-green-600','medium':'text-yellow-600','hard':'text-red-600'})[d]||'text-gray-600';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🍳 Recipe Generator</h2>
              <p className="text-sm text-gray-500 mb-6">Turn any ingredients into a complete recipe</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Ingredients you have *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="chicken breast, garlic, lemon, olive oil, pasta..." value={ingredients} onChange={e=>setIngredients(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Dietary</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="vegetarian, gluten-free, keto..." value={dietary} onChange={e=>setDietary(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Cuisine Style</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Italian, Thai, Mexican..." value={cuisine} onChange={e=>setCuisine(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Servings: {servings}</label><input type="range" min={1} max={8} value={servings} onChange={e=>setServings(+e.target.value)} className="w-full" /></div>
                <div><label className="block text-sm font-medium mb-1">Time: {time} min</label><input type="range" min={10} max={120} step={5} value={time} onChange={e=>setTime(+e.target.value)} className="w-full" /></div>
              </div>
              <button onClick={generate} disabled={loading||!ingredients.trim()} className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50">{loading ? 'Creating recipe...' : '🍳 Generate Recipe'}</button>
              {result && result.recipe && (
                <div className="mt-6 space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-bold">{result.recipe.name}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-gray-500">
                      <span>⏱ Prep {result.recipe.prep_time}</span>
                      <span>🔥 Cook {result.recipe.cook_time}</span>
                      <span>👥 {result.recipe.servings} servings</span>
                      <span className={`font-medium ${diffColor(result.recipe.difficulty)}`}>{result.recipe.difficulty}</span>
                    </div>
                  </div>
                  {result.recipe.nutrition_estimate && <div className="flex gap-3">{Object.entries(result.recipe.nutrition_estimate).map(([k,v]:any)=><div key={k} className="bg-amber-50 rounded-lg px-3 py-2 text-center flex-1"><p className="text-xs text-gray-500 capitalize">{k}</p><p className="text-sm font-semibold">{v}</p></div>)}</div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="font-semibold mb-2 text-sm">🛒 Ingredients</p><ul className="space-y-1">{result.recipe.ingredients?.map((i:string,idx:number)=><li key={idx} className="text-sm flex gap-2"><span>•</span>{i}</li>)}</ul></div>
                    <div><p className="font-semibold mb-2 text-sm">📋 Instructions</p><ol className="space-y-2">{result.recipe.instructions?.map((step:string,idx:number)=><li key={idx} className="text-sm flex gap-2"><span className="font-bold text-amber-500">{idx+1}.</span>{step}</li>)}</ol></div>
                  </div>
                  {result.recipe.tips?.length>0 && <div className="bg-amber-50 rounded-lg p-3"><p className="font-semibold text-sm mb-1">👨‍🍳 Pro Tips</p><ul className="space-y-1">{result.recipe.tips.map((t:string,i:number)=><li key={i} className="text-sm">• {t}</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_travelplanner() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dest, setDest] = React.useState('');
          const [days, setDays] = React.useState(7);
          const [budget, setBudget] = React.useState('moderate');
          const [style, setStyle] = React.useState('balanced');
          const [interests, setInterests] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [activeDay, setActiveDay] = React.useState(0);
          const [view, setView] = React.useState<'itinerary'|'practical'|'tips'>('itinerary');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const plan = async () => {
            if (!dest) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/travel/plan`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({destination:dest,days,budget,style,interests}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">✈️ Travel Planner</h2>
              <p className="text-sm text-gray-500 mb-6">Complete day-by-day itinerary with meals, tips & budget</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2"><label className="block text-sm font-medium mb-1">Destination *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Tokyo, Japan / Tuscany, Italy / NYC..." value={dest} onChange={e=>setDest(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Duration: {days} days</label><input type="range" min={2} max={21} value={days} onChange={e=>setDays(+e.target.value)} className="w-full" /></div>
                <div><label className="block text-sm font-medium mb-1">Interests</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="food, history, nightlife, nature..." value={interests} onChange={e=>setInterests(e.target.value)} /></div>
              </div>
              <div className="flex gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Budget</label><div className="flex gap-2">{['budget','moderate','luxury'].map(b=><button key={b} onClick={()=>setBudget(b)} className={`px-3 py-1 rounded-full text-sm capitalize ${budget===b?'bg-sky-600 text-white':'bg-gray-100'}`}>{b}</button>)}</div></div>
                <div><label className="block text-sm font-medium mb-1">Style</label><div className="flex gap-2">{['relaxed','balanced','packed'].map(s=><button key={s} onClick={()=>setStyle(s)} className={`px-3 py-1 rounded-full text-sm capitalize ${style===s?'bg-sky-600 text-white':'bg-gray-100'}`}>{s}</button>)}</div></div>
              </div>
              <button onClick={plan} disabled={loading||!dest} className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700 disabled:opacity-50">{loading ? 'Planning...' : '✈️ Plan My Trip'}</button>
              {result && result.plan && (
                <div className="mt-6">
                  {result.plan.overview && <div className="bg-sky-50 rounded-xl p-4 mb-4"><p className="font-semibold mb-1">{dest}</p><p className="text-sm">{result.plan.overview}</p></div>}
                  <div className="flex gap-3 mb-4"><button onClick={()=>setView('itinerary')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${view==='itinerary'?'bg-sky-600 text-white':'bg-gray-100'}`}>📅 Itinerary</button><button onClick={()=>setView('practical')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${view==='practical'?'bg-sky-600 text-white':'bg-gray-100'}`}>📋 Practical Info</button><button onClick={()=>setView('tips')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${view==='tips'?'bg-sky-600 text-white':'bg-gray-100'}`}>💎 Hidden Gems</button></div>
                  {view==='itinerary' && result.plan.days?.length>0 && (
                    <div>
                      <div className="flex gap-2 mb-4 flex-wrap">{result.plan.days.map((d:any,i:number)=><button key={i} onClick={()=>setActiveDay(i)} className={`px-3 py-1 rounded-lg text-sm ${activeDay===i?'bg-sky-600 text-white':'bg-gray-100'}`}>Day {d.day}</button>)}</div>
                      <div className="border rounded-xl overflow-hidden">
                        <div className="bg-sky-600 text-white px-4 py-3"><p className="font-semibold">Day {result.plan.days[activeDay]?.day}: {result.plan.days[activeDay]?.theme}</p>{result.plan.days[activeDay]?.estimated_cost && <p className="text-xs opacity-80">{result.plan.days[activeDay].estimated_cost}</p>}</div>
                        <div className="divide-y">
                          {['morning','afternoon','evening'].map(period=>(result.plan.days[activeDay]?.[period] && <div key={period} className="px-4 py-3"><p className="text-xs font-bold text-gray-400 uppercase mb-1">{period}</p><p className="text-sm">{result.plan.days[activeDay][period]}</p></div>))}
                          {result.plan.days[activeDay]?.meals && <div className="px-4 py-3 bg-amber-50"><p className="text-xs font-bold text-gray-400 mb-1">MEALS</p><div className="flex gap-4 text-sm">{Object.entries(result.plan.days[activeDay].meals).map(([m,v]:any)=>v&&<span key={m}><strong className="capitalize">{m}:</strong> {v}</span>)}</div></div>}
                          {result.plan.days[activeDay]?.tips && <div className="px-4 py-3 bg-yellow-50"><p className="text-xs">💡 {result.plan.days[activeDay].tips}</p></div>}
                        </div>
                      </div>
                    </div>
                  )}
                  {view==='practical' && result.plan.practical_info && (
                    <div className="space-y-3">
                      {Object.entries(result.plan.practical_info).map(([k,v]:any)=>v&&<div key={k} className="flex gap-3 border-b pb-3"><p className="font-semibold text-sm capitalize min-w-32">{k.replace('_',' ')}</p><p className="text-sm text-gray-700">{v}</p></div>)}
                      {result.plan.budget_breakdown && <div className="bg-green-50 rounded-xl p-4"><p className="font-semibold mb-2 text-sm">💰 Budget Breakdown</p>{Object.entries(result.plan.budget_breakdown).map(([k,v]:any)=><div key={k} className="flex justify-between text-sm py-1 border-b border-green-100"><span className="capitalize">{k.replace('_',' ')}</span><span className="font-medium">{v}</span></div>)}</div>}
                    </div>
                  )}
                  {view==='tips' && (
                    <div className="space-y-4">
                      {result.plan.hidden_gems?.length>0 && <div><p className="font-semibold mb-2">💎 Hidden Gems</p><ul className="space-y-2">{result.plan.hidden_gems.map((g:string,i:number)=><li key={i} className="flex gap-2 text-sm"><span>•</span>{g}</li>)}</ul></div>}
                      {result.plan.avoid?.length>0 && <div><p className="font-semibold mb-2">❌ Skip These</p><ul className="space-y-2">{result.plan.avoid.map((a:string,i:number)=><li key={i} className="flex gap-2 text-sm text-red-700"><span>✗</span>{a}</li>)}</ul></div>}
                      {result.plan.packing_list?.length>0 && <div><p className="font-semibold mb-2">🧳 Packing List</p><div className="grid grid-cols-2 gap-1">{result.plan.packing_list.map((p:string,i:number)=><div key={i} className="text-sm flex gap-2"><span>☐</span>{p}</div>)}</div></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}
