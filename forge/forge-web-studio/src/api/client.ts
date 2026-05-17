import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError } from '@/types';

class ForgeApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          details: error.response?.data,
        };
        return Promise.reject(apiError);
      }
    );
  }

  // Health & Status
  async healthCheck(): Promise<string> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getStatus() {
    const response = await this.client.get('/status');
    return response.data;
  }

  // Agent endpoints
  async listAgents() {
    const response = await this.client.get('/api/v1/agents');
    return response.data;
  }

  async getAgent(id: string) {
    const response = await this.client.get(`/api/v1/agents/${id}`);
    return response.data;
  }

  async createAgent(agent: any) {
    const response = await this.client.post('/api/v1/agents', agent);
    return response.data;
  }

  async updateAgent(id: string, agent: any) {
    const response = await this.client.put(`/api/v1/agents/${id}`, agent);
    return response.data;
  }

  async deleteAgent(id: string) {
    await this.client.delete(`/api/v1/agents/${id}`);
  }

  async enableAgent(id: string) {
    const response = await this.client.post(`/api/v1/agents/${id}/enable`);
    return response.data;
  }

  async disableAgent(id: string) {
    const response = await this.client.post(`/api/v1/agents/${id}/disable`);
    return response.data;
  }

  async getAgentStats(id: string) {
    const response = await this.client.get(`/api/v1/agents/${id}/stats`);
    return response.data;
  }

  // Task endpoints
  async submitTask(agentId: string, input: any, priority?: number) {
    const response = await this.client.post('/api/v1/execute/task', {
      agent_id: agentId,
      input,
      priority,
    });
    return response.data;
  }

  async submitBatch(tasks: any[]) {
    const response = await this.client.post('/api/v1/execute/batch', { tasks });
    return response.data;
  }

  async getTaskStatus(taskId: string) {
    const response = await this.client.get(`/api/v1/execute/task/${taskId}`);
    return response.data;
  }

  async cancelTask(taskId: string) {
    await this.client.post(`/api/v1/execute/task/${taskId}/cancel`);
  }

  async getQueueStatus() {
    const response = await this.client.get('/api/v1/execute/queue');
    return response.data;
  }

  // Metrics
  async getToolMetrics(toolId?: string) {
    const endpoint = toolId ? `/api/v1/metrics/tools/${toolId}` : '/api/v1/metrics/tools';
    const response = await this.client.get(endpoint);
    return response.data;
  }

  async getExecutionDetails(taskId: string) {
    const response = await this.client.get(`/api/v1/metrics/execution/${taskId}`);
    return response.data;
  }

  // Memory
  async getAgentEpisodicMemory(agentId: string) {
    const response = await this.client.get(`/api/v1/memory/agent/${agentId}/episodic`);
    return response.data;
  }

  async getAgentSemanticMemory(agentId: string) {
    const response = await this.client.get(`/api/v1/memory/agent/${agentId}/semantic`);
    return response.data;
  }

  // Tools
  async listTools() {
    const response = await this.client.get('/api/v1/tools');
    return response.data;
  }

  async getToolMetadata(toolId: string) {
    const response = await this.client.get(`/api/v1/tools/${toolId}`);
    return response.data;
  }

  async listToolsByCategory(category: string) {
    const response = await this.client.get(`/api/v1/tools/category/${category}`);
    return response.data;
  }
}

export const forgeApi = new ForgeApiClient();
