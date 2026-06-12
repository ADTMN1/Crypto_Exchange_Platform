import { useState } from 'react';

type WatchItem = {
  symbol: string;
  tvSymbol: string; // TradingView symbol (e.g., "BINANCE:BTCUSDT")
  last: string;
  change: string;
  pct: string;
};

const GROUPS: Record<string, WatchItem[]> = {
  INDICES: [
    { symbol: 'S&P 500', tvSymbol: 'SPX', last: '4,450.12', change: '-12.34', pct: '-0.28%' },
    { symbol: 'NASDAQ 100', tvSymbol: 'NDX', last: '18,920.50', change: '+85.30', pct: '+0.45%' },
  ],
  STOCKS: [
    { symbol: 'TSLA', tvSymbol: 'NASDAQ:TSLA', last: '391.00', change: '-27.45', pct: '-6.56%' },
    { symbol: 'AAPL', tvSymbol: 'NASDAQ:AAPL', last: '307.34', change: '-3.89', pct: '-1.25%' },
    { symbol: 'NFLX', tvSymbol: 'NASDAQ:NFLX', last: '82.18', change: '+0.62', pct: '+0.76%' },
    { symbol: 'MSFT', tvSymbol: 'NASDAQ:MSFT', last: '420.50', change: '+5.20', pct: '+1.25%' },
  ],
  CRYPTO: [
    { symbol: 'BTC/USDT', tvSymbol: 'BINANCE:BTCUSDT', last: '66,541.21', change: '+1,530.21', pct: '+2.35%' },
    { symbol: 'ETH/USDT', tvSymbol: 'BINANCE:ETHUSDT', last: '3,142.32', change: '+39.25', pct: '+1.25%' },
    { symbol: 'SOL/USDT', tvSymbol: 'BINANCE:SOLUSDT', last: '180.50', change: '+12.30', pct: '+7.30%' },
    { symbol: 'DOGE/USDT', tvSymbol: 'BINANCE:DOGEUSDT', last: '0.1520', change: '+0.0120', pct: '+8.57%' },
  ],
  METALS: [
    { symbol: 'GOLD', tvSymbol: 'TVC:GOLD', last: '2,350.00', change: '-25.00', pct: '-1.05%' },
    { symbol: 'SILVER', tvSymbol: 'TVC:SILVER', last: '28.50', change: '-0.80', pct: '-2.74%' },
  ],
  FOREX: [
    { symbol: 'EUR/USD', tvSymbol: 'FX:EURUSD', last: '1.0850', change: '+0.0020', pct: '+0.18%' },
    { symbol: 'GBP/USD', tvSymbol: 'FX:GBPUSD', last: '1.2650', change: '-0.0010', pct: '-0.08%' },
  ],
};

function GroupRow({ name, items, onSelect }: { name: string; items: WatchItem[]; onSelect: (tvSymbol: string, symbol: string) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 4px', alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>{name}</div>
        <div style={{ color: '#9CA3AF', fontSize: 12 }}>{open ? '▾' : '▸'}</div>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: 6 }}>
          {items.map((it) => (
            <div 
              key={it.symbol} 
              onClick={() => onSelect(it.tvSymbol, it.symbol)}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 6px', alignItems: 'center', cursor: 'pointer', borderRadius: 8 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 700 }}>{it.symbol}</div>
                <div style={{ color: '#9CA3AF', fontSize: 12 }}>{/* subtitle placeholder */}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{it.last}</div>
                <div style={{ color: it.pct.startsWith('-') ? '#EF4444' : '#10B981', fontSize: 12 }}>{it.change} · {it.pct}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Watchlist({ onSelect }: { onSelect: (tvSymbol: string, symbol: string) => void }) {
  const textStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
    fontStyle: 'normal',
    fontWeight: 400,
    color: 'rgb(112, 112, 112)',
    fontSize: '11px',
    lineHeight: '16px',
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4" style={{ width: '100%', ...textStyle }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Watchlist</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: 'transparent', border: '1px solid #111827', padding: '6px 8px', borderRadius: 8, color: '#9CA3AF' }}>+</button>
          <button style={{ background: 'transparent', border: 'none', color: '#9CA3AF' }}>⋯</button>
        </div>
      </div>

      {Object.keys(GROUPS).map((g) => (
        <div key={g} style={{ marginBottom: 6 }}>
          <GroupRow name={g} items={GROUPS[g]} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}
