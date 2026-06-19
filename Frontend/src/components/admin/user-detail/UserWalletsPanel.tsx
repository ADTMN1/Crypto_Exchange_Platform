import { AdminUserWallet } from '../../../services/admin.service'

interface Props {
  wallets: AdminUserWallet[]
  onAddBalance: (currency: string) => void
  onSubtractBalance: (currency: string) => void
}

const CURRENCY_COLORS: Record<string, string> = {
  USDT: 'linear-gradient(135deg,rgba(18,188,126,.96),rgba(12,168,104,.96))',
  BTC:  'linear-gradient(135deg,rgba(242,144,6,.96),rgba(215,94,12,.96))',
  ETH:  'linear-gradient(135deg,rgba(98,126,234,.96),rgba(70,100,200,.96))',
  BNB:  'linear-gradient(135deg,rgba(240,185,11,.96),rgba(200,150,5,.96))',
}

function fmt(n: string | number) {
  return parseFloat(String(n)).toLocaleString('en-US', { maximumFractionDigits: 8 })
}

export default function UserWalletsPanel({ wallets, onAddBalance, onSubtractBalance }: Props) {
  if (wallets.length === 0) {
    return (
      <section className="nex-card">
        <div className="nex-card-title"><h2>Wallets</h2></div>
        <div className="nex-empty-state"><p>No wallets found for this user</p></div>
      </section>
    )
  }

  return (
    <section className="nex-card">
      <div className="nex-card-title">
        <h2>Spot Wallets</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
        {wallets.map((w) => (
          <div key={w.id} className="nex-wallet-card" style={{ gap: 14 }}>
            <div
              className="wallet-icon"
              style={{ background: CURRENCY_COLORS[w.currency] ?? 'linear-gradient(135deg,rgba(34,139,123,.96),rgba(38,211,171,.92))' }}
            >
              {w.currency.slice(0, 4)}
            </div>
            <div className="wallet-details">
              <strong>{fmt(w.balance)} {w.currency}</strong>
              <span>Locked: {fmt(w.locked_balance)} {w.currency}</span>
            </div>
            <div className="wallet-tag">SPOT</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button
                onClick={() => onAddBalance(w.currency)}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'rgba(34,211,171,0.15)', color: '#6fffe4', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >+ Add</button>
              <button
                onClick={() => onSubtractBalance(w.currency)}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ff8585', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >− Subtract</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
