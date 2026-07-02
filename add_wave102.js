const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'forge-web-studio', 'app', 'components', 'ForgeApp.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// NAV anchor - insert after pressrelease101
const navAnchor = `{ id:'pressrelease101', icon:'\u{1F4F0}', label:'Press Release Writer' },`;
if (!content.includes(navAnchor)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(navAnchor, `{ id:'pressrelease101', icon:'\u{1F4F0}', label:'Press Release Writer' },
            { id:'apidocs102', icon:'\u{1F4DA}', label:'API Doc Generator' },
            { id:'breakeven102', icon:'\u{1F4CA}', label:'Breakeven Calculator' },
            { id:'jobdesc102', icon:'\u{1F4CB}', label:'Job Description Writer' },
            { id:'feedback102', icon:'\u{1F4AC}', label:'Feedback Analyzer' },
            { id:'competitortear102', icon:'\u{1F52D}', label:'Competitor Teardown' },`);

// RENDER anchor
const renderAnchor = `        {(mainTab as string) === 'pressrelease101' && <ForgeTab_pressrelease101 />}`;
if (!content.includes(renderAnchor)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
content = content.replace(renderAnchor, `        {(mainTab as string) === 'pressrelease101' && <ForgeTab_pressrelease101 />}

        {/* ── WAVE 102 ────────────────────────────────────────────── */}
        {(mainTab as string) === 'apidocs102' && <ForgeTab_apidocs102 />}
        {(mainTab as string) === 'breakeven102' && <ForgeTab_breakeven102 />}
        {(mainTab as string) === 'jobdesc102' && <ForgeTab_jobdesc102 />}
        {(mainTab as string) === 'feedback102' && <ForgeTab_feedback102 />}
        {(mainTab as string) === 'competitortear102' && <ForgeTab_competitortear102 />}`);

const components = `
function ForgeTab_apidocs102() {
  const [endpointType, setEndpointType] = React.useState('rest');
  const [spec, setSpec] = React.useState('');
  const [docStyle, setDocStyle] = React.useState('readme');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>API Doc Generator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Turn endpoint specs into beautiful, developer-friendly API documentation with examples.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={endpointType} onChange={(e:any)=>setEndpointType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="rest">REST API</option><option value="graphql">GraphQL</option><option value="websocket">WebSocket</option><option value="sdk">SDK / Library</option>
        </select>
        <select value={docStyle} onChange={(e:any)=>setDocStyle(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="readme">README style</option><option value="openapi">OpenAPI / Swagger</option><option value="postman">Postman collection</option><option value="gitbook">GitBook / Docusaurus</option>
        </select>
      </div>
      <textarea value={spec} onChange={(e:any)=>setSpec(e.target.value)} placeholder="Paste your endpoint specs, route descriptions, parameters, or raw code — e.g.:\nPOST /api/users\nBody: { email, password, name }\nReturns: { user_id, token }\nAuth: Bearer token required" rows={8} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!spec.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/dev/api-docs',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({endpoint_type:endpointType,spec,doc_style:docStyle})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#0ea5e9',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!spec.trim()?0.5:1}}>{loading?'Generating Docs...':'Generate API Docs'}</button>
      {result?.docs && <div style={{marginTop:'1.5rem',background:'#0f172a',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:12,fontFamily:'monospace',color:'#e2e8f0',maxHeight:600,overflowY:'auto' as any}}>{result.docs}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_breakeven102() {
  const [fixedCosts, setFixedCosts] = React.useState('');
  const [variableCost, setVariableCost] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [businessType, setBusinessType] = React.useState('saas');
  const [revenue, setRevenue] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Breakeven Calculator</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Calculate breakeven point, runway, and profitability scenarios with AI-powered analysis and growth recommendations.</p>
      <select value={businessType} onChange={(e:any)=>setBusinessType(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem'}}>
        <option value="saas">SaaS / Subscription</option><option value="ecommerce">E-commerce / Product</option><option value="service">Service / Agency</option><option value="marketplace">Marketplace</option><option value="physical">Physical / Retail</option>
      </select>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={fixedCosts} onChange={(e:any)=>setFixedCosts(e.target.value)} placeholder="Monthly fixed costs ($) — rent, salaries, tools" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={variableCost} onChange={(e:any)=>setVariableCost(e.target.value)} placeholder="Variable cost per unit/customer ($)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <input value={price} onChange={(e:any)=>setPrice(e.target.value)} placeholder="Price per unit/customer ($)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={revenue} onChange={(e:any)=>setRevenue(e.target.value)} placeholder="Current monthly revenue ($) — optional" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <button disabled={loading||!fixedCosts.trim()||!price.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/finance/breakeven',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({fixed_costs:fixedCosts,variable_cost:variableCost,price,business_type:businessType,current_revenue:revenue})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!fixedCosts.trim()||!price.trim()?0.5:1}}>{loading?'Calculating...':'Calculate Breakeven'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_jobdesc102() {
  const [role, setRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [level, setLevel] = React.useState('mid');
  const [remote, setRemote] = React.useState('remote');
  const [skills, setSkills] = React.useState('');
  const [culture, setCulture] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Job Description Writer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Inclusive, high-converting job descriptions that attract top talent and reduce bias.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <input value={role} onChange={(e:any)=>setRole(e.target.value)} placeholder="Role title (e.g. Senior Backend Engineer)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
        <input value={company} onChange={(e:any)=>setCompany(e.target.value)} placeholder="Company name + one-liner" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={level} onChange={(e:any)=>setLevel(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="intern">Intern</option><option value="junior">Junior</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="staff">Staff / Principal</option><option value="lead">Lead / Manager</option><option value="director">Director+</option>
        </select>
        <select value={remote} onChange={(e:any)=>setRemote(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option>
        </select>
      </div>
      <input value={skills} onChange={(e:any)=>setSkills(e.target.value)} placeholder="Key skills required (e.g. React, Node.js, PostgreSQL, 3+ yrs)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={culture} onChange={(e:any)=>setCulture(e.target.value)} placeholder="Culture notes (e.g. fast-paced startup, strong work-life balance)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem',boxSizing:'border-box' as any}} />
      <button disabled={loading||!role.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/hr/job-description',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({role,company,level,remote,skills,culture})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#6366f1',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!role.trim()?0.5:1}}>{loading?'Writing JD...':'Generate Job Description'}</button>
      {result?.jd && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.jd}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_feedback102() {
  const [feedbackText, setFeedbackText] = React.useState('');
  const [source, setSource] = React.useState('reviews');
  const [product, setProduct] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Feedback Analyzer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Extract themes, sentiment, bugs, feature requests, and product insights from raw customer feedback.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={source} onChange={(e:any)=>setSource(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="reviews">App store / G2 reviews</option><option value="support">Support tickets</option><option value="survey">Survey responses</option><option value="interviews">User interviews</option><option value="social">Social media / Twitter</option><option value="mixed">Mixed sources</option>
        </select>
        <input value={product} onChange={(e:any)=>setProduct(e.target.value)} placeholder="Product / service name" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <textarea value={feedbackText} onChange={(e:any)=>setFeedbackText(e.target.value)} placeholder="Paste your customer feedback here (reviews, tickets, comments)..." rows={10} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'1rem'}} />
      <button disabled={loading||!feedbackText.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/product/feedback-analyze',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({feedback:feedbackText,source,product})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#db2777',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!feedbackText.trim()?0.5:1}}>{loading?'Analyzing...':'Analyze Feedback'}</button>
      {result?.analysis && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.analysis}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_competitortear102() {
  const [competitor, setCompetitor] = React.useState('');
  const [yourProduct, setYourProduct] = React.useState('');
  const [angle, setAngle] = React.useState('full');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>Competitor Teardown</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Deep competitive analysis — positioning gaps, messaging weaknesses, differentiation opportunities, and attack angles.</p>
      <input value={competitor} onChange={(e:any)=>setCompetitor(e.target.value)} placeholder="Competitor name + URL or description" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={yourProduct} onChange={(e:any)=>setYourProduct(e.target.value)} placeholder="Your product (name + what it does, optional)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <select value={angle} onChange={(e:any)=>setAngle(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="full">Full teardown</option><option value="pricing">Pricing analysis</option><option value="messaging">Messaging & positioning</option><option value="product">Product gaps</option><option value="battlecard">Sales battlecard</option>
      </select>
      <button disabled={loading||!competitor.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/competitive/teardown',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({competitor,your_product:yourProduct,angle})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!competitor.trim()?0.5:1}}>{loading?'Tearing Down...':'Run Competitor Teardown'}</button>
      {result?.teardown && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.teardown}</div>}
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
