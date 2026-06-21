import { create } from 'zustand';
import type { Wallet, WalletBalanceResponse, WalletUpdateEvent } from '../types/wallet.types';
import walletService from '../services/wallet.service';
import { toast } from 'sonner';

interface WalletStore {
  wallets: Wallet[];
  totalUSD: number;
  isLoading: boolean;
  fetchWallet: () => Promise<void>;
  updateWalletFromEvent: (event: WalletUpdateEvent) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallets: [],
  totalUSD: 0,
  isLoading: false,

  fetchWallet: async () => {
    set({ isLoading: true });
    try {
      const response = await walletService.getBalance();
      if (response.data.success) {
        const { wallets, totalUSD } = response.data.data;
        set({ wallets, totalUSD });
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateWalletFromEvent: (event: WalletUpdateEvent) => {
    const { wallets } = get();
    const { wallet, transaction } = event;

    // Update or add the wallet
    const updatedWallets = wallets.map((w) =>
      w.id === wallet.id ? { ...w, ...wallet, usdValue: wallet.usdValue || w.usdValue } : w
    );

    // If wallet wasn't found, add it
    if (!updatedWallets.find((w) => w.id === wallet.id)) {
      updatedWallets.push(wallet);
    }

    // Set the updated wallets
    set({ wallets: updatedWallets });
    
    // Refetch wallet to get accurate total USD
    get().fetchWallet();

    // Show success toast
    if (transaction.status === 'completed') {
      toast.success(`Deposit of ${transaction.amount} ${transaction.currency} approved!`);
    }
  },
}));
