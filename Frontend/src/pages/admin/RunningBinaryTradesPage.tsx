import { useState, useEffect, useCallback } from 'react';
import { mockBinaryTrades } from '../../data/mockData';
import { toast } from 'sonner';

export default function RunningBinaryTradesPage() {
  const [trades, setTrades] = useState(mockBinaryTrades);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation: const response = await binaryService.getRunningTrades();
      // setTrades(response.data.trades);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load binary trades';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const filteredTrades = trades.filter(trade =>
    trade.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.coinPair.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));

  const getDirectionBadge = (direction: string) => {
    return (
      <span className={`nex-badge ${direction === 'higher' ? 'nex-badge-success' : 'nex-badge-danger'}`}>
        {direction === 'higher' ? '↑' : '↓'} {direction.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      running: 'nex-badge-warning',
      completed: 'nex-badge-success',
    };
    return (
      <span className={`nex-badge ${map[status] || 'nex-badge-warning'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getResultBadge = (winStatus: string | null) => {
    if (!winStatus) return <span className="nex-table-meta">Pending</span>;
    return (
      <span className={`nex-badge ${winStatus === 'win' ? 'nex-badge-success' : 'nex-badge-danger'}`}>
        {winStatus.toUpperCase()}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Binary Running Trades</h1>
          <p>Monitor active binary options trades</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Running Binary Trades</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by user or coin pair..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
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
              <p>Loading binary trades...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Coin Pair</th>
                    <th>Trade Date</th>
                    <th>Invest</th>
                    <th>Duration</th>
                    <th>Direction</th>
                    <th>Win Amount</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p>No running binary trades found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((trade) => (
                      <tr key={trade.id}>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {trade.user.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{trade.user}</strong>
                            </div>
                          </div>
                        </td>
                        <td><strong>{trade.coinPair}</strong></td>
                        <td>{formatDate(trade.tradeDate)}</td>
                        <td><strong>${formatNumber(trade.invest)}</strong></td>
                        <td>
                          <span className="nex-badge nex-badge-xs nex-badge-info">{trade.duration}</span>
                        </td>
                        <td>{getDirectionBadge(trade.direction)}</td>
                        <td>
                          <div className={trade.winStatus === 'win' ? 'text-success' : ''}>
                            <strong>${formatNumber(trade.winAmount)}</strong>
                          </div>
                        </td>
                        <td>{getStatusBadge(trade.status)}</td>
                        <td>{getResultBadge(trade.winStatus)}</td>
                        <td>
                          <button 
                            onClick={() => console.log('View binary trade:', trade.id)}
                            className="nex-btn-xs nex-btn-primary"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredTrades.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Showing {filteredTrades.length} binary trades
            </div>
          )}
        </div>
      </section>
    </main>
  );
}