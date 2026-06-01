import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
import { useAuthStore } from "../../store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    navigate("/");
  };

  return (
    <div className="auth-page">
      <AuthForm title="Welcome Back">
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex justify-between">
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="auth-btn">
            Sign In
          </button>

          <OAuthButtons />

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign Up
            </Link>
          </p>
        </form>
      </AuthForm>
    </div>
  );
}
