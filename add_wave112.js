const fs = require('fs');
const path = require('path');

const TSX = path.join(__dirname, 'forge-web-studio/app/components/ForgeApp.tsx');
let src = fs.readFileSync(TSX, 'utf8');

// ── NAV ENTRIES ──────────────────────────────────────────────────────────────
const NAV_ANCHOR = `{ id:'threatmodel111', icon:'🛡️', label:'Threat Modeler' },`;
const NAV_NEW = `{ id:'threatmodel111', icon:'🛡️', label:'Threat Modeler' },
        { id:'prompteng112', icon:'🧠', label:'Prompt Engineer' },
        { id:'modelsel112', icon:'🤖', label:'AI Model Selector' },
        { id:'datapipe112', icon:'🔧', label:'Data Pipeline Designer' },
        { id:'mlexp112', icon:'🔬', label:'ML Experiment Tracker' },
        { id:'vectordb112', icon:'🗂️', label:'Vector DB Designer' },`;
if (!src.includes(NAV_ANCHOR)) { console.error('NAV ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(NAV_ANCHOR, NAV_NEW);

// ── RENDER CASES ─────────────────────────────────────────────────────────────
const RENDER_ANCHOR = `{(mainTab as string) === 'threatmodel111' && <ForgeTab_threatmodel111 />}`;
const RENDER_NEW = `{(mainTab as string) === 'threatmodel111' && <ForgeTab_threatmodel111 />}
        {(mainTab as string) === 'prompteng112' && <ForgeTab_prompteng112 />}
        {(mainTab as string) === 'modelsel112' && <ForgeTab_modelsel112 />}
        {(mainTab as string) === 'datapipe112' && <ForgeTab_datapipe112 />}
        {(mainTab as string) === 'mlexp112' && <ForgeTab_mlexp112 />}
        {(mainTab as string) === 'vectordb112' && <ForgeTab_vectordb112 />}`;
if (!src.includes(RENDER_ANCHOR)) { console.error('RENDER ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(RENDER_ANCHOR, RENDER_NEW);

// ── COMPONENT FUNCTIONS ───────────────────────────────────────────────────────
const COMPONENT_ANCHOR = `export default function ForgeApp()`;
const COMPONENTS = `
// ── WAVE 112 ─────────────────────────────────────────────────────────────────

function ForgeTab_prompteng112() {
  const [task, setTask] = React.useState('');
  const [style, setStyle] = React.useState('chain-of-thought');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🧠 Prompt Engineer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Generate optimized prompts for any LLM task using proven techniques like chain-of-thought, few-shot, and ReAct.</p>
      <textarea value={task} onChange={(e:any)=>setTask(e.target.value)} placeholder="Describe your task (e.g. Classify customer support tickets by urgency and category)" rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={style} onChange={(e:any)=>setStyle(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="chain-of-thought">Chain-of-Thought</option>
        <option value="few-shot">Few-Shot Examples</option>
        <option value="zero-shot">Zero-Shot Direct</option>
        <option value="role-based">Role-Based</option>
        <option value="structured-output">Structured Output (JSON)</option>
        <option value="react">ReAct (Reasoning + Acting)</option>
        <option value="tree-of-thought">Tree-of-Thought</option>
      </select>
      <button disabled={loading||!task.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ai/prompt-engineer',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({task,style})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!task.trim()?0.5:1}}>{loading?'Engineering prompt...':'⚡ Generate Prompt'}</button>
      {result?.prompt && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any,fontFamily:'monospace'}}>{result.prompt}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_modelsel112() {
  const [useCase, setUseCase] = React.useState('');
  const [priority, setPriority] = React.useState('balanced');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🤖 AI Model Selector</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Find the best LLM for your use case — comparing cost, speed, context window, and quality across all major providers.</p>
      <textarea value={useCase} onChange={(e:any)=>setUseCase(e.target.value)} placeholder="Describe your use case (e.g. Process 10,000 customer emails per day, extract key info, route to correct department)" rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <select value={priority} onChange={(e:any)=>setPriority(e.target.value)} style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'1rem'}}>
        <option value="cheapest">Lowest Cost</option>
        <option value="balanced">Balanced Cost / Quality</option>
        <option value="fastest">Fastest Response</option>
        <option value="highest-quality">Highest Quality</option>
        <option value="longest-context">Longest Context Window</option>
        <option value="coding">Best for Coding</option>
      </select>
      <button disabled={loading||!useCase.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ai/model-selector',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({useCase,priority})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#2563eb',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!useCase.trim()?0.5:1}}>{loading?'Comparing models...':'🔍 Find Best Model'}</button>
      {result?.recommendation && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.recommendation}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_datapipe112() {
  const [sources, setSources] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [transformations, setTransformations] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🔧 Data Pipeline Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design end-to-end data pipelines with architecture diagrams, tooling recommendations, and code scaffolding.</p>
      <input value={sources} onChange={(e:any)=>setSources(e.target.value)} placeholder="Data sources (e.g. PostgreSQL, Stripe webhooks, S3 event logs, Google Analytics)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <input value={destination} onChange={(e:any)=>setDestination(e.target.value)} placeholder="Destination (e.g. Snowflake data warehouse, BigQuery, ClickHouse)" style={{width:'100%',padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff',marginBottom:'0.75rem',boxSizing:'border-box' as any}} />
      <textarea value={transformations} onChange={(e:any)=>setTransformations(e.target.value)} placeholder="Transformations needed (e.g. Join user events with subscription data, calculate LTV, anonymize PII, aggregate daily)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <button disabled={loading||!sources.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/data/pipeline-designer',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({sources,destination,transformations})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#059669',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!sources.trim()?0.5:1}}>{loading?'Designing pipeline...':'⚙️ Design Pipeline'}</button>
      {result?.design && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.design}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_mlexp112() {
  const [hypothesis, setHypothesis] = React.useState('');
  const [modelType, setModelType] = React.useState('classification');
  const [dataset, setDataset] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🔬 ML Experiment Tracker</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Plan and document ML experiments with baseline metrics, evaluation frameworks, and tracking code.</p>
      <textarea value={hypothesis} onChange={(e:any)=>setHypothesis(e.target.value)} placeholder="Hypothesis / Goal (e.g. Adding user behavioral features will improve churn prediction AUC from 0.82 to 0.88)" rows={3} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'0.75rem'}}>
        <select value={modelType} onChange={(e:any)=>setModelType(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="classification">Classification</option>
          <option value="regression">Regression</option>
          <option value="clustering">Clustering</option>
          <option value="nlp">NLP / Text</option>
          <option value="recommendation">Recommendation</option>
          <option value="time-series">Time Series</option>
          <option value="llm-fine-tuning">LLM Fine-Tuning</option>
          <option value="computer-vision">Computer Vision</option>
        </select>
        <input value={dataset} onChange={(e:any)=>setDataset(e.target.value)} placeholder="Dataset info (e.g. 500K users, 15% churn rate)" style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}} />
      </div>
      <button disabled={loading||!hypothesis.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ml/experiment-tracker',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({hypothesis,modelType,dataset})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#dc2626',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!hypothesis.trim()?0.5:1}}>{loading?'Planning experiment...':'🧪 Plan Experiment'}</button>
      {result?.plan && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.plan}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

function ForgeTab_vectordb112() {
  const [content, setContent] = React.useState('');
  const [scale, setScale] = React.useState('startup');
  const [useCase, setUseCase] = React.useState('rag');
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const API = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'https://forge-production-2692.up.railway.app') : '';
  const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  return (
    <div style={{padding:'1.5rem',maxWidth:800,margin:'0 auto'}}>
      <h2 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'0.5rem'}}>🗂️ Vector DB Designer</h2>
      <p style={{color:'#888',marginBottom:'1.5rem'}}>Design vector database architecture, embedding model selection, chunking strategy, and retrieval pipeline for RAG systems.</p>
      <textarea value={content} onChange={(e:any)=>setContent(e.target.value)} placeholder="Content to index (e.g. 50,000 product docs, customer support tickets, internal wiki articles)" rows={4} style={{width:'100%',background:'#1f2937',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',padding:'0.75rem',fontSize:13,resize:'vertical' as any,boxSizing:'border-box' as any,marginBottom:'0.75rem'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
        <select value={scale} onChange={(e:any)=>setScale(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="startup">Startup (&lt;1M vectors)</option>
          <option value="growth">Growth (1M–100M vectors)</option>
          <option value="enterprise">Enterprise (&gt;100M vectors)</option>
        </select>
        <select value={useCase} onChange={(e:any)=>setUseCase(e.target.value)} style={{padding:'0.5rem',background:'#1f2937',border:'1px solid #374151',borderRadius:6,color:'#fff'}}>
          <option value="rag">RAG / Q&A</option>
          <option value="semantic-search">Semantic Search</option>
          <option value="recommendation">Recommendation</option>
          <option value="deduplication">Deduplication</option>
          <option value="multimodal">Multi-modal</option>
          <option value="long-term-memory">LLM Long-Term Memory</option>
        </select>
      </div>
      <button disabled={loading||!content.trim()} onClick={async()=>{setLoading(true);setResult(null);try{const r=await fetch(API+'/api/ai/vector-db-designer',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({content,scale,useCase})});const d=await r.json();setResult(d);}catch(e:any){setResult({error:e.message});}setLoading(false);}} style={{padding:'0.75rem 2rem',background:'#7c3aed',color:'#fff',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',opacity:loading||!content.trim()?0.5:1}}>{loading?'Designing architecture...':'🗂️ Design Vector DB'}</button>
      {result?.design && <div style={{marginTop:'1.5rem',background:'#1f2937',borderRadius:8,padding:'1rem',whiteSpace:'pre-wrap' as any,fontSize:13,color:'#e5e7eb',maxHeight:600,overflowY:'auto' as any}}>{result.design}</div>}
      {result?.error && <div style={{color:'#f87171',marginTop:'1rem'}}>{result.error}</div>}
    </div>
  );
}

`;
if (!src.includes(COMPONENT_ANCHOR)) { console.error('COMPONENT ANCHOR NOT FOUND'); process.exit(1); }
src = src.replace(COMPONENT_ANCHOR, COMPONENTS + COMPONENT_ANCHOR);

fs.writeFileSync(TSX, src, 'utf8');
console.log('Wave 112 patched. Lines:', src.split('\n').length);
