import React from 'react';

interface DashboardState {
  projects: Array<{
    id: string;
    name: string;
    status: 'active' | 'paused' | 'archived';
    agents: number;
    lastModified: string;
    progress: number;
  }>;
  recentAgents: Array<{
    id: string;
    name: string;
    type: string;
    status: 'running' | 'idle' | 'error';
    uptime: string;
  }>;
  stats: {
    totalAgents: number;
    activeProjects: number;
    apiCallsToday: number;
    successRate: number;
  };
}

export const DashboardPage: React.FC = () => {
  const [state] = React.useState<DashboardState>({
    projects: [
      { id: '1', name: 'E-Commerce Assistant', status: 'active', agents: 3, lastModified: '2 hours ago', progress: 85 },
      { id: '2', name: 'Customer Support Bot', status: 'active', agents: 5, lastModified: '1 day ago', progress: 100 },
      { id: '3', name: 'Data Analysis Pipeline', status: 'paused', agents: 2, lastModified: '3 days ago', progress: 60 },
      { id: '4', name: 'Content Generation', status: 'active', agents: 4, lastModified: '5 hours ago', progress: 70 },
    ],
    recentAgents: [
      { id: 'a1', name: 'Product Recommender', type: 'LLM', status: 'running', uptime: '42h 18m' },
      { id: 'a2', name: 'Email Classifier', type: 'Classifier', status: 'running', uptime: '128h 45m' },
      { id: 'a3', name: 'Data Validator', type: 'Validator', status: 'idle', uptime: '0h 12m' },
      { id: 'a4', name: 'Report Generator', type: 'Generator', status: 'error', uptime: '0h 5m' },
    ],
    stats: {
      totalAgents: 14,
      activeProjects: 3,
      apiCallsToday: 45230,
      successRate: 98.7,
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return 'bg-green-900/30 text-green-400';
      case 'idle':
      case 'paused':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'error':
      case 'archived':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-slate-900/30 text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return '▶️';
      case 'idle':
        return '⏸️';
      case 'error':
        return '❌';
      case 'active':
        return '✓';
      default:
        return '•';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Dashboard</h1>
          <p className="text-slate-400">Welcome back, Scott! Here's your workspace overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Agents', value: state.stats.totalAgents, icon: '🤖', color: 'blue' },
            { label: 'Active Projects', value: state.stats.activeProjects, icon: '📁', color: 'purple' },
            { label: 'API Calls (24h)', value: `${(state.stats.apiCallsToday / 1000).toFixed(1)}K`, icon: '📡', color: 'green' },
            { label: 'Success Rate', value: `${state.stats.successRate}%`, icon: '✓', color: 'orange' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-lg border border-slate-600 bg-gradient-to-br ${
                stat.color === 'blue' ? 'from-blue-900/20 to-blue-800/10' :
                stat.color === 'purple' ? 'from-purple-900/20 to-purple-800/10' :
                stat.color === 'green' ? 'from-green-900/20 to-green-800/10' :
                'from-orange-900/20 to-orange-800/10'
              } hover:border-slate-500 transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <span className="text-4xl opacity-20">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-lg border border-slate-600 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📁</span> Your Projects
                </h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition">
                  + New Project
                </button>
              </div>

              <div className="space-y-4">
                {state.projects.map((project) => (
                  <div key={project.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-slate-500 transition cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{project.name}</h3>
                        <p className="text-xs text-slate-400">
                          {project.agents} agent{project.agents !== 1 ? 's' : ''} • Modified {project.lastModified}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(project.status)}`}>
                        {project.status === 'active' ? '✓ Active' : project.status === 'paused' ? '⏸️ Paused' : '📦 Archived'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{project.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg border border-slate-600 p-6">
              <h2 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h2>
              <div className="space-y-3">
                {[
                  { icon: '🤖', label: 'Create Agent', href: '/agents/new' },
                  { icon: '📁', label: 'New Project', href: '/projects/new' },
                  { icon: '📊', label: 'View Analytics', href: '/analytics' },
                  { icon: '📚', label: 'Read Docs', href: '/docs' },
                  { icon: '🎓', label: 'Tutorials', href: '/tutorials' },
                  { icon: '💬', label: 'Get Support', href: '/contact' },
                ].map((action, idx) => (
                  <a
                    key={idx}
                    href={action.href}
                    className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-600/50 rounded-lg border border-slate-600 hover:border-slate-500 transition text-sm text-slate-300 hover:text-white"
                  >
                    <span className="text-lg">{action.icon}</span>
                    {action.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Upgrade Prompt */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 rounded-lg border border-blue-500/30 p-6">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-xl">🚀</span> Upgrade to Pro
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Unlock unlimited agents, advanced analytics, and priority support.
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Recent Agents */}
        <div className="mt-8">
          <div className="bg-slate-800/50 rounded-lg border border-slate-600 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">🤖</span> Recent Agents
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {state.recentAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-slate-500 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
                      <p className="text-xs text-slate-400">{agent.type}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(agent.status)}`}>
                      <span>{getStatusIcon(agent.status)}</span>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Uptime: {agent.uptime}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-lg border border-slate-600 p-6">
              <h2 className="text-xl font-bold text-white mb-6">📋 Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { type: 'agent_created', description: 'Created new agent "Email Classifier"', time: '2 hours ago', icon: '➕' },
                  { type: 'project_updated', description: 'Updated "E-Commerce Assistant" project', time: '4 hours ago', icon: '✏️' },
                  { type: 'agent_error', description: 'Agent "Report Generator" encountered an error', time: '1 day ago', icon: '⚠️' },
                  { type: 'deployment', description: 'Successfully deployed "Customer Support Bot"', time: '3 days ago', icon: '🚀' },
                  { type: 'upgrade', description: 'Upgraded to Pro plan', time: '1 week ago', icon: '⬆️' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b border-slate-700 last:border-0">
                    <span className="text-xl">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-300">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-600 p-6">
            <h2 className="text-lg font-bold text-white mb-6">🟢 System Status</h2>
            <div className="space-y-4">
              {[
                { service: 'API Gateway', status: 'operational', icon: '🟢' },
                { service: 'Agent Runtime', status: 'operational', icon: '🟢' },
                { service: 'Database', status: 'operational', icon: '🟢' },
                { service: 'Analytics', status: 'operational', icon: '🟢' },
                { service: 'Webhooks', status: 'operational', icon: '🟢' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{item.service}</span>
                  <span className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="text-green-400 font-medium">{item.status}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                All systems operational • Last incident 30 days ago
              </p>
              <a href="/status" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
                View detailed status →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
