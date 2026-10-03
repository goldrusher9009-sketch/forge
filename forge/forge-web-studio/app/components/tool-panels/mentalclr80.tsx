'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_mentalclr80() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mcFog, setMcFog] = React.useState('');
  const [mcSleep, setMcSleep] = React.useState('');
  const [mcDiet, setMcDiet] = React.useState('');
  const [mcStress, setMcStress] = React.useState('');
  const [mcResult, setMcResult] = React.useState('');
  const [mcLoading, setMcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>☁️ Mental Clarity Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Clear brain fog and unlock sharp, sustained cognitive performance.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your brain fog (when it happens, how it feels)" value={mcFog} onChange={e=>setMcFog(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Sleep quality (hours, quality, consistency)" value={mcSleep} onChange={e=>setMcSleep(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Diet style (keto, standard, vegetarian, lots of sugar...)" value={mcDiet} onChange={e=>setMcDiet(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Stress level (low/medium/high)" value={mcStress} onChange={e=>setMcStress(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mcFog)return;setMcLoading(true);setMcResult('');try{const r=await fetch(`${''}/api/mentalclarity/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({fog_description:mcFog,sleep:mcSleep,diet:mcDiet,stress:mcStress})});const d=await r.json();setMcResult(d.recommendations||d.error);}catch(e:any){setMcResult(e.message);}setMcLoading(false);}} disabled={mcLoading||!mcFog} style={{padding:'0.75rem',borderRadius:'8px',background:'#2c3e50',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {mcLoading?'Coaching...':'Clear My Brain Fog ☁️'}
        </button>
      </div>
      {mcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mcResult}</div>}
    </div>
  );
}

export function ForgeTab_peakstate80() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [psGoals, setPsGoals] = React.useState('');
  const [psCurrent, setPsCurrent] = React.useState('');
  const [psChron, setPsChron] = React.useState('');
  const [psChal, setPsChal] = React.useState('');
  const [psResult, setPsResult] = React.useState('');
  const [psLoading, setPsLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚡ Peak State Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a personalized protocol to consistently access your peak performance state.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Performance goals (creative flow, athletic, cognitive peak...)" value={psGoals} onChange={e=>setPsGoals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current energy/performance level (1-10)" value={psCurrent} onChange={e=>setPsCurrent(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Chronotype (morning lark, night owl, intermediate)" value={psChron} onChange={e=>setPsChron(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Main performance challenges" value={psChal} onChange={e=>setPsChal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!psGoals)return;setPsLoading(true);setPsResult('');try{const r=await fetch(`${''}/api/peakstate/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goals:psGoals,current_state:psCurrent,chronotype:psChron,challenges:psChal})});const d=await r.json();setPsResult(d.protocol||d.error);}catch(e:any){setPsResult(e.message);}setPsLoading(false);}} disabled={psLoading||!psGoals} style={{padding:'0.75rem',borderRadius:'8px',background:'#e67e22',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {psLoading?'Designing...':'Design My Peak Protocol ⚡'}
        </button>
      </div>
      {psResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{psResult}</div>}
    </div>
  );
}

export function ForgeTab_empathy81() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [emSit, setEmSit] = React.useState('');
  const [emView, setEmView] = React.useState('');
  const [emOther, setEmOther] = React.useState('');
  const [emResult, setEmResult] = React.useState('');
  const [emLoading, setEmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💚 Empathy Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Understand any person\'s perspective deeply and craft empathic responses.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the situation" value={emSit} onChange={e=>setEmSit(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your current view / feelings" value={emView} onChange={e=>setEmView(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Who is the other person (role, relationship)" value={emOther} onChange={e=>setEmOther(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!emSit)return;setEmLoading(true);setEmResult('');try{const r=await fetch(`${''}/api/empathy/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:emSit,your_view:emView,other_person:emOther})});const d=await r.json();setEmResult(d.response||d.error);}catch(e:any){setEmResult(e.message);}setEmLoading(false);}} disabled={emLoading||!emSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {emLoading?'Analyzing...':'Build Empathy 💚'}
        </button>
      </div>
      {emResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{emResult}</div>}
    </div>
  );
}

export function ForgeTab_smalltalk81() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [stCtx, setStCtx] = React.useState('');
  const [stGoal, setStGoal] = React.useState('');
  const [stAnx, setStAnx] = React.useState('');
  const [stResult, setStResult] = React.useState('');
  const [stLoading, setStLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🗣️ Small Talk Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Master conversation starters, topic bridges, and graceful exits for any social situation.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Context (networking event, party, work meeting...)" value={stCtx} onChange={e=>setStCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Goal (make friends, impress clients, feel comfortable)" value={stGoal} onChange={e=>setStGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Social anxiety level (low/medium/high)" value={stAnx} onChange={e=>setStAnx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!stCtx)return;setStLoading(true);setStResult('');try{const r=await fetch(`${''}/api/smalltalk/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({context:stCtx,goal:stGoal,anxiety_level:stAnx})});const d=await r.json();setStResult(d.scripts||d.error);}catch(e:any){setStResult(e.message);}setStLoading(false);}} disabled={stLoading||!stCtx} style={{padding:'0.75rem',borderRadius:'8px',background:'#2980b9',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {stLoading?'Coaching...':'Get My Conversation Toolkit 🗣️'}
        </button>
      </div>
      {stResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{stResult}</div>}
    </div>
  );
}

export function ForgeTab_lovelang81() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [llBeh, setLlBeh] = React.useState('');
  const [llType, setLlType] = React.useState('');
  const [llComp, setLlComp] = React.useState('');
  const [llResult, setLlResult] = React.useState('');
  const [llLoading, setLlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>❤️ Love Language Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Decode love languages to deepen connection and resolve relationship friction.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Behaviors you\'ve observed (how they show/seek love)" value={llBeh} onChange={e=>setLlBeh(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Relationship type (romantic, friendship, family, colleague)" value={llType} onChange={e=>setLlType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current friction or complaints" value={llComp} onChange={e=>setLlComp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!llBeh)return;setLlLoading(true);setLlResult('');try{const r=await fetch(`${''}/api/lovelanguage/analyze`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({behaviors:llBeh,relationship_type:llType,complaints:llComp})});const d=await r.json();setLlResult(d.analysis||d.error);}catch(e:any){setLlResult(e.message);}setLlLoading(false);}} disabled={llLoading||!llBeh} style={{padding:'0.75rem',borderRadius:'8px',background:'#c0392b',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {llLoading?'Analyzing...':'Decode Love Languages ❤️'}
        </button>
      </div>
      {llResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{llResult}</div>}
    </div>
  );
}

export function ForgeTab_relaudit81() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [raType, setRaType] = React.useState('');
  const [raDyn, setRaDyn] = React.useState('');
  const [raWorks, setRaWorks] = React.useState('');
  const [raDoesnt, setRaDoesnt] = React.useState('');
  const [raResult, setRaResult] = React.useState('');
  const [raLoading, setRaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔎 Relationship Auditor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get an honest health assessment of any relationship with a clear improvement plan.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Relationship type (romantic, friendship, family, work)" value={raType} onChange={e=>setRaType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Describe the dynamics and patterns" value={raDyn} onChange={e=>setRaDyn(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="What works well" value={raWorks} onChange={e=>setRaWorks(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="What isn\'t working" value={raDoesnt} onChange={e=>setRaDoesnt(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!raType||!raDyn)return;setRaLoading(true);setRaResult('');try{const r=await fetch(`${''}/api/relationship/audit`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({relationship_type:raType,dynamics:raDyn,what_works:raWorks,what_doesnt:raDoesnt})});const d=await r.json();setRaResult(d.audit||d.error);}catch(e:any){setRaResult(e.message);}setRaLoading(false);}} disabled={raLoading||!raType} style={{padding:'0.75rem',borderRadius:'8px',background:'#7d3c98',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {raLoading?'Auditing...':'Audit This Relationship 🔎'}
        </button>
      </div>
      {raResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{raResult}</div>}
    </div>
  );
}

export function ForgeTab_diffconv81() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dcTopic, setDcTopic] = React.useState('');
  const [dcRel, setDcRel] = React.useState('');
  const [dcOutcome, setDcOutcome] = React.useState('');
  const [dcFears, setDcFears] = React.useState('');
  const [dcResult, setDcResult] = React.useState('');
  const [dcLoading, setDcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💭 Difficult Conversation Guide</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get a full script and strategy for any hard conversation you\'ve been avoiding.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="What\'s the conversation about?" value={dcTopic} onChange={e=>setDcTopic(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your relationship with this person" value={dcRel} onChange={e=>setDcRel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Desired outcome" value={dcOutcome} onChange={e=>setDcOutcome(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="What you\'re afraid will happen" value={dcFears} onChange={e=>setDcFears(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!dcTopic||!dcRel)return;setDcLoading(true);setDcResult('');try{const r=await fetch(`${''}/api/difficultconv/guide`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({topic:dcTopic,relationship:dcRel,desired_outcome:dcOutcome,fears:dcFears})});const d=await r.json();setDcResult(d.script||d.error);}catch(e:any){setDcResult(e.message);}setDcLoading(false);}} disabled={dcLoading||!dcTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {dcLoading?'Preparing...':'Get My Conversation Script 💭'}
        </button>
      </div>
      {dcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{dcResult}</div>}
    </div>
  );
}

export function ForgeTab_sopgen82() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [sgProc, setSgProc] = React.useState('');
  const [sgDept, setSgDept] = React.useState('');
  const [sgFreq, setSgFreq] = React.useState('');
  const [sgResult, setSgResult] = React.useState('');
  const [sgLoading, setSgLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📋 SOP Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate professional Standard Operating Procedures with RACI, decision points, and quality checks.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the process (e.g. onboarding a new employee, handling a customer refund)" value={sgProc} onChange={e=>setSgProc(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Department (HR, Operations, Sales, Customer Success...)" value={sgDept} onChange={e=>setSgDept(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Frequency (daily, weekly, as-needed)" value={sgFreq} onChange={e=>setSgFreq(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!sgProc)return;setSgLoading(true);setSgResult('');try{const r=await fetch(`${''}/api/sop/generate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({process:sgProc,department:sgDept,frequency:sgFreq})});const d=await r.json();setSgResult(d.sop||d.error);}catch(e:any){setSgResult(e.message);}setSgLoading(false);}} disabled={sgLoading||!sgProc} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {sgLoading?'Generating...':'Generate SOP 📋'}
        </button>
      </div>
      {sgResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{sgResult}</div>}
    </div>
  );
}

export function ForgeTab_kpidesign82() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [kdRole, setKdRole] = React.useState('');
  const [kdGoals, setKdGoals] = React.useState('');
  const [kdTeam, setKdTeam] = React.useState('');
  const [kdResult, setKdResult] = React.useState('');
  const [kdLoading, setKdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📊 KPI Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a meaningful KPI framework with leading and lagging indicators and a review cadence.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Role (e.g. Sales Manager, Head of Product, CEO)" value={kdRole} onChange={e=>setKdRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Key business goals for this role" value={kdGoals} onChange={e=>setKdGoals(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Team size (individual, 5, 20, 100+)" value={kdTeam} onChange={e=>setKdTeam(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!kdRole||!kdGoals)return;setKdLoading(true);setKdResult('');try{const r=await fetch(`${''}/api/kpi/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({role:kdRole,goals:kdGoals,team_size:kdTeam})});const d=await r.json();setKdResult(d.kpis||d.error);}catch(e:any){setKdResult(e.message);}setKdLoading(false);}} disabled={kdLoading||!kdRole} style={{padding:'0.75rem',borderRadius:'8px',background:'#117a65',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {kdLoading?'Designing...':'Design My KPIs 📊'}
        </button>
      </div>
      {kdResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{kdResult}</div>}
    </div>
  );
}

export function ForgeTab_meetdesign82() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mdPurp, setMdPurp] = React.useState('');
  const [mdAtt, setMdAtt] = React.useState('');
  const [mdDur, setMdDur] = React.useState('');
  const [mdRec, setMdRec] = React.useState('');
  const [mdResult, setMdResult] = React.useState('');
  const [mdLoading, setMdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🗓️ Meeting Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design meetings that actually get results — with timed agendas and facilitation scripts.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Meeting purpose (e.g. Q3 planning, retrospective, decision on X)" value={mdPurp} onChange={e=>setMdPurp(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Attendees and their roles" value={mdAtt} onChange={e=>setMdAtt(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Duration (30 min, 60 min, half day)" value={mdDur} onChange={e=>setMdDur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Recurring? (one-time, weekly, monthly)" value={mdRec} onChange={e=>setMdRec(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mdPurp)return;setMdLoading(true);setMdResult('');try{const r=await fetch(`${''}/api/meeting/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({purpose:mdPurp,attendees:mdAtt,duration:mdDur,recurring:mdRec})});const d=await r.json();setMdResult(d.design||d.error);}catch(e:any){setMdResult(e.message);}setMdLoading(false);}} disabled={mdLoading||!mdPurp} style={{padding:'0.75rem',borderRadius:'8px',background:'#6c3483',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {mdLoading?'Designing...':'Design This Meeting 🗓️'}
        </button>
      </div>
      {mdResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mdResult}</div>}
    </div>
  );
}

export function ForgeTab_delegcoach82() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dlTasks, setDlTasks] = React.useState('');
  const [dlTeam, setDlTeam] = React.useState('');
  const [dlStrug, setDlStrug] = React.useState('');
  const [dlResult, setDlResult] = React.useState('');
  const [dlLoading, setDlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🤝 Delegation Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Stop doing everything yourself — build a delegation system that multiplies your output.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Tasks you\'re currently doing that could be delegated" value={dlTasks} onChange={e=>setDlTasks(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your team (size, roles, skill levels)" value={dlTeam} onChange={e=>setDlTeam(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current delegation struggles" value={dlStrug} onChange={e=>setDlStrug(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!dlTasks)return;setDlLoading(true);setDlResult('');try{const r=await fetch(`${''}/api/delegation/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({tasks:dlTasks,team_description:dlTeam,current_struggles:dlStrug})});const d=await r.json();setDlResult(d.plan||d.error);}catch(e:any){setDlResult(e.message);}setDlLoading(false);}} disabled={dlLoading||!dlTasks} style={{padding:'0.75rem',borderRadius:'8px',background:'#2e86c1',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {dlLoading?'Coaching...':'Build My Delegation Plan 🤝'}
        </button>
      </div>
      {dlResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{dlResult}</div>}
    </div>
  );
}

export function ForgeTab_wfoptim82() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wfCur, setWfCur] = React.useState('');
  const [wfPain, setWfPain] = React.useState('');
  const [wfGoal, setWfGoal] = React.useState('');
  const [wfResult, setWfResult] = React.useState('');
  const [wfLoading, setWfLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚙️ Workflow Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Eliminate bottlenecks, reduce waste, and redesign your workflow for peak efficiency.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your current workflow step-by-step" value={wfCur} onChange={e=>setWfCur(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Pain points (slow, error-prone, too many handoffs...)" value={wfPain} onChange={e=>setWfPain(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Optimization goal (speed, accuracy, cost, scale)" value={wfGoal} onChange={e=>setWfGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!wfCur)return;setWfLoading(true);setWfResult('');try{const r=await fetch(`${''}/api/workflow/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_workflow:wfCur,pain_points:wfPain,goal:wfGoal})});const d=await r.json();setWfResult(d.optimization||d.error);}catch(e:any){setWfResult(e.message);}setWfLoading(false);}} disabled={wfLoading||!wfCur} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {wfLoading?'Optimizing...':'Optimize My Workflow ⚙️'}
        </button>
      </div>
      {wfResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{wfResult}</div>}
    </div>
  );
}

export function ForgeTab_longev83() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lvAge, setLvAge] = React.useState('');
  const [lvHabits, setLvHabits] = React.useState('');
  const [lvGoals, setLvGoals] = React.useState('');
  const [lvFamily, setLvFamily] = React.useState('');
  const [lvResult, setLvResult] = React.useState('');
  const [lvLoading, setLvLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧬 Longevity Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Science-backed longevity roadmap (educational — consult your doctor for medical decisions).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Current age" value={lvAge} onChange={e=>setLvAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current health habits (exercise, diet, sleep)" value={lvHabits} onChange={e=>setLvHabits(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Health goals (live to 100, stay sharp, more energy...)" value={lvGoals} onChange={e=>setLvGoals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Family health history (optional)" value={lvFamily} onChange={e=>setLvFamily(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!lvAge||!lvGoals)return;setLvLoading(true);setLvResult('');try{const r=await fetch(`${''}/api/longevity/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({age:lvAge,current_habits:lvHabits,health_goals:lvGoals,family_history:lvFamily})});const d=await r.json();setLvResult(d.plan||d.error);}catch(e:any){setLvResult(e.message);}setLvLoading(false);}} disabled={lvLoading||!lvAge} style={{padding:'0.75rem',borderRadius:'8px',background:'#117a65',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {lvLoading?'Planning...':'Build My Longevity Plan 🧬'}
        </button>
      </div>
      {lvResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{lvResult}</div>}
    </div>
  );
}

export function ForgeTab_vo2max83() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [v2Fit, setV2Fit] = React.useState('');
  const [v2Sport, setV2Sport] = React.useState('');
  const [v2Time, setV2Time] = React.useState('');
  const [v2Result, setV2Result] = React.useState('');
  const [v2Loading, setV2Loading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🫁 VO2max Trainer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Scientifically boost your cardiovascular fitness with a periodized VO2max training plan.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Current fitness level (beginner/intermediate/advanced)" value={v2Fit} onChange={e=>setV2Fit(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Sport/activity (running, cycling, rowing...)" value={v2Sport} onChange={e=>setV2Sport(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Time available per week (e.g. 5 hours)" value={v2Time} onChange={e=>setV2Time(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!v2Fit)return;setV2Loading(true);setV2Result('');try{const r=await fetch(`${''}/api/vo2max/train`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_fitness:v2Fit,sport:v2Sport,time_available:v2Time})});const d=await r.json();setV2Result(d.plan||d.error);}catch(e:any){setV2Result(e.message);}setV2Loading(false);}} disabled={v2Loading||!v2Fit} style={{padding:'0.75rem',borderRadius:'8px',background:'#e74c3c',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {v2Loading?'Building...':'Build My VO2max Plan 🫁'}
        </button>
      </div>
      {v2Result&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{v2Result}</div>}
    </div>
  );
}

export function ForgeTab_stressdec83() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [sdSymp, setSdSymp] = React.useState('');
  const [sdTrig, setSdTrig] = React.useState('');
  const [sdDur, setSdDur] = React.useState('');
  const [sdResult, setSdResult] = React.useState('');
  const [sdLoading, setSdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌡️ Stress Decoder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Decode your stress patterns and get a science-backed resilience protocol (not medical advice).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Physical and mental symptoms you\'re experiencing" value={sdSymp} onChange={e=>setSdSymp(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Known triggers" value={sdTrig} onChange={e=>setSdTrig(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="How long you\'ve been stressed (weeks, months, years)" value={sdDur} onChange={e=>setSdDur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!sdSymp)return;setSdLoading(true);setSdResult('');try{const r=await fetch(`${''}/api/stress/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({symptoms:sdSymp,triggers:sdTrig,duration:sdDur})});const d=await r.json();setSdResult(d.analysis||d.error);}catch(e:any){setSdResult(e.message);}setSdLoading(false);}} disabled={sdLoading||!sdSymp} style={{padding:'0.75rem',borderRadius:'8px',background:'#8e44ad',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {sdLoading?'Decoding...':'Decode My Stress 🌡️'}
        </button>
      </div>
      {sdResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{sdResult}</div>}
    </div>
  );
}

export function ForgeTab_recovopt83() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [roAct, setRoAct] = React.useState('');
  const [roSore, setRoSore] = React.useState('');
  const [roCur, setRoCur] = React.useState('');
  const [roResult, setRoResult] = React.useState('');
  const [roLoading, setRoLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💪 Recovery Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Maximize recovery between sessions with an evidence-based protocol.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Activity you\'re recovering from (lifting, marathon, HIIT...)" value={roAct} onChange={e=>setRoAct(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Soreness/fatigue level (1-10)" value={roSore} onChange={e=>setRoSore(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current recovery methods" value={roCur} onChange={e=>setRoCur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!roAct)return;setRoLoading(true);setRoResult('');try{const r=await fetch(`${''}/api/recovery/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({activity:roAct,soreness_level:roSore,current_recovery:roCur})});const d=await r.json();setRoResult(d.protocol||d.error);}catch(e:any){setRoResult(e.message);}setRoLoading(false);}} disabled={roLoading||!roAct} style={{padding:'0.75rem',borderRadius:'8px',background:'#2e86c1',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {roLoading?'Optimizing...':'Optimize My Recovery 💪'}
        </button>
      </div>
      {roResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{roResult}</div>}
    </div>
  );
}

export function ForgeTab_suppstack83() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ssGoals, setSsGoals] = React.useState('');
  const [ssCond, setSsCond] = React.useState('');
  const [ssCur, setSsCur] = React.useState('');
  const [ssResult, setSsResult] = React.useState('');
  const [ssLoading, setSsLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💊 Supplement Stack Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Educational supplement guide based on current research — always consult your doctor before starting.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Goals (energy, muscle, cognitive, longevity, sleep...)" value={ssGoals} onChange={e=>setSsGoals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Health conditions to consider (optional)" value={ssCond} onChange={e=>setSsCond(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current supplements you\'re taking" value={ssCur} onChange={e=>setSsCur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ssGoals)return;setSsLoading(true);setSsResult('');try{const r=await fetch(`${''}/api/supplement/stack`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goals:ssGoals,conditions:ssCond,current_supplements:ssCur})});const d=await r.json();setSsResult(d.stack||d.error);}catch(e:any){setSsResult(e.message);}setSsLoading(false);}} disabled={ssLoading||!ssGoals} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ssLoading?'Building...':'Build My Supplement Stack 💊'}
        </button>
      </div>
      {ssResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ssResult}</div>}
    </div>
  );
}

export function ForgeTab_parentcoach84() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pcAge, setPcAge] = React.useState('');
  const [pcChall, setPcChall] = React.useState('');
  const [pcStyle, setPcStyle] = React.useState('');
  const [pcResult, setPcResult] = React.useState('');
  const [pcLoading, setPcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>👨‍👩‍👧 Parenting Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Evidence-based guidance for any parenting challenge, with exact scripts and strategies.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Child\'s age" value={pcAge} onChange={e=>setPcAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Parenting challenge you\'re facing" value={pcChall} onChange={e=>setPcChall(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your parenting style (gentle, authoritative, strict...)" value={pcStyle} onChange={e=>setPcStyle(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!pcAge||!pcChall)return;setPcLoading(true);setPcResult('');try{const r=await fetch(`${''}/api/parenting/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({child_age:pcAge,challenge:pcChall,parenting_style:pcStyle})});const d=await r.json();setPcResult(d.advice||d.error);}catch(e:any){setPcResult(e.message);}setPcLoading(false);}} disabled={pcLoading||!pcAge||!pcChall} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {pcLoading?'Coaching...':'Get Parenting Guidance 👨‍👩‍👧'}
        </button>
      </div>
      {pcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pcResult}</div>}
    </div>
  );
}

export function ForgeTab_fammeet84() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fmSize, setFmSize] = React.useState('');
  const [fmTopic, setFmTopic] = React.useState('');
  const [fmConflict, setFmConflict] = React.useState('');
  const [fmResult, setFmResult] = React.useState('');
  const [fmLoading, setFmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🏠 Family Meeting Facilitator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn family meetings from dread into meaningful connection with a structured facilitation plan.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Family size and ages" value={fmSize} onChange={e=>setFmSize(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Purpose of this meeting" value={fmTopic} onChange={e=>setFmTopic(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Any conflicts or tension to address" value={fmConflict} onChange={e=>setFmConflict(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!fmTopic)return;setFmLoading(true);setFmResult('');try{const r=await fetch(`${''}/api/familymeeting/facilitate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({family_size:fmSize,topic:fmTopic,family_conflict:fmConflict})});const d=await r.json();setFmResult(d.outcome||d.error);}catch(e:any){setFmResult(e.message);}setFmLoading(false);}} disabled={fmLoading||!fmTopic} style={{padding:'0.75rem',borderRadius:'8px',background:'#e67e22',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {fmLoading?'Planning...':'Facilitate Family Meeting 🏠'}
        </button>
      </div>
      {fmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{fmResult}</div>}
    </div>
  );
}

export function ForgeTab_teencomm84() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tcSit, setTcSit] = React.useState('');
  const [tcAge, setTcAge] = React.useState('');
  const [tcCon, setTcCon] = React.useState('');
  const [tcResult, setTcResult] = React.useState('');
  const [tcLoading, setTcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧑 Teen Communicator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Bridge the parent-teen gap with scripts that actually open dialogue instead of shutting it down.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Situation with your teen" value={tcSit} onChange={e=>setTcSit(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Teen\'s age" value={tcAge} onChange={e=>setTcAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your main concern" value={tcCon} onChange={e=>setTcCon(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!tcSit)return;setTcLoading(true);setTcResult('');try{const r=await fetch(`${''}/api/teen/communicate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:tcSit,teen_age:tcAge,your_concern:tcCon})});const d=await r.json();setTcResult(d.script||d.error);}catch(e:any){setTcResult(e.message);}setTcLoading(false);}} disabled={tcLoading||!tcSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#8e44ad',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {tcLoading?'Crafting...':'Get Teen Communication Script 🧑'}
        </button>
      </div>
      {tcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{tcResult}</div>}
    </div>
  );
}

export function ForgeTab_screentime84() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [stAge, setStAge] = React.useState('');
  const [stUsage, setStUsage] = React.useState('');
  const [stCon, setStCon] = React.useState('');
  const [stResult, setStResult] = React.useState('');
  const [stLoading, setStLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📱 Screen Time Manager</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create a healthy digital wellness plan your kids will actually accept.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Child\'s age" value={stAge} onChange={e=>setStAge(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current screen time usage (hours/day, types of content)" value={stUsage} onChange={e=>setStUsage(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Specific concerns (sleep, behavior, social media, gaming)" value={stCon} onChange={e=>setStCon(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!stAge)return;setStLoading(true);setStResult('');try{const r=await fetch(`${''}/api/screentime/manage`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({child_age:stAge,current_usage:stUsage,concerns:stCon})});const d=await r.json();setStResult(d.plan||d.error);}catch(e:any){setStResult(e.message);}setStLoading(false);}} disabled={stLoading||!stAge} style={{padding:'0.75rem',borderRadius:'8px',background:'#2980b9',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {stLoading?'Planning...':'Create Screen Time Plan 📱'}
        </button>
      </div>
      {stResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{stResult}</div>}
    </div>
  );
}

export function ForgeTab_famval84() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fvDesc, setFvDesc] = React.useState('');
  const [fvGoal, setFvGoal] = React.useState('');
  const [fvAges, setFvAges] = React.useState('');
  const [fvResult, setFvResult] = React.useState('');
  const [fvLoading, setFvLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌟 Family Values Charter</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create a living family charter that gives your children identity, purpose, and direction.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your family (culture, background, structure)" value={fvDesc} onChange={e=>setFvDesc(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="What matters most to your family" value={fvGoal} onChange={e=>setFvGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Children\'s ages" value={fvAges} onChange={e=>setFvAges(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!fvDesc||!fvGoal)return;setFvLoading(true);setFvResult('');try{const r=await fetch(`${''}/api/familyvalues/set`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({family_description:fvDesc,values_goal:fvGoal,children_ages:fvAges})});const d=await r.json();setFvResult(d.charter||d.error);}catch(e:any){setFvResult(e.message);}setFvLoading(false);}} disabled={fvLoading||!fvDesc} style={{padding:'0.75rem',borderRadius:'8px',background:'#d4ac0d',color:'#000',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {fvLoading?'Creating...':'Create Our Family Charter 🌟'}
        </button>
      </div>
      {fvResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{fvResult}</div>}
    </div>
  );
}

export function ForgeTab_rightsexp85() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [reSit, setReSit] = React.useState('');
  const [reJur, setReJur] = React.useState('');
  const [reResult, setReResult] = React.useState('');
  const [reLoading, setReLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚖️ Rights Explainer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Understand your legal rights in plain English (educational only — consult an attorney for your situation).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your situation (e.g. fired without warning, neighbor dispute, discrimination)" value={reSit} onChange={e=>setReSit(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Location (state/country, e.g. California, USA)" value={reJur} onChange={e=>setReJur(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!reSit)return;setReLoading(true);setReResult('');try{const r=await fetch(`${''}/api/rights/explain`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:reSit,jurisdiction:reJur})});const d=await r.json();setReResult(d.explanation||d.error);}catch(e:any){setReResult(e.message);}setReLoading(false);}} disabled={reLoading||!reSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {reLoading?'Explaining...':'Explain My Rights ⚖️'}
        </button>
      </div>
      {reResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{reResult}</div>}
    </div>
  );
}

export function ForgeTab_demandltr85() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dlDisp, setDlDisp] = React.useState('');
  const [dlAmt, setDlAmt] = React.useState('');
  const [dlRec, setDlRec] = React.useState('');
  const [dlDead, setDlDead] = React.useState('');
  const [dlResult, setDlResult] = React.useState('');
  const [dlLoading, setDlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📨 Demand Letter Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Draft a firm, professional demand letter (template — have an attorney review before sending).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the dispute (what happened, what\'s owed)" value={dlDisp} onChange={e=>setDlDisp(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Amount or remedy sought (e.g. $2,500 refund)" value={dlAmt} onChange={e=>setDlAmt(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Recipient (company name, person\'s role)" value={dlRec} onChange={e=>setDlRec(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Response deadline (e.g. 30 days)" value={dlDead} onChange={e=>setDlDead(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!dlDisp||!dlAmt)return;setDlLoading(true);setDlResult('');try{const r=await fetch(`${''}/api/demandletter/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({dispute:dlDisp,amount:dlAmt,recipient:dlRec,deadline:dlDead})});const d=await r.json();setDlResult(d.letter||d.error);}catch(e:any){setDlResult(e.message);}setDlLoading(false);}} disabled={dlLoading||!dlDisp} style={{padding:'0.75rem',borderRadius:'8px',background:'#922b21',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {dlLoading?'Drafting...':'Draft Demand Letter 📨'}
        </button>
      </div>
      {dlResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{dlResult}</div>}
    </div>
  );
}

export function ForgeTab_contrdec85() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cdClause, setCdClause] = React.useState('');
  const [cdType, setCdType] = React.useState('');
  const [cdResult, setCdResult] = React.useState('');
  const [cdLoading, setCdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔍 Contract Clause Decoder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Understand confusing contract language in plain English (not legal advice).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Paste the contract clause or confusing language" value={cdClause} onChange={e=>setCdClause(e.target.value)} rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Contract type (employment, lease, service agreement, NDA...)" value={cdType} onChange={e=>setCdType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!cdClause)return;setCdLoading(true);setCdResult('');try{const r=await fetch(`${''}/api/contract/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({clause:cdClause,contract_type:cdType})});const d=await r.json();setCdResult(d.explanation||d.error);}catch(e:any){setCdResult(e.message);}setCdLoading(false);}} disabled={cdLoading||!cdClause} style={{padding:'0.75rem',borderRadius:'8px',background:'#117a65',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {cdLoading?'Decoding...':'Decode This Clause 🔍'}
        </button>
      </div>
      {cdResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{cdResult}</div>}
    </div>
  );
}

export function ForgeTab_tenright85() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [trIssue, setTrIssue] = React.useState('');
  const [trState, setTrState] = React.useState('');
  const [trResult, setTrResult] = React.useState('');
  const [trLoading, setTrLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🏠 Tenant Rights Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Know your rights as a tenant and learn what steps to take (not legal advice — consult a local tenant rights org).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your landlord/tenant issue" value={trIssue} onChange={e=>setTrIssue(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="State or country" value={trState} onChange={e=>setTrState(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!trIssue)return;setTrLoading(true);setTrResult('');try{const r=await fetch(`${''}/api/tenantright/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({issue:trIssue,state:trState})});const d=await r.json();setTrResult(d.guidance||d.error);}catch(e:any){setTrResult(e.message);}setTrLoading(false);}} disabled={trLoading||!trIssue} style={{padding:'0.75rem',borderRadius:'8px',background:'#6c3483',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {trLoading?'Researching...':'Know My Tenant Rights 🏠'}
        </button>
      </div>
      {trResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{trResult}</div>}
    </div>
  );
}

export function ForgeTab_smclaim85() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [scDisp, setScDisp] = React.useState('');
  const [scAmt, setScAmt] = React.useState('');
  const [scState, setScState] = React.useState('');
  const [scResult, setScResult] = React.useState('');
  const [scLoading, setScLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🏛️ Small Claims Helper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Navigate small claims court step-by-step (educational — verify procedures with your local court).</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe your dispute" value={scDisp} onChange={e=>setScDisp(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Amount in dispute (e.g. $1,800)" value={scAmt} onChange={e=>setScAmt(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="State (small claims limits vary by state)" value={scState} onChange={e=>setScState(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!scDisp||!scAmt)return;setScLoading(true);setScResult('');try{const r=await fetch(`${''}/api/smallclaims/help`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({dispute:scDisp,amount:scAmt,state:scState})});const d=await r.json();setScResult(d.guide||d.error);}catch(e:any){setScResult(e.message);}setScLoading(false);}} disabled={scLoading||!scDisp} style={{padding:'0.75rem',borderRadius:'8px',background:'#2e86c1',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {scLoading?'Guiding...':'Guide Me Through Small Claims 🏛️'}
        </button>
      </div>
      {scResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{scResult}</div>}
    </div>
  );
}

export function ForgeTab_carbonfp86() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cfTrans, setCfTrans] = React.useState('');
  const [cfDiet, setCfDiet] = React.useState('');
  const [cfEnergy, setCfEnergy] = React.useState('');
  const [cfShop, setCfShop] = React.useState('');
  const [cfResult, setCfResult] = React.useState('');
  const [cfLoading, setCfLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌿 Carbon Footprint Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Estimate your carbon footprint and get a personalized reduction roadmap.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Transportation (car daily, fly monthly, public transit...)" value={cfTrans} onChange={e=>setCfTrans(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Diet (meat daily, vegetarian, vegan, flexitarian)" value={cfDiet} onChange={e=>setCfDiet(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Home energy (gas heat, electric, solar, size)" value={cfEnergy} onChange={e=>setCfEnergy(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Shopping habits (minimal, average, heavy consumer)" value={cfShop} onChange={e=>setCfShop(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setCfLoading(true);setCfResult('');try{const r=await fetch(`${''}/api/carbonfootprint/calculate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({transportation:cfTrans,diet:cfDiet,energy:cfEnergy,shopping:cfShop})});const d=await r.json();setCfResult(d.footprint||d.error);}catch(e:any){setCfResult(e.message);}setCfLoading(false);}} disabled={cfLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {cfLoading?'Calculating...':'Calculate My Carbon Footprint 🌿'}
        </button>
      </div>
      {cfResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{cfResult}</div>}
    </div>
  );
}

export function ForgeTab_sustliv86() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [slHab, setSlHab] = React.useState('');
  const [slBud, setSlBud] = React.useState('');
  const [slLiv, setSlLiv] = React.useState('');
  const [slResult, setSlResult] = React.useState('');
  const [slLoading, setSlLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>♻️ Sustainable Living Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build sustainable habits that are practical, affordable, and actually make a difference.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Current eco habits (what you already do)" value={slHab} onChange={e=>setSlHab(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Budget for sustainability upgrades" value={slBud} onChange={e=>setSlBud(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Living situation (apartment, house, city, suburb, rural)" value={slLiv} onChange={e=>setSlLiv(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setSlLoading(true);setSlResult('');try{const r=await fetch(`${''}/api/sustainable/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({current_habits:slHab,budget:slBud,living_situation:slLiv})});const d=await r.json();setSlResult(d.plan||d.error);}catch(e:any){setSlResult(e.message);}setSlLoading(false);}} disabled={slLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#117a65',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {slLoading?'Coaching...':'Get My Sustainability Plan ♻️'}
        </button>
      </div>
      {slResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{slResult}</div>}
    </div>
  );
}

export function ForgeTab_ecodiet86() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [edDiet, setEdDiet] = React.useState('');
  const [edRest, setEdRest] = React.useState('');
  const [edBud, setEdBud] = React.useState('');
  const [edResult, setEdResult] = React.useState('');
  const [edLoading, setEdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🥦 Eco Diet Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Eat for planetary health — reduce your food footprint without sacrificing taste or nutrition.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Current diet style (omnivore, vegetarian, keto...)" value={edDiet} onChange={e=>setEdDiet(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Dietary restrictions or allergies" value={edRest} onChange={e=>setEdRest(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Grocery budget (low/moderate/flexible)" value={edBud} onChange={e=>setEdBud(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!edDiet)return;setEdLoading(true);setEdResult('');try{const r=await fetch(`${''}/api/ecodiet/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({diet_style:edDiet,restrictions:edRest,budget:edBud})});const d=await r.json();setEdResult(d.plan||d.error);}catch(e:any){setEdResult(e.message);}setEdLoading(false);}} disabled={edLoading||!edDiet} style={{padding:'0.75rem',borderRadius:'8px',background:'#27ae60',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {edLoading?'Planning...':'Plan My Eco Diet 🥦'}
        </button>
      </div>
      {edResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{edResult}</div>}
    </div>
  );
}

export function ForgeTab_greenhome86() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ghType, setGhType] = React.useState('');
  const [ghEnergy, setGhEnergy] = React.useState('');
  const [ghBud, setGhBud] = React.useState('');
  const [ghResult, setGhResult] = React.useState('');
  const [ghLoading, setGhLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🏡 Green Home Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Make your home energy-efficient, eco-friendly, and cheaper to run.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Home type (apartment, house, condo, size)" value={ghType} onChange={e=>setGhType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Biggest energy uses (heating, AC, appliances, lighting)" value={ghEnergy} onChange={e=>setGhEnergy(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Investment budget (low/moderate/significant)" value={ghBud} onChange={e=>setGhBud(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ghType)return;setGhLoading(true);setGhResult('');try{const r=await fetch(`${''}/api/greenhome/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({home_type:ghType,biggest_energy_uses:ghEnergy,budget:ghBud})});const d=await r.json();setGhResult(d.optimization||d.error);}catch(e:any){setGhResult(e.message);}setGhLoading(false);}} disabled={ghLoading||!ghType} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ghLoading?'Optimizing...':'Optimize My Green Home 🏡'}
        </button>
      </div>
      {ghResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ghResult}</div>}
    </div>
  );
}

export function ForgeTab_climact86() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [caCtx, setCaCtx] = React.useState('');
  const [caSkill, setCaSkill] = React.useState('');
  const [caTime, setCaTime] = React.useState('');
  const [caResult, setCaResult] = React.useState('');
  const [caLoading, setCaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌍 Climate Action Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create a high-leverage, realistic climate action plan that matches your skills and time.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Your context (student, professional, parent, retiree...)" value={caCtx} onChange={e=>setCaCtx(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Skills/background you could contribute" value={caSkill} onChange={e=>setCaSkill(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Time available (e.g. 2 hours/week, weekends)" value={caTime} onChange={e=>setCaTime(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setCaLoading(true);setCaResult('');try{const r=await fetch(`${''}/api/climateaction/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({context:caCtx,skills:caSkill,time_available:caTime})});const d=await r.json();setCaResult(d.action_plan||d.error);}catch(e:any){setCaResult(e.message);}setCaLoading(false);}} disabled={caLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#1e8449',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {caLoading?'Planning...':'Build My Climate Action Plan 🌍'}
        </button>
      </div>
      {caResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{caResult}</div>}
    </div>
  );
}

export function ForgeTab_pbrand87() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pbNiche, setPbNiche] = React.useState('');
  const [pbAud, setPbAud] = React.useState('');
  const [pbPres, setPbPres] = React.useState('');
  const [pbResult, setPbResult] = React.useState('');
  const [pbLoading, setPbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>✨ Personal Brand Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a magnetic personal brand that attracts opportunities and the right audience.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Your niche/expertise (e.g. startup finance, wellness, UX design)" value={pbNiche} onChange={e=>setPbNiche(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Target audience (who do you want to reach?)" value={pbAud} onChange={e=>setPbAud(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current online presence (just starting, some followers, established)" value={pbPres} onChange={e=>setPbPres(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!pbNiche)return;setPbLoading(true);setPbResult('');try{const r=await fetch(`${''}/api/personalbrand/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({niche:pbNiche,audience:pbAud,current_presence:pbPres})});const d=await r.json();setPbResult(d.plan||d.error);}catch(e:any){setPbResult(e.message);}setPbLoading(false);}} disabled={pbLoading||!pbNiche} style={{padding:'0.75rem',borderRadius:'8px',background:'#8e44ad',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {pbLoading?'Building...':'Build My Personal Brand ✨'}
        </button>
      </div>
      {pbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pbResult}</div>}
    </div>
  );
}

export function ForgeTab_contcal87() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ccGoals, setCcGoals] = React.useState('');
  const [ccPlat, setCcPlat] = React.useState('');
  const [ccFreq, setCcFreq] = React.useState('');
  const [ccResult, setCcResult] = React.useState('');
  const [ccLoading, setCcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📅 Content Calendar Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>30-day content calendar with specific ideas, formats, and posting strategy.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Content goals (grow following, launch product, build authority)" value={ccGoals} onChange={e=>setCcGoals(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Platforms (Instagram, LinkedIn, TikTok, YouTube...)" value={ccPlat} onChange={e=>setCcPlat(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Posting frequency (daily, 3x/week, weekdays)" value={ccFreq} onChange={e=>setCcFreq(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ccGoals)return;setCcLoading(true);setCcResult('');try{const r=await fetch(`${''}/api/contentcalendar/build`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goals:ccGoals,platforms:ccPlat,frequency:ccFreq})});const d=await r.json();setCcResult(d.calendar||d.error);}catch(e:any){setCcResult(e.message);}setCcLoading(false);}} disabled={ccLoading||!ccGoals} style={{padding:'0.75rem',borderRadius:'8px',background:'#2980b9',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {ccLoading?'Building...':'Build My Content Calendar 📅'}
        </button>
      </div>
      {ccResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ccResult}</div>}
    </div>
  );
}

export function ForgeTab_biowrite87() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bwBg, setBwBg] = React.useState('');
  const [bwTone, setBwTone] = React.useState('');
  const [bwPlat, setBwPlat] = React.useState('');
  const [bwResult, setBwResult] = React.useState('');
  const [bwLoading, setBwLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📝 Bio Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Professional bios for every platform — LinkedIn, Twitter, Instagram, speaker bio, and more.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Your background (role, achievements, what you do, what makes you unique)" value={bwBg} onChange={e=>setBwBg(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Tone (professional, casual, bold, warm, witty)" value={bwTone} onChange={e=>setBwTone(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Primary platform (LinkedIn, Twitter, Instagram, website)" value={bwPlat} onChange={e=>setBwPlat(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!bwBg)return;setBwLoading(true);setBwResult('');try{const r=await fetch(`${''}/api/bio/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({background:bwBg,tone:bwTone,platform:bwPlat})});const d=await r.json();setBwResult(d.bio||d.error);}catch(e:any){setBwResult(e.message);}setBwLoading(false);}} disabled={bwLoading||!bwBg} style={{padding:'0.75rem',borderRadius:'8px',background:'#16a085',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {bwLoading?'Writing...':'Write My Bios 📝'}
        </button>
      </div>
      {bwResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{bwResult}</div>}
    </div>
  );
}

export function ForgeTab_audgrow87() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [agPlat, setAgPlat] = React.useState('');
  const [agSize, setAgSize] = React.useState('');
  const [agNiche, setAgNiche] = React.useState('');
  const [agResult, setAgResult] = React.useState('');
  const [agLoading, setAgLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📈 Audience Growth Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Platform-specific growth strategies and a 30-day challenge to grow your audience.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Platform to grow (Instagram, LinkedIn, YouTube, TikTok, Twitter)" value={agPlat} onChange={e=>setAgPlat(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Current following size (e.g. 0, 500, 5k, 50k)" value={agSize} onChange={e=>setAgSize(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your niche/content topic" value={agNiche} onChange={e=>setAgNiche(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!agPlat)return;setAgLoading(true);setAgResult('');try{const r=await fetch(`${''}/api/audience/grow`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({platform:agPlat,current_size:agSize,niche:agNiche})});const d=await r.json();setAgResult(d.strategy||d.error);}catch(e:any){setAgResult(e.message);}setAgLoading(false);}} disabled={agLoading||!agPlat} style={{padding:'0.75rem',borderRadius:'8px',background:'#e67e22',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {agLoading?'Strategizing...':'Grow My Audience 📈'}
        </button>
      </div>
      {agResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{agResult}</div>}
    </div>
  );
}

export function ForgeTab_monetize87() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mnNiche, setMnNiche] = React.useState('');
  const [mnSize, setMnSize] = React.useState('');
  const [mnSkills, setMnSkills] = React.useState('');
  const [mnResult, setMnResult] = React.useState('');
  const [mnLoading, setMnLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💰 Monetization Strategist</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn your audience and expertise into revenue — full monetization roadmap with income projections.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Your niche/content area" value={mnNiche} onChange={e=>setMnNiche(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Audience size (current followers/subscribers)" value={mnSize} onChange={e=>setMnSize(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Skills & assets (courses, coaching, writing, design, code...)" value={mnSkills} onChange={e=>setMnSkills(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mnNiche)return;setMnLoading(true);setMnResult('');try{const r=await fetch(`${''}/api/monetization/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({niche:mnNiche,audience_size:mnSize,skills:mnSkills})});const d=await r.json();setMnResult(d.plan||d.error);}catch(e:any){setMnResult(e.message);}setMnLoading(false);}} disabled={mnLoading||!mnNiche} style={{padding:'0.75rem',borderRadius:'8px',background:'#f39c12',color:'#000',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {mnLoading?'Planning...':'Build My Monetization Plan 💰'}
        </button>
      </div>
      {mnResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mnResult}</div>}
    </div>
  );
}

export function ForgeTab_flowstate88() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fsWork, setFsWork] = React.useState('');
  const [fsBlock, setFsBlock] = React.useState('');
  const [fsEnv, setFsEnv] = React.useState('');
  const [fsResult, setFsResult] = React.useState('');
  const [fsLoading, setFsLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🌊 Flow State Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design your personalized flow state protocol — enter deep work on demand.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Type of work (coding, writing, design, analysis...)" value={fsWork} onChange={e=>setFsWork(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="What blocks your flow? (distractions, anxiety, unclear goals)" value={fsBlock} onChange={e=>setFsBlock(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Work environment (home, office, cafe, hybrid)" value={fsEnv} onChange={e=>setFsEnv(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!fsWork)return;setFsLoading(true);setFsResult('');try{const r=await fetch(`${''}/api/flowstate/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({work_type:fsWork,blockers:fsBlock,environment:fsEnv})});const d=await r.json();setFsResult(d.protocol||d.error);}catch(e:any){setFsResult(e.message);}setFsLoading(false);}} disabled={fsLoading||!fsWork} style={{padding:'0.75rem',borderRadius:'8px',background:'#1a5276',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {fsLoading?'Designing...':'Design My Flow Protocol 🌊'}
        </button>
      </div>
      {fsResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{fsResult}</div>}
    </div>
  );
}

export function ForgeTab_procbust88() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pbTask, setPbTask] = React.useState('');
  const [pbReason, setPbReason] = React.useState('');
  const [pbDead, setPbDead] = React.useState('');
  const [pbResult, setPbResult] = React.useState('');
  const [pbLoading, setPbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🚀 Procrastination Buster</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Diagnose why you\'re stuck and get a personalized plan to start right now.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="What task are you avoiding?" value={pbTask} onChange={e=>setPbTask(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Why do you think you\'re avoiding it?" value={pbReason} onChange={e=>setPbReason(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="When is it due?" value={pbDead} onChange={e=>setPbDead(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!pbTask)return;setPbLoading(true);setPbResult('');try{const r=await fetch(`${''}/api/procrastination/bust`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({task:pbTask,reason:pbReason,deadline:pbDead})});const d=await r.json();setPbResult(d.plan||d.error);}catch(e:any){setPbResult(e.message);}setPbLoading(false);}} disabled={pbLoading||!pbTask} style={{padding:'0.75rem',borderRadius:'8px',background:'#c0392b',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {pbLoading?'Busting...':'Bust My Procrastination 🚀'}
        </button>
      </div>
      {pbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pbResult}</div>}
    </div>
  );
}

export function ForgeTab_decfat88() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dfDec, setDfDec] = React.useState('');
  const [dfRole, setDfRole] = React.useState('');
  const [dfEnrg, setDfEnrg] = React.useState('');
  const [dfResult, setDfResult] = React.useState('');
  const [dfLoading, setDfLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧠 Decision Fatigue Reducer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Automate, batch, and simplify recurring decisions to protect your mental energy.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Recurring decisions you make (what to eat, how to prioritize, which emails to reply to...)" value={dfDec} onChange={e=>setDfDec(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your role/context (manager, parent, entrepreneur)" value={dfRole} onChange={e=>setDfRole(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="When is your energy highest? (morning, afternoon, evening)" value={dfEnrg} onChange={e=>setDfEnrg(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!dfDec)return;setDfLoading(true);setDfResult('');try{const r=await fetch(`${''}/api/decisionfatigue/reduce`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({decisions:dfDec,role:dfRole,energy_pattern:dfEnrg})});const d=await r.json();setDfResult(d.framework||d.error);}catch(e:any){setDfResult(e.message);}setDfLoading(false);}} disabled={dfLoading||!dfDec} style={{padding:'0.75rem',borderRadius:'8px',background:'#7d3c98',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {dfLoading?'Building...':'Build My Decision Framework 🧠'}
        </button>
      </div>
      {dfResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{dfResult}</div>}
    </div>
  );
}
