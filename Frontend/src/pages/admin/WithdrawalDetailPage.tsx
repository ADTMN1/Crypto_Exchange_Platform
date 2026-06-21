import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FaCopy, FaCheck } from 'react-icons/fa';
import withdrawalService, { Withdrawal } from '../../services/withdrawal.service';

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls: Record<string, string> = {
    PENDING:  'nex-badge-warning',
    APPROVED: 'nex-badge-success',
    REJECTED: 'nex-badge-danger',
  };
  return <span className={`nex-badge ${cls[status] || 'nex-badge-info'}`}>{status}</span>;
};

// Labelled detail row used inside cards
const DetailRow = ({ label, value, mono = false, danger = false }: {
  label: string; value: React.ReactNode; mono?: boolean; danger?: boolean;
}) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '140px 1fr',
    gap: '0.75rem', padding: '0.7rem 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }}>
    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, alignSelf: 'start', paddingTop: 2 }}>
      {label}
    </span>
    <span style={{
      fontSize: '0.875rem',
      fontFamily: mono ? 'monospace' : undefined,
      color: danger ? '#ef4444' : undefined,
      wordBreak: 'break-all',
    }}>
      {value}
    </span>
  </div>
);

export default function WithdrawalDetailPage() {
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  const navigate = useNavigate();

  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Approve modal
  const [showApprove, setShowApprove] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Reject modal
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => { if (withdrawalId) fetchDetails(); }, [withdrawalId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await withdrawalService.getById(withdrawalId!);
      setWithdrawal(res.data.data);
    } catch {
      toast.error('Failed to load withdrawal details');
      navigate('/admin/withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await withdrawalService.changeStatus(withdrawalId!, {
        status: 'APPROVED',
        adminNote: adminNote || undefined,
      });
      toast.success('Withdrawal approved');
      setShowApprove(false);
      fetchDetails();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
    setSubmitting(true);
    try {
      await withdrawalService.changeStatus(withdrawalId!, {
        status: 'REJECTED',
        adminNote: rejectNote || undefined,
        rejectionReason: rejectReason,
      });
      toast.success('Withdrawal rejected');
      setShowReject(false);
      fetchDetails();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error('Failed to copy address');
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="nex-admin-section-page">
        <div className="nex-loading">
          <div className="loading-spinner-professional">
            <div className="spinner-ring" />
            <div className="spinner-ring" />
            <div className="spinner-ring" />
          </div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading withdrawal details…</p>
        </div>
      </main>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!withdrawal) {
    return (
      <main className="nex-admin-section-page">
        <section className="nex-section-body">
          <div className="nex-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontWeight: 600, marginTop: 12 }}>Withdrawal not found</p>
            <button onClick={() => navigate('/admin/withdrawals')} className="nex-btn-primary" style={{ marginTop: 16 }}>
              Back to Withdrawals
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isPending = withdrawal.status === 'PENDING';

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <main className="nex-admin-section-page">

      {/* Page header */}
      <section className="nex-section-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ margin: 0 }}>
              {parseFloat(withdrawal.amount).toFixed(8)} {withdrawal.currency}
            </h1>
            <StatusBadge status={withdrawal.status} />
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Withdrawal request by <strong>{withdrawal.username}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)', fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>

          {isPending && (
            <>
              {/* Approve */}
              <button
                onClick={() => { setAdminNote(''); setShowApprove(true); }}
                disabled={submitting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid rgba(16,185,129,0.4)',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981', fontSize: '0.875rem',
                  fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Approve
              </button>

              {/* Reject */}
              <button
                onClick={() => { setRejectReason(''); setRejectNote(''); setShowReject(true); }}
                disabled={submitting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '8px 18px', borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.4)',
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444', fontSize: '0.875rem',
                  fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1, transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Reject
              </button>
            </>
          )}
        </div>
      </section>

      <section className="nex-section-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(280px,1fr)', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Summary card */}
            <div className="nex-card">
              <div className="nex-card-title">
                <h2>Withdrawal Summary</h2>
                <StatusBadge status={withdrawal.status} />
              </div>
              <div className="nex-card-body" style={{ padding: '0 1.5rem 1rem' }}>
                <DetailRow label="Request ID"  value={withdrawal.id} mono />
                <DetailRow label="Amount"      value={<strong style={{ fontSize: '1.05rem' }}>{parseFloat(withdrawal.amount).toFixed(8)} {withdrawal.currency}</strong>} />
                <DetailRow label="Fee"         value={`${parseFloat(withdrawal.fee || '0').toFixed(8)} ${withdrawal.currency}`} />
                <DetailRow label="Net Amount (after fee)"  value={<strong>{parseFloat(withdrawal.net_amount || withdrawal.amount).toFixed(8)} {withdrawal.currency}</strong>} />
                <DetailRow label="Status"      value={<StatusBadge status={withdrawal.status} />} />
              </div>
            </div>

            {/* Destination card */}
            <div className="nex-card">
              <div className="nex-card-title"><h2>Destination</h2></div>
              <div className="nex-card-body" style={{ padding: '0 1.5rem 1rem' }}>
                <DetailRow 
                  label="Address"        
                  value={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                        {withdrawal.withdrawal_address}
                      </span>
                      <button
                        onClick={() => copyToClipboard(withdrawal.withdrawal_address)}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: copied ? '#10b981' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          transition: 'all 0.15s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)';
                          e.currentTarget.style.color = copied ? '#10b981' : 'var(--text-main)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                          e.currentTarget.style.color = copied ? '#10b981' : 'var(--text-muted)';
                        }}
                      >
                        {copied ? <FaCheck /> : <FaCopy />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  } 
                />
                <DetailRow label="Network"        value={withdrawal.network || '—'} />
                <DetailRow label="Payment Method" value={withdrawal.payment_method || '—'} />
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* User card */}
            <div className="nex-card">
              <div className="nex-card-title"><h2>User</h2></div>
              <div className="nex-card-body" style={{ padding: '0 1.5rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0' }}>
                  <div className="nex-avatar-circle" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                    {(withdrawal.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{withdrawal.username}</div>
                    <div className="nex-table-meta">{withdrawal.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline card */}
            <div className="nex-card">
              <div className="nex-card-title"><h2>Timeline</h2></div>
              <div className="nex-card-body" style={{ padding: '0 1.5rem 1rem' }}>
                <DetailRow label="Created At"    value={fmtDate(withdrawal.created_at)} />
                <DetailRow label="Processed At"  value={fmtDate(withdrawal.processed_at)} />
                <DetailRow label="Approved At"   value={fmtDate(withdrawal.approved_at)} />
                <DetailRow label="Processed By"  value={withdrawal.processed_by_username || '—'} />
              </div>
            </div>

            {/* Notes card — shown if there's data or request is rejected */}
            {(withdrawal.admin_note || withdrawal.rejection_reason || isPending) && (
              <div className="nex-card">
                <div className="nex-card-title"><h2>Notes</h2></div>
                <div className="nex-card-body" style={{ padding: '0 1.5rem 1rem' }}>
                  {withdrawal.admin_note && (
                    <DetailRow label="Admin Note"       value={withdrawal.admin_note} />
                  )}
                  {withdrawal.rejection_reason && (
                    <DetailRow label="Rejection Reason" value={withdrawal.rejection_reason} danger />
                  )}
                  {isPending && !withdrawal.admin_note && !withdrawal.rejection_reason && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.75rem 0' }}>
                      No notes yet. Add a note when approving or rejecting.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── Approve modal ───────────────────────────────────────────────────── */}
      {showApprove && (
        <div className="nex-modal-overlay" onClick={() => setShowApprove(false)}>
          <div className="nex-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>Approve Withdrawal</h2>
              <button className="nex-modal-close" onClick={() => setShowApprove(false)}>×</button>
            </div>
            <form onSubmit={handleApprove} className="nex-modal-form">
              <div style={{
                padding: '0.875rem', borderRadius: 8,
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '0.875rem', marginBottom: '1rem',
              }}>
                Confirm that funds have been manually transferred to{' '}
                <strong style={{ fontFamily: 'monospace' }}>
                  {withdrawal.withdrawal_address.slice(0,12)}…
                </strong>.
                This will deduct <strong>{parseFloat(withdrawal.amount).toFixed(8)} {withdrawal.currency}</strong> (gross) from the user's wallet, with <strong>{parseFloat(withdrawal.fee || 0).toFixed(8)} {withdrawal.currency}</strong> fee.
              </div>
              <div className="nex-form-group">
                <label>Admin Note (optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Transferred via TRC20, TX: 0x..."
                  className="nex-input"
                />
              </div>
              <div className="nex-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowApprove(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Processing…' : '✓ Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject modal ────────────────────────────────────────────────────── */}
      {showReject && (
        <div className="nex-modal-overlay" onClick={() => setShowReject(false)}>
          <div className="nex-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>Reject Withdrawal</h2>
              <button className="nex-modal-close" onClick={() => setShowReject(false)}>×</button>
            </div>
            <form onSubmit={handleReject} className="nex-modal-form">
              <div className="nex-form-group">
                <label>Rejection Reason <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Provide a clear reason for the user…"
                  className="nex-input"
                />
              </div>
              <div className="nex-form-group">
                <label>Admin Note (optional)</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={2}
                  placeholder="Internal note…"
                  className="nex-input"
                />
              </div>
              <div className="nex-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowReject(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Processing…' : '✗ Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
