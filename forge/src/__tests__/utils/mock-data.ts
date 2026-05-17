export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  verified: true,
  createdAt: '2026-01-01T00:00:00Z',
};

export const mockWorkflow = {
  id: 'workflow-1',
  name: 'Test Workflow',
  description: 'A test workflow',
  status: 'active' as const,
  agentIds: ['agent-1'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  executionCount: 10,
  successRate: 95,
};

export const mockAgent = {
  id: 'agent-1',
  name: 'Test Agent',
  description: 'A test agent',
  type: 'automation' as const,
  status: 'active' as const,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockAPIKey = {
  id: 'key-1',
  name: 'Test Key',
  key: 'sk_test_****',
  createdAt: '2026-01-01T00:00:00Z',
  lastUsed: '2026-05-01T00:00:00Z',
  status: 'active' as const,
};

export const mockStatistics = {
  workflows: 5,
  agents: 8,
  executions: 245,
  successRate: 94.2,
};

export const mockActivity = [
  {
    id: 'activity-1',
    type: 'workflow_execution' as const,
    title: 'Workflow: Email Campaign executed',
    timestamp: new Date().toISOString(),
    status: 'success' as const,
  },
  {
    id: 'activity-2',
    type: 'agent_created' as const,
    title: 'Agent: Data Processor created',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'pending' as const,
  },
  {
    id: 'activity-3',
    type: 'workflow_execution' as const,
    title: 'Workflow: Data Sync executed',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'error' as const,
  },
];

export const mockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

export const mockErrorResponse = {
  error: 'Test error message',
  code: 'TEST_ERROR',
  status: 400,
};

export const mockSuccessResponse = {
  success: true,
  data: mockUser,
  message: 'Operation successful',
};
