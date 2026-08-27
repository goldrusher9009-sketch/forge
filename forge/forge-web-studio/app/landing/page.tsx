'use client';
import React, { useState, useEffect, useRef } from 'react';

const APP_URL = 'https://forge-sand-two.vercel.app';

/* ── Neural canvas background ── */
function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x:number; y:number; z:number; vx:number; vy:number };
    let pts: P[] = [];
    let mx = 0.5, my = 0.5;
    function resize() { w = canvas!.clientWidth; h = canvas!.clientHeight; canvas!.width = w*dpr; canvas!.height = h*dpr; ctx!.setTransform(dpr,0,0,dpr,0,0); }
    function seed() { pts = Array.from({length:55},()=>({x:Math.random()*w,y:Math.random()*h,z:Math.random(),vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22})); }
    const onMove = (e:MouseEvent)=>{mx=e.clientX/window.innerWidth;my=e.clientY/window.innerHeight;};
    window.addEventListener('mousemove',onMove); window.addEventListener('resize',()=>{resize();seed();});
    function frame() {
      ctx!.clearRect(0,0,w,h);
      const par=(mx-.5)*28,par2=(my-.5)*18;
      for(const p of pts){ p.x+=p.vx+par*.008*p.z; p.y+=p.vy+par2*.008*p.z; if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0; }
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.hypot(dx,dy);if(d<120){ctx!.strokeStyle=`rgba(255,80,100,${(1-d/120)*.15})`;ctx!.lineWidth=.8;ctx!.beginPath();ctx!.moveTo(pts[i].x,pts[i].y);ctx!.lineTo(pts[j].x,pts[j].y);ctx!.stroke();}}
      for(const p of pts){const r=1+p.z*2;ctx!.fillStyle=`rgba(255,${90+p.z*90},${100+p.z*55},${.35+p.z*.45})`;ctx!.beginPath();ctx!.arc(p.x,p.y,r,0,Math.PI*2);ctx!.fill();}
      raf=requestAnimationFrame(frame);
    }
    resize(); seed(); frame();
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener('mousemove',onMove);};
  },[]);
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} />;
}

/* ── Animated counter ── */
function CountUp({target,suffix='',prefix=''}:{target:number;suffix?:string;prefix?:string}) {
  const [count,setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{
      if(e.isIntersecting){let s=0;const step=target/50;const t=setInterval(()=>{s+=step;if(s>=target){setCount(target);clearInterval(t);}else setCount(Math.floor(s));},20);}
    },{threshold:.5});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[target]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ── Typewriter ── */
function TypewriterText() {
  const PHRASES = ['The AI OS for Small Business.','Run with clear permissions and approvals.','Route every task to the right model.','Turn objectives into traceable outcomes.'];
  const [idx,setIdx]=useState(0); const [disp,setDisp]=useState(''); const [del,setDel]=useState(false);
  useEffect(()=>{
    const phrase=PHRASES[idx];
    if(!del&&disp.length<phrase.length){const t=setTimeout(()=>setDisp(phrase.slice(0,disp.length+1)),46);return()=>clearTimeout(t);}
    if(!del&&disp.length===phrase.length){const t=setTimeout(()=>setDel(true),2400);return()=>clearTimeout(t);}
    if(del&&disp.length>0){const t=setTimeout(()=>setDisp(disp.slice(0,-1)),20);return()=>clearTimeout(t);}
    if(del&&disp.length===0){setDel(false);setIdx((idx+1)%PHRASES.length);}
  },[disp,del,idx]);
  return <span style={{color:'#ff1f35'}}>{disp}<span style={{animation:'blink 1s step-end infinite'}}>|</span></span>;
}

/* ── Data ── */
const CAPABILITY_MATRIX = [
  {feature:'Creator-linked agent identity',status:'Implemented',evidence:'Agent Passport records the owner, version, policies, and Apptopia mapping.'},
  {feature:'Manual and automatic model routing',status:'Implemented',evidence:'BYOK, platform models, cost modes, and routing decisions share one execution path.'},
  {feature:'Permissioned autonomous execution',status:'Controlled release',evidence:'Goals, tool allowlists, token/cost budgets, cancellation, and approval states are persisted.'},
  {feature:'Commercial usage enforcement',status:'Implemented',evidence:'Core execution records usage and prepaid overage in atomic billing transactions.'},
  {feature:'Benchmark and verification handoff',status:'Pilot proven',evidence:'Apptopia persists AgentVersion, trace, hashes, rubric review, and approval evidence.'},
  {feature:'Approved knowledge registration',status:'Pilot proven',evidence:'Only approved evidence is accepted by Minera as a knowledge asset.'},
];

const COMMERCIAL_CONTROLS = [
  {icon:'💳', name:'Verified subscriptions', value:'$99–$499/mo', desc:'Paid access is granted only by verified Stripe events.', color:'#6366f1'},
  {icon:'📏', name:'Metered core execution', value:'5 core paths', desc:'Chat, Threads, Agent Runs, Autonomous, and Phone Agent share usage enforcement.', color:'#ff1f35'},
  {icon:'🔑', name:'Controlled BYOK', value:'User-paid provider cost', desc:'Historical tools require a paid plan and a user-owned key during controlled release.', color:'#f59e0b'},
  {icon:'🧾', name:'Auditable overage', value:'$1.50 / 1M tokens', desc:'Prepaid debits, balances, and reasons are written to the existing credit ledger.', color:'#10b981'},
];

const TRUST_LAYERS = [
  {icon:'🪪', title:'Persistent ownership', badge:'IDENTITY', badgeColor:'#6366f1', desc:'Each pilot execution is attributable to a creator-linked Agent Passport and an explicit commercial AgentVersion mapping.'},
  {icon:'🛡️', title:'Bounded authority', badge:'CONTROL', badgeColor:'#ff1f35', desc:'Budgets, allowed tools, cancellation, and human approval states constrain consequential autonomous and phone actions.'},
  {icon:'✅', title:'Verifiable evidence', badge:'PROOF', badgeColor:'#10b981', desc:'Request and result hashes, execution traces, rubric reviews, and approval decisions survive the Forge-to-Apptopia handoff.'},
  {icon:'💰', title:'Revenue integrity', badge:'BILLING', badgeColor:'#f59e0b', desc:'Unpaid events grant nothing, paid renewals are webhook-driven, and platform-key execution is restricted to canonically metered paths.'},
];

const TESTIMONIALS = [
  {quote:'Every pilot execution stayed private until its owner approved the evidence for verification.', name:'Verified internal pilot — approval boundary', avatar:'🪪'},
  {quote:'Apptopia rejected tampered evidence and preserved the canonical AgentVersion and execution trace.', name:'Verified internal pilot — benchmark evidence', avatar:'✅'},
  {quote:'Only approved and verified results reached Minera; rejected work earned no asset or duplicate reward.', name:'Verified internal pilot — mining gate', avatar:'⛏️'},
];

const PROBLEM_STATS = [
  {n:'10K', label:'Tokens in a genuine Free workspace'},
  {n:'5', label:'Core execution paths under commercial metering'},
  {n:'3', label:'Products connected in the verified pilot lifecycle'},
  {n:'1', label:'Required approval gate before knowledge registration'},
];

const HOW_STEPS = [
  {num:'01',icon:'✍️',title:'Create the workspace',subtitle:'Identity and ownership first.',color:'#6366f1',desc:'Register a workspace, select the business context, and attach each agent to its authenticated creator.',mock:'onboard'},
  {num:'02',icon:'🤖',title:'Set the execution boundary',subtitle:'Models, tools, budgets, approvals.',color:'#ff1f35',desc:'Choose a model policy, allowed tools, token and cost budgets, and the actions that require human approval.',mock:'agents'},
  {num:'03',icon:'✅',title:'Review the evidence',subtitle:'Trace before trust.',color:'#f59e0b',desc:'Inspect the output, model, cost, tool activity, hashes, and approval state before publishing or external action.',mock:'brief'},
  {num:'04',icon:'🧠',title:'Promote approved learning',subtitle:'Corrections become governed context.',color:'#10b981',desc:'Approved work and corrections can improve future execution while rejected evidence remains outside the trusted lifecycle.',mock:'brain'},
];

function MockScreen({type}:{type:string}) {
  if(type==='onboard') return (
    <div style={{background:'#0a0a12',borderRadius:10,padding:22,fontFamily:'monospace',fontSize:12}}>
      <div style={{color:'#333',marginBottom:12,fontSize:10}}>illustrative controlled workspace setup</div>
      <div style={{color:'#888',marginBottom:14,fontSize:13,fontWeight:600}}>What does your business do?</div>
      <div style={{background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.4)',borderRadius:7,padding:'10px 14px',color:'#a5b4fc',marginBottom:14,fontSize:12}}>
        I run a boutique law firm — real estate closings, 4 staff<span style={{animation:'blink 1s step-end infinite',color:'#6366f1'}}>|</span>
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:14}}>
        {['⚖️ Law','📄 Contracts','🏡 Real Estate','👥 Small Team'].map(t=>(
          <span key={t} style={{padding:'3px 9px',background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.25)',borderRadius:20,fontSize:10,color:'#818cf8'}}>{t}</span>
        ))}
      </div>
      <div style={{background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:7,padding:10,fontSize:11,color:'#6366f1'}}>
        ✓ Creator identity attached · model policy ready · approval queue enabled
      </div>
    </div>
  );
  if(type==='agents') return (
    <div style={{background:'#0a0a12',borderRadius:10,padding:18,fontSize:11}}>
      <div style={{color:'#333',marginBottom:12,fontSize:10}}>illustrative execution boundary</div>
      {[{n:'Research Agent',s:'allowed',t:'OpenRouter · 20K-token budget · no external writes',c:'#10b981'},{n:'Content Agent',s:'approval',t:'Draft-only · owner approval required to publish',c:'#f59e0b'},{n:'Phone Agent',s:'planning',t:'Planning mode · every action requires confirmation',c:'#6366f1'},{n:'Agent Run',s:'metered',t:'Usage, cost, trace, and result hash recorded',c:'#ff1f35'}].map(a=>(
        <div key={a.n} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:a.c,flexShrink:0,marginTop:3,boxShadow:a.s==='running'?`0 0 7px ${a.c}`:'none'}}/>
          <div style={{flex:1}}><div style={{color:'#ddd',fontWeight:600,marginBottom:1}}>{a.n}</div><div style={{color:'#555'}}>{a.t}</div></div>
          <div style={{fontSize:9,color:a.c,textTransform:'uppercase' as const,letterSpacing:.5,marginTop:2}}>{a.s}</div>
        </div>
      ))}
    </div>
  );
  if(type==='brief') return (
    <div style={{background:'#0a0a12',borderRadius:10,padding:18,fontSize:11}}>
      <div style={{color:'#333',marginBottom:8,fontSize:10}}>illustrative evidence review</div>
      <div style={{color:'#f59e0b',fontSize:14,fontWeight:700,marginBottom:14}}>✅ Execution completed — approval pending.</div>
      {[{i:'🪪',t:'Creator and Agent Passport verified',a:'View'},{i:'🧭',t:'Model and routing reason recorded',a:'Inspect'},{i:'🧾',t:'Usage and prepaid ledger reconciled',a:'Audit'},{i:'🔐',t:'Request and result hashes preserved',a:'Review'}].map((item,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
          <span style={{fontSize:13}}>{item.i}</span>
          <div style={{flex:1,color:'#bbb',fontSize:11}}>{item.t}</div>
          <button style={{padding:'3px 9px',background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.25)',borderRadius:5,color:'#f59e0b',fontSize:9,cursor:'pointer'}}>{item.a}</button>
        </div>
      ))}
      <div style={{marginTop:12,padding:'9px 12px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.18)',borderRadius:7,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:'#78350f',fontSize:11}}>Publish only after evidence review</span>
        <button style={{padding:'5px 14px',background:'#f59e0b',border:'none',borderRadius:5,color:'#000',fontSize:11,fontWeight:700,cursor:'pointer'}}>Review approval</button>
      </div>
    </div>
  );
  if(type==='brain') return (
    <div style={{background:'#0a0a12',borderRadius:10,padding:18,fontSize:11}}>
      <div style={{color:'#333',marginBottom:12,fontSize:10}}>illustrative approved learning record</div>
      <div style={{color:'#10b981',fontSize:12,fontWeight:600,marginBottom:10}}>🧠 Owner-approved context</div>
      {[{l:'Communication preference',v:'Professional but warm. Avoid unsupported claims.'},{l:'Permission boundary',v:'External messages require owner approval.'},{l:'Model policy',v:'Prefer lower cost unless quality evidence requires premium.'},{l:'Correction provenance',v:'Promoted from an approved review, not passive harvesting.'},{l:'Revocation',v:'Owner can remove or replace the learned instruction.'}].map((item,i)=>(
        <div key={i} style={{padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
          <div style={{color:'#444',fontSize:9,textTransform:'uppercase' as const,letterSpacing:.5,marginBottom:2}}>{item.l}</div>
          <div style={{color:'#ccc'}}>{item.v}</div>
        </div>
      ))}
      <div style={{marginTop:10,fontSize:10,color:'#2d3748'}}>Only approved context belongs in the trusted learning lifecycle.</div>
    </div>
  );
  return null;
}

function HowItWorks() {
  const [active,setActive] = useState(0);
  const step = HOW_STEPS[active];
  return (
    <section style={{padding:'100px 5%',background:'rgba(255,255,255,.015)'}}>
      <div style={{textAlign:'center',marginBottom:56}}>
        <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(255,31,53,.08)',border:'1px solid rgba(255,31,53,.2)',borderRadius:20,fontSize:11,color:'#ff6b7a',letterSpacing:1,fontWeight:700,marginBottom:16}}>HOW IT WORKS</div>
        <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:0}}>From identity to approved outcome</h2>
        <p style={{color:'#666',fontSize:15,marginTop:12}}>A controlled lifecycle with explicit ownership, authority, evidence, and billing.</p>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:44,flexWrap:'wrap' as const}}>
        {HOW_STEPS.map((s,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{padding:'9px 20px',background:active===i?s.color:'rgba(255,255,255,.04)',border:`1px solid ${active===i?s.color:'rgba(255,255,255,.08)'}`,borderRadius:30,fontSize:12,fontWeight:active===i?700:400,color:active===i?'#fff':'#666',cursor:'pointer',transition:'all .2s'}}>
            {s.icon} {s.num}. {s.title}
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:36,maxWidth:1060,margin:'0 auto',alignItems:'center'}}>
        <div>
          <div style={{display:'inline-block',padding:'3px 11px',background:`${step.color}20`,border:`1px solid ${step.color}35`,borderRadius:20,fontSize:10,color:step.color,letterSpacing:1,fontWeight:700,marginBottom:14}}>{step.num}</div>
          <div style={{fontSize:'clamp(20px,2.8vw,32px)',fontWeight:900,lineHeight:1.2,marginBottom:12}}>{step.icon} {step.title}</div>
          <div style={{fontSize:14,color:step.color,fontWeight:600,marginBottom:14}}>{step.subtitle}</div>
          <p style={{color:'#888',fontSize:14,lineHeight:1.85,marginBottom:24}}>{step.desc}</p>
          <div style={{display:'flex',gap:8}}>
            {HOW_STEPS.map((_,i)=>(
              <button key={i} onClick={()=>setActive(i)} style={{width:i===active?26:7,height:7,borderRadius:4,background:i===active?step.color:'rgba(255,255,255,.1)',border:'none',cursor:'pointer',transition:'all .3s'}} />
            ))}
          </div>
        </div>
        <div style={{border:`1px solid ${step.color}28`,borderRadius:14,overflow:'hidden'}}>
          <div style={{background:`${step.color}0d`,borderBottom:`1px solid ${step.color}18`,padding:'9px 14px',display:'flex',gap:5}}>
            <div style={{width:9,height:9,borderRadius:'50%',background:'#ff5f57'}}/><div style={{width:9,height:9,borderRadius:'50%',background:'#febc2e'}}/><div style={{width:9,height:9,borderRadius:'50%',background:'#28c840'}}/>
          </div>
          <MockScreen type={step.mock} />
        </div>
      </div>
      <div style={{textAlign:'center',marginTop:52}}>
        <a href={`${APP_URL}/register`} style={{display:'inline-block',padding:'13px 32px',background:'#ff1f35',borderRadius:10,fontSize:14,fontWeight:700,color:'#fff',animation:'glow 3s ease-in-out infinite'}}>Create a controlled workspace →</a>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [activeTest, setActiveTest] = useState(0);

  useEffect(()=>{
    const t = setInterval(()=>setActiveTest(p=>(p+1)%TESTIMONIALS.length),4000);
    return ()=>clearInterval(t);
  },[]);

  const PLANS = [
    {name:'Starter',price:99,color:'#6366f1',features:['500K monthly execution tokens','$20 monthly Forge credits','BYOK and model routing','Owner approval queue','Usage history']},
    {name:'Pro',price:299,color:'#ff1f35',popular:true,features:['2M monthly execution tokens','$75 monthly Forge credits','BYOK and Auto Mode','Agent Passport','Usage and audit history']},
    {name:'Agency',price:499,color:'#10b981',features:['10M monthly execution tokens','$200 monthly Forge credits','BYOK and Auto Mode','Agent Passport','Usage and audit history']},
  ];

  return (
    <div style={{background:'#07070b',color:'#e0e0e0',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',minHeight:'100vh',overflowX:'hidden'}}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(255,31,53,.3)}50%{box-shadow:0 0 46px rgba(255,31,53,.65)}}
        @keyframes fadeup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slide{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        *{box-sizing:border-box} a{color:inherit;text-decoration:none}
        ::selection{background:rgba(255,31,53,.3)}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0a0a0f}::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
        @media(max-width:760px){.nav-links{display:none!important}.two-col{grid-template-columns:1fr!important}.hide-mobile{display:none!important}}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(7,7,11,.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'0 5%',display:'flex',alignItems:'center',justifyContent:'space-between',height:62}}>
        <div style={{fontSize:21,fontWeight:800,letterSpacing:-.5}}>
          <span style={{color:'#ff1f35'}}>Forge</span><span style={{color:'#333',fontSize:11,marginLeft:5,fontWeight:400}}>OS</span>
        </div>
        <div className="nav-links" style={{display:'flex',gap:26,fontSize:13,color:'#777'}}>
          {[['Problem','#problem'],['Capabilities','#solution'],['Controls','#model'],['Trust','#trust'],['Pricing','#pricing']].map(([l,h])=>(
            <a key={l} href={h} onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='#777')}>{l}</a>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <a href={`${APP_URL}/login`} style={{padding:'7px 16px',border:'1px solid rgba(255,255,255,.12)',borderRadius:7,fontSize:12,color:'#bbb'}}>Log in</a>
          <a href={`${APP_URL}/register`} style={{padding:'7px 16px',background:'#ff1f35',borderRadius:7,fontSize:12,fontWeight:600,color:'#fff',animation:'glow 3s ease-in-out infinite'}}>Start free</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{position:'relative',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'120px 5% 80px',textAlign:'center'}}>
        <NeuralCanvas />
        <div style={{position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',width:680,height:680,background:'radial-gradient(circle,rgba(255,31,53,.11) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'relative',zIndex:2,animation:'fadeup .8s ease both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,31,53,.08)',border:'1px solid rgba(255,31,53,.25)',borderRadius:20,padding:'5px 16px',fontSize:11,color:'#ff6b7a',marginBottom:24,fontWeight:700,letterSpacing:.8}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#ff1f35',display:'inline-block',animation:'glow 2s ease-in-out infinite'}}/>
            CONTROLLED RELEASE · CREATOR-OWNED AGENTS · APPROVAL-GATED
          </div>
          <h1 style={{fontSize:'clamp(36px,6.5vw,78px)',fontWeight:900,lineHeight:1.06,letterSpacing:-2.5,margin:'0 auto 22px',maxWidth:940,minHeight:'1.1em'}}>
            <TypewriterText />
          </h1>
          <p style={{fontSize:18,color:'#9a9aa5',maxWidth:580,margin:'0 auto 16px',lineHeight:1.75}}>
            Forge gives every agent a persistent creator-linked identity, routes work across available models and tools, and keeps consequential actions inside explicit permissions and approval boundaries.
          </p>
          <p style={{fontSize:13,color:'#555',marginBottom:36}}>BYOK provider costs stay with your provider · Hosted usage is metered · Cancel through Stripe</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' as const}}>
            <a href={`${APP_URL}/register`} style={{padding:'14px 32px',background:'#ff1f35',borderRadius:10,fontSize:15,fontWeight:700,color:'#fff',animation:'glow 3s ease-in-out infinite',display:'inline-block'}}>Start free — no card required</a>
            <a href="#solution" style={{padding:'14px 32px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.11)',borderRadius:10,fontSize:15,color:'#ccc',display:'inline-block'}}>See the verified capabilities ↓</a>
          </div>

          {/* Metric strip */}
          <div style={{display:'flex',gap:0,justifyContent:'center',marginTop:64,flexWrap:'wrap' as const,borderTop:'1px solid rgba(255,255,255,.06)',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'28px 0'}}>
            {[
              {n:10,s:'K',p:'',label:'Free workspace tokens',color:'#ff1f35'},
              {n:5,s:'',p:'',label:'Metered core execution paths',color:'#6366f1'},
              {n:3,s:'',p:'',label:'Products in the pilot lifecycle',color:'#10b981'},
              {n:1,s:'',p:'',label:'Approval gate before mining',color:'#f59e0b'},
            ].map((stat,i)=>(
              <div key={i} style={{textAlign:'center',padding:'0 36px',borderRight:i<3?'1px solid rgba(255,255,255,.06)':'none'}}>
                <div style={{fontSize:'clamp(28px,3.5vw,42px)',fontWeight:900,color:stat.color,lineHeight:1,letterSpacing:-1}}>
                  <CountUp target={stat.n} suffix={stat.s} prefix={stat.p}/>
                </div>
                <div style={{fontSize:12,color:'#555',marginTop:5}}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" style={{padding:'100px 5%'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:20,fontSize:11,color:'#f87171',letterSpacing:1,fontWeight:700,marginBottom:16}}>THE PROBLEM</div>
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>Agent features are not enough without a trusted lifecycle.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:620,margin:'0 auto',lineHeight:1.7}}>Identity, execution, evidence, approval, verification, learning, and billing must agree on who acted, under what authority, at what cost, and with what result.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20,marginBottom:52}}>
            {PROBLEM_STATS.map((s,i)=>(
              <div key={i} style={{padding:'28px 24px',background:'rgba(239,68,68,.04)',border:'1px solid rgba(239,68,68,.12)',borderRadius:14,textAlign:'center'}}>
                <div style={{fontSize:'clamp(28px,3vw,40px)',fontWeight:900,color:'#ef4444',letterSpacing:-1,marginBottom:8}}>{s.n}</div>
                <div style={{fontSize:12,color:'#666',lineHeight:1.5}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(255,31,53,.04)',border:'1px solid rgba(255,31,53,.12)',borderRadius:16,padding:'36px 44px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:28}}>
            {[{icon:'🪪',t:'Identity gaps',d:'Outputs cannot be trusted or sold when the creator, agent version, and authority are ambiguous.'},
              {icon:'🛡️',t:'Control gaps',d:'Autonomy without budgets, tool allowlists, cancellation, and approval gates creates operational risk.'},
              {icon:'🧾',t:'Cost gaps',d:'Provider calls without canonical usage and ledger records create unrecoverable platform cost.'},
              {icon:'✅',t:'Evidence gaps',d:'A result cannot become a verified product or knowledge asset without trace, hashes, review, and approval.'},
            ].map((item,i)=>(
              <div key={i}>
                <div style={{fontSize:28,marginBottom:10}}>{item.icon}</div>
                <div style={{fontSize:14,fontWeight:700,marginBottom:8,color:'#e0e0e0'}}>{item.t}</div>
                <div style={{fontSize:13,color:'#666',lineHeight:1.7}}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution" style={{padding:'100px 5%',background:'rgba(255,255,255,.015)'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)',borderRadius:20,fontSize:11,color:'#34d399',letterSpacing:1,fontWeight:700,marginBottom:16}}>THE SOLUTION</div>
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>One governed lifecycle across three products.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:620,margin:'0 auto',lineHeight:1.7}}>Forge owns identity and execution, Apptopia owns verification and commercial AgentVersion evidence, and Minera accepts only approved knowledge assets.</p>
          </div>

          {/* Source-grounded capability matrix */}
          <div style={{overflowX:'auto' as const,marginBottom:52}}>
            <table style={{width:'100%',borderCollapse:'collapse' as const,minWidth:640,fontSize:13}}>
              <thead>
                <tr>
                  <th style={{padding:'12px 16px',textAlign:'left' as const,color:'#555',fontWeight:600,fontSize:11,textTransform:'uppercase' as const,letterSpacing:.5,borderBottom:'1px solid rgba(255,255,255,.06)'}}>Capability</th>
                  <th style={{padding:'12px 20px',textAlign:'left' as const,color:'#555',fontWeight:600,fontSize:11,textTransform:'uppercase' as const,letterSpacing:.5,borderBottom:'1px solid rgba(255,255,255,.06)'}}>Current state</th>
                  <th style={{padding:'12px 20px',textAlign:'left' as const,color:'#555',fontWeight:600,fontSize:11,textTransform:'uppercase' as const,letterSpacing:.5,borderBottom:'1px solid rgba(255,255,255,.06)'}}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {CAPABILITY_MATRIX.map((row,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <td style={{padding:'10px 16px',color:'#aaa',fontSize:12}}>{row.feature}</td>
                    <td style={{padding:'10px 20px',color:row.status==='Implemented'?'#10b981':'#f59e0b',fontSize:12,fontWeight:700}}>{row.status}</td>
                    <td style={{padding:'10px 20px',color:'#777',fontSize:12,lineHeight:1.6}}>{row.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pilot proof callout */}
          <div style={{background:'linear-gradient(135deg,rgba(255,31,53,.06),rgba(16,185,129,.04))',border:'1px solid rgba(255,31,53,.18)',borderRadius:14,padding:'24px 32px',display:'flex',gap:20,alignItems:'center',flexWrap:'wrap' as const}}>
            <span style={{fontSize:32}}>🔗</span>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>The internal pilot proves the complete trust handoff.</div>
              <div style={{fontSize:13,color:'#888',lineHeight:1.6}}>Forge produced a traceable artifact, Apptopia preserved and reviewed the evidence, and Minera accepted only the approved result. Rejected or tampered evidence did not enter the trusted asset lifecycle.</div>
            </div>
            <a href={`${APP_URL}/register`} style={{marginLeft:'auto',padding:'10px 22px',background:'#ff1f35',borderRadius:8,fontSize:13,fontWeight:600,color:'#fff',flexShrink:0}}>Create workspace →</a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── COMMERCIAL CONTROLS ── */}
      <section id="model" style={{padding:'100px 5%',background:'rgba(255,255,255,.015)'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:20,fontSize:11,color:'#fbbf24',letterSpacing:1,fontWeight:700,marginBottom:16}}>COMMERCIAL CONTROLS</div>
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>Revenue is enforced in the execution path.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:620,margin:'0 auto',lineHeight:1.7}}>Subscriptions, hosted-model capacity, BYOK boundaries, prepaid overage, and cancellation reuse the existing billing and credit ledger rather than a second accounting system.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16,marginBottom:52}}>
            {COMMERCIAL_CONTROLS.map((r,i)=>(
              <div key={i} style={{padding:'22px 20px',background:`${r.color}08`,border:`1px solid ${r.color}20`,borderRadius:14}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <span style={{fontSize:20}}>{r.icon}</span>
                  <span style={{fontSize:11,fontWeight:700,color:r.color,padding:'2px 8px',background:`${r.color}15`,borderRadius:20,letterSpacing:.5}}>{r.value}</span>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:'#e0e0e0',marginBottom:4}}>{r.name}</div>
                <div style={{fontSize:12,color:'#666'}}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'20px 24px',background:'rgba(245,158,11,.04)',border:'1px solid rgba(245,158,11,.16)',borderRadius:12,fontSize:13,color:'#888',lineHeight:1.8}}>
            Controlled-release boundary: legacy catalog tools are paid-plan BYOK until their usage is moved into the canonical metered path. Marketplace seller payouts and Minera demo-economy rewards are not represented as production revenue.
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section id="trust" style={{padding:'100px 5%'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:20,fontSize:11,color:'#a5b4fc',letterSpacing:1,fontWeight:700,marginBottom:16}}>TRUST ARCHITECTURE</div>
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>Commercial agents need more than capability.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:620,margin:'0 auto',lineHeight:1.7}}>Persistent ownership, bounded authority, verifiable evidence, and revenue integrity make an agent usable in a controlled commercial workflow.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(460px,1fr))',gap:20}}>
            {TRUST_LAYERS.map((m,i)=>(
              <div key={i} style={{padding:'28px 32px',background:`${m.badgeColor}06`,border:`1px solid ${m.badgeColor}20`,borderRadius:16}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`${m.badgeColor}15`,border:`1px solid ${m.badgeColor}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{m.icon}</div>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:m.badgeColor,textTransform:'uppercase' as const,letterSpacing:.8,marginBottom:3}}>{m.badge}</div>
                    <div style={{fontSize:16,fontWeight:800,color:'#fff'}}>{m.title}</div>
                  </div>
                </div>
                <p style={{fontSize:13,color:'#777',lineHeight:1.8,margin:0}}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{padding:'100px 5%',background:'rgba(255,255,255,.015)'}}>
        <div style={{maxWidth:760,margin:'0 auto',textAlign:'center'}}>
          <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)',borderRadius:20,fontSize:11,color:'#34d399',letterSpacing:1,fontWeight:700,marginBottom:28}}>VERIFIED PILOT EVIDENCE</div>
          <div style={{position:'relative',minHeight:130}}>
            {TESTIMONIALS.map((t,i)=>(
              <div key={i} style={{position:i===activeTest?'relative':'absolute',top:0,left:0,right:0,opacity:i===activeTest?1:0,transition:'opacity .5s ease',pointerEvents:i===activeTest?'auto':'none'}}>
                <div style={{fontSize:36,marginBottom:12,lineHeight:1}}>{t.avatar}</div>
                <p style={{fontSize:'clamp(15px,2vw,20px)',color:'#e0e0e0',lineHeight:1.7,marginBottom:16,fontStyle:'italic'}}>"{t.quote}"</p>
                <div style={{fontSize:12,color:'#555'}}>{t.name}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:28}}>
            {TESTIMONIALS.map((_,i)=>(
              <button key={i} onClick={()=>setActiveTest(i)} style={{width:i===activeTest?24:7,height:7,borderRadius:4,background:i===activeTest?'#ff1f35':'rgba(255,255,255,.12)',border:'none',cursor:'pointer',transition:'all .3s'}}/>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAUNCH BOUNDARY ── */}
      <section style={{padding:'80px 5%'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{background:'linear-gradient(135deg,rgba(255,31,53,.06) 0%,rgba(99,102,241,.06) 100%)',border:'1px solid rgba(255,255,255,.08)',borderRadius:20,padding:'52px 48px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:36,alignItems:'center'}}>
            <div>
              <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(255,31,53,.1)',border:'1px solid rgba(255,31,53,.25)',borderRadius:20,fontSize:11,color:'#ff6b7a',letterSpacing:1,fontWeight:700,marginBottom:18}}>CONTROLLED RELEASE</div>
              <h2 style={{fontSize:'clamp(22px,3vw,36px)',fontWeight:900,margin:'0 0 16px',lineHeight:1.2}}>Start with bounded traffic.<br/>Expand only from evidence.</h2>
              <p style={{color:'#888',fontSize:14,lineHeight:1.8,margin:0}}>The pilot lifecycle and commercial controls are designed for a small, monitored customer cohort. Public scale follows real billing, support, security, settlement, and reliability evidence.</p>
            </div>
            <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
              {[
                {icon:'💳',t:'Paid access comes only from verified Stripe events',c:'#10b981'},
                {icon:'📏',t:'Platform-key execution stays inside metered core paths',c:'#6366f1'},
                {icon:'✅',t:'Verification and mining require approved evidence',c:'#f59e0b'},
                {icon:'⛔',t:'Demo rewards and unsettled payouts remain disabled',c:'#ff1f35'},
              ].map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:10}}>
                  <span style={{fontSize:18}}>{item.icon}</span>
                  <span style={{fontSize:13,color:item.c,fontWeight:600}}>{item.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{padding:'100px 5%',background:'rgba(255,255,255,.015)'}}>
        <div style={{maxWidth:980,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:46}}>
            <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(255,31,53,.08)',border:'1px solid rgba(255,31,53,.2)',borderRadius:20,fontSize:11,color:'#ff6b7a',letterSpacing:1,fontWeight:700,marginBottom:16}}>PRICING</div>
            <h2 style={{fontSize:'clamp(26px,4vw,48px)',fontWeight:900,margin:'0 0 12px'}}>Choose your controlled execution capacity.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:520,margin:'0 auto 28px',lineHeight:1.7}}>BYOK provider charges stay with your provider. Forge subscriptions include monthly execution capacity and separately metered hosted-model credits.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:20}}>
            {PLANS.map((p,i)=>(
              <div key={i} style={{padding:30,background:p.popular?'rgba(255,31,53,.055)':'rgba(255,255,255,.025)',border:`1px solid ${p.popular?'rgba(255,31,53,.4)':'rgba(255,255,255,.07)'}`,borderRadius:16,position:'relative' as const}}>
                {p.popular&&<div style={{position:'absolute' as const,top:-12,left:'50%',transform:'translateX(-50%)',background:'#ff1f35',borderRadius:20,padding:'3px 14px',fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap' as const,letterSpacing:.5}}>MOST POPULAR</div>}
                <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{p.name}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                  <span style={{fontSize:38,fontWeight:900,color:p.color,letterSpacing:-1}}>${p.price}</span>
                  <span style={{fontSize:13,color:'#555'}}>/mo</span>
                </div>
                <div style={{fontSize:11,color:'#444',marginBottom:22}}>billed monthly</div>
                <div style={{display:'flex',flexDirection:'column' as const,gap:9,marginBottom:26}}>
                  {p.features.map((f,j)=>(
                    <div key={j} style={{fontSize:13,color:'#aaa',display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{color:p.color,fontSize:12,flexShrink:0}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <a href={`${APP_URL}/register`} style={{display:'block',textAlign:'center' as const,padding:'12px',background:p.popular?'#ff1f35':'rgba(255,255,255,.07)',border:p.popular?'none':'1px solid rgba(255,255,255,.1)',borderRadius:9,fontSize:13,fontWeight:600,color:'#fff'}}>Create workspace</a>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:28,fontSize:13,color:'#555'}}>
            Monthly billing via Stripe · BYOK provider costs stay with you · Cancel through the secure billing portal · Approval gates included
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{padding:'110px 5%',textAlign:'center',background:'rgba(255,31,53,.04)',borderTop:'1px solid rgba(255,31,53,.1)'}}>
        <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(255,31,53,.1)',border:'1px solid rgba(255,31,53,.25)',borderRadius:20,fontSize:11,color:'#ff6b7a',letterSpacing:1,fontWeight:700,marginBottom:22}}>START FREE</div>
        <h2 style={{fontSize:'clamp(28px,5vw,62px)',fontWeight:900,marginBottom:16,letterSpacing:-1}}>Your AI team is waiting.</h2>
        <p style={{color:'#777',fontSize:17,marginBottom:14}}>Spin up your ForgeOS workspace free — no credit card, no lock-in.</p>
        <p style={{color:'#555',fontSize:13,marginBottom:36}}>Already have an account? <a href={`${APP_URL}/login`} style={{color:'#ff6b7a',textDecoration:'underline'}}>Log in →</a></p>
        <a href={`${APP_URL}/register`} style={{padding:'16px 44px',background:'#ff1f35',borderRadius:12,fontSize:17,fontWeight:700,color:'#fff',display:'inline-block',animation:'glow 3s ease-in-out infinite'}}>Start free today</a>
        <div style={{display:'flex',gap:24,justifyContent:'center',marginTop:28,fontSize:12,color:'#444'}}>
          <span>✓ No card to create a free workspace</span><span>✓ 10K-token free allowance</span><span>✓ BYOK ready</span><span>✓ Cancel anytime</span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{padding:'36px 5%',borderTop:'1px solid rgba(255,255,255,.06)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap' as const,gap:16}}>
        <div style={{fontSize:18,fontWeight:800}}><span style={{color:'#ff1f35'}}>Forge</span><span style={{color:'#2a2a33',fontSize:11,marginLeft:4}}>OS</span></div>
        <div style={{display:'flex',gap:28,fontSize:12,color:'#555'}}>
          {[['Product',APP_URL],['Capabilities','#solution'],['Controls','#model'],['Trust','#trust'],['Pricing','#pricing']].map(([l,h])=>(
            <a key={l} href={h} onMouseEnter={e=>(e.currentTarget.style.color='#aaa')} onMouseLeave={e=>(e.currentTarget.style.color='#555')}>{l}</a>
          ))}
        </div>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap' as const,fontSize:12,color:'#444'}}>
          <span>© 2026 Forge. All rights reserved.</span>
          <a href="/privacy" style={{color:'#666'}}>Privacy</a>
          <a href="/terms" style={{color:'#666'}}>Terms</a>
          <a href="https://forge-production-2692.up.railway.app/health" style={{color:'#666'}}>Status</a>
        </div>
      </footer>
    </div>
  );
}
