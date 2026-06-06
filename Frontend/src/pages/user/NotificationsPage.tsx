import { useState, useEffect, useCallback } from 'react';
import {
  FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
  FaArrowDown, FaExchangeAlt, FaShieldAlt, FaUserCheck,
  FaTrash, FaCheckDouble, FaFilter,
} from 'react-icons/fa';
import { toast } from 'sonner';
import notificationService, { UserNotification } from '../../services/notification.service';

type NotificationCategory = 'all' | 'trading' | 'wallet' | 'security' | 'account';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [filter, setFilter]               = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>('all');

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getUserNotifications(1, 50);
      setNotifications(res.data.notifications);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark as read.');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.is_read);
    try {
      await Promise.all(unread.map(n => notificationService.markAsRead(n.notification_id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark all as read.');
    }
  }, [notifications]);

  // No delete endpoint on backend — remove from local state only
  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'trading':   return <FaExchangeAlt />;
      case 'wallet':    return <FaArrowDown />;
      case 'security':  return <FaShieldAlt />;
      case 'account':   return <FaUserCheck />;
      case 'success':   return <FaCheckCircle />;
      case 'warning':   return <FaExclamationTriangle />;
      default:          return <FaInfoCircle />;
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'success': return 'notification-success';
      case 'warning': return 'notification-warning';
      case 'security': return 'notification-security';
      default: return 'notification-info';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now  = new Date();
    const diffMs    = now.getTime() - date.getTime();
    const diffMins  = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays  = Math.floor(diffMs / 86400000);
    if (diffMins  < 1)  return 'Just now';
    if (diffMins  < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays  < 7)  return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filtered = notifications.filter(n => {
    const matchRead     = filter === 'all' || !n.is_read;
    const matchCategory = categoryFilter === 'all' || n.type === categoryFilter;
    return matchRead && matchCategory;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <main className="notifications-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FaBell className="title-icon" />
            Notifications
            {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </h1>
          <p className="page-subtitle">Stay updated with your account activity and system alerts</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-mark-all" onClick={markAllAsRead}>
            <FaCheckDouble /> Mark All as Read
          </button>
        )}
      </div>

      <div className="notifications-filters">
        <div className="filter-group">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`filter-btn ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread ({unreadCount})</button>
        </div>
        <div className="category-filters">
          {(['all','trading','wallet','security','account'] as NotificationCategory[]).map(cat => (
            <button
              key={cat}
              className={`category-btn ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all'      && <><FaFilter /> All</>}
              {cat === 'trading'  && <><FaExchangeAlt /> Trading</>}
              {cat === 'wallet'   && <><FaArrowDown /> Wallet</>}
              {cat === 'security' && <><FaShieldAlt /> Security</>}
              {cat === 'account'  && <><FaUserCheck /> Account</>}
            </button>
          ))}
        </div>
      </div>

      <div className="notifications-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FaBell size={48} style={{ color: '#666', marginBottom: '1rem' }} />
            <h3>No notifications</h3>
            <p>{filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filtered.map(n => (
              <div
                key={n.notification_id}
                className={`notification-item ${getTypeClass(n.type)} ${n.is_read ? 'read' : 'unread'}`}
                onClick={() => !n.is_read && markAsRead(n.notification_id)}
              >
                <div className="notification-icon">{getIcon(n.type)}</div>
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{n.title}</h4>
                    <span className="notification-time">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="notification-message">{n.body}</p>
                  {!n.is_read && <span className="unread-indicator">New</span>}
                </div>
                <button
                  className="notification-delete"
                  onClick={e => { e.stopPropagation(); removeNotification(n.notification_id); }}
                  title="Dismiss"
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
