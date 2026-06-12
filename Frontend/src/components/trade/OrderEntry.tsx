import { useState } from 'react';

export default function OrderEntry({ symbol }: { symbol: string }) {
  const [amount, setAmount] = useState('0.01');
  const [price, setPrice] = useState('');

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Buy / Sell</h3>
        <div style={{ color: '#9CA3AF' }}>{symbol}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1 }}>Buy</button>
          <button className="btn-outline" style={{ flex: 1 }}>Sell</button>
        </div>

        <label style={{ fontSize: 13, color: '#9CA3AF' }}>Price (USDT)</label>
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Market price" style={{ padding: 10, borderRadius: 8, background: '#0f1724', border: '1px solid #111827', color: '#fff' }} />

        <label style={{ fontSize: 13, color: '#9CA3AF' }}>Amount ({symbol.replace('USDT','')})</label>
        <input value={amount} onChange={e => setAmount(e.target.value)} style={{ padding: 10, borderRadius: 8, background: '#0f1724', border: '1px solid #111827', color: '#fff' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ color: '#9CA3AF' }}>Available: 10,000 USDT</div>
          <div style={{ fontWeight: 700 }}>${(parseFloat(price || '0') * parseFloat(amount || '0') || 0).toFixed(2)} USDT</div>
        </div>
      </div>
    </section>
  );
}
