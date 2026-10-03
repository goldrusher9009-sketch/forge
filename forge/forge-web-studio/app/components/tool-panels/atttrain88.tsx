'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_atttrain88() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [atChal, setAtChal] = React.useState('');
  const [atWork, setAtWork] = React.useState('');
  const [atGoal, setAtGoal] = React.useState('');
  const [atResult, setAtResult] = React.useState('');
  const [atLoading, setAtLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎯 Attention Trainer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>4-week progressive attention training protocol tailored to your work and challenges.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Attention challenges (mind wandering, phone addiction, context switching)" value={atChal} onChange={e=>setAtChal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Work style (deep work, meetings, creative, analytical)" value={atWork} onChange={e=>setAtWork(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Attention goal (2hr focus blocks, reading books, writing)" value={atGoal} onChange={e=>setAtGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!atChal)return;setAtLoading(true);setAtResult('');try{const r=await fetch(`${''}/api/attention/train`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({challenges:atChal,work_style:atWork,goals:atGoal})});const d=await r.json();setAtResult(d.protocol||d.error);}catch(e:any){setAtResult(e.message);}setAtLoading(false);}} disabled={atLoading||!atChal} style={{padding:'0.75rem',borderRadius:'8px',background:'#117864',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {atLoading?'Training...':'Build My Attention Protocol 🎯'}
        </button>
      </div>
      {atResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{atResult}</div>}
    </div>
  );
}

export function ForgeTab_mentenrg88() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [meLife, setMeLife] = React.useState('');
  const [meGoal, setMeGoal] = React.useState('');
  const [meIssue, setMeIssue] = React.useState('');
  const [meResult, setMeResult] = React.useState('');
  const [meLoading, setMeLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚡ Mental Energy Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Eliminate brain fog and energy crashes — optimize your cognitive performance all day.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Current lifestyle (sleep, diet, exercise, work hours, stress level)" value={meLife} onChange={e=>setMeLife(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Performance goals (sustained focus, creativity, leadership presence)" value={meGoal} onChange={e=>setMeGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current issues (afternoon crash, brain fog, low motivation)" value={meIssue} onChange={e=>setMeIssue(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setMeLoading(true);setMeResult('');try{const r=await fetch(`${''}/api/mentalenergy/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({lifestyle:meLife,goals:meGoal,current_issues:meIssue})});const d=await r.json();setMeResult(d.plan||d.error);}catch(e:any){setMeResult(e.message);}setMeLoading(false);}} disabled={meLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#f39c12',color:'#000',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {meLoading?'Optimizing...':'Optimize My Mental Energy ⚡'}
        </button>
      </div>
      {meResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{meResult}</div>}
    </div>
  );
}

export function ForgeTab_socstyle89() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ssScen, setSsScen] = React.useState('');
  const [ssPers, setSsPers] = React.useState('');
  const [ssStyle, setSsStyle] = React.useState('');
  const [ssResult, setSsResult] = React.useState('');
  const [ssLoading, setSsLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎭 Social Style Decoder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Decode anyone\'s social style and get a personalized interaction strategy.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the scenario (meeting, negotiation, first date, job interview)" value={ssScen} onChange={e=>setSsScen(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Describe the person you\'re interacting with" value={ssPers} onChange={e=>setSsPers(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your own communication style (direct, warm, analytical, expressive)" value={ssStyle} onChange={e=>setSsStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ssScen)return;setSsLoading(true);setSsResult('');try{const r=await fetch(`${''}/api/socialstyle/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({scenario:ssScen,person_description:ssPers,your_style:ssStyle})});const d=await r.json();setSsResult(d.analysis||d.error);}catch(e:any){setSsResult(e.message);}setSsLoading(false);}} disabled={ssLoading||!ssScen} style={{padding:'0.75rem',borderRadius:'8px',background:'#6c3483',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ssLoading?'Decoding...':'Decode Their Social Style 🎭'}
        </button>
      </div>
      {ssResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ssResult}</div>}
    </div>
  );
}

export function ForgeTab_netcoach89() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ncGoal, setNcGoal] = React.useState('');
  const [ncStyle, setNcStyle] = React.useState('');
  const [ncInd, setNcInd] = React.useState('');
  const [ncResult, setNcResult] = React.useState('');
  const [ncLoading, setNcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🤝 Networking Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a genuine, strategic network — even if you\'re introverted or hate small talk.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Networking goals (job, investors, clients, mentors, partnerships)" value={ncGoal} onChange={e=>setNcGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your personality style (introvert, extrovert, ambivert)" value={ncStyle} onChange={e=>setNcStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Industry / field" value={ncInd} onChange={e=>setNcInd(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ncGoal)return;setNcLoading(true);setNcResult('');try{const r=await fetch(`${''}/api/networking/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goals:ncGoal,style:ncStyle,industry:ncInd})});const d=await r.json();setNcResult(d.plan||d.error);}catch(e:any){setNcResult(e.message);}setNcLoading(false);}} disabled={ncLoading||!ncGoal} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ncLoading?'Coaching...':'Build My Network Plan 🤝'}
        </button>
      </div>
      {ncResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ncResult}</div>}
    </div>
  );
}

export function ForgeTab_conflmed89() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cmSit, setCmSit] = React.useState('');
  const [cmPart, setCmPart] = React.useState('');
  const [cmRel, setCmRel] = React.useState('');
  const [cmResult, setCmResult] = React.useState('');
  const [cmLoading, setCmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚖️ Conflict Mediator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Navigate difficult conflicts with expert mediation strategies and exact conversation scripts.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the conflict situation" value={cmSit} onChange={e=>setCmSit(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Who is involved? (colleague, partner, family member, manager)" value={cmPart} onChange={e=>setCmPart(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Relationship type (professional, romantic, family, friendship)" value={cmRel} onChange={e=>setCmRel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!cmSit)return;setCmLoading(true);setCmResult('');try{const r=await fetch(`${''}/api/conflict/mediate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:cmSit,parties:cmPart,relationship_type:cmRel})});const d=await r.json();setCmResult(d.resolution||d.error);}catch(e:any){setCmResult(e.message);}setCmLoading(false);}} disabled={cmLoading||!cmSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#784212',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {cmLoading?'Mediating...':'Get Resolution Strategy ⚖️'}
        </button>
      </div>
      {cmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{cmResult}</div>}
    </div>
  );
}

export function ForgeTab_trustbld89() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tbRel, setTbRel] = React.useState('');
  const [tbChal, setTbChal] = React.useState('');
  const [tbCtx, setTbCtx] = React.useState('');
  const [tbResult, setTbResult] = React.useState('');
  const [tbLoading, setTbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔐 Trust Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Repair, deepen, or build trust in any relationship with a structured action plan.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="The relationship (my team, my manager, my partner, a client)" value={tbRel} onChange={e=>setTbRel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Trust challenges (what broke trust, or what\'s missing)" value={tbChal} onChange={e=>setTbChal(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Context (professional, romantic, family, new relationship)" value={tbCtx} onChange={e=>setTbCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!tbRel)return;setTbLoading(true);setTbResult('');try{const r=await fetch(`${''}/api/trust/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({relationship:tbRel,challenges:tbChal,context:tbCtx})});const d=await r.json();setTbResult(d.plan||d.error);}catch(e:any){setTbResult(e.message);}setTbLoading(false);}} disabled={tbLoading||!tbRel} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {tbLoading?'Building...':'Build My Trust Plan 🔐'}
        </button>
      </div>
      {tbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{tbResult}</div>}
    </div>
  );
}

export function ForgeTab_socianx89() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [saTrig, setSaTrig] = React.useState('');
  const [saGoal, setSaGoal] = React.useState('');
  const [saSev, setSaSev] = React.useState('');
  const [saResult, setSaResult] = React.useState('');
  const [saLoading, setSaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💪 Social Anxiety Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build social confidence step by step — practical techniques, not generic advice.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="What triggers social anxiety? (crowds, speaking up, meeting strangers)" value={saTrig} onChange={e=>setSaTrig(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Social goals (make friends, speak at events, network, date)" value={saGoal} onChange={e=>setSaGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Severity (mild / moderate — for severe anxiety please see a professional)" value={saSev} onChange={e=>setSaSev(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!saTrig)return;setSaLoading(true);setSaResult('');try{const r=await fetch(`${''}/api/socialanxiety/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({triggers:saTrig,goals:saGoal,severity:saSev})});const d=await r.json();setSaResult(d.protocol||d.error);}catch(e:any){setSaResult(e.message);}setSaLoading(false);}} disabled={saLoading||!saTrig} style={{padding:'0.75rem',borderRadius:'8px',background:'#2471a3',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {saLoading?'Coaching...':'Build My Confidence Plan 💪'}
        </button>
      </div>
      {saResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{saResult}</div>}
    </div>
  );
}

export function ForgeTab_firecalc90() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [frInc, setFrInc] = React.useState('');
  const [frExp, setFrExp] = React.useState('');
  const [frSav, setFrSav] = React.useState('');
  const [frAge, setFrAge] = React.useState('');
  const [frResult, setFrResult] = React.useState('');
  const [frLoading, setFrLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔥 FIRE Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate your Financial Independence number and exact timeline to retire early.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Annual income (e.g. $80,000)" value={frInc} onChange={e=>setFrInc(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Annual expenses (e.g. $40,000)" value={frExp} onChange={e=>setFrExp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current savings/investments (e.g. $50,000)" value={frSav} onChange={e=>setFrSav(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current age" value={frAge} onChange={e=>setFrAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!frInc||!frExp)return;setFrLoading(true);setFrResult('');try{const r=await fetch(`${''}/api/fire/calculate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({annual_income:frInc,annual_expenses:frExp,current_savings:frSav,age:frAge})});const d=await r.json();setFrResult(d.result||d.error);}catch(e:any){setFrResult(e.message);}setFrLoading(false);}} disabled={frLoading||!frInc||!frExp} style={{padding:'0.75rem',borderRadius:'8px',background:'#c0392b',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {frLoading?'Calculating...':'Calculate My FIRE Number 🔥'}
        </button>
      </div>
      {frResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{frResult}</div>}
    </div>
  );
}

export function ForgeTab_debtdest90() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ddDebts, setDdDebts] = React.useState('');
  const [ddInc, setDdInc] = React.useState('');
  const [ddExp, setDdExp] = React.useState('');
  const [ddResult, setDdResult] = React.useState('');
  const [ddLoading, setDdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💣 Debt Destroyer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Avalanche vs snowball analysis, exact payoff schedule, and scripts to negotiate lower rates.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="List your debts (e.g. Credit card $5k @22%, Student loan $20k @6%, Car $8k @4%)" value={ddDebts} onChange={e=>setDdDebts(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Monthly income" value={ddInc} onChange={e=>setDdInc(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Monthly expenses (excluding debt payments)" value={ddExp} onChange={e=>setDdExp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ddDebts)return;setDdLoading(true);setDdResult('');try{const r=await fetch(`${''}/api/debt/destroy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({debts:ddDebts,monthly_income:ddInc,monthly_expenses:ddExp})});const d=await r.json();setDdResult(d.plan||d.error);}catch(e:any){setDdResult(e.message);}setDdLoading(false);}} disabled={ddLoading||!ddDebts} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ddLoading?'Destroying...':'Destroy My Debt 💣'}
        </button>
      </div>
      {ddResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ddResult}</div>}
    </div>
  );
}

export function ForgeTab_investedu90() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ieLevel, setIeLevel] = React.useState('');
  const [ieGoal, setIeGoal] = React.useState('');
  const [ieTime, setIeTime] = React.useState('');
  const [ieResult, setIeResult] = React.useState('');
  const [ieLoading, setIeLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📊 Investment Educator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Personalized investing curriculum — from zero to confident investor in 8 weeks.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Knowledge level (complete beginner, some basics, intermediate)" value={ieLevel} onChange={e=>setIeLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Investing goals (retirement, house, financial freedom, passive income)" value={ieGoal} onChange={e=>setIeGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Time horizon (5 years, 10 years, 30+ years)" value={ieTime} onChange={e=>setIeTime(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ieGoal)return;setIeLoading(true);setIeResult('');try{const r=await fetch(`${''}/api/investing/educate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({knowledge_level:ieLevel,goals:ieGoal,time_horizon:ieTime})});const d=await r.json();setIeResult(d.curriculum||d.error);}catch(e:any){setIeResult(e.message);}setIeLoading(false);}} disabled={ieLoading||!ieGoal} style={{padding:'0.75rem',borderRadius:'8px',background:'#117a65',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ieLoading?'Building...':'Build My Investment Curriculum 📊'}
        </button>
      </div>
      {ieResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ieResult}</div>}
    </div>
  );
}

export function ForgeTab_sidehust90() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [shSkill, setShSkill] = React.useState('');
  const [shHrs, setShHrs] = React.useState('');
  const [shGoal, setShGoal] = React.useState('');
  const [shResult, setShResult] = React.useState('');
  const [shLoading, setShLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💼 Side Hustle Launcher</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>From skills to income — matched side hustle plan with a 30-day launch roadmap.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Your skills (writing, design, coding, teaching, sales, cooking...)" value={shSkill} onChange={e=>setShSkill(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Hours available per week (e.g. 5, 10, 20)" value={shHrs} onChange={e=>setShHrs(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Income goal (e.g. $500/month, $2000/month)" value={shGoal} onChange={e=>setShGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!shSkill)return;setShLoading(true);setShResult('');try{const r=await fetch(`${''}/api/sidehustle/launch`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({skills:shSkill,available_hours:shHrs,income_goal:shGoal})});const d=await r.json();setShResult(d.plan||d.error);}catch(e:any){setShResult(e.message);}setShLoading(false);}} disabled={shLoading||!shSkill} style={{padding:'0.75rem',borderRadius:'8px',background:'#7d6608',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {shLoading?'Launching...':'Launch My Side Hustle 💼'}
        </button>
      </div>
      {shResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{shResult}</div>}
    </div>
  );
}

export function ForgeTab_netwrth90() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [nwSit, setNwSit] = React.useState('');
  const [nwGoal, setNwGoal] = React.useState('');
  const [nwTime, setNwTime] = React.useState('');
  const [nwResult, setNwResult] = React.useState('');
  const [nwLoading, setNwLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🏆 Net Worth Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Complete wealth building roadmap — income, investments, assets, and milestones by year.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Current situation (income, savings, debts, age, job)" value={nwSit} onChange={e=>setNwSit(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Wealth goals (e.g. $1M net worth, financial freedom, retire at 50)" value={nwGoal} onChange={e=>setNwGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Timeline (e.g. 5 years, 10 years, 20 years)" value={nwTime} onChange={e=>setNwTime(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!nwGoal)return;setNwLoading(true);setNwResult('');try{const r=await fetch(`${''}/api/networth/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_situation:nwSit,goals:nwGoal,timeline:nwTime})});const d=await r.json();setNwResult(d.roadmap||d.error);}catch(e:any){setNwResult(e.message);}setNwLoading(false);}} disabled={nwLoading||!nwGoal} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {nwLoading?'Building...':'Build My Wealth Roadmap 🏆'}
        </button>
      </div>
      {nwResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{nwResult}</div>}
    </div>
  );
}

export function ForgeTab_paperdec91() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pdPaper, setPdPaper] = React.useState('');
  const [pdLevel, setPdLevel] = React.useState('');
  const [pdResult, setPdResult] = React.useState('');
  const [pdLoading, setPdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔬 Research Paper Decoder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Paste any abstract or paper section — get a plain-English breakdown with key findings and implications.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Paste the paper abstract or section you want decoded" value={pdPaper} onChange={e=>setPdPaper(e.target.value)} rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Audience level (high schooler, professional, expert)" value={pdLevel} onChange={e=>setPdLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!pdPaper)return;setPdLoading(true);setPdResult('');try{const r=await fetch(`${''}/api/researchpaper/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({paper_text:pdPaper,audience_level:pdLevel})});const d=await r.json();setPdResult(d.summary||d.error);}catch(e:any){setPdResult(e.message);}setPdLoading(false);}} disabled={pdLoading||!pdPaper} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {pdLoading?'Decoding...':'Decode This Paper 🔬'}
        </button>
      </div>
      {pdResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pdResult}</div>}
    </div>
  );
}

export function ForgeTab_hypogen91() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [hgField, setHgField] = React.useState('');
  const [hgObs, setHgObs] = React.useState('');
  const [hgBg, setHgBg] = React.useState('');
  const [hgResult, setHgResult] = React.useState('');
  const [hgLoading, setHgLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💡 Hypothesis Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 5 testable, novel hypotheses with full experimental variable breakdown.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Scientific field (psychology, biology, physics, economics...)" value={hgField} onChange={e=>setHgField(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Your observation or research question" value={hgObs} onChange={e=>setHgObs(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Background knowledge or context (optional)" value={hgBg} onChange={e=>setHgBg(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!hgField||!hgObs)return;setHgLoading(true);setHgResult('');try{const r=await fetch(`${''}/api/hypothesis/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({field:hgField,observation:hgObs,background:hgBg})});const d=await r.json();setHgResult(d.hypotheses||d.error);}catch(e:any){setHgResult(e.message);}setHgLoading(false);}} disabled={hgLoading||!hgField||!hgObs} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {hgLoading?'Generating...':'Generate Hypotheses 💡'}
        </button>
      </div>
      {hgResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{hgResult}</div>}
    </div>
  );
}

export function ForgeTab_expdes91() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [edHyp, setEdHyp] = React.useState('');
  const [edCon, setEdCon] = React.useState('');
  const [edFld, setEdFld] = React.useState('');
  const [edResult, setEdResult] = React.useState('');
  const [edLoading, setEdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧪 Experiment Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Full experimental design with methodology, sample size, controls, and statistical analysis plan.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Your hypothesis (what you want to test)" value={edHyp} onChange={e=>setEdHyp(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Constraints (budget, timeline, resources, ethics)" value={edCon} onChange={e=>setEdCon(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Field / domain (psychology, biology, social science...)" value={edFld} onChange={e=>setEdFld(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!edHyp)return;setEdLoading(true);setEdResult('');try{const r=await fetch(`${''}/api/experiment/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({hypothesis:edHyp,constraints:edCon,field:edFld})});const d=await r.json();setEdResult(d.design||d.error);}catch(e:any){setEdResult(e.message);}setEdLoading(false);}} disabled={edLoading||!edHyp} style={{padding:'0.75rem',borderRadius:'8px',background:'#7d3c98',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {edLoading?'Designing...':'Design My Experiment 🧪'}
        </button>
      </div>
      {edResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{edResult}</div>}
    </div>
  );
}

export function ForgeTab_sciexp91() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [seConcept, setSeConcept] = React.useState('');
  const [seLevel, setSeLevel] = React.useState('');
  const [seCtx, setSeCtx] = React.useState('');
  const [seResult, setSeResult] = React.useState('');
  const [seLoading, setSeLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌌 Science Explainer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Any scientific concept explained with analogies, real-world connections, and mind-blowing implications.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Scientific concept to explain (e.g. quantum entanglement, CRISPR, dark matter)" value={seConcept} onChange={e=>setSeConcept(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Explanation level (curious 10-year-old, smart adult, undergraduate, PhD)" value={seLevel} onChange={e=>setSeLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Context or why you\'re curious (optional)" value={seCtx} onChange={e=>setSeCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!seConcept)return;setSeLoading(true);setSeResult('');try{const r=await fetch(`${''}/api/science/explain`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({concept:seConcept,level:seLevel,context:seCtx})});const d=await r.json();setSeResult(d.explanation||d.error);}catch(e:any){setSeResult(e.message);}setSeLoading(false);}} disabled={seLoading||!seConcept} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {seLoading?'Explaining...':'Explain This Science 🌌'}
        </button>
      </div>
      {seResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{seResult}</div>}
    </div>
  );
}

export function ForgeTab_litrev91() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lrTopic, setLrTopic] = React.useState('');
  const [lrScope, setLrScope] = React.useState('');
  const [lrPurp, setLrPurp] = React.useState('');
  const [lrResult, setLrResult] = React.useState('');
  const [lrLoading, setLrLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📚 Literature Reviewer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Comprehensive literature review — key papers, frameworks, debates, and research gaps.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Research topic (e.g. sleep and memory consolidation, social media and anxiety)" value={lrTopic} onChange={e=>setLrTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Scope (last 5 years, last decade, all time)" value={lrScope} onChange={e=>setLrScope(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Purpose (thesis, curiosity, writing an article, starting research)" value={lrPurp} onChange={e=>setLrPurp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!lrTopic)return;setLrLoading(true);setLrResult('');try{const r=await fetch(`${''}/api/literature/review`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:lrTopic,scope:lrScope,purpose:lrPurp})});const d=await r.json();setLrResult(d.review||d.error);}catch(e:any){setLrResult(e.message);}setLrLoading(false);}} disabled={lrLoading||!lrTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#117864',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {lrLoading?'Reviewing...':'Review the Literature 📚'}
        </button>
      </div>
      {lrResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{lrResult}</div>}
    </div>
  );
}

export function ForgeTab_leadcoach92() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lcStyle, setLcStyle] = React.useState('');
  const [lcChal, setLcChal] = React.useState('');
  const [lcSize, setLcSize] = React.useState('');
  const [lcResult, setLcResult] = React.useState('');
  const [lcLoading, setLcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>👑 Leadership Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Personalized leadership development plan — from good manager to exceptional leader.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Current leadership style (directive, coaching, democratic, unsure)" value={lcStyle} onChange={e=>setLcStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Biggest leadership challenges right now" value={lcChal} onChange={e=>setLcChal(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Team size and type (5 engineers, 20 mixed, remote)" value={lcSize} onChange={e=>setLcSize(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!lcChal)return;setLcLoading(true);setLcResult('');try{const r=await fetch(`${''}/api/leadership/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({style:lcStyle,challenges:lcChal,team_size:lcSize})});const d=await r.json();setLcResult(d.plan||d.error);}catch(e:any){setLcResult(e.message);}setLcLoading(false);}} disabled={lcLoading||!lcChal} style={{padding:'0.75rem',borderRadius:'8px',background:'#784212',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {lcLoading?'Coaching...':'Build My Leadership Plan 👑'}
        </button>
      </div>
      {lcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{lcResult}</div>}
    </div>
  );
}

export function ForgeTab_execpres92() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [epCtx, setEpCtx] = React.useState('');
  const [epGaps, setEpGaps] = React.useState('');
  const [epRole, setEpRole] = React.useState('');
  const [epResult, setEpResult] = React.useState('');
  const [epLoading, setEpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎩 Executive Presence Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Command rooms, inspire confidence, and project the gravitas your role demands.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Context (presenting to board, managing up, leading large teams)" value={epCtx} onChange={e=>setEpCtx(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Where you feel presence is lacking (speaking up, body language, credibility)" value={epGaps} onChange={e=>setEpGaps(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your current role / level" value={epRole} onChange={e=>setEpRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!epCtx)return;setEpLoading(true);setEpResult('');try{const r=await fetch(`${''}/api/executivepresence/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({context:epCtx,current_gaps:epGaps,role:epRole})});const d=await r.json();setEpResult(d.plan||d.error);}catch(e:any){setEpResult(e.message);}setEpLoading(false);}} disabled={epLoading||!epCtx} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {epLoading?'Building...':'Build My Executive Presence 🎩'}
        </button>
      </div>
      {epResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{epResult}</div>}
    </div>
  );
}

export function ForgeTab_teammot92() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tmType, setTmType] = React.useState('');
  const [tmIssues, setTmIssues] = React.useState('');
  const [tmGoals, setTmGoals] = React.useState('');
  const [tmResult, setTmResult] = React.useState('');
  const [tmLoading, setTmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔋 Team Motivation Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a motivating team environment — rituals, recognition, and psychological safety.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Team type (remote engineers, in-person sales, hybrid mixed roles)" value={tmType} onChange={e=>setTmType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Current motivation issues (burnout, disengagement, unclear goals, conflict)" value={tmIssues} onChange={e=>setTmIssues(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="What does team success look like?" value={tmGoals} onChange={e=>setTmGoals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!tmType)return;setTmLoading(true);setTmResult('');try{const r=await fetch(`${''}/api/teammotivation/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({team_type:tmType,issues:tmIssues,goals:tmGoals})});const d=await r.json();setTmResult(d.strategy||d.error);}catch(e:any){setTmResult(e.message);}setTmLoading(false);}} disabled={tmLoading||!tmType} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {tmLoading?'Designing...':'Design My Team Motivation System 🔋'}
        </button>
      </div>
      {tmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{tmResult}</div>}
    </div>
  );
}

export function ForgeTab_stratthk92() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [stChal, setStChal] = React.useState('');
  const [stCtx, setStCtx] = React.useState('');
  const [stConstr, setStConstr] = React.useState('');
  const [stResult, setStResult] = React.useState('');
  const [stLoading, setStLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>♟️ Strategic Thinker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Your personal strategic advisor — 3 options, trade-offs, and a recommended path forward.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="The strategic challenge you\'re facing" value={stChal} onChange={e=>setStChal(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Context (company size, industry, competitive situation)" value={stCtx} onChange={e=>setStCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Key constraints (budget, time, team, politics)" value={stConstr} onChange={e=>setStConstr(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!stChal)return;setStLoading(true);setStResult('');try{const r=await fetch(`${''}/api/strategy/think`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({challenge:stChal,context:stCtx,constraints:stConstr})});const d=await r.json();setStResult(d.strategy||d.error);}catch(e:any){setStResult(e.message);}setStLoading(false);}} disabled={stLoading||!stChal} style={{padding:'0.75rem',borderRadius:'8px',background:'#6c3483',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {stLoading?'Thinking...':'Build My Strategy ♟️'}
        </button>
      </div>
      {stResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{stResult}</div>}
    </div>
  );
}

export function ForgeTab_fbkcultr92() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fcOrg, setFcOrg] = React.useState('');
  const [fcState, setFcState] = React.useState('');
  const [fcSize, setFcSize] = React.useState('');
  const [fcResult, setFcResult] = React.useState('');
  const [fcLoading, setFcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔄 Feedback Culture Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a culture where honest feedback flows freely — up, down, and sideways.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Org context (startup, enterprise, department within large company)" value={fcOrg} onChange={e=>setFcOrg(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current feedback culture (none, annual reviews only, ad hoc)" value={fcState} onChange={e=>setFcState(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Team size" value={fcSize} onChange={e=>setFcSize(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!fcOrg)return;setFcLoading(true);setFcResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:`Build a comprehensive feedback culture plan for: Org: ${fcOrg}, Current state: ${fcState}, Team size: ${fcSize}. Include: weekly feedback rituals, psychological safety practices, feedback training, escalation paths, and 90-day rollout.`,model:'claude-3-5-haiku-20241022'})});const d=await r.json();setFcResult(d.response||d.content||d.error);}catch(e:any){setFcResult(e.message);}setFcLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{fcLoading?'Building...':'Build Feedback Culture'}</button>
      </div>
      {fcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{fcResult}</div>}
    </div>
  );
}

export function ForgeTab_pitchcoach93() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pcPitch, setPcPitch] = React.useState('');
  const [pcAudience, setPcAudience] = React.useState('');
  const [pcGoal, setPcGoal] = React.useState('');
  const [pcResult, setPcResult] = React.useState('');
  const [pcLoading, setPcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎤 AI Pitch Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get brutally honest feedback on your pitch and a rewrite that actually converts.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Paste your pitch or pitch deck outline here..." value={pcPitch} onChange={e=>setPcPitch(e.target.value)} rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Target audience (e.g. seed VCs, enterprise buyers, demo day judges)" value={pcAudience} onChange={e=>setPcAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Goal (raise $500K, close enterprise deal, win competition)" value={pcGoal} onChange={e=>setPcGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!pcPitch)return;setPcLoading(true);setPcResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:`You are a top-tier pitch coach. Analyze this pitch:\n\n${pcPitch}\n\nAudience: ${pcAudience}\nGoal: ${pcGoal}\n\nProvide:\n1. SCORE (1-10) with reasons\n2. TOP 3 FATAL FLAWS\n3. WHAT IS WORKING\n4. REWRITTEN HOOK (first 30 seconds)\n5. KEY OBJECTIONS and how to preempt them\n6. CLOSING LINE that drives action`,model:'claude-3-5-haiku-20241022'})});const d=await r.json();const out=d.response||d.content||d.error;setPcResult(out);saveToolHistory('pitchcoach','AI Pitch Coach',{pitch:pcPitch.slice(0,200),audience:pcAudience,goal:pcGoal},out?.slice(0,500)||'');}catch(e:any){setPcResult(e.message);}setPcLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{pcLoading?'Analyzing...':'Coach My Pitch'}</button>
      </div>
      {pcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pcResult}</div>}
    </div>
  );
}

export function ForgeTab_viralideagen93() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [viTopic, setViTopic] = React.useState('');
  const [viPlatform, setViPlatform] = React.useState('');
  const [viAudience, setViAudience] = React.useState('');
  const [viResult, setViResult] = React.useState('');
  const [viLoading, setViLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💥 Viral Idea Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 10 ideas engineered to go viral — with psychological triggers explained.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Your niche or topic (e.g. productivity, SaaS, fitness, personal finance)" value={viTopic} onChange={e=>setViTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Platform (Twitter/X, LinkedIn, TikTok, YouTube, Newsletter)" value={viPlatform} onChange={e=>setViPlatform(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target audience (founders, marketers, Gen Z, busy parents)" value={viAudience} onChange={e=>setViAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!viTopic)return;setViLoading(true);setViResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:`Generate 10 viral content ideas for ${viPlatform||'social media'} about "${viTopic}" targeting ${viAudience||'general audience'}.\n\nFor each idea:\n- THE HOOK (first line that stops the scroll)\n- FORMAT (thread, video, carousel, essay)\n- VIRAL TRIGGER (curiosity gap, controversy, relatability, awe, identity)\n- WHY IT SPREADS\n- VIRAL POTENTIAL (Low/Medium/High/Explosive)\n\nRank by viral potential.`,model:'claude-3-5-haiku-20241022'})});const d=await r.json();const viOut=d.response||d.content||d.error||'';setViResult(viOut);saveToolHistory('viralideagen93','Viral Idea Generator',{topic:viTopic,platform:viPlatform,audience:viAudience},viOut);}catch(e:any){setViResult(e.message);}setViLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{viLoading?'Generating...':'Generate Viral Ideas'}</button>
      </div>
      {viResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{viResult}</div>}
    </div>
  );
}

export function ForgeTab_meetkill93() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mkMeeting, setMkMeeting] = React.useState('');
  const [mkFreq, setMkFreq] = React.useState('');
  const [mkPeople, setMkPeople] = React.useState('');
  const [mkResult, setMkResult] = React.useState('');
  const [mkLoading, setMkLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🗡️ Meeting Assassin</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Ruthlessly audit your meetings. Kill the useless ones. Transform the rest.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the meeting (purpose, agenda, who attends, decisions made)" value={mkMeeting} onChange={e=>setMkMeeting(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="How often does it meet? (daily standup, weekly sync, monthly review)" value={mkFreq} onChange={e=>setMkFreq(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="How many people attend?" value={mkPeople} onChange={e=>setMkPeople(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mkMeeting)return;setMkLoading(true);setMkResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:`Analyze this meeting ruthlessly:\n\nMeeting: ${mkMeeting}\nFrequency: ${mkFreq}\nAttendees: ${mkPeople}\n\nDeliver:\n1. VERDICT: Kill It / Transform It / Keep It\n2. HIDDEN COST: Annual hours wasted\n3. THE REAL PROBLEM this meeting tries to solve\n4. IF KILLING IT: What replaces it?\n5. IF TRANSFORMING IT: New format, reduced attendees, time cut\n6. 3 RULES if this meeting must exist`,model:'claude-3-5-haiku-20241022'})});const d=await r.json();setMkResult(d.response||d.content||d.error);}catch(e:any){setMkResult(e.message);}setMkLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#dc2626',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{mkLoading?'Assassinating...':'Assassinate This Meeting'}</button>
      </div>
      {mkResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mkResult}</div>}
    </div>
  );
}

export function ForgeTab_procautopsy93() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [paTask, setPaTask] = React.useState('');
  const [paPattern, setPaPattern] = React.useState('');
  const [paContext, setPaContext] = React.useState('');
  const [paResult, setPaResult] = React.useState('');
  const [paLoading, setPaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔬 Procrastination Autopsy</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Dissect exactly why you\'re avoiding something — then get a precise cure.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="What are you procrastinating on? (be specific)" value={paTask} onChange={e=>setPaTask(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="How long have you been avoiding it?" value={paPattern} onChange={e=>setPaPattern(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="What happens when you try to start? What do you do instead?" value={paContext} onChange={e=>setPaContext(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <button onClick={async()=>{if(!paTask)return;setPaLoading(true);setPaResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:`Perform a procrastination autopsy:\n\nTask: ${paTask}\nAvoiding for: ${paPattern}\nWhat happens when trying to start: ${paContext}\n\nDiagnose:\n1. ROOT CAUSE (fear of failure / perfectionism / overwhelm / unclear next step / values misalignment)\n2. THE ACTUAL FEAR underneath\n3. WHAT THE PROCRASTINATION IS PROTECTING YOU FROM\n4. 2-MINUTE START PRESCRIPTION (exact first physical action)\n5. ENVIRONMENT DESIGN (remove 3 friction points, add 3 triggers)\n6. IDENTITY REFRAME\n7. WEEKLY ACCOUNTABILITY SYSTEM`,model:'claude-3-5-haiku-20241022'})});const d=await r.json();setPaResult(d.response||d.content||d.error);}catch(e:any){setPaResult(e.message);}setPaLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{paLoading?'Dissecting...':'Run the Autopsy'}</button>
      </div>
      {paResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{paResult}</div>}
    </div>
  );
}

export function ForgeTab_scriptwriter94() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [swTopic, setSwTopic] = React.useState('');
  const [swFormat, setSwFormat] = React.useState('');
  const [swLen, setSwLen] = React.useState('');
  const [swResult, setSwResult] = React.useState('');
  const [swLoading, setSwLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎬 Script Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete, engaging script for YouTube, podcasts, or presentations.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Topic or title" value={swTopic} onChange={e=>setSwTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Format (YouTube video, podcast, presentation, webinar)" value={swFormat} onChange={e=>setSwFormat(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target length (5 min, 10 min, 20 min)" value={swLen} onChange={e=>setSwLen(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!swTopic)return;setSwLoading(true);setSwResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Write a complete '+( swFormat||'YouTube video')+' script about: "'+swTopic+'". Target length: '+(swLen||'10 minutes')+'. Structure: [HOOK 0:00-0:30], [INTRO 0:30-1:00], [SECTION 1], [SECTION 2], [SECTION 3], [CTA], [OUTRO]. Include B-ROLL suggestions and timing markers. Write conversationally.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setSwResult(d.response||d.content||d.error);}catch(e:any){setSwResult(e.message);}setSwLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{swLoading?'Writing...':'Generate Script'}</button>
      </div>
      {swResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{swResult}</div>}
    </div>
  );
}

export function ForgeTab_threadgen94() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tgTopic, setTgTopic] = React.useState('');
  const [tgStyle, setTgStyle] = React.useState('');
  const [tgGoal, setTgGoal] = React.useState('');
  const [tgResult, setTgResult] = React.useState('');
  const [tgLoading, setTgLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧵 Thread Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn any idea into a viral Twitter/X thread with hooks, tension, and a killer finale.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Thread topic or core idea" value={tgTopic} onChange={e=>setTgTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Style (educational, storytelling, contrarian, listicle, hot take)" value={tgStyle} onChange={e=>setTgStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Goal (grow followers, drive traffic, spark discussion)" value={tgGoal} onChange={e=>setTgGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!tgTopic)return;setTgLoading(true);setTgResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Write a 12-tweet viral Twitter/X thread about: "'+tgTopic+'". Style: '+(tgStyle||'educational')+'. Goal: '+(tgGoal||'grow followers')+'. Tweet 1: HOOK - bold claim or surprising stat. Tweets 2-10: one punchy idea each. Tweet 11-12: THE PAYOFF. Final: CTA + retweet ask. Format as: 1/ [text] 2/ [text] etc. Under 280 chars each.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();const tgOut=d.response||d.content||d.error||'';setTgResult(tgOut);saveToolHistory('viralthread','Viral Thread Generator',{topic:tgTopic,style:tgStyle,goal:tgGoal},tgOut);}catch(e:any){setTgResult(e.message);}setTgLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{tgLoading?'Writing...':'Generate Thread'}</button>
      </div>
      {tgResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6',fontFamily:'monospace',fontSize:'0.9rem'}}>{tgResult}</div>}
    </div>
  );
}

export function ForgeTab_coldloom94() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [clProduct, setClProduct] = React.useState('');
  const [clPerson, setClPerson] = React.useState('');
  const [clGoal, setClGoal] = React.useState('');
  const [clResult, setClResult] = React.useState('');
  const [clLoading, setClLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📨 Cold Outreach Sequence</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a 5-email cold outreach sequence that books meetings without being pushy.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="What are you selling or offering?" value={clProduct} onChange={e=>setClProduct(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Target persona (e.g. VP of Sales at B2B SaaS)" value={clPerson} onChange={e=>setClPerson(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Goal (book a demo, get a reply, schedule a call)" value={clGoal} onChange={e=>setClGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!clProduct)return;setClLoading(true);setClResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Write a 5-email cold outreach sequence. Offer: '+clProduct+'. Target: '+(clPerson||'decision makers')+'. Goal: '+(clGoal||'book a call')+'. For each email: EMAIL #N (Day X), SUBJECT LINE (3 options), BODY (under 150 words, value-first), SEND TIMING. Emails: 1=pattern interrupt+value hook(Day1), 2=social proof(Day3), 3=case study(Day7), 4=direct ask(Day14), 5=breakup email(Day21). Human tone, never say just following up.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();const out=d.response||d.content||d.error;setClResult(out);saveToolHistory('coldloom94','Cold Email Sequence',{product:clProduct.slice(0,200),person:clPerson,goal:clGoal},out?.slice(0,500)||'');}catch(e:any){setClResult(e.message);}setClLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{clLoading?'Building...':'Build Sequence'}</button>
      </div>
      {clResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{clResult}</div>}
    </div>
  );
}

export function ForgeTab_seowriter94() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [seKw, setSeKw] = React.useState('');
  const [seAudience, setSeAudience] = React.useState('');
  const [seIntent, setSeIntent] = React.useState('');
  const [seResult, setSeResult] = React.useState('');
  const [seLoading, setSeLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔍 SEO Blog Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete SEO-optimized blog post that ranks AND converts.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Target keyword or topic" value={seKw} onChange={e=>setSeKw(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target audience (who is searching for this?)" value={seAudience} onChange={e=>setSeAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Search intent (informational, commercial, transactional)" value={seIntent} onChange={e=>setSeIntent(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!seKw)return;setSeLoading(true);setSeResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Write a complete SEO blog post. Keyword: "'+seKw+'". Audience: '+(seAudience||'general')+'. Intent: '+(seIntent||'informational')+'. Include: SEO TITLE (under 60 chars), META DESCRIPTION (under 155 chars), H1, INTRO (keyword in first 100 words), TABLE OF CONTENTS, FULL ARTICLE (H2/H3 structure ~1500 words), FAQ SECTION (5 Q&As), CONCLUSION with CTA, INTERNAL LINK SUGGESTIONS.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();const out=d.response||d.content||d.error;setSeResult(out);saveToolHistory('seowriter94','SEO Writer',{keyword:seKw,audience:seAudience,intent:seIntent},out?.slice(0,500)||'');}catch(e:any){setSeResult(e.message);}setSeLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{seLoading?'Writing...':'Write SEO Post'}</button>
      </div>
      {seResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{seResult}</div>}
    </div>
  );
}

export function ForgeTab_adcopy94() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [adProduct, setAdProduct] = React.useState('');
  const [adPlatform, setAdPlatform] = React.useState('');
  const [adAudience, setAdAudience] = React.useState('');
  const [adResult, setAdResult] = React.useState('');
  const [adLoading, setAdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📣 Ad Copy Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate high-converting ad copy for Google, Meta, or LinkedIn — multiple variations to A/B test.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Product/service description (what it does, key benefit, price)" value={adProduct} onChange={e=>setAdProduct(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Platform (Google Search, Meta/Facebook, LinkedIn, Instagram)" value={adPlatform} onChange={e=>setAdPlatform(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target audience (demographics, pain points, awareness level)" value={adAudience} onChange={e=>setAdAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!adProduct)return;setAdLoading(true);setAdResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Generate 3 ad copy variations for '+(adPlatform||'Google/Meta')+'. Product: '+adProduct+'. Audience: '+(adAudience||'general')+'. For each variation: VARIATION NAME (angle used), HEADLINE (3 options under 30 chars), PRIMARY TEXT (under 125 words), DESCRIPTION (under 30 chars), CTA BUTTON, WHY THIS WORKS. Also: TOP 5 AUDIENCE TARGETING SUGGESTIONS, WINNING CREATIVE DIRECTION for visuals.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();const adOut=d.response||d.content||d.error||'';setAdResult(adOut);saveToolHistory('adcopy94','Ad Copy Generator',{product:adProduct,platform:adPlatform,audience:adAudience},adOut);}catch(e:any){setAdResult(e.message);}setAdLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{adLoading?'Generating...':'Generate Ad Copy'}</button>
      </div>
      {adResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{adResult}</div>}
    </div>
  );
}

export function ForgeTab_pricingpage95() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ppProduct, setPpProduct] = React.useState('');
  const [ppTiers, setPpTiers] = React.useState('');
  const [ppAudience, setPpAudience] = React.useState('');
  const [ppResult, setPpResult] = React.useState('');
  const [ppLoading, setPpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💰 Pricing Page Architect</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a pricing strategy and page copy that maximizes revenue and reduces churn.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Product description (what it does, who uses it, current pricing if any)" value={ppProduct} onChange={e=>setPpProduct(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Number of tiers desired (2, 3, or 4)" value={ppTiers} onChange={e=>setPpTiers(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target customers (indie hackers, SMBs, enterprise, consumers)" value={ppAudience} onChange={e=>setPpAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ppProduct)return;setPpLoading(true);setPpResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Design a complete SaaS pricing strategy for: '+ppProduct+'. Tiers: '+(ppTiers||'3')+'. Audience: '+(ppAudience||'SMBs')+'. Provide: 1) PRICING PSYCHOLOGY STRATEGY (anchoring, decoy pricing, charm pricing), 2) TIER NAMES + PRICES (with psychological rationale), 3) FEATURE LIST per tier (what to include/gate), 4) HEADLINE COPY for each tier, 5) FAQ SECTION (5 objection-busting Q&As), 6) UPGRADE TRIGGERS (what makes people move up), 7) ANNUAL vs MONTHLY strategy.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setPpResult(d.response||d.content||d.error);}catch(e:any){setPpResult(e.message);}setPpLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{ppLoading?'Designing...':'Design Pricing'}</button>
      </div>
      {ppResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ppResult}</div>}
    </div>
  );
}

export function ForgeTab_legalease95() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [leDoc, setLeDoc] = React.useState('');
  const [leType, setLeType] = React.useState('');
  const [leResult, setLeResult] = React.useState('');
  const [leLoading, setLeLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚖️ Legal Ease</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Paste any legal document and get a plain-English breakdown of what it actually means.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Paste the legal text, contract clause, or TOS section here..." value={leDoc} onChange={e=>setLeDoc(e.target.value)} rows={8} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical',fontFamily:'monospace',fontSize:'0.85rem'}} />
        <input placeholder="Document type (NDA, employment contract, TOS, lease, privacy policy)" value={leType} onChange={e=>setLeType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!leDoc)return;setLeLoading(true);setLeResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Analyze this '+(leType||'legal document')+'and explain it in plain English for a non-lawyer. Document: "'+leDoc+'". Provide: 1) ONE-LINE SUMMARY (what this actually says), 2) PLAIN ENGLISH BREAKDOWN (section by section), 3) RED FLAGS (clauses that are unusual, unfair, or risky), 4) WHAT YOU ARE AGREEING TO (bullet list), 5) WHAT THEY ARE AGREEING TO, 6) NEGOTIATION POINTS (what to ask to change), 7) RISK LEVEL (Low/Medium/High) with explanation. Note: this is educational analysis not legal advice.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setLeResult(d.response||d.content||d.error);}catch(e:any){setLeResult(e.message);}setLeLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{leLoading?'Analyzing...':'Decode This Document'}</button>
      </div>
      {leResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{leResult}</div>}
    </div>
  );
}

export function ForgeTab_productlaunch95() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [plProduct, setPlProduct] = React.useState('');
  const [plDate, setPlDate] = React.useState('');
  const [plChannels, setPlChannels] = React.useState('');
  const [plResult, setPlResult] = React.useState('');
  const [plLoading, setPlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🚀 Product Launch Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete go-to-market launch plan with timelines, content, and execution steps.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="What are you launching? (product, feature, app, service — include target user and key benefit)" value={plProduct} onChange={e=>setPlProduct(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Launch date or timeline (e.g. 4 weeks, specific date)" value={plDate} onChange={e=>setPlDate(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Available channels (Twitter, ProductHunt, email list, LinkedIn, press)" value={plChannels} onChange={e=>setPlChannels(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!plProduct)return;setPlLoading(true);setPlResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Create a complete product launch plan for: '+plProduct+'. Timeline: '+(plDate||'4 weeks')+'. Channels: '+(plChannels||'social media, email')+'. Include: 1) PRE-LAUNCH (week-by-week: teaser strategy, waitlist building, influencer outreach), 2) LAUNCH DAY checklist (hour by hour), 3) POST-LAUNCH (first 30 days: retention, PR, community), 4) CONTENT CALENDAR (what to post, when, on which channel), 5) SUCCESS METRICS (what defines a successful launch), 6) CONTINGENCY PLAN (if launch underperforms).',model:'claude-3-5-haiku-20241022'})});const d=await r.json();const out=d.response||d.content||d.error;setPlResult(out);saveToolHistory('productlaunch95','Product Launch Planner',{product:plProduct.slice(0,200),date:plDate,channels:plChannels},out?.slice(0,500)||'');}catch(e:any){setPlResult(e.message);}setPlLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{plLoading?'Planning...':'Build Launch Plan'}</button>
      </div>
      {plResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{plResult}</div>}
    </div>
  );
}

export function ForgeTab_energyaudit95() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [eaSchedule, setEaSchedule] = React.useState('');
  const [eaLow, setEaLow] = React.useState('');
  const [eaGoal, setEaGoal] = React.useState('');
  const [eaResult, setEaResult] = React.useState('');
  const [eaLoading, setEaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚡ Energy Audit</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Identify your energy drains, find your peak hours, and redesign your day for max output.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your typical day (wake time, work blocks, meals, exercise, sleep)" value={eaSchedule} onChange={e=>setEaSchedule(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <textarea placeholder="When do you feel lowest energy? What tasks drain you most?" value={eaLow} onChange={e=>setEaLow(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Main goal (more focus, less fatigue, better sleep, higher output)" value={eaGoal} onChange={e=>setEaGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!eaSchedule)return;setEaLoading(true);setEaResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Perform a complete energy audit. Schedule: '+eaSchedule+'. Energy drains: '+(eaLow||'unspecified')+'. Goal: '+(eaGoal||'more focus and output')+'. Provide: 1) ENERGY PATTERN DIAGNOSIS (chronotype, ultradian rhythm analysis), 2) TOP 5 ENERGY DRAINS identified, 3) YOUR PEAK PERFORMANCE WINDOW (when to do deep work), 4) REDESIGNED DAILY SCHEDULE (hour by hour), 5) 3 QUICK ENERGY FIXES (implement today), 6) NUTRITION TIMING for sustained energy, 7) RECOVERY PROTOCOL.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setEaResult(d.response||d.content||d.error);}catch(e:any){setEaResult(e.message);}setEaLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{eaLoading?'Auditing...':'Run Energy Audit'}</button>
      </div>
      {eaResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{eaResult}</div>}
    </div>
  );
}

export function ForgeTab_jobscout96() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [jsRole, setJsRole] = React.useState('');
  const [jsLevel, setJsLevel] = React.useState('');
  const [jsSkills, setJsSkills] = React.useState('');
  const [jsResult, setJsResult] = React.useState('');
  const [jsLoading, setJsLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎯 Job Scout</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get a tailored job search strategy, application materials checklist, and outreach scripts for your target role.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Target role (e.g. Senior Product Manager, ML Engineer, Head of Growth)" value={jsRole} onChange={e=>setJsRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Experience level (entry, mid, senior, lead, exec)" value={jsLevel} onChange={e=>setJsLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Your current skills, background, and what makes you unique" value={jsSkills} onChange={e=>setJsSkills(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <button onClick={async()=>{if(!jsRole)return;setJsLoading(true);setJsResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Create a complete job search strategy for: '+jsRole+'. Level: '+(jsLevel||'mid')+'. Background: '+(jsSkills||'not provided')+'. Include: 1) WHERE TO LOOK (top job boards, communities, newsletters for this role), 2) KEYWORD STRATEGY (exact search terms and filters to use), 3) COMPANY TARGETS (types of companies to prioritize), 4) RESUME BULLETS (5 achievement-focused bullets for this role), 5) LINKEDIN HEADLINE (3 options), 6) COLD OUTREACH SCRIPT (DM to hiring manager or recruiter), 7) INTERVIEW PREP (top 5 questions with answer frameworks), 8) 30-DAY ACTION PLAN.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setJsResult(d.response||d.content||d.error);}catch(e:any){setJsResult(e.message);}setJsLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{jsLoading?'Scouting...':'Build Job Search Strategy'}</button>
      </div>
      {jsResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{jsResult}</div>}
    </div>
  );
}

export function ForgeTab_newsletterarch96() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [naTopic, setNaTopic] = React.useState('');
  const [naAudience, setNaAudience] = React.useState('');
  const [naFreq, setNaFreq] = React.useState('');
  const [naResult, setNaResult] = React.useState('');
  const [naLoading, setNaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📰 Newsletter Architect</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a profitable newsletter strategy with content pillars, monetization, and growth playbook.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Newsletter topic/niche (what it covers, your unique angle)" value={naTopic} onChange={e=>setNaTopic(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Target audience (who subscribes, their job/interests/pain points)" value={naAudience} onChange={e=>setNaAudience(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Frequency (daily, weekly, biweekly)" value={naFreq} onChange={e=>setNaFreq(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!naTopic)return;setNaLoading(true);setNaResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Design a complete newsletter business for: '+naTopic+'. Audience: '+(naAudience||'professionals')+'. Frequency: '+(naFreq||'weekly')+'. Include: 1) NEWSLETTER NAME IDEAS (5 options with rationale), 2) CONTENT PILLARS (4-5 recurring sections per issue), 3) SAMPLE ISSUE OUTLINE (exactly what goes in issue #1), 4) SUBJECT LINE FORMULAS (5 proven templates), 5) GROWTH CHANNELS (ranked by ROI for this niche), 6) MONETIZATION ROADMAP (0-1000-10000 subscribers), 7) SPONSORSHIP PITCH TEMPLATE, 8) 90-DAY LAUNCH PLAN.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setNaResult(d.response||d.content||d.error);}catch(e:any){setNaResult(e.message);}setNaLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{naLoading?'Architecting...':'Design Newsletter Strategy'}</button>
      </div>
      {naResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{naResult}</div>}
    </div>
  );
}
