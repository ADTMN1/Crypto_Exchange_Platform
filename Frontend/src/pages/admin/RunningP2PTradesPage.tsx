import { useState, useEffect, useCallback } from 'react';
import { mockP2PRunningTrades } from '../../data/mockData';
import { toast } from 'sonner';

export default function RunningP2PTradesPage() {
  const [trades, setTrades] = useState(mockP2PRunningTrades);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation: const response = await p2pService.getRunningTrades();
      // setTrades(response.data.trades);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load P2P trades';
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
    trade.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));

  const getTypeBadge = (type: string) => {
    return (
      <span className={`nex-badge ${type === 'buy' ? 'nex-badge-success' : 'nex-badge-danger'}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      running: 'nex-badge-warning',
      completed: 'nex-badge-success',
      disputed: 'nex-badge-danger',
      cancelled: 'nex-badge-secondary',
    };
    return (
      <span className={`nex-badge ${map[status] || 'nex-badge-warning'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>P2P Running Trades</h1>
          <p>Monitor active peer-to-peer trades</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Running P2P Trades</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by asset, seller, buyer, or order ID..."
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
              <p>Loading P2P trades...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Type</th>
                    <th>Asset</th>
                    <th>Seller</th>
                    <th>Buyer</th>
                    <th>Rate</th>
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>No running P2P trades found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((trade) => (
                      <tr key={trade.id}>
                        <td><strong>{trade.orderId}</strong></td>
                        <td>{getTypeBadge(trade.type)}</td>
                        <td><strong>{trade.asset}/{trade.fiat}</strong></td>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {trade.seller.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{trade.seller}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {trade.buyer.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{trade.buyer}</strong>
                            </div>
                          </div>
                        </td>
                        <td>${formatNumber(trade.rate)}</td>
                        <td>
                          <span className="nex-badge nex-badge-xs nex-badge-info">{trade.paymentMethod}</span>
                        </td>
                        <td>{formatDate(trade.date)}</td>
                        <td>{getStatusBadge(trade.status)}</td>
                        <td>
                          <button 
                            onClick={() => console.log('View P2P trade:', trade.id)}
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
              Showing {filteredTrades.length} P2P trades
            </div>
          )}
        </div>
      </section>
    </main>
  );
}