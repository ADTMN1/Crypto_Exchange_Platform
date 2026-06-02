import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthForm from "../../components/auth/AuthForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
import { loginSchema, LoginFormData } from "../../types/auth.types";
import { loginUser } from "../../api/authApi";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    
    console.log("LOGIN DATA:", data);

    try {
      const response = await loginUser(data);
      console.log("Login success:", response);

  toast.success("Login Successful! Redirecting to dashboard...", {
  style: {
    background: "#22c55e", // green-500
    color: "#fff",
    border: "1px solid #16a34a",
  },
  position: "top-right",
  description: response?.data?.message || "You have successfully logged in.",
  duration: 3000,
});

      navigate("/dashboard"); // change if needed
    } catch (error: any) {
      console.error("Login error:", error);

      const errorMessage = error?.response?.data?.error||error.message||error.response?.data?.message || "An unexpected error occurred during login. Please try again.";
      toast.error(errorMessage, {
        style: {
          background: "#ef4444", // red-500
          color: "#fff",
          border: "1px solid #dc2626",
        },
        position: "top-right",
        duration: 3000,
      });
    }
  };

  return (
    <div className="auth-page">
      <AuthForm
        title="Welcome Back, Trader!"
        subtitle="Continue your trading journey with us"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <input
              type="email"
              {...register("email")}
              className="auth-input"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              {...register("password")}
              className="auth-input"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="auth-btn">
            {isSubmitting ? "Signing In..." : "Sign In"}
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
