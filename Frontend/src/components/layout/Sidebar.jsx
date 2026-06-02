import { FaFire, FaChartBar, FaChartLine, FaUser, FaWallet, FaHistory, FaBookOpen, FaSignOutAlt } from 'react-icons/fa'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store'

function Sidebar() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const iconStyle = { color: '#F7931A' }

  const handleLogout = () => {
    // Clear authentication state
    logout()
    // Clear authentication tokens/data
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    // Clear any cookies if needed
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    // Redirect to login page
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-title">BROWSE</div>
          <Link to="/" className="nav-item">
            <FaFire style={iconStyle} className="nav-icon" />
            Discover
          </Link>
          <Link to="/markets" className="nav-item">
            <FaChartBar style={iconStyle} className="nav-icon" />
            Markets
          </Link>
          <Link to="/trade" className="nav-item">
            <FaChartLine style={iconStyle} className="nav-icon" />
            Trade
          </Link>
          <Link to="/news" className="nav-item">
            <FaUser style={iconStyle} className="nav-icon" />
            News
          </Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">MY WALLET</div>
          <Link to="/assets" className="nav-item">
            <FaWallet style={iconStyle} className="nav-icon" />
            Assets
          </Link>
          <Link to="/history" className="nav-item">
            <FaHistory style={iconStyle} className="nav-icon" />
            History
          </Link>
        </div>
        <div className="nav-section">
          <div className="nav-title">RESOURCES</div>
          <Link to="/learn" className="nav-item">
            <FaBookOpen style={iconStyle} className="nav-icon" />
            Learn
          </Link>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '20px 0' }} />
        <div className="nav-section">
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FaSignOutAlt style={{ color: '#ef4444' }} className="nav-icon" />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
