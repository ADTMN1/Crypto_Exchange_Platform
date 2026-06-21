import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import notificationService from '../../services/notification.service';

// ─── types ───────────────────────────────────────────────────────────────────

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

// ─── helpers ─────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  USER_REGISTERED:        'nex-badge-success',
  DEPOSIT_REQUESTED:      'nex-badge-info',
  DEPOSIT_APPROVED:       'nex-badge-success',
  DEPOSIT_REJECTED:       'nex-badge-danger',
  WITHDRAWAL_REQUESTED:   'nex-badge-warning',
  WITHDRAWAL_APPROVED:    'nex-badge-success',
  WITHDRAWAL_REJECTED:    'nex-badge-danger',
  SUPPORT_TICKET_CREATED: 'nex-badge-purple',
  USER_BANNED:            'nex-badge-danger',
};

const formatDate = (v: string) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(v));

const RELATED_PATHS: Record<string, (meta: Record<string, any>) => string | null> = {
  DEPOSIT_REQUESTED:      (m) => m.transactionId  ? `/admin/deposits`           : null,
  DEPOSIT_APPROVED:       (m) => m.transactionId  ? `/admin/deposits`           : null,
  DEPOSIT_REJECTED:       (m) => m.transactionId  ? `/admin/deposits`           : null,
  WITHDRAWAL_REQUESTED:   (m) => m.withdrawalId   ? `/admin/withdrawals/${m.withdrawalId}` : null,
  WITHDRAWAL_APPROVED:    (m) => m.withdrawalId   ? `/admin/withdrawals/${m.withdrawalId}` : null,
  WITHDRAWAL_REJECTED:    (m) => m.withdrawalId   ? `/admin/withdrawals/${m.withdrawalId}` : null,
  SUPPORT_TICKET_CREATED: (m) => m.ticketId       ? `/admin/support-ticket/ticket/${m.ticketId}` : null,
  USER_REGISTERED:        (m) => m.userId         ? `/admin/users/${m.userId}`  : null,
  USER_BANNED:            (m) => m.targetUserId   ? `/admin/users/${m.targetUserId}` : null,
};

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminNotificationHistoryPage() {
  const navigate = useNavigate();

  const [records, setRecords]     = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [totalCount, setTotal]    = useState(0);
  const limit = 20;

  // debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecords = useCallback(async (p: number, s: string, t: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotificationHistory({
        page: p, limit,
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

  // initial + page change
  useEffect(() => {
    fetchRecords(page, search, typeFilter);
  }, [page, typeFilter]);

  // debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchRecords(1, search, typeFilter);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const getRelatedPath = (r: HistoryRecord): string | null => {
    const fn = RELATED_PATHS[r.type];
    return fn ? fn(r.metadata ?? {}) : null;
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Notification History</h1>
          <p>All notifications sent by the system, searchable and filterable.</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          {/* toolbar */}
          <div className="nex-card-title">
            <h2>Sent Notifications</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="nex-search-input"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                style={{ minWidth: 180 }}
              >
                <option value="">All Types</option>
                <option value="USER_REGISTERED">User Registered</option>
                <option value="DEPOSIT_REQUESTED">Deposit Requested</option>
                <option value="DEPOSIT_APPROVED">Deposit Approved</option>
                <option value="DEPOSIT_REJECTED">Deposit Rejected</option>
                <option value="WITHDRAWAL_REQUESTED">Withdrawal Requested</option>
                <option value="WITHDRAWAL_APPROVED">Withdrawal Approved</option>
                <option value="WITHDRAWAL_REJECTED">Withdrawal Rejected</option>
                <option value="SUPPORT_TICKET_CREATED">Support Ticket</option>
                <option value="USER_BANNED">User Banned</option>
              </select>
              <div className="nex-search-box">
                <input
                  type="text"
                  placeholder="Search by title, type, user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="nex-search-input"
                />
              </div>
            </div>
          </div>

          {/* error */}
          {error && (
            <div style={{
              padding: '1rem', marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', color: '#ef4444',
            }}>
              {error}
              <button
                onClick={() => fetchRecords(page, search, typeFilter)}
                style={{ marginLeft: '1rem', textDecoration: 'underline', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* table */}
          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading notifications...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p>No notifications have been sent yet.</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Notification activity will appear here once the system starts sending messages.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map((r, i) => {
                      const relatedPath = getRelatedPath(r);
                      return (
                        <tr key={`${r.notification_id}-${r.user_id}-${i}`}>
                          {/* title */}
                          <td>
                            <div>
                              <strong>{r.title}</strong>
                              <div className="nex-table-meta" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.body}
                              </div>
                            </div>
                          </td>

                          {/* type */}
                          <td>
                            <span className={`nex-badge ${TYPE_BADGE[r.type] ?? 'nex-badge-secondary'}`}>
                              {r.type.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* recipient */}
                          <td>
                            {r.recipient_username || r.recipient_email ? (
                              <div className="nex-user-cell">
                                <div className="nex-avatar-circle">
                                  {(r.recipient_username?.[0] ?? r.recipient_email?.[0] ?? '?').toUpperCase()}
                                </div>
                                <div>
                                  <strong>{r.recipient_username ?? '—'}</strong>
                                  <div className="nex-table-meta">{r.recipient_email ?? '—'}</div>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>

                          {/* read status */}
                          <td>
                            <span className={`nex-badge ${r.is_read ? 'nex-badge-success' : 'nex-badge-warning'}`}>
                              {r.is_read ? 'Read' : 'Unread'}
                            </span>
                          </td>

                          {/* date */}
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                            {formatDate(r.created_at)}
                          </td>

                          {/* actions */}
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {relatedPath && (
                                <button
                                  className="btn-outline"
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                  onClick={() => navigate(relatedPath)}
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* pagination */}
          {!isLoading && records.length > 0 && (
            <div style={{
              marginTop: '1rem', padding: '1rem',
              borderTop: '1px solid rgba(169,255,232,0.12)',
              color: 'var(--text-muted)', fontSize: '14px',
            }}>
              Showing {records.length} of {totalCount} records
              <div className="nex-pagination-controls" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button className="btn-outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
