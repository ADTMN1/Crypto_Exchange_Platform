import { useState, useEffect, useCallback } from 'react';
import tradingPairService, { TradingPair } from '../../services/trading-pair.service';
import { toast } from 'sonner';

interface TradingPairForm {
  base_currency: string;
  quote_currency: string;
  min_order_size: number;
  max_order_size: number;
  price_precision: number;
  qty_precision: number;
  maker_fee: number;
  taker_fee: number;
  is_active: boolean;
}

export default function TradingPairsPage() {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<TradingPair | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<TradingPairForm>({
    base_currency: '',
    quote_currency: 'USDT',
    min_order_size: 0.0001,
    max_order_size: 10000,
    price_precision: 8,
    qty_precision: 8,
    maker_fee: 0,
    taker_fee: 0,
    is_active: true,
  });

  const fetchPairs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tradingPairService.getAllPairs(true);
      setPairs(response.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load trading pairs';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  const handleEdit = (pair: TradingPair) => {
    setEditingPair(pair);
    setFormData({
      base_currency: pair.base_currency,
      quote_currency: pair.quote_currency,
      min_order_size: pair.min_order_size,
      max_order_size: pair.max_order_size,
      price_precision: pair.price_precision,
      qty_precision: pair.qty_precision,
      maker_fee: pair.maker_fee,
      taker_fee: pair.taker_fee,
      is_active: pair.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPair(null);
    setFormData({
      base_currency: '',
      quote_currency: 'USDT',
      min_order_size: 0.0001,
      max_order_size: 10000,
      price_precision: 8,
      qty_precision: 8,
      maker_fee: 0,
      taker_fee: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (pair: TradingPair) => {
    if (!window.confirm(`Are you sure you want to delete ${pair.base_currency}/${pair.quote_currency}?`)) {
      return;
    }
    try {
      await tradingPairService.deletePair(pair.id);
      toast.success('Trading pair deleted successfully');
      fetchPairs();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete trading pair';
      toast.error(msg);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      if (editingPair) {
        await tradingPairService.updatePair(editingPair.id, formData);
        toast.success('Trading pair updated successfully');
      } else {
        await tradingPairService.createPair(formData);
        toast.success('Trading pair created successfully');
      }
      setIsModalOpen(false);
      fetchPairs();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save trading pair';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPairs = pairs.filter(pair => {
    const search = searchQuery.toLowerCase();
    const symbol = `${pair.base_currency}/${pair.quote_currency}`.toLowerCase();
    return symbol.includes(search) || pair.base_currency.toLowerCase().includes(search) || pair.quote_currency.toLowerCase().includes(search);
  });

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`nex-badge ${isActive ? 'nex-badge-success' : 'nex-badge-secondary'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Trading Pairs</h1>
          <p>Manage spot trading pairs and configuration</p>
        </div>
        <button
          onClick={handleCreate}
          className="nex-button nex-button-primary"
        >
          + Add Pair
        </button>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>All Trading Pairs</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search pairs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchPairs} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="nex-loading">
              <div className="nex-spinner" />
              <p>Loading trading pairs...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Min Order</th>
                    <th>Max Order</th>
                    <th>Price Precision</th>
                    <th>Qty Precision</th>
                    <th>Maker Fee</th>
                    <th>Taker Fee</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPairs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p>No trading pairs found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPairs.map((pair) => (
                      <tr key={pair.id}>
                        <td>
                          <strong style={{ fontSize: '1rem' }}>{pair.base_currency}/{pair.quote_currency}</strong>
                        </td>
                        <td>{pair.min_order_size}</td>
                        <td>{pair.max_order_size}</td>
                        <td>{pair.price_precision}</td>
                        <td>{pair.qty_precision}</td>
                        <td>{(pair.maker_fee * 100).toFixed(2)}%</td>
                        <td>{(pair.taker_fee * 100).toFixed(2)}%</td>
                        <td>{getStatusBadge(pair.is_active)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEdit(pair)}
                              className="nex-btn-xs nex-btn-primary"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(pair)}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
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
        }} onClick={() => setIsModalOpen(false)}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            margin: '1rem',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>
                {editingPair ? 'Edit Trading Pair' : 'Create Trading Pair'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '2rem', cursor: 'pointer', padding: '0.25rem' }}
              >
                ×
              </button>
            </div>
            
            {error && (
              <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label htmlFor="base_currency" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Base Currency
                  </label>
                  <input
                    type="text"
                    id="base_currency"
                    name="base_currency"
                    value={formData.base_currency}
                    onChange={handleChange}
                    placeholder="BTC"
                    required
                    className="nex-input"
                  />
                </div>
                <div>
                  <label htmlFor="quote_currency" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Quote Currency
                  </label>
                  <input
                    type="text"
                    id="quote_currency"
                    name="quote_currency"
                    value={formData.quote_currency}
                    onChange={handleChange}
                    placeholder="USDT"
                    required
                    className="nex-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label htmlFor="min_order_size" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Min Order Size
                  </label>
                  <input
                    type="number"
                    id="min_order_size"
                    name="min_order_size"
                    step="0.00000001"
                    min="0"
                    value={formData.min_order_size}
                    onChange={handleChange}
                    required
                    className="nex-input"
                  />
                </div>
                <div>
                  <label htmlFor="max_order_size" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Max Order Size
                  </label>
                  <input
                    type="number"
                    id="max_order_size"
                    name="max_order_size"
                    step="0.00000001"
                    min="0"
                    value={formData.max_order_size}
                    onChange={handleChange}
                    required
                    className="nex-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label htmlFor="price_precision" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Price Precision
                  </label>
                  <input
                    type="number"
                    id="price_precision"
                    name="price_precision"
                    min="0"
                    max="18"
                    value={formData.price_precision}
                    onChange={handleChange}
                    required
                    className="nex-input"
                  />
                </div>
                <div>
                  <label htmlFor="qty_precision" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Quantity Precision
                  </label>
                  <input
                    type="number"
                    id="qty_precision"
                    name="qty_precision"
                    min="0"
                    max="18"
                    value={formData.qty_precision}
                    onChange={handleChange}
                    required
                    className="nex-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label htmlFor="maker_fee" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Maker Fee (%)
                  </label>
                  <input
                    type="number"
                    id="maker_fee"
                    name="maker_fee"
                    step="0.0001"
                    min="0"
                    max="1"
                    value={formData.maker_fee}
                    onChange={handleChange}
                    required
                    className="nex-input"
                  />
                </div>
                <div>
                  <label htmlFor="taker_fee" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                    Taker Fee (%)
                  </label>
                  <input
                    type="number"
                    id="taker_fee"
                    name="taker_fee"
                    step="0.0001"
                    min="0"
                    max="1"
                    value={formData.taker_fee}
                    onChange={handleChange}
                    required
                    className="nex-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{ width: '1.25rem', height: '1.25rem' }}
                />
                <label htmlFor="is_active" style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  Active
                </label>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
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
                  {isSaving ? 'Saving...' : (editingPair ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
