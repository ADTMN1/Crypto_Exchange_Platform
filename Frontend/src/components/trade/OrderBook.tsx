
import React from 'react';

function mockLevels() {
  const asks = [];
  const bids = [];
  for (let i = 0; i < 15; i++) {
    asks.push({ price: (66550 + i * 5).toFixed(2), amount: (Math.random() * 0.8).toFixed(4), total: ((66550 + i * 5) * Math.random() * 0.8).toFixed(2) });
    bids.push({ price: (66550 - i * 5).toFixed(2), amount: (Math.random() * 1.2).toFixed(4), total: ((66550 - i * 5) * Math.random() * 1.2).toFixed(2) });
  }
  asks.reverse();
  return { asks, bids };
}

export default function OrderBook({ symbol }: { symbol?: string }) {
  const { asks, bids } = mockLevels();
  const lastPrice = bids[0]?.price || '0';
  const baseCurrency = symbol?.split('/')[0] || 'BTC';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Order book header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        padding: '12px 16px',
        fontSize: 12,
        color: '#94a3b8',
        borderBottom: '1px solid #334155'
      }}>
        <span>Price (USDT)</span>
        <span style={{ textAlign: 'center' }}>Size ({baseCurrency})</span>
        <span style={{ textAlign: 'right' }}>Sum ({baseCurrency})</span>
      </div>

      {/* Asks (sells) */}
      <div style={{ flex: '0 0 auto', maxHeight: '40%', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
        {asks.map((a, i) => {
          const percent = Math.random() * 100;
          return (
            <div 
              key={i} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                padding: '6px 16px',
                fontSize: 12,
                position: 'relative'
              }}
            >
              <div style={{ 
                position: 'absolute', 
                right: 0, 
                top: 0, 
                bottom: 0, 
                background: 'rgba(244, 63, 94, 0.12)', 
                width: `${percent}%`,
                zIndex: 0
              }} />
              <span style={{ color: '#f87171', textAlign: 'left', zIndex: 1, fontWeight: 500 }}>{a.price}</span>
              <span style={{ color: '#e2e8f0', textAlign: 'center', zIndex: 1 }}>{a.amount}</span>
              <span style={{ color: '#94a3b8', textAlign: 'right', zIndex: 1 }}>{a.total}</span>
            </div>
          );
        })}
      </div>

      {/* Current Price */}
      <div style={{ 
        padding: '12px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        background: '#1e293b'
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#22c55e', marginRight: 8 }}>
          {lastPrice}
        </span>
        <span style={{ fontSize: 12, color: '#22c55e' }}>↑</span>
        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>
          {bids[1]?.price}
        </span>
      </div>

      {/* Bids (buys) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {bids.map((b, i) => {
          const percent = Math.random() * 100;
          return (
            <div 
              key={i} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr', 
                padding: '6px 16px',
                fontSize: 12,
                position: 'relative'
              }}
            >
              <div style={{ 
                position: 'absolute', 
                right: 0, 
                top: 0, 
                bottom: 0, 
                background: 'rgba(34, 197, 94, 0.12)', 
                width: `${percent}%`,
                zIndex: 0
              }} />
              <span style={{ color: '#22c55e', textAlign: 'left', zIndex: 1, fontWeight: 500 }}>{b.price}</span>
              <span style={{ color: '#e2e8f0', textAlign: 'center', zIndex: 1 }}>{b.amount}</span>
              <span style={{ color: '#94a3b8', textAlign: 'right', zIndex: 1 }}>{b.total}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
