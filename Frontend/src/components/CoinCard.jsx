import React from 'react'
import { FaBitcoin, FaEthereum } from 'react-icons/fa'
import { SiBinance, SiSolana, SiRipple, SiCardano, SiDogecoin, SiPolygon } from 'react-icons/si'

function CoinCard({ coin }) {
  const getCryptoIcon = (symbol) => {
    const iconMap = {
      'BTC': <FaBitcoin />,
      'BTCK': <FaBitcoin />,
      'ETH': <FaEthereum />,
      'BNB': <SiBinance />,
      'SOL': <SiSolana />,
      'XRP': <SiRipple />,
      'ADA': <SiCardano />,
      'DOGE': <SiDogecoin />,
      'MATIC': <SiPolygon />,
    };
    return iconMap[symbol] || symbol[0];
  };

  const getIconColor = (symbol) => {
    const colorMap = {
      'BTC': '#F7931A',
      'BTCK': '#F7931A',
      'ETH': '#627EEA',
      'BNB': '#F3BA2F',
      'SOL': '#14F195',
      'XRP': '#23292F',
      'ADA': '#0033AD',
      'DOGE': '#C2A633',
      'MATIC': '#8247E5',
    };
    return colorMap[symbol] || '#F7931A';
  };

  return (
    <div className="coin-card">
      <div className="coin-icon" style={{ background: getIconColor(coin.symbol) }}>
        {getCryptoIcon(coin.symbol)}
      </div>
      <div className="coin-info">
        <div className="coin-name">{coin.name}</div>
        <div className="coin-symbol">{coin.symbol}</div>
      </div>
      <div className="coin-stats">
        <div className={`coin-change ${coin.positive ? 'positive' : 'negative'}`}>
          {coin.change}
        </div>
        <div className="coin-price">{coin.price}</div>
      </div>
    </div>
  )
}

export default CoinCard
