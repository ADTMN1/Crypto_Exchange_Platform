import api, { API_ENDPOINTS } from './api.service';

export interface AdminTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | string;
  currency: string;
  amount: string;
  fee: string;
  status: 'pending' | 'completed' | 'failed' | string;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  confirmations: number;
  confirmed_at: string | null;
  created_at: string;
  user_email: string | null;
  user_username: string | null;
}

export interface GetAdminTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  currency?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: string;
  amount_max?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface AdminTransactionsResponse {
  success: boolean;
  data: {
    transactions: AdminTransaction[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface AdminTransactionDetailResponse {
  success: boolean;
  data: AdminTransaction;
}

const transactionService = {
  async getAdminTransactions(params: GetAdminTransactionsParams = {}): Promise<AdminTransactionsResponse> {
    const response = await api.get<AdminTransactionsResponse>(API_ENDPOINTS.ADMIN.TRANSACTIONS, { params });
    return response.data;
  },

  async getAdminTransactionById(id: string): Promise<AdminTransactionDetailResponse> {
    const response = await api.get<AdminTransactionDetailResponse>(API_ENDPOINTS.ADMIN.TRANSACTION_DETAIL(id));
    return response.data;
  },
};

export default transactionService;
