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

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PENDING:  'mu-badge mu-badge--pending',
    APPROVED: 'mu-badge mu-badge--active',
    REJECTED: 'mu-badge mu-badge--banned',
  };
  return <span className={cls[status] || 'mu-badge mu-badge--suspended'}>{status}</span>;
}

function DetailRow({ label, value, mono = false, danger = false }: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="dep-detail-row">
      <span className="dep-detail-label">{label}</span>
      <span className={`dep-detail-value${mono ? ' wdp-mono' : ''}${danger ? ' wdp-danger' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function WithdrawalDetailPage() {
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  const navigate = useNavigate();

  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied]         = useState(false);

  const [showApprove, setShowApprove] = useState(false);
  const [adminNote, setAdminNote]     = useState('');
  const [showReject, setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote]   = useState('');

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

  const copyAddress = async () => {
    if (!withdrawal) return;
    try {
      await navigator.clipboard.writeText(withdrawal.withdrawal_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy address');
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="nex-admin-section-page">
        <div className="nex-loading"><div className="nex-spinner" /><p>Loading…</p></div>
      </main>
    );
  }

  if (!withdrawal) {
    return (
      <main className="nex-admin-section-page">
        <div className="nex-empty-state">
          <p>Withdrawal not found.</p>
          <button className="mu-clear-search-btn" onClick={() => navigate(-1)}>← Go back</button>
        </div>
      </main>
    );
  }

  const isPending = withdrawal.status === 'PENDING';

  return (
    <main className="nex-admin-section-page">

      {/* ── Header ── */}
      <section className="udp-header wdp-detail-header">
        {/* Left: back + title */}
        <div className="wdp-header-left">
          <button className="udp-back-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="wdp-header-title">
            <div className="wdp-header-amount">
              {parseFloat(withdrawal.amount).toFixed(8)}
              <span className="wdp-header-currency"> {withdrawal.currency}</span>
            </div>
            <div className="wdp-header-sub">
              <StatusBadge status={withdrawal.status} />
              <span className="mu-email">by {withdrawal.username}</span>
            </div>
          </div>
        </div>

        {/* Right: action buttons */}
        {isPending && (
          <div className="wdp-header-actions">
            <button className="wdp-btn wdp-btn--approve"
              disabled={submitting}
              onClick={() => { setAdminNote(''); setShowApprove(true); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Approve
            </button>
            <button className="wdp-btn wdp-btn--reject"
              disabled={submitting}
              onClick={() => { setRejectReason(''); setRejectNote(''); setShowReject(true); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Reject
            </button>
          </div>
        )}
      </section>

      {/* ── Body ── */}
      <section className="nex-section-body">
        <div className="nex-withdrawal-detail-grid">

          {/* Left column */}
          <div className="wdp-col">

            {/* Summary */}
            <div className="nex-card">
              <div className="nex-card-title">
                <h2>Summary</h2>
                <StatusBadge status={withdrawal.status} />
              </div>
              <div className="dep-modal-details wdp-detail-list">
                <DetailRow label="Request ID"     value={withdrawal.id} mono />
                <DetailRow label="Amount (gross)"
                  value={<strong>{parseFloat(withdrawal.amount).toFixed(8)} {withdrawal.currency}</strong>} />
                <DetailRow label="Fee"
                  value={`${parseFloat(withdrawal.fee || '0').toFixed(8)} ${withdrawal.currency}`} />
                <DetailRow label="Net Amount"
                  value={<strong>{parseFloat(withdrawal.net_amount || withdrawal.amount).toFixed(8)} {withdrawal.currency}</strong>} />
              </div>
            </div>

            {/* Destination */}
            <div className="nex-card">
              <div className="nex-card-title"><h2>Destination</h2></div>
              <div className="dep-modal-details wdp-detail-list">
                {/* Address row with copy */}
                <div className="dep-detail-row wdp-addr-row">
                  <span className="dep-detail-label">Address</span>
                  <div className="wdp-addr-value">
                    <span className="wdp-mono">{withdrawal.withdrawal_address}</span>
                    <button className={`wdp-copy-btn${copied ? ' wdp-copy-btn--copied' : ''}`}
                      onClick={copyAddress} title="Copy address">
                      {copied ? <FaCheck /> : <FaCopy />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <DetailRow label="Network"        value={withdrawal.network || '—'} />
                <DetailRow label="Payment Method" value={withdrawal.payment_method || '—'} />
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="wdp-col">

            {/* User */}
            <div className="nex-card">
              <div className="nex-card-title"><h2>User</h2></div>
              <div className="wdp-user-row">
                <div className="mu-avatar mu-avatar--lg">{(withdrawal.username?.[0] || 'U').toUpperCase()}</div>
                <div>
                  <span className="mu-username">{withdrawal.username}</span>
                  <span className="mu-email">{withdrawal.email}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="nex-card">
              <div className="nex-card-title"><h2>Timeline</h2></div>
              <div className="dep-modal-details wdp-detail-list">
                <DetailRow label="Created"    value={fmtDate(withdrawal.created_at)} />
                <DetailRow label="Processed"  value={fmtDate(withdrawal.processed_at)} />
                <DetailRow label="Approved"   value={fmtDate(withdrawal.approved_at)} />
                <DetailRow label="By"         value={withdrawal.processed_by_username || '—'} />
              </div>
            </div>

            {/* Notes */}
            {(withdrawal.admin_note || withdrawal.rejection_reason || isPending) && (
              <div className="nex-card">
                <div className="nex-card-title"><h2>Notes</h2></div>
                <div className="dep-modal-details wdp-detail-list">
                  {withdrawal.admin_note && (
                    <DetailRow label="Admin Note"       value={withdrawal.admin_note} />
                  )}
                  {withdrawal.rejection_reason && (
                    <DetailRow label="Rejection Reason" value={withdrawal.rejection_reason} danger />
                  )}
                  {isPending && !withdrawal.admin_note && !withdrawal.rejection_reason && (
                    <p className="wdp-no-notes">No notes yet. Add a note when approving or rejecting.</p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── Approve modal ── */}
      {showApprove && (
        <div className="dep-modal-overlay" onClick={() => setShowApprove(false)}>
          <div className="dep-modal" onClick={e => e.stopPropagation()}>
            <div className="dep-modal-handle" aria-hidden="true" />
            <div className="dep-modal-header">
              <div className="dep-modal-title">
                <h2>Approve Withdrawal</h2>
              </div>
              <button className="nex-modal-close" onClick={() => setShowApprove(false)}>×</button>
            </div>
            <div className="wdp-modal-info wdp-modal-info--approve">
              Confirm funds were transferred to{' '}
              <strong className="wdp-mono">{withdrawal.withdrawal_address.slice(0, 12)}…</strong>.
              This deducts <strong>{parseFloat(withdrawal.amount).toFixed(8)} {withdrawal.currency}</strong> from the user's wallet.
            </div>
            <form onSubmit={handleApprove} className="nex-modal-form">
              <div className="nex-form-group">
                <label>Admin Note (optional)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  rows={3} placeholder="e.g. Transferred via TRC20, TX: 0x…" className="nex-input" />
              </div>
              <div className="dep-modal-actions">
                <button type="button" className="dep-modal-btn dep-modal-btn--reject"
                  onClick={() => setShowApprove(false)}>Cancel</button>
                <button type="submit" className="dep-modal-btn dep-modal-btn--approve" disabled={submitting}>
                  {submitting ? 'Processing…' : '✓ Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
      {showReject && (
        <div className="dep-modal-overlay" onClick={() => setShowReject(false)}>
          <div className="dep-modal" onClick={e => e.stopPropagation()}>
            <div className="dep-modal-handle" aria-hidden="true" />
            <div className="dep-modal-header">
              <div className="dep-modal-title">
                <h2>Reject Withdrawal</h2>
              </div>
              <button className="nex-modal-close" onClick={() => setShowReject(false)}>×</button>
            </div>
            <form onSubmit={handleReject} className="nex-modal-form">
              <div className="nex-form-group">
                <label>Rejection Reason <span className="wdp-required">*</span></label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  rows={3} required placeholder="Provide a clear reason for the user…" className="nex-input" />
              </div>
              <div className="nex-form-group">
                <label>Admin Note (optional)</label>
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  rows={2} placeholder="Internal note…" className="nex-input" />
              </div>
              <div className="dep-modal-actions">
                <button type="button" className="dep-modal-btn dep-modal-btn--reject"
                  onClick={() => setShowReject(false)}>Cancel</button>
                <button type="submit"
                  className="dep-modal-btn dep-modal-btn--approve"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff' }}
                  disabled={submitting}>
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
