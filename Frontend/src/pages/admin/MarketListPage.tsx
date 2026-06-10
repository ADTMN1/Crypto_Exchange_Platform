import { useState, useEffect, useCallback, useRef } from 'react';
import { mockMarketList } from '../../data/mockData';
import { toast } from 'sonner';

// Market Action Menu Component
interface MarketActionMenuProps {
  market: any;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  onNewPair: (id: string) => void;
  onPairList: (id: string) => void;
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
        onEdit(market.id);
        break;
      case 'newPair':
        onNewPair(market.id);
        break;
      case 'pairList':
        onPairList(market.id);
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
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8,
          background: open ? 'rgba(169,255,232,0.12)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(169,255,232,0.14)',
          color: '#E5E7EB', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        Actions
        <span style={{ fontSize: 10, marginTop: 1 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          minWidth: 170, zIndex: 999,
          background: 'linear-gradient(180deg,#111827,#0D1117)',
          border: '1px solid rgba(169,255,232,0.14)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}>
          <button
            onClick={() => handleAction('edit')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px', background: 'none', border: 'none',
              color: '#9CA3AF', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Edit
          </button>
          <button
            onClick={() => handleAction('newPair')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px', background: 'none', border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              color: '#00C076', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            New Pair
          </button>
          <button
            onClick={() => handleAction('pairList')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px', background: 'none', border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              color: '#9CA3AF', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            Pair List
          </button>
          <button
            onClick={() => handleAction('toggle')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 16px', background: 'none', border: 'none',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              color: market.status === 'enabled' ? '#F59E0B' : '#00C076', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.1s',
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

export default function MarketListPage() {
  const [markets, setMarkets] = useState(mockMarketList);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In real implementation: const response = await marketService.getMarkets();
      // setMarkets(response.data.markets);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to load markets';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const filteredMarkets = markets.filter(market =>
    market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.marketName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return (
      <span className={`nex-badge ${status === 'enabled' ? 'nex-badge-success' : 'nex-badge-secondary'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    setMarkets(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    toast.success(`Market ${newStatus === 'enabled' ? 'enabled' : 'disabled'} successfully`);
  };

  const handleEdit = (id: string) => {
    console.log('Edit market:', id);
    toast.info('Edit market functionality - opens modal');
  };

  const handleNewPair = (id: string) => {
    console.log('Create new pair for market:', id);
    toast.info('Create new trading pair functionality');
  };

  const handlePairList = (id: string) => {
    console.log('View pairs for market:', id);
    toast.info('Navigate to pair list for this market');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this market?')) {
      setMarkets(prev => prev.filter(m => m.id !== id));
      toast.success('Market deleted successfully');
    }
  };

  const handleAddNewMarket = () => {
    console.log('Add new market');
    toast.info('Add new market modal would open here');
  };

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>Market List</h1>
          <p>Manage available markets and currencies</p>
        </div>
        <button onClick={handleAddNewMarket} className="nex-btn-primary">
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
                placeholder="Search by symbol, name, or market..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nex-search-input"
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444' }}>
              {error}
              <button onClick={fetchMarkets} style={{ marginLeft: '1rem', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#ef4444' }}>
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
            <div className="nex-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Market Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="nex-empty-state">
                        <div>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p>No markets found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMarkets.map((market) => (
                      <tr key={market.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                              {market.symbol.charAt(0)}
                            </div>
                            <strong style={{ fontSize: '16px' }}>{market.symbol}</strong>
                          </div>
                        </td>
                        <td>{market.name}</td>
                        <td>
                          <span className="nex-badge nex-badge-xs nex-badge-info">{market.marketName}</span>
                        </td>
                        <td>{getStatusBadge(market.status)}</td>
                        <td>
                          <MarketActionMenu
                            market={market}
                            onEdit={handleEdit}
                            onToggleStatus={handleToggleStatus}
                            onNewPair={handleNewPair}
                            onPairList={handlePairList}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredMarkets.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '1px solid rgba(169,255,232,0.12)', color: 'var(--text-muted)', fontSize: '14px' }}>
              Showing {filteredMarkets.length} markets
            </div>
          )}
        </div>
      </section>
    </main>
  );
}