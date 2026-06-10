import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vscoreService } from '../services/vscore';

export type VScoreTier =
  | 'seed'
  | 'rising'
  | 'stable'
  | 'guardian'
  | 'sovereign';

export interface RingData {
  social: number;    // 0-100
  wealth: number;
  activity: number;
  sleep: number;
  nutrition: number;
}

export interface VScoreState {
  score: number;
  tier: VScoreTier;
  rings: RingData;
  streak: number;
  history: { date: string; score: number }[];
  lastUpdated: string | null;
  isLoading: boolean;

  fetchScore: () => Promise<void>;
  refreshRings: () => Promise<void>;
}

function getTier(score: number): VScoreTier {
  if (score <= 200) return 'seed';
  if (score <= 400) return 'rising';
  if (score <= 600) return 'stable';
  if (score <= 800) return 'guardian';
  return 'sovereign';
}

export const useVScoreStore = create<VScoreState>()(
  persist(
    (set, get) => ({
      score: 0,
      tier: 'seed',
      rings: { social: 0, wealth: 0, activity: 0, sleep: 0, nutrition: 0 },
      streak: 0,
      history: [],
      lastUpdated: null,
      isLoading: false,

      fetchScore: async () => {
        set({ isLoading: true });
        try {
          const data = await vscoreService.getMyScore();
          set({
            score: data.score,
            tier: getTier(data.score),
            rings: data.rings,
            streak: data.streak,
            history: data.history,
            lastUpdated: new Date().toISOString(),
            isLoading: false,
          });
        } catch (e) {
          set({ isLoading: false });
        }
      },

      refreshRings: async () => {
        const data = await vscoreService.getRings();
        set({ rings: data });
      },
    }),
    { name: 'vscore-storage' }
  )
);
