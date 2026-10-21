import { useState, useEffect, useCallback } from 'react';
import walletService, { PendingDeposit } from '../../services/wallet.service';
import { toast } from 'sonner';

interface AdminTransactionsProps {
  title?: string;
  description?: string;
  type?: string;
}

const typeToStatusMap: Record<string, string> = {
  'pending-deposits':  'pending',
  'approved-deposits': 'completed',
  'rejected-deposits': 'failed',
  'all':               'all',
};

type DepositStatus = 'pending' | 'completed' | 'failed' | string;

function StatusBadge({ status }: { status: DepositStatus }) {
  const cls =
    status === 'pending'   ? 'mu-badge mu-badge--pending'   :
    status === 'completed' ? 'mu-badge mu-badge--active'    :
    status === 'failed'    ? 'mu-badge mu-badge--banned'    :
                             'mu-badge mu-badge--suspended';
  return <span className={cls}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

export default function AdminTransactions({
  title       = 'Transactions',
  description = 'Review platform transaction history and settlement details.',
  type        = 'all',
}: AdminTransactionsProps) {
  const [deposits, setDeposits]           = useState<PendingDeposit[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const [selectedDeposit, setSelected]    = useState<PendingDeposit | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // deposit id

  const status = typeToStatusMap[type] || type;
  const isPending = status === 'pending';

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchDeposits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await walletService.getDepositsByStatus(status, page);
      setDeposits(response.data.data.deposits);
      setTotal(response.data.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load deposits';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  // ── actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (deposit: PendingDeposit) => {
    setActionLoading(deposit.id);
    try {
      await walletService.approveDeposit(deposit.id);
      toast.success('Deposit approved successfully');
      setSelected(null);
      fetchDeposits();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (deposit: PendingDeposit) => {
    setActionLoading(deposit.id);
    try {
      await walletService.rejectDeposit(deposit.id);
      toast.success('Deposit rejected');
      setSelected(null);
      fetchDeposits();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject deposit');
    } finally {
      setActionLoading(null);
    }
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  const fmt = (d: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d));

  const fmtShort = (d: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(d));

  const initials = (u: PendingDeposit) =>
    (u.username?.[0] || u.email?.[0] || 'U').toUpperCase();

  const isActing = (id: string) => actionLoading === id;

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
              <span className="mu-count">{total} deposits</span>
              {isPending && (
                <span className="dep-pending-chip">Pending review</span>
              )}
            </div>
            <button className="dep-refresh-btn" onClick={fetchDeposits} aria-label="Refresh">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>

          {/* ── Error bar ── */}
          {error && (
            <div className="nex-error-bar">
              {error}
              <button onClick={fetchDeposits} className="nex-error-retry">Retry</button>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading deposits…</p>
            </div>

          ) : deposits.length === 0 ? (
            <div className="nex-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" />
              </svg>
              <p>No deposits found</p>
            </div>

          ) : (
            <>
              {/* ── Desktop table ── */}
              <div className="mu-table-wrap">
                <table className="mu-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Currency</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Screenshot</th>
                      <th>Date</th>
                      {isPending && <th style={{ width: 140 }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map(deposit => (
                      <tr key={deposit.id} className="mu-table-row" onClick={() => setSelected(deposit)}>
                        <td>
                          <div className="mu-user-cell">
                            <div className="mu-avatar">{initials(deposit)}</div>
                            <div className="mu-user-text">
                              <span className="mu-username">{deposit.username || 'User'}</span>
                              <span className="mu-email">{deposit.email}</span>
                            </div>
                          </div>
                        </td>
                        <td><strong className="dep-currency">{deposit.currency}</strong></td>
                        <td>
                          <span className="dep-amount">
                            {parseFloat(deposit.amount).toFixed(4)}
                            <span className="dep-amount-cur"> {deposit.currency}</span>
                          </span>
                        </td>
                        <td><StatusBadge status={deposit.status} /></td>
                        <td>
                          {deposit.screenshot_url
                            ? <span className="dep-screenshot-chip">📎 View</span>
                            : <span className="mu-date-ago">—</span>
                          }
                        </td>
                        <td>
                          <span className="mu-date">{fmtShort(deposit.created_at)}</span>
                        </td>
                        {isPending && (
                          <td onClick={e => e.stopPropagation()}>
                            <div className="dep-action-btns">
                              <button
                                className="dep-btn dep-btn--approve"
                                disabled={isActing(deposit.id)}
                                onClick={() => handleApprove(deposit)}
                              >
                                {isActing(deposit.id) ? '…' : 'Approve'}
                              </button>
                              <button
                                className="dep-btn dep-btn--reject"
                                disabled={isActing(deposit.id)}
                                onClick={() => handleReject(deposit)}
                              >
                                {isActing(deposit.id) ? '…' : 'Reject'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="mu-card-list">
                {deposits.map(deposit => (
                  <div
                    key={deposit.id}
                    className="mu-user-card dep-mobile-card"
                    onClick={() => setSelected(deposit)}
                  >
                    {/* Top row */}
                    <div className="mu-card-row">
                      <div className="mu-avatar mu-avatar--lg">{initials(deposit)}</div>
                      <div className="mu-card-info">
                        <span className="mu-username">{deposit.username || 'User'}</span>
                        <span className="mu-email">{deposit.email}</span>
                        <span className="dep-amount dep-amount--card">
                          {parseFloat(deposit.amount).toFixed(4)} <strong>{deposit.currency}</strong>
                        </span>
                      </div>
                      <StatusBadge status={deposit.status} />
                    </div>

                    {/* Footer */}
                    <div className="mu-card-footer">
                      <span className="mu-date-ago">{fmtShort(deposit.created_at)}</span>
                      <div className="dep-card-right" onClick={e => e.stopPropagation()}>
                        {deposit.screenshot_url && (
                          <button
                            className="dep-screenshot-chip dep-screenshot-chip--btn"
                            onClick={() => setSelected(deposit)}
                          >
                            📎 Screenshot
                          </button>
                        )}
                        {isPending && (
                          <div className="dep-action-btns">
                            <button
                              className="dep-btn dep-btn--approve"
                              disabled={isActing(deposit.id)}
                              onClick={() => handleApprove(deposit)}
                            >
                              {isActing(deposit.id) ? '…' : '✓'}
                            </button>
                            <button
                              className="dep-btn dep-btn--reject"
                              disabled={isActing(deposit.id)}
                              onClick={() => handleReject(deposit)}
                            >
                              {isActing(deposit.id) ? '…' : '✗'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {!isLoading && deposits.length > 0 && (
            <div className="dep-pagination">
              <span className="mu-count">Page {page} · {deposits.length} shown</span>
              <div className="dep-page-btns">
                <button
                  className="dep-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <button
                  className="dep-page-btn"
                  disabled={deposits.length < 50}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Deposit Detail / Screenshot Modal ── */}
      {selectedDeposit && (
        <div className="dep-modal-overlay" onClick={() => setSelected(null)}>
          <div className="dep-modal" onClick={e => e.stopPropagation()}>

            {/* Drag handle — visible on mobile only */}
            <div className="dep-modal-handle" aria-hidden="true" />

            {/* Modal header */}
            <div className="dep-modal-header">
              <div className="dep-modal-title">
                <div className="mu-avatar mu-avatar--lg dep-modal-avatar">
                  {initials(selectedDeposit)}
                </div>
                <div>
                  <h2>{selectedDeposit.username || 'User'}</h2>
                  <span className="mu-email">{selectedDeposit.email}</span>
                </div>
              </div>
              <button className="nex-modal-close" onClick={() => setSelected(null)}>×</button>
            </div>

            {/* Deposit details grid */}
            <div className="dep-modal-details">
              <div className="dep-detail-row">
                <span className="dep-detail-label">Amount</span>
                <span className="dep-detail-value dep-amount">
                  {parseFloat(selectedDeposit.amount).toFixed(8)}
                  <strong> {selectedDeposit.currency}</strong>
                </span>
              </div>
              <div className="dep-detail-row">
                <span className="dep-detail-label">Status</span>
                <span className="dep-detail-value">
                  <StatusBadge status={selectedDeposit.status} />
                </span>
              </div>
              <div className="dep-detail-row">
                <span className="dep-detail-label">Date</span>
                <span className="dep-detail-value">{fmt(selectedDeposit.created_at)}</span>
              </div>
              <div className="dep-detail-row">
                <span className="dep-detail-label">Deposit ID</span>
                <span className="dep-detail-value dep-id">{selectedDeposit.id}</span>
              </div>
            </div>

            {/* Screenshot */}
            {selectedDeposit.screenshot_url ? (
              <div className="dep-modal-screenshot">
                <p className="dep-screenshot-label">Payment Screenshot</p>
                <img
                  src={selectedDeposit.screenshot_url}
                  alt="Deposit payment screenshot"
                  className="dep-screenshot-img"
                />
                <a
                  href={selectedDeposit.screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                  className="dep-open-link"
                >
                  Open full image ↗
                </a>
              </div>
            ) : (
              <div className="dep-no-screenshot">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>No screenshot uploaded</span>
              </div>
            )}

            {/* Approve / Reject — only for pending */}
            {isPending && selectedDeposit.status === 'pending' && (
              <div className="dep-modal-actions">
                <button
                  className="dep-modal-btn dep-modal-btn--reject"
                  disabled={isActing(selectedDeposit.id)}
                  onClick={() => handleReject(selectedDeposit)}
                >
                  {isActing(selectedDeposit.id) ? 'Processing…' : '✗ Reject Deposit'}
                </button>
                <button
                  className="dep-modal-btn dep-modal-btn--approve"
                  disabled={isActing(selectedDeposit.id)}
                  onClick={() => handleApprove(selectedDeposit)}
                >
                  {isActing(selectedDeposit.id) ? 'Processing…' : '✓ Approve Deposit'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
