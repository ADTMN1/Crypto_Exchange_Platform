import { useNavigate } from 'react-router-dom'
import { AdminUser } from '../../../services/admin.service'

interface Props {
  user: AdminUser
  impersonating: boolean
  onImpersonate: () => void
}

const STATUS_CLASS: Record<string, string> = {
  active:    'nex-badge nex-badge-success',
  banned:    'nex-badge nex-badge-danger',
  suspended: 'nex-badge nex-badge-orange',
  pending:   'nex-badge nex-badge-warning',
}

export default function UserProfileHeader({ user, impersonating, onImpersonate }: Props) {
  const navigate = useNavigate()
  const initials = user.username.slice(0, 2).toUpperCase()
  const joined = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const isBanned = user.account_status === 'banned'

  return (
    <section className="udp-header">
      {/* Left: back button + avatar + info */}
      <div className="udp-header-identity">
        {/* Back button */}
        <button className="udp-back-icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="udp-avatar">
          {user.profile_picture_url
            ? <img src={user.profile_picture_url} alt={user.username} className="udp-avatar-img" />
            : initials}
        </div>

        <div className="udp-header-info">
          <div className="udp-header-name-row">
            <h1 className="udp-username">@{user.username}</h1>
            <span className={STATUS_CLASS[user.account_status] ?? 'nex-badge nex-badge-warning'}>
              {user.account_status}
            </span>
            <span className="nex-badge nex-badge-purple">{user.role ?? 'user'}</span>
          </div>
          <p className="udp-header-meta">
            {user.email}
            <span className="udp-meta-sep">·</span>
            Joined {joined}
            {user.last_login_at && (
              <>
                <span className="udp-meta-sep">·</span>
                Last login {new Date(user.last_login_at).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right: impersonate button */}
      <button
        onClick={onImpersonate}
        disabled={impersonating || isBanned}
        className={`udp-impersonate-btn${isBanned ? ' udp-impersonate-btn--disabled' : ''}`}
      >
        🔑 {impersonating ? 'Switching…' : 'Login as User'}
      </button>
    </section>
  )
}
