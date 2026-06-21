export interface Wallet {
  id: string;
  currency: string;
  balance: number | string;
  locked_balance: number | string;
  usdValue?: number;
  created_at: string;
}

export interface WalletBalanceResponse {
  wallets: Wallet[];
  totalUSD: number;
}

export interface WalletUpdateEvent {
  reason: string;
  wallet: Wallet;
  transaction: {
    id: string;
    currency: string;
    amount: number | string;
    status: string;
  };
}
