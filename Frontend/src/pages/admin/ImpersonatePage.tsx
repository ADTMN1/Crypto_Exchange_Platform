import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import adminService, {
  AdminUser,
  AdminUserTransaction,
  AdminUserWallet,
} from '../../services/admin.service'

const CURRENCY_BG: Record<string, string> = {
  USDT: 'linear-gradient(135deg,rgba(18,188,126,.96),rgba(12,168,104,.96))',
  BTC:  'linear-gradient(135deg,rgba(242,144,6,.96),rgba(215,94,12,.96))',
  ETH:  'linear-gradient(135deg,rgba(98,126,234,.96),rgba(70,100,200,.96))',
  BNB:  'linear-gradient(135deg,rgba(240,185,11,.96),rgba(200,150,5,.96))',
}

function fmtNum(n: string | number) {
  return parseFloat(String(n)).toLocaleString('en-US', { maximumFractionDigits: 8 })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ImpersonatePage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [user, setUser]               = useState<AdminUser | null>(null)
  const [wallets, setWallets]         = useState<AdminUserWallet[]>([])
  const [transactions, setTx]         = useState<AdminUserTransaction[]>([])
  const [txTotal, setTxTotal]         = useState(0)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingTx, setLoadingTx]     = useState(true)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoadingUser(true)
    Promise.all([adminService.getUserById(id), adminService.getUserWallets(id)])
      .then(([uRes, wRes]) => { setUser(uRes.data); setWallets(wRes.data) })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? 'Failed to load user'
        setError(msg); toast.error(msg)
      })
      .finally(() => setLoadingUser(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoadingTx(true)
    adminService.getUserTransactions(id)
      .then((r) => { setTx(r.data.transactions); setTxTotal(r.data.total) })
      .catch(() => {})
      .finally(() => setLoadingTx(false))
  }, [id])

  const totalBalance = wallets.reduce((s, w) => s + parseFloat(w.balance ?? 0), 0)

  if (loadingUser) {
    return (
      <main className="nex-admin-section-page">
        <div className="nex-loading"><div className="nex-spinner" /><p>Loading user view…</p></div>
      </main>
    )
  }

  if (error || !user) {
    return (
      <main className="nex-admin-section-page">
        <div style={{ padding: '2rem', color: 'var(--danger)' }}>
          {error ?? 'User not found.'}
          <button onClick={() => navigate(-1)} style={{ marginLeft: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
            Go back
          </button>
        </div>
      </main>
    )
  }

  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <main className="nex-admin-section-page">

      {/* ── Header ── */}
      <section className="nex-section-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Back button */}
          <button
            onClick={() => navigate(`/admin/users/${id}`)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(169,255,232,0.12)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', padding: '8px 14px', fontSize: 13, fontWeight: 700 }}
          >
            ← Back
          </button>
          <div className="nex-avatar" style={{ width: 48, height: 48, fontSize: 17, borderRadius: 10, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 22 }}>@{user.username}</h1>
              <span className={`nex-badge ${user.account_status === 'active' ? 'nex-badge-success' : user.account_status === 'banned' ? 'nex-badge-danger' : 'nex-badge-warning'}`}>
                {user.account_status}
              </span>
              {/* Admin view banner */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(90deg,rgba(124,58,237,0.25),rgba(109,40,217,0.15))',
                border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd',
              }}>
                🔑 Admin View
              </span>
            </div>
            <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {user.email} · Joined {fmtDate(user.created_at)}
            </p>
          </div>
        </div>
      </section>

      {/* ── Portfolio value hero ── */}
      <section style={{
        padding: '28px 32px', borderRadius: 16,
        background: 'linear-gradient(135deg,rgba(124,58,237,0.18) 0%,rgba(8,13,16,0.96) 100%)',
        border: '1px solid rgba(167,139,250,0.2)',
        boxShadow: '0 8px 32px rgba(124,58,237,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Total Portfolio Value
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {fmtNum(totalBalance)}
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>units</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, marginTop: 8 }}>
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} · {txTotal} transaction{txTotal !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minWidth: 260 }}>
          {[
            { label: 'Email', ok: user.email_verified },
            { label: 'Mobile', ok: !!user.phone_verified },
            { label: '2FA', ok: !!user.two_fa_enabled },
            { label: 'Active', ok: user.is_active },
          ].map(({ label, ok }) => (
            <div key={label} style={{
              padding: '10px 14px', borderRadius: 10,
              background: ok ? 'rgba(34,197,118,0.12)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${ok ? 'rgba(34,197,118,0.25)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>{ok ? '✅' : '❌'}</span>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ color: ok ? '#22c576' : '#ef4444', fontSize: 12, fontWeight: 700 }}>{ok ? 'Verified' : 'Unverified'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stat cards ── */}
      <section className="nex-user-metrics-grid">
        <div className="nex-user-metric-card">
          <div className="metric-label">Username</div>
          <div className="metric-value" style={{ fontSize: 16 }}>@{user.username}</div>
        </div>
        <div className="nex-user-metric-card">
          <div className="metric-label">Role</div>
          <div className="metric-value" style={{ fontSize: 16 }}>{user.role ?? 'user'}</div>
        </div>
        <div className="nex-user-metric-card nex-user-metric-card-accent">
          <div className="metric-label">Wallets</div>
          <div className="metric-value">{wallets.length}</div>
        </div>
        <div className="nex-user-metric-card nex-user-metric-card-dark">
          <div className="metric-label">Transactions</div>
          <div className="metric-value">{txTotal}</div>
        </div>
      </section>

      {/* ── Wallets ── */}
      <section className="nex-card">
        <div className="nex-card-title">
          <h2>Spot Wallets</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</span>
        </div>
        {wallets.length === 0 ? (
          <div className="nex-empty-state"><p>No wallets found</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {wallets.map((w) => (
              <div key={w.id} className="nex-wallet-card" style={{ gap: 12 }}>
                <div className="wallet-icon" style={{ background: CURRENCY_BG[w.currency] ?? 'linear-gradient(135deg,rgba(34,139,123,.96),rgba(38,211,171,.92))' }}>
                  {w.currency.slice(0, 4)}
                </div>
                <div className="wallet-details">
                  <strong>{fmtNum(w.balance)} {w.currency}</strong>
                  <span>Locked: {fmtNum(w.locked_balance)}</span>
                </div>
                <div className="wallet-tag">SPOT</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Account info ── */}
      <section className="nex-card nex-user-details-card">
        <div className="nex-profile-section-title"><h2>Account Information</h2></div>
        <div className="nex-user-details-grid">
          <div className="nex-form-grid">
            <label>Username</label>
            <input readOnly value={user.username} />
            <label>Email</label>
            <input readOnly value={user.email} />
            <label>Role</label>
            <input readOnly value={user.role ?? 'user'} />
          </div>
          <div className="nex-form-grid">
            <label>Phone</label>
            <input readOnly value={user.phone_number ?? '—'} />
            <label>Joined</label>
            <input readOnly value={fmtDate(user.created_at)} />
            <label>Last Login</label>
            <input readOnly value={user.last_login_at ? fmtDate(user.last_login_at) : '—'} />
          </div>
        </div>
      </section>

      {/* ── Transactions ── */}
      <section className="nex-card">
        <div className="nex-card-title">
          <h2>Transaction History</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{txTotal} total</span>
        </div>
        {loadingTx ? (
          <div className="nex-loading"><div className="nex-spinner" /><p>Loading transactions…</p></div>
        ) : transactions.length === 0 ? (
          <div className="nex-empty-state"><p>No transactions found</p></div>
        ) : (
          <div className="nex-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className={`nex-badge ${tx.type === 'deposit' ? 'nex-badge-success' : 'nex-badge-warning'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{tx.currency}</td>
                    <td style={{ color: tx.type === 'deposit' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                      {tx.type === 'deposit' ? '+' : '-'}{fmtNum(tx.amount)}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{tx.fee ? fmtNum(tx.fee) : '—'}</td>
                    <td>
                      <span className={`nex-badge ${tx.status === 'completed' ? 'nex-badge-success' : 'nex-badge-warning'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </main>
  )
}
