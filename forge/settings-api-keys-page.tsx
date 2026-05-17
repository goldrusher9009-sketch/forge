'use client';

import React, { useState } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from './design-tokens';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: string;
  lastUsedAt: string | null;
  scopes: string[];
  isActive: boolean;
  usageCount: number;
}

interface ApiKeysState {
  apiKeys: ApiKey[];
  showNewKeyModal: boolean;
  newKeyName: string;
  selectedScopes: string[];
  generatedKey: string | null;
  showGeneratedKeyModal: boolean;
  isSaving: boolean;
  copiedKeyId: string | null;
}

const availableScopes = [
  { id: 'read', label: 'Read', description: 'Read access to projects and agents' },
  { id: 'write', label: 'Write', description: 'Create and modify projects and agents' },
  { id: 'delete', label: 'Delete', description: 'Delete projects and agents' },
  { id: 'admin', label: 'Admin', description: 'Full access including team management' },
];

const ApiKeysPage: React.FC = () => {
  const [state, setState] = useState<ApiKeysState>({
    apiKeys: [
      {
        id: '1',
        name: 'Production Server',
        key: 'sk_live_abc123def456ghi789jkl',
        maskedKey: 'sk_live_••••••••••••••789jkl',
        createdAt: '2026-03-15',
        lastUsedAt: '2026-05-04',
        scopes: ['read', 'write'],
        isActive: true,
        usageCount: 2847,
      },
      {
        id: '2',
        name: 'Development',
        key: 'sk_test_xyz987uvw654rst321opq',
        maskedKey: 'sk_test_••••••••••••••321opq',
        createdAt: '2026-02-01',
        lastUsedAt: '2026-05-03',
        scopes: ['read', 'write', 'delete'],
        isActive: true,
        usageCount: 156,
      },
      {
        id: '3',
        name: 'CI/CD Pipeline',
        key: 'sk_live_old_key_123456789',
        maskedKey: 'sk_live_••••••••••••••••6789',
        createdAt: '2025-12-10',
        lastUsedAt: null,
        scopes: ['read'],
        isActive: false,
        usageCount: 0,
      },
    ],
    showNewKeyModal: false,
    newKeyName: '',
    selectedScopes: ['read'],
    generatedKey: null,
    showGeneratedKeyModal: false,
    isSaving: false,
    copiedKeyId: null,
  });

  const handleToggleScope = (scope: string) => {
    setState(prev => ({
      ...prev,
      selectedScopes: prev.selectedScopes.includes(scope)
        ? prev.selectedScopes.filter(s => s !== scope)
        : [...prev.selectedScopes, scope],
    }));
  };

  const handleGenerateKey = () => {
    if (!state.newKeyName.trim() || state.selectedScopes.length === 0) return;

    setState(prev => ({ ...prev, isSaving: true }));
    setTimeout(() => {
      const newKey = `sk_live_${Math.random().toString(36).substr(2, 20)}`;
      setState(prev => ({
        ...prev,
        generatedKey: newKey,
        showGeneratedKeyModal: true,
        showNewKeyModal: false,
        isSaving: false,
      }));
    }, 600);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setState(prev => ({ ...prev, copiedKeyId: key }));
    setTimeout(() => {
      setState(prev => ({ ...prev, copiedKeyId: null }));
    }, 2000);
  };

  const handleRevokeKey = (id: string) => {
    setState(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key =>
        key.id === id ? { ...key, isActive: false } : key
      ),
    }));
  };

  const handleActivateKey = (id: string) => {
    setState(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key =>
        key.id === id ? { ...key, isActive: true } : key
      ),
    }));
  };

  const handleDeleteKey = (id: string) => {
    setState(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter(key => key.id !== id),
    }));
  };

  return (
    <div style={{ padding: SPACING.lg }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        <div>
          <h2 style={{ ...TYPOGRAPHY.heading2, marginBottom: SPACING.sm }}>
            API Keys
          </h2>
          <p style={{ ...TYPOGRAPHY.caption, color: COLORS.textSecondary }}>
            Manage authentication keys for your integrations and applications
          </p>
        </div>
        <button
          onClick={() => setState(prev => ({ ...prev, showNewKeyModal: true }))}
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            backgroundColor: COLORS.blue,
            color: COLORS.white,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            ...TYPOGRAPHY.body,
            fontWeight: '600',
          }}
        >
          + Create Key
        </button>
      </div>

      {/* API Keys List */}
      <div
        style={{
          display: 'grid',
          gap: SPACING.md,
        }}
      >
        {state.apiKeys.map(apiKey => (
          <div
            key={apiKey.id}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              padding: SPACING.lg,
              backgroundColor: apiKey.isActive ? COLORS.surface : COLORS.gray + '05',
              opacity: apiKey.isActive ? 1 : 0.7,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: SPACING.md,
              }}
            >
              <div>
                <h3
                  style={{
                    ...TYPOGRAPHY.body,
                    fontWeight: '600',
                    marginBottom: SPACING.xs,
                  }}
                >
                  {apiKey.name}
                </h3>
                <p
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                  }}
                >
                  {apiKey.maskedKey}
                </p>
              </div>
              <span
                style={{
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  backgroundColor: apiKey.isActive ? COLORS.green + '20' : COLORS.gray + '20',
                  color: apiKey.isActive ? COLORS.green : COLORS.gray,
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {apiKey.isActive ? 'ACTIVE' : 'REVOKED'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: SPACING.md,
                marginBottom: SPACING.md,
                paddingBottom: SPACING.md,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <div>
                <p
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    marginBottom: SPACING.xs,
                  }}
                >
                  Created
                </p>
                <p style={TYPOGRAPHY.body}>
                  {new Date(apiKey.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    marginBottom: SPACING.xs,
                  }}
                >
                  Last Used
                </p>
                <p style={TYPOGRAPHY.body}>
                  {apiKey.lastUsedAt
                    ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p
                  style={{
                    ...TYPOGRAPHY.caption,
                    color: COLORS.textSecondary,
                    marginBottom: SPACING.xs,
                  }}
                >
                  Usage Count
                </p>
                <p style={TYPOGRAPHY.body}>{apiKey.usageCount.toLocaleString()}</p>
              </div>
            </div>

            <div style={{ marginBottom: SPACING.md }}>
              <p
                style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.xs,
                }}
              >
                Scopes
              </p>
              <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
                {apiKey.scopes.map(scope => (
                  <span
                    key={scope}
                    style={{
                      display: 'inline-block',
                      padding: `${SPACING.xs} ${SPACING.sm}`,
                      backgroundColor: COLORS.blue + '20',
                      color: COLORS.blue,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
              {apiKey.isActive ? (
                <button
                  onClick={() => handleRevokeKey(apiKey.id)}
                  style={{
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    backgroundColor: COLORS.red + '20',
                    color: COLORS.red,
                    border: `1px solid ${COLORS.red}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Revoke
                </button>
              ) : (
                <button
                  onClick={() => handleActivateKey(apiKey.id)}
                  style={{
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    backgroundColor: COLORS.green + '20',
                    color: COLORS.green,
                    border: `1px solid ${COLORS.green}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  Reactivate
                </button>
              )}
              <button
                onClick={() => handleDeleteKey(apiKey.id)}
                style={{
                  padding: `${SPACING.xs} ${SPACING.sm}`,
                  backgroundColor: 'transparent',
                  color: COLORS.textSecondary,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Key Modal */}
      {state.showNewKeyModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() =>
            setState(prev => ({ ...prev, showNewKeyModal: false }))
          }
        >
          <div
            style={{
              backgroundColor: COLORS.background,
              borderRadius: '12px',
              padding: SPACING.xl,
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              style={{
                ...TYPOGRAPHY.heading2,
                marginBottom: SPACING.lg,
              }}
            >
              Create New API Key
            </h2>

            <div style={{ marginBottom: SPACING.lg }}>
              <label
                style={{
                  display: 'block',
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.sm,
                  fontWeight: '600',
                }}
              >
                Key Name
              </label>
              <input
                type="text"
                placeholder="e.g., My App, Production Server"
                value={state.newKeyName}
                onChange={e =>
                  setState(prev => ({ ...prev, newKeyName: e.target.value }))
                }
                style={{
                  width: '100%',
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  ...TYPOGRAPHY.body,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: SPACING.lg }}>
              <p
                style={{
                  ...TYPOGRAPHY.caption,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING.sm,
                  fontWeight: '600',
                }}
              >
                Scopes
              </p>
              <div style={{ display: 'grid', gap: SPACING.sm }}>
                {availableScopes.map(scope => (
                  <label
                    key={scope.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: SPACING.sm,
                      padding: SPACING.sm,
                      cursor: 'pointer',
                      borderRadius: '6px',
                      backgroundColor: state.selectedScopes.includes(scope.id)
                        ? COLORS.blue + '10'
                        : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={state.selectedScopes.includes(scope.id)}
                      onChange={() => handleToggleScope(scope.id)}
                      style={{
                        marginTop: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <div>
                      <p
                        style={{
                          ...TYPOGRAPHY.body,
                          fontWeight: '600',
                          marginBottom: '2px',
                        }}
                      >
                        {scope.label}
                      </p>
                      <p
                        style={{
                          ...TYPOGRAPHY.caption,
                          color: COLORS.textSecondary,
                        }}
                      >
                        {scope.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: SPACING.sm }}>
              <button
                onClick={() =>
                  setState(prev => ({ ...prev, showNewKeyModal: false }))
                }
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  backgroundColor: COLORS.surface,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateKey}
                disabled={state.isSaving || !state.newKeyName.trim()}
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  backgroundColor: COLORS.blue,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: state.isSaving || !state.newKeyName.trim() ? 'not-allowed' : 'pointer',
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                  opacity: state.isSaving || !state.newKeyName.trim() ? 0.6 : 1,
                }}
              >
                {state.isSaving ? 'Generating...' : 'Generate Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Key Display Modal */}
      {state.showGeneratedKeyModal && state.generatedKey && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() =>
            setState(prev => ({
              ...prev,
              showGeneratedKeyModal: false,
              generatedKey: null,
              newKeyName: '',
              selectedScopes: ['read'],
            }))
          }
        >
          <div
            style={{
              backgroundColor: COLORS.background,
              borderRadius: '12px',
              padding: SPACING.xl,
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              style={{
                ...TYPOGRAPHY.heading2,
                marginBottom: SPACING.md,
                color: COLORS.green,
              }}
            >
              ✓ API Key Created
            </h2>

            <p
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.textSecondary,
                marginBottom: SPACING.lg,
              }}
            >
              Save this key somewhere safe. You won't be able to see it again.
            </p>

            <div
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                padding: SPACING.md,
                marginBottom: SPACING.lg,
                fontFamily: 'monospace',
                fontSize: '13px',
                wordBreak: 'break-all',
              }}
            >
              {state.generatedKey}
            </div>

            <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: SPACING.lg }}>
              <button
                onClick={() => handleCopyKey(state.generatedKey || '')}
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  backgroundColor: COLORS.blue,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                }}
              >
                {state.copiedKeyId === state.generatedKey
                  ? '✓ Copied'
                  : 'Copy to Clipboard'}
              </button>
            </div>

            <button
              onClick={() =>
                setState(prev => ({
                  ...prev,
                  showGeneratedKeyModal: false,
                  generatedKey: null,
                  newKeyName: '',
                  selectedScopes: ['read'],
                }))
              }
              style={{
                width: '100%',
                padding: `${SPACING.sm} ${SPACING.md}`,
                backgroundColor: COLORS.surface,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                ...TYPOGRAPHY.body,
                fontWeight: '600',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
