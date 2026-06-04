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
