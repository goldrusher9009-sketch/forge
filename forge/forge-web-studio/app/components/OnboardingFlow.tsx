'use client';
import React, { useState } from 'react';

interface OnboardingFlowProps {
  onComplete: (data: { orgName: string; teamSize: string; providers: string[] }) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [teamSize, setTeamSize] = useState('1-5');
  const [providers, setProviders] = useState<string[]>(['anthropic']);

  const toggleProvider = (p: string) => {
    setProviders(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSkip = () => {
    onComplete({ orgName: orgName || 'My Workspace', teamSize, providers });
  };

  const handleNext = () => {
    if (step === 1 && !orgName.trim()) return;
    if (step < 3) setStep(step + 1);
    else onComplete({ orgName, teamSize, providers });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(8,8,9,0.95)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '16px', padding: '40px', width: '90%', maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: s === step ? 'var(--fg-orange)' : s < step ? 'var(--fg-green)' : 'var(--fg-border2)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {/* Step 1: Org Setup */}
        {step === 1 && (
          <div style={{ animation: 'fg-slide-in 0.3s ease' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Welcome to Forge</h2>
            <p style={{ color: 'var(--fg-text2)', marginBottom: '24px' }}>Let's set up your workspace</p>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: '500' }}>
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="My Company"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid var(--fg-border2)', background: 'var(--fg-bg)',
                color: 'var(--fg-text)', fontSize: '14px', marginBottom: '24px',
                outline: 'none'
              }}
            />
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: '500' }}>
              Team Size
            </label>
            <select
              value={teamSize}
              onChange={e => setTeamSize(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '8px',
                border: '1px solid var(--fg-border2)', background: 'var(--fg-bg)',
                color: 'var(--fg-text)', fontSize: '14px'
              }}
            >
              <option>1-5</option>
              <option>6-20</option>
              <option>21-100</option>
              <option>100+</option>
            </select>
          </div>
        )}

        {/* Step 2: Provider Selection */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Choose AI Providers</h2>
            <p style={{ color: 'var(--fg-text2)', marginBottom: '24px' }}>Select your LLM API keys</p>
            {['anthropic', 'openai', 'gemini', 'groq'].map(p => (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                style={{
                  display: 'block', width: '100%', padding: '12px 16px', marginBottom: '12px',
                  borderRadius: '8px', border: '2px solid',
                  borderColor: providers.includes(p) ? 'var(--fg-orange)' : 'var(--fg-border2)',
                  background: providers.includes(p) ? 'rgba(255,31,53,0.1)' : 'var(--fg-bg)',
                  color: 'var(--fg-text)', cursor: 'pointer', fontWeight: '500'
                }}
              >
                {p.toUpperCase()} {providers.includes(p) ? '✓' : ''}
              </button>
            ))}
          </div>
        )}

        {/* Step 3: First Thread */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Create Your First Thread</h2>
            <p style={{ color: 'var(--fg-text2)', marginBottom: '24px' }}>Ready to start building?</p>
            <div style={{
              background: 'var(--fg-bg2)', border: '1px dashed var(--fg-border2)',
              borderRadius: '12px', padding: '24px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
              <p style={{ marginBottom: '4px' }}>Create your first AI-powered thread</p>
              <p style={{ color: 'var(--fg-text2)', fontSize: '13px' }}>Start a conversation to build your first app</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="fg-btn-secondary"
              style={{ flex: 1 }}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="fg-btn-primary"
            style={{ flex: 1 }}
          >
            {step === 3 ? 'Start Building' : 'Next'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'none', border: 'none', padding: '4px 8px',
              color: 'var(--fg-text2)', fontSize: '13px', cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: '3px',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
