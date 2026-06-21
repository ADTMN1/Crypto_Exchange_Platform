import { useState, useEffect, useRef } from 'react';
import { FaWallet, FaChevronDown, FaChevronUp, FaPlus, FaArrowUp, FaArrowDown, FaSpinner } from 'react-icons/fa';
import { useWalletStore } from '../store/useWalletStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function AssetDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { wallets, totalUSD, isLoading, fetchWallet } = useWalletStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [isAuthenticated, fetchWallet]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className="asset-dropdown" ref={dropdownRef}>
      <button
        className="asset-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        
        <div className="asset-icon">
          <FaWallet />
        </div>
        <div className="asset-info">
          <div className="asset-label">Total Balance</div>
          <div className="asset-value">
            {isLoading ? 'Loading...' : `$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {isOpen && (
        <div className="asset-dropdown-menu">
          <div className="dropdown-header">
            <h3>My Assets</h3>
            <button
              className="view-all-btn"
              onClick={() => {
                setIsOpen(false);
                navigate('/wallet');
              }}
            >
              View All
            </button>
          </div>

          <div className="assets-list">
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '40px 20px',
                color: '#F7931A'
              }}>
                <FaSpinner style={{ fontSize: '36px', animation: 'spin 1s linear infinite' }} />
                <span style={{ marginTop: '16px', fontSize: '14px' }}>Loading assets...</span>
              </div>
            ) : wallets.length === 0 ? (
              <div className="empty-state">
                <p>No assets yet</p>
                <button
                  className="deposit-btn"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/wallet/deposit');
                  }}
                >
                  <FaPlus /> Deposit
                </button>
              </div>
            ) : (
              wallets.slice(0, 5).map((wallet) => (
                <div key={wallet.id} className="asset-item">
                  <div className="asset-coin">
                    <div className="coin-icon">
                      {wallet.currency.charAt(0)}
                    </div>
                    <div className="coin-info">
                      <span className="coin-name">{wallet.currency}</span>
                      <span className="coin-available">
                        Available: {parseFloat(wallet.balance.toString()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="asset-amount">
                    <div className="amount-usd">
                      ${(wallet.usdValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="amount-coin">
                      {parseFloat(wallet.balance.toString()).toLocaleString()} {wallet.currency}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="dropdown-actions">
            <button
              className="action-btn deposit"
              onClick={() => {
                setIsOpen(false);
                navigate('/wallet/deposit');
              }}
            >
              <FaArrowDown /> Deposit
            </button>
            <button
              className="action-btn withdraw"
              onClick={() => {
                setIsOpen(false);
                navigate('/wallet/withdraw');
              }}
            >
              <FaArrowUp /> Withdraw
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
