import api from './api.service';

const walletService = {
  // ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

  /**
   * Get user's wallet balances for all currencies
   */
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  /**
   * Get user's transaction history
   * @param page - Page number
   */
  getTransactions: async (page: number = 1) => {
    const response = await api.get('/wallet/transactions', {
      params: { page },
    });
    return response.data;
  },

  // ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

  /**
   * Admin: Get all wallets
   * @param page - Page number
   * @param limit - Items per page
   */
  getAllWallets: async (page: number = 1, limit: number = 50) => {
    const response = await api.get('/wallet/admin/wallets', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Admin: Top up user wallet (dev only)
   * @param userId - User UUID
   * @param currency - Currency code (BTC, ETH, USDT, etc.)
   * @param amount - Amount to credit
   */
  adminTopup: async (userId: string, currency: string, amount: number) => {
    const response = await api.post('/wallet/admin/topup', {
      userId,
      currency,
      amount,
    });
    return response.data;
  },
};

export default walletService;
