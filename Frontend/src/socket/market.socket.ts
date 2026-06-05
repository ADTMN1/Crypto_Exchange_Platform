import { io, Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface PriceUpdatePayload {
  symbol: string;
  price: number;
  timestamp: number;
}

// Singleton connected to /market namespace
const marketSocket: Socket = io(`${BASE_URL}/market`, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  timeout: 10000,
});

marketSocket.on('connect', () => {
  console.log('📡 Market socket connected:', marketSocket.id);
});

marketSocket.on('disconnect', (reason) => {
  console.warn('📡 Market socket disconnected:', reason);
});

marketSocket.on('connect_error', (err) => {
  console.error('📡 Market socket error:', err.message);
});

marketSocket.on('stream_error', (data: { symbol: string; message: string }) => {
  console.error(`📡 Stream error [${data.symbol}]:`, data.message);
});

export default marketSocket;
