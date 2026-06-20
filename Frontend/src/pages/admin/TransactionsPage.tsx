import { useState, useEffect, useCallback } from 'react';
import walletService, { PendingDeposit } from '../../services/wallet.service';
import { toast } from 'sonner';

interface AdminTransactionsProps {
  title?: string;
  description?: string;
  type?: 'all' | 'pending-deposits';
}

export default function AdminTransactions({ 
  title = "Transactions", 
  description = "Review platform transaction history and settlement details.",
  type = "all" 
}: AdminTransactionsProps) {
  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDeposit, setSelectedDeposit] = useState<PendingDeposit | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const fetchDeposits = useCallback(async () => {
    if (type !== 'pending-deposits') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await walletService.getPendingDeposits(page);
      setDeposits(response.data.data.deposits);
      setTotal(response.data.data.total);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load deposits';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [type, page]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleApprove = async (deposit: PendingDeposit) => {
    try {
      await walletService.approveDeposit(deposit.id);
      toast.success('Deposit approved successfully!');
      fetchDeposits();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to approve deposit';
      toast.error(msg);
    }
  };

  const handleReject = async (deposit: PendingDeposit) => {
    try {
      await walletService.rejectDeposit(deposit.id);
      toast.success('Deposit rejected');
      fetchDeposits();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reject deposit';
      toast.error(msg);
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'nex-badge-warning',
      completed: 'nex-badge-success',
      failed: 'nex-badge-danger',
    };
    return (
      <span className={`nex-badge ${map[status] || 'nex-badge-info'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (type === 'pending-deposits') {
    return (
      <>
        <div className="admin-page-header">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div className="nex-badge nex-badge-info">
              Total: {total} deposits
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchDeposits} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <div className="loading-spinner-professional">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading deposits...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Currency</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Screenshot</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" />
                          </svg>
                          <p>No pending deposits found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    deposits.map((deposit) => (
                      <tr key={deposit.id}>
                        <td>
                          <div className="nex-user-cell">
                            <div className="nex-avatar-circle">
                              {(deposit.username?.[0] || deposit.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                              <strong>{deposit.username || 'User'}</strong>
                              <div className="nex-table-meta">{deposit.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{deposit.currency}</strong>
                        </td>
                        <td>
                          <strong>{parseFloat(deposit.amount).toFixed(4)} {deposit.currency}</strong>
                        </td>
                        <td>{getStatusBadge(deposit.status)}</td>
                        <td>
                          {deposit.screenshot_url ? (
                            <button
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowScreenshotModal(true);
                              }}
                              className="nex-btn-xs nex-btn-secondary"
                            >
                              View Screenshot
                            </button>
                          ) : (
                            <span className="nex-table-meta">No screenshot</span>
                          )}
                        </td>
                        <td>
                          <div>{formatDate(deposit.created_at)}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleApprove(deposit)}
                              className="nex-btn-xs nex-btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(deposit)}
                              className="nex-btn-xs nex-btn-danger"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && deposits.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem 0 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Showing page {page} ({deposits.length} deposits)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="nex-btn-xs nex-btn-secondary"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={deposits.length < 50}
                  className="nex-btn-xs nex-btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {showScreenshotModal && selectedDeposit && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }} onClick={() => setShowScreenshotModal(false)}>
            <div style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>Deposit Screenshot</h3>
                <button 
                  onClick={() => setShowScreenshotModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '2rem', cursor: 'pointer', padding: '0.25rem' }}
                >
                  ×
                </button>
              </div>
              {selectedDeposit.screenshot_url && (
                <img 
                  src={selectedDeposit.screenshot_url} 
                  alt="Deposit Screenshot" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '75vh', 
                    borderRadius: '12px',
                    objectFit: 'contain',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }} 
                />
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Transaction History</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Coming soon...</p>
      </div>
    </>
  );
}
