import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import adminService, { LoginHistoryRecord } from '../../services/admin.service';

const ACTION_BADGE: Record<string, string> = {
  'User login':             'nex-badge-success',
  'Google OAuth login':     'nex-badge-success',
  'User logout':            'nex-badge-secondary',
  'Access token refreshed': 'nex-badge-info',
  'User registered':        'nex-badge-warning',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));

export default function LoginHistoryPage() {
  const [records, setRecords]     = useState<LoginHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearch]  = useState('');
  const [page, setPage]           = useState(1);
  const [totalCount, setTotal]    = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const limit = 20;

  const fetchHistory = useCallback(async (currentPage: number, currentSearch: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getLoginHistory({
        page: currentPage,
        limit,
        search: currentSearch || undefined,
      });
      setRecords(res.data);
      setTotal(res.totalCount);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load login history';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // refetch on page change immediately
  useEffect(() => { fetchHistory(page, searchQuery); }, [page]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchHistory(1, searchQuery); }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Login History</h1>
          <p>Review user login activity and access history.</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Login Events</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by user, action, or IP..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '1rem', marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', color: '#ef4444',
            }}>
              {error}
              <button
                onClick={() => fetchHistory(page, searchQuery)}
                style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading login history...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>IP Address</th>
                    <th>Device / Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>No login events found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                          {formatDate(r.loginTime || r.created_at)}
                        </td>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {(r.user_name?.[0] || r.user_email?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <strong>{r.user_name || 'Unknown'}</strong>
                              <div className="nex-table-meta">{r.user_email || r.userId || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`nex-badge ${ACTION_BADGE[r.action] || 'nex-badge-secondary'}`}>
                            {r.action}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {r.ipAddress || r.ip_address || '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.deviceInfo || r.metadata?.userAgent || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && records.length > 0 && (
            <div style={{
              marginTop: '1rem', padding: '1rem',
              borderTop: '1px solid rgba(169,255,232,0.12)',
              color: 'var(--text-muted)', fontSize: '14px',
            }}>
              Showing {records.length} of {totalCount} records
              <div className="nex-pagination-controls" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
