import { useState, useEffect, useCallback } from 'react';
import adminService, { AdminTrade } from '../../services/admin.service';
import { toast } from 'sonner';

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getAllTrades();
      if (response.success) {
        setTrades(response.data);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load trade history';
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
    trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.buyer_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trade.seller_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Trade History</h1>
          <p>View all executed trades</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Trade History</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by pair, trade ID, or usernames..."
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
              <p>Loading trade history...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Executed At</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Pair</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Total</th>
                    <th>Buyer Fee</th>
                    <th>Seller Fee</th>
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
                          <p>No trade history found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((trade) => (
                      <tr key={trade.id}>
                        <td>{formatDate(trade.executed_at)}</td>
                        <td>{trade.buyer_username}</td>
                        <td>{trade.seller_username}</td>
                        <td><strong>{trade.pair}</strong></td>
                        <td>{formatNumber(trade.price)}</td>
                        <td>{formatNumber(trade.quantity)}</td>
                        <td><strong>{formatNumber(trade.total)}</strong></td>
                        <td>{formatNumber(trade.buyer_fee)}</td>
                        <td>{formatNumber(trade.seller_fee)}</td>
                        <td>
                          <button 
                            onClick={() => console.log('View trade:', trade)}
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
              Showing {filteredTrades.length} trade records
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
