import { useState, useEffect, useCallback } from 'react';
import { mockCompletedP2PTrades } from '../../data/mockData';
import { toast } from 'sonner';

export default function CompletedP2PTradesPage() {
  const [trades, setTrades] = useState(mockCompletedP2PTrades);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const fetchCompletedTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation: const response = await p2pService.getCompletedTrades({ page, limit });
      // setTrades(response.data.trades);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load completed P2P trades';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchCompletedTrades();
  }, [fetchCompletedTrades]);

  const filteredTrades = trades.filter(trade =>
    trade.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.fiat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedTrades = filteredTrades.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredTrades.length / limit);

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
      completed: 'nex-badge-success',
      cancelled: 'nex-badge-danger',
    };
    return (
      <span className={`nex-badge ${map[status] || 'nex-badge-warning'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleViewTrade = (trade: any) => {
    console.log('View P2P Trade Details:', trade);
    toast.info(`Viewing trade ${trade.orderId} - ${trade.asset}/${trade.fiat}`);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Completed P2P Trades</h1>
          <p>View completed and cancelled peer-to-peer trading history</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Completed Trades</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by asset, user, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchCompletedTrades} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading completed P2P trades...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Asset | Fiat</th>
                    <th>Seller</th>
                    <th>Buyer</th>
                    <th>Order ID | Date</th>
                    <th>Rate | Payment Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrades.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>Data not found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTrades.map((trade) => (
                      <tr key={trade.id}>
                        <td>{getTypeBadge(trade.type)}</td>
                        <td>
                          <div>
                            <strong>{trade.asset} / {trade.fiat}</strong>
                          </div>
                        </td>
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
                        <td>
                          <div>
                            <strong>{trade.orderId}</strong>
                            <div className="nex-table-meta">{formatDate(trade.date)}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{formatNumber(trade.rate)} {trade.fiat}</strong>
                            <div className="nex-table-meta">{trade.paymentMethod}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{formatNumber(trade.amount)} {trade.asset}</strong>
                            <div className="nex-table-meta">≈ {formatNumber(trade.totalValue)} {trade.fiat}</div>
                          </div>
                        </td>
                        <td>{getStatusBadge(trade.status)}</td>
                        <td>
                          <button 
                            onClick={() => handleViewTrade(trade)}
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

          {!isLoading && paginatedTrades.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, filteredTrades.length)} of {filteredTrades.length} completed trades
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="nex-btn-xs nex-btn-secondary"
                >
                  Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="nex-btn-xs nex-btn-secondary"
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