import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';

export interface MarketRow {
  symbol: string;
  price: number | null;
  change24h: number;
  volume: number;
}

interface MarketTableProps {
  rows: MarketRow[];
  isLoading?: boolean;
}

const COIN_META: Record<string, { name: string; color: string }> = {
  BTCUSDT:   { name: 'Bitcoin',  color: '#F7931A' },
  ETHUSDT:   { name: 'Ethereum', color: '#627EEA' },
  BNBUSDT:   { name: 'BNB',      color: '#F3BA2F' },
  SOLUSDT:   { name: 'Solana',   color: '#14F195' },
  XRPUSDT:   { name: 'XRP',      color: '#00AAE4' },
  ADAUSDT:   { name: 'Cardano',  color: '#0033AD' },
  DOGEUSDT:  { name: 'Dogecoin', color: '#C2A633' },
  AVAXUSDT:  { name: 'Avalanche',color: '#E84142' },
  DOTUSDT:   { name: 'Polkadot', color: '#E6007A' },
  MATICUSDT: { name: 'Polygon',  color: '#8247E5' },
  LTCUSDT:   { name: 'Litecoin', color: '#BFBBBB' },
  LINKUSDT:  { name: 'Chainlink',color: '#2A5ADA' },
  UNIUSDT:   { name: 'Uniswap',  color: '#FF007A' },
  ATOMUSDT:  { name: 'Cosmos',   color: '#2E3148' },
  TRXUSDT:   { name: 'TRON',     color: '#EB0029' },
};

const formatPrice = (price: number) => {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1)    return price.toFixed(4);
  return price.toFixed(6);
};

const formatVolume = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${(v / 1e3).toFixed(2)}K`;
};

const MarketTable = memo(({ rows, isLoading = false }: MarketTableProps) => {
  const renderRow = useCallback((row: MarketRow) => {
    const meta   = COIN_META[row.symbol] ?? { name: row.symbol.replace('USDT',''), color: '#F3921F' };
    const ticker = row.symbol.replace('USDT', '');
    const isUp   = row.change24h >= 0;

    return (
      <tr key={row.symbol} className="market-table-row">
        <td>
          <div className="market-table-coin">
            <div className="market-table-icon" style={{ color: meta.color, borderColor: `${meta.color}33` }}>
              {ticker[0]}
            </div>
            <div>
              <div className="market-table-name">{meta.name}</div>
              <div className="market-table-ticker">{ticker}/USDT</div>
            </div>
          </div>
        </td>
        <td className="market-table-price">
          {row.price === null ? '—' : `$${formatPrice(row.price)}`}
        </td>
        <td>
          <span className={`market-table-change ${isUp ? 'up' : 'down'}`}>
            {isUp ? '▲' : '▼'} {Math.abs(row.change24h).toFixed(2)}%
          </span>
        </td>
        <td className="market-table-volume">{formatVolume(row.volume)}</td>
        <td>
          <Link to={`/trade/${row.symbol.toLowerCase()}`} className="trade-btn" style={{ fontSize: '13px', padding: '8px 18px' }}>
            Trade
          </Link>
        </td>
      </tr>
    );
  }, []);

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading markets…</p>
      </div>
    );
  }

  return (
    <div className="markets-table-container">
      <table className="markets-table" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '14%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Coin</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th style={{ textAlign: 'right' }}>24h Change</th>
            <th style={{ textAlign: 'right' }}>Volume</th>
            <th style={{ textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                No market data available
              </td>
            </tr>
          ) : (
            rows.map(renderRow)
          )}
        </tbody>
      </table>
    </div>
  );
});

MarketTable.displayName = 'MarketTable';
export default MarketTable;
