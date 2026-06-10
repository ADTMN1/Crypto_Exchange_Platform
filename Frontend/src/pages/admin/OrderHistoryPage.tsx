import { useState, useEffect, useCallback } from 'react';
import { mockOrderHistory } from '../../data/mockData';
import { toast } from 'sonner';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState(mockOrderHistory);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation: const response = await orderService.getOrderHistory();
      // setOrders(response.data.orders);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load order history';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order =>
    order.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));

  const getSideBadge = (side: string) => {
    return (
      <span className={`nex-badge ${side === 'buy' ? 'nex-badge-success' : 'nex-badge-danger'}`}>
        {side.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className={`nex-badge ${type === 'market' ? 'nex-badge-purple' : 'nex-badge-info'}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'nex-badge-success',
      cancelled: 'nex-badge-danger',
      pending: 'nex-badge-warning',
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
          <h1>Order History</h1>
          <p>View completed and cancelled order history</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Order History</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by pair or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchOrders} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading order history...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Pair</th>
                    <th>Side</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Rate</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>No order history found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{formatDate(order.date)}</td>
                        <td><strong>{order.pair}</strong></td>
                        <td>{getSideBadge(order.side)}</td>
                        <td>{getTypeBadge(order.type)}</td>
                        <td>{formatNumber(order.amount)}</td>
                        <td>${formatNumber(order.rate)}</td>
                        <td><strong>${formatNumber(order.total)}</strong></td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          <button 
                            onClick={() => console.log('View order:', order.id)}
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

          {!isLoading && filteredOrders.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Showing {filteredOrders.length} order records
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
