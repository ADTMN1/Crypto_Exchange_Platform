import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthForm from "../../components/auth/AuthForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import { loginSchema, LoginFormData } from "../../types/auth.types";
import { authService, userService } from "../../services";
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
        // First, store tokens in localStorage and update auth store
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        const initialUserToStore = {
          ...response.user,
          profile_image: response.user.profile_image || response.user.profile_picture_url,
          profile_picture_url: response.user.profile_picture_url || response.user.profile_image,
        };
        loginUserInStore(initialUserToStore, response.accessToken, response.refreshToken);

        // Now try to get the latest profile data (optional, but nice to have)
        try {
          const latestUser = await userService.getProfile();
          const userToStore = {
            ...latestUser,
            profile_image: latestUser.profile_image || latestUser.profile_picture_url,
            profile_picture_url: latestUser.profile_picture_url || latestUser.profile_image,
          };
          loginUserInStore(userToStore, response.accessToken, response.refreshToken);
        } catch (profileError) {
          console.warn("Could not fetch latest profile, using initial user data:", profileError);
        }

        // Redirect based on user role
        if (initialUserToStore.role === "admin") {
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
