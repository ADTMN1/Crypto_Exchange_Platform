import { useState, useEffect, useCallback } from 'react';
import binaryService, { BinaryTrade } from '../../services/binary.service';
import { toast } from 'sonner';

interface BinaryTradesPageProps {
  status: 'running' | 'win' | 'lose' | 'all';
  title: string;
  description: string;
}

export default function BinaryTradesPage({ status, title, description }: BinaryTradesPageProps) {
  const [trades, setTrades] = useState<BinaryTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await binaryService.getAdminTrades(status, page);
      setTrades(response.data.trades);
      setTotal(response.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load trades';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));

  const getStatusBadge = (tradeStatus: 'running' | 'win' | 'lose') => {
    const map = {
      running: 'nex-badge-warning',
      win: 'nex-badge-success',
      lose: 'nex-badge-danger',
    };
    return (
      <span className={`nex-badge ${map[tradeStatus]}`}>
        {tradeStatus.toUpperCase()}
      </span>
    );
  };

  const getDirectionBadge = (direction: 'UP' | 'DOWN') => {
    return (
      <span className={`nex-badge ${direction === 'UP' ? 'nex-badge-success' : 'nex-badge-danger'}`}>
        {direction === 'UP' ? '↑' : '↓'} {direction}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Binary Trades</h2>
            <div className="nex-badge nex-badge-info">
              Total: {total} trades
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchTrades} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading trades...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Pair</th>
                    <th>Direction</th>
                    <th>Amount (USDT)</th>
                    <th>Entry Price</th>
                    <th>Close Price</th>
                    <th>Status</th>
                    <th>Payout</th>
                    <th>Duration</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p>No {status === 'all' ? '' : status} trades found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    trades.map((trade) => (
                      <tr key={trade.id}>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {((trade as any).username?.[0] || (trade as any).email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                              <strong>{(trade as any).username || 'User'}</strong>
                              <div className="nex-table-meta">{trade.user_id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{trade.pair}</strong>
                        </td>
                        <td>{getDirectionBadge(trade.direction)}</td>
                        <td>
                          <strong>${parseFloat(trade.amount).toFixed(2)}</strong>
                        </td>
                        <td>
                          <div>${parseFloat(trade.entry_price).toLocaleString()}</div>
                        </td>
                        <td>
                          {trade.close_price ? (
                            <div>${parseFloat(trade.close_price).toLocaleString()}</div>
                          ) : (
                            <span className="nex-table-meta">Pending</span>
                          )}
                        </td>
                        <td>{getStatusBadge(trade.status)}</td>
                        <td>
                          {parseFloat(trade.payout) > 0 ? (
                            <strong className="text-success">${parseFloat(trade.payout).toFixed(2)}</strong>
                          ) : (
                            <span className="nex-table-meta">-</span>
                          )}
                        </td>
                        <td>
                          <span className="nex-badge nex-badge-xs nex-badge-info">{trade.duration}s</span>
                        </td>
                        <td>
                          <div>{formatDate(trade.created_at)}</div>
                          {trade.resolved_at && (
                            <div className="nex-table-meta">Resolved: {formatDate(trade.resolved_at)}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && trades.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Showing page {page} ({trades.length} trades)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="nex-btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '14px' }}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={trades.length < 20}
                  className="nex-btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '14px' }}
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
