import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
import { useAuthStore } from "../../store";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    const fullName = `${firstName} ${lastName}`;
    register(fullName, email, password);
    navigate("/");
  };

  return (
    <div className="auth-page">
      <AuthForm 
        title="Start Your Trading Journey" 
        subtitle="Create your account and begin your future trading today"
      >
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="auth-input"
                placeholder="John"
                required
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="auth-input"
                placeholder="Doe"
                required
              />
            </div>
          </div>

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

          <div className="auth-form-group">
            <label className="auth-label">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-btn">
            Create Account
          </button>

          <OAuthButtons />

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </form>
      </AuthForm>
    </div>
  );
}
