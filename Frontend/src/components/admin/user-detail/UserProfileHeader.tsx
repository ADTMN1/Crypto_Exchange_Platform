import { AdminUser } from '../../../services/admin.service'

interface Props {
  user: AdminUser
  impersonating: boolean
  onImpersonate: () => void
}

const STATUS_CLASS: Record<string, string> = {
  active: 'nex-badge-success',
  banned: 'nex-badge-danger',
  suspended: 'nex-badge-orange',
  pending: 'nex-badge-warning',
}

export default function UserProfileHeader({ user, impersonating, onImpersonate }: Props) {
  const initials = user.username.slice(0, 2).toUpperCase()
  const joined = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <section
      className="nex-section-header"
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="nex-avatar" style={{ width: 56, height: 56, fontSize: 20, borderRadius: 12, flexShrink: 0 }}>
          {user.profile_picture_url
            ? <img src={user.profile_picture_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }} />
            : initials}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>@{user.username}</h1>
            <span className={`nex-badge ${STATUS_CLASS[user.account_status] ?? 'nex-badge-warning'}`}>
              {user.account_status}
            </span>
            <span className="nex-badge nex-badge-purple">{user.role ?? 'user'}</span>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {user.email} &nbsp;·&nbsp; Joined {joined}
            {user.last_login_at && <> &nbsp;·&nbsp; Last login {new Date(user.last_login_at).toLocaleDateString()}</>}
          </p>
        </div>
      </div>

      <button
        onClick={onImpersonate}
        disabled={impersonating || user.account_status === 'banned'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 22px', borderRadius: 10, border: 'none',
          background: user.account_status === 'banned'
            ? 'rgba(255,255,255,0.06)'
            : 'linear-gradient(135deg,#6fffe4,#2df49d)',
          color: user.account_status === 'banned' ? 'var(--text-muted)' : '#04251b',
          fontWeight: 700, fontSize: 14,
          cursor: impersonating || user.account_status === 'banned' ? 'not-allowed' : 'pointer',
          opacity: impersonating ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        🔑 {impersonating ? 'Switching…' : 'Login as User'}
      </button>
    </section>
  )
}
