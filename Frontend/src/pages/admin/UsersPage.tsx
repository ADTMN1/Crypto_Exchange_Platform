import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { AdminUser } from '../../services/admin.service';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllUsers({
        page: 1,
        limit: 20,
        search: searchQuery || undefined,
      });
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to fetch users';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: AdminUser['account_status'] | null | undefined) => {
    const s = status ?? 'pending';
    const map: Record<string, string> = {
      active: 'nex-badge-success',
      pending: 'nex-badge-warning',
      suspended: 'nex-badge-orange',
      banned: 'nex-badge-danger',
    };
    return (
      <span className={`nex-badge ${map[s] ?? 'nex-badge-warning'}`}>
        {s.charAt(0).toUpperCase() + s.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string | null | undefined) => {
    const r = role ?? 'user';
    return (
      <span className={`nex-badge ${r === 'admin' ? 'nex-badge-purple' : 'nex-badge-info'}`}>
        {r.charAt(0).toUpperCase() + r.slice(1)}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>All Users</h1>
          <p>Manage user accounts, permissions, and security settings</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>User List</h2>
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
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchUsers} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
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
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Joined At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>No users found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {(user.username ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{user.username}</strong>
                              <div className="nex-table-meta">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{user.email}</div>
                          {user.phone_number && (
                            <div className="nex-table-meta">{user.phone_number}</div>
                          )}
                        </td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>{getStatusBadge(user.account_status)}</td>
                        <td>
                          <div className="nex-verification-badges">
                            {user.email_verified && (
                              <span className="nex-badge nex-badge-xs nex-badge-success">✓ Email</span>
                            )}
                            {user.phone_verified && (
                              <span className="nex-badge nex-badge-xs nex-badge-success">✓ Phone</span>
                            )}
                            {user.two_fa_enabled && (
                              <span className="nex-badge nex-badge-xs nex-badge-info">🔒 2FA</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>{formatDate(user.created_at)}</div>
                          {user.last_login_at && (
                            <div className="nex-table-meta">Last: {formatDate(user.last_login_at)}</div>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && users.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Showing {users.length} of {totalUsers} users
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
