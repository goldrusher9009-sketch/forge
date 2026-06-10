import { api } from './api';

export const walletService = {
  getBalance: () =>
    api.get<{
      vivaBalance: number;
      earnedToday: number;
      youTokenPrice: number;
      youTokenBalance: number;
      address: string;
    }>('/wallet/balance'),

  getTransactions: () =>
    api.get<any[]>('/wallet/transactions'),

  send: (to: string, amount: number) =>
    api.post<{ txHash: string }>('/wallet/send', { to, amount })
      .then((r) => r.txHash),

  approveAd: (slotId: string) =>
    api.post(`/wallet/ads/${slotId}/approve`),

  rejectAd: (slotId: string) =>
    api.post(`/wallet/ads/${slotId}/reject`),

  getAdSlots: () =>
    api.get<any[]>('/wallet/ads/pending'),
};
