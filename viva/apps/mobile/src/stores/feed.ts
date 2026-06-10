import { create } from 'zustand';
import { feedService } from '../services/feed';
import type { FeedPost } from '../types/feed';

export interface FeedState {
  posts: FeedPost[];
  cursor: string | null;
  isLoading: boolean;
  attentionProgress: Record<string, number>; // postId -> 0-100

  fetchFeed: () => Promise<void>;
  fetchMore: () => Promise<void>;
  updateAttention: (postId: string, progress: number) => void;
  mintPost: (postId: string) => Promise<string>;
  openAdSlot: (postId: string) => Promise<void>;
  createPrediction: (postId: string) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  cursor: null,
  isLoading: false,
  attentionProgress: {},

  fetchFeed: async () => {
    set({ isLoading: true });
    const { posts, cursor } = await feedService.getFeed();
    set({ posts, cursor, isLoading: false });
  },

  fetchMore: async () => {
    const { cursor, posts } = get();
    if (!cursor) return;
    const data = await feedService.getFeed(cursor);
    set({ posts: [...posts, ...data.posts], cursor: data.cursor });
  },

  updateAttention: (postId: string, progress: number) => {
    set((state) => ({
      attentionProgress: { ...state.attentionProgress, [postId]: progress },
    }));
    // Trigger $VIVA reward at 100%
    if (progress >= 100) {
      feedService.claimAttentionReward(postId);
    }
  },

  mintPost: async (postId: string) => {
    return feedService.mintAsNFT(postId);
  },

  openAdSlot: async (postId: string) => {
    await feedService.openAdSlot(postId);
  },

  createPrediction: async (postId: string) => {
    await feedService.createPrediction(postId);
  },
}));
