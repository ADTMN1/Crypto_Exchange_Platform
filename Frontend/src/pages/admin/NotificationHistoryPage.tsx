import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import notificationService from '../../services/notification.service';

interface HistoryRecord {
  notification_id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
  created_at: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  recipient_username: string | null;
  recipient_email: string | null;
}

const TYPE_BADGE: Record<string, string> = {
  USER_REGISTERED:        'mu-badge--active',
  DEPOSIT_REQUESTED:      'mu-badge--role-user',
  DEPOSIT_APPROVED:       'mu-badge--active',
  DEPOSIT_REJECTED:       'mu-badge--banned',
  WITHDRAWAL_REQUESTED:   'mu-badge--pending',
  WITHDRAWAL_APPROVED:    'mu-badge--active',
  WITHDRAWAL_REJECTED:    'mu-badge--banned',
  SUPPORT_TICKET_CREATED: 'mu-badge--role-admin',
  USER_BANNED:            'mu-badge--banned',
};

const fmtDate = (v: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(v));

const fmtDateShort = (v: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
  }).format(new Date(v));

const RELATED_PATHS: Record<string, (meta: Record<string, any>) => string | null> = {
  DEPOSIT_REQUESTED:      (m) => m.transactionId ? `/admin/deposits`                      : null,
  DEPOSIT_APPROVED:       (m) => m.transactionId ? `/admin/deposits`                      : null,
  DEPOSIT_REJECTED:       (m) => m.transactionId ? `/admin/deposits`                      : null,
  WITHDRAWAL_REQUESTED:   (m) => m.withdrawalId  ? `/admin/withdrawals/${m.withdrawalId}` : null,
  WITHDRAWAL_APPROVED:    (m) => m.withdrawalId  ? `/admin/withdrawals/${m.withdrawalId}` : null,
  WITHDRAWAL_REJECTED:    (m) => m.withdrawalId  ? `/admin/withdrawals/${m.withdrawalId}` : null,
  SUPPORT_TICKET_CREATED: (m) => m.ticketId      ? `/admin/support-ticket/${m.ticketId}`  : null,
  USER_REGISTERED:        (m) => m.userId        ? `/admin/users/${m.userId}`              : null,
  USER_BANNED:            (m) => m.targetUserId  ? `/admin/users/${m.targetUserId}`        : null,
};

const TYPE_OPTIONS = [
  { value: '',                        label: 'All Types' },
  { value: 'USER_REGISTERED',         label: 'User Registered' },
  { value: 'DEPOSIT_REQUESTED',       label: 'Deposit Requested' },
  { value: 'DEPOSIT_APPROVED',        label: 'Deposit Approved' },
  { value: 'DEPOSIT_REJECTED',        label: 'Deposit Rejected' },
  { value: 'WITHDRAWAL_REQUESTED',    label: 'Withdrawal Requested' },
  { value: 'WITHDRAWAL_APPROVED',     label: 'Withdrawal Approved' },
  { value: 'WITHDRAWAL_REJECTED',     label: 'Withdrawal Rejected' },
  { value: 'SUPPORT_TICKET_CREATED',  label: 'Support Ticket' },
  { value: 'USER_BANNED',             label: 'User Banned' },
];

export default function AdminNotificationHistoryPage() {
  const navigate = useNavigate();

  const [records, setRecords]       = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [totalCount, setTotal]      = useState(0);
  const LIMIT = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecords = useCallback(async (p: number, s: string, t: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotificationHistory({
        page: p, limit: LIMIT,
        search: s || undefined,
        type:   t || undefined,
      });
      setRecords(res.data);
      setTotal(res.totalCount);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load notification history';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(page, search, typeFilter); }, [page, typeFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchRecords(1, search, typeFilter); }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  const getRelatedPath = (r: HistoryRecord) => {
    const fn = RELATED_PATHS[r.type];
    return fn ? fn(r.metadata ?? {}) : null;
  };

  const initials = (r: HistoryRecord) =>
    (r.recipient_username?.[0] ?? r.recipient_email?.[0] ?? '?').toUpperCase();

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Notification History</h1>
          <p>All notifications sent by the system</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card mu-card">

          {/* ── Toolbar ── */}
          <div className="mu-toolbar nfh-toolbar">
            <div className="mu-toolbar-left">
              <span className="mu-count">{totalCount} notifications</span>
            </div>
            <div className="nfh-filters">
              {/* Type filter */}
              <div className="nfh-select-wrap">
                <svg className="nfh-select-icon" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <select
                  className="nfh-select"
                  value={typeFilter}
                  onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                >
                  {TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {/* Search */}
              <div className="mu-search-wrap">
                <svg className="mu-search-icon" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  className="mu-search-input"
                  placeholder="Title, type, user…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="mu-search-clear" onClick={() => setSearch('')}>✕</button>
                )}
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="nex-error-bar">
              {error}
              <button className="nex-error-retry" onClick={() => fetchRecords(page, search, typeFilter)}>Retry</button>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading ? (
            <div className="nex-loading"><div className="nex-spinner" /><p>Loading notifications…</p></div>

          ) : records.length === 0 ? (
            <div className="nex-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <p>No notifications found</p>
            </div>

          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="mu-table-wrap">
                <table className="mu-table">
                  <thead>
                    <tr>
                      <th>Notification</th>
                      <th>Type</th>
                      <th>Recipient</th>
                      <th>Read</th>
                      <th>Sent At</th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => {
                      const path = getRelatedPath(r);
                      return (
                        <tr key={`${r.notification_id}-${i}`} className="mu-table-row"
                          onClick={() => path && navigate(path)}>
                          <td>
                            <span className="mu-username">{r.title}</span>
                            <span className="mu-email nfh-body">{r.body}</span>
                          </td>
                          <td>
                            <span className={`mu-badge ${TYPE_BADGE[r.type] || 'mu-badge--suspended'}`}>
                              {r.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>
                            {r.recipient_username || r.recipient_email ? (
                              <div className="mu-user-cell">
                                <div className="mu-avatar">{initials(r)}</div>
                                <div className="mu-user-text">
                                  <span className="mu-username">{r.recipient_username ?? '—'}</span>
                                  <span className="mu-email">{r.recipient_email ?? '—'}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="mu-date-ago">—</span>
                            )}
                          </td>
                          <td>
                            <span className={`mu-badge ${r.is_read ? 'mu-badge--active' : 'mu-badge--pending'}`}>
                              {r.is_read ? 'Read' : 'Unread'}
                            </span>
                          </td>
                          <td>
                            <span className="mu-date">{fmtDate(r.created_at)}</span>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            {path && (
                              <button className="wdp-view-btn" onClick={() => navigate(path)}>
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="mu-card-list">
                {records.map((r, i) => {
                  const path = getRelatedPath(r);
                  return (
                    <div key={`m-${r.notification_id}-${i}`}
                      className="mu-user-card nfh-mobile-card"
                      onClick={() => path && navigate(path)}>
                      <div className="mu-card-row">
                        <div className="mu-avatar mu-avatar--lg nfh-notif-icon">🔔</div>
                        <div className="mu-card-info">
                          <span className="mu-username">{r.title}</span>
                          <span className="mu-email nfh-body--card">{r.body}</span>
                          <div className="aup-card-badges">
                            <span className={`mu-badge ${TYPE_BADGE[r.type] || 'mu-badge--suspended'}`}>
                              {r.type.replace(/_/g, ' ')}
                            </span>
                            <span className={`mu-badge ${r.is_read ? 'mu-badge--active' : 'mu-badge--pending'}`}>
                              {r.is_read ? 'Read' : 'Unread'}
                            </span>
                          </div>
                          {(r.recipient_username || r.recipient_email) && (
                            <span className="mu-email">
                              → {r.recipient_username ?? r.recipient_email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mu-card-footer">
                        <span className="mu-date-ago">{fmtDateShort(r.created_at)}</span>
                        {path && (
                          <button className="wdp-view-btn" onClick={e => { e.stopPropagation(); navigate(path); }}>
                            View →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {!isLoading && records.length > 0 && (
            <div className="dep-pagination">
              <span className="mu-count">Page {page} of {totalPages} · {totalCount} total</span>
              <div className="dep-page-btns">
                <button className="dep-page-btn" disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="dep-page-btn" disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
