import { ReactNode } from "react";
import { FaShieldAlt, FaBolt, FaChartLine } from "react-icons/fa";
import Logo from "../../assets/logo.webp";

interface AuthLayoutProps {
  children: ReactNode;
  overlay?: ReactNode;
}

const FEATURES = [
  { icon: <FaShieldAlt />, text: "Bank-grade security with encrypted sessions" },
  { icon: <FaBolt />, text: "High-performance order execution" },
  { icon: <FaChartLine />, text: "Live charts and advanced market insights" },
];

/**
 * Shared split-screen shell for all authentication pages.
 * Renders the brand/marketing hero on the left and the form panel on the right.
 */
export default function AuthLayout({ children, overlay }: AuthLayoutProps) {
  return (
    <div className="auth-page auth-page--split">
      {overlay}

      {/* Brand / marketing panel */}
      <aside className="auth-hero">
        <div className="auth-hero-brand">
          <img src={Logo} alt="PrimeAlfaTrade" className="auth-hero-logo" />
          <span className="auth-hero-name">PrimeAlfaTrade</span>
        </div>

        <div className="auth-hero-content">
          <h2 className="auth-hero-title">
            The <span className="accent">professional</span> way to trade crypto.
          </h2>
          <p className="auth-hero-text">
            Access deep liquidity, real-time market data and lightning-fast execution —
            all from one secure dashboard.
          </p>

          <ul className="auth-hero-features">
            {FEATURES.map((feature, i) => (
              <li key={i}>
                <span className="icon">{feature.icon}</span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-hero-foot">
          © {new Date().getFullYear()} PrimeAlfaTrade. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="auth-panel">
        <div className="auth-mobile-brand">
          <img src={Logo} alt="PrimeAlfaTrade" className="auth-hero-logo" />
          <span className="auth-hero-name">PrimeAlfaTrade</span>
        </div>
        {children}
      </main>
    </div>
  );
}
