import { useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '../store';

interface StoreProviderProps {
  children: ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initialize = useAuthStore((state) => state?.initialize);

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