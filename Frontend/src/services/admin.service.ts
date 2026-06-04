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

export interface GetUsersParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'active' | 'suspended' | 'banned';
  search?: string;
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
};

export default adminService;
