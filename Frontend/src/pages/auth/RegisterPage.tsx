import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
// import { useAuthStore } from "../../store";
import { signUpSchema, SignUpFormData } from "../../types/auth.types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser } from "../../api/authApi";
import { toast } from "sonner";
export default function RegisterPage() {
  const navigate = useNavigate();
  // const setError = useAuthStore((state) => state.setError);
  // // const setGlobalError = useAuthStore((state) => state.setGlobalError);
  // const [globalError, setGlobalError] = useState<string | null>(null);
  // const [error, setError] = useState<{ [key in keyof SignUpFormData]?: string }>({});
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    // setGlobalError(null); // Clear errors from previous submissions
    // console.log("Submitting registration with data:", data);
    try {
      // 1. Post registration payload using your API instance
      const response = await registerUser(data);
      console.log("Registration API response success:", response.data);
      toast.success("Registration Successful! Please log in.", {
        style: {
          background: "#22c55e", // green-500
          color: "#fff",
          border: "1px solid #16a34a",
        },
        position: "top-right",
        description:
          response.data.message ||
          "Your account has been created successfully.",
        duration: 3000,
      });
      // 2. Automatically transition the user on success
      navigate("/login");
    } catch (error: any) {
      console.error("Registration API error:", error);

      // 3. Handle Field-Specific Errors (e.g., email already exists, username taken)
      // Our Axios interceptor returns these inside the `errors` object mapped by field names
      const fieldErrors = error?.response?.data?.errors || {};
      // setError(fieldErrors);

      // 4. Handle Global Errors (e.g., server issues, network errors)
      const globalErrorMessage =
        error?.response?.data?.message ||
        error.message ||
        error?.response?.data?.errors ||
        "An unexpected error occurred. Please try again.";
      // setGlobalError(globalErrorMessage);
      toast.error("Registration Failed", {
        style: {
          background: "#ef4444", // red-500
          color: "#fff",
          border: "1px solid #dc2626",
        },
        position: "top-right",
        description: globalErrorMessage,
        duration: 5000, // Keep it visible slightly longer for critical errors
        // You can add a fast-action retry button directly inside the notification!
        // action: {
        //   label: "Retry",
        //   onClick: () => handleSubmit(onSubmit)(),
        // },
      });
    }
  };

  return (
    <div className="auth-page">
      <AuthForm
        title="Start Your Trading Journey"
        subtitle="Create your account and begin your future trading today"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="auth-form-row">
            <div className="auth-form-group">
              <label className="auth-label">First Name</label>
              <input 
                type="text"
                {...register("firstName")}
                className="auth-input"
                placeholder="John"
                required
              />

              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Last Name</label>
              <input
                type="text"
                {...register("lastName")}
                className="auth-input"
                placeholder="Doe"
                required
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <input
              type="email"
              {...register("email")}
              className="auth-input"
              placeholder="you@example.com"
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Phone Number</label>
            <input
              type="tel"
              {...register("phone_number")}
              className="auth-input"
              placeholder="+1234567890"
              required
            />
            {errors.phone_number && (
              <p className="text-red-500 text-sm mt-1">
                {errors.phone_number.message}
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
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              {...register("confirm_password")}
              className="auth-input"
              placeholder="••••••••"
              required
            />

            {errors.confirm_password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          <button type="submit" className="auth-btn">
            {isSubmitting ? "Creating Account..." : "Create Account"}
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
