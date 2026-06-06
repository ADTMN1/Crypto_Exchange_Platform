import { useState, useEffect, useCallback } from 'react';
import adminService, { AdminUser } from '../../services/admin.service';
import { toast } from 'sonner';
import UserActionMenu from '../../components/admin/UserActionMenu';
import notificationService from '../../services/notification.service';

interface ManageUsersPageProps {
  title: string;
  description: string;
}

export default function AdminManageUsersPage({ title, description }: ManageUsersPageProps) {
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

  // Determine which API call to make based on page title
  const getUserFilterType = (): 'all' | 'active' | 'banned' | 'email-unverified' | 'phone-unverified' => {
    if (title === 'Active Users') return 'active';
    if (title === 'Banned Users') return 'banned';
    if (title === 'Email Unverified') return 'email-unverified';
    if (title === 'Mobile Unverified') return 'phone-unverified';
    return 'all';
  };

  // Fetch users based on page type
  const fetchUsers = useCallback(async () => {
    if (isNotification) return; // Don't fetch for notification page

    setIsLoading(true);
    setError(null);

    try {
      const filterType = getUserFilterType();
      let response;

      switch (filterType) {
        case 'active':
          response = await adminService.getActiveUsers({
            page: 1,
            limit: 50,
            search: searchQuery || undefined,
          });
          break;
        
        case 'banned':
          response = await adminService.getBannedUsers({
            page: 1,
            limit: 50,
            search: searchQuery || undefined,
          });
          break;
        
        case 'email-unverified':
          // For email unverified, filter from all users where email_verified = false
          response = await adminService.getAllUsers({
            page: 1,
            limit: 50,
            search: searchQuery || undefined,
          });
          // Client-side filter
          response.data.users = response.data.users.filter(u => !u.email_verified);
          response.data.total = response.data.users.length;
          break;
        
        case 'phone-unverified':
          // For phone unverified, filter from all users where phone_verified = false
          response = await adminService.getAllUsers({
            page: 1,
            limit: 50,
            search: searchQuery || undefined,
          });
          // Client-side filter
          response.data.users = response.data.users.filter(u => !u.phone_verified);
          response.data.total = response.data.users.length;
          break;
        
        default:
          response = await adminService.getAllUsers({
            page: 1,
            limit: 50,
            search: searchQuery || undefined,
          });
      }

      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      const errorMessage = err?.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [title, searchQuery, isNotification]);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (isNotification) return;

    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return '1 month ago';
    if (diffInMonths < 12) return `${diffInMonths} months ago`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      {isNotification ? (
        <section className="nex-section-body">
          <div className="nex-card nex-card-form">
            <h2>Send Notification</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Send a message to selected users or all users.</p>
            <form className="nex-form-grid" onSubmit={handleNotifSubmit}>

              <label htmlFor="notification-target">Recipient Group</label>
              <select
                id="notification-target"
                value={notifForm.target}
                onChange={e => setNotifForm(p => ({ ...p, target: e.target.value }))}
              >
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="suspended">Suspended Users</option>
                <option value="banned">Banned Users</option>
                <option value="pending">Pending Users</option>
              </select>

              <label htmlFor="notification-type">Type</label>
              <select
                id="notification-type"
                value={notifForm.type}
                onChange={e => setNotifForm(p => ({ ...p, type: e.target.value }))}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="security">Security</option>
                <option value="trading">Trading</option>
                <option value="wallet">Wallet</option>
                <option value="account">Account</option>
              </select>

              <label htmlFor="notification-title">Title</label>
              <input
                id="notification-title"
                type="text"
                placeholder="Notification title"
                value={notifForm.title_}
                onChange={e => setNotifForm(p => ({ ...p, title_: e.target.value }))}
                required
              />

              <label htmlFor="notification-message">Message</label>
              <textarea
                id="notification-message"
                rows={6}
                placeholder="Write your notification here"
                value={notifForm.body}
                onChange={e => setNotifForm(p => ({ ...p, body: e.target.value }))}
                required
              />

              <button type="submit" className="btn-primary" disabled={notifLoading}>
                {notifLoading ? 'Sending…' : 'Send Notification'}
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="nex-section-body">
          <div className="nex-card">
            <div className="nex-card-title">
              <h2>{title}</h2>
              <div className="nex-search-box">
                <input
                  type="text"
                  placeholder="Search by email or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="nex-search-input"
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                padding: '1rem', 
                marginBottom: '1rem', 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: '8px', 
                color: '#ef4444' 
              }}>
                {error}
                <button 
                  onClick={fetchUsers} 
                  style={{ 
                    marginLeft: '1rem', 
                    textDecoration: 'underline', 
                    cursor: 'pointer', 
                    background: 'none', 
                    border: 'none', 
                    color: '#ef4444' 
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="nex-loading">
                <div className="nex-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : (
              <div className="nex-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email - Mobile</th>
                      <th>Status</th>
                      <th>Joined At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="nex-empty-state">
                          <div>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p>No {title.toLowerCase()} found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.username}</strong>
                            <div className="nex-table-meta">@{user.username}</div>
                          </td>
                          <td>
                            <div>{user.email}</div>
                            <div className="nex-table-meta">{user.phone_number || 'N/A'}</div>
                          </td>
                          <td>
                            <span className={`nex-badge ${
                              (user.account_status ?? '') === 'active' ? 'nex-badge-success' :
                              (user.account_status ?? '') === 'banned' ? 'nex-badge-danger' :
                              (user.account_status ?? '') === 'suspended' ? 'nex-badge-orange' :
                              'nex-badge-warning'
                            }`}>
                              {(user.account_status ?? 'pending').charAt(0).toUpperCase() + (user.account_status ?? 'pending').slice(1)}
                            </span>
                          </td>
                          <td>
                            <div>{formatDate(user.created_at)}</div>
                            <div className="nex-table-meta">{getTimeSince(user.created_at)}</div>
                          </td>
                          <td>
                            <UserActionMenu
                              user={user}
                              onUpdated={handleUpdated}
                              onDeleted={handleDeleted}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && users.length > 0 && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                borderTop: '1px solid rgba(169, 255, 232, 0.12)', 
                color: 'var(--text-muted)', 
                fontSize: '14px' 
              }}>
                Showing {users.length} of {totalUsers} users
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
