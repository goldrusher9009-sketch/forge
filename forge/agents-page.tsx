import React from 'react';

interface Agent {
  id: string;
  name: string;
  type: 'assistant' | 'researcher' | 'analyst' | 'coordinator';
  description: string;
  status: 'running' | 'idle' | 'error';
  uptime: string;
  projectId: string;
  projectName: string;
  lastActive: string;
  apiCalls: number;
  successRate: number;
  version: string;
}

interface AgentsState {
  agents: Agent[];
  filterType: 'all' | 'assistant' | 'researcher' | 'analyst' | 'coordinator';
  filterStatus: 'all' | 'running' | 'idle' | 'error';
  searchQuery: string;
  selectedAgent: Agent | null;
  showDetailModal: boolean;
  successMessage: string;
}

const AgentsPage: React.FC = () => {
  const [state, setState] = React.useState<AgentsState>({
    agents: [
      {
        id: 'agent-1',
        name: 'Support Assistant',
        type: 'assistant',
        description: 'Handles customer inquiries and provides first-line support',
        status: 'running',
        uptime: '99.8%',
        projectId: '1',
        projectName: 'Customer Support Bot',
        lastActive: '2 minutes ago',
        apiCalls: 1250,
        successRate: 98.5,
        version: '2.1.0',
      },
      {
        id: 'agent-2',
        name: 'Data Analyst',
        type: 'analyst',
        description: 'Analyzes incoming data and generates insights',
        status: 'running',
        uptime: '99.9%',
        projectId: '2',
        projectName: 'Data Processing Pipeline',
        lastActive: '1 minute ago',
        apiCalls: 3420,
        successRate: 99.2,
        version: '1.8.5',
      },
      {
        id: 'agent-3',
        name: 'Research Bot',
        type: 'researcher',
        description: 'Performs web research and gathers information',
        status: 'idle',
        uptime: '98.5%',
        projectId: '3',
        projectName: 'Content Generator',
        lastActive: '4 hours ago',
        apiCalls: 580,
        successRate: 97.1,
        version: '1.5.2',
      },
      {
        id: 'agent-4',
        name: 'Project Coordinator',
        type: 'coordinator',
        description: 'Manages project workflows and task orchestration',
        status: 'running',
        uptime: '99.6%',
        projectId: '4',
        projectName: 'Analytics Dashboard',
        lastActive: '5 minutes ago',
        apiCalls: 2100,
        successRate: 99.8,
        version: '2.0.3',
      },
      {
        id: 'agent-5',
        name: 'Email Campaign Agent',
        type: 'assistant',
        description: 'Manages and optimizes email campaigns',
        status: 'error',
        uptime: '85.2%',
        projectId: '5',
        projectName: 'Email Campaign Manager',
        lastActive: '2 hours ago',
        apiCalls: 340,
        successRate: 92.3,
        version: '1.2.1',
      },
      {
        id: 'agent-6',
        name: 'Content Writer',
        type: 'assistant',
        description: 'Generates marketing and promotional content',
        status: 'running',
        uptime: '99.3%',
        projectId: '3',
        projectName: 'Content Generator',
        lastActive: '30 seconds ago',
        apiCalls: 890,
        successRate: 96.8,
        version: '1.9.4',
      },
    ],
    filterType: 'all',
    filterStatus: 'all',
    searchQuery: '',
    selectedAgent: null,
    showDetailModal: false,
    successMessage: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-900/30 text-green-400';
      case 'idle':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'error':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assistant':
        return 'bg-blue-900/30 text-blue-400';
      case 'researcher':
        return 'bg-purple-900/30 text-purple-400';
      case 'analyst':
        return 'bg-cyan-900/30 text-cyan-400';
      case 'coordinator':
        return 'bg-orange-900/30 text-orange-400';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  };

  const filteredAgents = state.agents.filter((agent) => {
    const matchesType = state.filterType === 'all' || agent.type === state.filterType;
    const matchesStatus = state.filterStatus === 'all' || agent.status === state.filterStatus;
    const matchesSearch = agent.name.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-8 py-8">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="mt-2 text-slate-400">Monitor and manage all your AI agents</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-slate-800 bg-slate-900/30 px-8 py-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Total Agents</p>
            <p className="text-2xl font-bold mt-1">{state.agents.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Running</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {state.agents.filter((a) => a.status === 'running').length}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Idle</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              {state.agents.filter((a) => a.status === 'idle').length}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Errors</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {state.agents.filter((a) => a.status === 'error').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-slate-800 bg-slate-900/30 px-8 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setState((prev) => ({ ...prev, filterType: 'all' }))}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition ${
                state.filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Types
            </button>
            {(['assistant', 'researcher', 'analyst', 'coordinator'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setState((prev) => ({ ...prev, filterType: type }))}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition ${
                  state.filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search agents..."
            value={state.searchQuery}
            onChange={(e) => setState((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="rounded-lg bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-blue-600 focus:outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Agents Table */}
      <div className="p-8">
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Project</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Uptime</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Success Rate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-xs text-slate-500">{agent.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getTypeColor(agent.type)}`}>
                      {agent.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{agent.projectName}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">{agent.uptime}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{agent.successRate}%</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        setState((prev) => ({ ...prev, selectedAgent: agent, showDetailModal: true }))
                      }
                      className="text-blue-400 hover:text-blue-300 transition font-medium text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-slate-400">No agents found</p>
            <p className="text-slate-500 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {state.showDetailModal && state.selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{state.selectedAgent.name}</h2>
                <p className="text-slate-400 mt-1">{state.selectedAgent.description}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded ${getStatusColor(state.selectedAgent.status)}`}>
                {state.selectedAgent.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Type</p>
                <p className="font-semibold mt-1">{state.selectedAgent.type.toUpperCase()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Project</p>
                <p className="font-semibold mt-1">{state.selectedAgent.projectName}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Uptime</p>
                <p className="font-semibold mt-1">{state.selectedAgent.uptime}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Success Rate</p>
                <p className="font-semibold mt-1">{state.selectedAgent.successRate}%</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">API Calls</p>
                <p className="font-semibold mt-1">{state.selectedAgent.apiCalls.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm">Last Active</p>
                <p className="font-semibold mt-1">{state.selectedAgent.lastActive}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState((prev) => ({ ...prev, showDetailModal: false }))}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Close
              </button>
              <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition">
                Manage Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
