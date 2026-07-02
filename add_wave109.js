const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const navAnchor = "{ id:'duediligence108', icon:'🔍', label:'Due Diligence Checklist' },";
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'duediligence108', icon:'🔍', label:'Due Diligence Checklist' },
            { id:'contractgen109', icon:'📜', label:'Contract Generator' },
            { id:'captable109', icon:'📐', label:'Cap Table Modeler' },
            { id:'investorupdate109', icon:'📬', label:'Investor Update' },
            { id:'coldemail109', icon:'📧', label:'Cold Email Sequence' },
            { id:'podcastscript109', icon:'🎙️', label:'Podcast Scriptwriter' },`);

const renderAnchor = "        {(mainTab as string) === 'duediligence108' && <ForgeTab_duediligence108 />}";
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'duediligence108' && <ForgeTab_duediligence108 />}

        {/* ── WAVE 109 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'contractgen109' && <ForgeTab_contractgen109 />}
        {(mainTab as string) === 'captable109' && <ForgeTab_captable109 />}
        {(mainTab as string) === 'investorupdate109' && <ForgeTab_investorupdate109 />}
        {(mainTab as string) === 'coldemail109' && <ForgeTab_coldemail109 />}
        {(mainTab as string) === 'podcastscript109' && <ForgeTab_podcastscript109 />}`);

const components = `
function ForgeTab_contractgen109() {
  const [contractType, setContractType] = React.useState('nda');
  const [party1, setParty1] = React.useState('');
  const [party2, setParty2] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [jurisdiction, setJurisdiction] = React.useState('US-Delaware');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Legal Contract Generator</h2>
      <p style={{color:'#888',marginBottom:'0.5rem'}}>Generate professional legal contract templates. <strong style={{color:'#fbbf24'}}>⚠️ Always have a licensed attorney review before signing.</strong></p>
      <select value={contractType} onChange={(e:any)=>setContractType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="nda">NDA (Non-Disclosure Agreement)</option>
        <option value="consulting">Consulting / Freelance Agreement</option>
        <option value="saas">SaaS Subscription Agreement</option>
        <option value="employment">Employment Offer Letter</option>
        <option value="advisor">Advisor Agreement</option>
        <option value="partnership">Partnership Agreement</option>
        <option value="tos">Terms of Service</option>
        <option value="privacy">Privacy Policy</option>
        <option value="vendor">Vendor / Supplier Agreement</option>
      </select>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={party1} onChange={(e:any)=>setParty1(e.target.value)} placeholder="Party 1 (e.g. Acme Corp, a Delaware corporation)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={party2} onChange={(e:any)=>setParty2(e.target.value)} placeholder="Party 2 (e.g. John Smith, an individual)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <select value={jurisdiction} onChange={(e:any)=>setJurisdiction(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="US-Delaware">US — Delaware</option><option value="US-California">US — California</option><option value="US-New-York">US — New York</option><option value="UK">United Kingdom</option><option value="EU">European Union</option><option value="Canada">Canada</option>
      </select>
      <textarea value={terms} onChange={(e:any)=>setTerms(e.target.value)} placeholder="Key terms to include (e.g. for NDA: 2-year term, mutual, excluding publicly known info; for consulting: $150/hr, net-30 payment, IP assignment...)" rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!party1.trim()||!party2.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/legal/contract',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({contract_type:contractType,party1,party2,terms,jurisdiction})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#374151',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!party1.trim()||!party2.trim()?0.5:1}}>{loading?'Generating...':'Generate Contract Template'}</button>
      {result?.contract && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:12,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any,fontFamily:'monospace'}}>{result.contract}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_captable109() {
  const [founders, setFounders] = React.useState('');
  const [round, setRound] = React.useState('seed');
  const [preMoneyVal, setPreMoneyVal] = React.useState('');
  const [raiseAmount, setRaiseAmount] = React.useState('');
  const [optionPool, setOptionPool] = React.useState('10');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Cap Table Modeler</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Model your cap table through a funding round — ownership percentages, dilution, and post-money structure.</p>
      <textarea value={founders} onChange={(e:any)=>setFounders(e.target.value)} placeholder="Current shareholders (one per line): Name, Shares/%, Role&#10;e.g.&#10;Alice Chen, 60%, CEO&#10;Bob Kim, 40%, CTO&#10;ESOP Pool, 10% of post-round" rows={5} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={round} onChange={(e:any)=>setRound(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="pre-seed">Pre-seed</option><option value="seed">Seed</option><option value="series-a">Series A</option><option value="series-b">Series B</option>
        </select>
        <input value={optionPool} onChange={(e:any)=>setOptionPool(e.target.value)} placeholder="Option pool % of post-money (e.g. 10)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <input value={preMoneyVal} onChange={(e:any)=>setPreMoneyVal(e.target.value)} placeholder="Pre-money valuation (e.g. $5M)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={raiseAmount} onChange={(e:any)=>setRaiseAmount(e.target.value)} placeholder="Amount raising (e.g. $1M)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <button disabled={loading||!founders.trim()||!preMoneyVal.trim()||!raiseAmount.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/finance/cap-table',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({founders,round,pre_money:preMoneyVal,raise_amount:raiseAmount,option_pool:optionPool})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!founders.trim()||!preMoneyVal.trim()||!raiseAmount.trim()?0.5:1}}>{loading?'Modeling...':'Model Cap Table'}</button>
      {result?.model && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any,fontFamily:'monospace'}}>{result.model}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_investorupdate109() {
  const [company, setCompany] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [format, setFormat] = React.useState('monthly');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Investor Update Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a compelling investor update that keeps your investors engaged, informed, and motivated to help.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company name" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={period} onChange={(e:any)=>setPeriod(e.target.value)} placeholder="Period (e.g. June 2026, Q2 2026)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <select value={format} onChange={(e:any)=>setFormat(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="monthly">Monthly update</option><option value="quarterly">Quarterly update</option><option value="annual">Annual letter</option><option value="milestone">Milestone / fundraise update</option><option value="bad-news">Difficult news update</option>
      </select>
      <textarea value={highlights} onChange={(e:any)=>setHighlights(e.target.value)} placeholder="Key metrics and highlights (ARR, MRR, growth %, customers won/lost, product shipped, team changes, burn, runway, challenges, asks...)" rows={7} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!company.trim()||!highlights.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/investor/update',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({company,period,highlights,format})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#1e40af',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!company.trim()||!highlights.trim()?0.5:1}}>{loading?'Writing Update...':'Write Investor Update'}</button>
      {result?.update && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.update}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_coldemail109() {
  const [product, setProduct] = React.useState('');
  const [prospect, setProspect] = React.useState('');
  const [goal, setGoal] = React.useState('book-call');
  const [seqLength, setSeqLength] = React.useState('5');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Cold Email Sequence Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a multi-touch cold email sequence with personalization hooks, follow-up cadence, and A/B subject line variants.</p>
      <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Your product + unique value prop" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={prospect} onChange={(e:any)=>setProspect(e.target.value)} placeholder="Prospect profile (e.g. VP of Sales at 50-200 person B2B SaaS, pain: long sales cycles)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={goal} onChange={(e:any)=>setGoal(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="book-call">Book a discovery call</option><option value="demo">Get a demo</option><option value="trial">Start a free trial</option><option value="referral">Get a referral</option><option value="content">Share content / resource</option>
        </select>
        <select value={seqLength} onChange={(e:any)=>setSeqLength(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="3">3 emails</option><option value="5">5 emails</option><option value="7">7 emails</option><option value="10">10 emails</option>
        </select>
      </div>
      <button disabled={loading||!product.trim()||!prospect.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/sales/cold-sequence',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({product,prospect,goal,seq_length:seqLength})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0891b2',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!product.trim()||!prospect.trim()?0.5:1}}>{loading?'Building Sequence...':'Build Email Sequence'}</button>
      {result?.sequence && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.sequence}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_podcastscript109() {
  const [show, setShow] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const [format, setFormat] = React.useState('interview');
  const [duration, setDuration] = React.useState('30');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Podcast Scriptwriter</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a complete podcast script — intro hook, segment outline, interview questions, transitions, and outro CTA.</p>
      <input value={show} onChange={(e:any)=>setShow(e.target.value)} placeholder="Show name + audience (e.g. 'Founders First' — for early-stage startup founders)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={topic} onChange={(e:any)=>setTopic(e.target.value)} placeholder="Episode topic / guest (e.g. How to close your first enterprise deal, with Sarah Chen, VP Sales at Notion)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={format} onChange={(e:any)=>setFormat(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="interview">Guest interview</option><option value="solo">Solo / monologue</option><option value="co-host">Co-host conversation</option><option value="panel">Panel discussion</option><option value="storytelling">Narrative / storytelling</option>
        </select>
        <select value={duration} onChange={(e:any)=>setDuration(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90+ minutes</option>
        </select>
      </div>
      <button disabled={loading||!show.trim()||!topic.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/content/podcast-script',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({show,topic,format,duration})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#9333ea',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!show.trim()||!topic.trim()?0.5:1}}>{loading?'Writing Script...':'Write Podcast Script'}</button>
      {result?.script && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.script}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

`;

const exportAnchor = '\nexport default function ForgeApp';
const idx = content.lastIndexOf(exportAnchor);
if (idx === -1) { console.error('EXPORT DEFAULT NOT FOUND'); process.exit(1); }
content = content.slice(0, idx) + components + content.slice(idx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done. Lines:', content.split('\n').length);
