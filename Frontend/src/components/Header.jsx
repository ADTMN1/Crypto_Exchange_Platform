import { FaBell, FaCog, FaUserCircle, FaSearch } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import Logo from '../assets/logo.svg'

function Header() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [imageError, setImageError] = useState(false)

  // Helper function to check if image URL is valid
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false
    // Check if it's a valid URL format (http/https)
    return url.startsWith('http://') || url.startsWith('https://')
  }

  const hasValidProfileImage = user?.profile_image && 
                                isValidImageUrl(user.profile_image) && 
                                !imageError

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
          <FaSearch className="search-icon" style={{ color: '#F7931A' }} />
          <input type="text" placeholder="Search for coins, tokens, or pairs" />
        </div>
      </div>
      <div className="header-right">
        <button 
          className="icon-btn" 
          title="Notifications"
          onClick={() => navigate('/notifications')}
        >
          <FaBell size={20} />
          <span className="notification-badge">3</span>
        </button>
        <button 
          className="icon-btn" 
          title="Settings"
          onClick={() => navigate('/profile/security')}
        >
          <FaCog size={20} />
        </button>
        <button 
          className="icon-btn" 
          title="Profile"
          onClick={() => navigate('/profile')}
        >
          {hasValidProfileImage ? (
            <img 
              src={user.profile_image} 
              alt="Profile" 
              onError={() => setImageError(true)}
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                objectFit: 'cover' 
              }} 
            />
          ) : (
            <FaUserCircle size={24} />
          )}
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
