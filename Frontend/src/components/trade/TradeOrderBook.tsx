import { useMemo } from 'react';
import { useMarketData } from '../../hooks/useMarketData';

interface Row {
  price: number;
  qty: number;
  total: number;
}

function buildRows(levels: { price: number; quantity: number }[], desc: boolean): Row[] {
  const sorted = [...levels].sort((a, b) => desc ? b.price - a.price : a.price - b.price);
  let total = 0;
  return sorted.map((l) => {
    total += l.quantity;
    return { price: l.price, qty: l.quantity, total };
  });
}

function fmtPrice(p: number) {
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
}

export default function TradeOrderBook() {
  const { depth, livePrice, priceDirection, symbol } = useMarketData();
  const base = symbol.replace('USDT', '');

  const { asks, bids, maxTotal } = useMemo(() => {
    if (!depth) return { asks: [], bids: [], maxTotal: 1 };
    const askRows = buildRows(depth.asks, false).slice(0, 18);
    const bidRows = buildRows(depth.bids, true).slice(0, 18);
    const max = Math.max(
      ...askRows.map((r) => r.total),
      ...bidRows.map((r) => r.total),
      1
    );
    return { asks: askRows, bids: bidRows, maxTotal: max };
  }, [depth]);

  return (
    <div className="trade-col-orderbook">
      <div className="trade-panel-header">
        <span>Order Book</span>
        <div className="trade-ob-view-btns">
          <div className="trade-ob-view-btn active" title="Default">▤</div>
          <div className="trade-ob-view-btn" title="Bids only">▥</div>
          <div className="trade-ob-view-btn" title="Asks only">▦</div>
        </div>
      </div>

      <div className="trade-ob-cols">
        <span>Price(USDT)</span>
        <span>Amount({base})</span>
        <span>Total</span>
      </div>

      <div className="trade-ob-asks">
        {asks.map((row, i) => (
          <div key={`a${i}`} className="trade-ob-row">
            <div className="trade-ob-row-bg ask" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
            <span className="price-ask">{fmtPrice(row.price)}</span>
            <span>{row.qty.toFixed(5)}</span>
            <span>{row.total.toFixed(5)}</span>
          </div>
        ))}
      </div>

      <div className="trade-ob-spread">
        <div className={`trade-ob-spread-price ${priceDirection}`}>
          {fmtPrice(livePrice)} ↗
        </div>
        <div className="trade-ob-spread-usd">≈ ${fmtPrice(livePrice)}</div>
      </div>

      <div className="trade-ob-bids">
        {bids.map((row, i) => (
          <div key={`b${i}`} className="trade-ob-row">
            <div className="trade-ob-row-bg bid" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
            <span className="price-bid">{fmtPrice(row.price)}</span>
            <span>{row.qty.toFixed(5)}</span>
            <span>{row.total.toFixed(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
