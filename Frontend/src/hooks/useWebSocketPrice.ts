import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export const useWebSocketPrice = (symbol: string) => {
  const [price, setPrice] = useState<number>(0);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io(import.meta.env.VITE_WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to WebSocket server');
      
      // Subscribe to price updates for the symbol
      socket.emit('subscribe', { symbol: symbol.toLowerCase() });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      setError(error.message);
      console.error('WebSocket connection error:', error);
    });

    // Price update handlers
    socket.on('priceUpdate', (data: PriceData) => {
      if (data.symbol.toLowerCase() === symbol.toLowerCase()) {
        setPrice(data.price);
        setPriceData(data);
      }
    });

    socket.on('klineUpdate', (data: any) => {
      if (data.symbol.toLowerCase() === symbol.toLowerCase()) {
        setPrice(parseFloat(data.close));
      }
    });

    // Error handling
    socket.on('error', (error: string) => {
      setError(error);
      console.error('WebSocket error:', error);
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.emit('unsubscribe', { symbol: symbol.toLowerCase() });
        socket.disconnect();
      }
    };
  }, [symbol]);

  // Function to manually reconnect
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  // Function to subscribe to additional symbols
  const subscribeToSymbol = (newSymbol: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe', { symbol: newSymbol.toLowerCase() });
    }
  };

  // Function to unsubscribe from symbols
  const unsubscribeFromSymbol = (symbolToUnsubscribe: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('unsubscribe', { symbol: symbolToUnsubscribe.toLowerCase() });
    }
  };
  return {
    price,
    priceData,
    isConnected,
    error,
    reconnect,
    subscribeToSymbol,
    unsubscribeFromSymbol,
  };
};
