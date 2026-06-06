import api from './api.service';

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
    notifications: AdminNotification[];
    total: number;
    page: number;
    limit: number;
  };
}

const notificationService = {
  getUserNotifications: async (page = 1, limit = 20): Promise<UserNotificationsResponse> => {
    const response = await api.get<UserNotificationsResponse>('/notifications/user', {
      params: { page, limit },
    });
    return response.data;
  },

  getAdminNotifications: async (page = 1, limit = 20): Promise<AdminNotificationsResponse> => {
    const response = await api.get<AdminNotificationsResponse>('/notifications/admin', {
      params: { page, limit },
    });
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
