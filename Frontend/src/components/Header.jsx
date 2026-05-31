import React from 'react'
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
        <button className="btn-outline">Sign Up</button>
        <button className="btn-primary">Sign In</button>
        <button className="btn-upload">
          <span>🔗</span>
          Connect Wallet
        </button>
      </div>
    </header>
  )
}

export default Header
