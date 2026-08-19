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
  const PHRASES = ['The AI OS for Small Business.','Run on autopilot. Scale on demand.','From idea to revenue in 90 seconds.','Your entire business, one platform.'];
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
const COMP_MATRIX = [
  {feature:'BYOK (no token markup)',    forge:true,  chatgpt:false, zapier:false,  hubspot:false, monday:false},
  {feature:'30+ specialized agents',    forge:true,  chatgpt:false, zapier:true,   hubspot:false, monday:false},
  {feature:'Autonomous revenue loop',   forge:true,  chatgpt:false, zapier:false,  hubspot:true,  monday:false},
  {feature:'Morning brief dashboard',   forge:true,  chatgpt:false, zapier:false,  hubspot:false, monday:false},
  {feature:'Persistent business memory',forge:true,  chatgpt:false, zapier:false,  hubspot:true,  monday:false},
  {feature:'White-label for agencies',  forge:true,  chatgpt:false, zapier:false,  hubspot:false, monday:false},
  {feature:'Multi-model routing (6+)',  forge:true,  chatgpt:false, zapier:false,  hubspot:false, monday:false},
  {feature:'Built-in approval queue',   forge:true,  chatgpt:false, zapier:true,   hubspot:false, monday:true },
  {feature:'Vertical agent packs',      forge:true,  chatgpt:false, zapier:true,   hubspot:false, monday:false},
  {feature:'One-click deploy',          forge:true,  chatgpt:false, zapier:false,  hubspot:false, monday:false},
];

const REVENUE_STREAMS = [
  {icon:'💳', name:'Subscriptions',        range:'$99–$499/mo',  desc:'Starter / Pro / Agency tiers',          color:'#6366f1'},
  {icon:'🔑', name:'BYOK API Routing',      range:'5% token margin', desc:'On premium AI credit packs',          color:'#ff1f35'},
  {icon:'🎯', name:'Outcome-as-a-Service',  range:'$5k–$150k',    desc:'Fixed-price delivery to enterprise',    color:'#f59e0b'},
  {icon:'🏪', name:'Marketplace',           range:'15–25% cut',   desc:'Template & agent pack commissions',     color:'#10b981'},
  {icon:'☁️', name:'Deployment Margin',     range:'20–30% infra', desc:'Forge Cloud hosting per deployed app',  color:'#0ea5e9'},
  {icon:'🏷️', name:'White-Label',          range:'$5k–$50k/mo',  desc:'Full OS resale to agencies',            color:'#8b5cf6'},
  {icon:'🛠️', name:'Consultancy',          range:'$5k–$25k/sprint',desc:'Custom build sprints, instant cash',   color:'#ec4899'},
  {icon:'🪙', name:'Token Economy',         range:'Network fees', desc:'Buyback-and-burn on net revenue',       color:'#f97316'},
];

const MOAT = [
  {icon:'📊', title:'Router Data Flywheel', badge:'DATA MOAT', badgeColor:'#6366f1', desc:'Every routing decision is logged: (prompt, model, outcome). Millions of real-world coding tasks build a unique dataset no competitor can replicate. This trains our proprietary classifier — improving cost/quality, attracting more users, generating more data.'},
  {icon:'🤖', title:'Clean-Room Agent Harness', badge:'TECH MOAT', badgeColor:'#ff1f35', desc:'DAG-based task decomp, 40 permissioned tools, 3-tier memory (working/episodic/semantic), background daemon. Equivalent to Claude Code but provider-agnostic and zero lock-in. Cannot be copied without starting from scratch.'},
  {icon:'🏗️', title:'3-Tier Hosting Model', badge:'MARKET MOAT', badgeColor:'#10b981', desc:'Forge Cloud (30% margin) → BYOC (platform fee) → Self-Hosted (open-core). Eliminates vendor lock-in objection entirely. Unlocks enterprise orgs requiring data sovereignty. Sticky: infra+integrations keep users even when they "vote with their feet."'},
  {icon:'🪙', title:'Community Token Economy', badge:'NETWORK MOAT', badgeColor:'#f59e0b', desc:'FORGE tokens reward contributors. 20% of net revenue goes to buyback-and-burn (deflationary). Aligns users, creators, and platform in a way no centralized competitor can structurally match.'},
];

const TESTIMONIALS = [
  {quote:'Forge replaced 4 SaaS tools I was paying $600/month for. The invoice chaser alone paid for itself in week one.',   name:'Beta user — Law firm, Austin TX',   avatar:'⚖️'},
  {quote:'I set it up in 90 seconds, described my agency, and it knew which agents to hire. My team calls it the office manager.',  name:'Beta user — Marketing agency, NYC',  avatar:'🎨'},
  {quote:'The morning brief is insane. I wake up and my entire sales pipeline has moved while I slept.', name:'Beta user — SaaS founder, SF',       avatar:'🚀'},
];

const PROBLEM_STATS = [
  {n:'33M',  label:'US small businesses underserved by AI'},
  {n:'$847', label:'Avg monthly SaaS spend per SMB (fragmented)'},
  {n:'63%',  label:'Non-technical founders who can\'t ship software'},
  {n:'$34B', label:'AI tools market by 2026 (17% CAGR)'},
];

const HOW_STEPS = [
  {num:'01',icon:'✍️',title:'Describe your business',subtitle:'One sentence. 90 seconds.',color:'#6366f1',desc:'Type what you do. Forge reads it, assembles the right agent team, and builds your workspace. No config, no prompts — just your words.',mock:'onboard'},
  {num:'02',icon:'🤖',title:'Agents start working',subtitle:'Parallel. Overnight. Autonomous.',color:'#ff1f35',desc:'DebtChaser chases invoices. ContentEngine writes posts. LeadNurturer follows up prospects. All running in parallel while you sleep.',mock:'agents'},
  {num:'03',icon:'🌅',title:'Wake to a Morning Brief',subtitle:'Everything done. One tap to approve.',color:'#f59e0b',desc:'See exactly what your agents did. Draft emails, found leads, flagged risks, created content. Approve the whole queue in one tap.',mock:'brief'},
  {num:'04',icon:'🧠',title:'Forge learns your business',subtitle:'Smarter every day. Sticky by design.',color:'#10b981',desc:'Every approval, correction, and outcome trains Forge Brain — your permanent business memory. Competitors never catch up; you\'d be starting cold.',mock:'brain'},
];

function MockScreen({type}:{type:string}) {
  if(type==='onboard') return (
    <div style={{background:'#0a0a12',borderRadius:10,padding:22,fontFamily:'monospace',fontSize:12}}>
      <div style={{color:'#333',marginBottom:12,fontSize:10}}>forge.app — workspace setup</div>
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
        ✓ Assembling workspace... LawBot · ContractDrafter · InvoiceChaser · DeadlineTracker ready
      </div>
    </div>
  );
  if(type==='agents') return (
    <div style={{background:'#0a0a12',borderRadius:10,padding:18,fontSize:11}}>
      <div style={{color:'#333',marginBottom:12,fontSize:10}}>forge.app — agent hub · 4 running</div>
      {[{n:'DebtChaser',s:'running',t:'Sent reminder to 3 overdue clients — $8,400',c:'#ff1f35'},{n:'ContentEngine',s:'running',t:'Drafted 4 LinkedIn posts for this week',c:'#ff1f35'},{n:'CompetitorWatch',s:'done',t:'Found: Austin Legal dropped prices 10%',c:'#10b981'},{n:'LeadNurturer',s:'waiting',t:'6 follow-ups queued for your approval',c:'#f59e0b'}].map(a=>(
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
      <div style={{color:'#333',marginBottom:8,fontSize:10}}>forge.app — morning brief</div>
      <div style={{color:'#f59e0b',fontSize:14,fontWeight:700,marginBottom:14}}>🌅 11 things done overnight.</div>
      {[{i:'💰',t:'Chased 3 invoices — $8,400 outstanding',a:'View'},{i:'📝',t:'4 LinkedIn posts drafted and ready',a:'Approve'},{i:'🔍',t:'Competitor dropped prices — report ready',a:'See'},{i:'📧',t:'6 lead follow-ups queued',a:'Review'}].map((item,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:9,padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
          <span style={{fontSize:13}}>{item.i}</span>
          <div style={{flex:1,color:'#bbb',fontSize:11}}>{item.t}</div>
          <button style={{padding:'3px 9px',background:'rgba(245,158,11,.12)',border:'1px solid rgba(245,158,11,.25)',borderRadius:5,color:'#f59e0b',fontSize:9,cursor:'pointer'}}>{item.a}</button>
        </div>
      ))}
      <div style={{marginTop:12,padding:'9px 12px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.18)',borderRadius:7,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{color:'#78350f',fontSize:11}}>Approve all 11 actions</span>
        <button style={{padding:'5px 14px',background:'#f59e0b',border:'none',borderRadius:5,color:'#000',fontSize:11,fontWeight:700,cursor:'pointer'}}>✓ Approve</button>
      </div>
    </div>
  );
  if(type==='brain') return (
    <div style={{background:'#0a0a12',borderRadius:10,padding:18,fontSize:11}}>
      <div style={{color:'#333',marginBottom:12,fontSize:10}}>forge.app — forge brain · 47 days of memory</div>
      <div style={{color:'#10b981',fontSize:12,fontWeight:600,marginBottom:10}}>🧠 What Forge knows about you</div>
      {[{l:'Your voice',v:'Professional but warm. No jargon.'},{l:'Top clients',v:'Henderson family (RE), Austin Co-op'},{l:'Do not contact',v:'Fridays after 3pm, never weekends'},{l:'Invoice rules',v:'NET 30 · remind day 25 · firm day 45'},{l:'Competitors',v:'Austin Legal, Quick-Close LLC (tracked)'}].map((item,i)=>(
        <div key={i} style={{padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
          <div style={{color:'#444',fontSize:9,textTransform:'uppercase' as const,letterSpacing:.5,marginBottom:2}}>{item.l}</div>
          <div style={{color:'#ccc'}}>{item.v}</div>
        </div>
      ))}
      <div style={{marginTop:10,fontSize:10,color:'#2d3748'}}>Leaving Forge means starting cold. Your competitors never catch up.</div>
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
        <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:0}}>From setup to autopilot in 4 steps</h2>
        <p style={{color:'#666',fontSize:15,marginTop:12}}>No configuration. No complexity. Just results.</p>
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
        <a href={`${APP_URL}/register`} style={{display:'inline-block',padding:'13px 32px',background:'#ff1f35',borderRadius:10,fontSize:14,fontWeight:700,color:'#fff',animation:'glow 3s ease-in-out infinite'}}>Start free — see it live →</a>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [activeTest, setActiveTest] = useState(0);

  useEffect(()=>{
    const t = setInterval(()=>setActiveTest(p=>(p+1)%TESTIMONIALS.length),4000);
    return ()=>clearInterval(t);
  },[]);

  const PLANS = [
    {name:'Starter',price:99,annualPrice:79,color:'#6366f1',features:['1 workspace','5 active agents','Morning brief','Basic marketplace','Email support','BYOK ready']},
    {name:'Pro',price:299,annualPrice:239,color:'#ff1f35',popular:true,features:['3 workspaces','All 30+ agents','Revenue Loop','White-label ready','Full marketplace','Priority support','Forge Brain']},
    {name:'Agency',price:499,annualPrice:399,color:'#10b981',features:['Unlimited workspaces','Resell to clients','Custom domain','Full API access','Dedicated success manager','SLA guarantee','Token allocation']},
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
          {[['Problem','#problem'],['Solution','#solution'],['Model','#model'],['Moat','#moat'],['Pricing','#pricing']].map(([l,h])=>(
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
            LIVE BETA · $34B MARKET · SERIES A READY
          </div>
          <h1 style={{fontSize:'clamp(36px,6.5vw,78px)',fontWeight:900,lineHeight:1.06,letterSpacing:-2.5,margin:'0 auto 22px',maxWidth:940,minHeight:'1.1em'}}>
            <TypewriterText />
          </h1>
          <p style={{fontSize:18,color:'#9a9aa5',maxWidth:580,margin:'0 auto 16px',lineHeight:1.75}}>
            Forge is the AI operating system for the <strong style={{color:'#e0e0e0'}}>33 million small businesses</strong> that can't afford enterprise software. 30+ specialized agents run sales, ops, legal, and marketing — autonomously, overnight, on your own AI keys.
          </p>
          <p style={{fontSize:13,color:'#555',marginBottom:36}}>BYOK · No token markup · You own your data · Cancel anytime</p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' as const}}>
            <a href={`${APP_URL}/register`} style={{padding:'14px 32px',background:'#ff1f35',borderRadius:10,fontSize:15,fontWeight:700,color:'#fff',animation:'glow 3s ease-in-out infinite',display:'inline-block'}}>Start free — no card required</a>
            <a href="#problem" style={{padding:'14px 32px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.11)',borderRadius:10,fontSize:15,color:'#ccc',display:'inline-block'}}>See the opportunity ↓</a>
          </div>

          {/* Metric strip */}
          <div style={{display:'flex',gap:0,justifyContent:'center',marginTop:64,flexWrap:'wrap' as const,borderTop:'1px solid rgba(255,255,255,.06)',borderBottom:'1px solid rgba(255,255,255,.06)',padding:'28px 0'}}>
            {[
              {n:34,s:'B',p:'$',label:'AI tools market by 2026',color:'#ff1f35'},
              {n:33,s:'M',p:'',label:'SMBs underserved today',color:'#6366f1'},
              {n:30,s:'+',p:'',label:'Specialized AI agents',color:'#10b981'},
              {n:8,s:'',p:'',label:'Distinct revenue streams',color:'#f59e0b'},
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
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>Small business runs on duct tape and hope.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:580,margin:'0 auto',lineHeight:1.7}}>The average small business pays <strong style={{color:'#e0e0e0'}}>$847/month</strong> across fragmented SaaS tools — none of which talk to each other, learn from each other, or work when you're asleep.</p>
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
            {[{icon:'😤',t:'Too many tools',d:'Avg SMB uses 9+ SaaS apps that don\'t integrate. Hours lost to context switching.'},
              {icon:'😴',t:'Nothing works overnight',d:'Revenue stops when the owner stops. No AI runs ops, chases invoices, or books meetings while you sleep.'},
              {icon:'💸',t:'Token markup robbery',d:'ChatGPT and competitors charge seats on top of AI costs. You pay twice. Forge lets you bring your own keys.'},
              {icon:'🧱',t:'No business memory',d:'Every chat starts blank. No tool remembers your clients, voice, rules, or history across sessions.'},
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
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>One OS. Every agent. Zero markup.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:560,margin:'0 auto',lineHeight:1.7}}>Forge plugs into your existing AI keys (Anthropic, OpenAI, Gemini, Groq, Mistral, OpenRouter) and runs your business autonomously — at cost, not at markup.</p>
          </div>

          {/* Competitive matrix */}
          <div style={{overflowX:'auto' as const,marginBottom:52}}>
            <table style={{width:'100%',borderCollapse:'collapse' as const,minWidth:640,fontSize:13}}>
              <thead>
                <tr>
                  <th style={{padding:'12px 16px',textAlign:'left' as const,color:'#555',fontWeight:600,fontSize:11,textTransform:'uppercase' as const,letterSpacing:.5,borderBottom:'1px solid rgba(255,255,255,.06)'}}>Feature</th>
                  {[{n:'Forge',c:'#ff1f35'},{n:'ChatGPT',c:'#555'},{n:'Zapier',c:'#555'},{n:'HubSpot',c:'#555'},{n:'Monday',c:'#555'}].map(h=>(
                    <th key={h.n} style={{padding:'12px 20px',textAlign:'center' as const,color:h.c,fontWeight:h.n==='Forge'?800:500,fontSize:h.n==='Forge'?14:11,textTransform:'uppercase' as const,letterSpacing:.5,borderBottom:'1px solid rgba(255,255,255,.06)',borderLeft:h.n==='Forge'?'1px solid rgba(255,31,53,.25)':'none',background:h.n==='Forge'?'rgba(255,31,53,.04)':'transparent'}}>
                      {h.n}{h.n==='Forge'&&<div style={{fontSize:9,color:'#ff6b7a',fontWeight:400,letterSpacing:.5,marginTop:2}}>← YOU</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP_MATRIX.map((row,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <td style={{padding:'10px 16px',color:'#aaa',fontSize:12}}>{row.feature}</td>
                    {([row.forge,row.chatgpt,row.zapier,row.hubspot,row.monday] as boolean[]).map((v,j)=>(
                      <td key={j} style={{padding:'10px 20px',textAlign:'center' as const,background:j===0?'rgba(255,31,53,.03)':'transparent',borderLeft:j===0?'1px solid rgba(255,31,53,.15)':'none'}}>
                        {v
                          ? <span style={{color:'#10b981',fontSize:15,fontWeight:700}}>✓</span>
                          : <span style={{color:'#2a2a33',fontSize:13}}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Forge wins callout */}
          <div style={{background:'linear-gradient(135deg,rgba(255,31,53,.06),rgba(16,185,129,.04))',border:'1px solid rgba(255,31,53,.18)',borderRadius:14,padding:'24px 32px',display:'flex',gap:20,alignItems:'center',flexWrap:'wrap' as const}}>
            <span style={{fontSize:32}}>🏆</span>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:'#fff',marginBottom:4}}>Forge wins 10/10 categories above.</div>
              <div style={{fontSize:13,color:'#888',lineHeight:1.6}}>No single competitor combines model-agnostic routing + agentic automation + autonomous revenue loop + persistent business memory + white-label resale. <strong style={{color:'#ff6b7a'}}>That's the moat.</strong></div>
            </div>
            <a href={`${APP_URL}/register`} style={{marginLeft:'auto',padding:'10px 22px',background:'#ff1f35',borderRadius:8,fontSize:13,fontWeight:600,color:'#fff',flexShrink:0}}>Try it free →</a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorks />

      {/* ── BUSINESS MODEL ── */}
      <section id="model" style={{padding:'100px 5%',background:'rgba(255,255,255,.015)'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)',borderRadius:20,fontSize:11,color:'#fbbf24',letterSpacing:1,fontWeight:700,marginBottom:16}}>BUSINESS MODEL</div>
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>8 ways we make money.<br/>Only one requires growth.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:520,margin:'0 auto',lineHeight:1.7}}>Subscriptions anchor recurring revenue. Every other stream adds margin on top — with zero additional acquisition cost.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:16,marginBottom:52}}>
            {REVENUE_STREAMS.map((r,i)=>(
              <div key={i} style={{padding:'22px 20px',background:`${r.color}08`,border:`1px solid ${r.color}20`,borderRadius:14}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <span style={{fontSize:20}}>{r.icon}</span>
                  <span style={{fontSize:11,fontWeight:700,color:r.color,padding:'2px 8px',background:`${r.color}15`,borderRadius:20,letterSpacing:.5}}>{r.range}</span>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:'#e0e0e0',marginBottom:4}}>{r.name}</div>
                <div style={{fontSize:12,color:'#666'}}>{r.desc}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            {[{label:'Year 1 ARR Target',value:'$3–5M',sub:'Subscription + marketplace'},
              {label:'Year 3 ARR Target',value:'$50M+',sub:'All 8 streams at scale'},
              {label:'Avg subscription ARPU',value:'$247/mo',sub:'Blended across tiers'},
              {label:'Gross margin target',value:'72%',sub:'BYOK eliminates GPU cost'},
            ].map((m,i)=>(
              <div key={i} style={{padding:'20px',background:'rgba(255,255,255,.025)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,textAlign:'center'}}>
                <div style={{fontSize:11,color:'#555',textTransform:'uppercase' as const,letterSpacing:.5,marginBottom:6}}>{m.label}</div>
                <div style={{fontSize:26,fontWeight:900,color:'#ff1f35',letterSpacing:-1,marginBottom:4}}>{m.value}</div>
                <div style={{fontSize:11,color:'#555'}}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOAT ── */}
      <section id="moat" style={{padding:'100px 5%'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:20,fontSize:11,color:'#a5b4fc',letterSpacing:1,fontWeight:700,marginBottom:16}}>DEFENSIBILITY</div>
            <h2 style={{fontSize:'clamp(26px,4vw,50px)',fontWeight:900,margin:'0 0 14px'}}>Four-layer moat.<br/>Built to compound, not copy.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:540,margin:'0 auto',lineHeight:1.7}}>Each layer is independently defensible. Together they create a flywheel that makes Forge harder to displace every single day.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(460px,1fr))',gap:20}}>
            {MOAT.map((m,i)=>(
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
          <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)',borderRadius:20,fontSize:11,color:'#34d399',letterSpacing:1,fontWeight:700,marginBottom:28}}>EARLY ADOPTERS</div>
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

      {/* ── MARKET TIMING ── */}
      <section style={{padding:'80px 5%'}}>
        <div style={{maxWidth:1060,margin:'0 auto'}}>
          <div style={{background:'linear-gradient(135deg,rgba(255,31,53,.06) 0%,rgba(99,102,241,.06) 100%)',border:'1px solid rgba(255,255,255,.08)',borderRadius:20,padding:'52px 48px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:36,alignItems:'center'}}>
            <div>
              <div style={{display:'inline-block',padding:'4px 14px',background:'rgba(255,31,53,.1)',border:'1px solid rgba(255,31,53,.25)',borderRadius:20,fontSize:11,color:'#ff6b7a',letterSpacing:1,fontWeight:700,marginBottom:18}}>WHY NOW</div>
              <h2 style={{fontSize:'clamp(22px,3vw,36px)',fontWeight:900,margin:'0 0 16px',lineHeight:1.2}}>The window is open.<br/>For the next 18 months.</h2>
              <p style={{color:'#888',fontSize:14,lineHeight:1.8,margin:0}}>API costs dropped 40x in 18 months. Small businesses are spending for the first time. No dominant OS has emerged. The company that captures SMB AI infrastructure now owns the category for a decade — the same way Shopify owns e-commerce infrastructure.</p>
            </div>
            <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
              {[
                {icon:'📉',t:'API costs: 40x cheaper since 2023',c:'#10b981'},
                {icon:'💰',t:'SMB AI spend: 3x growth YoY',c:'#6366f1'},
                {icon:'🏁',t:'No dominant OS player yet',c:'#f59e0b'},
                {icon:'⏰',t:'Category leadership: next 18 months',c:'#ff1f35'},
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
            <h2 style={{fontSize:'clamp(26px,4vw,48px)',fontWeight:900,margin:'0 0 12px'}}>Replace $847/mo of SaaS.<br/>Starting at $99/mo.</h2>
            <p style={{color:'#666',fontSize:15,maxWidth:460,margin:'0 auto 28px',lineHeight:1.7}}>BYOK means you pay AI providers directly — Forge takes zero markup. You keep the cost savings.</p>
            <div style={{display:'inline-flex',background:'rgba(255,255,255,.05)',borderRadius:10,padding:4,gap:4}}>
              <button onClick={()=>setAnnual(false)} style={{padding:'8px 20px',background:!annual?'#ff1f35':'transparent',border:'none',borderRadius:7,color:!annual?'#fff':'#888',fontSize:13,cursor:'pointer',fontWeight:600}}>Monthly</button>
              <button onClick={()=>setAnnual(true)} style={{padding:'8px 20px',background:annual?'#ff1f35':'transparent',border:'none',borderRadius:7,color:annual?'#fff':'#888',fontSize:13,cursor:'pointer',fontWeight:600}}>Annual <span style={{fontSize:11,color:annual?'#ffcdd0':'#555'}}>save 20%</span></button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:20}}>
            {PLANS.map((p,i)=>(
              <div key={i} style={{padding:30,background:p.popular?'rgba(255,31,53,.055)':'rgba(255,255,255,.025)',border:`1px solid ${p.popular?'rgba(255,31,53,.4)':'rgba(255,255,255,.07)'}`,borderRadius:16,position:'relative' as const}}>
                {p.popular&&<div style={{position:'absolute' as const,top:-12,left:'50%',transform:'translateX(-50%)',background:'#ff1f35',borderRadius:20,padding:'3px 14px',fontSize:10,fontWeight:700,color:'#fff',whiteSpace:'nowrap' as const,letterSpacing:.5}}>MOST POPULAR</div>}
                <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{p.name}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:2}}>
                  <span style={{fontSize:38,fontWeight:900,color:p.color,letterSpacing:-1}}>${annual?p.annualPrice:p.price}</span>
                  <span style={{fontSize:13,color:'#555'}}>/mo</span>
                </div>
                <div style={{fontSize:11,color:'#444',marginBottom:22}}>{annual?'billed annually':'billed monthly'}</div>
                <div style={{display:'flex',flexDirection:'column' as const,gap:9,marginBottom:26}}>
                  {p.features.map((f,j)=>(
                    <div key={j} style={{fontSize:13,color:'#aaa',display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{color:p.color,fontSize:12,flexShrink:0}}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <a href={`${APP_URL}/register`} style={{display:'block',textAlign:'center' as const,padding:'12px',background:p.popular?'#ff1f35':'rgba(255,255,255,.07)',border:p.popular?'none':'1px solid rgba(255,255,255,.1)',borderRadius:9,fontSize:13,fontWeight:600,color:'#fff'}}>Get started free</a>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:28,fontSize:13,color:'#555'}}>
            All plans include: 14-day free trial · BYOK (no markup) · Cancel anytime · SOC 2 in progress
          </div>
        </div>
      </section>

      {/* ── INVESTOR CTA ── */}
      <section style={{padding:'80px 5%'}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>
          <div style={{background:'rgba(99,102,241,.05)',border:'1px solid rgba(99,102,241,.2)',borderRadius:18,padding:'44px 40px',textAlign:'center'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#a5b4fc',textTransform:'uppercase' as const,letterSpacing:1,marginBottom:16}}>FOR INVESTORS</div>
            <h3 style={{fontSize:'clamp(20px,3vw,32px)',fontWeight:900,margin:'0 0 14px'}}>Building the Shopify moment<br/>for business operations.</h3>
            <p style={{color:'#777',fontSize:14,lineHeight:1.75,marginBottom:28,maxWidth:500,margin:'0 auto 28px'}}>$34B market. 33M underserved businesses. No dominant AI OS yet. Four-layer moat. 8 revenue streams. Series A target by Q2 2027.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' as const}}>
              <a href={`mailto:goldrusher9009@gmail.com?subject=Forge%20Investor%20Inquiry`} style={{padding:'12px 26px',background:'#6366f1',borderRadius:9,fontSize:13,fontWeight:700,color:'#fff',display:'inline-block'}}>Request investor deck →</a>
              <a href={`${APP_URL}/register`} style={{padding:'12px 26px',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:9,fontSize:13,color:'#ccc',display:'inline-block'}}>Try the product first</a>
            </div>
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
          <span>✓ No credit card</span><span>✓ BYOK — no markup</span><span>✓ Cancel anytime</span><span>✓ 14-day trial</span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{padding:'36px 5%',borderTop:'1px solid rgba(255,255,255,.06)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap' as const,gap:16}}>
        <div style={{fontSize:18,fontWeight:800}}><span style={{color:'#ff1f35'}}>Forge</span><span style={{color:'#2a2a33',fontSize:11,marginLeft:4}}>OS</span></div>
        <div style={{display:'flex',gap:28,fontSize:12,color:'#555'}}>
          {[['Product',APP_URL],['Pricing','#pricing'],['Moat','#moat'],['Investors',`mailto:goldrusher9009@gmail.com?subject=Forge%20Investor%20Inquiry`],['Status','https://forge-production-2692.up.railway.app/health']].map(([l,h])=>(
            <a key={l} href={h} onMouseEnter={e=>(e.currentTarget.style.color='#aaa')} onMouseLeave={e=>(e.currentTarget.style.color='#555')}>{l}</a>
          ))}
        </div>
        <div style={{fontSize:12,color:'#333'}}>© 2026 Forge. All rights reserved.</div>
      </footer>
    </div>
  );
}
