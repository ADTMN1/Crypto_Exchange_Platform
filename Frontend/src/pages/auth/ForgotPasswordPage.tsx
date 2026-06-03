import { useState } from "react";
import { Link } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to send password reset email
      // const response = await authService.sendPasswordResetEmail(email);
      // Example: await fetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

      // Temporarily using setTimeout for now
      setTimeout(() => {
        setIsSubmitted(true);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="auth-page">
        <AuthForm
          title="Check Your Email"
          subtitle="We've sent password reset instructions to your email"
        >
          <div style={{ 
            textAlign: 'center', 
            padding: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#24c576',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'white',
              marginBottom: '24px',
              fontWeight: 700
            }}>
              ✓
            </div>
            
            <p style={{
              fontSize: '16px',
              color: '#e0e0e0',
              marginBottom: '16px',
              lineHeight: '1.6',
              maxWidth: '100%'
            }}>
              If an account exists for <strong style={{ color: '#f3921f' }}>{email}</strong>, you will receive password reset instructions shortly.
            </p>
            
            <p style={{
              fontSize: '14px',
              color: '#a0a0a0',
              marginBottom: '32px',
              lineHeight: '1.5'
            }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%'
            }}>
              <button
                onClick={() => setIsSubmitted(false)}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'transparent',
                  color: '#f3921f',
                  border: '2px solid #f3921f',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(243, 146, 31, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Try Another Email
              </button>
              <Link 
                to="/login" 
                className="auth-btn"
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: '#f3921f',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Back to Login
              </Link>
            </div>
          </div>
        </AuthForm>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthForm
        title="Forgot Password?"
        subtitle="Enter your email and we'll send you instructions to reset your password"
      >
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="auth-footer">
            Remember your password?{" "}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </form>
      </AuthForm>
    </div>
  );
}
