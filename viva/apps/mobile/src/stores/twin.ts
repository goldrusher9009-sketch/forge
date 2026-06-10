import { create } from 'zustand';
import { twinService } from '../services/twin';

export type TwinAutonomyLevel = 'suggest' | 'semi-auto' | 'full-auto';

export interface TwinTask {
  id: string;
  domain: 'commerce' | 'dating' | 'food' | 'freelance' | 'finance' | 'health';
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  earnedViva?: number;
  createdAt: string;
}

export interface TwinState {
  status: 'active' | 'idle' | 'sleeping';
  lastAction: string;
  autonomyLevel: TwinAutonomyLevel;
  pendingApprovals: TwinTask[];
  completedToday: TwinTask[];
  totalEarned: number;
  generation: number;

  fetchStatus: () => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  rejectTask: (taskId: string) => Promise<void>;
  setAutonomy: (level: TwinAutonomyLevel) => void;
  triggerDomain: (domain: TwinTask['domain']) => Promise<void>;
}

export const useTwinStore = create<TwinState>((set, get) => ({
  status: 'idle',
  lastAction: '',
  autonomyLevel: 'suggest',
  pendingApprovals: [],
  completedToday: [],
  totalEarned: 0,
  generation: 1,

  fetchStatus: async () => {
    const data = await twinService.getStatus();
    set({
      status: data.status,
      lastAction: data.lastAction,
      pendingApprovals: data.pendingApprovals,
      completedToday: data.completedToday,
      totalEarned: data.totalEarned,
      generation: data.generation,
    });
  },

  approveTask: async (taskId: string) => {
    await twinService.approveTask(taskId);
    await get().fetchStatus();
  },

  rejectTask: async (taskId: string) => {
    await twinService.rejectTask(taskId);
    await get().fetchStatus();
  },

  setAutonomy: (level: TwinAutonomyLevel) => {
    set({ autonomyLevel: level });
    twinService.setAutonomyLevel(level);
  },

  triggerDomain: async (domain: TwinTask['domain']) => {
    await twinService.triggerDomain(domain);
    await get().fetchStatus();
  },
}));
