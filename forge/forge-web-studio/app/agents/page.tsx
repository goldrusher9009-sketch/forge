'use client';

import { useState, useCallback, useEffect } from 'react';
import { Layout, Card, CardHeader, CardTitle, CardContent, Button, Modal, Input, Textarea, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components';
import { Agent } from '@/lib/types';
import { useApi, apiCall } from '@/lib/hooks';
import { API_ENDPOINTS } from '@/lib/constants';

export default function AgentsPage() {
  const { data: agents = [], loading, error, refetch } = useApi<Agent[]>(API_ENDPOINTS.AGENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  });

  const handleAddAgent = useCallback(async () => {
    if (!formData.name || !formData.description) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCall(API_ENDPOINTS.AGENTS, {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          systemPrompt: formData.systemPrompt,
          model: formData.model,
          temperature: formData.temperature,
          maxTokens: formData.maxTokens,
          tools: [],
        }),
      });

      setFormData({
        name: '',
        description: '',
        systemPrompt: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
      });
      setIsModalOpen(false);
      await refetch();
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, refetch]);

  const handleDeleteAgent = useCallback(async (id: string) => {
    try {
      await apiCall(`${API_ENDPOINTS.AGENTS}/${id}`, {
        method: 'DELETE',
      });
      await refetch();
    } catch (err) {
      console.error('Failed to delete agent:', err);
    }
  }, [refetch]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
            <p className="mt-2 text-gray-600">Create and manage AI agents with custom configurations</p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Create Agent
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-gray-600">Loading agents...</p>
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

        {/* Agents Table */}
        {!loading && agents && agents.length > 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Tools</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map(agent => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{agent.name}</div>
                          <div className="text-sm text-gray-600">{agent.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.model}</TableCell>
                      <TableCell>{agent.temperature}</TableCell>
                      <TableCell>
                        <Badge variant="info" size="sm">{agent.tools.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="secondary" size="sm">Edit</Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteAgent(agent.id)}
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
                <p className="text-gray-600 mb-4">No agents created yet</p>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Create Your First Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Agent Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Agent"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Agent Name"
              placeholder="e.g., Data Analyzer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Textarea
              label="Description"
              placeholder="Brief description of what this agent does"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Textarea
              label="System Prompt"
              placeholder="Define the agent's behavior and instructions"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
            />
            <Input
              label="Model"
              placeholder="e.g., gpt-4"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
            <Input
              label="Temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
            />
            <Input
              label="Max Tokens"
              type="number"
              value={formData.maxTokens}
              onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddAgent} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
