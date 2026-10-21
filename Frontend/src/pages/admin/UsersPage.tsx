import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService, { AdminUser } from '../../services/admin.service';
import { toast } from 'sonner';
import UserActionMenu from '../../components/admin/UserActionMenu';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers]             = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalUsers, setTotalUsers]   = useState(0);
  const [error, setError]             = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllUsers({
        page: 1, limit: 50,
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
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

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      .format(new Date(d));

  const getTimeSince = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 30)  return `${days}d ago`;
    const m = Math.floor(days / 30);
    if (m < 12) return `${m}mo ago`;
    return `${Math.floor(m / 12)}y ago`;
  };

  const statusClass = (s: string | null | undefined) => {
    const v = s ?? 'pending';
    if (v === 'active')    return 'mu-badge mu-badge--active';
    if (v === 'banned')    return 'mu-badge mu-badge--banned';
    if (v === 'suspended') return 'mu-badge mu-badge--suspended';
    return 'mu-badge mu-badge--pending';
  };

  const roleClass = (r: string | null | undefined) =>
    (r ?? 'user') === 'admin'
      ? 'mu-badge mu-badge--role-admin'
      : 'mu-badge mu-badge--role-user';

  const label = (v: string | null | undefined, fallback = 'pending') =>
    (v ?? fallback).charAt(0).toUpperCase() + (v ?? fallback).slice(1);

  const initials = (u: string | null | undefined) =>
    (u ?? '?').charAt(0).toUpperCase();

  return (
    <main className="nex-admin-section-page">
      {/* ── Page header ── */}
      <section className="nex-section-header">
        <div>
          <h1>All Users</h1>
          <p>Manage user accounts, permissions, and security settings</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card mu-card">

          {/* ── Toolbar ── */}
          <div className="mu-toolbar">
            <div className="mu-toolbar-left">
              <span className="mu-count">{totalUsers} users</span>
            </div>
            <div className="mu-search-wrap">
              <svg className="mu-search-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
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
                <button className="mu-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear">✕</button>
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
            <div className="nex-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <p>No users found</p>
              {searchQuery && (
                <button className="mu-clear-search-btn" onClick={() => setSearchQuery('')}>Clear search</button>
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
                      <th>Role</th>
                      <th>Status</th>
                      <th>Verification</th>
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
                            <span className="mu-username">{user.username}</span>
                          </div>
                        </td>
                        <td>
                          <span className="mu-email">{user.email}</span>
                          {user.phone_number && <span className="mu-phone">{user.phone_number}</span>}
                        </td>
                        <td>
                          <span className={roleClass(user.role)}>{label(user.role, 'user')}</span>
                        </td>
                        <td>
                          <span className={statusClass(user.account_status)}>
                            {label(user.account_status)}
                          </span>
                        </td>
                        <td>
                          <div className="aup-verif-row">
                            <span className={`mu-badge ${user.email_verified ? 'mu-badge--active' : 'mu-badge--banned'}`}>
                              {user.email_verified ? '✓' : '✗'} Email
                            </span>
                            {user.phone_verified && (
                              <span className="mu-badge mu-badge--active">✓ Phone</span>
                            )}
                            {user.two_fa_enabled && (
                              <span className="mu-badge mu-badge--pending">🔒 2FA</span>
                            )}
                          </div>
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
                    {/* Top row: avatar + info + status */}
                    <div className="mu-card-row">
                      <div className="mu-avatar mu-avatar--lg">{initials(user.username)}</div>
                      <div className="mu-card-info">
                        <span className="mu-username">{user.username}</span>
                        <span className="mu-email">{user.email}</span>
                        {user.phone_number && <span className="mu-phone">{user.phone_number}</span>}
                        {/* Role + verif badges inline */}
                        <div className="aup-card-badges">
                          <span className={roleClass(user.role)}>{label(user.role, 'user')}</span>
                          {user.email_verified && <span className="mu-badge mu-badge--active">✓ Email</span>}
                          {user.two_fa_enabled && <span className="mu-badge mu-badge--pending">🔒 2FA</span>}
                        </div>
                      </div>
                      <span className={statusClass(user.account_status)}>
                        {label(user.account_status)}
                      </span>
                    </div>

                    {/* Footer: joined + actions */}
                    <div className="mu-card-footer">
                      <span className="mu-date-ago">Joined {getTimeSince(user.created_at)}</span>
                      <div onClick={e => e.stopPropagation()}>
                        <UserActionMenu user={user} onUpdated={handleUpdated} onDeleted={handleDeleted} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && users.length > 0 && (
            <div className="mu-footer">
              Showing {users.length} of {totalUsers} users
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
