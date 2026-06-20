import api, { API_ENDPOINTS } from './api.service';

export interface PendingDeposit {
  id: string;
  user_id: string;
  username: string;
  email: string;
  wallet_id: string;
  currency: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  screenshot_url: string | null;
  created_at: string;
}

export interface PendingDepositsResponse {
  deposits: PendingDeposit[];
  total: number;
  page: number;
  limit: number;
}

const walletService = {
  getPendingDeposits: async (page = 1, limit = 50) => {
    return api.get<PendingDepositsResponse>(
      `${API_ENDPOINTS.WALLET.ADMIN_PENDING_DEPOSITS}?page=${page}&limit=${limit}`
    );
  },

  approveDeposit: async (transactionId: string) => {
    return api.post(API_ENDPOINTS.WALLET.ADMIN_APPROVE_DEPOSIT(transactionId));
  },

  rejectDeposit: async (transactionId: string) => {
    return api.post(API_ENDPOINTS.WALLET.ADMIN_REJECT_DEPOSIT(transactionId));
  },
};

export default walletService;
