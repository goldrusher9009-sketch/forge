'use client';

import { Layout, Card, CardHeader, CardTitle, CardContent, Button, Spinner } from '@/components';
import { useApi } from '@/lib/hooks';
import { API_ENDPOINTS } from '@/lib/constants';

interface DashboardStats {
  activeWorkflows: number;
  completedTasks: number;
  queuedTasks: number;
}

export default function Home() {
  const { data: stats, loading } = useApi<DashboardStats>(
    API_ENDPOINTS.DASHBOARD,
    { autoFetch: true }
  );

  const dashboardStats = stats || {
    activeWorkflows: 0,
    completedTasks: 0,
    queuedTasks: 0,
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forge Web Studio</h1>
          <p className="mt-2 text-lg text-gray-600">
            AI-powered workflow automation and execution platform
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">
                  {loading ? <Spinner size="sm" /> : dashboardStats.activeWorkflows}
                </div>
                <p className="mt-2 text-gray-600">Active Workflows</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">
                  {loading ? <Spinner size="sm" /> : dashboardStats.completedTasks}
                </div>
                <p className="mt-2 text-gray-600">Completed Tasks</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">
                  {loading ? <Spinner size="sm" /> : dashboardStats.queuedTasks}
                </div>
                <p className="mt-2 text-gray-600">Queued Tasks</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Welcome to Forge Web Studio</h3>
              <p className="text-gray-600 mb-4">
                This is the central hub for managing AI agents, workflows, and task orchestration.
                Use the navigation menu to explore different sections.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Available Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Create and manage AI agents</li>
                <li>Design and execute workflows</li>
                <li>Monitor task execution and queue status</li>
                <li>View detailed execution history</li>
              </ul>
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="primary">Create Workflow</Button>
              <Button variant="secondary">View Documentation</Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create and configure AI agents with custom system prompts, models, and tools.
              </p>
              <Button variant="secondary" size="sm">
                Manage Agents
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Design multi-step workflows with conditional logic and error handling.
              </p>
              <Button variant="secondary" size="sm">
                Create Workflow
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Monitor task execution with real-time status updates and performance metrics.
              </p>
              <Button variant="secondary" size="sm">
                View Queue
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Review detailed logs and analytics from previous workflow executions.
              </p>
              <Button variant="secondary" size="sm">
                View History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
