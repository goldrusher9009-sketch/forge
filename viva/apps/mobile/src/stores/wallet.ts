import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { walletService } from '../services/wallet';

export interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'receive' | 'send';
  amount: number;
  source: string;
  timestamp: string;
  txHash?: string;
}

export interface WalletState {
  vivaBalance: number;
  earnedToday: number;
  youTokenPrice: number;
  youTokenBalance: number;
  transactions: Transaction[];
  embeddedWalletAddress: string | null;
  isLoading: boolean;

  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  sendViva: (to: string, amount: number) => Promise<string>;
  approveAdSlot: (slotId: string) => Promise<void>;
  rejectAdSlot: (slotId: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      vivaBalance: 0,
      earnedToday: 0,
      youTokenPrice: 0,
      youTokenBalance: 0,
      transactions: [],
      embeddedWalletAddress: null,
      isLoading: false,

      fetchBalance: async () => {
        set({ isLoading: true });
        try {
          const data = await walletService.getBalance();
          set({
            vivaBalance: data.vivaBalance,
            earnedToday: data.earnedToday,
            youTokenPrice: data.youTokenPrice,
            youTokenBalance: data.youTokenBalance,
            embeddedWalletAddress: data.address,
            isLoading: false,
          });
        } catch (e) {
          set({ isLoading: false });
        }
      },

      fetchTransactions: async () => {
        const txs = await walletService.getTransactions();
        set({ transactions: txs });
      },

      sendViva: async (to: string, amount: number) => {
        const txHash = await walletService.send(to, amount);
        await get().fetchBalance();
        return txHash;
      },

      approveAdSlot: async (slotId: string) => {
        await walletService.approveAd(slotId);
        await get().fetchBalance();
      },

      rejectAdSlot: async (slotId: string) => {
        await walletService.rejectAd(slotId);
      },
    }),
    { name: 'wallet-storage' }
  )
);
