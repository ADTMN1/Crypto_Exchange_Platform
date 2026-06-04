import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

const users = [
  {
    id: "rahase1219",
    name: "Rahase Amine",
    firstName: "Rahase",
    lastName: "Amine",
    handle: "@rahase1219",
    email: "rahasezemichael@gmail.com",
    mobile: "+1 403-637-25",
    country: "Canada",
    joinedAt: "2026-03-21 06:54 AM",
    totalOrder: 0,
    totalTrade: 0,
    totalDeposit: 2,
    transactions: 12,
    status: "Normal Trading User",
    statusDescription:
      "This user trades normally based on market conditions. No outcome control is applied.",
    address: "4383 38 St NE",
  },
  {
    id: "ava_collins",
    name: "Ava Collins",
    firstName: "Ava",
    lastName: "Collins",
    handle: "@ava_collins",
    email: "ava.collins@example.com",
    mobile: "+1 415-555-0123",
    country: "United States",
    joinedAt: "2026-04-08 09:22 AM",
    totalOrder: 4,
    totalTrade: 8,
    totalDeposit: 6,
    transactions: 18,
    status: "Active Trading User",
    statusDescription: "User has an active profile and is fully verified for trading.",
    address: "198 Market St.",
  },
]

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const user = useMemo(
    () => users.find((item) => item.id === id) ?? users[0],
    [id]
  )

  const [verification, setVerification] = useState({
    email: true,
    mobile: true,
    twoFA: false,
    kyc: true,
  })

  const [balanceModal, setBalanceModal] = useState<{ isOpen: boolean; type: 'add' | 'subtract' | null }>({ 
    isOpen: false, 
    type: null 
  })
  const [balanceAmount, setBalanceAmount] = useState('')
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const toggleVerification = (key: keyof typeof verification) => {
    setVerification((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const openBalanceModal = (type: 'add' | 'subtract') => {
    setBalanceModal({ isOpen: true, type })
    setBalanceAmount('')
  }

  const closeBalanceModal = () => {
    setBalanceModal({ isOpen: false, type: null })
    setBalanceAmount('')
    setSelectedAction(null)
  }

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(`${balanceModal.type === 'add' ? 'Adding' : 'Subtracting'} balance: ${balanceAmount}`)
    closeBalanceModal()
  }

  const handleActionClick = (action: string) => {
    if (action === 'add-balance') {
      openBalanceModal('add')
    } else if (action === 'subtract-balance') {
      openBalanceModal('subtract')
    }
    setSelectedAction(action)
  }

  return (
    <main className="nex-admin-section-page">
      <section className="nex-section-header">
        <div>
          <h1>User Detail – {user.handle}</h1>
          <p>Review and manage the full account profile for {user.name}.</p>
        </div>
        <Link to="/" className="btn-primary btn-login-user">
          Login as User
        </Link>
      </section>

      <section className="nex-user-metrics-grid">
        <div className="nex-user-metric-card">
          <div className="metric-label">Total Order</div>
          <div className="metric-value">{user.totalOrder}</div>
        </div>
        <div className="nex-user-metric-card">
          <div className="metric-label">Total Trade</div>
          <div className="metric-value">{user.totalTrade}</div>
        </div>
        <div className="nex-user-metric-card nex-user-metric-card-accent">
          <div className="metric-label">Total Deposit</div>
          <div className="metric-value">{user.totalDeposit}</div>
        </div>
        <div className="nex-user-metric-card nex-user-metric-card-dark">
          <div className="metric-label">Transactions</div>
          <div className="metric-value">{user.transactions}</div>
        </div>
      </section>

      <section className="nex-user-status-bar">
        <div>
          <strong>{user.status}</strong>
          <p>{user.statusDescription}</p>
        </div>
      </section>

      <section className="nex-user-outcome-row">
        <div className="nex-user-outcome-card">
          <div className="nex-user-outcome-header">
            <span>Trade Outcome Control</span>
            <small>Control this user's trade outcomes. This affects both binary trades and position trades.</small>
          </div>
          <select defaultValue="normal">
            <option value="normal">Normal Trading</option>
            <option value="always-win">Always Win</option>
            <option value="always-lose">Always Lose</option>
          </select>
          <div className="nex-user-outcome-note">
            <strong>Note:</strong>
            <p>
              "Always Win" mode gives user profits regardless of market movement.
              "Always Lose" mode takes user's investment regardless of market movement.
              Normal mode uses real market conditions for trade outcomes.
              This setting affects both time-based (binary) and position trading.
            </p>
          </div>
        </div>

        <div className="nex-user-current-status-card">
          <div className="nex-user-current-title">Current Status:</div>
          <div className="nex-user-current-badge">Normal Trading</div>
          <div className="nex-user-current-description">Trades based on market conditions</div>
        </div>
      </section>

      <section className="nex-user-verification-row">
        <button
          type="button"
          className={`nex-verification-button ${verification.email ? "verified" : "disabled"}`}
          onClick={() => toggleVerification("email")}
        >
          <span>Email Verification</span>
          <strong>{verification.email ? "Verified" : "Disabled"}</strong>
        </button>
        <button
          type="button"
          className={`nex-verification-button ${verification.mobile ? "verified" : "disabled"}`}
          onClick={() => toggleVerification("mobile")}
        >
          <span>Mobile Verification</span>
          <strong>{verification.mobile ? "Verified" : "Disabled"}</strong>
        </button>
        <button
          type="button"
          className={`nex-verification-button ${verification.twoFA ? "verified" : "disabled"}`}
          onClick={() => toggleVerification("twoFA")}
        >
          <span>2FA Verification</span>
          <strong>{verification.twoFA ? "Verified" : "Disable"}</strong>
        </button>
        <button
          type="button"
          className={`nex-verification-button ${verification.kyc ? "verified" : "disabled"}`}
          onClick={() => toggleVerification("kyc")}
        >
          <span>KYC</span>
          <strong>{verification.kyc ? "Verified" : "Disabled"}</strong>
        </button>
      </section>

      <section className="nex-user-update-button-row">
        <button className="btn-primary btn-update-user">Update User</button>
      </section>

      <section className="nex-user-wallet-grid">
        <div className="nex-wallet-card">
          <div className="wallet-icon wallet-usdt">USDT</div>
          <div className="wallet-details">
            <strong>652.8565 USDT</strong>
            <span>Total Balance</span>
          </div>
          <div className="wallet-tag">SPOT</div>
        </div>
        <div className="nex-wallet-card">
          <div className="wallet-icon wallet-btc">BTC</div>
          <div className="wallet-details">
            <strong>0.0001 BTC</strong>
            <span>Total Balance</span>
          </div>
          <div className="wallet-tag">SPOT</div>
        </div>
      </section>

      <section className="nex-user-actions-row">
        <div 
          className="nex-action-card nex-action-card-add-balance"
          onClick={() => handleActionClick('add-balance')}
        >
          <div className="action-card-label">Add Balance</div>
          <div className="action-card-value">+</div>
        </div>
        <div 
          className="nex-action-card nex-action-card-subtract-balance"
          onClick={() => handleActionClick('subtract-balance')}
        >
          <div className="action-card-label">Subtract Balance</div>
          <div className="action-card-value">−</div>
        </div>
        <div 
          className="nex-action-card nex-action-card-logins"
          onClick={() => setSelectedAction('logins')}
        >
          <div className="action-card-label">Logins</div>
          <div className="action-card-value">👤</div>
        </div>
        <div 
          className="nex-action-card nex-action-card-notifications"
          onClick={() => setSelectedAction('notifications')}
        >
          <div className="action-card-label">Notifications</div>
          <div className="action-card-value">🔔</div>
        </div>
        <div 
          className="nex-action-card nex-action-card-kyc"
          onClick={() => setSelectedAction('kyc')}
        >
          <div className="action-card-label">KYC Data</div>
          <div className="action-card-value">📋</div>
        </div>
        <div 
          className="nex-action-card nex-action-card-ban"
          onClick={() => setSelectedAction('ban')}
        >
          <div className="action-card-label">Ban User</div>
          <div className="action-card-value">⛔</div>
        </div>
      </section>

      {/* Balance Modal */}
      {balanceModal.isOpen && (
        <div className="nex-modal-overlay" onClick={closeBalanceModal}>
          <div className="nex-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>{balanceModal.type === 'add' ? 'Add Balance' : 'Subtract Balance'}</h2>
              <button className="nex-modal-close" onClick={closeBalanceModal}>×</button>
            </div>
            <form onSubmit={handleBalanceSubmit} className="nex-modal-form">
              <div className="nex-form-group">
                <label htmlFor="balance-amount">Amount</label>
                <input
                  id="balance-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="nex-modal-actions">
                <button type="button" className="btn-cancel" onClick={closeBalanceModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {balanceModal.type === 'add' ? 'Add' : 'Subtract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="nex-card nex-user-details-card">
        <div className="nex-profile-section-title">
          <h2>Information of {user.name}</h2>
        </div>
        <div className="nex-user-details-grid">
          <div className="nex-form-grid">
            <label htmlFor="first-name">First Name</label>
            <input id="first-name" type="text" defaultValue={user.firstName} />

            <label htmlFor="email">Email</label>
            <input id="email" type="email" defaultValue={user.email} />

            <label htmlFor="address">Address</label>
            <input id="address" type="text" defaultValue={user.address} />
          </div>

          <div className="nex-form-grid">
            <label htmlFor="last-name">Last Name</label>
            <input id="last-name" type="text" defaultValue={user.lastName} />

            <label htmlFor="mobile">Mobile Number</label>
            <input id="mobile" type="tel" defaultValue={user.mobile} />
          </div>
        </div>
      </section>
    </main>
  )
}
