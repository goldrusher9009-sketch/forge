'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_famlegacy72() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [flMember, setFlMember] = React.useState('');
  const [flStories, setFlStories] = React.useState('');
  const [flValues, setFlValues] = React.useState('');
  const [flAudience, setFlAudience] = React.useState('');
  const [flResult, setFlResult] = React.useState('');
  const [flLoading, setFlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>👨‍👩‍👧‍👦 Family Legacy Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Preserve family stories and values for future generations.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Family member to honor" value={flMember} onChange={e=>setFlMember(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Key stories and moments to preserve" value={flStories} onChange={e=>setFlStories(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Core values they embodied" value={flValues} onChange={e=>setFlValues(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Who will read this?" value={flAudience} onChange={e=>setFlAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!flMember||!flStories)return;setFlLoading(true);setFlResult('');try{const r=await fetch(`${''}/api/family/legacy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({family_member:flMember,stories:flStories,values:flValues,audience:flAudience})});const d=await r.json();setFlResult(d.legacy||d.error);}catch(e:any){setFlResult(e.message);}setFlLoading(false);}} disabled={flLoading||!flMember} style={{padding:'0.75rem',borderRadius:'8px',background:'#8b4513',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {flLoading?'Writing...':'Write Family Legacy 👨‍👩‍👧‍👦'}
        </button>
      </div>
      {flResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{flResult}</div>}
    </div>
  );
}

export function ForgeTab_analogymkr73() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [amConcept, setAmConcept] = React.useState('');
  const [amAudience, setAmAudience] = React.useState('');
  const [amDomain, setAmDomain] = React.useState('');
  const [amResult, setAmResult] = React.useState('');
  const [amLoading, setAmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💡 Analogy Maker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate powerful analogies that make complex concepts instantly click.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Concept to explain" value={amConcept} onChange={e=>setAmConcept(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target audience" value={amAudience} onChange={e=>setAmAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Preferred domain (sports, cooking, nature...)" value={amDomain} onChange={e=>setAmDomain(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!amConcept)return;setAmLoading(true);setAmResult('');try{const r=await fetch(`${''}/api/analogy/make`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({concept:amConcept,audience:amAudience,domain_preference:amDomain})});const d=await r.json();setAmResult(d.analogy||d.error);}catch(e:any){setAmResult(e.message);}setAmLoading(false);}} disabled={amLoading||!amConcept} style={{padding:'0.75rem',borderRadius:'8px',background:'#f39c12',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {amLoading?'Creating...':'Make Analogies 💡'}
        </button>
      </div>
      {amResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{amResult}</div>}
    </div>
  );
}

export function ForgeTab_mentmodel73() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mmProb, setMmProb] = React.useState('');
  const [mmCtx, setMmCtx] = React.useState('');
  const [mmGoal, setMmGoal] = React.useState('');
  const [mmResult, setMmResult] = React.useState('');
  const [mmLoading, setMmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧩 Mental Model Applier</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Apply powerful mental models to reveal new insights on any problem.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your problem or decision" value={mmProb} onChange={e=>setMmProb(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Context" value={mmCtx} onChange={e=>setMmCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Desired outcome" value={mmGoal} onChange={e=>setMmGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mmProb)return;setMmLoading(true);setMmResult('');try{const r=await fetch(`${''}/api/mentalmodel/apply`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({problem:mmProb,context:mmCtx,desired_outcome:mmGoal})});const d=await r.json();setMmResult(d.models||d.error);}catch(e:any){setMmResult(e.message);}setMmLoading(false);}} disabled={mmLoading||!mmProb} style={{padding:'0.75rem',borderRadius:'8px',background:'#9b59b6',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {mmLoading?'Applying...':'Apply Mental Models 🧩'}
        </button>
      </div>
      {mmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mmResult}</div>}
    </div>
  );
}

export function ForgeTab_speedread73() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [srContent, setSrContent] = React.useState('');
  const [srLen, setSrLen] = React.useState('');
  const [srFocus, setSrFocus] = React.useState('');
  const [srResult, setSrResult] = React.useState('');
  const [srLoading, setSrLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚡ Speed Reader</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Intelligent summaries optimized for learning retention.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Paste content to summarize" value={srContent} onChange={e=>setSrContent(e.target.value)} rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Summary length (concise / detailed)" value={srLen} onChange={e=>setSrLen(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Focus areas (key insights, actions...)" value={srFocus} onChange={e=>setSrFocus(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!srContent)return;setSrLoading(true);setSrResult('');try{const r=await fetch(`${''}/api/speedread/summarize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({content:srContent,summary_length:srLen,focus_areas:srFocus})});const d=await r.json();setSrResult(d.summary||d.error);}catch(e:any){setSrResult(e.message);}setSrLoading(false);}} disabled={srLoading||!srContent} style={{padding:'0.75rem',borderRadius:'8px',background:'#1abc9c',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {srLoading?'Summarizing...':'Speed Read ⚡'}
        </button>
      </div>
      {srResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{srResult}</div>}
    </div>
  );
}

export function ForgeTab_feynman73() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ftTopic, setFtTopic] = React.useState('');
  const [ftUnder, setFtUnder] = React.useState('');
  const [ftLevel, setFtLevel] = React.useState('');
  const [ftResult, setFtResult] = React.useState('');
  const [ftLoading, setFtLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎓 Feynman Teacher</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Learn anything by having it explained simply enough for a 12-year-old.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Topic to learn" value={ftTopic} onChange={e=>setFtTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your current understanding" value={ftUnder} onChange={e=>setFtUnder(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target understanding level" value={ftLevel} onChange={e=>setFtLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ftTopic)return;setFtLoading(true);setFtResult('');try{const r=await fetch(`${''}/api/feynman/teach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:ftTopic,current_understanding:ftUnder,target_level:ftLevel})});const d=await r.json();setFtResult(d.explanation||d.error);}catch(e:any){setFtResult(e.message);}setFtLoading(false);}} disabled={ftLoading||!ftTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#3498db',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ftLoading?'Teaching...':'Teach Me (Feynman) 🎓'}
        </button>
      </div>
      {ftResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ftResult}</div>}
    </div>
  );
}

export function ForgeTab_knowconn73() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [kcA, setKcA] = React.useState('');
  const [kcB, setKcB] = React.useState('');
  const [kcDomain, setKcDomain] = React.useState('');
  const [kcResult, setKcResult] = React.useState('');
  const [kcLoading, setKcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🕸️ Knowledge Connector</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Discover surprising connections between any two concepts.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Concept A" value={kcA} onChange={e=>setKcA(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Concept B" value={kcB} onChange={e=>setKcB(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Domain context (optional)" value={kcDomain} onChange={e=>setKcDomain(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!kcA||!kcB)return;setKcLoading(true);setKcResult('');try{const r=await fetch(`${''}/api/knowledge/connect`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({concept_a:kcA,concept_b:kcB,domain:kcDomain})});const d=await r.json();setKcResult(d.connections||d.error);}catch(e:any){setKcResult(e.message);}setKcLoading(false);}} disabled={kcLoading||!kcA||!kcB} style={{padding:'0.75rem',borderRadius:'8px',background:'#e67e22',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {kcLoading?'Connecting...':'Find Connections 🕸️'}
        </button>
      </div>
      {kcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{kcResult}</div>}
    </div>
  );
}

export function ForgeTab_pivotadv74() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [paModel, setPaModel] = React.useState('');
  const [paSignals, setPaSignals] = React.useState('');
  const [paResources, setPaResources] = React.useState('');
  const [paMarket, setPaMarket] = React.useState('');
  const [paResult, setPaResult] = React.useState('');
  const [paLoading, setPaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔄 Pivot Advisor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Data-driven advice on whether to pivot and how to execute it.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your current business model" value={paModel} onChange={e=>setPaModel(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Problem signals (slow growth, churn, etc.)" value={paSignals} onChange={e=>setPaSignals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Available resources (team, runway)" value={paResources} onChange={e=>setPaResources(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target market" value={paMarket} onChange={e=>setPaMarket(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!paModel)return;setPaLoading(true);setPaResult('');try{const r=await fetch(`${''}/api/pivot/advise`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_model:paModel,problem_signals:paSignals,resources:paResources,target_market:paMarket})});const d=await r.json();setPaResult(d.advice||d.error);}catch(e:any){setPaResult(e.message);}setPaLoading(false);}} disabled={paLoading||!paModel} style={{padding:'0.75rem',borderRadius:'8px',background:'#e74c3c',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {paLoading?'Analyzing...':'Get Pivot Advice 🔄'}
        </button>
      </div>
      {paResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{paResult}</div>}
    </div>
  );
}

export function ForgeTab_fundraise74() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [frStage, setFrStage] = React.useState('');
  const [frTraction, setFrTraction] = React.useState('');
  const [frAsk, setFrAsk] = React.useState('');
  const [frUse, setFrUse] = React.useState('');
  const [frIndustry, setFrIndustry] = React.useState('');
  const [frResult, setFrResult] = React.useState('');
  const [frLoading, setFrLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💸 Fundraising Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build your fundraising strategy and investor pitch framework.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Funding stage (pre-seed, seed, Series A)" value={frStage} onChange={e=>setFrStage(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current traction" value={frTraction} onChange={e=>setFrTraction(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Ask amount (e.g. $500K)" value={frAsk} onChange={e=>setFrAsk(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Use of funds" value={frUse} onChange={e=>setFrUse(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Industry" value={frIndustry} onChange={e=>setFrIndustry(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setFrLoading(true);setFrResult('');try{const r=await fetch(`${''}/api/fundraising/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({stage:frStage,traction:frTraction,ask_amount:frAsk,use_of_funds:frUse,industry:frIndustry})});const d=await r.json();setFrResult(d.strategy||d.error);}catch(e:any){setFrResult(e.message);}setFrLoading(false);}} disabled={frLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#27ae60',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {frLoading?'Building strategy...':'Build Fundraising Strategy 💸'}
        </button>
      </div>
      {frResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{frResult}</div>}
    </div>
  );
}

export function ForgeTab_uniteco74() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ueCAC, setUeCAC] = React.useState('');
  const [ueLTV, setUeLTV] = React.useState('');
  const [ueChurn, setUeChurn] = React.useState('');
  const [ueARPU, setUeARPU] = React.useState('');
  const [ueMargin, setUeMargin] = React.useState('');
  const [ueResult, setUeResult] = React.useState('');
  const [ueLoading, setUeLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📊 Unit Economics Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Assess business health and find levers to improve unit economics.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="CAC (Customer Acquisition Cost)" value={ueCAC} onChange={e=>setUeCAC(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="LTV (Lifetime Value)" value={ueLTV} onChange={e=>setUeLTV(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Monthly churn rate (%)" value={ueChurn} onChange={e=>setUeChurn(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="ARPU (Average Revenue Per User)" value={ueARPU} onChange={e=>setUeARPU(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Gross margin (%)" value={ueMargin} onChange={e=>setUeMargin(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setUeLoading(true);setUeResult('');try{const r=await fetch(`${''}/api/uniteconomics/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({cac:ueCAC,ltv:ueLTV,churn_rate:ueChurn,arpu:ueARPU,gross_margin:ueMargin})});const d=await r.json();setUeResult(d.analysis||d.error);}catch(e:any){setUeResult(e.message);}setUeLoading(false);}} disabled={ueLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#2980b9',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ueLoading?'Analyzing...':'Analyze Unit Economics 📊'}
        </button>
      </div>
      {ueResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ueResult}</div>}
    </div>
  );
}

export function ForgeTab_pmfcheck74() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pmProduct, setPmProduct] = React.useState('');
  const [pmFeedback, setPmFeedback] = React.useState('');
  const [pmRetention, setPmRetention] = React.useState('');
  const [pmNPS, setPmNPS] = React.useState('');
  const [pmResult, setPmResult] = React.useState('');
  const [pmLoading, setPmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎯 PMF Checker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Assess your product-market fit and get a roadmap to improve it.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your product" value={pmProduct} onChange={e=>setPmProduct(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="User feedback themes" value={pmFeedback} onChange={e=>setPmFeedback(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Retention rate (e.g. 40% D30)" value={pmRetention} onChange={e=>setPmRetention(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="NPS score" value={pmNPS} onChange={e=>setPmNPS(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!pmProduct)return;setPmLoading(true);setPmResult('');try{const r=await fetch(`${''}/api/pmf/check`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:pmProduct,user_feedback:pmFeedback,retention:pmRetention,nps:pmNPS})});const d=await r.json();setPmResult(d.assessment||d.error);}catch(e:any){setPmResult(e.message);}setPmLoading(false);}} disabled={pmLoading||!pmProduct} style={{padding:'0.75rem',borderRadius:'8px',background:'#8e44ad',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {pmLoading?'Checking...':'Check PMF 🎯'}
        </button>
      </div>
      {pmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pmResult}</div>}
    </div>
  );
}

export function ForgeTab_startuplegal74() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [slStage, setSlStage] = React.useState('');
  const [slSit, setSlSit] = React.useState('');
  const [slJuris, setSlJuris] = React.useState('');
  const [slQ, setSlQ] = React.useState('');
  const [slResult, setSlResult] = React.useState('');
  const [slLoading, setSlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚖️ Startup Legal Guide</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Educational legal guidance for founders (not legal advice — consult a lawyer).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Startup stage (idea, incorporated, funded...)" value={slStage} onChange={e=>setSlStage(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Describe your situation" value={slSit} onChange={e=>setSlSit(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Jurisdiction (US, UK, EU...)" value={slJuris} onChange={e=>setSlJuris(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Specific question" value={slQ} onChange={e=>setSlQ(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!slSit)return;setSlLoading(true);setSlResult('');try{const r=await fetch(`${''}/api/startuplegal/guide`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({stage:slStage,situation:slSit,jurisdiction:slJuris,specific_question:slQ})});const d=await r.json();setSlResult(d.guidance||d.error);}catch(e:any){setSlResult(e.message);}setSlLoading(false);}} disabled={slLoading||!slSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#34495e',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {slLoading?'Researching...':'Get Legal Guidance ⚖️'}
        </button>
      </div>
      {slResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{slResult}</div>}
    </div>
  );
}

export function ForgeTab_hormoneopt75() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [hoSymp, setHoSymp] = React.useState('');
  const [hoAge, setHoAge] = React.useState('');
  const [hoGender, setHoGender] = React.useState('');
  const [hoGoals, setHoGoals] = React.useState('');
  const [hoResult, setHoResult] = React.useState('');
  const [hoLoading, setHoLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧬 Hormone Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Evidence-based hormone health education (not medical advice — consult your doctor).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Symptoms (fatigue, mood issues, sleep problems...)" value={hoSymp} onChange={e=>setHoSymp(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Age" value={hoAge} onChange={e=>setHoAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Gender (optional)" value={hoGender} onChange={e=>setHoGender(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Health goals" value={hoGoals} onChange={e=>setHoGoals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!hoSymp)return;setHoLoading(true);setHoResult('');try{const r=await fetch(`${''}/api/hormone/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({symptoms:hoSymp,age:hoAge,gender:hoGender,goals:hoGoals})});const d=await r.json();setHoResult(d.plan||d.error);}catch(e:any){setHoResult(e.message);}setHoLoading(false);}} disabled={hoLoading||!hoSymp} style={{padding:'0.75rem',borderRadius:'8px',background:'#6c3483',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {hoLoading?'Analyzing...':'Get Hormone Education 🧬'}
        </button>
      </div>
      {hoResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{hoResult}</div>}
    </div>
  );
}

export function ForgeTab_guthealth75() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ghIssues, setGhIssues] = React.useState('');
  const [ghDiet, setGhDiet] = React.useState('');
  const [ghMeds, setGhMeds] = React.useState('');
  const [ghStress, setGhStress] = React.useState('');
  const [ghResult, setGhResult] = React.useState('');
  const [ghLoading, setGhLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🦠 Gut Health Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Evidence-based gut wellness protocol (educational only — see a doctor for diagnosis).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Gut issues (bloating, IBS, reflux...)" value={ghIssues} onChange={e=>setGhIssues(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current diet" value={ghDiet} onChange={e=>setGhDiet(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Medications or supplements" value={ghMeds} onChange={e=>setGhMeds(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Stress level (low/medium/high)" value={ghStress} onChange={e=>setGhStress(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ghIssues)return;setGhLoading(true);setGhResult('');try{const r=await fetch(`${''}/api/guthealth/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({issues:ghIssues,diet:ghDiet,medications:ghMeds,stress_level:ghStress})});const d=await r.json();setGhResult(d.protocol||d.error);}catch(e:any){setGhResult(e.message);}setGhLoading(false);}} disabled={ghLoading||!ghIssues} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ghLoading?'Building protocol...':'Get Gut Health Protocol 🦠'}
        </button>
      </div>
      {ghResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ghResult}</div>}
    </div>
  );
}

export function ForgeTab_inflame75() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ifSymp, setIfSymp] = React.useState('');
  const [ifDiet, setIfDiet] = React.useState('');
  const [ifLife, setIfLife] = React.useState('');
  const [ifTriggers, setIfTriggers] = React.useState('');
  const [ifResult, setIfResult] = React.useState('');
  const [ifLoading, setIfLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔥 Inflammation Reducer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>30-day anti-inflammation protocol based on research (not medical advice).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Inflammation symptoms (joint pain, fatigue, brain fog...)" value={ifSymp} onChange={e=>setIfSymp(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current diet" value={ifDiet} onChange={e=>setIfDiet(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Lifestyle (sedentary, active, sleep hours...)" value={ifLife} onChange={e=>setIfLife(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Known triggers (optional)" value={ifTriggers} onChange={e=>setIfTriggers(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ifSymp)return;setIfLoading(true);setIfResult('');try{const r=await fetch(`${''}/api/inflammation/reduce`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({symptoms:ifSymp,diet:ifDiet,lifestyle:ifLife,known_triggers:ifTriggers})});const d=await r.json();setIfResult(d.protocol||d.error);}catch(e:any){setIfResult(e.message);}setIfLoading(false);}} disabled={ifLoading||!ifSymp} style={{padding:'0.75rem',borderRadius:'8px',background:'#c0392b',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ifLoading?'Building protocol...':'Get Anti-Inflammation Protocol 🔥'}
        </button>
      </div>
      {ifResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ifResult}</div>}
    </div>
  );
}

export function ForgeTab_energyopt75() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [eoPattern, setEoPattern] = React.useState('');
  const [eoSleep, setEoSleep] = React.useState('');
  const [eoDiet, setEoDiet] = React.useState('');
  const [eoStress, setEoStress] = React.useState('');
  const [eoResult, setEoResult] = React.useState('');
  const [eoLoading, setEoLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚡ Energy Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a personalized energy optimization strategy for all-day high performance.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Energy patterns (when you crash, peak times...)" value={eoPattern} onChange={e=>setEoPattern(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Sleep quality (hours, quality 1-10)" value={eoSleep} onChange={e=>setEoSleep(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Diet style" value={eoDiet} onChange={e=>setEoDiet(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Stress level and sources" value={eoStress} onChange={e=>setEoStress(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setEoLoading(true);setEoResult('');try{const r=await fetch(`${''}/api/energy/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({energy_patterns:eoPattern,sleep_quality:eoSleep,diet:eoDiet,stress:eoStress})});const d=await r.json();setEoResult(d.strategy||d.error);}catch(e:any){setEoResult(e.message);}setEoLoading(false);}} disabled={eoLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#d4ac0d',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {eoLoading?'Optimizing...':'Optimize My Energy ⚡'}
        </button>
      </div>
      {eoResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{eoResult}</div>}
    </div>
  );
}

export function ForgeTab_prevhealth75() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [phAge, setPhAge] = React.useState('');
  const [phGender, setPhGender] = React.useState('');
  const [phFamily, setPhFamily] = React.useState('');
  const [phHealth, setPhHealth] = React.useState('');
  const [phResult, setPhResult] = React.useState('');
  const [phLoading, setPhLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🏥 Preventive Health Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Personalized prevention roadmap and wellness calendar (work with your doctor).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Age" value={phAge} onChange={e=>setPhAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Gender" value={phGender} onChange={e=>setPhGender(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Family history (heart disease, cancer, diabetes...)" value={phFamily} onChange={e=>setPhFamily(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current health status" value={phHealth} onChange={e=>setPhHealth(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!phAge)return;setPhLoading(true);setPhResult('');try{const r=await fetch(`${''}/api/preventivehealth/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({age:phAge,gender:phGender,family_history:phFamily,current_health:phHealth})});const d=await r.json();setPhResult(d.plan||d.error);}catch(e:any){setPhResult(e.message);}setPhLoading(false);}} disabled={phLoading||!phAge} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {phLoading?'Planning...':'Build My Prevention Plan 🏥'}
        </button>
      </div>
      {phResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{phResult}</div>}
    </div>
  );
}

export function ForgeTab_ytscript76() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ysTopic, setYsTopic] = React.useState('');
  const [ysAud, setYsAud] = React.useState('');
  const [ysLen, setYsLen] = React.useState('');
  const [ysStyle, setYsStyle] = React.useState('');
  const [ysResult, setYsResult] = React.useState('');
  const [ysLoading, setYsLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎬 YouTube Script Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Full production-ready YouTube scripts with hooks, segments, and CTAs.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Video topic" value={ysTopic} onChange={e=>setYsTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target audience" value={ysAud} onChange={e=>setYsAud(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Video length (e.g. 8-10 minutes)" value={ysLen} onChange={e=>setYsLen(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Style (educational, entertaining, personal...)" value={ysStyle} onChange={e=>setYsStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ysTopic)return;setYsLoading(true);setYsResult('');try{const r=await fetch(`${''}/api/youtube/script`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:ysTopic,target_audience:ysAud,video_length:ysLen,style:ysStyle})});const d=await r.json();setYsResult(d.script||d.error);}catch(e:any){setYsResult(e.message);}setYsLoading(false);}} disabled={ysLoading||!ysTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#c0392b',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ysLoading?'Writing script...':'Write YouTube Script 🎬'}
        </button>
      </div>
      {ysResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ysResult}</div>}
    </div>
  );
}

export function ForgeTab_tiktokhook76() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ttIdea, setTtIdea] = React.useState('');
  const [ttNiche, setTtNiche] = React.useState('');
  const [ttEmotion, setTtEmotion] = React.useState('');
  const [ttResult, setTtResult] = React.useState('');
  const [ttLoading, setTtLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎵 TikTok Hook Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>10 scroll-stopping opening lines for viral TikTok content.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Content idea or topic" value={ttIdea} onChange={e=>setTtIdea(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Niche (fitness, finance, comedy...)" value={ttNiche} onChange={e=>setTtNiche(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target emotion (curiosity, shock, relatability...)" value={ttEmotion} onChange={e=>setTtEmotion(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ttIdea)return;setTtLoading(true);setTtResult('');try{const r=await fetch(`${''}/api/tiktok/hooks`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({content_idea:ttIdea,niche:ttNiche,target_emotion:ttEmotion})});const d=await r.json();setTtResult(d.hooks||d.error);}catch(e:any){setTtResult(e.message);}setTtLoading(false);}} disabled={ttLoading||!ttIdea} style={{padding:'0.75rem',borderRadius:'8px',background:'#000',color:'#fff',fontWeight:'600',border:'1px solid #333',cursor:'pointer'}}>
          {ttLoading?'Generating...':'Generate 10 TikTok Hooks 🎵'}
        </button>
      </div>
      {ttResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ttResult}</div>}
    </div>
  );
}

export function ForgeTab_podplan76() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ppTopic, setPpTopic] = React.useState('');
  const [ppGuest, setPpGuest] = React.useState('');
  const [ppType, setPpType] = React.useState('');
  const [ppLen, setPpLen] = React.useState('');
  const [ppResult, setPpResult] = React.useState('');
  const [ppLoading, setPpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎙️ Podcast Episode Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Complete episode plans with questions, segments, and show notes.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Episode topic" value={ppTopic} onChange={e=>setPpTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Guest name and background (or 'solo episode')" value={ppGuest} onChange={e=>setPpGuest(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Show type (interview, storytelling, educational...)" value={ppType} onChange={e=>setPpType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target length (e.g. 45-60 min)" value={ppLen} onChange={e=>setPpLen(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ppTopic)return;setPpLoading(true);setPpResult('');try{const r=await fetch(`${''}/api/podcast/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:ppTopic,guest_name:ppGuest,show_type:ppType,target_length:ppLen})});const d=await r.json();setPpResult(d.plan||d.error);}catch(e:any){setPpResult(e.message);}setPpLoading(false);}} disabled={ppLoading||!ppTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#8e44ad',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ppLoading?'Planning...':'Plan Podcast Episode 🎙️'}
        </button>
      </div>
      {ppResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ppResult}</div>}
    </div>
  );
}

export function ForgeTab_thumbconcept76() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tcTopic, setTcTopic] = React.useState('');
  const [tcStyle, setTcStyle] = React.useState('');
  const [tcEmotion, setTcEmotion] = React.useState('');
  const [tcResult, setTcResult] = React.useState('');
  const [tcLoading, setTcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🖼️ Thumbnail Concept Maker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>5 high-CTR thumbnail concepts with composition, text, and color guidance.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Video topic" value={tcTopic} onChange={e=>setTcTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Channel style (professional, casual, dramatic...)" value={tcStyle} onChange={e=>setTcStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target emotion (curiosity, shock, FOMO...)" value={tcEmotion} onChange={e=>setTcEmotion(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!tcTopic)return;setTcLoading(true);setTcResult('');try{const r=await fetch(`${''}/api/thumbnail/concept`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({video_topic:tcTopic,channel_style:tcStyle,target_emotion:tcEmotion})});const d=await r.json();setTcResult(d.concepts||d.error);}catch(e:any){setTcResult(e.message);}setTcLoading(false);}} disabled={tcLoading||!tcTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#e67e22',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {tcLoading?'Creating...':'Generate Thumbnail Concepts 🖼️'}
        </button>
      </div>
      {tcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{tcResult}</div>}
    </div>
  );
}

export function ForgeTab_repurpose76() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [rpContent, setRpContent] = React.useState('');
  const [rpFormat, setRpFormat] = React.useState('');
  const [rpPlatforms, setRpPlatforms] = React.useState('');
  const [rpResult, setRpResult] = React.useState('');
  const [rpLoading, setRpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>♻️ Content Repurposer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Transform one piece of content into platform-native posts for every channel.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Paste your original content" value={rpContent} onChange={e=>setRpContent(e.target.value)} rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Original format (blog, video, podcast, tweet...)" value={rpFormat} onChange={e=>setRpFormat(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target platforms (Twitter, LinkedIn, Instagram, TikTok...)" value={rpPlatforms} onChange={e=>setRpPlatforms(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!rpContent)return;setRpLoading(true);setRpResult('');try{const r=await fetch(`${''}/api/content/repurpose`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({original_content:rpContent,original_format:rpFormat,target_platforms:rpPlatforms})});const d=await r.json();setRpResult(d.repurposed||d.error);}catch(e:any){setRpResult(e.message);}setRpLoading(false);}} disabled={rpLoading||!rpContent} style={{padding:'0.75rem',borderRadius:'8px',background:'#27ae60',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {rpLoading?'Repurposing...':'Repurpose Content ♻️'}
        </button>
      </div>
      {rpResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{rpResult}</div>}
    </div>
  );
}

export function ForgeTab_perfreview77() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [prAch, setPrAch] = React.useState('');
  const [prRole, setPrRole] = React.useState('');
  const [prPeriod, setPrPeriod] = React.useState('');
  const [prResult, setPrResult] = React.useState('');
  const [prLoading, setPrLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📋 Performance Review Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a compelling self-review that positions you for promotion.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="List your key achievements (bullet points work)" value={prAch} onChange={e=>setPrAch(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your role/title" value={prRole} onChange={e=>setPrRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Review period (e.g. Q4 2025 / Full Year 2025)" value={prPeriod} onChange={e=>setPrPeriod(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!prAch)return;setPrLoading(true);setPrResult('');try{const r=await fetch(`${''}/api/perfreview/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({achievements:prAch,role:prRole,time_period:prPeriod})});const d=await r.json();setPrResult(d.review||d.error);}catch(e:any){setPrResult(e.message);}setPrLoading(false);}} disabled={prLoading||!prAch} style={{padding:'0.75rem',borderRadius:'8px',background:'#2980b9',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {prLoading?'Writing...':'Write My Performance Review 📋'}
        </button>
      </div>
      {prResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{prResult}</div>}
    </div>
  );
}

export function ForgeTab_linkedincont77() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lcTopic, setLcTopic] = React.useState('');
  const [lcAngle, setLcAngle] = React.useState('');
  const [lcStory, setLcStory] = React.useState('');
  const [lcCTA, setLcCTA] = React.useState('');
  const [lcResult, setLcResult] = React.useState('');
  const [lcLoading, setLcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💼 LinkedIn Content Creator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>High-engagement LinkedIn posts that build your professional brand.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Post topic or insight" value={lcTopic} onChange={e=>setLcTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Angle (thought leadership, lessons learned, story...)" value={lcAngle} onChange={e=>setLcAngle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Personal story to include (optional)" value={lcStory} onChange={e=>setLcStory(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Call to action" value={lcCTA} onChange={e=>setLcCTA(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!lcTopic)return;setLcLoading(true);setLcResult('');try{const r=await fetch(`${''}/api/linkedin/content`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:lcTopic,angle:lcAngle,personal_story:lcStory,call_to_action:lcCTA})});const d=await r.json();setLcResult(d.post||d.error);}catch(e:any){setLcResult(e.message);}setLcLoading(false);}} disabled={lcLoading||!lcTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#0077b5',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {lcLoading?'Creating...':'Create LinkedIn Post 💼'}
        </button>
      </div>
      {lcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{lcResult}</div>}
    </div>
  );
}

export function ForgeTab_careergap77() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cgDur, setCgDur] = React.useState('');
  const [cgReason, setCgReason] = React.useState('');
  const [cgDid, setCgDid] = React.useState('');
  const [cgRole, setCgRole] = React.useState('');
  const [cgResult, setCgResult] = React.useState('');
  const [cgLoading, setCgLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⏸️ Career Gap Explainer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn your career gap into a confident, compelling interview answer.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Gap duration (e.g. 8 months in 2023)" value={cgDur} onChange={e=>setCgDur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Real reason for gap" value={cgReason} onChange={e=>setCgReason(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="What you did during the gap" value={cgDid} onChange={e=>setCgDid(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target role you\'re applying to" value={cgRole} onChange={e=>setCgRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!cgReason)return;setCgLoading(true);setCgResult('');try{const r=await fetch(`${''}/api/careergap/explain`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({gap_duration:cgDur,gap_reason:cgReason,what_you_did:cgDid,target_role:cgRole})});const d=await r.json();setCgResult(d.explanation||d.error);}catch(e:any){setCgResult(e.message);}setCgLoading(false);}} disabled={cgLoading||!cgReason} style={{padding:'0.75rem',borderRadius:'8px',background:'#7f8c8d',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {cgLoading?'Writing...':'Get My Gap Explanation ⏸️'}
        </button>
      </div>
      {cgResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{cgResult}</div>}
    </div>
  );
}

export function ForgeTab_execpres77() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [epSit, setEpSit] = React.useState('');
  const [epBeh, setEpBeh] = React.useState('');
  const [epTarget, setEpTarget] = React.useState('');
  const [epResult, setEpResult] = React.useState('');
  const [epLoading, setEpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>👔 Executive Presence Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build the gravitas and command of a senior leader.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Situation (board meeting, all-hands, managing up...)" value={epSit} onChange={e=>setEpSit(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your current behavior in this context" value={epBeh} onChange={e=>setEpBeh(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target level (director, VP, C-suite...)" value={epTarget} onChange={e=>setEpTarget(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!epSit)return;setEpLoading(true);setEpResult('');try{const r=await fetch(`${''}/api/execpresence/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:epSit,current_behavior:epBeh,target_level:epTarget})});const d=await r.json();setEpResult(d.coaching||d.error);}catch(e:any){setEpResult(e.message);}setEpLoading(false);}} disabled={epLoading||!epSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a1a2e',color:'#fff',fontWeight:'600',border:'1px solid #444',cursor:'pointer'}}>
          {epLoading?'Coaching...':'Build Executive Presence 👔'}
        </button>
      </div>
      {epResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{epResult}</div>}
    </div>
  );
}

export function ForgeTab_workbound77() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wbSit, setWbSit] = React.useState('');
  const [wbBoundary, setWbBoundary] = React.useState('');
  const [wbRel, setWbRel] = React.useState('');
  const [wbStyle, setWbStyle] = React.useState('');
  const [wbResult, setWbResult] = React.useState('');
  const [wbLoading, setWbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🛡️ Workplace Boundary Setter</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Professional scripts to set and maintain workplace boundaries.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the situation requiring a boundary" value={wbSit} onChange={e=>setWbSit(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Specific boundary needed" value={wbBoundary} onChange={e=>setWbBoundary(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Relationship (manager, peer, report, client...)" value={wbRel} onChange={e=>setWbRel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Communication style preference" value={wbStyle} onChange={e=>setWbStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!wbSit||!wbBoundary)return;setWbLoading(true);setWbResult('');try{const r=await fetch(`${''}/api/workboundary/set`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:wbSit,boundary_needed:wbBoundary,relationship_type:wbRel,communication_style:wbStyle})});const d=await r.json();setWbResult(d.scripts||d.error);}catch(e:any){setWbResult(e.message);}setWbLoading(false);}} disabled={wbLoading||!wbSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#16a085',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {wbLoading?'Writing scripts...':'Get Boundary Scripts 🛡️'}
        </button>
      </div>
      {wbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{wbResult}</div>}
    </div>
  );
}

export function ForgeTab_emergfund78() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [efExp, setEfExp] = React.useState('');
  const [efSav, setEfSav] = React.useState('');
  const [efInc, setEfInc] = React.useState('');
  const [efStab, setEfStab] = React.useState('');
  const [efResult, setEfResult] = React.useState('');
  const [efLoading, setEfLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🏦 Emergency Fund Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate your target and build a month-by-month savings plan.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Monthly expenses (e.g. $3,500)" value={efExp} onChange={e=>setEfExp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current savings" value={efSav} onChange={e=>setEfSav(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Monthly income" value={efInc} onChange={e=>setEfInc(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Job stability (stable/moderate/volatile)" value={efStab} onChange={e=>setEfStab(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!efExp)return;setEfLoading(true);setEfResult('');try{const r=await fetch(`${''}/api/emergencyfund/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({monthly_expenses:efExp,current_savings:efSav,income:efInc,job_stability:efStab})});const d=await r.json();setEfResult(d.plan||d.error);}catch(e:any){setEfResult(e.message);}setEfLoading(false);}} disabled={efLoading||!efExp} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {efLoading?'Planning...':'Build My Emergency Fund Plan 🏦'}
        </button>
      </div>
      {efResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{efResult}</div>}
    </div>
  );
}

export function ForgeTab_insaudit78() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [iaStage, setIaStage] = React.useState('');
  const [iaCoverage, setIaCoverage] = React.useState('');
  const [iaDeps, setIaDeps] = React.useState('');
  const [iaResult, setIaResult] = React.useState('');
  const [iaLoading, setIaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📄 Insurance Auditor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Find coverage gaps and optimize your insurance portfolio (not professional advice).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Life stage (single, married, parent, retiree...)" value={iaStage} onChange={e=>setIaStage(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Current insurance coverage" value={iaCoverage} onChange={e=>setIaCoverage(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Dependents (none, 2 kids, aging parents...)" value={iaDeps} onChange={e=>setIaDeps(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setIaLoading(true);setIaResult('');try{const r=await fetch(`${''}/api/insurance/audit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({life_stage:iaStage,current_coverage:iaCoverage,dependents:iaDeps})});const d=await r.json();setIaResult(d.audit||d.error);}catch(e:any){setIaResult(e.message);}setIaLoading(false);}} disabled={iaLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#2980b9',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {iaLoading?'Auditing...':'Audit My Insurance 📄'}
        </button>
      </div>
      {iaResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{iaResult}</div>}
    </div>
  );
}

export function ForgeTab_moneymind78() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mmBeliefs, setMmBeliefs] = React.useState('');
  const [mmStory, setMmStory] = React.useState('');
  const [mmBehaviors, setMmBehaviors] = React.useState('');
  const [mmGoals, setMmGoals] = React.useState('');
  const [mmResult, setMmResult] = React.useState('');
  const [mmLoading, setMmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧠 Money Mindset Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Identify and reframe limiting money beliefs to unlock financial potential.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Your money beliefs (rich people are greedy, money is hard, I\'m bad with money...)" value={mmBeliefs} onChange={e=>setMmBeliefs(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Money story from childhood (optional)" value={mmStory} onChange={e=>setMmStory(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current financial behaviors to change" value={mmBehaviors} onChange={e=>setMmBehaviors(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Financial goals" value={mmGoals} onChange={e=>setMmGoals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mmBeliefs)return;setMmLoading(true);setMmResult('');try{const r=await fetch(`${''}/api/moneymindset/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({money_beliefs:mmBeliefs,childhood_money_story:mmStory,current_behaviors:mmBehaviors,goals:mmGoals})});const d=await r.json();setMmResult(d.coaching||d.error);}catch(e:any){setMmResult(e.message);}setMmLoading(false);}} disabled={mmLoading||!mmBeliefs} style={{padding:'0.75rem',borderRadius:'8px',background:'#8e44ad',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {mmLoading?'Coaching...':'Shift My Money Mindset 🧠'}
        </button>
      </div>
      {mmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mmResult}</div>}
    </div>
  );
}

export function ForgeTab_fireplan78() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fpAge, setFpAge] = React.useState('');
  const [fpInc, setFpInc] = React.useState('');
  const [fpExp, setFpExp] = React.useState('');
  const [fpNW, setFpNW] = React.useState('');
  const [fpResult, setFpResult] = React.useState('');
  const [fpLoading, setFpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔥 FI/FIRE Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate your path to Financial Independence (educational, not financial advice).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Current age" value={fpAge} onChange={e=>setFpAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Annual income" value={fpInc} onChange={e=>setFpInc(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Annual expenses" value={fpExp} onChange={e=>setFpExp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current net worth / investable assets" value={fpNW} onChange={e=>setFpNW(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!fpAge||!fpInc)return;setFpLoading(true);setFpResult('');try{const r=await fetch(`${''}/api/fi/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({age:fpAge,income:fpInc,expenses:fpExp,net_worth:fpNW})});const d=await r.json();setFpResult(d.plan||d.error);}catch(e:any){setFpResult(e.message);}setFpLoading(false);}} disabled={fpLoading||!fpAge} style={{padding:'0.75rem',borderRadius:'8px',background:'#e74c3c',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {fpLoading?'Calculating...':'Calculate My FIRE Path 🔥'}
        </button>
      </div>
      {fpResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{fpResult}</div>}
    </div>
  );
}

export function ForgeTab_taxloss78() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tlPort, setTlPort] = React.useState('');
  const [tlLoss, setTlLoss] = React.useState('');
  const [tlBracket, setTlBracket] = React.useState('');
  const [tlResult, setTlResult] = React.useState('');
  const [tlLoading, setTlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📉 Tax-Loss Harvester</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Learn tax-loss harvesting strategy to offset gains (consult a CPA).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Portfolio type (ETFs, individual stocks, mix...)" value={tlPort} onChange={e=>setTlPort(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Estimated unrealized losses" value={tlLoss} onChange={e=>setTlLoss(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Tax bracket (e.g. 24%, 32%)" value={tlBracket} onChange={e=>setTlBracket(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setTlLoading(true);setTlResult('');try{const r=await fetch(`${''}/api/taxloss/harvest`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({portfolio_description:tlPort,unrealized_losses:tlLoss,tax_bracket:tlBracket})});const d=await r.json();setTlResult(d.strategy||d.error);}catch(e:any){setTlResult(e.message);}setTlLoading(false);}} disabled={tlLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#2c3e50',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {tlLoading?'Analyzing...':'Learn Tax-Loss Harvesting 📉'}
        </button>
      </div>
      {tlResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{tlResult}</div>}
    </div>
  );
}

export function ForgeTab_storyout79() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [soGenre, setSoGenre] = React.useState('');
  const [soPremise, setSoPremise] = React.useState('');
  const [soLength, setSoLength] = React.useState('');
  const [soResult, setSoResult] = React.useState('');
  const [soLoading, setSoLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📖 Story Outliner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Transform your idea into a full 3-act story structure with scenes and character arcs.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Genre (thriller, fantasy, romance, sci-fi...)" value={soGenre} onChange={e=>setSoGenre(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Your story premise or idea" value={soPremise} onChange={e=>setSoPremise(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Length (short story, novella, novel)" value={soLength} onChange={e=>setSoLength(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!soPremise)return;setSoLoading(true);setSoResult('');try{const r=await fetch(`${''}/api/story/outline`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({genre:soGenre,premise:soPremise,length:soLength})});const d=await r.json();setSoResult(d.outline||d.error);}catch(e:any){setSoResult(e.message);}setSoLoading(false);}} disabled={soLoading||!soPremise} style={{padding:'0.75rem',borderRadius:'8px',background:'#6c3483',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {soLoading?'Outlining...':'Generate Story Outline 📖'}
        </button>
      </div>
      {soResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{soResult}</div>}
    </div>
  );
}

export function ForgeTab_charcreate79() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ccRole, setCcRole] = React.useState('');
  const [ccGenre, setCcGenre] = React.useState('');
  const [ccTraits, setCcTraits] = React.useState('');
  const [ccBack, setCcBack] = React.useState('');
  const [ccResult, setCcResult] = React.useState('');
  const [ccLoading, setCcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎭 Character Creator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build vivid, three-dimensional characters with full profiles and arcs.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Character role (protagonist, villain, mentor...)" value={ccRole} onChange={e=>setCcRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Genre / story world" value={ccGenre} onChange={e=>setCcGenre(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Desired personality traits (optional)" value={ccTraits} onChange={e=>setCcTraits(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Backstory hints (optional)" value={ccBack} onChange={e=>setCcBack(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ccRole)return;setCcLoading(true);setCcResult('');try{const r=await fetch(`${''}/api/character/create`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({role:ccRole,genre:ccGenre,traits:ccTraits,backstory_hints:ccBack})});const d=await r.json();setCcResult(d.profile||d.error);}catch(e:any){setCcResult(e.message);}setCcLoading(false);}} disabled={ccLoading||!ccRole} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ccLoading?'Creating...':'Create Character 🎭'}
        </button>
      </div>
      {ccResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ccResult}</div>}
    </div>
  );
}

export function ForgeTab_dialogue79() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dlChars, setDlChars] = React.useState('');
  const [dlScene, setDlScene] = React.useState('');
  const [dlTone, setDlTone] = React.useState('');
  const [dlSub, setDlSub] = React.useState('');
  const [dlResult, setDlResult] = React.useState('');
  const [dlLoading, setDlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💬 Dialogue Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write tight, purposeful dialogue that reveals character and drives plot.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Characters involved (e.g. detective + suspect)" value={dlChars} onChange={e=>setDlChars(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Scene description" value={dlScene} onChange={e=>setDlScene(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Tone (tense, playful, romantic, confrontational...)" value={dlTone} onChange={e=>setDlTone(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Subtext / what each character really wants" value={dlSub} onChange={e=>setDlSub(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!dlChars||!dlScene)return;setDlLoading(true);setDlResult('');try{const r=await fetch(`${''}/api/dialogue/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({characters:dlChars,scene:dlScene,tone:dlTone,subtext:dlSub})});const d=await r.json();setDlResult(d.dialogue||d.error);}catch(e:any){setDlResult(e.message);}setDlLoading(false);}} disabled={dlLoading||!dlChars} style={{padding:'0.75rem',borderRadius:'8px',background:'#117a65',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {dlLoading?'Writing...':'Write Dialogue 💬'}
        </button>
      </div>
      {dlResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{dlResult}</div>}
    </div>
  );
}

export function ForgeTab_plottwist79() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ptStory, setPtStory] = React.useState('');
  const [ptGenre, setPtGenre] = React.useState('');
  const [ptMood, setPtMood] = React.useState('');
  const [ptResult, setPtResult] = React.useState('');
  const [ptLoading, setPtLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌀 Plot Twist Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 5 shocking, well-seeded plot twists for your story.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Your story so far..." value={ptStory} onChange={e=>setPtStory(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Genre (thriller, mystery, fantasy...)" value={ptGenre} onChange={e=>setPtGenre(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Mood (dark, hopeful, humorous...)" value={ptMood} onChange={e=>setPtMood(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ptStory)return;setPtLoading(true);setPtResult('');try{const r=await fetch(`${''}/api/plottwist/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({story_so_far:ptStory,genre:ptGenre,mood:ptMood})});const d=await r.json();setPtResult(d.twist||d.error);}catch(e:any){setPtResult(e.message);}setPtLoading(false);}} disabled={ptLoading||!ptStory} style={{padding:'0.75rem',borderRadius:'8px',background:'#922b21',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ptLoading?'Generating...':'Generate Plot Twists 🌀'}
        </button>
      </div>
      {ptResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ptResult}</div>}
    </div>
  );
}

export function ForgeTab_worldbuild79() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wbGenre, setWbGenre] = React.useState('');
  const [wbSeed, setWbSeed] = React.useState('');
  const [wbTone, setWbTone] = React.useState('');
  const [wbResult, setWbResult] = React.useState('');
  const [wbLoading, setWbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌍 World Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a richly detailed fictional world with geography, politics, culture, and lore.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Genre (epic fantasy, sci-fi, steampunk, dystopia...)" value={wbGenre} onChange={e=>setWbGenre(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Setting seed (one-line description of your world idea)" value={wbSeed} onChange={e=>setWbSeed(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Tone (gritty, whimsical, epic, dark, hopeful...)" value={wbTone} onChange={e=>setWbTone(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!wbGenre||!wbSeed)return;setWbLoading(true);setWbResult('');try{const r=await fetch(`${''}/api/world/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({genre:wbGenre,setting_seed:wbSeed,tone:wbTone})});const d=await r.json();setWbResult(d.world||d.error);}catch(e:any){setWbResult(e.message);}setWbLoading(false);}} disabled={wbLoading||!wbGenre} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {wbLoading?'Building...':'Build My World 🌍'}
        </button>
      </div>
      {wbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{wbResult}</div>}
    </div>
  );
}

export function ForgeTab_focuscoach80() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fcGoal, setFcGoal] = React.useState('');
  const [fcBlock, setFcBlock] = React.useState('');
  const [fcStyle, setFcStyle] = React.useState('');
  const [fcResult, setFcResult] = React.useState('');
  const [fcLoading, setFcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎯 Focus Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a personalized deep work system that eliminates distraction and maximizes output.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Your focus goal (e.g. write 2000 words daily)" value={fcGoal} onChange={e=>setFcGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Main blockers (phone, noise, social media...)" value={fcBlock} onChange={e=>setFcBlock(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Work style (solo/open office, morning/night person...)" value={fcStyle} onChange={e=>setFcStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!fcGoal)return;setFcLoading(true);setFcResult('');try{const r=await fetch(`${''}/api/focus/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goal:fcGoal,blockers:fcBlock,work_style:fcStyle})});const d=await r.json();setFcResult(d.plan||d.error);}catch(e:any){setFcResult(e.message);}setFcLoading(false);}} disabled={fcLoading||!fcGoal} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {fcLoading?'Coaching...':'Build My Focus Plan 🎯'}
        </button>
      </div>
      {fcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{fcResult}</div>}
    </div>
  );
}

export function ForgeTab_memtrain80() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mtTopic, setMtTopic] = React.useState('');
  const [mtContent, setMtContent] = React.useState('');
  const [mtGoal, setMtGoal] = React.useState('');
  const [mtResult, setMtResult] = React.useState('');
  const [mtLoading, setMtLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧠 Memory Trainer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Use memory palaces, mnemonics, and spaced repetition to retain anything.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Topic (e.g. Spanish vocab, anatomy, history dates)" value={mtTopic} onChange={e=>setMtTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Content to memorize" value={mtContent} onChange={e=>setMtContent(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Memory goal (exam in 2 weeks, long-term mastery...)" value={mtGoal} onChange={e=>setMtGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mtTopic||!mtContent)return;setMtLoading(true);setMtResult('');try{const r=await fetch(`${''}/api/memory/train`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:mtTopic,content_to_memorize:mtContent,memory_goal:mtGoal})});const d=await r.json();setMtResult(d.technique||d.error);}catch(e:any){setMtResult(e.message);}setMtLoading(false);}} disabled={mtLoading||!mtTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#6c3483',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {mtLoading?'Training...':'Build My Memory System 🧠'}
        </button>
      </div>
      {mtResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mtResult}</div>}
    </div>
  );
}

export function ForgeTab_cogbias80() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cbSit, setCbSit] = React.useState('');
  const [cbDec, setCbDec] = React.useState('');
  const [cbThink, setCbThink] = React.useState('');
  const [cbResult, setCbResult] = React.useState('');
  const [cbLoading, setCbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔍 Cognitive Bias Detector</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Identify hidden thinking errors distorting your decisions and perception.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the situation you\'re facing" value={cbSit} onChange={e=>setCbSit(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Decision you\'re making (optional)" value={cbDec} onChange={e=>setCbDec(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="How you\'re currently thinking about it" value={cbThink} onChange={e=>setCbThink(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!cbSit)return;setCbLoading(true);setCbResult('');try{const r=await fetch(`${''}/api/cognitivebias/detect`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:cbSit,decision:cbDec,thinking_process:cbThink})});const d=await r.json();setCbResult(d.analysis||d.error);}catch(e:any){setCbResult(e.message);}setCbLoading(false);}} disabled={cbLoading||!cbSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#117a65',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {cbLoading?'Analyzing...':'Detect My Biases 🔍'}
        </button>
      </div>
      {cbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{cbResult}</div>}
    </div>
  );
}
