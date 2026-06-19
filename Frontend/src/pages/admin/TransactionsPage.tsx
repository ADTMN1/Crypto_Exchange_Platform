import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import transactionService, { AdminTransaction } from '../../services/transaction.service';

// ─── Detail Modal ────────────────────────────────────────────────────────────

function TransactionDetailModal({
  tx,
  onClose,
}: {
  tx: AdminTransaction;
  onClose: () => void;
}) {
  const fmtNum = (n: string | number | null | undefined) => {
    if (n === null || n === undefined || n === '') return '—';
    return parseFloat(String(n)).toLocaleString('en-US', { maximumFractionDigits: 8 });
  };
  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(d));
  };

  const isDeposit = tx.type === 'deposit';
  const statusMap: Record<string, string> = {
    completed: 'nex-badge-success',
    pending:   'nex-badge-warning',
    failed:    'nex-badge-danger',
  };

  const rows: [string, React.ReactNode][] = [
    ['Transaction ID',  <span style={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>{tx.id}</span>],
    ['User',            tx.user_email ? `${tx.user_username || ''} (${tx.user_email})` : tx.user_id],
    ['Type',            <span className={`nex-badge ${isDeposit ? 'nex-badge-success' : 'nex-badge-warning'}`}>{tx.type}</span>],
    ['Currency',        <strong>{tx.currency}</strong>],
    ['Amount',          <span style={{ color: isDeposit ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{isDeposit ? '+' : '-'}{fmtNum(tx.amount)}</span>],
    ['Fee',             fmtNum(tx.fee)],
    ['Status',          <span className={`nex-badge ${statusMap[tx.status] ?? 'nex-badge-info'}`}>{tx.status}</span>],
    ['Confirmations',   tx.confirmations],
    ['TX Hash',         tx.tx_hash ? <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{tx.tx_hash}</span> : '—'],
    ['From Address',    tx.from_address ? <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{tx.from_address}</span> : '—'],
    ['To Address',      tx.to_address ? <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{tx.to_address}</span> : '—'],
    ['Created At',      fmtDate(tx.created_at)],
    ['Confirmed At',    fmtDate(tx.confirmed_at)],
    ['Wallet ID',       <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{tx.wallet_id}</span>],
  ];

  return (
    <div className="nex-modal-overlay" onClick={onClose}>
      <div
        className="nex-modal-content"
        style={{ maxWidth: 540, width: '94%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="nex-modal-header">
          <h2>Transaction Details</h2>
          <button className="nex-modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(169,255,232,0.08)',
                alignItems: 'start',
              }}
            >
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', paddingTop: 2 }}>{label}</span>
              <span style={{ color: 'var(--text-main)', fontSize: 14, wordBreak: 'break-word' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose} style={{ minWidth: 100 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

interface Filters {
  search: string;
  type: string;
  currency: string;
  status: string;
  date_from: string;
  date_to: string;
  amount_min: string;
  amount_max: string;
}

const EMPTY_FILTERS: Filters = {
  search: '', type: '', currency: '', status: '',
  date_from: '', date_to: '', amount_min: '', amount_max: '',
};

function FilterBar({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}) {
  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [k]: e.target.value });

  const hasActive = Object.values(filters).some(Boolean);

  const selectStyle: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(169,255,232,0.12)',
    background: 'rgba(255,255,255,0.04)', color: 'var(--text-main)', fontSize: 13,
  };
  const inputStyle: React.CSSProperties = { ...selectStyle, minWidth: 130 };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
      <select value={filters.type} onChange={set('type')} style={selectStyle}>
        <option value="">All Types</option>
        <option value="deposit">Deposit</option>
        <option value="withdrawal">Withdrawal</option>
      </select>

      <select value={filters.status} onChange={set('status')} style={selectStyle}>
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
      </select>

      <select value={filters.currency} onChange={set('currency')} style={selectStyle}>
        <option value="">All Currencies</option>
        {['BTC','ETH','USDT','BNB','SOL','MATIC','LTC','XRP'].map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.date_from}
        onChange={set('date_from')}
        style={inputStyle}
        placeholder="From date"
        title="From date"
      />
      <input
        type="date"
        value={filters.date_to}
        onChange={set('date_to')}
        style={inputStyle}
        placeholder="To date"
        title="To date"
      />

      <input
        type="number"
        value={filters.amount_min}
        onChange={set('amount_min')}
        style={{ ...inputStyle, minWidth: 110 }}
        placeholder="Min amount"
        min="0"
        step="0.00000001"
      />
      <input
        type="number"
        value={filters.amount_max}
        onChange={set('amount_max')}
        style={{ ...inputStyle, minWidth: 110 }}
        placeholder="Max amount"
        min="0"
        step="0.00000001"
      />

      {hasActive && (
        <button
          onClick={onReset}
          style={{
            padding: '9px 16px', borderRadius: 10,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.08)',
            color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [total, setTotal]               = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const [limit]                         = useState(20);
  const [filters, setFilters]           = useState<Filters>(EMPTY_FILTERS);
  const [selectedTx, setSelectedTx]     = useState<AdminTransaction | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTransactions = useCallback(async (currentPage: number, currentFilters: Filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit,
        ...(currentFilters.search     && { search:     currentFilters.search }),
        ...(currentFilters.type       && { type:       currentFilters.type }),
        ...(currentFilters.currency   && { currency:   currentFilters.currency }),
        ...(currentFilters.status     && { status:     currentFilters.status }),
        ...(currentFilters.date_from  && { date_from:  currentFilters.date_from }),
        ...(currentFilters.date_to    && { date_to:    currentFilters.date_to }),
        ...(currentFilters.amount_min && { amount_min: currentFilters.amount_min }),
        ...(currentFilters.amount_max && { amount_max: currentFilters.amount_max }),
      };
      const res = await transactionService.getAdminTransactions(params);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to fetch transactions';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTransactions(page, filters);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1);
    fetchTransactions(1, filters);
  }, [filters.type, filters.currency, filters.status, filters.date_from, filters.date_to, filters.amount_min, filters.amount_max]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchTransactions(1, filters);
    }, 500);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [filters.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatDate = (d: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d));

  const fmtNum = (n: string | number) =>
    parseFloat(String(n)).toLocaleString('en-US', { maximumFractionDigits: 8 });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'nex-badge-success',
      pending:   'nex-badge-warning',
      failed:    'nex-badge-danger',
    };
    return (
      <span className={`nex-badge ${map[status] ?? 'nex-badge-info'}`}>
        {status}
      </span>
    );
  };

  const typeBadge = (type: string) => {
    const isDeposit = type === 'deposit';
    return (
      <span className={`nex-badge ${isDeposit ? 'nex-badge-success' : 'nex-badge-warning'}`}>
        {type}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Transaction History</h1>
          <p>Review and monitor all platform financial transactions.</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>All Transactions</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by ID, user, currency, tx hash…"
                value={filters.search}
                onChange={handleSearchChange}
                className="nex-search-input"
              />
            </div>
          </div>

          <FilterBar
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleReset}
          />

          {error && (
            <div style={{
              padding: '1rem', marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, color: '#ef4444',
            }}>
              {error}
              <button
                onClick={() => fetchTransactions(page, filters)}
                style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading transactions…</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Currency</th>
                    <th>Amount</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>
                            {Object.values(filters).some(Boolean)
                              ? 'No transactions match the current filters'
                              : 'No transactions found'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isDeposit = tx.type === 'deposit';
                      return (
                        <tr key={tx.id}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                              {tx.id.substring(0, 8)}…
                            </span>
                          </td>

                          <td>
                            <div className="nex-user-cell">
                              <div
                                className="nex-avatar-circle"
                                style={{ width: 32, height: 32, fontSize: 13,
                                  background: 'rgba(169,255,232,0.08)',
                                  color: '#a9ffe8', border: '1px solid rgba(169,255,232,0.15)' }}
                              >
                                {(tx.user_username ?? tx.user_email ?? '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                  {tx.user_username || '—'}
                                </div>
                                <div className="nex-table-meta" style={{ fontSize: 11 }}>
                                  {tx.user_email || tx.user_id.substring(0, 12) + '…'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td>{typeBadge(tx.type)}</td>
                          <td><strong>{tx.currency}</strong></td>

                          <td>
                            <span style={{ color: isDeposit ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                              {isDeposit ? '+' : '-'}{fmtNum(tx.amount)}
                            </span>
                          </td>

                          <td style={{ color: 'var(--text-muted)' }}>
                            {tx.fee && parseFloat(tx.fee) > 0 ? fmtNum(tx.fee) : '—'}
                          </td>

                          <td>{statusBadge(tx.status)}</td>

                          <td>
                            <div style={{ fontSize: 13 }}>{formatDate(tx.created_at)}</div>
                          </td>

                          <td>
                            <button
                              onClick={() => setSelectedTx(tx)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 8,
                                background: 'rgba(169,255,232,0.07)',
                                border: '1px solid rgba(169,255,232,0.14)',
                                color: '#a9ffe8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && transactions.length > 0 && (
            <div style={{
              marginTop: '1rem', padding: '1rem',
              borderTop: '1px solid rgba(169,255,232,0.12)',
              color: 'var(--text-muted)', fontSize: 14,
            }}>
              Showing {transactions.length} of {total} transactions
              <div
                className="nex-pagination-controls"
                style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
              >
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

      {selectedTx && (
        <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
      )}
    </main>
  );
}
