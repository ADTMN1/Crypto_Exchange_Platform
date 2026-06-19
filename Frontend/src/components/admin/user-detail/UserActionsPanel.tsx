import { useState } from 'react'
import { AdminUser, AdminUserWallet } from '../../../services/admin.service'

interface Props {
  user: AdminUser
  wallets: AdminUserWallet[]
  onBan: () => void
  onUnban: () => void
  onTopup: (currency: string, amount: number) => Promise<void>
  onDebit: (currency: string, amount: number) => Promise<void>
}

export default function UserActionsPanel({ user, wallets, onBan, onUnban, onTopup, onDebit }: Props) {
  const [modal, setModal] = useState<{ open: boolean; type: 'add' | 'subtract'; currency: string }>({
    open: false, type: 'add', currency: wallets[0]?.currency ?? 'USDT',
  })
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const openModal = (type: 'add' | 'subtract', currency?: string) => {
    setModal({ open: true, type, currency: currency ?? wallets[0]?.currency ?? 'USDT' })
    setAmount('')
  }

  const closeModal = () => setModal((m) => ({ ...m, open: false }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    setSaving(true)
    try {
      if (modal.type === 'add') await onTopup(modal.currency, val)
      else await onDebit(modal.currency, val)
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const isBanned = user.account_status === 'banned'

  return (
    <>
      {/* Action cards */}
      <section className="nex-user-actions-row">
        <div className="nex-action-card nex-action-card-add-balance" onClick={() => openModal('add')}>
          <div className="action-card-label">Add Balance</div>
          <div className="action-card-value">+</div>
        </div>
        <div className="nex-action-card nex-action-card-subtract-balance" onClick={() => openModal('subtract')}>
          <div className="action-card-label">Subtract Balance</div>
          <div className="action-card-value">−</div>
        </div>
        <div
          className={`nex-action-card ${isBanned ? 'nex-action-card-add-balance' : 'nex-action-card-ban'}`}
          onClick={isBanned ? onUnban : onBan}
        >
          <div className="action-card-label">{isBanned ? 'Unban User' : 'Ban User'}</div>
          <div className="action-card-value">{isBanned ? '✅' : '⛔'}</div>
        </div>
      </section>

      {/* User info */}
      <section className="nex-card nex-user-details-card">
        <div className="nex-profile-section-title">
          <h2>Account Information</h2>
        </div>
        <div className="nex-user-details-grid">
          <div className="nex-form-grid">
            <label>Username</label>
            <input type="text" readOnly value={user.username} />
            <label>Email</label>
            <input type="email" readOnly value={user.email} />
            <label>Role</label>
            <input type="text" readOnly value={user.role ?? 'user'} />
          </div>
          <div className="nex-form-grid">
            <label>Phone</label>
            <input type="text" readOnly value={user.phone_number ?? '—'} />
            <label>Joined</label>
            <input type="text" readOnly value={new Date(user.created_at).toLocaleDateString()} />
            <label>Last Login</label>
            <input type="text" readOnly value={user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '—'} />
          </div>
        </div>
      </section>

      {/* Balance modal */}
      {modal.open && (
        <div className="nex-modal-overlay" onClick={closeModal}>
          <div className="nex-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>{modal.type === 'add' ? 'Add Balance' : 'Subtract Balance'}</h2>
              <button className="nex-modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="nex-modal-form">
              <div className="nex-form-group">
                <label>Currency</label>
                <select
                  value={modal.currency}
                  onChange={(e) => setModal((m) => ({ ...m, currency: e.target.value }))}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#fff', fontSize: 14 }}
                >
                  {wallets.length > 0
                    ? wallets.map((w) => <option key={w.currency} value={w.currency}>{w.currency}</option>)
                    : <option value="USDT">USDT</option>}
                </select>
              </div>
              <div className="nex-form-group">
                <label>Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  step="0.00000001"
                  min="0.00000001"
                />
              </div>
              <div className="nex-modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Processing…' : modal.type === 'add' ? 'Add' : 'Subtract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
