import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import adminService, { LoginHistoryRecord } from '../../services/admin.service';

const ACTION_BADGE: Record<string, string> = {
  'User login':             'mu-badge--active',
  'Google OAuth login':     'mu-badge--active',
  'User logout':            'mu-badge--suspended',
  'Access token refreshed': 'mu-badge--role-user',
  'User registered':        'mu-badge--pending',
};

const fmtDate = (v: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(v));

const fmtDateShort = (v: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(v));

export default function LoginHistoryPage() {
  const [records, setRecords]   = useState<LoginHistoryRecord[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [error, setError]       = useState<string | null>(null);
  const LIMIT = 20;

  const fetch = useCallback(async (p: number, s: string) => {
    setLoading(true); setError(null);
    try {
      const res = await adminService.getLoginHistory({ page: p, limit: LIMIT, search: s || undefined });
      setRecords(res.data);
      setTotal(res.totalCount);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load login history';
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(page, search); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetch(1, search); }, 500);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const initials = (r: LoginHistoryRecord) =>
    (r.user_name?.[0] || r.user_email?.[0] || '?').toUpperCase();

  const ip = (r: LoginHistoryRecord) => r.ipAddress || r.ip_address || '—';
  const agent = (r: LoginHistoryRecord) => r.deviceInfo || r.metadata?.userAgent || '—';
  const time = (r: LoginHistoryRecord) => r.loginTime || r.created_at;

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Login History</h1>
          <p>Review user login activity and access history.</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card mu-card">

          {/* ── Toolbar ── */}
          <div className="mu-toolbar">
            <span className="mu-count">{total} events</span>
            <div className="mu-search-wrap">
              <svg className="mu-search-icon" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="mu-search-input" type="text"
                placeholder="User, action, IP…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="mu-search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>

          {error && (
            <div className="nex-error-bar">
              {error}
              <button className="nex-error-retry" onClick={() => fetch(page, search)}>Retry</button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading"><div className="nex-spinner"/><p>Loading…</p></div>

          ) : records.length === 0 ? (
            <div className="nex-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <p>No login events found</p>
              {search && <button className="mu-clear-search-btn" onClick={() => setSearch('')}>Clear search</button>}
            </div>

          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="mu-table-wrap">
                <table className="mu-table">
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
                    {records.map(r => (
                      <tr key={r.id} className="mu-table-row" style={{ cursor: 'default' }}>
                        <td><span className="mu-date">{fmtDate(time(r))}</span></td>
                        <td>
                          <div className="mu-user-cell">
                            <div className="mu-avatar">{initials(r)}</div>
                            <div className="mu-user-text">
                              <span className="mu-username">{r.user_name || 'Unknown'}</span>
                              <span className="mu-email">{r.user_email || r.userId || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`mu-badge ${ACTION_BADGE[r.action] || 'mu-badge--suspended'}`}>
                            {r.action}
                          </span>
                        </td>
                        <td><span className="lh-mono">{ip(r)}</span></td>
                        <td><span className="lh-agent">{agent(r)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="mu-card-list">
                {records.map(r => (
                  <div key={r.id} className="mu-user-card lh-mobile-card">
                    <div className="mu-card-row">
                      <div className="mu-avatar mu-avatar--lg">{initials(r)}</div>
                      <div className="mu-card-info">
                        <span className="mu-username">{r.user_name || 'Unknown'}</span>
                        <span className="mu-email">{r.user_email || r.userId || '—'}</span>
                        <div className="aup-card-badges" style={{ marginTop: 4 }}>
                          <span className={`mu-badge ${ACTION_BADGE[r.action] || 'mu-badge--suspended'}`}>
                            {r.action}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="lh-card-details">
                      {ip(r) !== '—' && (
                        <div className="lh-detail-row">
                          <span className="lh-detail-key">IP</span>
                          <span className="lh-mono">{ip(r)}</span>
                        </div>
                      )}
                      {agent(r) !== '—' && (
                        <div className="lh-detail-row">
                          <span className="lh-detail-key">Device</span>
                          <span className="lh-agent">{agent(r)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mu-card-footer">
                      <span className="mu-date-ago">{fmtDateShort(time(r))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {!isLoading && records.length > 0 && (
            <div className="dep-pagination">
              <span className="mu-count">Page {page} of {totalPages} · {total} total</span>
              <div className="dep-page-btns">
                <button className="dep-page-btn" disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
                <button className="dep-page-btn" disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
