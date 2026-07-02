const fs = require('fs');
const TSX = '/sessions/sharp-funny-wright/mnt/forge/forge-web-studio/app/components/ForgeApp.tsx';
let lines = fs.readFileSync(TSX, 'utf8').split('\n');

// Find anchors - last wave118 entries
const navAnchor = lines.findIndex(l => l.includes("id:'fundingcalc118'") && l.includes('icon'));
const renderAnchor = lines.findIndex(l => l.includes("'fundingcalc118'") && l.includes('ForgeTab'));
const exportLine = lines.findIndex(l => l.includes('export default function ForgeApp()'));

console.log('navAnchor:', navAnchor, 'renderAnchor:', renderAnchor, 'export:', exportLine);
if (navAnchor < 0 || renderAnchor < 0 || exportLine < 0) { console.error('ANCHORS NOT FOUND'); process.exit(1); }

const NAV = `            { id:'instacap119', icon:'📸', label:'Instagram Caption Writer' },
            { id:'communitypost119', icon:'💬', label:'Community Post Builder' },
            { id:'tiktokscript119', icon:'🎵', label:'TikTok Script Writer' },
            { id:'biooptimizer119', icon:'✍️', label:'Social Bio Optimizer' },
            { id:'viralhook119', icon:'🎣', label:'Viral Hook Generator' },`;

const RENDER = `        {(mainTab as string) === 'instacap119' && <ForgeTab_instacap119 />}
        {(mainTab as string) === 'communitypost119' && <ForgeTab_communitypost119 />}
        {(mainTab as string) === 'tiktokscript119' && <ForgeTab_tiktokscript119 />}
        {(mainTab as string) === 'biooptimizer119' && <ForgeTab_biooptimizer119 />}
        {(mainTab as string) === 'viralhook119' && <ForgeTab_viralhook119 />}`;

const COMPONENTS = `
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
`;

lines.splice(navAnchor + 1, 0, ...NAV.split('\n'));

const newRenderAnchor = lines.findIndex(l => l.includes("'fundingcalc118'") && l.includes('ForgeTab'));
lines.splice(newRenderAnchor + 1, 0, ...RENDER.split('\n'));

const newExport = lines.findIndex(l => l.includes('export default function ForgeApp()'));
lines.splice(newExport, 0, ...COMPONENTS.split('\n'));

fs.writeFileSync(TSX, lines.join('\n'), 'utf8');
console.log('DONE. Lines:', lines.length);
