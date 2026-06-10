import { useState, useEffect, useCallback } from 'react';
import { mockCoinPairs } from '../../data/mockData';
import { toast } from 'sonner';

export default function CoinPairsPage() {
  const [pairs, setPairs] = useState(mockCoinPairs);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPairs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation: const response = await pairService.getCoinPairs();
      // setPairs(response.data.pairs);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load coin pairs';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  const filteredPairs = pairs.filter(pair =>
    pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.coin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.market.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLiquidity = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString('en-US')}`;
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`nex-badge ${status === 'enabled' ? 'nex-badge-success' : 'nex-badge-secondary'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    setPairs(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    toast.success(`Pair ${newStatus === 'enabled' ? 'enabled' : 'disabled'} successfully`);
  };

  const handleEdit = (id: string) => {
    console.log('Edit pair:', id);
    toast.info('Edit functionality would open modal here');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trading pair?')) {
      setPairs(prev => prev.filter(p => p.id !== id));
      toast.success('Trading pair deleted successfully');
    }
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Coin Pairs</h1>
          <p>Manage trading pairs and liquidity</p>
        </div>
      </section>

      <section className="nex-section-body">
        <div className="nex-card">
          <div className="nex-card-title">
            <h2>Trading Pairs</h2>
            <div className="nex-search-box">
              <input
                type="text"
                placeholder="Search by symbol, coin, or market..."
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
              <p>Loading coin pairs...</p>
            </div>
          ) : (
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Coin</th>
                    <th>Market</th>
                    <th>Buy Liquidity</th>
                    <th>Sell Liquidity</th>
                    <th>Total Liquidity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPairs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>No coin pairs found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPairs.map((pair) => (
                      <tr key={pair.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '16px' }}>{pair.symbol}</strong>
                            {pair.isDefault && (
                              <span className="nex-badge nex-badge-xs nex-badge-purple">Default</span>
                            )}
                          </div>
                        </td>
                        <td><strong>{pair.coin}</strong></td>
                        <td><strong>{pair.market}</strong></td>
                        <td>
                          <div style={{ color: 'var(--color-success)' }}>
                            <strong>{formatLiquidity(pair.buyLiquidity)}</strong>
                          </div>
                        </td>
                        <td>
                          <div style={{ color: 'var(--color-danger)' }}>
                            <strong>{formatLiquidity(pair.sellLiquidity)}</strong>
                          </div>
                        </td>
                        <td>
                          <strong>{formatLiquidity(pair.buyLiquidity + pair.sellLiquidity)}</strong>
                        </td>
                        <td>{getStatusBadge(pair.status)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button 
                              onClick={() => handleEdit(pair.id)}
                              className="nex-btn-xs nex-btn-primary"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(pair.id, pair.status)}
                              className={`nex-btn-xs ${pair.status === 'enabled' ? 'nex-btn-secondary' : 'nex-btn-success'}`}
                            >
                              {pair.status === 'enabled' ? 'Disable' : 'Enable'}
                            </button>
                            <button 
                              onClick={() => handleDelete(pair.id)}
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

          {!isLoading && filteredPairs.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Showing {filteredPairs.length} trading pairs
            </div>
          )}
        </div>
      </section>
    </main>
  );
}