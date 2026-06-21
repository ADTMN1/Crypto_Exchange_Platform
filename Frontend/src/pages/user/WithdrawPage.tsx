import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaArrowLeft,
  FaPaperPlane,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaWallet,
  FaShieldAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaChevronDown,
} from 'react-icons/fa';
import withdrawalService, { Withdrawal } from '../../services/withdrawal.service';
import walletService from '../../services/wallet.service';

export default function WithdrawPage() {
  const navigate = useNavigate();

  // ── form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    amount: '',
    withdrawalAddress: '',
    network: '',
    currency: 'USDT',
  });
  const [submitting, setSubmitting] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── history state ─────────────────────────────────────────────────────────
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    walletService.getBalance()
      .then((r) => setWallets(r.data?.data?.wallets || []))
      .catch(() => {});
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await withdrawalService.getMyWithdrawals('ALL');
      const data = response.data.data.withdrawals;
      setWithdrawals(data);
      setStats({
        pending:  data.filter((w) => w.status === 'PENDING').length,
        approved: data.filter((w) => w.status === 'APPROVED').length,
        rejected: data.filter((w) => w.status === 'REJECTED').length,
        total:    data.length,
      });
    } catch (error: any) {
      console.error('Failed to fetch withdrawal history:', error);
      toast.error('Failed to load withdrawal history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const availableBalance = wallets.find((w) => w.currency === formData.currency)?.balance ?? '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.withdrawalAddress.trim()) {
      toast.error('Withdrawal address is required');
      return;
    }
    if (amount > parseFloat(availableBalance)) {
      toast.error('Amount exceeds available balance');
      return;
    }

    try {
      setSubmitting(true);
      await withdrawalService.create({
        amount,
        withdrawalAddress: formData.withdrawalAddress,
        network: formData.network || undefined,
        currency: formData.currency,
      });
      toast.success('Withdrawal request submitted successfully!');
      setFormData({ amount: '', withdrawalAddress: '', network: '', currency: formData.currency });
      fetchHistory();
    } catch (error: any) {
      console.error('Failed to submit withdrawal:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING:  'nex-badge-warning',
      APPROVED: 'nex-badge-success',
      REJECTED: 'nex-badge-danger',
    };
    return `nex-badge ${badges[status] || 'nex-badge-secondary'}`;
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString));

  const selectedWallet = wallets.find((w) => w.currency === formData.currency);
  const pendingAmount  = withdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/assets')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(247,147,26,0.3)',
              background: 'rgba(247,147,26,0.08)',
              color: '#F7931A',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.15)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(247,147,26,0.55)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(247,147,26,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(247,147,26,0.3)';
            }}
          >
            <FaArrowLeft style={{ fontSize: '0.75rem' }} />
            Back to Wallet
          </button>
          <h1 className="page-title">
            <FaMoneyBillWave />
            Withdraw Funds
          </h1>
          <p className="page-subtitle">
            Submit a withdrawal request and wait for administrator approval.
          </p>
        </div>
      </div>


      {/* ── Stat chips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Available balance */}
        <div className="nex-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(247,147,26,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaWallet style={{ color: '#F7931A', fontSize: '1.1rem' }} />
            </div>
            <div>
              <div className="nex-table-meta" style={{ marginBottom: 2 }}>Available</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#F7931A' }}>
                {parseFloat(availableBalance).toFixed(4)}{' '}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formData.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="nex-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaClock style={{ color: '#f59e0b', fontSize: '1.1rem' }} />
            </div>
            <div>
              <div className="nex-table-meta" style={{ marginBottom: 2 }}>Pending</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{stats.pending}</div>
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="nex-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(16,185,129,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaCheckCircle style={{ color: '#10b981', fontSize: '1.1rem' }} />
            </div>
            <div>
              <div className="nex-table-meta" style={{ marginBottom: 2 }}>Approved</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{stats.approved}</div>
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="nex-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaTimesCircle style={{ color: '#ef4444', fontSize: '1.1rem' }} />
            </div>
            <div>
              <div className="nex-table-meta" style={{ marginBottom: 2 }}>Rejected</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{stats.rejected}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main two-column grid (form + info) ── */}
      <div className="nex-page-grid-2" style={{ marginBottom: '2rem' }}>

        {/* ── Wallet Summary + Form card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Wallet summary */}
          {selectedWallet && (
            <div style={{
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 60%, rgba(247,147,26,0.12) 100%)',
              border: '1px solid rgba(247,147,26,0.2)',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* decorative glow */}
              <div style={{
                position: 'absolute', right: -40, top: -40,
                width: 160, height: 160, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(247,147,26,0.12), transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div>
                  <p style={{ color: '#F7931A', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    {selectedWallet.currency} Wallet
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Available Balance</p>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 4 }}>
                    {parseFloat(selectedWallet.balance).toFixed(8)}
                    <span style={{ fontSize: '1rem', color: '#F7931A', marginLeft: 8 }}>{selectedWallet.currency}</span>
                  </p>
                  {pendingAmount > 0 && (
                    <p style={{ color: '#f59e0b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaClock style={{ fontSize: '0.75rem' }} />
                      {pendingAmount.toFixed(8)} {selectedWallet.currency} pending approval
                    </p>
                  )}
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(247,147,26,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FaWallet style={{ color: '#F7931A', fontSize: '1.4rem' }} />
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal form */}
          <div className="nex-card">
            <div className="nex-card-title">
              <h2>New Withdrawal Request</h2>
            </div>
            <div className="nex-card-body">
              <form onSubmit={handleSubmit}>

                {/* Row 1 — Currency + Amount */}
                <div className="nex-form-grid-2" style={{ marginBottom: '1.25rem' }}>

                  {/* Currency — custom pill selector */}
                  <div className="nex-form-group" ref={currencyRef} style={{ position: 'relative' }}>
                    <label>Currency</label>

                    {/* trigger button */}
                    <button
                      type="button"
                      onClick={() => setCurrencyOpen((o) => !o)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${currencyOpen ? '#F7931A' : 'rgba(255,255,255,0.1)'}`,
                        background: currencyOpen ? 'rgba(247,147,26,0.06)' : 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        boxShadow: currencyOpen ? '0 0 0 3px rgba(247,147,26,0.12)' : 'none',
                      }}
                    >
                      {/* selected currency pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg,rgba(247,147,26,0.9),rgba(255,180,60,0.8))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', fontWeight: 800, color: '#000', letterSpacing: '-0.02em',
                        }}>
                          {formData.currency.slice(0, 4)}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>{formData.currency}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                            {parseFloat(availableBalance).toFixed(4)} available
                          </div>
                        </div>
                      </div>
                      <FaChevronDown style={{
                        color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: currencyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }} />
                    </button>

                    {/* dropdown panel */}
                    {currencyOpen && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0, right: 0,
                        zIndex: 50,
                        borderRadius: 10,
                        border: '1px solid rgba(247,147,26,0.2)',
                        background: '#161616',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
                        overflow: 'hidden',
                      }}>
                        {(wallets.length > 0 ? wallets : [{ currency: 'USDT', balance: '0', locked_balance: '0' }]).map((w, i) => {
                          const isSelected = formData.currency === w.currency;
                          return (
                            <button
                              key={w.currency}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, currency: w.currency });
                                setCurrencyOpen(false);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '10px 14px',
                                background: isSelected ? 'rgba(247,147,26,0.1)' : 'transparent',
                                border: 'none',
                                borderBottom: i < wallets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                cursor: 'pointer',
                                transition: 'background 0.12s',
                                textAlign: 'left',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              }}
                            >
                              {/* coin avatar */}
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: isSelected
                                  ? 'linear-gradient(135deg,rgba(247,147,26,0.9),rgba(255,180,60,0.8))'
                                  : 'rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', fontWeight: 800,
                                color: isSelected ? '#000' : '#aaa',
                                letterSpacing: '-0.02em',
                              }}>
                                {w.currency.slice(0, 4)}
                              </div>

                              {/* name + balance */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? '#F7931A' : '#fff' }}>
                                  {w.currency}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {parseFloat(w.balance).toFixed(4)} available
                                </div>
                              </div>

                              {/* locked indicator */}
                              {parseFloat(w.locked_balance) > 0 && (
                                <span style={{
                                  fontSize: '0.7rem', color: '#f59e0b',
                                  background: 'rgba(245,158,11,0.12)',
                                  border: '1px solid rgba(245,158,11,0.2)',
                                  borderRadius: 4, padding: '1px 6px',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {parseFloat(w.locked_balance).toFixed(2)} locked
                                </span>
                              )}

                              {/* checkmark */}
                              {isSelected && (
                                <FaCheckCircle style={{ color: '#F7931A', fontSize: '0.875rem', flexShrink: 0 }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <small>Select the asset you want to withdraw</small>
                  </div>

                  {/* Amount — with MAX shortcut */}
                  <div className="nex-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label htmlFor="amount" style={{ margin: 0 }}>Amount</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: parseFloat(availableBalance).toFixed(8) })}
                        style={{
                          background: 'rgba(247,147,26,0.12)',
                          border: '1px solid rgba(247,147,26,0.3)',
                          color: '#F7931A',
                          borderRadius: 6,
                          padding: '2px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          lineHeight: 1.6,
                        }}
                      >
                        MAX
                      </button>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      step="0.00000001"
                      min="0.00000001"
                      placeholder="0.00000000"
                    />
                    <small>
                      Available:{' '}
                      <span style={{ color: '#F7931A', fontWeight: 600 }}>
                        {parseFloat(availableBalance).toFixed(8)} {formData.currency}
                      </span>
                    </small>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0 0 1.25rem' }} />

                {/* Withdrawal address */}
                <div className="nex-form-group">
                  <label htmlFor="withdrawalAddress">Withdrawal Address</label>
                  <input
                    type="text"
                    id="withdrawalAddress"
                    value={formData.withdrawalAddress}
                    onChange={(e) => setFormData({ ...formData, withdrawalAddress: e.target.value })}
                    required
                    placeholder="e.g. TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}
                  />
                  <small style={{ color: 'rgba(245,158,11,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaExclamationTriangle style={{ fontSize: '0.7rem' }} />
                    Verify carefully — transfers cannot be reversed
                  </small>
                </div>

                {/* Network */}
                <div className="nex-form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ margin: 0 }} htmlFor="network">Network</label>
                    <span className="nex-badge nex-badge-secondary" style={{ fontSize: '0.7rem' }}>Optional</span>
                  </div>
                  <input
                    type="text"
                    id="network"
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    placeholder="e.g. TRC20, ERC20, BEP20"
                  />
                  <small>Wrong network = lost funds. Leave blank if unsure.</small>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '1.5rem 0 1.25rem' }} />

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="nex-btn-primary"
                    disabled={submitting}
                    style={{ flex: '1 1 auto', justifyContent: 'center', padding: '13px 24px' }}
                  >
                    {submitting ? (
                      <>
                        <div className="nex-spinner-small" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane />
                        Submit Withdrawal Request
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="nex-btn-secondary"
                    onClick={() => navigate('/assets')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>

        {/* ── Info sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* How it works */}
          <div className="nex-card">
            <div className="nex-card-title">
              <h2 style={{ fontSize: '1rem' }}>
                <FaInfoCircle style={{ color: '#3b82f6', marginRight: 8 }} />
                How Withdrawals Work
              </h2>
            </div>
            <div className="nex-card-body">
              {[
                { icon: '1', text: 'Submit your withdrawal request with the amount and destination address.' },
                { icon: '2', text: 'Our team reviews the request manually and transfers funds.' },
                { icon: '3', text: 'Once confirmed, your wallet balance is updated and the request is marked approved.' },
              ].map((step) => (
                <div key={step.icon} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(59,130,246,0.15)',
                    color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {step.icon}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Warning notice */}
          <div style={{
            borderRadius: 12,
            border: '1px solid rgba(245,158,11,0.25)',
            background: 'rgba(245,158,11,0.06)',
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <FaExclamationTriangle style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                  Before you submit
                </p>
                <ul style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.7, paddingLeft: '1rem', margin: 0 }}>
                  <li>Verify the destination address carefully</li>
                  <li>Ensure the selected network matches your wallet</li>
                  <li>Your balance is not deducted until approved</li>
                  <li>Processing time may vary</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div style={{
            borderRadius: 12,
            border: '1px solid rgba(16,185,129,0.2)',
            background: 'rgba(16,185,129,0.06)',
            padding: '1rem',
            display: 'flex', gap: '0.75rem', alignItems: 'center',
          }}>
            <FaShieldAlt style={{ color: '#10b981', fontSize: '1.5rem', flexShrink: 0 }} />
            <div>
              <p style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>Manually Reviewed</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                Every withdrawal is reviewed by our team before funds are released.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Withdrawal History ── */}
      <div className="nex-card">
        <div className="nex-card-title">
          <h2>Withdrawal History</h2>
          {!historyLoading && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {stats.total} request{stats.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {historyLoading ? (
          <div className="nex-loading">
            <div className="nex-spinner" />
            <p>Loading history...</p>
          </div>
        ) : (
          <div className="nex-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Address</th>
                  <th>Network</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="nex-empty-state">
                      <div>
                        <FaMoneyBillWave style={{ fontSize: '3rem', opacity: 0.25, marginBottom: '1rem', color: '#F7931A' }} />
                        <p style={{ fontWeight: 600, marginBottom: 4 }}>No withdrawal requests yet</p>
                        <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                          Your submitted withdrawal requests will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <strong>{parseFloat(w.amount).toFixed(8)}</strong>
                      </td>
                      <td>
                        <strong>{w.currency}</strong>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {w.withdrawal_address.length > 18
                            ? `${w.withdrawal_address.slice(0, 8)}…${w.withdrawal_address.slice(-6)}`
                            : w.withdrawal_address}
                        </span>
                      </td>
                      <td>{w.network || '—'}</td>
                      <td>
                        <span className={getStatusBadge(w.status)}>
                          {w.status}
                        </span>
                      </td>
                      <td>{formatDate(w.created_at)}</td>
                      <td className="nex-table-meta">
                        {w.rejection_reason || w.admin_note || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
