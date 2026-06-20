import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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


const loginUserInStore = useAuthStore((state) => state.login);




  const onSubmit = async (data: LoginFormData) => {
    // Clear any previous server error
    setServerError(null);
    console.log("LOGIN DATA:", data);

    try {
      const response = await authService.login(data);
      console.log("Login success:", response);

      toast.success("Login Successful! Redirecting...", {
        style: {
          background: "#22c55e",
          color: "#fff",
          border: "1px solid #16a34a",
        },
        position: "top-right",
        description: response?.message || "You have successfully logged in.",
        duration: 3000,
      });

      if (response?.user) {
        // We don't store tokens in localStorage anymore - they're in httpOnly cookies!
        loginUserInStore(response.user, response.accessToken ?? null, response.refreshToken ?? null)

        // Redirect based on user role
        if (response.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    } catch (error: any) {

      const message =  error?.response?.data?.message || error?.message || "Login failed.";
      console.error("Login error:", error);
      setServerError(message);

      toast.error(message, {
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "1px solid #dc2626",
        },


        
        position: "top-right",
        duration: 5000,
      });
    }
  };

  return (
    <div className="auth-page">
      {isSubmitting && <LoadingOverlay message="Signing in..." />}
      
      <AuthForm
        title="Welcome Back, Trader!"
        subtitle="Continue your trading journey with us"
      >
        <form
          onSubmit={(e) => {
            // explicitly prevent default to avoid accidental full-page reloads
            e.preventDefault();
            // delegate to react-hook-form's handler
            handleSubmit(onSubmit)(e as any);
          }}
          className="auth-form"
        >
       
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

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
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
