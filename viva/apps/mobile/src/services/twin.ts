import { api } from './api';
import type { TwinAutonomyLevel, TwinTask } from '../stores/twin';

export const twinService = {
  getStatus: () =>
    api.get<{
      status: 'active' | 'idle' | 'sleeping';
      lastAction: string;
      pendingApprovals: TwinTask[];
      completedToday: TwinTask[];
      totalEarned: number;
      generation: number;
    }>('/twin/status'),

  approveTask: (taskId: string) =>
    api.post(`/twin/tasks/${taskId}/approve`),

  rejectTask: (taskId: string) =>
    api.post(`/twin/tasks/${taskId}/reject`),

  setAutonomyLevel: (level: TwinAutonomyLevel) =>
    api.put('/twin/autonomy', { level }),

  triggerDomain: (domain: string) =>
    api.post('/twin/trigger', { domain }),

  getHistory: () =>
    api.get<TwinTask[]>('/twin/history'),
};
