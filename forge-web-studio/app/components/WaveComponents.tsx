'use client';

import React from 'react';

function ForgeTab_coldemail99() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [prospect, setProspect] = React.useState('');
  const [yourProduct, setYourProduct] = React.useState('');
  const [painPoint, setPainPoint] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/email/cold-personalize', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({prospect, yourProduct, painPoint}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📧 Cold Email Personalizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write hyper-personalized cold emails.</p>
      <input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Prospect name / company" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={yourProduct} onChange={e=>setYourProduct(e.target.value)} placeholder="Your product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={painPoint} onChange={e=>setPainPoint(e.target.value)} placeholder="Their pain point you solve" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!prospect} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_seobrief99() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [keyword, setKeyword] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/seo/content-brief', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({keyword, audience}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔍 SEO Content Brief</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a detailed SEO content brief for any keyword.</p>
      <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Target keyword (e.g. best project management software)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!keyword} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_legaldraft99() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [docType, setDocType] = React.useState('');
  const [parties, setParties] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/legal/draft', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({docType, parties, terms}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>⚖️ Legal Doc Drafter</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Draft legal documents and agreements.</p>
      <input value={docType} onChange={e=>setDocType(e.target.value)} placeholder="Document type (e.g. NDA, freelance contract)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={parties} onChange={e=>setParties(e.target.value)} placeholder="Parties involved" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Key terms and conditions" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!docType} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_meetingactions99() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [notes, setNotes] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/meetings/extract-actions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({notes}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>✅ Meeting Action Extractor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Extract action items from meeting notes.</p>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Paste meeting notes here..." rows={6} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!notes} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_prddraft99() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [feature, setFeature] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [users, setUsers] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/prd', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({feature, goal, users}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📋 PRD Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a Product Requirements Document.</p>
      <input value={feature} onChange={e=>setFeature(e.target.value)} placeholder="Feature or product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Product goal / problem being solved" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={users} onChange={e=>setUsers(e.target.value)} placeholder="Target users" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!feature} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_ytscript100() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/youtube-script', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({topic, audience, duration}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎬 YouTube Script Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write engaging YouTube video scripts.</p>
      <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Video topic" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Desired length (e.g. 10 minutes)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_appstore100() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [appName, setAppName] = React.useState('');
  const [features, setFeatures] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/app-store', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({appName, features}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📱 App Store Description</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write compelling app store descriptions.</p>
      <input value={appName} onChange={e=>setAppName(e.target.value)} placeholder="App name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={features} onChange={e=>setFeatures(e.target.value)} placeholder="Key features (comma-separated)" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!appName} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_changelog100() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [version, setVersion] = React.useState('');
  const [changes, setChanges] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/changelog', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({version, changes}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📝 Changelog Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate professional changelog entries.</p>
      <input value={version} onChange={e=>setVersion(e.target.value)} placeholder="Version number (e.g. v2.1.0)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={changes} onChange={e=>setChanges(e.target.value)} placeholder="List of changes made" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!version} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_linkedinco100() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [company, setCompany] = React.useState('');
  const [mission, setMission] = React.useState('');
  const [products, setProducts] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/linkedin-company', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({company, mission, products}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💼 LinkedIn Company Page</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write a LinkedIn company page description.</p>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={mission} onChange={e=>setMission(e.target.value)} placeholder="Company mission" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={products} onChange={e=>setProducts(e.target.value)} placeholder="Products / services" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!company} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_grantprop100() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [organization, setOrganization] = React.useState('');
  const [project, setProject] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/writing/grant', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({organization, project, amount}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🏆 Grant Proposal Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write compelling grant proposals.</p>
      <input value={organization} onChange={e=>setOrganization(e.target.value)} placeholder="Organization name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={project} onChange={e=>setProject(e.target.value)} placeholder="Project description" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Funding amount requested" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!organization} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_threadwriter101() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [angle, setAngle] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/thread', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({topic, angle, platform}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🐦 Thread Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write viral Twitter/LinkedIn threads.</p>
      <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Thread topic" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={angle} onChange={e=>setAngle(e.target.value)} placeholder="Unique angle or hook" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={platform} onChange={e=>setPlatform(e.target.value)} placeholder="Platform (Twitter/LinkedIn)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_uxaudit101() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/design/ux-audit', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, description}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔍 UX Audit</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Run a heuristic UX audit on your product.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the current UX/flows" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_pricingtier101() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/pricing-tiers', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, market, competitors}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💰 Pricing Tier Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design optimal pricing tiers for your product.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Target market" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="Key competitors and their pricing" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_onboardflow101() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [userGoal, setUserGoal] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/onboarding-flow', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, userGoal, steps}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🚀 Onboarding Flow Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design an onboarding flow for your users.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={userGoal} onChange={e=>setUserGoal(e.target.value)} placeholder="What is the user trying to achieve?" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Current onboarding steps (if any)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_pressrelease101() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [headline, setHeadline] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/press-release', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({headline, company, details}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📰 Press Release Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write professional press releases.</p>
      <input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="News headline" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Key details and quotes" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!headline} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_apidoc102() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [endpoint, setEndpoint] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [params, setParams] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/api-docs', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({endpoint, description, params}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📚 API Doc Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate API documentation from endpoint descriptions.</p>
      <input value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="Endpoint (e.g. POST /api/users)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="What this endpoint does" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={params} onChange={e=>setParams(e.target.value)} placeholder="Parameters / body fields" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!endpoint} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_breakeven102() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [fixedCosts, setFixedCosts] = React.useState('');
  const [variableCost, setVariableCost] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/breakeven', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({fixedCosts, variableCost, price}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📊 Breakeven Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate your break-even point.</p>
      <input value={fixedCosts} onChange={e=>setFixedCosts(e.target.value)} placeholder="Monthly fixed costs ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={variableCost} onChange={e=>setVariableCost(e.target.value)} placeholder="Variable cost per unit ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price per unit ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!fixedCosts} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_jobdesc102() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [requirements, setRequirements] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/hr/job-description', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({role, company, requirements}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💼 Job Description Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write compelling job descriptions.</p>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Job title" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} placeholder="Key requirements" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!role} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_feedbackanalyzer102() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [feedback, setFeedback] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/analytics/feedback', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({feedback}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💬 Feedback Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze customer feedback for insights.</p>
      <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Paste customer feedback here..." rows={6} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!feedback} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_competitorteardown102() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [competitor, setCompetitor] = React.useState('');
  const [yourProduct, setYourProduct] = React.useState('');
  const [focus, setFocus] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/strategy/competitor-teardown', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({competitor, yourProduct, focus}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔬 Competitor Teardown</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Deep-dive analysis of a competitor.</p>
      <input value={competitor} onChange={e=>setCompetitor(e.target.value)} placeholder="Competitor name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={yourProduct} onChange={e=>setYourProduct(e.target.value)} placeholder="Your product" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={focus} onChange={e=>setFocus(e.target.value)} placeholder="Focus area (pricing/features/marketing)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!competitor} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_emailsubject103() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [subject, setSubject] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/email/subject-test', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({subject, audience, goal}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📧 Email Subject Tester</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Test and score email subject lines.</p>
      <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Email subject line to test" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Email goal (open rate / clicks / conversions)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!subject} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_objectionhandler103() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [objection, setObjection] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/sales/objection-handler', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({objection, product, context}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🛡️ Objection Handler</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate responses to sales objections.</p>
      <input value={objection} onChange={e=>setObjection(e.target.value)} placeholder="The objection (e.g. Your price is too high)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Sales context / deal stage" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!objection} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_pitchfeedback103() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pitchContent, setPitchContent] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/investor/pitch-feedback', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({pitchContent}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎯 Pitch Deck Feedback</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Get AI feedback on your pitch deck.</p>
      <textarea value={pitchContent} onChange={e=>setPitchContent(e.target.value)} placeholder="Paste your pitch deck content or description..." rows={6} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!pitchContent} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_nichefinder103() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [skills, setSkills] = React.useState('');
  const [interests, setInterests] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/strategy/niche-finder', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({skills, interests, market}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔭 Niche Finder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Find profitable niches for your business.</p>
      <input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Your skills / expertise" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={interests} onChange={e=>setInterests(e.target.value)} placeholder="Your interests" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Target market size (small/medium/large)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!skills} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_contentrepurpose103() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [originalContent, setOriginalContent] = React.useState('');
  const [targetFormat, setTargetFormat] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/repurpose', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({originalContent, targetFormat}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>♻️ Content Repurposer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Repurpose content across formats.</p>
      <textarea value={originalContent} onChange={e=>setOriginalContent(e.target.value)} placeholder="Original content to repurpose..." rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={targetFormat} onChange={e=>setTargetFormat(e.target.value)} placeholder="Target format (e.g. Twitter thread, LinkedIn post, email)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!originalContent} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_salesscript104() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [prospect, setProspect] = React.useState('');
  const [objections, setObjections] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/sales/script', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, prospect, objections}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📞 Sales Script Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate personalized sales scripts.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Prospect profile" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={objections} onChange={e=>setObjections(e.target.value)} placeholder="Likely objections" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_landingcopy104() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [headline, setHeadline] = React.useState('');
  const [benefits, setBenefits] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/landing-copy', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, headline, benefits}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🏠 Landing Page Copywriter</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write high-converting landing page copy.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Main headline idea" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={benefits} onChange={e=>setBenefits(e.target.value)} placeholder="Key benefits" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_investorupdate104() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [company, setCompany] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [asks, setAsks] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/investor/update', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({company, highlights, asks}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📊 Investor Update Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write professional investor updates.</p>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={highlights} onChange={e=>setHighlights(e.target.value)} placeholder="Key highlights this month" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={asks} onChange={e=>setAsks(e.target.value)} placeholder="Current asks / needs" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!company} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_bugreport104() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [issue, setIssue] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [expected, setExpected] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/bug-report', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({issue, steps, expected}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🐛 Bug Report Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate structured bug reports.</p>
      <input value={issue} onChange={e=>setIssue(e.target.value)} placeholder="Describe the bug" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Steps to reproduce" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={expected} onChange={e=>setExpected(e.target.value)} placeholder="Expected vs actual behavior" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!issue} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_datastory104() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [data, setData] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/analytics/data-story', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({data, audience}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📈 Data Storyteller</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn data into compelling narratives.</p>
      <textarea value={data} onChange={e=>setData(e.target.value)} placeholder="Paste your data or metrics here..." rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Who is this story for?" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!data} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_personabuilder105() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [targetMarket, setTargetMarket] = React.useState('');
  const [insights, setInsights] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/persona', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, targetMarket, insights}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>👤 Customer Persona Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build detailed customer personas.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={targetMarket} onChange={e=>setTargetMarket(e.target.value)} placeholder="Target market" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={insights} onChange={e=>setInsights(e.target.value)} placeholder="Any existing customer insights" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_sopwriter105() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [process, setProcess] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ops/sop-writer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({process, steps}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📋 SOP Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write Standard Operating Procedures.</p>
      <input value={process} onChange={e=>setProcess(e.target.value)} placeholder="Process name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Key steps involved" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!process} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_okrgenerator105() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
  const [timeframe, setTimeframe] = React.useState('');
  const [team, setTeam] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/okr-generator', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({goal, timeframe, team}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎯 OKR Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate OKRs aligned to your goals.</p>
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Company / team goal" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={timeframe} onChange={e=>setTimeframe(e.target.value)} placeholder="Timeframe (e.g. Q3 2024)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team or department" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!goal} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_retrofacilitator105() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [team, setTeam] = React.useState('');
  const [sprint, setSprint] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ops/retro', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({team, sprint, context}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔄 Retro Facilitator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate retrospective formats and questions.</p>
      <input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={sprint} onChange={e=>setSprint(e.target.value)} placeholder="Sprint / period" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Any specific issues to address" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!team} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_emailsequence105() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [length, setLength] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/email-sequence', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({goal, audience, length}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📨 Email Sequence Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build automated email sequences.</p>
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Sequence goal (onboarding / nurture / win-back)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Audience segment" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={length} onChange={e=>setLength(e.target.value)} placeholder="Number of emails in sequence" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!goal} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_churnpredictor106() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [symptoms, setSymptoms] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/retention/churn-analysis', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, symptoms}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📉 Churn Predictor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Predict churn and build retention playbooks.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} placeholder="Churn signals you are seeing" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_phlauncher106() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [tagline, setTagline] = React.useState('');
  const [features, setFeatures] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/ph-launch', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, tagline, features}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🚀 Product Hunt Launch Kit</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a Product Hunt launch kit.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="Product tagline" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={features} onChange={e=>setFeatures(e.target.value)} placeholder="Top 3 features" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_affiliateprog106() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [commission, setCommission] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/growth/affiliate-program', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, commission, audience}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🤝 Affiliate Program Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design an affiliate program.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={commission} onChange={e=>setCommission(e.target.value)} placeholder="Proposed commission rate" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target affiliates" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_referralprog106() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [incentive, setIncentive] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/growth/referral-program', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, incentive, goal}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎁 Referral Program Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design a referral program.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={incentive} onChange={e=>setIncentive(e.target.value)} placeholder="Referral incentive" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Program goal" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_partnershipgen106() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [yourCompany, setYourCompany] = React.useState('');
  const [partner, setPartner] = React.useState('');
  const [synergy, setSynergy] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/business/partnership-pitch', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({yourCompany, partner, synergy}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🤝 Partnership Pitch Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write partnership pitch proposals.</p>
      <input value={yourCompany} onChange={e=>setYourCompany(e.target.value)} placeholder="Your company" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={partner} onChange={e=>setPartner(e.target.value)} placeholder="Potential partner company" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={synergy} onChange={e=>setSynergy(e.target.value)} placeholder="Why this partnership makes sense" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!yourCompany} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_grantwriter107() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [organization, setOrganization] = React.useState('');
  const [project, setProject] = React.useState('');
  const [funder, setFunder] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/writing/grant', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({organization, project, funder}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📜 Grant Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write compelling grant applications.</p>
      <input value={organization} onChange={e=>setOrganization(e.target.value)} placeholder="Organization name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={project} onChange={e=>setProject(e.target.value)} placeholder="Project description" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={funder} onChange={e=>setFunder(e.target.value)} placeholder="Grant funder / program" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!organization} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_boarddeck107() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [company, setCompany] = React.useState('');
  const [quarter, setQuarter] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/exec/board-deck', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({company, quarter, highlights}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📊 Board Deck Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build board deck content.</p>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={quarter} onChange={e=>setQuarter(e.target.value)} placeholder="Quarter / period" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={highlights} onChange={e=>setHighlights(e.target.value)} placeholder="Key highlights and metrics" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!company} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_hiringfunnel107() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
  const [currentProcess, setCurrentProcess] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/hr/hiring-funnel', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({role, currentProcess}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>👥 Hiring Funnel Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Optimize your hiring funnel.</p>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role you are hiring for" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={currentProcess} onChange={e=>setCurrentProcess(e.target.value)} placeholder="Current hiring process" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!role} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_gtmplanner107() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [differentiator, setDifferentiator] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/strategy/gtm-plan', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, market, differentiator}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🗺️ Go-to-Market Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a go-to-market strategy.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Target market" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={differentiator} onChange={e=>setDifferentiator(e.target.value)} placeholder="Key differentiator" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_moatanalyzer107() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [company, setCompany] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/strategy/moat-analysis', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({company, product, competitors}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🏰 Competitive Moat Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Identify and strengthen your competitive moat.</p>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Core product" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="Key competitors" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!company} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_pitchscorer108() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [pitch, setPitch] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/investor/score-pitch', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({pitch}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎯 Pitch Deck Scorer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Score your pitch deck against investor criteria.</p>
      <textarea value={pitch} onChange={e=>setPitch(e.target.value)} placeholder="Paste pitch deck content or summary..." rows={6} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!pitch} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_revenuemodel108() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [segments, setSegments] = React.useState('');
  const [streams, setStreams] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/revenue-model', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, segments, streams}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💰 Revenue Model Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a revenue model.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={segments} onChange={e=>setSegments(e.target.value)} placeholder="Customer segments" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={streams} onChange={e=>setStreams(e.target.value)} placeholder="Revenue streams" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_journeymap108() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [persona, setPersona] = React.useState('');
  const [touchpoints, setTouchpoints] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/cx/journey-map', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, persona, touchpoints}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🗺️ Customer Journey Mapper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Map your customer journey.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={persona} onChange={e=>setPersona(e.target.value)} placeholder="Customer persona" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={touchpoints} onChange={e=>setTouchpoints(e.target.value)} placeholder="Known touchpoints" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_crisiscomms108() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [tone, setTone] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/comms/crisis', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({situation, audience, tone}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🚨 Crisis Comms Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write crisis communication statements.</p>
      <textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="Describe the crisis situation" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (customers / press / employees)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={tone} onChange={e=>setTone(e.target.value)} placeholder="Tone (apologetic / informative / proactive)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!situation} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_duediligence108() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dealType, setDealType] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [focus, setFocus] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/due-diligence', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({dealType, company, focus}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔍 Due Diligence Checklist</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate due diligence checklists.</p>
      <input value={dealType} onChange={e=>setDealType(e.target.value)} placeholder="Deal type (acquisition / investment / partnership)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Target company" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={focus} onChange={e=>setFocus(e.target.value)} placeholder="Focus areas" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!dealType} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_legalcontract109() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [type, setType] = React.useState('');
  const [parties, setParties] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/legal/contract', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({type, parties, terms}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>⚖️ Legal Contract Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate legal contracts.</p>
      <input value={type} onChange={e=>setType(e.target.value)} placeholder="Contract type (e.g. freelance, SaaS, NDA)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={parties} onChange={e=>setParties(e.target.value)} placeholder="Parties involved" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Key terms" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!type} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_captable109() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [founders, setFounders] = React.useState('');
  const [investors, setInvestors] = React.useState('');
  const [scenario, setScenario] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/cap-table', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({founders, investors, scenario}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📊 Cap Table Modeler</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Model your cap table.</p>
      <input value={founders} onChange={e=>setFounders(e.target.value)} placeholder="Founders and equity %" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={investors} onChange={e=>setInvestors(e.target.value)} placeholder="Investors and equity %" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={scenario} onChange={e=>setScenario(e.target.value)} placeholder="Scenario (e.g. Series A raise of $2M at $10M pre)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!founders} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_investorupd109() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [company, setCompany] = React.useState('');
  const [month, setMonth] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/investor/update', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({company, month, highlights}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📧 Investor Update Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write monthly investor updates.</p>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={month} onChange={e=>setMonth(e.target.value)} placeholder="Month / period" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={highlights} onChange={e=>setHighlights(e.target.value)} placeholder="Key highlights, metrics, and asks" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!company} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_coldsequence109() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [prospect, setProspect] = React.useState('');
  const [emails, setEmails] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/sales/cold-sequence', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, prospect, emails}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📨 Cold Email Sequence Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build cold email sequences.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Target prospect profile" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={emails} onChange={e=>setEmails(e.target.value)} placeholder="Number of emails in sequence" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_podcastscript109() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [guests, setGuests] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/podcast-script', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({topic, duration, guests}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎙️ Podcast Scriptwriter</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write podcast episode scripts.</p>
      <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Episode topic" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Episode duration (minutes)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={guests} onChange={e=>setGuests(e.target.value)} placeholder="Guest name(s) and background" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_newsletter110() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/newsletter', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({topic, audience, highlights}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📰 Newsletter Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build engaging newsletters.</p>
      <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Newsletter topic / theme" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Subscriber audience" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={highlights} onChange={e=>setHighlights(e.target.value)} placeholder="Key content to include" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_adcopy110() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/ad-copy', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, platform, goal}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📢 Ad Copy Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate ad copy for any platform.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={platform} onChange={e=>setPlatform(e.target.value)} placeholder="Platform (Facebook, Google, LinkedIn)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Campaign goal" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_abvariants110() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [original, setOriginal] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [variants, setVariants] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/ab-variants', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({original, goal, variants}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔀 Landing Page A/B Tester</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate A/B test variants for landing pages.</p>
      <textarea value={original} onChange={e=>setOriginal(e.target.value)} placeholder="Original headline / copy" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Conversion goal" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={variants} onChange={e=>setVariants(e.target.value)} placeholder="Number of variants to generate" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!original} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_webinarscript110() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/webinar-script', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({topic, duration, audience}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎤 Webinar Script Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write webinar scripts.</p>
      <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Webinar topic" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duration (minutes)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_casestudy110() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [customer, setCustomer] = React.useState('');
  const [challenge, setChallenge] = React.useState('');
  const [results, setResults] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/marketing/case-study', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({customer, challenge, results}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📖 Case Study Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write compelling case studies.</p>
      <input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Customer name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={challenge} onChange={e=>setChallenge(e.target.value)} placeholder="Challenge they faced" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={results} onChange={e=>setResults(e.target.value)} placeholder="Results achieved" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!customer} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_techdoc111() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [system, setSystem] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [content, setContent] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/tech-doc', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({system, audience, content}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📚 Tech Doc Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write technical documentation.</p>
      <input value={system} onChange={e=>setSystem(e.target.value)} placeholder="System or feature name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (developers/users)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Key content to document" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!system} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_apichangelog111() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [version, setVersion] = React.useState('');
  const [changes, setChanges] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/changelog', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({version, changes}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📋 API Changelog Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate API changelog entries.</p>
      <input value={version} onChange={e=>setVersion(e.target.value)} placeholder="API version" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={changes} onChange={e=>setChanges(e.target.value)} placeholder="Changes made (breaking/non-breaking)" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!version} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_featureflag111() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [feature, setFeature] = React.useState('');
  const [rollout, setRollout] = React.useState('');
  const [risks, setRisks] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/feature-flag', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({feature, rollout, risks}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🚩 Feature Flag Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Plan feature flag rollout strategies.</p>
      <input value={feature} onChange={e=>setFeature(e.target.value)} placeholder="Feature name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={rollout} onChange={e=>setRollout(e.target.value)} placeholder="Rollout strategy (% / segment / region)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={risks} onChange={e=>setRisks(e.target.value)} placeholder="Risks to mitigate" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!feature} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_loadtest111() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [system, setSystem] = React.useState('');
  const [expectedLoad, setExpectedLoad] = React.useState('');
  const [scenario, setScenario] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/load-test', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({system, expectedLoad, scenario}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>⚡ Load Test Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design load testing scenarios.</p>
      <input value={system} onChange={e=>setSystem(e.target.value)} placeholder="System / endpoint to test" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={expectedLoad} onChange={e=>setExpectedLoad(e.target.value)} placeholder="Expected concurrent users" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={scenario} onChange={e=>setScenario(e.target.value)} placeholder="Test scenario description" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!system} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_threatmodel111() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [system, setSystem] = React.useState('');
  const [assets, setAssets] = React.useState('');
  const [attackSurface, setAttackSurface] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/dev/threat-model', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({system, assets, attackSurface}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🛡️ Security Threat Modeler</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Model security threats for your system.</p>
      <input value={system} onChange={e=>setSystem(e.target.value)} placeholder="System description" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={assets} onChange={e=>setAssets(e.target.value)} placeholder="Assets to protect" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={attackSurface} onChange={e=>setAttackSurface(e.target.value)} placeholder="Attack surface (APIs, web, mobile)" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!system} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_prompteng112() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [task, setTask] = React.useState('');
  const [context, setContext] = React.useState('');
  const [format, setFormat] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ai/prompt-engineer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({task, context, format}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🤖 Prompt Engineer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Engineer and optimize AI prompts.</p>
      <input value={task} onChange={e=>setTask(e.target.value)} placeholder="What task should the AI perform?" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Context and constraints" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={format} onChange={e=>setFormat(e.target.value)} placeholder="Desired output format" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!task} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_modelsel112() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [useCase, setUseCase] = React.useState('');
  const [requirements, setRequirements] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ai/model-selector', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({useCase, requirements, budget}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🧠 AI Model Selector</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Select the best AI model for your use case.</p>
      <input value={useCase} onChange={e=>setUseCase(e.target.value)} placeholder="Describe your use case" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={requirements} onChange={e=>setRequirements(e.target.value)} placeholder="Key requirements (speed/cost/accuracy)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Monthly budget estimate" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!useCase} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_datapipe112() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [source, setSource] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [transformations, setTransformations] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/data/pipeline-designer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({source, destination, transformations}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔧 Data Pipeline Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design data pipeline architectures.</p>
      <input value={source} onChange={e=>setSource(e.target.value)} placeholder="Data sources" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Data destinations" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={transformations} onChange={e=>setTransformations(e.target.value)} placeholder="Required transformations" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!source} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_mlexp112() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [model, setModel] = React.useState('');
  const [metrics, setMetrics] = React.useState('');
  const [hypothesis, setHypothesis] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ml/experiment-tracker', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({model, metrics, hypothesis}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🧪 ML Experiment Tracker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Track and analyze ML experiments.</p>
      <input value={model} onChange={e=>setModel(e.target.value)} placeholder="Model type" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={metrics} onChange={e=>setMetrics(e.target.value)} placeholder="Key metrics to track" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={hypothesis} onChange={e=>setHypothesis(e.target.value)} placeholder="Experiment hypothesis" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!model} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_vectordb112() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [useCase, setUseCase] = React.useState('');
  const [dataType, setDataType] = React.useState('');
  const [scale, setScale] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ai/vector-db-designer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({useCase, dataType, scale}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🗄️ Vector DB Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design vector database schemas.</p>
      <input value={useCase} onChange={e=>setUseCase(e.target.value)} placeholder="Use case (e.g. semantic search, RAG)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={dataType} onChange={e=>setDataType(e.target.value)} placeholder="Type of data to embed" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={scale} onChange={e=>setScale(e.target.value)} placeholder="Expected scale (records/queries)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!useCase} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_cohortanalyzer113() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [cohortData, setCohortData] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/analytics/cohort-analyzer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, cohortData}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📊 Cohort Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze cohort data for retention insights.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={cohortData} onChange={e=>setCohortData(e.target.value)} placeholder="Paste cohort data or describe your cohorts" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_funnelbuilder113() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [currentRates, setCurrentRates] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/analytics/funnel-builder', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, steps, currentRates}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔽 Funnel Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build and analyze conversion funnels.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Funnel steps (comma-separated)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={currentRates} onChange={e=>setCurrentRates(e.target.value)} placeholder="Current conversion rates (if known)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_retentiondash113() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [metrics, setMetrics] = React.useState('');
  const [timeframe, setTimeframe] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/analytics/retention-dashboard', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, metrics, timeframe}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📈 Retention Dashboard</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a retention metrics dashboard.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={metrics} onChange={e=>setMetrics(e.target.value)} placeholder="Key retention metrics to track" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={timeframe} onChange={e=>setTimeframe(e.target.value)} placeholder="Timeframe for analysis" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_abstats113() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [control, setControl] = React.useState('');
  const [variant, setVariant] = React.useState('');
  const [confidence, setConfidence] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/analytics/ab-stats', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({control, variant, confidence}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔀 A/B Stats Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate statistical significance of A/B tests.</p>
      <input value={control} onChange={e=>setControl(e.target.value)} placeholder="Control: visitors and conversions (e.g. 1000 visitors, 50 conversions)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={variant} onChange={e=>setVariant(e.target.value)} placeholder="Variant: visitors and conversions" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={confidence} onChange={e=>setConfidence(e.target.value)} placeholder="Required confidence level (e.g. 95%)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!control} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_ltvpredictor113() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [arpu, setArpu] = React.useState('');
  const [churnRate, setChurnRate] = React.useState('');
  const [cac, setCac] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/analytics/ltv-predictor', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({arpu, churnRate, cac}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💎 LTV Predictor</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Predict customer lifetime value.</p>
      <input value={arpu} onChange={e=>setArpu(e.target.value)} placeholder="Average revenue per user ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={churnRate} onChange={e=>setChurnRate(e.target.value)} placeholder="Monthly churn rate (%)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={cac} onChange={e=>setCac(e.target.value)} placeholder="Customer acquisition cost ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!arpu} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_jtbd114() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [customer, setCustomer] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/jtbd', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, customer, context}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎯 Jobs-to-be-Done Mapper</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Map customer jobs-to-be-done.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Target customer" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Context in which they use your product" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_pricingstrat114() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/pricing-strategy', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, market, competitors}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💰 Pricing Strategy Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a pricing strategy.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Target market" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="Competitive pricing landscape" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_northstar114() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [businessModel, setBusinessModel] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/north-star', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, businessModel, goal}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>⭐ North Star Metric Finder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Find your north star metric.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={businessModel} onChange={e=>setBusinessModel(e.target.value)} placeholder="Business model" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Primary business goal" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_okrgen114() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
  const [team, setTeam] = React.useState('');
  const [quarter, setQuarter] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/okr-generator', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({goal, team, quarter}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🎯 OKR Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate OKRs for your team.</p>
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Strategic goal" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team or department" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={quarter} onChange={e=>setQuarter(e.target.value)} placeholder="Quarter (e.g. Q3 2024)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!goal} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_persona114() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [data, setData] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/product/user-personas', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({product, segment, data}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>👤 User Persona Creator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create detailed user personas.</p>
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / service" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={segment} onChange={e=>setSegment(e.target.value)} placeholder="User segment to define" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={data} onChange={e=>setData(e.target.value)} placeholder="Any user research or data you have" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_seooptimizer115() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [content, setContent] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/seo/content-optimizer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({content, keyword, competitors}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔍 SEO Content Optimizer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Optimize content for search engines.</p>
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste content to optimize..." rows={6} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Target keyword" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="Competitor URLs (optional)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!content} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_headlineanalyzer115() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [headline, setHeadline] = React.useState('');
  const [context, setContext] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/headline-analyzer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({headline, context, audience}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📰 Headline Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze and improve headlines.</p>
      <input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Headline to analyze" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={context} onChange={e=>setContext(e.target.value)} placeholder="Context (blog post, ad, email subject)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!headline} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_contentcal115() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [brand, setBrand] = React.useState('');
  const [channels, setChannels] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [themes, setThemes] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/content/calendar', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({brand, channels, period, themes}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📅 Content Calendar Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a content calendar.</p>
      <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Brand / company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={channels} onChange={e=>setChannels(e.target.value)} placeholder="Channels (blog, social, email)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Period (e.g. 30 days)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={themes} onChange={e=>setThemes(e.target.value)} placeholder="Content themes / pillars" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!brand} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_backlinkstrat115() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [domain, setDomain] = React.useState('');
  const [niche, setNiche] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/seo/backlink-strategy', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({domain, niche, goals}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔗 Backlink Strategy Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build a backlink acquisition strategy.</p>
      <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="Your domain / site" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Niche / industry" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={goals} onChange={e=>setGoals(e.target.value)} placeholder="SEO goals" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!domain} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_metatag115() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [page, setPage] = React.useState('');
  const [content, setContent] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/seo/meta-tags', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({page, content, keyword}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🏷️ Meta Tag Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate SEO meta tags.</p>
      <input value={page} onChange={e=>setPage(e.target.value)} placeholder="Page title or topic" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={content} onChange={e=>setContent(e.target.value)} placeholder="Brief description of page content" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Target keyword" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!page} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_sopwriter116() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [process, setProcess] = React.useState('');
  const [team, setTeam] = React.useState('');
  const [steps, setSteps] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ops/sop-writer', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({process, team, steps}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📋 SOP Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Write Standard Operating Procedures.</p>
      <input value={process} onChange={e=>setProcess(e.target.value)} placeholder="Process name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team responsible" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={steps} onChange={e=>setSteps(e.target.value)} placeholder="Key process steps" rows={5} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!process} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_perfrev116() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [employee, setEmployee] = React.useState('');
  const [role, setRole] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/hr/performance-review', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({employee, role, highlights}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>⭐ Performance Review Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate performance reviews.</p>
      <input value={employee} onChange={e=>setEmployee(e.target.value)} placeholder="Employee name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role / position" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={highlights} onChange={e=>setHighlights(e.target.value)} placeholder="Key highlights and achievements" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!employee} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_jobdesc116() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [requirements, setRequirements] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/hr/job-description', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({role, company, requirements}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💼 Job Description Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Build comprehensive job descriptions.</p>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Job title" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={requirements} onChange={e=>setRequirements(e.target.value)} placeholder="Key requirements and responsibilities" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!role} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_onboarding116() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/hr/onboarding-checklist', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({role, department, startDate}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🚀 Onboarding Checklist Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate employee onboarding checklists.</p>
      <input value={role} onChange={e=>setRole(e.target.value)} placeholder="New hire role" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="Department" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={startDate} onChange={e=>setStartDate(e.target.value)} placeholder="Start date (optional)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!role} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_meetingai116() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [attendees, setAttendees] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/ops/meeting-agenda', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({topic, attendees, duration}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📝 Meeting Agenda AI</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate meeting agendas.</p>
      <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Meeting topic / purpose" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={attendees} onChange={e=>setAttendees(e.target.value)} placeholder="Attendees and their roles" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Meeting duration" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_contractrisk117() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [contract, setContract] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/legal/contract-risk', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({contract}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>⚖️ Contract Risk Scorer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze contracts for risky clauses.</p>
      <textarea value={contract} onChange={e=>setContract(e.target.value)} placeholder="Paste contract text here..." rows={8} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!contract} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_gdprcheck117() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [description, setDescription] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/legal/gdpr-check', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({description}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🔒 GDPR Checker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Check your data practices for GDPR compliance.</p>
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe your data collection and processing practices..." rows={6} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!description} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_privacypol117() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [company, setCompany] = React.useState('');
  const [dataTypes, setDataTypes] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/legal/privacy-policy', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({company, dataTypes}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📜 Privacy Policy Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a privacy policy.</p>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company / product name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={dataTypes} onChange={e=>setDataTypes(e.target.value)} placeholder="Data collected (e.g. email, location, payment info)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!company} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_tosbuilder117() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [company, setCompany] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/legal/tos-builder', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({company, product}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📄 Terms of Service Builder</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate Terms of Service.</p>
      <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product description" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!company} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_compliance117() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [industry, setIndustry] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/legal/compliance-checklist', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({industry, region}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>✅ Compliance Checklist Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate compliance checklists.</p>
      <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="Industry (e.g. healthcare, fintech, SaaS)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Region (e.g. EU, US, Global)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!industry} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_cashflowfx118() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [revenue, setRevenue] = React.useState('');
  const [expenses, setExpenses] = React.useState('');
  const [months, setMonths] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/cash-flow-forecast', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({revenue, expenses, months}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>💰 Cash Flow Forecaster</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Forecast your cash flow.</p>
      <input value={revenue} onChange={e=>setRevenue(e.target.value)} placeholder="Monthly revenue ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={expenses} onChange={e=>setExpenses(e.target.value)} placeholder="Monthly expenses ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={months} onChange={e=>setMonths(e.target.value)} placeholder="Months to forecast" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!revenue} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_invoicegen118() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [client, setClient] = React.useState('');
  const [services, setServices] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/invoice-generator', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({client, services, amount}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🧾 Invoice Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate professional invoices.</p>
      <input value={client} onChange={e=>setClient(e.target.value)} placeholder="Client name / company" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <textarea value={services} onChange={e=>setServices(e.target.value)} placeholder="Services provided" rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Total amount ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!client} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_taxestimator118() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [income, setIncome] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [entityType, setEntityType] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/tax-estimator', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({income, country, entityType}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📊 Tax Estimator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Estimate your tax liability.</p>
      <input value={income} onChange={e=>setIncome(e.target.value)} placeholder="Annual income / revenue ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="Country (e.g. US, UK)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={entityType} onChange={e=>setEntityType(e.target.value)} placeholder="Entity type (LLC, S-Corp, Sole Proprietor)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!income} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_budgetplanner118() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
  const [runway, setRunway] = React.useState('');
  const [teamSize, setTeamSize] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/budget-planner', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({goal, runway, teamSize}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>📈 Budget Planner</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Create a startup budget plan.</p>
      <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Business goal" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={runway} onChange={e=>setRunway(e.target.value)} placeholder="Available runway ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={teamSize} onChange={e=>setTeamSize(e.target.value)} placeholder="Team size" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!goal} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_fundingcalc118() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [stage, setStage] = React.useState('');
  const [mrr, setMrr] = React.useState('');
  const [growth, setGrowth] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => {
    setLoading(true); setResult('');
    try {
      const r = await fetch(API+'/api/finance/funding-calculator', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body: JSON.stringify({stage, mrr, growth}) });
      const d = await r.json(); setResult(d.result || d.output || d.content || JSON.stringify(d));
    } catch(e) { setResult('Error: '+e.message); }
    setLoading(false);
  };
  return (
    <div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}>
      <h2>🏦 Funding Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate your funding range.</p>
      <input value={stage} onChange={e=>setStage(e.target.value)} placeholder="Funding stage (Pre-seed, Seed, Series A...)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={mrr} onChange={e=>setMrr(e.target.value)} placeholder="Current MRR ($)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <input value={growth} onChange={e=>setGrowth(e.target.value)} placeholder="Monthly growth rate (%)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} />
      <button onClick={run} disabled={loading||!stage} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>
      {result && <pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}
    </div>
  );
}

function ForgeTab_instacap119() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [image, setImage] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [tone, setTone] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/instagram-caption', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({image,brand,tone})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📸 Instagram Caption Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write 3 Instagram captions with hashtags.</p><input value={image} onChange={e=>setImage(e.target.value)} placeholder="Describe your image or product" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Brand name (optional)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={tone} onChange={e=>setTone(e.target.value)} placeholder="Tone (playful / professional / inspirational)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!image} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_communitypost119() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/community-post', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({topic,platform,goal})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💬 Community Post Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write authentic community posts that spark discussion.</p><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Post topic" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={platform} onChange={e=>setPlatform(e.target.value)} placeholder="Platform (Reddit / Discord / Slack)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Goal (spark discussion / build community / get feedback)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_tiktokscript119() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
  const [hook, setHook] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/tiktok-script', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({product,hook,duration})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎵 TikTok Script Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write viral TikTok scripts with hooks and CTAs.</p><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / topic" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={hook} onChange={e=>setHook(e.target.value)} placeholder="Opening hook idea" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duration (e.g. 30 seconds / 60 seconds)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_biooptimizer119() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [platform, setPlatform] = React.useState('');
  const [currentBio, setCurrentBio] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/bio-optimizer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({platform,currentBio,goal})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>✍️ Social Bio Optimizer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Optimize your social media bio for growth and clicks.</p><input value={platform} onChange={e=>setPlatform(e.target.value)} placeholder="Platform (Twitter / Instagram / LinkedIn)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><textarea value={currentBio} onChange={e=>setCurrentBio(e.target.value)} placeholder="Paste your current bio here..." rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Goal (grow following / drive traffic / build authority)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!currentBio} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Optimize'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_viralhook119() {
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/viral-hook', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({topic,platform})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎣 Viral Hook Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 10 viral hook variations using psychological triggers.</p><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic / content idea" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={platform} onChange={e=>setPlatform(e.target.value)} placeholder="Platform (Twitter / TikTok / LinkedIn / YouTube)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate Hooks'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}



export function ForgeTab_coverletter121() {
  const [jd, setJd] = React.useState('');
  const [resume, setResume] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/writing/cover-letter', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({job_description:jd,resume_summary:resume})}); const d = await r.json(); setResult(d.cover_letter||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📄 Cover Letter Optimizer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a tailored, compelling cover letter from your resume + job description.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the job description here..." rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume summary or key achievements..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!jd||!resume} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Cover Letter'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_ytthumb121() {
  const [title, setTitle] = React.useState('');
  const [niche, setNiche] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/yt-thumbnail', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({video_title:title,niche})}); const d = await r.json(); setResult(d.concepts||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎨 YouTube Thumbnail Concept Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get 5 high-CTR thumbnail concepts with visual directions, color schemes, and text overlays.</p><div style={{display:'grid',gap:'1rem'}}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Video title..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Your niche / channel topic (e.g. personal finance, gaming, fitness)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!title} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Thumbnail Concepts'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_apiprice121() {
  const [service, setService] = React.useState('');
  const [usage, setUsage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/api-pricing', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({service_description:service,expected_usage:usage})}); const d = await r.json(); setResult(d.pricing_strategy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💰 API Pricing Calculator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design optimal API pricing tiers: freemium, pay-per-use, and enterprise models.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={service} onChange={e=>setService(e.target.value)} placeholder="Describe your API service / product..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={usage} onChange={e=>setUsage(e.target.value)} placeholder="Expected usage patterns (e.g. 1000 API calls/month per user, B2B SaaS, startup pricing)..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!service} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Calculating...':'Generate Pricing Strategy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_onboardemail121() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/onboard-email-seq', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,target_audience:audience})}); const d = await r.json(); setResult(d.sequence||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📧 Onboarding Email Sequence Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Create a 7-email onboarding sequence that converts trial users to paying customers.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name and what it does..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (e.g. SaaS founders, freelance designers)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Email Sequence'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_riskmatrix121() {
  const [project, setProject] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/strategy/risk-matrix', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({project_description:project,context})}); const d = await r.json(); setResult(d.risk_assessment||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⚠️ Risk Assessment Matrix</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Identify, score, and create mitigation plans for every risk in your project.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={project} onChange={e=>setProject(e.target.value)} placeholder="Describe your project or initiative..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Industry, team size, timeline, budget constraints (optional)..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!project} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Generate Risk Matrix'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}


function ForgeTab_proddesc120() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const API = process.env.NEXT_PUBLIC_API_BASE_URL||'https://forge-production-2692.up.railway.app/api';
  const token = typeof window!=='undefined'?localStorage.getItem('forge_token')||'':'';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/ecom/product-description', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({product,audience})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🛍️ Product Description Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write compelling, SEO-optimized product descriptions that convert.</p><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name and key features" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (e.g. fitness enthusiasts, parents)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate Description'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_essayoutline120() {
  const [topic, setTopic] = React.useState('');
  const [type, setType] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const API = process.env.NEXT_PUBLIC_API_BASE_URL||'https://forge-production-2692.up.railway.app/api';
  const token = typeof window!=='undefined'?localStorage.getItem('forge_token')||'':'';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/writing/essay-outline', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({topic,type})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📝 Essay Outline Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate structured essay outlines with thesis, arguments, and evidence prompts.</p><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Essay topic or question" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><input value={type} onChange={e=>setType(e.target.value)} placeholder="Essay type (argumentative, analytical, narrative)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Build Outline'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_researchsum120() {
  const [topic, setTopic] = React.useState('');
  const [sources, setSources] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const API = process.env.NEXT_PUBLIC_API_BASE_URL||'https://forge-production-2692.up.railway.app/api';
  const token = typeof window!=='undefined'?localStorage.getItem('forge_token')||'':'';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/research/summarizer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({topic,sources})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔬 Market Research Summarizer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Summarize market research into actionable insights and key findings.</p><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Research topic / market (e.g. EV market in Europe)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><textarea value={sources} onChange={e=>setSources(e.target.value)} placeholder="Paste research notes, data points, or source excerpts here" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!topic} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Summarize Research'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_focusplan120() {
  const [tasks, setTasks] = React.useState('');
  const [hours, setHours] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const API = process.env.NEXT_PUBLIC_API_BASE_URL||'https://forge-production-2692.up.railway.app/api';
  const token = typeof window!=='undefined'?localStorage.getItem('forge_token')||'':'';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/focus-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({tasks,hours})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 Focus Session Planner</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Plan deep work sessions with time blocks, breaks, and priority sequencing.</p><textarea value={tasks} onChange={e=>setTasks(e.target.value)} placeholder="List your tasks for today (one per line)" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}} /><input value={hours} onChange={e=>setHours(e.target.value)} placeholder="Available hours (e.g. 4)" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!tasks} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Plan Sessions'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

function ForgeTab_expensereport120() {
  const [expenses, setExpenses] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const API = process.env.NEXT_PUBLIC_API_BASE_URL||'https://forge-production-2692.up.railway.app/api';
  const token = typeof window!=='undefined'?localStorage.getItem('forge_token')||'':'';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/finance/expense-report', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({expenses,purpose})}); const d = await r.json(); setResult(d.result||JSON.stringify(d)); } catch(e:any){setResult('Error: '+e.message);} setLoading(false); };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💸 Expense Report Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate professional expense reports with categorization and justification.</p><textarea value={expenses} onChange={e=>setExpenses(e.target.value)} placeholder="List expenses: item, amount, date (one per line)" rows={4} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem',resize:'vertical'}} /><input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Business purpose / trip name" style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid #333',background:'#1a1a1a',color:'#fff',marginBottom:'0.75rem'}} /><button onClick={run} disabled={loading||!expenses} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 1.5rem',cursor:'pointer',fontWeight:600}}>{loading?'Working...':'Generate Report'}</button>{result&&<pre style={{marginTop:'1.5rem',background:'#1a1a1a',padding:'1rem',borderRadius:'8px',whiteSpace:'pre-wrap',color:'#e2e8f0',fontSize:13}}>{result}</pre>}</div>);
}

export function ForgeTab_pitchdeck122() {
  const [startup, setStartup] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/startup/pitch-deck-outline', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({startup_description:startup,funding_stage:stage})}); const d = await r.json(); setResult(d.outline||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 Investor Pitch Deck Outline</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a slide-by-slide pitch deck outline optimized for your funding stage.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={startup} onChange={e=>setStartup(e.target.value)} placeholder="Describe your startup — what you do, your market, traction so far..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={stage} onChange={e=>setStage(e.target.value)} placeholder="Funding stage (Pre-seed, Seed, Series A...)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!startup} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Generate Pitch Deck Outline'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_persona122() {
  const [product, setProduct] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/customer-persona', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,customer_segment:segment})}); const d = await r.json(); setResult(d.persona||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>👤 Customer Persona Deep-Dive</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a rich, research-backed customer persona with psychographics, pain points, and buying triggers.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product or service..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={segment} onChange={e=>setSegment(e.target.value)} placeholder="Target customer segment (e.g. early-stage SaaS founders, millennial parents)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!segment} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Persona'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_tosgen122() {
  const [biztype, setBiztype] = React.useState('');
  const [features, setFeatures] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/legal/tos-generator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({business_type:biztype,key_features:features})}); const d = await r.json(); setResult(d.terms||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⚖️ Terms of Service Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a plain-English Terms of Service draft tailored to your business type. Always have a lawyer review before publishing.</p><div style={{display:'grid',gap:'1rem'}}><input value={biztype} onChange={e=>setBiztype(e.target.value)} placeholder="Business type (e.g. SaaS platform, e-commerce store, mobile app)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={features} onChange={e=>setFeatures(e.target.value)} placeholder="Key features / what users can do (e.g. user accounts, payments, UGC, API access)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!biztype} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate ToS Draft'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_abtest122() {
  const [feature, setFeature] = React.useState('');
  const [metric, setMetric] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/growth/ab-hypothesis', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feature_or_change:feature,success_metric:metric})}); const d = await r.json(); setResult(d.hypothesis||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🧪 A/B Test Hypothesis Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build rigorous A/B test hypotheses with expected lift, sample size estimates, and success criteria.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={feature} onChange={e=>setFeature(e.target.value)} placeholder="What change are you testing? (e.g. new CTA button color, different headline, simplified checkout)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={metric} onChange={e=>setMetric(e.target.value)} placeholder="Primary success metric (e.g. click-through rate, conversion rate, revenue per user)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!feature||!metric} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build A/B Hypothesis'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_ratecalc122() {
  const [skills, setSkills] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/freelance/rate-calculator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({skills,location})}); const d = await r.json(); setResult(d.rate_analysis||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💵 Freelancer Rate Calculator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate your optimal freelance rate with market benchmarks, pricing tiers, and negotiation scripts.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Your skills, experience level, and type of work (e.g. Senior React developer, 7 years exp, building SaaS products)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Location / target market (e.g. US clients, Europe, remote)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!skills} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Calculating...':'Calculate My Rate'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}


export function ForgeTab_coldemailseq123() {
  const [prospect, setProspect] = React.useState('');
  const [offer, setOffer] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/cold-email-sequence', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({prospect_description:prospect,offer})}); const d = await r.json(); setResult(d.sequence||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📨 Cold Email Sequence Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a 5-touch cold email sequence with follow-ups, subject lines, and send timing.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Describe your ideal prospect (role, industry, company size, pain points)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Your offer / what you're selling and its key value proposition..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!prospect||!offer} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Email Sequence'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_roadmapprior123() {
  const [features, setFeatures] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/roadmap-prioritizer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({features_list:features,business_goals:goals})}); const d = await r.json(); setResult(d.prioritized_roadmap||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🗺️ Product Roadmap Prioritizer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Prioritize your feature backlog using impact/effort scoring and strategic alignment.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={features} onChange={e=>setFeatures(e.target.value)} placeholder="List your features / initiatives (one per line or comma-separated)..." rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={goals} onChange={e=>setGoals(e.target.value)} placeholder="Business goals for this quarter (e.g. grow revenue 30%, reduce churn, enter new market)..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!features} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Prioritizing...':'Prioritize Roadmap'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_brandname123() {
  const [description, setDescription] = React.useState('');
  const [style, setStyle] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/branding/name-generator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({business_description:description,naming_style:style})}); const d = await r.json(); setResult(d.names||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>✨ Brand Name Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 20 unique brand name options with domain availability tips and brand story potential.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe your business — what you do, your values, target audience..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={style} onChange={e=>setStyle(e.target.value)} placeholder="Naming style preference (e.g. made-up word, descriptive, metaphor, founder name, acronym)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!description} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Brand Names'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_meetingagenda123() {
  const [purpose, setPurpose] = React.useState('');
  const [attendees, setAttendees] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/meeting-agenda', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({meeting_purpose:purpose,attendees})}); const d = await r.json(); setResult(d.agenda||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📋 Meeting Agenda Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Create a structured, time-boxed meeting agenda that actually gets decisions made.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Meeting purpose and desired outcomes (e.g. Q3 planning, decide on pricing strategy, sprint retrospective)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={attendees} onChange={e=>setAttendees(e.target.value)} placeholder="Attendees and their roles (e.g. CEO, Head of Sales, 2 engineers)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!purpose} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Agenda'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_objhandler123() {
  const [objection, setObjection] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/objection-handler', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({objection,sales_context:context})}); const d = await r.json(); setResult(d.response||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🛡️ Sales Objection Handler</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get 3 proven response scripts for any sales objection, plus the psychology behind why they work.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={objection} onChange={e=>setObjection(e.target.value)} placeholder="The exact objection you heard (e.g. 'It's too expensive', 'We already have a solution', 'Now is not the right time')..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Sales context — what you're selling, the prospect, deal stage..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!objection} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Handle Objection'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}


export function ForgeTab_subjectline124() {
  const [email_body, setEmailBody] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/email/subject-optimizer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({email_body,target_audience:audience})}); const d = await r.json(); setResult(d.subject_lines||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📬 Email Subject Line Optimizer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 15 high-open-rate subject lines with psychological triggers and emoji variants.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={email_body} onChange={e=>setEmailBody(e.target.value)} placeholder="Paste your email body or describe what the email is about..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (e.g. B2B decision makers, newsletter subscribers, cold prospects)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!email_body} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Optimizing...':'Generate Subject Lines'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_valuation124() {
  const [metrics, setMetrics] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/startup/valuation-estimator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({business_metrics:metrics,funding_stage:stage})}); const d = await r.json(); setResult(d.valuation||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💎 Startup Valuation Estimator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Estimate your startup valuation range using multiple methods: revenue multiples, comparable transactions, and VC scoring.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={metrics} onChange={e=>setMetrics(e.target.value)} placeholder="Your key metrics: ARR/MRR, growth rate, churn, team size, market size, runway, notable customers..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={stage} onChange={e=>setStage(e.target.value)} placeholder="Stage (Pre-revenue, Pre-seed, Seed, Series A...)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!metrics} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Estimating...':'Estimate Valuation'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_contentcal124() {
  const [brand, setBrand] = React.useState('');
  const [channels, setChannels] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/calendar-planner', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({brand_description:brand,channels})}); const d = await r.json(); setResult(d.calendar||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📅 Content Calendar Planner</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a 30-day content calendar with post ideas, themes, and optimal posting times.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Describe your brand — what you do, your audience, your content goals..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={channels} onChange={e=>setChannels(e.target.value)} placeholder="Channels (e.g. LinkedIn, Twitter/X, Instagram, email newsletter, blog)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!brand} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build Content Calendar'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_userinterv124() {
  const [product, setProduct] = React.useState('');
  const [hypothesis, setHypothesis] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/research/user-interview-script', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,research_hypothesis:hypothesis})}); const d = await r.json(); setResult(d.script||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎙️ User Interview Script Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete user interview guide with warm-up questions, core questions, and probing techniques.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product / feature you're researching..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={hypothesis} onChange={e=>setHypothesis(e.target.value)} placeholder="Research hypothesis or key questions you want to validate (e.g. users struggle with onboarding step 3, they want integration with Slack)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Interview Script'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_grantwriter124() {
  const [org, setOrg] = React.useState('');
  const [project, setProject] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/nonprofit/grant-proposal', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({organization:org,project_description:project})}); const d = await r.json(); setResult(d.proposal||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📜 Grant Proposal Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Draft a compelling grant proposal with needs statement, goals, outcomes, and budget narrative.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={org} onChange={e=>setOrg(e.target.value)} placeholder="Your organization — mission, track record, team, location..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={project} onChange={e=>setProject(e.target.value)} placeholder="Project you're seeking funding for — goals, activities, target population, budget needed, expected outcomes..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!org||!project} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Grant Proposal'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}


export function ForgeTab_linkedinpost125() {
  const [topic, setTopic] = React.useState('');
  const [angle, setAngle] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/linkedin-post', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,angle})}); const d = await r.json(); setResult(d.post||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💼 LinkedIn Post Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Create a high-engagement LinkedIn post with hook, story, insight, and CTA.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic or experience to share..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={angle} onChange={e=>setAngle(e.target.value)} placeholder="Angle / goal (e.g. thought leadership, personal story, contrarian take, lesson learned)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate LinkedIn Post'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_churnprev125() {
  const [product, setProduct] = React.useState('');
  const [signals, setSignals] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/growth/churn-prevention', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,churn_signals:signals})}); const d = await r.json(); setResult(d.playbook||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔒 Churn Prevention Playbook</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a systematic playbook to identify at-risk customers and win them back before they cancel.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product / service..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={signals} onChange={e=>setSignals(e.target.value)} placeholder="Known churn signals / patterns you've observed (e.g. login frequency drops, support tickets increase, feature X not used)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Churn Playbook'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_okrbuilder125() {
  const [team, setTeam] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/strategy/okr-builder', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({team_description:team,strategic_goals:goals})}); const d = await r.json(); setResult(d.okrs||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 OKR Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate well-crafted OKRs with ambitious objectives and measurable key results aligned to strategy.</p><div style={{display:'grid',gap:'1rem'}}><input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team / department (e.g. Growth team, Engineering, whole company)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={goals} onChange={e=>setGoals(e.target.value)} placeholder="Strategic goals for this quarter (e.g. expand into enterprise, reduce CAC, ship mobile app)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!team||!goals} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build OKRs'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_battlecard125() {
  const [our_product, setOurProduct] = React.useState('');
  const [competitor, setCompetitor] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/battle-card', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({our_product,competitor_name:competitor})}); const d = await r.json(); setResult(d.battle_card||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⚔️ Competitor Battle Card</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a sales battle card to win deals against a specific competitor — strengths, weaknesses, and talk tracks.</p><div style={{display:'grid',gap:'1rem'}}><input value={our_product} onChange={e=>setOurProduct(e.target.value)} placeholder="Your product and key differentiators..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={competitor} onChange={e=>setCompetitor(e.target.value)} placeholder="Competitor name (e.g. Salesforce, HubSpot, a specific local competitor)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!our_product||!competitor} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Battle Card'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_phlauncher125() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/ph-launch-kit', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,target_audience:audience})}); const d = await r.json(); setResult(d.launch_kit||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 Product Hunt Launch Kit</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get everything you need for a successful Product Hunt launch: tagline, description, maker comment, and launch strategy.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Describe your product — what it does, key features, who it's for..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience on Product Hunt (e.g. developers, startup founders, designers)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Preparing...':'Generate Launch Kit'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}


export function ForgeTab_pressrel126() {
  const [announcement, setAnnouncement] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/pr/press-release', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({announcement,company_info:company})}); const d = await r.json(); setResult(d.press_release||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📰 Press Release Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a professional press release in AP style that journalists will actually read.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="What are you announcing? (product launch, funding, partnership, milestone, hiring...)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company info — name, what you do, location, stage, notable facts..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!announcement||!company} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Press Release'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pricingpage126() {
  const [product, setProduct] = React.useState('');
  const [tiers, setTiers] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/pricing-page-copy', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,pricing_tiers:tiers})}); const d = await r.json(); setResult(d.copy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💳 Pricing Page Copy Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate conversion-optimized pricing page copy with tier names, feature bullets, and objection busters.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product and who it's for..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={tiers} onChange={e=>setTiers(e.target.value)} placeholder="Your pricing tiers and what's included (e.g. Free: 5 projects; Pro: $49/mo, unlimited; Enterprise: custom)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product||!tiers} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Pricing Copy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_techdoc126() {
  const [feature, setFeature] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/engineering/tech-doc', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feature_description:feature,target_audience:audience})}); const d = await r.json(); setResult(d.documentation||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📖 Technical Documentation Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate clear, structured technical documentation with overview, quickstart, reference, and examples.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={feature} onChange={e=>setFeature(e.target.value)} placeholder="Describe the feature, API, or system to document..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (e.g. developers, end users, internal team, API consumers)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!feature} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Documentation'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_csplaybook126() {
  const [product, setProduct] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/cs/success-playbook', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,customer_segment:segment})}); const d = await r.json(); setResult(d.playbook||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🤝 Customer Success Playbook</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a CS playbook covering onboarding, QBRs, expansion, and renewal motions for your customer segment.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product / service..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={segment} onChange={e=>setSegment(e.target.value)} placeholder="Customer segment (e.g. SMB, Mid-market, Enterprise, specific industry)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!segment} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build CS Playbook'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_influencer126() {
  const [brand, setBrand] = React.useState('');
  const [niche, setNiche] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/influencer-outreach', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({brand_description:brand,influencer_niche:niche})}); const d = await r.json(); setResult(d.outreach_scripts||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🌟 Influencer Outreach Script</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate personalized DM and email scripts to pitch influencers and creators for brand collaborations.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Your brand — what you sell, your values, why you're reaching out..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Influencer niche (e.g. fitness micro-influencer, tech YouTuber, parenting blogger)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!brand||!niche} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Outreach Scripts'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}


export function ForgeTab_brandvoice127() {
  const [text, setText] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/brand/voice-analyzer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({text,brand_description:brand})}); const d = await r.json(); setResult(d.analysis||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎙️ Brand Voice Analyzer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze any piece of writing to decode its brand voice — then learn how to match or differentiate from it.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste the text you want to analyze (website copy, emails, social posts, competitor content)..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Your brand context (optional) — who you are, what you sell, your target audience..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!text} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Analyze Brand Voice'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_newsletter127() {
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/email-newsletter', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,audience})}); const d = await r.json(); setResult(d.newsletter||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📧 Email Newsletter Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write engaging email newsletters that readers actually open — with hooks, value-packed content, and CTAs that convert.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Newsletter topic / this week's focus (e.g. how to get your first 100 customers, AI tools for designers)..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Newsletter'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_twitterthread127() {
  const [topic, setTopic] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/twitter-thread', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic})}); const d = await r.json(); setResult(d.thread||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🐦 Viral Twitter Thread</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn any idea into a viral Twitter/X thread that hooks readers from tweet 1 and keeps them reading to the end.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic or idea for your thread..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!topic} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Thread'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_salesproposal127() {
  const [product, setProduct] = React.useState('');
  const [prospect, setProspect] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/proposal', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,prospect})}); const d = await r.json(); setResult(d.proposal||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📋 Sales Proposal Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate professional, persuasive sales proposals that close deals.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product/service..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Prospect / target client..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Proposal'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pitchstory127() {
  const [startup, setStartup] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/pitch-story', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({startup})}); const d = await r.json(); setResult(d.story||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎭 Pitch Deck Storyteller</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Craft a compelling narrative arc for your pitch deck that resonates with investors.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={startup} onChange={e=>setStartup(e.target.value)} placeholder="Describe your startup — what it does, problem solved, traction..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!startup} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Crafting...':'Craft Story'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_launchcheck128() {
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/launch-checklist', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product})}); const d = await r.json(); setResult(d.checklist||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 Product Launch Checklist</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a comprehensive pre-launch checklist to ensure nothing falls through the cracks.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Describe your product/service launch..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Checklist'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_testimonialreq128() {
  const [customer, setCustomer] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/testimonial-request', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({customer,product})}); const d = await r.json(); setResult(d.email||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⭐ Testimonial Request Email</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Craft the perfect email to ask happy customers for testimonials and case studies.</p><div style={{display:'grid',gap:'1rem'}}><input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Customer name / type..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/service they used..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!customer} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Email'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_fundraisingemail128() {
  const [startup, setStartup] = React.useState('');
  const [investor, setInvestor] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/fundraising-email', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({startup,investor})}); const d = await r.json(); setResult(d.email||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💰 Fundraising Email</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write cold investor outreach emails that get replies and meetings.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={startup} onChange={e=>setStartup(e.target.value)} placeholder="Your startup — stage, traction, what you're raising..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={investor} onChange={e=>setInvestor(e.target.value)} placeholder="Target investor / fund type..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!startup} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Email'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_offboardingsurvey128() {
  const [company, setCompany] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/cx/offboarding-survey', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company})}); const d = await r.json(); setResult(d.survey||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>👋 Offboarding Survey</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Create thoughtful exit surveys that reveal why customers churn — and how to win them back.</p><div style={{display:'grid',gap:'1rem'}}><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Your company / product name..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!company} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Survey'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_agentprompt128() {
  const [task, setTask] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/ai/agent-prompt-builder', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({task})}); const d = await r.json(); setResult(d.prompt||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🤖 AI Agent Prompt Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build powerful system prompts for AI agents — structured, role-defined, and task-optimized.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={task} onChange={e=>setTask(e.target.value)} placeholder="Describe the agent's task and purpose..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!task} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Prompt'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_ideavalidator129() {
  const [idea, setIdea] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/startup/idea-validator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({idea})}); const d = await r.json(); setResult(d.validation||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💡 Startup Idea Validator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Stress-test your startup idea against market reality — TAM, competition, moat, and viability.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Describe your startup idea..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!idea} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Validating...':'Validate Idea'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_linkedindm129() {
  const [prospect, setProspect] = React.useState('');
  const [offer, setOffer] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/linkedin-dm', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({prospect,offer})}); const d = await r.json(); setResult(d.message||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💼 Cold LinkedIn DM</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write personalized LinkedIn cold messages that get connection requests accepted and replies.</p><div style={{display:'grid',gap:'1rem'}}><input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Target prospect (role, industry, pain points)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={offer} onChange={e=>setOffer(e.target.value)} placeholder="What you're offering / reason for reaching out..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!prospect} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write DM'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pitchvideo129() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/pitch-video-script', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,audience})}); const d = await r.json(); setResult(d.script||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎬 Pitch Video Script</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a compelling video pitch script — hook, problem, solution, social proof, CTA.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/startup name and what it does..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Script'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_saasonboarding129() {
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/saas/onboarding-sequence', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product})}); const d = await r.json(); setResult(d.sequence||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 SaaS Onboarding Sequence</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a user onboarding flow that drives activation and reduces churn in the first 30 days.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your SaaS product — what it does, key features, target user..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design Onboarding'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_feedbackanalyzer129() {
  const [feedback, setFeedback] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/feedback-analyzer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feedback})}); const d = await r.json(); setResult(d.analysis||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📊 Product Feedback Analyzer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Paste raw user feedback and get structured themes, sentiment, and prioritized action items.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Paste user feedback, reviews, support tickets..." rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!feedback} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Analyze Feedback'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_nichefinder130() {
  const [skills, setSkills] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/business/niche-finder', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({skills})}); const d = await r.json(); setResult(d.niches||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔍 Niche Finder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Discover profitable niches based on your skills, interests, and market demand.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Your skills, experience, interests, and resources..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!skills} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Finding...':'Find Niches'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_ytdescription130() {
  const [videoTitle, setVideoTitle] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/youtube-description', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({videoTitle,topic})}); const d = await r.json(); setResult(d.description||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📺 YouTube Description Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write SEO-optimized YouTube descriptions with timestamps, keywords, and CTAs that drive views.</p><div style={{display:'grid',gap:'1rem'}}><input value={videoTitle} onChange={e=>setVideoTitle(e.target.value)} placeholder="Video title..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="What the video covers..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!videoTitle} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Description'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_faqgenerator130() {
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/faq-generator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product})}); const d = await r.json(); setResult(d.faqs||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>❓ FAQ Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate comprehensive FAQ sections that answer customer objections and reduce support load.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Describe your product/service..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate FAQs'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pricingobjection130() {
  const [objection, setObjection] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/pricing-objection-handler', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({objection,product})}); const d = await r.json(); setResult(d.response||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💬 Pricing Objection Handler</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn "it's too expensive" into a closed deal with proven objection handling scripts.</p><div style={{display:'grid',gap:'1rem'}}><input value={objection} onChange={e=>setObjection(e.target.value)} placeholder="The objection (e.g. 'it's too expensive', 'we can't afford it')..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product/service and its value..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!objection} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Crafting...':'Handle Objection'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_execsummary130() {
  const [document, setDocument] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/writing/executive-summary', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({document})}); const d = await r.json(); setResult(d.summary||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📄 Executive Summary Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Transform long documents, reports, or plans into concise executive summaries that busy leaders actually read.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={document} onChange={e=>setDocument(e.target.value)} placeholder="Paste your document, report, or plan content..." rows={8} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!document} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Summarizing...':'Write Summary'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_jobdescription131() {
  const [role, setRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/hr/job-description', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,company})}); const d = await r.json(); setResult(d.jd||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📋 Job Description Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write compelling, inclusive job descriptions that attract top candidates and reduce time-to-hire.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Job title / role (e.g. Senior Backend Engineer, Head of Marketing)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name and industry (optional)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!role} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Job Description'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productreview131() {
  const [product, setProduct] = React.useState('');
  const [usecase, setUsecase] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/product-review', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,usecase})}); const d = await r.json(); setResult(d.review||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⭐ Product Review Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate authentic, detailed product reviews for any product — great for affiliate content, case studies, or feedback templates.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name and category (e.g. Notion — productivity app)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={usecase} onChange={e=>setUsecase(e.target.value)} placeholder="Use case / reviewer persona (e.g. freelancer, startup founder, student)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Review'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_abtestcopy131() {
  const [original, setOriginal] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/ab-test-copy', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({original_copy:original,conversion_goal:goal})}); const d = await r.json(); setResult(d.variants||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🧪 A/B Test Copy Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate multiple copy variants for A/B testing — headlines, CTAs, landing page copy, email subject lines.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={original} onChange={e=>setOriginal(e.target.value)} placeholder="Your original copy (headline, CTA, email subject, landing page section)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Conversion goal (e.g. increase click-through rate, boost sign-ups, improve open rate)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!original} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Variants'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_customerjourney131() {
  const [product, setProduct] = React.useState('');
  const [persona, setPersona] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/customer-journey', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,persona})}); const d = await r.json(); setResult(d.journey||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🗺️ Customer Journey Mapper</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Map the complete customer journey from awareness to advocacy — identify friction points, emotions, and opportunities at each stage.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product or service..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={persona} onChange={e=>setPersona(e.target.value)} placeholder="Customer persona (e.g. small business owner, enterprise buyer, consumer)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Mapping...':'Map Journey'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_reengageemail131() {
  const [product, setProduct] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/email/re-engage', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,churn_reason:reason})}); const d = await r.json(); setResult(d.email||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔄 Re-engagement Email</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Win back churned or inactive users with personalized re-engagement emails that remind them of your value.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product or service..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why they likely churned / went inactive (optional)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Email'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_podcastoutline132() {
  const [topic, setTopic] = React.useState('');
  const [format, setFormat] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/podcast-outline', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,format})}); const d = await r.json(); setResult(d.outline||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎙️ Podcast Episode Outline</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Create detailed podcast episode outlines with segments, talking points, guest questions, and timestamps.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Episode topic (e.g. How to build a $1M ARR SaaS, The future of remote work)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={format} onChange={e=>setFormat(e.target.value)} placeholder="Format (e.g. solo show, interview, panel, storytelling)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Creating...':'Create Outline'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_webinarscript132() {
  const [title, setTitle] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/webinar-script', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({title,audience})}); const d = await r.json(); setResult(d.script||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📡 Webinar Script Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write complete webinar scripts with opening hooks, content delivery, engagement points, and closing CTAs.</p><div style={{display:'grid',gap:'1rem'}}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Webinar title and topic..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience and their main pain point..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!title} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Script'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productlaunch132() {
  const [product, setProduct] = React.useState('');
  const [channels, setChannels] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/launch-strategy', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,channels})}); const d = await r.json(); setResult(d.strategy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 Product Launch Strategy</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a comprehensive go-to-market launch plan with phases, channels, messaging, and success metrics.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Describe your product — what it is, who it's for, key differentiators..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={channels} onChange={e=>setChannels(e.target.value)} placeholder="Available channels (e.g. Product Hunt, email list, social media, paid ads, PR)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build Launch Strategy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_mentoremail132() {
  const [context, setContext] = React.useState('');
  const [ask, setAsk] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/email/mentor-outreach', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({context,ask})}); const d = await r.json(); setResult(d.email||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🤝 Mentor Outreach Email</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write respectful, compelling emails to reach out to potential mentors, advisors, or industry experts.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Your background and why you're reaching out to this person..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={ask} onChange={e=>setAsk(e.target.value)} placeholder="Specific ask (e.g. 30-min call, feedback on my pitch, intro to someone)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!context} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Email'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_featureannounce132() {
  const [feature, setFeature] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/feature-announcement', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feature,product})}); const d = await r.json(); setResult(d.announcement||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📣 Feature Announcement</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write exciting feature announcements for email, in-app notifications, social media, and release notes.</p><div style={{display:'grid',gap:'1rem'}}><input value={feature} onChange={e=>setFeature(e.target.value)} placeholder="New feature name and what it does..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product name and target user..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!feature} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Announcement'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_scopedoc133() {
  const [project, setProject] = React.useState('');
  const [constraints, setConstraints] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/scope-document', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({project,constraints})}); const d = await r.json(); setResult(d.scope||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📐 Project Scope Document</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate comprehensive project scope documents that define deliverables, boundaries, timeline, and success criteria.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={project} onChange={e=>setProject(e.target.value)} placeholder="Project description — what you're building, for whom, and why..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={constraints} onChange={e=>setConstraints(e.target.value)} placeholder="Constraints (budget, timeline, team size, tech stack)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!project} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Drafting...':'Draft Scope Doc'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_socialbio133() {
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/bio-generator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({name,role})}); const d = await r.json(); setResult(d.bios||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>👤 Social Media Bio Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate compelling bios for Twitter/X, LinkedIn, Instagram, and other platforms — tailored to each platform's style.</p><div style={{display:'grid',gap:'1rem'}}><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={role} onChange={e=>setRole(e.target.value)} placeholder="Your role, what you do, key achievements, what you want to be known for..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!name||!role} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Bios'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_discountcopy133() {
  const [offer, setOffer] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/discount-copy', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({offer,product})}); const d = await r.json(); setResult(d.copy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💸 Discount & Promo Copy</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write urgency-driven promotional copy for discounts, flash sales, seasonal offers, and limited-time deals.</p><div style={{display:'grid',gap:'1rem'}}><input value={offer} onChange={e=>setOffer(e.target.value)} placeholder="The offer (e.g. 40% off, buy 2 get 1, free shipping this weekend)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product or service being promoted..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!offer||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Promo Copy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_meetingreport133() {
  const [notes, setNotes] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/meeting-report', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({notes})}); const d = await r.json(); setResult(d.report||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📝 Meeting Report Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Transform rough meeting notes into a professional report with summary, decisions, action items, and next steps.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Paste your raw meeting notes here..." rows={8} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!notes} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Report'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_growthhack133() {
  const [product, setProduct] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/growth/hack-ideas', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,stage})}); const d = await r.json(); setResult(d.ideas||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📈 Growth Hack Ideator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate creative, actionable growth hacking ideas tailored to your product stage, audience, and channels.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product — what it does, target users, current acquisition channels..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={stage} onChange={e=>setStage(e.target.value)} placeholder="Growth stage (pre-launch, 0-100 users, 100-1000 users, scaling)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Ideating...':'Generate Ideas'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_presskit134() {
  const [company, setCompany] = React.useState('');
  const [highlights, setHighlights] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/pr/press-kit', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,highlights})}); const d = await r.json(); setResult(d.kit||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📰 Press Kit Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete media press kit — boilerplate, founder bio, key facts, and pitch angles for journalists.</p><div style={{display:'grid',gap:'1rem'}}><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name and what it does..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={highlights} onChange={e=>setHighlights(e.target.value)} placeholder="Key highlights: funding, users, growth metrics, team, milestones..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!company} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Press Kit'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_valueprop134() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/value-proposition', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,audience})}); const d = await r.json(); setResult(d.proposition||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💎 Value Proposition Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Craft a razor-sharp value proposition that captures what makes your product unique and why customers should care.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product — what it does, key features, how it works..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience and their main pain points..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Value Prop'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_apispec134() {
  const [endpoint, setEndpoint] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/api-spec', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({endpoint,purpose})}); const d = await r.json(); setResult(d.spec||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔌 API Spec Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate detailed OpenAPI-style specs for your endpoints including request/response schemas, error codes, and examples.</p><div style={{display:'grid',gap:'1rem'}}><input value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="Endpoint (e.g. POST /api/users — creates a new user account)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="What this endpoint does, what data it accepts, what it returns..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!endpoint||!purpose} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate API Spec'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7,fontFamily:'monospace',fontSize:'0.9rem'}}>{result}</div>}</div>);
}

export function ForgeTab_exitplan134() {
  const [business, setBusiness] = React.useState('');
  const [goals, setGoals] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/strategy/exit-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({business,goals})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚪 Exit Strategy Planner</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Map out your business exit strategy — acquisition, IPO, or management buyout — with a realistic roadmap and preparation checklist.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Your business — industry, revenue, team size, stage, key assets..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={goals} onChange={e=>setGoals(e.target.value)} placeholder="Exit goals (timeline, target valuation, preferred exit type)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!business} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Plan Exit Strategy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_threadhook134() {
  const [topic, setTopic] = React.useState('');
  const [angle, setAngle] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/thread-hook', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,angle})}); const d = await r.json(); setResult(d.hooks||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🪝 Thread Hook Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate scroll-stopping opening hooks for Twitter/X threads and LinkedIn posts that make people read the whole thing.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Thread topic or main idea..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={angle} onChange={e=>setAngle(e.target.value)} placeholder="Angle or key insight you want to share (optional)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Hooks'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_coldlinkedin135() {
  const [prospect, setProspect] = React.useState('');
  const [offer, setOffer] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/cold-linkedin', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({prospect,offer})}); const d = await r.json(); setResult(d.messages||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💼 Cold LinkedIn Outreach</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a full cold LinkedIn outreach sequence — connection request, opener, follow-up 1, follow-up 2 — that doesn't feel spammy.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Prospect info — role, company, what they do, any mutual context..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Your offer or reason for reaching out..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!prospect||!offer} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Sequence'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productfeedback135() {
  const [feature, setFeature] = React.useState('');
  const [users, setUsers] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/feedback-survey', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feature,users})}); const d = await r.json(); setResult(d.survey||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📋 Product Feedback Survey Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design targeted user surveys to gather actionable product feedback — with the right questions in the right order.</p><div style={{display:'grid',gap:'1rem'}}><input value={feature} onChange={e=>setFeature(e.target.value)} placeholder="Feature or area you want feedback on..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={users} onChange={e=>setUsers(e.target.value)} placeholder="User segment being surveyed (e.g. power users, churned users, new signups)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!feature} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Survey'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_bugbounty135() {
  const [scope, setScope] = React.useState('');
  const [stack, setStack] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/security/bug-bounty-brief', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({scope,stack})}); const d = await r.json(); setResult(d.brief||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔐 Security Threat Brief</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a security threat assessment and hardening checklist for your application or system.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={scope} onChange={e=>setScope(e.target.value)} placeholder="What you're building or securing (API, web app, mobile app, infra)..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={stack} onChange={e=>setStack(e.target.value)} placeholder="Tech stack (e.g. Node/Express, PostgreSQL, AWS, React)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!scope} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Generate Threat Brief'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_prfaq135() {
  const [idea, setIdea] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/pr-faq', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({idea})}); const d = await r.json(); setResult(d.prfaq||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📄 PR/FAQ Document (Amazon-Style)</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a PR/FAQ working backwards document — the Amazon method for pressure-testing product ideas before building.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Your product idea or feature — what problem does it solve, who is the customer..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!idea} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write PR/FAQ'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_coldtwitter135() {
  const [target, setTarget] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/twitter-dm', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({target,context})}); const d = await r.json(); setResult(d.messages||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🐦 Twitter/X Cold DM Sequence</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a natural cold DM sequence for Twitter/X that opens a conversation without feeling like a pitch.</p><div style={{display:'grid',gap:'1rem'}}><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Who you're DMing (their role, what they post about, your connection)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Why you're reaching out, what you want to achieve..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!target||!context} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate DM Sequence'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_npsanalysis136() {
  const [scores, setScores] = React.useState('');
  const [comments, setComments] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/nps-analysis', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({scores,comments})}); const d = await r.json(); setResult(d.analysis||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📊 NPS Score Analyzer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze your NPS data to extract themes, identify root causes, and generate a prioritized action plan.</p><div style={{display:'grid',gap:'1rem'}}><input value={scores} onChange={e=>setScores(e.target.value)} placeholder="NPS breakdown (e.g. Promoters: 45%, Passives: 30%, Detractors: 25%, Score: +20)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={comments} onChange={e=>setComments(e.target.value)} placeholder="Paste verbatim customer comments here (one per line or as a block)..." rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!scores} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Analyze NPS'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_launchannounce136() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/launch-announcement', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,audience})}); const d = await r.json(); setResult(d.announcement||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 Launch Announcement Kit</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete multi-channel launch announcement — email, social, blog, and press — that drives signups on day one.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="What you're launching — features, benefits, who it's for, pricing..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Primary audience (existing users, new leads, press, both)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building kit...':'Build Launch Kit'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_retrospective136() {
  const [sprint, setSprint] = React.useState('');
  const [team, setTeam] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/team/retrospective', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({sprint,team})}); const d = await r.json(); setResult(d.retro||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔄 Sprint Retrospective Facilitator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a structured retrospective agenda, facilitation guide, and action item tracker for your team sprint review.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={sprint} onChange={e=>setSprint(e.target.value)} placeholder="What happened this sprint — wins, misses, blockers, what was shipped..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team size and context (e.g. 5-person engineering team, 2-week sprint)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!sprint} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Facilitating...':'Generate Retro'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_salesdeck136() {
  const [company, setCompany] = React.useState('');
  const [prospect, setProspect] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/deck-outline', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,prospect})}); const d = await r.json(); setResult(d.deck||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 Sales Deck Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete sales deck outline with slide-by-slide content, speaker notes, and objection handling cues.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={company} onChange={e=>setCompany(e.target.value)} placeholder="Your company — what you sell, key differentiators, pricing, case studies..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Prospect info — company, industry, pain points, deal size..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!company||!prospect} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Sales Deck'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_contentideas136() {
  const [niche, setNiche] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/idea-generator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({niche,platform})}); const d = await r.json(); setResult(d.ideas||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💡 Content Idea Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate 30 days of content ideas for your niche and platform — with hooks, angles, and formats for each.</p><div style={{display:'grid',gap:'1rem'}}><input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Your niche or topic area (e.g. B2B SaaS, fitness coaching, personal finance)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={platform} onChange={e=>setPlatform(e.target.value)} placeholder="Primary platform (LinkedIn, Twitter/X, YouTube, Instagram, TikTok, blog)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!niche||!platform} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate 30 Ideas'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_emailaudit137() {
  const [email, setEmail] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/email/audit', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({email})}); const d = await r.json(); setResult(d.audit||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📧 Email Audit & Optimizer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get a full audit of your email — subject line, preview text, structure, CTA strength, and deliverability tips.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={email} onChange={e=>setEmail(e.target.value)} placeholder="Paste your full email here (subject line, body, CTA)..." rows={10} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!email} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Auditing...':'Audit Email'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_linkedinbanner137() {
  const [role, setRole] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/linkedin-banner', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,brand})}); const d = await r.json(); setResult(d.copy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🖼️ LinkedIn Banner Copy Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate headline copy, taglines, and layout ideas for a high-converting LinkedIn profile banner.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Your role and what you do (e.g. B2B SaaS Founder | Helping companies 10x pipeline)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Your personal brand / key message (e.g. I help founders raise their first $1M)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!role||!brand} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Banner Copy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_demoscript137() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/demo-script', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,audience})}); const d = await r.json(); setResult(d.script||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎬 Product Demo Script Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a compelling product demo script with opening hook, feature walkthroughs, objection handling, and close.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product — what it does, key features, top use cases, pricing..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (e.g. VP of Sales at mid-market SaaS, 50-200 employees)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Demo Script'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productupdate137() {
  const [features, setFeatures] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/changelog-post', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({features,audience})}); const d = await r.json(); setResult(d.post||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📢 Product Update Post Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn raw feature notes into a polished product update post for email, Slack, or your blog — with storytelling and user value framing.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={features} onChange={e=>setFeatures(e.target.value)} placeholder="List the features or changes shipped (e.g. new dashboard, faster search, mobile app launch)..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Who gets this update? (e.g. existing customers, free users, developers)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!features||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Update Post'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_agentbrief137() {
  const [task, setTask] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/ai/agent-brief', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({task,context})}); const d = await r.json(); setResult(d.brief||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🤖 AI Agent Briefing Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a complete agent briefing document — goal, constraints, tools, success criteria, and edge cases — ready to paste into any AI agent framework.</p><div style={{display:'grid',gap:'1rem'}}><input value={task} onChange={e=>setTask(e.target.value)} placeholder="Agent task (e.g. research competitors and summarize findings weekly)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Context — what tools does it have access to, what system is it part of, who uses the output?" rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!task||!context} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Build Agent Brief'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_offerbuilder138() {
  const [product, setProduct] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/offer-builder', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,price})}); const d = await r.json(); setResult(d.offer||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💎 Irresistible Offer Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a high-converting offer stack with bonuses, guarantees, and pricing psychology — making it a no-brainer to buy.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product/service — what it does, main outcomes, who it's for..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price point (e.g. $497, $97/month, $2,500)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!price} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Offer Stack'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_recruiteroutreach138() {
  const [role, setRole] = React.useState('');
  const [candidate, setCandidate] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/hr/recruiter-outreach', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,candidate})}); const d = await r.json(); setResult(d.message||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔍 Recruiter Outreach Message</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write personalized recruiter outreach that candidates actually respond to — no generic copy-paste templates.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role you're hiring for (e.g. Senior Full-Stack Engineer, Head of Growth)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={candidate} onChange={e=>setCandidate(e.target.value)} placeholder="Candidate background (e.g. 8 years Rails experience, built payments team at Stripe, open source contributor)" rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!role||!candidate} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Outreach'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_thoughtleader138() {
  const [topic, setTopic] = React.useState('');
  const [perspective, setPerspective] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/content/thought-leadership', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,perspective})}); const d = await r.json(); setResult(d.post||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🧠 Thought Leadership Post Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn your raw perspective into a polished thought leadership piece that builds authority and drives engagement.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Topic or industry trend (e.g. AI replacing junior developers, remote-first culture)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={perspective} onChange={e=>setPerspective(e.target.value)} placeholder="Your hot take / unique perspective (e.g. I think everyone's wrong about X because in my experience...)" rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!topic||!perspective} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Post'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_apireadme138() {
  const [endpoints, setEndpoints] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/api-readme', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({endpoints,product})}); const d = await r.json(); setResult(d.readme||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📖 API README Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a developer-friendly API README with authentication, endpoints, code examples, and error handling docs.</p><div style={{display:'grid',gap:'1rem'}}><input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/API name and what it does (e.g. PaymentAPI — process payments and manage subscriptions)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={endpoints} onChange={e=>setEndpoints(e.target.value)} placeholder="List your endpoints (e.g. POST /charge, GET /customers, DELETE /subscription/:id — include params if known)" rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product||!endpoints} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate README'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_customerwin138() {
  const [deal, setDeal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/win-analysis', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({deal})}); const d = await r.json(); setResult(d.analysis||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🏆 Win/Loss Deal Analyzer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze a won or lost deal to extract key insights, patterns, and playbook updates for your sales team.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={deal} onChange={e=>setDeal(e.target.value)} placeholder="Describe the deal: company size, pain points discussed, objections raised, competitors involved, outcome (won/lost), why you think it went that way..." rows={8} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!deal} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Analyze Deal'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productpositing139() {
  const [product, setProduct] = React.useState('');
  const [competitors, setCompetitors] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/positioning', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,competitors})}); const d = await r.json(); setResult(d.positioning||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 Product Positioning Workshop</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Develop razor-sharp positioning that makes your product the obvious choice — messaging that resonates and differentiates.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product — features, target customers, key outcomes, current tagline..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={competitors} onChange={e=>setCompetitors(e.target.value)} placeholder="Main competitors (e.g. Salesforce, HubSpot, Monday.com)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!competitors} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Developing...':'Build Positioning'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_scopecreep139() {
  const [project, setProject] = React.useState('');
  const [request, setRequest] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/pm/scope-response', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({project,request})}); const d = await r.json(); setResult(d.response||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🛡️ Scope Creep Response Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get a professional, firm-but-kind response to out-of-scope requests that protects the project without damaging relationships.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={project} onChange={e=>setProject(e.target.value)} placeholder="Your project — what was agreed, timeline, budget, deliverables..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={request} onChange={e=>setRequest(e.target.value)} placeholder="The new request or change being asked for..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!project||!request} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Response'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_investorqa139() {
  const [startup, setStartup] = React.useState('');
  const [round, setRound] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/qa-prep', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({startup,round})}); const d = await r.json(); setResult(d.qa||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💼 Investor Q&A Prep</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Prepare for tough investor questions with model answers — covering market size, competition, unit economics, and team.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={startup} onChange={e=>setStartup(e.target.value)} placeholder="Your startup — what you do, stage, key metrics, business model, team..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={round} onChange={e=>setRound(e.target.value)} placeholder="Funding round (e.g. Pre-seed $500K, Series A $5M, Strategic)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!startup||!round} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Preparing...':'Prep Q&A'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_seoarticle139() {
  const [keyword, setKeyword] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/seo/article-outline', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({keyword,audience})}); const d = await r.json(); setResult(d.outline||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔍 SEO Article Outline Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a search-optimized article outline that ranks — with H2/H3 structure, LSI keywords, featured snippet targets, and word count guidance.</p><div style={{display:'grid',gap:'1rem'}}><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Target keyword (e.g. 'how to reduce customer churn', 'best CRM for startups')" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience (e.g. SaaS founders, e-commerce store owners, HR managers)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!keyword||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build SEO Outline'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_teamcomms139() {
  const [situation, setSituation] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/team/announcement', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({situation,audience})}); const d = await r.json(); setResult(d.message||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📣 Team Announcement Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write clear, well-structured internal announcements for reorgs, layoffs, policy changes, promotions, or company news.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="What you need to communicate (e.g. team restructure, new policy, leadership change, layoffs, office closure)..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Who receives this (e.g. entire company, engineering team, managers only)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!situation||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Announcement'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_coldcall140() {
  const [prospect, setProspect] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/cold-call-script', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({prospect,product})}); const d = await r.json(); setResult(d.script||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📞 Cold Call Script Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a tight, objection-ready cold call script that gets past gatekeepers and books meetings.</p><div style={{display:'grid',gap:'1rem'}}><input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Prospect role and company type (e.g. VP Sales at mid-market SaaS)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Your product/service and key value prop..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!prospect||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Script'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_casetudy140() {
  const [customer, setCustomer] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/case-study', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({customer,outcome})}); const d = await r.json(); setResult(d.case_study||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📋 Case Study Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn customer success stories into persuasive case studies that close deals.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Customer background: industry, size, problem they had before you..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder="Results achieved: specific metrics, timeframe, qualitative wins..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!customer||!outcome} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Case Study'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_squadgoals140() {
  const [team, setTeam] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/team/okr-generator', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({team,period})}); const d = await r.json(); setResult(d.okrs||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 OKR Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate ambitious yet achievable OKRs for your team or company with measurable key results.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team/company context: what you do, current priorities, biggest challenges..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Period (e.g. Q3 2025, H2 2025, 2026 Annual)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!team||!period} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate OKRs'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_apichangelog140() {
  const [changes, setChanges] = React.useState('');
  const [version, setVersion] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/changelog-entry', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({changes,version})}); const d = await r.json(); setResult(d.changelog||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📝 Changelog Entry Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn raw git diffs or bullet points into polished changelog entries that developers and users actually read.</p><div style={{display:'grid',gap:'1rem'}}><input value={version} onChange={e=>setVersion(e.target.value)} placeholder="Version number (e.g. v2.4.0)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={changes} onChange={e=>setChanges(e.target.value)} placeholder="Raw changes: git log, bullet points, PR titles, or rough notes about what changed..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!changes||!version} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Changelog'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_reviewresponder140() {
  const [review, setReview] = React.useState('');
  const [business, setBusiness] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/review-response', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({review,business})}); const d = await r.json(); setResult(d.response||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⭐ Review Response Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Craft professional responses to Google, Yelp, or App Store reviews — turning critics into fans and amplifying praise.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="Paste the customer review here..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Your business name and type (e.g. Acme Coffee Shop, downtown location)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!review||!business} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Responding...':'Write Response'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_threadwriter141() {
  const [topic, setTopic] = React.useState('');
  const [angle, setAngle] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/x-thread', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,angle})}); const d = await r.json(); setResult(d.thread||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🧵 X Thread Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write viral X (Twitter) threads that educate, entertain, and grow your following.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Thread topic (e.g. 'lessons from scaling to 1M users')" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={angle} onChange={e=>setAngle(e.target.value)} placeholder="Your unique angle or hot take..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Thread'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_onepager141() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/one-pager', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,audience})}); const d = await r.json(); setResult(d.one_pager||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📄 Sales One-Pager Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Create a tight, scannable one-pager that sells your product without a sales call.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/service: what it does, key features, pricing..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target buyer (role, company size, industry)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate One-Pager'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_meetingnotes141() {
  const [transcript, setTranscript] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/meeting-notes', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({transcript})}); const d = await r.json(); setResult(d.notes||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📝 Meeting Notes Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn raw meeting transcripts or rough notes into clean, structured meeting minutes with action items.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste your meeting transcript, voice memo transcription, or rough notes..." rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!transcript} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Processing...':'Generate Notes'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_salesletter141() {
  const [product, setProduct] = React.useState('');
  const [pain, setPain] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/sales-letter', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,pain})}); const d = await r.json(); setResult(d.letter||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>✉️ Long-Form Sales Letter</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a persuasive long-form sales letter using proven direct-response frameworks (AIDA, PAS, Story-Proof-CTA).</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/offer details: what it is, price, bonuses, guarantee..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={pain} onChange={e=>setPain(e.target.value)} placeholder="Buyer's pain points: what keeps them up at night, what they've already tried..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product||!pain} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Sales Letter'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_riskregister141() {
  const [project, setProject] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/pm/risk-register', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({project})}); const d = await r.json(); setResult(d.register||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⚠️ Risk Register Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a comprehensive project risk register with likelihood ratings, impact scores, and mitigation strategies.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={project} onChange={e=>setProject(e.target.value)} placeholder="Project description: what you're building, team size, timeline, key dependencies, tech stack..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!project} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Build Risk Register'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_producthunt142() {
  const [product, setProduct] = React.useState('');
  const [tagline, setTagline] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/producthunt-launch', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,tagline})}); const d = await r.json(); setResult(d.launch_kit||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 Product Hunt Launch Kit</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate everything you need for a top Product Hunt launch: tagline, description, first comment, maker comment, and hunter DM template.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product description: what it does, who it's for, key features..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="Draft tagline (we'll improve it)..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Launch Kit'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_repairpitch142() {
  const [situation, setSituation] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/writing/relationship-repair', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({situation,relationship})}); const d = await r.json(); setResult(d.message||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🤝 Relationship Repair Message</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a genuine, non-groveling message to repair a damaged professional or personal relationship.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="What happened: the conflict, misunderstanding, or breakdown..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={relationship} onChange={e=>setRelationship(e.target.value)} placeholder="Relationship type (e.g. colleague, client, mentor, co-founder, friend)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!situation||!relationship} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Message'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_techdebt142() {
  const [codebase, setCodebase] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/tech-debt-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({codebase})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔧 Tech Debt Prioritization Plan</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn your tech debt backlog into a prioritized paydown plan that engineering leadership can actually present to product.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={codebase} onChange={e=>setCodebase(e.target.value)} placeholder="Describe your codebase situation: stack, age, pain points, known debt items, team size, upcoming features that debt will block..." rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!codebase} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build Paydown Plan'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pricingpage142() {
  const [product, setProduct] = React.useState('');
  const [tiers, setTiers] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/pricing-page-copy', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,tiers})}); const d = await r.json(); setResult(d.copy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💰 Pricing Page Copy Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write conversion-optimized pricing page copy — tier names, feature bullets, FAQs, and the anchoring language that makes the middle tier obvious.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product and target market..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={tiers} onChange={e=>setTiers(e.target.value)} placeholder="Pricing tiers and features (e.g. Free: 5 projects, Pro: $29/mo unlimited, Enterprise: custom)" rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!product||!tiers} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Generate Pricing Copy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_weeklyreview142() {
  const [week, setWeek] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/weekly-review', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({week})}); const d = await r.json(); setResult(d.review||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📊 Weekly Review Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Process your week: wins, lessons, energy drains, and a clear plan for next week — in under 5 minutes.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={week} onChange={e=>setWeek(e.target.value)} placeholder="Brain dump your week: what you worked on, wins, what didn't go well, how you felt, random thoughts..." rows={6} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!week} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Processing...':'Process My Week'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_fundraisingdeck143() {
  const [startup, setStartup] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/fundraising-deck', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({startup,stage})}); const d = await r.json(); setResult(d.deck||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💼 Fundraising Deck Outline</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a slide-by-slide fundraising deck outline with the exact narrative arc that top VCs expect.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={startup} onChange={e=>setStartup(e.target.value)} placeholder="Company: what you do, traction, team, market..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={stage} onChange={e=>setStage(e.target.value)} placeholder="Stage (Pre-seed, Seed, Series A...)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!startup||!stage} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Deck Outline'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_customeronboard143() {
  const [product, setProduct] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/onboarding-flow', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,segment})}); const d = await r.json(); setResult(d.flow||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 Customer Onboarding Flow Designer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a step-by-step onboarding flow that gets users to their "aha moment" fast and reduces churn in the first 30 days.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, core value prop, key actions users need to take..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={segment} onChange={e=>setSegment(e.target.value)} placeholder="User segment (e.g. SMB owners, enterprise admins, individual creators)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!segment} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design Onboarding Flow'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_linkedinarticle143() {
  const [topic, setTopic] = React.useState('');
  const [expertise, setExpertise] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/linkedin-article', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,expertise})}); const d = await r.json(); setResult(d.article||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📰 LinkedIn Article Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a long-form LinkedIn article that builds thought leadership and drives profile visits.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Article topic or thesis..." style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={expertise} onChange={e=>setExpertise(e.target.value)} placeholder="Your role/expertise (adds credibility to the voice)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic||!expertise} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Article'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_featurerequest143() {
  const [feedback, setFeedback] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/feature-request-response', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feedback})}); const d = await r.json(); setResult(d.response||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💬 Feature Request Response</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Respond to feature requests in a way that makes customers feel heard even when you're saying no or not now.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Paste the customer's feature request or feedback..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!feedback} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Drafting...':'Draft Response'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_churninterview143() {
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/churn-interview', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({context})}); const d = await r.json(); setResult(d.guide||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔍 Churn Interview Guide</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a structured churn interview guide that uncovers the real reason customers left — not just the surface excuse.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Product context: what you sell, typical customer profile, why you think they're churning..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!context} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Interview Guide'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_launchsequence144() {
  const [product, setProduct] = React.useState('');
  const [launchDate, setLaunchDate] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/launch-email-sequence', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,launchDate})}); const d = await r.json(); setResult(d.sequence||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📧 Launch Email Sequence</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete pre-launch and launch email sequence — from teaser to cart close — that maximizes day-one revenue.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/offer details: what it is, price, key benefit, audience..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={launchDate} onChange={e=>setLaunchDate(e.target.value)} placeholder="Launch date (e.g. July 15)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Sequence'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_joboffer144() {
  const [role, setRole] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/hr/offer-letter', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,details})}); const d = await r.json(); setResult(d.letter||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📋 Offer Letter Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a professional, complete offer letter that sells the candidate on joining while covering all required terms.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role title (e.g. Senior Product Manager)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Compensation details: salary, equity, bonus, benefits, start date, location/remote policy..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!role||!details} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Offer Letter'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_systemdesign144() {
  const [requirement, setRequirement] = React.useState('');
  const [scale, setScale] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/system-design', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({requirement,scale})}); const d = await r.json(); setResult(d.design||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🏗️ System Design Explainer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get a detailed system design breakdown — architecture, data flow, trade-offs, and bottlenecks — for any engineering problem.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={requirement} onChange={e=>setRequirement(e.target.value)} placeholder="System to design (e.g. 'Design URL shortener like bit.ly', 'Design real-time chat system')..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={scale} onChange={e=>setScale(e.target.value)} placeholder="Scale requirements (e.g. 10M DAU, 1B writes/day, 99.99% uptime)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!requirement} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design System'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_ugccreator144() {
  const [brand, setBrand] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/ugc-brief', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({brand,product})}); const d = await r.json(); setResult(d.brief||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎬 UGC Creator Brief</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a UGC (User-Generated Content) creator brief that gets you authentic, high-converting video ads.</p><div style={{display:'grid',gap:'1rem'}}><input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="Brand name and vibe (e.g. Acme — clean, modern, direct-to-consumer)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product details: what it does, key benefit, target audience, price point..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!brand||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate UGC Brief'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_agendasetter144() {
  const [meeting, setMeeting] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/agenda-builder', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({meeting,duration})}); const d = await r.json(); setResult(d.agenda||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📅 Meeting Agenda Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a tight, time-boxed meeting agenda with pre-reads, decision owners, and a parking lot — so meetings actually end on time.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={meeting} onChange={e=>setMeeting(e.target.value)} placeholder="Meeting purpose: what decisions need to be made, who's attending, any context..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Meeting duration (e.g. 30 min, 1 hour)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!meeting||!duration} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Agenda'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_referralprogram145() {
  const [product, setProduct] = React.useState('');
  const [incentive, setIncentive] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/referral-program', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,incentive})}); const d = await r.json(); setResult(d.program||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔁 Referral Program Designer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a referral program that your customers actually want to share — structure, incentives, copy, and mechanics.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, current customer base, price point..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={incentive} onChange={e=>setIncentive(e.target.value)} placeholder="Incentive ideas (e.g. 20% off, $10 credit, free month)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design Program'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_executivebio145() {
  const [person, setPerson] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/writing/executive-bio', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({person,context})}); const d = await r.json(); setResult(d.bio||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>👤 Executive Bio Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a compelling executive bio for speaking engagements, investor decks, press kits, or LinkedIn.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={person} onChange={e=>setPerson(e.target.value)} placeholder="Person details: name, title, career highlights, achievements, education, personal angle..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={context} onChange={e=>setContext(e.target.value)} placeholder="Use case (e.g. conference speaker, investor deck, press kit, LinkedIn)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!person||!context} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Bio'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_apipricing145() {
  const [product, setProduct] = React.useState('');
  const [usage, setUsage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/api-pricing-strategy', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,usage})}); const d = await r.json(); setResult(d.strategy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💰 API Pricing Strategy</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design an API pricing model that scales with your customers and maximizes long-term revenue.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="API product: what it does, target customers, competitors, current pricing (if any)..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={usage} onChange={e=>setUsage(e.target.value)} placeholder="Primary usage metric (e.g. API calls, tokens, seats, GB processed)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!usage} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Analyzing...':'Design Pricing'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_retentionplay145() {
  const [product, setProduct] = React.useState('');
  const [churnSignal, setChurnSignal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/retention-playbook', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,churnSignal})}); const d = await r.json(); setResult(d.playbook||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔒 Retention Playbook Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete retention playbook — from early warning signals to save tactics — that keeps customers for life.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product details: what it is, customer lifecycle, current churn rate, key value moments..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={churnSignal} onChange={e=>setChurnSignal(e.target.value)} placeholder="Top churn signals you've observed (e.g. no login in 14 days, feature not used)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Playbook'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_workshoplan145() {
  const [topic, setTopic] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/workshop-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,audience})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎓 Workshop Planner</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a workshop or training session that people actually remember and apply.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Workshop topic/skill to teach" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Audience (role, experience level, group size)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Plan Workshop'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_resignletter146() {
  const [role, setRole] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/writing/resignation-letter', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,reason})}); const d = await r.json(); setResult(d.letter||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>✉️ Resignation Letter Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a professional, graceful resignation letter that leaves every door open and burns no bridges.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Your current role and company" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for leaving (optional — will be kept private or diplomatically phrased)" rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!role} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Letter'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_termsheet146() {
  const [deal_type, setDeal_type] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/term-sheet-explainer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({deal_type,terms})}); const d = await r.json(); setResult(d.explainer||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📄 Term Sheet Explainer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Understand any term sheet — plain English explanations of every clause, what's standard, and what to negotiate.</p><div style={{display:'grid',gap:'1rem'}}><input value={deal_type} onChange={e=>setDeal_type(e.target.value)} placeholder="Deal type (e.g. VC investment, acquisition, partnership, loan)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={terms} onChange={e=>setTerms(e.target.value)} placeholder="Paste the term sheet or list the key terms you want explained..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!terms} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Explaining...':'Explain Terms'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_userstories146() {
  const [feature, setFeature] = React.useState('');
  const [persona, setPersona] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/pm/user-stories', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feature,persona})}); const d = await r.json(); setResult(d.stories||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📝 User Story Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate complete user stories with acceptance criteria, edge cases, and QA test scenarios for any feature.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={feature} onChange={e=>setFeature(e.target.value)} placeholder="Feature to build: describe what it should do, the user need it addresses..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={persona} onChange={e=>setPersona(e.target.value)} placeholder="User persona (e.g. admin, end user, developer, enterprise buyer)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!feature} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Stories'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_demoscript146() {
  const [product, setProduct] = React.useState('');
  const [prospect, setProspect] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/demo-script', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,prospect})}); const d = await r.json(); setResult(d.script||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎬 Sales Demo Script</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a sales demo script that keeps prospects engaged and guides them to "yes" — not just a feature tour.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, top 3 features to showcase, key differentiators..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={prospect} onChange={e=>setProspect(e.target.value)} placeholder="Prospect role and company type (e.g. VP Sales at B2B SaaS startup)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!prospect} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Demo Script'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_contentaudit146() {
  const [url, setUrl] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/content-audit', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({url,goal})}); const d = await r.json(); setResult(d.audit||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔎 Content Audit Framework</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get a structured content audit framework to identify what to keep, update, consolidate, or kill across your content library.</p><div style={{display:'grid',gap:'1rem'}}><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Website URL or describe your content (blog, docs, social, etc.)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Primary goal (e.g. improve SEO, increase conversions, reduce support tickets)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!goal} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Auditing...':'Build Audit Framework'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_vcdeck147() {
  const [startup, setStartup] = React.useState('');
  const [ask, setAsk] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/vc-narrative', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({startup,ask})}); const d = await r.json(); setResult(d.narrative||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 VC Pitch Narrative</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Craft the narrative arc that makes VCs lean in — the story underneath your pitch deck.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={startup} onChange={e=>setStartup(e.target.value)} placeholder="Startup: what it does, traction, market, team, why now..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={ask} onChange={e=>setAsk(e.target.value)} placeholder="Fundraising ask (e.g. $2M Seed for 18 months runway)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!startup||!ask} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Crafting...':'Craft Narrative'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_competitormap147() {
  const [company, setCompany] = React.useState('');
  const [market, setMarket] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/competitive-landscape', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,market})}); const d = await r.json(); setResult(d.landscape||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🗺️ Competitive Landscape Map</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Map your competitive landscape and identify open positioning gaps before your competitors do.</p><div style={{display:'grid',gap:'1rem'}}><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Your company name and what you do" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={market} onChange={e=>setMarket(e.target.value)} placeholder="Market/category (e.g. CRM software for SMBs, B2B project management tools)" rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!company||!market} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Mapping...':'Map Landscape'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_postmortem147() {
  const [incident, setIncident] = React.useState('');
  const [impact, setImpact] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/postmortem', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({incident,impact})}); const d = await r.json(); setResult(d.postmortem||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔧 Incident Postmortem</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a blameless postmortem that builds trust, prevents recurrence, and actually gets read.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={incident} onChange={e=>setIncident(e.target.value)} placeholder="What happened: describe the incident, timeline, what was done to resolve it..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={impact} onChange={e=>setImpact(e.target.value)} placeholder="Impact: duration, users affected, revenue/SLA impact" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!incident} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Postmortem'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_npsaction147() {
  const [score, setScore] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/nps-action-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({score,feedback})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📊 NPS Action Plan Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Turn your NPS score and feedback into a concrete action plan that actually moves the needle.</p><div style={{display:'grid',gap:'1rem'}}><input value={score} onChange={e=>setScore(e.target.value)} placeholder="Current NPS score (e.g. 42)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Common feedback themes from detractors and promoters..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!score||!feedback} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build Action Plan'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_gtmlaunch147() {
  const [product, setProduct] = React.useState('');
  const [target, setTarget] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/gtm-playbook', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,target})}); const d = await r.json(); setResult(d.playbook||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 GTM Playbook</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete go-to-market playbook for your product launch — channels, messaging, sequence, and metrics.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, price, key differentiator, stage (MVP/beta/v1)..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target customer: role, industry, company size" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!target} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build GTM Playbook'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_salaryneg148() {
  const [role, setRole] = React.useState('');
  const [offer, setOffer] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/career/salary-negotiation', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,offer})}); const d = await r.json(); setResult(d.strategy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💵 Salary Negotiation Strategy</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get a complete salary negotiation playbook — what to say, when to say it, and how much to ask for.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role (e.g. Senior Software Engineer at Series B startup in NYC)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Current offer (e.g. $145K base + $20K bonus + 0.1% equity)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!role||!offer} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Strategizing...':'Build Strategy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pitchmemo148() {
  const [company, setCompany] = React.useState('');
  const [thesis, setThesis] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/investment-memo', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,thesis})}); const d = await r.json(); setResult(d.memo||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📑 Investment Memo</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write an investment memo that a partner will actually read — structured, honest, and built to survive LP scrutiny.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company details: what it does, metrics, team, stage, ask..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={thesis} onChange={e=>setThesis(e.target.value)} placeholder="Investment thesis in one sentence" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!company||!thesis} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Memo'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_prtemplate148() {
  const [announcement, setAnnouncement] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/press-release', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({announcement,company})}); const d = await r.json(); setResult(d.release||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📣 Press Release Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a press release journalists actually open — AP style, real news angle, no corporate fluff.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)} placeholder="What you're announcing: product launch, funding, partnership, milestone..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name, industry, and spokesperson name/title" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!announcement||!company} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Press Release'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productdemo148() {
  const [product, setProduct] = React.useState('');
  const [usecase, setUsecase] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/demo-story', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,usecase})}); const d = await r.json(); setResult(d.story||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 Demo Story Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a compelling product demo story — a narrative that makes your product click for any audience.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, who it's for, core value..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={usecase} onChange={e=>setUsecase(e.target.value)} placeholder="Specific use case to demo (the most common or most powerful)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!usecase} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Demo Story'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_bugpriority148() {
  const [bugs, setBugs] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/bug-prioritization', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({bugs,context})}); const d = await r.json(); setResult(d.priority||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🐛 Bug Prioritization Framework</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Prioritize your bug backlog using a structured framework — so you fix the right bugs first, every time.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={bugs} onChange={e=>setBugs(e.target.value)} placeholder="List your bugs or describe your backlog situation..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={context} onChange={e=>setContext(e.target.value)} placeholder="Team context (e.g. 3-person startup, B2B SaaS, enterprise, mobile-first)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!bugs} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Prioritizing...':'Prioritize Bugs'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_mktgplan149() {
  const [product, setProduct] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/annual-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,budget})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📆 Annual Marketing Plan</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete annual marketing plan — channels, budget allocation, quarterly campaigns, and success metrics.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product/company: what you sell, target market, current state, growth goals..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Annual marketing budget (e.g. $50K, $200K, $1M)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!budget} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build Annual Plan'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_exitinterview149() {
  const [role, setRole] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/hr/exit-interview', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,reason})}); const d = await r.json(); setResult(d.guide||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚪 Exit Interview Guide</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Run exit interviews that actually surface the truth — and turn departing employees into future brand ambassadors.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role of departing employee (e.g. Senior Engineer, Sales Manager)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Stated reason for leaving (if known)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!role} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Interview Guide'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_dataroom149() {
  const [company, setCompany] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/data-room-checklist', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,stage})}); const d = await r.json(); setResult(d.checklist||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🗂️ Data Room Checklist</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get the complete data room checklist for your funding stage — organized by priority so you know what to prepare first.</p><div style={{display:'grid',gap:'1rem'}}><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company name and industry" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={stage} onChange={e=>setStage(e.target.value)} placeholder="Funding stage (Pre-seed, Seed, Series A, B, or M&A)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!company||!stage} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Checklist'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_techinterview149() {
  const [role, setRole] = React.useState('');
  const [stack, setStack] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/hr/tech-interview-kit', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,stack})}); const d = await r.json(); setResult(d.kit||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💻 Technical Interview Kit</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete technical interview kit — coding challenges, architecture questions, and a scoring rubric that reveals actual skills.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role (e.g. Senior Backend Engineer, ML Engineer, Staff Frontend)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={stack} onChange={e=>setStack(e.target.value)} placeholder="Tech stack (e.g. Python/Django, React/Node, Go/Kubernetes)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!role||!stack} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Interview Kit'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_abframework149() {
  const [hypothesis, setHypothesis] = React.useState('');
  const [metric, setMetric] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/ab-test-framework', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({hypothesis,metric})}); const d = await r.json(); setResult(d.framework||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🧪 A/B Test Framework</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a rigorous A/B test — hypothesis, sample size, duration, success criteria, and analysis plan.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={hypothesis} onChange={e=>setHypothesis(e.target.value)} placeholder="Test hypothesis: what you're changing, why you think it will improve..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={metric} onChange={e=>setMetric(e.target.value)} placeholder="Primary metric (e.g. conversion rate, click-through rate, ARPU)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!hypothesis||!metric} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design A/B Test'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_partnershipdeal150() {
  const [partner, setPartner] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/partnership-proposal', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({partner,goal})}); const d = await r.json(); setResult(d.proposal||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🤝 Partnership Proposal</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a partnership proposal that leads with their interests — so they say yes before they've finished reading.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={partner} onChange={e=>setPartner(e.target.value)} placeholder="Partner company: who they are, their goals, their audience, why they'd care..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Your goal from this partnership (distribution, revenue share, co-marketing, integration)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!partner||!goal} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Proposal'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productfaq150() {
  const [product, setProduct] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/product-faq', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,audience})}); const d = await r.json(); setResult(d.faq||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>❓ Product FAQ Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete product FAQ that answers the questions buyers actually have — and removes friction from every stage of the funnel.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, how it works, pricing model, key features..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Buyer audience (e.g. marketing managers at SMBs, CTOs at enterprise, indie makers)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate FAQ'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_sprintretro150() {
  const [team, setTeam] = React.useState('');
  const [events, setEvents] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/pm/sprint-retrospective', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({team,events})}); const d = await r.json(); setResult(d.retro||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔄 Sprint Retrospective Facilitator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a sprint retrospective that surfaces real issues and generates actionable improvement commitments — not just venting.</p><div style={{display:'grid',gap:'1rem'}}><input value={team} onChange={e=>setTeam(e.target.value)} placeholder="Team size and context (e.g. 5-person engineering team, remote, fast-moving)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={events} onChange={e=>setEvents(e.target.value)} placeholder="Key events from this sprint: what shipped, what broke, any notable friction points..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!team} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design Retrospective'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pricingtest150() {
  const [product, setProduct] = React.useState('');
  const [current, setCurrent] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/pricing-experiment', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,current})}); const d = await r.json(); setResult(d.experiment||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>💲 Pricing Experiment Designer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a safe pricing experiment that maximizes revenue learning without alienating existing customers.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, current customer base, growth metrics..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Current pricing (e.g. $29/mo flat, $49/49/199 tiers, usage-based at $0.01/call)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!current} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design Experiment'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_crisiscomms150() {
  const [situation, setSituation] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/crisis-comms', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({situation,audience})}); const d = await r.json(); setResult(d.response||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚨 Crisis Communications</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Draft crisis communications that protect trust, acknowledge reality, and give your audience a reason to stay.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="Crisis situation: what happened, what you know, what you don't know yet..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Primary audience (e.g. customers, employees, investors, media, general public)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!situation||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Drafting...':'Draft Crisis Response'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_brandstory151() {
  const [company, setCompany] = React.useState('');
  const [founder, setFounder] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/brand-story', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,founder})}); const d = await r.json(); setResult(d.story||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📖 Brand Story Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Craft a brand origin story that creates emotional connection and makes customers choose you over cheaper alternatives.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company: what it does, who it helps, what problem it solves, key milestones..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={founder} onChange={e=>setFounder(e.target.value)} placeholder="Founder story: background, what moment sparked the company, what personal experience connects to the problem..." rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!company||!founder} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Crafting...':'Craft Brand Story'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_emailclean151() {
  const [emailContext, setEmailContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/productivity/email-clarity', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({emailContext})}); const d = await r.json(); setResult(d.rewrite||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>✂️ Email Clarity Rewriter</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Paste any email — get it rewritten to be 50% shorter, 100% clearer, and impossible to misunderstand.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={emailContext} onChange={e=>setEmailContext(e.target.value)} placeholder="Paste the email you want rewritten..." rows={8} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!emailContext} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Rewriting...':'Rewrite for Clarity'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_revenueforecast151() {
  const [current, setCurrent] = React.useState('');
  const [assumptions, setAssumptions] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/finance/revenue-forecast', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({current,assumptions})}); const d = await r.json(); setResult(d.forecast||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📈 Revenue Forecast Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a credible 12-month revenue forecast with three scenarios — and the assumptions that make each one defensible.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Current state: MRR, customer count, churn rate, conversion rate, team size..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><textarea value={assumptions} onChange={e=>setAssumptions(e.target.value)} placeholder="Growth assumptions: planned marketing spend, new channels, product launches, hiring plans..." rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!current} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Forecasting...':'Build Forecast'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_prdwriter151() {
  const [feature, setFeature] = React.useState('');
  const [context, setContext] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/pm/prd-writer', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({feature,context})}); const d = await r.json(); setResult(d.prd||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📋 PRD Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a complete Product Requirements Document that engineers love — specific enough to build from, flexible enough to allow good judgment.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={feature} onChange={e=>setFeature(e.target.value)} placeholder="Feature to document: what it does, why we're building it, who it's for..." rows={4} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={context} onChange={e=>setContext(e.target.value)} placeholder="Engineering context (e.g. web app, mobile iOS, internal tool, API)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!feature} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write PRD'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_twitterbio151() {
  const [person, setPerson] = React.useState('');
  const [goal, setGoal] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/social/twitter-bio', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({person,goal})}); const d = await r.json(); setResult(d.bio||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🐦 Twitter/X Bio Optimizer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write an X/Twitter bio that makes the right people follow you instantly — specific, credible, and memorable in 160 characters.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={person} onChange={e=>setPerson(e.target.value)} placeholder="Who you are: role, expertise, achievements, what you tweet about..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Goal (e.g. attract customers, build personal brand, find investors, get hired)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!person||!goal} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Optimizing...':'Optimize Bio'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_pipelinereview152() {
  const [pipeline, setPipeline] = React.useState('');
  const [quota, setQuota] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/pipeline-review', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({pipeline,quota})}); const d = await r.json(); setResult(d.review||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🔭 Pipeline Review</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Analyze your sales pipeline and get a prioritized action plan — which deals to push, which to drop, and what to do this week.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={pipeline} onChange={e=>setPipeline(e.target.value)} placeholder="Describe your pipeline: deals, stages, deal sizes, last activity, blockers, close dates..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={quota} onChange={e=>setQuota(e.target.value)} placeholder="Quota and timeline (e.g. $150K this quarter, 6 weeks remaining)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!pipeline} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Reviewing...':'Review Pipeline'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_onboardingdeck152() {
  const [role, setRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/hr/new-hire-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({role,company})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎯 New Hire 30-60-90 Plan</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a 30-60-90 day onboarding plan that sets new hires up for success and cuts time-to-productivity in half.</p><div style={{display:'grid',gap:'1rem'}}><input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role (e.g. Senior Account Executive, Engineering Manager, Head of Marketing)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company context: stage, culture, current challenges, what success looks like in this role..." rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!role} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build 30-60-90 Plan'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_designbrief152() {
  const [project, setProject] = React.useState('');
  const [audience, setAudience] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/design-brief', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({project,audience})}); const d = await r.json(); setResult(d.brief||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎨 Design Brief Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Generate a complete design brief that aligns stakeholders, guides designers, and prevents endless revision cycles.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={project} onChange={e=>setProject(e.target.value)} placeholder="Project: what needs to be designed, business goal, constraints, timeline..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Target audience for the design" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!project||!audience} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Generating...':'Generate Brief'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_scalingplan152() {
  const [business, setBusiness] = React.useState('');
  const [bottleneck, setBottleneck] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/scaling-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({business,bottleneck})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📐 Scaling Plan Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a concrete plan to scale from where you are now to 10x — people, process, systems, and the order to tackle them.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Business: what you do, current size/revenue, team structure, how you deliver..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={bottleneck} onChange={e=>setBottleneck(e.target.value)} placeholder="Current growth bottleneck (e.g. founder doing everything, no sales process, manual ops)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!business||!bottleneck} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build Scaling Plan'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_thoughtleader152() {
  const [topic, setTopic] = React.useState('');
  const [platform, setPlatform] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/thought-leadership-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({topic,platform})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎤 Thought Leadership Plan</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a 90-day thought leadership content plan that positions you as the go-to expert in your space.</p><div style={{display:'grid',gap:'1rem'}}><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Your expertise area (e.g. B2B SaaS growth, climate tech, fintech regulation)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><input value={platform} onChange={e=>setPlatform(e.target.value)} placeholder="Primary platform (LinkedIn, X/Twitter, Substack, podcast, speaking)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!topic||!platform} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build TL Plan'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_coldoutreach153() {
  const [target, setTarget] = React.useState('');
  const [offer, setOffer] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/cold-outreach-system', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({target,offer})}); const d = await r.json(); setResult(d.system||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📬 Cold Outreach System</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete cold outreach system — targeting criteria, message templates, follow-up sequence, and tracking.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={target} onChange={e=>setTarget(e.target.value)} placeholder="Target prospect: role, company type, size, industry, specific trigger events to look for..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={offer} onChange={e=>setOffer(e.target.value)} placeholder="Your offer/value prop in one line" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!target||!offer} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build System'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_valuemap153() {
  const [product, setProduct] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/value-map', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,segment})}); const d = await r.json(); setResult(d.map||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🗺️ Value Map Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Map your product's value against customer jobs-to-be-done, pains, and gains — the foundation of all great positioning.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: features, how it works, what problems it solves..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={segment} onChange={e=>setSegment(e.target.value)} placeholder="Customer segment (e.g. early-stage founders, enterprise IT managers)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!segment} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Mapping...':'Generate Value Map'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_speakingpitch153() {
  const [speaker, setSpeaker] = React.useState('');
  const [topic, setTopic] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/writing/conference-pitch', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({speaker,topic})}); const d = await r.json(); setResult(d.pitch||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🎙️ Conference Speaker Pitch</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a speaker pitch that gets you accepted to conferences — specific, credible, and audience-focused.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={speaker} onChange={e=>setSpeaker(e.target.value)} placeholder="Speaker bio: expertise, credentials, previous speaking experience, audience reach..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Talk topic and what the audience will learn/be able to do after" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!speaker||!topic} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Speaker Pitch'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_boardupdate153() {
  const [company, setCompany] = React.useState('');
  const [period, setPeriod] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/investor/board-update', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,period})}); const d = await r.json(); setResult(d.update||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📊 Board Update Writer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write a board update that builds trust — honest about challenges, clear on decisions needed, professional without being sanitized.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company state: key metrics this period, wins, misses, challenges, team updates, what you need from the board..." rows={5} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="Period (e.g. Q2 2025, May 2025)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!company||!period} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Board Update'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_vendorneg153() {
  const [vendor, setVendor] = React.useState('');
  const [contract, setContract] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/sales/vendor-negotiation', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({vendor,contract})}); const d = await r.json(); setResult(d.strategy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🤝 Vendor Negotiation Strategy</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Get a complete vendor negotiation playbook — leverage points, tactics, email scripts, and walk-away positions.</p><div style={{display:'grid',gap:'1rem'}}><input value={vendor} onChange={e=>setVendor(e.target.value)} placeholder="Vendor name and what they provide" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={contract} onChange={e=>setContract(e.target.value)} placeholder="Current contract terms: price, duration, what you want to change..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!vendor||!contract} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Strategizing...':'Build Strategy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_productlaunch154() {
  const [product, setProduct] = React.useState('');
  const [launchtype, setLaunchtype] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/product-launch-plan', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,launchtype})}); const d = await r.json(); setResult(d.plan||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>🚀 Product Launch Plan</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a complete product launch plan — T-minus 30 days to T+7, every channel covered, every stakeholder aligned.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it is, target audience, key differentiator, pricing..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={launchtype} onChange={e=>setLaunchtype(e.target.value)} placeholder="Launch type (e.g. new product, feature release, rebranding, market expansion)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product||!launchtype} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Planning...':'Build Launch Plan'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_apidesign154() {
  const [service, setService] = React.useState('');
  const [usecase, setUsecase] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/dev/api-design', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({service,usecase})}); const d = await r.json(); setResult(d.design||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>⚙️ API Design Generator</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design a clean, intuitive REST API — endpoints, request/response schemas, error codes, and versioning strategy.</p><div style={{display:'grid',gap:'1rem'}}><input value={service} onChange={e=>setService(e.target.value)} placeholder="Service to design (e.g. user management, payment processing, notification system)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><textarea value={usecase} onChange={e=>setUsecase(e.target.value)} placeholder="Use cases: who calls this API, what operations they need, scale requirements..." rows={2} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><button onClick={run} disabled={loading||!service||!usecase} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design API'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_hiringpage154() {
  const [company, setCompany] = React.useState('');
  const [roles, setRoles] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/hr/careers-page-copy', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({company,roles})}); const d = await r.json(); setResult(d.copy||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>👥 Careers Page Copy</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Write careers page copy that attracts the people you actually want to hire — specific, honest, and differentiated.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company: culture, mission, stage, how you work, what makes it unique to work here..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={roles} onChange={e=>setRoles(e.target.value)} placeholder="Current open roles (e.g. Backend Eng, Sales Lead, Designer)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!company} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Writing...':'Write Careers Copy'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_growthmodel154() {
  const [business, setBusiness] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/product/growth-model', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({business,stage})}); const d = await r.json(); setResult(d.model||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>📊 Growth Model Designer</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Design your growth model — the underlying mechanics that will compound your business from here to 10x.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Business: what you sell, how you acquire customers, current unit economics..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={stage} onChange={e=>setStage(e.target.value)} placeholder="Stage (pre-PMF, post-PMF, scaling, mature)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!business||!stage} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Designing...':'Design Growth Model'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}

export function ForgeTab_customeravatar154() {
  const [product, setProduct] = React.useState('');
  const [signals, setSignals] = React.useState('');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const API = (window as any).FORGE_API || '';
  const run = async () => { setLoading(true); setResult(''); try { const r = await fetch(API+'/api/marketing/customer-avatar', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('forge_token')||'')},body:JSON.stringify({product,signals})}); const d = await r.json(); setResult(d.avatar||d.error||JSON.stringify(d)); } catch(e:any){setResult(e.message);} finally{setLoading(false);} };
  return (<div style={{padding:'2rem',maxWidth:800,margin:'0 auto'}}><h2>👤 Customer Avatar Builder</h2><p style={{color:'#888',marginBottom:'1.5rem'}}>Build a razor-sharp ideal customer avatar that makes every marketing message feel like it was written just for them.</p><div style={{display:'grid',gap:'1rem'}}><textarea value={product} onChange={e=>setProduct(e.target.value)} placeholder="Product: what it does, problem it solves, who uses it, pricing..." rows={3} style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem',resize:'vertical'}} /><input value={signals} onChange={e=>setSignals(e.target.value)} placeholder="Any signals about your best customers (e.g. what they say, who converts, who churns)" style={{width:'100%',background:'#1a1a2e',color:'#e0e0e0',border:'1px solid #333',borderRadius:8,padding:'0.75rem'}} /><button onClick={run} disabled={loading||!product} style={{padding:'0.75rem 2rem',background:'#6c63ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',opacity:loading?0.6:1}}>{loading?'Building...':'Build Avatar'}</button></div>{result&&<div style={{marginTop:'1.5rem',background:'#1a1a2e',padding:'1.5rem',borderRadius:8,border:'1px solid #333',whiteSpace:'pre-wrap',lineHeight:1.7}}>{result}</div>}</div>);
}
