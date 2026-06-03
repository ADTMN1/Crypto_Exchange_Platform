import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { getApiUrl, API_ENDPOINTS } from '../../services/api.service';

declare global {
  interface Window {
    google: any;
  }
}

export default function OAuthButtons() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

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
    try {
      const idToken = response.credential;
      
      // Send token to backend for verification using API instance
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save tokens
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Update auth state
        login(data.user);
        
        // Redirect to home
        navigate('/');
      } else {
        console.error('Google login failed:', data.message);
        alert('Google login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="oauth-buttons">
      <div id="google-signin-button"></div>
    
    </div>
  );
}
