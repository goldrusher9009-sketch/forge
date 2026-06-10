import { api } from './api';
import type { FeedPost } from '../types/feed';

export const feedService = {
  getFeed: (cursor?: string) =>
    api.get<{ posts: FeedPost[]; cursor: string | null }>(
      `/social/feed${cursor ? `?cursor=${cursor}` : ''}`
    ),

  claimAttentionReward: (postId: string) =>
    api.post(`/social/posts/${postId}/attention`),

  mintAsNFT: (postId: string) =>
    api.post<{ contractAddress: string; tokenId: string }>(
      `/social/posts/${postId}/mint`
    ).then((r) => r.contractAddress),

  openAdSlot: (postId: string) =>
    api.post(`/social/posts/${postId}/ad-slot`),

  createPrediction: (postId: string) =>
    api.post(`/predictions/from-post/${postId}`),

  likePost: (postId: string) =>
    api.post(`/social/posts/${postId}/like`),

  sharePost: (postId: string) =>
    api.post<{ referralLink: string }>(`/social/posts/${postId}/share`),
};
