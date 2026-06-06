'use client';
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
  onSelectPrompt: (prompt: string) => void;
  hasKeys: boolean;
}

export const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete, onSelectPrompt, hasKeys }) => {
  const [step, setStep] = useState<'welcome' | 'keys' | 'tour'>(hasKeys ? 'tour' : 'welcome');

  const starterPrompts = [
    {
      id: 'research',
      emoji: '🔍',
      title: 'Research',
      desc: 'Deep dive into a topic with sources',
      prompt: 'Research and summarize the latest developments in'
    },
    {
      id: 'code',
      emoji: '💻',
      title: 'Code',
      desc: 'Write, debug, or refactor code',
      prompt: 'Help me write a function that'
    },
    {
      id: 'write',
      emoji: '✍️',
      title: 'Write',
      desc: 'Draft docs, emails, or copy',
      prompt: 'Write a professional'
    },
    {
      id: 'analyze',
      emoji: '📊',
      title: 'Analyze',
      desc: 'Break down data and insights',
      prompt: 'Analyze and explain'
    }
  ];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, rgba(8,8,9,0.98) 0%, rgba(13,13,15,0.98) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(2px)'
    }}>
      {step === 'welcome' && (
        <div style={{
          maxWidth: 480,
          textAlign: 'center',
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🚀</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f0f1f5', marginBottom: 12 }}>Welcome to Forge</h1>
          <p style={{ fontSize: 15, color: '#9a9caa', marginBottom: 24, lineHeight: 1.6 }}>
            The unified AI workspace. Bring your own API keys and unlock all models in one place.
          </p>
          <div style={{ background: 'rgba(255,31,53,0.08)', border: '1px solid rgba(255,31,53,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#ff1f35', margin: 0, fontWeight: 600 }}>⚠️ API Keys Required</p>
            <p style={{ fontSize: 12, color: '#9a9caa', margin: '8px 0 0 0' }}>
              First, add your API keys (OpenAI, Anthropic, etc.) in Settings to get started.
            </p>
          </div>
          <button onClick={() => setStep('keys')} style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg,#ff1f35,#cc1020)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 18px rgba(255,31,53,0.35)',
            transition: 'all 0.2s ease'
          }} onMouseOver={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(255,31,53,0.5)')}
            onMouseOut={e => (e.currentTarget.style.boxShadow = '0 0 18px rgba(255,31,53,0.35)')}>
            Add API Keys
          </button>
        </div>
      )}

      {step === 'keys' && (
        <div style={{
          maxWidth: 480,
          textAlign: 'center',
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🔑</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f1f5', marginBottom: 12 }}>Setup Your Keys</h1>
          <p style={{ fontSize: 14, color: '#9a9caa', marginBottom: 24, lineHeight: 1.6 }}>
            Go to <strong>Settings</strong> → <strong>API Keys</strong> and add at least one provider:
          </p>
          <div style={{ background: 'var(--fg-bg2)', border: '1px solid var(--fg-border)', borderRadius: 10, padding: 16, textAlign: 'left', marginBottom: 24 }}>
            {['Anthropic', 'OpenAI', 'Google Gemini', 'OpenRouter'].map((provider, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13, color: '#9a9caa' }}>
                <span style={{ color: '#2ed18a' }}>✓</span> {provider}
              </div>
            ))}
          </div>
          <button onClick={() => setStep('tour')} style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg,#ff1f35,#cc1020)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 18px rgba(255,31,53,0.35)',
            transition: 'all 0.2s ease',
            marginRight: 12
          }} onMouseOver={e => (e.currentTarget.style.boxShadow = '0 0 24px rgba(255,31,53,0.5)')}
            onMouseOut={e => (e.currentTarget.style.boxShadow = '0 0 18px rgba(255,31,53,0.35)')}>
            I'm Ready →
          </button>
          <button onClick={onComplete} style={{
            padding: '12px 28px',
            background: 'transparent',
            color: '#9a9caa',
            border: '1px solid var(--fg-border)',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--fg-border2)'; e.currentTarget.style.color = '#f0f1f5'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--fg-border)'; e.currentTarget.style.color = '#9a9caa'; }}>
            Skip for now
          </button>
        </div>
      )}

      {step === 'tour' && (
        <div style={{
          maxWidth: 720,
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f0f1f5', marginBottom: 8 }}>Ready to Build</h1>
            <p style={{ fontSize: 14, color: '#9a9caa' }}>Choose a starter prompt or go freestyle</p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 24
          }}>
            {starterPrompts.map(p => (
              <button key={p.id} onClick={() => {
                onSelectPrompt(p.prompt);
                onComplete();
              }} style={{
                background: 'rgba(255,31,53,0.06)',
                border: '1px solid var(--fg-border)',
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255,31,53,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255,31,53,0.38)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255,31,53,0.06)';
                  e.currentTarget.style.borderColor = 'var(--fg-border)';
                }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{p.emoji}</div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 700, color: '#f0f1f5' }}>{p.title}</h3>
                <p style={{ margin: 0, fontSize: 12, color: '#9a9caa' }}>{p.desc}</p>
              </button>
            ))}
          </div>
          <button onClick={onComplete} style={{
            width: '100%',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.05)',
            color: '#9a9caa',
            border: '1px solid var(--fg-border)',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--fg-border2)'; e.currentTarget.style.color = '#f0f1f5'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--fg-border)'; e.currentTarget.style.color = '#9a9caa'; }}>
            Or dive in empty →
          </button>
        </div>
      )}
    </div>
  );
};
