import { Server } from 'socket.io';
import WebSocket from 'ws';

let io;
const connectedClients = new Map();
const marketData = new Map();
const binanceStreams = new Map();
const klineRefCounts = new Map();
const depthRefCounts = new Map();

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    connectedClients.set(socket.id, { socket, subscriptions: new Set(), klineInterval: '15m' });

    socket.on('subscribe', ({ symbol, interval = '15m' }) => {
      const sym = symbol.toLowerCase();
      const clientData = connectedClients.get(socket.id);
      if (!clientData) return;

      clientData.subscriptions.add(sym);
      clientData.klineInterval = interval;

      startBinanceStream(sym);
      refCountInc(klineRefCounts, `${sym}_${interval}`, () => startBinanceKlineStream(sym, interval));
      refCountInc(depthRefCounts, sym, () => startBinanceDepthStream(sym));

      const currentData = marketData.get(sym);
      if (currentData) socket.emit('priceUpdate', currentData);
    });

    socket.on('subscribeKline', ({ symbol, interval = '15m' }) => {
      const sym = symbol.toLowerCase();
      const clientData = connectedClients.get(socket.id);
      if (!clientData) return;

      const oldInterval = clientData.klineInterval;
      if (oldInterval && oldInterval !== interval) {
        refCountDec(klineRefCounts, `${sym}_${oldInterval}`, () => stopStream(`${sym}_${oldInterval}`));
      }
      clientData.klineInterval = interval;
      refCountInc(klineRefCounts, `${sym}_${interval}`, () => startBinanceKlineStream(sym, interval));
    });

    socket.on('unsubscribe', ({ symbol, interval }) => {
      const sym = symbol.toLowerCase();
      const clientData = connectedClients.get(socket.id);
      if (!clientData) return;

      clientData.subscriptions.delete(sym);
      const iv = interval || clientData.klineInterval || '15m';

      const hasOthers = [...connectedClients.values()].some((c) => c.subscriptions.has(sym));
      if (!hasOthers) {
        stopBinanceStream(sym);
        refCountDec(depthRefCounts, sym, () => stopStream(`${sym}_depth`));
      }
      refCountDec(klineRefCounts, `${sym}_${iv}`, () => stopStream(`${sym}_${iv}`));
    });

    // Handle order placement
    socket.on('placeOrder', (orderData) => {
      console.log('Order placement request:', orderData);
      
      // In a real implementation, this would interact with your trading engine
      // For now, we'll just acknowledge the order
      socket.emit('orderPlaced', {
        orderId: `order_${Date.now()}`,
        status: 'pending',
        ...orderData
      });
    });

    // Handle order cancellation
    socket.on('cancelOrder', ({ orderId }) => {
      console.log('Order cancellation request:', orderId);
      
      socket.emit('orderCancelled', {
        orderId,
        status: 'cancelled'
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      const clientData = connectedClients.get(socket.id);
      if (clientData) {
        // Check if we need to stop any streams
        clientData.subscriptions.forEach((sym) => {
          const hasOthers = [...connectedClients.values()]
            .filter((c) => c.socket.id !== socket.id)
            .some((c) => c.subscriptions.has(sym));
          if (!hasOthers) {
            stopBinanceStream(sym);
            refCountDec(depthRefCounts, sym, () => stopStream(`${sym}_depth`));
          }
          const iv = clientData.klineInterval || '15m';
          refCountDec(klineRefCounts, `${sym}_${iv}`, () => stopStream(`${sym}_${iv}`));
        });
        
        connectedClients.delete(socket.id);
      }
    });
  });

  return io;
};

const startBinanceStream = (symbol) => {
  if (binanceStreams.has(symbol)) {
    return; // Stream already exists
  }

  // Create WebSocket connection to Binance
  const streamName = `${symbol}@ticker`;
  const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
  
  console.log(`Starting Binance stream for ${symbol}: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log(`Binance WebSocket connected for ${symbol}`);
  });

  ws.on('message', (data) => {
    try {
      const tickerData = JSON.parse(data);
      
      const priceData = {
        symbol: symbol,
        price: parseFloat(tickerData.c),
        change: parseFloat(tickerData.p),
        changePercent: parseFloat(tickerData.P),
        volume: parseFloat(tickerData.v),
        timestamp: Date.now()
      };

      // Store market data
      marketData.set(symbol, priceData);

      // Broadcast to all subscribed clients
      connectedClients.forEach((clientData) => {
        if (clientData.subscriptions.has(symbol)) {
          clientData.socket.emit('priceUpdate', priceData);
        }
      });
    } catch (error) {
      console.error('Error parsing Binance ticker data:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Binance WebSocket closed for ${symbol}`);
    binanceStreams.delete(symbol);
  });

  ws.on('error', (error) => {
    console.error(`Binance WebSocket error for ${symbol}:`, error);
    binanceStreams.delete(symbol);
  });

  binanceStreams.set(symbol, ws);
};

const refCountInc = (map, key, startFn) => {
  const count = map.get(key) || 0;
  map.set(key, count + 1);
  if (count === 0) startFn();
};

const refCountDec = (map, key, stopFn) => {
  const count = map.get(key) || 0;
  if (count <= 1) {
    map.delete(key);
    stopFn();
  } else {
    map.set(key, count - 1);
  }
};

const stopStream = (key) => {
  const ws = binanceStreams.get(key);
  if (ws) {
    ws.close();
    binanceStreams.delete(key);
  }
};

const stopBinanceStream = (symbol) => {
  const ws = binanceStreams.get(symbol);
  if (ws) {
    console.log(`Stopping Binance stream for ${symbol}`);
    ws.close();
    binanceStreams.delete(symbol);
  }
};

// Enhanced market stream for kline data
const startBinanceKlineStream = (symbol, interval = '1m') => {
  const streamKey = `${symbol}_${interval}`;
  
  if (binanceStreams.has(streamKey)) {
    return;
  }

  const streamName = `${symbol}@kline_${interval}`;
  const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
  
  console.log(`Starting Binance kline stream for ${symbol} ${interval}: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log(`Binance kline WebSocket connected for ${symbol} ${interval}`);
  });

  ws.on('message', (data) => {
    try {
      const klineData = JSON.parse(data);
      const kline = klineData.k;
      
      const candleData = {
        symbol: symbol,
        interval: interval,
        openTime: kline.t,
        closeTime: kline.T,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
        volume: parseFloat(kline.v),
        quoteVolume: parseFloat(kline.q),
        isFinal: kline.x, // true if this kline is closed
        timestamp: Date.now()
      };

      // Broadcast to all subscribed clients
      connectedClients.forEach((clientData) => {
        if (clientData.subscriptions.has(symbol)) {
          clientData.socket.emit('klineUpdate', candleData);
        }
      });
    } catch (error) {
      console.error('Error parsing Binance kline data:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Binance kline WebSocket closed for ${symbol} ${interval}`);
    binanceStreams.delete(streamKey);
  });

  ws.on('error', (error) => {
    console.error(`Binance kline WebSocket error for ${symbol} ${interval}:`, error);
    binanceStreams.delete(streamKey);
  });

  binanceStreams.set(streamKey, ws);
};

// Order book stream
const startBinanceDepthStream = (symbol) => {
  const streamKey = `${symbol}_depth`;
  
  if (binanceStreams.has(streamKey)) {
    return;
  }

  const streamName = `${symbol}@depth20@100ms`;
  const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
  
  console.log(`Starting Binance depth stream for ${symbol}: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log(`Binance depth WebSocket connected for ${symbol}`);
  });

  ws.on('message', (data) => {
    try {
      const depthData = JSON.parse(data);
      
      const orderBookData = {
        symbol: symbol,
        bids: depthData.bids.map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity)
        })),
        asks: depthData.asks.map(([price, quantity]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity)
        })),
        timestamp: Date.now()
      };

      // Broadcast to all subscribed clients
      connectedClients.forEach((clientData) => {
        if (clientData.subscriptions.has(symbol)) {
          clientData.socket.emit('depthUpdate', orderBookData);
        }
      });
    } catch (error) {
      console.error('Error parsing Binance depth data:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Binance depth WebSocket closed for ${symbol}`);
    binanceStreams.delete(streamKey);
  });

  ws.on('error', (error) => {
    console.error(`Binance depth WebSocket error for ${symbol}:`, error);
    binanceStreams.delete(streamKey);
  });

  binanceStreams.set(streamKey, ws);
};

// Get current market data
const getMarketData = (symbol) => {
  return marketData.get(symbol.toLowerCase());
};

// Broadcast message to all connected clients
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Broadcast to specific symbol subscribers
const broadcastToSymbol = (symbol, event, data) => {
  connectedClients.forEach((clientData) => {
    if (clientData.subscriptions.has(symbol.toLowerCase())) {
      clientData.socket.emit(event, data);
    }
  });
};

// Cleanup function
const cleanup = () => {
  console.log('Cleaning up WebSocket connections...');
  
  // Close all Binance streams
  binanceStreams.forEach((ws, key) => {
    console.log(`Closing stream: ${key}`);
    ws.close();
  });
  
  binanceStreams.clear();
  connectedClients.clear();
  marketData.clear();
  klineRefCounts.clear();
  depthRefCounts.clear();
};

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

export {
  initializeWebSocket,
  startBinanceStream,
  stopBinanceStream,
  startBinanceKlineStream,
  startBinanceDepthStream,
  getMarketData,
  broadcast,
  broadcastToSymbol,
  cleanup
};