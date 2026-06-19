import { AdminUser } from '../../../services/admin.service'

interface Props {
  user: AdminUser
  txTotal: number
  walletCount: number
}

export default function UserStatsBar({ user, txTotal, walletCount }: Props) {
  return (
    <>
      <section className="nex-user-metrics-grid">
        <div className="nex-user-metric-card">
          <div className="metric-label">Account Status</div>
          <div className="metric-value" style={{ fontSize: 13, marginTop: 6 }}>
            <span className={`nex-badge ${user.account_status === 'active' ? 'nex-badge-success' : user.account_status === 'banned' ? 'nex-badge-danger' : 'nex-badge-warning'}`}>
              {user.account_status}
            </span>
          </div>
        </div>
        <div className="nex-user-metric-card">
          <div className="metric-label">Phone</div>
          <div className="metric-value" style={{ fontSize: 13, marginTop: 6 }}>
            {user.phone_number
              ? <span style={{ color: 'var(--text-main)', fontSize: 14 }}>{user.phone_number}</span>
              : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Not set</span>}
          </div>
        </div>
        <div className="nex-user-metric-card nex-user-metric-card-accent">
          <div className="metric-label">Wallets</div>
          <div className="metric-value">{walletCount}</div>
        </div>
        <div className="nex-user-metric-card nex-user-metric-card-dark">
          <div className="metric-label">Transactions</div>
          <div className="metric-value">{txTotal}</div>
        </div>
      </section>

      <section className="nex-user-verification-row">
        {[
          { label: 'Email', ok: user.email_verified },
          { label: 'Mobile', ok: !!user.phone_verified },
          { label: '2FA', ok: !!user.two_fa_enabled },
          { label: 'Active', ok: user.is_active },
        ].map(({ label, ok }) => (
          <div key={label} className={`nex-verification-button ${ok ? 'verified' : 'disabled'}`}>
            <span>{label}</span>
            <strong>{ok ? 'Verified' : 'Unverified'}</strong>
          </div>
        ))}
      </section>
    </>
  )
}
