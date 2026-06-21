import api, { API_ENDPOINTS } from './api.service';

export interface UserNotification {
  notification_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AdminNotification {
  notification_id: string;
  title: string;
  type: string;
  total_recipients: number;
  read_count: number;
  unread_count: number;
  created_at: string;
}

// Admin bell notification — one row per notification_recipient for admin users
export interface AdminBellNotification {
  id: string; // notification_recipient.id
  notification_id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  admin_user_id: string;
}

export interface UserNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: UserNotification[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface AdminNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: AdminBellNotification[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface AdminUnreadCountResponse {
  success: boolean;
  data: { unread_count: number };
}

export interface NotificationHistoryResponse {
  success: boolean;
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  data: Array<{
    notification_id: string;
    type: string;
    title: string;
    body: string;
    metadata: any;
    created_at: string;
    user_id: string;
    is_read: boolean;
    read_at: string | null;
    recipient_username: string | null;
    recipient_email: string | null;
  }>;
}

const notificationService = {
  getUserNotifications: async (page = 1, limit = 20): Promise<UserNotificationsResponse> => {
    const response = await api.get<UserNotificationsResponse>('/notifications/user', {
      params: { page, limit },
    });
    return response.data;
  },

  getAdminNotifications: async (page = 1, limit = 20): Promise<AdminNotificationsResponse> => {
    const response = await api.get<AdminNotificationsResponse>(API_ENDPOINTS.ADMIN.NOTIFICATIONS, {
      params: { page, limit },
    });
    return response.data;
  },

  getAdminUnreadCount: async (): Promise<number> => {
    const response = await api.get<AdminUnreadCountResponse>(API_ENDPOINTS.ADMIN.NOTIFICATIONS_UNREAD_COUNT);
    return response.data.data.unread_count;
  },

  markAdminNotificationRead: async (recipientId: string): Promise<void> => {
    await api.patch(API_ENDPOINTS.ADMIN.NOTIFICATION_READ(recipientId));
  },

  markAllAdminNotificationsRead: async (): Promise<void> => {
    await api.patch(API_ENDPOINTS.ADMIN.NOTIFICATIONS_READ_ALL);
  },

  getNotificationHistory: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    userId?: string;
  } = {}): Promise<NotificationHistoryResponse> => {
    const response = await api.get<NotificationHistoryResponse>(API_ENDPOINTS.ADMIN.NOTIFICATION_HISTORY, { params });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/notifications/read/${notificationId}`);
  },

  sendToUser: async (payload: { userId: string; type: string; title: string; body: string; metadata?: any }) => {
    const response = await api.post('/notifications/send', payload);
    return response.data;
  },

  sendToAll: async (payload: { type: string; title: string; body: string; metadata?: any }) => {
    const response = await api.post('/notifications/send/all', payload);
    return response.data;
  },

  sendByStatus: async (payload: { status: string; type: string; title: string; body: string; metadata?: any }) => {
    const response = await api.post('/notifications/send/by-status', payload);
    return response.data;
  },
};

export default notificationService;
