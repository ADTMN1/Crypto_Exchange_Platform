import { FaBell, FaCog, FaUserCircle } from 'react-icons/fa'
import Logo from '../assets/logo.svg'

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <img src={Logo} alt="CryptoExchange Logo" className="logo-icon" />
          <span className="logo-text">CryptoExchange</span>
        </div>
      </div>
      <div className="header-center">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search for coins, tokens, or pairs" />
        </div>
      </div>
      <div className="header-right">
        <button className="icon-btn" title="Notifications">
          <FaBell size={20} />
          <span className="notification-badge">3</span>
        </button>
        <button className="icon-btn" title="Settings">
          <FaCog size={20} />
        </button>
        <button className="icon-btn" title="Profile">
          <FaUserCircle size={24} />
        </button>
        <button className="btn-upload">
          <span>🔗</span>
          Connect Wallet
        </button>
      </div>
    </header>
  )
}

export default Header
