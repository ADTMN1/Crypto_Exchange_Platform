import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm";
import { authService } from "../../services";
import { toast } from "sonner";
import Spinner from "../../components/ui/Spinner";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      <div className="auth-page">
        <AuthForm
          title="Password Reset Successful!"
          subtitle="Your password has been updated. You can now log in with your new password."
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
              Go to Login
            </Link>
          </div>
        </AuthForm>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthForm
        title="Reset Password"
        subtitle="Enter your new password below to update your account."
      >
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <div className="auth-form-group">
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="auth-btn flex items-center justify-center gap-2"
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <Spinner />
                Resetting...
              </>
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
    </div>
  );
}
