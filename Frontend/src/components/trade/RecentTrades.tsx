
import React from 'react';

function mockTrades() {
  const trades = [];
  const basePrice = 66550;
  for (let i = 0; i < 30; i++) {
    const priceChange = (Math.random() - 0.5) * 10;
    const price = (basePrice + priceChange).toFixed(2);
    const amount = (Math.random() * 0.5).toFixed(4);
    const time = new Date(Date.now() - i * 2000);
    const isBuy = priceChange > 0;
    trades.push({
      price,
      amount,
      time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`,
      isBuy
    });
  }
  return trades;
}

export default function RecentTrades({ symbol }: { symbol?: string }) {
  const trades = mockTrades();
  const baseCurrency = symbol?.split('/')[0] || 'BTC';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        padding: '12px 16px',
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'left',
        borderBottom: '1px solid #334155'
      }}>
        <span>Price (USDT)</span>
        <span style={{ textAlign: 'center' }}>Amount ({baseCurrency})</span>
        <span style={{ textAlign: 'right' }}>Time</span>
      </div>
      
      {/* Trades list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {trades.map((trade, i) => (
          <div 
            key={i} 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              padding: '8px 16px',
              fontSize: 12
            }}
          >
            <span style={{ color: trade.isBuy ? '#22c55e' : '#f87171', textAlign: 'left', fontWeight: 500 }}>
              {trade.price}
            </span>
            <span style={{ color: '#e2e8f0', textAlign: 'center' }}>
              {trade.amount}
            </span>
            <span style={{ color: '#94a3b8', textAlign: 'right' }}>
              {trade.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
