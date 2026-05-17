import React from 'react';

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'inactive';
  joinedAt: string;
}

interface WorkspaceInvite {
  email: string;
  role: 'admin' | 'member';
}

interface WorkspaceState {
  workspaceName: string;
  workspaceSlug: string;
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  showInviteModal: boolean;
  inviteEmail: string;
  inviteRole: 'admin' | 'member';
  showRemoveModal: boolean;
  removingMemberId: string | null;
  errors: Record<string, string>;
  successMessage: string;
}

const WorkspacePage: React.FC = () => {
  const [state, setState] = React.useState<WorkspaceState>({
    workspaceName: 'Forge Labs',
    workspaceSlug: 'forge-labs',
    members: [
      {
        id: '1',
        name: 'Scott Chen',
        email: 'scott@forge.ai',
        role: 'owner',
        status: 'active',
        joinedAt: '2026-01-10',
      },
      {
        id: '2',
        name: 'Alex Rodriguez',
        email: 'alex@forge.ai',
        role: 'admin',
        status: 'active',
        joinedAt: '2026-02-15',
      },
      {
        id: '3',
        name: 'Jordan Smith',
        email: 'jordan@forge.ai',
        role: 'member',
        status: 'active',
        joinedAt: '2026-03-01',
      },
      {
        id: '4',
        name: 'Casey Parker',
        email: 'casey@forge.ai',
        role: 'member',
        status: 'active',
        joinedAt: '2026-03-15',
      },
      {
        id: '5',
        name: 'Morgan Lee',
        email: 'morgan@forge.ai',
        role: 'member',
        status: 'invited',
        joinedAt: '2026-05-01',
      },
    ],
    invites: [
      { email: 'morgan@forge.ai', role: 'member' },
      { email: 'alex.new@forge.ai', role: 'admin' },
    ],
    showInviteModal: false,
    inviteEmail: '',
    inviteRole: 'member',
    showRemoveModal: false,
    removingMemberId: null,
    errors: {},
    successMessage: '',
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-900/30 text-red-400';
      case 'admin':
        return 'bg-orange-900/30 text-orange-400';
      case 'member':
        return 'bg-blue-900/30 text-blue-400';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400';
      case 'invited':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'inactive':
        return 'bg-slate-700/50 text-slate-400';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  };

  const handleSendInvite = () => {
    const newErrors: Record<string, string> = {};
    if (!state.inviteEmail.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.inviteEmail)) {
      newErrors.email = 'Invalid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setState((prev) => ({ ...prev, errors: newErrors }));
      return;
    }

    const newInvite: WorkspaceInvite = {
      email: state.inviteEmail,
      role: state.inviteRole,
    };

    setState((prev) => ({
      ...prev,
      invites: [...prev.invites, newInvite],
      showInviteModal: false,
      inviteEmail: '',
      inviteRole: 'member',
      errors: {},
      successMessage: `Invitation sent to ${state.inviteEmail}`,
    }));

    setTimeout(() => {
      setState((prev) => ({ ...prev, successMessage: '' }));
    }, 3000);
  };

  const handleRemoveMember = () => {
    if (!state.removingMemberId) return;

    setState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== state.removingMemberId),
      showRemoveModal: false,
      removingMemberId: null,
      successMessage: 'Member removed from workspace',
    }));

    setTimeout(() => {
      setState((prev) => ({ ...prev, successMessage: '' }));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-8 py-8">
        <div>
          <h1 className="text-3xl font-bold">Workspace Settings</h1>
          <p className="mt-2 text-slate-400">Manage your workspace members and settings</p>
        </div>
      </div>

      {/* Success Message */}
      {state.successMessage && (
        <div className="mx-8 mt-4 rounded-lg bg-green-900/30 px-4 py-3 text-green-400 border border-green-700/50">
          ✓ {state.successMessage}
        </div>
      )}

      {/* Workspace Info Section */}
      <div className="border-b border-slate-800 px-8 py-8">
        <h2 className="text-xl font-bold mb-6">Workspace Information</h2>
        <div className="grid gap-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Workspace Name</label>
            <input
              type="text"
              value={state.workspaceName}
              onChange={(e) => setState((prev) => ({ ...prev, workspaceName: e.target.value }))}
              className="w-full rounded-lg bg-slate-800 px-4 py-2 text-slate-100 border border-slate-700 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Workspace Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">forge.ai/</span>
              <input
                type="text"
                value={state.workspaceSlug}
                onChange={(e) => setState((prev) => ({ ...prev, workspaceSlug: e.target.value }))}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-slate-100 border border-slate-700 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition">
            Save Changes
          </button>
        </div>
      </div>

      {/* Members Section */}
      <div className="border-b border-slate-800 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Members ({state.members.length})</h2>
          <button
            onClick={() => setState((prev) => ({ ...prev, showInviteModal: true }))}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
          >
            + Invite Member
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {state.members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-semibold">{member.name}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getRoleColor(member.role)}`}>
                      {member.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(member.status)}`}>
                      {member.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{member.joinedAt}</td>
                  <td className="px-6 py-4">
                    {member.role !== 'owner' && (
                      <button
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            showRemoveModal: true,
                            removingMemberId: member.id,
                          }))
                        }
                        className="text-red-400 hover:text-red-300 transition font-medium text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites Section */}
      {state.invites.length > 0 && (
        <div className="border-b border-slate-800 px-8 py-8">
          <h2 className="text-xl font-bold mb-6">Pending Invitations ({state.invites.length})</h2>
          <div className="space-y-3">
            {state.invites.map((invite) => (
              <div key={invite.email} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{invite.email}</p>
                  <p className="text-sm text-slate-400">
                    Invited as <span className="text-slate-300 font-semibold">{invite.role.toUpperCase()}</span>
                  </p>
                </div>
                <button className="text-red-400 hover:text-red-300 transition font-medium text-sm">Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="px-8 py-8">
        <h2 className="text-xl font-bold mb-6 text-red-400">Danger Zone</h2>
        <div className="bg-red-900/10 border border-red-700/50 rounded-lg p-6">
          <p className="text-sm text-slate-400 mb-4">
            Deleting a workspace is permanent and cannot be undone. All projects, agents, and data will be lost.
          </p>
          <button className="rounded-lg bg-red-600/20 border border-red-600 px-4 py-2 font-semibold text-red-400 hover:bg-red-600/30 transition">
            Delete Workspace
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {state.showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Invite Team Member</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={state.inviteEmail}
                  onChange={(e) => {
                    setState((prev) => ({
                      ...prev,
                      inviteEmail: e.target.value,
                      errors: { ...prev.errors, email: '' },
                    }));
                  }}
                  className="w-full rounded-lg bg-slate-800 px-4 py-2 text-slate-100 border border-slate-700 focus:border-blue-600 focus:outline-none"
                  placeholder="user@company.com"
                />
                {state.errors.email && <p className="text-red-400 text-sm mt-1">{state.errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select
                  value={state.inviteRole}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      inviteRole: e.target.value as 'admin' | 'member',
                    }))
                  }
                  className="w-full rounded-lg bg-slate-800 px-4 py-2 text-slate-100 border border-slate-700 focus:border-blue-600 focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState((prev) => ({ ...prev, showInviteModal: false }))}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {state.showRemoveModal && state.removingMemberId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Remove Member?</h2>
            <p className="text-slate-400 mb-6">
              Are you sure you want to remove this member from the workspace? They will lose access to all projects and resources.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, showRemoveModal: false, removingMemberId: null }))
                }
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
