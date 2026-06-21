import api, { API_ENDPOINTS } from './api.service';

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: string;
  fee: string;
  net_amount: string;
  currency: string;
  payment_method: string | null;
  withdrawal_address: string;
  network: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_note: string | null;
  rejection_reason: string | null;
  processed_by: string | null;
  processed_by_username: string | null;
  processed_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  username?: string;
  email?: string;
}

export interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateWithdrawalPayload {
  amount: number;
  withdrawalAddress: string;
  network?: string;
  currency?: string;
  paymentMethod?: string;
}

export interface ChangeStatusPayload {
  status: 'APPROVED' | 'REJECTED';
  adminNote?: string;
  rejectionReason?: string;
}

const withdrawalService = {
  // User
  create: (payload: CreateWithdrawalPayload) =>
    api.post<{ success: boolean; data: Withdrawal }>(API_ENDPOINTS.WITHDRAWALS.CREATE, payload),

  getMyWithdrawals: (status = 'ALL', page = 1) =>
    api.get<{ success: boolean; data: WithdrawalsResponse }>(
      `${API_ENDPOINTS.WITHDRAWALS.MY_WITHDRAWALS}?status=${status}&page=${page}`
    ),

  // Admin
  getAll: (status = 'ALL', page = 1) =>
    api.get<{ success: boolean; data: WithdrawalsResponse }>(
      `${API_ENDPOINTS.WITHDRAWALS.ADMIN_ALL}?status=${status}&page=${page}`
    ),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Withdrawal }>(API_ENDPOINTS.WITHDRAWALS.ADMIN_DETAIL(id)),

  changeStatus: (id: string, payload: ChangeStatusPayload) =>
    api.patch<{ success: boolean; data: Withdrawal }>(
      API_ENDPOINTS.WITHDRAWALS.ADMIN_CHANGE_STATUS(id), payload
    ),

  updateWallet: (walletId: string, operation: 'DEBIT', amount: number, reason: string) =>
    api.patch(API_ENDPOINTS.WITHDRAWALS.ADMIN_UPDATE_WALLET(walletId), { operation, amount, reason }),
};

export default withdrawalService;
