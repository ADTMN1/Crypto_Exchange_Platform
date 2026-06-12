import { useMarketData } from '../../hooks/useMarketData';
import { useState } from 'react';
import DepositModal from '../common/DepositModal';

const COIN_ICONS: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', BNB: 'B', SOL: 'S', XRP: 'X',
  ADA: 'A', DOGE: 'Ð', AVAX: 'A', DOT: 'D', LINK: 'L',
};

function formatNum(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatVol(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

export default function TradeHeader() {
  const { symbol, stats, livePrice, priceDirection } = useMarketData();

  const base = symbol.replace('USDT', '');
  const isUp = (stats?.changePercent24h ?? 0) >= 0;
  const dir = priceDirection;
  const price = livePrice || stats?.price || 0;

  return (
    <div className="trade-header">
      <div className="trade-header-main">
        <div className="trade-header-pair">
          <div className="trade-header-pair-icon">{COIN_ICONS[base] || base[0]}</div>
          <span className="trade-header-pair-name">{base}/USDT</span>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div className={`trade-header-price ${dir}`}>{formatNum(price)}</div>
          <DepositButton />
        </div>
      </div>

      <div className="trade-header-stats">
        <div className="trade-header-stat">
          <span className="trade-header-stat-label">24h High</span>
          <span className="trade-header-stat-value">{formatNum(stats?.high24h ?? 0)}</span>
        </div>

        <div className="trade-header-stat">
          <span className="trade-header-stat-label">24h Low</span>
          <span className="trade-header-stat-value">{formatNum(stats?.low24h ?? 0)}</span>
        </div>

        <div className="trade-header-stat">
          <span className="trade-header-stat-label">24h Volume({base})</span>
          <span className="trade-header-stat-value">{formatVol(stats?.volume24h ?? 0)}</span>
        </div>

        <div className="trade-header-stat">
          <span className="trade-header-stat-label">24h Volume(USDT)</span>
          <span className="trade-header-stat-value">{formatVol(stats?.volumeQuote24h ?? 0)}</span>
        </div>
      </div>
    </div>
  );
}

function DepositButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="trade-deposit-btn" onClick={() => setOpen(true)}>Deposit</button>
      <DepositModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
