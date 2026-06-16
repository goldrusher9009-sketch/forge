'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TOTAL_STEPS = 5

const SUPPLY_PRESETS = [
  { label: '10k',  value: 10000,  desc: 'Scarce. Higher price potential.' },
  { label: '50k',  value: 50000,  desc: 'Balanced. Popular choice.' },
  { label: '100k', value: 100000, desc: 'Liquid. Good for large audiences.' },
  { label: 'Custom', value: -1,    desc: 'Set your own supply.' },
]

const CURVE_TYPES = [
  { id: 'linear',      label: 'Linear',      desc: 'Price rises steadily with each buy.', emoji: '📈' },
  { id: 'exponential', label: 'Exponential', desc: 'Price rises faster as more buy in.',   emoji: '🚀' },
  { id: 'flat',        label: 'Flat',        desc: 'Fixed price. Simple for community.',   emoji: '⟶' },
]

const PERK_TEMPLATES = [
  'Exclusive content feed',
  'Monthly 1:1 call',
  'Discord private channel',
  'Early access to releases',
  'Revenue sharing (5%)',
  'DAO voting rights',
  'Physical merch drop',
  'Behind-the-scenes access',
]

interface Tier {
  name: string; color: string; min: number; perks: string[]
}

const DEFAULT_TIERS: Tier[] = [
  { name: 'Bronze', color: '#cd7f32', min: 10,  perks: ['Exclusive content feed'] },
  { name: 'Silver', color: '#94a3b8', min: 25,  perks: ['Exclusive content feed', 'Discord private channel'] },
  { name: 'Gold',   color: '#f59e0b', min: 50,  perks: ['Exclusive content feed', 'Discord private channel', 'Early access to releases'] },
  { name: 'Diamond',color: '#818cf8', min: 100, perks: ['All above', 'Monthly 1:1 call', 'Revenue sharing (5%)'] },
]

export default function LaunchTokenPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 — basics
  const [tokenName, setTokenName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [tagline, setTagline] = useState('')

  // Step 2 — supply + pricing
  const [supplyPreset, setSupplyPreset] = useState(50000)
  const [customSupply, setCustomSupply] = useState('')
  const [startPrice, setStartPrice] = useState('1.00')
  const [curve, setCurve] = useState('linear')

  // Step 3 — tiers
  const [tiers, setTiers] = useState<Tier[]>(DEFAULT_TIERS)
  const [editingTierPerk, setEditingTierPerk] = useState<{tierIdx: number; perkIdx: number} | null>(null)

  // Step 4 — economics
  const [creatorShare, setCreatorShare] = useState(80)
  const [stakingPool, setStakingPool] = useState(15)
  const protocolFee = 5

  // Step 5 — launch
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)

  const supply = supplyPreset === -1 ? parseInt(customSupply) || 0 : supplyPreset
  const price = parseFloat(startPrice) || 0
  const marketCap = supply * price

  async function launch() {
    setLaunching(true)
    await new Promise(r => setTimeout(r, 2000))
    setLaunching(false)
    setLaunched(true)
  }

  function autoSymbol(name: string) {
    return name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)
  }

  if (launched) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24" style={{ background: 'var(--ink)' }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-5xl">🎉</div>
          <div>
            <div className="text-3xl font-black text-white mb-1">${symbol} is live!</div>
            <div className="text-white/40">Your token is deployed and available for purchase.</div>
          </div>
          <div className="p-4 rounded-2xl border border-white/6 space-y-2 text-left" style={{ background: 'rgba(255,255,255,0.018)' }}>
            <Row label="Token" value={`${tokenName} ($${symbol})`} />
            <Row label="Supply" value={supply.toLocaleString()} />
            <Row label="Starting price" value={`$${price.toFixed(2)}`} />
            <Row label="Market cap" value={`$${marketCap.toLocaleString()}`} />
            <Row label="Curve" value={curve.charAt(0).toUpperCase() + curve.slice(1)} />
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push('/creator')}
              className="w-full py-3.5 rounded-xl font-black" style={{ background: '#a855f7', color: '#04040A' }}>
              Go to Creator Hub
            </button>
            <button onClick={() => router.push(`/tokens/${symbol}`)}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white' }}>
              View Token Page →
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
            <div className="font-bold text-white">Launch Your Token</div>
            <div className="text-xs text-white/30">Step {step} of {TOTAL_STEPS}</div>
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: step > i ? '#a855f7' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1 — Identity */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-black text-white mb-1">Name your token</div>
              <div className="text-sm text-white/35">This becomes your brand in the token economy.</div>
            </div>
            <div className="space-y-3">
              <Field label="Token Name">
                <input value={tokenName}
                  onChange={e => { setTokenName(e.target.value); if (!symbol) setSymbol(autoSymbol(e.target.value)) }}
                  placeholder="e.g. Sovereign Token"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none focus:border-purple-500/40" />
              </Field>
              <Field label="Ticker Symbol">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8 focus-within:border-purple-500/40">
                  <span className="text-white/30 font-black">$</span>
                  <input value={symbol}
                    onChange={e => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
                    placeholder="SOVV"
                    maxLength={5}
                    className="flex-1 text-sm bg-transparent text-white placeholder-white/20 outline-none font-black tracking-wider" />
                  <span className="text-xs text-white/20">{symbol.length}/5</span>
                </div>
              </Field>
              <Field label="Tagline">
                <input value={tagline} onChange={e => setTagline(e.target.value)}
                  placeholder="One sentence about your community"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none focus:border-purple-500/40" />
              </Field>
            </div>
            <button onClick={() => setStep(2)} disabled={!tokenName || symbol.length < 2}
              className="w-full py-4 rounded-2xl font-black text-lg disabled:opacity-30"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Supply + curve */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-black text-white mb-1">Supply & pricing</div>
              <div className="text-sm text-white/35">Set the economics of your token.</div>
            </div>
            <div className="space-y-3">
              <Field label="Total Supply">
                <div className="grid grid-cols-2 gap-2">
                  {SUPPLY_PRESETS.map(p => (
                    <button key={p.label} onClick={() => setSupplyPreset(p.value)}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={supplyPreset === p.value
                        ? { background: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.4)' }
                        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="font-black text-sm text-white">{p.label}</div>
                      <div className="text-xs text-white/30">{p.desc}</div>
                    </button>
                  ))}
                </div>
                {supplyPreset === -1 && (
                  <input value={customSupply} onChange={e => setCustomSupply(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 75000"
                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 outline-none mt-2" />
                )}
              </Field>
              <Field label="Starting Price (USDC)">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
                  <span className="text-white/30">$</span>
                  <input value={startPrice} onChange={e => setStartPrice(e.target.value)}
                    inputMode="decimal"
                    className="flex-1 text-sm bg-transparent text-white outline-none" />
                </div>
              </Field>
              <Field label="Bonding Curve">
                <div className="space-y-2">
                  {CURVE_TYPES.map(c => (
                    <button key={c.id} onClick={() => setCurve(c.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                      style={curve === c.id
                        ? { background: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.35)' }
                        : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                      <span className="text-xl">{c.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white/80">{c.label}</div>
                        <div className="text-xs text-white/30">{c.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
              {supply > 0 && price > 0 && (
                <div className="p-3 rounded-xl border border-white/5 text-xs" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <span className="text-white/30">Initial market cap: </span>
                  <span className="font-bold" style={{ color: '#a855f7' }}>${marketCap.toLocaleString()}</span>
                </div>
              )}
            </div>
            <button onClick={() => setStep(3)}
              className="w-full py-4 rounded-2xl font-black text-lg"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 3 — Tiers */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-black text-white mb-1">Holder tiers & perks</div>
              <div className="text-sm text-white/35">Define what holders unlock based on how many tokens they hold.</div>
            </div>
            <div className="space-y-3">
              {tiers.map((tier, ti) => (
                <div key={tier.name} className="p-4 rounded-2xl border border-white/6" style={{ background: 'rgba(255,255,255,0.018)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: tier.color }} />
                    <span className="font-black text-white">{tier.name}</span>
                    <span className="text-xs text-white/30 ml-1">≥ {tier.min} tokens</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tier.perks.map((perk, pi) => (
                      <span key={pi} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ background: `${tier.color}15`, color: tier.color }}>
                        {perk}
                        <button onClick={() => setTiers(prev => prev.map((t, i) => i === ti ? { ...t, perks: t.perks.filter((_, j) => j !== pi) } : t))}
                          className="text-white/30 hover:text-white/60 transition-colors ml-0.5">✕</button>
                      </span>
                    ))}
                    <button onClick={() => setEditingTierPerk({ tierIdx: ti, perkIdx: -1 })}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>+ perk</button>
                  </div>
                  {editingTierPerk?.tierIdx === ti && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {PERK_TEMPLATES.filter(p => !tier.perks.includes(p)).map(p => (
                        <button key={p} onClick={() => {
                          setTiers(prev => prev.map((t, i) => i === ti ? { ...t, perks: [...t.perks, p] } : t))
                          setEditingTierPerk(null)
                        }}
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: `${tier.color}10`, color: tier.color }}>{p}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setStep(4)}
              className="w-full py-4 rounded-2xl font-black text-lg"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 4 — Economics */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-black text-white mb-1">Revenue split</div>
              <div className="text-sm text-white/35">How is revenue distributed when your tokens are traded?</div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-white/70">You keep</span>
                  <span className="font-black" style={{ color: '#22c55e' }}>{creatorShare}%</span>
                </div>
                <input type="range" min={60} max={90} value={creatorShare}
                  onChange={e => { const v = parseInt(e.target.value); setCreatorShare(v); setStakingPool(95 - v) }}
                  className="w-full accent-purple-500" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-white/70">Staker rewards pool</span>
                  <span className="font-black" style={{ color: '#a855f7' }}>{stakingPool}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#a855f7', width: `${stakingPool / 30 * 100}%`, transition: 'width 0.3s' }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Protocol fee (VIVA)</span>
                <span className="text-white/40">{protocolFee}%</span>
              </div>

              {/* Visual donut */}
              <div className="p-4 rounded-2xl border border-white/6 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
                <div className="text-xs text-white/30 uppercase tracking-widest mb-3">Revenue Split Preview</div>
                <div className="flex rounded-full overflow-hidden h-3">
                  <div style={{ width: `${creatorShare}%`, background: '#22c55e' }} />
                  <div style={{ width: `${stakingPool}%`, background: '#a855f7' }} />
                  <div style={{ width: `${protocolFee}%`, background: 'rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex gap-4 text-xs">
                  <span style={{ color: '#22c55e' }}>● You {creatorShare}%</span>
                  <span style={{ color: '#a855f7' }}>● Stakers {stakingPool}%</span>
                  <span className="text-white/25">● Protocol {protocolFee}%</span>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(5)}
              className="w-full py-4 rounded-2xl font-black text-lg"
              style={{ background: '#a855f7', color: '#04040A' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 5 — Launch */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <div className="text-2xl font-black text-white mb-1">Ready to launch</div>
              <div className="text-sm text-white/35">Review everything before deploying your token onchain.</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/6 space-y-2" style={{ background: 'rgba(255,255,255,0.018)' }}>
              <Row label="Token name" value={tokenName} />
              <Row label="Symbol" value={`$${symbol}`} />
              <Row label="Tagline" value={tagline || '—'} />
              <Row label="Total supply" value={supply.toLocaleString()} />
              <Row label="Start price" value={`$${price.toFixed(2)}`} />
              <Row label="Initial market cap" value={`$${marketCap.toLocaleString()}`} />
              <Row label="Bonding curve" value={curve.charAt(0).toUpperCase() + curve.slice(1)} />
              <Row label="Creator share" value={`${creatorShare}%`} />
              <Row label="Staker pool" value={`${stakingPool}%`} />
              <Row label="Tiers" value={tiers.map(t => t.name).join(', ')} />
            </div>
            <div className="p-3 rounded-xl border border-white/5 text-xs text-white/25">
              By launching, your token will be available to buy on the VIVA marketplace. Supply and curve cannot be changed after launch.
            </div>
            <button onClick={launch} disabled={launching}
              className="w-full py-4 rounded-2xl font-black text-xl disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #a855f7, #818cf8)', color: '#04040A' }}>
              {launching ? '🚀 Deploying…' : `🚀 Launch $${symbol}`}
            </button>
          </div>
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
