import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthForm from "../../components/auth/AuthForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import { loginSchema, LoginFormData } from "../../types/auth.types";
import { authService } from "../../services";
import { toast } from "sonner";
import { useAuthStore } from "../../store";

export default function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // dedicated — cleared before navigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginUserInStore = useAuthStore((state) => state.login);

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsLoggingIn(true);

    try {
      const response = await authService.login(data);

      if (!response?.user) {
        throw new Error("No user data returned from server");
      }

      const { user, accessToken, refreshToken } = response;

      // Persist tokens
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Normalise profile image fields
      const userToStore = {
        ...user,
        profile_image: user.profile_image || user.profile_picture_url,
        profile_picture_url: user.profile_picture_url || user.profile_image,
      };

      // Update auth store — sets isAuthenticated: true, isLoading: false
      loginUserInStore(userToStore, accessToken, refreshToken);

      toast.success("Login Successful! Redirecting...", {
        style: { background: "#22c55e", color: "#fff", border: "1px solid #16a34a" },
        position: "top-right",
        description: response?.message || "You have successfully logged in.",
        duration: 3000,
      });

      // Clear the overlay BEFORE navigating so it never flashes over the dashboard
      setIsLoggingIn(false);

      const destination = userToStore.role === "admin" ? "/admin" : "/dashboard";
      navigate(destination, { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || "Login failed.";
      console.error("[Auth] Login error:", error);
      setServerError(message);

      toast.error(message, {
        style: { background: "#ef4444", color: "#fff", border: "1px solid #dc2626" },
        position: "top-right",
        duration: 5000,
      });
    } finally {
      // Always reset isLoggingIn no matter what
      setIsLoggingIn(false);
    }
  };

  return (
    <AuthLayout
      overlay={isLoggingIn ? <LoadingOverlay message="Signing in..." /> : undefined}
    >
      <AuthForm
        title="Welcome back"
        subtitle="Sign in to continue to your trading dashboard"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)(e as any);
          }}
          className="auth-form"
          noValidate
        >
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="login-email">
              Email address
            </label>
            <div className="auth-field">
              <FaEnvelope className="auth-field-icon" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="auth-input auth-input--icon"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="auth-error">{errors.email.message}</p>}
          </div>

          <div className="auth-form-group">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" className="auth-link auth-link--sm">
                Forgot password?
              </Link>
            </div>
            <div className="auth-field">
              <FaLock className="auth-field-icon" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                className="auth-input auth-input--icon auth-input--toggle"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <p className="auth-error">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="auth-alert" role="alert">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting || isLoggingIn}
          >
            {isLoggingIn ? (
              <span className="btn-loading">
                <span className="spinner" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="oauth-divider">
            <span className="oauth-divider-text">or continue with</span>
          </div>

          <OAuthButtons />

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
        </form>
      </AuthForm>
    </AuthLayout>
  );
}
