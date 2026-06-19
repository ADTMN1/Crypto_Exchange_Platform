import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AuthForm from '../../components/auth/AuthForm';
import OAuthButtons from '../../components/auth/OAuthButtons';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import Spinner from '../../components/ui/Spinner';
import { signUpSchema, SignUpFormData } from '../../types/auth.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../../services';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Account form, 2: OTP form
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState<SignUpFormData | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const handleAccountSubmit = async (data: SignUpFormData) => {
    setIsSendingOtp(true);
    try {
      // Send OTP
      await authService.sendOTP(data.email);
      setFormData(data);
      setStep(2);
      toast.success('OTP sent successfully!', {
        description: 'Please check your email for the OTP',
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to send OTP';
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData) return;
    setIsSendingOtp(true);
    try {
      await authService.sendOTP(formData.email);
      toast.success('OTP resent successfully!');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to resend OTP';
      toast.error('Error', {
        description: errorMessage,
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData) return;
    setIsVerifying(true);
    try {
      const response = await authService.register(formData, otp);
      toast.success('Registration Successful! Please log in.', {
        style: {
          background: '#22c55e',
          color: '#fff',
          border: '1px solid #16a34a',
        },
        position: 'top-right',
        description: response.message || 'Your account has been created successfully.',
        duration: 3000,
      });
      navigate('/login');
    } catch (error: any) {
      console.error('Registration API error:', error);
      const globalErrorMessage =
        error?.response?.data?.message ||
        error.message ||
        error?.response?.data?.errors ||
        'An unexpected error occurred. Please try again.';
      toast.error('Registration Failed', {
        style: {
          background: '#ef4444',
          color: '#fff',
          border: '1px solid #dc2626',
        },
        position: 'top-right',
        description: globalErrorMessage,
        duration: 5000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setOtp('');
  };

  return (
    <div className="auth-page">
      {(isSendingOtp || isVerifying) && (
        <LoadingOverlay message={step === 1 ? 'Sending OTP...' : 'Creating your account...'} />
      )}
      
      <AuthForm
        title={step === 1 ? 'Start Your Trading Journey' : 'Verify Your Email'}
        subtitle={step === 1 ? 'Create your account and begin your future trading today' : `We've sent an OTP to ${formData?.email}`}
      >
        {step === 1 ? (
          <form onSubmit={handleSubmit(handleAccountSubmit)} className="auth-form">
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label className="auth-label">First Name</label>
                <input 
                  type="text"
                  {...register('firstName')}
                  className="auth-input"
                  placeholder="John"
                  required
                  disabled={isSubmitting}
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
                  {...register('lastName')}
                  className="auth-input"
                  placeholder="Doe"
                  required
                  disabled={isSubmitting}
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
                {...register('email')}
                className="auth-input"
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
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
                {...register('phone_number')}
                className="auth-input"
                placeholder="+1234567890"
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
                {...register('password')}
                className="auth-input"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
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
                {...register('confirm_password')}
                className="auth-input"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <button type="submit" className="auth-btn flex items-center justify-center gap-2" disabled={isSendingOtp}>
              {isSendingOtp ? (
                <>
                  <Spinner />
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
            </button>

            <OAuthButtons />

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
          </form>
        ) : (
          <div className="auth-form">
            <div className="auth-form-group">
              <label className="auth-label">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="auth-input"
                placeholder="123456"
                maxLength={6}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="button" 
                onClick={handleVerifyOtp} 
                className="auth-btn flex items-center justify-center gap-2" 
                disabled={isVerifying || !otp}
              >
                {isVerifying ? (
                  <>
                    <Spinner />
                    Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                className="px-4 py-2 text-blue-600 hover:underline"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Resending...' : 'Resend OTP'}
              </button>

              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 text-gray-600 hover:underline"
                disabled={isSubmitting}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </AuthForm>
    </div>
  );
}