import React from 'react'
import { useAuthStore } from '../store/useAuthStore'

function Hero() {
  const user = useAuthStore((state) => state.user)
  
  // Get display name - first name or username or "User"
  const getDisplayName = () => {
    if (!user) return 'User'
    if (user.first_name) return user.first_name
    if (user.username) return user.username
    if (user.email) return user.email.split('@')[0]
    return 'User'
  }

  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-content">
        {user ? (
          <>
            <h1 className="dashboard-hero-title dashboard-hero-title-personalized">
              Welcome back, {getDisplayName()} 👋
            </h1>
            <h2 className="dashboard-hero-title" style={{ fontSize: '22px', marginTop: '4px', marginBottom: '4px' }}>
              The crypto platform for <span className="highlight">every trader</span>
            </h2>
            <p className="dashboard-hero-subtitle">
              CryptoExchange is a trader-first platform that helps you buy, sell, and trade digital assets with ease.
            </p>
          </>
        ) : (
          <>
            <h1 className="dashboard-hero-title">
              The crypto platform for <span className="highlight">every trader</span>
            </h1>
            <p className="dashboard-hero-subtitle">
              CryptoExchange is a trader-first platform that helps you buy, sell, and trade digital assets with ease.
            </p>
          </>
        )}
      </div>
      <div className="dashboard-hero-image">
        <img
          src="https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&h=600&fit=crop&q=80"
          alt="Crypto Trading"
        />
      </div>
    </section>
  )
}

export default Hero