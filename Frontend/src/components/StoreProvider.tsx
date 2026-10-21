import { useEffect, useState, ReactNode, useRef } from 'react';
import { useAuthStore } from '../store';
import userService from '../services/user.service';

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const isAuthenticated = useAuthStore((state) => state?.isAuthenticated);
  const isLoading = useAuthStore((state) => state?.isLoading);
  const updateUser = useAuthStore((state) => state?.updateUser);
  const setHydrated = useAuthStore((state) => state?.setHydrated);
  const user = useAuthStore((state) => state?.user);

  const profileFetched = useRef(false);

  useEffect(() => {
    // Ensure hydration completes even if no persisted state exists
    const timeout = setTimeout(() => {
      if (setHydrated) {
        setHydrated();
      }
      setIsInitialized(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, [setHydrated]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || profileFetched.current) return;

    // Skip profile fetch if user data already exists from login or hydration
    if (user && user.id && user.email) {
      profileFetched.current = true;
      return;
    }

    const fetchProfile = async () => {
      profileFetched.current = true;
      try {
        const profile = await userService.getProfile();
        if (updateUser) {
          updateUser({
            ...profile,
            profile_image: profile.profile_image || profile.profile_picture_url,
            profile_picture_url: profile.profile_picture_url || profile.profile_image,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile on load:', error);
      }
    };

    fetchProfile();
  }, [isInitialized, isAuthenticated, updateUser, user]);

  if (!isInitialized || isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}>
        <div>
          <div style={{ marginBottom: '1rem' }}>Loading...</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            Initializing application stores
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}