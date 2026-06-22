import { createContext, useContext, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { useWalletStore } from '../../store/useWalletStore';
import type { WalletUpdateEvent } from '../../types/wallet.types';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const { updateWalletFromEvent } = useWalletStore();
  const socket = io(import.meta.env.VITE_WS_URL || 'wss://crypto-exchange-platform.onrender.com', {
    auth: {
      token: localStorage.getItem('token') || '',
    },
    transports: ['websocket', 'polling'],
  });

  useEffect(() => {
    if (socket) {
      socket.on('wallet:updated', (data: WalletUpdateEvent) => {
        updateWalletFromEvent(data);
      });
    }

    return () => {
      if (socket) {
        socket.off('wallet:updated');
        socket.disconnect();
      }
    };
  }, [socket, updateWalletFromEvent]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
