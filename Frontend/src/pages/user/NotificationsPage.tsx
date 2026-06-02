import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaArrowUp, 
  FaArrowDown,
  FaExchangeAlt,
  FaShieldAlt,
  FaUserCheck,
  FaTrash,
  FaCheckDouble,
  FaFilter
} from 'react-icons/fa';

type NotificationType = 'success' | 'warning' | 'info' | 'security';
type NotificationCategory = 'all' | 'trading' | 'wallet' | 'security' | 'account';

interface Notification {
  id: string;
  type: NotificationType;
  category: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          category: 'wallet',
          title: 'Deposit Confirmed',
          message: 'Your deposit of 0.5 BTC has been confirmed and credited to your account.',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'info',
          category: 'trading',
          title: 'Order Filled',
          message: 'Your limit order to buy 0.1 BTC at $43,000 has been filled.',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'warning',
          category: 'security',
          title: 'New Login Detected',
          message: 'A new login was detected from Chrome on Windows. If this wasn\'t you, please secure your account.',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          type: 'success',
          category: 'wallet',
          title: 'Withdrawal Completed',
          message: 'Your withdrawal of 2.5 ETH has been processed successfully.',
          is_read: true,
          created_at: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: '5',
          type: 'info',
          category: 'account',
          title: 'KYC Verification',
          message: 'Your KYC documents have been received and are under review.',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '6',
          type: 'security',
          category: 'security',
          title: '2FA Enabled',
          message: 'Two-factor authentication has been successfully enabled on your account.',
          is_read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // TODO: API call to mark as read
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: API call to mark all as read
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // TODO: API call to delete notification
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type: NotificationType, category: string) => {
    if (category === 'wallet') {
      return <FaArrowDown />;
    }
    if (category === 'trading') {
      return <FaExchangeAlt />;
    }
    if (category === 'security') {
      return <FaShieldAlt />;
    }
    if (category === 'account') {
      return <FaUserCheck />;
    }

    switch (type) {
      case 'success':
        return <FaCheckCircle />;
      case 'warning':
        return <FaExclamationTriangle />;
      case 'security':
        return <FaShieldAlt />;
      default:
        return <FaInfoCircle />;
    }
  };

  const getTypeClass = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'warning':
        return 'notification-warning';
      case 'security':
        return 'notification-security';
      default:
        return 'notification-info';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = filter === 'all' || !notification.is_read;
    const matchesCategoryFilter = categoryFilter === 'all' || notification.category === categoryFilter;
    return matchesReadFilter && matchesCategoryFilter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <main className="notifications-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaBell className="title-icon" />
            Notifications
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">
            Stay updated with your account activity and system alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-mark-all" onClick={markAllAsRead}>
            <FaCheckDouble />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="notifications-filters">
        <div className="filter-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="category-filters">
          <button
            className={`category-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            <FaFilter /> All
          </button>
          <button
            className={`category-btn ${categoryFilter === 'trading' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('trading')}
          >
            <FaExchangeAlt /> Trading
          </button>
          <button
            className={`category-btn ${categoryFilter === 'wallet' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('wallet')}
          >
            <FaArrowDown /> Wallet
          </button>
          <button
            className={`category-btn ${categoryFilter === 'security' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('security')}
          >
            <FaShieldAlt /> Security
          </button>
          <button
            className={`category-btn ${categoryFilter === 'account' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('account')}
          >
            <FaUserCheck /> Account
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notifications-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FaBell size={48} style={{ color: '#666', marginBottom: '1rem' }} />
            <h3>No notifications</h3>
            <p>
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications." 
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${getTypeClass(notification.type)} ${
                  notification.is_read ? 'read' : 'unread'
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {getIcon(notification.type, notification.category)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{notification.title}</h4>
                    <span className="notification-time">{formatDate(notification.created_at)}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {!notification.is_read && (
                    <span className="unread-indicator">New</span>
                  )}
                </div>
                <button
                  className="notification-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  title="Delete notification"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
