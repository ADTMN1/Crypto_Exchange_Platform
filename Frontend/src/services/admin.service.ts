import api, { API_ENDPOINTS } from './api.service';

// Types matching backend response structure
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  phone_number?: string;
  profile_picture_url?: string;
  role?: string;
  account_status: 'pending' | 'active' | 'suspended' | 'banned';
  email_verified: boolean;
  phone_verified?: boolean;
  two_fa_enabled?: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AdminUserTransaction {
  id: string;
  type: string;
  currency: string;
  amount: string;
  fee?: string;
  status: string;
  tx_hash?: string;
  from_address?: string;
  to_address?: string;
  created_at: string;
  confirmed_at?: string;
}

export interface AdminUserWallet {
  id: string;
  currency: string;
  balance: string;
  locked_balance: string;
  created_at: string;
}

export interface AdminUserTransactionsResponse {
  success: boolean;
  data: {
    transactions: AdminUserTransaction[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface AdminUserWalletsResponse {
  success: boolean;
  data: AdminUserWallet[];
}

export interface ImpersonateResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AdminUser;
  };
}

export interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface AdminUserDetailResponse {
  success: boolean;
  data: AdminUser;
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  metadata: any;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AdminAuditLogsResponse {
  success: boolean;
  page: number;
  limit: number;
  totalCount: number;
  data: AuditLog[];
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'active' | 'suspended' | 'banned';
  search?: string;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
}


export interface AdminNotification {
  notification_id: string;
  title: string;
  type: string;
  created_at: string;
  total_recipients: number;
  read_count: number;
  unread_count: number;
}

export interface AdminNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: AdminNotification[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface GetAdminNotificationsParams {
  page?: number;
  limit?: number;
}

// Admin Order Types
export interface AdminOrder {
  id: string;
  user_id: string;
  username: string;
  email: string;
  base_currency: string;
  quote_currency: string;
  pair: string;
  type: 'market' | 'limit';
  side: 'buy' | 'sell';
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled';
  price: string;
  quantity: string;
  filled_qty: string;
  avg_fill_price: string;
  fee: string;
  fee_currency: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
}

export interface AdminOrdersResponse {
  success: boolean;
  data: AdminOrder[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface AdminOrderDetailResponse {
  success: boolean;
  data: AdminOrder;
}

export interface GetAdminOrdersParams {
  status?: 'open' | 'partially_filled' | 'filled' | 'cancelled';
  pair?: string;
  limit?: number;
  offset?: number;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  data: AdminOrder;
}

export interface AdminTrade {
  id: string;
  pair: string;
  base_currency: string;
  quote_currency: string;
  price: string;
  quantity: string;
  total: string;
  buyer_fee: string;
  seller_fee: string;
  executed_at: string;
  buyer_username: string;
  buyer_email: string;
  seller_username: string;
  seller_email: string;
  buy_order_id: string;
  sell_order_id: string;
}

export interface AdminTradesResponse {
  success: boolean;
  data: AdminTrade[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface GetAdminTradesParams {
  pair?: string;
  limit?: number;
  offset?: number;
}
const adminService = {
  /**
   * Get all users (paginated with filters)
   */
  async getAllUsers(params: GetUsersParams = {}): Promise<AdminUsersResponse> {
    const response = await api.get<AdminUsersResponse>(API_ENDPOINTS.ADMIN.USERS, { params });
    return response.data;
  },

  /**
   * Get active users only
   */
  async getActiveUsers(params: Omit<GetUsersParams, 'status'> = {}): Promise<AdminUsersResponse> {
    const response = await api.get<AdminUsersResponse>(API_ENDPOINTS.ADMIN.ACTIVE_USERS, { params });
    return response.data;
  },

  /**
   * Get banned users only
   */
  async getBannedUsers(params: Omit<GetUsersParams, 'status'> = {}): Promise<AdminUsersResponse> {
    const response = await api.get<AdminUsersResponse>(API_ENDPOINTS.ADMIN.BANNED_USERS, { params });
    return response.data;
  },

  /**
   * Get single user details by ID
   */
  async getUserById(userId: string): Promise<AdminUserDetailResponse> {
    const response = await api.get<AdminUserDetailResponse>(API_ENDPOINTS.ADMIN.USER_DETAILS(userId));
    return response.data;
  },

  /**
   * Update user status (pending, active, suspended, banned)
   */
  async updateUserStatus(
    userId: string,
    status: 'pending' | 'active' | 'suspended' | 'banned'
  ): Promise<AdminActionResponse> {
    const response = await api.patch<AdminActionResponse>(
      API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS(userId),
      { status }
    );
    return response.data;
  },

  /**
   * Ban a user
   */
  async banUser(userId: string): Promise<AdminActionResponse> {
    const response = await api.patch<AdminActionResponse>(API_ENDPOINTS.ADMIN.BAN_USER(userId));
    return response.data;
  },

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<AdminActionResponse> {
    const response = await api.patch<AdminActionResponse>(API_ENDPOINTS.ADMIN.UNBAN_USER(userId));
    return response.data;
  },

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(userId: string): Promise<AdminActionResponse> {
    const response = await api.delete<AdminActionResponse>(API_ENDPOINTS.ADMIN.DELETE_USER(userId));
    return response.data;
  },

  async getAuditLogs(params: GetAuditLogsParams = {}): Promise<AdminAuditLogsResponse> {
    const response = await api.get<AdminAuditLogsResponse>(API_ENDPOINTS.ADMIN.AUDIT_LOGS, {
      params,
    });
    return response.data;
  },
/**
 * Get admin notifications (paginated)
 */
async getAdminNotifications(
  params: GetAdminNotificationsParams = {}
): Promise<AdminNotificationsResponse> {
  const response = await api.get<AdminNotificationsResponse>(
    API_ENDPOINTS.ADMIN.Notifications,
    { params }
  );

  return response.data;
},

  async getUserTransactions(userId: string, page = 1, limit = 20): Promise<AdminUserTransactionsResponse> {
    const response = await api.get<AdminUserTransactionsResponse>(
      API_ENDPOINTS.ADMIN.USER_TRANSACTIONS(userId),
      { params: { page, limit } }
    );
    return response.data;
  },

  async getUserWallets(userId: string): Promise<AdminUserWalletsResponse> {
    const response = await api.get<AdminUserWalletsResponse>(
      API_ENDPOINTS.ADMIN.USER_WALLETS(userId)
    );
    return response.data;
  },

  async impersonateUser(userId: string): Promise<ImpersonateResponse> {
    const response = await api.post<ImpersonateResponse>(
      API_ENDPOINTS.ADMIN.IMPERSONATE_USER(userId)
    );
    return response.data;
  },

  // Admin order functions
  async getAllOrders(params: GetAdminOrdersParams = {}): Promise<AdminOrdersResponse> {
    const response = await api.get<AdminOrdersResponse>(API_ENDPOINTS.ADMIN.ORDERS, { params });
    return response.data;
  },

  async getOpenOrders(params: Omit<GetAdminOrdersParams, 'status'> = {}): Promise<AdminOrdersResponse> {
    const response = await api.get<AdminOrdersResponse>(API_ENDPOINTS.ADMIN.OPEN_ORDERS, { params });
    return response.data;
  },

  async getOrderHistory(params: Omit<GetAdminOrdersParams, 'status'> = {}): Promise<AdminOrdersResponse> {
    const response = await api.get<AdminOrdersResponse>(API_ENDPOINTS.ADMIN.ORDER_HISTORY, { params });
    return response.data;
  },

  async getOrderById(orderId: string): Promise<AdminOrderDetailResponse> {
    const response = await api.get<AdminOrderDetailResponse>(API_ENDPOINTS.ADMIN.ORDER_DETAIL(orderId));
    return response.data;
  },

  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    const response = await api.patch<CancelOrderResponse>(API_ENDPOINTS.ADMIN.CANCEL_ORDER(orderId));
    return response.data;
  },

  async getAllTrades(params: GetAdminTradesParams = {}): Promise<AdminTradesResponse> {
    const response = await api.get<AdminTradesResponse>(API_ENDPOINTS.ADMIN.TRADES, { params });
    return response.data;
  },
};




export default adminService;






