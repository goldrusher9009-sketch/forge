'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';
import { utcStamp } from '../../../lib/platform-time';

export function ForgeTab_habitdna96() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [hdGoal, setHdGoal] = React.useState('');
  const [hdFailed, setHdFailed] = React.useState('');
  const [hdSchedule, setHdSchedule] = React.useState('');
  const [hdResult, setHdResult] = React.useState('');
  const [hdLoading, setHdLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🧬 Habit DNA</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Decode why your habits fail and build a personalized system that actually sticks.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Habit(s) you want to build (be specific: exercise, writing, meditation, etc.)" value={hdGoal} onChange={e=>setHdGoal(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <textarea placeholder="What have you tried before that didn\'t work? Why did you quit?" value={hdFailed} onChange={e=>setHdFailed(e.target.value)} rows={2} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Your current daily schedule (when you wake, work hours, commitments)" value={hdSchedule} onChange={e=>setHdSchedule(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!hdGoal)return;setHdLoading(true);setHdResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Analyze habit formation for these goals: '+hdGoal+'. Past failures: '+(hdFailed||'general inconsistency')+'. Schedule: '+(hdSchedule||'typical 9-5')+'. Provide: 1) FAILURE AUTOPSY (exactly why past attempts failed based on psychology), 2) YOUR HABIT DNA (personality type and ideal habit architecture), 3) MINIMUM VIABLE HABIT (stripped-down version that takes under 2 min), 4) HABIT STACK (attach to existing routines — exactly which ones), 5) ENVIRONMENT DESIGN (physical/digital changes to make willpower irrelevant), 6) IDENTITY REFRAME (who you need to become, not what you need to do), 7) RESCUE PROTOCOL (what to do after missing a day), 8) 66-DAY PROGRESSION MAP.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setHdResult(d.response||d.content||d.error);}catch(e:any){setHdResult(e.message);}setHdLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{hdLoading?'Decoding...':'Decode My Habit DNA'}</button>
      </div>
      {hdResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{hdResult}</div>}
    </div>
  );
}

export function ForgeTab_salespage96() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [spProduct, setSpProduct] = React.useState('');
  const [spPrice, setSpPrice] = React.useState('');
  const [spBuyer, setSpBuyer] = React.useState('');
  const [spResult, setSpResult] = React.useState('');
  const [spLoading, setSpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💸 Sales Page Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a high-converting sales page with proven copywriting frameworks and persuasion triggers.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="What are you selling? (product, course, service, coaching — include key benefits)" value={spProduct} onChange={e=>setSpProduct(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Price point (e.g. $97, $997/month, $5,000 one-time)" value={spPrice} onChange={e=>setSpPrice(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Ideal buyer (who they are, their biggest pain, desired transformation)" value={spBuyer} onChange={e=>setSpBuyer(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!spProduct)return;setSpLoading(true);setSpResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Write a complete sales page for: '+spProduct+'. Price: '+(spPrice||'not specified')+'. Buyer: '+(spBuyer||'general audience')+'. Include all sections: 1) HEADLINE (3 options using different frameworks), 2) SUBHEADLINE, 3) ABOVE-THE-FOLD HOOK, 4) THE PROBLEM (agitate the pain), 5) THE SOLUTION REVEAL, 6) FEATURES vs BENEFITS TABLE, 7) SOCIAL PROOF placeholders, 8) GUARANTEE section, 9) OBJECTION HANDLERS (top 5 with responses), 10) CALL TO ACTION (3 variations), 11) PS LINE. Use proven copywriting: PAS, AIDA, before/after/bridge.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();const out=d.response||d.content||d.error;setSpResult(out);saveToolHistory('salespage96','Sales Page Writer',{product:spProduct.slice(0,200),price:spPrice,buyer:spBuyer},out?.slice(0,500)||'');}catch(e:any){setSpResult(e.message);}setSpLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{spLoading?'Writing...':'Write Sales Page'}</button>
      </div>
      {spResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{spResult}</div>}
    </div>
  );
}

export function ForgeTab_codetutor97() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ctCode, setCtCode] = React.useState('');
  const [ctLang, setCtLang] = React.useState('');
  const [ctLevel, setCtLevel] = React.useState('');
  const [ctResult, setCtResult] = React.useState('');
  const [ctLoading, setCtLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>👨‍💻 Code Tutor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Paste any code snippet and get a plain-English explanation, improvement suggestions, and learning resources.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Paste your code here..." value={ctCode} onChange={e=>setCtCode(e.target.value)} rows={8} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical',fontFamily:'monospace',fontSize:'0.85rem'}} />
        <input placeholder="Language (JavaScript, Python, Go, SQL, etc.)" value={ctLang} onChange={e=>setCtLang(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Your experience level (beginner, intermediate, advanced)" value={ctLevel} onChange={e=>setCtLevel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!ctCode)return;setCtLoading(true);setCtResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Teach me about this '+(ctLang||'code')+' at '+(ctLevel||'intermediate')+' level: ```'+ctCode+'```. Provide: 1) PLAIN ENGLISH EXPLANATION (what this code does, line by line if needed), 2) KEY CONCEPTS used (with simple analogies), 3) POTENTIAL BUGS or issues, 4) IMPROVEMENTS (3-5 specific refactoring suggestions with before/after), 5) PERFORMANCE CONSIDERATIONS, 6) WHAT TO LEARN NEXT (concepts to deepen understanding), 7) SIMILAR REAL-WORLD USE CASE where this pattern appears.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setCtResult(d.response||d.content||d.error);}catch(e:any){setCtResult(e.message);}setCtLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{ctLoading?'Teaching...':'Explain This Code'}</button>
      </div>
      {ctResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{ctResult}</div>}
    </div>
  );
}

export function ForgeTab_emotionmap97() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [emSit, setEmSit] = React.useState('');
  const [emFeel, setEmFeel] = React.useState('');
  const [emResult, setEmResult] = React.useState('');
  const [emLoading, setEmLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🗺️ Emotion Mapper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Understand your emotional patterns, triggers, and needs — plus a personalized regulation toolkit.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Describe a recent situation that triggered strong emotions (what happened, who was involved, context)" value={emSit} onChange={e=>setEmSit(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="What emotions did you feel? (angry, anxious, sad, overwhelmed, etc.)" value={emFeel} onChange={e=>setEmFeel(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!emSit)return;setEmLoading(true);setEmResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Help me understand my emotional experience. Situation: '+emSit+'. Emotions felt: '+(emFeel||'strong negative feelings')+'. Provide: 1) EMOTION IDENTIFICATION (name the specific emotions with nuance — e.g. not just "angry" but "contempt mixed with fear of loss"), 2) UNDERLYING NEED (what core need was unmet — safety, connection, respect, autonomy, etc.), 3) TRIGGER PATTERN (what past experiences may make this a sensitive area), 4) BODY SENSATION MAP (where this emotion likely lives in the body), 5) COGNITIVE DISTORTIONS present, 6) REGULATION TOOLKIT (5 techniques matched to these specific emotions), 7) WHAT TO SAY TO YOURSELF right now, 8) LONG-TERM HEALING PATH.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setEmResult(d.response||d.content||d.error);}catch(e:any){setEmResult(e.message);}setEmLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{emLoading?'Mapping...':'Map My Emotions'}</button>
      </div>
      {emResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{emResult}</div>}
    </div>
  );
}

export function ForgeTab_podcastguest97() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pgShow, setPgShow] = React.useState('');
  const [pgBio, setPgBio] = React.useState('');
  const [pgResult, setPgResult] = React.useState('');
  const [pgLoading, setPgLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎙️ Podcast Guest Prep</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Prepare for any podcast appearance with talking points, story hooks, and quotable soundbites.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Tell me about the podcast (host name, show topic, audience, typical episode format)" value={pgShow} onChange={e=>setPgShow(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <textarea placeholder="Your background, expertise, and what you want to promote or convey" value={pgBio} onChange={e=>setPgBio(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <button onClick={async()=>{if(!pgShow)return;setPgLoading(true);setPgResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Prepare me as a podcast guest. Show: '+pgShow+'. My background: '+(pgBio||'not provided')+'. Create: 1) INTRO BIO (30-second verbal introduction), 2) CORE NARRATIVE (the 3-arc story to tell: struggle/insight/transformation), 3) TOP 5 TALKING POINTS (with specific stories/data for each), 4) QUOTABLE SOUNDBITES (5 tweetable one-liners), 5) ANTICIPATED QUESTIONS + ANSWERS (8 likely questions), 6) BRIDGE PHRASES (to pivot back to your message), 7) CALL TO ACTION (what to say when asked where to find you), 8) PRE-SHOW RITUAL (mental prep routine).',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setPgResult(d.response||d.content||d.error);}catch(e:any){setPgResult(e.message);}setPgLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{pgLoading?'Prepping...':'Prepare My Episode'}</button>
      </div>
      {pgResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{pgResult}</div>}
    </div>
  );
}

export function ForgeTab_mvpscoper97() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mvIdea, setMvIdea] = React.useState('');
  const [mvResources, setMvResources] = React.useState('');
  const [mvResult, setMvResult] = React.useState('');
  const [mvLoading, setMvLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>⚡ MVP Scoper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Scope your minimum viable product: what to build, what to cut, and how to validate in weeks not months.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Your startup/product idea (what problem it solves, who for, how)" value={mvIdea} onChange={e=>setMvIdea(e.target.value)} rows={4} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Available resources (solo, small team, budget, timeline)" value={mvResources} onChange={e=>setMvResources(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!mvIdea)return;setMvLoading(true);setMvResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Scope an MVP for: '+mvIdea+'. Resources: '+(mvResources||'solo founder, limited budget')+'. Provide: 1) CORE HYPOTHESIS (the one thing to prove), 2) MVP FEATURE LIST (must-have vs nice-to-have vs cut), 3) WHAT NOT TO BUILD (10 tempting things to skip), 4) BUILD vs BUY vs FAKE decision for each key component, 5) VALIDATION METHOD (how to test with real users before building), 6) SUCCESS METRICS (what numbers mean you should continue), 7) 8-WEEK BUILD PLAN (week by week milestones), 8) FAILURE MODES (top 3 ways this fails and how to detect early).',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setMvResult(d.response||d.content||d.error);}catch(e:any){setMvResult(e.message);}setMvLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{mvLoading?'Scoping...':'Scope My MVP'}</button>
      </div>
      {mvResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{mvResult}</div>}
    </div>
  );
}

export function ForgeTab_twitterbio98() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [tbName, setTbName] = React.useState('');
  const [tbWork, setTbWork] = React.useState('');
  const [tbVibe, setTbVibe] = React.useState('');
  const [tbResult, setTbResult] = React.useState('');
  const [tbLoading, setTbLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🐦 Twitter/X Bio Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a Twitter bio that makes people instantly follow you — punchy, specific, and memorable.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <input placeholder="Your name and role (e.g. Sarah Chen, SaaS founder)" value={tbName} onChange={e=>setTbName(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <textarea placeholder="What you do / what you\'ve built / what you\'re known for" value={tbWork} onChange={e=>setTbWork(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Vibe (funny, serious, nerdy, contrarian, inspirational)" value={tbVibe} onChange={e=>setTbVibe(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!tbName)return;setTbLoading(true);setTbResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Write Twitter/X bios for: '+tbName+'. Background: '+(tbWork||'entrepreneur and creator')+'. Desired vibe: '+(tbVibe||'professional but human')+'. Create: 1) 10 DIFFERENT BIOS (each under 160 chars, different angles and styles), 2) ANALYSIS of what makes each effective, 3) TOP PICK with explanation, 4) PINNED TWEET IDEAS (3 options for first impression), 5) HEADER IMAGE CONCEPT description, 6) USERNAME ALTERNATIVES if relevant. Make them specific, not generic — avoid cliches like "passionate about" or "helping others".',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setTbResult(d.response||d.content||d.error);}catch(e:any){setTbResult(e.message);}setTbLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{tbLoading?'Writing...':'Generate Bios'}</button>
      </div>
      {tbResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{tbResult}</div>}
    </div>
  );
}

export function ForgeTab_speakingprep98() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [spkTopic, setSpkTopic] = React.useState('');
  const [spkAud, setSpkAud] = React.useState('');
  const [spkTime, setSpkTime] = React.useState('');
  const [spkResult, setSpkResult] = React.useState('');
  const [spkLoading, setSpkLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>🎤 Speaking Prep</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a compelling talk outline with opening hooks, key transitions, and a memorable closing.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="Talk topic and your main message (what should the audience believe/do/feel after?)" value={spkTopic} onChange={e=>setSpkTopic(e.target.value)} rows={3} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Audience type (conference, TEDx, company all-hands, investors, students)" value={spkAud} onChange={e=>setSpkAud(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Talk duration (5 min, 15 min, 30 min, 60 min)" value={spkTime} onChange={e=>setSpkTime(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!spkTopic)return;setSpkLoading(true);setSpkResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Build a speaking prep package for a '+(spkTime||'20 minute')+' talk on: '+spkTopic+'. Audience: '+(spkAud||'professional conference')+'. Include: 1) TALK TITLE (5 options), 2) OPENING HOOK (3 options: shocking stat, story, question), 3) TALK STRUCTURE with time allocations, 4) SECTION-BY-SECTION OUTLINE with key points, 5) STORY/EXAMPLE PROMPTS for each section, 6) TRANSITION PHRASES between sections, 7) CLOSING CALL TO ACTION (3 options), 8) SPEAKER NOTES format, 9) Q&A PREP (10 likely questions), 10) STAGE PRESENCE TIPS for this audience type.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setSpkResult(d.response||d.content||d.error);}catch(e:any){setSpkResult(e.message);}setSpkLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{spkLoading?'Building...':'Build Talk Outline'}</button>
      </div>
      {spkResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{spkResult}</div>}
    </div>
  );
}

export function ForgeTab_debtplan98() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dpDebts, setDpDebts] = React.useState('');
  const [dpIncome, setDpIncome] = React.useState('');
  const [dpMethod, setDpMethod] = React.useState('');
  const [dpResult, setDpResult] = React.useState('');
  const [dpLoading, setDpLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>💳 Debt Destroyer Plan</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create a personalized debt payoff strategy with timeline, order of attack, and psychological hacks to stay on track.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="List your debts (name, balance, interest rate, minimum payment — one per line)" value={dpDebts} onChange={e=>setDpDebts(e.target.value)} rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Monthly income after taxes" value={dpIncome} onChange={e=>setDpIncome(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Preferred method (avalanche=highest interest first, snowball=smallest balance first, or decide for me)" value={dpMethod} onChange={e=>setDpMethod(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!dpDebts)return;setDpLoading(true);setDpResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Create a debt payoff plan. Debts: '+dpDebts+'. Monthly income: '+(dpIncome||'not specified')+'. Method preference: '+(dpMethod||'recommend best')+'. Include: 1) DEBT SNAPSHOT (total debt, total interest you will pay, debt-free date without extra payments), 2) RECOMMENDED STRATEGY with explanation, 3) PAYOFF ORDER with rationale, 4) MONTHLY PAYMENT ALLOCATION (exact amounts to each debt), 5) ACCELERATED SCENARIO (if you find an extra $200/month), 6) INTEREST SAVED by using optimal strategy vs minimums, 7) MILESTONE CELEBRATIONS (when to celebrate payoff of each debt), 8) 3 WAYS TO FIND EXTRA MONEY for faster payoff, 9) PSYCHOLOGICAL HACKS to avoid relapse.',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setDpResult(d.response||d.content||d.error);}catch(e:any){setDpResult(e.message);}setDpLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{dpLoading?'Planning...':'Build Payoff Plan'}</button>
      </div>
      {dpResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{dpResult}</div>}
    </div>
  );
}

export function ForgeTab_productupdate98() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [puFeatures, setPuFeatures] = React.useState('');
  const [puAud, setPuAud] = React.useState('');
  const [puTone, setPuTone] = React.useState('');
  const [puResult, setPuResult] = React.useState('');
  const [puLoading, setPuLoading] = React.useState(false);
  return (
    <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📦 Product Update Announcer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn your feature list into compelling release announcements for email, social, and changelog.</p>
      <div style={{display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        <textarea placeholder="What features/fixes/improvements did you ship? (bullet list is fine)" value={puFeatures} onChange={e=>setPuFeatures(e.target.value)} rows={5} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
        <input placeholder="Target audience (existing customers, trial users, developers, general public)" value={puAud} onChange={e=>setPuAud(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <input placeholder="Tone (exciting, professional, casual, technical)" value={puTone} onChange={e=>setPuTone(e.target.value)} style={{padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
        <button onClick={async()=>{if(!puFeatures)return;setPuLoading(true);setPuResult('');try{const r=await fetch(`${''}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({message:'Write product release announcements for '+(puAud||'customers')+' in a '+(puTone||'exciting but professional')+' tone. Features shipped: '+puFeatures+'. Generate: 1) EMAIL ANNOUNCEMENT (subject line + 200-word body), 2) TWITTER/X THREAD (hook tweet + 4 detail tweets), 3) LINKEDIN POST (300 words), 4) CHANGELOG ENTRY (technical, scannable, with sections: New, Improved, Fixed), 5) IN-APP NOTIFICATION (under 50 words), 6) PRESS RELEASE HOOK (opening paragraph only), 7) HEADLINE OPTIONS (5 options for the announcement page).',model:'claude-3-5-haiku-20241022'})});const d=await r.json();setPuResult(d.response||d.content||d.error);}catch(e:any){setPuResult(e.message);}setPuLoading(false);}} style={{padding:'0.75rem 1.5rem',borderRadius:'8px',background:'#6366f1',color:'#fff',border:'none',cursor:'pointer',fontWeight:'600'}}>{puLoading?'Writing...':'Write Announcements'}</button>
      </div>
      {puResult&&<div style={{background:'#1a1a1a',border:'1px solid #333',borderRadius:'8px',padding:'1.5rem',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{puResult}</div>}
    </div>
  );
}

export function ForgeTab_ndareview2() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [ndaText, setNdaText] = React.useState('');
          const [partyRole, setPartyRole] = React.useState('receiving party');
          const [industry, setIndustry] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>🔍 NDA Reviewer</h2>
              <select value={partyRole} onChange={e=>setPartyRole(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}}>
                <option value='receiving party'>I am the Receiving Party</option>
                <option value='disclosing party'>I am the Disclosing Party</option>
                <option value='mutual NDA'>Mutual NDA</option>
              </select>
              <input placeholder="Industry (optional)" value={industry} onChange={e=>setIndustry(e.target.value)} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff'}} />
              <textarea placeholder="Paste NDA text here..." value={ndaText} onChange={e=>setNdaText(e.target.value)} rows={8} style={{width:'100%',padding:'0.75rem',marginBottom:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',resize:'vertical'}} />
              <button onClick={async()=>{if(!ndaText)return;setLoading(true);try{const r=await fetch(`${''}/api/nda/review`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`},body:JSON.stringify({nda_text:ndaText,party_role:partyRole,industry})});const d=await r.json();setResult(d);}catch(e){console.error(e);}setLoading(false);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#0ea5e9,#6366f1)',color:'#fff',border:'none',borderRadius:'8px',fontWeight:600,cursor:'pointer',marginBottom:'1.5rem'}}>{loading?'Reviewing...':'Review NDA'}</button>
              {result&&<div style={{background:'#111',borderRadius:'12px',padding:'1.5rem',border:'1px solid #222'}}>
                <div style={{display:'flex',gap:'1rem',marginBottom:'1rem'}}>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',flex:1,textAlign:'center'}}><div style={{fontSize:'0.75rem',color:'#888'}}>Risk Level</div><div style={{fontSize:'1.25rem',fontWeight:700,color:result.overall_risk==='High'?'#f87171':result.overall_risk==='Medium'?'#fbbf24':'#4ade80'}}>{result.overall_risk}</div></div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',flex:1,textAlign:'center'}}><div style={{fontSize:'0.75rem',color:'#888'}}>Risk Score</div><div style={{fontSize:'1.25rem',fontWeight:700,color:'#a78bfa'}}>{result.risk_score}</div></div>
                  <div style={{background:'#1a1a1a',borderRadius:'8px',padding:'0.75rem',flex:1,textAlign:'center'}}><div style={{fontSize:'0.75rem',color:'#888'}}>Type</div><div style={{fontSize:'1rem',fontWeight:600,color:'#fff'}}>{result.nda_type}</div></div>
                </div>
                <div style={{background:'#1a1a2a',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}}><strong style={{color:'#60a5fa'}}>Verdict:</strong> <span style={{color:'#e0e0e0'}}>{result.verdict}</span></div>
                {result.red_flags?.length>0&&<div style={{marginBottom:'1rem'}}><strong style={{color:'#f87171'}}>🚩 Red Flags:</strong>{result.red_flags.map((f:any,i:number)=><div key={i} style={{background:'#2d1515',borderRadius:'8px',padding:'0.75rem',margin:'0.5rem 0'}}><div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}><span style={{background:'#991b1b',borderRadius:'4px',padding:'0.1rem 0.4rem',fontSize:'0.75rem'}}>{f.severity}</span><strong style={{color:'#fca5a5'}}>{f.clause}</strong></div><p style={{color:'#fca5a5',fontSize:'0.9rem',margin:'0.25rem 0'}}>{f.issue}</p><p style={{color:'#86efac',fontSize:'0.85rem'}}>Fix: {f.suggested_fix}</p></div>)}
                </div>}
                {result.negotiation_priorities?.length>0&&<div style={{background:'#1a2a1a',borderRadius:'8px',padding:'0.75rem'}}><strong style={{color:'#4ade80'}}>Negotiation Priorities:</strong>{result.negotiation_priorities.map((p:string,i:number)=><li key={i} style={{color:'#86efac',fontSize:'0.9rem'}}>{p}</li>)}</div>}
              </div>}
            </div>
          );
}

export function ForgeTab_secondbrain93() {
  const [inp, setInp] = React.useState('');
  const [res, setRes] = React.useState('');
  const [ld, setLd] = React.useState(false);
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{color:'var(--fg-text)',marginBottom:4}}>🧠 Second Brain Builder</h2>
      <p style={{color:'var(--fg-text3)',marginBottom:'1.5rem',fontSize:13}}>AI-powered tool.</p>
      <textarea value={inp} onChange={e=>setInp(e.target.value)} placeholder="Describe what you need..." rows={5} style={{width:'100%',background:'var(--fg-bg2)',color:'var(--fg-text)',border:'1px solid var(--fg-border)',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
      <button onClick={async()=>{if(!inp.trim())return;setLd(true);setRes('');try{const r=await fetch(`${API}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({messages:[{role:'user',content:inp}],model:'claude-3-5-haiku-20241022'})});const d=await r.json();setRes(d.content||d.message||'Done');}catch(e){setRes('Error.');}setLd(false);}} disabled={ld} style={{background:'var(--fg-orange,#ff1f35)',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{ld?'Working...':'Generate'}</button>
      {res&&<div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:'1.25rem',whiteSpace:'pre-wrap',color:'var(--fg-text)',fontSize:14,lineHeight:1.7}}>{res}</div>}
    </div>
  );
}

export function ForgeTab_storyteller95() {
  const [inp, setInp] = React.useState('');
  const [res, setRes] = React.useState('');
  const [ld, setLd] = React.useState(false);
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{color:'var(--fg-text)',marginBottom:4}}>📖 Brand Story Engine</h2>
      <p style={{color:'var(--fg-text3)',marginBottom:'1.5rem',fontSize:13}}>AI-powered tool.</p>
      <textarea value={inp} onChange={e=>setInp(e.target.value)} placeholder="Describe what you need..." rows={5} style={{width:'100%',background:'var(--fg-bg2)',color:'var(--fg-text)',border:'1px solid var(--fg-border)',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
      <button onClick={async()=>{if(!inp.trim())return;setLd(true);setRes('');try{const r=await fetch(`${API}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({messages:[{role:'user',content:inp}],model:'claude-3-5-haiku-20241022'})});const d=await r.json();setRes(d.content||d.message||'Done');}catch(e){setRes('Error.');}setLd(false);}} disabled={ld} style={{background:'var(--fg-orange,#ff1f35)',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{ld?'Working...':'Generate'}</button>
      {res&&<div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:'1.25rem',whiteSpace:'pre-wrap',color:'var(--fg-text)',fontSize:14,lineHeight:1.7}}>{res}</div>}
    </div>
  );
}

export function ForgeTab_teamretro96() {
  const [inp, setInp] = React.useState('');
  const [res, setRes] = React.useState('');
  const [ld, setLd] = React.useState(false);
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{color:'var(--fg-text)',marginBottom:4}}>🔄 Team Retro Facilitator</h2>
      <p style={{color:'var(--fg-text3)',marginBottom:'1.5rem',fontSize:13}}>AI-powered tool.</p>
      <textarea value={inp} onChange={e=>setInp(e.target.value)} placeholder="Describe what you need..." rows={5} style={{width:'100%',background:'var(--fg-bg2)',color:'var(--fg-text)',border:'1px solid var(--fg-border)',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
      <button onClick={async()=>{if(!inp.trim())return;setLd(true);setRes('');try{const r=await fetch(`${API}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({messages:[{role:'user',content:inp}],model:'claude-3-5-haiku-20241022'})});const d=await r.json();setRes(d.content||d.message||'Done');}catch(e){setRes('Error.');}setLd(false);}} disabled={ld} style={{background:'var(--fg-orange,#ff1f35)',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{ld?'Working...':'Generate'}</button>
      {res&&<div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:'1.25rem',whiteSpace:'pre-wrap',color:'var(--fg-text)',fontSize:14,lineHeight:1.7}}>{res}</div>}
    </div>
  );
}

export function ForgeTab_reviewrespond97() {
  const [inp, setInp] = React.useState('');
  const [res, setRes] = React.useState('');
  const [ld, setLd] = React.useState(false);
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{color:'var(--fg-text)',marginBottom:4}}>⭐ Review Responder</h2>
      <p style={{color:'var(--fg-text3)',marginBottom:'1.5rem',fontSize:13}}>AI-powered tool.</p>
      <textarea value={inp} onChange={e=>setInp(e.target.value)} placeholder="Describe what you need..." rows={5} style={{width:'100%',background:'var(--fg-bg2)',color:'var(--fg-text)',border:'1px solid var(--fg-border)',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
      <button onClick={async()=>{if(!inp.trim())return;setLd(true);setRes('');try{const r=await fetch(`${API}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({messages:[{role:'user',content:inp}],model:'claude-3-5-haiku-20241022'})});const d=await r.json();setRes(d.content||d.message||'Done');}catch(e){setRes('Error.');}setLd(false);}} disabled={ld} style={{background:'var(--fg-orange,#ff1f35)',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{ld?'Working...':'Generate'}</button>
      {res&&<div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:'1.25rem',whiteSpace:'pre-wrap',color:'var(--fg-text)',fontSize:14,lineHeight:1.7}}>{res}</div>}
    </div>
  );
}

export function ForgeTab_therapyjournal98() {
  const [inp, setInp] = React.useState('');
  const [res, setRes] = React.useState('');
  const [ld, setLd] = React.useState(false);
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'2rem',maxWidth:700,margin:'0 auto'}}>
      <h2 style={{color:'var(--fg-text)',marginBottom:4}}>🌿 Therapy Journal</h2>
      <p style={{color:'var(--fg-text3)',marginBottom:'1.5rem',fontSize:13}}>AI-powered tool.</p>
      <textarea value={inp} onChange={e=>setInp(e.target.value)} placeholder="Describe what you need..." rows={5} style={{width:'100%',background:'var(--fg-bg2)',color:'var(--fg-text)',border:'1px solid var(--fg-border)',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem',resize:'vertical'}}/>
      <button onClick={async()=>{if(!inp.trim())return;setLd(true);setRes('');try{const r=await fetch(`${API}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`},body:JSON.stringify({messages:[{role:'user',content:inp}],model:'claude-3-5-haiku-20241022'})});const d=await r.json();setRes(d.content||d.message||'Done');}catch(e){setRes('Error.');}setLd(false);}} disabled={ld} style={{background:'var(--fg-orange,#ff1f35)',color:'#fff',border:'none',borderRadius:8,padding:'0.75rem 2rem',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem'}}>{ld?'Working...':'Generate'}</button>
      {res&&<div style={{background:'var(--fg-bg2)',border:'1px solid var(--fg-border)',borderRadius:10,padding:'1.25rem',whiteSpace:'pre-wrap',color:'var(--fg-text)',fontSize:14,lineHeight:1.7}}>{res}</div>}
    </div>
  );
}

export function ForgeTab_websearch() {
  const BACKEND = '';
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const doSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setResults([]); setSearched(false);
    try {
      const r = await fetch(`${BACKEND}/api/web-search`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`}, body: JSON.stringify({ query: q }) });
      const d = await r.json();
      setResults(d.results || []);
    } catch {}
    setLoading(false); setSearched(true);
  };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
          <span style={{ fontSize:32 }}>🔍</span>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--fg-text)' }}>Web Search</h1>
            <p style={{ margin:0, fontSize:13, color:'var(--fg-text3)' }}>Search the web via DuckDuckGo — no tracking, no ads.</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:24 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()}
            placeholder="Search anything…"
            style={{ flex:1, padding:'11px 16px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:10, color:'var(--fg-text)', fontSize:14 }} />
          <button onClick={doSearch} disabled={loading} style={{ padding:'11px 22px', background:'var(--fg-orange)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:loading?0.7:1 }}>{loading ? 'Searching…' : 'Search'}</button>
        </div>
        {loading && <div style={{ textAlign:'center', padding:40, color:'var(--fg-text3)' }}>Searching the web…</div>}
        {!loading && results.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {results.map((r:any, i:number) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer"
                style={{ display:'block', padding:'16px 20px', background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, textDecoration:'none', transition:'border-color 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--fg-orange)')}
                onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--fg-border)')}>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--fg-orange)', marginBottom:4 }}>{r.title}</div>
                {r.snippet && <div style={{ fontSize:13, color:'var(--fg-text2)', lineHeight:1.5, marginBottom:6 }}>{r.snippet}</div>}
                <div style={{ fontSize:11, color:'var(--fg-text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.url}</div>
              </a>
            ))}
          </div>
        )}
        {!loading && searched && results.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'var(--fg-text3)' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>😶</div>
            <div style={{ fontSize:15 }}>No results found. Try different keywords.</div>
          </div>
        )}
        {!loading && !searched && (
          <div style={{ textAlign:'center', padding:60, color:'var(--fg-text3)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:15 }}>Enter a query and press Search</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_imagegen() {
  const BACKEND = '';
  const [prompt, setPrompt] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const generate = async () => {
    const p = prompt.trim();
    if (!p) return;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${BACKEND}/api/image-gen`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${tok}`}, body: JSON.stringify({ prompt: p }) });
      const d = await r.json();
      setResult(d);
    } catch(e:any) { setResult({ error: e.message }); }
    setLoading(false);
  };
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:760, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
          <span style={{ fontSize:32 }}>🎨</span>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:'var(--fg-text)' }}>Image Generation</h1>
            <p style={{ margin:0, fontSize:13, color:'var(--fg-text3)' }}>Generate images with AI. Add a DALL·E API key for real generation.</p>
          </div>
        </div>
        <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20, marginBottom:24 }}>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} placeholder="Describe the image you want to generate…"
            style={{ width:'100%', padding:'10px 14px', background:'var(--fg-bg)', border:'1px solid var(--fg-border)', borderRadius:8, color:'var(--fg-text)', fontSize:14, resize:'vertical', marginBottom:12, boxSizing:'border-box' }} />
          <button onClick={generate} disabled={loading || !prompt.trim()}
            style={{ padding:'10px 24px', background:'var(--fg-orange)', border:'none', borderRadius:9, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', opacity:(loading||!prompt.trim())?0.6:1 }}>
            {loading ? 'Generating…' : '✨ Generate'}
          </button>
        </div>
        {result && !result.error && result.url && (
          <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20, textAlign:'center' }}>
            <img src={result.url} alt={result.prompt} style={{ maxWidth:'100%', borderRadius:10, marginBottom:12 }} />
            <div style={{ fontSize:13, color:'var(--fg-text3)' }}>{result.message || result.prompt}</div>
          </div>
        )}
        {result && result.error && (
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:16, color:'#ef4444', fontSize:13 }}>Error: {result.error}</div>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_costdash() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : null;
  const BACKEND = '';
  React.useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND}/api/cost-usage`, { headers: { Authorization: `Bearer ${tok}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  const models = data?.by_model || [];
  const total = data?.total_tokens || 0;
  const totalCost = data?.total_cost_usd || 0;
  const sessions = data?.recent_sessions || [];
  return (
    <div style={{ flex:1, overflowY:'auto', padding:28, background:'var(--fg-bg)' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)', marginBottom:4 }}>💰 AI Cost & Usage Dashboard</h1>
        <p style={{ color:'var(--fg-text3)', fontSize:13, marginBottom:24 }}>Real-time token usage and cost breakdown across all models.</p>
        {loading && <div style={{ color:'var(--fg-text3)', textAlign:'center', padding:40 }}>Loading usage data…</div>}
        {!loading && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:28 }}>
              {[
                { label:'Total Tokens', val: total.toLocaleString(), icon:'🔢' },
                { label:'Est. Cost (USD)', val: `$${totalCost.toFixed(4)}`, icon:'💵' },
                { label:'Sessions', val: data?.session_count || 0, icon:'🗂' },
                { label:'Models Used', val: models.length, icon:'🤖' },
              ].map(k => (
                <div key={k.label} style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:18 }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{k.icon}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'var(--fg-text)' }}>{k.val}</div>
                  <div style={{ fontSize:12, color:'var(--fg-text3)' }}>{k.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:14 }}>Tokens by Model</div>
              {models.length === 0 && <div style={{ color:'var(--fg-text3)', fontSize:13 }}>No model usage data yet. Start chatting to see stats.</div>}
              {models.map((m: any) => {
                const pct = total > 0 ? Math.round((m.tokens / total) * 100) : 0;
                return (
                  <div key={m.model} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                      <span style={{ color:'var(--fg-text)', fontWeight:600 }}>{m.model}</span>
                      <span style={{ color:'var(--fg-text3)' }}>{m.tokens.toLocaleString()} tokens · ${m.cost_usd?.toFixed(4) || '0.0000'}</span>
                    </div>
                    <div style={{ height:6, background:'var(--fg-bg)', borderRadius:3 }}>
                      <div style={{ height:6, borderRadius:3, background:'var(--fg-orange)', width:`${pct}%`, transition:'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background:'var(--fg-bg2)', border:'1px solid var(--fg-border)', borderRadius:12, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-text)', marginBottom:14 }}>Recent Sessions</div>
              {sessions.length === 0 && <div style={{ color:'var(--fg-text3)', fontSize:13 }}>No sessions yet.</div>}
              {sessions.map((s: any, i: number) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--fg-border)', fontSize:12 }}>
                  <span style={{ color:'var(--fg-text)' }}>{s.model}</span>
                  <span style={{ color:'var(--fg-text3)' }}>{s.tokens?.toLocaleString()} tokens</span>
                  <span style={{ color:'var(--fg-text3)' }}>{new Date(utcStamp(s.created_at)).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ForgeTab_formbuilder() {
  const [purpose, setPurpose] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [formType, setFormType] = React.useState('lead');
  const [industry, setIndustry] = React.useState('');
  const [tone, setTone] = React.useState('professional');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copiedField, setCopiedField] = React.useState('');
  const apiBase = '';
  const token = getToken();

  const generate = async () => {
    if (!purpose.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${apiBase}/api/form-builder`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ purpose, audience, formType, industry, tone }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const fieldTypeColors: Record<string, string> = { text:'#3b82f6', email:'#8b5cf6', tel:'#f59e0b', textarea:'#10b981', select:'#ef4444', radio:'#ec4899', checkbox:'#14b8a6', number:'#f97316' };

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-text1)', margin:0 }}>📋 Smart Form Builder</h2>
        <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'4px 0 0' }}>AI-designed forms with conversion tips & A/B variants</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>FORM PURPOSE *</label>
          <input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="e.g. Capture leads for our SaaS trial" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>FORM TYPE</label>
          <select value={formType} onChange={e=>setFormType(e.target.value)} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4 }}>
            {['lead','contact','survey','registration','checkout','feedback','waitlist','booking'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>TONE</label>
          <select value={tone} onChange={e=>setTone(e.target.value)} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4 }}>
            {['professional','friendly','casual','urgent','playful'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>TARGET AUDIENCE</label>
          <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="e.g. B2B marketing managers" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>INDUSTRY</label>
          <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. SaaS, E-commerce, Healthcare" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
      </div>
      <button onClick={generate} disabled={loading||!purpose.trim()} style={{ padding:'10px 24px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading||!purpose.trim()?0.6:1 }}>
        {loading ? '⏳ Designing Form…' : '📋 Build Form'}
      </button>
      {error && <div style={{ marginTop:12, padding:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:13 }}>{error}</div>}
      {result && (
        <div style={{ marginTop:24, display:'grid', gap:16 }}>
          <div style={{ padding:20, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
            <h3 style={{ margin:'0 0 4px', color:'var(--fg-text1)' }}>{result.title}</h3>
            {result.subtitle && <p style={{ margin:'0 0 16px', color:'var(--fg-text3)', fontSize:13 }}>{result.subtitle}</p>}
            <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
              {result.estimatedTime && <span style={{ padding:'3px 10px', background:'rgba(59,130,246,0.15)', borderRadius:20, fontSize:12, color:'#3b82f6' }}>⏱ {result.estimatedTime}</span>}
              <span style={{ padding:'3px 10px', background:'rgba(16,185,129,0.15)', borderRadius:20, fontSize:12, color:'#10b981' }}>{result.fields?.length || 0} fields</span>
            </div>
            <div style={{ display:'grid', gap:10 }}>
              {(result.fields || []).map((f: any, i: number) => (
                <div key={i} style={{ padding:12, background:'var(--bg-surface2)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ padding:'2px 8px', background: fieldTypeColors[f.type] ? `${fieldTypeColors[f.type]}22` : 'rgba(100,100,100,0.1)', color: fieldTypeColors[f.type] || 'var(--fg-text3)', borderRadius:4, fontSize:11, fontWeight:600 }}>{f.type}</span>
                    <span style={{ fontWeight:600, fontSize:13, color:'var(--fg-text1)' }}>{f.label}</span>
                    {f.required && <span style={{ fontSize:11, color:'#ef4444' }}>*required</span>}
                  </div>
                  {f.placeholder && <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>Placeholder: {f.placeholder}</p>}
                  {f.hint && <p style={{ margin:'2px 0 0', fontSize:11, color:'var(--fg-text3)' }}>💡 {f.hint}</p>}
                  {f.options && f.options.length > 0 && <p style={{ margin:'4px 0 0', fontSize:12, color:'var(--fg-text3)' }}>Options: {f.options.join(', ')}</p>}
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, padding:'10px 20px', background:'var(--fg-orange)', borderRadius:8, textAlign:'center', color:'#fff', fontWeight:600, fontSize:14 }}>{result.submitButton || 'Submit'}</div>
            {result.successMessage && <p style={{ margin:'8px 0 0', fontSize:12, color:'#10b981' }}>✅ {result.successMessage}</p>}
          </div>
          {result.conversionTips && result.conversionTips.length > 0 && (
            <div style={{ padding:16, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}>
              <h4 style={{ margin:'0 0 10px', color:'#10b981', fontSize:14 }}>💡 Conversion Tips</h4>
              {result.conversionTips.map((t: string, i: number) => <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'var(--fg-text2)' }}>• {t}</p>)}
            </div>
          )}
          {result.abVariants && result.abVariants.length > 0 && (
            <div style={{ padding:16, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:12 }}>
              <h4 style={{ margin:'0 0 10px', color:'#8b5cf6', fontSize:14 }}>🧪 A/B Test Ideas</h4>
              {result.abVariants.map((v: any, i: number) => <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'var(--fg-text2)' }}><strong style={{color:'#8b5cf6'}}>{v.name}:</strong> {v.change}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_brandkit() {
  const [companyName, setCompanyName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [personality, setPersonality] = React.useState('professional');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeSection, setActiveSection] = React.useState('voice');
  const apiBase = '';
  const token = getToken();

  const generate = async () => {
    if (!companyName.trim() || !description.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${apiBase}/api/brand-kit`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ companyName, description, industry, personality, targetAudience }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const sections = ['voice', 'colors', 'copy', 'content'];

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-text1)', margin:0 }}>🎨 Brand Kit Generator</h2>
        <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'4px 0 0' }}>Complete brand identity: voice, colors, copy, and content pillars</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>COMPANY NAME *</label>
          <input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="e.g. Forge AI" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>BRAND PERSONALITY</label>
          <select value={personality} onChange={e=>setPersonality(e.target.value)} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4 }}>
            {['professional','innovative','playful','trustworthy','bold','empathetic','premium','rebellious'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>DESCRIPTION *</label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What does your company do? What problem do you solve?" rows={3} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, resize:'vertical', boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>INDUSTRY</label>
          <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. AI/SaaS, Healthcare, Retail" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>TARGET AUDIENCE</label>
          <input value={targetAudience} onChange={e=>setTargetAudience(e.target.value)} placeholder="e.g. SMB founders, enterprise CTOs" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
      </div>
      <button onClick={generate} disabled={loading||!companyName.trim()||!description.trim()} style={{ padding:'10px 24px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading||!companyName.trim()||!description.trim()?0.6:1 }}>
        {loading ? '⏳ Building Brand Kit…' : '🎨 Generate Brand Kit'}
      </button>
      {error && <div style={{ marginTop:12, padding:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:13 }}>{error}</div>}
      {result && (
        <div style={{ marginTop:24 }}>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {sections.map(s => <button key={s} onClick={() => setActiveSection(s)} style={{ padding:'6px 16px', background: activeSection===s ? 'var(--fg-orange)' : 'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:20, color: activeSection===s ? '#fff' : 'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight:600 }}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>)}
          </div>
          {activeSection === 'voice' && (
            <div style={{ display:'grid', gap:12 }}>
              {result.brandArchetype && <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}><p style={{ margin:0, fontSize:13, color:'var(--fg-text3)' }}>Brand Archetype</p><p style={{ margin:'4px 0 0', fontSize:18, fontWeight:700, color:'var(--fg-text1)' }}>{result.brandArchetype}</p></div>}
              <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                <h4 style={{ margin:'0 0 10px', color:'var(--fg-text1)' }}>Voice Attributes</h4>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {(result.voiceAttributes||[]).map((a: string, i: number) => <span key={i} style={{ padding:'4px 12px', background:'rgba(255,100,30,0.15)', borderRadius:20, fontSize:12, color:'var(--fg-orange2)' }}>{a}</span>)}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div style={{ padding:16, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 8px', color:'#10b981', fontSize:13 }}>✅ Voice Dos</h4>
                  {(result.voiceDos||[]).map((d: string, i: number) => <p key={i} style={{ margin:'0 0 4px', fontSize:13, color:'var(--fg-text2)' }}>• {d}</p>)}
                </div>
                <div style={{ padding:16, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 8px', color:'#ef4444', fontSize:13 }}>❌ Voice Don'ts</h4>
                  {(result.voiceDonts||[]).map((d: string, i: number) => <p key={i} style={{ margin:'0 0 4px', fontSize:13, color:'var(--fg-text2)' }}>• {d}</p>)}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'colors' && (
            <div style={{ padding:20, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
              <h4 style={{ margin:'0 0 16px', color:'var(--fg-text1)' }}>Brand Color Palette</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
                {(result.colors||[]).map((c: any, i: number) => (
                  <div key={i} style={{ borderRadius:10, overflow:'hidden', border:'1px solid var(--border)' }}>
                    <div style={{ height:80, background:c.hex }} />
                    <div style={{ padding:10 }}>
                      <p style={{ margin:0, fontWeight:700, fontSize:13, color:'var(--fg-text1)' }}>{c.name}</p>
                      <p style={{ margin:'2px 0', fontSize:12, color:'var(--fg-text3)', fontFamily:'monospace' }}>{c.hex}</p>
                      <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{c.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
              {result.typography && (
                <div style={{ marginTop:16 }}>
                  <h4 style={{ margin:'0 0 8px', color:'var(--fg-text1)' }}>Typography</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    {[['Heading', result.typography.heading], ['Body', result.typography.body], ['Accent', result.typography.accent]].map(([k,v]) => v && (
                      <div key={k} style={{ padding:10, background:'var(--bg-surface2)', borderRadius:8 }}>
                        <p style={{ margin:0, fontSize:11, color:'var(--fg-text3)' }}>{k}</p>
                        <p style={{ margin:'4px 0 0', fontWeight:600, color:'var(--fg-text1)', fontFamily: String(v) }}>{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeSection === 'copy' && (
            <div style={{ display:'grid', gap:12 }}>
              {result.taglines && result.taglines.length > 0 && (
                <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 10px', color:'var(--fg-text1)' }}>Taglines</h4>
                  {result.taglines.map((t: string, i: number) => <p key={i} style={{ margin:'0 0 8px', fontSize:16, fontWeight:600, color:'var(--fg-text1)', fontStyle:'italic' }}>"{t}"</p>)}
                </div>
              )}
              {result.elevatorPitch && <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}><h4 style={{ margin:'0 0 8px' }}>Elevator Pitch</h4><p style={{ margin:0, fontSize:14, color:'var(--fg-text2)', lineHeight:1.6 }}>{result.elevatorPitch}</p></div>}
              {result.twitterBio && <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}><h4 style={{ margin:'0 0 8px' }}>Twitter/X Bio</h4><p style={{ margin:0, fontSize:14, color:'var(--fg-text2)' }}>{result.twitterBio}</p></div>}
              {result.linkedinAbout && <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}><h4 style={{ margin:'0 0 8px' }}>LinkedIn About</h4><p style={{ margin:0, fontSize:14, color:'var(--fg-text2)', lineHeight:1.6 }}>{result.linkedinAbout}</p></div>}
            </div>
          )}
          {activeSection === 'content' && (
            <div style={{ display:'grid', gap:12 }}>
              {result.contentPillars && result.contentPillars.length > 0 && (
                <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 12px', color:'var(--fg-text1)' }}>Content Pillars</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
                    {result.contentPillars.map((p: string, i: number) => (
                      <div key={i} style={{ padding:12, background:'var(--bg-surface2)', borderRadius:8, borderLeft:'3px solid var(--fg-orange)' }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:600, color:'var(--fg-text1)' }}>{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.competitorDifferentiators && result.competitorDifferentiators.length > 0 && (
                <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                  <h4 style={{ margin:'0 0 10px', color:'var(--fg-text1)' }}>Differentiators vs Competition</h4>
                  {result.competitorDifferentiators.map((d: string, i: number) => <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'var(--fg-text2)' }}>⚡ {d}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_coldsequence() {
  const [product, setProduct] = React.useState('');
  const [targetRole, setTargetRole] = React.useState('');
  const [pain, setPain] = React.useState('');
  const [sequenceLength, setSequenceLength] = React.useState(3);
  const [channel, setChannel] = React.useState('email');
  const [tone, setTone] = React.useState('professional');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeStep, setActiveStep] = React.useState(0);
  const apiBase = '';
  const token = getToken();

  const generate = async () => {
    if (!product.trim() || !targetRole.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${apiBase}/api/cold-sequence`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ product, targetRole, pain, sequenceLength, channel, tone }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
      setActiveStep(0);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-text1)', margin:0 }}>📨 Cold Outreach Sequencer</h2>
        <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'4px 0 0' }}>Multi-step sequences with timing, CTAs, and A/B test ideas</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>PRODUCT/SERVICE *</label>
          <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. AI-powered CRM for sales teams" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>TARGET ROLE *</label>
          <input value={targetRole} onChange={e=>setTargetRole(e.target.value)} placeholder="e.g. VP of Sales at Series B startups" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>PRIMARY PAIN POINT</label>
          <input value={pain} onChange={e=>setPain(e.target.value)} placeholder="e.g. Sales team spends 40% of time on manual data entry" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>CHANNEL</label>
          <select value={channel} onChange={e=>setChannel(e.target.value)} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4 }}>
            {['email','linkedin','sms','multi-channel'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>SEQUENCE LENGTH: {sequenceLength} steps</label>
          <input type="range" min={2} max={7} value={sequenceLength} onChange={e=>setSequenceLength(Number(e.target.value))} style={{ width:'100%', marginTop:8 }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>TONE</label>
          <select value={tone} onChange={e=>setTone(e.target.value)} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4 }}>
            {['professional','conversational','challenger','authority','friendly'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <button onClick={generate} disabled={loading||!product.trim()||!targetRole.trim()} style={{ padding:'10px 24px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading||!product.trim()||!targetRole.trim()?0.6:1 }}>
        {loading ? '⏳ Writing Sequence…' : '📨 Generate Sequence'}
      </button>
      {error && <div style={{ marginTop:12, padding:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:13 }}>{error}</div>}
      {result && (
        <div style={{ marginTop:24, display:'grid', gap:16 }}>
          <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
            <h3 style={{ margin:'0 0 4px', color:'var(--fg-text1)' }}>{result.sequenceName}</h3>
            {result.targetPersona && <p style={{ margin:'0 0 12px', color:'var(--fg-text3)', fontSize:13 }}>{result.targetPersona.role}</p>}
            <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto' }}>
              {(result.steps||[]).map((s: any, i: number) => (
                <button key={i} onClick={() => setActiveStep(i)} style={{ flexShrink:0, padding:'6px 14px', background: activeStep===i ? 'var(--fg-orange)' : 'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:20, color: activeStep===i ? '#fff' : 'var(--fg-text3)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  Step {s.stepNumber} {s.dayOffset > 0 ? `(Day ${s.dayOffset})` : '(Day 0)'}
                </button>
              ))}
            </div>
            {result.steps && result.steps[activeStep] && (
              <div style={{ padding:16, background:'var(--bg-surface2)', borderRadius:10 }}>
                {result.steps[activeStep].subject && <p style={{ margin:'0 0 8px', fontWeight:700, color:'var(--fg-text1)' }}>Subject: {result.steps[activeStep].subject}</p>}
                <div style={{ whiteSpace:'pre-wrap', fontSize:14, color:'var(--fg-text2)', lineHeight:1.7, padding:12, background:'var(--bg-surface)', borderRadius:8 }}>{result.steps[activeStep].body}</div>
                {result.steps[activeStep].cta && <p style={{ margin:'10px 0 0', fontSize:13 }}><strong style={{color:'var(--fg-orange)'}}>CTA:</strong> {result.steps[activeStep].cta}</p>}
                {result.steps[activeStep].estimatedOpenRate && <p style={{ margin:'4px 0 0', fontSize:12, color:'var(--fg-text3)' }}>📊 Est. open rate: {result.steps[activeStep].estimatedOpenRate}</p>}
                {result.steps[activeStep].tip && <p style={{ margin:'8px 0 0', fontSize:12, color:'#3b82f6' }}>💡 {result.steps[activeStep].tip}</p>}
              </div>
            )}
          </div>
          {result.abTestIdeas && result.abTestIdeas.length > 0 && (
            <div style={{ padding:16, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:12 }}>
              <h4 style={{ margin:'0 0 10px', color:'#8b5cf6', fontSize:14 }}>🧪 A/B Test Ideas</h4>
              {result.abTestIdeas.map((t: string, i: number) => <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'var(--fg-text2)' }}>• {t}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForgeTab_npsanalyzer() {
  const [reviews, setReviews] = React.useState('');
  const [npsScore, setNpsScore] = React.useState('');
  const [period, setPeriod] = React.useState('last 30 days');
  const [productName, setProductName] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const apiBase = '';
  const token = getToken();

  const generate = async () => {
    if (!reviews.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch(`${apiBase}/api/nps-analyzer`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({ reviews, npsScore, period, productName }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setResult(d.result);
    } catch(e: any) { setError(e.message); }
    setLoading(false);
  };

  const sentimentColor = (s: string) => s === 'positive' ? '#10b981' : s === 'negative' ? '#ef4444' : '#f59e0b';

  return (
    <div style={{ padding:24, maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-text1)', margin:0 }}>⭐ NPS & Review Analyzer</h2>
        <p style={{ color:'var(--fg-text3)', fontSize:13, margin:'4px 0 0' }}>Extract themes, risks, quick wins and response templates from customer feedback</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>PRODUCT/COMPANY NAME</label>
          <input value={productName} onChange={e=>setProductName(e.target.value)} placeholder="e.g. Forge AI" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>NPS SCORE (optional)</label>
          <input value={npsScore} onChange={e=>setNpsScore(e.target.value)} placeholder="e.g. 42" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>TIME PERIOD</label>
          <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="e.g. Q3 2024" style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:14, marginTop:4, boxSizing:'border-box' }} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:12, color:'var(--fg-text3)', fontWeight:600 }}>PASTE REVIEWS / FEEDBACK *</label>
          <textarea value={reviews} onChange={e=>setReviews(e.target.value)} placeholder="Paste customer reviews, NPS comments, support tickets, or any feedback here..." rows={6} style={{ width:'100%', padding:'8px 12px', background:'var(--bg-surface2)', border:'1px solid var(--border)', borderRadius:8, color:'var(--fg-text1)', fontSize:13, marginTop:4, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }} />
        </div>
      </div>
      <button onClick={generate} disabled={loading||!reviews.trim()} style={{ padding:'10px 24px', background:'var(--fg-orange)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', opacity:loading||!reviews.trim()?0.6:1 }}>
        {loading ? '⏳ Analyzing…' : '⭐ Analyze Feedback'}
      </button>
      {error && <div style={{ marginTop:12, padding:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:13 }}>{error}</div>}
      {result && (
        <div style={{ marginTop:24, display:'grid', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            <div style={{ padding:16, background:'var(--bg-surface)', border:`2px solid ${sentimentColor(result.overallSentiment)}`, borderRadius:12, textAlign:'center' }}>
              <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)' }}>Overall Sentiment</p>
              <p style={{ margin:'4px 0 0', fontSize:22, fontWeight:700, color:sentimentColor(result.overallSentiment) }}>{result.overallSentiment?.toUpperCase()}</p>
              {result.sentimentScore !== undefined && <p style={{ margin:'4px 0 0', fontSize:13, color:'var(--fg-text3)' }}>Score: {result.sentimentScore}/10</p>}
            </div>
            <div style={{ padding:16, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}>
              <p style={{ margin:0, fontSize:12, color:'#10b981', fontWeight:600 }}>TOP PRAISES</p>
              {(result.topPraises||[]).slice(0,3).map((p: string, i: number) => <p key={i} style={{ margin:'4px 0 0', fontSize:12, color:'var(--fg-text2)' }}>• {p}</p>)}
            </div>
            <div style={{ padding:16, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12 }}>
              <p style={{ margin:0, fontSize:12, color:'#ef4444', fontWeight:600 }}>TOP COMPLAINTS</p>
              {(result.topComplaints||[]).slice(0,3).map((c: string, i: number) => <p key={i} style={{ margin:'4px 0 0', fontSize:12, color:'var(--fg-text2)' }}>• {c}</p>)}
            </div>
          </div>
          {result.themes && result.themes.length > 0 && (
            <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
              <h4 style={{ margin:'0 0 12px', color:'var(--fg-text1)' }}>Themes</h4>
              {result.themes.map((t: any, i: number) => (
                <div key={i} style={{ marginBottom:10, padding:12, background:'var(--bg-surface2)', borderRadius:8, borderLeft:`3px solid ${sentimentColor(t.sentiment)}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontWeight:600, fontSize:13, color:'var(--fg-text1)' }}>{t.theme}</span>
                    <span style={{ padding:'2px 8px', background:`${sentimentColor(t.sentiment)}22`, color:sentimentColor(t.sentiment), borderRadius:4, fontSize:11 }}>{t.sentiment}</span>
                    <span style={{ fontSize:11, color:'var(--fg-text3)', marginLeft:'auto' }}>Impact: {t.impact} • x{t.frequency}</span>
                  </div>
                  {t.quotes && t.quotes.length > 0 && <p style={{ margin:0, fontSize:12, color:'var(--fg-text3)', fontStyle:'italic' }}>"{t.quotes[0]}"</p>}
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {result.quickWins && result.quickWins.length > 0 && (
              <div style={{ padding:16, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12 }}>
                <h4 style={{ margin:'0 0 10px', color:'#10b981' }}>⚡ Quick Wins</h4>
                {result.quickWins.map((w: string, i: number) => <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'var(--fg-text2)' }}>• {w}</p>)}
              </div>
            )}
            {result.churnRisks && result.churnRisks.length > 0 && (
              <div style={{ padding:16, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12 }}>
                <h4 style={{ margin:'0 0 10px', color:'#ef4444' }}>⚠️ Churn Risks</h4>
                {result.churnRisks.map((r: string, i: number) => <p key={i} style={{ margin:'0 0 6px', fontSize:13, color:'var(--fg-text2)' }}>• {r}</p>)}
              </div>
            )}
          </div>
          {result.strategicActions && result.strategicActions.length > 0 && (
            <div style={{ padding:16, background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
              <h4 style={{ margin:'0 0 12px', color:'var(--fg-text1)' }}>Strategic Actions</h4>
              {result.strategicActions.map((a: any, i: number) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:8, alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, color:'var(--fg-text1)' }}>{a.action}</span>
                  <span style={{ padding:'2px 8px', background:'rgba(59,130,246,0.15)', borderRadius:4, fontSize:11, color:'#3b82f6', whiteSpace:'nowrap' }}>Effort: {a.effort}</span>
                  <span style={{ padding:'2px 8px', background:'rgba(16,185,129,0.15)', borderRadius:4, fontSize:11, color:'#10b981', whiteSpace:'nowrap' }}>Impact: {a.impact}</span>
                  <span style={{ fontSize:11, color:'var(--fg-text3)', whiteSpace:'nowrap' }}>{a.timeline}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
