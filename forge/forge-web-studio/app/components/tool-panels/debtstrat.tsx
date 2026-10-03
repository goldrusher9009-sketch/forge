'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_debtstrat() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dsDebts, setDsDebts] = React.useState('');
          const [dsIncome, setDsIncome] = React.useState('');
          const [dsExpenses, setDsExpenses] = React.useState('');
          const [dsGoal, setDsGoal] = React.useState('pay off debt as fast as possible');
          const [dsRes, setDsRes] = React.useState<any>(null);
          const [dsLoading, setDsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💳 Debt Strategist</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={dsDebts} onChange={e=>setDsDebts(e.target.value)} placeholder="List your debts (e.g. Visa $8k at 22%, car loan $12k at 6%, student loan $30k at 5%)" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={dsIncome} onChange={e=>setDsIncome(e.target.value)} placeholder="Monthly take-home income" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={dsExpenses} onChange={e=>setDsExpenses(e.target.value)} placeholder="Monthly essential expenses" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <select value={dsGoal} onChange={e=>setDsGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['pay off debt as fast as possible','minimize total interest paid','free up cash flow monthly','balance speed and motivation','pay off before a specific date'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <button onClick={async()=>{if(!dsDebts.trim())return;setDsLoading(true);setDsRes(null);try{const r=await fetch(`${''}/api/debt/strategy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({debts:dsDebts,monthly_income:dsIncome,monthly_expenses:dsExpenses,goal:dsGoal})});const d=await r.json();setDsRes(d);}catch(e){console.error(e);}finally{setDsLoading(false);}}} disabled={dsLoading||!dsDebts.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {dsLoading?'Strategizing...':'Build My Debt Strategy 🎯'}
                </button>
              </div>
              {dsRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {dsRes.debt_analysis&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>{Object.entries(dsRes.debt_analysis).map(([k,v])=><div key={k} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.75rem',marginBottom:'0.25rem'}}>{k.replace(/_/g,' ').toUpperCase()}</div><div style={{fontWeight:700}}>{String(v)}</div></div>)}</div>}
                {dsRes.recommended_strategy&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{fontSize:'1.1rem'}}>📋 {dsRes.recommended_strategy.name}</strong><p style={{marginTop:'0.5rem',opacity:0.8}}>{dsRes.recommended_strategy.why}</p></div>}
                {Array.isArray(dsRes.payoff_order)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🎯 Payoff Order:</strong>{dsRes.payoff_order.map((p:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',gap:'1rem',alignItems:'center'}}><div style={{minWidth:'2rem',fontWeight:700,fontSize:'1.2rem',opacity:0.5}}>#{p.priority}</div><div><div style={{fontWeight:600}}>{p.debt}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{p.why}</div></div></div>)}</div>}
                {dsRes.payoff_timeline&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}><div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.75rem'}}>MIN PAYMENTS</div><div style={{fontWeight:700,color:'#ef4444'}}>{dsRes.payoff_timeline.minimum_payments}</div></div><div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.75rem'}}>WITH STRATEGY</div><div style={{fontWeight:700,color:'#22c55e'}}>{dsRes.payoff_timeline.with_strategy}</div></div><div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><div style={{opacity:0.6,fontSize:'0.75rem'}}>INTEREST SAVED</div><div style={{fontWeight:700,color:'#22c55e'}}>{dsRes.payoff_timeline.interest_saved}</div></div></div>}
                {Array.isArray(dsRes.acceleration_moves)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚀 Acceleration Moves:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{dsRes.acceleration_moves.map((m:string,i:number)=><li key={i}>{m}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_investdecode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [idTopic, setIdTopic] = React.useState('');
          const [idLevel, setIdLevel] = React.useState('beginner');
          const [idAmount, setIdAmount] = React.useState('');
          const [idRes, setIdRes] = React.useState<any>(null);
          const [idLoading, setIdLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📈 Investment Decoder</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={idTopic} onChange={e=>setIdTopic(e.target.value)} placeholder="Investment topic (e.g. index funds, REITs, options, crypto, bonds, 401k)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={idLevel} onChange={e=>setIdLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['complete beginner','beginner','intermediate','advanced'].map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                  <input value={idAmount} onChange={e=>setIdAmount(e.target.value)} placeholder="Amount you\'re considering (optional)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <button onClick={async()=>{if(!idTopic.trim())return;setIdLoading(true);setIdRes(null);try{const r=await fetch(`${''}/api/investment/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:idTopic,experience_level:idLevel,amount_to_invest:idAmount})});const d=await r.json();setIdRes(d);}catch(e){console.error(e);}finally{setIdLoading(false);}}} disabled={idLoading||!idTopic.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {idLoading?'Decoding...':'Decode This Investment 🔍'}
                </button>
              </div>
              {idRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {idRes.eli5&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>🧒 ELI5: </strong>{idRes.eli5}</div>}
                {idRes.how_it_works&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚙️ How It Works:</strong><p style={{marginTop:'0.5rem',lineHeight:1.7}}>{idRes.how_it_works}</p></div>}
                {Array.isArray(idRes.risks)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚠️ Risks:</strong>{idRes.risks.map((r:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)',display:'flex',gap:'0.75rem'}}><span style={{padding:'0.125rem 0.5rem',borderRadius:'4px',background:r.level==='high'?'#ef444420':r.level==='medium'?'#f5a62320':'#22c55e20',color:r.level==='high'?'#ef4444':r.level==='medium'?'#f5a623':'#22c55e',fontSize:'0.75rem',height:'fit-content'}}>{r.level}</span><div><div style={{fontWeight:600}}>{r.risk}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{r.description}</div></div></div>)}</div>}
                {idRes.example&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💡 Example:</strong><div style={{marginTop:'0.5rem'}}>{idRes.example.scenario}</div><div style={{marginTop:'0.25rem',fontWeight:600,color:'var(--accent)'}}>→ {idRes.example.outcome}</div></div>}
                {Array.isArray(idRes.how_to_start)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚀 How to Start:</strong><ol style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{idRes.how_to_start.map((s:string,i:number)=><li key={i} style={{marginBottom:'0.25rem'}}>{s}</li>)}</ol></div>}
                {Array.isArray(idRes.key_terms)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📚 Key Terms:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{idRes.key_terms.map((t:any,i:number)=><div key={i} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{fontWeight:600,fontSize:'0.85rem'}}>{t.term}</div><div style={{opacity:0.7,fontSize:'0.8rem'}}>{t.meaning}</div></div>)}</div></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_creditcoach() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ccScore, setCcScore] = React.useState('');
          const [ccRange, setCcRange] = React.useState('');
          const [ccIssues, setCcIssues] = React.useState('');
          const [ccGoals, setCcGoals] = React.useState('');
          const [ccRes, setCcRes] = React.useState<any>(null);
          const [ccLoading, setCcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🏦 Credit Score Coach</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={ccScore} onChange={e=>setCcScore(e.target.value)} placeholder="Current credit score (e.g. 650)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <select value={ccRange} onChange={e=>setCcRange(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    <option value="">Score range (if unsure)</option>
                    {['below 580 (poor)','580-669 (fair)','670-739 (good)','740-799 (very good)','800+ (exceptional)'].map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <textarea value={ccIssues} onChange={e=>setCcIssues(e.target.value)} placeholder="Known issues (e.g. missed payments, high utilization, collections, limited history, hard inquiries)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={ccGoals} onChange={e=>setCcGoals(e.target.value)} placeholder="Goal (e.g. qualify for mortgage, get better rates, reach 750)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!ccScore.trim())return;setCcLoading(true);setCcRes(null);try{const r=await fetch(`${''}/api/credit/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_score:ccScore,score_range:ccRange,known_issues:ccIssues,goals:ccGoals})});const d=await r.json();setCcRes(d);}catch(e){console.error(e);}finally{setCcLoading(false);}}} disabled={ccLoading||!ccScore.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ccLoading?'Building plan...':'Build Credit Plan 📊'}
                </button>
              </div>
              {ccRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {ccRes.score_assessment&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{fontSize:'1.1rem'}}>📊 {ccRes.score_assessment.tier}: </strong>{ccRes.score_assessment.what_it_means}</div>}
                {Array.isArray(ccRes.biggest_factors)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📋 Score Factors:</strong>{ccRes.biggest_factors.map((f:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><div style={{fontWeight:600}}>{f.factor}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{f.impact}</div></div><div style={{display:'flex',gap:'0.5rem',alignItems:'flex-start'}}><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.75rem',opacity:0.7}}>{f.weight}</span><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:f.your_status==='good'?'#22c55e20':f.your_status==='bad'?'#ef444420':'#94a3b820',color:f.your_status==='good'?'#22c55e':f.your_status==='bad'?'#ef4444':'#94a3b8',fontSize:'0.75rem'}}>{f.your_status}</span></div></div>)}</div>}
                {Array.isArray(ccRes['30_day_actions'])&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚡ 30-Day Actions:</strong>{ccRes['30_day_actions'].map((a:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div style={{fontWeight:600}}>{a.action}</div><div style={{display:'flex',gap:'0.5rem'}}><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'#22c55e20',color:'#22c55e',fontSize:'0.75rem',whiteSpace:'nowrap'}}>{a.impact}</span><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.75rem'}}>{a.difficulty}</span></div></div>)}</div>}
                {ccRes.timeline_to_goal&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎯 Timeline: </strong>Target {ccRes.timeline_to_goal.target_score} in approximately {ccRes.timeline_to_goal.estimated_time}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_taxoptimize() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [toSit, setToSit] = React.useState('');
          const [toIncome, setToIncome] = React.useState('W-2 employee');
          const [toDeduct, setToDeduct] = React.useState('standard deduction');
          const [toFiling, setToFiling] = React.useState('single');
          const [toRes, setToRes] = React.useState<any>(null);
          const [toLoading, setToLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🧾 Tax Optimizer</h2>
              <div style={{padding:'0.75rem',borderRadius:'6px',background:'#f5a62310',border:'1px solid #f5a62340',marginBottom:'1rem',fontSize:'0.85rem',opacity:0.8}}>⚠️ Educational information only — not professional tax advice. Consult a CPA for your specific situation.</div>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={toSit} onChange={e=>setToSit(e.target.value)} placeholder="Describe your tax situation (e.g. freelancer with home office, W-2 employee with side income, married with kids, recently sold stock)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={toIncome} onChange={e=>setToIncome(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['W-2 employee','self-employed/freelancer','business owner','investor','multiple income types','retired'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={toFiling} onChange={e=>setToFiling(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['single','married filing jointly','married filing separately','head of household'].map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <button onClick={async()=>{if(!toSit.trim())return;setToLoading(true);setToRes(null);try{const r=await fetch(`${''}/api/tax/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:toSit,income_type:toIncome,deductions_taken:toDeduct,filing_status:toFiling})});const d=await r.json();setToRes(d);}catch(e){console.error(e);}finally{setToLoading(false);}}} disabled={toLoading||!toSit.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {toLoading?'Analyzing...':'Find Tax Opportunities 💡'}
                </button>
              </div>
              {toRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {toRes.situation_summary&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📋 Situation: </strong>{toRes.situation_summary}</div>}
                {Array.isArray(toRes.opportunities)&&<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}><strong>💰 Tax Opportunities:</strong>{toRes.opportunities.map((o:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><strong>{o.strategy}</strong><span style={{color:'#22c55e',fontWeight:600}}>{o.potential_savings}</span></div><p style={{opacity:0.8,fontSize:'0.9rem',marginBottom:'0.5rem'}}>{o.description}</p><div style={{fontSize:'0.85rem',opacity:0.7}}>Qualifies if: {o.who_qualifies}</div><div style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)',fontSize:'0.85rem'}}>→ {o.action}</div></div>)}</div>}
                {Array.isArray(toRes.timing_strategies)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⏰ Year-End Moves:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{toRes.timing_strategies.map((s:string,i:number)=><li key={i}>{s}</li>)}</ul></div>}
                {Array.isArray(toRes.questions_for_your_cpa)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>❓ Ask Your CPA:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{toRes.questions_for_your_cpa.map((q:string,i:number)=><li key={i}>{q}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_wealthmap() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wmAge, setWmAge] = React.useState('');
          const [wmIncome, setWmIncome] = React.useState('');
          const [wmSavings, setWmSavings] = React.useState('');
          const [wmGoals, setWmGoals] = React.useState('');
          const [wmRisk, setWmRisk] = React.useState('moderate');
          const [wmRes, setWmRes] = React.useState<any>(null);
          const [wmLoading, setWmLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💰 Wealth Roadmapper</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={wmAge} onChange={e=>setWmAge(e.target.value)} placeholder="Your age" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={wmIncome} onChange={e=>setWmIncome(e.target.value)} placeholder="Annual income (e.g. $75,000)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={wmSavings} onChange={e=>setWmSavings(e.target.value)} placeholder="Current savings / net worth (rough estimate)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <textarea value={wmGoals} onChange={e=>setWmGoals(e.target.value)} placeholder="Financial goals (e.g. retire at 55, buy a house, $2M by 60, fund kids' college)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <select value={wmRisk} onChange={e=>setWmRisk(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['conservative','moderately conservative','moderate','moderately aggressive','aggressive'].map(r=><option key={r} value={r}>{r} risk tolerance</option>)}
                </select>
                <button onClick={async()=>{if(!wmAge.trim()||!wmGoals.trim())return;setWmLoading(true);setWmRes(null);try{const r=await fetch(`${''}/api/wealth/roadmap`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({age:wmAge,income:wmIncome,current_savings:wmSavings,goals:wmGoals,risk_tolerance:wmRisk})});const d=await r.json();setWmRes(d);}catch(e){console.error(e);}finally{setWmLoading(false);}}} disabled={wmLoading||!wmAge.trim()||!wmGoals.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {wmLoading?'Building roadmap...':'Build My Wealth Roadmap 🗺️'}
                </button>
              </div>
              {wmRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {wmRes.financial_snapshot&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>📸 Snapshot: </strong>{wmRes.financial_snapshot.assessment}</div>}
                {Array.isArray(wmRes.wealth_stages)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🗺️ Wealth Stages:</strong>{wmRes.wealth_stages.map((s:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>{s.stage}</strong><span style={{opacity:0.6,fontSize:'0.85rem'}}>{s.age_range}</span></div><div style={{opacity:0.8}}>{s.focus}</div><div style={{marginTop:'0.25rem',fontWeight:600,color:'var(--accent)',fontSize:'0.9rem'}}>🎯 {s.target}</div></div>)}</div>}
                {Array.isArray(wmRes.immediate_priorities)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚡ Start Here:</strong>{wmRes.immediate_priorities.map((p:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',gap:'0.75rem'}}><div style={{minWidth:'2rem',fontWeight:700,opacity:0.4,fontSize:'1.2rem'}}>#{p.priority}</div><div><div style={{fontWeight:600}}>{p.action}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{p.why} {p.target_amount&&<span>→ Target: {p.target_amount}</span>}</div></div></div>)}</div>}
                {Array.isArray(wmRes.investment_allocation)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🥧 Portfolio Allocation:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{wmRes.investment_allocation.map((a:any,i:number)=><div key={i} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:600}}>{a.asset}</span><span style={{color:'var(--accent)',fontWeight:700}}>{a.percentage}</span></div><div style={{opacity:0.7,fontSize:'0.75rem'}}>{a.why}</div></div>)}</div></div>}
                {wmRes.retirement_projection&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏖️ Retirement Projection:</strong><div style={{display:'flex',flexDirection:'column',gap:'0.25rem',marginTop:'0.5rem'}}><div>{wmRes.retirement_projection.at_current_rate}</div><div style={{color:'var(--accent)',fontWeight:600}}>Need: {wmRes.retirement_projection.monthly_savings_needed}/month</div></div></div>}
                {Array.isArray(wmRes['5_year_action_plan'])&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📅 5-Year Plan:</strong>{wmRes['5_year_action_plan'].map((y:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong>Year {y.year}:</strong> {y.focus} <span style={{opacity:0.6,fontSize:'0.85rem'}}>→ {y.milestone}</span></div>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_difficultconv2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dcSit, setDcSit] = React.useState('');
          const [dcRel, setDcRel] = React.useState('');
          const [dcWant, setDcWant] = React.useState('');
          const [dcFear, setDcFear] = React.useState('');
          const [dcRes, setDcRes] = React.useState<any>(null);
          const [dcLoading, setDcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💬 Difficult Conversation Coach</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={dcSit} onChange={e=>setDcSit(e.target.value)} placeholder="What\'s the situation? (e.g. telling my boss I\'m underpaid, confronting a friend who betrayed me, ending a relationship)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={dcRel} onChange={e=>setDcRel(e.target.value)} placeholder="Your relationship with them (e.g. my manager, my partner, my best friend)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={dcWant} onChange={e=>setDcWant(e.target.value)} placeholder="What outcome do you want?" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={dcFear} onChange={e=>setDcFear(e.target.value)} placeholder="What are you afraid will happen?" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!dcSit.trim())return;setDcLoading(true);setDcRes(null);try{const r=await fetch(`${''}/api/difficult/convo`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:dcSit,relationship:dcRel,what_you_want:dcWant,what_you_fear:dcFear})});const d=await r.json();setDcRes(d);}catch(e){console.error(e);}finally{setDcLoading(false);}}} disabled={dcLoading||!dcSit.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {dcLoading?'Preparing...':'Prepare Me for This Conversation 💪'}
                </button>
              </div>
              {dcRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {dcRes.reframe&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic'}}>{dcRes.reframe}</div>}
                {Array.isArray(dcRes.opening_scripts)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🎤 How to Open:</strong>{dcRes.opening_scripts.map((s:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{opacity:0.6,fontSize:'0.8rem',marginBottom:'0.5rem',textTransform:'uppercase'}}>{s.tone}</div><div style={{fontStyle:'italic'}}>"{s.script}"</div></div>)}</div>}
                {Array.isArray(dcRes.phrases_to_avoid)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🚫 Avoid These:</strong>{dcRes.phrases_to_avoid.map((p:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{color:'#ef4444',fontSize:'0.85rem'}}>✗ "{p.avoid}"</div><div style={{color:'#22c55e',fontSize:'0.85rem',marginTop:'0.25rem'}}>✓ "{p.say_instead}"</div></div>)}</div>}
                {Array.isArray(dcRes.if_they_react_badly)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛡️ If They Push Back:</strong>{dcRes.if_they_react_badly.map((r:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><strong style={{opacity:0.7}}>{r.reaction}:</strong> {r.response}</div>)}</div>}
                {dcRes.how_to_close&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎯 How to Close: </strong>{dcRes.how_to_close}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_apologycraft() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [acWhat, setAcWhat] = React.useState('');
          const [acRel, setAcRel] = React.useState('');
          const [acFeel, setAcFeel] = React.useState('');
          const [acHow, setAcHow] = React.useState('in person');
          const [acRes, setAcRes] = React.useState<any>(null);
          const [acLoading, setAcLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🙏 Apology Crafter</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={acWhat} onChange={e=>setAcWhat(e.target.value)} placeholder="What happened? What did you do wrong?" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={acRel} onChange={e=>setAcRel(e.target.value)} placeholder="Your relationship with them" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={acFeel} onChange={e=>setAcFeel(e.target.value)} placeholder="How do you think they feel? (e.g. betrayed, hurt, disrespected)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <select value={acHow} onChange={e=>setAcHow(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['in person','phone call','text message','handwritten letter','email'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={async()=>{if(!acWhat.trim())return;setAcLoading(true);setAcRes(null);try{const r=await fetch(`${''}/api/apology/craft`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({what_happened:acWhat,relationship:acRel,how_they_feel:acFeel,delivery_method:acHow})});const d=await r.json();setAcRes(d);}catch(e){console.error(e);}finally{setAcLoading(false);}}} disabled={acLoading||!acWhat.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {acLoading?'Crafting...':'Craft My Apology 💌'}
                </button>
              </div>
              {acRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {Array.isArray(acRes.apology_versions)&&acRes.apology_versions.map((v:any,i:number)=><div key={i} style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:i===0?'2px solid var(--accent)':'1px solid var(--border)'}}><div style={{opacity:0.6,fontSize:'0.8rem',marginBottom:'0.75rem',textTransform:'uppercase'}}>{v.style} version</div><div style={{lineHeight:1.8,fontStyle:'italic'}}>"{v.apology}"</div></div>)}
                {Array.isArray(acRes.follow_through_actions)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>✅ Back It Up With Action:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{acRes.follow_through_actions.map((a:string,i:number)=><li key={i}>{a}</li>)}</ul></div>}
                {acRes.give_them_space&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⏳ Timing: </strong>{acRes.give_them_space}</div>}
                {acRes.if_they_dont_accept&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💔 If They Don\'t Accept It: </strong>{acRes.if_they_dont_accept}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_complimenteng() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cePerson, setCePerson] = React.useState('');
          const [ceContext, setCeContext] = React.useState('');
          const [ceRel, setCeRel] = React.useState('');
          const [ceGoal, setCeGoal] = React.useState('make them feel appreciated');
          const [ceRes, setCeRes] = React.useState<any>(null);
          const [ceLoading, setCeLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💝 Compliment Engineer</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={cePerson} onChange={e=>setCePerson(e.target.value)} placeholder="Describe the person (personality, achievements, what you admire)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ceContext} onChange={e=>setCeContext(e.target.value)} placeholder="Context (e.g. they just got promoted, helped me through a hard time, is always there for others)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={ceRel} onChange={e=>setCeRel(e.target.value)} placeholder="Your relationship" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <select value={ceGoal} onChange={e=>setCeGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    {['make them feel appreciated','strengthen our bond','cheer them up','celebrate their success','express gratitude'].map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <button onClick={async()=>{if(!cePerson.trim())return;setCeLoading(true);setCeRes(null);try{const r=await fetch(`${''}/api/compliment/engineer`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({person_description:cePerson,context:ceContext,relationship:ceRel,goal:ceGoal})});const d=await r.json();setCeRes(d);}catch(e){console.error(e);}finally{setCeLoading(false);}}} disabled={ceLoading||!cePerson.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ceLoading?'Engineering...':'Engineer Perfect Compliments 💫'}
                </button>
              </div>
              {ceRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {Array.isArray(ceRes.compliments)&&<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>{ceRes.compliments.map((c:any,i:number)=><div key={i} style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{opacity:0.5,fontSize:'0.75rem',textTransform:'uppercase',marginBottom:'0.5rem'}}>{c.type}</div><div style={{fontSize:'1.05rem',fontStyle:'italic',marginBottom:'0.5rem'}}>"{c.compliment}"</div><div style={{opacity:0.6,fontSize:'0.85rem'}}>💡 {c.delivery_tip}</div></div>)}</div>}
                {ceRes.written_note&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📝 Written Note Version:</strong><p style={{marginTop:'0.5rem',fontStyle:'italic',lineHeight:1.7}}>{ceRes.written_note}</p></div>}
                {ceRes.timing_advice&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⏰ When & How: </strong>{ceRes.timing_advice}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_boundaryset() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bsSit, setBsSit] = React.useState('');
          const [bsRel, setBsRel] = React.useState('');
          const [bsDyn, setBsDyn] = React.useState('');
          const [bsBound, setBsBound] = React.useState('');
          const [bsRes, setBsRes] = React.useState<any>(null);
          const [bsLoading, setBsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🛡️ Boundary Setter</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={bsSit} onChange={e=>setBsSit(e.target.value)} placeholder="What\'s the situation? What keeps happening that you need to stop?" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={bsRel} onChange={e=>setBsRel(e.target.value)} placeholder="Your relationship with this person" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={bsDyn} onChange={e=>setBsDyn(e.target.value)} placeholder="Current dynamic (e.g. they always call me for advice, my parent guilt trips me, coworker oversteps)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={bsBound} onChange={e=>setBsBound(e.target.value)} placeholder="The boundary you want to set" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!bsSit.trim()||!bsBound.trim())return;setBsLoading(true);setBsRes(null);try{const r=await fetch(`${''}/api/boundary/set`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:bsSit,relationship:bsRel,current_dynamic:bsDyn,boundary_needed:bsBound})});const d=await r.json();setBsRes(d);}catch(e){console.error(e);}finally{setBsLoading(false);}}} disabled={bsLoading||!bsSit.trim()||!bsBound.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {bsLoading?'Preparing...':'Help Me Set This Boundary 🛡️'}
                </button>
              </div>
              {bsRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {bsRes.validation&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic'}}>{bsRes.validation}</div>}
                {bsRes.boundary_clarity&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎯 Your Boundary: </strong>{bsRes.boundary_clarity}</div>}
                {Array.isArray(bsRes.scripts)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>💬 Scripts:</strong>{bsRes.scripts.map((s:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{opacity:0.6,fontSize:'0.8rem',marginBottom:'0.5rem'}}>{s.scenario} — {s.tone}</div><div style={{fontStyle:'italic'}}>"{s.script}"</div></div>)}</div>}
                {Array.isArray(bsRes.their_likely_reactions)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛡️ Hold Your Ground:</strong>{bsRes.their_likely_reactions.map((r:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{opacity:0.7,fontSize:'0.85rem'}}>{r.reaction}</div><div style={{marginTop:'0.25rem',fontWeight:500}}>→ {r.your_response}</div></div>)}</div>}
                {bsRes.internal_work&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🧠 Mindset Shift: </strong>{bsRes.internal_work}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_lovelang() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [llYours, setLlYours] = React.useState('');
          const [llPartner, setLlPartner] = React.useState('');
          const [llType, setLlType] = React.useState('romantic partner');
          const [llChallenge, setLlChallenge] = React.useState('');
          const [llRes, setLlRes] = React.useState<any>(null);
          const [llLoading, setLlLoading] = React.useState(false);
          const languages = ['words of affirmation','acts of service','receiving gifts','quality time','physical touch','not sure yet'];
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>❤️ Love Language Guide</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <select value={llYours} onChange={e=>setLlYours(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    <option value="">Your love language...</option>
                    {languages.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={llPartner} onChange={e=>setLlPartner(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                    <option value="">Their love language...</option>
                    {languages.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <select value={llType} onChange={e=>setLlType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}>
                  {['romantic partner','spouse','close friend','parent','child','sibling'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                <input value={llChallenge} onChange={e=>setLlChallenge(e.target.value)} placeholder="Current challenge or goal (e.g. feeling disconnected, want to show more love)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!llYours)return;setLlLoading(true);setLlRes(null);try{const r=await fetch(`${''}/api/lovelanguage/guide`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({your_language:llYours,partner_language:llPartner,relationship_type:llType,current_challenge:llChallenge})});const d=await r.json();setLlRes(d);}catch(e){console.error(e);}finally{setLlLoading(false);}}} disabled={llLoading||!llYours} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {llLoading?'Generating...':'Get My Love Language Guide ❤️'}
                </button>
              </div>
              {llRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {llRes.language_mismatch_insight&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong>💡 Insight: </strong>{llRes.language_mismatch_insight}</div>}
                {Array.isArray(llRes.connection_ideas)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>💞 Connection Ideas:</strong>{llRes.connection_ideas.map((c:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><div style={{fontWeight:600}}>{c.idea}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{c.why_it_works}</div></div><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.75rem',height:'fit-content',whiteSpace:'nowrap'}}>{c.effort_level}</span></div>)}</div>}
                {Array.isArray(llRes.daily_habits)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📅 Daily Habits:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{llRes.daily_habits.map((h:string,i:number)=><li key={i}>{h}</li>)}</ul></div>}
                {Array.isArray(llRes.scripts)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>💬 Scripts:</strong>{llRes.scripts.map((s:any,i:number)=><div key={i} style={{marginTop:'0.5rem',padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{opacity:0.6,fontSize:'0.8rem'}}>{s.situation}</div><div style={{fontStyle:'italic',marginTop:'0.25rem'}}>"{s.what_to_say}"</div></div>)}</div>}
                {llRes.conflict_through_love_language_lens&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚡ In Conflict: </strong>{llRes.conflict_through_love_language_lens}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_procbust() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pbTask, setPbTask] = React.useState('');
          const [pbHow, setPbHow] = React.useState('');
          const [pbRoot, setPbRoot] = React.useState('');
          const [pbDeadline, setPbDeadline] = React.useState('');
          const [pbRes, setPbRes] = React.useState<any>(null);
          const [pbLoading, setPbLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>⚡ Procrastination Buster</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={pbTask} onChange={e=>setPbTask(e.target.value)} placeholder="What are you avoiding? (be specific)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pbHow} onChange={e=>setPbHow(e.target.value)} placeholder="How long have you been avoiding it?" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pbRoot} onChange={e=>setPbRoot(e.target.value)} placeholder="Why do you think you\'re avoiding it? (e.g. fear of failure, overwhelm, boring, unclear)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pbDeadline} onChange={e=>setPbDeadline(e.target.value)} placeholder="Deadline (if any)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!pbTask.trim())return;setPbLoading(true);setPbRes(null);try{const r=await fetch(`${''}/api/procrastination/bust`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({task:pbTask,how_long_avoiding:pbHow,root_cause:pbRoot,deadline:pbDeadline})});const d=await r.json();setPbRes(d);}catch(e){console.error(e);}finally{setPbLoading(false);}}} disabled={pbLoading||!pbTask.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {pbLoading?'Diagnosing...':'Bust This Procrastination 💥'}
                </button>
              </div>
              {pbRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {pbRes.procrastination_diagnosis&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><div style={{opacity:0.6,fontSize:'0.8rem',marginBottom:'0.5rem'}}>TYPE: {pbRes.procrastination_diagnosis.type?.toUpperCase()}</div><strong>Root Cause: </strong>{pbRes.procrastination_diagnosis.root_cause}<div style={{marginTop:'0.5rem',fontStyle:'italic',opacity:0.7}}>Hidden belief: {pbRes.procrastination_diagnosis.underlying_belief}</div></div>}
                {pbRes.reframe&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🔄 Reframe: </strong>{pbRes.reframe}</div>}
                {pbRes['2_minute_start']&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid #22c55e'}}><strong style={{color:'#22c55e'}}>🚀 Start Right Now: </strong>{pbRes['2_minute_start']}</div>}
                {Array.isArray(pbRes.task_breakdown)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>📋 Broken Down:</strong>{pbRes.task_breakdown.map((t:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><div style={{fontWeight:600}}>{t.micro_step}</div><div style={{opacity:0.7,fontSize:'0.8rem'}}>{t.makes_it_easier_because}</div></div><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--bg-primary)',fontSize:'0.8rem',whiteSpace:'nowrap'}}>{t.time} min</span></div>)}</div>}
                {pbRes.environment_hack&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🏠 Environment Hack: </strong>{pbRes.environment_hack}</div>}
                {pbRes.completion_reward&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🎁 Your Reward: </strong>{pbRes.completion_reward}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_emailzero() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ezCount, setEzCount] = React.useState('');
          const [ezTypes, setEzTypes] = React.useState('');
          const [ezTime, setEzTime] = React.useState('');
          const [ezPain, setEzPain] = React.useState('');
          const [ezRes, setEzRes] = React.useState<any>(null);
          const [ezLoading, setEzLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📭 Email Zero Coach</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={ezCount} onChange={e=>setEzCount(e.target.value)} placeholder="Current inbox count (e.g. 3,000 unread, 500, completely buried)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ezTypes} onChange={e=>setEzTypes(e.target.value)} placeholder="Types of email (e.g. work requests, newsletters, client emails, notifications)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ezTime} onChange={e=>setEzTime(e.target.value)} placeholder="Time spent on email per day" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={ezPain} onChange={e=>setEzPain(e.target.value)} placeholder="Biggest pain point with email" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!ezCount.trim())return;setEzLoading(true);setEzRes(null);try{const r=await fetch(`${''}/api/email/zero`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({inbox_count:ezCount,email_types:ezTypes,time_spent_daily:ezTime,pain_points:ezPain})});const d=await r.json();setEzRes(d);}catch(e){console.error(e);}finally{setEzLoading(false);}}} disabled={ezLoading||!ezCount.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {ezLoading?'Designing system...':'Build My Inbox Zero System 📬'}
                </button>
              </div>
              {ezRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {ezRes.inbox_zero_philosophy&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic'}}>{ezRes.inbox_zero_philosophy}</div>}
                {Array.isArray(ezRes.one_time_reset)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🔄 One-Time Reset:</strong>{ezRes.one_time_reset.map((s:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div style={{fontWeight:500}}>{s.step}</div><span style={{opacity:0.6,fontSize:'0.85rem',whiteSpace:'nowrap'}}>{s.time_needed}</span></div>)}</div>}
                {Array.isArray(ezRes.processing_rules)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⚡ Processing Rules:</strong>{ezRes.processing_rules.map((r:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}><strong>{r.email_type}</strong><span style={{opacity:0.6,fontSize:'0.8rem'}}>{r.time_limit}</span></div><div style={{opacity:0.8}}>→ {r.action}</div></div>)}</div>}
                {Array.isArray(ezRes.daily_routine)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📅 Daily Routine:</strong>{ezRes.daily_routine.map((d:any,i:number)=><div key={i} style={{marginTop:'0.5rem',display:'flex',gap:'1rem'}}><strong style={{minWidth:'60px',opacity:0.6}}>{d.time}</strong><div>{d.action} <span style={{opacity:0.5,fontSize:'0.85rem'}}>({d.duration})</span></div></div>)}</div>}
                {ezRes.time_target&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',textAlign:'center'}}><strong>🎯 Target: </strong>{ezRes.time_target}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_meetingaudit() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [maMtgs, setMaMtgs] = React.useState('');
          const [maTypes, setMaTypes] = React.useState('');
          const [maHours, setMaHours] = React.useState('');
          const [maRole, setMaRole] = React.useState('');
          const [maRes, setMaRes] = React.useState<any>(null);
          const [maLoading, setMaLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🗓️ Meeting Eliminator</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={maMtgs} onChange={e=>setMaMtgs(e.target.value)} placeholder="List your weekly meetings (e.g. Mon 9am team standup, Tue 2pm 1:1 with manager, Wed all-hands...)" rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={maHours} onChange={e=>setMaHours(e.target.value)} placeholder="Hours in meetings per week" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={maRole} onChange={e=>setMaRole(e.target.value)} placeholder="Your role (e.g. IC engineer, manager, founder)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <button onClick={async()=>{if(!maMtgs.trim())return;setMaLoading(true);setMaRes(null);try{const r=await fetch(`${''}/api/meeting/audit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({weekly_meetings:maMtgs,meeting_types:maTypes,hours_in_meetings:maHours,role:maRole})});const d=await r.json();setMaRes(d);}catch(e){console.error(e);}finally{setMaLoading(false);}}} disabled={maLoading||!maMtgs.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {maLoading?'Auditing...':'Audit My Meetings 🔍'}
                </button>
              </div>
              {maRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {maRes.meeting_reality_check&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}>{maRes.meeting_reality_check}</div>}
                {Array.isArray(maRes.meetings_to_eliminate)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong style={{color:'#ef4444'}}>🗑️ Eliminate These:</strong>{maRes.meetings_to_eliminate.map((m:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600}}>{m.meeting}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{m.reason}</div><div style={{marginTop:'0.25rem',color:'#22c55e',fontSize:'0.85rem'}}>Instead: {m.alternative}</div></div>)}</div>}
                {Array.isArray(maRes.async_alternatives)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📨 Go Async Instead:</strong>{maRes.async_alternatives.map((a:any,i:number)=><div key={i} style={{marginTop:'0.5rem'}}><strong>{a.replaces}:</strong> {a.tool} — {a.how}</div>)}</div>}
                {Array.isArray(maRes.how_to_decline)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>❌ How to Decline:</strong>{maRes.how_to_decline.map((d:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{opacity:0.6,fontSize:'0.8rem'}}>{d.scenario}</div><div style={{fontStyle:'italic',marginTop:'0.25rem'}}>"{d.script}"</div></div>)}</div>}
                {maRes.time_reclaimed&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'2px solid #22c55e',textAlign:'center'}}><strong style={{color:'#22c55e',fontSize:'1.1rem'}}>⏱️ Time Reclaimed: {maRes.time_reclaimed}</strong><div style={{marginTop:'0.5rem',opacity:0.8}}>{maRes.what_to_do_with_reclaimed_time}</div></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_pkmdesign() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pkTools, setPkTools] = React.useState('');
          const [pkFails, setPkFails] = React.useState('');
          const [pkRole, setPkRole] = React.useState('');
          const [pkGoals, setPkGoals] = React.useState('');
          const [pkRes, setPkRes] = React.useState<any>(null);
          const [pkLoading, setPkLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🗂️ PKM Architect</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <input value={pkTools} onChange={e=>setPkTools(e.target.value)} placeholder="Current tools (e.g. Notion, Apple Notes, Obsidian, random notebooks, nothing)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pkFails} onChange={e=>setPkFails(e.target.value)} placeholder="What fails about your current system? (e.g. can\'t find notes, too complex, don\'t maintain it)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pkRole} onChange={e=>setPkRole(e.target.value)} placeholder="Your role (e.g. student, researcher, engineer, creator, executive)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pkGoals} onChange={e=>setPkGoals(e.target.value)} placeholder="Knowledge goals (e.g. retain what I read, build a writing library, track projects + ideas)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!pkTools.trim())return;setPkLoading(true);setPkRes(null);try{const r=await fetch(`${''}/api/pkm/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_tools:pkTools,what_fails:pkFails,role:pkRole,knowledge_goals:pkGoals})});const d=await r.json();setPkRes(d);}catch(e){console.error(e);}finally{setPkLoading(false);}}} disabled={pkLoading||!pkTools.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {pkLoading?'Designing...':'Design My PKM System 🗂️'}
                </button>
              </div>
              {pkRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {pkRes.pkm_diagnosis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🔍 Diagnosis: </strong>{pkRes.pkm_diagnosis}</div>}
                {pkRes.recommended_methodology&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{fontSize:'1.1rem'}}>✨ Recommended: {pkRes.recommended_methodology.name}</strong><p style={{marginTop:'0.5rem',opacity:0.8}}>{pkRes.recommended_methodology.why_for_you}</p></div>}
                {pkRes.system_design&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>{Object.entries(pkRes.system_design).map(([k,v])=><div key={k} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600,textTransform:'capitalize',marginBottom:'0.25rem'}}>{k}</div><div style={{opacity:0.8,fontSize:'0.9rem'}}>{v as string}</div></div>)}</div>}
                {Array.isArray(pkRes.tool_stack)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🛠️ Tool Stack:</strong>{pkRes.tool_stack.map((t:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><div style={{fontWeight:600}}>{t.tool}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{t.purpose}</div></div><div style={{opacity:0.6,fontSize:'0.8rem',textAlign:'right'}}>Fixes: {t.replaces}</div></div>)}</div>}
                {Array.isArray(pkRes.quick_start)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🚀 Start Today:</strong><ol style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{pkRes.quick_start.map((s:string,i:number)=><li key={i}>{s}</li>)}</ol></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_deepworkplan2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dwSched, setDwSched] = React.useState('');
          const [dwWork, setDwWork] = React.useState('');
          const [dwEnv, setDwEnv] = React.useState('');
          const [dwDist, setDwDist] = React.useState('');
          const [dwRes, setDwRes] = React.useState<any>(null);
          const [dwLoading, setDwLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🧠 Deep Work Planner</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={dwSched} onChange={e=>setDwSched(e.target.value)} placeholder="Your current typical schedule" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <input value={dwWork} onChange={e=>setDwWork(e.target.value)} placeholder="Type of work (e.g. writing, coding, research)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={dwEnv} onChange={e=>setDwEnv(e.target.value)} placeholder="Work environment (e.g. home office, open office)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={dwDist} onChange={e=>setDwDist(e.target.value)} placeholder="Biggest distraction (e.g. phone, Slack, social media)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!dwSched.trim())return;setDwLoading(true);setDwRes(null);try{const r=await fetch(`${''}/api/deepwork/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({schedule:dwSched,work_type:dwWork,environment:dwEnv,biggest_distraction:dwDist})});const d=await r.json();setDwRes(d);}catch(e){console.error(e);}finally{setDwLoading(false);}}} disabled={dwLoading||!dwSched.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {dwLoading?'Designing...':'Design My Deep Work System 🎯'}
                </button>
              </div>
              {dwRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {dwRes.deep_work_philosophy&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic'}}>{dwRes.deep_work_philosophy}</div>}
                {Array.isArray(dwRes.optimal_deep_work_windows)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>⏰ Optimal Windows:</strong>{dwRes.optimal_deep_work_windows.map((w:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',display:'flex',justifyContent:'space-between',gap:'1rem'}}><div><div style={{fontWeight:700}}>{w.window}</div><div style={{opacity:0.7,fontSize:'0.85rem'}}>{w.why}</div></div><span style={{padding:'0.25rem 0.5rem',borderRadius:'4px',background:'var(--accent)',color:'white',fontSize:'0.85rem'}}>{w.duration}</span></div>)}</div>}
                {dwRes.distraction_protocol&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛡️ Distraction Protocol:</strong><div style={{display:'flex',flexDirection:'column',gap:'0.25rem',marginTop:'0.5rem'}}>{Object.entries(dwRes.distraction_protocol).map(([k,v])=><div key={k} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><strong style={{textTransform:'capitalize'}}>{k}:</strong> {v as string}</div>)}</div></div>}
                {Array.isArray(dwRes.shutdown_ritual)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🌙 Shutdown Ritual:</strong><ol style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{dwRes.shutdown_ritual.map((s:string,i:number)=><li key={i}>{s}</li>)}</ol></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_charbuild() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cbName, setCbName] = React.useState('');
          const [cbGenre, setCbGenre] = React.useState('');
          const [cbTraits, setCbTraits] = React.useState('');
          const [cbBack, setCbBack] = React.useState('');
          const [cbRole, setCbRole] = React.useState('');
          const [cbRes, setCbRes] = React.useState<any>(null);
          const [cbLoading, setCbLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🎭 Character Builder</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={cbName} onChange={e=>setCbName(e.target.value)} placeholder="Character name" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={cbGenre} onChange={e=>setCbGenre(e.target.value)} placeholder="Genre (e.g. literary fiction, thriller, fantasy)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={cbTraits} onChange={e=>setCbTraits(e.target.value)} placeholder="Key traits (e.g. ambitious, secretly insecure, obsessively loyal)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={cbBack} onChange={e=>setCbBack(e.target.value)} placeholder="Backstory hint (optional)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={cbRole} onChange={e=>setCbRole(e.target.value)} placeholder="Story role (protagonist, antagonist, mentor...)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!cbName.trim()&&!cbTraits.trim())return;setCbLoading(true);setCbRes(null);try{const r=await fetch(`${''}/api/character/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({character_name:cbName,genre:cbGenre,traits:cbTraits,backstory_hint:cbBack,story_role:cbRole})});const d=await r.json();setCbRes(d);}catch(e){console.error(e);}finally{setCbLoading(false);}}} disabled={cbLoading||(!cbName.trim()&&!cbTraits.trim())} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {cbLoading?'Building...':'Build This Character 🎭'}
                </button>
              </div>
              {cbRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {cbRes.character_essence&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic',fontSize:'1.1rem'}}>{cbRes.character_essence}</div>}
                {Array.isArray(cbRes.core_traits)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🎯 Core Traits:</strong>{cbRes.core_traits.map((t:any,i:number)=><div key={i} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700,marginBottom:'0.5rem'}}>{t.trait}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',fontSize:'0.85rem'}}><div><span style={{opacity:0.6}}>Shows as: </span>{t.how_it_shows}</div><div><span style={{opacity:0.6,color:'#ef4444'}}>Dark side: </span>{t.dark_side}</div></div></div>)}</div>}
                {cbRes.backstory&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📜 Backstory:</strong><div style={{display:'flex',flexDirection:'column',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(cbRes.backstory).map(([k,v])=><div key={k}><strong style={{textTransform:'capitalize',opacity:0.7}}>{k}: </strong>{v as string}</div>)}</div></div>}
                {cbRes.voice&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🗣️ Voice:</strong><div style={{marginTop:'0.5rem'}}><div><strong style={{opacity:0.7}}>Speech: </strong>{cbRes.voice.speech_pattern}</div><div style={{marginTop:'0.25rem'}}><strong style={{opacity:0.7}}>Never says: </strong><em>{cbRes.voice.what_they_never_say}</em></div></div></div>}
                {cbRes.arc&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>📈 Arc:</strong><div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.5rem',flexWrap:'wrap'}}><span style={{padding:'0.25rem 0.75rem',borderRadius:'4px',background:'var(--bg-primary)'}}>{cbRes.arc.starts_as}</span><span>→</span><span style={{padding:'0.25rem 0.75rem',borderRadius:'4px',background:'var(--accent)',color:'white',fontSize:'0.85rem'}}>{cbRes.arc.catalyst}</span><span>→</span><span style={{padding:'0.25rem 0.75rem',borderRadius:'4px',background:'var(--bg-primary)'}}>{cbRes.arc.ends_as}</span></div></div>}
                {Array.isArray(cbRes.contradictions)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚡ Contradictions (what makes them human):</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{cbRes.contradictions.map((c:string,i:number)=><li key={i}>{c}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_plotweave() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pwGenre, setPwGenre] = React.useState('');
          const [pwPremise, setPwPremise] = React.useState('');
          const [pwProta, setPwProta] = React.useState('');
          const [pwConflict, setPwConflict] = React.useState('');
          const [pwTheme, setPwTheme] = React.useState('');
          const [pwRes, setPwRes] = React.useState<any>(null);
          const [pwLoading, setPwLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>📖 Plot Weaver</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={pwPremise} onChange={e=>setPwPremise(e.target.value)} placeholder="Core premise (e.g. A disgraced detective returns to her hometown to solve her sister\'s disappearance)" rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={pwGenre} onChange={e=>setPwGenre(e.target.value)} placeholder="Genre" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={pwProta} onChange={e=>setPwProta(e.target.value)} placeholder="Protagonist (brief description)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={pwConflict} onChange={e=>setPwConflict(e.target.value)} placeholder="Central conflict (internal + external)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={pwTheme} onChange={e=>setPwTheme(e.target.value)} placeholder="Theme or question the story asks" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!pwPremise.trim())return;setPwLoading(true);setPwRes(null);try{const r=await fetch(`${''}/api/plot/weave`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({genre:pwGenre,premise:pwPremise,protagonist:pwProta,conflict:pwConflict,theme:pwTheme})});const d=await r.json();setPwRes(d);}catch(e){console.error(e);}finally{setPwLoading(false);}}} disabled={pwLoading||!pwPremise.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {pwLoading?'Weaving...':'Weave My Plot 📖'}
                </button>
              </div>
              {pwRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {pwRes.logline&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)',fontStyle:'italic',fontSize:'1.05rem'}}>"{pwRes.logline}"</div>}
                {pwRes.three_act_structure&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>{Object.entries(pwRes.three_act_structure).map(([act,data]:any)=><div key={act} style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:700,textTransform:'uppercase',fontSize:'0.8rem',opacity:0.6,marginBottom:'0.5rem'}}>{act.replace('act','Act ')}</div>{Object.entries(data).map(([k,v])=><div key={k} style={{marginBottom:'0.25rem',fontSize:'0.85rem'}}><strong style={{opacity:0.7,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}: </strong>{v as string}</div>)}</div>)}</div>}
                {Array.isArray(pwRes.key_scenes)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🎬 Key Scenes:</strong>{pwRes.key_scenes.map((s:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontWeight:600}}>{s.scene}</div><div style={{opacity:0.7,fontSize:'0.85rem',marginTop:'0.25rem'}}>{s.purpose} · <em>{s.emotional_beat}</em></div></div>)}</div>}
                {Array.isArray(pwRes.plot_twists)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🌀 Plot Twists:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{pwRes.plot_twists.map((t:string,i:number)=><li key={i}>{t}</li>)}</ul></div>}
                {pwRes.opening_line_suggestion&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>✍️ Opening Line: </strong><em>"{pwRes.opening_line_suggestion}"</em></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_dialogsharp() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dsDialog, setDsDialog] = React.useState('');
          const [dsChars, setDsChars] = React.useState('');
          const [dsGoal, setDsGoal] = React.useState('');
          const [dsTone, setDsTone] = React.useState('');
          const [dsUnsaid, setDsUnsaid] = React.useState('');
          const [dsRes, setDsRes] = React.useState<any>(null);
          const [dsLoading, setDsLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>💬 Dialogue Sharpener</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <textarea value={dsDialog} onChange={e=>setDsDialog(e.target.value)} placeholder="Paste your dialogue here..." rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)',resize:'vertical',fontFamily:'monospace'}}/>
                <input value={dsChars} onChange={e=>setDsChars(e.target.value)} placeholder="Characters in scene (names + brief description)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={dsGoal} onChange={e=>setDsGoal(e.target.value)} placeholder="Scene goal (what needs to happen)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={dsTone} onChange={e=>setDsTone(e.target.value)} placeholder="Tone (e.g. tense, playful, heartbreaking)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={dsUnsaid} onChange={e=>setDsUnsaid(e.target.value)} placeholder="What\'s really being said underneath (subtext)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!dsDialog.trim())return;setDsLoading(true);setDsRes(null);try{const r=await fetch(`${''}/api/dialogue/sharpen`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({existing_dialogue:dsDialog,characters:dsChars,scene_goal:dsGoal,tone:dsTone,what_unsaid:dsUnsaid})});const d=await r.json();setDsRes(d);}catch(e){console.error(e);}finally{setDsLoading(false);}}} disabled={dsLoading||!dsDialog.trim()} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {dsLoading?'Sharpening...':'Sharpen This Dialogue ✂️'}
                </button>
              </div>
              {dsRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {dsRes.diagnosis&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid #ef4444'}}><strong>🔍 Diagnosis: </strong>{dsRes.diagnosis}</div>}
                {dsRes.rewritten_dialogue&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><strong style={{display:'block',marginBottom:'0.75rem'}}>✨ Rewritten:</strong><pre style={{whiteSpace:'pre-wrap',fontFamily:'inherit',margin:0}}>{dsRes.rewritten_dialogue}</pre></div>}
                {Array.isArray(dsRes.subtext_map)&&<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}><strong>🧠 Subtext Map:</strong>{dsRes.subtext_map.map((s:any,i:number)=><div key={i} style={{padding:'0.75rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><div style={{fontStyle:'italic',opacity:0.8}}>"{s.line}"</div><div style={{marginTop:'0.25rem',fontSize:'0.85rem'}}>Really means: <strong>{s.what_they_really_mean}</strong></div></div>)}</div>}
                {Array.isArray(dsRes.techniques_used)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>🛠️ Techniques Used:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{dsRes.techniques_used.map((t:string,i:number)=><li key={i}>{t}</li>)}</ul></div>}
              </div>}
            </div>
          );
}

export function ForgeTab_worldbuild2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wbGenre, setWbGenre] = React.useState('');
          const [wbType, setWbType] = React.useState('');
          const [wbRules, setWbRules] = React.useState('');
          const [wbSociety, setWbSociety] = React.useState('');
          const [wbConflict, setWbConflict] = React.useState('');
          const [wbRes, setWbRes] = React.useState<any>(null);
          const [wbLoading, setWbLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'800px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.5rem'}}>🌍 World Builder</h2>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <input value={wbGenre} onChange={e=>setWbGenre(e.target.value)} placeholder="Genre (fantasy, sci-fi, alternate history...)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                  <input value={wbType} onChange={e=>setWbType(e.target.value)} placeholder="World type (e.g. floating islands, underwater city, post-apocalyptic)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                </div>
                <input value={wbRules} onChange={e=>setWbRules(e.target.value)} placeholder="Magic or tech rules (e.g. magic costs life force, FTL travel requires ancient gates)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={wbSociety} onChange={e=>setWbSociety(e.target.value)} placeholder="Society type (e.g. rigid caste system, anarchist collectives, feudal monarchy)" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <input value={wbConflict} onChange={e=>setWbConflict(e.target.value)} placeholder="Conflict seed for your story" style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--border)',background:'var(--bg-secondary)',color:'var(--text)'}}/>
                <button onClick={async()=>{if(!wbGenre.trim()&&!wbType.trim())return;setWbLoading(true);setWbRes(null);try{const r=await fetch(`${''}/api/world/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({genre:wbGenre,world_type:wbType,magic_or_tech_rules:wbRules,society_type:wbSociety,conflict_seed:wbConflict})});const d=await r.json();setWbRes(d);}catch(e){console.error(e);}finally{setWbLoading(false);}}} disabled={wbLoading||(!wbGenre.trim()&&!wbType.trim())} style={{padding:'0.875rem',borderRadius:'8px',background:'var(--accent)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'1rem'}}>
                  {wbLoading?'Building...':'Build My World 🌍'}
                </button>
              </div>
              {wbRes&&<div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {wbRes.world_name&&<div style={{padding:'1.25rem',borderRadius:'12px',background:'var(--bg-secondary)',border:'2px solid var(--accent)'}}><div style={{fontSize:'1.5rem',fontWeight:700}}>{wbRes.world_name}</div><div style={{marginTop:'0.5rem',opacity:0.8,fontStyle:'italic'}}>{wbRes.elevator_pitch}</div></div>}
                {wbRes.magic_or_tech&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚡ Magic/Tech:</strong><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.5rem'}}>{Object.entries(wbRes.magic_or_tech).map(([k,v])=><div key={k} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)'}}><div style={{opacity:0.6,fontSize:'0.75rem',textTransform:'uppercase'}}>{k.replace(/_/g,' ')}</div><div style={{fontSize:'0.9rem'}}>{v as string}</div></div>)}</div></div>}
                {wbRes.society&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)'}}><strong>⚔️ Society:</strong><div style={{marginTop:'0.5rem'}}><div style={{marginBottom:'0.5rem'}}><strong style={{opacity:0.7}}>Power: </strong>{wbRes.society.power_structure}</div>{Array.isArray(wbRes.society.factions)&&wbRes.society.factions.map((f:any,i:number)=><div key={i} style={{padding:'0.5rem',borderRadius:'6px',background:'var(--bg-primary)',marginBottom:'0.25rem'}}><strong>{f.name}</strong>: {f.goal} · <em style={{opacity:0.7}}>{f.methods}</em></div>)}</div></div>}
                {Array.isArray(wbRes.story_hooks)&&<div style={{padding:'1rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border)',borderLeft:'4px solid var(--accent)'}}><strong>🪝 Story Hooks:</strong><ul style={{margin:'0.5rem 0 0',paddingLeft:'1.25rem'}}>{wbRes.story_hooks.map((h:string,i:number)=><li key={i}>{h}</li>)}</ul></div>}
              </div>}
            </div>
          );
}
