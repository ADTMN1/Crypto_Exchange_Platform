import { useState, useEffect, useCallback } from 'react';
import currencyService, { Currency, SupportedSymbol } from '../../services/currency.service';
import { toast } from 'sonner';

export default function FiatCryptoCurrencyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    logo: '',
    status: 'enabled' as 'enabled' | 'disabled',
  });

  // Import states
  const [supportedSymbols, setSupportedSymbols] = useState<SupportedSymbol[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const fetchCurrencies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await currencyService.getAllCurrencies(true);
      setCurrencies(response.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to fetch currencies';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    
    try {
      // Optimistic update
      setCurrencies(prev => 
        prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c)
      );

      await currencyService.updateStatus(id, newStatus as 'enabled' | 'disabled');
      toast.success(`Currency ${newStatus === 'enabled' ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      // Revert on error
      setCurrencies(prev => 
        prev.map(c => c.id === id ? { ...c, status: currentStatus as any } : c)
      );
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await currencyService.deleteCurrency(id);
      setCurrencies(prev => prev.filter(c => c.id !== id));
      toast.success('Currency deleted successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete currency');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await currencyService.createCurrency(formData);
      setCurrencies(prev => [response.data, ...prev]);
      setShowAddModal(false);
      setFormData({ name: '', symbol: '', logo: '', status: 'enabled' });
      toast.success('Currency added successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add currency');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurrency) return;

    try {
      const response = await currencyService.updateCurrency(editingCurrency.id, formData);
      setCurrencies(prev => 
        prev.map(c => c.id === editingCurrency.id ? response.data : c)
      );
      setShowEditModal(false);
      setEditingCurrency(null);
      setFormData({ name: '', symbol: '', logo: '', status: 'enabled' });
      toast.success('Currency updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update currency');
    }
  };

  const openEditModal = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      name: currency.name,
      symbol: currency.symbol,
      logo: currency.logo || '',
      status: currency.status,
    });
    setShowEditModal(true);
  };

  const openImportModal = async () => {
    try {
      const response = await currencyService.getSupportedSymbols();
      setSupportedSymbols(response.data);
      setShowImportModal(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load supported symbols');
    }
  };

  const handleImport = async () => {
    if (selectedSymbols.length === 0) {
      toast.error('Please select at least one symbol');
      return;
    }

    setImporting(true);
    try {
      const response = await currencyService.bulkImport(selectedSymbols);
      toast.success(response.message);
      setShowImportModal(false);
      setSelectedSymbols([]);
      fetchCurrencies();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to import currencies');
    } finally {
      setImporting(false);
    }
  };

  const toggleSymbolSelection = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
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
    return (
      <span className={`nex-badge ${status === 'enabled' ? 'nex-badge-success' : 'nex-badge-secondary'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Crypto Currency Management</h1>
          <p>Manage cryptocurrency listings with live Binance prices</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={openImportModal} className="nex-btn-secondary">
            Import from Binance
          </button>
          <button onClick={() => setShowAddModal(true)} className="nex-btn-primary">
            + Add Currency
          </button>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Currency List</h2>
            <div className="nex-badge nex-badge-info">
              {currencies.length} currencies
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
              <p>Loading currencies...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th>Symbol</th>
                    <th>Price (USD)</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p>No currencies found</p>
                          <button onClick={() => setShowAddModal(true)} className="nex-btn-primary" style={{ marginTop: '1rem' }}>
                            Add First Currency
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currencies.map((currency) => (
                      <tr key={currency.id}>
                        <td>
                          <div className="nex-user-cell">
                            {currency.logo ? (
                              <img 
                                src={currency.logo} 
                                alt={currency.name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="nex-avatar-circle">
                                {currency.symbol.charAt(0)}
                              </div>
                            )}
                            <div>
                              <strong>{currency.name}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="nex-badge nex-badge-info">{currency.symbol}</span>
                        </td>
                        <td>
                          {currency.price !== null && currency.price !== undefined ? (
                            <strong>${currency.price.toLocaleString()}</strong>
                          ) : (
                            <span className="nex-table-meta">N/A</span>
                          )}
                        </td>
                        <td>{getStatusBadge(currency.status)}</td>
                        <td>
                          <div>{formatDate(currency.created_at)}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleStatusToggle(currency.id, currency.status)}
                              className={`nex-btn-xs ${currency.status === 'enabled' ? 'nex-btn-secondary' : 'nex-btn-success'}`}
                            >
                              {currency.status === 'enabled' ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => openEditModal(currency)}
                              className="nex-btn-xs nex-btn-primary"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(currency.id, currency.name)}
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
          )}
        </div>
      </section>

      {/* Add Modal */}
      {showAddModal && (
        <div className="nex-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="nex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>Add New Currency</h2>
              <button onClick={() => setShowAddModal(false)} className="nex-modal-close">×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="nex-modal-body">
                <div className="nex-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bitcoin"
                    required
                    className="nex-input"
                  />
                </div>
                <div className="nex-form-group">
                  <label>Symbol * (must end with USDT)</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    placeholder="BTCUSDT"
                    required
                    className="nex-input"
                  />
                </div>
                <div className="nex-form-group">
                  <label>Logo URL</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://..."
                    className="nex-input"
                  />
                </div>
                <div className="nex-form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="nex-input"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="nex-modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="nex-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="nex-btn-primary">
                  Add Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCurrency && (
        <div className="nex-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="nex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>Edit Currency</h2>
              <button onClick={() => setShowEditModal(false)} className="nex-modal-close">×</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="nex-modal-body">
                <div className="nex-form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="nex-input"
                  />
                </div>
                <div className="nex-form-group">
                  <label>Symbol * (must end with USDT)</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    required
                    className="nex-input"
                  />
                </div>
                <div className="nex-form-group">
                  <label>Logo URL</label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="nex-input"
                  />
                </div>
                <div className="nex-form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="nex-input"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="nex-modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="nex-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="nex-btn-primary">
                  Update Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="nex-modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="nex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>Import Currencies from Binance</h2>
              <button onClick={() => setShowImportModal(false)} className="nex-modal-close">×</button>
            </div>
            <div className="nex-modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                Select currencies to import. Already existing currencies will be skipped.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                {supportedSymbols.map((item) => (
                  <label
                    key={item.symbol}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(169,255,232,0.12)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedSymbols.includes(item.symbol) ? 'rgba(169,255,232,0.1)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSymbols.includes(item.symbol)}
                      onChange={() => toggleSymbolSelection(item.symbol)}
                    />
                    <div>
                      <div><strong>{item.name}</strong></div>
                      <div className="nex-table-meta">{item.symbol}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(169,255,232,0.05)', borderRadius: '8px' }}>
                <strong>{selectedSymbols.length}</strong> currencies selected
              </div>
            </div>
            <div className="nex-modal-footer">
              <button type="button" onClick={() => setShowImportModal(false)} className="nex-btn-secondary">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleImport} 
                disabled={importing || selectedSymbols.length === 0}
                className="nex-btn-primary"
              >
                {importing ? 'Importing...' : `Import ${selectedSymbols.length} Currencies`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
