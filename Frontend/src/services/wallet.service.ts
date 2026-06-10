import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api`;

const walletService = {
  // ─── USER ENDPOINTS ─────────────────────────────────────────────────────────

  /**
   * Get user's wallet balances for all currencies
   */
  getBalance: async () => {
    const response = await axios.get(`${API_URL}/wallet/balance`, {
      withCredentials: true,
    });
    return response.data;
  },

  /**
   * Get user's transaction history
   * @param page - Page number
   */
  getTransactions: async (page: number = 1) => {
    const response = await axios.get(`${API_URL}/wallet/transactions`, {
      params: { page },
      withCredentials: true,
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
    const response = await axios.get(`${API_URL}/wallet/admin/wallets`, {
      params: { page, limit },
      withCredentials: true,
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
    const response = await axios.post(
      `${API_URL}/wallet/admin/topup`,
      { userId, currency, amount },
      { withCredentials: true }
    );
    return response.data;
  },
};

export default walletService;
