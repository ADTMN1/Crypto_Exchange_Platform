import { Link } from "react-router-dom";
import { FaEnvelopeOpenText } from "react-icons/fa";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthForm from "../../components/auth/AuthForm";

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <AuthForm
        title="Verify Your Email"
        subtitle="Confirm your email address to activate your account."
      >
        <div className="auth-success">
          <div className="auth-success-icon">
            <FaEnvelopeOpenText />
          </div>

          <p className="auth-success-text">
            We sent a verification link to your inbox. Click the link in the email to
            finish activating your account.
          </p>

          <p className="auth-success-text auth-success-text--muted">
            Didn&apos;t receive it? Check your spam folder, then{" "}
            <Link to="/login" className="auth-link">
              return to login
            </Link>{" "}
            to try again.
          </p>

          <div className="auth-success-actions">
            <Link to="/login" className="auth-btn">
              Back to Login
            </Link>
          </div>
        </div>
      </AuthForm>
    </AuthLayout>
  );
}
