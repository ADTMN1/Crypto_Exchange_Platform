import { memo } from 'react';

interface PriceCardProps {
  symbol: string;
  price: number | null;
  change24h?: number;
  isLoading?: boolean;
}

const COIN_META: Record<string, { name: string; color: string; bg: string }> = {
  BTCUSDT:   { name: 'Bitcoin',  color: '#F7931A', bg: 'rgba(247,147,26,0.12)'  },
  ETHUSDT:   { name: 'Ethereum', color: '#627EEA', bg: 'rgba(98,126,234,0.12)'  },
  BNBUSDT:   { name: 'BNB',      color: '#F3BA2F', bg: 'rgba(243,186,47,0.12)'  },
  SOLUSDT:   { name: 'Solana',   color: '#14F195', bg: 'rgba(20,241,149,0.12)'  },
  XRPUSDT:   { name: 'XRP',      color: '#00AAE4', bg: 'rgba(0,170,228,0.12)'   },
  ADAUSDT:   { name: 'Cardano',  color: '#0033AD', bg: 'rgba(0,51,173,0.12)'    },
  DOGEUSDT:  { name: 'Dogecoin', color: '#C2A633', bg: 'rgba(194,166,51,0.12)'  },
  MATICUSDT: { name: 'Polygon',  color: '#8247E5', bg: 'rgba(130,71,229,0.12)'  },
};

const formatPrice = (price: number) => {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1)    return price.toFixed(4);
  return price.toFixed(6);
};

const PriceCard = memo(({ symbol, price, change24h = 0, isLoading = false }: PriceCardProps) => {
  const meta   = COIN_META[symbol] ?? { name: symbol.replace('USDT',''), color: '#F3921F', bg: 'rgba(243,146,31,0.12)' };
  const isUp   = change24h >= 0;
  const ticker = symbol.replace('USDT', '');

  return (
    <div className="price-card" style={{ '--card-color': meta.color } as React.CSSProperties}>
      <div className="price-card-header">
        <div className="price-card-icon" style={{ background: meta.bg, color: meta.color }}>
          {ticker[0]}
        </div>
        <div className="price-card-name">
          <span className="price-card-coin">{meta.name}</span>
          <span className="price-card-pair">{ticker}/USDT</span>
        </div>
        <div className={`price-card-dot ${isLoading ? '' : 'live'}`} />
      </div>

      <div className="price-card-price">
        {isLoading || price === null ? '—' : `$${formatPrice(price)}`}
      </div>

      <div className={`price-card-change ${isUp ? 'up' : 'down'}`}>
        {isUp ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
      </div>
    </div>
  );
});

PriceCard.displayName = 'PriceCard';
export default PriceCard;
