import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api, { API_ENDPOINTS } from '../../services/api.service'
import adminService, {
  AdminUser,
  AdminUserTransaction,
  AdminUserWallet,
} from '../../services/admin.service'
import { useAuthStore } from '../../store'
import UserProfileHeader from '../../components/admin/user-detail/UserProfileHeader'
import UserStatsBar from '../../components/admin/user-detail/UserStatsBar'
import UserTransactionsTable from '../../components/admin/user-detail/UserTransactionsTable'

const CURRENCY_COLORS: Record<string, string> = {
  USDT: 'linear-gradient(135deg,rgba(18,188,126,.96),rgba(12,168,104,.96))',
  BTC:  'linear-gradient(135deg,rgba(242,144,6,.96),rgba(215,94,12,.96))',
  ETH:  'linear-gradient(135deg,rgba(98,126,234,.96),rgba(70,100,200,.96))',
  BNB:  'linear-gradient(135deg,rgba(240,185,11,.96),rgba(200,150,5,.96))',
}

function fmtNum(n: string | number) {
  return parseFloat(String(n)).toLocaleString('en-US', { maximumFractionDigits: 8 })
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [user, setUser]               = useState<AdminUser | null>(null)
  const [wallets, setWallets]         = useState<AdminUserWallet[]>([])
  const [transactions, setTx]         = useState<AdminUserTransaction[]>([])
  const [txTotal, setTxTotal]         = useState(0)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingTx, setLoadingTx]     = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [impersonating, setImpersonating] = useState(false)

  const [modal, setModal] = useState<{ open: boolean; type: 'add' | 'subtract'; currency: string }>({
    open: false, type: 'add', currency: 'USDT',
  })
  const [modalAmount, setModalAmount] = useState('')
  const [saving, setSaving]           = useState(false)

  const [emailModal, setEmailModal]   = useState(false)
  const [newEmail, setNewEmail]       = useState('')
  const [pwModal, setPwModal]         = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPw, setShowNewPw]     = useState(false)
  const [credSaving, setCredSaving]   = useState(false)

  // ── fetch user + wallets ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setLoadingUser(true)
    setError(null)
    Promise.all([adminService.getUserById(id), adminService.getUserWallets(id)])
      .then(([uRes, wRes]) => { setUser(uRes.data); setWallets(wRes.data) })
      .catch((err) => {
        const msg = err?.response?.data?.message ?? 'Failed to load user'
        setError(msg); toast.error(msg)
      })
      .finally(() => setLoadingUser(false))
  }, [id])

  // ── fetch transactions ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setLoadingTx(true)
    adminService.getUserTransactions(id)
      .then((res) => { setTx(res.data.transactions); setTxTotal(res.data.total) })
      .catch(() => {})
      .finally(() => setLoadingTx(false))
  }, [id])

  const refreshWallets = () =>
    adminService.getUserWallets(id!).then((r) => setWallets(r.data))

  const openAdd      = (currency: string) => { setModal({ open: true, type: 'add',      currency }); setModalAmount('') }
  const openSubtract = (currency: string) => { setModal({ open: true, type: 'subtract', currency }); setModalAmount('') }
  const closeModal   = () => setModal((m) => ({ ...m, open: false }))

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(modalAmount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      const endpoint = modal.type === 'add'
        ? API_ENDPOINTS.WALLET.ADMIN_TOPUP
        : API_ENDPOINTS.WALLET.ADMIN_DEBIT
      await api.post(endpoint, { userId: id, currency: modal.currency, amount })
      toast.success(`${modal.type === 'add' ? 'Added' : 'Subtracted'} ${amount} ${modal.currency}`)
      closeModal()
      await refreshWallets()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Balance update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleImpersonate = async () => {
    if (!id) return
    setImpersonating(true)
    try {
      const adminToken   = localStorage.getItem('token') ?? ''
      const adminRefresh = localStorage.getItem('refreshToken') ?? ''
      const adminUser    = useAuthStore.getState().user

      const res = await adminService.impersonateUser(id)
      const { accessToken, refreshToken, user: targetUser } = res.data

      localStorage.setItem('adminToken', adminToken)
      localStorage.setItem('adminRefreshToken', adminRefresh)
      localStorage.setItem('adminUser', JSON.stringify(adminUser))
      localStorage.setItem('token', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      login(targetUser as any, accessToken, refreshToken)

      toast.success(`Viewing as @${targetUser.username}`)
      navigate(`/admin/users/${id}/view`, { state: { username: targetUser.username, userId: id } })
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Impersonation failed')
    } finally {
      setImpersonating(false)
    }
  }

  const handleBan = async () => {
    if (!user || !id) return
    if (!window.confirm(`Ban ${user.username}?`)) return
    try {
      await adminService.banUser(id)
      setUser((u) => u ? { ...u, account_status: 'banned', is_active: false } : u)
      toast.success('User banned')
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed') }
  }

  const handleUnban = async () => {
    if (!id) return
    try {
      await adminService.unbanUser(id)
      setUser((u) => u ? { ...u, account_status: 'active', is_active: true } : u)
      toast.success('User unbanned')
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed') }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newEmail.trim()) return
    setCredSaving(true)
    try {
      await adminService.updateUserEmail(id, newEmail.trim())
      setUser((u) => u ? { ...u, email: newEmail.trim() } : u)
      toast.success('Email updated successfully')
      setEmailModal(false); setNewEmail('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update email')
    } finally { setCredSaving(false) }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newPassword) return
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setCredSaving(true)
    try {
      await adminService.updateUserPassword(id, newPassword)
      toast.success('Password updated successfully')
      setPwModal(false); setNewPassword('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update password')
    } finally { setCredSaving(false) }
  }

  // ── guards ────────────────────────────────────────────────────────────────
  if (loadingUser) {
    return (
      <main className="nex-admin-section-page">
        <div className="nex-loading"><div className="nex-spinner" /><p>Loading user…</p></div>
      </main>
    )
  }
  if (error || !user) {
    return (
      <main className="nex-admin-section-page">
        <div className="udp-error-state">
          <p>{error ?? 'User not found.'}</p>
          <button onClick={() => navigate(-1)} className="udp-back-btn">← Go back</button>
        </div>
      </main>
    )
  }

  const isBanned = user.account_status === 'banned'

  return (
    <main className="nex-admin-section-page">

      {/* 1. Header */}
      <UserProfileHeader user={user} impersonating={impersonating} onImpersonate={handleImpersonate} />

      {/* 2. Quick-access link */}
      <section className="udp-view-bar">
        <button className="udp-view-btn" onClick={() => navigate(`/admin/users/${id}/view`)}>
          <span>👁</span> View User Dashboard
        </button>
      </section>

      {/* 3. Stats + verification */}
      <UserStatsBar user={user} txTotal={txTotal} walletCount={wallets.length} />

      {/* 4. Wallets */}
      <section className="nex-card">
        <div className="nex-card-title">
          <h2>Spot Wallets</h2>
          <span className="udp-subtitle">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</span>
        </div>
        {wallets.length === 0 ? (
          <div className="nex-empty-state"><p>No wallets found</p></div>
        ) : (
          <div className="udp-wallets-grid">
            {wallets.map((w) => (
              <div key={w.id} className="nex-wallet-card udp-wallet-card">
                <div
                  className="wallet-icon"
                  style={{ background: CURRENCY_COLORS[w.currency] ?? 'linear-gradient(135deg,rgba(34,139,123,.96),rgba(38,211,171,.92))' }}
                >
                  {w.currency.slice(0, 4)}
                </div>
                <div className="wallet-details">
                  <strong>{fmtNum(w.balance)} {w.currency}</strong>
                  <span>Locked: {fmtNum(w.locked_balance)}</span>
                </div>
                <div className="wallet-tag">SPOT</div>
                <div className="udp-wallet-btns">
                  <button className="udp-wallet-btn udp-wallet-btn--add" onClick={() => openAdd(w.currency)}>
                    + Add
                  </button>
                  <button className="udp-wallet-btn udp-wallet-btn--sub" onClick={() => openSubtract(w.currency)}>
                    − Subtract
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Quick actions */}
      <section className="nex-user-actions-row">
        <div className="nex-action-card nex-action-card-add-balance"
          onClick={() => openAdd(wallets[0]?.currency ?? 'USDT')}>
          <div className="action-card-label">Add Balance</div>
          <div className="action-card-value">+</div>
        </div>
        <div className="nex-action-card nex-action-card-subtract-balance"
          onClick={() => openSubtract(wallets[0]?.currency ?? 'USDT')}>
          <div className="action-card-label">Subtract Balance</div>
          <div className="action-card-value">−</div>
        </div>
        <div className={`nex-action-card ${isBanned ? 'nex-action-card-add-balance' : 'nex-action-card-ban'}`}
          onClick={isBanned ? handleUnban : handleBan}>
          <div className="action-card-label">{isBanned ? 'Unban User' : 'Ban User'}</div>
          <div className="action-card-value">{isBanned ? '✅' : '⛔'}</div>
        </div>
      </section>

      {/* 6. Account info */}
      <section className="nex-card nex-user-details-card">
        <div className="nex-card-title udp-account-title">
          <h2>Account Information</h2>
          <div className="udp-cred-actions">
            <button className="udp-cred-btn udp-cred-btn--email"
              onClick={() => { setNewEmail(user.email); setEmailModal(true) }}>
              ✏️ Update Email
            </button>
            <button className="udp-cred-btn udp-cred-btn--pw"
              onClick={() => { setNewPassword(''); setPwModal(true) }}>
              🔑 Reset Password
            </button>
          </div>
        </div>
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
            <input readOnly value={new Date(user.created_at).toLocaleDateString()} />
            <label>Last Login</label>
            <input readOnly value={user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '—'} />
          </div>
        </div>
      </section>

      {/* 7. Transactions */}
      <UserTransactionsTable transactions={transactions} total={txTotal} loading={loadingTx} />

      {/* ── Balance modal ── */}
      {modal.open && (
        <div className="nex-modal-overlay" onClick={closeModal}>
          <div className="nex-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>{modal.type === 'add' ? 'Add Balance' : 'Subtract Balance'}</h2>
              <button className="nex-modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleBalanceSubmit} className="nex-modal-form">
              <div className="nex-form-group">
                <label>Currency</label>
                <select
                  value={modal.currency}
                  onChange={(e) => setModal((m) => ({ ...m, currency: e.target.value }))}
                  className="udp-modal-select"
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
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
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

      {/* ── Update Email modal ── */}
      {emailModal && (
        <div className="nex-modal-overlay" onClick={() => setEmailModal(false)}>
          <div className="nex-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>Update Email</h2>
              <button className="nex-modal-close" onClick={() => setEmailModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateEmail} className="nex-modal-form">
              <div className="nex-form-group">
                <label>New Email Address</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="nex-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEmailModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={credSaving}>
                  {credSaving ? 'Saving…' : 'Update Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password modal ── */}
      {pwModal && (
        <div className="nex-modal-overlay" onClick={() => setPwModal(false)}>
          <div className="nex-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nex-modal-header">
              <h2>Reset Password</h2>
              <button className="nex-modal-close" onClick={() => setPwModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdatePassword} className="nex-modal-form">
              <div className="nex-form-group">
                <label>New Password</label>
                <div className="udp-pw-wrap">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" className="udp-pw-toggle" onClick={() => setShowNewPw(v => !v)}>
                    {showNewPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div className="nex-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setPwModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={credSaving}>
                  {credSaving ? 'Saving…' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  )
}
