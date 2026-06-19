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
};




export default adminService;






