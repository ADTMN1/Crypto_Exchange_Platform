
import { FaArrowUp, FaFire, FaChartBar, FaChartLine, FaUser, FaWallet, FaHistory, FaHeadset, FaSignOutAlt, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store'

function Sidebar({ collapsed, onToggle, isMobileOpen, onMobileClose }) {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const iconStyle = { color: '#F7931A' }

  const handleLogout = () => {
    logout()
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    setTimeout(() => navigate('/', { replace: true }), 0)
  }

  const handleLinkClick = () => {
    if (isMobileOpen && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
      {/* Header: collapse toggle (desktop) + close button (mobile) */}
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
        <button
          className="mobile-sidebar-close"
          onClick={onMobileClose}
        >
          <FaTimes />
        </button>
      </div>

      {/* Scrollable nav — logout lives inside so it's always reachable */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-title">{!collapsed && 'BROWSE'}</div>
          <Link to="/dashboard" className="nav-item" onClick={handleLinkClick}>
            <FaFire style={iconStyle} className="nav-icon" />
            {!collapsed && 'Home'}
          </Link>
          <Link to="/markets" className="nav-item" onClick={handleLinkClick}>
            <FaChartBar style={iconStyle} className="nav-icon" />
            {!collapsed && 'Markets'}
          </Link>
          <Link to="/trade" className="nav-item" onClick={handleLinkClick}>
            <FaChartLine style={iconStyle} className="nav-icon" />
            {!collapsed && 'Trade'}
          </Link>
          <Link to="/news" className="nav-item" onClick={handleLinkClick}>
            <FaUser style={iconStyle} className="nav-icon" />
            {!collapsed && 'News'}
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-title">{!collapsed && 'MY WALLET'}</div>
          <Link to="/assets" className="nav-item" onClick={handleLinkClick}>
            <FaWallet style={iconStyle} className="nav-icon" />
            {!collapsed && 'Assets'}
          </Link>
          <Link to="/wallet/withdraw" className="nav-item" onClick={handleLinkClick}>
            <FaArrowUp style={iconStyle} className="nav-icon" />
            {!collapsed && 'Withdraw'}
          </Link>
          <Link to="/history" className="nav-item" onClick={handleLinkClick}>
            <FaHistory style={iconStyle} className="nav-icon" />
            {!collapsed && 'History'}
          </Link>
        </div>

        <div className="nav-section">
          <div className="nav-title">{!collapsed && 'HELP & SUPPORT'}</div>
          <Link to="/support" className="nav-item" onClick={handleLinkClick}>
            <FaHeadset style={iconStyle} className="nav-icon" />
            {!collapsed && 'Contact Support'}
          </Link>
        </div>

        {/* Logout — inside scroll area, always reachable on any screen size */}
        <div className="nav-section sidebar-logout-section">
          <hr className="sidebar-logout-divider" />
          <button
            onClick={() => { handleLogout(); handleLinkClick(); }}
            className="nav-item sidebar-logout-btn"
          >
            <FaSignOutAlt style={{ color: '#ef4444' }} className="nav-icon" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
