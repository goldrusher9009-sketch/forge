'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';

export function ForgeTab_standupwriter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [yesterday, setYesterday] = React.useState('');
          const [today, setToday] = React.useState('');
          const [blockers, setBlockers] = React.useState('');
          const [teamCtx, setTeamCtx] = React.useState('');
          const [format, setFormat] = React.useState('slack');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState<string|null>(null);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const write = async () => {
            if (!yesterday || !today) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/standup/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({yesterday,today,blockers,team_context:teamCtx,format}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">☀️ Daily Standup Writer</h2>
              <p className="text-sm text-gray-500 mb-6">Crisp, clear standups that keep your team in the loop</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Yesterday *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="Finished the auth refactor, reviewed 3 PRs, fixed the prod bug from last night..." value={yesterday} onChange={e=>setYesterday(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Today *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="Starting on the payment integration, sprint planning meeting at 2pm..." value={today} onChange={e=>setToday(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Blockers</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Waiting on design review, need AWS access..." value={blockers} onChange={e=>setBlockers(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Team Context</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Engineering team, sprint 23, 5 devs..." value={teamCtx} onChange={e=>setTeamCtx(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Primary Format</label><div className="flex gap-2">{['slack','jira','email'].map(f=><button key={f} onClick={()=>setFormat(f)} className={`px-3 py-1 rounded-full text-sm capitalize ${format===f?'bg-gray-800 text-white':'bg-gray-100'}`}>{f}</button>)}</div></div>
              </div>
              <button onClick={write} disabled={loading||!yesterday||!today} className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50">{loading ? 'Writing...' : '☀️ Write Standup'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-5 relative"><button onClick={()=>{navigator.clipboard.writeText(result.standup);setCopied('main');setTimeout(()=>setCopied(null),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied==='main'?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm">{result.standup}</pre></div>
                  {result.summary_tweet && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>🐦 Tweet-length: </strong>{result.summary_tweet}</div>}
                  {result.blocker_escalation && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm"><strong>🚨 Escalate: </strong>{result.blocker_escalation}</div>}
                  {result.formatted_versions && (
                    <div><p className="font-semibold text-sm mb-2">📋 All Formats</p><div className="space-y-2">{Object.entries(result.formatted_versions).map(([fmt,text]:any)=><div key={fmt} className="border rounded-lg p-3"><div className="flex justify-between items-center mb-1"><span className="text-xs font-medium uppercase text-gray-500">{fmt}</span><button onClick={()=>{navigator.clipboard.writeText(text);setCopied(fmt);setTimeout(()=>setCopied(null),2000);}} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{copied===fmt?'✓':'Copy'}</button></div><pre className="whitespace-pre-wrap text-xs text-gray-700">{text}</pre></div>)}</div></div>
                  )}
                  {result.energy_level_tip && <p className="text-xs text-gray-400 text-center italic">{result.progress_emoji} {result.energy_level_tip}</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_conflictresolve() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [yourPov, setYourPov] = React.useState('');
          const [theirPov, setTheirPov] = React.useState('');
          const [relType, setRelType] = React.useState('colleague');
          const [outcome, setOutcome] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [tab, setTab] = React.useState<'script'|'paths'|'insight'>('insight');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const resolve = async () => {
            if (!situation) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/conflict/resolve`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({situation,your_perspective:yourPov,their_perspective:theirPov,relationship_type:relType,desired_outcome:outcome}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🕊️ Conflict Resolver</h2>
              <p className="text-sm text-gray-500 mb-6">Navigate difficult conversations with empathy and clarity</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What\'s the conflict? *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="My coworker takes credit for my work in meetings. It\'s happened 3 times now..." value={situation} onChange={e=>setSituation(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Your perspective</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="I feel disrespected and invisible..." value={yourPov} onChange={e=>setYourPov(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Their likely perspective</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="They might think they\'re just summarizing team work..." value={theirPov} onChange={e=>setTheirPov(e.target.value)} /></div>
              </div>
              <div className="flex gap-6 mb-4">
                <div><label className="block text-sm font-medium mb-1">Relationship</label><div className="flex gap-2 flex-wrap">{['colleague','friend','partner','family','manager','client'].map(r=><button key={r} onClick={()=>setRelType(r)} className={`px-3 py-1 rounded-full text-sm capitalize ${relType===r?'bg-teal-600 text-white':'bg-gray-100'}`}>{r}</button>)}</div></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Desired outcome</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="I want it to stop happening without damaging our relationship..." value={outcome} onChange={e=>setOutcome(e.target.value)} /></div>
              <button onClick={resolve} disabled={loading||!situation} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50">{loading ? 'Analyzing...' : '🕊️ Help Me Resolve This'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4"><p className="font-semibold text-sm mb-1">Situation Summary</p><p className="text-sm">{result.summary}</p></div>
                  <div className="flex gap-3 mb-4">{(['insight','script','paths'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${tab===t?'bg-teal-600 text-white':'bg-gray-100'}`}>{t}</button>)}</div>
                  {tab==='insight' && (
                    <div className="space-y-3">
                      {result.what_they_likely_feel && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>💙 What they likely feel: </strong>{result.what_they_likely_feel}</div>}
                      {result.your_blind_spot && <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm"><strong>🪟 Your blind spot: </strong>{result.your_blind_spot}</div>}
                      {result.their_valid_point && <div className="bg-yellow-50 rounded-lg p-3 text-sm"><strong>⚖️ Their valid point: </strong>{result.their_valid_point}</div>}
                      {result.relationship_repair_tip && <div className="bg-pink-50 rounded-lg p-3 text-sm"><strong>💜 Repair tip: </strong>{result.relationship_repair_tip}</div>}
                    </div>
                  )}
                  {tab==='script' && (
                    <div className="space-y-3">
                      {result.opening_line && <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="font-semibold text-sm mb-1">👋 Open with</p><p className="text-sm italic">"{result.opening_line}"</p></div>}
                      <div className="bg-gray-50 rounded-xl p-5 border"><pre className="whitespace-pre-wrap text-sm">{result.conversation_script}</pre></div>
                      {result.things_to_avoid_saying?.length>0 && <div className="bg-red-50 rounded-lg p-3"><p className="font-semibold text-sm mb-1 text-red-700">🚫 Don\'t say</p><ul className="space-y-1">{result.things_to_avoid_saying.map((t:string,i:number)=><li key={i} className="text-sm text-red-600">• "{t}"</li>)}</ul></div>}
                    </div>
                  )}
                  {tab==='paths' && (
                    <div className="space-y-3">{result.resolution_paths?.map((p:any,i:number)=><div key={i} className="border rounded-xl p-4"><p className="font-semibold mb-1">{p.path}</p><div className="grid grid-cols-2 gap-2 mt-2"><div className="bg-green-50 rounded p-2 text-xs"><p className="font-medium text-green-700 mb-1">✅ Pros</p>{p.pros}</div><div className="bg-red-50 rounded p-2 text-xs"><p className="font-medium text-red-700 mb-1">⚠️ Cons</p>{p.cons}</div></div></div>)}</div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_priceanchor() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
          const [currentPrice, setCurrentPrice] = React.useState('');
          const [targetPrice, setTargetPrice] = React.useState('');
          const [competitors, setCompetitors] = React.useState('');
          const [customerType, setCustomerType] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!product || !currentPrice) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/price-anchor/strategy`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({product,current_price:currentPrice,target_price:targetPrice,competitors,customer_type:customerType}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💲 Price Anchor Strategy</h2>
              <p className="text-sm text-gray-500 mb-6">Psychological pricing that makes your price feel like a bargain</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Product / Service *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="SaaS tool, coaching package, course..." value={product} onChange={e=>setProduct(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Current Price *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="$99/mo, $2,000 one-time..." value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Target Price</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="$150/mo (what you want to charge)" value={targetPrice} onChange={e=>setTargetPrice(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Customer Type</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="SMB founders, enterprise CTOs..." value={customerType} onChange={e=>setCustomerType(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Competitors & Their Prices</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Competitor A: $200/mo, Competitor B: $50/mo..." value={competitors} onChange={e=>setCompetitors(e.target.value)} /></div>
              <button onClick={generate} disabled={loading||!product||!currentPrice} className="bg-emerald-700 text-white px-6 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50">{loading ? 'Building strategy...' : '💲 Get Pricing Strategy'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3"><div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Recommended Price</p><p className="text-2xl font-black text-emerald-700">{result.recommended_price}</p></div><div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Anchor Price (show first)</p><p className="text-2xl font-black text-yellow-700">{result.anchor_price}</p></div></div>
                  {result.pricing_tiers?.length>0 && (
                    <div><p className="font-semibold text-sm mb-2">📊 Pricing Tiers</p><div className="grid gap-3">{result.pricing_tiers.map((t:any,i:number)=><div key={i} className={`border rounded-xl p-4 ${i===1?'border-emerald-400 bg-emerald-50':''}`}>{i===1&&<div className="text-xs font-bold text-emerald-600 mb-1">⭐ RECOMMENDED</div>}<div className="flex justify-between items-start"><div><p className="font-semibold">{t.name}</p><p className="text-sm text-gray-600">{t.value_prop}</p><p className="text-xs text-gray-400 mt-1">{t.target}</p></div><p className="text-xl font-black text-emerald-700">{t.price}</p></div></div>)}</div></div>
                  )}
                  {result.psychological_tactics?.length>0 && <div className="bg-purple-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">🧠 Psychological Tactics</p><ul className="space-y-1">{result.psychological_tactics.map((t:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-purple-500">•</span>{t}</li>)}</ul></div>}
                  {result.framing_language?.length>0 && <div><p className="font-semibold text-sm mb-2">🗣️ How to Frame the Price</p><div className="space-y-2">{result.framing_language.map((l:string,i:number)=><div key={i} className="bg-gray-50 rounded-lg p-3 text-sm italic">"{l}"</div>)}</div></div>}
                  {result.price_justification && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>📋 Justification script: </strong>{result.price_justification}</div>}
                  {result.upsell_opportunity && <div className="bg-orange-50 rounded-lg p-3 text-sm"><strong>⬆️ Upsell: </strong>{result.upsell_opportunity}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_linkedinbio() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [name, setName] = React.useState('');
          const [role, setRole] = React.useState('');
          const [achievements, setAchievements] = React.useState('');
          const [personality, setPersonality] = React.useState('');
          const [style, setStyle] = React.useState('professional');
          const [funFacts, setFunFacts] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState<string|null>(null);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!role) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/linkedin-bio/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({name,role,achievements,personality,style,fun_facts:funFacts}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const styles = [{ id:'professional', label:'Professional' }, { id:'storytelling', label:'Storytelling' }, { id:'casual', label:'Casual' }, { id:'satirical', label:'🤡 Satirical' }];
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💼 LinkedIn Bio Generator</h2>
              <p className="text-sm text-gray-500 mb-6">From generic to magnetic — bios that get profile views</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Your Name</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Alex Chen" value={name} onChange={e=>setName(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Role / Title *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Founder @ Acme | ex-Google PM" value={role} onChange={e=>setRole(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Key Achievements</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="Built 0→1 product used by 50k people, raised $2M, featured in TechCrunch..." value={achievements} onChange={e=>setAchievements(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Personality / Vibe</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Direct, nerdy about systems, dog dad, terrible at golf..." value={personality} onChange={e=>setPersonality(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Fun Facts</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Speaks 3 languages, former chef, climbed Kilimanjaro..." value={funFacts} onChange={e=>setFunFacts(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Style</label><div className="flex gap-2 flex-wrap">{styles.map(s=><button key={s.id} onClick={()=>setStyle(s.id)} className={`px-3 py-1 rounded-full text-sm ${style===s.id?'bg-blue-700 text-white':'bg-gray-100'}`}>{s.label}</button>)}</div></div>
              <button onClick={generate} disabled={loading||!role} className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50">{loading ? 'Writing bio...' : '💼 Generate Bio'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  {result.headline && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="text-xs text-gray-500 mb-1">HEADLINE</p><p className="font-bold">{result.headline}</p></div>}
                  <div className="bg-gray-50 rounded-xl p-5 relative border"><button onClick={()=>{navigator.clipboard.writeText(result.bio);setCopied('full');setTimeout(()=>setCopied(null),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied==='full'?'✓ Copied':'Copy'}</button><p className="text-xs text-gray-400 mb-2">FULL BIO</p><pre className="whitespace-pre-wrap text-sm">{result.bio}</pre></div>
                  {result.bio_short && <div className="border rounded-xl p-4 relative"><button onClick={()=>{navigator.clipboard.writeText(result.bio_short);setCopied('short');setTimeout(()=>setCopied(null),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied==='short'?'✓':'Copy short'}</button><p className="text-xs text-gray-400 mb-1">SHORT VERSION</p><p className="text-sm">{result.bio_short}</p></div>}
                  {result.cta && <div className="bg-green-50 rounded-lg p-3 text-sm"><strong>📣 CTA: </strong>{result.cta}</div>}
                  {result.keywords_to_include?.length>0 && <div><p className="text-xs text-gray-500 mb-1">Keywords for discoverability</p><div className="flex flex-wrap gap-2">{result.keywords_to_include.map((k:string,i:number)=><span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{k}</span>)}</div></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_failurecv() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [failures, setFailures] = React.useState('');
          const [name, setName] = React.useState('');
          const [currentRole, setCurrentRole] = React.useState('');
          const [tone, setTone] = React.useState('reflective');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [view, setView] = React.useState<'resume'|'entries'>('resume');
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!failures) return;
            const list = failures.split('\n').filter(f=>f.trim());
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/failure-resume/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({failures:list,name,current_role:currentRole,tone}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🏆 Failure Resume</h2>
              <p className="text-sm text-gray-500 mb-6">A CV of your most instructive failures — the real story of your growth</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Your Name</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Alex Chen" value={name} onChange={e=>setName(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Current Role</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Startup Founder, Engineer..." value={currentRole} onChange={e=>setCurrentRole(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Your Failures (one per line) *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={6} placeholder={"Failed my first startup after 2 years\nGot rejected from 47 jobs before my first offer\nPublished a product nobody used\nBombed a big presentation to the board\nGot fired from my second job"} value={failures} onChange={e=>setFailures(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Tone</label><div className="flex gap-2">{['reflective','humorous','proud','raw'].map(t=><button key={t} onClick={()=>setTone(t)} className={`px-3 py-1 rounded-full text-sm capitalize ${tone===t?'bg-gray-800 text-white':'bg-gray-100'}`}>{t}</button>)}</div></div>
              <button onClick={generate} disabled={loading||!failures} className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50">{loading ? 'Building CV...' : '🏆 Build My Failure Resume'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="flex gap-3 mb-4">{(['resume','entries'] as const).map(v=><button key={v} onClick={()=>setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${view===v?'bg-gray-800 text-white':'bg-gray-100'}`}>{v==='resume'?'Full Resume':'Breakdown'}</button>)}</div>
                  {view==='resume' && (
                    <div className="bg-gray-50 rounded-xl p-5 border relative"><button onClick={()=>{navigator.clipboard.writeText(result.resume);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm font-mono">{result.resume}</pre></div>
                  )}
                  {view==='entries' && (
                    <div className="space-y-4">
                      {result.entries?.map((e:any,i:number)=><div key={i} className="border rounded-xl p-4"><p className="font-bold">{e.failure} <span className="text-gray-400 font-normal text-sm">({e.year})</span></p><p className="text-sm text-gray-600 mt-1"><strong>What I tried:</strong> {e.what_i_tried}</p><p className="text-sm text-gray-600"><strong>What happened:</strong> {e.what_happened}</p><div className="mt-2 bg-green-50 rounded-lg p-3"><p className="text-sm text-green-700"><strong>💡 Learned:</strong> {e.what_i_learned}</p><p className="text-sm text-green-600"><strong>→ How it helped:</strong> {e.how_it_helped}</p></div></div>)}
                      {result.growth_summary && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-1">📈 Growth Summary</p><p className="text-sm">{result.growth_summary}</p></div>}
                      {result.closing_line && <p className="text-center italic text-gray-600 text-sm py-3">"{result.closing_line}"</p>}
                    </div>
                  )}
                  {result.overall_lesson && <div className="mt-4 border-2 border-gray-300 rounded-xl p-4"><p className="font-semibold text-sm mb-1">🔑 Overall Lesson</p><p className="text-sm">{result.overall_lesson}</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_morningritual() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goals, setGoals] = React.useState('');
          const [duration, setDuration] = React.useState(60);
          const [wakeTime, setWakeTime] = React.useState('6:00 AM');
          const [constraints, setConstraints] = React.useState('');
          const [current, setCurrent] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const build = async () => {
            if (!goals) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/morning-ritual/build`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({goals,duration_mins:duration,wake_time:wakeTime,constraints,current_routine:current}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🌅 Morning Ritual Builder</h2>
              <p className="text-sm text-gray-500 mb-6">Design a science-backed morning ritual that fits your real life</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What do you want your mornings to give you? *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="More energy, focus for deep work, mental clarity, fitness, calm before chaos..." value={goals} onChange={e=>setGoals(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Available Time: {duration} minutes</label><input type="range" min={10} max={180} step={5} value={duration} onChange={e=>setDuration(+e.target.value)} className="w-full mt-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Wake Time</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="6:00 AM" value={wakeTime} onChange={e=>setWakeTime(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Constraints</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Kids, no gym, small apartment, bad knees..." value={constraints} onChange={e=>setConstraints(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Current Routine</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Snooze 3x, check phone, coffee, panic..." value={current} onChange={e=>setCurrent(e.target.value)} /></div>
              </div>
              <button onClick={build} disabled={loading||!goals} className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50">{loading ? 'Designing ritual...' : '🌅 Build My Morning Ritual'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5"><p className="font-bold text-lg">{result.ritual_name}</p><p className="text-sm text-gray-600 mt-1">{result.philosophy}</p>{result.science_backing && <p className="text-xs text-amber-700 mt-2 italic">🔬 {result.science_backing}</p>}</div>
                  <div><p className="font-semibold text-sm mb-3">⏰ Your Schedule</p><div className="space-y-2">{result.schedule?.map((s:any,i:number)=><div key={i} className={`flex gap-4 border rounded-xl p-3 ${s.optional?'opacity-60':''}`}><div className="text-center min-w-16"><p className="text-xs text-gray-400">+{s.time_offset_mins}m</p><p className="text-xs font-medium">{s.duration_mins}m</p></div><div className="flex-1"><div className="flex items-center gap-2"><p className="font-medium text-sm">{s.activity}</p>{s.optional&&<span className="text-xs text-gray-400">(optional)</span>}</div><p className="text-xs text-gray-500">{s.why}</p></div></div>)}</div></div>
                  {result.minimum_viable_ritual && <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="font-semibold text-sm mb-1">⚡ Minimum Viable Ritual (busy days)</p><p className="text-sm">{result.minimum_viable_ritual}</p></div>}
                  {result.what_to_avoid?.length>0 && <div className="bg-red-50 rounded-lg p-3"><p className="font-semibold text-sm mb-1 text-red-700">🚫 Avoid in your first hour</p><ul className="space-y-1">{result.what_to_avoid.map((a:string,i:number)=><li key={i} className="text-sm text-red-600">• {a}</li>)}</ul></div>}
                  {result.first_week_challenge && <div className="border-2 border-amber-300 rounded-xl p-4"><p className="font-semibold text-sm mb-1">🎯 First Week Challenge</p><p className="text-sm">{result.first_week_challenge}</p></div>}
                  {result.habit_stack_tip && <div className="bg-purple-50 rounded-lg p-3 text-sm"><strong>🔗 Habit stack: </strong>{result.habit_stack_tip}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_apologytext() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [whatYouDid, setWhatYouDid] = React.useState('');
          const [relationship, setRelationship] = React.useState('friend');
          const [tone, setTone] = React.useState('sincere');
          const [medium, setMedium] = React.useState('text');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const write = async () => {
            if (!situation) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/apology-text/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({situation,what_you_did:whatYouDid,relationship,tone,medium}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🙇 Apology Text Writer</h2>
              <p className="text-sm text-gray-500 mb-6">Genuine apologies that actually heal things</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What happened? *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="I forgot our plans last minute, let them down on an important day..." value={situation} onChange={e=>setSituation(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What did you specifically do?</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Cancelled 1 hour before, didn\'t show up, said something hurtful..." value={whatYouDid} onChange={e=>setWhatYouDid(e.target.value)} /></div>
              <div className="flex gap-6 mb-4 flex-wrap">
                <div><label className="block text-sm font-medium mb-1">Relationship</label><div className="flex gap-2 flex-wrap">{['friend','partner','family','colleague','boss','client'].map(r=><button key={r} onClick={()=>setRelationship(r)} className={`px-3 py-1 rounded-full text-sm capitalize ${relationship===r?'bg-rose-500 text-white':'bg-gray-100'}`}>{r}</button>)}</div></div>
                <div><label className="block text-sm font-medium mb-1">Tone</label><div className="flex gap-2">{['sincere','heartfelt','brief','formal'].map(t=><button key={t} onClick={()=>setTone(t)} className={`px-3 py-1 rounded-full text-sm capitalize ${tone===t?'bg-rose-500 text-white':'bg-gray-100'}`}>{t}</button>)}</div></div>
                <div><label className="block text-sm font-medium mb-1">Send via</label><div className="flex gap-2">{['text','email','in-person','letter'].map(m=><button key={m} onClick={()=>setMedium(m)} className={`px-3 py-1 rounded-full text-sm capitalize ${medium===m?'bg-rose-500 text-white':'bg-gray-100'}`}>{m}</button>)}</div></div>
              </div>
              <button onClick={write} disabled={loading||!situation} className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50">{loading?'Writing...':'🙇 Write Apology'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 relative"><button onClick={()=>{navigator.clipboard.writeText(result.apology);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.apology}</pre></div>
                  {result.alternative_shorter && <div className="border rounded-xl p-4"><p className="text-xs text-gray-400 mb-1">SHORT VERSION</p><pre className="whitespace-pre-wrap text-sm">{result.alternative_shorter}</pre></div>}
                  {result.key_acknowledgment && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>💡 Key acknowledgment: </strong>{result.key_acknowledgment}</div>}
                  {result.follow_up_action && <div className="bg-green-50 rounded-lg p-3 text-sm"><strong>→ Follow-up action: </strong>{result.follow_up_action}</div>}
                  {result.timing_advice && <div className="bg-yellow-50 rounded-lg p-3 text-sm"><strong>⏰ Timing: </strong>{result.timing_advice}</div>}
                  {result.what_not_to_say?.length>0 && <div className="bg-red-50 rounded-lg p-3"><p className="font-semibold text-xs text-red-700 mb-1">🚫 Don\'t say</p><ul className="space-y-1">{result.what_not_to_say.map((w:string,i:number)=><li key={i} className="text-xs text-red-600">• "{w}"</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_excusegen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [style, setStyle] = React.useState('professional');
          const [audience, setAudience] = React.useState('boss');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState<number|null>(null);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!situation) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/excuse/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({situation,style,audience}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const riskColor:Record<string,string> = { low:'bg-green-100 text-green-700', medium:'bg-yellow-100 text-yellow-700', high:'bg-red-100 text-red-700' };
          const beliefBar = (n:number) => '█'.repeat(Math.round(n/10*10)).padEnd(10,'░');
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🎭 Excuse Generator</h2>
              <p className="text-sm text-gray-500 mb-6">For emergencies only. We don\'t judge.</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What do you need an excuse for? *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Late to a meeting, missed a deadline, forgot someone\'s birthday..." value={situation} onChange={e=>setSituation(e.target.value)} /></div>
              <div className="flex gap-6 mb-4">
                <div><label className="block text-sm font-medium mb-1">Style</label><div className="flex gap-2">{['professional','funny','creative','desperate'].map(s=><button key={s} onClick={()=>setStyle(s)} className={`px-3 py-1 rounded-full text-sm capitalize ${style===s?'bg-purple-600 text-white':'bg-gray-100'}`}>{s}</button>)}</div></div>
                <div><label className="block text-sm font-medium mb-1">To</label><div className="flex gap-2 flex-wrap">{['boss','friend','partner','client','parents'].map(a=><button key={a} onClick={()=>setAudience(a)} className={`px-3 py-1 rounded-full text-sm capitalize ${audience===a?'bg-purple-600 text-white':'bg-gray-100'}`}>{a}</button>)}</div></div>
              </div>
              <button onClick={generate} disabled={loading||!situation} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">{loading?'Generating...':'🎭 Generate Excuses'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-3">
                  {result.excuses?.map((e:any,i:number)=>(
                    <div key={i} className="border rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2"><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${riskColor[e.risk_level]||''}`}>{e.risk_level} risk</span></div>
                        <button onClick={()=>{navigator.clipboard.writeText(e.excuse);setCopied(i);setTimeout(()=>setCopied(null),2000);}} className="text-xs bg-gray-100 px-3 py-1 rounded-full">{copied===i?'✓ Copied':'Copy'}</button>
                      </div>
                      <p className="text-sm mb-2">"{e.excuse}"</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500"><span>Believability:</span><span className="font-mono text-green-600">{beliefBar(e.believability)}</span><span>{e.believability}/100</span></div>
                      {e.delivery_tip && <p className="text-xs text-gray-400 mt-1 italic">💡 {e.delivery_tip}</p>}
                    </div>
                  ))}
                  {result.best_excuse && <div className="bg-purple-50 border border-purple-200 rounded-xl p-4"><p className="font-semibold text-sm mb-1">🏆 Best bet</p><p className="text-sm">"{result.best_excuse}"</p></div>}
                  {result.better_alternative && <div className="bg-green-50 rounded-lg p-3 text-sm"><strong>✅ Actually better option: </strong>{result.better_alternative}</div>}
                  {result.what_to_say_if_caught && <div className="bg-orange-50 rounded-lg p-3 text-sm"><strong>😬 If caught: </strong>{result.what_to_say_if_caught}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_ventmode() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [vent, setVent] = React.useState('');
          const [wantAdvice, setWantAdvice] = React.useState(false);
          const [wantReframe, setWantReframe] = React.useState(true);
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const express = async () => {
            if (!vent.trim()) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/vent/express`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({vent,want_advice:wantAdvice,want_reframe:wantReframe}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💨 Vent Mode</h2>
              <p className="text-sm text-gray-500 mb-6">No judgment. Just let it out. AI listens and validates.</p>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 text-sm text-indigo-700">
                <strong>This is a safe space.</strong> Say exactly what you\'re feeling. No filters needed.
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What\'s on your mind?</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={6} placeholder="I\'m so frustrated with... I can\'t believe... Nobody ever... Why does this always happen..." value={vent} onChange={e=>setVent(e.target.value)} /></div>
              <div className="flex gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={wantAdvice} onChange={e=>setWantAdvice(e.target.checked)} className="w-4 h-4" /><span className="text-sm">I want advice</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={wantReframe} onChange={e=>setWantReframe(e.target.checked)} className="w-4 h-4" /><span className="text-sm">Help me reframe</span></label>
              </div>
              <button onClick={express} disabled={loading||!vent.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading?'Listening...':'💨 I Hear You'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                    <p className="text-sm leading-relaxed text-indigo-900">{result.you_are_heard}</p>
                    <p className="text-sm leading-relaxed mt-3">{result.validation}</p>
                  </div>
                  {result.their_feelings_named?.length>0 && <div><p className="font-semibold text-sm mb-2">What you\'re feeling</p><div className="flex flex-wrap gap-2">{result.their_feelings_named.map((f:string,i:number)=><span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">{f}</span>)}</div></div>}
                  {result.reframe && <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm"><strong>🔄 Another way to see it: </strong>{result.reframe}</div>}
                  {result.gentle_question && <div className="border-l-4 border-indigo-400 pl-4 py-2"><p className="text-sm italic text-gray-600">"{result.gentle_question}"</p></div>}
                  {result.advice && wantAdvice && <div className="bg-green-50 rounded-xl p-4 text-sm"><strong>💡 Here\'s what I\'d suggest: </strong>{result.advice}</div>}
                  {result.release_ritual && <div className="bg-yellow-50 rounded-lg p-3 text-sm"><strong>✨ Release ritual: </strong>{result.release_ritual}</div>}
                  {result.affirmation && <p className="text-center italic text-indigo-700 py-3 text-sm">"{result.affirmation}"</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_personalbrand() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [name, setName] = React.useState('');
          const [expertise, setExpertise] = React.useState('');
          const [audience, setAudience] = React.useState('');
          const [values, setValues] = React.useState('');
          const [story, setStory] = React.useState('');
          const [goal, setGoal] = React.useState('grow online presence');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [section, setSection] = React.useState<'brand'|'content'|'platforms'|'plan'>('brand');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const build = async () => {
            if (!expertise || !audience) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/personal-brand/build`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({name,expertise,audience,values,origin_story:story,content_goal:goal}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">⚡ Personal Brand Builder</h2>
              <p className="text-sm text-gray-500 mb-6">Your unique positioning, content pillars, and 30-day launch plan</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Your Name</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Alex Chen" value={name} onChange={e=>setName(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Expertise / What you do *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="AI product strategy, fitness coaching, SaaS growth..." value={expertise} onChange={e=>setExpertise(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Target Audience *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Early-stage founders, burned-out professionals..." value={audience} onChange={e=>setAudience(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Your Values</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Honesty, simplicity, no-BS advice..." value={values} onChange={e=>setValues(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Origin Story</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="I burned out at my corporate job and discovered..." value={story} onChange={e=>setStory(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Content Goal</label><div className="flex gap-2 flex-wrap">{['grow online presence','get clients','build community','launch product','get speaking gigs'].map(g=><button key={g} onClick={()=>setGoal(g)} className={`px-3 py-1 rounded-full text-sm capitalize ${goal===g?'bg-orange-500 text-white':'bg-gray-100'}`}>{g}</button>)}</div></div>
              <button onClick={build} disabled={loading||!expertise||!audience} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50">{loading?'Building brand...':'⚡ Build My Brand'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-5 mb-4">
                    <p className="font-bold text-xl mb-1">{result.tagline}</p>
                    <p className="text-sm text-gray-700 mb-2">{result.brand_statement}</p>
                    <p className="text-xs text-orange-600 font-medium">{result.niche}</p>
                    {result.unique_angle && <p className="text-sm italic text-gray-600 mt-2">"Unique angle: {result.unique_angle}"</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap mb-4">{(['brand','content','platforms','plan'] as const).map(s=><button key={s} onClick={()=>setSection(s)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${section===s?'bg-orange-500 text-white':'bg-gray-100'}`}>{s==='plan'?'30-Day Plan':s}</button>)}</div>
                  {section==='brand' && (
                    <div className="space-y-3">
                      {result.positioning && <div className="bg-gray-50 rounded-lg p-3 text-sm"><strong>🎯 Positioning: </strong>{result.positioning}</div>}
                      {result.brand_voice && <div><p className="font-semibold text-sm mb-2">🗣️ Brand Voice</p><div className="flex gap-3"><div className="flex-1"><p className="text-xs text-gray-500 mb-1">Sound like</p><div className="flex flex-wrap gap-1">{result.brand_voice.adjectives?.map((a:string,i:number)=><span key={i} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-sm">{a}</span>)}</div></div><div className="flex-1"><p className="text-xs text-gray-500 mb-1">NOT this</p><div className="flex flex-wrap gap-1">{result.brand_voice.not_this?.map((a:string,i:number)=><span key={i} className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-sm line-through">{a}</span>)}</div></div></div></div>}
                      {result.origin_story_polished && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-1">📖 Your Origin Story</p><p className="text-sm">{result.origin_story_polished}</p></div>}
                    </div>
                  )}
                  {section==='content' && (
                    <div className="space-y-3">{result.content_pillars?.map((p:any,i:number)=><div key={i} className="border rounded-xl p-4"><p className="font-semibold mb-2">{i+1}. {p.pillar}</p><div className="flex flex-wrap gap-2">{p.topics?.map((t:string,j:number)=><span key={j} className="px-2 py-1 bg-gray-100 rounded text-sm">• {t}</span>)}</div></div>)}</div>
                  )}
                  {section==='platforms' && (
                    <div className="space-y-3">{result.platforms_to_focus?.map((p:any,i:number)=><div key={i} className="border rounded-xl p-4"><div className="flex justify-between items-start"><p className="font-semibold capitalize">{p.platform}</p><span className="text-xs bg-gray-100 px-2 py-1 rounded">{p.content_type}</span></div><p className="text-sm text-gray-600 mt-1">{p.why}</p></div>)}</div>
                  )}
                  {section==='plan' && (
                    <div><p className="font-semibold text-sm mb-3">🗓️ First 30 Days</p><ol className="space-y-2">{result['30_day_plan']?.map((a:string,i:number)=><li key={i} className="flex gap-3 border-b pb-2"><span className="font-bold text-orange-500 min-w-6">W{i+1}</span><p className="text-sm">{a}</p></li>)}</ol></div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_weeklyreview() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [wins, setWins] = React.useState('');
          const [struggles, setStruggles] = React.useState('');
          const [lessons, setLessons] = React.useState('');
          const [energy, setEnergy] = React.useState(6);
          const [priorities, setPriorities] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!wins && !struggles) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/weekly-review/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({wins,struggles,lessons,energy_level:energy,next_week_priorities:priorities}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">📅 Weekly Review</h2>
              <p className="text-sm text-gray-500 mb-6">Close the week with clarity. Start Monday with intention.</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">This week\'s wins</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="Shipped the feature, had a great 1:1, finally fixed that bug, worked out 4x..." value={wins} onChange={e=>setWins(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Struggles / What didn\'t go well</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="Got distracted too much, missed a deadline, conflict with a coworker..." value={struggles} onChange={e=>setStruggles(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Key lessons this week</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="I work better in the morning, async is underrated, I need to say no more..." value={lessons} onChange={e=>setLessons(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Overall energy level: {energy}/10</label><input type="range" min={1} max={10} value={energy} onChange={e=>setEnergy(+e.target.value)} className="w-full mt-2" /></div>
                <div><label className="block text-sm font-medium mb-1">Next week\'s top priority</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Ship v2, close the deal, rest..." value={priorities} onChange={e=>setPriorities(e.target.value)} /></div>
              </div>
              <button onClick={generate} disabled={loading||(!wins&&!struggles)} className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50">{loading?'Reviewing...':'📅 Generate My Weekly Review'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-slate-50 border rounded-xl p-5"><p className="font-bold text-lg mb-2">Week Summary</p><p className="text-sm">{result.week_summary}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    {result.win_analysis && <div className="bg-green-50 rounded-xl p-4"><p className="font-semibold text-sm mb-1">🏆 Wins</p><p className="text-sm">{result.win_analysis}</p></div>}
                    {result.struggle_reframe && <div className="bg-orange-50 rounded-xl p-4"><p className="font-semibold text-sm mb-1">💪 Reframe</p><p className="text-sm">{result.struggle_reframe}</p></div>}
                  </div>
                  {result.biggest_lesson && <div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><p className="font-semibold text-sm mb-1">💡 Biggest Lesson</p><p className="text-sm">{result.biggest_lesson}</p></div>}
                  {result.pattern_noticed && <div className="bg-purple-50 rounded-lg p-3 text-sm"><strong>🔍 Pattern: </strong>{result.pattern_noticed}</div>}
                  {result.energy_insight && <div className="bg-yellow-50 rounded-lg p-3 text-sm"><strong>⚡ Energy insight: </strong>{result.energy_insight}</div>}
                  {result.next_week_theme && <div className="border-2 border-slate-300 rounded-xl p-4"><p className="font-bold text-lg">{result.next_week_theme}</p><p className="text-sm italic text-gray-600 mt-1">Next week\'s theme</p>{result.monday_intention && <p className="text-sm mt-2"><strong>Monday intention: </strong>{result.monday_intention}</p>}</div>}
                  <div className="grid grid-cols-2 gap-3">
                    {result.things_to_keep?.length>0 && <div className="bg-green-50 rounded-lg p-3"><p className="font-semibold text-xs text-green-700 mb-1">✅ KEEP DOING</p><ul className="space-y-1">{result.things_to_keep.map((t:string,i:number)=><li key={i} className="text-xs">• {t}</li>)}</ul></div>}
                    {result.things_to_drop?.length>0 && <div className="bg-red-50 rounded-lg p-3"><p className="font-semibold text-xs text-red-700 mb-1">🗑️ DROP</p><ul className="space-y-1">{result.things_to_drop.map((t:string,i:number)=><li key={i} className="text-xs text-red-600">• {t}</li>)}</ul></div>}
                  </div>
                  {result.gratitude_moment && <p className="text-center italic text-slate-600 py-3 text-sm">"{result.gratitude_moment}"</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_negotiationsim() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [scenario, setScenario] = React.useState('');
          const [role, setRole] = React.useState('');
          const [counterpart, setCounterpart] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const simulate = async () => {
            if (!scenario.trim() || !role.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/negotiation/simulate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ scenario, role, counterpart }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#a78bfa',marginBottom:'1rem'}}>🤝 Negotiation Simulator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Practice negotiation with AI — get scored and coached.</p>
              <textarea value={scenario} onChange={e=>setScenario(e.target.value)} placeholder="Describe the negotiation scenario (e.g. salary negotiation for $120k role)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'80px',marginBottom:'0.75rem'}} />
              <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Your role (e.g. Software Engineer candidate)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={counterpart} onChange={e=>setCounterpart(e.target.value)} placeholder="Counterpart (e.g. HR Manager)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}} />
              <button onClick={simulate} disabled={loading} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Simulating...' : 'Run Simulation'}
              </button>
              {result && !result.error && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.25rem',marginBottom:'1rem'}}>
                    <h3 style={{color:'#a78bfa',marginBottom:'0.75rem'}}>📊 Score: {result.score}/10</h3>
                    <h4 style={{color:'#94a3b8',marginBottom:'0.5rem'}}>Transcript</h4>
                    {(result.transcript||[]).map((t:any,i:number)=>(
                      <div key={i} style={{background:t.speaker==='You'?'#312e81':'#1e293b',borderRadius:'6px',padding:'0.5rem 0.75rem',marginBottom:'0.4rem'}}>
                        <strong style={{color:t.speaker==='You'?'#a78bfa':'#64748b'}}>{t.speaker}:</strong> <span style={{color:'#e2e8f0'}}>{t.line}</span>
                      </div>
                    ))}
                    <h4 style={{color:'#94a3b8',margin:'1rem 0 0.5rem'}}>💡 Tips</h4>
                    {(result.tips||[]).map((tip:string,i:number)=><p key={i} style={{color:'#e2e8f0',marginBottom:'0.25rem'}}>• {tip}</p>)}
                  </div>
                </div>
              )}
            </div>
          );
}

export function ForgeTab_challengebuilder() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
          const [hours, setHours] = React.useState('24');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const build = async () => {
            if (!goal.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/challenge/build`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ goal, hours: parseInt(hours) }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#f59e0b',marginBottom:'1rem'}}>⚡ 24-Hour Challenge Builder</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Hyper-focused sprint plan to achieve any goal fast.</p>
              <input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="What do you want to achieve?" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <select value={hours} onChange={e=>setHours(e.target.value)} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}>
                <option value="6">6-Hour Sprint</option>
                <option value="12">12-Hour Push</option>
                <option value="24">24-Hour Challenge</option>
                <option value="48">48-Hour Deep Work</option>
              </select>
              <button onClick={build} disabled={loading} style={{background:'#d97706',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Building plan...' : `Build ${hours}-Hour Challenge`}
              </button>
              {result && !result.error && (
                <div style={{marginTop:'1.5rem'}}>
                  {(result.schedule||[]).map((block:any,i:number)=>(
                    <div key={i} style={{background:'#1e293b',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem',borderLeft:'3px solid #f59e0b'}}>
                      <strong style={{color:'#f59e0b'}}>{block.block}</strong> <span style={{color:'#64748b',fontSize:'0.85rem'}}>{block.hours}</span>
                      <ul style={{marginTop:'0.5rem',paddingLeft:'1.25rem'}}>{(block.tasks||[]).map((t:string,j:number)=><li key={j} style={{color:'#e2e8f0',marginBottom:'0.2rem'}}>{t}</li>)}</ul>
                    </div>
                  ))}
                  {result.motivation && <div style={{background:'#292524',borderRadius:'8px',padding:'1rem',marginTop:'0.75rem',borderLeft:'3px solid #ef4444'}}><p style={{color:'#fca5a5',fontStyle:'italic'}}>"{result.motivation}"</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_therapyletter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [recipient, setRecipient] = React.useState('');
          const [situation, setSituation] = React.useState('');
          const [emotion, setEmotion] = React.useState('');
          const [intent, setIntent] = React.useState('processing only');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const write = async () => {
            if (!recipient.trim() || !situation.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/therapy-letter/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ recipient, situation, emotion, intent }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#ec4899',marginBottom:'1rem'}}>💌 Therapy Letter Writer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Write a healing letter for processing, closure, or sending.</p>
              <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Who is this letter to? (e.g. my ex, my dad, younger me)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={situation} onChange={e=>setSituation(e.target.value)} placeholder="What happened? What do you need to process?" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'80px',marginBottom:'0.75rem'}} />
              <input value={emotion} onChange={e=>setEmotion(e.target.value)} placeholder="Primary emotion (e.g. grief, anger, love, confusion)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <select value={intent} onChange={e=>setIntent(e.target.value)} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}>
                <option value="processing only">For processing only (not sending)</option>
                <option value="might send">Might send</option>
                <option value="will send">Will send</option>
                <option value="burn it">Burn it ritual</option>
              </select>
              <button onClick={write} disabled={loading} style={{background:'#be185d',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Writing...' : 'Write Letter'}
              </button>
              {result && result.letter && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.5rem',marginBottom:'1rem',whiteSpace:'pre-line',color:'#e2e8f0',lineHeight:'1.7'}}>{result.letter}</div>
                  {result.prompts && <div style={{background:'#1e1a1e',borderRadius:'8px',padding:'1rem'}}>
                    <h4 style={{color:'#ec4899',marginBottom:'0.5rem'}}>🪞 Reflection Prompts</h4>
                    {result.prompts.map((p:string,i:number)=><p key={i} style={{color:'#94a3b8',marginBottom:'0.4rem'}}>• {p}</p>)}
                  </div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_podcastpitch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [showName, setShowName] = React.useState('');
          const [topic, setTopic] = React.useState('');
          const [angle, setAngle] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const generate = async () => {
            if (!showName.trim() || !topic.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/podcast-pitch/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ showName, topic, angle }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#06b6d4',marginBottom:'1rem'}}>🎙️ Podcast Pitch Generator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Craft a pitch that gets you booked as a podcast guest.</p>
              <input value={showName} onChange={e=>setShowName(e.target.value)} placeholder="Podcast name (e.g. How I Built This)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Your topic/expertise (e.g. bootstrapping SaaS to $1M ARR)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={angle} onChange={e=>setAngle(e.target.value)} placeholder="Unique angle or hook (optional)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}} />
              <button onClick={generate} disabled={loading} style={{background:'#0891b2',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Crafting pitch...' : 'Generate Pitch'}
              </button>
              {result && result.full_pitch && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#0c4a6e',borderRadius:'8px',padding:'0.75rem 1rem',marginBottom:'0.75rem'}}>
                    <span style={{color:'#7dd3fc',fontWeight:600}}>Subject: </span><span style={{color:'#e2e8f0'}}>{result.subject}</span>
                  </div>
                  <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#e2e8f0',lineHeight:'1.7',marginBottom:'0.75rem'}}>{result.full_pitch}</div>
                  {result.episodes && <div style={{background:'#0c1628',borderRadius:'8px',padding:'1rem'}}>
                    <h4 style={{color:'#06b6d4',marginBottom:'0.5rem'}}>📋 Episode Ideas</h4>
                    {result.episodes.map((ep:any,i:number)=><div key={i} style={{marginBottom:'0.5rem'}}><strong style={{color:'#7dd3fc'}}>{ep.title}</strong><p style={{color:'#94a3b8',margin:'0.15rem 0 0'}}>{ep.description}</p></div>)}
                  </div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_grantproposal() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [orgName, setOrgName] = React.useState('');
          const [grantName, setGrantName] = React.useState('');
          const [amount, setAmount] = React.useState('');
          const [mission, setMission] = React.useState('');
          const [impact, setImpact] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [tab, setTab] = React.useState('full');
          const write = async () => {
            if (!orgName.trim() || !mission.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/grant/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ orgName, grantName, amount, mission, impact }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{color:'#84cc16',marginBottom:'1rem'}}>🏛️ Grant Proposal Writer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Full grant proposals with SMART goals and budget narrative.</p>
              <input value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="Organization name" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={grantName} onChange={e=>setGrantName(e.target.value)} placeholder="Grant/Funder name (e.g. Ford Foundation)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount requested (e.g. $50,000)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={mission} onChange={e=>setMission(e.target.value)} placeholder="Organization mission and project description" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'80px',marginBottom:'0.75rem'}} />
              <textarea value={impact} onChange={e=>setImpact(e.target.value)} placeholder="Expected impact and outcomes" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'60px',marginBottom:'1rem'}} />
              <button onClick={write} disabled={loading} style={{background:'#65a30d',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Writing proposal...' : 'Generate Grant Proposal'}
              </button>
              {result && result.full_proposal && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
                    {['full','summary','goals'].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?'#65a30d':'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'6px',padding:'0.4rem 0.9rem',cursor:'pointer',textTransform:'capitalize'}}>{t}</button>)}
                  </div>
                  {tab==='full' && <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#e2e8f0',lineHeight:'1.7'}}>{result.full_proposal}</div>}
                  {tab==='summary' && <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.5rem',color:'#e2e8f0',lineHeight:'1.7'}}><p>{result.executive_summary}</p></div>}
                  {tab==='goals' && <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.5rem'}}>{(result.goals||[]).map((g:string,i:number)=><p key={i} style={{color:'#e2e8f0',marginBottom:'0.4rem'}}>✅ {g}</p>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_burnletter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [target, setTarget] = React.useState('');
          const [grievance, setGrievance] = React.useState('');
          const [tone, setTone] = React.useState('raw and honest');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const write = async () => {
            if (!target.trim() || !grievance.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/burn-letter/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ target, grievance, tone }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#ef4444',marginBottom:'0.5rem'}}>🔥 Burn Letter Generator</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Write it out. Release it. Never send it. <span style={{color:'#ef4444'}}>This stays private.</span></p>
              <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Who is this to? (e.g. my boss, my ex, my younger self)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={grievance} onChange={e=>setGrievance(e.target.value)} placeholder="What did they do? What needs to be said?" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'100px',marginBottom:'0.75rem'}} />
              <select value={tone} onChange={e=>setTone(e.target.value)} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}>
                <option value="raw and honest">Raw and honest</option>
                <option value="furious">Furious — hold nothing back</option>
                <option value="grieving">Grieving and heartbroken</option>
                <option value="dignified">Dignified but cutting</option>
              </select>
              <button onClick={write} disabled={loading} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Writing...' : '🔥 Write the Burn Letter'}
              </button>
              {result && result.letter && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1c0a0a',border:'1px solid #7f1d1d',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#fca5a5',lineHeight:'1.8',marginBottom:'1rem'}}>{result.letter}</div>
                  {result.ritual && <div style={{background:'#1e293b',borderRadius:'8px',padding:'0.75rem',textAlign:'center'}}><em style={{color:'#94a3b8'}}>{result.ritual}</em></div>}
                  {result.emotions_surfaced && <p style={{color:'#64748b',marginTop:'0.75rem',fontSize:'0.9rem'}}>Emotions surfaced: {result.emotions_surfaced}</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_decisionoracle() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [question, setQuestion] = React.useState('');
          const [options, setOptions] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const decide = async () => {
            if (!question.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/oracle/decide`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ question, options, context }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#8b5cf6',marginBottom:'1rem'}}>🔮 Decision Oracle</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Multi-framework decision analysis. The oracle will speak.</p>
              <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What decision are you facing?" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={options} onChange={e=>setOptions(e.target.value)} placeholder="Your options (e.g. Stay at job vs. quit and start a company)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Context (optional — your situation, constraints, fears)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'60px',marginBottom:'1rem'}} />
              <button onClick={decide} disabled={loading} style={{background:'#7c3aed',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Consulting the oracle...' : '🔮 Consult the Oracle'}
              </button>
              {result && result.verdict && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{background:'#1e1333',border:'1px solid #7c3aed',borderRadius:'10px',padding:'1.25rem',marginBottom:'1rem',textAlign:'center'}}>
                    <p style={{color:'#c4b5fd',fontSize:'1.1rem',fontWeight:600}}>Verdict: {result.verdict}</p>
                    <p style={{color:'#7c3aed',marginTop:'0.4rem'}}>Confidence: {result.confidence}%</p>
                  </div>
                  {(result.frameworks||[]).map((f:any,i:number)=>(
                    <div key={i} style={{background:'#1e293b',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem',borderLeft:'3px solid #7c3aed'}}>
                      <strong style={{color:'#a78bfa'}}>{f.name}</strong>
                      <p style={{color:'#e2e8f0',marginTop:'0.4rem'}}>{f.analysis}</p>
                    </div>
                  ))}
                  {result.risk && <div style={{background:'#1c1917',borderRadius:'8px',padding:'0.75rem',marginTop:'0.5rem'}}><span style={{color:'#f97316'}}>⚠️ Risk: </span><span style={{color:'#e2e8f0'}}>{result.risk}</span></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_complimentengine() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [recipient, setRecipient] = React.useState('');
          const [context, setContext] = React.useState('');
          const [style, setStyle] = React.useState('warm and genuine');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const generate = async () => {
            if (!recipient.trim() || !context.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/compliment/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ recipient, context, style }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const impactColor = (lvl:string) => lvl==='high'?'#22c55e':lvl==='medium'?'#f59e0b':'#64748b';
          return (
            <div style={{padding:'2rem',maxWidth:'700px',margin:'0 auto'}}>
              <h2 style={{color:'#fbbf24',marginBottom:'1rem'}}>💛 Compliment Engine</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Specific, meaningful compliments that actually land.</p>
              <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Who are you complimenting? (e.g. my coworker Sarah)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Tell me about them — their strengths, what they\'ve done, who they are" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',minHeight:'80px',marginBottom:'0.75rem'}} />
              <select value={style} onChange={e=>setStyle(e.target.value)} style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}>
                <option value="warm and genuine">Warm and genuine</option>
                <option value="professional">Professional</option>
                <option value="playful">Playful and fun</option>
                <option value="deeply heartfelt">Deeply heartfelt</option>
              </select>
              <button onClick={generate} disabled={loading} style={{background:'#d97706',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Generating...' : '💛 Generate Compliments'}
              </button>
              {result && result.compliments && (
                <div style={{marginTop:'1.5rem'}}>
                  {result.compliments.map((c:any,i:number)=>(
                    <div key={i} style={{background:'#1e293b',borderRadius:'10px',padding:'1rem 1.25rem',marginBottom:'0.75rem',borderLeft:`3px solid ${impactColor(c.impact_level)}`}}>
                      <p style={{color:'#e2e8f0',lineHeight:'1.6',marginBottom:'0.4rem'}}>"{c.text}"</p>
                      <span style={{fontSize:'0.8rem',color:impactColor(c.impact_level),textTransform:'uppercase'}}>{c.category} · {c.impact_level} impact</span>
                    </div>
                  ))}
                  {result.delivery_tip && <p style={{color:'#64748b',marginTop:'0.5rem',fontSize:'0.9rem'}}>💡 {result.delivery_tip}</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_manifestowriter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
          const [values, setValues] = React.useState('');
          const [audience, setAudience] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [view, setView] = React.useState('full');
          const write = async () => {
            if (!topic.trim() || !values.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/manifesto/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ topic, values, audience }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{color:'#f59e0b',marginBottom:'1rem'}}>📜 Manifesto Writer</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Write a bold manifesto for your movement, brand, or life philosophy.</p>
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="What is your manifesto about? (e.g. slow living, ethical AI, DIY culture)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={values} onChange={e=>setValues(e.target.value)} placeholder="Core values/beliefs (e.g. autonomy, craft, community, honesty)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Your audience (e.g. creators, founders, parents, the world)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}} />
              <button onClick={write} disabled={loading} style={{background:'#b45309',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Writing manifesto...' : '📜 Write My Manifesto'}
              </button>
              {result && result.full_manifesto && (
                <div style={{marginTop:'1.5rem'}}>
                  {result.title && <h3 style={{color:'#f59e0b',textAlign:'center',marginBottom:'1rem',fontSize:'1.3rem'}}>{result.title}</h3>}
                  <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
                    {['full','principles'].map(v=><button key={v} onClick={()=>setView(v)} style={{background:view===v?'#b45309':'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'6px',padding:'0.4rem 0.9rem',cursor:'pointer',textTransform:'capitalize'}}>{v}</button>)}
                  </div>
                  {view==='full' && <div style={{background:'#1c1400',border:'1px solid #92400e',borderRadius:'10px',padding:'1.5rem',whiteSpace:'pre-line',color:'#fde68a',lineHeight:'1.8'}}>{result.full_manifesto}</div>}
                  {view==='principles' && <div>{(result.principles||[]).map((p:any,i:number)=>(
                    <div key={i} style={{background:'#1e293b',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem',borderLeft:'3px solid #f59e0b'}}>
                      <strong style={{color:'#f59e0b'}}>#{p.number} {p.statement}</strong>
                      <p style={{color:'#e2e8f0',marginTop:'0.4rem'}}>{p.explanation}</p>
                    </div>
                  ))}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_debateprep14() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
          const [position, setPosition] = React.useState('');
          const [opponent, setOpponent] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [tab, setTab] = React.useState('arguments');
          const prep = async () => {
            if (!topic.trim() || !position.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API_BASE}/api/debate/prep`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('forge_token')}`}, body: JSON.stringify({ topic, position, opponent }) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div style={{padding:'2rem',maxWidth:'750px',margin:'0 auto'}}>
              <h2 style={{color:'#ef4444',marginBottom:'1rem'}}>⚔️ Debate Prep AI</h2>
              <p style={{color:'#94a3b8',marginBottom:'1.5rem'}}>Arguments, rebuttals, opening/closing — be debate-ready in seconds.</p>
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Debate topic (e.g. AI will replace most jobs within 20 years)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={position} onChange={e=>setPosition(e.target.value)} placeholder="Your position (e.g. FOR / AGAINST / nuanced take)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'0.75rem'}} />
              <input value={opponent} onChange={e=>setOpponent(e.target.value)} placeholder="Expected opponent/audience (optional)" style={{width:'100%',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}} />
              <button onClick={prep} disabled={loading} style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:'8px',padding:'0.75rem 2rem',cursor:'pointer',width:'100%',fontWeight:600}}>
                {loading ? 'Preparing...' : '⚔️ Generate Debate Prep'}
              </button>
              {result && result.arguments && (
                <div style={{marginTop:'1.5rem'}}>
                  <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                    {['arguments','counters','opening'].map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?'#dc2626':'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:'6px',padding:'0.4rem 0.9rem',cursor:'pointer',textTransform:'capitalize'}}>{t}</button>)}
                  </div>
                  {tab==='arguments' && <div>{result.arguments.map((a:any,i:number)=>(
                    <div key={i} style={{background:'#1e293b',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem',borderLeft:'3px solid #22c55e'}}>
                      <strong style={{color:'#86efac'}}>Arg {i+1}: {a.point}</strong>
                      <p style={{color:'#94a3b8',marginTop:'0.3rem',fontSize:'0.9rem'}}>{a.evidence}</p>
                    </div>
                  ))}</div>}
                  {tab==='counters' && <div>{result.counters.map((c:any,i:number)=>(
                    <div key={i} style={{background:'#1e293b',borderRadius:'8px',padding:'1rem',marginBottom:'0.75rem'}}>
                      <p style={{color:'#f87171'}}>❌ Attack: {c.attack}</p>
                      <p style={{color:'#86efac',marginTop:'0.4rem'}}>✅ Rebuttal: {c.rebuttal}</p>
                    </div>
                  ))}</div>}
                  {tab==='opening' && <div>
                    <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.25rem',marginBottom:'0.75rem'}}><h4 style={{color:'#ef4444',marginBottom:'0.5rem'}}>Opening Statement</h4><p style={{color:'#e2e8f0',lineHeight:'1.7',fontStyle:'italic'}}>"{result.opening}"</p></div>
                    <div style={{background:'#1e293b',borderRadius:'10px',padding:'1.25rem'}}><h4 style={{color:'#f97316',marginBottom:'0.5rem'}}>Closing Line</h4><p style={{color:'#e2e8f0',lineHeight:'1.7',fontStyle:'italic'}}>"{result.closing}"</p></div>
                  </div>}
                </div>
              )}
            </div>
          );
}
