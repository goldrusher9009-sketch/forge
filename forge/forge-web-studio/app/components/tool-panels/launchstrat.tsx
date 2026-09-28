'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_launchstrat() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [lsProd, setLsProd] = React.useState('');
  const [lsMarket, setLsMarket] = React.useState('');
  const [lsBudget, setLsBudget] = React.useState('');
  const [lsResult, setLsResult] = React.useState('');
  const [loadingLs, setLoadingLs] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🚀 Launch Strategist</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a go-to-market launch strategy for your product.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Product</label>
        <input value={lsProd} onChange={e=>setLsProd(e.target.value)} placeholder="What are you launching?" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Target Market</label>
        <input value={lsMarket} onChange={e=>setLsMarket(e.target.value)} placeholder="Who are your ideal customers?" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Budget Range</label>
        <input value={lsBudget} onChange={e=>setLsBudget(e.target.value)} placeholder="e.g. $500, $5,000, bootstrapped" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!lsProd)return;setLoadingLs(true);setLsResult('');try{const r=await fetch(`${''}/api/launch/strategy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:lsProd,market:lsMarket,budget:lsBudget})});const d=await r.json();setLsResult(d.strategy||d.result||JSON.stringify(d));}catch(e){setLsResult('Error generating strategy');}setLoadingLs(false);}} disabled={loadingLs||!lsProd} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingLs||!lsProd?0.6:1}}>
          {loadingLs?'Building...':'Build Launch Strategy'}
        </button>
      </div>
      {lsResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{lsResult}</div>}
    </div>
  );
}

export function ForgeTab_custavatr() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [caProduct, setCaProduct] = React.useState('');
  const [caSegment, setCaSegment] = React.useState('');
  const [caResult, setCaResult] = React.useState('');
  const [loadingCa, setLoadingCa] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>👤 Customer Avatar Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create detailed ideal customer profiles to sharpen your marketing.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Product/Service</label>
        <input value={caProduct} onChange={e=>setCaProduct(e.target.value)} placeholder="What do you sell?" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Customer Segment (optional)</label>
        <input value={caSegment} onChange={e=>setCaSegment(e.target.value)} placeholder="e.g. small business owners, millennials, enterprise HR" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!caProduct)return;setLoadingCa(true);setCaResult('');try{const r=await fetch(`${''}/api/customer/avatar`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({product:caProduct,segment:caSegment})});const d=await r.json();setCaResult(d.avatar||d.result||JSON.stringify(d));}catch(e){setCaResult('Error building avatar');}setLoadingCa(false);}} disabled={loadingCa||!caProduct} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingCa||!caProduct?0.6:1}}>
          {loadingCa?'Building...':'Build Customer Avatar'}
        </button>
      </div>
      {caResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{caResult}</div>}
    </div>
  );
}

export function ForgeTab_revmodel() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [rmBiz, setRmBiz] = React.useState('');
  const [rmStage, setRmStage] = React.useState('');
  const [rmResult, setRmResult] = React.useState('');
  const [loadingRm, setLoadingRm] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>💵 Revenue Model Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design the optimal revenue model for your business.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Business Description</label>
        <textarea value={rmBiz} onChange={e=>setRmBiz(e.target.value)} placeholder="Describe your business, product, and value proposition..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:100,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Business Stage</label>
        <select value={rmStage} onChange={e=>setRmStage(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="">Select stage...</option>
          <option value="idea">Idea/Pre-launch</option>
          <option value="mvp">MVP/Early traction</option>
          <option value="growth">Growth stage</option>
          <option value="scale">Scaling</option>
        </select>
        <button onClick={async()=>{if(!rmBiz)return;setLoadingRm(true);setRmResult('');try{const r=await fetch(`${''}/api/revenue/model`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({business:rmBiz,stage:rmStage})});const d=await r.json();setRmResult(d.model||d.result||JSON.stringify(d));}catch(e){setRmResult('Error designing model');}setLoadingRm(false);}} disabled={loadingRm||!rmBiz} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingRm||!rmBiz?0.6:1}}>
          {loadingRm?'Designing...':'Design Revenue Model'}
        </button>
      </div>
      {rmResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{rmResult}</div>}
    </div>
  );
}

export function ForgeTab_mealplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mpGoals, setMpGoals] = React.useState('');
  const [mpRestrictions, setMpRestrictions] = React.useState('');
  const [mpDays, setMpDays] = React.useState('7');
  const [mpResult, setMpResult] = React.useState('');
  const [loadingMp, setLoadingMp] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🥗 Meal Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get a personalized meal plan based on your goals and preferences.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Health Goals</label>
        <input value={mpGoals} onChange={e=>setMpGoals(e.target.value)} placeholder="e.g. lose weight, build muscle, eat healthier" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Dietary Restrictions</label>
        <input value={mpRestrictions} onChange={e=>setMpRestrictions(e.target.value)} placeholder="e.g. vegetarian, no gluten, nut allergy" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Days</label>
        <select value={mpDays} onChange={e=>setMpDays(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
        </select>
        <button onClick={async()=>{if(!mpGoals)return;setLoadingMp(true);setMpResult('');try{const r=await fetch(`${''}/api/meal/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goals:mpGoals,restrictions:mpRestrictions,days:mpDays})});const d=await r.json();setMpResult(d.plan||d.result||JSON.stringify(d));}catch(e){setMpResult('Error generating meal plan');}setLoadingMp(false);}} disabled={loadingMp||!mpGoals} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingMp||!mpGoals?0.6:1}}>
          {loadingMp?'Planning...':'Generate Meal Plan'}
        </button>
      </div>
      {mpResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{mpResult}</div>}
    </div>
  );
}

export function ForgeTab_workoutdesign() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wdLevel, setWdLevel] = React.useState('');
  const [wdEquip, setWdEquip] = React.useState('');
  const [wdGoal, setWdGoal] = React.useState('');
  const [wdResult, setWdResult] = React.useState('');
  const [loadingWd, setLoadingWd] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>💪 Workout Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get a custom workout program tailored to your fitness level and goals.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Fitness Level</label>
        <select value={wdLevel} onChange={e=>setWdLevel(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="">Select level...</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Available Equipment</label>
        <input value={wdEquip} onChange={e=>setWdEquip(e.target.value)} placeholder="e.g. dumbbells, barbell, bodyweight only, full gym" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Fitness Goal</label>
        <input value={wdGoal} onChange={e=>setWdGoal(e.target.value)} placeholder="e.g. build muscle, lose fat, improve endurance" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!wdLevel||!wdGoal)return;setLoadingWd(true);setWdResult('');try{const r=await fetch(`${''}/api/workout/design`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({fitness_level:wdLevel,equipment:wdEquip,goal:wdGoal})});const d=await r.json();setWdResult(d.workout||d.result||JSON.stringify(d));}catch(e){setWdResult('Error designing workout');}setLoadingWd(false);}} disabled={loadingWd||!wdLevel||!wdGoal} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingWd||!wdLevel||!wdGoal?0.6:1}}>
          {loadingWd?'Designing...':'Design Workout'}
        </button>
      </div>
      {wdResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{wdResult}</div>}
    </div>
  );
}

export function ForgeTab_sleepopt66() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [soIssues, setSoIssues] = React.useState('');
  const [soSchedule, setSoSchedule] = React.useState('');
  const [soResult, setSoResult] = React.useState('');
  const [loadingSo, setLoadingSo] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>😴 Sleep Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Improve your sleep quality with a personalized optimization plan.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Sleep Issues</label>
        <textarea value={soIssues} onChange={e=>setSoIssues(e.target.value)} placeholder="e.g. trouble falling asleep, waking up at night, feel tired despite 8 hours..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Current Sleep Schedule</label>
        <input value={soSchedule} onChange={e=>setSoSchedule(e.target.value)} placeholder="e.g. bed at midnight, wake 7am, often scrolling phone before bed" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!soIssues)return;setLoadingSo(true);setSoResult('');try{const r=await fetch(`${''}/api/sleep/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({issues:soIssues,schedule:soSchedule})});const d=await r.json();setSoResult(d.advice||d.result||JSON.stringify(d));}catch(e){setSoResult('Error optimizing sleep');}setLoadingSo(false);}} disabled={loadingSo||!soIssues} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingSo||!soIssues?0.6:1}}>
          {loadingSo?'Optimizing...':'Optimize My Sleep'}
        </button>
      </div>
      {soResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{soResult}</div>}
    </div>
  );
}

export function ForgeTab_stressmgr() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [smStressors, setSmStressors] = React.useState('');
  const [smLifestyle, setSmLifestyle] = React.useState('');
  const [smSeverity, setSmSeverity] = React.useState('5');
  const [smResult, setSmResult] = React.useState('');
  const [loadingSm, setLoadingSm] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🧘 Stress Manager</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a personalized stress management plan with evidence-based techniques.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Main Stressors</label>
        <textarea value={smStressors} onChange={e=>setSmStressors(e.target.value)} placeholder="e.g. work deadlines, financial pressure, relationship issues..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Lifestyle</label>
        <input value={smLifestyle} onChange={e=>setSmLifestyle(e.target.value)} placeholder="e.g. busy professional, parent of 2, remote worker" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Stress Severity (1-10): {smSeverity}</label>
        <input type="range" min="1" max="10" value={smSeverity} onChange={e=>setSmSeverity(e.target.value)} style={{width:'100%'}}/>
        <button onClick={async()=>{if(!smStressors)return;setLoadingSm(true);setSmResult('');try{const r=await fetch(`${''}/api/stress/manage`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({stressors:smStressors,lifestyle:smLifestyle,severity:smSeverity})});const d=await r.json();setSmResult(d.plan||d.result||JSON.stringify(d));}catch(e){setSmResult('Error building plan');}setLoadingSm(false);}} disabled={loadingSm||!smStressors} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingSm||!smStressors?0.6:1}}>
          {loadingSm?'Building...':'Build Stress Plan'}
        </button>
      </div>
      {smResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{smResult}</div>}
    </div>
  );
}

export function ForgeTab_habitstack() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [hsExisting, setHsExisting] = React.useState('');
  const [hsNew, setHsNew] = React.useState('');
  const [hsResult, setHsResult] = React.useState('');
  const [loadingHs, setLoadingHs] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🔗 Habit Stacker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Use habit stacking science to build new habits that actually stick.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Existing Daily Habits</label>
        <textarea value={hsExisting} onChange={e=>setHsExisting(e.target.value)} placeholder="e.g. morning coffee, brushing teeth, checking phone after waking..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>New Habit to Build</label>
        <input value={hsNew} onChange={e=>setHsNew(e.target.value)} placeholder="e.g. meditate for 5 minutes, drink a glass of water, read 10 pages" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!hsExisting||!hsNew)return;setLoadingHs(true);setHsResult('');try{const r=await fetch(`${''}/api/habit/stack`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({existing_habits:hsExisting,new_habit:hsNew})});const d=await r.json();setHsResult(d.plan||d.result||JSON.stringify(d));}catch(e){setHsResult('Error building habit stack');}setLoadingHs(false);}} disabled={loadingHs||!hsExisting||!hsNew} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingHs||!hsExisting||!hsNew?0.6:1}}>
          {loadingHs?'Stacking...':'Build Habit Stack'}
        </button>
      </div>
      {hsResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{hsResult}</div>}
    </div>
  );
}

export function ForgeTab_parentadvice() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [paAge, setPaAge] = React.useState('');
  const [paSit, setPaSit] = React.useState('');
  const [paConcern, setPaConcern] = React.useState('');
  const [paResult, setPaResult] = React.useState('');
  const [loadingPa, setLoadingPa] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>👨‍👩‍👧 Parenting Advisor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get thoughtful, age-appropriate parenting guidance powered by AI.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Child\'s Age</label>
        <input value={paAge} onChange={e=>setPaAge(e.target.value)} placeholder="e.g. 3 years old, 8, teenager" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Situation</label>
        <textarea value={paSit} onChange={e=>setPaSit(e.target.value)} placeholder="Describe the parenting situation or challenge..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:100,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Main Concern</label>
        <input value={paConcern} onChange={e=>setPaConcern(e.target.value)} placeholder="e.g. tantrums, screen time, school struggles" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!paAge||!paSit)return;setLoadingPa(true);setPaResult('');try{const r=await fetch(`${''}/api/parenting/advise`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({child_age:paAge,situation:paSit,concern:paConcern})});const d=await r.json();setPaResult(d.advice||d.result||JSON.stringify(d));}catch(e){setPaResult('Error getting advice');}setLoadingPa(false);}} disabled={loadingPa||!paAge||!paSit} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingPa||!paAge||!paSit?0.6:1}}>
          {loadingPa?'Advising...':'Get Parenting Advice'}
        </button>
      </div>
      {paResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{paResult}</div>}
    </div>
  );
}

export function ForgeTab_bedtimestory67() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bsName, setBsName] = React.useState('');
  const [bsAge, setBsAge] = React.useState('5');
  const [bsTheme, setBsTheme] = React.useState('');
  const [bsResult, setBsResult] = React.useState('');
  const [loadingBs, setLoadingBs] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🌙 Bedtime Story Creator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create magical, personalized bedtime stories for your child.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Child\'s Name</label>
        <input value={bsName} onChange={e=>setBsName(e.target.value)} placeholder="e.g. Emma, Liam" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Age</label>
        <select value={bsAge} onChange={e=>setBsAge(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          {['2','3','4','5','6','7','8','9','10'].map(a=><option key={a} value={a}>{a} years old</option>)}
        </select>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Story Theme</label>
        <input value={bsTheme} onChange={e=>setBsTheme(e.target.value)} placeholder="e.g. dragons, space, fairies, dinosaurs, ocean" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!bsName||!bsTheme)return;setLoadingBs(true);setBsResult('');try{const r=await fetch(`${''}/api/bedtime/story`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({child_name:bsName,age:bsAge,theme:bsTheme})});const d=await r.json();setBsResult(d.story||d.result||JSON.stringify(d));}catch(e){setBsResult('Error creating story');}setLoadingBs(false);}} disabled={loadingBs||!bsName||!bsTheme} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingBs||!bsName||!bsTheme?0.6:1}}>
          {loadingBs?'Writing...':'Create Story'}
        </button>
      </div>
      {bsResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{bsResult}</div>}
    </div>
  );
}

export function ForgeTab_familymtg() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fmSize, setFmSize] = React.useState('');
  const [fmTopics, setFmTopics] = React.useState('');
  const [fmResult, setFmResult] = React.useState('');
  const [loadingFm, setLoadingFm] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🏠 Family Meeting Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create structured family meetings that everyone actually looks forward to.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Family Size & Ages</label>
        <input value={fmSize} onChange={e=>setFmSize(e.target.value)} placeholder="e.g. 2 parents, kids ages 5, 8, 12" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Topics to Discuss</label>
        <textarea value={fmTopics} onChange={e=>setFmTopics(e.target.value)} placeholder="e.g. screen time rules, upcoming vacation, chores, allowances..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <button onClick={async()=>{if(!fmSize||!fmTopics)return;setLoadingFm(true);setFmResult('');try{const r=await fetch(`${''}/api/family/meeting`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({family_size:fmSize,topics:fmTopics})});const d=await r.json();setFmResult(d.agenda||d.result||JSON.stringify(d));}catch(e){setFmResult('Error planning meeting');}setLoadingFm(false);}} disabled={loadingFm||!fmSize||!fmTopics} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingFm||!fmSize||!fmTopics?0.6:1}}>
          {loadingFm?'Planning...':'Plan Family Meeting'}
        </button>
      </div>
      {fmResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{fmResult}</div>}
    </div>
  );
}

export function ForgeTab_chorechart67() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ccChildren, setCcChildren] = React.useState('');
  const [ccChores, setCcChores] = React.useState('');
  const [ccResult, setCcResult] = React.useState('');
  const [loadingCc, setLoadingCc] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>📋 Chore Chart Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a fair, age-appropriate chore system for your family.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Children (names & ages)</label>
        <input value={ccChildren} onChange={e=>setCcChildren(e.target.value)} placeholder="e.g. Alex (7), Maya (10), Sam (14)" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Household Chores to Include</label>
        <textarea value={ccChores} onChange={e=>setCcChores(e.target.value)} placeholder="e.g. dishes, vacuuming, laundry, taking out trash, feeding pets..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <button onClick={async()=>{if(!ccChildren)return;setLoadingCc(true);setCcResult('');try{const r=await fetch(`${''}/api/chore/chart`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({children:ccChildren,chore_types:ccChores})});const d=await r.json();setCcResult(d.chart||d.result||JSON.stringify(d));}catch(e){setCcResult('Error building chart');}setLoadingCc(false);}} disabled={loadingCc||!ccChildren} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingCc||!ccChildren?0.6:1}}>
          {loadingCc?'Building...':'Build Chore Chart'}
        </button>
      </div>
      {ccResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{ccResult}</div>}
    </div>
  );
}

export function ForgeTab_collegeprep67() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cpGrade, setCpGrade] = React.useState('');
  const [cpInterests, setCpInterests] = React.useState('');
  const [cpGoals, setCpGoals] = React.useState('');
  const [cpResult, setCpResult] = React.useState('');
  const [loadingCp, setLoadingCp] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🎓 College Prep Advisor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a comprehensive college preparation roadmap for your student.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Current Grade</label>
        <select value={cpGrade} onChange={e=>setCpGrade(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="">Select grade...</option>
          {['8th','9th','10th','11th','12th'].map(g=><option key={g} value={g}>{g} grade</option>)}
        </select>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Academic Interests</label>
        <input value={cpInterests} onChange={e=>setCpInterests(e.target.value)} placeholder="e.g. STEM, humanities, arts, business" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>College Goals</label>
        <input value={cpGoals} onChange={e=>setCpGoals(e.target.value)} placeholder="e.g. Ivy League, state school, scholarships, specific major" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!cpGrade||!cpInterests)return;setLoadingCp(true);setCpResult('');try{const r=await fetch(`${''}/api/college/prep`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({student_grade:cpGrade,interests:cpInterests,goals:cpGoals})});const d=await r.json();setCpResult(d.plan||d.result||JSON.stringify(d));}catch(e){setCpResult('Error building plan');}setLoadingCp(false);}} disabled={loadingCp||!cpGrade||!cpInterests} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingCp||!cpGrade||!cpInterests?0.6:1}}>
          {loadingCp?'Planning...':'Build College Prep Plan'}
        </button>
      </div>
      {cpResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{cpResult}</div>}
    </div>
  );
}

export function ForgeTab_debtstrat68() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dsDebts, setDsDebts] = React.useState('');
  const [dsIncome, setDsIncome] = React.useState('');
  const [dsResult, setDsResult] = React.useState('');
  const [loadingDs, setLoadingDs] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>💳 Debt Strategist</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get a personalized debt elimination strategy using proven payoff methods.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Your Debts (name, balance, interest rate)</label>
        <textarea value={dsDebts} onChange={e=>setDsDebts(e.target.value)} placeholder="e.g. Credit card A: $5,000 at 22%, Student loan: $25,000 at 6%, Car: $8,000 at 4%" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:100,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Monthly Income & Expenses</label>
        <input value={dsIncome} onChange={e=>setDsIncome(e.target.value)} placeholder="e.g. $5,000/month income, $3,500 in expenses" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!dsDebts)return;setLoadingDs(true);setDsResult('');try{const r=await fetch(`${''}/api/debt/strategy`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({debts:dsDebts,monthly_income:dsIncome})});const d=await r.json();setDsResult(d.strategy||d.result||JSON.stringify(d));}catch(e){setDsResult('Error building strategy');}setLoadingDs(false);}} disabled={loadingDs||!dsDebts} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingDs||!dsDebts?0.6:1}}>
          {loadingDs?'Strategizing...':'Build Debt Strategy'}
        </button>
      </div>
      {dsResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{dsResult}</div>}
    </div>
  );
}

export function ForgeTab_investdecode68() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [idTerm, setIdTerm] = React.useState('');
  const [idLevel, setIdLevel] = React.useState('beginner');
  const [idResult, setIdResult] = React.useState('');
  const [loadingId, setLoadingId] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>📊 Investment Decoder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Decode complex investment terms and concepts in plain English.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Term or Concept to Decode</label>
        <input value={idTerm} onChange={e=>setIdTerm(e.target.value)} placeholder="e.g. P/E ratio, dollar cost averaging, index funds, options" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Your Experience Level</label>
        <select value={idLevel} onChange={e=>setIdLevel(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button onClick={async()=>{if(!idTerm)return;setLoadingId(true);setIdResult('');try{const r=await fetch(`${''}/api/investment/decode`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({term:idTerm,experience_level:idLevel})});const d=await r.json();setIdResult(d.explanation||d.result||JSON.stringify(d));}catch(e){setIdResult('Error decoding term');}setLoadingId(false);}} disabled={loadingId||!idTerm} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingId||!idTerm?0.6:1}}>
          {loadingId?'Decoding...':'Decode It'}
        </button>
      </div>
      {idResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{idResult}</div>}
    </div>
  );
}

export function ForgeTab_creditcoach68() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ccScore, setCcScore] = React.useState('');
  const [ccIssues, setCcIssues] = React.useState('');
  const [ccGoals, setCcGoals] = React.useState('');
  const [ccResult, setCcResult] = React.useState('');
  const [loadingCc68, setLoadingCc68] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>⭐ Credit Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a step-by-step plan to improve your credit score.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Current Credit Score</label>
        <input value={ccScore} onChange={e=>setCcScore(e.target.value)} placeholder="e.g. 580, 650, 720" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Credit Issues</label>
        <input value={ccIssues} onChange={e=>setCcIssues(e.target.value)} placeholder="e.g. late payments, high utilization, collections" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Goal</label>
        <input value={ccGoals} onChange={e=>setCcGoals(e.target.value)} placeholder="e.g. buy a house in 2 years, qualify for car loan" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!ccScore)return;setLoadingCc68(true);setCcResult('');try{const r=await fetch(`${''}/api/credit/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({credit_score:ccScore,issues:ccIssues,goals:ccGoals})});const d=await r.json();setCcResult(d.plan||d.result||JSON.stringify(d));}catch(e){setCcResult('Error coaching credit');}setLoadingCc68(false);}} disabled={loadingCc68||!ccScore} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingCc68||!ccScore?0.6:1}}>
          {loadingCc68?'Planning...':'Build Credit Plan'}
        </button>
      </div>
      {ccResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{ccResult}</div>}
    </div>
  );
}

export function ForgeTab_taxopt68() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [toSit, setToSit] = React.useState('');
  const [toType, setToType] = React.useState('W-2 employee');
  const [toStatus, setToStatus] = React.useState('single');
  const [toResult, setToResult] = React.useState('');
  const [loadingTo, setLoadingTo] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🧾 Tax Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Discover legal strategies to minimize your tax burden. (Educational only — consult a CPA for advice.)</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Your Situation</label>
        <textarea value={toSit} onChange={e=>setToSit(e.target.value)} placeholder="e.g. freelancer with $80k income, homeowner, contribute to 401k..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Income Type</label>
        <select value={toType} onChange={e=>setToType(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option>W-2 employee</option>
          <option>Self-employed / freelancer</option>
          <option>Business owner</option>
          <option>Investor</option>
          <option>Mixed income</option>
        </select>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Filing Status</label>
        <select value={toStatus} onChange={e=>setToStatus(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="single">Single</option>
          <option value="married_joint">Married filing jointly</option>
          <option value="married_separate">Married filing separately</option>
          <option value="head_of_household">Head of household</option>
        </select>
        <button onClick={async()=>{if(!toSit)return;setLoadingTo(true);setToResult('');try{const r=await fetch(`${''}/api/tax/optimize`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:toSit,income_type:toType,filing_status:toStatus})});const d=await r.json();setToResult(d.advice||d.result||JSON.stringify(d));}catch(e){setToResult('Error optimizing taxes');}setLoadingTo(false);}} disabled={loadingTo||!toSit} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingTo||!toSit?0.6:1}}>
          {loadingTo?'Optimizing...':'Find Tax Strategies'}
        </button>
      </div>
      {toResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{toResult}</div>}
    </div>
  );
}

export function ForgeTab_wealthmap68() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wmAge, setWmAge] = React.useState('');
  const [wmGoals, setWmGoals] = React.useState('');
  const [wmIncome, setWmIncome] = React.useState('');
  const [wmResult, setWmResult] = React.useState('');
  const [loadingWm, setLoadingWm] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🗺️ Wealth Mapper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a personalized wealth-building roadmap from where you are to where you want to be.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Your Age</label>
        <input value={wmAge} onChange={e=>setWmAge(e.target.value)} placeholder="e.g. 28" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Financial Goals</label>
        <textarea value={wmGoals} onChange={e=>setWmGoals(e.target.value)} placeholder="e.g. retire at 50 with $2M, buy a home in 5 years, build passive income" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Current Income</label>
        <input value={wmIncome} onChange={e=>setWmIncome(e.target.value)} placeholder="e.g. $65,000/year" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!wmAge||!wmGoals)return;setLoadingWm(true);setWmResult('');try{const r=await fetch(`${''}/api/wealth/map`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({age:wmAge,goals:wmGoals,income:wmIncome})});const d=await r.json();setWmResult(d.roadmap||d.result||JSON.stringify(d));}catch(e){setWmResult('Error mapping wealth');}setLoadingWm(false);}} disabled={loadingWm||!wmAge||!wmGoals} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingWm||!wmAge||!wmGoals?0.6:1}}>
          {loadingWm?'Mapping...':'Build Wealth Map'}
        </button>
      </div>
      {wmResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{wmResult}</div>}
    </div>
  );
}

export function ForgeTab_smalltalk69() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [stSit, setStSit] = React.useState('');
  const [stPersonality, setStPersonality] = React.useState('introverted');
  const [stResult, setStResult] = React.useState('');
  const [loadingSt, setLoadingSt] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>💬 Small Talk Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Master the art of small talk with personalized conversation strategies.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Situation</label>
        <input value={stSit} onChange={e=>setStSit(e.target.value)} placeholder="e.g. work happy hour, networking event, meeting neighbors" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Your Personality</label>
        <select value={stPersonality} onChange={e=>setStPersonality(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="introverted">Introverted</option>
          <option value="extroverted">Extroverted — want to be more engaging</option>
          <option value="anxious">Social anxiety</option>
          <option value="neutral">Neutral</option>
        </select>
        <button onClick={async()=>{if(!stSit)return;setLoadingSt(true);setStResult('');try{const r=await fetch(`${''}/api/smalltalk/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:stSit,personality:stPersonality})});const d=await r.json();setStResult(d.tips||d.result||JSON.stringify(d));}catch(e){setStResult('Error getting coaching');}setLoadingSt(false);}} disabled={loadingSt||!stSit} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingSt||!stSit?0.6:1}}>
          {loadingSt?'Coaching...':'Get Small Talk Tips'}
        </button>
      </div>
      {stResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{stResult}</div>}
    </div>
  );
}

export function ForgeTab_pubspeak69() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [psSpeechType, setPsSpeechType] = React.useState('');
  const [psTopic, setPsTopic] = React.useState('');
  const [psConcerns, setPsConcerns] = React.useState('');
  const [psResult, setPsResult] = React.useState('');
  const [loadingPs, setLoadingPs] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🎤 Public Speaking Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Conquer nerves and deliver powerful speeches with personalized coaching.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Speech Type</label>
        <select value={psSpeechType} onChange={e=>setPsSpeechType(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="">Select type...</option>
          <option value="presentation">Work presentation</option>
          <option value="wedding_toast">Wedding toast</option>
          <option value="conference_talk">Conference talk</option>
          <option value="sales_pitch">Sales pitch</option>
          <option value="ted_talk">TED-style talk</option>
          <option value="interview">Job interview</option>
        </select>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Topic</label>
        <input value={psTopic} onChange={e=>setPsTopic(e.target.value)} placeholder="What are you speaking about?" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Main Concerns</label>
        <input value={psConcerns} onChange={e=>setPsConcerns(e.target.value)} placeholder="e.g. nerves, forgetting lines, monotone voice" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!psSpeechType||!psTopic)return;setLoadingPs(true);setPsResult('');try{const r=await fetch(`${''}/api/publicspeaking/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({speech_type:psSpeechType,topic:psTopic,concerns:psConcerns})});const d=await r.json();setPsResult(d.coaching||d.result||JSON.stringify(d));}catch(e){setPsResult('Error getting coaching');}setLoadingPs(false);}} disabled={loadingPs||!psSpeechType||!psTopic} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingPs||!psSpeechType||!psTopic?0.6:1}}>
          {loadingPs?'Coaching...':'Get Speaking Coaching'}
        </button>
      </div>
      {psResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{psResult}</div>}
    </div>
  );
}

export function ForgeTab_activelisten() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [alScenario, setAlScenario] = React.useState('');
  const [alHabits, setAlHabits] = React.useState('');
  const [alResult, setAlResult] = React.useState('');
  const [loadingAl, setLoadingAl] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>👂 Active Listening Trainer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Develop deeper listening skills to build stronger relationships.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Scenario</label>
        <input value={alScenario} onChange={e=>setAlScenario(e.target.value)} placeholder="e.g. conversations with partner, team meetings, client calls" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Current Listening Habits</label>
        <textarea value={alHabits} onChange={e=>setAlHabits(e.target.value)} placeholder="e.g. I think of what I\'ll say next, I get distracted, I interrupt..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:80,resize:'vertical',boxSizing:'border-box'}}/>
        <button onClick={async()=>{if(!alScenario)return;setLoadingAl(true);setAlResult('');try{const r=await fetch(`${''}/api/activelistening/train`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({scenario:alScenario,current_habits:alHabits})});const d=await r.json();setAlResult(d.feedback||d.result||JSON.stringify(d));}catch(e){setAlResult('Error getting training');}setLoadingAl(false);}} disabled={loadingAl||!alScenario} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingAl||!alScenario?0.6:1}}>
          {loadingAl?'Training...':'Get Listening Training'}
        </button>
      </div>
      {alResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{alResult}</div>}
    </div>
  );
}

export function ForgeTab_assertive69() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [asSit, setAsSit] = React.useState('');
  const [asOutcome, setAsOutcome] = React.useState('');
  const [asResult, setAsResult] = React.useState('');
  const [loadingAs, setLoadingAs] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>💪 Assertiveness Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Learn to speak up, set boundaries, and advocate for yourself confidently.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Situation</label>
        <textarea value={asSit} onChange={e=>setAsSit(e.target.value)} placeholder="e.g. boss gives me extra work without pay, friend cancels last minute, coworker takes credit..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:100,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Desired Outcome</label>
        <input value={asOutcome} onChange={e=>setAsOutcome(e.target.value)} placeholder="e.g. set a boundary, get fair recognition, say no without guilt" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!asSit)return;setLoadingAs(true);setAsResult('');try{const r=await fetch(`${''}/api/assertiveness/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:asSit,desired_outcome:asOutcome})});const d=await r.json();setAsResult(d.script||d.result||JSON.stringify(d));}catch(e){setAsResult('Error getting coaching');}setLoadingAs(false);}} disabled={loadingAs||!asSit} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingAs||!asSit?0.6:1}}>
          {loadingAs?'Coaching...':'Get Assertiveness Script'}
        </button>
      </div>
      {asResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{asResult}</div>}
    </div>
  );
}

export function ForgeTab_netmsg69() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [nmContext, setNmContext] = React.useState('');
  const [nmGoal, setNmGoal] = React.useState('');
  const [nmRecipient, setNmRecipient] = React.useState('');
  const [nmResult, setNmResult] = React.useState('');
  const [loadingNm, setLoadingNm] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🤝 Networking Message Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write genuine networking messages that get responses, not ignored.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Context (how you know them / connection)</label>
        <input value={nmContext} onChange={e=>setNmContext(e.target.value)} placeholder="e.g. met at conference, mutual connection, saw their LinkedIn post" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Your Goal</label>
        <input value={nmGoal} onChange={e=>setNmGoal(e.target.value)} placeholder="e.g. informational interview, job referral, collaboration, advice" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>About the Recipient</label>
        <input value={nmRecipient} onChange={e=>setNmRecipient(e.target.value)} placeholder="e.g. senior PM at Google, founder of startup I admire" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!nmContext||!nmGoal)return;setLoadingNm(true);setNmResult('');try{const r=await fetch(`${''}/api/networking/message`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({context:nmContext,goal:nmGoal,recipient_info:nmRecipient})});const d=await r.json();setNmResult(d.message||d.result||JSON.stringify(d));}catch(e){setNmResult('Error writing message');}setLoadingNm(false);}} disabled={loadingNm||!nmContext||!nmGoal} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingNm||!nmContext||!nmGoal?0.6:1}}>
          {loadingNm?'Writing...':'Write Networking Message'}
        </button>
      </div>
      {nmResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{nmResult}</div>}
    </div>
  );
}

export function ForgeTab_charnames70() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cnGenre, setCnGenre] = React.useState('');
  const [cnTraits, setCnTraits] = React.useState('');
  const [cnSetting, setCnSetting] = React.useState('');
  const [cnResult, setCnResult] = React.useState('');
  const [loadingCn, setLoadingCn] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>✍️ Character Name Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate memorable, fitting names for your story\'s characters.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Genre</label>
        <select value={cnGenre} onChange={e=>setCnGenre(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="">Select genre...</option>
          {['Fantasy','Sci-Fi','Historical','Contemporary','Romance','Thriller','Horror','Literary Fiction'].map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Character Traits</label>
        <input value={cnTraits} onChange={e=>setCnTraits(e.target.value)} placeholder="e.g. brave warrior, cunning villain, gentle healer" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Setting/World</label>
        <input value={cnSetting} onChange={e=>setCnSetting(e.target.value)} placeholder="e.g. medieval Europe, futuristic Tokyo, Victorian London" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!cnGenre||!cnTraits)return;setLoadingCn(true);setCnResult('');try{const r=await fetch(`${''}/api/character/names`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({genre:cnGenre,traits:cnTraits,setting:cnSetting})});const d=await r.json();setCnResult(d.names||d.result||JSON.stringify(d));}catch(e){setCnResult('Error generating names');}setLoadingCn(false);}} disabled={loadingCn||!cnGenre||!cnTraits} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingCn||!cnGenre||!cnTraits?0.6:1}}>
          {loadingCn?'Generating...':'Generate Names'}
        </button>
      </div>
      {cnResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{cnResult}</div>}
    </div>
  );
}

export function ForgeTab_writeprompt70() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wpGenre, setWpGenre] = React.useState('');
  const [wpMood, setWpMood] = React.useState('');
  const [wpResult, setWpResult] = React.useState('');
  const [loadingWp, setLoadingWp] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>💡 Writing Prompt Engine</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Spark your creativity with unique, detailed writing prompts.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Genre</label>
        <select value={wpGenre} onChange={e=>setWpGenre(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="">Any genre</option>
          {['Fantasy','Sci-Fi','Romance','Thriller','Horror','Literary','Mystery','Adventure'].map(g=><option key={g} value={g}>{g}</option>)}
        </select>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Mood</label>
        <select value={wpMood} onChange={e=>setWpMood(e.target.value)} style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}>
          <option value="">Any mood</option>
          {['Dark & haunting','Hopeful','Funny & quirky','Romantic','Tense & suspenseful','Melancholic','Uplifting'].map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={async()=>{setLoadingWp(true);setWpResult('');try{const r=await fetch(`${''}/api/writing/prompt`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({genre:wpGenre,mood:wpMood})});const d=await r.json();setWpResult(d.prompt||d.result||JSON.stringify(d));}catch(e){setWpResult('Error generating prompts');}setLoadingWp(false);}} disabled={loadingWp} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingWp?0.6:1}}>
          {loadingWp?'Generating...':'Generate Writing Prompts'}
        </button>
      </div>
      {wpResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{wpResult}</div>}
    </div>
  );
}

export function ForgeTab_plothole70() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [phSummary, setPhSummary] = React.useState('');
  const [phGenre, setPhGenre] = React.useState('');
  const [phResult, setPhResult] = React.useState('');
  const [loadingPh, setLoadingPh] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🕳️ Plot Hole Detector</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Find and fix inconsistencies, logic gaps, and plot holes in your story.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Story Summary</label>
        <textarea value={phSummary} onChange={e=>setPhSummary(e.target.value)} placeholder="Describe your story\'s plot, characters, and key events..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:150,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Genre</label>
        <input value={phGenre} onChange={e=>setPhGenre(e.target.value)} placeholder="e.g. fantasy, sci-fi, mystery" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!phSummary)return;setLoadingPh(true);setPhResult('');try{const r=await fetch(`${''}/api/plothole/detect`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({story_summary:phSummary,genre:phGenre})});const d=await r.json();setPhResult(d.issues||d.result||JSON.stringify(d));}catch(e){setPhResult('Error analyzing story');}setLoadingPh(false);}} disabled={loadingPh||!phSummary} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingPh||!phSummary?0.6:1}}>
          {loadingPh?'Analyzing...':'Detect Plot Holes'}
        </button>
      </div>
      {phResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{phResult}</div>}
    </div>
  );
}

export function ForgeTab_dialogpol() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dpOriginal, setDpOriginal] = React.useState('');
  const [dpContext, setDpContext] = React.useState('');
  const [dpResult, setDpResult] = React.useState('');
  const [loadingDp, setLoadingDp] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>🗨️ Dialogue Polisher</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Transform stiff, on-the-nose dialogue into natural, character-revealing conversation.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Your Dialogue</label>
        <textarea value={dpOriginal} onChange={e=>setDpOriginal(e.target.value)} placeholder="Paste your dialogue here..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:150,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Scene Context</label>
        <input value={dpContext} onChange={e=>setDpContext(e.target.value)} placeholder="e.g. tense argument between estranged siblings, first meeting" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!dpOriginal)return;setLoadingDp(true);setDpResult('');try{const r=await fetch(`${''}/api/dialogue/polish`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({original:dpOriginal,context:dpContext})});const d=await r.json();setDpResult(d.polished||d.result||JSON.stringify(d));}catch(e){setDpResult('Error polishing dialogue');}setLoadingDp(false);}} disabled={loadingDp||!dpOriginal} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingDp||!dpOriginal?0.6:1}}>
          {loadingDp?'Polishing...':'Polish Dialogue'}
        </button>
      </div>
      {dpResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{dpResult}</div>}
    </div>
  );
}

export function ForgeTab_booktitle70() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [btSynopsis, setBtSynopsis] = React.useState('');
  const [btGenre, setBtGenre] = React.useState('');
  const [btTone, setBtTone] = React.useState('');
  const [btResult, setBtResult] = React.useState('');
  const [loadingBt, setLoadingBt] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'0.5rem'}}>📚 Book Title Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate compelling, marketable titles for your book.</p>
      <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'1rem'}}>
        <label style={{display:'block',marginBottom:'0.5rem',fontWeight:600}}>Book Synopsis</label>
        <textarea value={btSynopsis} onChange={e=>setBtSynopsis(e.target.value)} placeholder="Briefly describe your book\'s story or content..." style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff',minHeight:100,resize:'vertical',boxSizing:'border-box'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Genre</label>
        <input value={btGenre} onChange={e=>setBtGenre(e.target.value)} placeholder="e.g. literary fiction, self-help, fantasy, memoir" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <label style={{display:'block',margin:'1rem 0 0.5rem',fontWeight:600}}>Tone</label>
        <input value={btTone} onChange={e=>setBtTone(e.target.value)} placeholder="e.g. dark and haunting, uplifting, mysterious, witty" style={{width:'100%',background:'#111',border:'1px solid #333',borderRadius:8,padding:'0.75rem',color:'#fff'}}/>
        <button onClick={async()=>{if(!btSynopsis)return;setLoadingBt(true);setBtResult('');try{const r=await fetch(`${''}/api/book/title`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({synopsis:btSynopsis,genre:btGenre,tone:btTone})});const d=await r.json();setBtResult(d.titles||d.result||JSON.stringify(d));}catch(e){setBtResult('Error generating titles');}setLoadingBt(false);}} disabled={loadingBt||!btSynopsis} style={{marginTop:'1rem',padding:'0.75rem 2rem',background:'#7c3aed',border:'none',borderRadius:8,color:'#fff',fontWeight:600,cursor:'pointer',opacity:loadingBt||!btSynopsis?0.6:1}}>
          {loadingBt?'Generating...':'Generate Titles'}
        </button>
      </div>
      {btResult&&<div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:1.7}}>{btResult}</div>}
    </div>
  );
}

export function ForgeTab_procbust71() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pbTask, setPbTask] = React.useState('');
  const [pbReason, setPbReason] = React.useState('');
  const [pbDeadline, setPbDeadline] = React.useState('');
  const [pbResult, setPbResult] = React.useState('');
  const [pbLoading, setPbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🔥 Procrastination Buster</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Diagnose why you\'re avoiding a task and get an action plan to start NOW.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="What task are you avoiding?" value={pbTask} onChange={e=>setPbTask(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Why are you avoiding it?" value={pbReason} onChange={e=>setPbReason(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Deadline (optional)" value={pbDeadline} onChange={e=>setPbDeadline(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!pbTask)return;setPbLoading(true);setPbResult('');try{const r=await fetch(`${''}/api/procrastination/bust`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({task:pbTask,reason:pbReason,deadline:pbDeadline})});const d=await r.json();setPbResult(d.plan||d.error);}catch(e:any){setPbResult(e.message);}setPbLoading(false);}} disabled={pbLoading||!pbTask} style={{padding:'0.75rem',borderRadius:'8px',background:'#e74c3c',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {pbLoading?'Analyzing...':'Bust My Procrastination 🔥'}
        </button>
      </div>
      {pbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pbResult}</div>}
    </div>
  );
}

export function ForgeTab_timeblock71() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tbGoals, setTbGoals] = React.useState('');
  const [tbHours, setTbHours] = React.useState('');
  const [tbEnergy, setTbEnergy] = React.useState('');
  const [tbResult, setTbResult] = React.useState('');
  const [tbLoading, setTbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⏰ Time Block Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design an optimized weekly schedule with time-blocking.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Weekly goals (one per line)" value={tbGoals} onChange={e=>setTbGoals(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Work hours (e.g. 9am-5pm)" value={tbHours} onChange={e=>setTbHours(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Energy pattern (morning/evening person)" value={tbEnergy} onChange={e=>setTbEnergy(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!tbGoals)return;setTbLoading(true);setTbResult('');try{const r=await fetch(`${''}/api/timeblock/plan`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({goals:tbGoals,work_hours:tbHours,energy_pattern:tbEnergy})});const d=await r.json();setTbResult(d.blocks||d.error);}catch(e:any){setTbResult(e.message);}setTbLoading(false);}} disabled={tbLoading||!tbGoals} style={{padding:'0.75rem',borderRadius:'8px',background:'#3498db',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {tbLoading?'Planning...':'Build My Schedule ⏰'}
        </button>
      </div>
      {tbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{tbResult}</div>}
    </div>
  );
}

export function ForgeTab_meetcost71() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mcAttendees, setMcAttendees] = React.useState('');
  const [mcDuration, setMcDuration] = React.useState('');
  const [mcSalary, setMcSalary] = React.useState('');
  const [mcPurpose, setMcPurpose] = React.useState('');
  const [mcResult, setMcResult] = React.useState('');
  const [mcLoading, setMcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💰 Meeting Cost Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate real cost of meetings and get ROI analysis.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Number of attendees" value={mcAttendees} onChange={e=>setMcAttendees(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Duration in minutes" value={mcDuration} onChange={e=>setMcDuration(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Average salary (e.g. $80,000/year)" value={mcSalary} onChange={e=>setMcSalary(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Meeting purpose" value={mcPurpose} onChange={e=>setMcPurpose(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mcAttendees||!mcDuration)return;setMcLoading(true);setMcResult('');try{const r=await fetch(`${''}/api/meeting/cost`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({attendees:mcAttendees,duration_minutes:mcDuration,avg_salary:mcSalary,purpose:mcPurpose})});const d=await r.json();setMcResult(d.cost||d.error);}catch(e:any){setMcResult(e.message);}setMcLoading(false);}} disabled={mcLoading||!mcAttendees} style={{padding:'0.75rem',borderRadius:'8px',background:'#f39c12',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {mcLoading?'Calculating...':'Calculate Meeting Cost 💰'}
        </button>
      </div>
      {mcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mcResult}</div>}
    </div>
  );
}

export function ForgeTab_inboxzero71() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [izCount, setIzCount] = React.useState('');
  const [izTypes, setIzTypes] = React.useState('');
  const [izTime, setIzTime] = React.useState('');
  const [izResult, setIzResult] = React.useState('');
  const [izLoading, setIzLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📭 Inbox Zero Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a sustainable system to achieve and maintain inbox zero.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Current email count (e.g. 500+)" value={izCount} onChange={e=>setIzCount(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Email types (newsletters, work, personal...)" value={izTypes} onChange={e=>setIzTypes(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Daily time available for email" value={izTime} onChange={e=>setIzTime(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{setIzLoading(true);setIzResult('');try{const r=await fetch(`${''}/api/inbox/zero`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({email_count:izCount,email_types:izTypes,time_available:izTime})});const d=await r.json();setIzResult(d.strategy||d.error);}catch(e:any){setIzResult(e.message);}setIzLoading(false);}} disabled={izLoading} style={{padding:'0.75rem',borderRadius:'8px',background:'#27ae60',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {izLoading?'Building strategy...':'Get Inbox Zero Plan 📭'}
        </button>
      </div>
      {izResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{izResult}</div>}
    </div>
  );
}

export function ForgeTab_deepwork71() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dwType, setDwType] = React.useState('');
  const [dwHours, setDwHours] = React.useState('');
  const [dwDistract, setDwDistract] = React.useState('');
  const [dwGoals, setDwGoals] = React.useState('');
  const [dwResult, setDwResult] = React.useState('');
  const [dwLoading, setDwLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧠 Deep Work Scheduler</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a deep work protocol using Cal Newport\'s proven system.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Type of deep work (coding, writing, analysis...)" value={dwType} onChange={e=>setDwType(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Available deep work hours per week" value={dwHours} onChange={e=>setDwHours(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Main distractions (phone, meetings...)" value={dwDistract} onChange={e=>setDwDistract(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Deep work goals" value={dwGoals} onChange={e=>setDwGoals(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!dwType)return;setDwLoading(true);setDwResult('');try{const r=await fetch(`${''}/api/deepwork/schedule`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({work_type:dwType,available_hours:dwHours,distractions:dwDistract,goals:dwGoals})});const d=await r.json();setDwResult(d.plan||d.error);}catch(e:any){setDwResult(e.message);}setDwLoading(false);}} disabled={dwLoading||!dwType} style={{padding:'0.75rem',borderRadius:'8px',background:'#8e44ad',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {dwLoading?'Scheduling...':'Build Deep Work Protocol 🧠'}
        </button>
      </div>
      {dwResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{dwResult}</div>}
    </div>
  );
}

export function ForgeTab_conflmed72() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [cmSit, setCmSit] = React.useState('');
  const [cmMy, setCmMy] = React.useState('');
  const [cmOther, setCmOther] = React.useState('');
  const [cmRel, setCmRel] = React.useState('');
  const [cmResult, setCmResult] = React.useState('');
  const [cmLoading, setCmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🕊️ Conflict Mediator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get neutral mediation and a step-by-step resolution path.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the conflict situation" value={cmSit} onChange={e=>setCmSit(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your perspective" value={cmMy} onChange={e=>setCmMy(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Other person\'s perspective" value={cmOther} onChange={e=>setCmOther(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Relationship type (friend, partner, coworker...)" value={cmRel} onChange={e=>setCmRel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!cmSit)return;setCmLoading(true);setCmResult('');try{const r=await fetch(`${''}/api/conflict/mediate`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:cmSit,your_perspective:cmMy,other_perspective:cmOther,relationship_type:cmRel})});const d=await r.json();setCmResult(d.mediation||d.error);}catch(e:any){setCmResult(e.message);}setCmLoading(false);}} disabled={cmLoading||!cmSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#16a085',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {cmLoading?'Mediating...':'Get Mediation 🕊️'}
        </button>
      </div>
      {cmResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{cmResult}</div>}
    </div>
  );
}

export function ForgeTab_appreci72() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [apRecip, setApRecip] = React.useState('');
  const [apRel, setApRel] = React.useState('');
  const [apThings, setApThings] = React.useState('');
  const [apTone, setApTone] = React.useState('');
  const [apResult, setApResult] = React.useState('');
  const [apLoading, setApLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💝 Appreciation Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write heartfelt appreciation messages that deeply move people.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Who are you appreciating?" value={apRecip} onChange={e=>setApRecip(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your relationship (parent, friend, mentor...)" value={apRel} onChange={e=>setApRel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="Specific things to appreciate about them" value={apThings} onChange={e=>setApThings(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Tone (warm, formal, playful...)" value={apTone} onChange={e=>setApTone(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!apRecip||!apThings)return;setApLoading(true);setApResult('');try{const r=await fetch(`${''}/api/appreciation/write`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({recipient:apRecip,relationship:apRel,specific_things:apThings,tone:apTone})});const d=await r.json();setApResult(d.message||d.error);}catch(e:any){setApResult(e.message);}setApLoading(false);}} disabled={apLoading||!apRecip} style={{padding:'0.75rem',borderRadius:'8px',background:'#e91e8c',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {apLoading?'Writing...':'Write Appreciation 💝'}
        </button>
      </div>
      {apResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{apResult}</div>}
    </div>
  );
}

export function ForgeTab_socianx72() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [saSit, setSaSit] = React.useState('');
  const [saLevel, setSaLevel] = React.useState('');
  const [saFears, setSaFears] = React.useState('');
  const [saGoal, setSaGoal] = React.useState('');
  const [saResult, setSaResult] = React.useState('');
  const [saLoading, setSaLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>😌 Social Anxiety Coach</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>CBT-based coaching to navigate social situations with confidence.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe the social situation" value={saSit} onChange={e=>setSaSit(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Anxiety level 1-10" value={saLevel} onChange={e=>setSaLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Specific fears" value={saFears} onChange={e=>setSaFears(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your goal for this situation" value={saGoal} onChange={e=>setSaGoal(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!saSit)return;setSaLoading(true);setSaResult('');try{const r=await fetch(`${''}/api/socialanxiety/coach`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({situation:saSit,anxiety_level:saLevel,specific_fears:saFears,goal:saGoal})});const d=await r.json();setSaResult(d.coaching||d.error);}catch(e:any){setSaResult(e.message);}setSaLoading(false);}} disabled={saLoading||!saSit} style={{padding:'0.75rem',borderRadius:'8px',background:'#5c6bc0',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {saLoading?'Coaching...':'Get Social Coaching 😌'}
        </button>
      </div>
      {saResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{saResult}</div>}
    </div>
  );
}

export function ForgeTab_reconnect72() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [rcName, setRcName] = React.useState('');
  const [rcLast, setRcLast] = React.useState('');
  const [rcMems, setRcMems] = React.useState('');
  const [rcWhy, setRcWhy] = React.useState('');
  const [rcResult, setRcResult] = React.useState('');
  const [rcLoading, setRcLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🤝 Friend Reconnector</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write natural messages to reconnect with friends you\'ve lost touch with.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Friend\'s name" value={rcName} onChange={e=>setRcName(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="When did you last speak?" value={rcLast} onChange={e=>setRcLast(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Shared memories or inside jokes" value={rcMems} onChange={e=>setRcMems(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Why you drifted apart (optional)" value={rcWhy} onChange={e=>setRcWhy(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!rcName)return;setRcLoading(true);setRcResult('');try{const r=await fetch(`${''}/api/friend/reconnect`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({friend_name:rcName,last_contact:rcLast,shared_memories:rcMems,reason_drifted:rcWhy})});const d=await r.json();setRcResult(d.message||d.error);}catch(e:any){setRcResult(e.message);}setRcLoading(false);}} disabled={rcLoading||!rcName} style={{padding:'0.75rem',borderRadius:'8px',background:'#2ecc71',color:'#fff',fontWeight:'600',border:'none',cursor:'pointer'}}>
          {rcLoading?'Writing...':'Write Reconnection Message 🤝'}
        </button>
      </div>
      {rcResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{rcResult}</div>}
    </div>
  );
}
