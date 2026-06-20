import { useState, useMemo } from 'react';
import { useMarketData } from '../../hooks/useMarketData';

const QUOTE_FILTERS = ['USDT', 'USDC', 'BTC', 'BNB'];

export default function TradeMarketList() {
  const { symbol, setSymbol, tickers } = useMarketData();
  const [search, setSearch] = useState('');
  const [quote, setQuote] = useState('USDT');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['BTCUSDT', 'ETHUSDT']));

  const filtered = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return tickers
      .filter((t) => t.symbol.endsWith(quote))
      .filter((t) => {
        const base = t.symbol.replace(quote, '').toLowerCase();
        return t.symbol.toLowerCase().includes(searchTerm) || base.includes(searchTerm);
      })
      .slice(0, 50);
  }, [tickers, search, quote]);

  const toggleFav = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="trade-market-search">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="trade-market-filters">
        {['All', 'New'].map((f) => (
          <span key={f} className={`trade-market-filter ${f === 'All' ? 'active' : ''}`}>{f}</span>
        ))}
      </div>

      <div className="trade-market-filters">
        {QUOTE_FILTERS.map((q) => (
          <span
            key={q}
            className={`trade-market-filter ${quote === q ? 'active' : ''}`}
            onClick={() => setQuote(q)}
          >
            {q}
          </span>
        ))}
      </div>

      <div className="trade-market-cols">
        <span>Pair</span>
        <span>Last Price</span>
        <span>24h Chg</span>
      </div>

      <div className="trade-market-list">
        {filtered.map((t) => {
          const isUp = t.changePercent24h >= 0;
          const base = t.symbol.replace(quote, '');
          return (
            <div
              key={t.symbol}
              className={`trade-market-row ${t.symbol === symbol ? 'active' : ''}`}
              onClick={() => setSymbol(t.symbol)}
            >
              <span className="trade-market-symbol">
                <span
                  className={`trade-market-star ${favorites.has(t.symbol) ? 'fav' : ''}`}
                  onClick={(e) => toggleFav(t.symbol, e)}
                >
                  ★
                </span>
                {base}/{quote}
              </span>
              <span>{t.price.toLocaleString('en-US', { maximumFractionDigits: 6 })}</span>
              <span className={isUp ? 'val-up' : 'val-down'} style={{ color: isUp ? '#0ecb81' : '#f6465d' }}>
                {isUp ? '+' : ''}{t.changePercent24h.toFixed(2)}%
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="trade-loading">No pairs found</div>
        )}
      </div>
    </div>
  );
}
