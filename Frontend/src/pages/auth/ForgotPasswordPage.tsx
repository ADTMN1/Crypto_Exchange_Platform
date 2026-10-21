import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthForm from "../../components/auth/AuthForm";
import { authService } from "../../services";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message);
      setIsSubmitted(true);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Failed to send password reset email. Please try again.";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <AuthForm
          title="Check Your Email"
          subtitle="We've sent password reset instructions to your email"
        >
          <div className="auth-success">
            <div className="auth-success-icon">✓</div>

            <p className="auth-success-text">
              If an account exists for <strong>{email}</strong>, you will receive password
              reset instructions shortly.
            </p>

            <p className="auth-success-text auth-success-text--muted">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>

            <div className="auth-success-actions">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="auth-btn-outline"
              >
                Try Another Email
              </button>
              <Link to="/login" className="auth-btn">
                Back to Login
              </Link>
            </div>
          </div>
        </AuthForm>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthForm
        title="Forgot Password?"
        subtitle="Enter your email and we'll send you instructions to reset your password"
      >
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="forgot-email">Email Address</label>
            <div className="auth-field">
              <FaEnvelope className="auth-field-icon" aria-hidden="true" />
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input auth-input--icon"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Sending…
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>

          <p className="auth-footer">
            Remember your password?{" "}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </form>
      </AuthForm>
    </AuthLayout>
  );
}
