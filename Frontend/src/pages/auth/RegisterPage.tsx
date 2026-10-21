import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthForm from '../../components/auth/AuthForm';
import OAuthButtons from '../../components/auth/OAuthButtons';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { signUpSchema, SignUpFormData } from '../../types/auth.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../../services';
import { toast } from 'sonner';

const COUNTRY_CODES = [
  { flag: '🇺🇸', code: '+1',   label: 'US' },
  { flag: '🇬🇧', code: '+44',  label: 'GB' },
  { flag: '🇨🇦', code: '+1',   label: 'CA' },
  { flag: '🇦🇺', code: '+61',  label: 'AU' },
  { flag: '🇩🇪', code: '+49',  label: 'DE' },
  { flag: '🇫🇷', code: '+33',  label: 'FR' },
  { flag: '🇮🇳', code: '+91',  label: 'IN' },
  { flag: '🇨🇳', code: '+86',  label: 'CN' },
  { flag: '🇧🇷', code: '+55',  label: 'BR' },
  { flag: '🇯🇵', code: '+81',  label: 'JP' },
  { flag: '🇰🇷', code: '+82',  label: 'KR' },
  { flag: '🇲🇽', code: '+52',  label: 'MX' },
  { flag: '🇷🇺', code: '+7',   label: 'RU' },
  { flag: '🇿🇦', code: '+27',  label: 'ZA' },
  { flag: '🇳🇬', code: '+234', label: 'NG' },
  { flag: '🇪🇹', code: '+251', label: 'ET' },
  { flag: '🇰🇪', code: '+254', label: 'KE' },
  { flag: '🇬🇭', code: '+233', label: 'GH' },
  { flag: '🇪🇬', code: '+20',  label: 'EG' },
  { flag: '🇸🇦', code: '+966', label: 'SA' },
  { flag: '🇦🇪', code: '+971', label: 'AE' },
  { flag: '🇹🇷', code: '+90',  label: 'TR' },
  { flag: '🇵🇰', code: '+92',  label: 'PK' },
  { flag: '🇧🇩', code: '+880', label: 'BD' },
  { flag: '🇵🇭', code: '+63',  label: 'PH' },
  { flag: '🇮🇩', code: '+62',  label: 'ID' },
  { flag: '🇻🇳', code: '+84',  label: 'VN' },
  { flag: '🇹🇭', code: '+66',  label: 'TH' },
  { flag: '🇦🇷', code: '+54',  label: 'AR' },
  { flag: '🇨🇴', code: '+57',  label: 'CO' },
];

// ── Custom country code picker ───────────────────────────────────────────────
function CountryPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0];

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="cp-wrap" ref={ref}>
      <button
        type="button"
        className="cp-trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected.flag}</span>
        <span className="cp-code">{selected.code}</span>
        <svg className={`cp-arrow${open ? ' open' : ''}`} width="10" height="6" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <ul className="cp-menu" role="listbox">
          {COUNTRY_CODES.map((c) => (
            <li
              key={`${c.label}-${c.code}`}
              role="option"
              aria-selected={c.code === value && c.label === selected.label}
              className={`cp-item${c.code === value && c.label === selected.label ? ' active' : ''}`}
              onMouseDown={() => { onChange(c.code); setOpen(false); }}
            >
              <span>{c.flag}</span>
              <span className="cp-item-label">{c.label}</span>
              <span className="cp-item-code">{c.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState<SignUpFormData | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', confirm_password: '' },
  });

  const handlePhoneChange = (num: string) => {
    setPhoneNumber(num);
    setValue('phone_number', `${countryCode}${num}`);
  };

  const handleCodeChange = (code: string) => {
    setCountryCode(code);
    setValue('phone_number', `${code}${phoneNumber}`);
  };

  const handleAccountSubmit = async (data: SignUpFormData) => {
    setIsSendingOtp(true);
    try {
      await authService.sendOTP(data.email);
      setFormData(data);
      setStep(2);
      toast.success('OTP sent!', { description: 'Check your email for the code.' });
    } catch (err: any) {
      toast.error('Error', { description: err?.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!formData) return;
    setIsSendingOtp(true);
    try {
      await authService.sendOTP(formData.email);
      toast.success('OTP resent!');
    } catch (err: any) {
      toast.error('Error', { description: err?.response?.data?.message || 'Failed to resend OTP' });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!formData) return;
    setIsVerifying(true);
    try {
      const res = await authService.register(formData, otp);
      toast.success('Account created!', {
        style: { background: '#22c55e', color: '#fff' },
        description: res.message || 'You can now log in.',
        duration: 3000,
      });
      navigate('/login');
    } catch (err: any) {
      toast.error('Registration failed', {
        style: { background: '#ef4444', color: '#fff' },
        description: err?.response?.data?.message || 'Please try again.',
        duration: 5000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const goBack = () => { setStep(1); setOtp(''); };

  return (
    <AuthLayout
      overlay={
        (isSendingOtp || isVerifying) ? (
          <LoadingOverlay message={step === 1 ? 'Sending OTP...' : 'Creating your account...'} />
        ) : undefined
      }
    >
      <AuthForm
        title={step === 1 ? 'Start Your Trading Journey' : 'Verify Your Email'}
        subtitle={step === 1
          ? 'Create your account and begin trading today'
          : `We sent an OTP to ${formData?.email}`}
      >
        {step === 1 ? (
          <form onSubmit={handleSubmit(handleAccountSubmit)} className="auth-form" noValidate>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-fullname">Full Name</label>
              <div className="auth-field">
                <FaUser className="auth-field-icon" aria-hidden="true" />
                <input id="reg-fullname" type="text" {...register('fullName')}
                  className="auth-input auth-input--icon" placeholder="John Doe" disabled={isSubmitting} />
              </div>
              {errors.fullName && <p className="auth-error">{errors.fullName.message}</p>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-email">Email</label>
              <div className="auth-field">
                <FaEnvelope className="auth-field-icon" aria-hidden="true" />
                <input id="reg-email" type="email" {...register('email')}
                  className="auth-input auth-input--icon" placeholder="you@example.com" disabled={isSubmitting} />
              </div>
              {errors.email && <p className="auth-error">{errors.email.message}</p>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Phone Number</label>
              <div className="auth-phone-row">
                <CountryPicker value={countryCode} onChange={handleCodeChange} disabled={isSubmitting} />
                <input
                  type="tel"
                  className="auth-phone-number"
                  placeholder="712 345 678"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value.replace(/\D/g, ''))}
                  disabled={isSubmitting}
                />
              </div>
              <input type="hidden" {...register('phone_number')} />
              {errors.phone_number && <p className="auth-error">{errors.phone_number.message}</p>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-password">Password</label>
              <div className="auth-field">
                <FaLock className="auth-field-icon" aria-hidden="true" />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} {...register('password')}
                  className="auth-input auth-input--icon auth-input--toggle"
                  placeholder="••••••••" disabled={isSubmitting} />
                <button type="button" className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password.message}</p>}
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
              <div className="auth-field">
                <FaLock className="auth-field-icon" aria-hidden="true" />
                <input id="reg-confirm" type={showConfirmPassword ? 'text' : 'password'} {...register('confirm_password')}
                  className="auth-input auth-input--icon auth-input--toggle"
                  placeholder="••••••••" disabled={isSubmitting} />
                <button type="button" className="auth-input-toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirm_password && <p className="auth-error">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" className="auth-btn" disabled={isSendingOtp}>
              {isSendingOtp ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Sending…
                </span>
              ) : (
                'Send OTP'
              )}
            </button>

            <div className="oauth-divider">
              <span className="oauth-divider-text">or continue with</span>
            </div>

            <OAuthButtons />

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </form>
        ) : (
          <div className="auth-form">
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reg-otp">Enter OTP</label>
              <input id="reg-otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                className="auth-input auth-input--otp" placeholder="123456" maxLength={6}
                inputMode="numeric" autoComplete="one-time-code" disabled={isSubmitting} />
            </div>

            <button type="button" onClick={handleVerifyOtp} className="auth-btn"
              disabled={isVerifying || otp.length < 6}>
              {isVerifying ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Verifying…
                </span>
              ) : (
                'Verify & Create Account'
              )}
            </button>

            <button type="button" onClick={handleResendOtp} className="auth-btn-outline"
              disabled={isSendingOtp}>
              {isSendingOtp ? 'Resending…' : 'Resend OTP'}
            </button>

            <button type="button" onClick={goBack} className="auth-btn-ghost" disabled={isSubmitting}>
              Back
            </button>
          </div>
        )}
      </AuthForm>
    </AuthLayout>
  );
}
