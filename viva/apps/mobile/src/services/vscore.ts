import { api } from './api';
import type { RingData } from '../stores/vscore';

export const vscoreService = {
  getMyScore: () =>
    api.get<{
      score: number;
      rings: RingData;
      streak: number;
      history: { date: string; score: number }[];
    }>('/vscore/me'),

  getRings: () => api.get<RingData>('/vscore/rings'),

  getPublicScore: (userId: string) =>
    api.get<{ score: number; tier: string }>(`/vscore/user/${userId}`),
};
