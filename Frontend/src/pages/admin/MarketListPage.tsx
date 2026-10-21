import { useState, useEffect, useCallback, useRef } from 'react';
import currencyService, { Currency } from '../../services/currency.service';
import { toast } from 'sonner';

interface MarketActionMenuProps {
  market: Currency;
  onEdit: (market: Currency) => void;
  onToggleStatus: (id: string, status: 'enabled' | 'disabled') => void;
  onNewPair: (market: Currency) => void;
  onPairList: (market: Currency) => void;
}

function MarketActionMenu({ market, onEdit, onToggleStatus, onNewPair, onPairList }: MarketActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAction = (action: string) => {
    setOpen(false);
    switch (action) {
      case 'edit':
        onEdit(market);
        break;
      case 'newPair':
        onNewPair(market);
        break;
      case 'pairList':
        onPairList(market);
        break;
      case 'toggle':
        onToggleStatus(market.id, market.status);
        break;
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 8,
          background: open ? 'rgba(169,255,232,0.12)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(169,255,232,0.14)',
          color: '#E5E7EB',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        Actions
        <span style={{ fontSize: 10, marginTop: 1 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 6px)',
          minWidth: 170,
          zIndex: 999,
          background: 'linear-gradient(180deg,#111827,#0D1117)',
          border: '1px solid rgba(169,255,232,0.14)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}>
          <button
            onClick={() => handleAction('edit')}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Edit
          </button>
          <button
            onClick={() => handleAction('newPair')}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              color: '#00C076',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            New Pair
          </button>
          <button
            onClick={() => handleAction('pairList')}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              color: '#9CA3AF',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Pair List
          </button>
          <button
            onClick={() => handleAction('toggle')}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              color: market.status === 'enabled' ? '#F59E0B' : '#00C076',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            {market.status === 'enabled' ? 'Disable' : 'Enable'}
          </button>
        </div>
      )}
    </div>
  );
}

interface CurrencyForm {
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  is_crypto: boolean;
}

export default function MarketListPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CurrencyForm>({
    symbol: '',
    name: '',
    decimals: 8,
    icon: '',
    is_crypto: true,
  });

  const fetchCurrencies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await currencyService.getAllCurrencies(true);
      setCurrencies(response.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load currencies';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const filteredCurrencies = currencies.filter(currency =>
    currency.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return (
      <span className={`nex-badge ${status === 'enabled' ? 'nex-badge-success' : 'nex-badge-secondary'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleToggleStatus = async (id: string, currentStatus: 'enabled' | 'disabled') => {
    try {
      const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
      await currencyService.updateStatus(id, newStatus);
      setCurrencies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Currency ${newStatus === 'enabled' ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update currency status';
      toast.error(msg);
    }
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      symbol: currency.symbol,
      name: currency.name,
      decimals: currency.decimals,
      icon: currency.icon || '',
      is_crypto: currency.is_crypto,
    });
    setIsModalOpen(true);
  };

  const handleNewPair = (currency: Currency) => {
    toast.info(`Create new pair for ${currency.symbol} (redirecting to Trading Pairs)...`);
    window.location.href = '/admin/trade-management/spot-control';
  };

  const handlePairList = (currency: Currency) => {
    toast.info(`View pairs for ${currency.symbol} (redirecting to Trading Pairs)...`);
    window.location.href = '/admin/trade-management/spot-control';
  };

  const handleDelete = async (currency: Currency) => {
    if (!window.confirm(`Are you sure you want to delete ${currency.symbol}?`)) {
      return;
    }
    try {
      await currencyService.deleteCurrency(currency.id);
      setCurrencies(prev => prev.filter(c => c.id !== currency.id));
      toast.success('Currency deleted successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete currency';
      toast.error(msg);
    }
  };

  const handleAddNewMarket = () => {
    setEditingCurrency(null);
    setFormData({
      symbol: '',
      name: '',
      decimals: 8,
      icon: '',
      is_crypto: true,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (editingCurrency) {
        await currencyService.updateCurrency(editingCurrency.id, formData);
        toast.success('Currency updated successfully');
      } else {
        await currencyService.createCurrency(formData);
        toast.success('Currency created successfully');
      }
      setIsModalOpen(false);
      fetchCurrencies();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save currency';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Market List</h1>
          <p>Manage available markets and currencies</p>
        </div>
        <button onClick={handleAddNewMarket} className="nex-button nex-button-primary">
          + Add New Market
        </button>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Available Markets</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by symbol, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchCurrencies} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading markets...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="nex-table-wrapper nex-desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Decimals</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCurrencies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="nex-empty-state">
                          <div>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p>No markets found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCurrencies.map((currency) => (
                        <tr key={currency.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                                {currency.symbol.charAt(0)}
                              </div>
                              <strong style={{ fontSize: '16px' }}>{currency.symbol}</strong>
                            </div>
                          </td>
                          <td>{currency.name}</td>
                          <td>
                            <span className="nex-badge nex-badge-xs nex-badge-info">
                              {currency.is_crypto ? 'Crypto' : 'Fiat'}
                            </span>
                          </td>
                          <td>{currency.decimals}</td>
                          <td>{getStatusBadge(currency.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <MarketActionMenu
                                market={currency}
                                onEdit={handleEdit}
                                onToggleStatus={handleToggleStatus}
                                onNewPair={handleNewPair}
                                onPairList={handlePairList}
                              />
                              <button
                                onClick={() => handleDelete(currency)}
                                className="nex-btn-xs nex-btn-danger"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="nex-mobile-cards nex-mobile-only">
                {filteredCurrencies.length === 0 ? (
                  <div className="nex-empty-state">
                    <div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p>No markets found</p>
                    </div>
                  </div>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <div key={currency.id} className="nex-market-card">
                      <div className="nex-market-card-header">
                        <div className="nex-market-symbol">
                          <div className="nex-market-icon">
                            {currency.symbol.charAt(0)}
                          </div>
                          <strong>{currency.symbol}</strong>
                        </div>
                        {getStatusBadge(currency.status)}
                      </div>
                      <div className="nex-market-card-body">
                        <div className="nex-market-info-row">
                          <span className="nex-market-label">Name:</span>
                          <span className="nex-market-value">{currency.name}</span>
                        </div>
                        <div className="nex-market-info-row">
                          <span className="nex-market-label">Type:</span>
                          <span className="nex-market-value">
                            <span className="nex-badge nex-badge-xs nex-badge-info">
                              {currency.is_crypto ? 'Crypto' : 'Fiat'}
                            </span>
                          </span>
                        </div>
                        <div className="nex-market-info-row">
                          <span className="nex-market-label">Decimals:</span>
                          <span className="nex-market-value">{currency.decimals}</span>
                        </div>
                      </div>
                      <div className="nex-market-card-actions">
                        <button
                          onClick={() => handleEdit(currency)}
                          className="nex-btn-xs nex-btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(currency.id, currency.status)}
                          className={`nex-btn-xs ${currency.status === 'enabled' ? 'nex-btn-secondary' : 'nex-btn-success'}`}
                        >
                          {currency.status === 'enabled' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(currency)}
                          className="nex-btn-xs nex-btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {!isLoading && filteredCurrencies.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Showing {filteredCurrencies.length} markets
            </div>
          )}
        </div>
      </section>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="nex-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="nex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2 className="nex-modal-title">
                {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="nex-modal-close"
              >
                ×
              </button>
            </div>
            
            {error && (
              <div className="nex-modal-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="nex-modal-form">
              <div className="nex-modal-grid">
                <div className="nex-modal-field">
                  <label htmlFor="symbol" className="nex-modal-label">
                    Symbol
                  </label>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    placeholder="BTC"
                    required
                    className="nex-input"
                  />
                </div>
                <div className="nex-modal-field">
                  <label htmlFor="name" className="nex-modal-label">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Bitcoin"
                    required
                    className="nex-input"
                  />
                </div>
              </div>

              <div className="nex-modal-grid">
                <div className="nex-modal-field">
                  <label htmlFor="decimals" className="nex-modal-label">
                    Decimals
                  </label>
                  <input
                    type="number"
                    id="decimals"
                    name="decimals"
                    min="0"
                    max="18"
                    value={formData.decimals}
                    onChange={handleChange}
                    required
                    className="nex-input"
                  />
                </div>
                <div className="nex-modal-field">
                  <label htmlFor="icon" className="nex-modal-label">
                    Icon URL (optional)
                  </label>
                  <input
                    type="text"
                    id="icon"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder="https://example.com/icon.png"
                    className="nex-input"
                  />
                </div>
              </div>

              <div className="nex-modal-checkbox">
                <input
                  type="checkbox"
                  id="is_crypto"
                  name="is_crypto"
                  checked={formData.is_crypto}
                  onChange={handleChange}
                  className="nex-modal-checkbox-input"
                />
                <label htmlFor="is_crypto" className="nex-modal-checkbox-label">
                  Is Cryptocurrency
                </label>
              </div>

              <div className="nex-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="nex-button nex-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="nex-button nex-button-primary"
                >
                  {isSaving ? 'Saving...' : (editingCurrency ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
