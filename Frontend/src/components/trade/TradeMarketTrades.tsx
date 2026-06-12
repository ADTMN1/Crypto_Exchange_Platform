import { useMarketData } from '../../hooks/useMarketData';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtPrice(p: number) {
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
}

export default function TradeMarketTrades() {
  const { trades, symbol } = useMarketData();
  const base = symbol.replace('USDT', '');

  return (
    <div className="trade-trades-section">
      <div className="trade-panel-header">
        <span>Market Trades</span>
      </div>
      <div className="trade-trades-cols">
        <span>Price(USDT)</span>
        <span>Amount({base})</span>
        <span>Time</span>
      </div>
      <div className="trade-trades-list">
        {trades.map((t) => {
          const side = t.isBuyerMaker ? 'sell' : 'buy';
          return (
            <div key={t.id} className="trade-trade-row">
              <span className={side}>{fmtPrice(t.price)}</span>
              <span>{t.quantity.toFixed(5)}</span>
              <span>{formatTime(t.timestamp)}</span>
            </div>
          );
        })}
        {trades.length === 0 && (
          <div className="trade-loading">Loading trades...</div>
        )}
      </div>
    </div>
  );
}
