import React from 'react';

export default function OpenOrders() {
  const mock = [
    { pair: 'BTC/USDT', type: 'Limit', side: 'Buy', price: 65500, amount: 0.01, filled: 0 },
    { pair: 'ETH/USDT', type: 'Limit', side: 'Sell', price: 3200, amount: 0.5, filled: 0.25 },
  ];

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <h4 style={{ marginTop: 0, marginBottom: 8 }}>Open Orders</h4>
      {mock.map((o, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div>
            <div style={{ fontWeight: 700 }}>{o.pair}</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>{o.type} · {o.side}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>${o.price}</div>
            <div style={{ color: '#9CA3AF', fontSize: 13 }}>{o.amount} · Filled: {o.filled}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
