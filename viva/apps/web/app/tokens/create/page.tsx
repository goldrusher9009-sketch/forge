'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function autoSymbol(name: string) {
  return name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)
}

const SUPPLY_OPTIONS = [
  { value: 10000,  label: '10k',   desc: 'Exclusive. High scarcity.' },
  { value: 50000,  label: '50k',   desc: 'Balanced supply.' },
  { value: 100000, label: '100k',  desc: 'Wide distribution.' },
  { value: 0,      label: 'Custom', desc: 'Set your own.' },
]

const CURVE_TYPES = [
  { id: 'linear',      label: 'Linear',      desc: 'Price rises steadily with demand.' },
  { id: 'exponential', label: 'Exponential', desc: 'Price accelerates quickly at higher demand.' },
  { id: 'flat',        label: 'Flat',         desc: 'Fixed price — no bonding curve.' },
]

export default function TokenCreatePage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [tokenName, setTokenName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [tagline, setTagline] = useState('')
  const [supplyOption, setSupplyOption] = useState(50000)
  const [customSupply, setCustomSupply] = useState('50000')
  const [startPrice, setStartPrice] = useState('0.10')
  const [curve, setCurve] = useState('linear')
  const [creatorShare, setCreatorShare] = useState(70)
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)

  const supply = supplyOption === 0 ? (parseInt(customSupply) || 0) : supplyOption
  const price = parseFloat(startPrice) || 0
  const marketCap = supply * price
  const stakingPool = 95 - creatorShare

  function handleNameChange(v: string) {
    setTokenName(v)
    setSymbol(autoSymbol(v))
  }

  async function launch() {
    setLaunching(true)
    await new Promise(r => setTimeout(r, 2000))
    setLaunching(false)
    setLaunched(true)
  }

  if (launched) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '2px solid rgba(168,85,247,0.3)' }}>
            <span className="text-3xl">🚀</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1">${symbol} Launched!</div>
            <div className="text-white/40">{tokenName} is live on the YouToken marketplace.</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 text-left space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="Symbol" value={`$${symbol}`} />
            <Row label="Supply" value={supply.toLocaleString()} />
            <Row label="Start price" value={`$${price.toFixed(2)}`} />
            <Row label="Market cap" value={`$${marketCap.toLocaleString()}`} />
            <Row label="Curve" value={curve} />
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push(`/tokens/${symbol}`)}
              className="w-full py-3.5 rounded-xl font-black" style={{ background: '#a855f7', color: '#04040A' }}>
              View Token Page
            </button>
            <button onClick={() => router.push('/creator')}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              Creator Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--ink)' }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 border-b border-white/5"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(4,4,10,0.92)' }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="font-black text-white">Launch Your Token</div>
            <div className="text-xs text-white/30">Step {step} of 3</div>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: step >= i ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Step 1 — Identity */}
        {step === 1 && (
          <>
            <div className="text-xs text-white/30 uppercase tracking-widest">Token Identity</div>
            <div className="space-y-3">
              <Field label="Token Name">
                <input value={tokenName} onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Sovereign Finance"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
              </Field>
              <Field label="Symbol">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/6 bg-white/5">
                  <span className="text-white/30">$</span>
                  <input value={symbol} onChange={e => setSymbol(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5))}
                    placeholder="AUTO"
                    className="flex-1 text-white bg-transparent outline-none font-mono font-black text-sm" />
                  <span className="text-xs text-white/25">Auto-generated</span>
                </div>
              </Field>
              <Field label="Tagline">
                <input value={tagline} onChange={e => setTagline(e.target.value)}
                  placeholder="One line about your token…"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
              </Field>
            </div>
            <button onClick={() => setStep(2)} disabled={!tokenName.trim() || !symbol.trim()}
              className="w-full py-4 rounded-2xl font-black disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </>
        )}

        {/* Step 2 — Supply & Price */}
        {step === 2 && (
          <>
            <div className="text-xs text-white/30 uppercase tracking-widest">Supply & Pricing</div>

            <div className="space-y-2">
              <div className="text-xs text-white/35 font-semibold">Total Supply</div>
              <div className="grid grid-cols-2 gap-2">
                {SUPPLY_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setSupplyOption(o.value)}
                    className="p-3 rounded-xl border text-left transition-all"
                    style={supplyOption === o.value
                      ? { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.35)' }
                      : { background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="font-black text-sm" style={{ color: supplyOption === o.value ? '#a855f7' : 'rgba(255,255,255,0.7)' }}>{o.label}</div>
                    <div className="text-xs text-white/30">{o.desc}</div>
                  </button>
                ))}
              </div>
              {supplyOption === 0 && (
                <input value={customSupply} onChange={e => setCustomSupply(e.target.value.replace(/\D/g, ''))}
                  placeholder="Custom supply amount"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/5 border border-white/6 text-white placeholder-white/20 outline-none" />
              )}
            </div>

            <Field label="Starting Price (USDC)">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/6 bg-white/5">
                <span className="text-white/30">$</span>
                <input value={startPrice} onChange={e => setStartPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  className="flex-1 text-white bg-transparent outline-none text-sm" />
                <span className="text-xs text-white/25">USDC</span>
              </div>
            </Field>

            <div className="space-y-2">
              <div className="text-xs text-white/35 font-semibold">Bonding Curve</div>
              {CURVE_TYPES.map(c => (
                <button key={c.id} onClick={() => setCurve(c.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={curve === c.id
                    ? { background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }
                    : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white/80">{c.label}</div>
                    <div className="text-xs text-white/30">{c.desc}</div>
                  </div>
                  {curve === c.id && <span style={{ color: '#a855f7' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Market cap preview */}
            <div className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Preview</div>
              <Row label="Supply" value={supply.toLocaleString()} />
              <Row label="Start price" value={`$${price.toFixed(2)}`} />
              <Row label="Initial market cap" value={`$${marketCap.toLocaleString()}`} />
            </div>

            <button onClick={() => setStep(3)}
              className="w-full py-4 rounded-2xl font-black"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </>
        )}

        {/* Step 3 — Revenue Split + Launch */}
        {step === 3 && (
          <>
            <div className="text-xs text-white/30 uppercase tracking-widest">Revenue Split</div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Creator share</span>
                <span className="font-black" style={{ color: '#a855f7' }}>{creatorShare}%</span>
              </div>
              <input type="range" min={60} max={90} value={creatorShare}
                onChange={e => setCreatorShare(Number(e.target.value))}
                className="w-full" />
              <div className="flex gap-2">
                {[
                  { label: 'You', pct: creatorShare, color: '#a855f7' },
                  { label: 'Stakers', pct: stakingPool, color: '#22c55e' },
                  { label: 'Protocol', pct: 5, color: '#818cf8' },
                ].map(seg => (
                  <div key={seg.label} className="flex-1 p-2 rounded-xl text-center text-xs"
                    style={{ background: `${seg.color}12`, border: `1px solid ${seg.color}25` }}>
                    <div className="font-black" style={{ color: seg.color }}>{seg.pct}%</div>
                    <div className="text-white/30">{seg.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full review */}
            <div className="p-4 rounded-2xl border border-white/6 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Review</div>
              <Row label="Name" value={tokenName} />
              <Row label="Symbol" value={`$${symbol}`} />
              <Row label="Supply" value={supply.toLocaleString()} />
              <Row label="Start price" value={`$${price.toFixed(2)}`} />
              <Row label="Curve" value={curve} />
              <Row label="Creator share" value={`${creatorShare}%`} />
            </div>

            <button onClick={launch} disabled={launching}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-50"
              style={{ background: '#a855f7', color: '#04040A' }}>
              {launching ? 'Launching…' : '🚀 Launch Token'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/35 font-semibold uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-white/70 font-semibold">{value}</span>
    </div>
  )
}
