import { FaSpinner, FaPaperPlane, FaWallet } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/useWalletStore';
import withdrawalService from '../../services/withdrawal.service';
import { toast } from 'sonner';

export default function WithdrawPage() {
  const { wallets, fetchWallet, isLoading } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('USDT');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  // Fetch wallets on page load
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Set default currency from first wallet
  useEffect(() => {
    if (wallets.length > 0) {
      setCurrency(wallets[0].currency);
    }
  }, [wallets]);

  // Get current wallet
  const getCurrentWallet = () => {
    return wallets.find(w => w.currency === currency) || { balance: '0' };
  };

  const formatAmount = (amount: number, curr: string) => {
    if (curr === 'USDT') {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!address.trim()) {
      toast.error('Please enter a valid wallet address');
      return;
    }

    // Check if amount exceeds available balance
    const currentWallet = getCurrentWallet();
    if (val > parseFloat(currentWallet.balance)) {
      toast.error('Insufficient available balance');
      return;
    }

    setLoading(true);
    try {
      await withdrawalService.create({
        amount: val,
        withdrawalAddress: address.trim(),
        currency,
      });
      toast.success('Withdrawal request submitted successfully!');
      setAddress('');
      setAmount('');
      fetchWallet(); // Refresh wallet balances
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const useMax = () => {
    const currentWallet = getCurrentWallet();
    setAmount(currentWallet.balance);
  };

  return (
    <main className="wallet-page">
      {/* Page Header */}
      <div className="assets-card" style={{ marginBottom: '24px' }}>
        <div className="assets-header">
          <div>
            <h3 className="assets-label">Withdraw</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1 className="assets-amount" style={{ fontSize: '28px' }}>Withdraw Funds</h1>
              <p className="assets-change positive" style={{ background: 'transparent', padding: 0, fontSize: '15px', color: '#b0b0b0' }}>
                Transfer funds to your external wallet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="crypto-table">
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Currency Selection */}
          <div className="crypto-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', borderBottom: '1px solid var(--surface-hover)' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-muted)'
            }}>
              Select Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 18px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--surface-hover)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                fontSize: '15px',
                fontWeight: '600',
                outline: 'none',
                transition: 'border-color 0.2s',
                cursor: 'pointer'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--surface-hover)';
              }}
            >
              {wallets.map((w) => (
                <option key={w.currency} value={w.currency}>
                  {w.currency} - Available: {formatAmount(parseFloat(w.balance), w.currency)} {w.currency === 'USDT' ? '' : `($${(w.usdValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet Address */}
          <div className="crypto-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', borderBottom: '1px solid var(--surface-hover)' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-muted)'
            }}>
              Wallet Address
            </label>
            <input
              type="text"
              placeholder={`Enter your ${currency} wallet address`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 18px',
                background: 'var(--surface-hover)',
                border: '1px solid var(--surface-hover)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--surface-hover)';
              }}
            />
          </div>

          {/* Amount */}
          <div className="crypto-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', borderBottom: '1px solid var(--surface-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)'
              }}>
                Amount
              </label>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--primary)',
                cursor: 'pointer'
              }} onClick={useMax}>
                Use Max
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--surface-hover)',
              borderRadius: '12px',
              padding: '16px 18px',
              transition: 'border-color 0.2s',
              width: '100%'
            }} onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
            }} onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--surface-hover)';
            }} tabIndex={0}>
              <FaWallet style={{ color: 'var(--primary)', fontSize: '20px' }} />
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '18px',
                  fontWeight: '700',
                  outline: 'none'
                }}
              />
              <span style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'var(--text-muted)'
              }}>
                {currency}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="crypto-row" style={{ paddingTop: '12px' }}>
            <button
              type="submit"
              disabled={loading || isLoading}
              className="btn-deposit"
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <FaSpinner style={{ animation: 'spin 0.8s linear infinite' }} />
                  Processing Withdrawal...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Submit Withdrawal Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Important Notes */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: 'rgba(247,147,26,0.1)',
        border: '1px solid rgba(247,147,26,0.3)',
        borderRadius: '12px'
      }}>
        <h3 style={{
          margin: '0 0 12px',
          fontSize: '15px',
          fontWeight: '700',
          color: 'var(--primary)'
        }}>
          Important Notes
        </h3>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          color: '#b0b0b0',
          fontSize: '14px',
          lineHeight: '1.8'
        }}>
          <li>Please double-check the wallet address before submitting</li>
          <li>Withdrawals usually take 1-5 minutes to process</li>
          <li>Network fees will be deducted automatically from your balance</li>
          <li>Make sure your wallet supports {currency} withdrawals</li>
        </ul>
      </div>
    </main>
  );
}
