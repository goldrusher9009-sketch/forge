'use client';
import React, { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: string;
  rating: number;
  reviews: number;
  description: string;
  screenshots: string[];
  creator: string;
}

interface MarketplaceDetailProps {
  product: Product;
  onInstall: () => void;
}

export const MarketplaceDetail: React.FC<MarketplaceDetailProps> = ({ product, onInstall }) => {
  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await fetch('/api/marketplace/install', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId: product.id })
      });
      onInstall();
    } catch (e) {
      console.error('Install failed', e);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--fg-bg)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '24px', marginBottom: '28px',
        display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px'
      }}>
        <div style={{
          background: 'var(--fg-bg2)', borderRadius: '8px',
          aspectRatio: '1', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '64px'
        }}>
          {product.name.charAt(0)}
        </div>
        <div>
          <h1 style={{ marginBottom: '8px' }}>{product.name}</h1>
          <p style={{ color: 'var(--fg-text2)', marginBottom: '16px' }}>{product.description}</p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px', fontWeight: '700' }}>{product.price}</span>
            <span style={{ color: 'var(--fg-text2)' }}>⭐ {product.rating} ({product.reviews} reviews)</span>
          </div>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="fg-btn-primary"
            style={{ padding: '12px 32px' }}
          >
            {installing ? 'Installing...' : 'Install Now'}
          </button>
        </div>
      </div>

      {/* Screenshots */}
      {product.screenshots.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Screenshots</h2>
          <div style={{
            background: 'var(--fg-bg3)', borderRadius: '12px', padding: '16px',
            border: '1px solid var(--fg-border2)'
          }}>
            <div style={{
              background: 'var(--fg-bg2)', borderRadius: '8px',
              aspectRatio: '16/9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '48px', marginBottom: '12px'
            }}>
              📸
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {product.screenshots.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentScreenshot(i)}
                  style={{
                    width: '60px', height: '60px', borderRadius: '6px',
                    border: i === currentScreenshot ? '2px solid var(--fg-orange)' : '1px solid var(--fg-border2)',
                    background: 'var(--fg-bg)',
                    cursor: 'pointer'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Creator Info */}
      <div style={{
        background: 'var(--fg-bg3)', border: '1px solid var(--fg-border2)',
        borderRadius: '12px', padding: '16px'
      }}>
        <h3 style={{ marginBottom: '8px' }}>Created by</h3>
        <p style={{ color: 'var(--fg-text2)' }}>{product.creator}</p>
        <button
          style={{
            marginTop: '12px', padding: '8px 16px', borderRadius: '6px',
            border: '1px solid var(--fg-border2)', background: 'transparent',
            color: 'var(--fg-text)', cursor: 'pointer'
          }}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
