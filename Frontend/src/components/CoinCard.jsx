import React from 'react'

function CoinCard({ coin }) {
  return (
    <div className="coin-card">
      <div className="coin-icon">{coin.symbol[0]}</div>
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
