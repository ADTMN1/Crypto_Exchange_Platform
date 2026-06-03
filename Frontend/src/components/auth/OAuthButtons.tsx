import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { authService } from '../../services';
import { toast } from 'sonner';
import LoadingOverlay from '../common/LoadingOverlay';

declare global {
  interface Window {
    google: any;
  }
}

export default function OAuthButtons() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Initialize Google Sign-In only once
    const buttonDiv = document.getElementById('google-signin-button');
    
    if (window.google && buttonDiv && !buttonDiv.hasChildNodes()) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleLogin,
      });

      // Render the Google button
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'filled_black',
        size: 'large',
        width: 400,
        text: 'continue_with',
      });
    }
    
    // Cleanup is not needed as Google handles this internally
  }, []);

  const handleGoogleLogin = async (response: any) => {
    setIsGoogleLoading(true);
    try {
      const idToken = response.credential;
      
      // Send token to backend for verification using centralized auth service
      const data = await authService.googleLogin(idToken);

      if (data.success) {
        // Tokens are automatically stored in httpOnly cookies
        // Update auth state
        login(data.user);
        
        toast.success('Google login successful!', {
          style: {
            background: '#22c55e',
            color: '#fff',
            border: '1px solid #16a34a',
          },
          position: 'top-right',
          duration: 3000,
        });
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        console.error('Google login failed:', data.message);
        toast.error('Google login failed. Please try again.', {
          style: {
            background: '#ef4444',
            color: '#fff',
            border: '1px solid #dc2626',
          },
          position: 'top-right',
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('Error during Google login:', error);
      const errorMessage = error?.response?.data?.message || 'An error occurred during Google login.';
      toast.error(errorMessage, {
        style: {
          background: '#ef4444',
          color: '#fff',
          border: '1px solid #dc2626',
        },
        position: 'top-right',
        duration: 5000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="oauth-buttons">
      {isGoogleLoading && <LoadingOverlay message="Signing in with Google..." />}
      <div id="google-signin-button"></div>
    </div>
  );
}
