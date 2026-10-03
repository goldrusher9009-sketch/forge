'use client';
import React from 'react';
import { API, BACKEND, API_BASE, getToken, saveToolHistory, INTEGRATION_CATALOG, INTEGRATION_CATS, CHAINABLE_TOOLS } from './shared';
import { utcStamp } from '../../../lib/platform-time';

export function ForgeTab_apologyletter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [relationship, setRelationship] = React.useState('friend');
          const [tone, setTone] = React.useState('sincere');
          const [whatDid, setWhatDid] = React.useState('');
          const [willDo, setWillDo] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const write = async () => {
            if (!situation) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/apology/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({situation,relationship,tone,what_you_did:whatDid,what_you_will_do:willDo}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💌 Apology Letter Writer</h2>
              <p className="text-sm text-gray-500 mb-6">Heartfelt apologies that actually repair relationships</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What happened? *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="I forgot our anniversary / I said something hurtful at dinner / I let my team down..." value={situation} onChange={e=>setSituation(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Relationship</label><select className="w-full border rounded px-3 py-2 text-sm" value={relationship} onChange={e=>setRelationship(e.target.value)}><option value="partner">Partner/Spouse</option><option value="friend">Friend</option><option value="family">Family</option><option value="colleague">Colleague</option><option value="boss">Boss</option><option value="client">Client</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Tone</label><select className="w-full border rounded px-3 py-2 text-sm" value={tone} onChange={e=>setTone(e.target.value)}><option value="sincere">Sincere & Heartfelt</option><option value="professional">Professional</option><option value="brief">Brief & Direct</option><option value="detailed">Detailed & Thorough</option></select></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Specifically what did you do? (optional)</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="More detail helps personalize the letter..." value={whatDid} onChange={e=>setWhatDid(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What will you do differently?</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="I\'ll set calendar reminders / I\'ll be more mindful..." value={willDo} onChange={e=>setWillDo(e.target.value)} /></div>
              <button onClick={write} disabled={loading||!situation} className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 disabled:opacity-50">{loading ? 'Writing...' : '💌 Write Apology'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 relative"><button onClick={()=>{navigator.clipboard.writeText(result.letter);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.letter}</pre></div>
                  {result.delivery_tip && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>📬 How to deliver: </strong>{result.delivery_tip}</div>}
                  {result.follow_up_action && <div className="bg-green-50 rounded-lg p-3 text-sm"><strong>✅ Next step: </strong>{result.follow_up_action}</div>}
                  {result.what_not_to_say?.length>0 && <div className="bg-red-50 rounded-lg p-3"><p className="font-semibold text-sm mb-1 text-red-700">❌ Avoid saying</p><ul className="space-y-1">{result.what_not_to_say.map((s:string,i:number)=><li key={i} className="text-sm text-red-700">• {s}</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_leasereview() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [leaseText, setLeaseText] = React.useState('');
          const [docType, setDocType] = React.useState('lease');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [tab, setTab] = React.useState<'overview'|'redflags'|'terms'>('overview');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const review = async () => {
            if (!leaseText.trim()) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/lease/review`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({lease_text:leaseText,document_type:docType}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const sevColor = (s:string) => ({'high':'bg-red-100 text-red-700 border-red-200','medium':'bg-yellow-100 text-yellow-700 border-yellow-200','low':'bg-green-100 text-green-700 border-green-200'})[s]||'bg-gray-100 text-gray-600';
          const verdictColor = (v:string) => ({'sign':'text-green-600','negotiate':'text-yellow-600','avoid':'text-red-600'})[v]||'text-gray-600';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🏠 Lease / Contract Reviewer</h2>
              <p className="text-sm text-gray-500 mb-2">Plain-English breakdown with red flags highlighted</p>
              <p className="text-xs text-gray-400 mb-6">⚠️ Not legal advice — always consult a lawyer for important decisions</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Document Type</label><div className="flex gap-2">{['lease','contract','nda','employment'].map(t=><button key={t} onClick={()=>setDocType(t)} className={`px-3 py-1 rounded-full text-sm capitalize ${docType===t?'bg-teal-600 text-white':'bg-gray-100'}`}>{t}</button>)}</div></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Paste document text *</label><textarea className="w-full border rounded px-3 py-2 text-sm font-mono text-xs" rows={10} placeholder="Paste your lease or contract text here..." value={leaseText} onChange={e=>setLeaseText(e.target.value)} /></div>
              <button onClick={review} disabled={loading||!leaseText.trim()} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50">{loading ? 'Analyzing...' : '🔍 Review Document'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  {result.overall_verdict && <div className={`rounded-xl p-4 mb-4 border text-center ${sevColor(result.overall_verdict==='sign'?'low':result.overall_verdict==='negotiate'?'medium':'high')}`}><p className="text-xs font-semibold mb-1">VERDICT</p><p className={`text-2xl font-black uppercase ${verdictColor(result.overall_verdict)}`}>{result.overall_verdict}</p><p className="text-sm mt-1">{result.verdict_reason}</p></div>}
                  <div className="flex gap-3 mb-4"><button onClick={()=>setTab('overview')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab==='overview'?'bg-teal-600 text-white':'bg-gray-100'}`}>📋 Overview</button><button onClick={()=>setTab('redflags')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab==='redflags'?'bg-teal-600 text-white':'bg-gray-100'}`}>🚩 Red Flags ({result.red_flags?.length||0})</button><button onClick={()=>setTab('terms')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab==='terms'?'bg-teal-600 text-white':'bg-gray-100'}`}>📄 Key Terms</button></div>
                  {tab==='overview' && <div className="space-y-3"><div className="bg-gray-50 rounded-xl p-4 text-sm">{result.summary}</div>{result.questions_to_ask?.length>0 && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">❓ Questions to Ask</p><ul className="space-y-1">{result.questions_to_ask.map((q:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-blue-600">→</span>{q}</li>)}</ul></div>}{result.tenant_rights?.length>0 && <div className="bg-green-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">✅ Your Rights</p><ul className="space-y-1">{result.tenant_rights.map((r:string,i:number)=><li key={i} className="text-sm flex gap-2"><span>•</span>{r}</li>)}</ul></div>}</div>}
                  {tab==='redflags' && <div className="space-y-3">{result.red_flags?.length===0?<p className="text-sm text-green-600">✅ No major red flags found!</p>:result.red_flags?.map((f:any,i:number)=><div key={i} className={`border rounded-xl p-4 ${sevColor(f.severity)}`}><div className="flex justify-between mb-1"><p className="font-semibold text-sm">{f.issue}</p><span className={`px-2 py-0.5 rounded-full text-xs border ${sevColor(f.severity)}`}>{f.severity}</span></div><p className="text-sm mb-2">{f.what_it_means}</p>{f.clause && <p className="text-xs font-mono bg-white bg-opacity-50 p-2 rounded italic">{f.clause}</p>}{f.negotiable && <p className="text-xs font-medium mt-2">💡 This clause is negotiable</p>}</div>)}</div>}
                  {tab==='terms' && result.key_terms && <div className="divide-y border rounded-xl overflow-hidden">{Object.entries(result.key_terms).filter(([,v])=>v).map(([k,v]:any)=><div key={k} className="flex gap-3 px-4 py-3"><p className="font-semibold text-sm capitalize min-w-40">{k.replace('_',' ')}</p><p className="text-sm text-gray-700">{v}</p></div>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_booksummarizer() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [title, setTitle] = React.useState('');
          const [author, setAuthor] = React.useState('');
          const [depth, setDepth] = React.useState('standard');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [activeIdea, setActiveIdea] = React.useState(0);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const summarize = async () => {
            if (!title) return;
            setLoading(true); setResult(null); setActiveIdea(0);
            try {
              const r = await fetch(`${API}/api/book/summarize`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({title,author,depth}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">📚 Book Summarizer</h2>
              <p className="text-sm text-gray-500 mb-6">Key ideas, actionable takeaways & who should read it</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Book Title *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Atomic Habits" value={title} onChange={e=>setTitle(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Author</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="James Clear" value={author} onChange={e=>setAuthor(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Depth</label><div className="flex gap-2">{['quick','standard','deep'].map(d=><button key={d} onClick={()=>setDepth(d)} className={`px-3 py-1 rounded-full text-sm capitalize ${depth===d?'bg-violet-600 text-white':'bg-gray-100'}`}>{d}</button>)}</div></div>
              <button onClick={summarize} disabled={loading||!title} className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50">{loading ? 'Reading...' : '📚 Summarize Book'}</button>
              {result && result.summary && (
                <div className="mt-6 space-y-4">
                  <div className="border-b pb-4">
                    <p className="text-lg font-bold">{title}</p>
                    {result.summary.best_quote && <p className="text-sm italic text-gray-500 mt-1">"{result.summary.best_quote}"</p>}
                  </div>
                  <div className="bg-violet-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">In One Sentence</p><p className="text-sm font-medium">{result.summary.one_sentence}</p></div>
                  <div><p className="font-semibold mb-1 text-sm">Overview</p><p className="text-sm text-gray-700 leading-relaxed">{result.summary.overview}</p></div>
                  {result.summary.key_ideas?.length>0 && (
                    <div>
                      <p className="font-semibold mb-2 text-sm">💡 Key Ideas</p>
                      <div className="flex gap-2 mb-3 flex-wrap">{result.summary.key_ideas.map((_:any,i:number)=><button key={i} onClick={()=>setActiveIdea(i)} className={`px-3 py-1 rounded-lg text-sm ${activeIdea===i?'bg-violet-600 text-white':'bg-gray-100'}`}>Idea {i+1}</button>)}</div>
                      <div className="border rounded-xl p-4"><p className="font-semibold mb-2">{result.summary.key_ideas[activeIdea]?.idea}</p><p className="text-sm text-gray-700 mb-3">{result.summary.key_ideas[activeIdea]?.explanation}</p>{result.summary.key_ideas[activeIdea]?.quote && <p className="text-sm italic text-gray-500 border-l-4 border-violet-300 pl-3">"{result.summary.key_ideas[activeIdea].quote}"</p>}</div>
                    </div>
                  )}
                  {result.summary.actionable_takeaways?.length>0 && <div className="bg-green-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">✅ Actionable Takeaways</p><ul className="space-y-2">{result.summary.actionable_takeaways.map((t:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-green-600 font-bold">{i+1}.</span>{t}</li>)}</ul></div>}
                  <div className="grid grid-cols-2 gap-3">
                    {result.summary.who_should_read && <div className="bg-blue-50 rounded-lg p-3"><p className="font-semibold text-xs text-blue-700 mb-1">👍 READ IF</p><p className="text-sm">{result.summary.who_should_read}</p></div>}
                    {result.summary.who_should_skip && <div className="bg-gray-50 rounded-lg p-3"><p className="font-semibold text-xs text-gray-500 mb-1">⏭ SKIP IF</p><p className="text-sm">{result.summary.who_should_skip}</p></div>}
                  </div>
                </div>
              )}
            </div>
          );
}

export function ForgeTab_quizgen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
          const [difficulty, setDifficulty] = React.useState('medium');
          const [numQ, setNumQ] = React.useState(10);
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [currentQ, setCurrentQ] = React.useState(0);
          const [selected, setSelected] = React.useState<string|null>(null);
          const [revealed, setRevealed] = React.useState(false);
          const [score, setScore] = React.useState(0);
          const [finished, setFinished] = React.useState(false);
          const [answers, setAnswers] = React.useState<{q:number,correct:boolean}[]>([]);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!topic) return;
            setLoading(true); setResult(null); setCurrentQ(0); setSelected(null); setRevealed(false); setScore(0); setFinished(false); setAnswers([]);
            try {
              const r = await fetch(`${API}/api/quiz/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({topic,difficulty,num_questions:numQ}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const answer = (opt:string) => {
            if (revealed) return;
            setSelected(opt);
            setRevealed(true);
            const correct = opt.startsWith(result.questions[currentQ].correct);
            if (correct) setScore(s=>s+1);
            setAnswers(a=>[...a,{q:currentQ,correct}]);
          };
          const next = () => {
            if (currentQ < result.questions.length-1) { setCurrentQ(q=>q+1); setSelected(null); setRevealed(false); }
            else setFinished(true);
          };
          const optColor = (opt:string) => {
            if (!revealed) return 'hover:bg-gray-50';
            const isCorrect = opt.startsWith(result?.questions[currentQ]?.correct);
            const isSelected = opt === selected;
            if (isCorrect) return 'bg-green-100 border-green-400 text-green-800';
            if (isSelected && !isCorrect) return 'bg-red-100 border-red-400 text-red-800';
            return 'opacity-50';
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🧠 Quiz Generator</h2>
              <p className="text-sm text-gray-500 mb-6">Interactive quizzes on any topic with instant feedback</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Topic *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="World War II, React hooks, The French Revolution, Nutrition..." value={topic} onChange={e=>setTopic(e.target.value)} /></div>
              <div className="flex gap-6 mb-4">
                <div><label className="block text-sm font-medium mb-1">Difficulty</label><div className="flex gap-2">{['easy','medium','hard'].map(d=><button key={d} onClick={()=>setDifficulty(d)} className={`px-3 py-1 rounded-full text-sm capitalize ${difficulty===d?'bg-yellow-500 text-white':'bg-gray-100'}`}>{d}</button>)}</div></div>
                <div><label className="block text-sm font-medium mb-1">Questions: {numQ}</label><input type="range" min={5} max={20} step={5} value={numQ} onChange={e=>setNumQ(+e.target.value)} className="w-32 mt-1" /></div>
              </div>
              <button onClick={generate} disabled={loading||!topic} className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50">{loading ? 'Generating quiz...' : '🧠 Start Quiz'}</button>
              {result && !finished && result.questions?.length>0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4"><p className="text-sm text-gray-500">Question {currentQ+1} of {result.questions.length}</p><div className="flex gap-1">{result.questions.map((_:any,i:number)=><div key={i} className={`w-2 h-2 rounded-full ${i<currentQ?answers[i]?.correct?'bg-green-500':'bg-red-500':i===currentQ?'bg-yellow-500':'bg-gray-200'}`} />)}</div></div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4"><p className="font-medium">{result.questions[currentQ]?.question}</p></div>
                  <div className="space-y-2 mb-4">{result.questions[currentQ]?.options?.map((opt:string)=><button key={opt} onClick={()=>answer(opt)} className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors ${optColor(opt)}`}>{opt}</button>)}</div>
                  {revealed && (
                    <div className="space-y-3">
                      <div className={`rounded-lg p-3 text-sm ${selected===result.questions[currentQ].correct+')' || (selected||'').startsWith(result.questions[currentQ].correct)?'bg-green-50 text-green-800':'bg-red-50 text-red-800'}`}>{result.questions[currentQ].explanation}</div>
                      {result.questions[currentQ].fun_fact && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>💡 Fun fact: </strong>{result.questions[currentQ].fun_fact}</div>}
                      <button onClick={next} className="bg-yellow-500 text-white px-5 py-2 rounded-lg hover:bg-yellow-600">{currentQ<result.questions.length-1?'Next Question →':'Finish Quiz'}</button>
                    </div>
                  )}
                </div>
              )}
              {finished && (
                <div className="mt-6 text-center space-y-4">
                  <div className="bg-yellow-50 rounded-2xl p-8"><p className="text-5xl font-black mb-2">{score}/{result?.questions?.length}</p><p className="text-lg font-medium">{score/result?.questions?.length>=0.8?'🏆 Excellent!':score/result?.questions?.length>=0.6?'👍 Good job!':'📚 Keep studying!'}</p></div>
                  <button onClick={()=>{setCurrentQ(0);setSelected(null);setRevealed(false);setScore(0);setFinished(false);setAnswers([]);}} className="bg-yellow-500 text-white px-5 py-2 rounded-lg hover:bg-yellow-600">Retake Quiz</button>
                  <button onClick={generate} className="ml-3 bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200">New Quiz</button>
                </div>
              )}
            </div>
          );
}

export function ForgeTab_salaryneg() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [role, setRole] = React.useState('');
          const [offer, setOffer] = React.useState('');
          const [market, setMarket] = React.useState('');
          const [yoe, setYoe] = React.useState(0);
          const [competing, setCompeting] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [tab, setTab] = React.useState<'script'|'email'|'strategy'>('script');
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const negotiate = async () => {
            if (!role || !offer) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/salary/negotiate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({role,current_offer:offer,market_rate:market,experience_years:yoe,competing_offers:competing,context}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💵 Salary Negotiator</h2>
              <p className="text-sm text-gray-500 mb-6">Word-for-word scripts to get paid what you\'re worth</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Role / Position *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Senior Software Engineer" value={role} onChange={e=>setRole(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Current Offer *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="$120,000" value={offer} onChange={e=>setOffer(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Market Rate (if known)</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="$140,000" value={market} onChange={e=>setMarket(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Years of Experience: {yoe}</label><input type="range" min={0} max={30} value={yoe} onChange={e=>setYoe(+e.target.value)} className="w-full mt-2" /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Competing Offers / Leverage</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="I have an offer from Stripe for $135k..." value={competing} onChange={e=>setCompeting(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Context</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Startup equity, remote, FAANG offer on the table..." value={context} onChange={e=>setContext(e.target.value)} /></div>
              <button onClick={negotiate} disabled={loading||!role||!offer} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">{loading ? 'Building script...' : '💵 Get Negotiation Script'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Counter Offer</p><p className="text-2xl font-black text-emerald-700">{result.counter_offer}</p></div>
                    {result.total_comp_increase && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center"><p className="text-xs text-gray-500">Potential Increase</p><p className="text-2xl font-black text-blue-700">{result.total_comp_increase}</p></div>}
                  </div>
                  <div className="flex gap-3 mb-4">{(['script','email','strategy'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${tab===t?'bg-emerald-600 text-white':'bg-gray-100'}`}>{t}</button>)}</div>
                  {tab==='script' && (
                    <div className="space-y-3">
                      {result.opening_line && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="font-semibold text-sm mb-1">👋 Opening Line</p><p className="text-sm italic">"{result.opening_line}"</p></div>}
                      <div className="bg-gray-50 rounded-xl p-5 border"><pre className="whitespace-pre-wrap text-sm">{result.negotiation_script}</pre></div>
                      {result.timing_tip && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>⏰ Timing: </strong>{result.timing_tip}</div>}
                    </div>
                  )}
                  {tab==='email' && (
                    <div>
                      <div className="bg-gray-50 rounded-xl p-5 border relative"><button onClick={()=>{navigator.clipboard.writeText(result.email_template);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm">{result.email_template}</pre></div>
                    </div>
                  )}
                  {tab==='strategy' && (
                    <div className="space-y-4">
                      {result.key_arguments?.length>0 && <div><p className="font-semibold mb-2 text-sm">💪 Your Arguments</p><ul className="space-y-2">{result.key_arguments.map((a:string,i:number)=><li key={i} className="flex gap-2 text-sm"><span className="text-emerald-600 font-bold">{i+1}.</span>{a}</li>)}</ul></div>}
                      {result.benefits_to_negotiate?.length>0 && <div><p className="font-semibold mb-2 text-sm">🎁 Also Negotiate</p><div className="flex flex-wrap gap-2">{result.benefits_to_negotiate.map((b:string,i:number)=><span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{b}</span>)}</div></div>}
                      {result.what_if_they_say_no && <div className="bg-orange-50 rounded-lg p-3 text-sm"><strong>🔄 If they say no: </strong>{result.what_if_they_say_no}</div>}
                      {result.expected_outcome && <div className="bg-gray-50 rounded-lg p-3 text-sm"><strong>📊 Expected outcome: </strong>{result.expected_outcome}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_breakupletter() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [reason, setReason] = React.useState('');
          const [duration, setDuration] = React.useState('');
          const [tone, setTone] = React.useState('kind');
          const [medium, setMedium] = React.useState('text');
          const [theirName, setTheirName] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const write = async () => {
            if (!reason) return;
            setLoading(true);
            try {
              const r = await fetch(`${API}/api/breakup/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({reason,relationship_duration:duration,tone,medium,their_name:theirName}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">💔 Breakup Letter Writer</h2>
              <p className="text-sm text-gray-500 mb-6">Kind, honest messages that provide closure</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Their Name</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Alex" value={theirName} onChange={e=>setTheirName(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Relationship Duration</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="6 months, 3 years..." value={duration} onChange={e=>setDuration(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Main reason *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="We want different things / I don\'t feel the same way / long distance isn\'t working..." value={reason} onChange={e=>setReason(e.target.value)} /></div>
              <div className="flex gap-6 mb-4">
                <div><label className="block text-sm font-medium mb-1">Tone</label><div className="flex gap-2 flex-wrap">{['kind','direct','firm','compassionate'].map(t=><button key={t} onClick={()=>setTone(t)} className={`px-3 py-1 rounded-full text-sm capitalize ${tone===t?'bg-pink-500 text-white':'bg-gray-100'}`}>{t}</button>)}</div></div>
                <div><label className="block text-sm font-medium mb-1">Medium</label><div className="flex gap-2">{['text','letter','email','in-person'].map(m=><button key={m} onClick={()=>setMedium(m)} className={`px-3 py-1 rounded-full text-sm capitalize ${medium===m?'bg-pink-500 text-white':'bg-gray-100'}`}>{m}</button>)}</div></div>
              </div>
              <button onClick={write} disabled={loading||!reason} className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50">{loading ? 'Writing...' : '💔 Write Message'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 relative"><button onClick={()=>{navigator.clipboard.writeText(result.letter);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.letter}</pre></div>
                  {result.timing_advice && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>📅 Timing: </strong>{result.timing_advice}</div>}
                  {result.self_care_reminder && <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm italic text-purple-700">💜 {result.self_care_reminder}</div>}
                  <div className="grid grid-cols-2 gap-3">
                    {result.dos?.length>0 && <div className="bg-green-50 rounded-lg p-3"><p className="font-semibold text-xs text-green-700 mb-1">✅ DO</p><ul className="space-y-1">{result.dos.map((d:string,i:number)=><li key={i} className="text-xs">• {d}</li>)}</ul></div>}
                    {result.donts?.length>0 && <div className="bg-red-50 rounded-lg p-3"><p className="font-semibold text-xs text-red-700 mb-1">❌ DON'T</p><ul className="space-y-1">{result.donts.map((d:string,i:number)=><li key={i} className="text-xs text-red-700">• {d}</li>)}</ul></div>}
                  </div>
                </div>
              )}
            </div>
          );
}

export function ForgeTab_bizplan() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [idea, setIdea] = React.useState('');
          const [targetMarket, setTargetMarket] = React.useState('');
          const [problem, setProblem] = React.useState('');
          const [budget, setBudget] = React.useState('bootstrapped');
          const [timeline, setTimeline] = React.useState('12 months');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [section, setSection] = React.useState<'overview'|'milestones'|'gtm'>('overview');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!idea) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/business-plan/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({idea,target_market:targetMarket,problem,budget,timeline}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const scoreColor = (s:number) => s>=75?'text-green-600':s>=50?'text-yellow-600':'text-red-600';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">📊 One-Page Business Plan</h2>
              <p className="text-sm text-gray-500 mb-6">From idea to actionable plan in seconds</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Your Business Idea *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="An app that matches dog owners with local dog walkers using AI scheduling..." value={idea} onChange={e=>setIdea(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Target Market</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Urban pet owners aged 25-45" value={targetMarket} onChange={e=>setTargetMarket(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Problem it solves</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Finding reliable dog walkers is painful" value={problem} onChange={e=>setProblem(e.target.value)} /></div>
              </div>
              <div className="flex gap-6 mb-4">
                <div><label className="block text-sm font-medium mb-1">Budget</label><div className="flex gap-2">{['bootstrapped','seed','funded'].map(b=><button key={b} onClick={()=>setBudget(b)} className={`px-3 py-1 rounded-full text-sm capitalize ${budget===b?'bg-blue-600 text-white':'bg-gray-100'}`}>{b}</button>)}</div></div>
                <div><label className="block text-sm font-medium mb-1">Timeline</label><select className="border rounded px-3 py-2 text-sm" value={timeline} onChange={e=>setTimeline(e.target.value)}><option>3 months</option><option>6 months</option><option>12 months</option><option>24 months</option></select></div>
              </div>
              <button onClick={generate} disabled={loading||!idea} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Building plan...' : '📊 Generate Business Plan'}</button>
              {result && result.plan && (
                <div className="mt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center min-w-20"><p className="text-xs text-gray-500">Viability</p><p className={`text-3xl font-black ${scoreColor(result.viability_score)}`}>{result.viability_score}/100</p></div>
                    <div><p className="font-bold text-lg">{result.plan.tagline}</p><p className="text-sm text-gray-600 mt-1">{result.viability_reason}</p>{result.biggest_challenge && <p className="text-xs text-orange-600 mt-1">⚠️ {result.biggest_challenge}</p>}</div>
                  </div>
                  <div className="flex gap-3 mb-4">{(['overview','milestones','gtm'] as const).map(s=><button key={s} onClick={()=>setSection(s)} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${section===s?'bg-blue-600 text-white':'bg-gray-100'}`}>{s==='gtm'?'Go-to-Market':s.charAt(0).toUpperCase()+s.slice(1)}</button>)}</div>
                  {section==='overview' && (
                    <div className="space-y-3">
                      {[['Problem',result.plan.problem],['Solution',result.plan.solution],['Target Customer',result.plan.target_customer],['Revenue Model',result.plan.revenue_model],['Competitive Advantage',result.plan.competitive_advantage]].map(([k,v]:any)=>v&&<div key={k} className="flex gap-3 border-b pb-3"><p className="font-semibold text-sm min-w-36">{k}</p><p className="text-sm text-gray-700">{v}</p></div>)}
                      {result.plan.pricing && <div className="bg-green-50 rounded-lg p-3"><p className="font-semibold text-sm mb-2">💰 Pricing</p><div className="flex gap-4">{result.plan.pricing.tier1&&<div className="text-sm"><p className="font-medium">{result.plan.pricing.tier1}</p><p className="text-green-700 font-bold">{result.plan.pricing.price1}</p></div>}{result.plan.pricing.tier2&&<div className="text-sm"><p className="font-medium">{result.plan.pricing.tier2}</p><p className="text-green-700 font-bold">{result.plan.pricing.price2}</p></div>}</div></div>}
                      {result.plan.key_metrics?.length>0 && <div><p className="font-semibold text-sm mb-2">📈 Key Metrics to Track</p><div className="flex flex-wrap gap-2">{result.plan.key_metrics.map((m:string,i:number)=><span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{m}</span>)}</div></div>}
                    </div>
                  )}
                  {section==='milestones' && (
                    <div className="space-y-3">
                      {result.plan.milestones?.map((m:any,i:number)=><div key={i} className="flex gap-4 border-b pb-3"><div className="bg-blue-600 text-white rounded-lg px-3 py-2 text-center min-w-16"><p className="text-xs">Month</p><p className="font-bold">{m.month}</p></div><p className="text-sm self-center">{m.goal}</p></div>)}
                      {result.plan.first_30_days?.length>0 && <div className="bg-yellow-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">🚀 First 30 Days</p><ol className="space-y-2">{result.plan.first_30_days.map((a:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="font-bold text-yellow-600">{i+1}.</span>{a}</li>)}</ol></div>}
                    </div>
                  )}
                  {section==='gtm' && (
                    <div className="space-y-4">
                      {result.plan.go_to_market?.length>0 && <div><p className="font-semibold mb-2 text-sm">📢 Go-to-Market Channels</p><ol className="space-y-2">{result.plan.go_to_market.map((c:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-blue-600 font-bold">{i+1}.</span>{c}</li>)}</ol></div>}
                      {result.plan.risks?.length>0 && <div><p className="font-semibold mb-2 text-sm">⚠️ Risks & Mitigations</p><ul className="space-y-2">{result.plan.risks.map((r:string,i:number)=><li key={i} className="text-sm flex gap-2 text-orange-700"><span>•</span>{r}</li>)}</ul></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_viralhooks() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [topic, setTopic] = React.useState('');
          const [platform, setPlatform] = React.useState('twitter');
          const [style, setStyle] = React.useState('curiosity');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState<number|null>(null);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!topic) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/hooks/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({topic,platform,style}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const engColor = (e:string) => ({'low':'bg-gray-100 text-gray-600','medium':'bg-blue-100 text-blue-700','high':'bg-yellow-100 text-yellow-700','viral':'bg-red-100 text-red-700'})[e]||'bg-gray-100';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🔥 Viral Hook Generator</h2>
              <p className="text-sm text-gray-500 mb-6">10 scroll-stopping hooks for any topic or platform</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Topic / Content *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="How I grew my newsletter to 50k subscribers..." value={topic} onChange={e=>setTopic(e.target.value)} /></div>
              <div className="flex gap-6 mb-4">
                <div><label className="block text-sm font-medium mb-1">Platform</label><div className="flex gap-2 flex-wrap">{['twitter','linkedin','instagram','tiktok','youtube','newsletter'].map(p=><button key={p} onClick={()=>setPlatform(p)} className={`px-3 py-1 rounded-full text-sm capitalize ${platform===p?'bg-orange-500 text-white':'bg-gray-100'}`}>{p}</button>)}</div></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Primary Style</label><div className="flex gap-2 flex-wrap">{['curiosity','story','stat','contrarian','list','how-to','shock'].map(s=><button key={s} onClick={()=>setStyle(s)} className={`px-3 py-1 rounded-full text-sm capitalize ${style===s?'bg-orange-500 text-white':'bg-gray-100'}`}>{s}</button>)}</div></div>
              <button onClick={generate} disabled={loading||!topic} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50">{loading ? 'Generating...' : '🔥 Generate 10 Hooks'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-3">
                  {result.hooks?.map((h:any,i:number)=>(
                    <div key={i} className="border rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2 items-center"><span className="text-xs font-bold text-gray-400">#{i+1}</span><span className={`px-2 py-0.5 rounded-full text-xs capitalize ${engColor(h.predicted_engagement)}`}>{h.predicted_engagement}</span><span className="text-xs text-gray-400 capitalize">{h.style}</span></div>
                        <button onClick={()=>{navigator.clipboard.writeText(h.hook);setCopied(i);setTimeout(()=>setCopied(null),2000);}} className="text-xs bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200">{copied===i?'✓':h.emoji_suggestion||'📋'} {copied===i?'Copied!':'Copy'}</button>
                      </div>
                      <p className="font-medium text-sm mb-2">{h.hook}</p>
                      <p className="text-xs text-gray-500">{h.why_it_works}</p>
                    </div>
                  ))}
                  {result.content_angles?.length>0 && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">💡 Content Angles</p><ul className="space-y-1">{result.content_angles.map((a:string,i:number)=><li key={i} className="text-sm flex gap-2"><span>→</span>{a}</li>)}</ul></div>}
                  {result.hashtag_suggestions?.length>0 && <div className="flex flex-wrap gap-2">{result.hashtag_suggestions.map((h:string,i:number)=><span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">{h}</span>)}</div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_dreaminterp() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [dream, setDream] = React.useState('');
          const [mood, setMood] = React.useState('');
          const [recurring, setRecurring] = React.useState(false);
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [view, setView] = React.useState<'symbols'|'analysis'|'journal'>('analysis');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const interpret = async () => {
            if (!dream.trim()) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/dream/interpret`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({dream,mood_before_sleep:mood,recurring}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🌙 Dream Interpreter</h2>
              <p className="text-sm text-gray-500 mb-6">Jungian, Freudian & modern psychological analysis of your dreams</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Describe your dream *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={6} placeholder="I was in my childhood home but it had different rooms. There was a door I was afraid to open. Outside the window it was always sunset..." value={dream} onChange={e=>setDream(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Mood before sleep</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="anxious, happy, stressed..." value={mood} onChange={e=>setMood(e.target.value)} /></div>
                <div className="flex items-end pb-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)} className="w-4 h-4" /><span className="text-sm">This dream repeats</span></label></div>
              </div>
              <button onClick={interpret} disabled={loading||!dream.trim()} className="bg-indigo-900 text-white px-6 py-2 rounded-lg hover:bg-indigo-950 disabled:opacity-50">{loading ? 'Interpreting...' : '🌙 Interpret Dream'}</button>
              {result && result.interpretation && (
                <div className="mt-6">
                  <div className="bg-indigo-950 text-white rounded-xl p-5 mb-4">
                    <p className="text-xs text-indigo-300 mb-1 font-semibold">SUMMARY</p>
                    <p className="text-sm leading-relaxed">{result.interpretation.summary}</p>
                    {result.interpretation.message_to_self && <div className="mt-3 border-t border-indigo-800 pt-3"><p className="text-xs text-indigo-300 mb-1">MESSAGE FROM YOUR DREAM</p><p className="text-sm italic text-indigo-100">"{result.interpretation.message_to_self}"</p></div>}
                  </div>
                  <div className="flex gap-3 mb-4">{(['analysis','symbols','journal'] as const).map(v=><button key={v} onClick={()=>setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${view===v?'bg-indigo-900 text-white':'bg-gray-100'}`}>{v}</button>)}</div>
                  {view==='analysis' && (
                    <div className="space-y-4">
                      {result.interpretation.what_your_mind_is_processing && <div className="bg-purple-50 rounded-xl p-4"><p className="font-semibold text-sm mb-1">🧠 What your mind is processing</p><p className="text-sm">{result.interpretation.what_your_mind_is_processing}</p></div>}
                      {result.interpretation.emotional_themes?.length>0 && <div><p className="font-semibold text-sm mb-2">💜 Emotional Themes</p><div className="flex flex-wrap gap-2">{result.interpretation.emotional_themes.map((t:string,i:number)=><span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{t}</span>)}</div></div>}
                      {result.interpretation.jungian_analysis && <div className="bg-gray-50 rounded-lg p-4 text-sm"><p className="font-semibold mb-1">⚪ Jungian Analysis</p>{result.interpretation.jungian_analysis}</div>}
                      {result.interpretation.positive_spin && <div className="bg-green-50 rounded-lg p-4 text-sm"><p className="font-semibold mb-1 text-green-700">✨ Positive Reframe</p>{result.interpretation.positive_spin}</div>}
                    </div>
                  )}
                  {view==='symbols' && (
                    <div className="space-y-3">{result.interpretation.symbols?.map((s:any,i:number)=><div key={i} className="border rounded-xl p-4"><div className="flex items-center gap-2 mb-1"><p className="font-semibold text-sm capitalize">"{s.symbol}"</p></div><p className="text-sm text-gray-700 mb-1">{s.meaning}</p>{s.context && <p className="text-xs text-gray-500 italic">{s.context}</p>}</div>)}</div>
                  )}
                  {view==='journal' && (
                    <div className="space-y-3">
                      {result.interpretation.action_items?.length>0 && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">💡 Reflect On</p><ul className="space-y-2">{result.interpretation.action_items.map((a:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-blue-600">{i+1}.</span>{a}</li>)}</ul></div>}
                      {result.interpretation.questions_to_journal?.length>0 && <div><p className="font-semibold text-sm mb-2">📓 Journal Prompts</p><ul className="space-y-3">{result.interpretation.questions_to_journal.map((q:string,i:number)=><li key={i} className="bg-gray-50 rounded-lg p-3 text-sm italic">"{q}"</li>)}</ul></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_roastgen() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [subject, setSubject] = React.useState('');
          const [style, setStyle] = React.useState('funny');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!subject) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/roast/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({subject,style,context}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🎤 Roast Generator</h2>
              <p className="text-sm text-gray-500 mb-6">Comedy roasts with killer burns (all in good fun)</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Who/What to roast *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="My friend who\'s always late, my old startup idea, 2020..." value={subject} onChange={e=>setSubject(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Context (optional)</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="We\'re at their birthday party, they love self-deprecating humor..." value={context} onChange={e=>setContext(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Roast Style</label><div className="flex gap-2 flex-wrap">{['funny','savage','gentle','dad-jokes','celebrity-style'].map(s=><button key={s} onClick={()=>setStyle(s)} className={`px-3 py-1 rounded-full text-sm capitalize ${style===s?'bg-red-500 text-white':'bg-gray-100'}`}>{s}</button>)}</div></div>
              <button onClick={generate} disabled={loading||!subject} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50">{loading ? 'Writing burns...' : '🎤 Roast Them'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5 relative"><button onClick={()=>{navigator.clipboard.writeText(result.roast);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full">{copied?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.roast}</pre></div>
                  {result.best_line && <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4"><p className="font-bold text-sm mb-1">🏆 Best Line</p><p className="text-sm italic">"{result.best_line}"</p></div>}
                  {result.burns?.length>0 && <div><p className="font-semibold text-sm mb-2">🔥 Top Burns</p><ul className="space-y-2">{result.burns.map((b:string,i:number)=><li key={i} className="bg-gray-50 rounded-lg p-3 text-sm flex gap-2"><span>{i+1}.</span>{b}</li>)}</ul></div>}
                  {result.comeback_they_might_use && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>😏 Their likely comeback: </strong>{result.comeback_they_might_use}</div>}
                  {result.rating && <p className="text-xs text-gray-400 text-right">Roast rating: {result.rating}/10 🔥</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_futureself() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [situation, setSituation] = React.useState('');
          const [goals, setGoals] = React.useState('');
          const [fears, setFears] = React.useState('');
          const [years, setYears] = React.useState(5);
          const [msg, setMsg] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const write = async () => {
            if (!situation) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/future-self/write`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({current_situation:situation,goals,fears,years_ahead:years,message_to_future:msg}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">✉️ Letter to Future Self</h2>
              <p className="text-sm text-gray-500 mb-6">A heartfelt time capsule letter you\'ll treasure</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Where are you right now? *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="I just graduated, starting my first job, feeling uncertain about the future..." value={situation} onChange={e=>setSituation(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Your biggest goals</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="Start a company, find love, travel the world..." value={goals} onChange={e=>setGoals(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Your biggest fears</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="Failure, loneliness, never finding my purpose..." value={fears} onChange={e=>setFears(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Message to your future self</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="I hope you remember why you started..." value={msg} onChange={e=>setMsg(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Years into the future: {years}</label><input type="range" min={1} max={20} value={years} onChange={e=>setYears(+e.target.value)} className="w-full" /></div>
              <button onClick={write} disabled={loading||!situation} className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50">{loading ? 'Writing...' : '✉️ Write Letter'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 relative font-serif"><button onClick={()=>{navigator.clipboard.writeText(result.letter);setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="absolute top-3 right-3 text-xs bg-white border px-3 py-1 rounded-full font-sans">{copied?'✓ Copied':'Copy'}</button><pre className="whitespace-pre-wrap text-sm leading-relaxed">{result.letter}</pre></div>
                  {result.key_reminder && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"><p className="font-bold text-sm mb-1">⭐ Key Reminder</p><p className="text-sm italic">"{result.key_reminder}"</p></div>}
                  {result.predictions?.length>0 && <div><p className="font-semibold text-sm mb-2">🔮 What your future self might say</p><ul className="space-y-1">{result.predictions.map((p:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-violet-500">•</span>{p}</li>)}</ul></div>}
                  {result.time_capsule_items?.length>0 && <div className="bg-gray-50 rounded-lg p-3"><p className="font-semibold text-sm mb-1">📦 Time Capsule Items to Include</p><ul className="space-y-1">{result.time_capsule_items.map((i:string,idx:number)=><li key={idx} className="text-sm">• {i}</li>)}</ul></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_resumebullets() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [bullets, setBullets] = React.useState('');
          const [role, setRole] = React.useState('');
          const [industry, setIndustry] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const rewrite = async () => {
            if (!bullets) return;
            const bulletList = bullets.split('\n').filter(b=>b.trim());
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/resume/rewrite-bullets`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({bullets:bulletList,role,industry}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const scoreColor = (s:number) => s>=8?'text-green-600':s>=6?'text-yellow-600':'text-red-500';
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">⚡ Resume Bullet Rewriter</h2>
              <p className="text-sm text-gray-500 mb-6">Transform weak bullets into powerful, quantified achievements</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Your Bullets (one per line) *</label><textarea className="w-full border rounded px-3 py-2 text-sm font-mono" rows={6} placeholder={"Responsible for managing the team\nHelped with customer support\nWorked on improving the website"} value={bullets} onChange={e=>setBullets(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Target Role</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Product Manager, Software Engineer..." value={role} onChange={e=>setRole(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Industry</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="SaaS, Finance, Healthcare..." value={industry} onChange={e=>setIndustry(e.target.value)} /></div>
              </div>
              <button onClick={rewrite} disabled={loading||!bullets} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50">{loading ? 'Rewriting...' : '⚡ Rewrite Bullets'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  {result.rewritten?.map((b:any,i:number)=>(
                    <div key={i} className="border rounded-xl p-4">
                      <div className="text-xs text-red-500 line-through mb-1">{b.original}</div>
                      <div className="text-sm font-medium text-green-700 mb-2">✅ {b.improved}</div>
                      <div className="flex gap-3 text-xs text-gray-500"><span className={`font-bold ${scoreColor(b.impact_score)}`}>Impact: {b.impact_score}/10</span><span>Action verb: <strong>{b.action_verb}</strong></span></div>
                      {b.why_better && <p className="text-xs text-gray-400 mt-1 italic">{b.why_better}</p>}
                    </div>
                  ))}
                  {result.overall_tips?.length>0 && <div className="bg-blue-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">💡 Overall Tips</p><ul className="space-y-1">{result.overall_tips.map((t:string,i:number)=><li key={i} className="text-sm flex gap-2"><span>•</span>{t}</li>)}</ul></div>}
                  {result.missing_keywords?.length>0 && <div className="bg-yellow-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">🔑 Keywords to Add</p><div className="flex flex-wrap gap-2">{result.missing_keywords.map((k:string,i:number)=><span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">{k}</span>)}</div></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_meetingbuilder() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [meetType, setMeetType] = React.useState('');
          const [goal, setGoal] = React.useState('');
          const [attendees, setAttendees] = React.useState('');
          const [duration, setDuration] = React.useState(60);
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const build = async () => {
            if (!meetType || !goal) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/meeting/agenda`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({meeting_type:meetType,goal,attendees,duration_mins:duration,context}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const typeIcon:Record<string,string> = { discussion:'💬', decision:'✅', info:'📢', brainstorm:'🧠' };
          const formatAgenda = () => {
            if (!result) return '';
            let s = `${result.title}\n\nObjective: ${result.objective}\n\nAGENDA:\n`;
            result.agenda_items?.forEach((a:any,i:number)=>{s+=`${i+1}. [${a.time_mins} min] ${a.topic} (${a.owner})\n`;});
            return s;
          };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">📋 Meeting Agenda Builder</h2>
              <p className="text-sm text-gray-500 mb-6">Structured agendas that make meetings actually worth attending</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Meeting Type *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Q3 Planning, 1:1, Sprint Retrospective..." value={meetType} onChange={e=>setMeetType(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Duration: {duration} min</label><input type="range" min={15} max={180} step={15} value={duration} onChange={e=>setDuration(+e.target.value)} className="w-full mt-2" /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Meeting Goal *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Decide on Q3 roadmap priorities and assign owners..." value={goal} onChange={e=>setGoal(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Attendees</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Product, Eng, Design leads..." value={attendees} onChange={e=>setAttendees(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Context</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="First planning meeting after org reorg..." value={context} onChange={e=>setContext(e.target.value)} /></div>
              </div>
              <button onClick={build} disabled={loading||!meetType||!goal} className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50">{loading ? 'Building...' : '📋 Build Agenda'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-lg">{result.title}</h3><p className="text-sm text-gray-600">{result.objective}</p></div><button onClick={()=>{navigator.clipboard.writeText(formatAgenda());setCopied(true);setTimeout(()=>setCopied(false),2000);}} className="text-xs bg-white border px-3 py-1 rounded-full hover:bg-gray-50">{copied?'✓ Copied':'Copy'}</button></div>
                  {result.icebreaker && <div className="bg-yellow-50 rounded-lg p-3 mb-3 text-sm"><strong>🎲 Icebreaker: </strong>{result.icebreaker}</div>}
                  <div className="space-y-2 mb-4">{result.agenda_items?.map((a:any,i:number)=><div key={i} className="border rounded-xl p-3 flex gap-4"><div className="bg-slate-700 text-white rounded-lg px-2 py-1 text-center min-w-14"><p className="text-xs">{a.time_mins}m</p></div><div className="flex-1"><div className="flex items-center gap-2"><span>{typeIcon[a.type]||'📌'}</span><p className="font-medium text-sm">{a.topic}</p></div><p className="text-xs text-gray-500 mt-0.5">{a.owner} • {a.notes}</p></div></div>)}</div>
                  {result.desired_outcomes?.length>0 && <div className="bg-green-50 rounded-xl p-4 mb-3"><p className="font-semibold text-sm mb-2">✅ Desired Outcomes</p><ul className="space-y-1">{result.desired_outcomes.map((o:string,i:number)=><li key={i} className="text-sm flex gap-2"><span>•</span>{o}</li>)}</ul></div>}
                  {result.pre_read?.length>0 && <div className="bg-blue-50 rounded-lg p-3"><p className="font-semibold text-sm mb-1">📖 Pre-read</p><ul className="space-y-1">{result.pre_read.map((p:string,i:number)=><li key={i} className="text-sm">• {p}</li>)}</ul></div>}
                  {result.follow_up_template && <div className="bg-gray-50 rounded-lg p-3 mt-3"><p className="font-semibold text-sm mb-1">📬 Follow-up Template</p><pre className="text-xs whitespace-pre-wrap text-gray-700">{result.follow_up_template}</pre></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_gratitudereflect() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [entries, setEntries] = React.useState('');
          const [mood, setMood] = React.useState('neutral');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const reflect = async () => {
            if (!entries) return;
            const list = entries.split('\n').filter(e=>e.trim());
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/gratitude/reflect`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({entries:list,mood,context}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const depthColor:Record<string,string> = { surface:'bg-gray-100 text-gray-600', moderate:'bg-blue-100 text-blue-700', deep:'bg-purple-100 text-purple-700' };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🙏 Gratitude Journal</h2>
              <p className="text-sm text-gray-500 mb-6">Deepen your gratitude practice with AI reflection</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">What are you grateful for today? *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={5} placeholder={"My morning coffee\nThe project finally shipped\nMy friend called to check on me\nThe sunlight coming through the window"} value={entries} onChange={e=>setEntries(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Current Mood</label><div className="flex gap-2 flex-wrap">{['😔 low','😐 neutral','😊 good','🌟 great'].map(m=>{const val=m.split(' ')[1];return<button key={val} onClick={()=>setMood(val)} className={`px-3 py-1 rounded-full text-sm ${mood===val?'bg-green-600 text-white':'bg-gray-100'}`}>{m}</button>})}</div></div>
                <div><label className="block text-sm font-medium mb-1">Context</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Tough day at work, feeling burned out..." value={context} onChange={e=>setContext(e.target.value)} /></div>
              </div>
              <button onClick={reflect} disabled={loading||!entries} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{loading ? 'Reflecting...' : '🙏 Reflect on My Gratitude'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><p className="font-semibold text-sm">Your Reflection</p>{result.appreciation_depth && <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${depthColor[result.appreciation_depth]||'bg-gray-100'}`}>{result.appreciation_depth} gratitude</span>}</div>
                    <p className="text-sm leading-relaxed text-gray-800">{result.reflection}</p>
                  </div>
                  {result.themes?.length>0 && <div><p className="font-semibold text-sm mb-2">🌿 Themes in Your Gratitude</p><div className="flex flex-wrap gap-2">{result.themes.map((t:string,i:number)=><span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">{t}</span>)}</div></div>}
                  {result.insight && <div className="bg-blue-50 rounded-lg p-4 text-sm"><strong>💡 Insight: </strong>{result.insight}</div>}
                  {result.reframe && <div className="bg-orange-50 rounded-lg p-4 text-sm"><strong>🔄 Reframe: </strong>{result.reframe}</div>}
                  {result.what_you_have?.length>0 && <div className="bg-purple-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">💜 What You Have</p><ul className="space-y-1">{result.what_you_have.map((w:string,i:number)=><li key={i} className="text-sm flex gap-2"><span>•</span>{w}</li>)}</ul></div>}
                  {result.challenge_for_tomorrow && <div className="border-2 border-green-200 rounded-xl p-4"><p className="font-semibold text-sm mb-1">🌱 Tomorrow\'s Challenge</p><p className="text-sm">{result.challenge_for_tomorrow}</p></div>}
                  {result.affirmation && <div className="text-center py-4"><p className="text-lg font-medium italic text-green-700">"{result.affirmation}"</p></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_coldpitch() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [product, setProduct] = React.useState('');
          const [target, setTarget] = React.useState('');
          const [pain, setPain] = React.useState('');
          const [value, setValue] = React.useState('');
          const [tone, setTone] = React.useState('professional');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [copied, setCopied] = React.useState<number|null>(null);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const generate = async () => {
            if (!product || !target) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/cold-pitch/generate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({product,target_audience:target,pain_point:pain,unique_value:value,tone}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const chanIcon:Record<string,string> = { email:'📧', linkedin:'💼', twitter:'🐦', phone:'📞' };
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🎯 Cold Pitch Generator</h2>
              <p className="text-sm text-gray-500 mb-6">3 pitch variations across channels that actually get responses</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Product / Service *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="AI writing tool for marketers" value={product} onChange={e=>setProduct(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Target Audience *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="B2B SaaS startup founders" value={target} onChange={e=>setTarget(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Their Pain Point</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Spending 10+ hours/week on content" value={pain} onChange={e=>setPain(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Your Unique Value</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="10x faster than ChatGPT, brand-trained" value={value} onChange={e=>setValue(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Tone</label><div className="flex gap-2">{['professional','casual','bold','empathetic'].map(t=><button key={t} onClick={()=>setTone(t)} className={`px-3 py-1 rounded-full text-sm capitalize ${tone===t?'bg-blue-600 text-white':'bg-gray-100'}`}>{t}</button>)}</div></div>
              <button onClick={generate} disabled={loading||!product||!target} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Writing pitches...' : '🎯 Generate 3 Pitches'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-4">
                  {result.key_message && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="font-semibold text-sm mb-1">💡 Core Message</p><p className="text-sm">{result.key_message}</p></div>}
                  {result.pitches?.map((p:any,i:number)=>(
                    <div key={i} className="border rounded-xl p-5">
                      <div className="flex justify-between items-center mb-3"><div className="flex items-center gap-2"><span className="text-xl">{chanIcon[p.channel]||'📣'}</span><span className="font-semibold capitalize">{p.channel}</span><span className="text-xs text-gray-400">{p.length_words} words</span></div><button onClick={()=>{navigator.clipboard.writeText((p.subject?`Subject: ${p.subject}\n\n`:'')+p.pitch);setCopied(i);setTimeout(()=>setCopied(null),2000);}} className="text-xs bg-gray-100 px-3 py-1 rounded-full">{copied===i?'✓ Copied':'Copy'}</button></div>
                      {p.subject && <p className="text-xs font-medium text-gray-500 mb-1">Subject: {p.subject}</p>}
                      <div className="bg-gray-50 rounded-lg p-3 mb-2"><pre className="whitespace-pre-wrap text-sm">{p.pitch}</pre></div>
                      <div className="flex gap-4 text-xs text-gray-500"><span>🎣 Hook: {p.hook}</span><span>→ CTA: {p.cta}</span></div>
                    </div>
                  ))}
                  {result.objections_to_expect?.length>0 && <div className="bg-orange-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">⚠️ Expect These Objections</p><ul className="space-y-1">{result.objections_to_expect.map((o:string,i:number)=><li key={i} className="text-sm flex gap-2"><span>•</span>{o}</li>)}</ul></div>}
                  {result.follow_up_template && <div className="bg-gray-50 rounded-xl p-4"><p className="font-semibold text-sm mb-2">📬 Follow-up Template</p><pre className="whitespace-pre-wrap text-sm">{result.follow_up_template}</pre></div>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_moodtracker() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [mood, setMood] = React.useState(7);
          const [energy, setEnergy] = React.useState(6);
          const [notes, setNotes] = React.useState('');
          const [context, setContext] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [history, setHistory] = React.useState<any[]>([]);
          const [view, setView] = React.useState<'log'|'history'>('log');
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          React.useEffect(() => { fetch(`${API}/api/mood/history`,{headers:{'Authorization':`Bearer ${token}`}}).then(r=>r.json()).then(d=>setHistory(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
          const log = async () => {
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/mood/log`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({mood,energy,notes,context}) });
              const d = await r.json(); setResult(d);
              setHistory(prev=>[{mood,energy,notes,created_at:new Date().toISOString()},...prev].slice(0,30));
            } finally { setLoading(false); }
          };
          const moodEmoji = (m:number) => m>=9?'🌟':m>=7?'😊':m>=5?'😐':m>=3?'😔':'😢';
          const trendColor:Record<string,string> = { improving:'text-green-600', stable:'text-blue-600', declining:'text-red-500', new:'text-gray-500' };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🌊 Mood Tracker</h2>
              <p className="text-sm text-gray-500 mb-4">Track your mood + get AI insights on patterns</p>
              <div className="flex gap-3 mb-4">{(['log','history'] as const).map(v=><button key={v} onClick={()=>setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${view===v?'bg-indigo-600 text-white':'bg-gray-100'}`}>{v}</button>)}</div>
              {view==='log' && (
                <div>
                  <div className="bg-gray-50 rounded-xl p-5 mb-4">
                    <div className="flex items-center gap-4 mb-4"><span className="text-4xl">{moodEmoji(mood)}</span><div className="flex-1"><label className="text-sm font-medium">Mood: {mood}/10</label><input type="range" min={1} max={10} value={mood} onChange={e=>setMood(+e.target.value)} className="w-full mt-1" /></div></div>
                    <div><label className="text-sm font-medium">Energy: {energy}/10</label><input type="range" min={1} max={10} value={energy} onChange={e=>setEnergy(+e.target.value)} className="w-full mt-1" /></div>
                  </div>
                  <div className="mb-4"><label className="block text-sm font-medium mb-1">Notes</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={3} placeholder="What\'s going on today? How are you feeling?" value={notes} onChange={e=>setNotes(e.target.value)} /></div>
                  <div className="mb-4"><label className="block text-sm font-medium mb-1">Context</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Big presentation today, got bad news, workout done..." value={context} onChange={e=>setContext(e.target.value)} /></div>
                  <button onClick={log} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Analyzing...' : '🌊 Log Mood + Get Insights'}</button>
                  {result && !result.error && (
                    <div className="mt-6 space-y-3">
                      <div className="bg-indigo-50 rounded-xl p-4"><div className="flex justify-between mb-1"><p className="font-semibold text-sm">Insight</p>{result.trend&&<span className={`text-xs font-medium capitalize ${trendColor[result.trend]||''}`}>Trend: {result.trend}</span>}</div><p className="text-sm">{result.insight}</p></div>
                      {result.pattern && <div className="bg-gray-50 rounded-lg p-3 text-sm"><strong>📊 Pattern: </strong>{result.pattern}</div>}
                      {result.trigger_detected && <div className="bg-orange-50 rounded-lg p-3 text-sm"><strong>⚡ Trigger detected: </strong>{result.trigger_detected}</div>}
                      {result.suggestion && <div className="bg-green-50 rounded-lg p-3 text-sm"><strong>💡 Suggestion: </strong>{result.suggestion}</div>}
                      {result.activity_suggestion && <div className="bg-blue-50 rounded-lg p-3 text-sm"><strong>🎯 Try: </strong>{result.activity_suggestion}</div>}
                      {result.affirmation && <p className="text-center italic text-indigo-700 text-sm py-2">"{result.affirmation}"</p>}
                    </div>
                  )}
                </div>
              )}
              {view==='history' && (
                <div className="space-y-2">
                  {history.length===0 ? <p className="text-sm text-gray-400 text-center py-8">No mood entries yet — log your first one!</p> :
                  history.map((h,i)=><div key={i} className="flex items-center gap-3 border rounded-lg px-4 py-2"><span className="text-xl">{moodEmoji(h.mood)}</span><div className="flex-1"><div className="flex gap-3"><span className="text-sm font-medium">Mood {h.mood}/10</span><span className="text-sm text-gray-500">Energy {h.energy}/10</span></div>{h.notes&&<p className="text-xs text-gray-400 truncate">{h.notes}</p>}</div><p className="text-xs text-gray-400">{new Date(utcStamp(h.created_at)).toLocaleDateString()}</p></div>)}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_habitjournal() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [habit, setHabit] = React.useState('');
          const [completed, setCompleted] = React.useState(true);
          const [streak, setStreak] = React.useState(0);
          const [notes, setNotes] = React.useState('');
          const [difficulty, setDifficulty] = React.useState('normal');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const log = async () => {
            if (!habit) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/habit-journal/log`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({habit,completed,streak,notes,difficulty}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          return (
            <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🔗 Habit Journal</h2>
              <p className="text-sm text-gray-500 mb-6">Log your habit + get personalized coaching</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Habit *</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Morning run, meditation, cold shower, reading..." value={habit} onChange={e=>setHabit(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Did you complete it?</label><div className="flex gap-3 mt-2"><button onClick={()=>setCompleted(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${completed?'bg-green-600 text-white':'bg-gray-100'}`}>✅ Yes!</button><button onClick={()=>setCompleted(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${!completed?'bg-red-500 text-white':'bg-gray-100'}`}>❌ No</button></div></div>
                <div><label className="block text-sm font-medium mb-1">Current Streak: {streak} days</label><input type="range" min={0} max={365} value={streak} onChange={e=>setStreak(+e.target.value)} className="w-full mt-2" /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">How did it feel?</label><div className="flex gap-2">{['easy','normal','hard','very hard'].map(d=><button key={d} onClick={()=>setDifficulty(d)} className={`px-3 py-1 rounded-full text-sm capitalize ${difficulty===d?'bg-orange-500 text-white':'bg-gray-100'}`}>{d}</button>)}</div></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Notes</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="How did it go? What made it easier/harder?" value={notes} onChange={e=>setNotes(e.target.value)} /></div>
              <button onClick={log} disabled={loading||!habit} className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50">{loading ? 'Getting coaching...' : '🔗 Log + Get Coaching'}</button>
              {result && !result.error && (
                <div className="mt-6 space-y-3">
                  <div className={`rounded-xl p-5 ${completed?'bg-green-50 border border-green-200':'bg-orange-50 border border-orange-200'}`}><p className="font-semibold text-sm mb-2">{completed?'🎉 Coaching':'💪 Recovery Coaching'}</p><p className="text-sm leading-relaxed">{result.coaching}</p></div>
                  {result.streak_message && <div className="text-center py-3 bg-yellow-50 rounded-xl"><p className="text-lg">🔥 {result.streak_message}</p></div>}
                  {!completed && result.if_they_broke_streak && <div className="bg-blue-50 rounded-lg p-4 text-sm"><strong>💙 Remember: </strong>{result.if_they_broke_streak}</div>}
                  {result.why_this_matters && <div className="bg-purple-50 rounded-lg p-3 text-sm"><strong>⭐ Why this matters: </strong>{result.why_this_matters}</div>}
                  {result.tip_for_tomorrow && <div className="bg-gray-50 rounded-lg p-3 text-sm"><strong>☀️ Tomorrow: </strong>{result.tip_for_tomorrow}</div>}
                  {result.micro_win && <p className="text-center text-sm italic text-green-700 py-2">"{result.micro_win}"</p>}
                </div>
              )}
            </div>
          );
}

export function ForgeTab_lifegoals() {
  const API = '';
  const tok = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
  const [goal, setGoal] = React.useState('');
          const [category, setCategory] = React.useState('personal');
          const [timeframe, setTimeframe] = React.useState('');
          const [situation, setSituation] = React.useState('');
          const [obstacles, setObstacles] = React.useState('');
          const [result, setResult] = React.useState<any>(null);
          const [loading, setLoading] = React.useState(false);
          const [section, setSection] = React.useState<'plan'|'milestones'|'actions'>('plan');
          const token = typeof window !== 'undefined' ? localStorage.getItem('forge_token') : '';
          const plan = async () => {
            if (!goal) return;
            setLoading(true); setResult(null);
            try {
              const r = await fetch(`${API}/api/life-goals/plan`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify({goal,category,timeframe,current_situation:situation,obstacles}) });
              setResult(await r.json());
            } finally { setLoading(false); }
          };
          const cats = ['personal','career','health','financial','relationships','learning','creative','spiritual'];
          return (
            <div className="p-6 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">🌟 Life Goals Planner</h2>
              <p className="text-sm text-gray-500 mb-6">Transform big dreams into concrete, achievable plans</p>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Your Goal *</label><textarea className="w-full border rounded px-3 py-2 text-sm" rows={2} placeholder="I want to build a successful business, get fit, learn Spanish, move abroad..." value={goal} onChange={e=>setGoal(e.target.value)} /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Category</label><div className="flex gap-2 flex-wrap">{cats.map(c=><button key={c} onClick={()=>setCategory(c)} className={`px-3 py-1 rounded-full text-sm capitalize ${category===c?'bg-yellow-500 text-white':'bg-gray-100'}`}>{c}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium mb-1">Timeframe</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="6 months, 2 years, by 30..." value={timeframe} onChange={e=>setTimeframe(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Current Situation</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="Working 9-5, no savings, beginner level..." value={situation} onChange={e=>setSituation(e.target.value)} /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium mb-1">Biggest Obstacles</label><input className="w-full border rounded px-3 py-2 text-sm" placeholder="No time, money, don\'t know where to start..." value={obstacles} onChange={e=>setObstacles(e.target.value)} /></div>
              <button onClick={plan} disabled={loading||!goal} className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50">{loading ? 'Planning...' : '🌟 Create My Plan'}</button>
              {result && !result.error && (
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 mb-4">
                    <p className="font-bold text-lg mb-1">{result.reframed_goal}</p>
                    <p className="text-sm text-gray-600">{result.why_this_goal_matters}</p>
                    {result.identity_shift && <p className="text-sm italic text-yellow-700 mt-2">Identity shift: {result.identity_shift}</p>}
                  </div>
                  <div className="flex gap-3 mb-4">{(['plan','milestones','actions'] as const).map(s=><button key={s} onClick={()=>setSection(s)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${section===s?'bg-yellow-500 text-white':'bg-gray-100'}`}>{s}</button>)}</div>
                  {section==='plan' && (
                    <div className="space-y-3">
                      {result.success_metrics?.length>0 && <div><p className="font-semibold text-sm mb-2">📏 How You\'ll Know You\'ve Made It</p><ul className="space-y-1">{result.success_metrics.map((m:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="text-yellow-500">✓</span>{m}</li>)}</ul></div>}
                      {result.obstacle_solutions?.length>0 && <div><p className="font-semibold text-sm mb-2">🛡️ Obstacle Solutions</p>{result.obstacle_solutions.map((o:any,i:number)=><div key={i} className="border rounded-lg p-3 mb-2"><p className="text-sm font-medium text-red-600">⚠️ {o.obstacle}</p><p className="text-sm text-green-700 mt-1">→ {o.solution}</p></div>)}</div>}
                      {result.accountability_ideas?.length>0 && <div className="bg-blue-50 rounded-lg p-3"><p className="font-semibold text-sm mb-1">👥 Accountability Ideas</p><ul className="space-y-1">{result.accountability_ideas.map((a:string,i:number)=><li key={i} className="text-sm">• {a}</li>)}</ul></div>}
                    </div>
                  )}
                  {section==='milestones' && (
                    <div className="space-y-3">{result.milestones?.map((m:any,i:number)=><div key={i} className="flex gap-4 border-b pb-3"><div className="bg-yellow-500 text-white rounded-lg px-3 py-2 text-center min-w-16 self-start"><p className="text-xs font-bold">{m.phase}</p></div><div><p className="font-medium text-sm">{m.milestone}</p>{m.by_when&&<p className="text-xs text-gray-500 mt-0.5">By: {m.by_when}</p>}</div></div>)}</div>
                  )}
                  {section==='actions' && (
                    <div className="space-y-3">
                      {result.first_step_right_now && <div className="bg-green-500 text-white rounded-xl p-4"><p className="font-bold text-sm mb-1">🚀 Do This RIGHT NOW</p><p>{result.first_step_right_now}</p></div>}
                      {result.weekly_actions?.length>0 && <div><p className="font-semibold text-sm mb-2">📅 Weekly Actions</p><ol className="space-y-2">{result.weekly_actions.map((a:string,i:number)=><li key={i} className="text-sm flex gap-2"><span className="font-bold text-yellow-600">{i+1}.</span>{a}</li>)}</ol></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
}
