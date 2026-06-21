import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import withdrawalService, { Withdrawal } from '../../services/withdrawal.service';

// ── Route → API status (derived from URL, sidebar is source of truth) ────────
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
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls: Record<string, string> = {
    PENDING:  'nex-badge-warning',
    APPROVED: 'nex-badge-success',
    REJECTED: 'nex-badge-danger',
  };
  return <span className={`nex-badge ${cls[status] || 'nex-badge-info'}`}>{status}</span>;
};

// ── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i}>
        <div style={{
          height: 14, borderRadius: 6,
          background: 'rgba(255,255,255,0.06)',
          animation: 'pulse 1.5s ease-in-out infinite',
          width: i === 1 ? '80%' : i === 4 ? '60%' : '70%',
        }} />
      </td>
    ))}
  </tr>
);

interface AdminWithdrawalsProps {
  title?: string;
  description?: string;
  // statusFilter prop kept for backward compat but ignored — URL is source of truth
  statusFilter?: string;
}

export default function AdminWithdrawalsPage({
  title = 'Withdrawals',
  description = 'Review and process withdrawal requests.',
}: AdminWithdrawalsProps) {
  const navigate = useNavigate();
  const status = useWithdrawalStatus();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // reset page when status changes (route change)
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
    PENDING:  'No pending withdrawals found.',
    APPROVED: 'No approved withdrawals found.',
    REJECTED: 'No rejected withdrawals found.',
    ALL:      'No withdrawal requests found.',
  };

  return (
    <>
      {/* ── Page header ── */}
      <div className="admin-page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="admin-panel">
        {/* ── Panel header ── */}
        <div className="admin-panel-header">
          <div className="nex-badge nex-badge-info">
            {isLoading ? '—' : total} withdrawal{total !== 1 ? 's' : ''}
          </div>
          <button
            onClick={fetchWithdrawals}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)', fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            padding: '1rem', marginBottom: '1rem',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{error}</span>
            <button
              onClick={fetchWithdrawals}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="nex-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Address</th>
                <th>Network</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="nex-empty-state">
                    <div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ opacity: 0.35 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p style={{ fontWeight: 600, marginTop: 12 }}>{emptyMsg[status]}</p>
                      <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: 4 }}>
                        New requests will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr
                    key={w.id}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => navigate(`/admin/withdrawals/${w.id}`)}
                  >
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {w.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td>
                      <div className="nex-user-cell">
                        <div className="nex-avatar-circle">
                          {(w.username?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <strong>{w.username || 'User'}</strong>
                          <div className="nex-table-meta">{w.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{parseFloat(w.amount).toFixed(4)}</strong>
                    </td>
                    <td>
                      <span className="nex-badge nex-badge-secondary">{w.currency}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                        {w.withdrawal_address.length > 16
                          ? `${w.withdrawal_address.slice(0, 8)}…${w.withdrawal_address.slice(-6)}`
                          : w.withdrawal_address}
                      </span>
                    </td>
                    <td>{w.network || '—'}</td>
                    <td><StatusBadge status={w.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {fmtDate(w.created_at)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        {/* View icon button */}
                        <button
                          title="View details"
                          onClick={() => navigate(`/admin/withdrawals/${w.id}`)}
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#a0a0a0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = '#a0a0a0';
                          }}
                        >
                          {/* eye icon */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>

                        {w.status === 'PENDING' && (
                          <>
                            {/* Approve icon button */}
                            <button
                              title="Approve withdrawal"
                              onClick={() => navigate(`/admin/withdrawals/${w.id}`)}
                              style={{
                                width: 30, height: 30, borderRadius: 7,
                                border: '1px solid rgba(16,185,129,0.3)',
                                background: 'rgba(16,185,129,0.08)',
                                color: '#10b981',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(16,185,129,0.18)';
                                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.6)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(16,185,129,0.08)';
                                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)';
                              }}
                            >
                              {/* check icon */}
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>

                            {/* Reject icon button */}
                            <button
                              title="Reject withdrawal"
                              onClick={() => navigate(`/admin/withdrawals/${w.id}`)}
                              style={{
                                width: 30, height: 30, borderRadius: 7,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.08)',
                                color: '#ef4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                              }}
                            >
                              {/* x icon */}
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!isLoading && withdrawals.length > 0 && (
          <div style={{
            marginTop: '1.5rem', padding: '1.25rem 0 0',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Page {page} · {withdrawals.length} of {total} results
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 1.1rem', fontSize: '0.875rem',
                  borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: page === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  color: page === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 500, transition: 'all 0.15s',
                }}
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={withdrawals.length < 50}
                style={{
                  padding: '0.5rem 1.1rem', fontSize: '0.875rem',
                  borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: withdrawals.length < 50 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  color: withdrawals.length < 50 ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: withdrawals.length < 50 ? 'not-allowed' : 'pointer',
                  fontWeight: 500, transition: 'all 0.15s',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
