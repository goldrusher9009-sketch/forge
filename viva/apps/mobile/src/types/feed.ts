export interface FeedCreator {
  id: string;
  name: string;
  avatarUrl?: string;
  vScore: number;
  youTokenPrice: number;
}

export interface FeedPost {
  id: string;
  creator: FeedCreator;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  vivaEarned: number;
  ipfsHash: string;
  isNFT: boolean;
  nftContractAddress?: string;
  adSlotOpen: boolean;
  createdAt: string;
}

export interface AttentionReward {
  postId: string;
  amount: number;
  txHash: string;
}
