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
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p className="success-text">
              If an account exists for <strong>{email}</strong>, you will
              receive password reset instructions shortly.
            </p>
            <p className="success-subtext">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="auth-actions">
              <button
                onClick={() => setIsSubmitted(false)}
                className="auth-btn-secondary"
              >
                Try Another Email
              </button>
              <Link to="/login" className="auth-btn">
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
