import React from 'react'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          The crypto platform for <span className="highlight">every trader</span>
        </h1>
        <p className="hero-subtitle">
          CryptoExchange is a trader-first platform that helps you buy, sell, and trade digital assets with ease.
        </p>
        <button className="hero-btn">Start trading for free</button>
      </div>
      <div className="hero-image">
        <img
          src="https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&h=600&fit=crop&q=80"
          alt="Crypto Trading"
        />
      </div>
    </section>
  )
}

export default Hero
