import { useState, useEffect, useCallback } from 'react';
import p2pService, { P2POrder } from '../../services/p2p.service';
import { toast } from 'sonner';

interface P2POrdersPageProps {
  title: string;
  description: string;
}

export default function P2POrdersPage({ title, description }: P2POrdersPageProps) {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await p2pService.getAllOrders(page);
      setOrders(response.data.orders);
      setTotal(response.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load orders';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));

  const getStatusBadge = (orderStatus: P2POrder['status']) => {
    const map = {
      pending: 'nex-badge-warning',
      paid: 'nex-badge-info',
      completed: 'nex-badge-success',
      cancelled: 'nex-badge-secondary',
      disputed: 'nex-badge-danger',
    };
    return (
      <span className={`nex-badge ${map[orderStatus]}`}>
        {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
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
            <h2>P2P Orders</h2>
            <div className="nex-badge nex-badge-info">
              Total: {total} orders
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
              <p>Loading orders...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Crypto</th>
                    <th>Fiat</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p>No P2P orders found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div className="nex-table-meta">{order.id.substring(0, 8)}...</div>
                        </td>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {order.buyer_username[0].toUpperCase()}
                            </div>
                            <div>
                              <strong>{order.buyer_username}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {order.seller_username[0].toUpperCase()}
                            </div>
                            <div>
                              <strong>{order.seller_username}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div><strong>{parseFloat(order.crypto_amount).toFixed(8)}</strong></div>
                          <div className="nex-table-meta">{order.crypto_currency}</div>
                        </td>
                        <td>
                          <div><strong>{parseFloat(order.fiat_amount).toFixed(2)}</strong></div>
                          <div className="nex-table-meta">{order.fiat_currency}</div>
                        </td>
                        <td>
                          <strong>${parseFloat(order.price).toLocaleString()}</strong>
                        </td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          <div>{formatDate(order.created_at)}</div>
                          {order.completed_at && (
                            <div className="nex-table-meta">Completed: {formatDate(order.completed_at)}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && orders.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Showing page {page} ({orders.length} orders)
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
                  disabled={orders.length < 20}
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
