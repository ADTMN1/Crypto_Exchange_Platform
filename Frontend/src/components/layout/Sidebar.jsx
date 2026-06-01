import React from 'react'
import { FaFire, FaChartBar, FaChartLine, FaUser, FaWallet, FaHistory, FaBookOpen, FaSignOutAlt } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

function Sidebar() {
  const navigate = useNavigate()
  const iconStyle = { color: '#F7931A' }

  const handleLogout = () => {
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
          <a href="#" className="nav-item active">
            <FaFire style={iconStyle} className="nav-icon" />
            Discover
          </a>
          <a href="#" className="nav-item">
            <FaChartBar style={iconStyle} className="nav-icon" />
            Markets
          </a>
          <a href="#" className="nav-item">
            <FaChartLine style={iconStyle} className="nav-icon" />
            Trade
          </a>
          <a href="#" className="nav-item">
            <FaUser style={iconStyle} className="nav-icon" />
            News
          </a>
        </div>
        <div className="nav-section">
          <div className="nav-title">MY WALLET</div>
          <a href="#" className="nav-item">
            <FaWallet style={iconStyle} className="nav-icon" />
            Assets
          </a>
          <a href="#" className="nav-item">
            <FaHistory style={iconStyle} className="nav-icon" />
            History
          </a>
        </div>
        <div className="nav-section">
          <div className="nav-title">RESOURCES</div>
          <a href="#" className="nav-item">
            <FaBookOpen style={iconStyle} className="nav-icon" />
            Learn
          </a>
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
