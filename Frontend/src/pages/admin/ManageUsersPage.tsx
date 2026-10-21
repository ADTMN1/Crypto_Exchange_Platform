import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { AdminUser } from '../../services/admin.service';
import { toast } from 'sonner';
import UserActionMenu from '../../components/admin/UserActionMenu';
import notificationService from '../../services/notification.service';

interface ManageUsersPageProps {
  title: string;
  description: string;
}

export default function AdminManageUsersPage({ title, description }: ManageUsersPageProps) {
  const navigate = useNavigate();
  const [users, setUsers]             = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUsers, setTotalUsers]   = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const isNotification = title === 'Send Notification';

  const [notifForm, setNotifForm] = useState({
    target:  'all',
    type:    'info',
    title_:  '',
    body:    '',
  });
  const [notifLoading, setNotifLoading] = useState(false);

  const handleNotifSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title_.trim() || !notifForm.body.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    setNotifLoading(true);
    try {
      const payload = { type: notifForm.type, title: notifForm.title_, body: notifForm.body };
      if (notifForm.target === 'all') {
        await notificationService.sendToAll(payload);
      } else {
        await notificationService.sendByStatus({ ...payload, status: notifForm.target });
      }
      toast.success('Notification sent successfully.');
      setNotifForm({ target: 'all', type: 'info', title_: '', body: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send notification.');
    } finally {
      setNotifLoading(false);
    }
  };

  const getUserFilterType = (): 'all' | 'active' | 'banned' | 'email-unverified' | 'kyc-unverified' | 'kyc-pending' => {
    if (title === 'Active Users') return 'active';
    if (title === 'Banned Users') return 'banned';
    if (title === 'Email Unverified') return 'email-unverified';
    if (title === 'KYC Unverified') return 'kyc-unverified';
    if (title === 'KYC Pending') return 'kyc-pending';
    return 'all';
  };

  const fetchUsers = useCallback(async () => {
    if (isNotification) return;
    setIsLoading(true);
    setError(null);
    try {
      const filterType = getUserFilterType();
      let response;
      switch (filterType) {
        case 'active':
          response = await adminService.getActiveUsers({ page: 1, limit: 50, search: searchQuery || undefined });
          break;
        case 'banned':
          response = await adminService.getBannedUsers({ page: 1, limit: 50, search: searchQuery || undefined });
          break;
        case 'email-unverified':
          response = await adminService.getAllUsers({ page: 1, limit: 50, search: searchQuery || undefined });
          response.data.users = response.data.users.filter((u: AdminUser) => !u.email_verified);
          response.data.total = response.data.users.length;
          break;
        case 'kyc-unverified':
          response = await adminService.getAllUsers({ page: 1, limit: 50, search: searchQuery || undefined });
          response.data.users = response.data.users.filter((u: AdminUser) => u.kyc_status === 'unverified');
          response.data.total = response.data.users.length;
          break;
        case 'kyc-pending':
          response = await adminService.getAllUsers({ page: 1, limit: 50, search: searchQuery || undefined });
          response.data.users = response.data.users.filter((u: AdminUser) => u.kyc_status === 'pending');
          response.data.total = response.data.users.length;
          break;
        default:
          response = await adminService.getAllUsers({ page: 1, limit: 50, search: searchQuery || undefined });
      }
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to fetch users';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [title, searchQuery, isNotification]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (isNotification) return;
    const timer = setTimeout(() => fetchUsers(), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUpdated = useCallback((userId: string, changes: Partial<AdminUser>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...changes } : u));
  }, []);

  const handleDeleted = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setTotalUsers(prev => prev - 1);
  }, []);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(dateString));
  };

  const getTimeSince = (dateString: string) => {
    const diffInMs = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diffInMs / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  const statusClass = (status: string | null | undefined) => {
    const s = status ?? 'pending';
    if (s === 'active')    return 'mu-badge mu-badge--active';
    if (s === 'banned')    return 'mu-badge mu-badge--banned';
    if (s === 'suspended') return 'mu-badge mu-badge--suspended';
    return 'mu-badge mu-badge--pending';
  };

  const statusLabel = (status: string | null | undefined) => {
    const s = status ?? 'pending';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const initials = (username: string | null | undefined) =>
    (username ?? '?').charAt(0).toUpperCase();

  return (
    <main className="nex-admin-section-page">
      {/* ── Page header ── */}
      <section className="nex-section-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      {isNotification ? (
        /* ── Send Notification form ── */
        <section className="nex-section-body">
          <div className="nex-card nex-card-form">
            <h2>Send Notification</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Send a message to selected users or all users.
            </p>
            <form className="nex-form-grid" onSubmit={handleNotifSubmit}>
              <label htmlFor="notification-target">Recipient Group</label>
              <select id="notification-target" value={notifForm.target}
                onChange={e => setNotifForm(p => ({ ...p, target: e.target.value }))}>
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="suspended">Suspended Users</option>
                <option value="banned">Banned Users</option>
                <option value="pending">Pending Users</option>
              </select>

              <label htmlFor="notification-type">Type</label>
              <select id="notification-type" value={notifForm.type}
                onChange={e => setNotifForm(p => ({ ...p, type: e.target.value }))}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="security">Security</option>
                <option value="trading">Trading</option>
                <option value="wallet">Wallet</option>
                <option value="account">Account</option>
              </select>

              <label htmlFor="notification-title">Title</label>
              <input id="notification-title" type="text" placeholder="Notification title"
                value={notifForm.title_}
                onChange={e => setNotifForm(p => ({ ...p, title_: e.target.value }))}
                required />

              <label htmlFor="notification-message">Message</label>
              <textarea id="notification-message" rows={6} placeholder="Write your notification here"
                value={notifForm.body}
                onChange={e => setNotifForm(p => ({ ...p, body: e.target.value }))}
                required />

              <button type="submit" className="btn-primary" disabled={notifLoading}>
                {notifLoading ? 'Sending…' : 'Send Notification'}
              </button>
            </form>
          </div>
        </section>
      ) : (
        /* ── User list ── */
        <section className="nex-section-body">
          <div className="nex-card mu-card">

            {/* ── Toolbar ── */}
            <div className="mu-toolbar">
              <div className="mu-toolbar-left">
                <span className="mu-count">{totalUsers} users</span>
              </div>
              <div className="mu-search-wrap">
                <svg className="mu-search-icon" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="mu-search-input"
                  placeholder="Search email or username…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="mu-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* ── Error bar ── */}
            {error && (
              <div className="nex-error-bar">
                {error}
                <button onClick={fetchUsers} className="nex-error-retry">Retry</button>
              </div>
            )}

            {/* ── Loading ── */}
            {isLoading ? (
              <div className="nex-loading">
                <div className="nex-spinner" />
                <p>Loading users…</p>
              </div>

            ) : users.length === 0 ? (
              /* ── Empty state ── */
              <div className="nex-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                <p>No {title.toLowerCase()} found</p>
                {searchQuery && (
                  <button className="mu-clear-search-btn" onClick={() => setSearchQuery('')}>
                    Clear search
                  </button>
                )}
              </div>

            ) : (
              <>
                {/* ── Desktop table ── */}
                <div className="mu-table-wrap">
                  <table className="mu-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th style={{ width: 56 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr
                          key={user.id}
                          className="mu-table-row"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                        >
                          <td>
                            <div className="mu-user-cell">
                              <div className="mu-avatar">{initials(user.username)}</div>
                              <div className="mu-user-text">
                                <span className="mu-username">{user.username}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="mu-email">{user.email}</span>
                            {user.phone_number && (
                              <span className="mu-phone">{user.phone_number}</span>
                            )}
                          </td>
                          <td>
                            <span className={statusClass(user.account_status)}>
                              {statusLabel(user.account_status)}
                            </span>
                          </td>
                          <td>
                            <span className="mu-date">{formatDate(user.created_at)}</span>
                            <span className="mu-date-ago">{getTimeSince(user.created_at)}</span>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <UserActionMenu user={user} onUpdated={handleUpdated} onDeleted={handleDeleted} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile cards ── */}
                <div className="mu-card-list">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className="mu-user-card"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      <div className="mu-card-row">
                        <div className="mu-avatar mu-avatar--lg">{initials(user.username)}</div>
                        <div className="mu-card-info">
                          <span className="mu-username">{user.username}</span>
                          <span className="mu-email">{user.email}</span>
                          {user.phone_number && (
                            <span className="mu-phone">{user.phone_number}</span>
                          )}
                        </div>
                        <span className={statusClass(user.account_status)}>
                          {statusLabel(user.account_status)}
                        </span>
                      </div>
                      <div className="mu-card-footer">
                        <span className="mu-date-ago">Joined {getTimeSince(user.created_at)}</span>
                        <div onClick={e => e.stopPropagation()}>
                          <UserActionMenu user={user} onUpdated={handleUpdated} onDeleted={handleDeleted} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Footer ── */}
                <div className="mu-footer">
                  Showing {users.length} of {totalUsers} users
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
