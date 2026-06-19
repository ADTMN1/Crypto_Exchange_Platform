import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Zap, Shield, Smartphone, Gem, BarChart3, Headphones } from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    document.querySelectorAll(".fade-section").forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* Background Elements */}
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      <div className="bg-waves"></div>
      <div className="bg-glow-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      <div className="bg-geometric-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Floating Background Coins */}
      {['₿', 'Ξ', '◎', 'Đ', 'Ł', '₳', '◎', '₿', 'Ξ'].map((coin, i) => (
        <div 
          key={i} 
          className={`floating-bg-coin coin-${i}`}
        >
          {coin}
        </div>
      ))}
      
      {/* Subtle Particle System */}
      <div className="particles-container">
        {Array.from({ length: 60 }).map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 25}s`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`
            }}
          ></div>
        ))}
      </div>
      
      {/* Top Ticker */}
      <div className="ticker">
        <div className="ticker-content">
          {[...Array(2)].flatMap((_, set) => 
            ['₿ BTC 68,420.50 +2.45%', 'Ξ ETH 3,850.20 +1.82%', '◎ SOL 152.30 +4.10%', '✕ XRP 0.5210 -0.85%', '₳ ADA 0.4520 +1.20%', 'Ð DOGE 0.1250 +3.50%', '◎ DOT 7.85 +2.10%', '✧ AVAX 42.30 +3.80%'].map((item, i) => (
              <span key={`${set}-${i}`} className="ticker-item">
                {item}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">
            <div className="logo-icon">CR</div>
            <span className="logo-text">CryptoRise</span>
          </div>
          <div className="nav-links">
            <a href="#markets">Markets</a>
            <a href="#trade">Trade</a>
            <a href="#features">Features</a>
            <a href="#support">Support</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-link-btn">Sign In</Link>
            <Link to="/register" className="nav-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero fade-section visible">
        <div className="hero-grid">
          <div className="hero-left">
            <h1 className="hero-title">
              Trade Crypto.
              <br />
              <span className="title-gradient">Master The Future.</span>
            </h1>
            <p className="hero-desc">
              The most advanced trading platform for both beginners and professional traders.
              Low fees, high liquidity, and lightning-fast execution.
            </p>
            <div className="hero-stats">
              <div className="stat-card">
                <span className="stat-value">$120B+</span>
                <span className="stat-label">24h Volume</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">15M+</span>
                <span className="stat-label">Active Traders</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">&lt;1ms</span>
                <span className="stat-label">Execution</span>
              </div>
            </div>
            <div className="hero-ctas">
              <Link to="/register" className="cta-primary">Start Trading Now</Link>
              <button className="cta-secondary">Watch Demo</button>
            </div>
          </div>
          
          <div className="hero-right">
            <div className="phone-mockup">
              <div className="phone-3d-container">
                <div className="phone-rotator">
                  {/* Phone Body */}
                  <div className="phone-wrapper">
                    {/* Front Side */}
                    <div className="phone-side phone-front">
                      <div className="phone-frame-metal">
                        <div className="phone-screen-container">
                          {/* Bezel */}
                          <div className="phone-bezel">
                            {/* Status Bar */}
                            <div className="phone-status-bar">
                              <span className="status-time">9:41</span>
                              <div className="status-right">
                                <span className="status-signal">📶</span>
                                <span className="status-wifi">📶</span>
                                <span className="status-battery">🔋</span>
                              </div>
                            </div>
                            {/* Dynamic Island */}
                            <div className="dynamic-island">
                              <div className="island-camera"></div>
                              <div className="island-sensor"></div>
                            </div>
                            {/* Screen Content */}
                            <div className="screen-content">
                              <div className="app-header">
                                <div className="app-logo">CR</div>
                                <span className="app-title">CryptoRise</span>
                              </div>
                              
                              <div className="price-section">
                                <div className="price-pair">BTC/USDT</div>
                                <div className="price-value">$68,420.50</div>
                                <div className="price-change up">+2.45% (+$1,630.20)</div>
                              </div>

                              {/* Mini Chart */}
                              <div className="mini-chart">
                                <svg viewBox="0 0 300 120" className="chart-svg">
                                  <defs>
                                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                      <stop offset="0%" stopColor="rgba(247,147,26,0.3)" />
                                      <stop offset="100%" stopColor="rgba(247,147,26,0)" />
                                    </linearGradient>
                                  </defs>
                                  <path d="M0,80 Q50,40 100,60 T200,30 T300,45 L300,120 L0,120 Z" fill="url(#chartGradient)" />
                                  <path d="M0,80 Q50,40 100,60 T200,30 T300,45" fill="none" stroke="#f7931a" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                              </div>

                              {/* Market Stats */}
                              <div className="market-stats">
                                <div className="stat-item">
                                  <span className="stat-label">24h High</span>
                                  <span className="stat-value">$69,230.00</span>
                                </div>
                                <div className="stat-item">
                                  <span className="stat-label">24h Low</span>
                                  <span className="stat-value">$66,850.00</span>
                                </div>
                                <div className="stat-item">
                                  <span className="stat-label">24h Vol</span>
                                  <span className="stat-value">$2.4B</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="action-buttons">
                                <button className="action-btn sell">
                                  <span className="btn-label">Sell</span>
                                </button>
                                <button className="action-btn buy">
                                  <span className="btn-label">Buy</span>
                                </button>
                              </div>
                            </div>
                            {/* Home Indicator */}
                            <div className="home-indicator"></div>
                          </div>
                        </div>
                      </div>
                      {/* Buttons */}
                      <div className="phone-buttons phone-buttons-left">
                        <div className="phone-button mute"></div>
                        <div className="phone-button volume-up"></div>
                        <div className="phone-button volume-down"></div>
                      </div>
                      <div className="phone-buttons phone-buttons-right">
                        <div className="phone-button power"></div>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div className="phone-side phone-back">
                      <div className="phone-back-glass">
                        <div className="camera-module">
                          <div className="camera-lens camera-main"></div>
                          <div className="camera-lens camera-ultra"></div>
                          <div className="camera-flash"></div>
                          <div className="camera-sensor"></div>
                        </div>
                        <div className="phone-logo">CR</div>
                      </div>
                    </div>

                    {/* Left Side */}
                    <div className="phone-side phone-left"></div>
                    {/* Right Side */}
                    <div className="phone-side phone-right"></div>
                    {/* Top Side */}
                    <div className="phone-side phone-top"></div>
                    {/* Bottom Side */}
                    <div className="phone-side phone-bottom"></div>
                  </div>
                </div>

                {/* Floating Elements Around Phone */}
                <div className="phone-float-elements">
                  <div className="float-card float-1">
                    <div className="float-coin-info">
                      <span className="float-icon">₿</span>
                      <div className="float-coin-text">
                        <span className="float-coin-name">Bitcoin</span>
                        <span className="float-coin-price">$68,420</span>
                      </div>
                    </div>
                    <span className="float-text up">+5.2%</span>
                  </div>
                  <div className="float-card float-2">
                    <div className="float-coin-info">
                      <span className="float-icon">Ξ</span>
                      <div className="float-coin-text">
                        <span className="float-coin-name">Ethereum</span>
                        <span className="float-coin-price">$3,850</span>
                      </div>
                    </div>
                    <span className="float-text up">+3.1%</span>
                  </div>
                  <div className="float-card float-3">
                    <div className="float-coin-info">
                      <span className="float-icon">◎</span>
                      <div className="float-coin-text">
                        <span className="float-coin-name">Solana</span>
                        <span className="float-coin-price">$152</span>
                      </div>
                    </div>
                    <span className="float-text up">+7.8%</span>
                  </div>
                  <div className="float-card float-4">
                    <div className="float-coin-info">
                      <span className="float-icon">✕</span>
                      <div className="float-coin-text">
                        <span className="float-coin-name">Ripple</span>
                        <span className="float-coin-price">$0.52</span>
                      </div>
                    </div>
                    <span className="float-text down">-0.85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Coins Section */}
      <section id="trending" className="trending fade-section">
        <div className="container">
          <h2 className="section-title">Trending Coins</h2>
          <p className="section-desc">The hottest crypto right now</p>
          
          <div className="trending-carousel">
            <div className="trending-track">
              {[...Array(2)].flatMap(() => [
                { name: 'Bitcoin', symbol: 'BTC', icon: '₿', price: '68,420.50', change: '+2.45%', up: true },
                { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', price: '3,850.20', change: '+1.82%', up: true },
                { name: 'Solana', symbol: 'SOL', icon: '◎', price: '152.30', change: '+4.10%', up: true },
                { name: 'Ripple', symbol: 'XRP', icon: '✕', price: '0.5210', change: '-0.85%', up: false },
                { name: 'Cardano', symbol: 'ADA', icon: '₳', price: '0.4520', change: '+1.20%', up: true },
                { name: 'Dogecoin', symbol: 'DOGE', icon: 'Ð', price: '0.1250', change: '+3.50%', up: true },
              ]).map((coin, i) => (
                <div key={i} className="trending-coin">
                  <div className="coin-icon">{coin.icon}</div>
                  <div className="coin-info">
                    <h4 className="coin-name">{coin.name}</h4>
                    <p className="coin-symbol">{coin.symbol}</p>
                  </div>
                  <div className="coin-stats">
                    <div className="coin-price">${coin.price}</div>
                    <div className={`coin-change ${coin.up ? 'up' : 'down'}`}>{coin.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section id="markets" className="markets fade-section">
        <div className="container">
          <h2 className="section-title">Popular Markets</h2>
          <p className="section-desc">Trade the most popular crypto pairs</p>
          
          <div className="markets-table">
            <div className="table-header">
              <span className="cell-pair">Pair</span>
              <span className="cell-price">Price</span>
              <span className="cell-change">24h Change</span>
              <span className="cell-volume">24h Volume</span>
              <span className="cell-action">Trade</span>
            </div>
            
            {[
              { pair: 'BTC/USDT', price: '68,420.50', change: '+2.45%', up: true, volume: '$18.2B', icon: '₿' },
              { pair: 'ETH/USDT', price: '3,850.20', change: '+1.82%', up: true, volume: '$9.5B', icon: 'Ξ' },
              { pair: 'SOL/USDT', price: '152.30', change: '+4.10%', up: true, volume: '$5.3B', icon: '◎' },
              { pair: 'XRP/USDT', price: '0.5210', change: '-0.85%', up: false, volume: '$3.2B', icon: '✕' },
              { pair: 'ADA/USDT', price: '0.4520', change: '+1.20%', up: true, volume: '$2.1B', icon: '₳' },
            ].map((market, i) => (
              <div key={i} className="table-row">
                <span className="cell-pair">
                  <span className="pair-icon">{market.icon}</span>
                  {market.pair}
                </span>
                <span className="cell-price">${market.price}</span>
                <span className={`cell-change ${market.up ? 'up' : 'down'}`}>{market.change}</span>
                <span className="cell-volume">{market.volume}</span>
                <button className="cell-action-btn">Trade</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works fade-section">
        <div className="container">
          <h2 className="section-title">Start in 3 Simple Steps</h2>
          <p className="section-desc">Getting started has never been easier</p>
          
          <div className="steps-grid">
            {[
              { num: '01', title: 'Create Account', desc: 'Sign up in just 2 minutes' },
              { num: '02', title: 'Fund Wallet', desc: 'Deposit crypto or fiat' },
              { num: '03', title: 'Start Trading', desc: 'Buy & sell 200+ cryptos' },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{step.num}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features fade-section">
        <div className="container">
          <h2 className="section-title">Why Choose CryptoRise?</h2>
          
          <div className="features-grid">
            {[
              { icon: <Zap size={40} />, title: 'Lightning Fast', desc: 'Execute trades in milliseconds with our matching engine' },
              { icon: <Shield size={40} />, title: 'Bank-Grade Security', desc: 'Multi-signature wallets and cold storage protection' },
              { icon: <Smartphone size={40} />, title: 'Mobile Trading', desc: 'Trade on-the-go with our iOS and Android apps' },
              { icon: <Gem size={40} />, title: 'Low Fees', desc: 'Starting from 0.1% with volume discounts available' },
              { icon: <BarChart3 size={40} />, title: 'Advanced Charts', desc: 'Professional trading tools with 100+ indicators' },
              { icon: <Headphones size={40} />, title: '24/7 Support', desc: 'Get help anytime with our dedicated support team' },
            ].map((feat, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{feat.icon}</div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials fade-section">
        <div className="container">
          <h2 className="section-title">What Our Traders Say</h2>
          <p className="section-desc">Trusted by millions of users worldwide</p>
          
          <div className="testimonials-grid">
            {[
              { name: 'Sarah Chen', role: 'Day Trader', text: 'Best crypto exchange I have ever used! The speed is incredible.' },
              { name: 'Marcus Johnson', role: 'HODLer', text: 'Security is top notch. My funds have never been safer.' },
              { name: 'Elena Rodriguez', role: 'Crypto Investor', text: 'Low fees and amazing customer support. Highly recommend!' },
            ].map((testimonial, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.name.charAt(0)}</div>
                  <div className="author-info">
                    <h4 className="author-name">{testimonial.name}</h4>
                    <p className="author-role">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta fade-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Your Trading Journey?</h2>
          <p className="cta-desc">Join millions of traders and get started today</p>
          <Link to="/register" className="cta-btn">Create Free Account</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <div className="logo-icon small">CR</div>
                <span>CryptoRise</span>
              </div>
              <p className="footer-desc">The most trusted crypto exchange.</p>
            </div>
            <div className="footer-col">
              <h4>Products</h4>
              <a href="#">Spot Trading</a>
              <a href="#">Futures</a>
              <a href="#">Savings</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Fees</a>
              <a href="#">Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2024 CryptoRise. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          background: #0b0e11;
          color: #eaecef;
        }

        .landing {
          position: relative;
          min-height: 100vh;
        }

        /* Ensure all content is above background */
        .landing > *:not(.bg-gradient):not(.bg-grid):not(.bg-waves):not(.bg-glow-orbs):not(.bg-geometric-shapes):not(.floating-bg-coin):not(.particles-container) {
          position: relative;
          z-index: 10;
        }

        .bg-gradient {
          position: fixed;
          inset: 0;
          background: 
            radial-gradient(circle at 15% 0%, rgba(247,147,26,0.4), transparent 50%),
            radial-gradient(circle at 85% 100%, rgba(251,191,36,0.3), transparent 55%),
            radial-gradient(circle at 50% 30%, rgba(247,147,26,0.2), transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        /* Animated Grid Background */
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(247,147,26,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(247,147,26,0.12) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 40s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }

        /* Animated Background Waves */
        .bg-waves {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 400px;
          background: 
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(247,147,26,0.2), transparent 70%),
            radial-gradient(ellipse 60% 40% at 40% 100%, rgba(251,191,36,0.15), transparent 80%),
            radial-gradient(ellipse 70% 45% at 60% 100%, rgba(247,147,26,0.1), transparent 75%);
          animation: wavePulse 10s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes wavePulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }

        /* Glowing Orbs */
        .bg-glow-orbs {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.4;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          top: 5%;
          left: 5%;
          animation: orbFloat1 20s ease-in-out infinite;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #fbbf24, #f7931a);
          top: 45%;
          right: 10%;
          animation: orbFloat2 25s ease-in-out infinite;
        }

        .orb-3 {
          width: 450px;
          height: 450px;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          bottom: 15%;
          left: 25%;
          animation: orbFloat3 28s ease-in-out infinite;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, -50px) scale(1.2); }
          66% { transform: translate(-50px, 40px) scale(0.85); }
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-60px, 60px) scale(1.15); }
          66% { transform: translate(50px, -40px) scale(0.9); }
        }

        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, 70px) scale(1.1); }
          66% { transform: translate(-70px, -50px) scale(0.88); }
        }

        /* Geometric Shapes */
        .bg-geometric-shapes {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .shape {
          position: absolute;
          border: 2px solid rgba(247,147,26,0.35);
        }

        .shape-1 {
          width: 250px;
          height: 250px;
          top: 10%;
          right: 8%;
          transform: rotate(45deg);
          animation: shapeSpin1 30s linear infinite;
        }

        .shape-2 {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          bottom: 20%;
          left: 3%;
          animation: shapeSpin2 25s linear infinite reverse;
        }

        .shape-3 {
          width: 130px;
          height: 130px;
          top: 35%;
          left: 10%;
          transform: rotate(30deg);
          animation: shapeSpin3 35s linear infinite;
        }

        .shape-4 {
          width: 150px;
          height: 150px;
          border-radius: 30%;
          bottom: 5%;
          right: 15%;
          animation: shapeSpin4 28s linear infinite reverse;
        }

        @keyframes shapeSpin1 {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }

        @keyframes shapeSpin2 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes shapeSpin3 {
          from { transform: rotate(30deg); }
          to { transform: rotate(390deg); }
        }

        @keyframes shapeSpin4 {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        /* Floating Background Coins */
        .floating-bg-coin {
          position: fixed;
          z-index: 1;
          pointer-events: none;
          opacity: 0.15;
          font-weight: 900;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 40px rgba(247,147,26,0.8));
        }

        .coin-0 {
          top: 15%;
          left: 3%;
          font-size: 140px;
          animation: floatBg1 22s ease-in-out infinite;
        }

        .coin-1 {
          top: 35%;
          right: 6%;
          font-size: 100px;
          animation: floatBg2 28s ease-in-out infinite;
        }

        .coin-2 {
          top: 55%;
          left: 6%;
          font-size: 80px;
          animation: floatBg3 20s ease-in-out infinite;
        }

        .coin-3 {
          bottom: 35%;
          right: 3%;
          font-size: 120px;
          animation: floatBg4 24s ease-in-out infinite;
        }

        .coin-4 {
          bottom: 20%;
          left: 8%;
          font-size: 75px;
          animation: floatBg5 21s ease-in-out infinite;
        }

        .coin-5 {
          top: 8%;
          right: 10%;
          font-size: 95px;
          animation: floatBg6 26s ease-in-out infinite;
        }

        .coin-6 {
          top: 70%;
          right: 25%;
          font-size: 85px;
          animation: floatBg7 23s ease-in-out infinite;
        }

        .coin-7 {
          top: 25%;
          left: 25%;
          font-size: 70px;
          animation: floatBg8 19s ease-in-out infinite;
        }

        .coin-8 {
          bottom: 8%;
          right: 35%;
          font-size: 65px;
          animation: floatBg9 27s ease-in-out infinite;
        }

        @keyframes floatBg1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-50px) rotate(180deg); }
        }

        @keyframes floatBg2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(40px) rotate(-180deg); }
        }

        @keyframes floatBg3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-35px) rotate(90deg); }
        }

        @keyframes floatBg4 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(45px) rotate(-90deg); }
        }

        @keyframes floatBg5 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-40px) rotate(120deg); }
        }

        @keyframes floatBg6 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(35px) rotate(-120deg); }
        }

        @keyframes floatBg7 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(150deg); }
        }

        @keyframes floatBg8 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(25px) rotate(-150deg); }
        }

        @keyframes floatBg9 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-45px) rotate(200deg); }
        }

        /* Particle System */
        .particles-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(247,147,26,0.5) 100%);
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(247,147,26,0.8);
          animation: particleFloat 20s linear infinite;
        }

        @keyframes particleFloat {
          0% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-1000px) translateX(50px);
          }
        }

        /* Ticker */
        .ticker {
          background: linear-gradient(90deg, rgba(247,147,26,0.1), rgba(251,191,36,0.05), rgba(247,147,26,0.1));
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 10px 0;
          overflow: hidden;
          position: relative;
          z-index: 1;
          width: 100%;
        }

        .ticker-content {
          display: flex;
          gap: 80px;
          animation: ticker 45s linear infinite;
          white-space: nowrap;
          width: fit-content;
        }

        .ticker-item {
          font-size: 15px;
          font-weight: 700;
          color: #eaecef;
          flex-shrink: 0;
        }

        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* Navbar */
        .navbar {
          position: sticky;
          top: 0;
          background: rgba(11,14,17,0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          z-index: 100;
          transition: all 0.3s ease;
        }

        .navbar.scrolled {
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 16px;
          color: #000;
        }

        .logo-icon.small {
          width: 36px;
          height: 36px;
          font-size: 14px;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 800;
        }

        .nav-links {
          display: flex;
          gap: 36px;
        }

        .nav-links a {
          color: rgba(234,236,239,0.7);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: #fff;
        }

        .nav-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .nav-link-btn {
          color: rgba(234,236,239,0.85);
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
        }

        .nav-btn-primary {
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          color: #000;
          padding: 12px 28px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
        }

        /* Hero */
        .hero {
          padding: 0 32px 100px;
          position: relative;
          z-index: 10;
          border-radius: 0;
          background: #0D0D0D;
        }

        .hero-grid {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 80px;
          align-items: center;
        }

        .hero-title {
          font-size: 64px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .title-gradient {
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-desc {
          font-size: 18px;
          color: rgba(234,236,239,0.65);
          line-height: 1.7;
          margin-bottom: 40px;
          max-width: 580px;
        }

        .hero-stats {
          display: flex;
          gap: 32px;
          margin-bottom: 40px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
        }

        .stat-label {
          font-size: 14px;
          color: rgba(234,236,239,0.5);
        }

        .hero-ctas {
          display: flex;
          gap: 16px;
        }

        .cta-primary {
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          color: #000;
          padding: 16px 36px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 800;
          font-size: 16px;
        }

        .cta-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 16px 36px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
        }

        /* Realistic Phone Mockup */
        .phone-mockup {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 0;
          perspective: 2500px;
        }

        .phone-3d-container {
          position: relative;
          width: 320px;
          height: 620px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .phone-rotator {
          position: relative;
          width: 280px;
          height: 560px;
          transform-style: preserve-3d;
          animation: phoneRotate360 20s linear infinite;
        }

        @keyframes phoneRotate360 {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }

        .phone-wrapper {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }

        /* Phone Sides */
        .phone-side {
          position: absolute;
          width: 280px;
          height: 560px;
          border-radius: 48px;
          backface-visibility: visible;
        }

        /* Front Side */
        .phone-front {
          transform: translateZ(10px);
        }

        .phone-frame-metal {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #2a2a3a, #1a1a2a);
          border-radius: 48px;
          padding: 12px;
          box-shadow: 
            0 50px 100px rgba(0,0,0,0.6),
            inset 0 0 0 2px rgba(255,255,255,0.08),
            inset 0 0 20px rgba(0,0,0,0.4);
          position: relative;
        }

        .phone-screen-container {
          width: 100%;
          height: 100%;
          background: #000;
          border-radius: 40px;
          overflow: hidden;
        }

        .phone-bezel {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #0a0a12, #11111c);
          border-radius: 40px;
          padding: 10px;
          position: relative;
        }

        .phone-bezel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%);
          border-radius: 40px;
          pointer-events: none;
          z-index: 10;
        }

        /* Side Faces (3D effect) */
        .phone-left,
        .phone-right,
        .phone-top,
        .phone-bottom {
          position: absolute;
          background: #1a1a2a;
          border: none;
        }

        .phone-left {
          width: 20px;
          height: 560px;
          left: -10px;
          top: 0;
          transform: rotateY(-90deg) translateZ(140px);
          background: linear-gradient(90deg, #2a2a3a, #1a1a2a);
          border-radius: 0;
        }

        .phone-right {
          width: 20px;
          height: 560px;
          right: -10px;
          top: 0;
          transform: rotateY(90deg) translateZ(140px);
          background: linear-gradient(90deg, #1a1a2a, #2a2a3a);
          border-radius: 0;
        }

        .phone-top {
          width: 280px;
          height: 20px;
          left: 0;
          top: -10px;
          transform: rotateX(90deg) translateZ(280px);
          background: linear-gradient(180deg, #2a2a3a, #1a1a2a);
          border-radius: 0;
        }

        .phone-bottom {
          width: 280px;
          height: 20px;
          left: 0;
          bottom: -10px;
          transform: rotateX(-90deg) translateZ(280px);
          background: linear-gradient(180deg, #1a1a2a, #2a2a3a);
          border-radius: 0;
        }

        /* Status Bar */
        .phone-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 22px 6px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
        }

        .status-right {
          display: flex;
          gap: 8px;
          font-size: 16px;
        }

        /* Dynamic Island */
        .dynamic-island {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 126px;
          height: 37px;
          background: #000;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          z-index: 20;
        }

        .island-camera {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: radial-gradient(circle, #1a1a2e 0%, #0a0a12 100%);
        }

        .island-sensor {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #1a1a2e;
        }

        /* Screen Content */
        .screen-content {
          padding: 56px 18px 34px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .app-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .app-logo {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 13px;
          color: #000;
        }

        .app-title {
          font-size: 17px;
          font-weight: 800;
        }

        .price-section {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .price-pair {
          font-size: 13px;
          font-weight: 600;
          color: rgba(234,236,239,0.6);
        }

        .price-value {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .price-change {
          padding: 5px 10px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          width: fit-content;
        }

        .price-change.up {
          background: rgba(34,197,94,0.15);
          color: #22c55e;
        }

        .price-change.down {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
        }

        /* Mini Chart */
        .mini-chart {
          height: 110px;
          background: rgba(255,255,255,0.02);
          border-radius: 14px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-svg {
          width: 100%;
          height: 100%;
        }

        /* Market Stats */
        .market-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: rgba(255,255,255,0.03);
          padding: 10px;
          border-radius: 10px;
        }

        .stat-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(234,236,239,0.5);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 12px;
          font-weight: 700;
        }

        /* Action Buttons */
        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: auto;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 14px;
          border-radius: 14px;
          border: none;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .action-btn:hover {
          transform: scale(1.03);
        }

        .action-btn.sell {
          background: rgba(239,68,68,0.12);
          color: #ef4444;
        }

        .action-btn.buy {
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          color: #000;
          box-shadow: 0 8px 24px rgba(247,147,26,0.3);
        }

        .btn-icon {
          font-size: 18px;
        }

        .btn-label {
          font-size: 13px;
        }

        /* Home Indicator */
        .home-indicator {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 134px;
          height: 5px;
          background: rgba(255,255,255,0.4);
          border-radius: 3px;
        }

        /* Phone Buttons (on front) */
        .phone-front .phone-buttons-left {
          position: absolute;
          left: -3px;
          top: 110px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .phone-front .phone-buttons-right {
          position: absolute;
          right: -3px;
          top: 140px;
          z-index: 100;
        }

        .phone-button {
          background: linear-gradient(180deg, #3a3a4a, #2a2a3a);
          border-radius: 2px 0 0 2px;
          box-shadow: -1px 0 3px rgba(0,0,0,0.3);
        }

        .phone-button.volume-up {
          width: 3px;
          height: 34px;
        }

        .phone-button.volume-down {
          width: 3px;
          height: 34px;
        }

        .phone-button.mute {
          width: 3px;
          height: 22px;
        }

        .phone-button.power {
          width: 3px;
          height: 60px;
          border-radius: 0 2px 2px 0;
        }

        /* Back Side */
        .phone-back {
          transform: rotateY(180deg) translateZ(10px);
        }

        .phone-back-glass {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #1a1a2a, #0f0f1a);
          border-radius: 48px;
          padding: 40px 20px;
          box-shadow: 
            0 50px 100px rgba(0,0,0,0.6),
            inset 0 0 0 2px rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }

        .camera-module {
          width: 90px;
          height: 90px;
          background: rgba(0,0,0,0.4);
          border-radius: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 10px;
          padding: 10px;
        }

        .camera-lens {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: radial-gradient(circle, #2a2a4a 0%, #0f0f1a 100%);
          box-shadow: inset 0 0 6px rgba(0,0,0,0.5);
        }

        .camera-flash {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #fbbf24, #f7931a);
        }

        .camera-sensor {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #1a1a2a;
        }

        .phone-logo {
          font-size: 26px;
          font-weight: 900;
          color: rgba(255,255,255,0.2);
        }

        /* Floating Elements */
        .phone-float-elements {
          position: absolute;
          inset: -80px;
          pointer-events: none;
        }

        .float-card {
          position: absolute;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: rgba(16, 16, 28, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 16px 20px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        .float-coin-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .float-icon {
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .float-coin-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .float-coin-name {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }

        .float-coin-price {
          font-size: 12px;
          font-weight: 600;
          color: rgba(234, 236, 239, 0.65);
        }

        .float-text {
          font-size: 14px;
          font-weight: 800;
          padding: 6px 12px;
          border-radius: 10px;
        }

        .float-text.up {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .float-text.down {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .float-1 {
          top: 80px;
          left: -110px;
          animation: float1 3.8s ease-in-out infinite;
        }

        .float-2 {
          top: 160px;
          right: -100px;
          animation: float2 4.2s ease-in-out infinite;
        }

        .float-3 {
          bottom: 90px;
          left: -80px;
          animation: float3 3.2s ease-in-out infinite;
        }

        .float-4 {
          bottom: 180px;
          right: -90px;
          animation: float4 3.5s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }

        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-2deg); }
        }

        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-1.5deg); }
        }

        @keyframes float4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(12px) rotate(1.5deg); }
        }

        /* Container */
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 32px;
          position: relative;
          z-index: 1;
        }

        /* Markets */
        .markets {
          padding: 100px 0;
        }

        .section-title {
          font-size: 40px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 12px;
        }

        .section-desc {
          font-size: 16px;
          color: rgba(234,236,239,0.6);
          text-align: center;
          margin-bottom: 48px;
        }

        .markets-table {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.2fr 1.2fr 0.8fr;
          padding: 20px 28px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-weight: 700;
          font-size: 13px;
          color: rgba(234,236,239,0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.2fr 1.2fr 0.8fr;
          padding: 22px 28px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          align-items: center;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: rgba(255,255,255,0.02);
        }

        .cell-pair {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
        }

        .pair-icon {
          width: 32px;
          height: 32px;
          border: 2px solid rgba(247,147,26,0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 900;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cell-price {
          font-weight: 700;
        }

        .cell-change.up {
          color: #22c55e;
          font-weight: 700;
        }

        .cell-change.down {
          color: #ef4444;
          font-weight: 700;
        }

        .cell-volume {
          color: rgba(234,236,239,0.7);
        }

        .cell-action-btn {
          background: rgba(247,147,26,0.15);
          border: 1px solid rgba(247,147,26,0.3);
          color: #fbbf24;
          padding: 10px 22px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Trending Coins */
        .trending {
          padding: 100px 0;
        }

        .trending-carousel {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding-bottom: 20px;
        }

        .trending-coin {
          min-width: 240px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .trending-coin:hover {
          transform: translateY(-6px);
          border-color: rgba(247,147,26,0.3);
        }

        .coin-icon {
          width: 56px;
          height: 56px;
          border: 2px solid rgba(247,147,26,0.4);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .coin-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .coin-name {
          font-size: 18px;
          font-weight: 800;
        }

        .coin-symbol {
          font-size: 14px;
          color: rgba(234,236,239,0.6);
        }

        .coin-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .coin-price {
          font-size: 20px;
          font-weight: 800;
        }

        .coin-change {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          width: fit-content;
        }

        .coin-change.up {
          background: rgba(34,197,94,0.12);
          color: #22c55e;
        }

        .coin-change.down {
          background: rgba(239,68,68,0.12);
          color: #ef4444;
        }

        /* How It Works */
        .how-it-works {
          padding: 100px 0;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 60px;
        }

        .step-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px 32px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .step-card:hover {
          transform: translateY(-8px);
          border-color: rgba(247,147,26,0.3);
        }

        .step-number {
          font-size: 64px;
          font-weight: 900;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 20px;
        }

        .step-title {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .step-desc {
          font-size: 16px;
          color: rgba(234,236,239,0.6);
        }

        /* Testimonials */
        .testimonials {
          padding: 100px 0;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 60px;
        }

        .testimonial-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 40px 32px;
          transition: all 0.3s ease;
        }

        .testimonial-card:hover {
          transform: translateY(-8px);
          border-color: rgba(247,147,26,0.3);
        }

        .testimonial-quote {
          font-size: 64px;
          color: rgba(247,147,26,0.3);
          line-height: 1;
          margin-bottom: 20px;
        }

        .testimonial-text {
          font-size: 16px;
          color: rgba(234,236,239,0.8);
          line-height: 1.7;
          margin-bottom: 32px;
        }

        .testimonial-author {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .author-avatar {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: #000;
        }

        .author-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .author-name {
          font-size: 18px;
          font-weight: 800;
        }

        .author-role {
          font-size: 14px;
          color: rgba(234,236,239,0.6);
        }

        /* Fade-in Section Styles */
        .fade-section {
          opacity: 0;
          transform: translateY(60px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .fade-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Trending Coins */
        .trending {
          padding: 100px 0;
        }

        .trending-carousel {
          overflow: hidden;
          position: relative;
        }

        .trending-track {
          display: flex;
          gap: 20px;
          animation: scrollCoins 25s linear infinite;
          width: fit-content;
        }

        .trending-carousel:hover .trending-track {
          animation-play-state: paused;
        }

        @keyframes scrollCoins {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .trending-coin {
          min-width: 240px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .trending-coin:hover {
          transform: translateY(-6px);
          border-color: rgba(247,147,26,0.3);
        }

        .coin-icon {
          width: 56px;
          height: 56px;
          border: 2px solid rgba(247,147,26,0.4);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .coin-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .coin-name {
          font-size: 18px;
          font-weight: 800;
        }

        .coin-symbol {
          font-size: 14px;
          color: rgba(234,236,239,0.6);
        }

        .coin-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .coin-price {
          font-size: 20px;
          font-weight: 800;
        }

        .coin-change {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          width: fit-content;
        }

        .coin-change.up {
          background: rgba(34,197,94,0.12);
          color: #22c55e;
        }

        .coin-change.down {
          background: rgba(239,68,68,0.12);
          color: #ef4444;
        }

        /* Features */
        .features {
          padding: 100px 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 32px;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(247,147,26,0.3);
        }

        .feature-icon {
          margin-bottom: 20px;
          color: #f7931a;
        }

        .feature-title {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .feature-desc {
          font-size: 15px;
          color: rgba(234,236,239,0.6);
          line-height: 1.6;
        }

        /* CTA */
        .cta {
          padding: 100px 0;
        }

        .cta-content {
          background: linear-gradient(135deg, rgba(247,147,26,0.18), rgba(251,191,36,0.08));
          border: 1px solid rgba(247,147,26,0.35);
          border-radius: 24px;
          padding: 80px 32px;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 40px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .cta-desc {
          font-size: 18px;
          color: rgba(234,236,239,0.7);
          margin-bottom: 36px;
        }

        .cta-btn {
          background: linear-gradient(135deg, #f7931a, #fbbf24);
          color: #000;
          padding: 18px 40px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 900;
          font-size: 17px;
        }

        /* Footer */
        .footer {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 80px 0 40px;
          position: relative;
          z-index: 1;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          margin-bottom: 60px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          font-weight: 800;
        }

        .footer-desc {
          color: rgba(234,236,239,0.6);
        }

        .footer-col h4 {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .footer-col a {
          display: block;
          color: rgba(234,236,239,0.6);
          text-decoration: none;
          margin-bottom: 12px;
          font-size: 15px;
          transition: color 0.2s;
        }

        .footer-col a:hover {
          color: #fff;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 28px;
          color: rgba(234,236,239,0.5);
          font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .hero-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .nav-links {
            display: none;
          }

          .hero {
            padding: 60px 20px 80px;
          }

          .hero-title {
            font-size: 44px;
          }

          .hero-stats {
            gap: 20px;
          }

          .markets-table {
            overflow-x: auto;
          }

          .table-header, .table-row {
            width: 900px;
          }

          .features-grid {
            grid-template-columns: 1fr 1fr;
          }

          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .hero-title {
            font-size: 36px;
          }

          .hero-ctas {
            flex-direction: column;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
