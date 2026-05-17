import React from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  agents: number;
  createdAt: string;
  updatedAt: string;
  progress: number;
  team: string[];
  tags: string[];
}

interface ProjectsState {
  projects: Project[];
  filterStatus: 'all' | 'active' | 'paused' | 'archived';
  searchQuery: string;
  showNewProjectModal: boolean;
  newProject: { name: string; description: string; team: string };
  errors: Record<string, string>;
  successMessage: string;
}

const ProjectsPage: React.FC = () => {
  const [state, setState] = React.useState<ProjectsState>({
    projects: [
      {
        id: '1',
        name: 'Customer Support Bot',
        description: 'AI-powered customer support agent for handling common inquiries',
        status: 'active',
        agents: 3,
        createdAt: '2026-04-15',
        updatedAt: '2026-05-03',
        progress: 85,
        team: ['scott@forge.ai', 'alex@forge.ai'],
        tags: ['Support', 'Customer Service', 'LLM'],
      },
      {
        id: '2',
        name: 'Data Processing Pipeline',
        description: 'Automated data ingestion and transformation pipeline',
        status: 'active',
        agents: 5,
        createdAt: '2026-03-20',
        updatedAt: '2026-05-02',
        progress: 100,
        team: ['scott@forge.ai', 'jordan@forge.ai', 'casey@forge.ai'],
        tags: ['Data', 'Automation', 'ETL'],
      },
      {
        id: '3',
        name: 'Content Generator',
        description: 'Multi-agent system for generating marketing content',
        status: 'paused',
        agents: 2,
        createdAt: '2026-04-01',
        updatedAt: '2026-04-28',
        progress: 60,
        team: ['scott@forge.ai'],
        tags: ['Content', 'Marketing', 'Writing'],
      },
      {
        id: '4',
        name: 'Analytics Dashboard',
        description: 'Real-time analytics and reporting system',
        status: 'active',
        agents: 4,
        createdAt: '2026-02-10',
        updatedAt: '2026-05-01',
        progress: 70,
        team: ['scott@forge.ai', 'morgan@forge.ai'],
        tags: ['Analytics', 'Reporting', 'Dashboard'],
      },
      {
        id: '5',
        name: 'Email Campaign Manager',
        description: 'Intelligent email campaign orchestration',
        status: 'archived',
        agents: 1,
        createdAt: '2026-01-05',
        updatedAt: '2026-03-15',
        progress: 40,
        team: ['scott@forge.ai'],
        tags: ['Email', 'Marketing', 'Archived'],
      },
    ],
    filterStatus: 'all',
    searchQuery: '',
    showNewProjectModal: false,
    newProject: { name: '', description: '', team: '' },
    errors: {},
    successMessage: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400 border border-green-700/50';
      case 'paused':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50';
      case 'archived':
        return 'bg-red-900/30 text-red-400 border border-red-700/50';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  };

  const filteredProjects = state.projects.filter((project) => {
    const matchesStatus = state.filterStatus === 'all' || project.status === state.filterStatus;
    const matchesSearch =
      project.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateProject = () => {
    const newErrors: Record<string, string> = {};
    if (!state.newProject.name.trim()) newErrors.name = 'Project name is required';
    if (!state.newProject.description.trim()) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setState((prev) => ({ ...prev, errors: newErrors }));
      return;
    }

    const newProj: Project = {
      id: String(state.projects.length + 1),
      name: state.newProject.name,
      description: state.newProject.description,
      status: 'active',
      agents: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      progress: 0,
      team: ['scott@forge.ai'],
      tags: [],
    };

    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
      showNewProjectModal: false,
      newProject: { name: '', description: '', team: '' },
      successMessage: `Project "${newProj.name}" created successfully!`,
      errors: {},
    }));

    setTimeout(() => {
      setState((prev) => ({ ...prev, successMessage: '' }));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="mt-2 text-slate-400">Manage all your AI agent projects in one place</p>
          </div>
          <button
            onClick={() => setState((prev) => ({ ...prev, showNewProjectModal: true }))}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* Success Message */}
      {state.successMessage && (
        <div className="mx-8 mt-4 rounded-lg bg-green-900/30 px-4 py-3 text-green-400 border border-green-700/50">
          ✓ {state.successMessage}
        </div>
      )}

      {/* Filters */}
      <div className="border-b border-slate-800 bg-slate-900/30 px-8 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {(['all', 'active', 'paused', 'archived'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setState((prev) => ({ ...prev, filterStatus: status }))}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  state.filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={state.searchQuery}
            onChange={(e) => setState((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="rounded-lg bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-blue-600 focus:outline-none w-full md:w-64"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg bg-slate-900 border border-slate-800 p-6 hover:border-slate-700 hover:bg-slate-900/80 transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{project.name}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {project.status.toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-4">{project.description}</p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Completion</span>
                  <span className="text-sm font-semibold text-blue-400">{project.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mb-4 text-sm text-slate-400 border-t border-slate-800 pt-4">
                <div className="flex justify-between">
                  <span>Agents:</span>
                  <span className="font-semibold text-slate-200">{project.agents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <span className="font-semibold text-slate-200">{project.updatedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Team:</span>
                  <span className="font-semibold text-slate-200">{project.team.length} members</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-slate-400">No projects found</p>
            <p className="text-slate-500 mt-2">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {state.showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Project</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                <input
                  type="text"
                  value={state.newProject.name}
                  onChange={(e) => {
                    setState((prev) => ({
                      ...prev,
                      newProject: { ...prev.newProject, name: e.target.value },
                      errors: { ...prev.errors, name: '' },
                    }));
                  }}
                  className="w-full rounded-lg bg-slate-800 px-4 py-2 text-slate-100 border border-slate-700 focus:border-blue-600 focus:outline-none"
                  placeholder="e.g., Customer Support Bot"
                />
                {state.errors.name && <p className="text-red-400 text-sm mt-1">{state.errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={state.newProject.description}
                  onChange={(e) => {
                    setState((prev) => ({
                      ...prev,
                      newProject: { ...prev.newProject, description: e.target.value },
                      errors: { ...prev.errors, description: '' },
                    }));
                  }}
                  className="w-full rounded-lg bg-slate-800 px-4 py-2 text-slate-100 border border-slate-700 focus:border-blue-600 focus:outline-none"
                  placeholder="Describe your project..."
                  rows={3}
                />
                {state.errors.description && (
                  <p className="text-red-400 text-sm mt-1">{state.errors.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState((prev) => ({ ...prev, showNewProjectModal: false }))}
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
