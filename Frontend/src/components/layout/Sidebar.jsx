
import { FaFire, FaChartBar, FaChartLine, FaUser, FaWallet, FaHistory, FaHeadset, FaSignOutAlt, FaBolt, FaChevronLeft, FaChevronRight, FaArrowCircleDown } from 'react-icons/fa'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store'

function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const iconStyle = { color: '#F7931A' }

  const handleLogout = () => {
    // Navigate first to avoid route guard redirect
    navigate('/')
    // Then update auth state and clear storage
    logout()
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-title">{!collapsed && 'BROWSE'}</div>
          <Link to="/dashboard" className="nav-item">
            <FaFire style={iconStyle} className="nav-icon" />
            {!collapsed && 'Home'}
          </Link>
          <Link to="/markets" className="nav-item">
            <FaChartBar style={iconStyle} className="nav-icon" />
            {!collapsed && 'Markets'}
          </Link>
          <Link to="/market-dashboard" className="nav-item">
            <FaBolt style={iconStyle} className="nav-icon" />
            {!collapsed && 'Live Chart'}
          </Link>
          <Link to="/trade" className="nav-item">
            <FaChartLine style={iconStyle} className="nav-icon" />
            {!collapsed && 'Trade'}
          </Link>
          <Link to="/news" className="nav-item">
            <FaUser style={iconStyle} className="nav-icon" />
            {!collapsed && 'News'}
          </Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">{!collapsed && 'MY WALLET'}</div>
          <Link to="/assets" className="nav-item">
            <FaWallet style={iconStyle} className="nav-icon" />
            {!collapsed && 'Assets'}
          </Link>
          <Link to="/history" className="nav-item">
            <FaHistory style={iconStyle} className="nav-icon" />
            {!collapsed && 'History'}
          </Link>
          <Link to="/wallet/withdraw" className="nav-item">
            <FaArrowCircleDown style={iconStyle} className="nav-icon" />
            {!collapsed && 'Withdraw'}
          </Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">{!collapsed && 'HELP & SUPPORT'}</div>
          <Link to="/support" className="nav-item">
            <FaHeadset style={iconStyle} className="nav-icon" />
            {!collapsed && 'Contact Support'}
          </Link>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '20px 0' }} />
        <div className="nav-section">
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', textAlign: collapsed ? 'center' : 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FaSignOutAlt style={{ color: '#ef4444' }} className="nav-icon" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
