import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthForm from "../../components/auth/AuthForm";
import { authService } from "../../services";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      toast.success(response.message);
      setIsSuccess(true);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to reset password. Please try again.";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthForm
          title="Password Reset Successful!"
          subtitle="Your password has been updated. You can now log in with your new password."
        >
          <div className="auth-success">
            <div className="auth-success-icon">✓</div>
            <div className="auth-success-actions">
              <Link to="/login" className="auth-btn">
                Go to Login
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
        title="Reset Password"
        subtitle="Enter your new password below to update your account."
      >
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="reset-password">New Password</label>
            <div className="auth-field">
              <FaLock className="auth-field-icon" aria-hidden="true" />
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input auth-input--icon auth-input--toggle"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="reset-confirm">Confirm Password</label>
            <div className="auth-field">
              <FaLock className="auth-field-icon" aria-hidden="true" />
              <input
                id="reset-confirm"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input auth-input--icon auth-input--toggle"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading || !token}>
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Resetting…
              </span>
            ) : (
              "Reset Password"
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
