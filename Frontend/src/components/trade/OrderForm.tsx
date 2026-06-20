
import React, { useState } from 'react';

export default function OrderForm({ symbol }: { symbol: string }) {
  const baseCurrency = symbol?.split('/')[0] || 'BTC';
  const [amount, setAmount] = useState<string>('0.00');

  const tradeDurations = [
    { duration: '30s', minAmount: '$100', profit: '+10%' },
    { duration: '60s', minAmount: '$1,000', profit: '+15%' },
    { duration: '90s', minAmount: '$5,000', profit: '+20%' },
    { duration: '120s', minAmount: '$20,000', profit: '+20%' },
    { duration: '180s', minAmount: '$50,000', profit: '+25%' },
    { duration: '300s', minAmount: '$90,000', profit: '+30%' }
  ];

  return (
    <div style={{ padding: 16, background: '#1e293b' }}>
      {/* Amount (USD) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
          Amount (USD)
        </div>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 16,
            fontWeight: 600,
            outline: 'none'
          }}
        />
      </div>

      {/* Coin Amount */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
          Coin Amount: 0.00000000
        </div>
      </div>

      {/* Trade Duration */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
          Trade Duration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {tradeDurations.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                {item.duration}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>
                Min {item.minAmount}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>
                {item.profit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Profit */}
      <div style={{ marginBottom: 12, fontSize: 14, color: '#e2e8f0' }}>
        Estimated Profit
        <div style={{ fontSize: 16, fontWeight: 600, color: '#22c55e', marginTop: 4 }}>
          +$0.00 (0.00%)
        </div>
      </div>

      {/* Total Return */}
      <div style={{ marginBottom: 24, fontSize: 14, color: '#e2e8f0' }}>
        Total Return
        <div style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginTop: 4 }}>
          $0.00
        </div>
      </div>

      {/* Buy/Sell Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{
          flex: 1,
          padding: '16px 0',
          background: '#22c55e',
          border: 'none',
          borderRadius: 8,
          color: 'white',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Buy
        </button>
        <button style={{
          flex: 1,
          padding: '16px 0',
          background: '#dc2626',
          border: 'none',
          borderRadius: 8,
          color: 'white',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          Sell
        </button>
      </div>
    </div>
  );
}
