'use client';

import React, { useState } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from './components-showcase';

// TypeScript Interfaces
interface Agent {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error' | 'paused';
  type: 'analyzer' | 'executor' | 'monitor' | 'scheduler';
  uptime: number; // minutes
  tasksCompleted: number;
  lastActive: string;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
}

interface AgentLog {
  id: string;
  agentId: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
}

interface PerformanceMetric {
  agentId: string;
  avgResponseTime: number; // ms
  successRate: number; // percentage
  errorRate: number; // percentage
  throughput: number; // tasks/hour
}

interface AgentRuntimeState {
  selectedAgent: string | null;
  filterStatus: 'all' | 'running' | 'idle' | 'error' | 'paused';
  logFilter: 'all' | 'info' | 'warning' | 'error' | 'debug';
  showConfigModal: boolean;
}

// Sample Data
const SAMPLE_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'Data Analyzer Pro',
    status: 'running',
    type: 'analyzer',
    uptime: 1440,
    tasksCompleted: 287,
    lastActive: '2 minutes ago',
    cpuUsage: 45,
    memoryUsage: 62,
  },
  {
    id: 'agent-002',
    name: 'Task Executor',
    status: 'running',
    type: 'executor',
    uptime: 960,
    tasksCompleted: 156,
    lastActive: '5 minutes ago',
    cpuUsage: 32,
    memoryUsage: 48,
  },
  {
    id: 'agent-003',
    name: 'System Monitor',
    status: 'running',
    type: 'monitor',
    uptime: 2880,
    tasksCompleted: 512,
    lastActive: '1 minute ago',
    cpuUsage: 28,
    memoryUsage: 55,
  },
  {
    id: 'agent-004',
    name: 'Report Generator',
    status: 'idle',
    type: 'analyzer',
    uptime: 480,
    tasksCompleted: 94,
    lastActive: '45 minutes ago',
    cpuUsage: 0,
    memoryUsage: 35,
  },
  {
    id: 'agent-005',
    name: 'Email Scheduler',
    status: 'paused',
    type: 'scheduler',
    uptime: 240,
    tasksCompleted: 42,
    lastActive: '2 hours ago',
    cpuUsage: 0,
    memoryUsage: 28,
  },
  {
    id: 'agent-006',
    name: 'Backup Manager',
    status: 'error',
    type: 'executor',
    uptime: 120,
    tasksCompleted: 18,
    lastActive: '12 minutes ago',
    cpuUsage: 5,
    memoryUsage: 42,
  },
];

const SAMPLE_LOGS: AgentLog[] = [
  {
    id: 'log-001',
    agentId: 'agent-001',
    timestamp: '2026-05-04 14:32:15',
    level: 'info',
    message: 'Successfully completed data analysis task #452',
  },
  {
    id: 'log-002',
    agentId: 'agent-001',
    timestamp: '2026-05-04 14:28:42',
    level: 'info',
    message: 'Processing new dataset with 5000 records',
  },
  {
    id: 'log-003',
    agentId: 'agent-002',
    timestamp: '2026-05-04 14:25:18',
    level: 'warning',
    message: 'Task execution took longer than expected (45s)',
  },
  {
    id: 'log-004',
    agentId: 'agent-003',
    timestamp: '2026-05-04 14:22:05',
    level: 'info',
    message: 'System health check passed. All services operational',
  },
  {
    id: 'log-005',
    agentId: 'agent-006',
    timestamp: '2026-05-04 14:18:30',
    level: 'error',
    message: 'Failed to connect to backup storage. Retrying in 30 seconds',
  },
  {
    id: 'log-006',
    agentId: 'agent-001',
    timestamp: '2026-05-04 14:15:12',
    level: 'debug',
    message: 'Cache hit ratio: 87% - performance optimized',
  },
  {
    id: 'log-007',
    agentId: 'agent-002',
    timestamp: '2026-05-04 14:12:48',
    level: 'info',
    message: 'Executed 23 tasks in parallel batch',
  },
];

const SAMPLE_METRICS: PerformanceMetric[] = [
  {
    agentId: 'agent-001',
    avgResponseTime: 245,
    successRate: 98.5,
    errorRate: 1.2,
    throughput: 287,
  },
  {
    agentId: 'agent-002',
    avgResponseTime: 312,
    successRate: 97.2,
    errorRate: 2.1,
    throughput: 156,
  },
  {
    agentId: 'agent-003',
    avgResponseTime: 89,
    successRate: 99.8,
    errorRate: 0.1,
    throughput: 512,
  },
  {
    agentId: 'agent-004',
    avgResponseTime: 1250,
    successRate: 96.0,
    errorRate: 3.2,
    throughput: 94,
  },
];

// Agent Status Badge
const AgentStatusBadge: React.FC<{ status: Agent['status'] }> = ({ status }) => {
  const statusMap = {
    running: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    idle: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
    error: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  };

  const { bg, text, dot } = statusMap[status];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bg} ${text} text-sm font-medium`}>
      <div className={`w-2 h-2 rounded-full ${dot}`}></div>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
};

// Agent Type Badge
const AgentTypeBadge: React.FC<{ type: Agent['type'] }> = ({ type }) => {
  const typeMap = {
    analyzer: 'bg-blue-50 text-blue-700 border border-blue-200',
    executor: 'bg-purple-50 text-purple-700 border border-purple-200',
    monitor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    scheduler: 'bg-orange-50 text-orange-700 border border-orange-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeMap[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

// Agent Card Component
const AgentCard: React.FC<{
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}> = ({ agent, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-purple-300'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
        <AgentStatusBadge status={agent.status} />
      </div>

      <AgentTypeBadge type={agent.type} />

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Uptime</p>
          <p className="font-medium text-gray-900">{agent.uptime}m</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Tasks</p>
          <p className="font-medium text-gray-900">{agent.tasksCompleted}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">CPU Usage</p>
          <p className="font-medium text-gray-900">{agent.cpuUsage}%</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Memory</p>
          <p className="font-medium text-gray-900">{agent.memoryUsage}%</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">Last active: {agent.lastActive}</p>
    </div>
  );
};

// Agent Header Component
const AgentHeader: React.FC<{
  totalAgents: number;
  onConfigClick: () => void;
}> = ({ totalAgents, onConfigClick }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Runtime</h1>
          <p className="text-gray-500 mt-1">{totalAgents} agents deployed and monitored</p>
        </div>
        <button
          onClick={onConfigClick}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          + Deploy Agent
        </button>
      </div>
    </div>
  );
};

// Agent List View Component
const AgentListView: React.FC<{
  agents: Agent[];
  selectedAgent: string | null;
  onSelectAgent: (agentId: string) => void;
}> = ({ agents, selectedAgent, onSelectAgent }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          isSelected={selectedAgent === agent.id}
          onClick={() => onSelectAgent(agent.id)}
        />
      ))}
    </div>
  );
};

// Filter Sidebar Component
const FilterSidebar: React.FC<{
  filterStatus: AgentRuntimeState['filterStatus'];
  onStatusChange: (status: AgentRuntimeState['filterStatus']) => void;
}> = ({ filterStatus, onStatusChange }) => {
  const statuses: Array<AgentRuntimeState['filterStatus']> = ['all', 'running', 'idle', 'error', 'paused'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 h-fit">
      <h3 className="font-semibold text-gray-900 mb-4">Filter by Status</h3>
      <div className="space-y-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === status
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status === 'all' ? 'All Agents' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

// Logs Display Component
const LogsDisplay: React.FC<{
  logs: AgentLog[];
  filterLevel: AgentRuntimeState['logFilter'];
}> = ({ logs, filterLevel }) => {
  const filteredLogs =
    filterLevel === 'all' ? logs : logs.filter((log) => log.level === filterLevel);

  const levelColorMap = {
    info: 'text-blue-700 bg-blue-50',
    warning: 'text-yellow-700 bg-yellow-50',
    error: 'text-red-700 bg-red-50',
    debug: 'text-gray-700 bg-gray-50',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Recent Logs</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredLogs.slice(0, 10).map((log) => (
          <div key={log.id} className="pb-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-start gap-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${levelColorMap[log.level]}`}
              >
                {log.level.toUpperCase()}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{log.message}</p>
                <p className="text-xs text-gray-400 mt-1">{log.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Performance Metrics Component
const PerformanceMetrics: React.FC<{
  selectedAgentId: string | null;
  metrics: PerformanceMetric[];
}> = ({ selectedAgentId, metrics }) => {
  const agentMetric = selectedAgentId
    ? metrics.find((m) => m.agentId === selectedAgentId)
    : metrics[0];

  if (!agentMetric) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <p className="text-gray-500 text-sm">Select an agent to view metrics</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        <MetricItem
          label="Avg Response Time"
          value={`${agentMetric.avgResponseTime}ms`}
          color="blue"
        />
        <MetricItem
          label="Success Rate"
          value={`${agentMetric.successRate.toFixed(1)}%`}
          color="green"
        />
        <MetricItem
          label="Error Rate"
          value={`${agentMetric.errorRate.toFixed(1)}%`}
          color="red"
        />
        <MetricItem
          label="Throughput"
          value={`${agentMetric.throughput}/hr`}
          color="purple"
        />
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string; value: string; color: string }> = ({
  label,
  value,
  color,
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`p-4 rounded-lg ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
};

// Configuration Modal Component
const ConfigurationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 p-6 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Deploy New Agent</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent Name
            </label>
            <input
              type="text"
              placeholder="e.g., Email Notifier"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent Type
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>Analyzer</option>
              <option>Executor</option>
              <option>Monitor</option>
              <option>Scheduler</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Configuration Script
            </label>
            <textarea
              placeholder="Paste your agent configuration here..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              Deploy Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function AgentRuntimePage() {
  const [state, setState] = useState<AgentRuntimeState>({
    selectedAgent: null,
    filterStatus: 'all',
    logFilter: 'all',
    showConfigModal: false,
  });

  const filteredAgents = SAMPLE_AGENTS.filter(
    (agent) => state.filterStatus === 'all' || agent.status === state.filterStatus
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <AgentHeader
          totalAgents={SAMPLE_AGENTS.length}
          onConfigClick={() => setState({ ...state, showConfigModal: true })}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <FilterSidebar
              filterStatus={state.filterStatus}
              onStatusChange={(status) => setState({ ...state, filterStatus: status })}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Agents Grid */}
            <AgentListView
              agents={filteredAgents}
              selectedAgent={state.selectedAgent}
              onSelectAgent={(agentId) =>
                setState({ ...state, selectedAgent: agentId })
              }
            />

            {/* Metrics and Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceMetrics
                selectedAgentId={state.selectedAgent}
                metrics={SAMPLE_METRICS}
              />
              <LogsDisplay logs={SAMPLE_LOGS} filterLevel={state.logFilter} />
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {state.showConfigModal && (
        <ConfigurationModal
          onClose={() => setState({ ...state, showConfigModal: false })}
        />
      )}
    </div>
  );
}
