import { useState, useEffect, useCallback } from 'react';
import p2pService, { P2POrder } from '../../services/p2p.service';
import { toast } from 'sonner';

interface P2PDisputesPageProps {
  title: string;
  description: string;
}

export default function P2PDisputesPage({ title, description }: P2PDisputesPageProps) {
  const [disputes, setDisputes] = useState<P2POrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await p2pService.getDisputes(page);
      setDisputes(response.data.disputes);
      setTotal(response.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load disputes';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleResolve = async (orderId: string, decision: string, decisionLabel: string) => {
    if (!confirm(`Are you sure you want to ${decisionLabel}?`)) return;

    const adminNote = prompt('Enter admin note (optional):');

    try {
      setResolvingId(orderId);
      await p2pService.resolveDispute(orderId, decision, adminNote || undefined);
      toast.success('Dispute resolved successfully');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));

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
            <h2>Disputed Orders</h2>
            <div className="nex-badge nex-badge-danger">
              {total} disputes
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchDisputes} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading disputes...</p>
            </div>
          ) : disputes.length === 0 ? (
            <div className="nex-empty-state" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 auto 1rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 style={{ marginBottom: '0.5rem' }}>No Disputes</h3>
              <p style={{ color: 'var(--text-muted)' }}>All P2P orders are running smoothly</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
                {disputes.map((dispute) => (
                  <div 
                    key={dispute.id} 
                    className="nex-card"
                    style={{ 
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.05)',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="nex-badge nex-badge-danger">DISPUTED</span>
                          <span className="nex-table-meta">Order ID: {dispute.id.substring(0, 8)}...</span>
                        </div>
                        <div className="nex-table-meta">
                          Disputed: {formatDate(dispute.disputed_at!)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div className="nex-table-meta" style={{ marginBottom: '0.25rem' }}>Buyer</div>
                        <div className="nex-user-cell">
                          <div className="nex-avatar-circle" style={{ width: '32px', height: '32px' }}>
                            {dispute.buyer_username[0].toUpperCase()}
                          </div>
                          <strong>{dispute.buyer_username}</strong>
                        </div>
                      </div>
                      <div>
                        <div className="nex-table-meta" style={{ marginBottom: '0.25rem' }}>Seller</div>
                        <div className="nex-user-cell">
                          <div className="nex-avatar-circle" style={{ width: '32px', height: '32px' }}>
                            {dispute.seller_username[0].toUpperCase()}
                          </div>
                          <strong>{dispute.seller_username}</strong>
                        </div>
                      </div>
                      <div>
                        <div className="nex-table-meta" style={{ marginBottom: '0.25rem' }}>Crypto Amount</div>
                        <strong>{parseFloat(dispute.crypto_amount).toFixed(8)} {dispute.crypto_currency}</strong>
                      </div>
                      <div>
                        <div className="nex-table-meta" style={{ marginBottom: '0.25rem' }}>Fiat Amount</div>
                        <strong>{parseFloat(dispute.fiat_amount).toFixed(2)} {dispute.fiat_currency}</strong>
                      </div>
                      <div>
                        <div className="nex-table-meta" style={{ marginBottom: '0.25rem' }}>Price</div>
                        <strong>${parseFloat(dispute.price).toLocaleString()}</strong>
                      </div>
                      <div>
                        <div className="nex-table-meta" style={{ marginBottom: '0.25rem' }}>Payment Method</div>
                        <div>{dispute.payment_method || 'N/A'}</div>
                      </div>
                    </div>

                    {dispute.admin_note && (
                      <div style={{ 
                        background: 'rgba(169, 255, 232, 0.05)', 
                        padding: '0.75rem', 
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        border: '1px solid rgba(169, 255, 232, 0.1)'
                      }}>
                        <div className="nex-table-meta" style={{ marginBottom: '0.25rem' }}>Admin Note</div>
                        <div>{dispute.admin_note}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleResolve(dispute.id, 'release_to_buyer', 'release crypto to buyer')}
                        disabled={resolvingId === dispute.id}
                        className="nex-btn-success"
                        style={{ flex: '1', minWidth: '180px' }}
                      >
                        {resolvingId === dispute.id ? 'Processing...' : '✓ Release to Buyer'}
                      </button>
                      <button
                        onClick={() => handleResolve(dispute.id, 'return_to_seller', 'return crypto to seller')}
                        disabled={resolvingId === dispute.id}
                        className="nex-btn-danger"
                        style={{ flex: '1', minWidth: '180px' }}
                      >
                        {resolvingId === dispute.id ? 'Processing...' : '✗ Return to Seller'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  Showing page {page} ({disputes.length} disputes)
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
                    disabled={disputes.length < 20}
                    className="nex-btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '14px' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
