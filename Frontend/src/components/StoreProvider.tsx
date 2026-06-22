import { useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '../store';
import userService from '../services/user.service';

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initialize = useAuthStore((state) => state?.initialize);
  const isAuthenticated = useAuthStore((state) => state?.isAuthenticated);
  const updateUser = useAuthStore((state) => state?.updateUser);

  useEffect(() => {
    const initializeStores = async () => {
      try {
        // Initialize auth store
        if (initialize) {
          await initialize();
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing stores:', error);
        setIsInitialized(true); // Still set to true to prevent infinite loading
      }
    };

    initializeStores();
  }, [initialize]);

  // Fetch user profile on app load if authenticated
    useEffect(() => {
        const fetchProfile = async () => {
            if (isAuthenticated && updateUser) {
                try {
                    const profile = await userService.getProfile();
                    // Ensure both profile_image and profile_picture_url are set
                    updateUser({
                        ...profile,
                        profile_image: profile.profile_image || profile.profile_picture_url,
                        profile_picture_url: profile.profile_picture_url || profile.profile_image,
                    });
                } catch (error) {
                    console.error('Failed to fetch user profile on load:', error);
                }
            }
        };

        if (isInitialized && isAuthenticated) {
            fetchProfile();
        }
    }, [isInitialized, isAuthenticated, updateUser]);

  if (!isInitialized) {
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