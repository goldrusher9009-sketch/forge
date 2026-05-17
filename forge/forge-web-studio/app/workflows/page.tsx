'use client';

import { useState, useCallback } from 'react';
import { Layout, Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components';
import { Workflow, WorkflowStep } from '@/lib/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useApi, apiCall } from '@/lib/hooks';
import { API_ENDPOINTS } from '@/lib/constants';

export default function WorkflowsPage() {
  const { data: workflows = [], loading, error, refetch } = useApi<Workflow[]>(API_ENDPOINTS.WORKFLOWS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateWorkflow = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await apiCall(API_ENDPOINTS.WORKFLOWS, {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Workflow',
          description: 'Untitled workflow',
          steps: [],
          enabled: true,
        }),
      });
      await refetch();
    } catch (err) {
      console.error('Failed to create workflow:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  const handleDeleteWorkflow = useCallback(async (id: string) => {
    try {
      await apiCall(`${API_ENDPOINTS.WORKFLOWS}/${id}`, {
        method: 'DELETE',
      });
      await refetch();
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  }, [refetch]);

  const handleToggleWorkflow = useCallback(async (id: string, currentEnabled: boolean) => {
    try {
      await apiCall(`${API_ENDPOINTS.WORKFLOWS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      await refetch();
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
    }
  }, [refetch]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="mt-2 text-gray-600">Design and manage multi-step AI workflows with conditional logic</p>
          </div>
          <Button variant="primary" onClick={handleCreateWorkflow}>
            Create Workflow
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-600">Loading workflows...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="primary" onClick={refetch}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflows Table */}
        {!loading && workflows && workflows.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map(workflow => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{workflow.name}</div>
                          <div className="text-sm text-gray-600">{workflow.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{workflow.steps.length}</TableCell>
                      <TableCell>
                        <Badge variant={workflow.enabled ? 'success' : 'warning'} size="sm">
                          {workflow.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(workflow.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="secondary" size="sm">Edit</Button>
                        <Button
                          variant={workflow.enabled ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleWorkflow(workflow.id, workflow.enabled)}
                        >
                          {workflow.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No workflows created yet</p>
                <p className="text-sm text-gray-500 mb-6">Create your first workflow to start orchestrating AI agents and tasks</p>
                <Button variant="primary" onClick={handleCreateWorkflow}>
                  Create Your First Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflow Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Visual Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Design workflows visually by dragging and dropping workflow steps and connecting agents.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Drag-and-drop interface</li>
                <li>✓ Multiple agent orchestration</li>
                <li>✓ Data flow visualization</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conditional Logic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Add branching logic with success/failure handlers for robust workflow execution.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Success path branching</li>
                <li>✓ Error handling chains</li>
                <li>✓ Conditional step execution</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Define recovery strategies and fallback workflows for failed steps.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Retry policies</li>
                <li>✓ Fallback steps</li>
                <li>✓ Error notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Track workflow execution with detailed logs and performance metrics.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Real-time execution tracking</li>
                <li>✓ Performance analytics</li>
                <li>✓ Detailed audit logs</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
