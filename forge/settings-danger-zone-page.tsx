'use client';

import React, { useState } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from './design-tokens';

interface DangerZoneState {
  showDeleteConfirmModal: boolean;
  deleteConfirmText: string;
  deleteConfirmInput: string;
  isDeleting: boolean;
  exportedDataUrl: string | null;
  showExportModal: boolean;
}

const DangerZonePage: React.FC = () => {
  const [state, setState] = useState<DangerZoneState>({
    showDeleteConfirmModal: false,
    deleteConfirmText: 'I understand this action cannot be undone',
    deleteConfirmInput: '',
    isDeleting: false,
    exportedDataUrl: null,
    showExportModal: false,
  });

  const handleExportData = () => {
    setState(prev => ({ ...prev, isDeleting: true }));
    setTimeout(() => {
      const mockData = {
        exportDate: new Date().toISOString(),
        account: {
          email: 'goldrusher9009@gmail.com',
          createdAt: '2025-01-15',
        },
        projects: [
          { id: '1', name: 'Project Alpha', agents: 3 },
          { id: '2', name: 'Project Beta', agents: 2 },
        ],
        agents: [
          { id: 'a1', name: 'Analyzer-1', type: 'analyzer' },
          { id: 'a2', name: 'Executor-1', type: 'executor' },
        ],
      };

      const dataStr = JSON.stringify(mockData, null, 2);
      const dataUrl = 'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      setState(prev => ({
        ...prev,
        exportedDataUrl: dataUrl,
        showExportModal: true,
        isDeleting: false,
      }));
    }, 800);
  };

  const handleDownloadExport = () => {
    if (state.exportedDataUrl) {
      const link = document.createElement('a');
      link.href = state.exportedDataUrl;
      link.download = `forge-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteAccount = () => {
    if (state.deleteConfirmInput !== 'delete my account') return;

    setState(prev => ({ ...prev, isDeleting: true }));
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        showDeleteConfirmModal: false,
        deleteConfirmInput: '',
        isDeleting: false,
      }));
      // In real app, would redirect to login or home page
      alert('Account deleted successfully. Redirecting to home page.');
    }, 1000);
  };

  return (
    <div
      style={{
        padding: SPACING.lg,
        backgroundColor: COLORS.red + '05',
      }}
    >
      <div
        style={{
          borderRadius: '12px',
          padding: SPACING.lg,
          backgroundColor: COLORS.red + '10',
          borderLeft: `4px solid ${COLORS.red}`,
          marginBottom: SPACING.xl,
        }}
      >
        <h2
          style={{
            ...TYPOGRAPHY.heading2,
            color: COLORS.red,
            marginBottom: SPACING.sm,
          }}
        >
          ⚠️ Danger Zone
        </h2>
        <p
          style={{
            ...TYPOGRAPHY.body,
            color: COLORS.textSecondary,
          }}
        >
          These actions are irreversible and will have serious consequences. Please proceed with caution.
        </p>
      </div>

      {/* Export Data */}
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
          backgroundColor: COLORS.surface,
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
              Export Your Data
            </h3>
            <p
              style={{
                ...TYPOGRAPHY.caption,
                color: COLORS.textSecondary,
              }}
            >
              Download a copy of all your data in JSON format. This includes projects, agents, settings, and metadata.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportData}
          disabled={state.isDeleting}
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            backgroundColor: COLORS.blue,
            color: COLORS.white,
            border: 'none',
            borderRadius: '6px',
            cursor: state.isDeleting ? 'not-allowed' : 'pointer',
            ...TYPOGRAPHY.body,
            fontWeight: '600',
            opacity: state.isDeleting ? 0.6 : 1,
          }}
        >
          {state.isDeleting ? 'Preparing Export...' : '↓ Export Data'}
        </button>
      </div>

      {/* Deactivate Account */}
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
          backgroundColor: COLORS.surface,
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
              Deactivate Account
            </h3>
            <p
              style={{
                ...TYPOGRAPHY.caption,
                color: COLORS.textSecondary,
              }}
            >
              Temporarily disable your account. You can reactivate it anytime within 30 days by logging back in.
            </p>
          </div>
        </div>

        <button
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            backgroundColor: COLORS.orange + '20',
            color: COLORS.orange,
            border: `1px solid ${COLORS.orange}`,
            borderRadius: '6px',
            cursor: 'pointer',
            ...TYPOGRAPHY.body,
            fontWeight: '600',
          }}
        >
          Deactivate Account
        </button>
      </div>

      {/* Transfer Ownership */}
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
          backgroundColor: COLORS.surface,
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
              Transfer Workspace Ownership
            </h3>
            <p
              style={{
                ...TYPOGRAPHY.caption,
                color: COLORS.textSecondary,
              }}
            >
              Transfer all projects, agents, and workspace data to another team member. You will become a regular member.
            </p>
          </div>
        </div>

        <button
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            backgroundColor: COLORS.orange + '20',
            color: COLORS.orange,
            border: `1px solid ${COLORS.orange}`,
            borderRadius: '6px',
            cursor: 'pointer',
            ...TYPOGRAPHY.body,
            fontWeight: '600',
          }}
        >
          Transfer Ownership
        </button>
      </div>

      {/* Delete Everything */}
      <div
        style={{
          border: `2px solid ${COLORS.red}`,
          borderRadius: '8px',
          padding: SPACING.lg,
          backgroundColor: COLORS.red + '05',
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
                color: COLORS.red,
              }}
            >
              Delete Account & All Data
            </h3>
            <p
              style={{
                ...TYPOGRAPHY.caption,
                color: COLORS.textSecondary,
              }}
            >
              Permanently delete your account, all projects, agents, workspaces, and settings. This action cannot be undone.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setState(prev => ({ ...prev, showDeleteConfirmModal: true }))
          }
          style={{
            padding: `${SPACING.sm} ${SPACING.md}`,
            backgroundColor: COLORS.red,
            color: COLORS.white,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            ...TYPOGRAPHY.body,
            fontWeight: '600',
          }}
        >
          Delete Everything
        </button>
      </div>

      {/* Export Confirmation Modal */}
      {state.showExportModal && (
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
              showExportModal: false,
              exportedDataUrl: null,
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
              ✓ Export Ready
            </h2>

            <p
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.textSecondary,
                marginBottom: SPACING.lg,
              }}
            >
              Your data export is ready to download. The file contains all your projects, agents, and settings.
            </p>

            <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: SPACING.lg }}>
              <button
                onClick={handleDownloadExport}
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  backgroundColor: COLORS.green,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                }}
              >
                ↓ Download Export
              </button>
            </div>

            <button
              onClick={() =>
                setState(prev => ({
                  ...prev,
                  showExportModal: false,
                  exportedDataUrl: null,
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

      {/* Delete Account Confirmation Modal */}
      {state.showDeleteConfirmModal && (
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
            setState(prev => ({ ...prev, showDeleteConfirmModal: false }))
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
                color: COLORS.red,
              }}
            >
              ⚠️ Delete Account?
            </h2>

            <div
              style={{
                backgroundColor: COLORS.red + '10',
                borderLeft: `4px solid ${COLORS.red}`,
                padding: SPACING.md,
                borderRadius: '6px',
                marginBottom: SPACING.lg,
              }}
            >
              <p
                style={{
                  ...TYPOGRAPHY.body,
                  color: COLORS.red,
                  fontWeight: '600',
                  marginBottom: SPACING.xs,
                }}
              >
                This will:
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: COLORS.textSecondary,
                }}
              >
                <li style={{ ...TYPOGRAPHY.caption, marginBottom: SPACING.xs }}>
                  Delete your account permanently
                </li>
                <li style={{ ...TYPOGRAPHY.caption, marginBottom: SPACING.xs }}>
                  Remove all projects and agents
                </li>
                <li style={{ ...TYPOGRAPHY.caption, marginBottom: SPACING.xs }}>
                  Erase all data and backups
                </li>
                <li style={{ ...TYPOGRAPHY.caption }}>
                  Cannot be undone
                </li>
              </ul>
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
                To confirm, type: <strong>"delete my account"</strong>
              </p>
              <input
                type="text"
                placeholder='Type "delete my account"'
                value={state.deleteConfirmInput}
                onChange={e =>
                  setState(prev => ({
                    ...prev,
                    deleteConfirmInput: e.target.value,
                  }))
                }
                style={{
                  width: '100%',
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  ...TYPOGRAPHY.body,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  fontWeight: '600',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: SPACING.sm }}>
              <button
                onClick={() =>
                  setState(prev => ({
                    ...prev,
                    showDeleteConfirmModal: false,
                    deleteConfirmInput: '',
                  }))
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
                onClick={handleDeleteAccount}
                disabled={
                  state.deleteConfirmInput !== 'delete my account' || state.isDeleting
                }
                style={{
                  flex: 1,
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  backgroundColor: COLORS.red,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor:
                    state.deleteConfirmInput !== 'delete my account' || state.isDeleting
                      ? 'not-allowed'
                      : 'pointer',
                  ...TYPOGRAPHY.body,
                  fontWeight: '600',
                  opacity:
                    state.deleteConfirmInput !== 'delete my account' || state.isDeleting
                      ? 0.6
                      : 1,
                }}
              >
                {state.isDeleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DangerZonePage;
