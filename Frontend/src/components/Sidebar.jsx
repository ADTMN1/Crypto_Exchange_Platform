import React from 'react'
import { FaFire, FaChartBar, FaChartLine, FaUser, FaWallet, FaHistory, FaBookOpen } from 'react-icons/fa'

function Sidebar() {
  const iconStyle = { color: '#F7931A' }

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
            Portfolio
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
      </nav>
    </aside>
  )
}

export default Sidebar
