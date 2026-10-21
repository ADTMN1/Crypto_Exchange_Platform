import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import withdrawalService, { Withdrawal } from '../../services/withdrawal.service';

function useWithdrawalStatus() {
  const { pathname } = useLocation();
  if (pathname.includes('pending-withdrawals'))  return 'PENDING';
  if (pathname.includes('approved-withdrawals')) return 'APPROVED';
  if (pathname.includes('rejected-withdrawals')) return 'REJECTED';
  return 'ALL';
}

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(d));
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PENDING:  'mu-badge mu-badge--pending',
    APPROVED: 'mu-badge mu-badge--active',
    REJECTED: 'mu-badge mu-badge--banned',
  };
  return <span className={cls[status] || 'mu-badge mu-badge--suspended'}>{status}</span>;
}

function shortAddr(addr: string) {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

interface AdminWithdrawalsProps {
  title?: string;
  description?: string;
  statusFilter?: string;
}

export default function AdminWithdrawalsPage({
  title = 'Withdrawals',
  description = 'Review and process withdrawal requests.',
}: AdminWithdrawalsProps) {
  const navigate  = useNavigate();
  const status    = useWithdrawalStatus();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);

  useEffect(() => { setPage(1); }, [status]);

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await withdrawalService.getAll(status, page);
      setWithdrawals(response.data.data.withdrawals);
      setTotal(response.data.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load withdrawals';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const emptyMsg: Record<string, string> = {
    PENDING:  'No pending withdrawals.',
    APPROVED: 'No approved withdrawals.',
    REJECTED: 'No rejected withdrawals.',
    ALL:      'No withdrawal requests found.',
  };

  return (
    <main className="nex-admin-section-page">
      {/* ── Page header ── */}
      <section className="nex-section-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card mu-card">

          {/* ── Toolbar ── */}
          <div className="mu-toolbar">
            <div className="mu-toolbar-left">
              <span className="mu-count">{isLoading ? '…' : total} withdrawal{total !== 1 ? 's' : ''}</span>
            </div>
            <button className="dep-refresh-btn" onClick={fetchWithdrawals}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="nex-error-bar">
              {error}
              <button onClick={fetchWithdrawals} className="nex-error-retry">Retry</button>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading withdrawals…</p>
            </div>

          ) : withdrawals.length === 0 ? (
            <div className="nex-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{emptyMsg[status]}</p>
            </div>

          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="mu-table-wrap">
                <table className="mu-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Amount</th>
                      <th>Address</th>
                      <th>Network</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ width: 90 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(w => (
                      <tr key={w.id} className="mu-table-row" onClick={() => navigate(`/admin/withdrawals/${w.id}`)}>
                        <td>
                          <span className="wdp-id">{w.id.slice(0, 8)}…</span>
                        </td>
                        <td>
                          <div className="mu-user-cell">
                            <div className="mu-avatar">{(w.username?.[0] || 'U').toUpperCase()}</div>
                            <div className="mu-user-text">
                              <span className="mu-username">{w.username || 'User'}</span>
                              <span className="mu-email">{w.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="dep-amount">{parseFloat(w.amount).toFixed(4)}</span>
                          <span className="dep-amount-cur"> {w.currency}</span>
                        </td>
                        <td>
                          <span className="wdp-addr">{shortAddr(w.withdrawal_address)}</span>
                        </td>
                        <td>{w.network || '—'}</td>
                        <td><StatusBadge status={w.status} /></td>
                        <td>
                          <span className="mu-date">{fmtDate(w.created_at)}</span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="wdp-row-actions">
                            <button className="wdp-icon-btn" title="View details"
                              onClick={() => navigate(`/admin/withdrawals/${w.id}`)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            {w.status === 'PENDING' && (
                              <>
                                <button className="wdp-icon-btn wdp-icon-btn--approve" title="Approve"
                                  onClick={() => navigate(`/admin/withdrawals/${w.id}`)}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                </button>
                                <button className="wdp-icon-btn wdp-icon-btn--reject" title="Reject"
                                  onClick={() => navigate(`/admin/withdrawals/${w.id}`)}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="mu-card-list">
                {withdrawals.map(w => (
                  <div key={w.id} className="mu-user-card"
                    onClick={() => navigate(`/admin/withdrawals/${w.id}`)}>
                    <div className="mu-card-row">
                      <div className="mu-avatar mu-avatar--lg">{(w.username?.[0] || 'U').toUpperCase()}</div>
                      <div className="mu-card-info">
                        <span className="mu-username">{w.username || 'User'}</span>
                        <span className="mu-email">{w.email}</span>
                        <span className="dep-amount dep-amount--card">
                          {parseFloat(w.amount).toFixed(4)} <strong>{w.currency}</strong>
                        </span>
                        <span className="wdp-addr wdp-addr--card">{shortAddr(w.withdrawal_address)}</span>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                    <div className="mu-card-footer">
                      <span className="mu-date-ago">{fmtDate(w.created_at)}</span>
                      <button className="wdp-view-btn" onClick={e => { e.stopPropagation(); navigate(`/admin/withdrawals/${w.id}`); }}>
                        View →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {!isLoading && withdrawals.length > 0 && (
            <div className="dep-pagination">
              <span className="mu-count">Page {page} · {withdrawals.length} of {total}</span>
              <div className="dep-page-btns">
                <button className="dep-page-btn" disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
                <button className="dep-page-btn" disabled={withdrawals.length < 50}
                  onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
